import * as Phaser from 'phaser';
import { DEPTH_SCALE as K } from '../core/projection';
import type { PropSpec, TempArtSpec } from '../core/specs';

/**
 * TEMPORARY ARTWORK — engine-drawn stand-ins for assets whose final illustration is not approved yet.
 *
 * Each placeholder is rasterised ONCE into a texture with exactly the asset's spec canvas and pivot, so
 * it uses the same render path, layout, depth and collision as the final art, and costs one sprite.
 * Shapes follow the spec geometry (footprint, heights, ×0.7 depth, 2 px/cm) and the Art Bible palette.
 * They are always reported as TEMP in the HUD and are never presented as artwork.
 */

type Ctx = CanvasRenderingContext2D;
const LINE = 'rgba(58,37,48,0.55)';

export function tempTextureKey(id: string): string { return `temp:${id}`; }

export function ensureTempTexture(scene: Phaser.Scene, spec: PropSpec): string | null {
  const key = tempTextureKey(spec.id);
  if (scene.textures.exists(key)) return key;
  const t = spec.temp;
  if (!t) return null;
  const tex = scene.textures.createCanvas(key, spec.canvas.width, spec.canvas.height);
  if (!tex) return null;
  const ctx = tex.getContext();
  const g = geom(spec);
  const draw = SHAPES[t.shape];
  if (!draw) return null;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  draw(ctx, g, t);
  tex.refresh();
  return key;
}

interface Geom {
  px: number; py: number; d: number;
  w: number; dp: number;              // footprint cm
  L: number; R: number;               // footprint left/right (px)
  back: number;                       // floor back edge y (px)
  h: Record<string, number>;          // heights cm
  zy: (z: number) => number;          // front-edge y at height z
  by: (z: number) => number;          // back-edge y at height z
  spec: PropSpec;
}

function geom(spec: PropSpec): Geom {
  const d = spec.density, px = spec.pivot.x, py = spec.pivot.y;
  const w = spec.footprint.widthCm, dp = spec.footprint.depthCm;
  const back = py - dp * K * d;
  return { px, py, d, w, dp, L: px - (w / 2) * d, R: px + (w / 2) * d, back, h: spec.heightsCm, zy: (z) => py - z * d, by: (z) => back - z * d, spec };
}

// ---------- colour & path helpers ----------
/** Parse '#RRGGBB' or 'rgb(a)(r,g,b[,a])' — derived colours are passed back into tone()/paint(). */
export function parseColor(c: string): [number, number, number] {
  const m = /^rgba?\(([^)]+)\)/.exec(c.trim());
  if (m) { const [r, g, b] = m[1]!.split(',').map((v) => Number(v.trim())); return [r ?? 0, g ?? 0, b ?? 0]; }
  const n = parseInt(c.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const hex = parseColor;
function tone(c: string, f: number, a = 1): string {
  const [r, g, b] = hex(c);
  const m = (v: number) => Math.round(f >= 1 ? v + (255 - v) * (f - 1) : v * f);
  return `rgba(${m(r)},${m(g)},${m(b)},${a})`;
}
function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const k = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k);
  ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k);
  ctx.arcTo(x, y, x + w, y, k);
  ctx.closePath();
}
/** Fill with an upper-left-lit gradient and a soft coloured outline. */
function paint(ctx: Ctx, base: string, x0: number, y0: number, x1: number, y1: number, light = 1.12, dark = 0.86, outline = true): void {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, tone(base, light));
  g.addColorStop(1, tone(base, dark));
  ctx.fillStyle = g;
  ctx.fill();
  if (outline) { ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.stroke(); }
}
function box(ctx: Ctx, g: Geom, x0: number, x1: number, zb: number, zt: number, topC: string, frontC: string, r = 4, depthPx?: number): void {
  const dpx = depthPx ?? g.py - g.back;
  // top face
  rr(ctx, x0, g.zy(zt) - dpx, x1 - x0, dpx, r);
  paint(ctx, topC, x0, g.zy(zt) - dpx, x1, g.zy(zt), 1.18, 0.96);
  // front face
  rr(ctx, x0, g.zy(zt), x1 - x0, (zt - zb) * g.d, r);
  paint(ctx, frontC, x0, g.zy(zt), x1, g.zy(zb), 1.04, 0.8);
}
function knob(ctx: Ctx, x: number, y: number, r: number, c = '#D9B48A'): void {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  const gr = ctx.createRadialGradient(x - r / 3, y - r / 3, 0, x, y, r);
  gr.addColorStop(0, tone(c, 1.3)); gr.addColorStop(1, tone(c, 0.75));
  ctx.fillStyle = gr; ctx.fill();
}
function leg(ctx: Ctx, x: number, yTop: number, yBot: number, wPx: number, c: string): void {
  rr(ctx, x - wPx / 2, yTop, wPx, yBot - yTop, wPx / 2.5);
  paint(ctx, c, x - wPx / 2, yTop, x + wPx / 2, yBot, 1.05, 0.7);
}
function ellipse(ctx: Ctx, cx: number, cy: number, rx: number, ry: number): void {
  ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
}
/** Vertical cylinder (stool cushion, pouf, pot): side band + top ellipse. */
function cylinder(ctx: Ctx, cx: number, yBot: number, yTop: number, rx: number, side: string, top: string, rTopX = rx): void {
  const ryB = rx * K, ryT = rTopX * K;
  ctx.beginPath();
  ctx.moveTo(cx - rTopX, yTop);
  ctx.lineTo(cx - rx, yBot);
  ctx.ellipse(cx, yBot, rx, ryB, 0, Math.PI, 0, true);
  ctx.lineTo(cx + rTopX, yTop);
  ctx.closePath();
  paint(ctx, side, cx - rx, yTop, cx + rx, yBot, 1.1, 0.78);
  ellipse(ctx, cx, yTop, rTopX, ryT);
  paint(ctx, top, cx - rTopX, yTop - ryT, cx + rTopX, yTop + ryT, 1.2, 0.95);
}

