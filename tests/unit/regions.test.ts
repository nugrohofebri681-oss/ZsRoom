import { describe, expect, it } from 'vitest';
import { compileMap, FLOORS, legacyToComposite, playableMapIds, resolveDestination, zoneAt, ZONE_OF } from '../../src/world/floor';
import { compileRegion, subtractRect, voidRects } from '../../src/world/region';
import { getRoom, ROOMS } from '../../src/world/room';
import { WalkGrid } from '../../src/world/pathfinding';
import { getCharacterSpec } from '../../src/core/specs';
import { moveWithCollision } from '../../src/world/collision';

const R = getCharacterSpec('char_zila').collision.radiusCm;
const def = FLOORS.get('batuphat_region')!;
const region = compileRegion(def);
const grid = new WalkGrid(region.data.sizeCm.w, region.data.sizeCm.h, region.solids, R);
const origin = (room: string) => def.zones.find((z) => z.room === room)!;
const at = (room: string, spawn: string) => region.data.spawns[`${room}.${spawn}`]!;
const door = (id: string) => region.anchors.find((a) => a.key === `door:${id}`)!;

describe('outdoor region (P5): yard + Batuphat street + west block', () => {
  it('is one exterior map with zones offset in x AND y', () => {
    expect(def.kind).toBe('region');
    expect(region.data.kind).toBe('exterior');
    expect(region.zones.map((z) => [z.id, z.x, z.y])).toEqual(def.zones.map((z) => [z.room, z.x, z.y ?? 0]));
    expect(new Set(region.zones.map((z) => z.y)).size).toBeGreaterThan(1);
  });

  it('doorstep → yard → gate → street → Indomaret / workplace / city road is one walkable path, no door between zones', () => {
    for (const goal of [door('minimarket_door'), door('workplace_door'), door('road_east'), door('mixue_door'), at('batuphat_west', 'default'), at('batuphat_west', 'from_mixue')]) {
      expect(grid.findPath(at('front_yard', 'from_house'), goal), `${goal.x},${goal.y}`).not.toBeNull();
    }
    const ids = region.data.doors.map((d) => d.id);
    expect(ids).not.toContain('gate'); expect(ids).not.toContain('home_gate');          // walked through, not used
    expect(ids).not.toContain('road_west'); expect(ids).not.toContain('to_street');
    expect(ids).toEqual(expect.arrayContaining(['house_door', 'minimarket_door', 'workplace_door', 'road_east']));
    expect(region.data.doors.some((d) => region.zones.some((z) => z.id === d.to.room))).toBe(false);
  });

  it('the yard front fence is solid except at the gate; the shop row and the void are solid', () => {
    const y = origin('front_yard'), s = origin('batuphat_street');
    // south through the fence, west of the gate → blocked
    let p = { x: y.x + 200, y: 640 };
    for (let i = 0; i < 12; i++) p = moveWithCollision(p, { x: 0, y: 12 }, R, region.solids);
    expect(p.y).toBeLessThan(685);
    // through the gate → reaches the street
    let q = { x: y.x + 450, y: 640 };
    for (let i = 0; i < 12; i++) q = moveWithCollision(q, { x: 0, y: 12 }, R, region.solids);
    expect(q.y).toBeGreaterThan(s.y! + 20);
    // from the street north into the shop row (void behind the facades) → blocked
    let r = { x: s.x + 1500, y: s.y! + 60 };
    for (let i = 0; i < 12; i++) r = moveWithCollision(r, { x: 0, y: -12 }, R, region.solids);
    expect(r.y).toBeGreaterThanOrEqual(s.y!);
    expect(grid.standable({ x: s.x + 1500, y: s.y! - 100 })).toBe(false);
  });

  it('the west road end stays a locked planned border: no doorway gap, cannot walk off the region', () => {
    const d = region.data.doors.find((x) => x.id === 'road_further')!;
    expect(d.locked).toBeTruthy(); expect(d.to.room).toBe('batuphat_beyond');
    let p = { x: 40, y: d.y + d.h / 2 };
    for (let i = 0; i < 12; i++) p = moveWithCollision(p, { x: -12, y: 0 }, R, region.solids);
    expect(p.x).toBeGreaterThanOrEqual(R - 0.5);
    expect(door('road_further').payload).toEqual({ locked: expect.any(String) });
  });

  it('back walls are drawn only where no zone continues north (the street row opens onto the yard)', () => {
    const street = region.zones.find((z) => z.id === 'batuphat_street')!, yard = region.zones.find((z) => z.id === 'front_yard')!;
    expect(street.wallGaps).toEqual([[yard.x - street.x, yard.x + yard.w - street.x]]);
    expect(yard.wallGaps).toEqual([]);
  });

  it('every interaction (doors, inspectables, NPCs) is reachable from the doorstep', () => {
    for (const a of region.anchors) {
      const path = grid.findPath(at('front_yard', 'from_house'), { x: a.x, y: a.y });   // ends at the nearest free spot
      expect(path, a.key).not.toBeNull();
      const end = path!.at(-1) ?? at('front_yard', 'from_house');
      expect(Math.hypot(end.x - a.x, end.y - a.y), a.key).toBeLessThan(a.radiusCm + 20);
    }
  });

  it('props and NPCs keep their zone and local key; light flags stay per zone', () => {
    const yardProps = region.props.filter((p) => p.zone === 'front_yard');
    expect(yardProps.length).toBe(getRoom('front_yard').props.length);
    for (const p of region.props.filter((q) => q.zone === 'batuphat_street')) expect(p.key).toBe(`batuphat_street/${p.zoneKey}`);
    expect(region.data.npcs!.map((n) => n.id)).toContain('npc_neighbour');
    const n = region.data.npcs!.find((x) => x.id === 'npc_neighbour')!;
    expect(n.y).toBe(ROOMS.get('batuphat_street')!.npcs![0]!.y + origin('batuphat_street').y!);
  });

  it('zoneAt is 2D: the fence line belongs to the yard, the pavement to the street', () => {
    const s = origin('batuphat_street');
    expect(zoneAt(region.zones, s.x + 450, 650)?.id).toBe('front_yard');
    expect(zoneAt(region.zones, s.x + 450, s.y! + 10)?.id).toBe('batuphat_street');
    expect(zoneAt(region.zones, s.x + 2500, s.y! + 100)?.id).toBe('batuphat_street');
  });

  it('legacy map/spawn ids resolve into the region (doors from interiors, URLs, saves)', () => {
    expect(resolveDestination('front_yard', 'from_house')).toEqual({ mapId: 'batuphat_region', spawn: 'front_yard.from_house', at: undefined });
    expect(resolveDestination('batuphat_street', 'from_minimarket').mapId).toBe('batuphat_region');
    expect(compileMap('front_yard').data.id).toBe('batuphat_region');
    expect(ROOMS.get('minimarket')!.doors.find((d) => d.id === 'exit')!.to).toEqual({ room: 'batuphat_street', spawn: 'from_minimarket' });
    expect(playableMapIds()).toContain('batuphat_region');
    expect(playableMapIds()).not.toContain('front_yard'); expect(playableMapIds()).not.toContain('batuphat_street');
    for (const [room, z] of ZONE_OF) if (z.floor === 'batuphat_region') for (const name of Object.keys(getRoom(room).spawns)) {
      const sp = region.data.spawns[`${room}.${name}`]!;
      expect(grid.standable(sp), `${room}.${name}`).toBe(true);
    }
  });

  it('migration table: P4 positions land in front of the same thing in the region', () => {
    const y = origin('front_yard'), s = origin('batuphat_street');
    expect(legacyToComposite('front_yard', 500, 60)).toEqual({ x: y.x + 500, y: y.y! + 60 });              // house doorstep
    expect(legacyToComposite('batuphat_street', 450, 60)).toEqual({ x: s.x + 450, y: s.y! + 60 });         // home gate
    expect(legacyToComposite('batuphat_street', 1420, 60)).toEqual({ x: s.x + 1820, y: s.y! + 60 });       // Indomaret door (moved east)
    expect(legacyToComposite('batuphat_street', 2250, 60)).toEqual({ x: s.x + 2440, y: s.y! + 60 });       // workplace door (moved east)
    // the moved doors match the moved spawns
    const st = getRoom('batuphat_street');
    expect(st.doors.find((d) => d.id === 'minimarket_door')!.x + 55).toBe(st.spawns.from_minimarket!.x);
    expect(st.doors.find((d) => d.id === 'workplace_door')!.x + 55).toBe(st.spawns.from_workplace!.x);
  });

  it('geometry helpers: void cells and rectangle subtraction', () => {
    const v = voidRects([{ x: 0, y: 0, w: 10, h: 10 }, { x: 0, y: 10, w: 30, h: 10 }], 0, 0, 30, 20);
    expect(v).toEqual([{ x: 10, y: 0, w: 20, h: 10 }]);
    expect(subtractRect({ x: 0, y: 0, w: 10, h: 10 }, { x: 3, y: 3, w: 4, h: 4 })).toHaveLength(4);
    expect(subtractRect({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 0, w: 4, h: 4 })).toEqual([{ x: 0, y: 0, w: 10, h: 10 }]);
  });
});
