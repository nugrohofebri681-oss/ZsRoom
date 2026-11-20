import * as Phaser from 'phaser';
import { groundToRender, DEPTH_SCALE } from '../core/projection';
import type { LightSpec } from '../core/specs';

/**
 * Baked room lighting for budget GPUs (Art Bible §7: emission is engine-side, art is painted unlit).
 *
 * Instead of one full-screen tint + one large additive sprite per light (overdraw grows with every lamp),
 * all lights are baked on the CPU into ONE low-res canvas, redrawn only when a light toggles or the time
 * of day changes: ambient darkness, soft holes where lights are on, warm translucent light colour.
 * Per frame the GPU blends at most one full-screen quad (none by day: then it is cropped to the lit
 * area), however many lights the room has. Measured: each full-screen quad costs ~5 fps under software
 * rendering, i.e. it is fill-rate that limits budget GPUs, not draw calls.
 * Small bright cores at each emitter stay as tiny sprites.
 */
export const LIGHTMAP_CM_PER_PX = 4;
const CORE_TEX = 'fx:core';
const DARK_DEPTH = 89000;
const HOLE_STRENGTH = 0.75;
const WARM_TINT = 1.1;
const GLOW_DEPTH = 90000;

interface LightEntry { key: string; spec: LightSpec; ex: number; ey: number; fx: number; fy: number; wall: boolean; on: boolean; core?: Phaser.GameObjects.Image; bulbs: { x: number; y: number }[]; glows: { img: Phaser.GameObjects.Image; k: number }[] }
export interface LightLook { overlay: { color: string; alpha: number }; lightBoost: number }

export class LightingSystem {
  private lights = new Map<string, LightEntry>();
  private map: Phaser.Textures.CanvasTexture;
  private img: Phaser.GameObjects.Image;
  private look: LightLook = { overlay: { color: '#000000', alpha: 0 }, lightBoost: 1 };
  /** Number of times the lightmap was rebuilt (exposed for tests: must not happen every frame). */
  bakes = 0;
  /** Fraction of the room the lightmap quad covers after cropping (1 = full screen). */
  coverage = 0;

  constructor(private scene: Phaser.Scene, readonly key: string, private bounds: { x: number; y: number; w: number; h: number }) {
    const w = Math.ceil(bounds.w / LIGHTMAP_CM_PER_PX), h = Math.ceil(bounds.h / LIGHTMAP_CM_PER_PX);
    if (scene.textures.exists(key)) scene.textures.remove(key);
    this.map = scene.textures.createCanvas(key, w, h)!;
    this.img = scene.add.image(bounds.x, bounds.y, this.map).setOrigin(0, 0).setScale(LIGHTMAP_CM_PER_PX).setDepth(DARK_DEPTH);
    ensureCore(scene);
  }

  /**
   * @param art the prop's own image: needed for `selfLit` (neon) and to place bulb glows just above the art
   *            (so a character standing in front of the wall still covers them).
   */
  add(key: string, spec: LightSpec, x: number, y: number, z: number, wall: boolean, on?: boolean, art?: Phaser.GameObjects.Image): void {
    const e = groundToRender(x + spec.emitter.x, y + spec.emitter.y, z + spec.emitter.z);
    const f = groundToRender(x + spec.emitter.x, y + spec.emitter.y + 40, 0);
    const bulbs = (spec.points ?? []).map((p) => groundToRender(x + p.x, y, z + p.z));
    const entry: LightEntry = { key, spec, ex: e.x, ey: e.y, fx: f.x, fy: f.y, wall, on: on ?? spec.defaultOn, bulbs, glows: [] };
    const artDepth = (art?.depth ?? GLOW_DEPTH) + 0.02;
    const tint = Phaser.Display.Color.HexStringToColor(spec.color).color;
    if (bulbs.length) {
      // all bulb glows of one string baked into ONE small additive texture (one quad, no per-bulb sprites)
      const tex = bulbStrip(this.scene, `fx:bulbs:${key}`, bulbs, spec.color);
      entry.glows.push({ img: this.scene.add.image(tex.x, tex.y, tex.key).setOrigin(0, 0).setScale(BULB_CM_PER_PX).setBlendMode(Phaser.BlendModes.ADD).setDepth(artDepth), k: 1 });
    }
    if (spec.selfLit && art) {
      // lit tubes: the painted strokes themselves brighten in the light colour (plus a slightly larger soft copy)
      const copy = (grow: number, k: number) => entry.glows.push({ k, img: this.scene.add.image(art.x, art.y, art.texture.key).setOrigin(art.originX, art.originY)
        .setScale(art.scaleX * grow, art.scaleY * grow).setTint(tint).setBlendMode(Phaser.BlendModes.ADD).setDepth(artDepth) });
      copy(1, spec.selfLit); copy(1.04, spec.selfLit * 0.35);
    }
    const coreSize = spec.coreSizeCm ?? 60;
    if (coreSize > 0) {
      entry.core = this.scene.add.image(e.x, e.y, CORE_TEX).setTint(Phaser.Display.Color.HexStringToColor(spec.color).color)
        .setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(coreSize, coreSize).setDepth(GLOW_DEPTH + 1);
    }
    this.lights.set(key, entry);
  }

