import { describe, expect, it } from 'vitest';
import { compileRoom, getRoom, ROOMS } from '../../src/world/room';
import { circleIntersectsRect } from '../../src/world/collision';
import { SPECS, type PropSpec } from '../../src/core/specs';
import { DEPTH_SCALE } from '../../src/core/projection';
import manifest from '../../public/assets/manifest.json';

const ACTOR_R = 18; // largest character collision radius (Febri)
const CELL = 8;

/** Walkable-grid flood fill from the default spawn: which cells can an actor actually reach? */
function reachable(roomId: string) {
  const room = compileRoom(getRoom(roomId));
  const { w, h } = room.data.sizeCm;
  const cols = Math.ceil(w / CELL), rows = Math.ceil(h / CELL);
  const free = (cx: number, cy: number) => !room.solids.some((s) => circleIntersectsRect(cx, cy, ACTOR_R, s));
  const seen = new Uint8Array(cols * rows);
  const sp = room.data.spawns.default!;
  const q: [number, number][] = [[Math.floor(sp.x / CELL), Math.floor(sp.y / CELL)]];
  while (q.length) {
    const [c, r] = q.pop()!;
    if (c < 0 || r < 0 || c >= cols || r >= rows || seen[r * cols + c]) continue;
    if (!free(c * CELL + CELL / 2, r * CELL + CELL / 2)) continue;
    seen[r * cols + c] = 1;
    q.push([c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]);
  }
  const canReach = (x: number, y: number, radius: number) => {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (seen[r * cols + c] && Math.hypot(c * CELL + CELL / 2 - x, r * CELL + CELL / 2 - y) <= radius) return true;
    }
    return false;
  };
  return { room, canReach, cells: seen.reduce((a, b) => a + b, 0) };
}

describe('bedroom vertical slice — layout', () => {
  const { room, canReach, cells } = reachable('zila_bedroom');

  it('the spawn is walkable and opens onto a large connected floor', () => {
    expect(cells * CELL * CELL).toBeGreaterThan(80_000); // > 8 m² of reachable floor
  });

  it('every interaction anchor can be reached on foot from the spawn', () => {
    const unreachable = room.anchors.filter((a) => !a.whileSeatedOn && !canReach(a.x, a.y, a.radiusCm)).map((a) => a.key);
    expect(unreachable).toEqual([]);
  });

  it('seated-only interactions (laptop) are in reach of their seat, and the seat itself is reachable', () => {
    for (const a of room.anchors.filter((x) => x.whileSeatedOn)) {
      const seatProp = room.props.find((p) => p.spec.id === a.whileSeatedOn)!;
      const sit = seatProp.spec.interactionAnchors.find((x) => x.action?.type === 'sit')!;
      const seat = (sit.action as { seat: { x: number; y: number } }).seat;
      expect(Math.hypot(seatProp.x + seat.x - a.x, seatProp.y + seat.y - a.y), a.key).toBeLessThanOrEqual(a.radiusCm);
      expect(canReach(seatProp.x + sit.x, seatProp.y + sit.y, sit.radiusCm), `${seatProp.key} sit spot`).toBe(true);
    }
  });

  it('every prop has a spec, a manifest entry, and either approved art or temp art', () => {
    for (const p of room.props) {
      expect((manifest.assets as Record<string, unknown>)[p.spec.id], p.spec.id).toBeDefined();
      const approved = (manifest.assets as Record<string, { status: string }>)[p.spec.id]!.status === 'approved';
      expect(approved || !!p.spec.temp, `${p.spec.id} has neither approved art nor temp art`).toBe(true);
    }
  });

  it('wall items fit on the north wall and floor props stay inside the room', () => {
    const { w, h } = room.data.sizeCm;
    for (const p of room.props) {
      const half = p.spec.footprint.widthCm / 2;
      expect(p.x - half, p.key).toBeGreaterThanOrEqual(0);
      expect(p.x + half, p.key).toBeLessThanOrEqual(w);
      if (p.layer === 'wall') expect(p.z + Math.max(...Object.values(p.spec.heightsCm)), p.key).toBeLessThanOrEqual(room.data.wallHeightCm);
      if (p.layer === 'floor') { expect(p.y - p.spec.footprint.depthCm, p.key).toBeGreaterThanOrEqual(0); expect(p.y, p.key).toBeLessThanOrEqual(h); }
    }
  });

  it('floor furniture footprints do not overlap', () => {
    const fl = room.props.filter((p) => p.layer === 'floor');
    for (let i = 0; i < fl.length; i++) for (let j = i + 1; j < fl.length; j++) {
      const a = fl[i]!.sortable.footprint, b = fl[j]!.sortable.footprint;
      const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      expect(overlap, `${fl[i]!.key} overlaps ${fl[j]!.key}`).toBe(false);
    }
  });

  it('layers sort correctly: decals < wall items < furniture against the wall', () => {
    const rug = room.props.find((p) => p.layer === 'decal')!;
    const walls = room.props.filter((p) => p.layer === 'wall');
    const desk = room.props.find((p) => p.spec.id === 'prop_desk_zila')!;
    for (const wi of walls) { expect(rug.sortable.pivotY).toBeLessThan(wi.sortable.pivotY); expect(wi.sortable.pivotY).toBeLessThan(desk.sortable.pivotY); }
  });
});

describe('performance budget (Galaxy A05 class)', () => {
  const room = compileRoom(getRoom('zila_bedroom'));
  const specs = [...new Set(room.props.map((p) => p.spec))] as PropSpec[];
  const shellPx = (scale: number) => (room.data.sizeCm.w + 40) * scale * (room.data.wallHeightCm + room.data.sizeCm.h * DEPTH_SCALE + 40) * scale;
  const propPx = (density: number) => specs.reduce((n, s) => n + s.canvas.width * s.canvas.height * (density / s.density) ** 2, 0);

  it('texture memory fits the budget: HD ≤ 48 MB, SD ≤ 16 MB (RGBA)', () => {
    const hdMB = ((propPx(2) + shellPx(2)) * 4) / 2 ** 20;
    const sdMB = ((propPx(1) + shellPx(1)) * 4) / 2 ** 20;
    expect(hdMB).toBeLessThan(48);
    expect(sdMB).toBeLessThan(16);
  });
  it('at most 6 engine lights per room and at most 40 props', () => {
    expect(room.props.filter((p) => p.spec.light).length).toBeLessThanOrEqual(6);
    expect(room.props.length).toBeLessThanOrEqual(40);
  });
  it('every room in the game compiles', () => {
    for (const r of ROOMS.values()) expect(() => compileRoom(r)).not.toThrow();
  });
  it('every spec with temp art declares a known shape', async () => {
    const { TEMP_SHAPES } = await import('../../src/ui/placeholders');
    for (const s of SPECS.values()) if (s.category === 'prop' && s.temp) expect(TEMP_SHAPES, s.id).toContain(s.temp.shape);
  });
});
