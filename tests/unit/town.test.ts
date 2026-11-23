import { describe, expect, it } from 'vitest';
import { compileMap, FLOORS, legacyToComposite, MAP_ALIAS, playableMapIds, resolveDestination, zoneAt, ZONE_OF } from '../../src/world/floor';
import { compileRegion, subtractRect, voidRects } from '../../src/world/region';
import { getRoom, ROOMS } from '../../src/world/room';
import { WalkGrid } from '../../src/world/pathfinding';
import { getCharacterSpec, type Rect } from '../../src/core/specs';
import { moveWithCollision } from '../../src/world/collision';

/**
 * P6 — Batuphat as ONE explorable town (`batuphat_town`): lanes, gangs, main street with a crossroads, park, south
 * lanes; free-standing buildings (facade + roof + footprint + door). Routes are real: several ways between places.
 */
const R = getCharacterSpec('char_zila').collision.radiusCm;
const def = FLOORS.get('batuphat_town')!;
const town = compileRegion(def);
const gridOf = (extra: Rect[] = []) => new WalkGrid(town.data.sizeCm.w, town.data.sizeCm.h, [...town.solids, ...extra], R, 16);
const grid = gridOf();
const door = (id: string) => town.anchors.find((a) => a.key === `door:${id}`)!;
const spawn = (k: string) => town.data.spawns[k]!;
const pathLen = (p: { x: number; y: number }[], s: { x: number; y: number }) => p.reduce((acc, q, i) => acc + Math.hypot(q.x - (i ? p[i - 1]!.x : s.x), q.y - (i ? p[i - 1]!.y : s.y)), 0);
// the passages between the residential lane and the main street (gangs, the avenue, the west end)
// (P6.1 layout: ruko frontage, the open warkop and story buildings on the main street's north side)
const GANG_W1: Rect = { x: 1400, y: 2150, w: 350, h: 200 }, GANG_W2: Rect = { x: 3450, y: 2150, w: 420, h: 200 };
const AVENUE: Rect = { x: 4330, y: 2150, w: 660, h: 200 }, GANG_E: Rect = { x: 6200, y: 2150, w: 680, h: 200 };
const WEST_END: Rect = { x: -50, y: 2150, w: 350, h: 200 }, MIXUE_GAP: Rect = { x: 2150, y: 2150, w: 340, h: 200 }, EAST_END: Rect = { x: 7920, y: 2150, w: 130, h: 200 };

