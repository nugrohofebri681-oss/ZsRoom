import { getPropSpec, propTopCm, type InteractionAnchorSpec, type PropSpec, type Rect } from '../core/specs';
import { groundToRender } from '../core/projection';
import type { WorldAnchor } from '../interaction/anchors';
import type { SortableProp } from './depth';

export interface RoomSpawn { x: number; y: number; facing: string }
export type DoorSide = 'north' | 'south' | 'east' | 'west';
/** How the engine draws the opening. 'none' = the prop art (e.g. a shopfront) paints the door itself. */
export type DoorStyle = 'door' | 'stairs' | 'gate' | 'open' | 'none';
export interface RoomDoor {
  id: string; label: string;
  /** North/south doors: x..x+w along the wall (y 0 / h). East/west doors: y..y+h along the wall (x 0 / w). */
  x: number; y: number; w: number; h: number;
  side?: DoorSide;
  style?: DoorStyle;
  to: { room: string; spawn: string };
  /** Locked or story-gated: the wall stays solid; using it shows the message. Opens when `unlessFlag` is set. */
  locked?: { message: string; unlessFlag?: string };
  /** Continuous-floor opening (P4): a gap in the side wall into the neighbouring zone — no stopper, no trigger. */
  opening?: boolean;
  /** Set on doors of composite floors: the zone rectangle the door belongs to (global x, its width/height). */
  zone?: { x: number; w: number; h: number };
}

/** Which wall a door sits in (explicit `side`, else derived from its position). */
export function doorSide(d: RoomDoor, size: { w: number; h: number }): DoorSide {
  if (d.side) return d.side;
  if (d.y <= 10 && d.w >= d.h) return 'north';
  if (d.y >= size.h - 20 && d.w >= d.h) return 'south';
  return d.x <= 10 ? 'west' : 'east';
}
/** A locked door is open when its unlock flag is set. */
export function doorOpen(d: RoomDoor, flags: Record<string, boolean>): boolean {
  return !d.locked || (!!d.locked.unlessFlag && !!flags[d.locked.unlessFlag]);
}
export type MapKind = 'interior' | 'exterior';
export type RoomVariant = Partial<Pick<RoomData, 'displayName' | 'palette' | 'shell' | 'props' | 'npcs' | 'onEnter' | 'ambience' | 'wallHeightCm'>>;

/** A ground area (cm) tiled with its own floor tile; `markings` adds cheap vector details (road kerbs, centre line). */
export interface GroundZone { floor: string; x: number; y: number; w: number; h: number; markings?: 'road' }
export interface RoomData {
  id: string;
  displayName: string;
  world: string;
  floor: string;
  /** interior (default): walls + ceiling light; exterior: open ground, building row as the back wall. */
  kind?: MapKind;
  /** Ambience bed: 'room' (default, day/night), 'street', 'shop'. */
  ambience?: 'room' | 'street' | 'shop';
  /** Provisional layout awaiting Creative Director review (shown in the HUD). */
  provisional?: boolean;
  npcs?: import('./npc').NpcData[];
  /** Event ids fired once when the map is entered (src/data/story/events.json). */
  onEnter?: string[];
  /**
   * Story-configurable interiors: alternative furnishings/loops sharing the same doors, spawns and size
   * (e.g. the workplace: office placeholder vs dimsum-shop placeholder). The active one is chosen by the
   * world registry (`placeholders.<variantOf>.variant`), so a story decision is a one-line data change.
   */
  variantOf?: string;
  defaultVariant?: string;
  variants?: Record<string, RoomVariant>;
  sizeCm: { w: number; h: number };
  wallHeightCm: number;
  palette: { floor: string; wall: string; trim: string };
  spawns: Record<string, RoomSpawn>;
  props: RoomPropEntry[];
  doors: RoomDoor[];
  /** Environment tiles for the room shell (spec ids). `zones` re-tile ground areas (road, path, grass) in place of
   *  the base floor — drawn once, never as a decal over the floor (no overdraw on fill-bound GPUs). */
  shell?: { floor: string; wall: string; zones?: GroundZone[] };
}

/**
 * A prop either stands on the floor at (x, y), or sits ON another prop's measured surface anchor
 * (`on`), e.g. a lamp on the nightstand. Instance ids let other entries refer to a prop.
 */
