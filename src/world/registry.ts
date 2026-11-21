/**
 * World registries (src/data/world/<world>.json): one file per world (World 01 Batuphat–Lhokseumawe now;
 * Sabang, Jogja later). Each lists districts, maps (implemented / planned / story-pending), buildings with
 * their location TIER, and story placeholders. Map data (src/data/rooms) references its world by id.
 *
 * Location tiers:
 *   story-critical — interiors, activities, dialogue and story events
 *   enterable      — can be entered and explored
 *   background     — decorative, but inspectable: tap/click shows its name and a neutral comment
 */
export type LocationTier = 'story-critical' | 'enterable' | 'background';
export interface WorldMapEntry { id: string; district: string; building?: string; kind: 'interior' | 'exterior'; status: 'implemented' | 'planned' | 'story-pending'; provisional?: boolean; note?: string }
export interface WorldBuilding { id: string; role: LocationTier; maps?: string[]; note?: string; realWorldReference?: string }
export interface WorldRegistry {
  id: string; name: string;
  start: { map: string; spawn: string };
  districts: { id: string; name: string; provisional?: boolean }[];
  maps: WorldMapEntry[];
  buildings?: WorldBuilding[];
  placeholders?: Record<string, { variant?: string; [k: string]: unknown }>;
}

const modules = import.meta.glob('../data/world/*.json', { eager: true, import: 'default' }) as Record<string, WorldRegistry>;
export const WORLDS: ReadonlyMap<string, WorldRegistry> = new Map(Object.values(modules).map((w) => [w.id, w]));

/** Story placeholders across all worlds (e.g. `workplace` → { variant: 'dimsum' }). */
export function placeholder(key: string): { variant?: string } | undefined {
  for (const w of WORLDS.values()) if (w.placeholders?.[key]) return w.placeholders[key];
  return undefined;
}

export function mapEntry(id: string): (WorldMapEntry & { world: string }) | undefined {
  for (const w of WORLDS.values()) { const m = w.maps.find((x) => x.id === id); if (m) return { ...m, world: w.id }; }
  return undefined;
}
