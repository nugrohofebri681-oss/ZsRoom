import type { Rect } from '../core/specs';
import type { WorldAnchor } from '../interaction/anchors';
import { compileRoom, getRoom, ROOM_DATA, type CompiledRoom, type PropInstance, type RoomData, type RoomDoor, type RoomSpawn, doorSide } from './room';
import type { NpcData } from './npc';

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
export interface FloorZoneDef { room: string; x: number }
export interface FloorOpeningDef { between: [string, string]; y: number; h: number }
export interface FloorDef {
  id: string; displayName: string; world: string;
  /** Zone whose prop keys stay unprefixed (keeps established ids for tests, flags and tools). */
  primary: string;
  zones: FloorZoneDef[];
  openings: FloorOpeningDef[];
  provisional?: boolean;
}
export interface ZoneInfo { id: string; x: number; w: number; h: number; data: RoomData; prefix: string }
export interface CompiledFloor extends CompiledRoom { zones: ZoneInfo[] }

const floorModules = import.meta.glob('../data/floors/*.json', { eager: true, import: 'default' }) as Record<string, FloorDef>;
export const FLOORS: ReadonlyMap<string, FloorDef> = new Map(Object.values(floorModules).map((f) => [f.id, f]));

/** Legacy room id → the floor that contains it (and the zone origin). */
export const ZONE_OF: ReadonlyMap<string, { floor: string; x: number }> = new Map(
  [...FLOORS.values()].flatMap((f) => f.zones.map((z) => [z.room, { floor: f.id, x: z.x }] as const)),
);

/** Ids of every map the player can actually be in (floors + rooms that are not zones of a floor). */
export function playableMapIds(): string[] {
  return [...FLOORS.keys(), ...[...ROOM_DATA.keys()].filter((id) => !ZONE_OF.has(id) && id !== 'review_props')];
}

/**
 * Resolve a destination that may name a legacy room id: returns the map to load, the spawn name inside it,
 * and (for saves) a position converted to the map's coordinates.
 */
export function resolveDestination(roomId: string, spawn?: string, at?: { x: number; y: number; facing: string }): { mapId: string; spawn?: string; at?: { x: number; y: number; facing: string } } {
  const z = ZONE_OF.get(roomId);
  if (!z) return { mapId: roomId, spawn, at };
  return { mapId: z.floor, spawn: `${roomId}.${spawn ?? 'default'}`, at: at ? { ...at, x: at.x + z.x } : undefined };
}

const offRect = (r: Rect, dx: number): Rect => ({ ...r, x: r.x + dx });

function offsetProp(p: PropInstance, dx: number, prefix: string, zone: string): PropInstance {
  const s = p.sortable;
  return {
    ...p, key: prefix + p.key, x: p.x + dx, hostKey: p.hostKey ? prefix + p.hostKey : undefined, zone, zoneKey: p.key,
    // render x = ground x for this projection, so render bounds shift by the same dx
    sortable: { ...s, id: prefix + s.id, footprint: offRect(s.footprint, dx), renderBounds: offRect(s.renderBounds, dx) },
  };
}

function offsetNpc(n: NpcData, dx: number): NpcData {
  const b = n.behaviour;
  const behaviour = b.type === 'wander' ? { ...b, area: offRect(b.area, dx) } : b.type === 'patrol' ? { ...b, points: b.points.map((p) => ({ ...p, x: p.x + dx })) } : b;
  const schedule = n.schedule && Object.fromEntries(Object.entries(n.schedule).map(([k, v]) => [k, v === 'away' || !v ? v : { ...v, x: v.x + dx }]));
  return { ...n, x: n.x + dx, behaviour, ...(schedule ? { schedule } : {}) };
}

/** Zone room data with internal doors replaced by openings (side walls get gaps, no stoppers/triggers). */
export function zoneRoomData(f: FloorDef, zoneId: string, variant?: string | null): RoomData {
  const data = getRoom(zoneId, variant);
  const others = new Set(f.zones.map((z) => z.room).filter((r) => r !== zoneId));
  const idx = f.zones.findIndex((z) => z.room === zoneId);
  const openings: RoomDoor[] = [];
  for (const o of f.openings) {
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
    zones.push({ id: z.room, x: z.x, w: data.sizeCm.w, h: data.sizeCm.h, data, prefix });
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
      doors.push({ ...d, side, x: d.x + z.x, zone: { x: z.x, w: data.sizeCm.w, h: data.sizeCm.h } } as RoomDoor);
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
export function compileMap(id: string, flags: Record<string, boolean> = {}, variant?: string | null): CompiledRoom & { zones?: ZoneInfo[] } {
  const f = FLOORS.get(resolveDestination(id).mapId);
  return f ? compileFloor(f, flags, variant) : compileRoom(getRoom(id, variant), flags);
}

/** Which zone (logical room) a global position is in. */
export function zoneAt(zones: ZoneInfo[] | undefined, x: number): ZoneInfo | undefined {
  if (!zones?.length) return undefined;
  // a zone owns [its x, next zone's x): the partition belongs to the zone on its left
  for (let i = zones.length - 1; i >= 0; i--) if (x >= zones[i]!.x) return zones[i];
  return zones[0];
}
