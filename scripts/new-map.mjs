#!/usr/bin/env node
// Scaffold a new connected map in one step (reusable for World 01 and future worlds: Sabang, Jogja…).
//
//   node scripts/new-map.mjs --world world01 --id lhokseumawe_road --name "Road to Lhokseumawe" \
//        --kind exterior --size 2400x800 --district lhokseumawe_city \
//        --from batuphat_street --side east --at 480 --len 260 [--door-id road_east]
//
// It creates src/data/rooms/<id>.json (TEMP shell, default spawn, a door BACK to --from with a matching spawn),
// opens/creates the door in the source map on --side (re-using a locked door that already points at <id> or
// at --door-id), adds the source map's arrival spawn `from_<id>`, and registers the map (implemented,
// provisional) in src/data/world/<world>.json. tests/unit/world-graph.test.ts then verifies two-way doors,
// return spawns and reachability. Props, NPCs and interactions are added by hand afterwards.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const need = (n) => { const v = opt(n); if (!v) { console.error(`missing --${n}`); process.exit(2); } return v; };
const world = need('world'), id = need('id'), name = need('name'), kind = opt('kind', 'exterior');
const [W, H] = need('size').split('x').map(Number);
const from = need('from'), side = need('side'), at = Number(need('at')), len = Number(opt('len', kind === 'exterior' ? 260 : 100));
const district = opt('district'), doorId = opt('door-id');
if (!/^[a-z][a-z0-9_]+$/.test(id)) { console.error('id must be snake_case'); process.exit(2); }
const roomPath = (r) => join(ROOT, 'src/data/rooms', `${r}.json`);
if (existsSync(roomPath(id))) { console.error(`${id} already exists`); process.exit(1); }
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const write = (p, d) => writeFileSync(p, JSON.stringify(d, null, 2) + '\n');
const OPP = { east: 'west', west: 'east', north: 'south', south: 'north' };

const src = read(roomPath(from));
// --- door in the source map
let d = src.doors.find((x) => (doorId && x.id === doorId) || (x.locked && x.to?.room === id));
const ns = side === 'north' || side === 'south';
const geom = (s, size, a, l) => (s === 'north' ? { x: a, y: 0, w: l, h: 10 } : s === 'south' ? { x: a, y: size.h, w: l, h: 10 } : s === 'west' ? { x: 0, y: a, w: 10, h: l } : { x: size.w, y: a, w: 10, h: l });
if (!d) { d = { id: doorId ?? `to_${id}`, label: `Go to ${name}` }; src.doors.push(d); }
Object.assign(d, { side, ...geom(side, src.sizeCm, at, len), to: { room: id, spawn: `from_${from}` }, label: d.label?.startsWith('Road') || !d.label ? `Go to ${name}` : d.label });
delete d.locked;
const inset = kind === 'exterior' ? 60 : 50;
const arrive = (s, size, a, l) => (s === 'north' ? { x: a + l / 2, y: inset, facing: 'S' } : s === 'south' ? { x: a + l / 2, y: size.h - inset, facing: 'N' } : s === 'west' ? { x: inset, y: a + l / 2, facing: 'E' } : { x: size.w - inset, y: a + l / 2, facing: 'W' });
src.spawns[`from_${id}`] = arrive(side, src.sizeCm, at, len);
write(roomPath(from), src);

// --- the new map, with the door back on the opposite side at the same position along the wall
const back = OPP[side], size = { w: W, h: H };
const along = Math.min(at, (ns ? W : H) - len - 20);
const isExt = kind === 'exterior';
const room = {
  id, displayName: name, world, floor: 'ground', kind, provisional: true,
  ...(isExt ? { ambience: 'street' } : {}),
  sizeCm: size, wallHeightCm: isExt ? 420 : 280,
  palette: isExt ? { floor: '#B9B3A9', wall: '#E6DCCB', trim: '#8A7F75' } : { floor: '#E6DCCB', wall: '#EADFCF', trim: '#5B3A29' },
  shell: isExt ? { floor: 'env_ground_street', wall: 'env_wall_street_row' } : { floor: 'env_floor_living', wall: 'env_wall_living' },
  spawns: { default: { x: Math.round(W / 2), y: Math.round(H / 2), facing: 'S' }, [`from_${from}`]: arrive(back, size, along, len) },
  props: [], npcs: [],
  doors: [{ id: `to_${from}`, label: `Back to ${src.displayName}`, side: back, ...geom(back, size, along, len), to: { room: from, spawn: `from_${id}` } }],
};
write(roomPath(id), room);

// --- registry
const regPath = join(ROOT, 'src/data/world', `${world}.json`);
const reg = read(regPath);
reg.maps = reg.maps.filter((m) => m.id !== id);
reg.maps.push({ id, district: district ?? reg.maps.find((m) => m.id === from)?.district, kind, status: 'implemented', provisional: true, note: 'Scaffolded by scripts/new-map.mjs — fill in props, NPCs and interactions' });
write(regPath, reg);
console.log(`Created ${id} (${kind} ${W}×${H}) ↔ ${from} via ${side}/${back}. Next: add props/npcs, then npm test (world graph).`);
