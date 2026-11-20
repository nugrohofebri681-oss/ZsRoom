import { describe, expect, it } from 'vitest';
import pouf from '../../specs/props/prop_pouf_floor.json';
import fairy from '../../specs/props/wall_fairy_lights.json';
import neon from '../../specs/props/wall_neon_goodvibes.json';
import { DEPTH_SCALE } from '../../src/core/projection';

describe('Batch C/D engine contracts (measured on the v001 masters)', () => {
  it('pouf: seated hips land on the PAINTED seat plane (neither floating nor sinking)', () => {
    const sit = pouf.interactionAnchors.find((a) => a.action.type === 'sit')!.action as { heightCm: number; seat: { x: number; y: number } };
    expect(sit.heightCm).toBe(pouf.heightsCm.seat);
    // painted seat-plane centre: canvas y ≈ 75 on the 144×192 v001 master → (168 − 75) / 2 = 46.5 render-cm above the pivot
    const PAINTED_SEAT_ABOVE_PIVOT = (pouf.pivot.y - 75) / 2;
    const engineSeat = -sit.seat.y * DEPTH_SCALE + sit.heightCm;      // seat point is 25 cm behind the front pivot
    expect(Math.abs(engineSeat - PAINTED_SEAT_ABOVE_PIVOT)).toBeLessThanOrEqual(2);
  });
  it('fairy lights: one engine glow per painted bulb, all inside the art', () => {
    const pts = fairy.light.points!;
    expect(pts).toHaveLength(32);
    for (const p of pts) {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(fairy.canvas.width / 2 / 2);
      expect(p.z).toBeGreaterThan(0);
      expect(p.z).toBeLessThanOrEqual(fairy.heightsCm.top);
    }
    expect(fairy.light.coreSizeCm).toBe(0);
  });
  it('neon: no bright core over the lettering; the tubes themselves are lit', () => {
    expect(neon.light.coreSizeCm).toBe(0);
    expect(neon.light.selfLit).toBeGreaterThan(0);
  });
});
