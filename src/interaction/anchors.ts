export interface WorldAnchor {
  key: string;          // unique within the room, e.g. "prop_bed_zila#0:rest"
  ownerId: string;
  label: string;
  x: number;
  y: number;
  radiusCm: number;
  kind: 'prop' | 'door';
  payload?: unknown;
  /** Only usable while seated on a prop of this asset id (e.g. the laptop from the desk chair). */
  whileSeatedOn?: string;
}

/** Nearest anchor whose radius contains the actor; ties broken by distance. */
export function nearestAnchor(x: number, y: number, anchors: readonly WorldAnchor[], seatedOn: string | null = null): WorldAnchor | null {
  let best: WorldAnchor | null = null;
  let bestD = Infinity;
  for (const a of anchors) {
    if ((a.whileSeatedOn ?? null) !== seatedOn) continue;   // seated → only seat-linked anchors; standing → only normal ones
    const d = Math.hypot(a.x - x, a.y - y);
    if (d <= a.radiusCm && d < bestD) { best = a; bestD = d; }
  }
  return best;
}
