import * as Phaser from 'phaser';
import { InputState } from '../systems/input';
import type { RoomData } from '../world/room';
import { AudioPanel } from '../ui/audioPanel';
import { audio } from '../audio/audio';

const JOY_RADIUS = 56;
const TAP_SLOP = 12;          // CSS px a tap may wander before it becomes a drag
const TAP_MS = 450;

interface Touch { id: number; sx: number; sy: number; x: number; y: number; t0: number; mode: 'pending' | 'joy' | 'pinch' }

/** Screen-space UI: unaffected by world camera zoom. Hosts HUD, prompts, toasts and touch controls. */
export class UIScene extends Phaser.Scene {
  private title!: Phaser.GameObjects.Text;
  private prompt!: Phaser.GameObjects.Text;
  private toast!: Phaser.GameObjects.Text;
  private fps!: Phaser.GameObjects.Text;
  private joyBase!: Phaser.GameObjects.Arc;
  private joyKnob!: Phaser.GameObjects.Arc;
  private actBtn!: Phaser.GameObjects.Container;
  private touches = new Map<number, Touch>();
  private joyOrigin = { x: 0, y: 0 };
  private pinchStart = 0;
  private pinchApplied = 0;
  private actLabel!: Phaser.GameObjects.Text;
  private zoomBtns!: Phaser.GameObjects.Container;
  private safe = { top: 0, right: 0, bottom: 0, left: 0 };
  private narrow = false;
  private lastArt: { approved: number; temp: number } | null = null;
  private input$!: InputState;
  private dpr = 1;
  private clock!: Phaser.GameObjects.Text;
  private artBadge!: Phaser.GameObjects.Text;
  private dlgBox!: Phaser.GameObjects.Container;
  private dlgText!: Phaser.GameObjects.Text;
  private dlgName!: Phaser.GameObjects.Text;
  private dlgLines: string[] = [];
  private soundUi!: AudioPanel;

  constructor() { super('UI'); }

