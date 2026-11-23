import type { Rect } from '../core/specs';
import { DEPTH_SCALE } from '../core/projection';
import { WalkGrid } from './pathfinding';
import type { CompiledFloor, FloorDef, GroundLayerDef } from './floor';

/**
 * Authoring-time geometry audit for outdoor town regions (P6.1). Pure function over the region definition and its
 * compiled form, so the same code runs in unit tests, in `npm run audit:geometry` and in review tooling.
 *
 * Findings are FAIL (must be fixed before shipping), WARN (needs a decision) or OK (intentional, recorded so a
 * reviewer can see what was accepted and why).
 */
export type Severity = 'FAIL' | 'WARN' | 'OK';
export interface Finding { severity: Severity; check: string; detail: string; areaM2?: number }

import { drawOrder, GROUND_RANK, groundClass, type GroundClass } from './ground';
export { drawOrder, GROUND_RANK, groundClass, type GroundClass };

export const overlap = (a: Rect, b: Rect): Rect | null => {
  const x0 = Math.max(a.x, b.x), y0 = Math.max(a.y, b.y), x1 = Math.min(a.x + a.w, b.x + b.w), y1 = Math.min(a.y + a.h, b.y + b.h);
  return x1 > x0 && y1 > y0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
};
const contains = (a: Rect, b: Rect) => b.x >= a.x && b.y >= a.y && b.x + b.w <= a.x + a.w && b.y + b.h <= a.y + a.h;
const touches = (a: Rect, b: Rect, eps = 1) => a.x <= b.x + b.w + eps && b.x <= a.x + a.w + eps && a.y <= b.y + b.h + eps && b.y <= a.y + a.h + eps;
const m2 = (r: Rect) => Math.round((r.w * r.h) / 1000) / 10;   // cm² → m², 0.1 precision
const name = (l: GroundLayerDef, i: number) => `ground[${i}] ${groundClass(l)} (${l.x},${l.y} ${l.w}×${l.h})`;

