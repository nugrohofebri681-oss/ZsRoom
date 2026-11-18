#!/usr/bin/env node
// Generates perspective/scale guide templates (SVG + PNG) from the specs, so artists and Codex can use
// them as layout references or image-conditioning inputs. Guides only — never shipped as art.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { loadSpecs, PROJECTION, ROOT } from './lib.mjs';

const K = PROJECTION.depthScale;
const OUT = join(ROOT, 'art-bible', 'perspective');
mkdirSync(OUT, { recursive: true });
const specs = loadSpecs();

const svg = (w, h, body, bg = 'none') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="Helvetica, Arial, sans-serif">${bg !== 'none' ? `<rect width="100%" height="100%" fill="${bg}"/>` : ''}${body}</svg>`;

async function emit(name, content) {
  writeFileSync(join(OUT, `${name}.svg`), content);
  await sharp(Buffer.from(content)).png().toFile(join(OUT, `${name}.png`));
  console.log(`wrote art-bible/perspective/${name}.{svg,png}`);
}

/** Box guide for a prop: footprint on floor, a horizontal plane at height z, and verticals. */
function boxGuide(spec, z, colour, label) {
  const d = spec.density, px = spec.pivot.x, py = spec.pivot.y;
  const hw = (spec.footprint.widthCm / 2) * d;
  const front = py, back = py - spec.footprint.depthCm * K * d, zz = z * d;
  return `<g fill="none" stroke="${colour}" stroke-width="1.5">
    <rect x="${px - hw}" y="${back - zz}" width="${hw * 2}" height="${front - back}" stroke-dasharray="${z ? '6 4' : '0'}"/>
    ${z ? `<line x1="${px - hw}" y1="${front - zz}" x2="${px - hw}" y2="${front}"/><line x1="${px + hw}" y1="${front - zz}" x2="${px + hw}" y2="${front}"/>` : ''}
  </g><text x="${px + hw + 4}" y="${front - zz - 3}" font-size="10" fill="${colour}">${label}</text>`;
}

async function propTemplate(spec) {
  const { width: W, height: H } = spec.canvas;
  const d = spec.density, px = spec.pivot.x, py = spec.pivot.y;
  const hw = (spec.footprint.widthCm / 2) * d;
  const back = py - spec.footprint.depthCm * K * d;
  const parts = [];
  const b = spec.artBounds;
  if (b) parts.push(`<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="none" stroke="#7d8cff" stroke-dasharray="3 3"/><text x="${b.x + 3}" y="${b.y + 11}" font-size="9" fill="#7d8cff">artBounds</text>`);
  parts.push(`<rect x="${px - hw}" y="${back}" width="${hw * 2}" height="${py - back}" fill="#ff3d7f22" stroke="#ff3d7f" stroke-width="2"/>`);
  parts.push(`<text x="${px - hw + 4}" y="${py - 22}" font-size="10" fill="#ff3d7f">FLOOR FOOTPRINT ${spec.footprint.widthCm}×${spec.footprint.depthCm}cm</text>`);
  const H_ = spec.heightsCm ?? {};
  const main = H_.mattressTop ?? H_.top ?? Math.max(0, ...Object.values(H_));
  const slab = H_.headboardTop ?? H_.back;
  const mz = main * d;
  // main body: top plane + front face
  parts.push(`<rect x="${px - hw}" y="${back - mz}" width="${hw * 2}" height="${py - back}" fill="#1a8ad018" stroke="#1a8ad0" stroke-width="1.5" stroke-dasharray="6 4"/>`);
  parts.push(`<rect x="${px - hw}" y="${py - mz}" width="${hw * 2}" height="${mz}" fill="#1a8ad030" stroke="#1a8ad0" stroke-width="1.5"/>`);
  parts.push(`<text x="${px}" y="${back - mz + 30}" font-size="10" fill="#1a8ad0" text-anchor="middle">TOP SURFACE @ ${main}cm</text><text x="${px}" y="${py - mz / 2 + 4}" font-size="10" fill="#1a8ad0" text-anchor="middle">FRONT FACE ${main}cm</text>`);
  if (slab && slab > main) {
    const sd = 8 * K * d;
    parts.push(`<rect x="${px - hw}" y="${back - slab * d}" width="${hw * 2}" height="${(slab - main) * d + sd}" fill="#8a5a3c30" stroke="#8a5a3c" stroke-width="1.5"/>`);
    parts.push(`<text x="${px}" y="${back - slab * d + 14}" font-size="10" fill="#8a5a3c" text-anchor="middle">BACK SLAB (headboard) ${slab}cm</text>`);
  }
  // remaining heights as ticks on the right edge of the front face
  for (const [k, z] of Object.entries(H_)) {
    const y = (k === 'headboardTop' || k === 'back' || k === 'pillowTop' ? back : py) - z * d;
    parts.push(`<line x1="${px + hw - 10}" x2="${px + hw + 4}" y1="${y}" y2="${y}" stroke="#555"/><text x="${px + hw + 6}" y="${y + 3}" font-size="7.5" fill="#555">${k} ${z}</text>`);
  }
  parts.push(`<text x="${px}" y="${py - 6}" font-size="9" fill="#ff3d7f" text-anchor="middle">front floor edge</text><text x="${px}" y="${back + 12}" font-size="9" fill="#ff3d7f" text-anchor="middle">back floor edge (wall side)</text>`);
  parts.push(`<line x1="${px - 10}" y1="${py}" x2="${px + 10}" y2="${py}" stroke="#000" stroke-width="2"/><line x1="${px}" y1="${py - 10}" x2="${px}" y2="${py + 10}" stroke="#000" stroke-width="2"/><text x="${px + 12}" y="${py + 14}" font-size="10" fill="#000">PIVOT (${px},${py})</text>`);
  parts.push(`<line x1="0" y1="${py}" x2="${W}" y2="${py}" stroke="#000" stroke-opacity="0.35" stroke-dasharray="2 4"/>`);
  parts.push(`<text x="6" y="${H - 6}" font-size="9" fill="#555">${spec.id} · ${W}×${H}px · ${d}px/cm · depth×${K} · GUIDE ONLY</text>`);
  // Small canvases: shrink label text proportionally so guides stay legible and uncluttered.
  const f = Math.min(1, W / 300);
  const body = f < 1 ? parts.join('').replace(/font-size="([\d.]+)"/g, (_, n) => `font-size="${(Number(n) * Math.max(f, 0.55)).toFixed(1)}"`) : parts.join('');
  await emit(`${spec.id}_template`, svg(W, H, body));
}

/** Round props (lamps, vases, pots): profile sections drawn as foreshortened ellipses + silhouettes. */
function profileGuide(spec, ox = 0, oy = 0) {
  const d = spec.density, px = spec.pivot.x + ox, py = spec.pivot.y + oy, k = K;
  const parts = [];
  const ell = (cy, dia, stroke, dash = '') => `<ellipse cx="${px}" cy="${cy}" rx="${(dia / 2) * d}" ry="${(dia / 2) * d * k}" fill="none" stroke="${stroke}" stroke-width="1.5" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
  const colours = { base: '#8a5a3c', body: '#c0607e', shade: '#1a8ad0' };
  for (const sec of spec.profile) {
    const c = colours[sec.part] ?? '#555';
    const yb = py - sec.fromCm * d, yt = py - sec.toCm * d;
    const wb = (sec.diameterCm / 2) * d, wt = ((sec.topDiameterCm ?? sec.diameterCm) / 2) * d;
    const wm = ((sec.bulgeDiameterCm ?? sec.diameterCm) / 2) * d;
    if (sec.bulgeDiameterCm) parts.push(`<path d="M${px - wb} ${yb} Q${px - wm * 1.25} ${(yb + yt) / 2} ${px - wt} ${yt} L${px + wt} ${yt} Q${px + wm * 1.25} ${(yb + yt) / 2} ${px + wb} ${yb} Z" fill="${c}22" stroke="${c}" stroke-width="1.5"/>`);
    else parts.push(`<path d="M${px - wb} ${yb} L${px - wt} ${yt} L${px + wt} ${yt} L${px + wb} ${yb} Z" fill="${c}22" stroke="${c}" stroke-width="1.5"/>`);
    parts.push(ell(yt, sec.topDiameterCm ?? sec.diameterCm, c, '4 3'));
    parts.push(ell(yb, sec.diameterCm, c));
    parts.push(`<text x="${px + Math.max(wb, wt) + 3}" y="${(yb + yt) / 2 + 3}" font-size="7" fill="${c}">${sec.part} ${sec.fromCm}–${sec.toCm}cm Ø${sec.diameterCm}${sec.topDiameterCm ? '→' + sec.topDiameterCm : ''}</text>`);
  }
  parts.push(`<path d="M${px - 6} ${py}h12M${px} ${py - 6}v12" stroke="#000" stroke-width="1.5"/>`);
  if (spec.light) {
    const ey = py - (spec.light.emitter.z) * d;
    parts.push(`<circle cx="${px}" cy="${ey}" r="3" fill="none" stroke="#d08a1a" stroke-width="1.5"/><text x="${px + 5}" y="${ey - 4}" font-size="7" fill="#d08a1a">engine light emitter (do NOT paint glow)</text>`);
  }
  return parts.join('');
}

