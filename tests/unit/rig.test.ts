import { describe, expect, it } from 'vitest';
import { cmPerWalkFrame, idleFrame, layersNeedingOwnArt, resolveFacing, walkFrame, type RigSpec } from '../../src/animation/rig';
import zila from '../../specs/characters/char_zila.json';
import febri from '../../specs/characters/char_febri.json';
import { DIRECTIONS } from '../../src/actors/direction';

const zr = zila.rig as unknown as RigSpec;
const fr = febri.rig as unknown as RigSpec;

describe('character rig', () => {
  it('all 8 facings resolve to authored art; W-side is mirrored', () => {
    for (const d of DIRECTIONS) expect(zr.authoredFacings).toContain(resolveFacing(zr, d).authored);
    expect(resolveFacing(zr, 'W')).toEqual({ authored: 'E', mirrored: true });
    expect(resolveFacing(zr, 'S')).toEqual({ authored: 'S', mirrored: false });
  });
  it("Febri's crossbody bag is never mirrored; Zila's symmetric ornaments are", () => {
    expect(layersNeedingOwnArt(fr, 'W')).toEqual(['accessory']);
    expect(layersNeedingOwnArt(fr, 'E')).toEqual([]);
    expect(layersNeedingOwnArt(zr, 'NW')).toEqual([]);
  });
  it('walk frames advance by distance: one frame per stride/frames cm, independent of frame rate', () => {
    const step = cmPerWalkFrame(zr);
    expect(step).toBe(14);
    expect(walkFrame(zr, 0)).toBe(0);
    expect(walkFrame(zr, step - 0.01)).toBe(0);
    expect(walkFrame(zr, step)).toBe(1);
    expect(walkFrame(zr, zr.anims.walk.strideCm)).toBe(0);     // wraps per stride
    // 60 fps vs 15 fps over the same 150 cm → same frame
    let a = 0, b = 0;
    for (let i = 0; i < 60; i++) a += 150 / 60;
    for (let i = 0; i < 15; i++) b += 150 / 15;
    expect(walkFrame(zr, a)).toBe(walkFrame(zr, b));
  });
  it('contact frames are where the feet plant (0 and half-stride)', () => {
    expect(zr.anims.walk.contactFrames).toEqual([0, zr.anims.walk.frames / 2]);
  });
  it('idle cycles at its own fps', () => {
    expect(idleFrame(zr, 0)).toBe(0);
    expect(idleFrame(zr, 1000 / zr.anims.idle.fps)).toBe(1);
  });
});