export function auditRegion(def: FloorDef, town: CompiledFloor, radiusCm: number): Finding[] {
  const out: Finding[] = [];
  const ground = def.ground ?? [];
  const paved = ground.map((l, i) => ({ l, i, c: groundClass(l) })).filter((q) => !q.l.base && q.c !== 'grass');

  // 1. ground overlaps by material and drawing precedence
  for (let a = 0; a < paved.length; a++) for (let b = a + 1; b < paved.length; b++) {
    const A = paved[a]!, B = paved[b]!, o = overlap(A.l, B.l);
    if (!o) continue;
    const pair = `${name(A.l, A.i)} × ${name(B.l, B.i)}`;
    if (A.c === B.c) {
      if (A.c === 'road') out.push({ severity: 'WARN', check: 'road-road overlap', detail: `${pair}: two road layers overlap; use abutting segments with a junction`, areaM2: m2(o) });
      else out.push({ severity: 'OK', check: 'same-material join', detail: `${pair}: same material joins (drawn once where covered)`, areaM2: m2(o) });
      continue;
    }
    const hi = GROUND_RANK[A.c] > GROUND_RANK[B.c] ? A : B, lo = hi === A ? B : A;
    if (contains(lo.l, hi.l)) out.push({ severity: 'OK', check: 'shared right-of-way', detail: `${name(hi.l, hi.i)} lies inside ${name(lo.l, lo.i)} and draws above it by rank`, areaM2: m2(o) });
    else out.push({ severity: 'OK', check: 'junction', detail: `${pair}: crossing resolved by rank — ${hi.c} draws over ${lo.c}; markings stop at the junction`, areaM2: m2(o) });
  }
  // 2. paved network connectivity (every paved strip touches another paved strip)
  for (const p of paved) if (!paved.some((q) => q !== p && touches(p.l, q.l))) out.push({ severity: 'WARN', check: 'isolated paving', detail: `${name(p.l, p.i)} touches no other path or road` });

  // 3. buildings vs paths, roads, each other and fences
  const blds = (def.buildings ?? []).map((b) => ({ b, r: town.buildings!.find((q) => q.id === b.id)! })).map(({ b, r }) => ({ id: b.id, fp: { x: r.x0, y: r.front - r.depth, w: r.x1 - r.x0, h: r.depth }, r, b }));
  for (const B of blds) {
    for (const p of paved) {
      const o = overlap(B.fp, p.l);
      if (o && p.c !== 'plaza') out.push({ severity: 'FAIL', check: 'building on a path/road', detail: `${B.id} footprint (${B.fp.x},${B.fp.y} ${B.fp.w}×${B.fp.h}) intersects ${name(p.l, p.i)}`, areaM2: m2(o) });
    }
    for (const C of blds) if (C.id > B.id) { const o = overlap(B.fp, C.fp); if (o) out.push({ severity: 'FAIL', check: 'building overlap', detail: `${B.id} × ${C.id}`, areaM2: m2(o) }); }
    for (const f of town.fences ?? []) { const o = overlap(B.fp, f); if (o && o.w * o.h > 400) out.push({ severity: 'WARN', check: 'fence inside building', detail: `${B.id} footprint contains part of a fence at (${f.x},${f.y})`, areaM2: m2(o) }); }
    // 4. roof/facade cover at eye level: ground hidden behind a building (back edge to back − height/K) that is a path
    const hidden: Rect = { x: B.fp.x, y: B.fp.y - B.r.height / DEPTH_SCALE, w: B.fp.w, h: B.r.height / DEPTH_SCALE };
    for (const p of paved) {
      const o = overlap(hidden, p.l);
      if (o && o.w * o.h > 1.5e4 && p.c !== 'road') out.push({ severity: 'WARN', check: 'roof hides a path', detail: `${B.id} (h ${B.r.height} cm) visually covers ${name(p.l, p.i)} behind it; the building fades when Zila walks there`, areaM2: m2(o) });
    }
  }
  // 5. fences across paths (a fence on a lane blocks a route; gates are gaps between fence pieces)
  for (const f of town.fences ?? []) for (const p of paved) {
    const o = overlap(f, p.l);
    if (o && Math.min(o.w, o.h) >= 10 && Math.max(o.w, o.h) >= 60) out.push({ severity: 'FAIL', check: 'fence across a path', detail: `fence (${f.x},${f.y} ${f.w}×${f.h}) blocks ${name(p.l, p.i)}`, areaM2: m2(o) });
  }
  // 6. spawns standable; doors, interactions reachable from the garden; doors open onto walkable ground
  const grid = new WalkGrid(town.data.sizeCm.w, town.data.sizeCm.h, town.solids, radiusCm, 16);
  const start = town.data.spawns['front_yard.default'] ?? town.data.spawns.default!;
  for (const [k, s] of Object.entries(town.data.spawns)) {
    if (!grid.standable(s)) out.push({ severity: 'FAIL', check: 'spawn not standable', detail: `${k} at (${s.x},${s.y})` });
    else if (!grid.findPath(start, s)) out.push({ severity: 'FAIL', check: 'spawn unreachable', detail: k });
  }
  for (const a of town.anchors) {
    const p = grid.findPath(start, a), end = p?.at(-1);
    if (!p || !end || Math.hypot(end.x - a.x, end.y - a.y) > a.radiusCm) out.push({ severity: 'FAIL', check: 'interaction unreachable', detail: `${a.key} at (${Math.round(a.x)},${Math.round(a.y)})` });
  }
  for (const d of town.data.doors) {
    if (d.side !== 'north' || !d.zone) continue;
    const front = { x: d.x + d.w / 2, y: d.y + 40 };
    const onPaved = paved.some((p) => front.x >= p.l.x && front.x <= p.l.x + p.l.w && front.y >= p.l.y && front.y <= p.l.y + p.l.h);
    if (!onPaved) out.push({ severity: 'WARN', check: 'door without a path', detail: `${d.id}: the ground in front of the door is not a path, pavement or plaza` });
  }
  return out;
}

export function auditReport(findings: Finding[], title: string): string {
  const count = (s: Severity) => findings.filter((f) => f.severity === s).length;
  const rows = findings.map((f) => `| ${f.severity} | ${f.check} | ${f.detail.replace(/\|/g, '/')} | ${f.areaM2 ?? ''} |`).join('\n');
  return `# Geometry audit — ${title}\n\n**FAIL ${count('FAIL')} · WARN ${count('WARN')} · OK ${count('OK')}**\n\n| Severity | Check | Detail | Area (m²) |\n|---|---|---|---|\n${rows}\n`;
}
