import * as Phaser from 'phaser';
import type { Direction } from '../actors/direction';
import type { CharacterSpec } from '../core/specs';
import { idleFrame, resolveFacing, walkFrame, walkPhase, type RigSpec } from './rig';

/**
 * Layered character (Art Bible §9): one child per rig layer, so outfits swap without redrawing bodies
 * and W-side facings reuse mirrored E-side art (except non-mirrorable layers).
 *
 * Final art: each layer shows image frames `<char>:<layer>:<facing>:<anim>:<frame>` (to be delivered by
 * Codex after the character gates). Until then every layer draws a clearly-labelled TEMP vector shape;
 * a layer is only redrawn when (facing, anim, frame, outfit) changes.
 */
export interface OutfitColors { top: string; bottom: string }
export interface CharacterPose { facing: Direction; moving: boolean; distanceCm: number; timeMs: number; sitting: boolean; seatCm?: number }
export interface FrameInfo { anim: 'idle' | 'walk' | 'sit'; frame: number; authored: Direction; mirrored: boolean }

const SKIN = 0xf3d2c1, HAIR = 0x5a3424, HAIR_HI = 0x7a4a33, ORNAMENT = 0xe8a0b4, EYE = 0x4a2c22, BLUSH = 0xf2a7b6, LINE = 0x3a2530;

export class LayeredCharacter {
  readonly root: Phaser.GameObjects.Container;
  private layers = new Map<string, Phaser.GameObjects.Graphics>();
  private rig: RigSpec;
  private outfit: OutfitColors;
  private lastKey = '';
  private info: FrameInfo = { anim: 'idle', frame: 0, authored: 'S', mirrored: false };
  private label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, private spec: CharacterSpec & { rig?: RigSpec }, outfit: OutfitColors) {
    if (!spec.rig) throw new Error(`${spec.id} has no rig`);
    this.rig = spec.rig;
    this.outfit = outfit;
    this.root = scene.add.container(0, 0);
    for (const name of this.rig.layers) {
      const g = scene.add.graphics();
      this.layers.set(name, g);
      this.root.add(g);
    }
    this.label = scene.add.text(0, -spec.heightCm - 10, `${spec.displayName} · TEMP figure`, {
      fontFamily: 'system-ui, sans-serif', fontSize: '8px', color: '#fff4f7', backgroundColor: '#3a2530aa', padding: { x: 3, y: 1 },
    }).setOrigin(0.5, 1).setResolution(3);
    this.root.add(this.label);
  }

  setOutfit(o: OutfitColors): void { this.outfit = o; this.lastKey = ''; }
  frameInfo(): FrameInfo { return { ...this.info }; }

  update(p: CharacterPose): void {
    const anim: FrameInfo['anim'] = p.sitting ? 'sit' : p.moving ? 'walk' : 'idle';
    const frame = anim === 'walk' ? walkFrame(this.rig, p.distanceCm) : anim === 'idle' ? idleFrame(this.rig, p.timeMs) : 0;
    const { authored, mirrored } = resolveFacing(this.rig, p.facing);
    this.info = { anim, frame, authored, mirrored };
    const key = `${anim}:${frame}:${p.facing}:${this.outfit.top}:${this.outfit.bottom}`;
    if (key === this.lastKey) return;
    this.lastKey = key;
    const phase = anim === 'walk' ? walkPhase(this.rig, p.distanceCm) : 0;
    for (const [name, g] of this.layers) {
      g.clear();
      const ownArt = mirrored && !this.rig.mirrorableLayers.includes(name);
      g.setScale(mirrored && !ownArt ? -1 : 1, 1);
      drawTempLayer(g, name, ownArt ? p.facing : authored, anim, frame, phase, this.outfit, this.spec.heightCm, p.seatCm ?? 45);
    }
  }
}

// ---------------------------------------------------------------- TEMP vector figure (cm, feet at 0,0)
function view(f: Direction): 'front' | 'back' | 'side' | 'front3' | 'back3' {
  if (f === 'S') return 'front';
  if (f === 'N') return 'back';
  if (f === 'E' || f === 'W') return 'side';
  return f === 'SE' || f === 'SW' ? 'front3' : 'back3';
}

