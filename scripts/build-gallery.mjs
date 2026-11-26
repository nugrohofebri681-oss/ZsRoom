#!/usr/bin/env node
// Builds a static review gallery at review-gallery/index.html (uploaded as a CI artifact on art PRs).
// Shows each submission on checkerboard/light/dark backgrounds with spec overlays, true-scale character
// silhouettes, technical check results, plus perspective templates and latest gameplay screenshots.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { listSubmissions, loadSpecs, productionSpec, PROJECTION, readJson, ROOT, walk, rel } from './lib.mjs';
import { validateSubmission } from './validate-submission.mjs';

const OUT = join(ROOT, 'review-gallery');
mkdirSync(join(OUT, 'img'), { recursive: true });
const specs = loadSpecs();
const manifest = readJson('public/assets/manifest.json');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
let n = 0;
const copy = (p) => { const name = `${n++}-${basename(p)}`; copyFileSync(p, join(OUT, 'img', name)); return `img/${name}`; };

function overlay(spec) {
  const { width: W, height: H } = spec.canvas;
  const d = spec.density, K = PROJECTION.depthScale, px = spec.pivot.x, py = spec.pivot.y;
  const hw = ((spec.footprint?.widthCm ?? 0) / 2) * d, back = py - (spec.footprint?.depthCm ?? 0) * K * d;
  const b = spec.artBounds;
  return `<svg class="ov" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    ${b ? `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="none" stroke="#7d8cff" stroke-dasharray="4 3"/>` : ''}
    ${spec.footprint && !spec.world ? `<rect x="${px - hw}" y="${back}" width="${hw * 2}" height="${py - back}" fill="#ff3d7f1a" stroke="#ff3d7f" stroke-width="1.5"/>` : ''}
    ${spec.world ? `<rect x="${spec.world.envelope.x}" y="${spec.world.envelope.y}" width="${spec.world.envelope.width}" height="${spec.world.envelope.height}" fill="none" stroke="#00a37a" stroke-width="2"/>` : ''}
    ${spec.world?.coverage ? `<rect x="${spec.world.coverage.rect.x}" y="${spec.world.coverage.rect.y}" width="${spec.world.coverage.rect.width}" height="${spec.world.coverage.rect.height}" fill="#00a37a14" stroke="#00a37a" stroke-dasharray="6 4"/>` : ''}
    ${spec.baseLine ? `<line x1="0" x2="${W}" y1="${spec.baseLine.y}" y2="${spec.baseLine.y}" stroke="#ff3d7f" stroke-dasharray="2 3"/>` : ''}
    <path d="M${px - 9} ${py}h18M${px} ${py - 9}v18" stroke="#000" stroke-width="2"/></svg>`;
}

function silhouettes(spec) {
  const d = spec.density, floor = spec.pivot.y;
  const fig = (h, heads, col, name) => {
    const hp = h * d, head = hp / heads;
    return `<svg width="${hp * 0.32}" height="${spec.canvas.height}" viewBox="0 0 ${hp * 0.32} ${spec.canvas.height}"><g fill="${col}" opacity=".85"><rect x="${hp * 0.03}" y="${floor - hp + head}" width="${hp * 0.26}" height="${hp - head}" rx="${hp * 0.1}"/><circle cx="${hp * 0.16}" cy="${floor - hp + head / 2}" r="${head / 2}"/></g><text x="${hp * 0.16}" y="${floor + 16}" font-size="11" text-anchor="middle">${name} ${h}cm</text></svg>`;
  };
  const z = specs.get('char_zila').spec, f = specs.get('char_febri').spec;
  return fig(z.heightCm, z.headsTall, '#e8a0b4', 'Zila') + fig(f.heightCm, f.headsTall, '#9db4d6', 'Febri');
}

