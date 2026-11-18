import projection from '../../specs/projection.json';

/**
 * ZsRoom world space: ground-plane centimetres (x → east, y → south), z = height above floor (cm).
 * Screen/world-render space: orthographic oblique ("top-down three-quarter").
 * World coordinates never depend on source-image pixels: art density is applied only when sprites are placed.
 */
export const DEPTH_SCALE: number = projection.depthScale;
export const HEIGHT_SCALE: number = projection.heightScale;
export const MASTER_DENSITY: number = projection.masterDensityPxPerCm;

export interface Vec2 { x: number; y: number }

export function groundToRender(x: number, y: number, z = 0): Vec2 {
  return { x, y: y * DEPTH_SCALE - z * HEIGHT_SCALE };
}

export function renderToGround(rx: number, ry: number): Vec2 {
  return { x: rx, y: ry / DEPTH_SCALE };
}

/** Scale to apply to a sprite whose pixels were authored at `densityPxPerCm`. */
export function spriteScaleForDensity(densityPxPerCm: number): number {
  if (densityPxPerCm <= 0) throw new Error(`invalid density ${densityPxPerCm}`);
  return 1 / densityPxPerCm;
}

/** Canvas-pixel position (relative to the canvas pivot) of a ground/height point, at a given density. */
export function pointToCanvasOffset(dx: number, dy: number, z: number, density: number): Vec2 {
  const r = groundToRender(dx, dy, z);
  return { x: r.x * density, y: r.y * density };
}
