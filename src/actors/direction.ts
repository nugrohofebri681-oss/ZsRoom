export const DIRECTIONS = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'] as const;
export type Direction = (typeof DIRECTIONS)[number];

/** Quantise a ground-space vector (y → south) to one of eight facings. Returns null for ~zero input. */
export function vectorToDirection(x: number, y: number, deadZone = 1e-3): Direction | null {
  if (Math.hypot(x, y) < deadZone) return null;
  const angle = Math.atan2(y, x); // 0 = east, +π/2 = south
  const idx = ((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8;
  return DIRECTIONS[idx]!;
}

/** Normalise input so diagonals are not faster than cardinals; clamps analogue magnitude to 1. */
export function normaliseInput(x: number, y: number): { x: number; y: number } {
  const len = Math.hypot(x, y);
  if (len < 1e-6) return { x: 0, y: 0 };
  const m = Math.min(1, len) / len;
  return { x: x * m, y: y * m };
}