  create(): void {
    this.input$ = (this.registry.get('input') as InputState | undefined) ?? new InputState();
    this.registry.set('input', this.input$);
    this.dpr = (this.registry.get('dpr') as number | undefined) ?? 1;
    this.cameras.main.setOrigin(0, 0).setZoom(this.dpr); // UI is laid out in CSS px
    const style = { fontFamily: 'system-ui, sans-serif', color: '#fff4f7', resolution: this.dpr };
    this.title = this.add.text(12, 10, '', { ...style, fontSize: '14px', backgroundColor: '#3a2530cc', padding: { x: 8, y: 4 } });
    this.fps = this.add.text(0, 10, '', { ...style, fontSize: '11px', color: '#f3d9e1' }).setOrigin(1, 0);
    this.prompt = this.add.text(0, 0, '', { ...style, fontSize: '15px', backgroundColor: '#c0607ee6', padding: { x: 10, y: 6 } }).setOrigin(0.5, 1).setVisible(false);
    this.toast = this.add.text(0, 0, '', { ...style, fontSize: '13px', backgroundColor: '#1d1418e6', padding: { x: 10, y: 6 }, wordWrap: { width: 420 } }).setOrigin(0.5, 0).setAlpha(0);

    this.clock = this.add.text(0, 10, '', { ...style, fontSize: '13px', backgroundColor: '#3a2530cc', padding: { x: 8, y: 4 } }).setOrigin(1, 0);
    this.artBadge = this.add.text(12, 40, '', { ...style, fontSize: '10px', color: '#ffe3ec', backgroundColor: '#c0607ecc', padding: { x: 6, y: 2 } });
    // dialogue panel
    const panelBg = this.add.graphics();
    this.dlgName = this.add.text(0, 0, 'Zila', { ...style, fontSize: '13px', color: '#ffe3ec', fontStyle: 'bold' });
    this.dlgText = this.add.text(0, 0, '', { ...style, fontSize: '15px', color: '#fff4f7', wordWrap: { width: 520 }, lineSpacing: 4 });
    const more = this.add.text(0, 0, '▸', { ...style, fontSize: '14px', color: '#f3d9e1' }).setName('more');
    this.dlgBox = this.add.container(0, 0, [panelBg, this.dlgName, this.dlgText, more]).setVisible(false).setDepth(10);
    this.dlgBox.setData('bg', panelBg);
    this.joyBase = this.add.circle(0, 0, JOY_RADIUS, 0xffffff, 0.12).setStrokeStyle(2, 0xffffff, 0.35).setVisible(false);
    this.joyKnob = this.add.circle(0, 0, 24, 0xe8a0b4, 0.8).setVisible(false);
    const btnBg = this.add.circle(0, 0, 34, 0xc0607e, 0.85).setStrokeStyle(2, 0xfff4f7, 0.6);
    const btnTx = this.add.text(0, 0, 'E', { ...style, fontSize: '20px' }).setOrigin(0.5);
    this.actBtn = this.add.container(0, 0, [btnBg, btnTx]).setSize(68, 68).setInteractive({ useHandCursor: true });
    this.actBtn.on('pointerdown', (p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => { ev.stopPropagation(); this.input$.queueInteract(); void p; });
    this.actLabel = this.add.text(0, 0, '', { ...style, fontSize: '11px', color: '#fff4f7', backgroundColor: '#3a2530cc', padding: { x: 5, y: 2 } }).setOrigin(0.5, 0);
    const touch = this.sys.game.device.input.touch;
    this.actBtn.setVisible(touch).setAlpha(0.45);
    this.actLabel.setVisible(false);
    const zb = (label: string, d: number, x: number) => {
      const bg = this.add.circle(x, 0, 17, 0x3a2530, 0.75).setStrokeStyle(1.5, 0xf3d9e1, 0.6);
      const tx = this.add.text(x, 0, label, { ...style, fontSize: '18px' }).setOrigin(0.5);
      bg.setInteractive({ useHandCursor: true }).on('pointerdown', (_p: unknown, _x: unknown, _y: unknown, ev: Phaser.Types.Input.EventData) => { ev.stopPropagation(); this.game.events.emit('zoom-by', d); });
      return [bg, tx];
    };
    this.zoomBtns = this.add.container(0, 0, [...zb('−', -0.1, 0), ...zb('+', 0.1, 40)]).setVisible(touch);
    this.safe = (this.registry.get('safeArea') as typeof this.safe | undefined) ?? this.safe;
    this.soundUi = new AudioPanel(this, this.dpr);
    this.input.keyboard?.on('keydown-M', () => { const m = audio().toggleMute(); this.soundUi.refresh(); this.onToast(m ? 'Sound off' : 'Sound on'); });
    (window as unknown as { __ZS_UI?: unknown }).__ZS_UI = { sound: () => this.soundUi.geometry() };

    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);
    this.input.on('pointerupoutside', this.onUp, this);

    this.game.events.on('room-entered', this.onRoom, this);
    this.game.events.on('prompt', this.onPrompt, this);
    this.game.events.on('toast', this.onToast, this);
    this.game.events.on('dialogue', this.onDialogue, this);
    this.game.events.on('world', this.onWorld, this);
    this.game.events.on('art-status', this.onArtStatus, this);
    this.events.once('shutdown', () => {
      this.game.events.off('dialogue', this.onDialogue, this);
      this.game.events.off('world', this.onWorld, this);
      this.game.events.off('art-status', this.onArtStatus, this);
      this.game.events.off('room-entered', this.onRoom, this);
      this.game.events.off('prompt', this.onPrompt, this);
      this.game.events.off('toast', this.onToast, this);
    });
    this.scale.on('resize', this.layout, this);
    this.layout();
    const room = this.scene.get('Room') as unknown as { room?: { data: RoomData } };
    if (room.room) this.onRoom(room.room.data);
    const w = this.registry.get('world'); if (w) this.onWorld(w);
    const a = this.registry.get('artStatus'); if (a) this.onArtStatus(a);
  }

