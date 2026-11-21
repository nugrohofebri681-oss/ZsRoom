import type { Rect } from '../core/specs';

/**
 * Data-driven NPCs: lightweight, deterministic behaviour (no AI service, no per-frame allocation).
 * Behaviours: idle (stand, look at the player when near), wander inside an area, patrol between points.
 * A per-phase schedule decides where (or whether) the NPC is present when the map loads.
 */
export type NpcBehaviour =
  | { type: 'idle' }
  | { type: 'wander'; area: Rect; speed?: number; pauseMs?: [number, number] }
  | { type: 'patrol'; points: { x: number; y: number }[]; speed?: number; pauseMs?: number };

export interface NpcData {
  id: string;
  name: string;
  /** TEMP figure colours until character art exists. */
  look: { shirt: string; pants: string; hair: string; skin?: string; hijab?: string };
  x: number; y: number; facing?: string;
  behaviour: NpcBehaviour;
  /** Per time of day: a position, or "away" (not in this map). Missing phase = default position. */
  schedule?: Partial<Record<'morning' | 'afternoon' | 'evening' | 'night', { x: number; y: number } | 'away'>>;
  /** Interaction: a dialogue id or event id. */
  interact?: { label: string; dialogue?: string; event?: string };
  /** Present only while these story conditions hold (e.g. a customer waits only during a shift). */
  showIf?: import('../story/events').Condition[];
  radiusCm?: number;
}

export interface NpcState {
  id: string; x: number; y: number; facing: string; moving: boolean;
  target: { x: number; y: number } | null; waitMs: number; leg: number; seed: number; walked: number;
  /** >0 while stepping aside for the player (ignores the "stop and look" rule until done). */
  yieldMs?: number;
}

export const NPC_RADIUS = 16;
const NOTICE_CM = 90;   // the NPC stops and faces Zila within this distance

export function npcPresent(n: NpcData, phase: string): boolean {
  return (n.schedule as Record<string, unknown> | undefined)?.[phase] !== 'away';
}

export function initNpc(n: NpcData, phase: string): NpcState {
  const p = (n.schedule as Record<string, { x: number; y: number } | 'away' | undefined> | undefined)?.[phase];
  const at = p && p !== 'away' ? p : { x: n.x, y: n.y };
  let seed = 0;
  for (const c of n.id) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
  return { id: n.id, x: at.x, y: at.y, facing: n.facing ?? 'S', moving: false, target: null, waitMs: 600, leg: 0, seed: seed || 1, walked: 0 };
}

function rand(s: NpcState): number {
  s.seed = (s.seed * 1664525 + 1013904223) >>> 0;
  return s.seed / 4294967296;
}

export function dirFrom(dx: number, dy: number): string {
  const a = Math.atan2(dy, dx), i = (Math.round(a / (Math.PI / 4)) + 8) % 8;
  return ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'][i]!;
}

/** Advance one NPC. `blocked(x, y)` says whether the NPC may stand there (static solids + the player). */
export function stepNpc(n: NpcData, s: NpcState, dtMs: number, player: { x: number; y: number }, blocked: (x: number, y: number) => boolean): void {
  if (s.yieldMs && s.yieldMs > 0) {                // stepping aside: walk to the side spot, then pause briefly
    s.yieldMs -= dtMs;
    const t = s.target;
    if (t) {
      const dx = t.x - s.x, dy = t.y - s.y, d = Math.hypot(dx, dy), step = 90 * (dtMs / 1000);
      if (d <= step) { s.x = t.x; s.y = t.y; s.target = null; s.moving = false; s.waitMs = 1500; }
      else { s.x += (dx / d) * step; s.y += (dy / d) * step; s.moving = true; s.walked += step; s.facing = dirFrom(dx, dy); }
    } else { s.moving = false; s.facing = dirFrom(player.x - s.x, player.y - s.y); }
    return;
  }
  const near = Math.hypot(player.x - s.x, player.y - s.y) < NOTICE_CM;
  if (near) { s.moving = false; s.facing = dirFrom(player.x - s.x, player.y - s.y); return; }
  const b = n.behaviour;
  if (b.type === 'idle') { s.moving = false; s.facing = n.facing ?? s.facing; return; }
  if (s.waitMs > 0) { s.waitMs -= dtMs; s.moving = false; return; }
  if (!s.target) {
    if (b.type === 'wander') s.target = { x: b.area.x + rand(s) * b.area.w, y: b.area.y + rand(s) * b.area.h };
    else { s.leg = (s.leg + 1) % b.points.length; s.target = { ...b.points[s.leg]! }; }
  }
  const speed = (b.speed ?? 70) * (dtMs / 1000);
  const dx = s.target.x - s.x, dy = s.target.y - s.y, d = Math.hypot(dx, dy);
  if (d <= speed) {
    s.x = s.target.x; s.y = s.target.y; s.target = null; s.moving = false;
    s.waitMs = b.type === 'wander' ? (b.pauseMs?.[0] ?? 800) + rand(s) * ((b.pauseMs?.[1] ?? 2400) - (b.pauseMs?.[0] ?? 800)) : (b.pauseMs ?? 1200);
    return;
  }
  const nx = s.x + (dx / d) * speed, ny = s.y + (dy / d) * speed;
  if (blocked(nx, ny)) { s.target = null; s.moving = false; s.waitMs = 400; return; }   // never walks through things: pick another goal
  s.x = nx; s.y = ny; s.moving = true; s.walked += speed; s.facing = dirFrom(dx, dy);
}

/** Collision box an NPC adds for the player. */
export function npcSolid(s: NpcState, r = NPC_RADIUS): Rect { return { x: s.x - r, y: s.y - r * 0.6, w: r * 2, h: r * 1.2 }; }

/**
 * Make way: the player's route is blocked by this NPC. The NPC steps ~60 cm to the side of the player's
 * direction of travel (the side that is free and farther from the route), once, for a bounded time.
 * Returns false if neither side is free (the player's path-following then gives up after its timeout).
 */
export function yieldTo(s: NpcState, player: { x: number; y: number }, dir: { x: number; y: number }, standable: (x: number, y: number) => boolean, durationMs = 2500): boolean {
  if (s.yieldMs && s.yieldMs > 0) return true;
  const len = Math.hypot(dir.x, dir.y) || 1, ux = dir.x / len, uy = dir.y / len;
  const sides = [{ x: -uy, y: ux }, { x: uy, y: -ux }].map((n) => ({ x: s.x + n.x * 60 + ux * 20, y: s.y + n.y * 60 + uy * 20 }))
    .filter((p) => standable(p.x, p.y))
    .sort((a, b) => Math.abs((b.x - player.x) * uy - (b.y - player.y) * ux) - Math.abs((a.x - player.x) * uy - (a.y - player.y) * ux));
  if (!sides.length) return false;
  s.target = sides[0]!; s.yieldMs = durationMs; s.waitMs = 0;
  return true;
}
