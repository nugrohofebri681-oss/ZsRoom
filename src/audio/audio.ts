import { renderAmbience, renderSound, SFX_RATE, type AmbienceId, type SoundId } from './synth';
import { DEFAULT_PREFS, loadAudioPrefs, saveAudioPrefs, type AudioPrefs } from './prefs';
import { safeStorage } from '../systems/save';

/**
 * ZsRoom audio (Web Audio, no library).
 * - Lazy: no AudioContext exists until the first user gesture (Android/Chrome autoplay policy).
 * - Cheap: every sound is pre-rendered once; playback = one AudioBufferSourceNode per one-shot,
 *   one looping source for ambience. No analysers, no ScriptProcessor, no per-frame work.
 * - Power: the context is SUSPENDED while the page is hidden or the game is muted.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private ambBus!: GainNode;
  private buffers = new Map<string, AudioBuffer>();
  private ambSource: { id: AmbienceId; src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private wantedAmbience: AmbienceId | null = null;
  private lastPlayed = new Map<SoundId, number>();
  prefs: AudioPrefs;
  readonly stats = { unlocks: 0, played: {} as Record<string, number>, ambienceSwitches: 0 };

  constructor(private storage = safeStorage()) {
    this.prefs = loadAudioPrefs(storage);
    document.addEventListener('visibilitychange', () => this.applyRunState());
    // Unlock on the first real user activation. On Android Chrome a touch's pointerdown is NOT a user
    // activation (touchend / pointerup / click are), so listen to all of them; capture phase so a game
    // handler that stops propagation can't swallow it. unlock() is idempotent and cheap once running.
    for (const ev of ['pointerup', 'touchend', 'click', 'keydown', 'mousedown']) {
      document.addEventListener(ev, () => { if (this.ctx?.state !== 'running') this.unlock(); }, { capture: true, passive: true });
    }
  }

  /** Call from any user gesture. Creates/resumes the context; safe to call repeatedly. */
  unlock(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor({ latencyHint: 'interactive' });
      this.master = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();
      this.ambBus = this.ctx.createGain();
      this.sfxBus.connect(this.master); this.ambBus.connect(this.master); this.master.connect(this.ctx.destination);
      this.applyVolumes();
      this.stats.unlocks++;
      // iOS/WebKit only un-mutes a context that has started a source inside the gesture: 1 silent sample.
      const silent = this.ctx.createBufferSource();
      silent.buffer = this.ctx.createBuffer(1, 1, SFX_RATE); silent.connect(this.ctx.destination); silent.start();
      if (this.wantedAmbience) this.setAmbience(this.wantedAmbience);
    }
    this.applyRunState();
  }

  get state(): string { return this.ctx?.state ?? 'not-created'; }
  get ambience(): AmbienceId | null { return this.ambSource?.id ?? null; }
  get wanted(): AmbienceId | null { return this.wantedAmbience; }

  play(id: SoundId, opts: { gain?: number; rate?: number; variant?: number; minGapMs?: number } = {}): void {
    if (!this.ctx || this.prefs.muted || this.ctx.state !== 'running') return;
    const now = performance.now();
    if (opts.minGapMs && now - (this.lastPlayed.get(id) ?? -1e9) < opts.minGapMs) return;
    this.lastPlayed.set(id, now);
    const variant = opts.variant ?? 0;
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer(`${id}:${variant}`, () => renderSound(id, SFX_RATE, variant));
    src.playbackRate.value = opts.rate ?? 1;
    let node: AudioNode = src;
    if (opts.gain !== undefined && opts.gain !== 1) { const g = this.ctx.createGain(); g.gain.value = opts.gain; src.connect(g); node = g; }
    node.connect(this.sfxBus);
    src.start();
    this.stats.played[id] = (this.stats.played[id] ?? 0) + 1;
  }

  /** Cross-fade to a looping ambience bed (rendered once per id). */
  setAmbience(id: AmbienceId | null): void {
    this.wantedAmbience = id;
    if (!this.ctx || this.ambSource?.id === id) return;
    const t = this.ctx.currentTime, old = this.ambSource;
    if (old) { old.gain.gain.setTargetAtTime(0, t, 0.6); old.src.stop(t + 3); }
    this.ambSource = null;
    if (!id) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer(`amb:${id}`, () => renderAmbience(id));
    src.loop = true;
    const g = this.ctx.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(1, t, 0.8);
    src.connect(g); g.connect(this.ambBus); src.start();
    this.ambSource = { id, src, gain: g };
    this.stats.ambienceSwitches++;
  }

  /** persist=false while a slider is being dragged (no storage write per pointer move); true on release. */
  setPrefs(p: Partial<AudioPrefs>, persist = true): void {
    this.prefs = { ...this.prefs, ...p };
    if (persist) saveAudioPrefs(this.storage, this.prefs);
    this.applyVolumes();
    this.applyRunState();
  }
  toggleMute(): boolean { this.setPrefs({ muted: !this.prefs.muted }); return this.prefs.muted; }
  resetPrefs(): void { this.setPrefs({ ...DEFAULT_PREFS }); }

  private buffer(key: string, render: () => Float32Array): AudioBuffer {
    let b = this.buffers.get(key);
    if (!b) {
      const data = render();
      b = this.ctx!.createBuffer(1, data.length, SFX_RATE);
      b.copyToChannel(data as Float32Array<ArrayBuffer>, 0);
      this.buffers.set(key, b);
    }
    return b;
  }

  private applyVolumes(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.prefs.master, t, 0.03);
    this.sfxBus.gain.setTargetAtTime(this.prefs.sfx, t, 0.03);
    this.ambBus.gain.setTargetAtTime(this.prefs.ambience * 0.9, t, 0.05);
  }

  /** Running only when unlocked, visible and not muted: no audio thread work otherwise. */
  private applyRunState(): void {
    if (!this.ctx) return;
    const shouldRun = !document.hidden && !this.prefs.muted;
    if (shouldRun && this.ctx.state === 'suspended') void this.ctx.resume();
    if (!shouldRun && this.ctx.state === 'running') void this.ctx.suspend();
  }

  /** Approximate memory held by decoded buffers (bytes). */
  bufferBytes(): number { let n = 0; for (const b of this.buffers.values()) n += b.length * b.numberOfChannels * 4; return n; }
}

let instance: AudioManager | null = null;
export function audio(): AudioManager { return (instance ??= new AudioManager()); }