  private layout(): void {
    const width = this.scale.width / this.dpr;
    const height = this.scale.height / this.dpr;
    const sf = this.safe;
    const touch = this.sys.game.device.input.touch;
    this.narrow = width < 700;
    this.title.setPosition(12 + sf.left, 10 + sf.top);
    this.artBadge.setPosition(12 + sf.left, 40 + sf.top);
    this.fps.setOrigin(0, 0).setPosition(10 + sf.left, height - 18 - sf.bottom);   // bottom-left: clear of the touch E button
    this.clock.setPosition(width - 10 - sf.right, 10 + sf.top);
    this.zoomBtns.setPosition(width - 74 - sf.right, 58 + sf.top);
    // speaker: under the clock on desktop; on touch, left of the zoom pair (all ≥ 42 px targets)
    this.soundUi.layout(touch ? width - 128 - sf.right : width - 32 - sf.right, touch ? 58 + sf.top : 60 + sf.top);
    this.layoutDialogue(width, height - sf.bottom);
    this.prompt.setPosition(touch ? Math.min(width / 2, width - 150 - sf.right) : width / 2, height - sf.bottom - (touch && width < 600 ? 120 : 24));
    this.toast.setPosition(width / 2, 52 + sf.top);
    this.actBtn.setPosition(width - 64 - sf.right, height - 70 - sf.bottom);
    this.actLabel.setPosition(width - 64 - sf.right, height - 32 - sf.bottom);
    if (this.lastArt) this.onArtStatus(this.lastArt);
  }

  private onRoom(room: RoomData): void { this.title.setText(room.provisional ? `${room.displayName} · provisional` : room.displayName); }
  private onWorld(w: { phase: string; day: number }): void { this.clock.setText(`Day ${w.day} · ${w.phase}`); }
  private onArtStatus(a: { approved: number; temp: number }): void {
    this.lastArt = a;
    const total = a.temp + a.approved;
    this.artBadge.setText(!a.temp ? `${a.approved} approved assets` : this.narrow ? `TEMP ART ${a.temp}/${total}` : `TEMPORARY ART · ${a.temp} of ${total} assets are placeholders · T = labels`);
  }

