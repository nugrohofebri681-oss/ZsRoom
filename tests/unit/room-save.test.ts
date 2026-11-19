import { describe, expect, it } from 'vitest';
import { compileRoom, ROOMS } from '../../src/world/room';
import { circleIntersectsRect } from '../../src/world/collision';
import { SPECS } from '../../src/core/specs';
import { loadGame, migrate, saveGame, SAVE_KEY, SAVE_VERSION, type KeyValueStorage } from '../../src/systems/save';
import { pickDensityVariant } from '../../src/systems/manifest';
import manifest from '../../public/assets/manifest.json';

const mem = (): KeyValueStorage & { m: Map<string, string> } => {
  const m = new Map<string, string>();
  return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

describe('rooms (data-driven)', () => {
  it('every room compiles and every spawn is walkable', () => {
    expect(ROOMS.size).toBeGreaterThanOrEqual(2);
    for (const room of ROOMS.values()) {
      const c = compileRoom(room);
      for (const [name, s] of Object.entries(room.spawns)) {
        const hit = c.solids.find((r) => circleIntersectsRect(s.x, s.y, 18, r));
        expect(hit, `${room.id}.${name} spawn blocked`).toBeUndefined();
      }
    }
  });
  it('every door points at an existing room and spawn', () => {
    for (const room of ROOMS.values()) for (const d of room.doors) {
      const target = ROOMS.get(d.to.room);
      expect(target, `${room.id} → ${d.to.room}`).toBeDefined();
      expect(target!.spawns[d.to.spawn], `${d.to.room}.${d.to.spawn}`).toBeDefined();
    }
  });
  it('every manifest asset has a spec and vice versa', () => {
    for (const id of Object.keys(manifest.assets)) expect(SPECS.has(id), id).toBe(true);
    for (const id of SPECS.keys()) expect(id in manifest.assets, id).toBe(true);
  });
});

describe('versioned save', () => {
  it('round-trips the current version', () => {
    const s = mem();
    saveGame(s, { roomId: 'zila_bedroom', player: { characterId: 'char_zila', x: 1, y: 2, facing: 'N', outfit: 'default' }, flags: {}, vars: { phase: 'night' } });
    expect(loadGame(s)?.player).toMatchObject({ x: 1, y: 2, facing: 'N' });
    expect(loadGame(s)?.version).toBe(SAVE_VERSION);
  });
  it('migrates an unversioned (v0) save', () => {
    expect(migrate({ room: 'upper_hall', x: 5, y: 6 })?.roomId).toBe('upper_hall');
  });
  it('rejects saves from a newer build and corrupt data', () => {
    const s = mem();
    s.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION + 1 }));
    expect(loadGame(s)).toBeNull();
    s.setItem(SAVE_KEY, '{not json');
    expect(loadGame(s)).toBeNull();
  });
});

describe('density variant selection', () => {
  it('prefers hd on high-DPI, sd on low-res', () => {
    expect(pickDensityVariant(2, 1280, ['hd', 'sd'])).toBe('hd');
    expect(pickDensityVariant(1, 800, ['hd', 'sd'])).toBe('sd');
    expect(pickDensityVariant(1, 800, [])).toBeNull();
  });
});
