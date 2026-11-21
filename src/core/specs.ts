export interface Rect { x: number; y: number; w: number; h: number }

/** Data-driven interaction behaviour (src/interaction/actions.ts). */
export type ActionSpec =
  | { type: 'message'; lines: string[] }
  | { type: 'rest' }
  | { type: 'outfit' }
  | { type: 'toggleLight' }
  | { type: 'toggleVar'; var: string; messages?: Record<string, string> }
  | { type: 'sit'; seat: { x: number; y: number }; heightCm: number; facing: string; seatBehind?: boolean }
  | { type: 'dialogue'; id: string }          // data-driven text (src/data/story/dialogue.json)
  | { type: 'event'; id: string }             // story event (src/data/story/events.json)
  | { type: 'inspect'; name: string; comment: string };   // background landmark: name + neutral comment

export interface InteractionAnchorSpec {
  id: string; label: string; x: number; y: number; facing: string; radiusCm: number;
  action?: ActionSpec;
  whileSeatedOn?: string;
}

/** Temporary in-engine artwork drawn from the spec until approved art exists (src/ui/placeholders.ts). */
export interface TempArtSpec { shape: string; [key: string]: unknown }

export interface SurfaceAnchorSpec { id: string; x: number; y: number; z: number; canvas?: { x: number; y: number } }
export interface SurfaceSpec {
  id: string;
  nominalHeightCm: number;
  painted: { backEdgeY: number; frontEdgeY: number; leftX: number; rightX: number; frontEdgeHeightCm: number; planeDepthCm: number } | null;
  anchors: SurfaceAnchorSpec[];
  measuredFrom: { version: string; sha256: string } | null;  // null = nominal (art not approved/measured yet)
}

export interface PropSpec {
  id: string;
  specVersion: string;
  status: string;
  category: 'prop';
  displayName: string;
  density: number;
  canvas: { width: number; height: number };
  pivot: { x: number; y: number };
  footprint: { widthCm: number; depthCm: number };
  heightsCm: Record<string, number>;
  collision: Rect[];
  sort: { mode: 'footprint' | 'pivot' };
  occluder: boolean;
  interactionAnchors: InteractionAnchorSpec[];
  surfaces?: SurfaceSpec[];
  placement?:
    | { type: 'surface'; hostAsset: string; surface: string; anchor: string }
    | { type: 'wall'; wall: 'north' }
    | { type: 'floor' };
  batch?: string;
  temp?: TempArtSpec;
  maxSideOverhangCm?: number;
  glass?: { x: number; z: number; w: number; h: number };
  light?: LightSpec;
}

/** Engine-rendered light. Art is always painted UNLIT; the engine adds glow and illumination. */
export interface LightSpec {
  emitter: { x: number; y: number; z: number };   // cm, relative to the prop's ground position and base height
  color: string;
  radiusCm: number;
  intensity: number;                               // 0..1 alpha of the room pool
  coreSizeCm?: number;                             // bright core diameter at the emitter (0 = none, e.g. light strings)
  /** Light strings: bulb centres (cm, x along the wall / z up, relative to the prop pivot). One soft glow each. */
  points?: { x: number; z: number }[];
  /** 0..1: the engine lights the painted art itself (additive light-coloured copy), e.g. neon tubes. */
  selfLit?: number;
  defaultOn: boolean;
}

export interface CharacterSpec {
  id: string;
  status: string;
  category: 'character';
  displayName: string;
  heightCm: number;
  density: number;
  canvas: { width: number; height: number };
  pivot: { x: number; y: number };
  collision: { radiusCm: number };
}

/** Tileable environment art (room shell): floor tiles repeat in x and y, wall strips repeat in x. */
export interface EnvironmentSpec {
  id: string;
  status: string;
  category: 'environment';
  kind: 'floor-tile' | 'wall-strip';
  displayName: string;
  density: number;
  canvas: { width: number; height: number };
  tile: { repeat: 'x' | 'xy'; widthCm: number; renderDepthCm?: number; heightCm?: number };
  bandsCm?: Record<string, [number, number]>;
  temp?: TempArtSpec;
}

export type AssetSpec = PropSpec | CharacterSpec | EnvironmentSpec;

const modules = import.meta.glob(['../../specs/{props,characters,environments}/*.json', '../../specs/world/*/*.json'], { eager: true, import: 'default' }) as Record<string, AssetSpec>;

export const SPECS: ReadonlyMap<string, AssetSpec> = new Map(Object.values(modules).map((s) => [s.id, s]));

export function getPropSpec(id: string): PropSpec {
  const s = SPECS.get(id);
  if (!s || s.category !== 'prop') throw new Error(`Unknown prop spec: ${id}`);
  return s;
}

export function getEnvironmentSpec(id: string): EnvironmentSpec {
  const s = SPECS.get(id);
  if (!s || s.category !== 'environment') throw new Error(`Unknown environment spec: ${id}`);
  return s;
}

export function getCharacterSpec(id: string): CharacterSpec {
  const s = SPECS.get(id);
  if (!s || s.category !== 'character') throw new Error(`Unknown character spec: ${id}`);
  return s;
}

/** Highest point (cm) of a prop, used for grey-box rendering and occlusion bounds. */
export function propTopCm(spec: PropSpec): number {
  return Math.max(0, ...Object.values(spec.heightsCm));
}