  private layoutDialogue(width: number, height: number): void {
    const w = Math.min(600, width - 24), h = 92, x = (width - w) / 2, y = height - h - 14;
    const bg = this.dlgBox.getData('bg') as Phaser.GameObjects.Graphics;
    bg.clear().fillStyle(0x2a1c22, 0.94).fillRoundedRect(0, 0, w, h, 12).lineStyle(2, 0xe8a0b4, 0.9).strokeRoundedRect(0, 0, w, h, 12);
    this.dlgBox.setPosition(x, y);
    this.dlgName.setPosition(16, 10);
    this.dlgText.setPosition(16, 32).setWordWrapWidth(w - 40);
    (this.dlgBox.getByName('more') as Phaser.GameObjects.Text).setPosition(w - 24, h - 26);
  }
  private onDialogue(d: { speaker: string; lines: string[] }): void {
    this.dlgLines = [...d.lines];
    this.dlgName.setText(d.speaker);
    this.input$.modal = true;
    this.prompt.setVisible(false);
    this.advanceDialogue();
  }
  private advanceDialogue(): void {
    const next = this.dlgLines.shift();
    if (next === undefined) { this.dlgBox.setVisible(false); this.input$.modal = false; this.game.events.emit('dialogue-closed'); return; }
    if (this.dlgBox.visible) audio().play('ui_tick', { gain: 0.7 });
    this.dlgText.setText(next);
    this.dlgBox.setVisible(true);
  }
  private onPrompt(label: string | null): void {
    const touch = this.sys.game.device.input.touch;
    const txt = label ? `${touch ? 'Tap E' : 'E'} — ${label}` : '';
    if (this.prompt.text !== txt) this.prompt.setText(txt);
    this.prompt.setVisible(!!label && !touch);           // on phones the label sits under the E button instead
    if (touch) {
      this.actBtn.setAlpha(label ? 1 : 0.45);
      if (this.actLabel.text !== (label ?? '')) this.actLabel.setText(label ?? '');
      this.actLabel.setVisible(!!label);
    }
  }
  private onToast(msg: string): void {
    this.toast.setText(msg).setAlpha(1);
    this.tweens.killTweensOf(this.toast);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 1800, duration: 400 });
  }

  private css(p: Phaser.Input.Pointer): { x: number; y: number } { return { x: p.x / this.dpr, y: p.y / this.dpr }; }
  private overButton(x: number, y: number): boolean {
    return (this.actBtn.visible && Math.hypot(x - this.actBtn.x, y - this.actBtn.y) < 40) ||
      (this.zoomBtns.visible && y > this.zoomBtns.y - 22 && y < this.zoomBtns.y + 22 && x > this.zoomBtns.x - 22 && x < this.zoomBtns.x + 62);
  }

  private onDown(p: Phaser.Input.Pointer): void {
    const { x, y } = this.css(p);
    if (this.soundUi.handleDown(x, y)) return;
    if (this.input$.modal) { this.input$.queueInteract(); return; }
    if (this.overButton(x, y)) return;
    this.touches.set(p.id, { id: p.id, sx: x, sy: y, x, y, t0: this.time.now, mode: 'pending' });
    if (this.touches.size === 2) {                         // second finger: pinch zoom, stop moving
      for (const t of this.touches.values()) t.mode = 'pinch';
      this.releaseJoystick();
      const [a, b] = [...this.touches.values()];
      this.pinchStart = Math.hypot(a!.x - b!.x, a!.y - b!.y); this.pinchApplied = 0;
    }
  }
  private onMove(p: Phaser.Input.Pointer): void {
    if (this.soundUi.handleMove(this.css(p).x)) return;
    const t = this.touches.get(p.id);
    if (!t) return;
    const { x, y } = this.css(p);
    t.x = x; t.y = y;
    if (t.mode === 'pinch') {
      const [a, b] = [...this.touches.values()];
      if (!a || !b || this.pinchStart <= 0) return;
      const steps = Math.trunc((Math.hypot(a.x - b.x, a.y - b.y) / this.pinchStart - 1) / 0.12);
      if (steps !== this.pinchApplied) { this.game.events.emit('zoom-by', (steps - this.pinchApplied) * 0.1); this.pinchApplied = steps; }
      return;
    }
    if (t.mode === 'pending' && p.wasTouch && Math.hypot(x - t.sx, y - t.sy) > TAP_SLOP) {
      t.mode = 'joy';                                      // drag → floating joystick anchored where the finger went down
      this.joyOrigin = { x: t.sx, y: t.sy };
      this.joyBase.setPosition(t.sx, t.sy).setVisible(true);
      this.joyKnob.setPosition(t.sx, t.sy).setVisible(true);
    }
    if (t.mode !== 'joy') return;
    const dx = x - this.joyOrigin.x, dy = y - this.joyOrigin.y;
    const len = Math.hypot(dx, dy);
    const k = len > JOY_RADIUS ? JOY_RADIUS / len : 1;
    this.joyKnob.setPosition(this.joyOrigin.x + dx * k, this.joyOrigin.y + dy * k);
    const mag = Math.min(1, len / JOY_RADIUS);
    // Screen-up maps to ground-north; y is not foreshortened for input so control feels symmetric.
    this.input$.touchMove = mag < 0.15 ? { x: 0, y: 0 } : { x: (dx / (len || 1)) * mag, y: (dy / (len || 1)) * mag };
  }
  private onUp(p: Phaser.Input.Pointer): void {
    if (this.soundUi.handleUp(this.css(p).x)) return;
    const t = this.touches.get(p.id);
    if (!t) return;
    this.touches.delete(p.id);
    if (t.mode === 'joy') this.releaseJoystick();
    if (t.mode === 'pending' && this.time.now - t.t0 < TAP_MS && Math.hypot(t.x - t.sx, t.y - t.sy) <= TAP_SLOP) {
      this.game.events.emit('world-tap', { x: p.x, y: p.y });   // game px; the room converts to world space
    }
    if (this.touches.size < 2) this.pinchStart = 0;
  }
  private releaseJoystick(): void {
    this.input$.touchMove = { x: 0, y: 0 };
    this.joyBase.setVisible(false);
    this.joyKnob.setVisible(false);
  }

  override update(): void {
    this.fps.setText(`${Math.round(this.game.loop.actualFps)} fps`);
    if (this.input$.modal && this.input$.consumeInteract()) this.advanceDialogue();
  }
}
