import type { BuildingInfo } from './floor';
import { DEPTH_SCALE } from '../core/projection';

/**
 * G1 architecture contract — rendering model (docs/production/ARCHITECTURE_CONTRACT_G1.md).
 * A building is drawn from exactly two stacked layers that share ONE depth key, the front line:
 *  - front layer (the facade spec id): ground → eave on the front plane, pivot = front-line centre, depth = front;
 *  - roof layer (the archetype's `roofArt` id): the whole roof mass in 3/4 projection, pivot = front eave centre,
 *    depth = front + 0.01 (over the facade's top edge it overlaps).
 * Exactly one roof source exists per building: the approved roof art, or — until then — the engine's TEMP roof.
 * Never both (that is the "double roof" failure the G1 review warned about).
 */
export type RoofSource = 'art' | 'engine';
export function roofSource(b: Pick<BuildingInfo, 'roofArt'>, approved: (assetId: string) => boolean): RoofSource {
  return b.roofArt && approved(b.roofArt) ? 'art' : 'engine';
}
/** Where the roof layer's pivot (front eave centre) lands in render space. */
export function roofPivot(b: Pick<BuildingInfo, 'x0' | 'x1' | 'front' | 'height'>): { x: number; y: number } {
  return { x: (b.x0 + b.x1) / 2, y: b.front * DEPTH_SCALE - b.height };
}
/** Projected rise of a roof above the front eave (render units = cm at 1 px/cm) for a ridge parallel to the street. */
export function projectedRoofRise(depthCm: number, eaveCm: number, ridgeCm: number, style: string): number {
  return Math.round(style === 'gable' || style === 'hip' ? Math.max(depthCm * DEPTH_SCALE, (depthCm / 2) * DEPTH_SCALE + (ridgeCm - eaveCm)) : depthCm * DEPTH_SCALE);
}
