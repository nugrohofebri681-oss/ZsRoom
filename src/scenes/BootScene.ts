import * as Phaser from 'phaser';
import { pickDensityVariant, textureKey, type AssetManifest } from '../systems/manifest';
import { loadGame, safeStorage } from '../systems/save';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload(): void {
    this.load.json('manifest', 'assets/manifest.json');
  }

  create(): void {
    const manifest = this.cache.json.get('manifest') as AssetManifest;
    this.registry.set('manifest', manifest);
    const densities: Record<string, number> = {};
    const vpMax = Math.max(this.scale.width, this.scale.height);
    for (const [id, entry] of Object.entries(manifest.assets)) {
      if (entry.status !== 'approved' || !entry.runtime) continue;
      const variant = pickDensityVariant(window.devicePixelRatio || 1, vpMax, Object.keys(entry.runtime));
      const file = variant ? entry.runtime[variant] : undefined;
      if (!file) continue;
      this.load.image(textureKey(id), file.path);
      densities[id] = file.density;
    }
    this.registry.set('assetDensities', densities);
    this.load.once('complete', () => {
      const save = loadGame(safeStorage());
      const params = new URLSearchParams(location.search);
      const fresh = params.has('fresh');
      this.scene.start('Room', fresh || !save
        ? { roomId: params.get('room') ?? 'zila_bedroom', spawn: 'default' }
        : { roomId: save.roomId, at: { x: save.player.x, y: save.player.y, facing: save.player.facing } });
      this.scene.launch('UI');
      document.getElementById('boot')?.remove();
    });
    this.load.start();
  }
}