describe('P6 Batuphat town: a broad 2D map, not a corridor', () => {
  it('is one exterior map, about 80 × 57 m (aspect ~1.4), with seven logical areas', () => {
    expect(town.data.kind).toBe('exterior');
    expect(town.bbox).toEqual({ x: 0, y: 0, w: 8000, h: 5700 });
    expect(town.zones.map((z) => z.id)).toEqual(['front_yard', 'batuphat_park', 'batuphat_west', 'batuphat_street', 'batuphat_lanes', 'batuphat_market', 'batuphat_south']);
    expect(town.ground!.length).toBeGreaterThan(10);
    expect(town.buildings!.length).toBeGreaterThanOrEqual(25);
    expect(voidRects(town.zones, 0, 0, 8000, 5700)).toEqual([]);                       // every cell belongs to an area
  });

  it('story places exist as buildings with working doors; interior returns land in front of the same door', () => {
    for (const [id, to, back] of [['house_door', 'living_room', 'front_yard.from_house'], ['minimarket_door', 'minimarket', 'batuphat_street.from_minimarket'],
      ['mixue_door', 'mixue', 'batuphat_west.from_mixue'], ['workplace_door', 'workplace', 'batuphat_street.from_workplace']] as const) {
      const d = town.data.doors.find((q) => q.id === id)!;
      expect(d.to.room).toBe(to);
      const r = spawn(back);
      expect(Math.hypot(r.x - (d.x + d.w / 2), r.y - d.y), id).toBeLessThan(80);
      expect(grid.standable(r), back).toBe(true);
    }
    expect(town.data.doors.find((q) => q.id === 'road_east')!.to.room).toBe('lhokseumawe_road');
    expect(town.data.doors.find((q) => q.id === 'road_further')!.locked).toBeTruthy();
  });

  it('every spawn, door and interaction is reachable on foot from the garden', () => {
    const start = spawn('front_yard.default');
    for (const [k, s] of Object.entries(town.data.spawns)) { expect(grid.standable(s), `${k} standable`).toBe(true); expect(grid.findPath(start, s), k).not.toBeNull(); }
    for (const a of town.anchors) {
      const p = grid.findPath(start, a);
      expect(p, a.key).not.toBeNull();
      const end = p!.at(-1) ?? start;
      expect(Math.hypot(end.x - a.x, end.y - a.y), a.key).toBeLessThanOrEqual(a.radiusCm);
    }
  });

  it('buildings are solid (their footprint), and the garden fence only opens at the gate', () => {
    const indo = town.buildings!.find((b) => b.id === 'indomaret')!;
    expect(grid.standable({ x: (indo.x0 + indo.x1) / 2, y: indo.front - indo.depth / 2 })).toBe(false);
    let p = { x: 2300, y: 1380 };
    for (let i = 0; i < 12; i++) p = moveWithCollision(p, { x: 0, y: 12 }, R, town.solids);
    expect(p.y).toBeLessThan(1430);
    let q = { x: 2550, y: 1380 };
    for (let i = 0; i < 12; i++) q = moveWithCollision(q, { x: 0, y: 12 }, R, town.solids);
    expect(q.y).toBeGreaterThan(1450);
  });

  it('house → Indomaret has at least two distinct routes (via the gangs, or via the avenue)', () => {
    const a = spawn('front_yard.from_street'), b = door('minimarket_door');
    const viaAvenue = gridOf([GANG_W1, GANG_W2, GANG_E, WEST_END, MIXUE_GAP, EAST_END]).findPath(a, b);
    const viaGangs = gridOf([AVENUE, GANG_E, EAST_END]).findPath(a, b);
    expect(viaAvenue).not.toBeNull(); expect(viaGangs).not.toBeNull();
    // the two routes cross the building row at different places
    const crossX = (p: { x: number; y: number }[]) => p.find((q) => q.y > 2200 && q.y < 2400)?.x ?? p.reduce((m, q) => (Math.abs(q.y - 2300) < Math.abs(m.y - 2300) ? q : m)).x;
    expect(Math.abs(crossX(viaAvenue!) - crossX(viaGangs!))).toBeGreaterThan(600);
    // closing every passage through the row cuts the lane off from the main street (the row is a real obstacle)
    expect(gridOf([GANG_W1, GANG_W2, AVENUE, GANG_E, WEST_END, MIXUE_GAP, EAST_END]).findPath(a, b)).toBeNull();
  });

  it('a loop house → park → south lane → Indomaret → main street → house exists and moves N/S and E/W', () => {
    const legs: [string, { x: number; y: number }][] = [['park', spawn('batuphat_park.default')], ['park east gate', { x: 3260, y: 4425 }], ['south lane', { x: 5830, y: 4430 }],
      ['alley', { x: 5830, y: 3700 }], ['Indomaret', door('minimarket_door')], ['gang W2', { x: 3635, y: 2000 }], ['home', spawn('front_yard.from_street')]];
    let at: { x: number; y: number } = spawn('front_yard.from_street'); const xs = [at.x], ys = [at.y]; let total = 0;
    for (const [name, to] of legs) { const p = grid.findPath(at, to); expect(p, name).not.toBeNull(); total += pathLen(p!, at); for (const q of p!) { xs.push(q.x); ys.push(q.y); } at = p!.at(-1) ?? at; }
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(3000);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(2500);
    expect(total).toBeGreaterThan(10000);
  });

  it('the park has entrances on several sides (north from the main street, east from the south lane, south from the back lane)', () => {
    const inside = spawn('batuphat_park.default');
    for (const [name, from] of [['north', { x: 1675, y: 3450 }], ['north 2', { x: 2500, y: 3450 }], ['east', { x: 3400, y: 4425 }], ['south', { x: 1675, y: 5400 }]] as const) {
      const blockOthers = [{ x: 1600, y: 3590, w: 150, h: 30 }, { x: 2400, y: 3590, w: 200, h: 30 }, { x: 3180, y: 4350, w: 30, h: 150 }, { x: 1600, y: 5280, w: 150, h: 30 }]
        .filter((_, i) => i !== ['north', 'north 2', 'east', 'south'].indexOf(name));
      expect(gridOf(blockOthers).findPath(from, inside), name).not.toBeNull();
    }
  });

  it('zones: titles follow the area; overlapping areas resolve by priority (garden over lanes, park over south)', () => {
    expect(zoneAt(town.zones, 2550, 1100)?.id).toBe('front_yard');
    expect(zoneAt(town.zones, 3300, 1540)?.id).toBe('batuphat_lanes');
    expect(zoneAt(town.zones, 1675, 4300)?.id).toBe('batuphat_park');
    expect(zoneAt(town.zones, 5000, 4430)?.id).toBe('batuphat_south');
    expect(zoneAt(town.zones, 2700, 2700)?.id).toBe('batuphat_west');
    expect(zoneAt(town.zones, 5300, 2700)?.id).toBe('batuphat_street');
  });

  it('legacy ids: P4 maps and the P5 region resolve to the town; old positions land beside the same building', () => {
    for (const id of ['front_yard', 'batuphat_street', 'batuphat_west']) expect(ZONE_OF.get(id)!.floor).toBe('batuphat_town');
    expect(MAP_ALIAS.get('batuphat_region')!.floor).toBe('batuphat_town');
    expect(resolveDestination('batuphat_region').mapId).toBe('batuphat_town');
    expect(compileMap('batuphat_street').data.id).toBe('batuphat_town');
    expect(playableMapIds()).toContain('batuphat_town');
    for (const id of ['front_yard', 'batuphat_street', 'batuphat_west', 'batuphat_region']) expect(playableMapIds()).not.toContain(id);
    const near = (p: { x: number; y: number }, d: { x: number; y: number }) => Math.hypot(p.x - d.x, p.y - d.y);
    expect(near(legacyToComposite('batuphat_street', 1420, 60), door('minimarket_door'))).toBeLessThan(120);   // P4: Indomaret
    expect(near(legacyToComposite('batuphat_region', 4220, 760), door('minimarket_door'))).toBeLessThan(120);  // P5: Indomaret
    expect(near(legacyToComposite('batuphat_region', 2160, 760), door('mixue_door'))).toBeLessThan(120);       // P5: Mixue
    expect(near(legacyToComposite('front_yard', 500, 60), door('house_door'))).toBeLessThan(120);              // P4: doorstep
    expect(near(legacyToComposite('batuphat_west', 2160, 60), door('mixue_door'))).toBeLessThan(120);          // P4: Mixue
    for (const [k, anchors] of Object.entries(def.legacyMaps!)) for (const a of anchors) expect(grid.standable({ x: a.to[0], y: a.to[1] }), `${k}: ${a.label}`).toBe(true);
    // the zone room files keep every legacy spawn name used by interior doors and the city road
    for (const [room, names] of [['front_yard', ['from_house', 'from_street']], ['batuphat_street', ['from_minimarket', 'from_workplace', 'from_lhokseumawe_road', 'from_home', 'from_west']], ['batuphat_west', ['from_mixue', 'from_street']]] as const)
      for (const n of names) expect(getRoom(room).spawns[n], `${room}.${n}`).toBeDefined();
    expect(ROOMS.get('minimarket')!.doors.find((d) => d.id === 'exit')!.to).toEqual({ room: 'batuphat_street', spawn: 'from_minimarket' });
  });

  it('geometry helpers: void cells and rectangle subtraction', () => {
    expect(voidRects([{ x: 0, y: 0, w: 10, h: 10 }, { x: 0, y: 10, w: 30, h: 10 }], 0, 0, 30, 20)).toEqual([{ x: 10, y: 0, w: 20, h: 10 }]);
    expect(subtractRect({ x: 0, y: 0, w: 10, h: 10 }, { x: 3, y: 3, w: 4, h: 4 })).toHaveLength(4);
  });

  it('smoothed paths are really walkable: following the waypoints with real collision never stalls (26 sampled routes across town)', () => {
    const spots = [spawn('front_yard.from_street'), door('minimarket_door'), door('mixue_door'), door('workplace_door'), spawn('batuphat_park.default'), spawn('batuphat_south.default'),
      { x: 5830, y: 4430 }, { x: 3300, y: 4425 }, { x: 1675, y: 4250 }, { x: 7900, y: 3100 }, { x: 150, y: 3100 }, { x: 6400, y: 1540 }, { x: 3635, y: 2000 }, { x: 4730, y: 1560 }];
    let n = 0;
    for (let i = 0; i < spots.length; i++) for (let j = 0; j < spots.length; j++) {
      if (i === j || (i * 7 + j * 3) % 5 !== 0) continue;                      // a spread-out sample of pairs
      const path = grid.findPath(spots[i]!, spots[j]!); expect(path, `${i}→${j}`).not.toBeNull();
      let p = { x: spots[i]!.x, y: spots[i]!.y };
      for (const w of path!) for (let k = 0; k < 2000; k++) {
        const dx = w.x - p.x, dy = w.y - p.y, d = Math.hypot(dx, dy);
        if (d < 1) break;
        const step = Math.min(10, d), q = moveWithCollision(p, { x: (dx / d) * step, y: (dy / d) * step }, R, town.solids);
        expect(Math.hypot(q.x - p.x, q.y - p.y), `stalled ${i}→${j} at ${Math.round(p.x)},${Math.round(p.y)}`).toBeGreaterThan(0.2);
        p = q;
      }
      const end = path!.at(-1)!; expect(Math.hypot(p.x - end.x, p.y - end.y)).toBeLessThan(2); n++;
    }
    expect(n).toBeGreaterThanOrEqual(25);
  });

  it('walk grid for a district this size is built quickly (rasterised solids)', () => {
    const t = performance.now(); gridOf(); expect(performance.now() - t).toBeLessThan(1500);
  });
});