function drawTempLayer(g: Phaser.GameObjects.Graphics, layer: string, facing: Direction, anim: FrameInfo['anim'], frame: number, phase: number, o: OutfitColors, H: number, seat: number): void {
  const v = view(facing);
  const head = H / 4.6;                     // storybook proportion (draft)
  const sitDrop = anim === 'sit' ? Math.max(0, H * 0.47 - seat) : 0;
  const bob = anim === 'walk' ? -1.6 * Math.abs(Math.sin(phase * Math.PI * 2)) : anim === 'idle' ? -0.5 * (frame % 2) : 0;
  const y = (cm: number) => -(cm - sitDrop) + bob;    // height above floor → render y
  const swing = Math.sin(phase * Math.PI * 2);        // −1..1
  const hip = H * 0.47, shoulder = H * 0.78, headC = H - head / 2;
  const narrow = v === 'side' ? 0.62 : v === 'front3' || v === 'back3' ? 0.85 : 1;
  const top = Phaser.Display.Color.HexStringToColor(o.top).color, bottom = Phaser.Display.Color.HexStringToColor(o.bottom).color;
  const shade = (c: number, f: number) => { const r = ((c >> 16) & 255) * f, gg = ((c >> 8) & 255) * f, b = (c & 255) * f; return (Math.min(255, r) << 16) | (Math.min(255, gg) << 8) | Math.min(255, b); };

  switch (layer) {
    case 'shadow':
      g.fillStyle(0x2a1620, 0.25).fillEllipse(0, 0, 34, 12);
      break;
    case 'hairBack':
      if (v === 'back' || v === 'back3') break;     // seen from behind, the long hair is drawn in front (hairFront)
      g.fillStyle(HAIR, 1).fillRoundedRect(-17 * narrow, y(H + 1), 34 * narrow, head * 1.85, { tl: 15, tr: 15, bl: 6, br: 6 });
      break;
    case 'legs': {
      if (anim === 'sit') {
        if (v === 'front' || v === 'front3') { g.fillStyle(SKIN, 1).fillRoundedRect(-9, y(seat), 7, seat - 2, 3).fillRoundedRect(2, y(seat), 7, seat - 2, 3); g.fillStyle(0x8a5a3c, 1).fillEllipse(-5.5, -1, 9, 4).fillEllipse(5.5, -1, 9, 4); }
        break;
      }
      for (const side of [-1, 1]) {
        const lift = anim === 'walk' ? Math.max(0, side * swing) * 4 : 0;
        const fwd = anim === 'walk' && v === 'side' ? side * swing * 10 : 0;
        const x0 = v === 'side' ? fwd * 0.4 : side * 4.6 * narrow;
        g.fillStyle(SKIN, 1).fillRoundedRect(x0 - 3.4, y(hip - 6), 6.8, hip - 6 - lift, 3);
        g.fillStyle(0x8a5a3c, 1).fillEllipse(x0 + fwd * 0.6 + (v === 'side' ? 3 : 0), y(lift + 1.5), v === 'side' ? 11 : 8, 4.5);
      }
      break;
    }
    case 'outfitBottom': {
      const w0 = 26 * narrow, w1 = (anim === 'sit' ? 40 : 36) * narrow;
      const V = (x: number, yy: number) => new Phaser.Math.Vector2(x, yy);
      g.fillStyle(bottom, 1).fillPoints([V(-w0 / 2, y(hip + 14)), V(w0 / 2, y(hip + 14)), V(w1 / 2 + swing * 1.2, y(hip - 14)), V(-w1 / 2 + swing * 1.2, y(hip - 14))], true);
      g.lineStyle(1, shade(bottom, 0.8), 1).lineBetween(-w1 / 2 + 3, y(hip - 13), w1 / 2 - 3, y(hip - 13));
      break;
    }
    case 'body':
      g.fillStyle(SKIN, 1).fillRoundedRect(-3.5, y(shoulder + 8), 7, 9, 3);  // neck
      break;
    case 'outfitTop':
      g.fillStyle(top, 1).fillRoundedRect(-15 * narrow, y(shoulder + 1), 30 * narrow, shoulder - hip - 12, { tl: 9, tr: 9, bl: 4, br: 4 });
      g.fillStyle(shade(top, 1.15), 1).fillRoundedRect(-13 * narrow, y(shoulder), 9 * narrow, 10, 4);          // upper-left light
      if (v === 'front' || v === 'front3') g.fillStyle(0xffffff, 0.85).fillCircle(0, y(shoulder - 6), 1.6);   // little bow
      break;
    case 'arms':
      for (const side of [-1, 1]) {
        if (v === 'side' && side === 1) continue;
        const a = anim === 'walk' ? -side * swing * (v === 'side' ? 9 : 2.5) : 0;
        const x0 = v === 'side' ? a * 0.5 : side * 16.5 * narrow;
        g.fillStyle(top, 1).fillRoundedRect(x0 - 3.6, y(shoulder), 7.2, 14, 3.5);
        g.fillStyle(SKIN, 1).fillRoundedRect(x0 - 3 + a * 0.3, y(shoulder - 12), 6, 25, 3);
      }
      break;
    case 'head':
      g.fillStyle(SKIN, 1).fillEllipse(v === 'side' ? 2 : 0, y(headC), head * 0.82 * (v === 'side' ? 0.9 : 1), head);
      break;
    case 'face': {
      if (v === 'back' || v === 'back3') break;
      const ex = v === 'side' ? [6] : v === 'front3' ? [-3, 6] : [-5.5, 5.5];
      for (const x of ex) { g.fillStyle(EYE, 1).fillEllipse(x, y(headC - 1), 4, 5.2); g.fillStyle(0xffffff, 1).fillCircle(x - 0.8, y(headC), 0.9); }
      g.fillStyle(BLUSH, 0.6);
      for (const x of ex) g.fillEllipse(x + (x < 0 ? -1.5 : 1.5), y(headC - 5), 4.5, 2.2);
      g.lineStyle(1, LINE, 0.8).beginPath().arc(v === 'side' ? 7 : v === 'front3' ? 2 : 0, y(headC - 7), 2, 0.2, Math.PI - 0.2).strokePath();
      break;
    }
    case 'hairFront': {
      const ornament = (x: number) => { g.fillStyle(ORNAMENT, 1).fillCircle(x - 1.4, y(H - 6), 2.3).fillCircle(x + 1.4, y(H - 6), 2.3).fillCircle(x, y(H - 4), 2.3); g.fillStyle(0xffffff, 0.9).fillCircle(x, y(H - 5.3), 1); };
      if (v === 'back' || v === 'back3') {
        g.fillStyle(HAIR, 1).fillRoundedRect(-17 * narrow, y(H + 1), 34 * narrow, head * 1.95, { tl: 16, tr: 16, bl: 8, br: 8 });
        g.lineStyle(1, HAIR_HI, 0.9);
        for (const x of [-8, 0, 8]) g.lineBetween(x * narrow, y(H - 4), x * narrow * 1.1, y(H - head * 1.7));
        ornament(-13 * narrow); ornament(13 * narrow);
        break;
      }
      if (v === 'side') {
        g.fillStyle(HAIR, 1).fillRoundedRect(-11, y(H + 1), 22, 12, 7).fillRoundedRect(-12, y(H - 4), 10, head * 1.3, 5);
        ornament(-6);
        break;
      }
      g.fillStyle(HAIR, 1).fillRoundedRect(-15 * narrow, y(H + 1), 30 * narrow, 11, { tl: 13, tr: 13, bl: 2, br: 2 });   // bangs
      g.fillStyle(HAIR, 1).fillRoundedRect(-17 * narrow, y(H - 6), 6, head * 0.95, 3).fillRoundedRect(11 * narrow, y(H - 6), 6, head * 0.95, 3); // face framing
      g.fillStyle(HAIR_HI, 1).fillRoundedRect(-9 * narrow, y(H - 1), 8, 3, 1.5);
      ornament(-14 * narrow); ornament(14 * narrow);
      break;
    }
    case 'accessory':
      break;
  }
}
