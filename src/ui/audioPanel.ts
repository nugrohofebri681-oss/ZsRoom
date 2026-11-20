import * as Phaser from 'phaser';
import { audio } from '../audio/audio';
import type { AudioPrefs } from '../audio/prefs';

type SliderKey = 'master' | 'ambience' | 'sfx';
const SLIDERS: { key: SliderKey; label: string }[] = [
  { key: 'master', label: 'Volume' }, { key: 'ambience', label: 'Room' }, { key: 'sfx', label: 'Effects' },
];
const W = 236, ROW = 46, TRACK_X = 84, TRACK_W = 110, BTN_R = 21;
const PINK = 0xe8a0b4, CREAM = 0xfff4f7, PLUM = 0x2a1c22;

/**
 * Speaker button + sound panel (screen space, CSS px). Big targets (≥ 44 px rows) for thumbs.
 * Owns its own pointer handling via handleDown/Move/Up so the UI scene can route touches before the
 * world joystick/tap logic. Values persist on release only (no storage write per drag frame).
 */
export class AudioPanel {
  readonly button: Phaser.GameObjects.Container;
  readonly panel: Phaser.GameObjects.Container;
  private icon: Phaser.GameObjects.Graphics;
  private bg: Phaser.GameObjects.Graphics;
  private muteTx: Phaser.GameObjects.Text;
  private knobs = new Map<SliderKey, { fill: Phaser.GameObjects.Graphics; knob: Phaser.GameObjects.Arc; value: Phaser.GameObjects.Text }>();
  private dragging: SliderKey | null = null;
  open = false;

  constructor(private scene: Phaser.Scene, dpr: number) {
    const style = { fontFamily: 'system-ui, sans-serif', color: '#fff4f7', resolution: dpr };
    const disc = scene.add.circle(0, 0, BTN_R, 0x3a2530, 0.8).setStrokeStyle(1.5, 0xf3d9e1, 0.6);
    this.icon = scene.add.graphics();
    this.button = scene.add.container(0, 0, [disc, this.icon]).setDepth(20);

    this.bg = scene.add.graphics();
    const title = scene.add.text(16, 12, 'Sound', { ...style, fontSize: '14px', fontStyle: 'bold', color: '#ffe3ec' });
    this.muteTx = scene.add.text(W - 16, 10, '', { ...style, fontSize: '13px', backgroundColor: '#c0607ee6', padding: { x: 10, y: 5 } }).setOrigin(1, 0);
    const items: Phaser.GameObjects.GameObject[] = [this.bg, title, this.muteTx];
    SLIDERS.forEach((s, i) => {
      const y = 62 + i * ROW;
      items.push(scene.add.text(16, y, s.label, { ...style, fontSize: '13px', color: '#f3d9e1' }).setOrigin(0, 0.5));
      const track = scene.add.graphics().fillStyle(0xffffff, 0.16).fillRoundedRect(TRACK_X, y - 3, TRACK_W, 6, 3);
      const fill = scene.add.graphics();
      const knob = scene.add.circle(TRACK_X, y, 10, CREAM, 1).setStrokeStyle(2, PINK, 1);
      const value = scene.add.text(W - 12, y, '', { ...style, fontSize: '10px', color: '#f3d9e1' }).setOrigin(1, 0.5);
      items.push(track, fill, knob, value);
      this.knobs.set(s.key, { fill, knob, value });
    });
    this.panel = scene.add.container(0, 0, items).setDepth(21).setVisible(false);
    this.bg.fillStyle(PLUM, 0.95).fillRoundedRect(0, 0, W, this.height, 14).lineStyle(1.5, PINK, 0.85).strokeRoundedRect(0, 0, W, this.height, 14);
    this.refresh();
  }

  get height(): number { return 62 + SLIDERS.length * ROW - 12; }

  layout(buttonX: number, buttonY: number): void {
    this.button.setPosition(buttonX, buttonY);
    this.panel.setPosition(buttonX + BTN_R - W, buttonY + BTN_R + 8);
  }

  setOpen(open: boolean): void { this.open = open; this.panel.setVisible(open); this.dragging = null; this.refresh(); }

