import type { Rect } from '../core/specs';
import type { WorldAnchor } from '../interaction/anchors';
import { compileRoom, doorOpen, doorSide, DOOR_DEPTH, getRoom, WALL, type PropInstance, type RoomData, type RoomDoor, type RoomSpawn } from './room';
import { getPropSpec, propTopCm } from '../core/specs';
import { DEPTH_SCALE } from '../core/projection';
import type { NpcData } from './npc';
import { offsetNpc, offsetProp, offRect, zoneAt, type ArchetypeDef, type BuildingInfo, type CompiledFloor, type FloorDef, type RoofStyle, type ZoneInfo } from './floor';
import archetypeData from '../data/archetypes.json';

/** P6.1 building archetypes (data contract for footprint, roof, yard and the facade art id). */
export const ARCHETYPES = (archetypeData as unknown as { archetypes: Record<string, ArchetypeDef> }).archetypes;
const tempKey = (o: Record<string, unknown>): string => { let h = 2166136261; for (const c of JSON.stringify(o)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(36); };

/**
 * OUTDOOR REGIONS (P5): several exterior maps ("zones") composed into ONE continuous district — the house front
 * yard, the street, the west block… — so the player walks between them with no scene change while the camera
 * follows over the whole district (camera feel / map rules inspired by large farm-and-town maps in top-down
 * life sims; ZsRoom's own art and code).
 *
 * - Zones are existing room files placed at (x, y) offsets; local → region coordinates: (x + zone.x, y + zone.y).
 * - Shared boundaries between zones are OPEN: no wall, no cap, no threshold. Walls only exist where a zone edge
 *   meets the void, plus explicit FENCES (low walls / hedges with real collision; a gap is a gate).
 * - The void (inside the region's bounding box but outside every zone) is solid and drawn as sky/background.
 * - Doors of a zone that led to another zone of the region are dropped (you just walk there). Doors to other
 *   maps (house, shops, distant districts) keep their targets: on the region's outer edge they keep a doorway
 *   gap + stopper exactly like a plain room; north doors stay recesses in the zone's back wall.
 * - A zone's back wall (building row / house facade) is drawn only where no other zone lies directly north of it.
 */
export function compileRegion(f: FloorDef, flags: Record<string, boolean> = {}, variant?: string | null): CompiledFloor {
  const members = new Set(f.zones.map((z) => z.room));
  const zones: ZoneInfo[] = f.zones.map((z) => {
    const raw = getRoom(z.room, variant);
    const data: RoomData = { ...raw, doors: raw.doors.filter((d) => !members.has(d.to.room)) };
    return { id: z.room, x: z.x, y: z.y ?? 0, w: data.sizeCm.w, h: data.sizeCm.h, data, prefix: z.room === f.primary ? '' : `${z.room}/` };
  });
  // back-wall gaps: ranges of a zone's north edge that continue into a zone directly north of it
  for (const z of zones) {
    z.wallGaps = zones.filter((n) => n !== z && n.y + n.h === z.y)
      .map((n) => [Math.max(n.x, z.x) - z.x, Math.min(n.x + n.w, z.x + z.w) - z.x] as [number, number]).filter(([a, b]) => b > a);
  }
  const x0 = Math.min(...zones.map((z) => z.x)), y0 = Math.min(...zones.map((z) => z.y));
  const x1 = Math.max(...zones.map((z) => z.x + z.w)), y1 = Math.max(...zones.map((z) => z.y + z.h));

  let solids: Rect[] = [];
  const props: PropInstance[] = [], anchors: WorldAnchor[] = [], doors: RoomDoor[] = [], npcs: NpcData[] = [];
  const spawns: Record<string, RoomSpawn> = {};
  let wallH = 0;
  for (const z of zones) {
    const c = compileRoom(z.data, flags);
    wallH = Math.max(wallH, z.data.wallHeightCm);
    // keep the zone's prop collisions; its implicit boundary walls/stoppers (outside the zone) are rebuilt below
    for (const s of c.solids) {
      const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
      if (cx >= 0 && cx <= z.w && cy >= 0 && cy <= z.h) solids.push(offRect(s, z.x, z.y));
    }
    for (const p of c.props) props.push(offsetProp(p, z.x, z.prefix, z.id, z.y));
    for (const a of c.anchors) anchors.push({ ...a, key: a.kind === 'door' ? a.key : z.prefix + a.key, ownerId: a.kind === 'door' ? a.ownerId : z.prefix + a.ownerId, x: a.x + z.x, y: a.y + z.y });
    for (const d of z.data.doors) doors.push({ ...d, side: doorSide(d, z.data.sizeCm), x: d.x + z.x, y: d.y + z.y, zone: { x: z.x, y: z.y, w: z.w, h: z.h } } as RoomDoor);
    for (const n of z.data.npcs ?? []) npcs.push(offsetNpc(n, z.x, z.y));
    for (const [name, sp] of Object.entries(z.data.spawns)) spawns[`${z.id}.${name}`] = { ...sp, x: sp.x + z.x, y: sp.y + z.y };
  }

  // ---- P6 towns: region-level props and free-standing buildings (authored in region coordinates)
  const buildings: BuildingInfo[] = [];
  const zoneOf = (x: number, y: number) => zoneAt(zones, x, y)?.id ?? f.id;
  if (f.props?.length) {
    const c = compileRoom({ id: `${f.id}/town`, displayName: f.displayName, world: f.world, floor: 'ground', sizeCm: { w: x1, h: y1 }, wallHeightCm: 0, palette: zones[0]!.data.palette, spawns: {}, props: f.props, doors: [] }, flags);
    for (const s of c.solids) { const cx = s.x + s.w / 2, cy = s.y + s.h / 2; if (cx >= 0 && cx <= x1 && cy >= 0 && cy <= y1) solids.push(s); }
    for (const p of c.props) props.push(offsetProp(p, 0, 'town/', zoneOf(p.x, p.y)));
    for (const a of c.anchors) anchors.push({ ...a, key: 'town/' + a.key, ownerId: 'town/' + a.ownerId });
  }
  const fences = [...(f.fences ?? [])];
  for (const b0 of f.buildings ?? []) {
    // archetype defaults (P6.1), then per-building overrides
    const arch = b0.archetype ? ARCHETYPES[b0.archetype] : undefined;
    if (b0.archetype && !arch) throw new Error(`${f.id}: building ${b0.id} names unknown archetype ${b0.archetype}`);
    const b = { ...b0, facade: b0.facade ?? arch?.facade, depth: b0.depth ?? arch?.depth, roof: b0.roof ?? arch?.roof?.color, roofStyle: b0.roofStyle ?? arch?.roof?.style ?? 'tile', yard: b0.yard ?? arch?.yard };
    if (!b.facade || !b.depth) throw new Error(`${f.id}: building ${b.id} needs a facade and depth (or an archetype)`);
    const base = getPropSpec(b.facade);
    const spec = b.temp && base.temp ? { ...base, id: `${base.id}~${tempKey(b.temp)}`, temp: { ...base.temp, ...b.temp } } : base;
    const w = spec.footprint.widthCm, H = propTopCm(spec), K = DEPTH_SCALE;
    const key = `bld:${b.id}`, zone = zoneOf(b.x, b.y + 20), x0 = b.x - w / 2;
    const footprint = { x: x0, y: b.y - b.depth, w, h: b.depth };
    props.push({
      key, spec, x: b.x, y: b.y, z: 0, layer: 'wall', zone, zoneKey: b.id, ...(b.inspect ? { inspect: b.inspect } : {}),
      // sorts by its front line; occludes (fades) when Zila walks behind it; render bounds cover facade + roof
      sortable: { id: key, pivotY: b.y, footprint, renderBounds: { x: x0, y: (b.y - b.depth) * K - H, w, h: H + b.depth * K }, occluder: true },
    });
    solids.push(footprint);
    buildings.push({ key, id: b.id, x0, x1: x0 + w, front: b.y, depth: b.depth, height: H, roof: b.roof ?? '#9C5B4A', roofStyle: b.roofStyle as RoofStyle, zone, ...(b.archetype ? { archetype: b.archetype } : {}) });
    if (b.yard) {                                       // fenced front yard with a gate gap in front of the door
      const yd = b.yard.depth, gate = b.yard.gate ?? 120, dx = b.door?.dx ?? 0, gx0 = b.x + dx - gate / 2, gx1 = b.x + dx + gate / 2, fy = b.y + yd;
      fences.push({ x: x0, y: fy - 15, w: gx0 - x0, h: 15, height: 90 }, { x: gx1, y: fy - 15, w: x0 + w - gx1, h: 15, height: 90 },
        { x: x0, y: b.y, w: 15, h: yd - 15, height: 90 }, { x: x0 + w - 15, y: b.y, w: 15, h: yd - 15, height: 90 });
    }
    if (b.inspect) anchors.push({ key: `${key}:inspect`, ownerId: key, label: b.inspect.name, x: b.x, y: b.y + 40, radiusCm: Math.min(120, w / 2), kind: 'prop', payload: { anchorId: 'inspect', action: { type: 'inspect', name: b.inspect.name, comment: b.inspect.comment } } });
    if (b.talk) anchors.push({ key: `${key}:talk`, ownerId: key, label: b.talk.label, x: b.x, y: b.y + 45, radiusCm: Math.min(80, w / 2), kind: 'prop',
      payload: { anchorId: 'talk', action: b.talk.event ? { type: 'event', id: b.talk.event } : { type: 'dialogue', id: b.talk.dialogue } } });
    if (b.door) {
      const dw = b.door.w ?? 110, dx = b.door.dx ?? 0;
      const d: RoomDoor = { id: b.door.id, label: b.door.label, side: 'north', style: 'none', x: b.x + dx - dw / 2, y: b.y, w: dw, h: 10, to: b.door.to, ...(b.door.locked ? { locked: b.door.locked } : {}), zone: { x: x0, y: b.y, w, h: 0 } };
      doors.push(d);
      anchors.push({ key: `door:${d.id}`, ownerId: d.id, label: d.label, x: b.x + dx, y: b.y + 25, radiusCm: 50, kind: 'door', payload: doorOpen(d, flags) ? d.to : { locked: d.locked!.message } });
    }
  }

  // ---- P6.1 crowds: ambient people from a few looks and routes, present per time of day
  for (const c of f.crowds ?? []) {
    const max = Math.max(0, ...Object.values(c.count).map((v) => v ?? 0));
    for (let k = 0; k < max; k++) {
      const route = c.routes[k % c.routes.length]!, look = c.looks[k % c.looks.length]!;
      const schedule = Object.fromEntries((['morning', 'afternoon', 'evening', 'night'] as const).map((ph) => [ph, k < (c.count[ph] ?? 0) ? undefined : 'away'] as const).filter(([, v]) => v)) as NpcData['schedule'];
      const start = Math.floor((k / Math.max(1, Math.ceil(max / c.routes.length))) * route.length) % route.length;
      const p0 = route[start]!;
      npcs.push({
        id: `${c.id}_${k}`, name: c.name, look, x: p0.x, y: p0.y, facing: p0.face ?? 'S',
        behaviour: route.length === 1 ? { type: 'idle', act: p0.act ?? 'standing' } : { type: 'route', points: route, speed: c.speed, start },
        ...(schedule && Object.keys(schedule).length ? { schedule } : {}),
        ...(c.interact && k % (c.talkEvery ?? 1) === 0 ? { interact: c.interact } : {}),
      });
    }
  }

  // the void and a frame around the bounding box are solid
  const boundary: Rect[] = [...voidRects(zones, x0, y0, x1, y1),
    { x: x0 - WALL, y: y0 - WALL, w: x1 - x0 + 2 * WALL, h: WALL }, { x: x0 - WALL, y: y1, w: x1 - x0 + 2 * WALL, h: WALL },
    { x: x0 - WALL, y: y0, w: WALL, h: y1 - y0 }, { x: x1, y: y0, w: WALL, h: y1 - y0 }];
  // doorways to other maps on the outer edge: a threshold gap cut through the boundary, ending in a stopper
  let cut = boundary;
  for (const d of doors) {
    const side = d.side!, z = d.zone!;
    if (side === 'north' || !doorOpen(d, flags)) continue;
    const zy = z.y ?? 0;
    const [hole, stop] = side === 'south' ? [{ x: d.x, y: zy + z.h, w: d.w, h: DOOR_DEPTH }, { x: d.x, y: zy + z.h + DOOR_DEPTH, w: d.w, h: WALL }]
      : side === 'west' ? [{ x: z.x - DOOR_DEPTH, y: d.y, w: DOOR_DEPTH, h: d.h }, { x: z.x - DOOR_DEPTH - WALL, y: d.y, w: WALL, h: d.h }]
      : [{ x: z.x + z.w, y: d.y, w: DOOR_DEPTH, h: d.h }, { x: z.x + z.w + DOOR_DEPTH, y: d.y, w: WALL, h: d.h }];
    cut = cut.flatMap((r) => subtractRect(r, hole));
    cut.push(stop);
  }
  solids = [...solids, ...cut, ...fences.map((q) => ({ x: q.x, y: q.y, w: q.w, h: q.h }))];

  const primary = zones.find((z) => z.id === f.primary) ?? zones[0]!;
  spawns.default = spawns[`${primary.id}.default`]!;
  const pd = primary.data;
  const data: RoomData = {
    id: f.id, displayName: f.displayName, world: f.world, floor: pd.floor, kind: 'exterior', provisional: f.provisional, ambience: pd.ambience,
    sizeCm: { w: x1, h: y1 }, wallHeightCm: wallH, palette: pd.palette, shell: pd.shell,
    spawns, props: [], doors, npcs,
  };
  return { data, solids, props, anchors, zones, bbox: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, fences, ...(f.ground ? { ground: f.ground, buildings } : {}) };
}

/** Cells of the bounding box not covered by any zone (coordinate-compressed grid, merged along rows). */
export function voidRects(zones: { x: number; y: number; w: number; h: number }[], x0: number, y0: number, x1: number, y1: number): Rect[] {
  const xs = [...new Set([x0, x1, ...zones.flatMap((z) => [z.x, z.x + z.w])])].sort((a, b) => a - b);
  const ys = [...new Set([y0, y1, ...zones.flatMap((z) => [z.y, z.y + z.h])])].sort((a, b) => a - b);
  const out: Rect[] = [];
  for (let j = 0; j < ys.length - 1; j++) {
    let run: Rect | null = null;
    for (let i = 0; i < xs.length - 1; i++) {
      const cx = (xs[i]! + xs[i + 1]!) / 2, cy = (ys[j]! + ys[j + 1]!) / 2;
      const covered = zones.some((z) => cx > z.x && cx < z.x + z.w && cy > z.y && cy < z.y + z.h);
      if (!covered) {
        if (run && run.x + run.w === xs[i]) run.w = xs[i + 1]! - run.x;
        else { run = { x: xs[i]!, y: ys[j]!, w: xs[i + 1]! - xs[i]!, h: ys[j + 1]! - ys[j]! }; out.push(run); }
      } else run = null;
    }
  }
  return out;
}

/** r minus hole, as up to four rectangles. */
export function subtractRect(r: Rect, hole: Rect): Rect[] {
  const ix0 = Math.max(r.x, hole.x), iy0 = Math.max(r.y, hole.y), ix1 = Math.min(r.x + r.w, hole.x + hole.w), iy1 = Math.min(r.y + r.h, hole.y + hole.h);
  if (ix0 >= ix1 || iy0 >= iy1) return [r];
  const out: Rect[] = [];
  if (iy0 > r.y) out.push({ x: r.x, y: r.y, w: r.w, h: iy0 - r.y });
  if (iy1 < r.y + r.h) out.push({ x: r.x, y: iy1, w: r.w, h: r.y + r.h - iy1 });
  if (ix0 > r.x) out.push({ x: r.x, y: iy0, w: ix0 - r.x, h: iy1 - iy0 });
  if (ix1 < r.x + r.w) out.push({ x: ix1, y: iy0, w: r.x + r.w - ix1, h: iy1 - iy0 });
  return out;
}
