import * as Phaser from 'phaser';
import { normaliseInput } from '../actors/direction';

/** Shared, renderer-independent input state. Touch UI writes into it; RoomScene merges keyboard. */
export class InputState {
  touchMove = { x: 0, y: 0 };
  interactQueued = false;
  /** True while a dialogue/panel owns input: the room ignores movement and interaction. */
  modal = false;
  queueInteract(): void { this.interactQueued = true; }
  consumeInteract(): boolean { const v = this.interactQueued; this.interactQueued = false; return v; }
}

export class KeyboardInput {
  private keys: Record<string, Phaser.Input.Keyboard.Key>;
  constructor(scene: Phaser.Scene, private state: InputState) {
    const kb = scene.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT,E,SPACE,ENTER') as Record<string, Phaser.Input.Keyboard.Key>;
    for (const k of ['E', 'SPACE', 'ENTER']) this.keys[k]!.on('down', () => this.state.queueInteract());
  }
  /** Combined, normalised movement vector (ground space, y → south) and run flag. */
  read(): { x: number; y: number; run: boolean } {
    const k = this.keys;
    let x = (k.D!.isDown || k.RIGHT!.isDown ? 1 : 0) - (k.A!.isDown || k.LEFT!.isDown ? 1 : 0);
    let y = (k.S!.isDown || k.DOWN!.isDown ? 1 : 0) - (k.W!.isDown || k.UP!.isDown ? 1 : 0);
    let run = k.SHIFT!.isDown;
    if (x === 0 && y === 0) {
      x = this.state.touchMove.x; y = this.state.touchMove.y;
      run = Math.hypot(x, y) > 0.92;
    }
    const n = normaliseInput(x, y);
    return { x: n.x, y: n.y, run };
  }
}
