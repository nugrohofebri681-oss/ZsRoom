import type { Direction } from '../actors/direction';

/** Character rig contract (spec `rig`), shared by TEMP figures and the final layered art. */
export interface RigSpec {
  layers: string[];
  authoredFacings: Direction[];
  mirror: Partial<Record<Direction, Direction>>;
  mirrorableLayers: string[];
  anims: {
    idle: { frames: number; fps: number };
    walk: { frames: number; strideCm: number; contactFrames: number[] };
    sit: { frames: number };
  };
}

export interface FacingResolution { authored: Direction; mirrored: boolean }

/** W-side facings reuse the authored E-side art, mirrored. */
export function resolveFacing(rig: RigSpec, dir: Direction): FacingResolution {
  if (rig.authoredFacings.includes(dir)) return { authored: dir, mirrored: false };
  const src = rig.mirror[dir];
  if (!src) throw new Error(`facing ${dir} is neither authored nor mirrored`);
  return { authored: src, mirrored: true };
}

/**
 * Layers needing dedicated art for a mirrored facing (asymmetric details such as Febri's crossbody bag).
 * Everything else is drawn from the authored facing with scaleX = −1.
 */
export function layersNeedingOwnArt(rig: RigSpec, dir: Direction): string[] {
  return resolveFacing(rig, dir).mirrored ? rig.layers.filter((l) => !rig.mirrorableLayers.includes(l)) : [];
}

/** Walk frame from distance travelled, so stride length matches movement speed exactly (no foot sliding). */
export function walkFrame(rig: RigSpec, distanceCm: number): number {
  const { frames, strideCm } = rig.anims.walk;
  const f = Math.floor(((distanceCm % strideCm) + strideCm) % strideCm / (strideCm / frames));
  return Math.min(frames - 1, f);
}

/** Distance (cm) the planted foot covers between two frames: the slide-free speed contract for artists. */
export function cmPerWalkFrame(rig: RigSpec): number { return rig.anims.walk.strideCm / rig.anims.walk.frames; }

export function idleFrame(rig: RigSpec, timeMs: number): number {
  const { frames, fps } = rig.anims.idle;
  return Math.floor((timeMs / 1000) * fps) % frames;
}

/** Walk phase 0..1 within the stride (TEMP figures animate procedurally from it). */
export function walkPhase(rig: RigSpec, distanceCm: number): number {
  return (walkFrame(rig, distanceCm) + 0.5) / rig.anims.walk.frames;
}
