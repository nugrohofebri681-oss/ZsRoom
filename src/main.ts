import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { RoomScene } from './scenes/RoomScene';
import { UIScene } from './scenes/UIScene';
import { renderDpr } from './core/display';

const DPR = renderDpr();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1d1418',
  scale: { mode: Phaser.Scale.NONE, width: window.innerWidth * DPR, height: window.innerHeight * DPR, zoom: 1 / DPR },
  render: { antialias: true, pixelArt: false, roundPixels: false, powerPreference: 'high-performance' },
  fps: { target: 60, min: 20 },
  input: { activePointers: 3 },
  scene: [BootScene, RoomScene, UIScene],
});

window.addEventListener('resize', () => game.scale.resize(window.innerWidth * DPR, window.innerHeight * DPR));
game.registry.set('dpr', DPR);
game.registry.set('safeArea', readSafeArea());

/** CSS safe-area insets (notches, rounded corners, gesture bars) in CSS px. */
function readSafeArea(): { top: number; right: number; bottom: number; left: number } {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const v = { top: parseFloat(cs.paddingTop) || 0, right: parseFloat(cs.paddingRight) || 0, bottom: parseFloat(cs.paddingBottom) || 0, left: parseFloat(cs.paddingLeft) || 0 };
  probe.remove();
  return v;
}

window.addEventListener('visibilitychange', () => {
  if (!document.hidden) return;
  (window as unknown as { __ZS?: { save?: () => void } }).__ZS?.save?.();
});

(window as unknown as { __ZS_GAME?: Phaser.Game }).__ZS_GAME = game;
