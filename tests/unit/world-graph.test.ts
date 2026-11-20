import { describe, expect, it } from 'vitest';
import world from '../../src/data/world/world01.json';
import { compileRoom, doorOpen, doorSide, ROOMS } from '../../src/world/room';
import { WalkGrid } from '../../src/world/pathfinding';
import { getCharacterSpec } from '../../src/core/specs';
import { EVENTS, DIALOGUE, runEvent } from '../../src/story/events';
import { COMMS } from '../../src/story/comms';
import { initNpc, stepNpc } from '../../src/world/npc';

const R = getCharacterSpec('char_zila').collision.radiusCm;
const implemented = world.maps.filter((m) => m.status === 'implemented').map((m) => m.id);
const gameMaps = [...ROOMS.keys()].filter((id) => id !== 'review_props');

describe('World 01 graph', () => {
  it('registry and room data agree: every implemented map has data, every map is registered', () => {
    expect(new Set(implemented)).toEqual(new Set(gameMaps));
    for (const m of world.maps) expect(world.districts.map((d) => d.id)).toContain(m.district);
  });

  it('every open door leads to an existing map and spawn, and the destination has a door back', () => {
    for (const id of gameMaps) {
      const room = ROOMS.get(id)!;
      for (const d of room.doors) {
        if (d.locked) { expect(world.maps.map((m) => m.id), `${id}/${d.id} locked target registered`).toContain(d.to.room); continue; }
        const dest = ROOMS.get(d.to.room);
        expect(dest, `${id}/${d.id} → ${d.to.room}`).toBeDefined();
        expect(dest!.spawns[d.to.spawn], `${id}/${d.id} spawn ${d.to.spawn}`).toBeDefined();
        const back = dest!.doors.find((b) => !b.locked && b.to.room === id);
        expect(back, `${d.to.room} has no door back to ${id}`).toBeDefined();
        // arriving via `d`, then taking the door back, lands next to `d` (correct return location)
        const ret = room.spawns[back!.to.spawn]!;
        const side = doorSide(d, room.sizeCm);
        const doorCentre = side === 'north' || side === 'south' ? { x: d.x + d.w / 2, y: side === 'north' ? 0 : room.sizeCm.h } : { x: side === 'west' ? 0 : room.sizeCm.w, y: d.y + d.h / 2 };
        expect(Math.hypot(ret.x - doorCentre.x, ret.y - doorCentre.y), `${id}: return spawn ${back!.to.spawn} is far from ${d.id}`).toBeLessThan(120);
      }
    }
  });

  it('every map is reachable from the bedroom through open doors', () => {
    const seen = new Set([world.start.map]), queue = [world.start.map];
    while (queue.length) for (const d of ROOMS.get(queue.shift()!)!.doors) if (!d.locked && !seen.has(d.to.room)) { seen.add(d.to.room); queue.push(d.to.room); }
    expect(new Set(seen)).toEqual(new Set(gameMaps));
  });

  it('in every map, all spawns, open doorways and interaction spots are reachable on foot from the default spawn', () => {
    for (const id of gameMaps) {
      const data = ROOMS.get(id)!, room = compileRoom(data);
      const grid = new WalkGrid(data.sizeCm.w, data.sizeCm.h, room.solids, R);
      const start = data.spawns.default!;
      expect(grid.standable(start), `${id} default spawn`).toBe(true);
      for (const [name, sp] of Object.entries(data.spawns)) {
        expect(grid.standable(sp), `${id} spawn ${name} standable`).toBe(true);
        expect(grid.findPath(start, sp), `${id} spawn ${name} reachable`).not.toBeNull();
      }
      for (const a of room.anchors) {
        if (a.whileSeatedOn) continue;                 // used from a seat (e.g. the laptop), not on foot
        const path = grid.findPath(start, a);
        expect(path, `${id}: ${a.key} unreachable`).not.toBeNull();
        expect(Math.hypot(path!.at(-1)!.x - a.x, path!.at(-1)!.y - a.y), `${id}: ${a.key} too far from walkable floor`).toBeLessThanOrEqual(a.radiusCm);
      }
    }
  });

  it('locked doors keep their wall solid; unlocking by flag opens the gap', () => {
    const st = ROOMS.get('batuphat_street')!, road = st.doors.find((d) => d.id === 'road_east')!;
    expect(doorOpen(road, {})).toBe(false);
    const { w } = st.sizeCm;
    const solidAt = (data: typeof st) => compileRoom(data).solids.some((s) => s.x >= w && s.x <= w + 1 && s.y <= 600 && s.y + s.h >= 600);
    expect(solidAt(st)).toBe(true);                                    // wall stays closed
    const unlocked = { ...st, doors: st.doors.map((d) => (d.id === 'road_east' ? { ...d, locked: { ...d.locked!, unlessFlag: 'test:open' } } : d)) };
    expect(doorOpen(unlocked.doors.find((d) => d.id === 'road_east')!, { 'test:open': true })).toBe(true);
    expect(compileRoom(unlocked, { 'test:open': true }).solids.some((s) => s.x === w && s.y <= 600 && s.y + s.h >= 600)).toBe(false);   // gap opens
  });

  it('every dialogue / event / comms reference in map data exists', () => {
    for (const id of gameMaps) {
      const data = ROOMS.get(id)!;
      for (const e of data.onEnter ?? []) expect(EVENTS.has(e), `${id} onEnter ${e}`).toBe(true);
      for (const n of data.npcs ?? []) {
        if (n.interact?.dialogue) expect(DIALOGUE[n.interact.dialogue], n.id).toBeDefined();
        if (n.interact?.event) expect(EVENTS.has(n.interact.event), n.id).toBe(true);
      }
      for (const a of compileRoom(data).anchors) {
        const act = (a.payload as { action?: { type: string; id?: string } } | undefined)?.action;
        if (act?.type === 'dialogue') expect(DIALOGUE[act.id!], `${id} ${a.key}`).toBeDefined();
        if (act?.type === 'event') expect(EVENTS.has(act.id!), `${id} ${a.key}`).toBe(true);
      }
    }
    for (const ev of EVENTS.values()) for (const e of [...ev.effects, ...(ev.otherwise ?? [])]) {
      if ('dialogue' in e) expect(DIALOGUE[e.dialogue], `${ev.id} → ${e.dialogue}`).toBeDefined();
      if ('comms' in e) expect(COMMS.has(e.comms), `${ev.id} → ${e.comms}`).toBe(true);
    }
  });
});

