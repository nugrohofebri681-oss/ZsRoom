import * as Phaser from 'phaser';
import { groundToRender } from '../core/projection';
import { propTopCm, type CharacterSpec, type PropSpec } from '../core/specs';

/**
 * GREY-BOX ONLY. These shapes are engineering stand-ins that show footprint, height and pivot so
 * collision/sorting can be tested before artwork exists. They are deliberately plain and labelled,
 * and are never shipped as artwork (see ART_BIBLE §0).
 */
export function drawGreyboxProp(scene: Phaser.Scene, spec: PropSpec, x: number, y: number, label: string): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0);
  const g = scene.add.graphics();
  const w = spec.footprint.widthCm;
  const d = spec.footprint.depthCm;
  // A prop may declare a main body height (mattressTop/top) plus a taller back slab (headboardTop/back).
  const top = spec.heightsCm.mattressTop ?? spec.heightsCm.top ?? propTopCm(spec);
  const backSlab = spec.heightsCm.headboardTop ?? spec.heightsCm.back;
  const x0 = x - w / 2;
  const front = groundToRender(x, y).y;
  const back = groundToRender(x, y - d).y;
  // footprint on the floor
  g.fillStyle(0x000000, 0.18).fillRect(x0 - 2, back, w + 4, front - back + 3);
  // body: top face at `top` height + front face
  const topFront = front - top;
  const topBack = back - top;
  g.fillStyle(0x9aa0a8, 1).fillRect(x0, topBack, w, topFront - topBack);       // top face
  g.fillStyle(0x6e747c, 1).fillRect(x0, topFront, w, front - topFront);        // front face
  g.lineStyle(1.2, 0x2d3036, 1).strokeRect(x0, topBack, w, front - topBack);
  g.lineStyle(1, 0x2d3036, 0.6).lineBetween(x0, topFront, x0 + w, topFront);
  if (backSlab && backSlab > top) {
    const slabDepth = 8 * 0.7;
    g.fillStyle(0x80868e, 1).fillRect(x0, back - backSlab, w, backSlab - top + slabDepth);
    g.lineStyle(1.2, 0x2d3036, 1).strokeRect(x0, back - backSlab, w, backSlab - top + slabDepth);
  }
  // pivot marker
  g.lineStyle(1.5, 0xff3d7f, 1).lineBetween(x - 5, front, x + 5, front).lineBetween(x, front - 5, x, front + 5);
  const t = scene.add.text(x, (topBack + front) / 2, `GREY-BOX\n${label}`, {
    fontFamily: 'system-ui, sans-serif', fontSize: '9px', color: '#1d1418', align: 'center',
  }).setOrigin(0.5).setResolution(3);
  c.add([g, t]);
  return c;
}

export function drawGreyboxCharacter(scene: Phaser.Scene, spec: CharacterSpec): { root: Phaser.GameObjects.Container; facing: Phaser.GameObjects.Graphics } {
  const root = scene.add.container(0, 0);
  const h = spec.heightCm;
  const r = spec.collision.radiusCm;
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.22).fillEllipse(0, 0, r * 2.4, r * 2.4 * 0.7);
  g.fillStyle(0xd9a5b6, 1).fillRoundedRect(-r, -h * 0.78, r * 2, h * 0.78, r * 0.9); // body capsule
  g.fillStyle(0xf1d2c2, 1).fillCircle(0, -h * 0.86, h * 0.1);                       // head
  g.lineStyle(1.2, 0x3a2530, 1).strokeRoundedRect(-r, -h * 0.78, r * 2, h * 0.78, r * 0.9).strokeCircle(0, -h * 0.86, h * 0.1);
  const facing = scene.add.graphics();
  facing.fillStyle(0xff3d7f, 1).fillTriangle(r * 1.6, 0, r * 0.9, -5, r * 0.9, 5);
  const t = scene.add.text(0, -h - 8, `${spec.displayName} · grey-box ${h}cm`, {
    fontFamily: 'system-ui, sans-serif', fontSize: '9px', color: '#fff4f7', backgroundColor: '#3a2530aa', padding: { x: 3, y: 1 },
  }).setOrigin(0.5, 1).setResolution(3);
  root.add([g, facing, t]);
  return { root, facing };
}
