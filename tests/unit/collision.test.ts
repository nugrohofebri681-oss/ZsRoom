import { describe, expect, it } from 'vitest';
import { circleIntersectsRect, moveWithCollision } from '../../src/world/collision';

const wall = { x: 100, y: 0, w: 20, h: 200 };

describe('collision', () => {
  it('detects circle/rect overlap', () => {
    expect(circleIntersectsRect(90, 50, 16, wall)).toBe(true);
    expect(circleIntersectsRect(80, 50, 16, wall)).toBe(false);
  });
  it('blocks movement into a wall', () => {
    const p = moveWithCollision({ x: 50, y: 50 }, { x: 100, y: 0 }, 16, [wall]);
    expect(p.x).toBeLessThanOrEqual(84);
    expect(p.x).toBeGreaterThan(80);
  });
  it('slides along a wall on diagonal input', () => {
    const p = moveWithCollision({ x: 80, y: 50 }, { x: 30, y: 30 }, 16, [wall]);
    expect(p.y).toBeCloseTo(80);
    expect(p.x).toBeLessThanOrEqual(84);
  });
  it('does not tunnel through thin colliders at high speed', () => {
    const thin = { x: 100, y: 0, w: 2, h: 200 };
    const p = moveWithCollision({ x: 50, y: 50 }, { x: 500, y: 0 }, 10, [thin]);
    expect(p.x).toBeLessThan(100);
  });
});