export type RoomPropEntry = (
  | { assetId: string; id?: string; x: number; y: number; on?: undefined; wall?: undefined }
  | { assetId: string; id?: string; on: { prop: string; surface: string; anchor: string }; x?: undefined; y?: undefined; wall?: undefined }
  | { assetId: string; id?: string; wall: { x: number; z: number }; x?: undefined; y?: undefined; on?: undefined }
) & {
  /** Per-placement interactions replacing the spec's (generic world props: one counter spec, many uses). */
  anchors?: InteractionAnchorSpec[];
  /**
   * Background / inspectable landmark: tapping it (or pressing E nearby) shows its name and a short NEUTRAL
   * comment. The engine builds the interaction spot (in front of the prop); no interior is implied.
   */
  inspect?: { name: string; comment: string };
  /** Per-placement TEMP look (e.g. a generic shop facade's sign text / colours). TEMP art only. */
  temp?: Record<string, unknown>;
};

/** Render layer of a prop instance. */
export type PropLayer = 'floor' | 'surface' | 'wall' | 'decal';
/** Floor decals (rugs) draw above the floor shell and engine shadows' floor, below everything standing. */
export const DECAL_DEPTH = -60000;

export interface PropInstance {
  key: string; spec: PropSpec;
  x: number; y: number;          // ground position (cm)
  z: number;                     // height above floor (0 for floor props; measured surface height for surface props)
  hostKey?: string;
  layer: PropLayer;
  /** Interaction anchors of this placement (room override, else the spec's). */
  anchors?: InteractionAnchorSpec[];
  /** Background/inspectable landmark info (name + neutral comment). */
  inspect?: { name: string; comment: string };
  /** Continuous floors: the zone (legacy room id) this prop belongs to, and its key inside that room. */
  zone?: string;
  zoneKey?: string;
  sortable: SortableProp;
}

/** Depth offset that keeps a surface prop drawn just above its host but below anything in front of the host. */
export const SURFACE_DEPTH_EPSILON = 0.25;
export interface CompiledRoom {
  data: RoomData;
  solids: Rect[];
  props: PropInstance[];
  anchors: WorldAnchor[];
}

const WALL = 40; // cm thickness of the implicit boundary walls
export const DOOR_DEPTH = 30; // cm an actor can step into a south doorway before the transition fires

const roomModules = import.meta.glob('../data/rooms/*.json', { eager: true, import: 'default' }) as Record<string, RoomData>;
import { placeholder } from './registry';

/** The variant a configurable room uses: explicit override, else the world registry, else its default. */
export function variantFor(data: RoomData, override?: string | null): string | null {
  if (!data.variants) return null;
  const want = override ?? (data.variantOf ? placeholder(data.variantOf)?.variant : undefined) ?? data.defaultVariant;
  return want && data.variants[want] ? want : (data.defaultVariant ?? Object.keys(data.variants)[0]!);
}

/** Room data with one variant's fields applied (doors, spawns and size always come from the base). */
export function resolveRoom(data: RoomData, variant?: string | null): RoomData {
  const key = variantFor(data, variant);
  if (!key) return data;
  const { variants: _v, ...base } = data;
  return { ...base, ...data.variants![key], variantKey: key } as RoomData & { variantKey: string };
}

/** Raw map data (variants unresolved). */
export const ROOM_DATA: ReadonlyMap<string, RoomData> = new Map(Object.values(roomModules).map((r) => [r.id, r]));
/** Map data as played (active variants resolved). */
export const ROOMS: ReadonlyMap<string, RoomData> = new Map([...ROOM_DATA].map(([id, r]) => [id, resolveRoom(r)]));

export function getRoom(id: string, variant?: string | null): RoomData {
  const r = ROOM_DATA.get(id);
  if (!r) throw new Error(`Unknown room: ${id}`);
  return resolveRoom(r, variant);
}

function tempHash(o: Record<string, unknown>): string {
  let h = 2166136261; for (const c of JSON.stringify(o)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0).toString(36);
}

export function propRenderBounds(spec: PropSpec, x: number, y: number): Rect {
  const scale = 1 / spec.density;
  const pivot = groundToRender(x, y);
  return {
    x: pivot.x - spec.pivot.x * scale,
    y: pivot.y - spec.pivot.y * scale,
    w: spec.canvas.width * scale,
    h: spec.canvas.height * scale,
  };
}

