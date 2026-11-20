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

/**
 * `density` = runtime px per cm (HD 2 / SD 1, the same variant choice approved art gets), so TEMP art
 * is never minified on low-res screens. Shapes are authored at the spec density and scaled.
 */
export function ensureTempTexture(scene: Phaser.Scene, spec: PropSpec, density = spec.density): string | null {
  const key = `${tempTextureKey(spec.id)}@${density}`;
  if (scene.textures.exists(key)) return key;
  const t = spec.temp;
  if (!t) return null;
  const draw = SHAPES[t.shape];
  if (!draw) return null;
  const k = density / spec.density;
  const tex = scene.textures.createCanvas(key, Math.ceil(spec.canvas.width * k), Math.ceil(spec.canvas.height * k));
  if (!tex) return null;
  const ctx = tex.getContext();
  ctx.scale(k, k);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  draw(ctx, geom(spec), t);
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

  /** Open laptop: keyboard deck toward the chair (south), screen at the back (hinge north), DISPLAY facing south. */
  laptop(ctx, g, t) {
    const d = g.d, cx = g.px, w = g.w * d, dep = g.dp * K * d, front = g.py + dep / 2, back = g.py - dep / 2;
    const body = String(t.body ?? '#E8C7D1');
    rr(ctx, cx - w / 2, back, w, dep, 2 * d); paint(ctx, body, cx - w / 2, back, cx + w / 2, front, 1.12, 0.92);            // base (top face)
    rr(ctx, cx - w / 2, front - 1 * d, w, 2 * d, 1 * d); paint(ctx, body, cx - w / 2, front, cx + w / 2, front + 2 * d, 0.95, 0.8); // base front edge
    ctx.fillStyle = 'rgba(58,37,48,0.35)';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) ctx.fillRect(cx - w * 0.4 + c * w * 0.08, back + dep * 0.12 + r * dep * 0.14, w * 0.065, dep * 0.1); // keys
    rr(ctx, cx - w * 0.14, back + dep * 0.62, w * 0.28, dep * 0.25, 1); ctx.fillStyle = tone(body, 0.9); ctx.fill();                  // trackpad
    const sh = (g.h.top ?? 22) * d, sTop = back - sh;
    rr(ctx, cx - w / 2, sTop, w, sh + 1, 2 * d); paint(ctx, body, cx - w / 2, sTop, cx + w / 2, back, 1.05, 0.88);               // lid
    rr(ctx, cx - w / 2 + 2 * d, sTop + 2 * d, w - 4 * d, sh - 4 * d, 1 * d);
    const sc = ctx.createLinearGradient(cx - w / 2, sTop, cx + w / 2, back); sc.addColorStop(0, '#4A4566'); sc.addColorStop(1, String(t.screen ?? '#3A3550'));
    ctx.fillStyle = sc; ctx.fill();                                                                                                 // display, facing the viewer
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.moveTo(cx - w * 0.3, sTop + 3 * d); ctx.lineTo(cx - w * 0.1, sTop + 3 * d); ctx.lineTo(cx - w * 0.3, back - 3 * d); ctx.closePath(); ctx.fill();
  },

  mug(ctx, g, t) {
    const d = g.d, body = String(t.body ?? '#F6EBDD');
    cylinder(ctx, g.px, g.py, g.py - (g.h.top ?? 10) * d, 4 * d, body, '#6B4434', 4.2 * d);
    ctx.strokeStyle = tone(body, 0.8); ctx.lineWidth = 1.6 * d / 2 + 1;
    ctx.beginPath(); ctx.arc(g.px + 4.6 * d, g.py - 5 * d, 2.2 * d, -1.2, 1.2); ctx.stroke();
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


// ---------- World 01 TEMP shapes (generic placeholders for exterior/interior world maps) ----------
function label(ctx: Ctx, text: string, x: number, y: number, size: number, color = '#FFFFFF', font = 'bold'): void {
  ctx.fillStyle = color; ctx.font = `${font} ${size}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y);
}
Object.assign(SHAPES, {
  /** Sofa / bench: seat box + backrest along the NORTH edge (faces south, toward the viewer) + arms. */
  sofa(ctx: Ctx, g: Geom, t: TempArtSpec) {
    const body = String(t.body ?? '#B98A9A'), cush = String(t.cushion ?? tone(body, 1.12)), seat = g.h.seat ?? 45, top = g.h.top ?? 85, d = g.d;
    const backDepth = Math.min(g.dp * 0.3, 25), armW = Number(t.arms ?? 18);
    if (t.legs) { for (const x of [g.L + 6 * d, g.R - 6 * d]) leg(ctx, x, g.zy(seat - 8), g.py, 4 * d, String(t.legs)); }
    // backrest (at the back edge, so it is drawn first and higher)
    const bx0 = g.L, bx1 = g.R, byTop = g.by(top), byBot = g.by(seat - 10) + backDepth * K * d;
    rr(ctx, bx0, byTop, bx1 - bx0, byBot - byTop, 8 * d); paint(ctx, body, bx0, byTop, bx1, byBot, 1.1, 0.85);
    box(ctx, g, g.L, g.R, t.legs ? seat - 12 : 0, seat - 6, body, tone(body, 0.92), 6);
    const n = Math.max(1, Number(t.seats ?? 3)), inner0 = g.L + (armW ? armW * d : 0), inner1 = g.R - (armW ? armW * d : 0), cw = (inner1 - inner0) / n;
    for (let i = 0; i < n; i++) { const x0 = inner0 + i * cw + 1.5; rr(ctx, x0, g.zy(seat) - (g.py - g.back) * 0.75, cw - 3, (g.py - g.back) * 0.75 + 6 * d, 6 * d); paint(ctx, cush, x0, g.zy(seat) - 20 * d, x0 + cw, g.zy(seat) + 6 * d, 1.15, 0.9); }
    if (armW) for (const x0 of [g.L, g.R - armW * d]) { rr(ctx, x0, g.zy(seat + 18) - (g.py - g.back) * 0.8, armW * d, (seat + 18) * d * 0.55 + (g.py - g.back) * 0.8, 7 * d); paint(ctx, body, x0, g.zy(seat + 18) - 20 * d, x0 + armW * d, g.zy(4), 1.12, 0.82); }
  },
  /** Generic counter / cabinet block with an optional label strip and register. */
  block(ctx: Ctx, g: Geom, t: TempArtSpec) {
    const body = String(t.body ?? '#C9B8A8'), topC = String(t.top ?? tone(body, 1.12)), top = g.h.top ?? 90, d = g.d;
    box(ctx, g, g.L, g.R, 0, top, topC, body, 4 * d, g.py - g.back);
    if (t.stripe) { ctx.fillStyle = String(t.stripe); ctx.fillRect(g.L + 2, g.zy(top) + 6 * d, g.R - g.L - 4, 8 * d); }
    if (t.text) label(ctx, String(t.text), g.px, g.zy(top * 0.45), 9 * d, String(t.textColor ?? '#FFFFFF'));
    if (t.register) { const rx = g.R - 30 * d, ry = g.zy(top) - (g.py - g.back) * 0.5; rr(ctx, rx - 12 * d, ry - 18 * d, 24 * d, 18 * d, 3 * d); paint(ctx, '#4A4566', rx - 12 * d, ry - 18 * d, rx + 12 * d, ry, 1.2, 0.85); }
    if (t.shoes) for (let i = 0; i < 4; i++) { const x = g.L + (10 + i * 20) * d; rr(ctx, x, g.zy(top) - 5 * d - (g.py - g.back) * 0.5, 14 * d, 6 * d, 3 * d); ctx.fillStyle = ['#9C7258', '#E8A0B4', '#4A4250', '#F6EBDD'][i]!; ctx.fill(); }
  },
  /** Store shelving or a glass-door fridge, seen from the front (south). */
  shelving(ctx: Ctx, g: Geom, t: TempArtSpec) {
    const frame = String(t.frame ?? '#D7DEE3'), top = g.h.top ?? 160, d = g.d, glass = !!t.glass;
    box(ctx, g, g.L, g.R, 0, top, tone(frame, 1.08), frame, 3 * d, g.py - g.back);
    const rows = Number(t.rows ?? 4), y0 = g.zy(top) + 6 * d, y1 = g.zy(8), rh = (y1 - y0) / rows;
    const palette = ['#E07A5F', '#F2CC8F', '#81B29A', '#3D85C6', '#E8A0B4', '#F4F1DE', '#9C7258'];
    let seed = (g.spec.id.length * 97) % 233280; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let r = 0; r < rows; r++) {
      const yb = y0 + (r + 1) * rh - 2 * d;
      ctx.fillStyle = tone(frame, 0.75); ctx.fillRect(g.L + 3 * d, yb, g.R - g.L - 6 * d, 2 * d);
      for (let x = g.L + 5 * d; x < g.R - 9 * d;) { const w = (6 + rnd() * 8) * d, h = rh * (0.45 + rnd() * 0.4); ctx.fillStyle = palette[Math.floor(rnd() * palette.length)]!; ctx.fillRect(x, yb - h, w - 1.5 * d, h); x += w; }
    }
    if (glass) { ctx.fillStyle = 'rgba(200,230,255,0.28)'; ctx.fillRect(g.L + 3 * d, y0 - 2 * d, g.R - g.L - 6 * d, y1 - y0); ctx.strokeStyle = tone(frame, 0.6); ctx.lineWidth = 2 * d; ctx.strokeRect(g.L + 3 * d, y0 - 2 * d, (g.R - g.L - 6 * d) / 2, y1 - y0); ctx.strokeRect(g.px, y0 - 2 * d, (g.R - g.L - 6 * d) / 2, y1 - y0); }
    if (t.text) { ctx.fillStyle = String(t.textBg ?? '#3D85C6'); ctx.fillRect(g.L, g.zy(top) - 2 * d, g.R - g.L, 10 * d); label(ctx, String(t.text), g.px, g.zy(top) + 3 * d, 7 * d); }
  },
  /** Motorbike, side view (length along x). */
  motorbike(ctx: Ctx, g: Geom, t: TempArtSpec) {
    const body = String(t.body ?? '#C0607E'), d = g.d, cy = g.py - (g.py - g.back) / 2, r = 28 * d;
    for (const x of [g.L + 32 * d, g.R - 32 * d]) { ellipse(ctx, x, cy - r, r, r); ctx.fillStyle = '#2E2A30'; ctx.fill(); ellipse(ctx, x, cy - r, r * 0.45, r * 0.45); ctx.fillStyle = '#9AA0A8'; ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(g.L + 40 * d, cy - r * 1.4); ctx.quadraticCurveTo(g.px, cy - r * 0.6, g.R - 45 * d, cy - r * 1.3); ctx.lineTo(g.R - 30 * d, cy - r * 2.3); ctx.lineTo(g.L + 60 * d, cy - r * 2.2); ctx.closePath();
    paint(ctx, body, g.L, cy - r * 2.4, g.R, cy - r * 0.6, 1.2, 0.8);
    rr(ctx, g.L + 55 * d, cy - r * 2.6, 70 * d, 12 * d, 6 * d); paint(ctx, '#3A3440', g.L, cy - r * 2.7, g.R, cy - r * 2.1, 1.3, 0.9);           // seat
    ctx.strokeStyle = '#4A4250'; ctx.lineWidth = 4 * d; ctx.beginPath(); ctx.moveTo(g.R - 35 * d, cy - r * 2.2); ctx.lineTo(g.R - 25 * d, cy - r * 3.4); ctx.lineTo(g.R - 40 * d, cy - r * 3.6); ctx.stroke();
  },
  /** Tree: trunk + layered canopy (canopy overhangs the footprint; collision is the trunk only). */
  tree(ctx: Ctx, g: Geom, t: TempArtSpec) {
    const leaf = String(t.leaf ?? '#6E9B5A'), trunk = String(t.trunk ?? '#7A5238'), top = g.h.top ?? 450, d = g.d, cx = g.px, cy = g.py - (g.py - g.back) / 2;
    const canopyR = Number(t.canopy ?? 150) * d, canopyY = cy - top * d + canopyR;
    rr(ctx, cx - 10 * d, canopyY, 20 * d, cy - canopyY, 6 * d); paint(ctx, trunk, cx - 10 * d, canopyY, cx + 10 * d, cy, 1.15, 0.75);
    let seed = 31; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 16; i++) {
      const a = rnd() * Math.PI * 2, rr2 = canopyR * (0.25 + rnd() * 0.5), x = cx + Math.cos(a) * rr2, y = canopyY + Math.sin(a) * rr2 * 0.75, s = canopyR * (0.35 + rnd() * 0.2);
      ellipse(ctx, x, y, s, s * 0.85); paint(ctx, tone(leaf, 0.85 + rnd() * 0.3), x - s, y - s, x + s, y + s, 1.2, 0.8, false);
    }
  },
  /** Street light / sign pole. */
  pole(ctx: Ctx, g: Geom, t: TempArtSpec) {
    const c = String(t.color ?? '#5E6670'), top = g.h.top ?? 450, d = g.d, cx = g.px, cy = g.py - (g.py - g.back) / 2;
    ellipse(ctx, cx, cy, 10 * d, 6 * d); ctx.fillStyle = tone(c, 0.7); ctx.fill();
    rr(ctx, cx - 4 * d, cy - top * d, 8 * d, top * d, 3 * d); paint(ctx, c, cx - 4 * d, cy - top * d, cx + 4 * d, cy, 1.25, 0.75);
    if (t.sign) { rr(ctx, cx - 30 * d, cy - top * d, 60 * d, 26 * d, 3 * d); paint(ctx, String(t.signColor ?? '#2E7D5B'), cx - 30 * d, cy - top * d, cx + 30 * d, cy - (top - 26) * d, 1.1, 0.85); label(ctx, String(t.sign), cx, cy - (top - 13) * d, 8 * d); }
    else { rr(ctx, cx - 4 * d, cy - top * d, 40 * d, 6 * d, 3 * d); paint(ctx, c, cx, cy - top * d, cx + 40 * d, cy - top * d + 6 * d); ellipse(ctx, cx + 34 * d, cy - top * d + 8 * d, 9 * d, 4 * d); ctx.fillStyle = '#FFF4D6'; ctx.fill(); }
  },
  /** Wall-mounted building front (storefront / office / house), painted flat on the north wall. */
  storefront(ctx: Ctx, g: Geom, t: TempArtSpec) {
    const wall = String(t.wall ?? '#EFE6D8'), accent = String(t.accent ?? '#2A9D8F'), top = g.h.top ?? 380, d = g.d, W = g.R - g.L, y0 = g.zy(top), y1 = g.py;
    rr(ctx, g.L, y0, W, y1 - y0, 4 * d); paint(ctx, wall, g.L, y0, g.R, y1, 1.05, 0.9);
    ctx.fillStyle = tone(wall, 0.8); ctx.fillRect(g.L, y0, W, 8 * d);                                        // parapet
    const kind = String(t.kind ?? 'shop');
    if (t.sign) { const sh = 46 * d; rr(ctx, g.L + 20 * d, y0 + 22 * d, W - 40 * d, sh, 4 * d); paint(ctx, accent, g.L, y0 + 22 * d, g.R, y0 + 22 * d + sh, 1.15, 0.85); label(ctx, String(t.sign), g.px, y0 + 22 * d + sh / 2, 26 * d); }
    if (kind === 'shop') {
      const ay = y0 + 80 * d; ctx.fillStyle = String(t.awning ?? '#F4A261'); ctx.beginPath(); ctx.moveTo(g.L + 10 * d, ay); ctx.lineTo(g.R - 10 * d, ay); ctx.lineTo(g.R - 4 * d, ay + 26 * d); ctx.lineTo(g.L + 4 * d, ay + 26 * d); ctx.closePath(); ctx.fill();
      for (let x = g.L + 10 * d; x < g.R - 10 * d; x += 40 * d) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x, ay, 20 * d, 26 * d); }
      const gy = ay + 34 * d; ctx.fillStyle = 'rgba(170,215,235,0.85)'; ctx.fillRect(g.L + 20 * d, gy, W - 40 * d, y1 - gy - 6 * d);
      ctx.strokeStyle = tone(wall, 0.55); ctx.lineWidth = 3 * d; for (let x = g.L + 20 * d; x <= g.R - 20 * d + 1; x += (W - 40 * d) / 6) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, y1 - 6 * d); ctx.stroke(); }
      for (let i = 0; i < 9; i++) { ctx.fillStyle = ['#E07A5F', '#F2CC8F', '#81B29A', '#3D85C6'][i % 4]!; ctx.fillRect(g.L + (30 + i * ((W / d - 60) / 9)) * d, y1 - 70 * d, 18 * d, 50 * d); }
    } else {
      const rows = kind === 'office' ? 2 : 1, cols = Math.max(2, Math.floor(W / d / 140));
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (kind === 'house' && c === Math.floor(cols / 2)) continue;
        const ww = 70 * d, wh = 80 * d, x = g.L + (c + 0.5) * (W / cols) - ww / 2, y = y0 + (kind === 'office' ? 90 + r * 120 : 130) * d;
        rr(ctx, x, y, ww, wh, 3 * d); ctx.fillStyle = '#A9C7DA'; ctx.fill(); ctx.strokeStyle = tone(wall, 0.6); ctx.lineWidth = 3 * d; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + ww / 2, y); ctx.lineTo(x + ww / 2, y + wh); ctx.stroke();
      }
      if (kind === 'house') { const dw = 80 * d; rr(ctx, g.px - dw / 2, y1 - 200 * d, dw, 200 * d, 4 * d); paint(ctx, '#8A5A3C', g.px - dw / 2, y1 - 200 * d, g.px + dw / 2, y1, 1.1, 0.85); }
    }
    if (t.door) { const dw = Number(t.door) * d; rr(ctx, g.px - dw / 2, y1 - 210 * d, dw, 210 * d, 3 * d); ctx.fillStyle = 'rgba(120,170,195,0.95)'; ctx.fill(); ctx.strokeStyle = '#5E6670'; ctx.lineWidth = 3 * d; ctx.stroke(); ctx.beginPath(); ctx.moveTo(g.px, y1 - 210 * d); ctx.lineTo(g.px, y1); ctx.stroke(); }
  },
  /** Low front wall with two pillars and an open gate in the middle (wall-mounted). */
  gate(ctx: Ctx, g: Geom, t: TempArtSpec) {
    const c = String(t.wall ?? '#EFE6D8'), metal = String(t.metal ?? '#4A4250'), top = g.h.top ?? 200, d = g.d, gap = Number(t.gap ?? 140) * d, wallTop = g.zy(120);
    for (const [x0, x1] of [[g.L, g.px - gap / 2], [g.px + gap / 2, g.R]] as const) { rr(ctx, x0, wallTop, x1 - x0, g.py - wallTop, 3 * d); paint(ctx, c, x0, wallTop, x1, g.py, 1.08, 0.88); }
    for (const x of [g.px - gap / 2 - 12 * d, g.px + gap / 2 - 12 * d]) { rr(ctx, x, g.zy(top), 24 * d, top * d, 3 * d); paint(ctx, tone(c, 0.95), x, g.zy(top), x + 24 * d, g.py, 1.15, 0.8); }
    ctx.strokeStyle = metal; ctx.lineWidth = 2.5 * d;                                                          // opened gate leaves, folded against the wall
    for (const s of [-1, 1]) { const x = g.px + s * (gap / 2 + 20 * d); for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x + s * i * 8 * d, g.zy(160)); ctx.lineTo(x + s * i * 8 * d, g.py - 4 * d); ctx.stroke(); } }
  },
  /** Road surface decal: asphalt with a dashed centre line and kerbs. */
  road(ctx: Ctx, g: Geom, t: TempArtSpec) {
    const d = g.d, w = g.w * d, h = g.dp * K * d, x = g.px - w / 2, y = g.py - h / 2;
    ctx.fillStyle = String(t.asphalt ?? '#6B6870'); ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 60; i++) ctx.fillRect(x + ((i * 53) % w), y + ((i * 29) % h), 3 * d, 1.5 * d);
    ctx.fillStyle = '#D9D4C7'; ctx.fillRect(x, y, w, 6 * d); ctx.fillRect(x, y + h - 6 * d, w, 6 * d);
    ctx.fillStyle = '#F2E9C9'; for (let xx = x + 20 * d; xx < x + w; xx += 100 * d) ctx.fillRect(xx, y + h / 2 - 2 * d, 50 * d, 4 * d);
  },
  /** Flat wall panel: window, notice board, calendar, whiteboard, time clock (wall-mounted). */
  panel(ctx: Ctx, g: Geom, t: TempArtSpec) {
    const top = g.h.top ?? 100, d = g.d, y0 = g.zy(top), y1 = g.py, frame = String(t.frame ?? '#8A5A3C'), face = String(t.face ?? '#F6F1E7');
    rr(ctx, g.L, y0, g.R - g.L, y1 - y0, 3 * d); paint(ctx, frame, g.L, y0, g.R, y1, 1.1, 0.85);
    rr(ctx, g.L + 4 * d, y0 + 4 * d, g.R - g.L - 8 * d, y1 - y0 - 8 * d, 2 * d); ctx.fillStyle = face; ctx.fill();
    if (t.window) { ctx.strokeStyle = frame; ctx.lineWidth = 3 * d; ctx.beginPath(); ctx.moveTo(g.px, y0); ctx.lineTo(g.px, y1); ctx.moveTo(g.L, (y0 + y1) / 2); ctx.lineTo(g.R, (y0 + y1) / 2); ctx.stroke(); }
    if (t.lines) { ctx.fillStyle = 'rgba(80,80,100,0.35)'; for (let i = 0; i < Number(t.lines); i++) ctx.fillRect(g.L + 10 * d, y0 + (18 + i * 12) * d, (g.R - g.L) * (0.4 + ((i * 37) % 40) / 100), 3 * d); }
    if (t.text) label(ctx, String(t.text), g.px, y0 + Math.min(14 * d, (y1 - y0) / 2), Math.min(10 * d, (y1 - y0) * 0.35), String(t.textColor ?? '#3A2530'));
  },
});

export const TEMP_SHAPES = Object.keys(SHAPES);
