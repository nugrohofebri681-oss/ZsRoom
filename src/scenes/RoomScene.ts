import * as Phaser from 'phaser';
import { groundToRender, DEPTH_SCALE } from '../core/projection';
import { getCharacterSpec, type ActionSpec, type CharacterSpec, type PropSpec } from '../core/specs';
import { compileRoom, getRoom, DOOR_DEPTH, type CompiledRoom, type PropInstance, type RoomDoor } from '../world/room';
import { moveWithCollision } from '../world/collision';
import { actorSortDepth, occludingProps, type SortableActor } from '../world/depth';
import { vectorToDirection, type Direction } from '../actors/direction';
import { nearestAnchor, type WorldAnchor } from '../interaction/anchors';
import { applyAction, isPhase, OUTFITS, PHASE_LOOK, type Phase, type Vars } from '../interaction/actions';
import { InputState, KeyboardInput } from '../systems/input';
import { loadGame, saveGame, safeStorage } from '../systems/save';
import { textureKey, type AssetManifest } from '../systems/manifest';
import { drawGreyboxCharacter, drawGreyboxProp } from '../ui/greybox';
import { ensureTempTexture } from '../ui/placeholders';
import { buildShellTexture } from '../ui/shell';
import { PropLight } from '../systems/lighting';

export interface RoomSceneData { roomId: string; spawn?: string; at?: { x: number; y: number; facing: string } }

const WALK_CM_S = 150;
const RUN_CM_S = 270;
const FADE_ALPHA = 0.42;
const AMBIENT_DEPTH = 89000;   // above props and actors, below engine lights (90000+)
const SIT_SCALE_Y = 0.74;

type PropView = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.AlphaSingle & Phaser.GameObjects.Components.Depth;
type ArtKind = 'approved' | 'temp' | 'greybox';
interface Seated { propKey: string; exit: { x: number; y: number }; depth: number }

export class RoomScene extends Phaser.Scene {
  private room!: CompiledRoom;
  private character!: CharacterSpec;
  private pos = { x: 0, y: 0 };
  private facingDir: Direction = 'S';
  private actorView!: Phaser.GameObjects.Container;
  private facingView!: Phaser.GameObjects.Graphics;
  private debugActor?: Phaser.GameObjects.Graphics;
  private propViews = new Map<string, PropView>();
  private artKinds = new Map<string, ArtKind>();
  private tagViews: Phaser.GameObjects.Text[] = [];
  private keyboard!: KeyboardInput;
  private input$!: InputState;
  private nearest: WorldAnchor | null = null;
  private occluded: string[] = [];
  private transitioning = false;
  private propLights = new Map<string, PropLight>();
  private flags: Record<string, boolean> = {};
  private vars: Vars = {};
  private seated: Seated | null = null;
  private ambient?: Phaser.GameObjects.Rectangle;
  private skies: { img: Phaser.GameObjects.Image; curtains: Phaser.GameObjects.Graphics }[] = [];

  constructor() { super('Room'); }

  create(data: RoomSceneData): void {
    this.transitioning = false;
    this.debugActor = undefined;
    this.seated = null;
    this.propViews.clear(); this.artKinds.clear(); this.propLights.clear();
    this.tagViews = []; this.skies = [];
    const save = loadGame(safeStorage());
    this.flags = { ...(save?.flags ?? {}) };
    this.vars = { phase: 'evening', day: 1, outfit: 'default', ...(save?.vars ?? {}) };
    this.room = compileRoom(getRoom(data.roomId));
    this.character = getCharacterSpec('char_zila');
    const spawn = data.at ?? this.room.data.spawns[data.spawn ?? 'default'] ?? this.room.data.spawns.default!;
    this.pos = { x: spawn.x, y: spawn.y };
    this.facingDir = (spawn.facing as Direction) ?? 'S';

    this.input$ = (this.registry.get('input') as InputState | undefined) ?? new InputState();
    this.input$.modal = false;
    this.registry.set('input', this.input$);
    this.keyboard = new KeyboardInput(this, this.input$);

    this.drawShell();
    this.drawProps();
    this.buildActor();
    this.ambient = this.add.rectangle(-40, -this.room.data.wallHeightCm - 40, this.room.data.sizeCm.w + 80, this.room.data.wallHeightCm + this.room.data.sizeCm.h * DEPTH_SCALE + 80)
      .setOrigin(0, 0).setDepth(AMBIENT_DEPTH);
    this.applyWorldVars();

    this.cameras.main.setBackgroundColor('#1d1418');
    this.cameras.main.startFollow(this.actorView, true, 0.14, 0.14);
    this.fitCamera();
    this.scale.on('resize', this.fitCamera, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.fitCamera, this));
    this.cameras.main.fadeIn(220, 29, 20, 24);

