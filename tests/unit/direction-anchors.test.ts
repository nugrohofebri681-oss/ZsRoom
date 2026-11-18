import { describe, expect, it } from 'vitest';
import { normaliseInput, vectorToDirection } from '../../src/actors/direction';
import { nearestAnchor } from '../../src/interaction/anchors';

describe('8-direction movement', () => {
  it.each([
    [1, 0, 'E'], [1, 1, 'SE'], [0, 1, 'S'], [-1, 1, 'SW'],
    [-1, 0, 'W'], [-1, -1, 'NW'], [0, -1, 'N'], [1, -1, 'NE'],
  ] as const)('(%d,%d) → %s', (x, y, d) => expect(vectorToDirection(x, y)).toBe(d));
  it('returns null inside the dead zone', () => expect(vectorToDirection(0, 0)).toBeNull());
  it('diagonals are not faster than cardinals', () => {
    const n = normaliseInput(1, 1);
    expect(Math.hypot(n.x, n.y)).toBeCloseTo(1);
    const a = normaliseInput(0.3, 0);
    expect(a.x).toBeCloseTo(0.3);
  });
});

describe('interaction anchors', () => {
  const anchors = [
    { key: 'a', ownerId: 'bed', label: 'Rest', x: 100, y: 100, radiusCm: 50, kind: 'prop' as const },
    { key: 'b', ownerId: 'desk', label: 'Sit', x: 160, y: 100, radiusCm: 50, kind: 'prop' as const },
  ];
  it('picks the nearest anchor in range', () => expect(nearestAnchor(140, 100, anchors)?.key).toBe('b'));
  it('returns null when out of range', () => expect(nearestAnchor(400, 400, anchors)).toBeNull());
});
