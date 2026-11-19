import * as Phaser from 'phaser';
import { DEPTH_SCALE as K } from '../core/projection';
import { getEnvironmentSpec, type EnvironmentSpec } from '../core/specs';
import { textureKey, type AssetManifest } from '../systems/manifest';
import type { RoomData } from '../world/room';

/**
 * Room shell from ENVIRONMENT TILES (Batch E): one TileSprite for the back wall, one for the floor.
 * Approved tile art is used when present; otherwise a seamless TEMP tile with the exact spec canvas is
 * generated, so the render path is identical. Memory: two small tiles (~0.2 MB) instead of a
 * room-sized canvas (~7.8 MB at HD). Overlays (ambient occlusion, cut-away wall caps, doorway) are
 * cheap vector shapes.
 */
export const SHELL_MARGIN = 20;
const WALL_CAP = 0x3a2530;

export interface ShellInfo { floor: { id: string; art: 'approved' | 'temp' }; wall: { id: string; art: 'approved' | 'temp' } }

export function buildShell(scene: Phaser.Scene, room: RoomData, manifest: AssetManifest, density = 2): ShellInfo {
  const { w, h } = room.sizeCm;
  const wallH = room.wallHeightCm;
  const floorH = h * K;
  const ids = room.shell ?? { floor: 'env_floor_planks_honey', wall: 'env_wall_bedroom' };
  const wallTile = resolveTile(scene, getEnvironmentSpec(ids.wall), manifest, room, density);
  const floorTile = resolveTile(scene, getEnvironmentSpec(ids.floor), manifest, room, density);

  // Tiles are laid as plain quads (batched into one draw, cheapest fragment path on mobile GPUs: no
  // repeat shader). Edge tiles are cropped, so nothing spills outside the room.
  tileQuads(scene, wallTile.key, wallTile.w, wallTile.h, 0, -wallH, w, wallH, wallH / wallTile.h);
  tileQuads(scene, floorTile.key, floorTile.w, floorTile.h, 0, 0, w, floorH, 1 / floorTile.density);

  const g = scene.add.graphics().setDepth(-99990);
  // ambient occlusion where the floor meets the walls
  g.fillGradientStyle(0x3a2530, 0x3a2530, 0x3a2530, 0x3a2530, 0.28, 0.28, 0, 0).fillRect(0, 0, w, 24);
  g.fillGradientStyle(0x3a2530, 0x3a2530, 0x3a2530, 0x3a2530, 0.22, 0, 0.22, 0).fillRect(0, -wallH, 18, wallH + floorH);
  g.fillGradientStyle(0x3a2530, 0x3a2530, 0x3a2530, 0x3a2530, 0, 0.22, 0, 0.22).fillRect(w - 18, -wallH, 18, wallH + floorH);
  g.fillGradientStyle(0x3a2530, 0x3a2530, 0x3a2530, 0x3a2530, 0.14, 0.14, 0, 0).fillRect(0, -wallH, w, 70);   // ceiling falloff
  // cut-away wall caps
  g.fillStyle(WALL_CAP, 1)
    .fillRect(-SHELL_MARGIN, -wallH - SHELL_MARGIN, SHELL_MARGIN, wallH + floorH + SHELL_MARGIN * 2)
    .fillRect(w, -wallH - SHELL_MARGIN, SHELL_MARGIN, wallH + floorH + SHELL_MARGIN * 2)
    .fillRect(-SHELL_MARGIN, -wallH - SHELL_MARGIN, w + SHELL_MARGIN * 2, SHELL_MARGIN)
    .fillRect(-SHELL_MARGIN, floorH, w + SHELL_MARGIN * 2, SHELL_MARGIN);
  g.fillStyle(0xfff0f5, 0.18).fillRect(-3, -wallH, 3, wallH + floorH).fillRect(w, -wallH, 3, wallH + floorH).fillRect(0, floorH, w, 2.5);
  for (const d of room.doors) {
    if (d.y <= 10) continue;
    g.fillStyle(0xb98a5e, 1).fillRect(d.x, floorH - 1, d.w, SHELL_MARGIN + 1);
    g.fillStyle(0x5b3a29, 1).fillRect(d.x - 4, floorH, 4, SHELL_MARGIN).fillRect(d.x + d.w, floorH, 4, SHELL_MARGIN);
    g.fillStyle(0xc0607e, 1).fillRoundedRect(d.x + 12, floorH - 26, d.w - 24, 20, 4);
    g.lineStyle(1, 0xfff0f5, 0.6).strokeRoundedRect(d.x + 15, floorH - 23.5, d.w - 30, 15, 3);
  }
  return { floor: { id: ids.floor, art: floorTile.art }, wall: { id: ids.wall, art: wallTile.art } };
}

