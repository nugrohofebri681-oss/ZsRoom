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
// Playable maps after composition (P4 floors, P5/P6 outdoor regions): doors may live on region buildings.
import { compileMap, playableMapIds, resolveDestination } from '../../src/world/floor';
const playable = playableMapIds();
const compiled = new Map(playable.map((id) => [id, compileMap(id)]));
const targetOf = (d: { to: { room: string; spawn: string } }) => resolveDestination(d.to.room, d.to.spawn);
function reachableFrom(start: string): Set<string> {
  const s0 = resolveDestination(start).mapId, seen = new Set([s0]), q = [s0];
  while (q.length) for (const d of compiled.get(q.shift()!)!.data.doors) { if (d.locked) continue; const t = targetOf(d).mapId; if (!seen.has(t)) { seen.add(t); q.push(t); } }
  return seen;
}

describe('World 01 graph', () => {
  it('registry and room data agree: every implemented map has data, every map is registered', async () => {
    const { FLOORS } = await import('../../src/world/floor');
    expect(new Set(implemented)).toEqual(new Set([...gameMaps, ...FLOORS.keys()]));
    for (const m of world.maps) expect(world.districts.map((d) => d.id)).toContain(m.district);
  });

  it('every open door leads to an existing map and spawn, and the destination has a door back', () => {
    for (const [id, room] of compiled) {
      for (const d of room.data.doors) {
        if (d.locked) { expect(world.maps.map((m) => m.id), `${id}/${d.id} locked target registered`).toContain(d.to.room); continue; }
        const t = targetOf(d), dest = compiled.get(t.mapId);
        expect(dest, `${id}/${d.id} → ${d.to.room}`).toBeDefined();
        expect(dest!.data.spawns[t.spawn ?? d.to.spawn], `${id}/${d.id} spawn ${t.spawn}`).toBeDefined();
        const back = dest!.data.doors.find((b) => !b.locked && targetOf(b).mapId === id);
        expect(back, `${t.mapId} has no door back to ${id}`).toBeDefined();
        // arriving via `d`, then taking the door back, lands next to `d` (correct return location)
        const bt = targetOf(back!), ret = room.data.spawns[bt.spawn ?? back!.to.spawn]!;
        const side = doorSide(d, room.data.sizeCm), z = d.zone ?? { x: 0, y: 0, w: room.data.sizeCm.w, h: room.data.sizeCm.h };
        const zy = z.y ?? 0;
        const doorCentre = side === 'north' ? { x: d.x + d.w / 2, y: d.zone ? d.y : 0 } : side === 'south' ? { x: d.x + d.w / 2, y: zy + z.h } : { x: side === 'west' ? z.x : z.x + z.w, y: d.y + d.h / 2 };
        expect(Math.hypot(ret.x - doorCentre.x, ret.y - doorCentre.y), `${id}: return spawn is far from ${d.id}`).toBeLessThan(120);
      }
    }
  });

  it('every map is reachable from the bedroom through open doors', () => {
    expect(reachableFrom(world.start.map)).toEqual(new Set(playable));
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
    const st = ROOMS.get('batuphat_west')!, road = st.doors.find((d) => d.id === 'road_further')!;
    expect(doorOpen(road, {})).toBe(false);
    const yc = road.y + road.h / 2;
    const wallAt = (data: typeof st, flags: Record<string, boolean> = {}) => compileRoom(data, flags).solids.some((s) => s.x + s.w <= 0 && s.x + s.w >= -1 && s.y <= yc && s.y + s.h >= yc);
    expect(wallAt(st)).toBe(true);                                     // west wall stays closed
    const unlocked = { ...st, doors: st.doors.map((d) => (d.id === 'road_further' ? { ...d, locked: { ...d.locked!, unlessFlag: 'test:open' } } : d)) };
    expect(doorOpen(unlocked.doors.find((d) => d.id === 'road_further')!, { 'test:open': true })).toBe(true);
    expect(wallAt(unlocked, { 'test:open': true })).toBe(false);       // gap opens when the story flag is set
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
    const limit = n.x + 500;
    const run = () => { const s = initNpc(n, 'morning'); const xs: number[] = []; for (let i = 0; i < 600; i++) { stepNpc(n, s, 50, { x: 9999, y: 9999 }, (x) => x > limit); xs.push(s.x); } return xs; };
    const a = run(), b = run();
    expect(a).toEqual(b);                                     // deterministic
    expect(Math.max(...a)).toBeLessThanOrEqual(limit);        // respects blocking
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

describe('story-configurable interiors (variants)', () => {
  it('every variant of every configurable map is complete: spawns, doors and all interactions reachable', async () => {
    const { ROOM_DATA, resolveRoom } = await import('../../src/world/room');
    let checked = 0;
    for (const raw of ROOM_DATA.values()) for (const key of Object.keys(raw.variants ?? {})) {
      const data = resolveRoom(raw, key), room = compileRoom(data);
      const grid = new WalkGrid(data.sizeCm.w, data.sizeCm.h, room.solids, R);
      const start = data.spawns.default!;
      for (const [name, sp] of Object.entries(data.spawns)) expect(grid.findPath(start, sp), `${raw.id}/${key} spawn ${name}`).not.toBeNull();
      for (const a of room.anchors) {
        const path = grid.findPath(start, a);
        expect(path, `${raw.id}/${key}: ${a.key}`).not.toBeNull();
        expect(Math.hypot(path!.at(-1)!.x - a.x, path!.at(-1)!.y - a.y), `${raw.id}/${key}: ${a.key}`).toBeLessThanOrEqual(a.radiusCm);
        const act = (a.payload as { action?: { type: string; id?: string } } | undefined)?.action;
        if (act?.type === 'event') expect(EVENTS.has(act.id!), `${raw.id}/${key} ${act.id}`).toBe(true);
        if (act?.type === 'dialogue') expect(DIALOGUE[act.id!], `${raw.id}/${key} ${act.id}`).toBeDefined();
      }
      for (const n of data.npcs ?? []) if (n.interact?.dialogue) expect(DIALOGUE[n.interact.dialogue]).toBeDefined();
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(2);
  });
  it('the registry chooses the workplace variant; unknown overrides fall back to the default', async () => {
    const { ROOM_DATA, variantFor } = await import('../../src/world/room');
    const wp = ROOM_DATA.get('workplace')!;
    expect(variantFor(wp)).toBe(world.placeholders.workplace.variant);
    expect(variantFor(wp, 'dimsum')).toBe('dimsum');
    expect(variantFor(wp, 'nonsense')).toBe('office');
  });
  it('dimsum cashier shift: clock in → take order → kitchen → hand over & pay, ×3 → clock out', () => {
    let s = { vars: {} as Record<string, string | number | boolean>, flags: {} as Record<string, boolean> };
    const run = (id: string) => { const r = runEvent(EVENTS.get(id), s); s = r.state; return r; };
    expect(run('ev_dimsum_take_order').ran).toBe(false);           // not clocked in
    run('ev_dimsum_clock');
    expect(run('ev_dimsum_checkout').ran).toBe(false);             // nothing ready
    for (let i = 0; i < 3; i++) {
      expect(run('ev_dimsum_take_order').ran).toBe(true);
      expect(run('ev_dimsum_take_order').ran).toBe(false);         // one order at a time
      expect(run('ev_dimsum_pass').ran).toBe(true);
      expect(run('ev_dimsum_checkout').ran).toBe(true);
    }
    expect(s.vars.ordersDone).toBe(3);
    expect(run('ev_dimsum_take_order').ran).toBe(false);           // no 4th order this shift
    expect(run('ev_dimsum_clock_out').ran).toBe(true);
    expect(s.vars.shift).toBe('done');
  });
  it('the customer only waits at the counter during an unfinished shift (NPC showIf)', async () => {
    const { check } = await import('../../src/story/events');
    const { ROOM_DATA, resolveRoom } = await import('../../src/world/room');
    const cust = resolveRoom(ROOM_DATA.get('workplace')!, 'dimsum').npcs!.find((n) => n.id === 'npc_dimsum_customer')!;
    const vis = (vars: Record<string, string | number>) => cust.showIf!.every((c) => check(c, { vars, flags: {} }));
    expect(vis({})).toBe(false);
    expect(vis({ shift: 'in_progress', ordersDone: 1 })).toBe(true);
    expect(vis({ shift: 'in_progress', ordersDone: 3 })).toBe(false);
  });
});

describe('adaptive render resolution policy', () => {
  it('steps down one notch only after two slow windows, never below 1', async () => {
    const { nextScale } = await import('../../src/systems/renderScale');
    expect(nextScale(2, 1)).toBe(2);
    expect(nextScale(2, 2)).toBe(1.75);
    expect(nextScale(1.5, 3)).toBe(1.25);
    expect(nextScale(1, 5)).toBe(1);
  });
});

describe('location tiers (World 01 P3)', () => {
  it('every inspectable landmark in map data is listed in the registry as background, with a non-empty neutral comment', async () => {
    const { ROOM_DATA } = await import('../../src/world/room');
    const listed = new Set((world as unknown as { inspectables: { map: string; name: string; role: string }[] }).inspectables.map((i) => `${i.map}/${i.name}`));
    let n = 0;
    for (const r of ROOM_DATA.values()) for (const p of [...(r.props ?? []), ...Object.values(r.variants ?? {}).flatMap((v) => v.props ?? [])]) if (p.inspect) {
      n++;
      expect(listed.has(`${r.id}/${p.inspect.name}`), `${r.id}/${p.inspect.name} missing from registry inspectables`).toBe(true);
      expect(p.inspect.comment.length).toBeGreaterThan(10);
    }
    expect(n).toBeGreaterThanOrEqual(15);
  });
  it('Unimal is a reachable destination from the bedroom, and the city has a two-way road to Batuphat', () => {
    const seen = reachableFrom('zila_bedroom');
    for (const m of ['lhokseumawe_road', 'lhokseumawe_centre', 'unimal_campus']) expect(seen.has(m), m).toBe(true);
    const back = ROOMS.get('lhokseumawe_road')!.doors.find((d) => d.to.room === 'batuphat_street' && !d.locked);
    expect(back).toBeDefined();
  });
});
