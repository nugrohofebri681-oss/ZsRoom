import { describe, expect, it } from 'vitest';
import { getPropSpec } from '../../src/core/specs';
import { pointToCanvasOffset } from '../../src/core/projection';

describe('measured painted surfaces', () => {
  const ns = getPropSpec('prop_nightstand_zila');
  const top = ns.surfaces!.find((s) => s.id === 'top')!;

  it('every anchor projects onto its declared canvas point (±1 px)', () => {
    for (const a of top.anchors) {
      const o = pointToCanvasOffset(a.x, a.y, a.z, ns.density);
      expect(Math.abs(ns.pivot.x + o.x - a.canvas!.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(ns.pivot.y + o.y - a.canvas!.y)).toBeLessThanOrEqual(1);
    }
  });

  it('anchors lie inside the measured painted top plane, not on the front face', () => {
    for (const a of top.anchors) {
      const c = a.canvas!;
      expect(c.y).toBeGreaterThan(top.painted!.backEdgeY);
      expect(c.y).toBeLessThan(top.painted!.frontEdgeY);
      expect(c.x).toBeGreaterThan(top.painted!.leftX);
      expect(c.x).toBeLessThan(top.painted!.rightX);
    }
  });

  it('painted measurements are self-consistent with the spec projection', () => {
    expect(top.painted!.frontEdgeHeightCm).toBeCloseTo((ns.pivot.y - top.painted!.frontEdgeY) / ns.density, 1);
    expect(top.painted!.planeDepthCm).toBeCloseTo((top.painted!.frontEdgeY - top.painted!.backEdgeY) / (ns.density * 0.7), 0);
  });
});

describe('desk surface (measured on the painted v002 master)', () => {
  const desk = getPropSpec('prop_desk_zila');
  const top = desk.surfaces!.find((s) => s.id === 'top')!;
  it('laptop and mug anchors project inside the painted top plane', () => {
    for (const a of top.anchors) {
      const o = pointToCanvasOffset(a.x, a.y, a.z, desk.density);
      const c = { x: desk.pivot.x + o.x, y: desk.pivot.y + o.y };
      expect(Math.abs(c.x - a.canvas!.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(c.y - a.canvas!.y)).toBeLessThanOrEqual(1);
      expect(c.y).toBeGreaterThan(top.painted!.backEdgeY);
      expect(c.y).toBeLessThan(top.painted!.frontEdgeY);
      expect(c.x).toBeGreaterThan(top.painted!.leftX);
      expect(c.x).toBeLessThan(top.painted!.rightX);
    }
  });
});