/**
 * Fill a w×h render-unit rectangle with tile quads. Plain Images sharing one texture are batched by the
 * renderer into a single draw; edge tiles are cropped so nothing spills past the room.
 * (Not a Blitter: Phaser 4's Blitter ignores the object's scale when rendering, which broke HD tiles.)
 */
function tileQuads(scene: Phaser.Scene, key: string, tw: number, th: number, x: number, y: number, w: number, h: number, scale: number): number {
  const wPx = w / scale, hPx = h / scale;
  let n = 0;
  for (let py = 0; py < hPx - 0.01; py += th) {
    for (let px = 0; px < wPx - 0.01; px += tw) {
      const img = scene.add.image(x + px * scale, y + py * scale, key).setOrigin(0, 0).setScale(scale).setDepth(-100000).setName('shell-tile');
      const fw = Math.min(tw, wPx - px), fh = Math.min(th, hPx - py);
      if (fw < tw || fh < th) img.setCrop(0, 0, Math.ceil(fw), Math.ceil(fh));
      n++;
    }
  }
  return n;
}

interface TileTex { key: string; art: 'approved' | 'temp'; w: number; h: number; density: number }

function resolveTile(scene: Phaser.Scene, spec: EnvironmentSpec, manifest: AssetManifest, room: RoomData, density: number): TileTex {
  const approved = textureKey(spec.id);
  if (manifest.assets[spec.id]?.status === 'approved' && scene.textures.exists(approved)) {
    const src = scene.textures.get(approved).getSourceImage() as { width: number; height: number };
    return { key: approved, art: 'approved', w: src.width, h: src.height, density: (src.width / spec.canvas.width) * spec.density };
  }
  // TEMP tile at the device's runtime density (no minification on low-res screens).
  const k = density / spec.density;
  const w = Math.round(spec.canvas.width * k), h = Math.round(spec.canvas.height * k);
  const key = `temp:${spec.id}@${density}`;
  if (!scene.textures.exists(key)) {
    const c = scene.textures.createCanvas(key, w, h)!;
    const ctx = c.getContext();
    ctx.scale(w / spec.canvas.width, h / spec.canvas.height);
    if (spec.kind === 'floor-tile') drawPlanks(ctx, spec, room); else drawWallStrip(ctx, spec, room);
    c.refresh();
  }
  return { key, art: 'temp', w, h, density };
}

// ---------- TEMP seamless tiles (drawn in tile pixels at spec density) ----------
function tone(hex: string, f: number, a = 1): string {
  const n = parseInt(hex.replace('#', ''), 16), r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
  const m = (v: number) => Math.round(f >= 1 ? v + (255 - v) * (f - 1) : v * f);
  return `rgba(${m(r)},${m(gg)},${m(b)},${a})`;
}

