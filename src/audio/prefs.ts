import type { KeyValueStorage } from '../systems/save';

/** Per-device audio preferences (not part of the save game). */
export const AUDIO_PREFS_KEY = 'zsroom.audio';
export interface AudioPrefs { version: 1; muted: boolean; master: number; ambience: number; sfx: number }
export const DEFAULT_PREFS: AudioPrefs = { version: 1, muted: false, master: 0.8, ambience: 0.6, sfx: 0.9 };

const clamp01 = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : d);

export function loadAudioPrefs(storage: KeyValueStorage): AudioPrefs {
  let raw: unknown = null;
  try { raw = JSON.parse(storage.getItem(AUDIO_PREFS_KEY) ?? 'null'); } catch { raw = null; }
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_PREFS };
  const r = raw as Partial<AudioPrefs>;
  return { version: 1, muted: r.muted === true, master: clamp01(r.master, DEFAULT_PREFS.master), ambience: clamp01(r.ambience, DEFAULT_PREFS.ambience), sfx: clamp01(r.sfx, DEFAULT_PREFS.sfx) };
}

export function saveAudioPrefs(storage: KeyValueStorage, p: AudioPrefs): void {
  try { storage.setItem(AUDIO_PREFS_KEY, JSON.stringify(p)); } catch { /* storage unavailable: keep in memory */ }
}