  has(key: string): boolean { return this.lights.has(key); }
  isOn(key: string): boolean { return !!this.lights.get(key)?.on; }
  toggle(key: string): boolean { const l = this.lights.get(key); if (!l) return false; l.on = !l.on; this.bake(); return l.on; }
  setLook(look: LightLook): void { this.look = look; this.bake(); }
  states(): { key: string; on: boolean; core: boolean; glows: number; glowAlpha: number; glowDepth: number | null }[] {
    return [...this.lights.values()].map((l) => ({ key: l.key, on: l.on, core: !!l.core, glows: l.glows.length, glowAlpha: l.glows[0]?.img.visible ? l.glows[0].img.alpha : 0, glowDepth: l.glows[0]?.img.depth ?? null }));
  }
  /** Full-screen blended layers drawn per frame by lighting (0 or 1; a cropped quad counts by coverage). */
  fullScreenLayers(): number { return this.img.visible ? Math.round(this.coverage * 100) / 100 : 0; }

  /**
   * Rebuild the single low-res lightmap (normal blend): ambient darkness, soft holes where lights are on,
   * then warm translucent light colour. Day: no darkness, and the quad is cropped to the lit area only.
   */
  bake(): void {
    this.bakes++;
    const b = this.bounds, s = 1 / LIGHTMAP_CM_PER_PX, boost = this.look.lightBoost;
    const toPx = (x: number, y: number) => ({ x: (x - b.x) * s, y: (y - b.y) * s });
    const on = [...this.lights.values()].filter((l) => l.on);
    const ctx = this.map.getContext(), W = this.map.width, H = this.map.height;
    ctx.clearRect(0, 0, W, H);
    const a = this.look.overlay.alpha;
    if (a > 0.01) {
      ctx.fillStyle = this.look.overlay.color; ctx.globalAlpha = a; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'destination-out';
      // Lights lift the darkness only partly, so night still reads as night around a lamp.
      for (const l of on) for (const sh of shapes(l)) radial(ctx, toPx(sh.x, sh.y), sh.rx * s * 0.8, sh.ry * s * 0.8, Math.min(0.85, HOLE_STRENGTH * boost * sh.strength * (0.5 + l.spec.intensity)), '0,0,0');
      ctx.globalCompositeOperation = 'source-over';
    }
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (const l of on) {
      const [r, g, bl] = rgb(l.spec.color);
      for (const sh of shapes(l)) {
        const c = toPx(sh.x, sh.y), rx = sh.rx * s, ry = sh.ry * s;
        radial(ctx, c, rx, ry, Math.min(0.6, WARM_TINT * l.spec.intensity * boost * sh.strength), `${r},${g},${bl}`);
        x0 = Math.min(x0, c.x - rx); y0 = Math.min(y0, c.y - ry); x1 = Math.max(x1, c.x + rx); y1 = Math.max(y1, c.y + ry);
      }
    }
    this.map.refresh();
    if (a > 0.01) { this.img.setCrop(); this.coverage = 1; }
    else if (on.length) {
      const cx = Math.max(0, Math.floor(x0)), cy = Math.max(0, Math.floor(y0)), cw = Math.min(W, Math.ceil(x1)) - cx, ch = Math.min(H, Math.ceil(y1)) - cy;
      this.img.setCrop(cx, cy, Math.max(1, cw), Math.max(1, ch));
      this.coverage = (cw * ch) / (W * H);
    } else this.coverage = 0;
    this.img.setVisible(this.coverage > 0);
    for (const l of this.lights.values()) {
      l.core?.setVisible(l.on).setAlpha(0.45 + 0.4 * boost);
      // glows read strongly at night and only faintly by day (boost rises as the room darkens)
      const level = Phaser.Math.Clamp((boost - 0.3) / 0.7, 0, 1);   // 0 afternoon … 1 night
      for (const g of l.glows) g.img.setVisible(l.on).setAlpha(Math.min(1, g.k * (0.12 + 0.88 * level)));
    }
  }
}

