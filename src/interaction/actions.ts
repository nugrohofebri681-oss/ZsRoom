import type { ActionSpec } from '../core/specs';

/** Times of day. Resting advances one phase; resting at night sleeps until morning. */
export const PHASES = ['morning', 'afternoon', 'evening', 'night'] as const;
export type Phase = (typeof PHASES)[number];

export interface PhaseLook {
  label: string;
  overlay: { color: string; alpha: number };   // ambient tint over the room (engine)
  sky: [string, string];                       // window sky gradient top → bottom (engine, behind the glass)
  lightBoost: number;                          // multiplier for engine light pools (lamps read stronger at night)
}

export const PHASE_LOOK: Record<Phase, PhaseLook> = {
  morning:   { label: 'Morning',   overlay: { color: '#FFD9B0', alpha: 0.06 }, sky: ['#9CC9F0', '#FBE3C8'], lightBoost: 0.35 },
  afternoon: { label: 'Afternoon', overlay: { color: '#FFFFFF', alpha: 0.0 },  sky: ['#7FB6EA', '#D6ECFA'], lightBoost: 0.3 },
  evening:   { label: 'Evening',   overlay: { color: '#3A2A55', alpha: 0.3 },  sky: ['#4B3B7A', '#F2A07B'], lightBoost: 0.8 },
  night:     { label: 'Night',     overlay: { color: '#141A33', alpha: 0.48 }, sky: ['#0E1430', '#2B3466'], lightBoost: 1.0 },
};

export function nextPhase(p: Phase): Phase { return PHASES[(PHASES.indexOf(p) + 1) % PHASES.length]!; }
export function isPhase(v: unknown): v is Phase { return typeof v === 'string' && (PHASES as readonly string[]).includes(v); }

/** Outfits available from the wardrobe. Final art: one layered outfit set per entry (Art Bible §9). */
export const OUTFITS = [
  { id: 'default', name: 'Pink & white', color: '#E8A0B4' },
  { id: 'cream', name: 'Cream knit', color: '#F1E2CC' },
  { id: 'blue', name: 'Soft blue', color: '#9DB4D6' },
  { id: 'maroon', name: 'Maroon', color: '#B0506A' },
  { id: 'brown', name: 'Cocoa', color: '#9C7258' },
  { id: 'black', name: 'Night out', color: '#4A4250' },
] as const;
export function nextOutfit(id: string): (typeof OUTFITS)[number] {
  const i = OUTFITS.findIndex((o) => o.id === id);
  return OUTFITS[(i + 1) % OUTFITS.length]!;
}

export type Vars = Record<string, string | number | boolean>;

/** Result of applying an action to the persistent world variables. Rendering side effects are described, not performed. */
export interface ActionResult {
  vars: Vars;
  dialogue?: string[];
  toast?: string;
  fade?: boolean;
  sit?: Extract<ActionSpec, { type: 'sit' }>;
  toggleLight?: boolean;
}

export function applyAction(action: ActionSpec | undefined, vars: Vars, label: string): ActionResult {
  const v: Vars = { ...vars };
  if (!action) return { vars: v, toast: label };
  switch (action.type) {
    case 'message':
      return { vars: v, dialogue: action.lines };
    case 'rest': {
      const cur: Phase = isPhase(v.phase) ? v.phase : 'evening';
      const next = nextPhase(cur);
      v.phase = next;
      if (cur === 'night') v.day = Number(v.day ?? 1) + 1;
      const line = cur === 'night' ? 'Zila sleeps soundly… Good morning!' : `Zila rests for a while. It is now ${PHASE_LOOK[next].label.toLowerCase()}.`;
      return { vars: v, fade: true, dialogue: [line] };
    }
    case 'outfit': {
      const o = nextOutfit(String(v.outfit ?? 'default'));
      v.outfit = o.id;
      return { vars: v, toast: `Outfit: ${o.name}` };
    }
    case 'toggleVar': {
      const now = !v[action.var];
      v[action.var] = now;
      return { vars: v, toast: action.messages?.[String(now)] ?? `${label}: ${now ? 'on' : 'off'}` };
    }
    case 'toggleLight':
      return { vars: v, toggleLight: true };
    case 'sit':
      return { vars: v, sit: action };
  }
}
