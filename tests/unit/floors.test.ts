import { describe, expect, it } from 'vitest';
import { compileFloor, compileMap, FLOORS, playableMapIds, resolveDestination, zoneAt, ZONE_OF } from '../../src/world/floor';
import { compileRoom, getRoom, ROOMS } from '../../src/world/room';
import { WalkGrid } from '../../src/world/pathfinding';
import { getCharacterSpec } from '../../src/core/specs';
import { migrate } from '../../src/systems/save';
import { moveWithCollision } from '../../src/world/collision';

const R = getCharacterSpec('char_zila').collision.radiusCm;
const upper = compileFloor(FLOORS.get('home_upper')!), ground = compileFloor(FLOORS.get('home_ground')!);
const grid = (c: ReturnType<typeof compileFloor>) => new WalkGrid(c.data.sizeCm.w, c.data.sizeCm.h, c.solids, R);

describe('continuous floors (P4)', () => {
  it('bedroom ↔ upstairs hall and kitchen ↔ living room are walkable without any door transition', () => {
    for (const [c, a, b] of [[upper, 'zila_bedroom.default', 'upper_hall.default'], [ground, 'living_room.default', 'kitchen.default']] as const) {
      const path = grid(c).findPath(c.data.spawns[a]!, c.data.spawns[b]!);
      expect(path, `${c.data.id}: ${a} → ${b}`).not.toBeNull();
      // no door on the floor leads to another zone of the same floor (those became openings)
      const zones = new Set(c.zones.map((z) => z.id));
      expect(c.data.doors.some((d) => zones.has(d.to.room))).toBe(false);
    }
  });

  it('the partition wall is solid outside the opening (real walls, not just a removed fade)', () => {
    const op = FLOORS.get('home_upper')!.openings[0]!, x = 740;              // inside the 40 cm partition
    let p = { x: 700, y: op.y + op.h + 40 };                                    // below the opening → blocked
    p = moveWithCollision(p, { x: 120, y: 0 }, R, upper.solids);
    expect(p.x).toBeLessThan(720);
    let q = { x: 700, y: op.y + op.h / 2 };                                     // through the opening → passes
    for (let i = 0; i < 10; i++) q = moveWithCollision(q, { x: 12, y: 0 }, R, upper.solids);
    expect(q.x).toBeGreaterThan(x + 30);
    expect(zoneAt(upper.zones, q.x)!.id).toBe('upper_hall');
  });

  it('approved bedroom furniture keeps its exact position and keys (bedroom is the primary zone at offset 0)', () => {
    const bedroom = compileRoom(getRoom('zila_bedroom'));
    for (const p of bedroom.props) {
      const q = upper.props.find((x) => x.key === p.key)!;
      expect(q, p.key).toBeDefined();
      expect({ x: q.x, y: q.y, z: q.z }).toEqual({ x: p.x, y: p.y, z: p.z });
    }
    // other zones are offset and prefixed, so keys never collide
    const keys = [...upper.props, ...ground.props].map((p) => p.key);
    expect(new Set(upper.props.map((p) => p.key)).size).toBe(upper.props.length);
    expect(ground.props.some((p) => p.key.startsWith('kitchen/'))).toBe(true);
    expect(keys.length).toBeGreaterThan(30);
  });

  it('every interaction of every zone survives on the floor (count and reachability)', () => {
    for (const c of [upper, ground]) {
      const g = grid(c), start = c.data.spawns.default!;
      let n = 0;
      for (const z of c.zones) n += compileRoom(z.data).anchors.filter((a) => a.kind === 'prop').length;
      const props = c.anchors.filter((a) => a.kind === 'prop');
      expect(props.length).toBe(n);
      for (const a of props) {
        if (a.whileSeatedOn) continue;
        const path = g.findPath(start, a);
        expect(path, `${c.data.id}: ${a.key}`).not.toBeNull();
        expect(Math.hypot(path!.at(-1)!.x - a.x, path!.at(-1)!.y - a.y), a.key).toBeLessThanOrEqual(a.radiusCm);
      }
    }
  });

  it('external doors keep their targets (stairs, front door) and sit at their zone positions', () => {
    const stairs = upper.data.doors.find((d) => d.id === 'stairs_down')!;
    expect(stairs.to).toEqual({ room: 'living_room', spawn: 'from_stairs' });
    expect(stairs.x).toBe(760 + 700);                                           // hall east wall on the floor
    const front = ground.data.doors.find((d) => d.id === 'front_door')!;
    expect(front.to.room).toBe('front_yard');
    expect(front.zone).toEqual({ x: 660, w: 900, h: 600 });
  });

  it('legacy room ids resolve to floors: doors from other maps, URLs and saved positions', () => {
    expect(resolveDestination('living_room', 'from_yard')).toEqual({ mapId: 'home_ground', spawn: 'living_room.from_yard', at: undefined });
    expect(resolveDestination('upper_hall', undefined, { x: 100, y: 50, facing: 'S' })).toEqual({ mapId: 'home_upper', spawn: 'upper_hall.default', at: { x: 860, y: 50, facing: 'S' } });
    expect(resolveDestination('batuphat_street', 'from_home').mapId).toBe('batuphat_street');
    for (const [room, z] of ZONE_OF) {
      const c = compileMap(z.floor);
      for (const name of Object.keys(getRoom(room).spawns)) expect(c.data.spawns[`${room}.${name}`], `${room}.${name}`).toBeDefined();
    }
  });

  it('an old v3 save in the living room migrates to a valid position on the ground floor', () => {
    const v3 = { version: 3, savedAt: new Date().toISOString(), roomId: 'living_room', visited: ['zila_bedroom', 'living_room'],
      player: { characterId: 'char_zila', x: 450, y: 330, facing: 'S', outfit: 'default' }, flags: { 'light:zila_bedroom:prop_lamp_zila#17': true }, vars: { phase: 'night' } };
    const save = migrate(v3)!;
    expect(save.roomId).toBe('living_room');                                    // saves stay v3; the scene resolves the alias
    const d = resolveDestination(save.roomId, undefined, save.player);
    expect(d.mapId).toBe('home_ground');
    expect(d.at!.x).toBe(450 + 660);
    expect(grid(ground).standable(d.at!)).toBe(true);
    expect(zoneAt(ground.zones, d.at!.x)!.id).toBe('living_room');
  });

  it('the playable world graph stays connected: every playable map reachable from the bedroom, every door target valid', () => {
    const ids = new Set(playableMapIds());
    const seen = new Set(['home_upper']), q = ['home_upper'];
    while (q.length) {
      for (const d of compileMap(q.shift()!).data.doors) {
        if (d.locked) continue;
        const dest = resolveDestination(d.to.room, d.to.spawn);
        expect(ids.has(dest.mapId), `${d.id} → ${dest.mapId}`).toBe(true);
        expect(compileMap(dest.mapId).data.spawns[dest.spawn!], `${d.id} → ${dest.mapId}/${dest.spawn}`).toBeDefined();
        if (!seen.has(dest.mapId)) { seen.add(dest.mapId); q.push(dest.mapId); }
      }
    }
    expect(seen).toEqual(ids);
    expect(ROOMS.has('minimarket')).toBe(true);                                // stable external ids kept
  });
});
