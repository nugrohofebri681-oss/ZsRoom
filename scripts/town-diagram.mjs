// Master layout diagram of a P6 town region, drawn from its data: ground network, buildings (with names and doors),
// fences/hedges, logical areas, district exits, the planned player routes, camera field of view and a scale bar.
// Usage: node scripts/town-diagram.mjs batuphat_town docs/reviews/world01-p6/town-layout.png
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const [id = 'batuphat_town', out = 'docs/reviews/world01-p6/town-layout.png'] = process.argv.slice(2);
const region = JSON.parse(readFileSync(`src/data/regions/${id}.json`, 'utf8'));
const rooms = Object.fromEntries(region.zones.map((z) => [z.room, JSON.parse(readFileSync(`src/data/rooms/${z.room}.json`, 'utf8'))]));
// P6.1: buildings may name an archetype (facade, depth, roof from src/data/archetypes.json)
const ARCH = JSON.parse(readFileSync('src/data/archetypes.json', 'utf8')).archetypes;
for (const b of region.buildings) { const a = ARCH[b.archetype] ?? {}; b.facade ??= a.facade; b.depth ??= a.depth; b.roof ??= a.roof?.color ?? '#9C5B4A'; }
const widths = Object.fromEntries(region.buildings.map((b) => [b.facade, JSON.parse(readFileSync(`specs/world/props/${b.facade}.json`, 'utf8')).footprint.widthCm]));
const routes = [
  { name: 'Route A — home → gang W2 → Indomaret', color: '#e63946', pts: [[2550, 1380], [2550, 1540], [3635, 1540], [3635, 2720], [5300, 2720]] },
  { name: 'Route B — home → avenue → Indomaret', color: '#1d6fd8', pts: [[2550, 1380], [2550, 1560], [4730, 1560], [4730, 2760], [5300, 2760]] },
  { name: 'Loop C — home → gang W1 → park → south lane → alley → Indomaret → gang W2 → home', color: '#7b2cbf', dash: true,
    pts: [[2550, 1380], [2550, 1520], [1535, 1520], [1535, 3100], [1675, 3100], [1675, 4425], [3260, 4425], [5830, 4430], [5830, 2740], [3655, 2740], [3655, 1520], [2570, 1520], [2570, 1380]] },
];
const data = { region, rooms, widths, routes };
const html = `<canvas id=c width=2000 height=1730></canvas><script>
const { region, rooms, widths, routes } = ${JSON.stringify(data)};
const c = document.getElementById('c'), g = c.getContext('2d');
const W = 8000, H = 5700, s = 1840 / W, ox = 80, oy = 190, P = (x, y) => [ox + x * s, oy + y * s];
g.fillStyle = '#1d1418'; g.fillRect(0, 0, 2000, 1730);
g.fillStyle = '#fff'; g.font = 'bold 30px sans-serif'; g.fillText('Batuphat — P6.1 master layout (one outdoor map: ' + region.id + ')', 80, 50);
g.font = '17px sans-serif'; g.fillStyle = '#e8dcd8';
g.fillText('80 × 57 m · 34 buildings in 7 archetypes + 8 market kiosks · compressed fictional neighbourhood inspired by Batuphat (see docs/research/batuphat-source-register.md), not real geography', 80, 82);
g.fillText('Walkable: everything green/grey that is not a building, fence or hedge. Doors (●) load interiors; ◆ = district exit / locked border. Outdoors never loads.', 80, 108);
g.fillText('White boxes = camera field of view at default zoom (desktop 1280×720 ≈ 21 × 17 m; phone landscape ≈ 19 × 12 m): the town is ~4 × 3.5 screens.', 80, 134);
const col = { env_ground_yard: '#8DB36B', env_ground_street: '#C9C2B7', env_ground_road: '#5d5a60', env_ground_plaza: '#D8CDB8' };
for (const l of region.ground) { const [x, y] = P(l.x, l.y); g.fillStyle = col[l.floor] ?? '#aaa'; g.fillRect(x, y, l.w * s, l.h * s);
  if (l.markings === 'road') { g.strokeStyle = '#f2e9c9'; g.setLineDash([8, 8]); g.lineWidth = 1.5; g.beginPath(); if (l.w >= l.h) { g.moveTo(x, y + l.h * s / 2); g.lineTo(x + l.w * s, y + l.h * s / 2); } else { g.moveTo(x + l.w * s / 2, y); g.lineTo(x + l.w * s / 2, y + l.h * s); } g.stroke(); g.setLineDash([]); } }
// logical areas
g.lineWidth = 2; g.font = 'bold 15px sans-serif';
for (const z of region.zones) { const r = rooms[z.room], [x, y] = P(z.x, z.y); g.strokeStyle = 'rgba(255,255,255,0.55)'; g.setLineDash([10, 6]); g.strokeRect(x + 2, y + 2, r.sizeCm.w * s - 4, r.sizeCm.h * s - 4); g.setLineDash([]);
  g.fillStyle = 'rgba(29,20,24,0.75)'; const t = r.displayName + '  (' + z.room + ')'; const tw = g.measureText(t).width; const dy = z.room === 'batuphat_park' ? 30 : 0; g.fillRect(x + 6, y + 6 + dy, tw + 10, 22); g.fillStyle = '#fff'; g.fillText(t, x + 11, y + 22 + dy); }
// fences / hedges
for (const f of region.fences) { const [x, y] = P(f.x, f.y); g.fillStyle = f.color === '#5E8A4E' ? '#2f5a28' : '#fff6e6'; g.fillRect(x, y, Math.max(3, f.w * s), Math.max(3, f.h * s)); }
// buildings
g.font = '12px sans-serif';
for (const b of region.buildings) { const w = widths[b.facade], [x, y] = P(b.x - w / 2, b.y - b.depth); const story = !!b.door;
  g.fillStyle = b.roof; g.fillRect(x, y, w * s, b.depth * s); g.strokeStyle = story ? '#ffd45c' : 'rgba(0,0,0,0.5)'; g.lineWidth = story ? 3 : 1; g.strokeRect(x, y, w * s, b.depth * s);
  g.fillStyle = '#fff'; g.font = story ? 'bold 14px sans-serif' : '11px sans-serif';
  const name = b.door ? ({ house_door: "Zila's house", minimarket_door: 'Indomaret', mixue_door: 'Mixue', workplace_door: 'Workplace (dimsum)', warkop_door: 'Warung kopi' })[b.door.id] : b.archetype === 'market_kiosk' ? '' : (b.inspect?.name ?? b.id);
  g.fillText(name, x + 4, y + b.depth * s / 2 + 4);
  if (b.door) { const [dx, dy] = P(b.x + (b.door.dx ?? 0), b.y); g.fillStyle = '#ffd45c'; g.beginPath(); g.arc(dx, dy, 7, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '11px sans-serif'; g.fillText('→ ' + b.door.to.room, dx + 9, dy + 14); } }
// P6.1 places from research: market + warkop labels
for (const [t, x, y] of [['PASAR PAGI (morning market)', 4920, 4320], ['open-front warkop · tables outside', 760, 2950]]) { const [a, b] = P(x, y); g.fillStyle = 'rgba(29,20,24,0.8)'; g.font = 'bold 14px sans-serif'; const tw = g.measureText(t).width; g.fillRect(a - 4, b - 15, tw + 8, 20); g.fillStyle = '#ffd45c'; g.fillText(t, a, b); }
// district exits
for (const z of region.zones) for (const d of rooms[z.room].doors) { const [x, y] = P(z.x + d.x, z.y + d.y + d.h / 2); g.fillStyle = d.locked ? '#c0607e' : '#ffd45c'; g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillRect(-8, -8, 16, 16); g.restore();
  g.fillStyle = '#fff'; g.font = 'bold 13px sans-serif'; const t = (d.locked ? '🔒 ' : '→ ') + d.to.room; g.fillText(t, d.side === 'east' ? x - g.measureText(t).width - 14 : x + 14, y - 12); }
// routes
for (const r of routes) { g.strokeStyle = r.color; g.lineWidth = r.dash ? 4 : 5; g.setLineDash(r.dash ? [12, 7] : []); g.beginPath(); r.pts.forEach(([x, y], i) => { const [a, b] = P(x, y); i ? g.lineTo(a, b) : g.moveTo(a, b); }); g.stroke(); g.setLineDash([]); }
// camera field of view (default zoom): desktop centred on the crossroads, phone on the garden
for (const [label, cx, cy, w, h] of [['desktop view', 4730, 3000, 2095, 1179 / 0.7], ['phone view', 2550, 1250, 1930, 868 / 0.7]]) { const [x, y] = P(cx - w / 2, cy - h / 2); g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.strokeRect(x, y, w * s, h * s); g.fillStyle = '#fff'; g.font = 'bold 13px sans-serif'; g.fillText(label, x + 4, y + h * s - 6); }
// legend + scale
let ly = 1585; g.font = 'bold 15px sans-serif';
for (const r of routes) { g.strokeStyle = r.color; g.lineWidth = 5; g.setLineDash(r.dash ? [12, 7] : []); g.beginPath(); g.moveTo(80, ly); g.lineTo(130, ly); g.stroke(); g.setLineDash([]); g.fillStyle = '#fff'; g.fillText(r.name, 142, ly + 5); ly += 26; }
const sx = 1300, sy = 1650; g.fillStyle = '#fff'; g.fillRect(sx, sy, 1000 * s, 6); g.fillText('10 m', sx + 1000 * s + 8, sy + 8);
g.fillStyle = '#ffd45c'; g.fillRect(1300, 1578, 16, 16); g.fillStyle = '#fff'; g.fillText('story building (door → interior)', 1324, 1592);
g.fillStyle = '#2f5a28'; g.fillRect(1300, 1604, 16, 16); g.fillStyle = '#fff'; g.fillText('hedge (solid)', 1324, 1618);
g.fillStyle = '#fff6e6'; g.fillRect(1500, 1604, 16, 16); g.fillStyle = '#fff'; g.fillText('fence / garden wall (solid)', 1524, 1618);
</script>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 2000, height: 1730 } });
await p.setContent(html); await p.locator('canvas').screenshot({ path: out }); await b.close();
console.log('wrote', out);
