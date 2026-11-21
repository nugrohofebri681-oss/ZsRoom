import * as Phaser from 'phaser';
import { groundToRender, DEPTH_SCALE } from '../core/projection';
import { getCharacterSpec, type ActionSpec, type CharacterSpec, type PropSpec } from '../core/specs';
import { doorOpen, doorSide, DOOR_DEPTH, type CompiledRoom, type PropInstance, type RoomData, type RoomDoor } from '../world/room';
import { compileMap, resolveDestination, zoneAt, type FenceDef, type ZoneInfo } from '../world/floor';
import { initNpc, npcPresent, npcSolid, stepNpc, yieldTo, NPC_RADIUS, type NpcData, type NpcState } from '../world/npc';
import { NpcView } from '../actors/npcView';
import { EVENTS, DIALOGUE, check, runEvent, type Presentation } from '../story/events';
import { COMMS, threadAsDialogue } from '../story/comms';
import type { Rect } from '../core/specs';
import { moveWithCollision } from '../world/collision';
import { actorSortDepth, occludingProps, type SortableActor } from '../world/depth';
import { vectorToDirection, type Direction } from '../actors/direction';
import { nearestAnchor, type WorldAnchor } from '../interaction/anchors';
import { applyAction, isPhase, OUTFITS, PHASE_LOOK, type Phase, type Vars } from '../interaction/actions';
import { InputState, KeyboardInput } from '../systems/input';
import { loadGame, saveGame, safeStorage } from '../systems/save';
import { textureKey, type AssetManifest } from '../systems/manifest';
import { drawGreyboxProp } from '../ui/greybox';
import { ensureTempTexture } from '../ui/placeholders';
import { buildShell, runsOutside, type ShellInfo } from '../ui/shell';
import { LightingSystem } from '../systems/lighting';
import { WalkGrid } from '../world/pathfinding';
import { LayeredCharacter } from '../animation/character';
import type { RigSpec } from '../animation/rig';
import { renderToGround, type Vec2 } from '../core/projection';
import { audio } from '../audio/audio';
import { isQaBuild, walkSpeedMultiplier } from '../core/qa';
import { exploreZoom } from '../core/framing';
import { crossedContacts } from '../audio/synth';
import { floorAt, floorPatches, type FloorPatch } from '../audio/surface';

export interface RoomSceneData { roomId: string; spawn?: string; at?: { x: number; y: number; facing: string } }

const WALK_CM_S = 150;
const RUN_CM_S = 270;
const FADE_ALPHA = 0.42;
const SIT_HEIGHT = 0.78;        // seated figure height share (for occlusion bounds)
const LOOK_AHEAD_S = 0.35;      // camera leads movement by this many seconds
const ZOOM_MIN = 0.8, ZOOM_MAX = 1.9;
/** Test/QA hook (QA/dev builds only, see core/qa.ts): `?fast` walks 3× faster for long route tests. */
const SPEED = walkSpeedMultiplier(location.search, import.meta.env);

type PropView = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.AlphaSingle & Phaser.GameObjects.Components.Depth;
type ArtKind = 'approved' | 'temp' | 'greybox';
interface Seated { propKey: string; exit: { x: number; y: number }; depth: number }

/** Counts real scene (re)starts: tests prove interior doorways on continuous floors never restart the scene. */
let SCENE_STARTS = 0;

export class RoomScene extends Phaser.Scene {
  private room!: CompiledRoom & { zones?: ZoneInfo[]; bbox?: { x: number; y: number; w: number; h: number }; fences?: FenceDef[] };
  /** Current logical room (zone) on a continuous floor; the map id itself for single-room maps. */
  private zone = '';
  private character!: CharacterSpec;
  private pos = { x: 0, y: 0 };
  private facingDir: Direction = 'S';
  private figure!: LayeredCharacter;
  private get actorView(): Phaser.GameObjects.Container { return this.figure.root; }
  private debugActor?: Phaser.GameObjects.Graphics;
  private propViews = new Map<string, PropView>();
  private artKinds = new Map<string, ArtKind>();
  private tagViews: Phaser.GameObjects.Text[] = [];
  private keyboard!: KeyboardInput;
  private input$!: InputState;
  private nearest: WorldAnchor | null = null;
  private occluded: string[] = [];
  private transitioning = false;
  private lighting!: LightingSystem;
  private grid!: WalkGrid;
  private path: Vec2[] = [];
  private pendingAnchor: WorldAnchor | null = null;
  private walked = 0;
  private velocity = { x: 0, y: 0 };
  private camTarget = { x: 0, y: 0 };
  private zoomMul = 1;
  private shellInfo!: ShellInfo;
  private tapMarker?: Phaser.GameObjects.Graphics;
  private flags: Record<string, boolean> = {};
  private vars: Vars = {};
  private seated: Seated | null = null;
  private skies: { img: Phaser.GameObjects.Image; curtains: Phaser.GameObjects.Graphics }[] = [];
  private floorPatches: FloorPatch[] = [];
  /** View culling (P5): static shell tiles with their render rect; hidden while outside the camera view. */
  private cullables: { o: Phaser.GameObjects.Image; x0: number; y0: number; x1: number; y1: number }[] = [];
  private cullAt = { x: NaN, y: NaN, w: 0 };
  /** Shell tiles drawn in the last frame (tests / perf HUD). */
  private tilesDrawn = 0;
  private npcs: { data: NpcData; state: NpcState; view: NpcView }[] = [];
  private visited: string[] = [];
  /** Background landmarks inspected in this map visit (debug/tests). */
  private inspected = new Set<string>();
  /** Door triggers stay disarmed until the player has stepped away from every doorway after arriving. */
  private doorsArmed = false;
  /** Bounded recovery when an NPC blocks a tap-to-move route: total time spent blocked on this path. */
  private blockedMs = 0;
  private stepCount = 0;
  private lastFloor: 'rug' | 'wood' = 'wood';
  /** One reusable silhouette glow behind the prop Zila can use right now (never touches the art itself). */
  private glow?: Phaser.GameObjects.Image;
  private doorGlow?: Phaser.GameObjects.Graphics;
  private glowTarget: string | null = null;

  constructor() { super('Room'); }

