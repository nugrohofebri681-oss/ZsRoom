import { describe, expect, it } from 'vitest';
import { crossedContacts, renderAmbience, renderSound, SFX_RATE, SOUND_IDS } from '../../src/audio/synth';
import { DEFAULT_PREFS, loadAudioPrefs, saveAudioPrefs, AUDIO_PREFS_KEY } from '../../src/audio/prefs';
import zila from '../../specs/characters/char_zila.json';

const peak = (x: Float32Array) => x.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
const rms = (x: Float32Array) => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / x.length);

describe('procedural sound effects', () => {
  it('every sound renders, is audible, never clips and is short', () => {
    for (const id of SOUND_IDS) {
      const x = renderSound(id);
      expect(x.length, id).toBeGreaterThan(SFX_RATE * 0.05);
      expect(x.length, id).toBeLessThan(SFX_RATE * 1);
      expect(peak(x), id).toBeGreaterThan(0.05);
      expect(peak(x), id).toBeLessThanOrEqual(0.5);
      expect(x.every(Number.isFinite), id).toBe(true);
    }
  });
  it('footsteps on the rug are quieter and duller than on wood', () => {
    const wood = renderSound('step_wood'), rug = renderSound('step_rug');
    expect(peak(rug)).toBeLessThan(peak(wood));
    expect(rug.length).toBeLessThan(wood.length);
  });
  it('is deterministic (same seed → same buffer) but variants differ', () => {
    expect(Array.from(renderSound('step_wood', SFX_RATE, 1))).toEqual(Array.from(renderSound('step_wood', SFX_RATE, 1)));
    expect(Array.from(renderSound('step_wood', SFX_RATE, 1))).not.toEqual(Array.from(renderSound('step_wood', SFX_RATE, 2)));
  });
});

describe('ambience loops', () => {
  for (const id of ['day', 'night'] as const) {
    it(`${id}: quiet bed, seamless at the loop point, small memory`, () => {
      const x = renderAmbience(id);
      expect(rms(x)).toBeLessThan(0.05);                               // subtle, never intrusive
      expect(peak(x)).toBeLessThan(0.2);
      const seam = Math.abs(x[x.length - 1]! - x[0]!);
      const typicalStep = x.slice(1).reduce((s, v, i) => s + Math.abs(v - x[i]!), 0) / (x.length - 1);
      expect(seam).toBeLessThan(typicalStep * 6 + 1e-3);              // no click when it wraps
      expect(x.length * 4).toBeLessThan(800_000);                     // < 0.8 MB as Float32
    });
  }
});

describe('footsteps follow the walk cycle contact frames', () => {
  const w = zila.rig.anims.walk;
  it('two steps per stride, none while standing', () => {
    expect(crossedContacts(0, w.strideCm, w.strideCm, w.contactFrames, w.frames)).toBe(2);
    expect(crossedContacts(50, 50, w.strideCm, w.contactFrames, w.frames)).toBe(0);
  });
  it('frame-rate independent: one big step or many small steps give the same count', () => {
    let small = 0;
    for (let d = 0; d < 1000; d += 3.7) small += crossedContacts(d, d + 3.7, w.strideCm, w.contactFrames, w.frames);
    expect(small).toBe(crossedContacts(0, Math.ceil(1000 / 3.7) * 3.7, w.strideCm, w.contactFrames, w.frames));
  });
});

describe('audio preferences', () => {
  const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) }; };
  it('round-trips and defaults safely', () => {
    const s = mem();
    expect(loadAudioPrefs(s)).toEqual(DEFAULT_PREFS);
    saveAudioPrefs(s, { ...DEFAULT_PREFS, muted: true, master: 0.3 });
    expect(loadAudioPrefs(s)).toMatchObject({ muted: true, master: 0.3 });
  });
  it('clamps and repairs corrupt values', () => {
    const s = mem();
    s.setItem(AUDIO_PREFS_KEY, JSON.stringify({ muted: 'yes', master: 7, ambience: -2, sfx: 'x' }));
    expect(loadAudioPrefs(s)).toEqual({ version: 1, muted: false, master: 1, ambience: 0, sfx: DEFAULT_PREFS.sfx });
    s.setItem(AUDIO_PREFS_KEY, '{broken');
    expect(loadAudioPrefs(s)).toEqual(DEFAULT_PREFS);
  });
});
