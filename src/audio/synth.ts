/**
 * Original procedural sound design for ZsRoom (no samples, no third-party audio, no licensing questions).
 * Every sound is rendered ONCE into a Float32Array at a low sample rate; playback is then a cheap buffer
 * source with no continuous DSP. Pure functions (deterministic per seed) so they can be unit-tested.
 */
export const SFX_RATE = 22050;

export type SoundId = 'step_wood' | 'step_rug' | 'lamp_click' | 'interact' | 'sit' | 'cloth' | 'door' | 'ui_tick' | 'chime';
export const SOUND_IDS: SoundId[] = ['step_wood', 'step_rug', 'lamp_click', 'interact', 'sit', 'cloth', 'door', 'ui_tick', 'chime'];
export type AmbienceId = 'day' | 'night';

/** Small deterministic PRNG (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const env = (t: number, attack: number, decay: number) => (t < attack ? t / attack : Math.exp(-(t - attack) / decay));

/** One-pole low-pass in place (cheap tone shaping at render time only). */
function lowpass(x: Float32Array, cutoffHz: number, rate: number): Float32Array {
  const a = Math.exp((-2 * Math.PI * cutoffHz) / rate);
  let y = 0;
  for (let i = 0; i < x.length; i++) { y = (1 - a) * x[i]! + a * y; x[i] = y; }
  return x;
}
function highpass(x: Float32Array, cutoffHz: number, rate: number): Float32Array {
  const lp = lowpass(Float32Array.from(x), cutoffHz, rate);
  for (let i = 0; i < x.length; i++) x[i] = x[i]! - lp[i]!;
  return x;
}
function normalize(x: Float32Array, peak: number): Float32Array {
  let m = 0;
  for (const v of x) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < x.length; i++) x[i] = (x[i]! / m) * peak;
  return x;
}

/** Footstep: a short soft-soled step. Wood = brighter knock + body; rug = muffled, quieter, shorter. */
function footstep(rate: number, seed: number, rug: boolean): Float32Array {
  const r = rng(seed), n = Math.floor(rate * (rug ? 0.09 : 0.12)), x = new Float32Array(n);
  const f0 = 95 + r() * 25;
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const thump = Math.sin(2 * Math.PI * f0 * t) * env(t, 0.003, 0.025);
    const scuff = (r() * 2 - 1) * env(t, 0.001, rug ? 0.012 : 0.018);
    x[i] = thump * 0.8 + scuff * (rug ? 0.35 : 0.6);
  }
  lowpass(x, rug ? 700 : 2600, rate);
  if (!rug) highpass(x, 60, rate);
  return normalize(x, rug ? 0.28 : 0.42);
}

function lampClick(rate: number): Float32Array {
  const n = Math.floor(rate * 0.09), x = new Float32Array(n), r = rng(7);
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const c1 = (r() * 2 - 1) * env(t, 0.0005, 0.004);
    const t2 = t - 0.035;
    const c2 = t2 > 0 ? (r() * 2 - 1) * env(t2, 0.0005, 0.003) * 0.6 : 0;
    const tick = Math.sin(2 * Math.PI * 2400 * t) * env(t, 0.0005, 0.006) * 0.3;
    x[i] = c1 + c2 + tick;
  }
  highpass(x, 900, rate);
  return normalize(x, 0.5);
}

/** Soft bell-like note: two detuned partials, gentle attack, long-ish decay. */
function bell(rate: number, freq: number, dur: number, peak: number): Float32Array {
  const n = Math.floor(rate * dur), x = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / rate, e = env(t, 0.006, dur / 4);
    x[i] = (Math.sin(2 * Math.PI * freq * t) + 0.35 * Math.sin(2 * Math.PI * freq * 2.01 * t) + 0.12 * Math.sin(2 * Math.PI * freq * 3.98 * t)) * e;
  }
  return normalize(x, peak);
}

function noiseSwell(rate: number, seed: number, dur: number, cutoff: number, peak: number): Float32Array {
  const r = rng(seed), n = Math.floor(rate * dur), x = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / rate; x[i] = (r() * 2 - 1) * Math.sin(Math.PI * Math.min(1, t / dur)) ** 2; }
  lowpass(x, cutoff, rate);
  return normalize(x, peak);
}

