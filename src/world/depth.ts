import type { Rect } from '../core/specs';

/** A sortable prop as seen by the depth/occlusion system (all ground cm / render units). */
export interface SortableProp {
  id: string;
  pivotY: number;            // ground y of the footprint front edge
  footprint: Rect;           // ground-space footprint (absolute)
  renderBounds: Rect;        // render-space bounds of the sprite (absolute)
  occluder: boolean;
}

export interface SortableActor { x: number; y: number; radius: number; renderBounds: Rect }

const BESIDE_EPSILON = 0.5;
/** Only props this close (cm, edge to actor edge) can visually touch the actor sideways. */
export const BESIDE_RANGE = 40;

/**
 * Sort depth for an actor. Base depth is its ground y. When an actor stands *beside* a deep prop
 * (outside the footprint's x-range but within its y-range) a single-pivot sort would wrongly put the
 * actor behind the prop; in an oblique projection nothing occludes sideways, so the actor is lifted
 * just in front of that prop.
 */
export function actorSortDepth(actor: SortableActor, props: readonly SortableProp[]): number {
  let depth = actor.y;
  for (const p of props) {
    const f = p.footprint;
    const gapLeft = f.x - (actor.x + actor.radius);
    const gapRight = actor.x - actor.radius - (f.x + f.w);
    const besideX = (gapLeft >= 0 && gapLeft <= BESIDE_RANGE) || (gapRight >= 0 && gapRight <= BESIDE_RANGE);
    const withinY = actor.y >= f.y && actor.y <= f.y + f.h;
    if (besideX && withinY && actor.y < p.pivotY) depth = Math.max(depth, p.pivotY + BESIDE_EPSILON);
  }
  return depth;
}

export function rectOverlapArea(a: Rect, b: Rect): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/** Props drawn in front of the actor that hide a meaningful part of it, and should fade. */
export function occludingProps(actor: SortableActor, actorDepth: number, props: readonly SortableProp[], minCoverage = 0.15): string[] {
  const area = actor.renderBounds.w * actor.renderBounds.h;
  if (area <= 0) return [];
  return props
    .filter((p) => p.occluder && p.pivotY > actorDepth)
    .filter((p) => rectOverlapArea(actor.renderBounds, p.renderBounds) / area >= minCoverage)
    .map((p) => p.id);
}