const cards = [];
for (const s of listSubmissions()) {
  const r = await validateSubmission(s, specs);
  const entry = specs.get(s.assetId);
  const spec = entry ? productionSpec(entry) ?? undefined : undefined;   // world layers: HD production frame
  const master = join(s.dir, `${s.assetId}_${s.version}.png`);
  const img = existsSync(master) ? copy(master) : null;
  const prompt = existsSync(join(s.dir, 'prompt.md')) ? readFileSync(join(s.dir, 'prompt.md'), 'utf8') : '(no prompt.md)';
  const tech = r.errors.length ? '<b class="bad">TECHNICAL FAIL</b>' : '<b class="good">TECHNICAL PASS</b>';
  const approved = manifest.assets[s.assetId]?.status === 'approved' && manifest.assets[s.assetId]?.version === s.version;
  cards.push(`<section class="card"><h2>${esc(s.assetId)} <small>${esc(s.version)}</small></h2>
    <p>${tech} · VISUAL: <b class="${approved ? 'good' : 'warn'}">${approved ? 'APPROVED' : 'PENDING CREATIVE DIRECTOR'}</b> · PRODUCTION READY: <b class="${approved && !r.errors.length ? 'good' : 'warn'}">${approved && !r.errors.length ? 'YES' : 'NO'}</b></p>
    ${img && spec ? `<div class="row">
      <figure class="stage checker">${`<img src="${img}" width="${spec.canvas.width}" height="${spec.canvas.height}" alt="">`}${overlay(spec)}<figcaption>checker + spec overlay</figcaption></figure>
      <figure class="stage light"><img src="${img}" width="${spec.canvas.width}" height="${spec.canvas.height}" alt=""><figcaption>light floor</figcaption></figure>
      <figure class="stage dark"><img src="${img}" width="${spec.canvas.width}" height="${spec.canvas.height}" alt=""><figcaption>night floor</figcaption></figure>
      <figure class="stage light scale"><img src="${img}" width="${spec.canvas.width}" height="${spec.canvas.height}" alt="">${silhouettes(spec)}<figcaption>true scale vs characters</figcaption></figure>
      ${(spec.styleReferences ?? []).filter((r) => existsSync(join(ROOT, r))).map((r) => { const rs = [...specs.values()].find((e) => r.includes(`/${e.spec.id}/`))?.spec; const padA = spec.canvas.height - spec.pivot.y, padB = rs ? rs.canvas.height - rs.pivot.y : padA, pad = Math.max(padA, padB); return `<figure class="stage light pair"><img style="margin-bottom:${pad - padA}px" src="${img}" width="${spec.canvas.width}" height="${spec.canvas.height}" alt=""><img style="margin-bottom:${pad - padB}px" src="${copy(join(ROOT, r))}" width="${rs?.canvas.width ?? ''}" height="${rs?.canvas.height ?? ''}" alt=""><figcaption>side by side with style reference ${esc(r.split('/').pop())} (same scale)</figcaption></figure>`; }).join('')}
      <figure class="stage dark"><img class="small" src="${img}" width="${spec.canvas.width / 2}" height="${spec.canvas.height / 2}" alt=""><figcaption>SD runtime size (1px/cm)</figcaption></figure>
    </div>` : '<p class="bad">master image missing</p>'}
    <details open><summary>Technical checks</summary><ul>${r.checks.map((c) => `<li class="${c.pass ? 'good' : 'bad'}">${c.pass ? '✔' : '✘'} ${esc(c.name)} <small>${esc(c.detail)}</small></li>`).join('')}${r.warnings.map((w) => `<li class="warn">⚠ ${esc(w)}</li>`).join('')}</ul></details>
    <details><summary>Generator, provenance &amp; prompt</summary><pre>${esc(JSON.stringify(r.meta?.generator ?? {}, null, 2))}\n${esc(r.meta?.provenance ?? '')}\n\n${esc(prompt)}</pre></details>
    <details open><summary>Visual review checklist (Creative Director / Claude)</summary><ol>
      <li>Reads as ZsRoom OG Enhanced: warm, cozy, premium HD illustration — not pixel art, not 3D render, not generic anime.</li>
      <li>Perspective matches the template: no vanishing points, verticals vertical, front face square-on, top foreshortened ×${PROJECTION.depthScale}.</li>
      <li>Scale: bed height and length plausible next to Zila (158cm) and Febri (170cm).</li>
      <li>Light from upper-left; colored line work; no pure-black outlines or shadows.</li>
      <li>No cast floor shadow baked in; only contact occlusion inside the footprint.</li>
      <li>Clean alpha edges on light AND dark floors (no white halos, no checkerboard baked in).</li>
      <li>Identity: pink bedding, warm wood, cream pillows, heart cushion — matches Zila's room.</li>
      <li>Still readable at SD size.</li></ol></details></section>`);
}

