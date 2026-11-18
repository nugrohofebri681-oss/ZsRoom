import { describe, expect, it } from 'vitest';
import { getCharacterSpec } from '../../src/core/specs';
import zila from '../../specs/characters/char_zila.json';
import febri from '../../specs/characters/char_febri.json';

describe('character proportion rules (Creative Director)', () => {
  it('Febri is taller than Zila by 3–6 cm', () => {
    const d = getCharacterSpec('char_febri').heightCm - getCharacterSpec('char_zila').heightCm;
    expect(d).toBeGreaterThanOrEqual(3);
    expect(d).toBeLessThanOrEqual(6);
  });
  it('both characters have the same head size (within 1 cm)', () => {
    expect(Math.abs(zila.heightCm / zila.headsTall - febri.heightCm / febri.headsTall)).toBeLessThan(1);
  });
  it('character canvases fit the full height at master density with padding', () => {
    for (const c of [zila, febri]) expect(c.pivot.y - c.heightCm * c.density).toBeGreaterThanOrEqual(8);
  });
});
