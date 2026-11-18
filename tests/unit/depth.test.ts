import { describe, expect, it } from 'vitest';
import { actorSortDepth, occludingProps, type SortableProp } from '../../src/world/depth';

const bed: SortableProp = { id: 'bed', pivotY: 212, footprint: { x: 50, y: 12, w: 120, h: 200 }, renderBounds: { x: 50, y: -102, w: 120, h: 250 }, occluder: true };
const plant: SortableProp = { id: 'plant', pivotY: 250, footprint: { x: 380, y: 210, w: 40, h: 40 }, renderBounds: { x: 380, y: 0, w: 40, h: 175 }, occluder: true };
const actor = (x: number, y: number) => ({ x, y, radius: 16, renderBounds: { x: x - 16, y: y * 0.7 - 158, w: 32, h: 158 } });

describe('depth sorting', () => {
  it('actor in front of a prop sorts by ground y', () => {
    expect(actorSortDepth(actor(110, 240), [bed])).toBe(240);
  });
  it('actor standing beside a deep prop is lifted in front of it', () => {
    expect(actorSortDepth(actor(195, 120), [bed])).toBeGreaterThan(bed.pivotY);
  });
  it('the beside rule only applies to adjacent props', () => {
    expect(actorSortDepth(actor(300, 230), [plant])).toBe(230);
  });
  it('actor behind a tall occluder fades it', () => {
    const a = actor(400, 200);
    const d = actorSortDepth(a, [plant]);
    expect(d).toBeLessThan(plant.pivotY);
    expect(occludingProps(a, d, [plant])).toEqual(['plant']);
  });
  it('actor in front of the occluder does not fade it', () => {
    const a = actor(400, 290);
    expect(occludingProps(a, actorSortDepth(a, [plant]), [plant])).toEqual([]);
  });
});
