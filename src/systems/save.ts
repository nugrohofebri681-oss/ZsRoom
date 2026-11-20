/**
 * Versioned save data. Every schema change bumps SAVE_VERSION and adds a migration from the previous
 * version, so old saves on players' devices keep loading.
 */
export const SAVE_VERSION = 3;
export const SAVE_KEY = 'zsroom.save';

export interface SaveDataV1 {
  version: 1;
  savedAt: string;
  roomId: string;
  player: { characterId: string; x: number; y: number; facing: string; outfit: string };
  flags: Record<string, boolean>;
}
/** v2 adds world variables (time of day, curtains, outfit, day counter…). */
export interface SaveDataV2 extends Omit<SaveDataV1, 'version'> {
  version: 2;
  vars: Record<string, string | number | boolean>;
}
/** v3 (World 01) adds the maps the player has visited. Current map = roomId; flags hold story state. */
export interface SaveDataV3 extends Omit<SaveDataV2, 'version'> {
  version: 3;
  visited: string[];
}
export type SaveData = SaveDataV3;

export interface KeyValueStorage { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }

type Migration = (old: Record<string, unknown>) => Record<string, unknown>;
/** migrations[n] upgrades a save from version n to n+1. */
export const migrations: Record<number, Migration> = {
  0: (old) => ({
    version: 1,
    savedAt: new Date(0).toISOString(),
    roomId: typeof old.room === 'string' ? old.room : 'zila_bedroom',
    player: { characterId: 'char_zila', x: Number(old.x ?? 300), y: Number(old.y ?? 360), facing: 'S', outfit: 'default' },
    flags: {},
  }),
  1: (old) => ({ ...old, version: 2, vars: { phase: 'evening', day: 1, outfit: (old.player as { outfit?: string } | undefined)?.outfit ?? 'default' } }),
  2: (old) => ({ ...old, version: 3, visited: typeof old.roomId === 'string' ? [old.roomId] : [] }),
};

export function migrate(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== 'object') return null;
  let data = raw as Record<string, unknown>;
  let v = typeof data.version === 'number' ? data.version : 0;
  if (v > SAVE_VERSION) return null; // save from a newer build: refuse rather than corrupt
  while (v < SAVE_VERSION) {
    const m = migrations[v];
    if (!m) return null;
    data = m(data);
    v = data.version as number;
  }
  return isValid(data) ? (data as unknown as SaveData) : null;
}

function isValid(d: Record<string, unknown>): boolean {
  const p = d.player as Record<string, unknown> | undefined;
  return d.version === SAVE_VERSION && typeof d.roomId === 'string' && !!p && typeof d.vars === 'object' && d.vars !== null && Array.isArray(d.visited) &&
    Number.isFinite(p.x) && Number.isFinite(p.y) && typeof p.facing === 'string';
}

export function saveGame(storage: KeyValueStorage, data: Omit<SaveData, 'version' | 'savedAt'>, now = new Date()): SaveData {
  const full: SaveData = { ...data, version: SAVE_VERSION, savedAt: now.toISOString() };
  storage.setItem(SAVE_KEY, JSON.stringify(full));
  return full;
}

export function loadGame(storage: KeyValueStorage): SaveData | null {
  let raw: string | null = null;
  try { raw = storage.getItem(SAVE_KEY); } catch { return null; }
  if (!raw) return null;
  try { return migrate(JSON.parse(raw)); } catch { return null; }
}

/** localStorage can throw (private mode, blocked storage); fall back to memory. */
export function safeStorage(): KeyValueStorage {
  try {
    const t = '__zs_probe__';
    window.localStorage.setItem(t, t);
    window.localStorage.removeItem(t);
    return window.localStorage;
  } catch {
    const mem = new Map<string, string>();
    return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: (k) => void mem.delete(k) };
  }
}