const templates = walk(join(ROOT, 'art-bible', 'perspective')).filter((f) => f.endsWith('.png')).map((f) => `<figure class="stage light"><img src="${copy(f)}" alt=""><figcaption>${esc(rel(f))}</figcaption></figure>`);
const shots = walk(join(ROOT, 'docs', 'reviews')).filter((f) => f.endsWith('.png')).sort().map((f) => `<figure class="shot"><img src="${copy(f)}" alt="" loading="lazy"><figcaption>${esc(rel(f))}</figcaption></figure>`);
const status = Object.entries(manifest.assets).map(([id, e]) => `<tr><td>${esc(id)}</td><td>${esc(e.status)}</td><td>${esc(e.version ?? '')}</td></tr>`).join('');

writeFileSync(join(OUT, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ZsRoom Review Gallery</title><style>
:root{--bg:#fbf6f2;--fg:#2b1d22;--card:#fff;--muted:#7a6670;--line:#ead9df}
@media (prefers-color-scheme:dark){:root{--bg:#1d1418;--fg:#f6e9ee;--card:#2a1e23;--muted:#b9a2ac;--line:#3d2c33}}
body{margin:0;padding:16px;background:var(--bg);color:var(--fg);font:14px/1.5 system-ui,sans-serif}
h1{margin:0 0 4px}.sub{color:var(--muted);margin:0 0 16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;margin:0 0 20px}
.row{display:flex;gap:12px;overflow-x:auto;padding-bottom:8px}
.stage{position:relative;margin:0;border-radius:8px;flex:none;padding:0 0 22px}
.stage img,.stage svg{display:block}.stage .ov{position:absolute;left:0;top:0;pointer-events:none}
.stage.scale{display:flex;align-items:flex-start}.stage.pair{display:flex;align-items:flex-end;gap:0}
figcaption{position:absolute;bottom:2px;left:6px;font-size:11px;color:var(--muted)}
.checker{background:repeating-conic-gradient(#ddd 0 25%,#fff 0 50%) 0 0/16px 16px}
.light{background:#c9a27e}.dark{background:#2a1c22}.light figcaption{color:#3a2530}.dark figcaption{color:#e8c9cf}
.good{color:#2f8f5b}.bad{color:#c0392b}.warn{color:#c07a00}
pre{white-space:pre-wrap;background:var(--bg);padding:8px;border-radius:6px;font-size:12px}
.shots{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}.shot{margin:0}.shot img{width:100%;border-radius:8px;border:1px solid var(--line)}
table{border-collapse:collapse}td{border-bottom:1px solid var(--line);padding:2px 12px 2px 0}
</style></head><body>
<h1>ZsRoom Review Gallery</h1><p class="sub">Generated ${new Date().toISOString()} · TECHNICAL PASS ≠ VISUAL PASS. Only the Creative Director grants visual approval.</p>
${cards.length ? cards.join('') : '<section class="card"><h2>No art submissions yet</h2><p>Waiting for Codex: see docs/art-requests/.</p></section>'}
<section class="card"><h2>Asset manifest</h2><table><tr><th align=left>asset</th><th align=left>status</th><th align=left>version</th></tr>${status}</table></section>
<section class="card"><h2>Perspective &amp; scale templates</h2><div class="row">${templates.join('')}</div></section>
<section class="card"><h2>Latest gameplay evidence</h2><div class="shots">${shots.join('') || '<p>Run <code>npm run test:e2e</code> to capture screenshots.</p>'}</div></section>
</body></html>`);
console.log(`Gallery: review-gallery/index.html (${cards.length} submission(s), ${shots.length} screenshot(s))`);
