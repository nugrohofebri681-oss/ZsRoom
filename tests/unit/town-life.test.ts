import { describe, expect, it } from 'vitest';
import { FLOORS, zoneAt } from '../../src/world/floor';
import { compileRegion } from '../../src/world/region';
import { WalkGrid } from '../../src/world/pathfinding';
import { initNpc, npcPresent, NPC_RADIUS, stepNpc, type NpcData } from '../../src/world/npc';

/**
 * P6.1 — Batuphat life by place and time. Crowds are design targets per place and phase (docs/research/
 * batuphat-source-register.md §7), never claimed as real head-counts. Routes must be walkable for NPCs.
 */
const def = FLOORS.get('batuphat_town')!, town = compileRegion(def);
const grid = new WalkGrid(town.data.sizeCm.w, town.data.sizeCm.h, town.solids, NPC_RADIUS, 16);
const crowdNpcs = town.data.npcs!.filter((n) => (def.crowds ?? []).some((c) => n.id.startsWith(`${c.id}_`)));
const present = (phase: string, zone: string) => town.data.npcs!.filter((n) => npcPresent(n, phase) && zoneAt(town.zones, n.x, n.y)?.id === zone);
const PHASES = ['morning', 'afternoon', 'evening', 'night'] as const;

describe('P6.1 town life: crowds by place and time of day', () => {
  it('every crowd route point is standable and every leg is walkable for an NPC (no clipping through architecture)', () => {
    for (const c of def.crowds!) for (const [ri, r] of c.routes.entries()) {
      for (const p of r) expect(grid.standable(p), `${c.id} route ${ri} point ${p.x},${p.y}`).toBe(true);
      for (let i = 0; i < r.length && r.length > 1; i++) {
        const a = r[i]!, b = r[(i + 1) % r.length]!;
        expect(grid.lineOfSight(a, b), `${c.id} route ${ri} leg ${a.x},${a.y} → ${b.x},${b.y}`).toBe(true);
      }
    }
  });

  it('the market is busy in the morning, thinning in the afternoon, closed in the evening (a night food seller nearby)', () => {
    const m = (ph: string) => present(ph, 'batuphat_market').length;
    expect(m('morning')).toBeGreaterThanOrEqual(6); expect(m('morning')).toBeLessThanOrEqual(16);
    expect(m('afternoon')).toBeLessThan(m('morning')); expect(m('afternoon')).toBeGreaterThan(0);
    expect(m('evening')).toBe(0); expect(m('night')).toBe(0);
    expect(town.data.npcs!.filter((n) => n.id.startsWith('night_food_') && npcPresent(n, 'night')).length).toBe(1);
  });

  it('the warkop is fullest in the evening; quiet residential lanes never get crowded', () => {
    const w = (ph: string) => town.data.npcs!.filter((n) => n.id.startsWith('warkop_patron_') && npcPresent(n, ph)).length;
    expect(w('evening')).toBeGreaterThan(w('morning')); expect(w('evening')).toBeLessThanOrEqual(6); expect(w('morning')).toBeGreaterThanOrEqual(1);
    for (const ph of PHASES) expect(present(ph, 'batuphat_lanes').length, ph).toBeLessThanOrEqual(3);
    expect(present('night', 'batuphat_lanes').length).toBeLessThanOrEqual(1);
  });

  it('only some ambient people can be greeted; sellers are reached through their stall', () => {
    const talk = crowdNpcs.filter((n) => n.interact).length;
    expect(talk).toBeGreaterThan(0); expect(talk).toBeLessThan(crowdNpcs.length / 2);
    expect(crowdNpcs.filter((n) => n.id.startsWith('market_seller_') && n.interact)).toEqual([]);
  });

  it('shoppers really move between stalls and stop to browse/buy (deterministic simulation, no stalls)', () => {
    const shoppers = town.data.npcs!.filter((n) => n.id.startsWith('market_shopper_') && npcPresent(n, 'morning')) as NpcData[];
    const blocked = (x: number, y: number) => !grid.standable({ x, y });
    for (const n of shoppers) {
      const s = initNpc(n, 'morning'), acts = new Set<string>(); let maxStill = 0, still = 0, lastX = s.x, lastY = s.y;
      for (let t = 0; t < 2400; t++) {                       // 2 minutes at 50 ms steps
        stepNpc(n, s, 50, { x: -9999, y: -9999 }, blocked);
        if (s.act) acts.add(s.act);
        if (Math.hypot(s.x - lastX, s.y - lastY) < 0.01) { still++; maxStill = Math.max(maxStill, still); } else still = 0;
        lastX = s.x; lastY = s.y;
        expect(grid.standable({ x: s.x, y: s.y }), `${n.id} inside architecture at ${Math.round(s.x)},${Math.round(s.y)}`).toBe(true);
      }
      expect([...acts]).toEqual(expect.arrayContaining(['walking']));
      expect(acts.has('browsing') || acts.has('buying'), n.id).toBe(true);
      expect(maxStill * 50, `${n.id} stood still too long`).toBeLessThan(8000);
    }
  });

  it('market stalls sell only in the morning (time-aware gameplay), the warkop serves all day', async () => {
    const { EVENTS, runEvent } = await import('../../src/story/events');
    const buy = (phase: string) => runEvent(EVENTS.get('ev_market_buy_veg'), { vars: { phase }, flags: {} });
    expect(buy('morning').ran).toBe(true); expect(buy('morning').state.vars.market_veg).toBe(1);
    expect(buy('evening').ran).toBe(false); expect(buy('evening').out.dialogue[0]!.lines[0]).toMatch(/morning/);
    let r = runEvent(EVENTS.get('ev_warkop_sit'), { vars: {}, flags: {} }); expect(r.ran).toBe(false);
    r = runEvent(EVENTS.get('ev_warkop_order'), r.state); r = runEvent(EVENTS.get('ev_warkop_sit'), r.state);
    expect(r.ran).toBe(true); expect(r.state.vars.warkopVisits).toBe(1); expect(r.state.flags['warkop:first_sanger']).toBe(true);
  });
});
