/**
 * Ground material classes for town regions and their deterministic drawing precedence (P6.1): where strips
 * cross, the higher rank draws on top — a road over a lane crossing it, a lane over the pavement band, paving over
 * grass. Markings (kerbs, centre lines, lane edges) stop where a higher-ranked strip crosses them.
 */
export interface GroundStrip { floor: string; x: number; y: number; w: number; h: number; markings?: 'road' | 'lane'; base?: boolean }
export type GroundClass = 'grass' | 'plaza' | 'pavement' | 'lane' | 'road';
export const GROUND_RANK: Record<GroundClass, number> = { grass: 0, plaza: 1, pavement: 2, lane: 3, road: 4 };
export function groundClass(l: GroundStrip): GroundClass {
  if (l.floor === 'env_ground_road') return 'road';
  if (l.floor === 'env_ground_plaza') return 'plaza';
  if (l.floor === 'env_ground_yard') return 'grass';
  return l.markings === 'lane' ? 'lane' : 'pavement';
}
/** Layers in drawing order: base first, then by class rank, then authoring order (stable). */
export function drawOrder<T extends GroundStrip>(ground: T[]): T[] {
  return ground.map((l, i) => ({ l, i }))
    .sort((a, b) => Number(!a.l.base) - Number(!b.l.base) || GROUND_RANK[groundClass(a.l)] - GROUND_RANK[groundClass(b.l)] || a.i - b.i)
    .map((q) => q.l);
}
/** [a, b] minus the blocked intervals, as visible runs (for markings that stop at junctions). */
export function runsMinus(a: number, b: number, blocked: [number, number][]): [number, number][] {
  const out: [number, number][] = []; let cur = a;
  for (const [s, e] of [...blocked].sort((p, q) => p[0] - q[0])) { if (e <= cur || s >= b) continue; if (s > cur) out.push([cur, s]); cur = Math.max(cur, e); }
  if (cur < b) out.push([cur, b]);
  return out;
}