describe('story events', () => {
  const s0 = { vars: { cart: '' }, flags: {} };
  it('minimarket loop: pay without an item → cashier asks; pick a drink → pay → purchase recorded', () => {
    let r = runEvent(EVENTS.get('ev_shop_pay'), s0);
    expect(r.ran).toBe(false); expect(r.out.dialogue[0]!.speaker).toBe('Cashier');
    r = runEvent(EVENTS.get('ev_shop_pick_drink'), r.state);
    expect(r.state.vars.cart).toBe('cold tea');
    r = runEvent(EVENTS.get('ev_shop_pay'), r.state);
    expect(r.ran).toBe(true); expect(r.state.vars.purchases).toBe(1); expect(r.state.flags['shop:first_purchase']).toBe(true); expect(r.state.vars.cart).toBe('');
  });
  it('workplace loop: task before clock-in refused; clock in → 3 tasks → clock out', () => {
    let r = runEvent(EVENTS.get('ev_work_task'), { vars: {}, flags: {} });
    expect(r.ran).toBe(false);
    r = runEvent(EVENTS.get('ev_work_clock'), r.state);
    r = runEvent(EVENTS.get('ev_work_clock_out'), r.state);
    expect(r.ran).toBe(false); expect(r.out.dialogue[0]!.lines[0]).toContain('0/3');
    for (let i = 0; i < 3; i++) r = runEvent(EVENTS.get('ev_work_task'), r.state);
    expect(r.out.toasts[0]).toBe('Task done (3/3)');
    r = runEvent(EVENTS.get('ev_work_task'), r.state); expect(r.ran).toBe(false);   // no 4th task
    r = runEvent(EVENTS.get('ev_work_clock_out'), r.state);
    expect(r.ran).toBe(true); expect(r.state.vars.shift).toBe('done'); expect(r.state.flags['work:first_shift']).toBe(true);
  });
  it('once-events fire once per save', () => {
    const a = runEvent(EVENTS.get('ev_street_first_visit'), { vars: {}, flags: {} });
    expect(a.out.comms).toEqual(['comms_placeholder_hello']);
    expect(runEvent(EVENTS.get('ev_street_first_visit'), a.state).ran).toBe(false);
  });
  it('comms content is marked as placeholder (never real messages in this public repo)', () => {
    for (const t of COMMS.values()) { expect(t.placeholder).toBe(true); for (const l of t.lines) expect(l.text).toMatch(/^\[placeholder/); }
  });
});

describe('NPC behaviour (deterministic)', () => {
  const n = ROOMS.get('batuphat_street')!.npcs![0]!;
  it('patrols between its points, never enters blocked cells, stops to face a nearby player', () => {
    const run = () => { const s = initNpc(n, 'morning'); const xs: number[] = []; for (let i = 0; i < 600; i++) { stepNpc(n, s, 50, { x: 9999, y: 9999 }, (x) => x > 1200); xs.push(s.x); } return xs; };
    const a = run(), b = run();
    expect(a).toEqual(b);                                     // deterministic
    expect(Math.max(...a)).toBeLessThanOrEqual(1200);         // respects blocking
    expect(Math.max(...a) - Math.min(...a)).toBeGreaterThan(300);
    const s = initNpc(n, 'morning'); stepNpc(n, s, 50, { x: s.x + 30, y: s.y + 30 }, () => false);
    expect(s.moving).toBe(false); expect(s.facing).toBe('SE');
  });
});

describe('NPC makes way for the player (bounded)', () => {
  it('steps off the player route to a free side spot, then resumes', async () => {
    const { yieldTo } = await import('../../src/world/npc');
    const n = { id: 't', name: 't', look: { shirt: '#fff', pants: '#000', hair: '#000' }, x: 200, y: 100, behaviour: { type: 'idle' as const } };
    const s = initNpc(n, 'morning');
    const player = { x: 160, y: 100 };
    expect(yieldTo(s, player, { x: 1, y: 0 }, () => true)).toBe(true);
    for (let i = 0; i < 40; i++) stepNpc(n, s, 50, player, () => false);
    expect(Math.abs(s.y - 100)).toBeGreaterThanOrEqual(50);          // off the player's horizontal line
    expect(yieldTo(initNpc(n, 'morning'), player, { x: 1, y: 0 }, () => false)).toBe(false);   // nowhere to go → refuse
    for (let i = 0; i < 80; i++) stepNpc(n, s, 50, { x: 9999, y: 9999 }, () => false);
    expect(s.yieldMs).toBeLessThanOrEqual(0);                         // yield ends (bounded)
  });
});
