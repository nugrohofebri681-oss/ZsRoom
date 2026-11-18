import * as Phaser from 'phaser';
import { groundToRender, DEPTH_SCALE } from '../core/projection';
import type { LightSpec } from '../core/specs';

/**
 * Engine-rendered lights (Art Bible §7: emission and illumination are never painted into props).
 * Each light = a small bright core at the emitter + a large soft warm pool on the floor plane, both
 * additive. One shared radial-gradient texture is generated once; cost is two sprites per light,
 * which is cheap enough for budget Android.
 */
const TEX = 'fx:radial';
const TEX_SIZE = 256;

function ensureTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX)) return;
  const canvas = scene.textures.createCanvas(TEX, TEX_SIZE, TEX_SIZE)!;
  const ctx = canvas.getContext();
  const g = ctx.createRadialGradient(TEX_SIZE / 2, TEX_SIZE / 2, 0, TEX_SIZE / 2, TEX_SIZE / 2, TEX_SIZE / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
  canvas.refresh();
}

export class PropLight {
  private core: Phaser.GameObjects.Image;
  private pool: Phaser.GameObjects.Image;
  on: boolean;

  constructor(scene: Phaser.Scene, readonly key: string, spec: LightSpec, x: number, y: number, z: number, initiallyOn?: boolean) {
    ensureTexture(scene);
    const color = Phaser.Display.Color.HexStringToColor(spec.color).color;
    const e = groundToRender(x + spec.emitter.x, y + spec.emitter.y, z + spec.emitter.z);
    // Pool: centred on the floor below the emitter, flattened by the floor projection.
    const floor = groundToRender(x + spec.emitter.x, y + spec.emitter.y + 40, 0);
    const d = (spec.radiusCm * 2) / TEX_SIZE;
    this.pool = scene.add.image(floor.x, floor.y, TEX).setTint(color).setBlendMode(Phaser.BlendModes.ADD)
      .setScale(d, d * DEPTH_SCALE * 1.15).setAlpha(spec.intensity).setDepth(90000);
    this.core = scene.add.image(e.x, e.y, TEX).setTint(color).setBlendMode(Phaser.BlendModes.ADD)
      .setScale(60 / TEX_SIZE).setAlpha(0.85).setDepth(90001);
    this.on = initiallyOn ?? spec.defaultOn;
    this.apply();
  }

  toggle(): boolean { this.on = !this.on; this.apply(); return this.on; }
  private apply(): void { this.core.setVisible(this.on); this.pool.setVisible(this.on); }
}
