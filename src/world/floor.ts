import type { Rect } from '../core/specs';
import type { WorldAnchor } from '../interaction/anchors';
import { compileRoom, getRoom, ROOM_DATA, type CompiledRoom, type PropInstance, type RoomData, type RoomDoor, type RoomSpawn, doorSide } from './room';
import type { NpcData } from './npc';
import { DEPTH_SCALE } from '../core/projection';
import { compileRegion } from './region';

/**
 * CONTINUOUS FLOORS (P4): several same-level rooms ("zones") composed into ONE walkable map, so the player
 * walks through interior doorways with no scene change while the camera keeps following.
 *
 * - Zones are existing room files (src/data/rooms), laid out side by side along X and sharing the north wall
 *   line (y = 0). Local room coordinates → global floor coordinates: (x + zone.x, y).
 * - Between neighbouring zones a real partition wall (the two rooms' side walls) stays solid except for an
 *   OPENING: a gap with no threshold stopper, no trigger and no transition.
 * - Doors of a zone that led to another zone of the same floor are dropped (they are now openings); doors to
 *   other maps (stairs, front door…) are kept, offset, and keep their targets.
 * - Legacy room ids stay valid as ALIASES: a door, save or URL that names `living_room` resolves to the floor
 *   that contains it, with spawns `<zone>.<spawn>` and positions offset by the zone origin.
 *
 * Floors are defined in src/data/floors/<id>.json. Distinct floors, buildings and districts still use scene
 * transitions (stairs, exterior doors, shop doors).
 */
export interface FloorZoneDef { room: string; x: number; y?: number }
/** Outdoor regions (P5): a low fence/hedge line with real collision, drawn as part of the region. */
export interface FenceDef { x: number; y: number; w: number; h: number; height?: number; color?: string }
/** Legacy save remap: a local x range of a zone whose content moved when the zone joined a region. */
export interface LegacyShift { x0: number; x1: number; dx: number }
/** Legacy save remap by landmark (P6): a position near `from` (old map coordinates) lands near `to` (this map). */
export interface LegacyAnchor { from: [number, number]; to: [number, number]; label?: string }
/** Region ground layer (P6 towns): a rectangle of an environment tile — road, lane, pavement, grass, plaza. */
export interface GroundLayerDef { floor: string; x: number; y: number; w: number; h: number; markings?: 'road' | 'lane'; base?: boolean }
/**
 * Free-standing building (P6 towns): footprint `depth` cm deep behind its front line `y`, centred on `x`. The
 * facade asset paints the front; the engine adds the roof seen from above and the collision footprint. A door on
 * the front works like a north door (walk into it / press E); `inspect` makes a background building inspectable.
 */
export type RoofStyle = 'tile' | 'gable' | 'hip' | 'flat' | 'zinc' | 'canopy';
export interface ArchetypeDef {
  facade: string; depth: number; roof?: { style?: RoofStyle; color?: string }; yard?: { depth: number; gate?: number }; use?: string;
  /** G1 contract: where the entrance sits on the facade (door trigger / yard gate / inspect spot). */
  entrance?: { dx: number; widthCm: number };
  /** G1 contract: asset id of the roof layer. While it has no approved art the engine draws a TEMP roof; never both. */
  roofArt?: string;
  /** G1 contract (frozen dimensions, layers, pivots, openings): see docs/production/ARCHITECTURE_CONTRACT_G1.md. */
  contract?: Record<string, unknown>;
}
export interface BuildingDef {
  id: string; x: number; y: number;
  /** P6.1: a named archetype (src/data/archetypes.json) supplies facade, depth, roof and yard; fields here override. */
  archetype?: string;
  facade?: string; depth?: number;
  roof?: string;
  roofStyle?: RoofStyle;
  /** Per-placement TEMP restyle of the facade (sign text, colours, goods), like room props' `temp`. */
  temp?: Record<string, unknown>;
  /** A fenced front yard: fence `depth` cm in front of the facade, with a gate gap at the door. */
  yard?: { depth: number; gate?: number };
  door?: { id: string; label: string; to: { room: string; spawn: string }; w?: number; dx?: number; locked?: { message: string; unlessFlag?: string } };
  inspect?: { name: string; comment: string };
  /** A dialogue or story event at the front (e.g. a market seller: buying is an event). */
  talk?: { label: string; dialogue?: string; event?: string };
}
type Phase = 'morning' | 'afternoon' | 'evening' | 'night';
/**
 * P6.1 crowd: ambient people generated from a few looks and routes. `count` is how many are present per time of day
 * (a design target per place, never a claim about real head-counts). Only every `talkEvery`-th person can be greeted.
 */