async function roundTemplate(spec) {
  const { width: W, height: H } = spec.canvas;
  const b = spec.artBounds;
  const body = `${b ? `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="none" stroke="#7d8cff" stroke-dasharray="3 3"/>` : ''}${profileGuide(spec)}
    <line x1="0" x2="${W}" y1="${spec.baseLine.y}" y2="${spec.baseLine.y}" stroke="#ff3d7f" stroke-dasharray="2 3"/>
    <text x="4" y="${H - 4}" font-size="6.5" fill="#555">${spec.id} ${W}×${H} · pivot ${spec.pivot.x},${spec.pivot.y} = base centre</text>`;
  await emit(`${spec.id}_template`, svg(W, H, body));
}

/** Composite guide on the APPROVED host art at the measured anchor: shows Codex the exact attachment point. */
async function onHostTemplate(spec) {
  const hostEntry = specs.get(spec.placement.hostAsset);
  const host = hostEntry?.spec;
  const surf = host?.surfaces?.find((x) => x.id === spec.placement.surface);
  const anchor = surf?.anchors.find((a) => a.id === spec.placement.anchor);
  const manifest = JSON.parse(await (await import('node:fs/promises')).readFile(join(ROOT, 'public/assets/manifest.json'), 'utf8'));
  const masterPath = manifest.assets[host?.id]?.approval?.master?.path;
  if (!host || !anchor || !masterPath) { console.warn(`skip on-host template for ${spec.id}: host not approved or anchor missing`); return; }
  const head = 110; // headroom above the host canvas for the lamp
  const W = host.canvas.width, H = host.canvas.height + head;
  const ax = anchor.canvas.x, ay = anchor.canvas.y + head;
  const hostPng = (await sharp(join(ROOT, masterPath)).png().toBuffer()).toString('base64');
  const p = surf.painted;
  const body = `<rect width="${W}" height="${H}" fill="#fbf6f2"/>
    <image href="data:image/png;base64,${hostPng}" x="0" y="${head}" width="${host.canvas.width}" height="${host.canvas.height}"/>
    <rect x="${p.leftX}" y="${p.backEdgeY + head}" width="${p.rightX - p.leftX}" height="${p.frontEdgeY - p.backEdgeY}" fill="none" stroke="#2fa36b" stroke-width="1" stroke-dasharray="3 2"/>
    <text x="${p.leftX + 2}" y="${p.frontEdgeY + head - 3}" font-size="6.5" fill="#2fa36b">measured painted top plane</text>
    ${profileGuide(spec, ax - spec.pivot.x, ay - spec.pivot.y)}
    <text x="4" y="${H - 4}" font-size="6.5" fill="#555">${spec.id} on approved ${host.id} — anchor "${anchor.id}" at host canvas (${anchor.canvas.x},${anchor.canvas.y}) · GUIDE ONLY</text>`;
  const svgText = svg(W, H, body);
  writeFileSync(join(OUT, `${spec.id}_on_host_template.svg`), svgText);
  await sharp(Buffer.from(svgText)).png().toFile(join(OUT, `${spec.id}_on_host_template.png`));
  console.log(`wrote art-bible/perspective/${spec.id}_on_host_template.{svg,png}`);
}

