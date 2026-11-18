export interface Rect { x: number; y: number; w: number; h: number }

export interface InteractionAnchorSpec {
  id: string; label: string; x: number; y: number; facing: string; radiusCm: number;
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

export type AssetSpec = PropSpec | CharacterSpec;

const modules = import.meta.glob('../../specs/{props,characters}/*.json', { eager: true, import: 'default' }) as Record<string, AssetSpec>;

export const SPECS: ReadonlyMap<string, AssetSpec> = new Map(Object.values(modules).map((s) => [s.id, s]));

export function getPropSpec(id: string): PropSpec {
  const s = SPECS.get(id);
  if (!s || s.category !== 'prop') throw new Error(`Unknown prop spec: ${id}`);
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
