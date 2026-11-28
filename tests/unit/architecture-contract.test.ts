import { describe, expect, it } from 'vitest';
import archetypeData from '../../src/data/archetypes.json';
import { FLOORS } from '../../src/world/floor';
import { compileRegion } from '../../src/world/region';
import { getPropSpec } from '../../src/core/specs';
import { projectedRoofRise, roofPivot, roofSource } from '../../src/world/buildingLayers';
import { DEPTH_SCALE } from '../../src/core/projection';

/**
 * G1 architecture contract (docs/production/ARCHITECTURE_CONTRACT_G1.md): frozen sizes for house_small, house_large,
 * ruko, warkop_open; TEMP placeholders, runtime data and the art layer specs must agree, the town must use the
 * frozen sizes without per-placement overrides, and a building has exactly one roof source.
 */
type C = { widthCm: number; depthCm: number; eaveCm: number; ridgeCm: number; roof: { style: string; overhangSideCm: number; projectedRiseCm: number };
  entrance: { dx: number; clearWidthCm: number; clearHeightCm: number; triggerWidthCm: number }; layers: { front: { assetId: string; canvasPx: never }; roof: { assetId: string } } };
const A = (archetypeData as unknown as { archetypes: Record<string, { facade: string; depth: number; roofArt?: string; entrance?: { dx: number }; contract?: C }> }).archetypes;
const FROZEN = ['house_small', 'house_large', 'ruko', 'warkop_open'] as const;
const def = FLOORS.get('batuphat_town')!, town = compileRegion(def);

describe('G1 architecture contract', () => {
  for (const id of FROZEN) {
    const a = A[id]!, c = a.contract!;
    it(`${id}: runtime, TEMP front layer and roof layer spec all follow the frozen contract`, () => {
      const front = getPropSpec(a.facade), roof = getPropSpec(a.roofArt!);
      expect(c.layers.front.assetId).toBe(a.facade); expect(c.layers.roof.assetId).toBe(a.roofArt);
      expect(front.footprint.widthCm).toBe(c.widthCm);
      expect(front.heightsCm.top).toBe(c.eaveCm);
      expect(a.depth).toBe(c.depthCm);
      expect(front.canvas).toEqual({ width: c.widthCm + 16, height: c.eaveCm + 24 }); expect(front.pivot.y).toBe(c.eaveCm + 12);
      const rise = projectedRoofRise(c.depthCm, c.eaveCm, c.ridgeCm, c.roof.style);
      expect(c.roof.projectedRiseCm).toBe(rise);
      expect(rise).toBeGreaterThanOrEqual(Math.round(c.depthCm * DEPTH_SCALE));       // the roof covers the whole footprint from above
      expect(roof.canvas).toEqual({ width: c.widthCm + 2 * c.roof.overhangSideCm + 16, height: rise + 15 + 24 });
      expect(roof.pivot).toMatchObject({ x: (c.widthCm + 2 * c.roof.overhangSideCm + 16) / 2, y: rise + 12 });
    });
    it(`${id}: the entrance fits the facade, is tall enough for Zila (165 cm); its trigger is at most 20 cm wider each side`, () => {
      const e = c.entrance;
      expect(Math.abs(e.dx) + e.clearWidthCm / 2).toBeLessThanOrEqual(c.widthCm / 2 - 20);
      expect(e.clearHeightCm).toBeGreaterThanOrEqual(205); expect(e.clearHeightCm).toBeLessThanOrEqual(c.eaveCm - 20);
      expect(e.triggerWidthCm).toBeLessThanOrEqual(e.clearWidthCm + 40);
      if (e.triggerWidthCm > 0) expect(e.triggerWidthCm).toBeGreaterThanOrEqual(Math.min(e.clearWidthCm, 160));
      expect(a.entrance!.dx).toBe(e.dx);
    });
  }

  it('the town uses the frozen sizes: no placement overrides width/depth/facade of a frozen archetype; footprints = width × depth at the front line', () => {
    for (const b of def.buildings!.filter((q) => FROZEN.includes(q.archetype as never))) {
      expect(b.depth, b.id).toBeUndefined(); expect(b.facade, b.id).toBeUndefined();
      const c = A[b.archetype!]!.contract!, info = town.buildings!.find((q) => q.id === b.id)!;
      expect({ w: info.x1 - info.x0, d: info.depth, h: info.height, roofArt: info.roofArt }, b.id).toEqual({ w: c.widthCm, d: c.depthCm, h: c.eaveCm, roofArt: A[b.archetype!]!.roofArt });
      expect(town.solids.some((s) => s.x === info.x0 && s.y === info.front - info.depth && s.w === c.widthCm && s.h === c.depthCm), `${b.id} collision`).toBe(true);
    }
  });

  it('doors and yard gates sit at the contract entrance (warkop door trigger; large houses: gate in front of the door)', () => {
    const wk = town.data.doors.find((d) => d.id === 'warkop_door')!, wb = town.buildings!.find((b) => b.id === 'warkop')!;
    expect(wk.x + wk.w / 2).toBe((wb.x0 + wb.x1) / 2 + A.warkop_open!.contract!.entrance.dx);
    expect(wk.w).toBeLessThanOrEqual(A.warkop_open!.contract!.entrance.clearWidthCm);
    for (const id of ['house_n2', 'house_n5']) {
      const b = town.buildings!.find((q) => q.id === id)!, gateX = (b.x0 + b.x1) / 2 + A.house_large!.contract!.entrance.dx;
      const front = town.fences!.filter((f) => f.y === b.front + 150 - 15 && f.x >= b.x0 - 1 && f.x + f.w <= b.x1 + 1);
      expect(front.length, id).toBe(2);
      const [l, r] = front.sort((p, q) => p.x - q.x);
      expect((l!.x + l!.w + r!.x) / 2, `${id} gate centred on the door`).toBeCloseTo(gateX, 0);
    }
  });

  it('exactly one roof source per building: TEMP engine roof until the roof art is approved, then only the art', () => {
    for (const b of town.buildings!) {
      expect(roofSource(b, () => false)).toBe('engine');
      expect(roofSource(b, () => true)).toBe(b.roofArt ? 'art' : 'engine');
    }
    const ruko = town.buildings!.find((b) => b.id === 'ruko_m1')!;
    expect(roofPivot(ruko)).toEqual({ x: 500, y: 2600 * DEPTH_SCALE - 480 });
  });
});