  refresh(): void {
    const p = audio().prefs;
    this.drawIcon(p.muted);
    this.muteTx.setText(p.muted ? 'Unmute' : 'Mute');
    SLIDERS.forEach((s, i) => {
      const y = 62 + i * ROW, v = p[s.key], k = this.knobs.get(s.key)!;
      k.fill.clear().fillStyle(p.muted ? 0x9a8890 : PINK, 1).fillRoundedRect(TRACK_X, y - 3, Math.max(6, TRACK_W * v), 6, 3);
      k.knob.setPosition(TRACK_X + TRACK_W * v, y).setFillStyle(p.muted ? 0xcfc3c8 : CREAM, 1);
      k.value.setText(`${Math.round(v * 100)}`);
    });
  }

  private drawIcon(muted: boolean): void {
    const g = this.icon.clear();
    g.fillStyle(CREAM, 1).fillRect(-9, -4, 5, 8).fillTriangle(-4, -4, 3, -10, 3, 10).fillTriangle(-4, -4, -4, 4, 3, 10);
    if (muted) {
      g.lineStyle(2.2, PINK, 1).lineBetween(6, -5, 13, 5).lineBetween(13, -5, 6, 5);
    } else {
      g.lineStyle(2, CREAM, 1);
      g.beginPath(); g.arc(4, 0, 6, -0.9, 0.9); g.strokePath();
      g.beginPath(); g.arc(4, 0, 11, -0.85, 0.85); g.strokePath();
    }
  }

  // ---------------------------------------------------------------- input (CSS px)
  overButton(x: number, y: number): boolean { return this.button.visible && Math.hypot(x - this.button.x, y - this.button.y) <= BTN_R + 6; }
  overPanel(x: number, y: number): boolean {
    return this.open && x >= this.panel.x && x <= this.panel.x + W && y >= this.panel.y && y <= this.panel.y + this.height;
  }
  /** Returns true when the pointer was consumed (never forwarded to world tap / joystick). */
  handleDown(x: number, y: number): boolean {
    if (this.overButton(x, y)) { this.setOpen(!this.open); return true; }
    if (!this.open) return false;
    if (!this.overPanel(x, y)) { this.setOpen(false); return true; }   // tap outside closes, doesn't walk
    const lx = x - this.panel.x, ly = y - this.panel.y;
    if (ly < 48 && lx > W - 100) { audio().toggleMute(); this.refresh(); return true; }
    const row = Math.floor((ly - 62 + ROW / 2) / ROW);
    const s = SLIDERS[row];
    if (s && lx > TRACK_X - 24) { this.dragging = s.key; this.setFromX(lx, false); }
    return true;
  }
  handleMove(x: number): boolean {
    if (!this.dragging) return false;
    this.setFromX(x - this.panel.x, false);
    return true;
  }
  handleUp(x: number): boolean {
    if (!this.dragging) return false;
    this.setFromX(x - this.panel.x, true);
    this.dragging = null;
    if (!audio().prefs.muted) audio().play('ui_tick');   // audible preview of the new level
    return true;
  }
  private setFromX(lx: number, persist: boolean): void {
    const v = Math.round(Phaser.Math.Clamp((lx - TRACK_X) / TRACK_W, 0, 1) * 100) / 100;
    audio().setPrefs({ [this.dragging!]: v } as Partial<AudioPrefs>, persist);
    this.refresh();
  }

  /** Test/debug geometry: screen positions of the controls (CSS px). */
  geometry(): { button: { x: number; y: number }; open: boolean; mute: { x: number; y: number }; sliders: Record<SliderKey, { x0: number; x1: number; y: number }> } {
    const sliders = {} as Record<SliderKey, { x0: number; x1: number; y: number }>;
    SLIDERS.forEach((s, i) => { sliders[s.key] = { x0: this.panel.x + TRACK_X, x1: this.panel.x + TRACK_X + TRACK_W, y: this.panel.y + 62 + i * ROW }; });
    return { button: { x: this.button.x, y: this.button.y }, open: this.open, mute: { x: this.panel.x + W - 16 - this.muteTx.width / 2, y: this.panel.y + 10 + this.muteTx.height / 2 }, sliders };
  }
}