export function renderSound(id: SoundId, rate = SFX_RATE, variant = 0): Float32Array {
  switch (id) {
    case 'step_wood': return footstep(rate, 101 + variant, false);
    case 'step_rug': return footstep(rate, 201 + variant, true);
    case 'lamp_click': return lampClick(rate);
    case 'interact': {                         // two-note rising chime (E5 → B5, pentatonic)
      const a = bell(rate, 659.25, 0.35, 0.22), b = bell(rate, 987.77, 0.45, 0.2), off = Math.floor(rate * 0.07);
      const x = new Float32Array(off + b.length); x.set(a); for (let i = 0; i < b.length; i++) x[off + i] = x[off + i]! + b[i]!;
      return normalize(x, 0.3);
    }
    case 'chime': return bell(rate, 783.99, 0.6, 0.25);
    case 'sit': return noiseSwell(rate, 31, 0.32, 900, 0.3);
    case 'cloth': return noiseSwell(rate, 41, 0.45, 1600, 0.28);
    case 'door': return noiseSwell(rate, 51, 0.6, 500, 0.35);
    case 'ui_tick': return bell(rate, 1318.5, 0.08, 0.15);
  }
}

/**
 * Seamless ambience loop. Room tone (soft brown noise, low-passed) plus sparse original events:
 * day → light bird chirps through the window; night → a gentle cricket/gecko texture.
 * The tail is cross-faded into the head so the loop has no click at the seam.
 */
export function renderAmbience(id: AmbienceId, rate = SFX_RATE, seconds = 8): Float32Array {
  const n = Math.floor(rate * seconds), x = new Float32Array(n), r = rng(id === 'day' ? 900 : 901);
  let brown = 0;
  for (let i = 0; i < n; i++) { brown = (brown + (r() * 2 - 1) * 0.02) * 0.996; x[i] = brown; }
  lowpass(x, id === 'day' ? 500 : 350, rate);
  normalize(x, id === 'day' ? 0.05 : 0.04);
  const events = id === 'day' ? 7 : 26;
  for (let k = 0; k < events; k++) {
    const start = Math.floor(r() * (n - rate * 0.5));
    if (id === 'day') {                        // short two/three-note chirp, high and soft
      const f = 2600 + r() * 1400, notes = 2 + Math.floor(r() * 2);
      for (let j = 0; j < notes; j++) {
        const s0 = start + Math.floor(j * rate * 0.07), len = Math.floor(rate * 0.05);
        for (let i = 0; i < len && s0 + i < n; i++) {
          const t = i / rate, sweep = f * (1 + 0.25 * (t / 0.05));
          x[s0 + i] = x[s0 + i]! + Math.sin(2 * Math.PI * sweep * t) * Math.sin((Math.PI * i) / len) * 0.035;
        }
      }
    } else {                                   // cricket: 4 rapid pulses of a ~4.5 kHz tone
      const f = 4300 + r() * 500;
      for (let p = 0; p < 4; p++) {
        const s0 = start + Math.floor(p * rate * 0.03), len = Math.floor(rate * 0.018);
        for (let i = 0; i < len && s0 + i < n; i++) {
          const t = i / rate;
          x[s0 + i] = x[s0 + i]! + Math.sin(2 * Math.PI * f * t) * Math.sin((Math.PI * i) / len) * 0.02;
        }
      }
    }
  }
  // seamless loop: cross-fade the last 0.5 s into the first 0.5 s
  const fade = Math.floor(rate * 0.5);
  for (let i = 0; i < fade; i++) {
    const w = i / fade;
    x[i] = x[i]! * w + x[n - fade + i]! * (1 - w);
  }
  return x.subarray(0, n - fade);
}

// ---------------------------------------------------------------- footstep logic (pure)
/**
 * Footsteps fire when the walk cycle crosses a CONTACT frame (feet plant), so sound is locked to the
 * distance-synced animation: no steps while standing, never doubled, correct at any frame rate.
 */
export function crossedContacts(prevDistance: number, distance: number, strideCm: number, contactFrames: number[], frames: number): number {
  if (distance <= prevDistance) return 0;
  const step = strideCm / frames;
  let count = 0;
  for (const cf of contactFrames) {
    const offset = cf * step;
    // number of k with prev < offset + k*stride <= distance
    const a = Math.floor((prevDistance - offset) / strideCm), b = Math.floor((distance - offset) / strideCm);
    count += Math.max(0, b - a);
  }
  return count;
}
