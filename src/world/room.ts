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
  props: { assetId: string; x: number; y: number }[];
  doors: RoomDoor[];
}

export interface PropInstance { key: string; spec: PropSpec; x: number; y: number; sortable: SortableProp }
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

  const props: PropInstance[] = data.props.map((p, i) => {
    const spec = getPropSpec(p.assetId);
    const key = `${spec.id}#${i}`;
    const footprint: Rect = { x: p.x - spec.footprint.widthCm / 2, y: p.y - spec.footprint.depthCm, w: spec.footprint.widthCm, h: spec.footprint.depthCm };
    for (const c of spec.collision) solids.push({ x: p.x + c.x, y: p.y + c.y, w: c.w, h: c.h });
    return {
      key, spec, x: p.x, y: p.y,
      sortable: { id: key, pivotY: p.y, footprint, renderBounds: propVolumeRenderBounds(spec, p.x, p.y), occluder: spec.occluder },
    };
  });

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
