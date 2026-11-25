// Draws the G1 architecture contract sheet from src/data/archetypes.json: per frozen archetype, the front layer and the
// roof layer boxes in ZsRoom's 3/4 projection (depth × 0.7), pivots, entrance, porch and Zila (165 cm) for scale.
// Usage: node scripts/contract-sheet.mjs docs/production/architecture-contract-g1.png
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
const out = process.argv[2] ?? 'docs/production/architecture-contract-g1.png';
const A = JSON.parse(readFileSync('src/data/archetypes.json', 'utf8')).archetypes;
const ids = ['house_small', 'house_large', 'ruko', 'warkop_open'];
const data = ids.map((id) => ({ id, c: A[id].contract }));
const html = `<canvas id=c width=2400 height=900></canvas><script>
const data = ${JSON.stringify(data)};
const g = document.getElementById('c').getContext('2d'), K = 0.7, s = 0.62;
g.fillStyle = '#F7EFE4'; g.fillRect(0, 0, 2400, 900);
g.fillStyle = '#2b2024'; g.font = 'bold 30px sans-serif'; g.fillText('ZsRoom G1 architecture contract — frozen 2026-11-25 (front layer + roof layer, 3/4 projection: depth × 0.7)', 40, 50);
g.font = '17px sans-serif'; g.fillText('Blue = front layer (ground → eave, pivot ● = front-line centre). Orange = roof layer (whole roof as seen from above, pivot ◆ = front eave centre). Grey dashed = back edge of the footprint at ground level (collision = width × depth behind the front line). Zila 165 cm for scale.', 40, 80);
g.fillText('Both layers sort at the front line (roof +0.01). One roof source only: the approved roof art OR the engine TEMP roof. Final masters ≥ 2 px/cm (sizes below in px at 2 px/cm).', 40, 104);
let x0 = 60; const base = 640;
for (const { id, c } of data) {
  const W = c.widthCm * s, E = c.eaveCm * s, R = c.roof.projectedRiseCm * s, ov = c.roof.overhangSideCm * s, D = c.depthCm * K * s, cx = x0 + W / 2 + ov;
  // footprint behind the front line, projected
  g.setLineDash([8, 6]); g.strokeStyle = '#8a8a8a'; g.lineWidth = 2; g.strokeRect(cx - W / 2, base - D, W, D); g.setLineDash([]);
  // roof layer box
  g.fillStyle = 'rgba(231,111,81,0.28)'; g.fillRect(cx - W / 2 - ov, base - E - R, W + 2 * ov, R + 15 * s); g.strokeStyle = '#c45a3c'; g.strokeRect(cx - W / 2 - ov, base - E - R, W + 2 * ov, R + 15 * s);
  // ridge line (gable/hip)
  const ridgeRise = ((c.depthCm / 2) * K + (c.ridgeCm - c.eaveCm)) * s;
  if (c.roof.style === 'gable' || c.roof.style === 'hip') { g.strokeStyle = '#7a2f1f'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - W / 2 + (c.roof.style === 'hip' ? W * 0.18 : 0), base - E - ridgeRise); g.lineTo(cx + W / 2 - (c.roof.style === 'hip' ? W * 0.18 : 0), base - E - ridgeRise); g.stroke(); g.lineWidth = 2; }
  // front layer box
  g.fillStyle = 'rgba(61,133,198,0.25)'; g.fillRect(cx - W / 2, base - E, W, E); g.strokeStyle = '#2e6aa0'; g.strokeRect(cx - W / 2, base - E, W, E);
  // entrance
  const e = c.entrance, ex = cx + e.dx * s - (e.clearWidthCm * s) / 2;
  g.fillStyle = 'rgba(122,78,52,0.75)'; g.fillRect(ex, base - e.clearHeightCm * s, e.clearWidthCm * s, e.clearHeightCm * s);
  // porch
  if (c.porch) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(cx + c.porch.dxFrom * s, base - E, (c.porch.dxTo - c.porch.dxFrom) * s, E); for (const p of c.porch.posts) { g.fillStyle = '#555'; g.fillRect(cx + p * s - 3, base - E, 6, E); } }
  // pivots
  g.fillStyle = '#2e6aa0'; g.beginPath(); g.arc(cx, base, 7, 0, 7); g.fill();
  g.fillStyle = '#c45a3c'; g.save(); g.translate(cx, base - E); g.rotate(Math.PI / 4); g.fillRect(-6, -6, 12, 12); g.restore();
  // Zila
  const zx = cx - W / 2 - ov - 26; g.fillStyle = '#d87093'; g.fillRect(zx, base - 165 * s, 14, 165 * s); g.beginPath(); g.arc(zx + 7, base - 165 * s - 6, 7, 0, 7); g.fill();
  // ground
  g.strokeStyle = '#2b2024'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0 - 30, base); g.lineTo(x0 + W + 2 * ov + 30, base); g.stroke();
  // labels
  g.fillStyle = '#2b2024'; g.font = 'bold 22px sans-serif'; g.fillText(id, x0, base + 40);
  g.font = '15px sans-serif';
  const L = [
    \`\${c.widthCm} × \${c.depthCm} cm footprint · eave \${c.eaveCm} · ridge \${c.ridgeCm} · \${c.roof.style}\`,
    \`entrance dx \${e.dx}: \${e.clearWidthCm} × \${e.clearHeightCm} cm (\${e.kind})\`,
    \`front layer px@2: \${(c.widthCm + 16) * 2} × \${(c.eaveCm + 24) * 2}, pivot (\${c.widthCm + 16}, \${(c.eaveCm + 12) * 2})\`,
    \`roof layer px@2: \${(c.widthCm + 2 * c.roof.overhangSideCm + 16) * 2} × \${(c.roof.projectedRiseCm + 39) * 2}, pivot (\${c.widthCm + 2 * c.roof.overhangSideCm + 16}, \${(c.roof.projectedRiseCm + 12) * 2})\`,
    \`projected roof rise \${c.roof.projectedRiseCm} (≥ depth×0.7 = \${Math.round(c.depthCm * 0.7)})\`,
  ];
  L.forEach((t, i) => g.fillText(t, x0, base + 66 + i * 22));
  x0 += W + 2 * ov + 150;
}
</script>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 2400, height: 900 } });
await p.setContent(html); await p.locator('canvas').screenshot({ path: out }); await b.close(); console.log('wrote', out);