  create(data: RoomSceneData): void {
    this.releaseGeneratedTextures();
    this.transitioning = false;
    this.debugActor = undefined;
    this.seated = null;
    this.propViews.clear(); this.artKinds.clear();
    this.path = []; this.pendingAnchor = null; this.walked = 0;
    this.zoomMul = (this.registry.get('zoomMul') as number | undefined) ?? 1;
    this.tagViews = []; this.skies = [];
    const save = loadGame(safeStorage());
    this.flags = { ...(save?.flags ?? {}) };
    this.vars = { phase: 'evening', day: 1, outfit: 'default', ...(save?.vars ?? {}) };
    this.inspected = new Set();
    SCENE_STARTS++;
    // Legacy room ids (doors, saves, URLs) resolve to the continuous floor that contains them, with spawns and
    // saved positions converted to floor coordinates.
    const dest = resolveDestination(data.roomId, data.spawn, data.at);
    this.visited = [...new Set([...(save?.visited ?? []), dest.mapId])];
    // QA/dev builds only: `?variant=dimsum` previews a story-configurable interior variant.
    const variantOverride = isQaBuild(import.meta.env) ? new URLSearchParams(location.search).get('variant') : null;
    this.room = compileMap(dest.mapId, this.flags, variantOverride);
    this.character = getCharacterSpec('char_zila');
    const spawn = dest.at ?? this.room.data.spawns[dest.spawn ?? 'default'] ?? this.room.data.spawns.default!;
    this.pos = { x: spawn.x, y: spawn.y };
    this.facingDir = (spawn.facing as Direction) ?? 'S';

    this.input$ = (this.registry.get('input') as InputState | undefined) ?? new InputState();
    this.input$.modal = false;
    this.registry.set('input', this.input$);
    this.keyboard = new KeyboardInput(this, this.input$);

    const { w: rw, h: rh } = this.room.data.sizeCm, wallH = this.room.data.wallHeightCm;
    const vb = this.viewBox();
    this.lighting = new LightingSystem(this, `lightmap:${this.room.data.id}`, { x: vb.x - 40, y: vb.top - 40, w: vb.w + 80, h: vb.bottom - vb.top + 80 });
    this.grid = new WalkGrid(rw, rh, this.room.solids, this.character.collision.radiusCm);
    // A resumed position must be standable (layouts change between builds): otherwise use the map's default spawn.
    const inside = this.pos.x >= 0 && this.pos.y >= 0 && this.pos.x <= rw && this.pos.y <= rh;
    if (data.at && !(inside && this.grid.standable(this.pos))) { const d = this.room.data.spawns.default!; this.pos = { x: d.x, y: d.y }; }
    this.doorsArmed = false;
    this.drawShell();
    if (this.room.data.kind === 'exterior') this.addExteriorSky();
    if (this.room.fences?.length) this.drawFences();
    this.drawProps();
    this.collectCullables();
    this.spawnNpcs();
    this.floorPatches = floorPatches(this.room.props);
    this.glow = undefined; this.doorGlow = undefined; this.glowTarget = null;
    this.buildActor();
    this.applyWorldVars();

    this.cameras.main.setBackgroundColor('#1d1418');
    const r0 = groundToRender(this.pos.x, this.pos.y);
    this.camTarget = { x: r0.x, y: r0.y - this.character.heightCm * 0.45 };
    this.cameras.main.startFollow(this.camTarget, false, 0.12, 0.12);
    this.fitCamera();
    this.scale.on('resize', this.fitCamera, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.fitCamera, this));
    this.game.events.on('dpr-changed', this.fitCamera, this);
    this.events.once('shutdown', () => this.game.events.off('dpr-changed', this.fitCamera, this));
    this.cameras.main.fadeIn(220, 29, 20, 24);

