import { describe, expect, it } from 'vitest';
import { WalkGrid } from '../../src/world/pathfinding';
import { compileRoom, getRoom } from '../../src/world/room';
import { circleIntersectsRect } from '../../src/world/collision';

describe('walk grid + A*', () => {
  const wall = { x: 100, y: 0, w: 20, h: 160 };              // wall with a gap below y=160
  const g = new WalkGrid(240, 240, [wall], 16);

  it('walks straight when there is line of sight', () => {
    expect(g.findPath({ x: 30, y: 200 }, { x: 200, y: 200 })).toEqual([{ x: 200, y: 200 }]);
  });
  it('routes around an obstacle and never through it', () => {
    const p = g.findPath({ x: 40, y: 40 }, { x: 200, y: 40 })!;
    expect(p.length).toBeGreaterThan(1);
    let prev = { x: 40, y: 40 };
    for (const q of p) { expect(g.lineOfSight(prev, q)).toBe(true); prev = q; }
    expect(p[p.length - 1]).toEqual({ x: 200, y: 40 });
  });
  it('a blocked goal snaps to the nearest standable point', () => {
    const p = g.findPath({ x: 40, y: 200 }, { x: 110, y: 50 })!;
    const end = p[p.length - 1]!;
    expect(circleIntersectsRect(end.x, end.y, 16, wall)).toBe(false);
  });
  it('returns null when the goal region is unreachable', () => {
    const boxed = new WalkGrid(200, 200, [{ x: 0, y: 90, w: 200, h: 20 }], 16);
    expect(boxed.findPath({ x: 50, y: 30 }, { x: 50, y: 170 })).toBeNull();
  });
  it('in the real bedroom: spawn → wardrobe and spawn → behind the bed head are reachable', () => {
    const room = compileRoom(getRoom('zila_bedroom'));
    const grid = new WalkGrid(room.data.sizeCm.w, room.data.sizeCm.h, room.solids, 16);
    const spawn = room.data.spawns.default!;
    expect(grid.findPath(spawn, { x: 640, y: 94 })).not.toBeNull();
    expect(grid.findPath(spawn, { x: 194, y: 102 })).not.toBeNull();
  });
});