/** Seamless planks: every joint and grain mark is drawn with horizontal wrap-around. */
export function drawPlanks(ctx: CanvasRenderingContext2D, spec: EnvironmentSpec, room: RoomData): void {
  const W = spec.canvas.width, H = spec.canvas.height, d = spec.density;
  const base = String(spec.temp?.base ?? room.palette.floor);
  const rowH = Number(spec.temp?.plankCm ?? 15) * K * d;
  const rows = Math.round(H / rowH);
  let seed = 11;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const wrapRect = (x: number, y: number, w: number, h: number) => { ctx.fillRect(x, y, w, h); if (x + w > W) ctx.fillRect(x - W, y, w, h); if (x < 0) ctx.fillRect(x + W, y, w, h); };
  for (let r = 0; r < rows; r++) {
    const y = r * rowH, joint = Math.floor(rnd() * W);
    // two plank segments per row (one joint inside the tile, plus the wrap): distinct tones
    const f1 = 0.94 + rnd() * 0.1, f2 = 0.94 + rnd() * 0.1;
    ctx.fillStyle = tone(base, f1); wrapRect(joint, y, W / 2, rowH + 0.5);
    ctx.fillStyle = tone(base, f2); wrapRect(joint + W / 2, y, W / 2, rowH + 0.5);
    for (let g = 0; g < 5; g++) { ctx.fillStyle = tone(base, 0.9, 0.45); wrapRect(Math.floor(rnd() * W), y + 2 + rnd() * (rowH - 4), 20 + rnd() * 40, 1.2); }
    ctx.fillStyle = tone(base, 0.75, 0.8);
    wrapRect(joint, y, 1.5, rowH); wrapRect(joint + W / 2, y, 1.5, rowH);
    ctx.fillRect(0, y, W, 1.5);                                         // seam between rows
  }
}

/** Seamless wall strip (repeats in x): wallpaper stripes/dots, wainscot panel, rails, skirting, crown. */
export function drawWallStrip(ctx: CanvasRenderingContext2D, spec: EnvironmentSpec, room: RoomData): void {
  const W = spec.canvas.width, H = spec.canvas.height, s = H / (spec.tile.heightCm ?? 270);
  const pal = room.palette as RoomData['palette'] & { wainscot?: string };
  const wall = String(spec.temp?.wall ?? pal.wall), wc = String(spec.temp?.wainscot ?? pal.wainscot ?? '#F6EBDD'), trim = String(spec.temp?.trim ?? pal.trim);
  const yAt = (cm: number) => H - cm * s;
  const b = spec.bandsCm ?? { skirting: [0, 12], wainscot: [12, 90], chairRail: [88, 92], wallpaper: [92, 264], crown: [264, 270] };
  // wallpaper
  const gr = ctx.createLinearGradient(0, yAt(270), 0, yAt(92)); gr.addColorStop(0, tone(wall, 1.06)); gr.addColorStop(1, tone(wall, 0.97));
  ctx.fillStyle = gr; ctx.fillRect(0, yAt(b.wallpaper![1]), W, (b.wallpaper![1] - b.wallpaper![0]) * s);
  const period = W / 3;                                                  // 3 stripes per strip → seamless
  ctx.fillStyle = tone(wall, 0.93, 0.55);
  for (let i = 0; i < 3; i++) ctx.fillRect(i * period + period * 0.1, yAt(264), 3 * s, (264 - 92) * s);
  ctx.fillStyle = tone(wall, 1.12, 0.6);
  for (let i = 0; i < 3; i++) for (let cm = 100, k = 0; cm < 258; cm += 14, k++) { ctx.beginPath(); ctx.arc(i * period + period * 0.6, yAt(cm + (k % 2) * 7), 1.1 * s, 0, Math.PI * 2); ctx.fill(); }
  // wainscot with one centred panel per strip
  ctx.fillStyle = tone(wc, 0.98); ctx.fillRect(0, yAt(b.wainscot![1]), W, (b.wainscot![1] - b.wainscot![0]) * s);
  ctx.strokeStyle = tone(wc, 0.86); ctx.lineWidth = 1 * s;
  ctx.strokeRect(5 * s, yAt(76), W - 10 * s, 54 * s);
  ctx.fillStyle = tone(wc, 1.06, 0.6); ctx.fillRect(5 * s, yAt(76), W - 10 * s, 1 * s);
  // rails, skirting, crown
  ctx.fillStyle = tone(trim, 1.05); ctx.fillRect(0, yAt(b.chairRail![1]), W, (b.chairRail![1] - b.chairRail![0]) * s);
  ctx.fillStyle = tone(trim, 0.95); ctx.fillRect(0, yAt(b.skirting![1]), W, (b.skirting![1] - b.skirting![0]) * s);
  ctx.fillStyle = tone(trim, 1.3); ctx.fillRect(0, yAt(b.skirting![1]), W, 1.5 * s);
  ctx.fillStyle = tone(trim, 0.9); ctx.fillRect(0, yAt(b.crown![1]), W, (b.crown![1] - b.crown![0]) * s);
}
