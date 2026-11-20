import { describe, expect, it } from 'vitest';
import { isQaBuild, walkSpeedMultiplier } from '../../src/core/qa';

describe('test-only switches never reach production builds', () => {
  it('?fast works only in dev / QA builds', () => {
    expect(walkSpeedMultiplier('?fast', { DEV: false, MODE: 'production' })).toBe(1);
    expect(walkSpeedMultiplier('?fresh&fast', { DEV: false, MODE: 'qa' })).toBe(3);
    expect(walkSpeedMultiplier('?fast', { DEV: true, MODE: 'development' })).toBe(3);
    expect(walkSpeedMultiplier('', { DEV: false, MODE: 'qa' })).toBe(1);
    expect(isQaBuild({ MODE: 'production' })).toBe(false);
  });
});