    const params = new URLSearchParams(location.search);
    if (params.has('debug')) this.drawDebugOverlay();
    this.input.keyboard?.on('keydown-T', () => this.setTagsVisible(!this.tagViews[0]?.visible));
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => this.zoomBy(dy > 0 ? -0.1 : 0.1));
    this.input.keyboard?.on('keydown-PLUS', () => this.zoomBy(0.1));
    this.input.keyboard?.on('keydown-MINUS', () => this.zoomBy(-0.1));
    this.game.events.on('world-tap', this.onWorldTap, this);
    this.game.events.on('zoom-by', this.zoomBy, this);
    this.events.once('shutdown', () => { this.game.events.off('world-tap', this.onWorldTap, this); this.game.events.off('zoom-by', this.zoomBy, this); });
    this.setTagsVisible(params.has('tags'));
    this.game.events.emit('room-entered', this.room.data);
    for (const id of this.room.data.onEnter ?? []) this.runStoryEvent(id);
    this.zone = '';
    this.updateZone();
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
    // Exploration framing (core/framing.ts): the character is a small share of the screen; the map is never
    // squeezed to fit, the camera scrolls instead. Manual zoom multiplies on top.
    const dpr = (this.registry.get('dpr') as number | undefined) ?? 1;
    const zoom = exploreZoom(cam.height, dpr, this.character.heightCm, this.room.data.kind === 'exterior', this.zoomMul);
    cam.setZoom(zoom);
    // Camera bounds = the map's (or the whole region's) visible box: the follow clamps gently at the edges.
    const v = this.viewBox(), top = v.top - 30;
    const contentW = v.w + 120, cx = v.x + v.w / 2;
    const contentH = v.bottom - top + 60;
    const bw = Math.max(contentW, cam.width / zoom);
    const bh = Math.max(contentH, cam.height / zoom);
    cam.setBounds(cx - bw / 2, top + contentH / 2 - bh / 2, bw, bh);
  }

  /** Render-space box of everything drawn: x range, top of the tallest back wall, bottom of the ground. */
  private viewBox(): { x: number; w: number; top: number; bottom: number } {
    const b = this.room.bbox, d = this.room.data;
    if (!b) return { x: 0, w: d.sizeCm.w, top: -d.wallHeightCm, bottom: d.sizeCm.h * DEPTH_SCALE };
    const top = Math.min(...this.room.zones!.map((z) => z.y * DEPTH_SCALE - z.data.wallHeightCm));
    return { x: b.x, w: b.w, top, bottom: (b.y + b.h) * DEPTH_SCALE };
  }

  private zoomBy(d: number): void {
    this.zoomMul = Phaser.Math.Clamp(Math.round((this.zoomMul + d) * 100) / 100, ZOOM_MIN, ZOOM_MAX);
    this.registry.set('zoomMul', this.zoomMul);
    this.fitCamera();
  }

  private drawShell(): void {
    const manifest = this.registry.get('manifest') as AssetManifest, density = this.highDensity() ? 2 : 1;
    if (this.room.zones) {
      // Continuous floor: each zone's shell (floor, back wall, side-wall caps with the opening gaps) is built in
      // its own local coordinates, then shifted to the zone's place on the floor (render x = ground x).
      // Outdoor regions: zones are offset in y as well, shared edges stay open (no caps, wall gaps).
      const region = !!this.room.bbox;
      for (const z of this.room.zones) {
        const before = this.children.list.length;
        const info = buildShell(this, z.data, manifest, density, region ? { region, wallGaps: z.wallGaps } : {});
        if (!this.shellInfo) this.shellInfo = info;
        for (const o of this.children.list.slice(before)) { const t = o as unknown as { x: number; y: number }; t.x += z.x; t.y += z.y * DEPTH_SCALE; }
      }
    } else this.shellInfo = buildShell(this, this.room.data, manifest, density);
    const g = this.add.graphics().setDepth(-99989);
    for (const d of this.room.data.doors) this.drawNorthDoor(g, d);
  }

  private drawNorthDoor(g0: Phaser.GameObjects.Graphics, d: RoomDoor): void {
    if (doorSide(d, this.room.data.sizeCm) !== 'north' || d.style === 'none') return; // other sides: part of the shell
    // a door in a region zone sits on that zone's back wall
    const g = d.zone?.y ? this.add.graphics().setDepth(g0.depth).setPosition(0, d.zone.y * DEPTH_SCALE) : g0;
    if (d.style === 'stairs') {                       // a stairwell going up through the back wall
      g.fillStyle(0x3a2530, 1).fillRect(d.x, -240, d.w, 240);
      for (let i = 0; i < 9; i++) { const y = -i * 26; g.fillStyle(i % 2 ? 0x8a5a3c : 0xa8754c, 1).fillRect(d.x + 4, y - 26, d.w - 8, 26); g.fillStyle(0x5b3a29, 0.6).fillRect(d.x + 4, y - 3, d.w - 8, 3); }
      g.fillStyle(0x5b3a29, 1).fillRect(d.x - 6, -240, 6, 240).fillRect(d.x + d.w, -240, 6, 240);
      return;
    }
    if (d.style === 'gate') {
      g.fillStyle(0x9a948a, 1).fillRect(d.x, -6, d.w, 6);
      g.fillStyle(0xefe6d8, 1).fillRect(d.x - 16, -160, 16, 160).fillRect(d.x + d.w, -160, 16, 160);
      return;
    }
    g.fillStyle(0x5b3a29, 1).fillRoundedRect(d.x, -210, d.w, 210, { tl: 6, tr: 6, bl: 0, br: 0 });
    g.fillStyle(0x8a5a3c, 1).fillRoundedRect(d.x + 8, -200, d.w - 16, 192, 4);
    g.fillStyle(0xf6ebdd, 1).fillCircle(d.x + d.w - 16, -100, 3);
  }

  private drawProps(): void {
    const manifest = this.registry.get('manifest') as AssetManifest;
    const densities = (this.registry.get('assetDensities') ?? {}) as Record<string, number>;
    for (const p of this.room.props) {
      const entry = manifest.assets[p.spec.id];
      const approvedKey = textureKey(p.spec.id);
      const pivot = groundToRender(p.x, p.y, p.z);
      let view: PropView;
      let kind: ArtKind;
      // big TEMP placeholders (facades, roads, trees) may cap their density to keep texture memory small
      const runtimeDensity = Math.min(this.highDensity() ? 2 : 1, Number(p.spec.temp?.maxDensity ?? 2));
      const tex = entry?.status === 'approved' && this.textures.exists(approvedKey) ? approvedKey : ensureTempTexture(this, p.spec, runtimeDensity);
      if (tex) {
        kind = tex === approvedKey ? 'approved' : 'temp';
        const density = kind === 'approved' ? densities[p.spec.id] ?? p.spec.density : runtimeDensity;
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
      if (p.spec.light) this.lighting.add(p.key, p.spec.light, p.x, p.y, p.z, p.layer === 'wall', this.flags[this.lightFlag(p)], view instanceof Phaser.GameObjects.Image ? view : undefined);
    }
  }

  /** The window glass is transparent in the art; the engine paints the time-of-day sky behind it. */
  private addSky(p: PropInstance, propDepth: number): void {
    const gl = p.spec.glass!;
    const tl = groundToRender(p.x + gl.x, 0, p.z + gl.z + gl.h);
    const img = this.add.image(tl.x, tl.y, this.skyTexture()).setOrigin(0, 0).setDisplaySize(gl.w, gl.h).setDepth(propDepth - 0.01);
    // Closed curtains: drawn BEHIND the window art (between sky and art), so the painted frame, glazing bars
    // and tie-back curtains stay on top; soft vertical folds instead of a flat slab over the painting.
    const curtains = this.add.graphics().setDepth(propDepth - 0.005);
    const folds = 14, fw = gl.w / folds;
    for (let i = 0; i < folds; i++) {
      const shade = 0.5 + 0.5 * Math.cos((i / folds) * Math.PI * 2 * 3.5);
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(0xd88aa0), Phaser.Display.Color.ValueToColor(0xf3c3cf), 1, shade);
      curtains.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1).fillRect(tl.x + i * fw, tl.y, fw + 0.5, gl.h);
    }
    curtains.fillStyle(0x9a5a6c, 0.18).fillRect(tl.x + gl.w / 2 - 0.6, tl.y, 1.2, gl.h);   // the meeting edge
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
    if (!this.figure || !this.figure.root.active) this.figure = new LayeredCharacter(this, this.character as CharacterSpec & { rig?: RigSpec }, outfit);
    else this.figure.setOutfit(outfit);
  }

  private setTagsVisible(v: boolean): void { for (const t of this.tagViews) t.setVisible(v); }

  private emitArtStatus(): void {
    const kinds = [...this.artKinds.values(), this.shellInfo.floor.art, this.shellInfo.wall.art];
    this.registry.set('artStatus', { approved: kinds.filter((k) => k === 'approved').length, temp: kinds.filter((k) => k !== 'approved').length });
    this.game.events.emit('art-status', { approved: kinds.filter((k) => k === 'approved').length, temp: kinds.filter((k) => k !== 'approved').length });
  }

  // ---------------------------------------------------------------- world state
  /** Per-zone ambience (continuous floors) or the map's. */
  private applyAmbience(): void {
    const phase = this.phase(), dark = phase === 'evening' || phase === 'night', amb = this.zoneData().ambience ?? this.room.data.ambience ?? 'room';
    audio().setAmbience(amb === 'street' ? (dark ? 'night' : 'street') : amb === 'shop' ? 'shop' : dark ? 'night' : 'day');
  }

  private phase(): Phase { return isPhase(this.vars.phase) ? this.vars.phase : 'evening'; }

  private applyWorldVars(): void {
    const look = PHASE_LOOK[this.phase()];
    this.lighting.setLook(look);   // re-bakes the low-res lightmaps once
    const sky = this.skyTexture();
    for (const s of this.skies) { s.img.setTexture(sky); s.curtains.setVisible(!!this.vars.curtainsClosed); }
    const phase = this.phase();
    this.applyAmbience();
    for (const n of this.npcs) { if (n.state && (n.state as NpcState & { phase?: string }).phase !== phase) this.placeNpc(n, phase); }
    this.registry.set('world', { phase: look.label, day: Number(this.vars.day ?? 1) });
    this.game.events.emit('world', { phase: look.label, day: Number(this.vars.day ?? 1) });
  }

  // ---------------------------------------------------------------- loop
  /**
   * Large outdoor regions hold hundreds of ground/wall tile quads; only the ones near the view are drawn.
   * The rects are fixed (tiles never move), so the check is cheap and only runs when the view moved.
   */
  private collectCullables(): void {
    this.cullables = [];
    for (const o of this.children.list) {
      if (o.name !== 'shell-tile') continue;
      const t = o as Phaser.GameObjects.Image, crop = (t as unknown as { _crop: { width: number; height: number } })._crop;
      const w = (t.isCropped ? crop.width : t.frame.width) * t.scaleX, h = (t.isCropped ? crop.height : t.frame.height) * t.scaleY;
      this.cullables.push({ o: t, x0: t.x, y0: t.y, x1: t.x + w, y1: t.y + h });
    }
    this.cullAt = { x: NaN, y: NaN, w: 0 };
  }

  private cullView(): void {
    const v = this.cameras.main.worldView, m = 160;
    if (Math.abs(v.x - this.cullAt.x) < 48 && Math.abs(v.y - this.cullAt.y) < 48 && v.width === this.cullAt.w) return;
    this.cullAt = { x: v.x, y: v.y, w: v.width };
    const x0 = v.x - m, y0 = v.y - m, x1 = v.right + m, y1 = v.bottom + m;
    let n = 0;
    for (const c of this.cullables) { const on = c.x1 > x0 && c.x0 < x1 && c.y1 > y0 && c.y0 < y1; c.o.visible = on; if (on) n++; }
    this.tilesDrawn = n;
  }

  override update(_time: number, deltaMs: number): void {
    this.cullView();
    if (this.transitioning) return;
    if (this.input$.modal) { this.game.events.emit('prompt', null); this.setHighlight(null); return; } // dialogue open: UI owns input
    // Real elapsed time, not Phaser's smoothed delta (which under-reports when frames drop and makes the
    // whole game run in slow motion on slow devices). Capped at 100 ms; collision sub-steps keep it safe.
    void deltaMs;
    const dt = Math.min(this.game.loop.rawDelta || deltaMs, 100) / 1000;
    const mv = this.keyboard.read();
    let dir = vectorToDirection(mv.x, mv.y);
    const before = { ...this.pos };
    if (dir) { this.path = []; this.pendingAnchor = null; }        // manual input cancels tap-to-move
    if (this.seated) {
      if (dir || this.path.length) this.standUp();
    } else if (dir) {
      const speed = (mv.run ? RUN_CM_S : WALK_CM_S) * SPEED;
      this.facingDir = dir;
      this.pos = moveWithCollision(this.pos, { x: mv.x * speed * dt, y: mv.y * speed * dt }, this.character.collision.radiusCm, this.solids());
    } else if (this.path.length) {
      dir = this.followPath(dt);
    }
    const moved = Math.hypot(this.pos.x - before.x, this.pos.y - before.y);
    const walkedBefore = this.walked;
    this.walked += moved;
    this.footsteps(walkedBefore);
    this.velocity = { x: (this.pos.x - before.x) / Math.max(dt, 1e-3), y: (this.pos.y - before.y) / Math.max(dt, 1e-3) };
    this.syncActor(moved > 0.05, _time);
    this.updateCamera();
    if (this.pendingAnchor && !this.path.length) {
      const a = this.pendingAnchor; this.pendingAnchor = null;
      if (Math.hypot(a.x - this.pos.x, a.y - this.pos.y) <= a.radiusCm + 4) { this.faceToward(a); this.interact(a); }
    }
    const seatedAsset = this.seated ? this.room.props.find((p) => p.key === this.seated!.propKey)?.spec.id ?? null : null;
    this.updateNpcs(dt * 1000);
    this.nearest = nearestAnchor(this.pos.x, this.pos.y, this.npcs.length ? [...this.room.anchors, ...this.npcAnchors()] : this.room.anchors, seatedAsset);
    this.updateHighlight(_time);
    this.game.events.emit('prompt', this.nearest?.label ?? null);
    if (this.input$.consumeInteract() && this.nearest) this.interact(this.nearest);
    this.checkDoorTriggers();
    this.updateZone();
  }

  private syncActor(moving = false, timeMs = this.time.now): void {
    const r = groundToRender(this.pos.x, this.pos.y);
    this.actorView.setPosition(r.x, r.y);
    const seat = this.seated ? this.room.props.find((p) => p.key === this.seated!.propKey) : undefined;
    this.figure.update({ facing: this.facingDir, moving, distanceCm: this.walked, timeMs, sitting: !!this.seated, seatCm: seat?.spec.heightsCm.seat ?? 45 });
    if (this.debugActor) {
      const rad = this.character.collision.radiusCm;
      this.debugActor.clear().lineStyle(1.5, 0x00e5ff, 1).strokeEllipse(r.x, r.y, rad * 2, rad * 2 * DEPTH_SCALE);
    }
    const h = this.character.heightCm * (this.seated ? SIT_HEIGHT : 1);
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
    const { w, h } = this.room.data.sizeCm;
    const r = this.character.collision.radiusCm, mv = this.keyboard.read(), p = this.pos;
    let inAnyDoorway = false;
    for (const d of this.room.data.doors) {
      if (!doorOpen(d, this.flags)) continue;
      const side = doorSide(d, this.room.data.sizeCm);
      // a door on a continuous floor belongs to its zone's rectangle; plain maps use the whole map
      const zx = d.zone?.x ?? 0, zy = d.zone?.y ?? 0, zw = d.zone?.w ?? w, zh = (d.zone?.h ?? h) + zy;   // zh: the zone's south edge
      const alongNS = p.x > d.x && p.x < d.x + d.w, alongEW = p.y > d.y && p.y < d.y + d.h;
      // tolerance: stopping a hair short of the threshold stopper still exits
      const exit = side === 'south' ? alongNS && p.y >= zh + DOOR_DEPTH - r - 6
        : side === 'north' ? alongNS && p.y <= zy + r + 0.5 && mv.y < 0
        : side === 'west' ? alongEW && p.x <= zx - DOOR_DEPTH + r + 6
        : alongEW && p.x >= zx + zw + DOOR_DEPTH - r - 6;
      const near = side === 'south' ? alongNS && p.y > zh - 4 : side === 'west' ? alongEW && p.x < zx + 4 : side === 'east' ? alongEW && p.x > zx + zw - 4 : false;
      if (near || exit) inAnyDoorway = true;
      if (exit && this.doorsArmed) { this.goTo(d.to.room, d.to.spawn); return; }
    }
    if (!inAnyDoorway) this.doorsArmed = true;
  }

  // ---------------------------------------------------------------- tap / click to move
  private onWorldTap(p: { x: number; y: number }): void {
    if (this.transitioning || this.input$.modal) return;
    const wp = this.cameras.main.getWorldPoint(p.x, p.y);
    this.tapAtRender(wp.x, wp.y);
  }

  /** Tap on furniture → walk to its nearest interaction spot and use it; tap on the floor → walk there. */
  private tapAtRender(rx: number, ry: number): void {
    let target: Vec2 | null = null;
    let anchor: WorldAnchor | null = null;
    const hits = this.room.props
      .filter((p) => p.layer !== 'decal' && this.room.anchors.some((a) => a.ownerId === p.key) && this.hitProp(p, rx, ry))
      .sort((a, b) => (this.propViews.get(b.key)?.depth ?? 0) - (this.propViews.get(a.key)?.depth ?? 0));
    if (hits.length) {
      const owned = this.room.anchors.filter((a) => a.ownerId === hits[0]!.key);
      anchor = owned.sort((a, b) => Math.hypot(a.x - this.pos.x, a.y - this.pos.y) - Math.hypot(b.x - this.pos.x, b.y - this.pos.y))[0]!;
      target = { x: anchor.x, y: anchor.y };
    } else if (ry >= 0) {
      target = renderToGround(rx, ry);
    }
    if (!target) return;
    const path = this.grid.findPath(this.pos, target);
    if (!path) { this.game.events.emit('toast', "Can't get there"); return; }
    this.path = path;
    this.pendingAnchor = anchor;
    this.showTapMarker(path[path.length - 1]!);
  }

  private hitProp(p: PropInstance, rx: number, ry: number): boolean {
    const v = this.propViews.get(p.key) as unknown as { getBounds?: () => Phaser.Geom.Rectangle } | undefined;
    const b = v?.getBounds?.();
    return !!b && b.contains(rx, ry) && this.artKinds.get(p.key) !== undefined;
  }

  private followPath(dt: number): Direction | null {
    const next = this.path[0]!;
    const dx = next.x - this.pos.x, dy = next.y - this.pos.y, dist = Math.hypot(dx, dy);
    const step = WALK_CM_S * SPEED * dt;
    if (dist <= Math.max(2, step)) {
      this.pos = moveWithCollision(this.pos, { x: dx, y: dy }, this.character.collision.radiusCm, this.solids());
      this.path.shift();
    } else {
      const before = { ...this.pos };
      this.pos = moveWithCollision(this.pos, { x: (dx / dist) * step, y: (dy / dist) * step }, this.character.collision.radiusCm, this.solids());
      const moved = Math.hypot(this.pos.x - before.x, this.pos.y - before.y);
      // Blocked by an NPC: ask it to make way and keep the route (bounded: give up after 1.5 s blocked).
      // Blocked by anything static: give up at once (the planner already routes around static things).
      const npc = moved < step * 0.5 ? this.npcs.find((n) => n.view.sprite.visible && Math.hypot(n.state.x - this.pos.x, n.state.y - this.pos.y) < this.character.collision.radiusCm + NPC_RADIUS + 14) : undefined;
      if (npc) {
        this.blockedMs += dt * 1000;
        if (this.blockedMs > 1500) { this.path = []; this.pendingAnchor = null; this.blockedMs = 0; }
        else yieldTo(npc.state, this.pos, { x: dx, y: dy }, (x, y) => this.grid.standable({ x, y }) && Math.hypot(x - this.pos.x, y - this.pos.y) > 40);
      } else if (moved < step * 0.05) { this.path = []; this.pendingAnchor = null; this.blockedMs = 0; }
      else this.blockedMs = Math.max(0, this.blockedMs - dt * 500);
    }
    const d = vectorToDirection(dx, dy);
    if (d) this.facingDir = d;
    return d;
  }

  private faceToward(a: WorldAnchor): void {
    const owner = this.room.props.find((p) => p.key === a.ownerId);
    if (!owner) return;
    const d = vectorToDirection(owner.x - this.pos.x, (owner.layer === 'wall' ? 0 : owner.y - owner.spec.footprint.depthCm / 2) - this.pos.y);
    if (d) this.facingDir = d;
  }

  private showTapMarker(p: Vec2): void {
    const r = groundToRender(p.x, p.y);
    this.tapMarker?.destroy();
    const g = this.tapMarker = this.add.graphics().setDepth(-49000).setPosition(r.x, r.y);
    g.lineStyle(2, 0xfff4f7, 0.9).strokeEllipse(0, 0, 26, 26 * DEPTH_SCALE).lineStyle(1.5, 0xe8a0b4, 0.9).strokeEllipse(0, 0, 14, 14 * DEPTH_SCALE);
    this.tweens.add({ targets: g, alpha: 0, scaleX: 1.4, scaleY: 1.4, duration: 600, onComplete: () => g.destroy() });
  }

  // ---------------------------------------------------------------- camera
  /** Smooth follow with look-ahead in the walking direction (shows more of where you are going). */
  private updateCamera(): void {
    const r = groundToRender(this.pos.x, this.pos.y);
    const lead = Phaser.Math.Clamp(LOOK_AHEAD_S, 0, 1);
    const lx = Phaser.Math.Clamp(this.velocity.x * lead, -70, 70), ly = Phaser.Math.Clamp(this.velocity.y * lead * DEPTH_SCALE, -50, 50);
    this.camTarget.x = r.x + lx;
    this.camTarget.y = r.y - this.character.heightCm * 0.45 + ly - (this.room.data.kind === 'exterior' ? 70 : 0);   // outdoors: show building tops / signs
  }
  private snapCamera(): void { this.updateCamera(); this.cameras.main.centerOn(this.camTarget.x, this.camTarget.y); }

  // ---------------------------------------------------------------- interactions
  private interact(a: WorldAnchor): void {
    if (a.kind === 'door') {
      const to = a.payload as { room: string; spawn: string } | { locked: string };
      if ('locked' in to) { this.game.events.emit('toast', to.locked); audio().play('ui_tick'); return; }
      this.goTo(to.room, to.spawn);
      return;
    }
    if (a.kind === 'npc') {
      const n = this.npcs.find((x) => x.data.id === a.ownerId);
      if (n?.data.interact?.event) this.runStoryEvent(n.data.interact.event);
      else if (n?.data.interact?.dialogue) this.showDialogue(DIALOGUE[n.data.interact.dialogue]);
      audio().play('interact', { minGapMs: 250 });
      return;
    }
    const action = (a.payload as { action?: ActionSpec } | undefined)?.action;
    const res = applyAction(action, this.vars, a.label);
    const prevOutfit = this.vars.outfit, prevVars = this.vars;
    this.vars = res.vars;
    if (res.toggleLight) {
      if (this.lighting.has(a.ownerId)) {
        const on = this.lighting.toggle(a.ownerId);
        audio().play('lamp_click', { rate: on ? 1 : 0.92 });
        const lp = this.room.props.find((p) => p.key === a.ownerId);
        if (lp) this.flags[this.lightFlag(lp)] = on;
        this.game.events.emit('toast', on ? 'Lamp on' : 'Lamp off');
      }
    }
    if (res.sit) this.sitOn(a.ownerId, res.sit, { x: a.x, y: a.y });
    if (this.vars.outfit !== prevOutfit) this.buildActor();
    if (this.vars.outfit !== prevOutfit || this.vars.curtainsClosed !== prevVars.curtainsClosed) audio().play('cloth');
    else if (res.fade) audio().play('chime');
    else if (!res.toggleLight && !res.sit) audio().play('interact', { minGapMs: 250 });
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
    if (res.dialogueId) this.showDialogue(DIALOGUE[res.dialogueId]);
    if (res.eventId) this.runStoryEvent(res.eventId);
    if (res.inspect) { this.showDialogue({ speaker: res.inspect.name, lines: [res.inspect.comment] }); this.inspected.add(a.ownerId); }
    this.persist();
    this.game.events.emit('interacted', a.key);
  }

  private sitOn(propKey: string, sit: Extract<ActionSpec, { type: 'sit' }>, exit: { x: number; y: number }): void {
    const p = this.room.props.find((x) => x.key === propKey);
    if (!p) return;
    // seatBehind: the seat's backrest is nearer the camera than the sitter (rear-view chair), so draw the sitter
    // just behind the prop and let the painted backrest overlap the hips and lower back.
    this.seated = { propKey, exit, depth: p.sortable.pivotY + (sit.seatBehind ? -0.5 : 0.5) };
    this.pos = { x: p.x + sit.seat.x, y: p.y + sit.seat.y };
    this.facingDir = sit.facing as Direction;
    audio().play('sit');
    this.game.events.emit('toast', 'Move or tap to stand up');
  }

  private standUp(): void {
    if (!this.seated) return;
    this.pos = { ...this.seated.exit };
    this.seated = null;
    audio().play('sit', { gain: 0.6, rate: 1.15 });
  }

  private goTo(roomId: string, spawn: string): void {
    if (this.transitioning) return;
    this.transitioning = true;
    audio().play('door');
    this.setHighlight(null);
    this.persist();
    // force=true: a fade-in still running (player walked straight back out) must not swallow the fade-out,
    // otherwise the completion never fires and the player is stuck mid-transition on slow devices.
    let done = false;
    this.cameras.main.fade(200, 29, 20, 24, true, (_c: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress >= 1 && !done) { done = true; this.scene.restart({ roomId, spawn } satisfies RoomSceneData); }
    });
  }

  /**
   * Only the active map's generated textures stay in memory: TEMP placeholders, NPC figures, bulb glows and
   * skies of the previous map are released on every map change (they regenerate in milliseconds).
   * Approved art is managed by the asset pipeline (loaded per manifest).
   */
  private releaseGeneratedTextures(): void {
    for (const key of this.textures.getTextureKeys()) if (/^(temp:|fx:bulbs:|sky:|lightmap:)/.test(key)) this.textures.remove(key);
  }

  /** Approximate bytes held by engine-generated canvas textures (TEMP art, glows, skies, lightmap). */
  private generatedTextureBytes(): number {
    let n = 0;
    for (const key of this.textures.getTextureKeys()) {
      if (!/^(temp:|fx:|sky:|lightmap:)/.test(key)) continue;
      const src = this.textures.get(key).getSourceImage() as { width: number; height: number };
      n += src.width * src.height * 4;
    }
    return n;
  }

  // ---------------------------------------------------------------- continuous floors: zones
  /** Light state is remembered per logical room (zone) and the prop's key in it, so saves survive P4 floors. */
  private lightFlag(p: PropInstance): string { return `light:${p.zone ?? this.room.data.id}:${p.zoneKey ?? p.key}`; }

  private zoneData(): RoomData { return this.room.zones?.find((z) => z.id === this.zone)?.data ?? this.room.data; }

  /** Entering a zone on a continuous floor: title, ambience, visited list and zone events — no scene change. */
  private updateZone(): void {
    const z = zoneAt(this.room.zones, this.pos.x, this.pos.y);
    const id = z?.id ?? this.room.data.id;
    if (id === this.zone) return;
    this.zone = id;
    if (!this.visited.includes(id)) this.visited.push(id);
    const data = this.zoneData();
    this.game.events.emit('zone-entered', data);
    if (z) { for (const ev of data.onEnter ?? []) this.runStoryEvent(ev); this.applyAmbience(); }
  }

  // ---------------------------------------------------------------- world: NPCs, story events, exterior sky
  private solids(): Rect[] {
    if (!this.npcs.length) return this.room.solids as Rect[];
    return [...this.room.solids, ...this.npcs.filter((n) => n.view.sprite.visible).map((n) => npcSolid(n.state))];
  }

  private spawnNpcs(): void {
    this.npcs = [];
    const density = this.highDensity() ? 2 : 1;
    for (const data of this.room.data.npcs ?? []) {
      const n = { data, state: initNpc(data, this.phase()), view: new NpcView(this, data, density) };
      this.npcs.push(n);
      this.placeNpc(n, this.phase());
    }
  }

  private placeNpc(n: { data: NpcData; state: NpcState; view: NpcView }, phase: string): void {
    n.state = Object.assign(initNpc(n.data, phase), { phase });
    n.view.setVisible(this.npcVisible(n.data, phase));
    this.drawNpc(n, 0);
  }

  /** Schedule (time of day) AND story conditions (`showIf`). Re-evaluated after every story event. */
  private npcVisible(d: NpcData, phase: string): boolean {
    return npcPresent(d, phase) && (d.showIf ?? []).every((c) => check(c, { vars: this.vars, flags: this.flags }));
  }
  private refreshNpcVisibility(): void { for (const n of this.npcs) n.view.setVisible(this.npcVisible(n.data, this.phase())); }

  private drawNpc(n: { data: NpcData; state: NpcState; view: NpcView }, timeMs: number): void {
    const r = groundToRender(n.state.x, n.state.y);
    const bob = n.state.moving ? Math.abs(Math.sin(n.state.walked / 18)) * 2 : Math.sin(timeMs / 700) * 0.4;
    n.view.place(r.x, r.y, n.state.y, bob, ['W', 'NW', 'SW'].includes(n.state.facing));
  }

  private updateNpcs(dtMs: number): void {
    if (!this.npcs.length) return;
    const blocked = (x: number, y: number) => !this.grid.standable({ x, y }) || Math.hypot(x - this.pos.x, y - this.pos.y) < 40;
    for (const n of this.npcs) {
      if (!n.view.sprite.visible) continue;
      stepNpc(n.data, n.state, dtMs, this.pos, blocked);
      this.drawNpc(n, this.time.now);
    }
  }

  private npcAnchors(): WorldAnchor[] {
    return this.npcs.filter((n) => n.view.sprite.visible && n.data.interact).map((n) => ({
      key: `npc:${n.data.id}`, ownerId: n.data.id, label: n.data.interact!.label, x: n.state.x, y: n.state.y + 30, radiusCm: n.data.radiusCm ?? 70, kind: 'npc' as const,
    }));
  }

  private showDialogue(d: { speaker: string; lines: string[] } | undefined): void {
    if (d) this.game.events.emit('dialogue', { speaker: d.speaker, lines: [...d.lines] });
  }

  /** Run a data-driven story event and present its output (dialogue, toasts, comms threads). */
  private runStoryEvent(id: string): void {
    const res = runEvent(EVENTS.get(id), { vars: this.vars, flags: this.flags });
    this.vars = res.state.vars as Vars; this.flags = res.state.flags;
    this.refreshNpcVisibility();
    this.present(res.out);
    this.persist();
  }

  private present(out: Presentation): void {
    for (const t of out.toasts) this.game.events.emit('toast', t);
    const lines: { speaker: string; lines: string[] }[] = [...out.dialogue];
    for (const c of out.comms) { const t = COMMS.get(c); if (t) { lines.push(threadAsDialogue(t)); audio().play('chime'); } }
    // the dialogue panel shows one speaker block at a time: queue them in order
    const queue = [...lines];
    const next = () => { const d = queue.shift(); if (!d) return; this.showDialogue(d); if (queue.length) this.game.events.once('dialogue-closed', next); };
    next();
  }

  /** Exterior maps: the time-of-day sky above the building row (same texture as window skies). */
  private addExteriorSky(): void {
    if (this.room.bbox) {
      // region: sky above every exposed back-wall run, reaching up to the top of the view (the void behind
      // lower building rows is sky too, never a dark seam)
      const v = this.viewBox();
      for (const z of this.room.zones!) {
        const wallTop = z.y * DEPTH_SCALE - z.data.wallHeightCm;
        for (const [a, b] of runsOutside(0, z.w, z.wallGaps ?? [])) {
          const x0 = z.x + a - (a === 0 ? 40 : 0), x1 = z.x + b + (b === z.w ? 40 : 0), top = Math.min(v.top - 60, wallTop - 260);
          const img = this.add.image(x0, top, this.skyTexture()).setOrigin(0, 0).setDisplaySize(x1 - x0, wallTop - top + 2).setDepth(-100001);
          this.skies.push({ img, curtains: this.add.graphics() });
        }
      }
      return;
    }
    const { w } = this.room.data.sizeCm, wallH = this.room.data.wallHeightCm;
    const img = this.add.image(-40, -wallH - 260, this.skyTexture()).setOrigin(0, 0).setDisplaySize(w + 80, 262).setDepth(-100001);
    this.skies.push({ img, curtains: this.add.graphics() });
  }

  /** Region fences: low stucco walls with a cap, depth-sorted by their ground line (Zila walks behind / in front). */
  private drawFences(): void {
    for (const f of this.room.fences ?? []) {
      const hgt = f.height ?? 90, col = Phaser.Display.Color.HexStringToColor(f.color ?? '#EFE6D8').color;
      const horizontal = f.w >= f.h;
      // vertical (north–south) fences are split in short pieces so each sorts correctly against the actor
      const pieces = horizontal ? [{ x: f.x, y: f.y, w: f.w, h: f.h }] : Array.from({ length: Math.ceil(f.h / 50) }, (_, i) => ({ x: f.x, y: f.y + i * 50, w: f.w, h: Math.min(50, f.h - i * 50) }));
      for (const q of pieces) {
        const g = this.add.graphics().setDepth(q.y + q.h).setName('fence');
        const top = (q.y + q.h) * DEPTH_SCALE - hgt, back = q.y * DEPTH_SCALE - hgt;
        g.fillStyle(col, 1).fillRect(q.x, top, q.w, hgt);                                   // front face
        g.fillStyle(0xffffff, 0.35).fillRect(q.x, back, q.w, top - back + 4);                // cap (top surface)
        g.fillStyle(0x8a7f75, 0.55).fillRect(q.x, top + hgt - 10, q.w, 10);                  // base band
        if (horizontal) for (let x = q.x; x <= q.x + q.w; x += 120) g.fillStyle(0x8a7f75, 0.35).fillRect(Math.min(x, q.x + q.w - 6), top, 6, hgt);
      }
    }
  }

  // ---------------------------------------------------------------- sound + highlight
  /** Footsteps on the walk cycle's contact frames; quieter, duller steps on the rug. */
  private footsteps(walkedBefore: number): void {
    if (this.seated) return;
    const w = (this.character as CharacterSpec & { rig?: RigSpec }).rig?.anims?.walk;
    const n = crossedContacts(walkedBefore, this.walked, w?.strideCm ?? 112, w?.contactFrames ?? [0, 4], w?.frames ?? 8);
    if (!n) return;
    this.lastFloor = floorAt(this.pos.x, this.pos.y, this.floorPatches);
    for (let i = 0; i < Math.min(n, 2); i++) {
      this.stepCount++;
      audio().play(this.lastFloor === 'rug' ? 'step_rug' : 'step_wood', { variant: this.stepCount % 4, rate: 0.96 + ((this.stepCount * 7) % 9) / 100, minGapMs: 120 });
    }
  }

  private updateHighlight(timeMs: number): void {
    const target = this.nearest && !this.transitioning ? (this.nearest.kind === 'door' ? `door:${this.nearest.key}` : this.nearest.ownerId) : null;
    if (target !== this.glowTarget) this.setHighlight(target);
    // slow, gentle breathing pulse (alpha only; no per-frame allocation)
    const a = 0.34 + 0.2 * (0.5 + 0.5 * Math.sin(timeMs / 520));
    if (this.glow?.visible) this.glow.setAlpha(a * (this.propViews.get(this.glowTarget ?? '')?.alpha ?? 1));
    if (this.doorGlow?.visible) this.doorGlow.setAlpha(a * 2);
  }

  private setHighlight(target: string | null): void {
    this.glowTarget = target;
    this.glow?.setVisible(false);
    this.doorGlow?.setVisible(false);
    if (!target) return;
    if (target.startsWith('door:') && this.nearest) {
      const r = groundToRender(this.nearest.x, this.nearest.y);
      this.doorGlow ??= this.add.graphics();
      this.doorGlow.clear().fillStyle(0xfff0f6, 0.5).fillEllipse(0, 0, 70, 70 * DEPTH_SCALE).fillStyle(0xfff0f6, 0.6).fillEllipse(0, 0, 40, 40 * DEPTH_SCALE)
        .setPosition(r.x, r.y).setDepth(-49500).setVisible(true);
      return;
    }
    const view = this.propViews.get(target);
    if (!(view instanceof Phaser.GameObjects.Image)) return;   // greybox placeholders: no silhouette
    this.glow ??= this.add.image(0, 0, view.texture.key).setTintMode(Phaser.TintModes.FILL);
    // Silhouette of the prop, filled soft pink-white and grown ~6 px all round, drawn just BEHIND the prop:
    // reads as a halo around the furniture without altering a pixel of the approved artwork.
    const grow = 1 + 12 / Math.max(view.displayWidth, 1);
    this.glow.setTexture(view.texture.key).setOrigin(view.originX, view.originY)
      .setPosition(view.x, view.y + 1).setScale(view.scaleX * grow, view.scaleY * (1 + 8 / Math.max(view.displayHeight, 1)))
      .setTint(0xfff0f6).setDepth(view.depth - 0.01).setVisible(true);
  }

  private persist(): void {
    const at = this.seated ? this.seated.exit : this.pos;
    saveGame(safeStorage(), {
      roomId: this.room.data.id,
      player: { characterId: this.character.id, x: at.x, y: at.y, facing: this.facingDir, outfit: String(this.vars.outfit ?? 'default') },
      flags: { ...this.flags },
      vars: { ...this.vars },
      visited: [...this.visited],
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
        lights: this.lighting.states(),
        lighting: { fullScreenLayers: this.lighting.fullScreenLayers(), bakes: this.lighting.bakes },
        anim: this.figure.frameInfo(),
        walked: this.walked,
        path: this.path.length,
        pending: this.pendingAnchor?.key ?? null,
        zoom: this.cameras.main.zoom,
        zoomMul: this.zoomMul,
        shell: this.shellInfo,
        vars: { ...this.vars },
        seated: this.seated?.propKey ?? null,
        modal: this.input$.modal,
        displayObjects: this.children.length,
        highlight: { target: this.glowTarget, visible: !!(this.glow?.visible || this.doorGlow?.visible), depth: this.glow?.visible ? this.glow.depth : null },
        floor: this.lastFloor,
        visited: [...this.visited],
        flagsState: { ...this.flags },
        npcs: this.npcs.map((n) => ({ id: n.data.id, x: Math.round(n.state.x), y: Math.round(n.state.y), visible: n.view.sprite.visible, moving: n.state.moving })),
        mapKind: this.room.data.kind ?? 'interior',
        zone: this.zone,
        zones: this.room.zones?.map((z) => ({ id: z.id, x: z.x, y: z.y, w: z.w, h: z.h })) ?? null,
        bbox: this.room.bbox ?? null,
        tiles: { total: this.cullables.length, drawn: this.tilesDrawn },
        sceneStarts: SCENE_STARTS,
        camera: { scrollX: Math.round(this.cameras.main.scrollX), scrollY: Math.round(this.cameras.main.scrollY), zoom: this.cameras.main.zoom, viewW: Math.round(this.cameras.main.worldView.width), viewH: Math.round(this.cameras.main.worldView.height) },
        inspectables: this.room.props.filter((p) => p.inspect).map((p) => ({ key: p.key, name: p.inspect!.name, inspected: this.inspected.has(p.key) })),
        variant: (this.room.data as { variantKey?: string }).variantKey ?? null,
        renderScale: (() => { const r = this.registry.get('renderScale') as { scale: number; mode: string; history: unknown[] } | undefined; return r ? { scale: r.scale, mode: r.mode, changes: r.history.length } : null; })(),
        generatedTextures: { count: this.textures.getTextureKeys().filter((k) => /^(temp:|fx:|sky:|lightmap:)/.test(k)).length, bytes: this.generatedTextureBytes() },
        doorsArmed: this.doorsArmed,
        windows: this.skies.map((w) => ({ skyDepth: w.img.depth, curtainDepth: w.curtains.depth, curtainsVisible: w.curtains.visible })),
        audio: { state: audio().state, muted: audio().prefs.muted, prefs: { ...audio().prefs }, played: { ...audio().stats.played }, unlocks: audio().stats.unlocks, ambience: audio().ambience, wantedAmbience: audio().wanted, bufferBytes: audio().bufferBytes() },
      }),
      teleport: (x: number, y: number) => { this.seated = null; this.path = []; this.pendingAnchor = null; this.pos = { x, y }; this.syncActor(); this.snapCamera(); },
      tapWorld: (gx: number, gy: number, z = 0) => { const r = groundToRender(gx, gy, z); this.tapAtRender(r.x, r.y); },
      /** Test hooks for continuous floors: a door's interaction spot, a zone's default spawn and origin (floor coords). */
      doorSpot: (id: string) => { const a = this.room.anchors.find((x) => x.key === `door:${id}`); return a ? { x: a.x, y: a.y } : null; },
      zoneSpawn: (zone: string) => this.room.data.spawns[`${zone}.default`] ?? (zone === this.room.data.id ? this.room.data.spawns.default : null),
      zoneOrigin: (zone: string) => this.room.zones?.find((z) => z.id === zone)?.x ?? 0,
      zoneRect: (zone: string) => { const z = this.room.zones?.find((q) => q.id === zone); return z ? { x: z.x, y: z.y, w: z.w, h: z.h } : null; },
      /** Test hook: put an NPC somewhere (e.g. in Zila's way). */
      npcAt: (id: string, x: number, y: number) => { const n = this.npcs.find((q) => q.data.id === id); if (n) { n.state.x = x; n.state.y = y; n.state.target = null; n.state.waitMs = 3000; this.drawNpc(n, 0); } },
      setVars: (v: Vars) => { this.vars = { ...this.vars, ...v }; this.buildActor(); this.applyWorldVars(); },
      zoomBy: (d: number) => this.zoomBy(d),
      /** Ground point → CSS pixel on screen (for tests that click/tap real screen positions). */
      toScreen: (gx: number, gy: number, z = 0) => {
        const r = groundToRender(gx, gy, z), cam = this.cameras.main, dpr = (this.registry.get('dpr') as number | undefined) ?? 1;
        return { x: ((r.x - cam.worldView.x) * cam.zoom) / dpr, y: ((r.y - cam.worldView.y) * cam.zoom) / dpr };
      },
      save: () => this.persist(),
    };
  }
}

const DIR_VEC: Record<Direction, { x: number; y: number }> = {
  E: { x: 1, y: 0 }, SE: { x: 1, y: 1 }, S: { x: 0, y: 1 }, SW: { x: -1, y: 1 },
  W: { x: -1, y: 0 }, NW: { x: -1, y: -1 }, N: { x: 0, y: -1 }, NE: { x: 1, y: -1 },
};