    const params = new URLSearchParams(location.search);
    if (params.has('debug')) this.drawDebugOverlay();
    this.input.keyboard?.on('keydown-T', () => this.setTagsVisible(!this.tagViews[0]?.visible));
    this.setTagsVisible(params.has('tags'));
    this.game.events.emit('room-entered', this.room.data);
    this.emitArtStatus();
    this.persist();
    this.syncActor();
    this.exposeDebug();
  }

  // ---------------------------------------------------------------- rendering
  private highDensity(): boolean {
    const dpr = (this.registry.get('dpr') as number | undefined) ?? 1;
    return dpr * Math.max(this.scale.width / dpr, this.scale.height / dpr) >= 1600;
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
    const zoom = Math.max(fit, (cam.height * share) / this.character.heightCm);
    cam.setZoom(zoom);
    const top = -this.room.data.wallHeightCm - 30;
    const contentW = w + 120;
    const contentH = h * DEPTH_SCALE - top + 60;
    const bw = Math.max(contentW, cam.width / zoom);
    const bh = Math.max(contentH, cam.height / zoom);
    cam.setBounds(w / 2 - bw / 2, top + contentH / 2 - bh / 2, bw, bh);
  }

  private drawShell(): void {
    const s = buildShellTexture(this, this.room.data, this.highDensity() ? 2 : 1);
    this.add.image(s.originX, s.originY, s.key).setOrigin(0, 0).setScale(1 / s.scale).setDepth(-100000);
    const g = this.add.graphics().setDepth(-99999);
    for (const d of this.room.data.doors) this.drawNorthDoor(g, d);
  }

  private drawNorthDoor(g: Phaser.GameObjects.Graphics, d: RoomDoor): void {
    if (d.y > 10) return; // south doorways are part of the shell texture
    g.fillStyle(0x5b3a29, 1).fillRoundedRect(d.x, -210, d.w, 210, { tl: 6, tr: 6, bl: 0, br: 0 });
    g.fillStyle(0x8a5a3c, 1).fillRoundedRect(d.x + 8, -200, d.w - 16, 192, 4);
    g.fillStyle(0xf6ebdd, 1).fillCircle(d.x + d.w - 16, -100, 3);
  }

  private drawProps(): void {
    const manifest = this.registry.get('manifest') as AssetManifest;
    const densities = (this.registry.get('assetDensities') ?? {}) as Record<string, number>;
    const look = PHASE_LOOK[this.phase()];
    for (const p of this.room.props) {
      const entry = manifest.assets[p.spec.id];
      const approvedKey = textureKey(p.spec.id);
      const pivot = groundToRender(p.x, p.y, p.z);
      let view: PropView;
      let kind: ArtKind;
      const tex = entry?.status === 'approved' && this.textures.exists(approvedKey) ? approvedKey : ensureTempTexture(this, p.spec);
      if (tex) {
        kind = tex === approvedKey ? 'approved' : 'temp';
        const density = kind === 'approved' ? densities[p.spec.id] ?? p.spec.density : p.spec.density;
        if (p.layer === 'floor') this.drawPropShadow(p.spec, p.x, p.y);
        view = this.add.image(pivot.x, pivot.y, tex)
          .setOrigin(p.spec.pivot.x / p.spec.canvas.width, p.spec.pivot.y / p.spec.canvas.height)
          .setScale(1 / density);
      } else {
        kind = 'greybox';
        const gy = p.layer === 'surface' ? p.y + p.spec.footprint.depthCm / 2 : p.y;
        view = drawGreyboxProp(this, p.spec, p.x, gy, `${p.spec.id}\n(${entry?.status ?? 'unlisted'})`, p.z);
      }
      view.setDepth(p.sortable.pivotY);
      this.propViews.set(p.key, view);
      this.artKinds.set(p.key, kind);
      if (p.spec.glass) this.addSky(p, view.depth);
      if (kind !== 'approved') {
        const top = groundToRender(p.x, p.y, p.z + Math.max(...Object.values(p.spec.heightsCm))).y;
        this.tagViews.push(this.add.text(pivot.x, top - 4, `TEMP · ${p.spec.id}`, {
          fontFamily: 'system-ui, sans-serif', fontSize: '8px', color: '#fff4f7', backgroundColor: '#c0607ecc', padding: { x: 3, y: 1 },
        }).setOrigin(0.5, 1).setResolution(3).setDepth(95000));
      }
      if (p.spec.light) {
        const flag = `light:${this.room.data.id}:${p.key}`;
        this.propLights.set(p.key, new PropLight(this, p.key, p.spec.light, p.x, p.y, p.z, this.flags[flag], look.lightBoost));
      }
    }
  }

  /** The window glass is transparent in the art; the engine paints the time-of-day sky behind it. */
  private addSky(p: PropInstance, propDepth: number): void {
    const gl = p.spec.glass!;
    const tl = groundToRender(p.x + gl.x, 0, p.z + gl.z + gl.h);
    const img = this.add.image(tl.x, tl.y, this.skyTexture()).setOrigin(0, 0).setDisplaySize(gl.w, gl.h).setDepth(propDepth - 0.01);
    const curtains = this.add.graphics().setDepth(propDepth + 0.01);
    curtains.fillStyle(0xe8a0b4, 1).fillRoundedRect(tl.x - 2, tl.y - 2, gl.w / 2 + 2, gl.h + 4, 3).fillRoundedRect(tl.x + gl.w / 2, tl.y - 2, gl.w / 2 + 2, gl.h + 4, 3);
    curtains.lineStyle(1.2, 0xc0607e, 0.7);
    for (let i = 1; i < 6; i++) curtains.lineBetween(tl.x + (gl.w / 6) * i, tl.y, tl.x + (gl.w / 6) * i, tl.y + gl.h);
    this.skies.push({ img, curtains });
  }

  private skyTexture(): string {
    const phase = this.phase();
    const key = `sky:${phase}`;
    if (this.textures.exists(key)) return key;
    const [top, bottom] = PHASE_LOOK[phase].sky;
    const c = this.textures.createCanvas(key, 64, 64)!;
    const ctx = c.getContext();
    const g = ctx.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = 'rgba(40,30,70,0.55)';                                    // distant city skyline
    for (let x = 0; x < 64; x += 6) ctx.fillRect(x, 64 - (10 + ((x * 37) % 17)), 5, 30);
    if (phase === 'night' || phase === 'evening') {
      ctx.fillStyle = 'rgba(255,230,160,0.9)';
      for (let x = 1; x < 64; x += 6) for (let y = 64 - 22; y < 62; y += 4) if ((x * 7 + y * 3) % 5 === 0) ctx.fillRect(x, y, 1, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < 9; i++) ctx.fillRect((i * 23) % 64, (i * 11) % 30, 1, 1);
      if (phase === 'night') { ctx.fillStyle = '#FFF4D6'; ctx.beginPath(); ctx.arc(50, 12, 4, 0, Math.PI * 2); ctx.fill(); }
    }
    c.refresh();
    return key;
  }

  /** Engine-rendered soft cast shadow (Art Bible §7). Light from the upper-left → shadow falls right/forward. */
  private drawPropShadow(spec: PropSpec, x: number, y: number): void {
    const g = this.add.graphics().setDepth(-50000);
    const w = spec.footprint.widthCm;
    const d = spec.footprint.depthCm * DEPTH_SCALE;
    const front = groundToRender(x, y).y;
    const steps = [{ grow: 10, a: 0.05 }, { grow: 6, a: 0.07 }, { grow: 2, a: 0.1 }];
    for (const s of steps) g.fillStyle(0x2a1620, s.a).fillRoundedRect(x - w / 2 - s.grow / 2 + 5, front - d - s.grow / 2 + 3, w + s.grow, d + s.grow, Math.min(12, (d + s.grow) / 2));
  }

  private buildActor(): void {
    const outfit = OUTFITS.find((o) => o.id === this.vars.outfit) ?? OUTFITS[0];
    const old = this.actorView;
    const ch = drawGreyboxCharacter(this, this.character, outfit.color);
    this.actorView = ch.root;
    this.facingView = ch.facing;
    if (old) {
      this.actorView.setScale(old.scaleX, old.scaleY);
      this.cameras.main.startFollow(this.actorView, true, 0.14, 0.14);
      old.destroy();
    }
  }

  private setTagsVisible(v: boolean): void { for (const t of this.tagViews) t.setVisible(v); }

  private emitArtStatus(): void {
    const kinds = [...this.artKinds.values()];
    this.registry.set('artStatus', { approved: kinds.filter((k) => k === 'approved').length, temp: kinds.filter((k) => k !== 'approved').length });
    this.game.events.emit('art-status', { approved: kinds.filter((k) => k === 'approved').length, temp: kinds.filter((k) => k !== 'approved').length });
  }

  // ---------------------------------------------------------------- world state
  private phase(): Phase { return isPhase(this.vars.phase) ? this.vars.phase : 'evening'; }

  private applyWorldVars(): void {
    const look = PHASE_LOOK[this.phase()];
    // Skip the full-screen tint entirely when it would be invisible (saves one full-screen blend pass on mobile GPUs).
    this.ambient?.setFillStyle(Phaser.Display.Color.HexStringToColor(look.overlay.color).color, look.overlay.alpha).setVisible(look.overlay.alpha > 0.01);
    for (const l of this.propLights.values()) l.setBoost(look.lightBoost);
    const sky = this.skyTexture();
    for (const s of this.skies) { s.img.setTexture(sky); s.curtains.setVisible(!!this.vars.curtainsClosed); }
    this.registry.set('world', { phase: look.label, day: Number(this.vars.day ?? 1) });
    this.game.events.emit('world', { phase: look.label, day: Number(this.vars.day ?? 1) });
  }

  // ---------------------------------------------------------------- loop
  override update(_time: number, deltaMs: number): void {
    if (this.transitioning) return;
    if (this.input$.modal) { this.game.events.emit('prompt', null); return; } // dialogue open: UI owns input
    const dt = Math.min(deltaMs, 66) / 1000;
    const mv = this.keyboard.read();
    const dir = vectorToDirection(mv.x, mv.y);
    if (this.seated) {
      if (dir) this.standUp();
    } else if (dir) {
      const speed = mv.run ? RUN_CM_S : WALK_CM_S;
      this.facingDir = dir;
      this.pos = moveWithCollision(this.pos, { x: mv.x * speed * dt, y: mv.y * speed * dt }, this.character.collision.radiusCm, this.room.solids);
    }
    this.syncActor();
    this.nearest = this.seated ? null : nearestAnchor(this.pos.x, this.pos.y, this.room.anchors);
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
    const h = this.character.heightCm * (this.seated ? SIT_SCALE_Y : 1);
    const actor: SortableActor = {
      x: this.pos.x, y: this.pos.y, radius: this.character.collision.radiusCm,
      renderBounds: { x: r.x - this.character.collision.radiusCm, y: r.y - h, w: this.character.collision.radiusCm * 2, h },
    };
    const sortables = this.room.props.map((p) => p.sortable);
    const depth = this.seated ? this.seated.depth : actorSortDepth(actor, sortables);
    this.actorView.setDepth(depth);
    this.occluded = occludingProps(actor, depth, sortables);
    for (const [key, view] of this.propViews) {
      const target = this.occluded.includes(key) ? FADE_ALPHA : 1;
      view.setAlpha(Phaser.Math.Linear(view.alpha, target, 0.25));
    }
  }

  private checkDoorTriggers(): void {
    if (this.seated) return;
    const { h } = this.room.data.sizeCm;
    const r = this.character.collision.radiusCm;
    for (const d of this.room.data.doors) {
      if (!(this.pos.x > d.x && this.pos.x < d.x + d.w)) continue;
      const southExit = d.y > 10 && this.pos.y > h + DOOR_DEPTH - r - 2;
      const northExit = d.y <= 10 && this.pos.y <= r + 0.5 && this.keyboard.read().y < 0;
      if (southExit || northExit) { this.goTo(d.to.room, d.to.spawn); return; }
    }
  }

  // ---------------------------------------------------------------- interactions
  private interact(a: WorldAnchor): void {
    if (a.kind === 'door') {
      const to = a.payload as { room: string; spawn: string };
      this.goTo(to.room, to.spawn);
      return;
    }
    const action = (a.payload as { action?: ActionSpec } | undefined)?.action;
    const res = applyAction(action, this.vars, a.label);
    const prevOutfit = this.vars.outfit;
    this.vars = res.vars;
    if (res.toggleLight) {
      const light = this.propLights.get(a.ownerId);
      if (light) {
        const on = light.toggle();
        this.flags[`light:${this.room.data.id}:${a.ownerId}`] = on;
        this.game.events.emit('toast', on ? 'Lamp on' : 'Lamp off');
      }
    }
    if (res.sit) this.sitOn(a.ownerId, res.sit, { x: a.x, y: a.y });
    if (this.vars.outfit !== prevOutfit) this.buildActor();
    if (res.fade) {
      const cam = this.cameras.main;
      let done = false;
      cam.fade(350, 20, 14, 24, true, (_c: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress >= 1 && !done) { done = true; this.applyWorldVars(); cam.fadeIn(450, 20, 14, 24); }
      });
    } else {
      this.applyWorldVars();
    }
    if (res.toast) this.game.events.emit('toast', res.toast);
    if (res.dialogue) this.game.events.emit('dialogue', { speaker: 'Zila', lines: res.dialogue });
    this.persist();
    this.game.events.emit('interacted', a.key);
  }

  private sitOn(propKey: string, sit: Extract<ActionSpec, { type: 'sit' }>, exit: { x: number; y: number }): void {
    const p = this.room.props.find((x) => x.key === propKey);
    if (!p) return;
    this.seated = { propKey, exit, depth: p.sortable.pivotY + 0.5 };
    this.pos = { x: p.x + sit.seat.x, y: p.y + sit.seat.y };
    this.facingDir = sit.facing as Direction;
    this.actorView.setScale(1, SIT_SCALE_Y);
    this.game.events.emit('toast', 'Move to stand up');
  }

  private standUp(): void {
    if (!this.seated) return;
    this.pos = { ...this.seated.exit };
    this.seated = null;
    this.actorView.setScale(1, 1);
  }

  private goTo(roomId: string, spawn: string): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.persist();
    // force=true: a fade-in still running (player walked straight back out) must not swallow the fade-out,
    // otherwise the completion never fires and the player is stuck mid-transition on slow devices.
    let done = false;
    this.cameras.main.fade(200, 29, 20, 24, true, (_c: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress >= 1 && !done) { done = true; this.scene.restart({ roomId, spawn } satisfies RoomSceneData); }
    });
  }

  private persist(): void {
    const at = this.seated ? this.seated.exit : this.pos;
    saveGame(safeStorage(), {
      roomId: this.room.data.id,
      player: { characterId: this.character.id, x: at.x, y: at.y, facing: this.facingDir, outfit: String(this.vars.outfit ?? 'default') },
      flags: { ...this.flags },
      vars: { ...this.vars },
    });
  }

  // ---------------------------------------------------------------- debug / test hooks
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
      if (p.layer !== 'decal') g.lineStyle(1, 0xff3d7f, 1).strokeRect(...rect(p.sortable.footprint));
      const pv = groundToRender(p.x, p.y, p.z);
      g.lineStyle(2, 0x000000, 1).lineBetween(pv.x - 6, pv.y, pv.x + 6, pv.y).lineBetween(pv.x, pv.y - 6, pv.x, pv.y + 6);
      const hs = p.spec.heightsCm;
      const main = hs.mattressTop ?? hs.top;
      if (main !== undefined && p.layer === 'floor') {
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

  private exposeDebug(): void {
    const w = window as unknown as { __ZS?: unknown };
    w.__ZS = {
      state: () => ({
        roomId: this.room.data.id,
        player: { ...this.pos, facing: this.facingDir, depth: this.actorView.depth },
        nearest: this.nearest?.key ?? null,
        occluded: [...this.occluded],
        props: this.room.props.map((p) => ({ key: p.key, depth: this.propViews.get(p.key)?.depth, alpha: this.propViews.get(p.key)?.alpha, art: this.artKinds.get(p.key), layer: p.layer })),
        fps: Math.round(this.game.loop.actualFps),
        transitioning: this.transitioning,
        lights: [...this.propLights.values()].map((l) => ({ key: l.key, on: l.on })),
        vars: { ...this.vars },
        seated: this.seated?.propKey ?? null,
        modal: this.input$.modal,
        displayObjects: this.children.length,
      }),
      teleport: (x: number, y: number) => { this.seated = null; this.actorView.setScale(1, 1); this.pos = { x, y }; this.syncActor(); },
      setVars: (v: Vars) => { this.vars = { ...this.vars, ...v }; this.buildActor(); this.applyWorldVars(); },
      save: () => this.persist(),
    };
  }
}

const DIR_VEC: Record<Direction, { x: number; y: number }> = {
  E: { x: 1, y: 0 }, SE: { x: 1, y: 1 }, S: { x: 0, y: 1 }, SW: { x: -1, y: 1 },
  W: { x: -1, y: 0 }, NW: { x: -1, y: -1 }, N: { x: 0, y: -1 }, NE: { x: 1, y: -1 },
};
