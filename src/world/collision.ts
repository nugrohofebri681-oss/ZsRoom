import type { Rect } from '../core/specs';
import type { Vec2 } from '../core/projection';

export function circleIntersectsRect(cx: number, cy: number, r: number, rect: Rect): boolean {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

function blocked(x: number, y: number, r: number, solids: readonly Rect[]): boolean {
  for (const s of solids) if (circleIntersectsRect(x, y, r, s)) return true;
  return false;
}

/**
 * Moves a circle through static AABB solids. Axis-separated with sub-stepping so the actor
 * slides along walls/furniture instead of sticking, and cannot tunnel through thin colliders.
 */
export function moveWithCollision(pos: Vec2, delta: Vec2, radius: number, solids: readonly Rect[]): Vec2 {
  const maxStep = Math.max(1, radius / 2);
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(delta.x), Math.abs(delta.y)) / maxStep));
  let { x, y } = pos;
  const sx = delta.x / steps;
  const sy = delta.y / steps;
  for (let i = 0; i < steps; i++) {
    if (sx !== 0 && !blocked(x + sx, y, radius, solids)) x += sx;
    if (sy !== 0 && !blocked(x, y + sy, radius, solids)) y += sy;
  }
  return { x, y };
}
