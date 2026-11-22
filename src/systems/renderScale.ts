import type * as Phaser from 'phaser';
import { MAX_RENDER_DPR } from '../core/display';

/**
 * Adaptive render resolution.
 * Measured (headless, fill-bound proxy, emulated Android): street 12.3 → 20.0 → 39.7 fps at render scale 2 → 1.5 → 1.
 * Budget GPUs are fill-limited too, so when frames are consistently slow the canvas backing store is rendered
 * at a lower scale (CSS size unchanged; HD art is simply sampled down). Steps DOWN only, at most one step per
 * evaluation, after two consecutive slow windows; never oscillates within a session.
 * Player setting: auto (default) / sharp (native, ≤2×) / smooth (1×). Remembered per device.
 */
export type QualityMode = 'auto' | 'sharp' | 'smooth';
export const QUALITY_KEY = 'zsroom.quality';
export const SCALE_STEPS = [2, 1.75, 1.5, 1.25, 1] as const;
export const SLOW_FPS = 40;          // median below this for a window = slow
const WINDOW_MS = 2000, WARMUP_MS = 2500;

/** Pure policy: the next render scale after `slowWindows` consecutive slow windows at `current`. */
export function nextScale(current: number, slowWindows: number): number {
  if (slowWindows < 2) return current;
  const lower = SCALE_STEPS.find((s) => s < current - 0.01);
  return lower ?? current;
}

export function median(xs: number[]): number { const a = [...xs].sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)]! : 0; }

interface Store { getItem(k: string): string | null; setItem(k: string, v: string): void }

export class RenderScaleController {
  mode: QualityMode;
  scale: number;
  readonly native: number;
  /** For tests / the bench overlay. */
  readonly history: { at: number; from: number; to: number; fps: number; map: string }[] = [];
  private frames: number[] = [];
  private windowStart = 0;
  private slowWindows = 0;
  private settleUntil = 0;
  private map = '';

  constructor(private game: Phaser.Game, native: number, private store: Store | null, private autoEnabled = true) {
    this.native = Math.min(native, MAX_RENDER_DPR);
    let saved: { mode?: QualityMode; autoScale?: number } = {};
    try { saved = JSON.parse(store?.getItem(QUALITY_KEY) ?? '{}'); } catch { /* corrupt → defaults */ }
    this.mode = saved.mode === 'sharp' || saved.mode === 'smooth' ? saved.mode : 'auto';
    const remembered = typeof saved.autoScale === 'number' && saved.autoScale >= 1 && saved.autoScale <= this.native ? saved.autoScale : this.native;
    this.scale = this.mode === 'sharp' ? this.native : this.mode === 'smooth' ? 1 : remembered;
    game.events.on('room-entered', (r: { id: string }) => { this.map = r.id; this.reset(); });
    game.events.on('poststep', () => this.sample());
  }

  private reset(): void { this.frames = []; this.slowWindows = 0; this.windowStart = performance.now(); this.settleUntil = this.windowStart + WARMUP_MS; }

  private sample(): void {
    if (this.mode !== 'auto' || !this.autoEnabled) return;
    const now = performance.now();
    if (now < this.settleUntil) { this.windowStart = now; return; }
    const dt = this.game.loop.rawDelta;
    if (dt > 0 && dt < 500) this.frames.push(1000 / dt);
    if (now - this.windowStart < WINDOW_MS) return;
    const fps = median(this.frames);
    this.frames = []; this.windowStart = now;
    this.slowWindows = fps < SLOW_FPS ? this.slowWindows + 1 : 0;
    const next = nextScale(this.scale, this.slowWindows);
    if (next !== this.scale) {
      this.history.push({ at: Math.round(now), from: this.scale, to: next, fps: Math.round(fps), map: this.map });
      this.apply(next);
      this.slowWindows = 0; this.settleUntil = now + WARMUP_MS;   // let the new scale settle before judging again
      this.persist();
    }
  }

  setMode(mode: QualityMode): void {
    this.mode = mode;
    this.apply(mode === 'sharp' ? this.native : mode === 'smooth' ? 1 : this.native);
    this.reset(); this.persist();
  }

  apply(scale: number): void {
    this.scale = scale;
    const g = this.game;
    g.scale.setZoom(1 / scale);
    this.resizeToWindow();
    g.registry.set('dpr', scale);
    g.events.emit('dpr-changed', scale);
  }

  /**
   * Backing store = window CSS size × scale; the canvas is always shown at the window's CSS size. The CSS size is set
   * explicitly: when the scale steps down to exactly 1 the scale manager kept the previous (larger) CSS size, which
   * cropped the picture and pushed the right-hand HUD (clock, zoom, sound, E button) off-screen on slow phones.
   */
  resizeToWindow(): void {
    const g = this.game, w = window.innerWidth, h = window.innerHeight;
    g.scale.resize(w * this.scale, h * this.scale);
    g.canvas.style.width = `${w}px`; g.canvas.style.height = `${h}px`;
    g.scale.updateBounds();
  }

  private persist(): void {
    try { this.store?.setItem(QUALITY_KEY, JSON.stringify({ mode: this.mode, autoScale: this.mode === 'auto' ? this.scale : undefined })); } catch { /* storage blocked */ }
  }
}
