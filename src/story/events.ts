import eventsData from '../data/story/events.json';
import dialogueData from '../data/story/dialogue.json';

/**
 * Story events: data in src/data/story/*.json, logic here (pure, unit-tested). An event checks simple
 * conditions on world state and produces effects; the scene performs the presentation (dialogue, toast,
 * chat). Dialogue text lives in data, never in engine code.
 */
export type Value = string | number | boolean;
export interface StoryState { vars: Record<string, Value>; flags: Record<string, boolean> }

export interface Condition {
  flag?: string; notFlag?: string;
  varEq?: [string, Value]; varNe?: [string, Value]; varGte?: [string, number]; varLt?: [string, number];
}
export type Effect =
  | { dialogue: string } | { say: { speaker: string; lines: string[] } } | { toast: string }
  | { setFlag: string } | { clearFlag: string } | { setVar: [string, Value] } | { incVar: [string, number] }
  | { comms: string };
export interface StoryEvent {
  id: string;
  /** All must hold; otherwise `otherwise` runs (if given). */
  requires?: Condition[];
  effects: Effect[];
  otherwise?: Effect[];
  /** Fire at most once per save (remembered as flag `event:<id>`). */
  once?: boolean;
}
export interface DialogueEntry { speaker: string; lines: string[]; portrait?: string }

export const EVENTS: ReadonlyMap<string, StoryEvent> = new Map((eventsData as { events: StoryEvent[] }).events.map((e) => [e.id, e]));
export const DIALOGUE: Readonly<Record<string, DialogueEntry>> = (dialogueData as { dialogue: Record<string, DialogueEntry> }).dialogue;

export function check(c: Condition, s: StoryState): boolean {
  const num = (k: string) => Number(s.vars[k] ?? 0);
  if (c.flag && !s.flags[c.flag]) return false;
  if (c.notFlag && s.flags[c.notFlag]) return false;
  if (c.varEq && (s.vars[c.varEq[0]] ?? '') !== c.varEq[1]) return false;
  if (c.varNe && (s.vars[c.varNe[0]] ?? '') === c.varNe[1]) return false;
  if (c.varGte && !(num(c.varGte[0]) >= c.varGte[1])) return false;
  if (c.varLt && !(num(c.varLt[0]) < c.varLt[1])) return false;
  return true;
}

/** What the scene must present after an event ran. */
export interface Presentation { dialogue: DialogueEntry[]; toasts: string[]; comms: string[] }

/** `{var}` in texts is replaced by the current value (e.g. "Task {tasksDone}/3"). */
export function fill(text: string, s: StoryState): string { return text.replace(/\{(\w+)\}/g, (_, k: string) => String(s.vars[k] ?? '')); }

export function runEvent(ev: StoryEvent | undefined, state: StoryState): { state: StoryState; out: Presentation; ran: boolean } {
  const s: StoryState = { vars: { ...state.vars }, flags: { ...state.flags } };
  const out: Presentation = { dialogue: [], toasts: [], comms: [] };
  if (!ev) return { state: s, out, ran: false };
  if (ev.once && s.flags[`event:${ev.id}`]) return { state: s, out, ran: false };
  const ok = (ev.requires ?? []).every((c) => check(c, s));
  const effects = ok ? ev.effects : ev.otherwise ?? [];
  for (const e of effects) {
    if ('setFlag' in e) s.flags[e.setFlag] = true;
    else if ('clearFlag' in e) delete s.flags[e.clearFlag];
    else if ('setVar' in e) s.vars[e.setVar[0]] = e.setVar[1];
    else if ('incVar' in e) s.vars[e.incVar[0]] = Number(s.vars[e.incVar[0]] ?? 0) + e.incVar[1];
    else if ('dialogue' in e) { const d = DIALOGUE[e.dialogue]; if (d) out.dialogue.push({ ...d, lines: d.lines.map((l) => fill(l, s)) }); }
    else if ('say' in e) out.dialogue.push({ speaker: e.say.speaker, lines: e.say.lines.map((l) => fill(l, s)) });
    else if ('toast' in e) out.toasts.push(fill(e.toast, s));
    else if ('comms' in e) out.comms.push(e.comms);
  }
  if (ok && ev.once) s.flags[`event:${ev.id}`] = true;
  return { state: s, out, ran: ok };
}