export interface CrowdDef {
  id: string; name: string;
  count: Partial<Record<Phase, number>>;
  looks: import('./npc').NpcData['look'][];
  /** Routes of activity points (region coordinates); people are spread along them. A route of one point = stays put. */
  routes: import('./npc').ActivityPoint[][];
  speed?: number;
  interact?: { label: string; dialogue?: string; event?: string };
  talkEvery?: number;
}
export interface FloorOpeningDef { between: [string, string]; y: number; h: number }
export interface FloorDef {
  id: string; displayName: string; world: string;
  /** Zone whose prop keys stay unprefixed (keeps established ids for tests, flags and tools). */
  primary: string;
  zones: FloorZoneDef[];
  openings?: FloorOpeningDef[];
  provisional?: boolean;
  /** 'floor' (default, P4): same-level interior rooms side by side with partition walls and openings.
   *  'region' (P5): an OUTDOOR district — zones offset in x AND y, open walkable shared boundaries, fences. */
  kind?: 'floor' | 'region';
  fences?: FenceDef[];
  legacy?: Record<string, LegacyShift[]>;
  /** P6 towns: ground drawn once for the whole region (zones then draw no shell), buildings, region-level props. */
  ground?: GroundLayerDef[];
  buildings?: BuildingDef[];
  props?: import('./room').RoomPropEntry[];
  crowds?: CrowdDef[];
  /** Old save/door map ids → landmark anchors (old coordinates → this region). Keys may be zones or other ids
   *  (e.g. the P5 region `batuphat_region`); non-zone keys become aliases of this region. */
  legacyMaps?: Record<string, LegacyAnchor[]>;
}
export interface ZoneInfo { id: string; x: number; y: number; w: number; h: number; data: RoomData; prefix: string; wallGaps?: [number, number][] }
export interface BuildingInfo { key: string; id: string; x0: number; x1: number; front: number; depth: number; height: number; roof: string; roofStyle: RoofStyle; zone: string; archetype?: string; roofArt?: string }
export interface CompiledFloor extends CompiledRoom {
  zones: ZoneInfo[];
  ground?: GroundLayerDef[];
  buildings?: BuildingInfo[];
  /** Regions: ground-space bounding box of the zones (camera/lighting bounds), and fence lines. */
  bbox?: { x: number; y: number; w: number; h: number };
  fences?: FenceDef[];
}

const floorModules = import.meta.glob(['../data/floors/*.json', '../data/regions/*.json'], { eager: true, import: 'default' }) as Record<string, FloorDef>;
export const FLOORS: ReadonlyMap<string, FloorDef> = new Map(Object.values(floorModules).map((f) => [f.id, f]));

/** Legacy room id → the floor/region that contains it (and the zone origin). */
export const ZONE_OF: ReadonlyMap<string, { floor: string; x: number; y: number; legacy?: LegacyShift[]; anchors?: LegacyAnchor[] }> = new Map(
  [...FLOORS.values()].flatMap((f) => f.zones.map((z) => [z.room, { floor: f.id, x: z.x, y: z.y ?? 0, legacy: f.legacy?.[z.room], anchors: f.legacyMaps?.[z.room] }] as const)),
);
/** Old map ids that are not zones but now live inside a region (e.g. P5 `batuphat_region` → P6 town). */
export const MAP_ALIAS: ReadonlyMap<string, { floor: string; anchors: LegacyAnchor[] }> = new Map(
  [...FLOORS.values()].flatMap((f) => Object.entries(f.legacyMaps ?? {}).filter(([k]) => !f.zones.some((z) => z.room === k) && !FLOORS.has(k)).map(([k, anchors]) => [k, { floor: f.id, anchors }] as const)),
);

/** Nearest landmark anchor: keep the small offset from it (≤ 80 cm), so the player lands beside the same thing. */
function viaAnchors(anchors: LegacyAnchor[], x: number, y: number): { x: number; y: number } {
  let best = anchors[0]!, bd = Infinity;
  for (const a of anchors) { const d = Math.hypot(a.from[0] - x, a.from[1] - y); if (d < bd) { bd = d; best = a; } }
  const cl = (v: number) => Math.max(-80, Math.min(80, v));
  return { x: best.to[0] + cl(x - best.from[0]), y: best.to[1] + cl(y - best.from[1]) };
}