async function scaleLineup() {
  const d = 1; // 1 px per cm for an overview sheet
  const W = 720, H = 370, floor = 320;
  const parts = [`<rect width="${W}" height="${H}" fill="#fbf6f2"/>`];
  for (let cm = 0; cm <= 280; cm += 20) parts.push(`<line x1="0" x2="${W}" y1="${floor - cm * d}" y2="${floor - cm * d}" stroke="#000" stroke-opacity="${cm % 100 ? 0.06 : 0.2}"/><text x="4" y="${floor - cm * d - 2}" font-size="8" fill="#888">${cm}</text>`);
  const person = (x, h, name, headsTall, colour) => {
    const head = h / headsTall;
    return `<g><rect x="${x - h * 0.13}" y="${floor - h + head}" width="${h * 0.26}" height="${h - head}" rx="${h * 0.1}" fill="${colour}"/><circle cx="${x}" cy="${floor - h + head / 2}" r="${head / 2}" fill="${colour}"/>
      <text x="${x}" y="${floor + 13}" font-size="10" text-anchor="middle">${name} ${h}cm</text><text x="${x}" y="${floor + 25}" font-size="9" fill="#666" text-anchor="middle">${headsTall} heads (draft)</text></g>`;
  };
  const zila = specs.get('char_zila').spec, febri = specs.get('char_febri').spec, bed = specs.get('prop_bed_zila').spec;
  parts.push(person(120, zila.heightCm, 'Zila', zila.headsTall, '#e8a0b4'));
  parts.push(person(210, febri.heightCm, 'Febri', febri.headsTall, '#9db4d6'));
  parts.push(`<rect x="270" y="${floor - 210}" width="90" height="210" fill="none" stroke="#5b3a29" stroke-width="2"/><text x="315" y="${floor + 14}" font-size="10" text-anchor="middle">Door 90×210</text>`);
  parts.push(`<rect x="400" y="${floor - bed.heightsCm.mattressTop}" width="${bed.footprint.depthCm}" height="${bed.heightsCm.mattressTop}" fill="#e8a0b4" opacity="0.6"/><rect x="400" y="${floor - bed.heightsCm.headboardTop}" width="8" height="${bed.heightsCm.headboardTop}" fill="#8a5a3c"/><text x="500" y="${floor + 14}" font-size="10" text-anchor="middle">Bed (side view) 200cm, mattress ${bed.heightsCm.mattressTop}, headboard ${bed.heightsCm.headboardTop}</text>`);
  parts.push(`<line x1="0" x2="${W}" y1="${floor - 270}" y2="${floor - 270}" stroke="#c0607e" stroke-dasharray="6 4"/><text x="${W - 4}" y="${floor - 273}" font-size="9" fill="#c0607e" text-anchor="end">ceiling / wall 270cm</text>`);
  parts.push(`<line x1="0" x2="${W}" y1="${floor}" y2="${floor}" stroke="#000"/><text x="${W - 4}" y="${H - 6}" font-size="9" fill="#555" text-anchor="end">ZsRoom true-scale lineup (side elevation, 1px = 1cm). Silhouettes are proportion guides, not designs.</text>`);
  await emit('scale_lineup', svg(W, H, parts.join('')));
}

