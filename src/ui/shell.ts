import * as Phaser from 'phaser';
import { DEPTH_SCALE as K } from '../core/projection';
import type { RoomData } from '../world/room';

/**
 * TEMPORARY room shell (floor, back wall, trims, wall caps, doorway) drawn once into a texture.
 * Replaced by environment tiles (Batch E) when approved. Coordinates: render units (cm) × `scale`.
 */
export const SHELL_MARGIN = 20;   // cm of dark wall cap around the room
const WALL_CAP = '#3A2530';

export interface ShellTexture { key: string; scale: number; originX: number; originY: number; widthCm: number; heightCm: number }

function hex(c: string): [number, number, number] { const n = parseInt(c.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function tone(c: string, f: number, a = 1): string {
  const [r, g, b] = hex(c);
  const m = (v: number) => Math.round(f >= 1 ? v + (255 - v) * (f - 1) : v * f);
  return `rgba(${m(r)},${m(g)},${m(b)},${a})`;
}

export function buildShellTexture(scene: Phaser.Scene, room: RoomData, scale: number): ShellTexture {
  const key = `shell:${room.id}@${scale}`;
  const { w, h } = room.sizeCm;
  const wallH = room.wallHeightCm;
  const floorH = h * K;
  const widthCm = w + SHELL_MARGIN * 2;
  const heightCm = wallH + floorH + SHELL_MARGIN * 2;
  const tex: ShellTexture = { key, scale, originX: -SHELL_MARGIN, originY: -wallH - SHELL_MARGIN, widthCm, heightCm };
  if (scene.textures.exists(key)) return tex;
  const canvas = scene.textures.createCanvas(key, Math.ceil(widthCm * scale), Math.ceil(heightCm * scale))!;
  const ctx = canvas.getContext();
  ctx.scale(scale, scale);
  ctx.translate(SHELL_MARGIN, wallH + SHELL_MARGIN); // origin = room's north-west floor corner (render y = 0 at the wall base)
  const pal = room.palette as RoomData['palette'] & { wainscot?: string };

  // ---- back wall: wallpaper above a wainscot ----
  const wainscot = 90;
  const wg = ctx.createLinearGradient(0, -wallH, 0, -wainscot);
  wg.addColorStop(0, tone(pal.wall, 1.06)); wg.addColorStop(1, tone(pal.wall, 0.97));
  ctx.fillStyle = wg; ctx.fillRect(0, -wallH, w, wallH - wainscot);
  ctx.fillStyle = tone(pal.wall, 0.93, 0.55);
  for (let x = 6; x < w; x += 24) ctx.fillRect(x, -wallH, 3, wallH - wainscot);            // soft stripes
  ctx.fillStyle = tone(pal.wall, 1.12, 0.6);
  for (let x = 18; x < w; x += 24) for (let y = -wallH + 14; y < -wainscot - 6; y += 28) {   // tiny dotted motif
    ctx.beginPath(); ctx.arc(x, y + ((x / 24) % 2) * 14, 1.1, 0, Math.PI * 2); ctx.fill();
  }
  const wc = pal.wainscot ?? '#F6EBDD';
  ctx.fillStyle = tone(wc, 0.98); ctx.fillRect(0, -wainscot, w, wainscot);
  ctx.strokeStyle = tone(wc, 0.86); ctx.lineWidth = 1;
  for (let x = 10; x + 60 < w; x += 70) { ctx.strokeRect(x, -wainscot + 14, 60, wainscot - 32); }
  ctx.fillStyle = tone(pal.trim, 1.05); ctx.fillRect(0, -wainscot - 3, w, 4);                  // chair rail
  ctx.fillStyle = tone(pal.trim, 0.95); ctx.fillRect(0, -12, w, 12);                             // skirting
  ctx.fillStyle = tone(pal.trim, 1.3); ctx.fillRect(0, -12, w, 1.5);
  ctx.fillStyle = tone(pal.trim, 0.9); ctx.fillRect(0, -wallH, w, 6);                            // crown
  const wallShade = ctx.createLinearGradient(0, -wallH, 0, 0);                                   // ceiling falloff
  wallShade.addColorStop(0, 'rgba(58,37,48,0.12)'); wallShade.addColorStop(0.3, 'rgba(58,37,48,0)');
  ctx.fillStyle = wallShade; ctx.fillRect(0, -wallH, w, wallH);

  // ---- floor: honey planks running east–west ----
  const plankDepth = 15 * K, plankLen = 120;
  let seed = 11;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let row = 0, y = 0; y < floorH; row++, y += plankDepth) {
    let x = -((row * 47) % plankLen);
    while (x < w) {
      const f = 0.94 + rnd() * 0.1;
      ctx.fillStyle = tone(pal.floor, f);
      ctx.fillRect(x, y, plankLen, plankDepth);
      ctx.fillStyle = tone(pal.floor, f * 0.97, 0.5);                                              // grain
      for (let g = 0; g < 2; g++) ctx.fillRect(x + 8 + rnd() * 90, y + 2 + rnd() * (plankDepth - 4), 14 + rnd() * 22, 0.6);
      ctx.fillStyle = tone(pal.floor, 0.78, 0.8); ctx.fillRect(x, y, 0.8, plankDepth);              // butt joint
      x += plankLen;
    }
    ctx.fillStyle = tone(pal.floor, 0.8, 0.7); ctx.fillRect(0, y, w, 0.8);                         // seam
  }
  // ambient occlusion where the floor meets the walls
  const ao = ctx.createLinearGradient(0, 0, 0, 24);
  ao.addColorStop(0, 'rgba(58,37,48,0.28)'); ao.addColorStop(1, 'rgba(58,37,48,0)');
  ctx.fillStyle = ao; ctx.fillRect(0, 0, w, 24);
  for (const side of [0, 1]) {
    const g = ctx.createLinearGradient(side ? w : 0, 0, side ? w - 18 : 18, 0);
    g.addColorStop(0, 'rgba(58,37,48,0.22)'); g.addColorStop(1, 'rgba(58,37,48,0)');
    ctx.fillStyle = g; ctx.fillRect(side ? w - 18 : 0, -wallH, 18, wallH + floorH);
  }

  // ---- wall caps (cut-away walls) and doorway ----
  ctx.fillStyle = WALL_CAP;
  ctx.fillRect(-SHELL_MARGIN, -wallH - SHELL_MARGIN, SHELL_MARGIN, wallH + floorH + SHELL_MARGIN * 2);
  ctx.fillRect(w, -wallH - SHELL_MARGIN, SHELL_MARGIN, wallH + floorH + SHELL_MARGIN * 2);
  ctx.fillRect(-SHELL_MARGIN, -wallH - SHELL_MARGIN, w + SHELL_MARGIN * 2, SHELL_MARGIN);
  ctx.fillRect(-SHELL_MARGIN, floorH, w + SHELL_MARGIN * 2, SHELL_MARGIN);
  ctx.fillStyle = 'rgba(255,240,245,0.18)';
  ctx.fillRect(-3, -wallH, 3, wallH + floorH); ctx.fillRect(w, -wallH, 3, wallH + floorH); ctx.fillRect(0, floorH, w, 2.5);
  for (const d of room.doors) {
    if (d.y <= 10) continue; // north doors are drawn as wall doors by the scene
    ctx.fillStyle = tone(pal.floor, 0.9); ctx.fillRect(d.x, floorH - 1, d.w, SHELL_MARGIN + 1);       // threshold
    ctx.fillStyle = tone(pal.trim, 0.9); ctx.fillRect(d.x - 4, floorH, 4, SHELL_MARGIN); ctx.fillRect(d.x + d.w, floorH, 4, SHELL_MARGIN);
    const mx = d.x + 12, my = floorH - 26, mw = d.w - 24, mh = 20;                                      // doormat
    ctx.fillStyle = '#C0607E'; ctx.beginPath(); ctx.roundRect(mx, my, mw, mh, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(255,240,245,0.6)'; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.roundRect(mx + 3, my + 2.5, mw - 6, mh - 5, 3); ctx.stroke(); ctx.setLineDash([]);
  }
  canvas.refresh();
  return tex;
}
