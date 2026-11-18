import { getPropSpec, propTopCm, type PropSpec, type Rect } from '../core/specs';
import { groundToRender } from '../core/projection';
import type { WorldAnchor } from '../interaction/anchors';
import type { SortableProp } from './depth';

export interface RoomSpawn { x: number; y: number; facing: string }
export interface RoomDoor {
  id: string; label: string; x: number; y: number; w: number; h: number;
  to: { room: string; spawn: string };
}
export interface RoomData {
  id: string;
  displayName: string;
  world: string;
  floor: string;
  sizeCm: { w: number; h: number };
  wallHeightCm: number;
  palette: { floor: string; wall: string; trim: string };
  spawns: Record<string, RoomSpawn>;
  props: RoomPropEntry[];
  doors: RoomDoor[];
}

/**
 * A prop either stands on the floor at (x, y), or sits ON another prop's measured surface anchor
 * (`on`), e.g. a lamp on the nightstand. Instance ids let other entries refer to a prop.
 */
export type RoomPropEntry =
  | { assetId: string; id?: string; x: number; y: number; on?: undefined }
  | { assetId: string; id?: string; on: { prop: string; surface: string; anchor: string }; x?: undefined; y?: undefined };

export interface PropInstance {
  key: string; spec: PropSpec;
  x: number; y: number;          // ground position (cm)
  z: number;                     // height above floor (0 for floor props; measured surface height for surface props)
  hostKey?: string;
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
export const ROOMS: ReadonlyMap<string, RoomData> = new Map(Object.values(roomModules).map((r) => [r.id, r]));

export function getRoom(id: string): RoomData {
  const r = ROOMS.get(id);
  if (!r) throw new Error(`Unknown room: ${id}`);
  return r;
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

export function compileRoom(data: RoomData): CompiledRoom {
  const { w, h } = data.sizeCm;
  const doorGaps = data.doors;
  const solids: Rect[] = [
    { x: -WALL, y: -WALL, w: w + 2 * WALL, h: WALL },      // north
    { x: -WALL, y: 0, w: WALL, h },                         // west
    { x: w, y: 0, w: WALL, h },                              // east
  ];
  // South wall, split around door gaps that sit on the south edge.
  const southDoors = doorGaps.filter((d) => d.y >= h - 20).sort((a, b) => a.x - b.x);
  let cursor = -WALL;
  for (const d of southDoors) {
    if (d.x > cursor) solids.push({ x: cursor, y: h, w: d.x - cursor, h: WALL });
    solids.push({ x: d.x, y: h + DOOR_DEPTH, w: d.w, h: WALL }); // stopper: the doorway is a short threshold, not an exit into the void
    cursor = d.x + d.w;
  }
  solids.push({ x: cursor, y: h, w: w + WALL - cursor, h: WALL });
  // North-wall doors are recesses: the north wall stays solid, the door anchor sits just inside.

  const props: PropInstance[] = [];
  const byId = new Map<string, PropInstance>();
  // Floor props first, then surface props (which need their host resolved).
  const order = data.props.map((p, i) => ({ p, i })).sort((a, b) => Number(!!a.p.on) - Number(!!b.p.on));
  for (const { p, i } of order) {
    const spec = getPropSpec(p.assetId);
    const key = `${spec.id}#${i}`;
    let inst: PropInstance;
    if (p.on) {
      const host = byId.get(p.on.prop);
      if (!host) throw new Error(`${data.id}: ${key} is placed on unknown prop id "${p.on.prop}"`);
      const surface = host.spec.surfaces?.find((s) => s.id === p.on!.surface);
      const anchor = surface?.anchors.find((a) => a.id === p.on!.anchor);
      if (!surface || !anchor) throw new Error(`${data.id}: ${host.key} has no surface anchor ${p.on.surface}/${p.on.anchor}`);
      if (spec.placement && spec.placement.hostAsset !== host.spec.id) throw new Error(`${key} must be placed on ${spec.placement.hostAsset}, not ${host.spec.id}`);
      const x = host.x + anchor.x, y = host.y + anchor.y, z = anchor.z;
      const footprint: Rect = { x: x - spec.footprint.widthCm / 2, y: y - spec.footprint.depthCm / 2, w: spec.footprint.widthCm, h: spec.footprint.depthCm };
      const top = groundToRender(x, y, z + propTopCm(spec)).y;
      const base = groundToRender(x, y, z).y;
      inst = {
        key, spec, x, y, z, hostKey: host.key,
        // Sorts with its host: just above it, so anything in front of the host is also in front of the prop.
        sortable: { id: key, pivotY: host.y + SURFACE_DEPTH_EPSILON, footprint, renderBounds: { x: x - spec.footprint.widthCm / 2 - 4, y: top, w: spec.footprint.widthCm + 8, h: base - top }, occluder: spec.occluder },
      };
      // Surface props never add floor collision.
    } else {
      const footprint: Rect = { x: p.x - spec.footprint.widthCm / 2, y: p.y - spec.footprint.depthCm, w: spec.footprint.widthCm, h: spec.footprint.depthCm };
      for (const c of spec.collision) solids.push({ x: p.x + c.x, y: p.y + c.y, w: c.w, h: c.h });
      inst = { key, spec, x: p.x, y: p.y, z: 0, sortable: { id: key, pivotY: p.y, footprint, renderBounds: propVolumeRenderBounds(spec, p.x, p.y), occluder: spec.occluder } };
    }
    props.push(inst);
    if (p.id) byId.set(p.id, inst);
  }

  const anchors: WorldAnchor[] = [];
  for (const p of props) {
    for (const a of p.spec.interactionAnchors) {
      anchors.push({ key: `${p.key}:${a.id}`, ownerId: p.key, label: a.label, x: p.x + a.x, y: p.y + a.y, radiusCm: a.radiusCm, kind: 'prop', payload: { anchorId: a.id } });
    }
  }
  for (const d of data.doors) {
    const onNorth = d.y <= 10;
    anchors.push({
      key: `door:${d.id}`, ownerId: d.id, label: d.label,
      x: d.x + d.w / 2, y: onNorth ? 25 : h - 15, radiusCm: 50, kind: 'door', payload: d.to,
    });
  }
  return { data, solids, props, anchors };
}