// ---------- shapes ----------
const SHAPES: Record<string, (ctx: Ctx, g: Geom, t: TempArtSpec) => void> = {
  table(ctx, g, t) {
    const wood = String(t.wood ?? '#8A5A3C'), topC = String(t.top ?? wood), top = g.h.top ?? 75, d = g.d;
    const slab = 4, legW = 5 * d, inset = 3 * d;
    // mirror (vanity) at the back
    if (t.mirror && g.h.mirrorTop) {
      const mw = (g.w * 0.62) * d, mx = g.px - mw / 2, y0 = g.by(g.h.mirrorTop), y1 = g.by(top) + 2;
      rr(ctx, mx, y0, mw, y1 - y0, mw / 2.2); paint(ctx, String(t.accent ?? '#E8A0B4'), mx, y0, mx + mw, y1, 1.15, 0.85);
      rr(ctx, mx + 4 * d, y0 + 4 * d, mw - 8 * d, y1 - y0 - 6 * d, mw / 2.6);
      const gl = ctx.createLinearGradient(mx, y0, mx + mw, y1);
      gl.addColorStop(0, '#EAF2FA'); gl.addColorStop(0.45, '#BFD3E6'); gl.addColorStop(1, '#9DB4D6');
      ctx.fillStyle = gl; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(mx + mw * 0.3, y0 + 14 * d); ctx.lineTo(mx + mw * 0.18, y0 + 30 * d); ctx.stroke();
      // bulbs around the mirror like the original room's vanity
      for (let i = 0; i < 6; i++) { const a = Math.PI * (0.15 + 0.7 * (i / 5)); knob(ctx, g.px - Math.cos(a) * mw * 0.52, y0 + (y1 - y0) * 0.5 - Math.sin(a) * (y1 - y0) * 0.55, 2.4 * d / 2, '#FFE9B8'); }
    }
    // back legs, then body
    leg(ctx, g.L + inset, g.by(top - slab), g.back, legW, tone(wood, 0.8));
    leg(ctx, g.R - inset, g.by(top - slab), g.back, legW, tone(wood, 0.8));
    leg(ctx, g.L + inset, g.zy(top - slab), g.py, legW, wood);
    leg(ctx, g.R - inset, g.zy(top - slab), g.py, legW, wood);
    const drawers = Number(t.drawers ?? 0);
    if (drawers > 0) {
      const dw = g.w * 0.38 * d, x1 = g.R - inset * 0.5, x0 = x1 - dw, zb = Math.max(8, top - slab - drawers * 16);
      box(ctx, g, x0, x1, zb, top - slab, wood, tone(wood, 1.02), 3);
      for (let i = 0; i < drawers; i++) {
        const yT = g.zy(top - slab - i * 16) + 3, yB = g.zy(top - slab - (i + 1) * 16) - 3;
        ctx.strokeStyle = LINE; ctx.lineWidth = 1.5; rr(ctx, x0 + 4, yT, dw - 8, yB - yT, 3); ctx.stroke();
        knob(ctx, (x0 + x1) / 2, (yT + yB) / 2, 2.6);
      }
    }
    box(ctx, g, g.L - 2, g.R + 2, top - slab, top, topC, tone(topC, 0.92), 5, g.py - g.back);
    if (t.laptop) {
      const lw = 30 * d, lx = g.px + 6 * d, ly = g.zy(top) - (g.py - g.back) * 0.55;
      rr(ctx, lx, ly, lw, 9 * d, 3); paint(ctx, '#D9D4DE', lx, ly, lx + lw, ly + 9 * d, 1.1, 0.9);
      rr(ctx, lx + 1 * d, ly - 19 * d, lw - 2 * d, 19 * d, 3); paint(ctx, '#C9C3D2', lx, ly - 19 * d, lx + lw, ly, 1.05, 0.85);
      rr(ctx, lx + 3 * d, ly - 17 * d, lw - 6 * d, 15 * d, 2); ctx.fillStyle = '#3A3550'; ctx.fill();
      ctx.fillStyle = 'rgba(255,190,210,0.9)'; ctx.font = `${7 * d}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('♥', lx + lw / 2, ly - 6.5 * d);
      // a small mug
      cylinder(ctx, g.L + 22 * d, g.zy(top) - (g.py - g.back) * 0.45, g.zy(top) - (g.py - g.back) * 0.45 - 10 * d, 4 * d, '#F6EBDD', '#8A5A3C');
    }
    if (t.accent && !t.mirror) { ctx.fillStyle = tone(String(t.accent), 1, 0.9); ctx.fillRect(g.L, g.zy(top - slab) - 2, g.R - g.L, 2); }
  },

  chair(ctx, g, t) {
    const wood = String(t.wood ?? '#8A5A3C'), cushion = String(t.cushion ?? '#E8A0B4'), seat = g.h.seat ?? 45, back = g.h.top ?? 90, d = g.d;
    const inset = 3 * d, legW = 4 * d;
    leg(ctx, g.L + inset, g.by(seat - 4), g.back, legW, tone(wood, 0.8));
    leg(ctx, g.R - inset, g.by(seat - 4), g.back, legW, tone(wood, 0.8));
    leg(ctx, g.L + inset, g.zy(seat - 4), g.py, legW, wood);
    leg(ctx, g.R - inset, g.zy(seat - 4), g.py, legW, wood);
    box(ctx, g, g.L, g.R, seat - 4, seat, cushion, tone(cushion, 0.9), 6);
    // backrest along the front (south) edge: the chair faces north, toward the desk
    const y0 = g.zy(back), y1 = g.zy(seat - 2);
    leg(ctx, g.L + inset, y0 + 4 * d, y1, legW, wood); leg(ctx, g.R - inset, y0 + 4 * d, y1, legW, wood);
    rr(ctx, g.L + 2 * d, y0, g.R - g.L - 4 * d, 16 * d, 6 * d); paint(ctx, wood, g.L, y0, g.R, y0 + 16 * d, 1.15, 0.85);
    rr(ctx, g.L + 6 * d, y0 + 3 * d, g.R - g.L - 12 * d, 10 * d, 4 * d); paint(ctx, cushion, g.L, y0, g.R, y0 + 13 * d, 1.1, 0.9, false);
  },

  cabinet(ctx, g, t) {
    const wood = String(t.wood ?? '#8A5A3C'), topC = String(t.top ?? wood), top = g.h.top ?? 200, d = g.d;
    leg(ctx, g.L + 6 * d, g.zy(8), g.py, 6 * d, tone(wood, 0.8)); leg(ctx, g.R - 6 * d, g.zy(8), g.py, 6 * d, tone(wood, 0.8));
    box(ctx, g, g.L, g.R, 6, top, topC, wood, 5);
    // crown + plinth
    ctx.fillStyle = tone(wood, 0.72); ctx.fillRect(g.L, g.zy(top) , g.R - g.L, 3 * d); ctx.fillRect(g.L, g.zy(10), g.R - g.L, 3 * d);
    const doors = Number(t.doors ?? 2), x0 = g.L + 4 * d, x1 = g.R - 4 * d, dw = (x1 - x0) / doors, yT = g.zy(top) + 6 * d, yB = g.zy(12);
    for (let i = 0; i < doors; i++) {
      const dx = x0 + i * dw;
      rr(ctx, dx + 2, yT, dw - 4, yB - yT, 4); paint(ctx, wood, dx, yT, dx + dw, yB, 1.12, 0.84);
      rr(ctx, dx + 7 * d, yT + 9 * d, dw - 14 * d, (yB - yT) * 0.42, 5);
      ctx.fillStyle = tone(String(t.accent ?? '#F4C7D3'), 1, 0.85); ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 1.5; ctx.stroke();
      rr(ctx, dx + 7 * d, yT + (yB - yT) * 0.55, dw - 14 * d, (yB - yT) * 0.36, 5); ctx.strokeStyle = tone(wood, 0.65); ctx.stroke();
      knob(ctx, i === 0 ? dx + dw - 6 * d : dx + 6 * d, (yT + yB) / 2, 3.2);
    }
  },

  round(ctx, g, t) {
    const body = String(t.body ?? '#E8A0B4'), topC = String(t.top ?? body), seat = g.h.seat ?? g.h.top ?? 45, d = g.d;
    const cx = g.px, rx = (g.w / 2) * d, cyFloor = g.py - (g.py - g.back) / 2;
    if (t.legs) {
      const lc = String(t.legs);
      for (const dx of [-0.55, 0.55]) leg(ctx, cx + dx * rx, g.zy(seat - 10) - (g.py - g.back) / 2 - 2 * d, cyFloor - 3 * d, 3.5 * d, tone(lc, 0.8));
      for (const dx of [-0.75, 0.75]) leg(ctx, cx + dx * rx, g.zy(seat - 10) - (g.py - g.back) / 2, g.py - 4 * d, 3.5 * d, lc);
      cylinder(ctx, cx, cyFloor - (seat - 12) * d, cyFloor - seat * d, rx, body, topC, rx * 0.96);
    } else {
      cylinder(ctx, cx, cyFloor, cyFloor - seat * d, rx, body, topC, rx * 0.92);
      // tufting
      ctx.fillStyle = tone(body, 0.8);
      for (const [ox, oy] of [[0, 0], [-0.45, 0.1], [0.45, 0.1], [0, -0.4], [0, 0.42]] as const) { ellipse(ctx, cx + ox * rx * 0.7, cyFloor - seat * d + oy * rx * K * 0.7, 2.2, 1.6); ctx.fill(); }
    }
  },

  plant(ctx, g, t) {
    const pot = String(t.pot ?? '#F6EBDD'), leaf = String(t.leaf ?? '#6E9B5A'), potH = Number(t.potH ?? 30), top = g.h.top ?? 120, d = g.d;
    const cx = g.px, rx = (g.w / 2) * d, cy = g.py - (g.py - g.back) / 2;
    cylinder(ctx, cx, cy, cy - potH * d, rx * 0.82, pot, tone(pot, 0.6), rx);
    ellipse(ctx, cx, cy - potH * d, rx * 0.85, rx * 0.85 * K); ctx.fillStyle = '#5B3A29'; ctx.fill();
    // stems
    ctx.strokeStyle = tone(leaf, 0.6); ctx.lineWidth = 2.5;
    const crownY = cy - potH * d, topY = cy - top * d, spread = (g.w / 2 + (g.spec.maxSideOverhangCm ?? 0)) * d * 0.95;
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const leaves: [number, number, number, number][] = [];
    const n = Math.round(10 + top / 10);
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1), y = crownY - (crownY - topY) * (0.25 + 0.75 * Math.sqrt(f)) + (rnd() - 0.5) * 8 * d;
      const x = cx + (rnd() - 0.5) * 2 * spread * (0.45 + 0.55 * Math.sin(Math.PI * Math.min(1, f + 0.2)));
      ctx.beginPath(); ctx.moveTo(cx + (rnd() - 0.5) * 6, crownY); ctx.quadraticCurveTo(cx, (crownY + y) / 2, x, y); ctx.stroke();
      leaves.push([x, y, (7 + rnd() * 6) * d, rnd()]);
    }
    for (const [x, y, s, r] of leaves.sort((a, b) => a[1] - b[1])) {
      ctx.save(); ctx.translate(x, y); ctx.rotate((r - 0.5) * 1.6);
      ellipse(ctx, 0, 0, s * 0.62, s * 0.38); paint(ctx, tone(leaf, 0.85 + r * 0.35), -s, -s, s, s, 1.18, 0.82);
      ctx.strokeStyle = tone(leaf, 1.3, 0.5); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-s * 0.5, 0); ctx.lineTo(s * 0.5, 0); ctx.stroke();
      ctx.restore();
    }
  },

  catbed(ctx, g, t) {
    const body = String(t.body ?? '#F4C7D3'), rim = String(t.rim ?? '#E8A0B4'), cat = String(t.cat ?? '#4A4A55'), d = g.d;
    const cx = g.px, rx = (g.w / 2) * d, ry = (g.dp / 2) * K * d, cy = g.py - ry;
    const rimH = (g.h.rim ?? 22) * d;
    ellipse(ctx, cx, cy, rx, ry); ctx.fillStyle = tone(rim, 0.7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, cy - rimH * 0.5, rx, ry, 0, 0, Math.PI); ctx.lineTo(cx - rx, cy - rimH * 0.5); ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true); ctx.closePath();
    paint(ctx, rim, cx - rx, cy - rimH, cx + rx, cy + ry, 1.1, 0.8);
    ellipse(ctx, cx, cy - rimH * 0.5, rx, ry); paint(ctx, rim, cx - rx, cy - rimH, cx + rx, cy, 1.25, 0.95);
    ellipse(ctx, cx, cy - rimH * 0.45, rx * 0.74, ry * 0.7); paint(ctx, body, cx - rx, cy - rimH, cx + rx, cy, 1.15, 0.9, false);
    // curled sleeping cat
    const ccy = cy - rimH * 0.55;
    ellipse(ctx, cx + 2 * d, ccy, rx * 0.5, ry * 0.55 + 4 * d); paint(ctx, cat, cx - rx, ccy - 10 * d, cx + rx, ccy + 10 * d, 1.35, 0.85);
    ellipse(ctx, cx - rx * 0.32, ccy - 2 * d, 7 * d, 5.5 * d); paint(ctx, cat, cx - rx, ccy - 8 * d, cx, ccy + 4 * d, 1.45, 0.9);
    ctx.fillStyle = tone(cat, 1.2);
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx - rx * 0.32 + s * 4.5 * d, ccy - 6 * d); ctx.lineTo(cx - rx * 0.32 + s * 2 * d, ccy - 11 * d); ctx.lineTo(cx - rx * 0.32 + s * 0.2 * d, ccy - 6.5 * d); ctx.fill(); }
    ctx.strokeStyle = tone(cat, 1.5); ctx.lineWidth = 1.5;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(cx - rx * 0.32 + s * 2.4 * d, ccy - 2 * d, 1.4 * d, 0.2, Math.PI - 0.2); ctx.stroke(); }
    ctx.strokeStyle = tone(cat, 1.2); ctx.lineWidth = 3.5 * d / 2;
    ctx.beginPath(); ctx.moveTo(cx + rx * 0.45, ccy + 2 * d); ctx.quadraticCurveTo(cx + rx * 0.2, ccy + ry * 0.9, cx - rx * 0.15, ccy + ry * 0.55); ctx.stroke();
  },

  rug(ctx, g, t) {
    const body = String(t.body ?? '#E8A0B4'), border = String(t.border ?? '#F4C7D3'), pat = String(t.pattern ?? '#C0607E'), d = g.d;
    const w = g.w * d, h = g.dp * K * d, x = g.px - w / 2, y = g.py - h / 2;
    rr(ctx, x, y, w, h, 18 * d); ctx.fillStyle = tone(border, 0.95); ctx.fill();
    rr(ctx, x + 10 * d, y + 7 * d, w - 20 * d, h - 14 * d, 12 * d);
    const gr = ctx.createRadialGradient(g.px - w * 0.2, g.py - h * 0.3, 10, g.px, g.py, w * 0.6);
    gr.addColorStop(0, tone(body, 1.12)); gr.addColorStop(1, tone(body, 0.92)); ctx.fillStyle = gr; ctx.fill();
    ctx.fillStyle = tone(pat, 1, 0.35);
    for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) {
      const hx = x + w * (0.14 + i * 0.09), hy = y + h * (0.24 + j * 0.17);
      ctx.beginPath(); ctx.moveTo(hx, hy + 3 * d); ctx.bezierCurveTo(hx - 5 * d, hy - 1 * d, hx - 2 * d, hy - 5 * d, hx, hy - 2 * d); ctx.bezierCurveTo(hx + 2 * d, hy - 5 * d, hx + 5 * d, hy - 1 * d, hx, hy + 3 * d); ctx.fill();
    }
    ctx.strokeStyle = tone(border, 1.15, 0.9); ctx.lineWidth = 2; ctx.setLineDash([5, 4]); rr(ctx, x + 5 * d, y + 3.5 * d, w - 10 * d, h - 7 * d, 15 * d); ctx.stroke(); ctx.setLineDash([]);
  },

  window(ctx, g, t) {
    const frame = String(t.frame ?? '#F6EBDD'), curtain = String(t.curtain ?? '#E8A0B4'), d = g.d;
    const hTop = (g.h.top ?? 125) * d, w = g.w * d, x0 = g.px - w / 2, yTop = g.py - hTop, prot = g.dp * K * d;
    const gl = t.glass as { x: number; z: number; w: number; h: number };
    rr(ctx, x0, yTop, w, hTop, 4 * d); paint(ctx, frame, x0, yTop, x0 + w, g.py, 1.08, 0.88);
    // glass is TRANSPARENT: the engine draws the sky behind it
    const gx = g.px + gl.x * d, gy = g.py - (gl.z + gl.h) * d, gw = gl.w * d, gh = gl.h * d;
    ctx.save(); rr(ctx, gx, gy, gw, gh, 3 * d); ctx.globalCompositeOperation = 'destination-out'; ctx.fill(); ctx.restore();
    ctx.strokeStyle = tone(frame, 0.9); ctx.lineWidth = 3 * d; ctx.beginPath();
    ctx.moveTo(gx + gw / 2, gy); ctx.lineTo(gx + gw / 2, gy + gh); ctx.moveTo(gx, gy + gh * 0.42); ctx.lineTo(gx + gw, gy + gh * 0.42); ctx.stroke();
    ctx.strokeStyle = LINE; ctx.lineWidth = 2; rr(ctx, gx, gy, gw, gh, 3 * d); ctx.stroke();
    // sill
    rr(ctx, x0 - 4 * d, g.py - prot - 3 * d, w + 8 * d, prot + 3 * d, 2 * d); paint(ctx, frame, x0, g.py - prot, x0 + w, g.py, 1.2, 0.9);
    // rod + gathered curtains
    const ov = (g.spec.maxSideOverhangCm ?? 30) * d, rodY = yTop - 2 * d;
    ctx.strokeStyle = '#5B3A29'; ctx.lineWidth = 2.5 * d / 2 + 1; ctx.beginPath(); ctx.moveTo(x0 - ov, rodY); ctx.lineTo(x0 + w + ov, rodY); ctx.stroke();
    for (const side of [-1, 1]) {
      const cx = side < 0 ? x0 - ov * 0.35 : x0 + w + ov * 0.35, cw = ov * 1.25;
      ctx.beginPath(); ctx.moveTo(cx - cw / 2, rodY); ctx.lineTo(cx + cw / 2, rodY);
      ctx.quadraticCurveTo(cx + cw * 0.18, g.py - hTop * 0.45, cx + cw * 0.42, g.py + 4 * d);
      ctx.lineTo(cx - cw * 0.42, g.py + 4 * d); ctx.quadraticCurveTo(cx - cw * 0.18, g.py - hTop * 0.45, cx - cw / 2, rodY); ctx.closePath();
      paint(ctx, curtain, cx - cw / 2, rodY, cx + cw / 2, g.py, 1.18, 0.82);
      ctx.strokeStyle = tone(curtain, 0.75, 0.6); ctx.lineWidth = 1.5;
      for (const f of [-0.2, 0.15]) { ctx.beginPath(); ctx.moveTo(cx + f * cw, rodY + 4); ctx.quadraticCurveTo(cx + f * cw * 0.4, g.py - hTop * 0.45, cx + f * cw * 1.4, g.py); ctx.stroke(); }
      ctx.fillStyle = tone(curtain, 0.8); rr(ctx, cx - cw * 0.3, g.py - hTop * 0.42, cw * 0.6, 4 * d, 2 * d); ctx.fill();
    }
  },

  shelf(ctx, g, t) {
    const wood = String(t.wood ?? '#8A5A3C'), d = g.d, prot = g.dp * K * d, x0 = g.px - (g.w / 2) * d, x1 = g.px + (g.w / 2) * d;
    const boardY = g.py - 3 * d;
    for (const bx of [x0 + 10 * d, x1 - 10 * d]) { ctx.beginPath(); ctx.moveTo(bx - 2 * d, boardY); ctx.lineTo(bx + 2 * d, boardY); ctx.lineTo(bx, boardY + 12 * d); ctx.closePath(); ctx.fillStyle = tone(wood, 0.7); ctx.fill(); }
    const cols = ['#C0607E', '#F6EBDD', '#6E9B5A', '#9DB4D6', '#E8A0B4', '#D9B48A', '#B0506A', '#F4C7D3'];
    let x = x0 + 6 * d, i = 0;
    while (x < x1 - 30 * d) {
      const bw = (3 + (i % 3)) * d, bh = (18 + ((i * 7) % 9)) * d, lean = i % 5 === 4;
      ctx.save(); ctx.translate(x, boardY - prot * 0.4); if (lean) ctx.rotate(0.22);
      rr(ctx, 0, -bh, bw, bh, 1.5); paint(ctx, cols[i % cols.length]!, 0, -bh, bw, 0, 1.15, 0.8);
      ctx.restore(); x += bw + (lean ? 4 * d : 0.6 * d); i++;
    }
    cylinder(ctx, x1 - 16 * d, boardY - prot * 0.45, boardY - prot * 0.45 - 9 * d, 6 * d, '#F6EBDD', '#5B3A29');
    ctx.fillStyle = '#6E9B5A';
    for (const [ox, oy] of [[-6, -14], [0, -18], [6, -13], [-2, -11]] as const) { ellipse(ctx, x1 - 16 * d + ox * d / 2 * 1.4, boardY - prot * 0.45 - 9 * d + oy * d / 2, 4 * d, 2.4 * d); ctx.fill(); }
    rr(ctx, x0, boardY - prot, x1 - x0, prot, 2 * d); paint(ctx, wood, x0, boardY - prot, x1, boardY, 1.25, 1.0);
    rr(ctx, x0, boardY, x1 - x0, 3 * d, 1.5 * d); paint(ctx, wood, x0, boardY, x1, boardY + 3 * d, 1.0, 0.75);
  },

  photos(ctx, g, t) {
    const d = g.d, x0 = g.px - (g.w / 2) * d, x1 = g.px + (g.w / 2) * d, yTop = g.py - (g.h.top ?? 40) * d + 4 * d;
    ctx.strokeStyle = String(t.string ?? '#5B3A29'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0, yTop); ctx.quadraticCurveTo(g.px, yTop + 12 * d, x1, yTop); ctx.stroke();
    const tints = ['#9DB4D6', '#E8A0B4', '#6E9B5A', '#FFC872'];
    for (let i = 0; i < 4; i++) {
      const f = (i + 0.5) / 4, x = x0 + (x1 - x0) * f, y = yTop + 12 * d * (1 - (2 * f - 1) ** 2) * 0.5 + 1 * d;
      ctx.save(); ctx.translate(x, y); ctx.rotate((i % 2 ? 1 : -1) * 0.08);
      rr(ctx, -8 * d, 0, 16 * d, 19 * d, 1.5); paint(ctx, '#FFF8F0', -8 * d, 0, 8 * d, 19 * d, 1.0, 0.9);
      const gr = ctx.createLinearGradient(0, 2 * d, 0, 14 * d); gr.addColorStop(0, tone(tints[i]!, 1.25)); gr.addColorStop(1, tone(tints[i]!, 0.8));
      ctx.fillStyle = gr; ctx.fillRect(-6.5 * d, 2 * d, 13 * d, 12 * d);
      ctx.fillStyle = '#C0607E'; ctx.fillRect(-1 * d, -1.5 * d, 2 * d, 3 * d);
      ctx.restore();
    }
  },

  lights(ctx, g, t) {
    const d = g.d, x0 = g.px - (g.w / 2) * d, x1 = g.px + (g.w / 2) * d, y = g.py - (g.h.top ?? 22) * d + 4 * d;
    ctx.strokeStyle = String(t.string ?? '#5B3A29'); ctx.lineWidth = 1.2;
    const swags = 5, sw = (x1 - x0) / swags, sag = 10 * d;
    ctx.beginPath(); ctx.moveTo(x0, y);
    for (let i = 0; i < swags; i++) ctx.quadraticCurveTo(x0 + sw * (i + 0.5), y + sag * 2, x0 + sw * (i + 1), y);
    ctx.stroke();
    for (let i = 0; i < swags; i++) for (let j = 1; j < 6; j++) {
      const f = j / 6, bx = x0 + sw * (i + f), by = y + 2 * sag * 2 * f * (1 - f) + 2.5 * d;
      ellipse(ctx, bx, by, 2.2 * d, 2.8 * d);
      const gr = ctx.createRadialGradient(bx - 1, by - 1, 0, bx, by, 3 * d); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(1, String(t.bulb ?? '#FFE2A8'));
      ctx.fillStyle = gr; ctx.fill();
    }
  },

  neon(ctx, g, t) {
    const d = g.d, w = g.w * d, h = (g.h.top ?? 32) * d, x0 = g.px - w / 2, y0 = g.py - h;
    rr(ctx, x0, y0, w, h, 6 * d); ctx.fillStyle = 'rgba(255,248,240,0.18)'; ctx.fill(); ctx.strokeStyle = 'rgba(58,37,48,0.25)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.font = `italic ${13 * d}px "Brush Script MT", "Segoe Script", cursive`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 3.2 * d / 2; ctx.strokeStyle = String(t.tube ?? '#FFD3E2'); ctx.strokeText(String(t.text ?? 'good vibes'), g.px, y0 + h * 0.5);
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(192,96,126,0.6)'; ctx.strokeText(String(t.text ?? 'good vibes'), g.px, y0 + h * 0.5);
  },

  lamp(ctx, g, t) {
    const d = g.d, cx = g.px, by = g.py;
    cylinder(ctx, cx, by, by - 4 * d, 8 * d, String(t.base ?? '#8A5A3C'), tone(String(t.base ?? '#8A5A3C'), 1.15));
    ctx.beginPath(); ctx.moveTo(cx - 4 * d, by - 4 * d);
    ctx.bezierCurveTo(cx - 10 * d, by - 9 * d, cx - 8 * d, by - 18 * d, cx - 2.5 * d, by - 22 * d); ctx.lineTo(cx + 2.5 * d, by - 22 * d);
    ctx.bezierCurveTo(cx + 8 * d, by - 18 * d, cx + 10 * d, by - 9 * d, cx + 4 * d, by - 4 * d); ctx.closePath();
    paint(ctx, String(t.body ?? '#F4C7D3'), cx - 8 * d, by - 22 * d, cx + 8 * d, by - 4 * d, 1.2, 0.82);
    cylinder(ctx, cx, by - 22 * d, by - 42 * d, 12 * d, String(t.shade ?? '#F6EBDD'), tone(String(t.shade ?? '#F6EBDD'), 0.8), 9 * d);
    ctx.strokeStyle = String(t.trim ?? '#E8A0B4'); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, by - 22 * d, 12 * d, 12 * d * K, 0, 0, Math.PI); ctx.stroke();
  },
};

export const TEMP_SHAPES = Object.keys(SHAPES);