/** Render bounds that cover the volume a grey-box (or tightly-cropped art) actually occupies. */
export function propVolumeRenderBounds(spec: PropSpec, x: number, y: number): Rect {
  const backTop = groundToRender(x, y - spec.footprint.depthCm, propTopCm(spec));
  const front = groundToRender(x, y);
  return { x: x - spec.footprint.widthCm / 2, y: backTop.y, w: spec.footprint.widthCm, h: front.y - backTop.y };
}

export function compileRoom(data: RoomData, flags: Record<string, boolean> = {}): CompiledRoom {
  const { w, h } = data.sizeCm;
  const open = data.doors.filter((d) => doorOpen(d, flags));
  const solids: Rect[] = [{ x: -WALL, y: -WALL, w: w + 2 * WALL, h: WALL }];   // north (north doors are recesses)
  // South / east / west walls are split around open doorways. Each doorway is a short threshold ending in a
  // stopper, not an exit into the void: crossing the threshold fires the transition.
  const split = (side: DoorSide, along: (d: RoomDoor) => [number, number], wallRect: (a: number, b: number) => Rect, stopper: (a: number, b: number) => Rect, len: number) => {
    let cursor = -WALL;
    for (const d of open.filter((x) => doorSide(x, data.sizeCm) === side).sort((a, b) => along(a)[0] - along(b)[0])) {
      const [a, b] = along(d);
      if (a > cursor) solids.push(wallRect(cursor, a));
      if (!d.opening) solids.push(stopper(a, b));     // openings continue into the neighbouring zone
      cursor = b;
    }
    solids.push(wallRect(cursor, len + WALL));
  };
  split('south', (d) => [d.x, d.x + d.w], (a, b) => ({ x: a, y: h, w: b - a, h: WALL }), (a, b) => ({ x: a, y: h + DOOR_DEPTH, w: b - a, h: WALL }), w);
  split('west', (d) => [d.y, d.y + d.h], (a, b) => ({ x: -WALL, y: a, w: WALL, h: b - a }), (a, b) => ({ x: -DOOR_DEPTH - WALL, y: a, w: WALL, h: b - a }), h);
  split('east', (d) => [d.y, d.y + d.h], (a, b) => ({ x: w, y: a, w: WALL, h: b - a }), (a, b) => ({ x: w + DOOR_DEPTH, y: a, w: WALL, h: b - a }), h);

  const props: PropInstance[] = [];
  const byId = new Map<string, PropInstance>();
  // Floor props first, then surface props (which need their host resolved).
  const order = data.props.map((p, i) => ({ p, i })).sort((a, b) => Number(!!a.p.on) - Number(!!b.p.on));
  for (const { p, i } of order) {
    const base = getPropSpec(p.assetId);
    // A placement can restyle a generic TEMP placeholder; it gets its own texture key (id~hash), same geometry.
    const spec = p.temp && base.temp ? { ...base, id: `${base.id}~${tempHash(p.temp)}`, temp: { ...base.temp, ...p.temp } } : base;
    const key = `${spec.id}#${i}`;
    let inst: PropInstance;
    if (p.on) {
      const host = byId.get(p.on.prop);
      if (!host) throw new Error(`${data.id}: ${key} is placed on unknown prop id "${p.on.prop}"`);
      const surface = host.spec.surfaces?.find((s) => s.id === p.on!.surface);
      const anchor = surface?.anchors.find((a) => a.id === p.on!.anchor);
      if (!surface || !anchor) throw new Error(`${data.id}: ${host.key} has no surface anchor ${p.on.surface}/${p.on.anchor}`);
      if (spec.placement?.type === 'surface' && spec.placement.hostAsset !== host.spec.id) throw new Error(`${key} must be placed on ${spec.placement.hostAsset}, not ${host.spec.id}`);
      const x = host.x + anchor.x, y = host.y + anchor.y, z = anchor.z;
      const footprint: Rect = { x: x - spec.footprint.widthCm / 2, y: y - spec.footprint.depthCm / 2, w: spec.footprint.widthCm, h: spec.footprint.depthCm };
      const top = groundToRender(x, y, z + propTopCm(spec)).y;
      const base = groundToRender(x, y, z).y;
      inst = {
        key, spec, x, y, z, hostKey: host.key, layer: 'surface',
        // Sorts with its host: just above it, so anything in front of the host is also in front of the prop.
        sortable: { id: key, pivotY: host.y + SURFACE_DEPTH_EPSILON, footprint, renderBounds: { x: x - spec.footprint.widthCm / 2 - 4, y: top, w: spec.footprint.widthCm + 8, h: base - top }, occluder: spec.occluder },
      };
      // Surface props never add floor collision.
    } else if (p.wall) {
      if (spec.placement?.type !== 'wall') throw new Error(`${data.id}: ${key} is not a wall-mounted asset`);
      // Wall items: pivot = bottom-centre of the front face, i.e. ground y = protrusion depth, z = mount height.
      const x = p.wall.x, y = spec.footprint.depthCm, z = p.wall.z;
      const footprint: Rect = { x: x - spec.footprint.widthCm / 2, y: 0, w: spec.footprint.widthCm, h: y };
      const top = groundToRender(x, 0, z + propTopCm(spec)).y;
      inst = { key, spec, x, y, z, layer: 'wall', sortable: { id: key, pivotY: y, footprint, renderBounds: { x: footprint.x, y: top, w: footprint.w, h: groundToRender(x, y, z).y - top }, occluder: false } };
    } else {
      if (p.x === undefined || p.y === undefined) throw new Error(`${data.id}: ${key} needs x/y, on, or wall placement`);
      if (spec.placement?.type === 'wall' || spec.placement?.type === 'surface') throw new Error(`${data.id}: ${key} needs ${spec.placement.type} placement`);
      if (spec.placement?.type === 'floor') {
        // Floor decal (rug): pivot = centre; no collision; always below standing things.
        const footprint: Rect = { x: p.x - spec.footprint.widthCm / 2, y: p.y - spec.footprint.depthCm / 2, w: spec.footprint.widthCm, h: spec.footprint.depthCm };
        inst = { key, spec, x: p.x, y: p.y, z: 0, layer: 'decal', sortable: { id: key, pivotY: DECAL_DEPTH, footprint, renderBounds: { x: 0, y: 0, w: 0, h: 0 }, occluder: false } };
      } else {
        const footprint: Rect = { x: p.x - spec.footprint.widthCm / 2, y: p.y - spec.footprint.depthCm, w: spec.footprint.widthCm, h: spec.footprint.depthCm };
        for (const c of spec.collision) solids.push({ x: p.x + c.x, y: p.y + c.y, w: c.w, h: c.h });
        inst = { key, spec, x: p.x, y: p.y, z: 0, layer: 'floor', sortable: { id: key, pivotY: p.y, footprint, renderBounds: propVolumeRenderBounds(spec, p.x, p.y), occluder: spec.occluder } };
      }
    }
    if (p.anchors) inst.anchors = p.anchors;
    else if (p.inspect) {
      const wallItem = inst.layer === 'wall';
      inst.anchors = [{ id: 'inspect', label: p.inspect.name, x: 0, y: wallItem ? 60 : 30, facing: 'N', radiusCm: wallItem ? Math.min(90, spec.footprint.widthCm / 2) : 50,
        action: { type: 'inspect', name: p.inspect.name, comment: p.inspect.comment } }];
    }
    if (p.inspect) inst.inspect = p.inspect;
    props.push(inst);
    if (p.id) byId.set(p.id, inst);
  }

  const anchors: WorldAnchor[] = [];
  for (const p of props) {
    for (const a of p.anchors ?? p.spec.interactionAnchors) {
      const ay = p.layer === 'wall' ? a.y : p.y + a.y; // wall-item anchors are measured from the wall plane
      anchors.push({ key: `${p.key}:${a.id}`, ownerId: p.key, label: a.label, x: p.x + a.x, y: ay, radiusCm: a.radiusCm, kind: 'prop', payload: { anchorId: a.id, action: a.action }, ...(a.whileSeatedOn ? { whileSeatedOn: a.whileSeatedOn } : {}) });
    }
  }
  for (const d of data.doors) {
    if (d.opening) continue;                           // walk-through gap, not a usable door
    const side = doorSide(d, data.sizeCm), isOpen = doorOpen(d, flags);
    const pos = side === 'north' ? { x: d.x + d.w / 2, y: 25 } : side === 'south' ? { x: d.x + d.w / 2, y: h - 15 }
      : side === 'west' ? { x: 15, y: d.y + d.h / 2 } : { x: w - 15, y: d.y + d.h / 2 };
    anchors.push({
      key: `door:${d.id}`, ownerId: d.id, label: d.label, ...pos, radiusCm: 50, kind: 'door',
      payload: isOpen ? d.to : { locked: d.locked!.message },
    });
  }
  return { data, solids, props, anchors };
}
