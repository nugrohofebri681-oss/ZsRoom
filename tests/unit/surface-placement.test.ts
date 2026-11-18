import { describe, expect, it } from 'vitest';
import { compileRoom, getRoom, SURFACE_DEPTH_EPSILON, type RoomData } from '../../src/world/room';
import { getPropSpec } from '../../src/core/specs';
import { actorSortDepth } from '../../src/world/depth';

const bedroom = compileRoom(getRoom('zila_bedroom'));
const lamp = bedroom.props.find((p) => p.spec.id === 'prop_lamp_zila')!;
const ns = bedroom.props.find((p) => p.spec.id === 'prop_nightstand_zila')!;

describe('surface-placed props (lamp on nightstand)', () => {
  it('sits on the nightstand measured lamp anchor, at the painted height', () => {
    const a = getPropSpec('prop_nightstand_zila').surfaces![0]!.anchors.find((x) => x.id === 'lamp')!;
    expect(lamp.hostKey).toBe(ns.key);
    expect(lamp.x).toBe(ns.x + a.x);
    expect(lamp.y).toBe(ns.y + a.y);
    expect(lamp.z).toBe(a.z);
    expect(lamp.z).toBeGreaterThan(55); // painted surface (≈60), not the nominal 55 cm
  });

  it('adds no floor collision', () => {
    const plain = compileRoom({ ...getRoom('zila_bedroom'), props: getRoom('zila_bedroom').props.filter((p) => p.assetId !== 'prop_lamp_zila') } as RoomData);
    expect(bedroom.solids.length).toBe(plain.solids.length);
  });

  it('draws just above its host and below an actor standing in front of the host', () => {
    expect(lamp.sortable.pivotY).toBe(ns.sortable.pivotY + SURFACE_DEPTH_EPSILON);
    const actor = { x: 202, y: 70, radius: 16, renderBounds: { x: 186, y: 70 * 0.7 - 165, w: 32, h: 165 } };
    expect(actorSortDepth(actor, bedroom.props.map((p) => p.sortable))).toBeGreaterThan(lamp.sortable.pivotY);
  });

  it('is never an occluder (a small lamp must not fade)', () => {
    expect(lamp.sortable.occluder).toBe(false);
  });

  it('has its own toggle anchor, distinct from the nightstand and bed anchors', () => {
    const keys = bedroom.anchors.map((a) => a.key);
    expect(keys.some((k) => /^prop_lamp_zila#\d+:toggle$/.test(k))).toBe(true);
    expect(keys.some((k) => /^prop_nightstand_zila#\d+:nightstand$/.test(k))).toBe(true);
  });

  it('rejects placement on an unknown host or on the wrong asset', () => {
    const base = getRoom('zila_bedroom');
    const bad1 = { ...base, props: [{ assetId: 'prop_lamp_zila', on: { prop: 'nope', surface: 'top', anchor: 'lamp' } }] } as RoomData;
    expect(() => compileRoom(bad1)).toThrow(/unknown prop id/);
    const bad2 = { ...base, props: [{ assetId: 'prop_bed_zila', id: 'b', x: 110, y: 212 }, { assetId: 'prop_lamp_zila', on: { prop: 'b', surface: 'top', anchor: 'lamp' } }] } as RoomData;
    expect(() => compileRoom(bad2)).toThrow(/surface anchor|must be placed on/);
  });

  it('has an engine light, painted unlit, off by default', () => {
    const l = getPropSpec('prop_lamp_zila').light!;
    expect(l.defaultOn).toBe(false);
    expect(l.emitter.z).toBeGreaterThan(getPropSpec('prop_lamp_zila').heightsCm.shadeBottom!);
    expect(l.emitter.z).toBeLessThan(getPropSpec('prop_lamp_zila').heightsCm.top!);
  });
});
