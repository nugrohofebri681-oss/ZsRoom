import { describe, expect, it } from 'vitest';
import { groundToRender, renderToGround, pointToCanvasOffset, spriteScaleForDensity } from '../../src/core/projection';
import { getPropSpec } from '../../src/core/specs';

describe('projection', () => {
  it('foreshortens depth by 0.7 and raises height 1:1', () => {
    expect(groundToRender(100, 100)).toEqual({ x: 100, y: 70 });
    expect(groundToRender(0, 100, 50)).toEqual({ x: 0, y: 20 });
  });
  it('round-trips ground ↔ render on the floor plane', () => {
    const r = groundToRender(37, 211);
    const g = renderToGround(r.x, r.y);
    expect(g.x).toBeCloseTo(37);
    expect(g.y).toBeCloseTo(211);
  });
  it('density scale is independent of source pixels', () => {
    expect(spriteScaleForDensity(2)).toBe(0.5);
    expect(() => spriteScaleForDensity(0)).toThrow();
  });
  it('bed spec canvas geometry is internally consistent', () => {
    const s = getPropSpec('prop_bed_zila');
    const d = s.density;
    // back floor line and headboard top, in canvas px
    const back = s.pivot.y + pointToCanvasOffset(0, -s.footprint.depthCm, 0, d).y;
    const headTop = s.pivot.y + pointToCanvasOffset(0, -s.footprint.depthCm, s.heightsCm.headboardTop!, d).y;
    expect(back).toBe(264);
    expect(headTop).toBe(44);
    expect(headTop).toBeGreaterThanOrEqual(0);
    // footprint fits inside the art bounds horizontally
    const half = (s.footprint.widthCm / 2) * d;
    expect(s.pivot.x - half).toBe(72);
    expect(s.pivot.x + half).toBe(312);
    // collision covers footprint plus at most the allowed overhang
    const c = s.collision[0]!;
    expect(c.w).toBeGreaterThanOrEqual(s.footprint.widthCm);
    expect(c.h).toBe(s.footprint.depthCm);
  });
});