describe('G1 contract amendment A1: posts and bays stay inside the facade', () => {
  type Bay = { kind: string; postCentresDx: number[]; postWidthCm: number; postEdgesCm: number[][]; bays: { name: string; dx: number; clearFromCm: number; clearToCm: number; clearWidthCm: number }[] };
  const raw = (archetypeData as any).archetypes;

  it('every post of every frozen archetype (warkop bays, house porch) lies within the facade width', () => {
    for (const id of FROZEN) {
      const c = raw[id].contract, half = c.widthCm / 2;
      const posts: { dx: number; w: number }[] = [
        ...(c.porch?.posts ?? []).map((dx: number) => ({ dx, w: 16 })),
        ...((c.openings ?? []).filter((o: any) => o.kind === 'bay') as Bay[]).flatMap((b) => b.postCentresDx.map((dx) => ({ dx, w: b.postWidthCm }))),
      ];
      for (const p of posts) {
        expect(p.dx - p.w / 2, `${id} post at ${p.dx}`).toBeGreaterThanOrEqual(-half);
        expect(p.dx + p.w / 2, `${id} post at ${p.dx}`).toBeLessThanOrEqual(half);
      }
    }
  });

  it('warkop: outer post faces flush at ±300, the 184 × 230 centre entrance and its 160 cm trigger unchanged', () => {
    const c = raw.warkop_open.contract, bay = c.openings.find((o: any) => o.kind === 'bay') as Bay;
    expect(bay.postCentresDx).toEqual([-292, -100, 100, 292]);
    expect(bay.postWidthCm).toBe(16);
    expect(bay.postEdgesCm).toEqual(bay.postCentresDx.map((dx) => [dx - 8, dx + 8]));
    expect(bay.postEdgesCm[0]![0]).toBe(-c.widthCm / 2);
    expect(bay.postEdgesCm[3]![1]).toBe(c.widthCm / 2);
    // bays are exactly the gaps between neighbouring post faces
    bay.bays.forEach((b, i) => {
      expect([b.clearFromCm, b.clearToCm]).toEqual([bay.postEdgesCm[i]![1], bay.postEdgesCm[i + 1]![0]]);
      expect(b.clearWidthCm).toBe(b.clearToCm - b.clearFromCm);
      expect(b.dx).toBe((b.clearFromCm + b.clearToCm) / 2);
    });
    const centre = bay.bays.find((b) => b.name === 'centre')!;
    expect(centre.clearWidthCm).toBe(c.entrance.clearWidthCm);
    expect(c.entrance).toMatchObject({ dx: 0, clearWidthCm: 184, clearHeightCm: 230, triggerWidthCm: 160 });
    expect(c.entrance.triggerWidthCm).toBeLessThanOrEqual(centre.clearWidthCm);
    expect(c.amendments.map((a: any) => a.id)).toContain('G1-contract-1/A1');
  });

  it('warkop: counter and bench add-ons fit their bays, and their specs match the contract', () => {
    const c = raw.warkop_open.contract, bay = c.openings.find((o: any) => o.kind === 'bay') as Bay;
    for (const [key, name] of [['counter', 'right'], ['bench', 'left']] as const) {
      const a = c.layers.addOns[key], b = bay.bays.find((q) => q.name === name)!;
      expect(a.dx, key).toBe(b.dx);
      expect(a.dx - a.widthCm / 2, key).toBeGreaterThanOrEqual(b.clearFromCm);
      expect(a.dx + a.widthCm / 2, key).toBeLessThanOrEqual(b.clearToCm);
      const s = getPropSpec(a.assetId) as any;
      expect(s.footprint.widthCm, key).toBe(a.widthCm);
      expect(s.heightsCm.top, key).toBe(a.heightCm);
      expect(s.canvas).toEqual({ width: a.widthCm + 16, height: a.heightCm + 24 });
      expect(s.production.envelope).toMatchObject({ width: a.widthCm * 2, height: a.heightCm * 2, bayDx: a.dx });
    }
  });

  it('warkop gameplay is untouched: footprint, door and solids are the same as before A1', () => {
    const w = town.buildings!.find((b) => b.id === 'warkop')!;
    expect(w.x1 - w.x0).toBe(600);
    expect(w.depth).toBe(420);
    const door = town.data.doors.find((d) => d.id === 'warkop_door')!;
    expect(door.w).toBe(160);
    expect(door.x + door.w / 2).toBe((w.x0 + w.x1) / 2);
  });
});
