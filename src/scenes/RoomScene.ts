import * as Phaser from 'phaser';
import { groundToRender, DEPTH_SCALE } from '../core/projection';
import { getCharacterSpec, type CharacterSpec, type PropSpec } from '../core/specs';
import { compileRoom, getRoom, DOOR_DEPTH, type CompiledRoom, type RoomDoor } from '../world/room';
import { moveWithCollision } from '../world/collision';
import { actorSortDepth, occludingProps, type SortableActor } from '../world/depth';
import { vectorToDirection, type Direction } from '../actors/direction';
import { nearestAnchor, type WorldAnchor } from '../interaction/anchors';
import { InputState, KeyboardInput } from '../systems/input';
import { loadGame, saveGame, safeStorage } from '../systems/save';
import { textureKey, type AssetManifest } from '../systems/manifest';
import { drawGreyboxCharacter, drawGreyboxProp } from '../ui/greybox';
import { PropLight } from '../systems/lighting';

export interface RoomSceneData { roomId: string; spawn?: string; at?: { x: number; y: number; facing: string } }

const WALK_CM_S = 150;
const RUN_CM_S = 270;
const FADE_ALPHA = 0.42;

export class RoomScene extends Phaser.Scene {
  private room!: CompiledRoom;
  private character!: CharacterSpec;
  private pos = { x: 0, y: 0 };
  private facingDir: Direction = 'S';
  private actorView!: Phaser.GameObjects.Container;
  private facingView!: Phaser.GameObjects.Graphics;
  private debugActor?: Phaser.GameObjects.Graphics;
  private propViews = new Map<string, Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.AlphaSingle & Phaser.GameObjects.Components.Depth>();
  private keyboard!: KeyboardInput;
  private input$!: InputState;
  private nearest: WorldAnchor | null = null;
  private occluded: string[] = [];
  private transitioning = false;
  private propLights = new Map<string, PropLight>();
  private flags: Record<string, boolean> = {};

  constructor() { super('Room'); }

  create(data: RoomSceneData): void {
    this.transitioning = false;
    this.debugActor = undefined;
    this.propViews.clear();
    this.propLights.clear();
    this.flags = { ...(loadGame(safeStorage())?.flags ?? {}) };
    this.room = compileRoom(getRoom(data.roomId));
    this.character = getCharacterSpec('char_zila');
    const spawn = data.at ?? this.room.data.spawns[data.spawn ?? 'default'] ?? this.room.data.spawns.default!;
    this.pos = { x: spawn.x, y: spawn.y };
    this.facingDir = (spawn.facing as Direction) ?? 'S';

    this.input$ = (this.registry.get('input') as InputState | undefined) ?? new InputState();
    this.registry.set('input', this.input$);
    this.keyboard = new KeyboardInput(this, this.input$);

    this.drawShell();
    this.drawProps();
    const ch = drawGreyboxCharacter(this, this.character);
    this.actorView = ch.root;
    this.facingView = ch.facing;

    this.cameras.main.setBackgroundColor('#1d1418');
    this.cameras.main.startFollow(this.actorView, true, 0.14, 0.14);
    this.fitCamera();
    this.scale.on('resize', this.fitCamera, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.fitCamera, this));
    this.cameras.main.fadeIn(220, 29, 20, 24);

