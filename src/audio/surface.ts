import type { PropInstance } from '../world/room';

export interface FloorPatch { x0: number; y0: number; x1: number; y1: number; kind: 'rug' }

/** Rug decals become soft-floor rectangles (ground cm) for footstep sound selection. */
export function floorPatches(props: PropInstance[]): FloorPatch[] {
  return props
    .filter((p) => p.layer === 'decal')
    .map((p) => {
      const w = p.spec.footprint.widthCm, d = p.spec.footprint.depthCm;
      return { x0: p.x - w / 2, y0: p.y - d / 2, x1: p.x + w / 2, y1: p.y + d / 2, kind: 'rug' as const };
    });
}

export function floorAt(x: number, y: number, patches: FloorPatch[]): 'rug' | 'wood' {
  return patches.some((r) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1) ? 'rug' : 'wood';
}
