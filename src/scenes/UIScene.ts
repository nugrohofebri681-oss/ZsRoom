import * as Phaser from 'phaser';
import { InputState } from '../systems/input';
import type { RoomData } from '../world/room';

const JOY_RADIUS = 56;

/** Screen-space UI: unaffected by world camera zoom. Hosts HUD, prompts, toasts and touch controls. */
export class UIScene extends Phaser.Scene {
  private title!: Phaser.GameObjects.Text;
  private prompt!: Phaser.GameObjects.Text;
  private toast!: Phaser.GameObjects.Text;
  private fps!: Phaser.GameObjects.Text;
  private joyBase!: Phaser.GameObjects.Arc;
  private joyKnob!: Phaser.GameObjects.Arc;
  private actBtn!: Phaser.GameObjects.Container;
  private joyPointer: number | null = null;
  private joyOrigin = { x: 0, y: 0 };
  private input$!: InputState;
  private dpr = 1;

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

    this.joyBase = this.add.circle(0, 0, JOY_RADIUS, 0xffffff, 0.12).setStrokeStyle(2, 0xffffff, 0.35).setVisible(false);
    this.joyKnob = this.add.circle(0, 0, 24, 0xe8a0b4, 0.8).setVisible(false);
    const btnBg = this.add.circle(0, 0, 34, 0xc0607e, 0.85).setStrokeStyle(2, 0xfff4f7, 0.6);
    const btnTx = this.add.text(0, 0, 'E', { ...style, fontSize: '20px' }).setOrigin(0.5);
    this.actBtn = this.add.container(0, 0, [btnBg, btnTx]).setSize(68, 68).setInteractive({ useHandCursor: true });
    this.actBtn.on('pointerdown', (p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => { ev.stopPropagation(); this.input$.queueInteract(); void p; });
    this.actBtn.setVisible(this.sys.game.device.input.touch);

    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);
    this.input.on('pointerupoutside', this.onUp, this);

    this.game.events.on('room-entered', this.onRoom, this);
    this.game.events.on('prompt', this.onPrompt, this);
    this.game.events.on('toast', this.onToast, this);
    this.events.once('shutdown', () => {
      this.game.events.off('room-entered', this.onRoom, this);
      this.game.events.off('prompt', this.onPrompt, this);
      this.game.events.off('toast', this.onToast, this);
    });
    this.scale.on('resize', this.layout, this);
    this.layout();
    const room = this.scene.get('Room') as unknown as { room?: { data: RoomData } };
    if (room.room) this.onRoom(room.room.data);
  }

  private layout(): void {
    const width = this.scale.width / this.dpr;
    const height = this.scale.height / this.dpr;
    this.fps.setPosition(width - 10, 10);
    this.prompt.setPosition(width / 2, height - 24);
    this.toast.setPosition(width / 2, 52);
    this.actBtn.setPosition(width - 64, height - 70);
  }

  private onRoom(room: RoomData): void { this.title.setText(`${room.displayName}  ·  Foundation Proof (grey-box)`); }
  private onPrompt(label: string | null): void {
    const txt = label ? `${this.sys.game.device.input.touch ? 'Tap E' : 'E'} — ${label}` : '';
    if (this.prompt.text !== txt) this.prompt.setText(txt);
    this.prompt.setVisible(!!label);
  }
  private onToast(msg: string): void {
    this.toast.setText(msg).setAlpha(1);
    this.tweens.killTweensOf(this.toast);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 1800, duration: 400 });
  }

  private onDown(p: Phaser.Input.Pointer): void {
    const x = p.x / this.dpr;
    const y = p.y / this.dpr;
    if (this.joyPointer !== null || x > (this.scale.width / this.dpr) * 0.55) return;
    this.joyPointer = p.id;
    this.joyOrigin = { x, y };
    this.joyBase.setPosition(x, y).setVisible(true);
    this.joyKnob.setPosition(x, y).setVisible(true);
  }
  private onMove(p: Phaser.Input.Pointer): void {
    if (p.id !== this.joyPointer) return;
    const dx = p.x / this.dpr - this.joyOrigin.x;
    const dy = p.y / this.dpr - this.joyOrigin.y;
    const len = Math.hypot(dx, dy);
    const k = len > JOY_RADIUS ? JOY_RADIUS / len : 1;
    this.joyKnob.setPosition(this.joyOrigin.x + dx * k, this.joyOrigin.y + dy * k);
    const mag = Math.min(1, len / JOY_RADIUS);
    // Screen-up maps to ground-north; y is not foreshortened for input so control feels symmetric.
    this.input$.touchMove = mag < 0.15 ? { x: 0, y: 0 } : { x: (dx / (len || 1)) * mag, y: (dy / (len || 1)) * mag };
  }
  private onUp(p: Phaser.Input.Pointer): void {
    if (p.id !== this.joyPointer) return;
    this.joyPointer = null;
    this.input$.touchMove = { x: 0, y: 0 };
    this.joyBase.setVisible(false);
    this.joyKnob.setVisible(false);
  }

  override update(): void {
    this.fps.setText(`${Math.round(this.game.loop.actualFps)} fps`);
  }
}