    if (new URLSearchParams(location.search).has('debug')) this.drawDebugOverlay();
    this.game.events.emit('room-entered', this.room.data);
    this.persist();
    this.syncActor();
    this.exposeDebug();
  }

  private fitCamera(): void {
    const cam = this.cameras.main;
    const { w, h } = this.room.data.sizeCm;
    const renderH = h * DEPTH_SCALE + this.room.data.wallHeightCm;
    const fit = Math.min(cam.width / (w + 80), cam.height / (renderH + 60));
    // Never so far out that a character is too small to read: ~22% of the screen height on desktop,
    // ~36% on short phone-landscape screens (CSS height < 500), where whole-room framing is too small.
    const dpr = (this.registry.get('dpr') as number | undefined) ?? 1;
    const share = cam.height / dpr < 500 ? 0.36 : 0.22;
    const minForReadability = (cam.height * share) / this.character.heightCm;
    const zoom = Math.max(fit, minForReadability);
    cam.setZoom(zoom);
    // Bounds are at least one view in size and centred on the room, so small rooms sit centred on screen.
    const top = -this.room.data.wallHeightCm - 30;
    const contentW = w + 120;
    const contentH = h * DEPTH_SCALE - top + 60;
    const bw = Math.max(contentW, cam.width / zoom);
    const bh = Math.max(contentH, cam.height / zoom);
    cam.setBounds(w / 2 - bw / 2, top + contentH / 2 - bh / 2, bw, bh);
  }

  private drawShell(): void {
    const { w, h } = this.room.data.sizeCm;
    const wallH = this.room.data.wallHeightCm;
    const col = (hex: string) => Phaser.Display.Color.HexStringToColor(hex).color;
    const g = this.add.graphics().setDepth(-100000);
    const floorBottom = groundToRender(0, h).y;
    g.fillStyle(col(this.room.data.palette.wall), 1).fillRect(0, -wallH, w, wallH);            // back wall face
    g.fillStyle(col(this.room.data.palette.trim), 1).fillRect(0, -10, w, 10);                   // skirting
    g.fillStyle(col(this.room.data.palette.floor), 1).fillRect(0, 0, w, floorBottom);           // floor
    g.lineStyle(1, 0x000000, 0.12);
    for (let x = 0; x <= w; x += 20) g.lineBetween(x, 0, x, floorBottom);                        // plank guides
    g.fillStyle(0x2b1d22, 1).fillRect(-14, -wallH, 14, wallH + floorBottom + 14).fillRect(w, -wallH, 14, wallH + floorBottom + 14);
    g.fillStyle(0x2b1d22, 1).fillRect(-14, floorBottom, w + 28, 14);
    for (const d of this.room.data.doors) this.drawDoor(g, d);
    const label = this.add.text(8, -wallH + 8, `${this.room.data.displayName} — grey-box shell`, {
      fontFamily: 'system-ui, sans-serif', fontSize: '10px', color: '#3a2530',
    }).setDepth(-99999).setResolution(3);
    void label;
  }

  private drawDoor(g: Phaser.GameObjects.Graphics, d: RoomDoor): void {
    const { h } = this.room.data.sizeCm;
    if (d.y <= 10) {
      g.fillStyle(0x5b3a29, 1).fillRect(d.x, -210, d.w, 210);
      g.fillStyle(0xf6ebdd, 1).fillCircle(d.x + d.w - 12, -100, 3);
    } else {
      const y = groundToRender(0, h).y;
      g.fillStyle(0x1d1418, 1).fillRect(d.x, y, d.w, 14 + DOOR_DEPTH * DEPTH_SCALE);
      g.fillStyle(0xe8a0b4, 0.8).fillRect(d.x + 6, y - 6, d.w - 12, 8);
    }
  }

  private drawProps(): void {
    const manifest = this.registry.get('manifest') as AssetManifest;
    const densities = (this.registry.get('assetDensities') ?? {}) as Record<string, number>;
    for (const p of this.room.props) {
      const entry = manifest.assets[p.spec.id];
      const key = textureKey(p.spec.id);
      const pivot = groundToRender(p.x, p.y, p.z);
      let view;
      if (entry?.status === 'approved' && this.textures.exists(key)) {
        const density = densities[p.spec.id] ?? p.spec.density;
        if (p.z === 0) this.drawPropShadow(p.spec, p.x, p.y);
        view = this.add.image(pivot.x, pivot.y, key)
          .setOrigin(p.spec.pivot.x / p.spec.canvas.width, p.spec.pivot.y / p.spec.canvas.height)
          .setScale(1 / density);
      } else {
        // Surface props pivot at their base centre; the grey-box helper expects a front-edge pivot.
        const gy = p.z > 0 ? p.y + p.spec.footprint.depthCm / 2 : p.y;
        view = drawGreyboxProp(this, p.spec, p.x, gy, `${p.spec.id}\n(${entry?.status ?? 'unlisted'})`, p.z);
      }
      view.setDepth(p.sortable.pivotY);
      this.propViews.set(p.key, view);
      if (p.spec.light) {
        const flag = `light:${this.room.data.id}:${p.key}`;
        this.propLights.set(p.key, new PropLight(this, p.key, p.spec.light, p.x, p.y, p.z, this.flags[flag]));
      }
    }
  }

  /** ?debug — collision solids (red), footprints (pink), pivots (black +), anchors (green), actor radius (cyan). */
  private drawDebugOverlay(): void {
    const g = this.add.graphics().setDepth(1e6);
    const rect = (r: { x: number; y: number; w: number; h: number }) => {
      const a = groundToRender(r.x, r.y);
      const b = groundToRender(r.x + r.w, r.y + r.h);
      return [a.x, a.y, b.x - a.x, b.y - a.y] as const;
    };
    g.lineStyle(1.5, 0xff2d2d, 0.9);
    for (const s of this.room.solids) g.strokeRect(...rect(s));
    for (const p of this.room.props) {
      g.lineStyle(1, 0xff3d7f, 1).strokeRect(...rect(p.sortable.footprint));
      const pv = groundToRender(p.x, p.y, p.z);
      g.lineStyle(2, 0x000000, 1).lineBetween(pv.x - 6, pv.y, pv.x + 6, pv.y).lineBetween(pv.x, pv.y - 6, pv.x, pv.y + 6);
      // designed main surface height (mattressTop / top) on the front face — compare against the painted edge
      const hs = p.spec.heightsCm;
      const main = hs.mattressTop ?? hs.top;
      if (main !== undefined) {
        const hw = p.spec.footprint.widthCm / 2;
        g.lineStyle(1.5, 0xffa31a, 1).lineBetween(pv.x - hw, pv.y - main, pv.x + hw, pv.y - main);
      }
    }
    for (const a of this.room.anchors) {
      const c = groundToRender(a.x, a.y);
      g.lineStyle(1, 0x2fd07a, 0.9).strokeEllipse(c.x, c.y, a.radiusCm * 2, a.radiusCm * 2 * DEPTH_SCALE);
    }
    this.debugActor = this.add.graphics().setDepth(1e6 + 1);
  }

  /**
   * Engine-rendered soft cast shadow (Art Bible §7: cast shadows are never baked into art).
   * Light from the upper-left → shadow falls slightly right and toward the viewer, on the floor plane.
   */
  private drawPropShadow(spec: PropSpec, x: number, y: number): void {
    const g = this.add.graphics().setDepth(-50000);
    const w = spec.footprint.widthCm;
    const d = spec.footprint.depthCm * DEPTH_SCALE;
    const front = groundToRender(x, y).y;
    const ox = 5, oy = 3;
    const steps = [{ grow: 10, a: 0.05 }, { grow: 6, a: 0.07 }, { grow: 2, a: 0.1 }];
    for (const s of steps) {
      g.fillStyle(0x2a1620, s.a).fillRoundedRect(x - w / 2 - s.grow / 2 + ox, front - d - s.grow / 2 + oy, w + s.grow, d + s.grow, Math.min(12, (d + s.grow) / 2));
    }
  }

  override update(_time: number, deltaMs: number): void {
    if (this.transitioning) return;
    const dt = Math.min(deltaMs, 66) / 1000;
    const mv = this.keyboard.read();
    const speed = mv.run ? RUN_CM_S : WALK_CM_S;
    const dir = vectorToDirection(mv.x, mv.y);
    if (dir) {
      this.facingDir = dir;
      this.pos = moveWithCollision(this.pos, { x: mv.x * speed * dt, y: mv.y * speed * dt }, this.character.collision.radiusCm, this.room.solids);
    }
    this.syncActor();

    this.nearest = nearestAnchor(this.pos.x, this.pos.y, this.room.anchors);
    this.game.events.emit('prompt', this.nearest?.label ?? null);
    if (this.input$.consumeInteract() && this.nearest) this.interact(this.nearest);
    this.checkDoorTriggers();
  }

  private syncActor(): void {
    const r = groundToRender(this.pos.x, this.pos.y);
    this.actorView.setPosition(r.x, r.y);
    const v = DIR_VEC[this.facingDir];
    this.facingView.setRotation(Math.atan2(v.y * DEPTH_SCALE, v.x));
    if (this.debugActor) {
      const rad = this.character.collision.radiusCm;
      this.debugActor.clear().lineStyle(1.5, 0x00e5ff, 1).strokeEllipse(r.x, r.y, rad * 2, rad * 2 * DEPTH_SCALE);
    }
    const actor: SortableActor = {
      x: this.pos.x, y: this.pos.y, radius: this.character.collision.radiusCm,
      renderBounds: { x: r.x - this.character.collision.radiusCm, y: r.y - this.character.heightCm, w: this.character.collision.radiusCm * 2, h: this.character.heightCm },
    };
    const sortables = this.room.props.map((p) => p.sortable);
    const depth = actorSortDepth(actor, sortables);
    this.actorView.setDepth(depth);
    this.occluded = occludingProps(actor, depth, sortables);
    for (const [key, view] of this.propViews) {
      const target = this.occluded.includes(key) ? FADE_ALPHA : 1;
      view.setAlpha(Phaser.Math.Linear(view.alpha, target, 0.25));
    }
  }

  private checkDoorTriggers(): void {
    const { h } = this.room.data.sizeCm;
    const r = this.character.collision.radiusCm;
    for (const d of this.room.data.doors) {
      const inX = this.pos.x > d.x && this.pos.x < d.x + d.w;
      if (!inX) continue;
      const southExit = d.y > 10 && this.pos.y > h + DOOR_DEPTH - r - 2;
      const northExit = d.y <= 10 && this.pos.y <= r + 0.5 && this.keyboard.read().y < 0;
      if (southExit || northExit) { this.goTo(d.to.room, d.to.spawn); return; }
    }
  }

  private interact(a: WorldAnchor): void {
    if (a.kind === 'door') {
      const to = a.payload as { room: string; spawn: string };
      this.goTo(to.room, to.spawn);
      return;
    }
    const light = this.propLights.get(a.ownerId);
    if (light) {
      const on = light.toggle();
      this.flags[`light:${this.room.data.id}:${a.ownerId}`] = on;
      this.persist();
      this.game.events.emit('toast', on ? 'Lamp on' : 'Lamp off');
    } else {
      this.game.events.emit('toast', `${a.label} — interaction placeholder (milestone 2)`);
    }
    this.game.events.emit('interacted', a.key);
  }

  private goTo(roomId: string, spawn: string): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.cameras.main.fadeOut(200, 29, 20, 24);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ roomId, spawn } satisfies RoomSceneData));
  }

  private persist(): void {
    saveGame(safeStorage(), {
      roomId: this.room.data.id,
      player: { characterId: this.character.id, x: this.pos.x, y: this.pos.y, facing: this.facingDir, outfit: 'default' },
      flags: { ...this.flags },
    });
  }

  private exposeDebug(): void {
    const w = window as unknown as { __ZS?: unknown };
    w.__ZS = {
      state: () => ({
        roomId: this.room.data.id,
        player: { ...this.pos, facing: this.facingDir, depth: this.actorView.depth },
        nearest: this.nearest?.key ?? null,
        occluded: [...this.occluded],
        props: this.room.props.map((p) => ({ key: p.key, depth: this.propViews.get(p.key)?.depth, alpha: this.propViews.get(p.key)?.alpha })),
        fps: Math.round(this.game.loop.actualFps),
        transitioning: this.transitioning,
        lights: [...this.propLights.values()].map((l) => ({ key: l.key, on: l.on })),
      }),
      teleport: (x: number, y: number) => { this.pos = { x, y }; this.syncActor(); },
      save: () => this.persist(),
    };
  }
}

const DIR_VEC: Record<Direction, { x: number; y: number }> = {
  E: { x: 1, y: 0 }, SE: { x: 1, y: 1 }, S: { x: 0, y: 1 }, SW: { x: -1, y: 1 },
  W: { x: -1, y: 0 }, NW: { x: -1, y: -1 }, N: { x: 0, y: -1 }, NE: { x: 1, y: -1 },
};