/** Local position of a legacy zone → composite coordinates (zone offset, plus the documented content moves). */
export function legacyToComposite(roomId: string, x: number, y: number): { x: number; y: number } {
  const z = ZONE_OF.get(roomId);
  const alias = MAP_ALIAS.get(roomId);
  if (alias) return viaAnchors(alias.anchors, x, y);
  if (!z) return { x, y };
  if (z.anchors?.length) return viaAnchors(z.anchors, x, y);
  const shift = z.legacy?.find((s) => x >= s.x0 && x <= s.x1)?.dx ?? 0;
  return { x: x + shift + z.x, y: y + z.y };
}

/** Ids of every map the player can actually be in (floors + rooms that are not zones of a floor). */
export function playableMapIds(): string[] {
  return [...FLOORS.keys(), ...[...ROOM_DATA.keys()].filter((id) => !ZONE_OF.has(id) && !MAP_ALIAS.has(id) && id !== 'review_props')];
}

/**
 * Resolve a destination that may name a legacy room id: returns the map to load, the spawn name inside it,
 * and (for saves) a position converted to the map's coordinates.
 */
export function resolveDestination(roomId: string, spawn?: string, at?: { x: number; y: number; facing: string }): { mapId: string; spawn?: string; at?: { x: number; y: number; facing: string } } {
  const alias = MAP_ALIAS.get(roomId);
  if (alias) return { mapId: alias.floor, spawn: spawn && spawn.includes('.') ? spawn : undefined, at: at ? { ...at, ...legacyToComposite(roomId, at.x, at.y) } : undefined };
  const z = ZONE_OF.get(roomId);
  if (!z) return { mapId: roomId, spawn, at };
  return { mapId: z.floor, spawn: `${roomId}.${spawn ?? 'default'}`, at: at ? { ...at, ...legacyToComposite(roomId, at.x, at.y) } : undefined };
}

export const offRect = (r: Rect, dx: number, dy = 0): Rect => ({ ...r, x: r.x + dx, y: r.y + dy });

/** Shift a compiled prop by a zone offset (ground dx, dy). Render x = ground x; render y shifts by dy × K. */
export function offsetProp(p: PropInstance, dx: number, prefix: string, zone: string, dy = 0): PropInstance {
  const s = p.sortable, ry = dy * DEPTH_SCALE;
  return {
    ...p, key: prefix + p.key, x: p.x + dx, y: p.y + dy, hostKey: p.hostKey ? prefix + p.hostKey : undefined, zone, zoneKey: p.key,
    sortable: { ...s, id: prefix + s.id, pivotY: s.pivotY + dy, footprint: offRect(s.footprint, dx, dy), renderBounds: offRect(s.renderBounds, dx, ry) },
  };
}

export function offsetNpc(n: NpcData, dx: number, dy = 0): NpcData {
  const b = n.behaviour;
  const behaviour = b.type === 'wander' ? { ...b, area: offRect(b.area, dx, dy) } : b.type === 'patrol' ? { ...b, points: b.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy })) } : b;
  const schedule = n.schedule && Object.fromEntries(Object.entries(n.schedule).map(([k, v]) => [k, v === 'away' || !v ? v : { ...v, x: v.x + dx, y: v.y + dy }]));
  return { ...n, x: n.x + dx, y: n.y + dy, behaviour, ...(schedule ? { schedule } : {}) };
}

/** Zone room data with internal doors replaced by openings (side walls get gaps, no stoppers/triggers). */
export function zoneRoomData(f: FloorDef, zoneId: string, variant?: string | null): RoomData {
  const data = getRoom(zoneId, variant);
  const others = new Set(f.zones.map((z) => z.room).filter((r) => r !== zoneId));
  const idx = f.zones.findIndex((z) => z.room === zoneId);
  const openings: RoomDoor[] = [];
  for (const o of f.openings ?? []) {
    const k = o.between.indexOf(zoneId);
    if (k < 0) continue;
    const other = o.between[1 - k]!, otherIdx = f.zones.findIndex((z) => z.room === other);
    const side = otherIdx > idx ? 'east' : 'west';
    openings.push({ id: `opening:${other}`, label: '', side, style: 'open', opening: true, x: side === 'east' ? data.sizeCm.w : 0, y: o.y, w: 10, h: o.h, to: { room: other, spawn: 'default' } } as RoomDoor);
  }
  return { ...data, doors: [...data.doors.filter((d) => !others.has(d.to.room)), ...openings] };
}

