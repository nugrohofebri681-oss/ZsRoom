import * as Phaser from 'phaser';
import type { NpcData } from '../world/npc';

/**
 * TEMPORARY NPC figure (no character art yet): one baked texture per NPC look, one sprite + one name tag.
 * Clearly labelled TEMP. Final NPC art plugs in through the same rig as Zila (Art Bible §9).
 */
const H = 165, W = 56;   // cm

export function ensureNpcTexture(scene: Phaser.Scene, n: NpcData, density: number): string {
  const key = `temp:npc:${n.id}@${density}`;
  if (scene.textures.exists(key)) return key;
  const d = density, tex = scene.textures.createCanvas(key, Math.ceil(W * d), Math.ceil((H + 8) * d))!, c = tex.getContext();
  const cx = (W / 2) * d, foot = H * d;
  const skin = n.look.skin ?? '#F1C9A5';
  const round = (x: number, y: number, w: number, h: number, r: number, fill: string) => { c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = fill; c.fill(); c.strokeStyle = 'rgba(58,37,48,0.45)'; c.lineWidth = 1; c.stroke(); };
  round(cx - 9 * d, foot - 72 * d, 7.5 * d, 70 * d, 3 * d, n.look.pants);                // legs
  round(cx + 1.5 * d, foot - 72 * d, 7.5 * d, 70 * d, 3 * d, n.look.pants);
  round(cx - 10 * d, foot - 4 * d, 9 * d, 5 * d, 2 * d, '#4A4250');                      // shoes
  round(cx + 1 * d, foot - 4 * d, 9 * d, 5 * d, 2 * d, '#4A4250');
  round(cx - 15 * d, foot - 130 * d, 30 * d, 62 * d, 8 * d, n.look.shirt);               // torso
  round(cx - 21 * d, foot - 126 * d, 7 * d, 48 * d, 3.5 * d, n.look.shirt);              // arms
  round(cx + 14 * d, foot - 126 * d, 7 * d, 48 * d, 3.5 * d, n.look.shirt);
  round(cx - 20 * d, foot - 80 * d, 6 * d, 8 * d, 3 * d, skin); round(cx + 14 * d, foot - 80 * d, 6 * d, 8 * d, 3 * d, skin);
  if (n.look.hijab) {
    round(cx - 14 * d, foot - 160 * d, 28 * d, 36 * d, 13 * d, n.look.hijab);
    round(cx - 9 * d, foot - 152 * d, 18 * d, 20 * d, 8 * d, skin);
  } else {
    round(cx - 11 * d, foot - 158 * d, 22 * d, 28 * d, 10 * d, skin);
    round(cx - 12 * d, foot - 162 * d, 24 * d, 12 * d, 6 * d, n.look.hair);
  }
  c.fillStyle = '#3A2530';
  c.beginPath(); c.arc(cx - 4 * d, foot - 142 * d, 1.4 * d, 0, Math.PI * 2); c.arc(cx + 4 * d, foot - 142 * d, 1.4 * d, 0, Math.PI * 2); c.fill();
  tex.refresh();
  return key;
}

export class NpcView {
  readonly sprite: Phaser.GameObjects.Image;
  readonly shadow: Phaser.GameObjects.Ellipse;
  readonly tag: Phaser.GameObjects.Text;
  constructor(scene: Phaser.Scene, n: NpcData, density: number) {
    this.shadow = scene.add.ellipse(0, 0, 34, 12, 0x3a2530, 0.22);
    this.sprite = scene.add.image(0, 0, ensureNpcTexture(scene, n, density)).setOrigin(0.5, H / (H + 8)).setScale(1 / density);
    this.tag = scene.add.text(0, 0, `${n.name} · TEMP`, { fontFamily: 'system-ui, sans-serif', fontSize: '8px', color: '#fff4f7', backgroundColor: '#3a2530aa', padding: { x: 3, y: 1 } })
      .setOrigin(0.5, 1).setResolution(3).setDepth(95000);
  }
  place(rx: number, ry: number, depth: number, bob: number, facingLeft: boolean): void {
    this.sprite.setPosition(rx, ry - bob).setDepth(depth).setFlipX(facingLeft);
    this.shadow.setPosition(rx, ry).setDepth(depth - 0.2);
    this.tag.setPosition(rx, ry - H - 6);
  }
  setVisible(v: boolean): void { this.sprite.setVisible(v); this.shadow.setVisible(v); this.tag.setVisible(v); }
  /** LOD (P6.1): stop drawing an NPC far outside the view without touching its presence (`visible`). Alpha 0 skips rendering. */
  setInView(v: boolean): void { const a = v ? 1 : 0; if (this.sprite.alpha !== a) { this.sprite.setAlpha(a); this.shadow.setAlpha(a); this.tag.setAlpha(a); } }
}