async function projectionCube() {
  const d = 2, s = 100 * d, W = 520, H = 420, x0 = 60, fy = 360;
  const back = fy - s * K;
  const body = `<rect width="${W}" height="${H}" fill="#fbf6f2"/>
    <rect x="${x0}" y="${back - s}" width="${s}" height="${fy - back}" fill="#e8c9cf" stroke="#3a2530" stroke-width="2"/>
    <rect x="${x0}" y="${fy - s}" width="${s}" height="${s}" fill="#c0607e" stroke="#3a2530" stroke-width="2"/>
    <text x="${x0 + s / 2}" y="${back - s / 2 + 4 + (fy - back - s) / 2}" text-anchor="middle" font-size="12">TOP 100×100cm → ${s}×${s * K}px</text>
    <text x="${x0 + s / 2}" y="${fy - s / 2}" text-anchor="middle" font-size="12" fill="#fff">FRONT 100×100cm → ${s}×${s}px</text>
    <text x="${x0 + s + 20}" y="${back - s + 14}" font-size="12">ZsRoom top-down ¾ projection</text>
    <text x="${x0 + s + 20}" y="${back - s + 34}" font-size="11">• Orthographic oblique, NO vanishing points</text>
    <text x="${x0 + s + 20}" y="${back - s + 52}" font-size="11">• Verticals stay vertical; front faces square-on</text>
    <text x="${x0 + s + 20}" y="${back - s + 70}" font-size="11">• Floor depth drawn at ×${K}</text>
    <text x="${x0 + s + 20}" y="${back - s + 88}" font-size="11">• Heights drawn at ×${PROJECTION.heightScale}</text>
    <text x="${x0 + s + 20}" y="${back - s + 106}" font-size="11">• Side faces are NOT visible</text>
    <text x="${x0 + s + 20}" y="${back - s + 124}" font-size="11">• Master density ${PROJECTION.masterDensityPxPerCm}px per cm</text>
    <text x="${x0 + s + 20}" y="${back - s + 142}" font-size="11">• Key light: upper-left</text>`;
  await emit('projection_cube', svg(W, H, body));
}

for (const { spec } of specs.values()) {
  if (spec.category !== 'prop' || spec.status === 'greybox-only') continue;
  if (spec.profile) await roundTemplate(spec); else await propTemplate(spec);
  if (spec.placement?.type === 'surface') await onHostTemplate(spec);
}
await scaleLineup();
await projectionCube();
