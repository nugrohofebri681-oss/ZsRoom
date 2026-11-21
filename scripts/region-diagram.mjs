// Draws a compact top-down layout diagram of an outdoor region from its data (zones, doors, fences, facades).
// Usage: node scripts/region-diagram.mjs batuphat_region docs/reviews/world01-p5/region-layout.png
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const [id = 'batuphat_region', out = 'docs/reviews/world01-p5/region-layout.png'] = process.argv.slice(2);
const region = JSON.parse(readFileSync(`src/data/regions/${id}.json`, 'utf8'));
const rooms = Object.fromEntries(region.zones.map((z) => [z.room, JSON.parse(readFileSync(`src/data/rooms/${z.room}.json`, 'utf8'))]));
const facades = {};
for (const z of region.zones) facades[z.room] = rooms[z.room].props.filter((p) => p.wall && /facade|storefront|gate/.test(p.assetId))
  .map((p) => ({ x: p.wall.x, w: JSON.parse(readFileSync(`specs/world/props/${p.assetId}.json`, 'utf8')).footprint.widthCm, name: p.inspect?.name ?? p.assetId.replace('world_', '') }));
const data = { region, rooms, facades };

const html = `<canvas id=c width=1600 height=640></canvas><script>
const { region, rooms, facades } = ${JSON.stringify(data)};
const c = document.getElementById('c'), g = c.getContext('2d');
const X0 = Math.min(...region.zones.map((z) => z.x)), X1 = Math.max(...region.zones.map((z) => z.x + rooms[z.room].sizeCm.w));
const Y1 = Math.max(...region.zones.map((z) => z.y + rooms[z.room].sizeCm.h));
const s = 1500 / (X1 - X0), ox = 50 - X0 * s, oy = 90;
const P = (x, y) => [ox + x * s, oy + y * s];
g.fillStyle = '#1d1418'; g.fillRect(0, 0, 1600, 640);
g.fillStyle = '#fff'; g.font = 'bold 22px sans-serif'; g.fillText(region.displayName + ' — one outdoor map (' + region.id + '), ' + ((X1 - X0) / 100) + ' m × ' + (Y1 / 100) + ' m · provisional layout', 50, 36);
g.font = '14px sans-serif'; g.fillStyle = '#cbb'; g.fillText('Walk between zones = no scene change. Arrows = proper transitions (interiors / district). Dark = void (solid; sky behind the building rows). White lines = fences.', 50, 60);
const fill = { front_yard: '#8DB36B', batuphat_street: '#B9B3A9', batuphat_west: '#B9B3A9' };
for (const z of region.zones) {
  const r = rooms[z.room], [x, y] = P(z.x, z.y);
  g.fillStyle = fill[z.room] ?? '#aaa'; g.fillRect(x, y, r.sizeCm.w * s, r.sizeCm.h * s);
  for (const gz of r.shell?.zones ?? []) { const [a, b] = P(z.x + gz.x, z.y + gz.y); g.fillStyle = gz.markings === 'road' ? '#5d5a60' : '#8DB36B'; g.fillRect(a, b, gz.w * s, gz.h * s); }
  g.strokeStyle = 'rgba(255,255,255,0.5)'; g.setLineDash([6, 4]); g.strokeRect(x, y, r.sizeCm.w * s, r.sizeCm.h * s); g.setLineDash([]);
  g.fillStyle = '#1d1418'; g.font = 'bold 15px sans-serif'; g.fillText('zone ' + z.room + ' @ (' + z.x + ', ' + (z.y ?? 0) + ')', x + 8, z.room === 'front_yard' ? y + 22 : y + r.sizeCm.h * s - 10);
  if (z.room === 'front_yard') { g.font = '12px sans-serif'; g.fillText("Zila's house facade (back wall) · house door", x + 8, y + 40); }
  // building row / facade on the zone's back wall
  for (const f of facades[z.room]) { const [a, b] = P(z.x + f.x - f.w / 2, z.y); g.fillStyle = '#e9d9c2'; g.fillRect(a, b - 16, f.w * s, 14); g.fillStyle = '#3a2530'; g.font = '11px sans-serif'; g.fillText(f.name, a + 2, b - 4); }
  for (const d of r.doors) {
    if (region.zones.some((q) => q.room === d.to.room)) continue;
    const side = d.side ?? (d.y <= 10 ? 'north' : 'south');
    const [a, b] = P(z.x + d.x + (side === 'north' ? d.w / 2 : 0), z.y + d.y + (side === 'north' ? 0 : d.h / 2));
    g.fillStyle = d.locked ? '#c0607e' : '#ffd45c'; g.beginPath(); g.arc(a, b, 7, 0, 7); g.fill();
    g.font = 'bold 12px sans-serif'; g.fillStyle = '#fff';
    const label = (d.locked ? '🔒 ' : '→ ') + d.to.room;
    g.fillText(label, side === 'west' ? a + 10 : side === 'east' ? a - g.measureText(label).width - 10 : a - 30, side === 'north' ? b - 22 : b - 10);
  }
}
g.strokeStyle = '#fff6e6'; g.lineWidth = 3;
for (const f of region.fences ?? []) { const [a, b] = P(f.x, f.y); g.strokeRect(a, b, Math.max(2, f.w * s), Math.max(2, f.h * s)); }
const yard = region.zones.find((z) => z.room === 'front_yard'), gate = rooms.front_yard.doors.find((d) => d.id === 'gate');
if (yard && gate) { const [a, b] = P(yard.x + gate.x + gate.w / 2, yard.y + gate.y); g.fillStyle = '#fff'; g.font = 'bold 12px sans-serif'; g.fillText('gate (open, walk through)', a - 70, b + 18); }
</script>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 640 } });
await p.setContent(html); await p.locator('canvas').screenshot({ path: out }); await b.close();
console.log('wrote', out);