export function compileFloor(f: FloorDef, flags: Record<string, boolean> = {}, variant?: string | null): CompiledFloor {
  const zones: ZoneInfo[] = [];
  const solids: Rect[] = [], props: PropInstance[] = [], anchors: WorldAnchor[] = [], doors: RoomDoor[] = [], npcs: NpcData[] = [];
  const spawns: Record<string, RoomSpawn> = {};
  let W = 0, H = 0, wallH = 0;
  for (const z of f.zones) {
    const data = zoneRoomData(f, z.room, variant);
    const c = compileRoom(data, flags);
    const prefix = z.room === f.primary ? '' : `${z.room}/`;
    zones.push({ id: z.room, x: z.x, y: 0, w: data.sizeCm.w, h: data.sizeCm.h, data, prefix });
    W = Math.max(W, z.x + data.sizeCm.w); H = Math.max(H, data.sizeCm.h); wallH = Math.max(wallH, data.wallHeightCm);
    for (const s of c.solids) solids.push(offRect(s, z.x));
    for (const p of c.props) props.push(offsetProp(p, z.x, prefix, z.room));
    for (const a of c.anchors) {
      if ((a.payload as { opening?: boolean } | undefined)?.opening) continue;
      anchors.push({ ...a, key: a.kind === 'door' ? a.key : prefix + a.key, ownerId: a.kind === 'door' ? a.ownerId : prefix + a.ownerId, x: a.x + z.x });
    }
    for (const d of data.doors) {
      if ((d as RoomDoor & { opening?: boolean }).opening) continue;
      const side = doorSide(d, data.sizeCm);
      doors.push({ ...d, side, x: d.x + z.x, zone: { x: z.x, y: 0, w: data.sizeCm.w, h: data.sizeCm.h } } as RoomDoor);
    }
    for (const n of data.npcs ?? []) npcs.push(offsetNpc(n, z.x));
    for (const [name, sp] of Object.entries(data.spawns)) spawns[`${z.room}.${name}`] = { ...sp, x: sp.x + z.x };
  }
  // void below shorter zones is solid (never walkable, never a path target)
  for (const z of zones) if (z.h < H) solids.push({ x: z.x - 40, y: z.h, w: z.w + 80, h: H - z.h + 40 });
  const primary = zones.find((z) => z.id === f.primary) ?? zones[0]!;
  spawns.default = spawns[`${primary.id}.default`]!;
  const pd = primary.data;
  const data: RoomData = {
    id: f.id, displayName: f.displayName, world: f.world, floor: pd.floor, kind: 'interior', provisional: f.provisional,
    sizeCm: { w: W, h: H }, wallHeightCm: wallH, palette: pd.palette, shell: pd.shell,
    spawns, props: [], doors, npcs,
  };
  return { data, solids, props, anchors, zones };
}

/** Compile any playable map id (floor or plain room); legacy zone ids resolve to their floor. */
export function compileMap(id: string, flags: Record<string, boolean> = {}, variant?: string | null): CompiledRoom & Partial<Pick<CompiledFloor, 'zones' | 'bbox' | 'fences' | 'ground' | 'buildings'>> {
  const f = FLOORS.get(resolveDestination(id).mapId);
  if (!f) return compileRoom(getRoom(id, variant), flags);
  return f.kind === 'region' ? compileRegion(f, flags, variant) : compileFloor(f, flags, variant);
}

/** Which zone (logical room) a global position is in. */
export function zoneAt(zones: ZoneInfo[] | undefined, x: number, y = 0): ZoneInfo | undefined {
  if (!zones?.length) return undefined;
  if (zones.some((z) => z.y !== 0)) {
    // regions: the zone whose rectangle contains the point, else the nearest one (a shared edge belongs to the
    // zone listed first, e.g. the fence line belongs to the yard)
    const inside = zones.find((z) => x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h);
    if (inside) return inside;
    const d = (z: ZoneInfo) => Math.hypot(Math.max(z.x - x, 0, x - z.x - z.w), Math.max(z.y - y, 0, y - z.y - z.h));
    return zones.reduce((a, b) => (d(b) < d(a) ? b : a));
  }
  // floors: a zone owns [its x, next zone's x): the partition belongs to the zone on its left
  for (let i = zones.length - 1; i >= 0; i--) if (x >= zones[i]!.x) return zones[i];
  return zones[0];
}