function radial(ctx: CanvasRenderingContext2D, c: { x: number; y: number }, rx: number, ry: number, alpha: number, rgbStr: string): void {
  if (alpha <= 0 || rx <= 0 || ry <= 0) return;
  ctx.save();
  ctx.translate(c.x, c.y); ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(${rgbStr},${alpha})`);
  g.addColorStop(0.4, `rgba(${rgbStr},${alpha * 0.45})`);
  g.addColorStop(1, `rgba(${rgbStr},0)`);
  ctx.fillStyle = g; ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
  ctx.restore();
}

/** Light footprint: a halo around the emitter, plus a floor pool for lights that stand in the room. */
function shapes(l: LightEntry): { x: number; y: number; rx: number; ry: number; strength: number }[] {
  const r = l.spec.radiusCm;
  const halo = { x: l.ex, y: l.ey, rx: r * 0.5, ry: r * 0.5, strength: 0.8 };
  const bulbs = l.bulbs.map((b) => ({ x: b.x, y: b.y + 6, rx: 22, ry: 22, strength: 0.7 }));   // each bulb lifts the darkness locally
  if (l.wall) return [halo, { x: l.ex, y: l.ey + r * 0.35, rx: r, ry: r * 0.55, strength: 0.6 }, ...bulbs];
  return [halo, { x: l.fx, y: l.fy, rx: r, ry: r * DEPTH_SCALE * 1.15, strength: 1 }];
}

const BULB_CM_PER_PX = 0.5;
/** Soft glow dots for every bulb of a string, drawn once into a canvas covering just the string. */
function bulbStrip(scene: Phaser.Scene, key: string, bulbs: { x: number; y: number }[], color: string): { key: string; x: number; y: number } {
  const R = 9, x0 = Math.min(...bulbs.map((b) => b.x)) - R, y0 = Math.min(...bulbs.map((b) => b.y)) - R;
  const w = Math.ceil((Math.max(...bulbs.map((b) => b.x)) + R - x0) / BULB_CM_PER_PX), h = Math.ceil((Math.max(...bulbs.map((b) => b.y)) + R - y0) / BULB_CM_PER_PX);
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h)!, ctx = tex.getContext(), [r, g, b] = rgb(color);
  for (const p of bulbs) {
    const cx = (p.x - x0) / BULB_CM_PER_PX, cy = (p.y - y0) / BULB_CM_PER_PX, rr = R / BULB_CM_PER_PX;
    const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
    gr.addColorStop(0, 'rgba(255,248,225,0.95)'); gr.addColorStop(0.18, `rgba(${r},${g},${b},0.75)`);
    gr.addColorStop(0.5, `rgba(${r},${g},${b},0.22)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gr; ctx.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
  }
  tex.refresh();
  return { key, x: x0, y: y0 };
}

function rgb(hex: string): [number, number, number] { const n = parseInt(hex.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

function ensureCore(scene: Phaser.Scene): void {
  if (scene.textures.exists(CORE_TEX)) return;
  const c = scene.textures.createCanvas(CORE_TEX, 64, 64)!;
  const ctx = c.getContext();
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  c.refresh();
}
