#!/usr/bin/env node
// Fits a raw generated image onto the exact spec canvas: optional background keying, trim, scale,
// and pivot alignment. Free/local only (sharp). Writes an RGBA PNG; does NOT invent or repaint art.
//
//   node scripts/fit-to-spec.mjs <raw.png> <assetId> <out.png> [--width <px>] [--key-background] [--tolerance 28]
//
// --width           opaque content width in canvas px (default: footprint width + full side overhang)
// --height          opaque content height in canvas px instead (when the painted proportions are wider than the
//                   spec, width-fitting shrinks the object; fitting the height keeps its true scale)
// --despeckle <px>  remove isolated alpha islands smaller than <px> pixels (stray generator flecks). Cleanup only.
// --key-background  remove a flat, edge-connected background (for generators that cannot export alpha).
//                   Always inspect the result: keying can eat light edges (white pillows!). Prefer native alpha.
import sharp from 'sharp';
import { loadSpecs } from './lib.mjs';

const [, , input, assetId, out, ...rest] = process.argv;
if (!input || !assetId || !out) { console.error('usage: fit-to-spec.mjs <raw.png> <assetId> <out.png> [--width px] [--key-background] [--tolerance n]'); process.exit(2); }
const flag = (n) => rest.includes(n);
const val = (n) => { const i = rest.indexOf(n); return i >= 0 ? Number(rest[i + 1]) : undefined; };
const entry = loadSpecs().get(assetId);
if (!entry) { console.error(`unknown asset ${assetId}`); process.exit(2); }
const spec = entry.spec;

let { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;

if (flag('--key-background')) {
  const tol = val('--tolerance') ?? 28;
  const idx = (x, y) => (y * W + x) * 4;
  const c0 = idx(0, 0);
  const bg = [data[c0], data[c0 + 1], data[c0 + 2]];
  const near = (i) => Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]) <= tol * 3;
  const seen = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) stack.push([x, 0], [x, H - 1]);
  for (let y = 0; y < H; y++) stack.push([0, y], [W - 1, y]);
  let removed = 0;
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= W || y >= H || seen[y * W + x]) continue;
    seen[y * W + x] = 1;
    const i = idx(x, y);
    if (!near(i)) continue;
    data[i + 3] = 0; removed++;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  console.log(`keyed background rgb(${bg.join(',')}), removed ${removed} px (${((removed / (W * H)) * 100).toFixed(1)}%)`);
}

if (rest.includes('--despeckle')) {
  const minPx = val('--despeckle') || 40;
  const seen = new Uint8Array(W * H);
  let removedIslands = 0, removedPx = 0;
  for (let start = 0; start < W * H; start++) {
    if (seen[start] || data[start * 4 + 3] <= 8) continue;
    const comp = [start]; seen[start] = 1;
    for (let k = 0; k < comp.length; k++) {
      const i = comp[k], x = i % W, y = (i - x) / W;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, j = ny * W + nx;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[j] || data[j * 4 + 3] <= 8) continue;
        seen[j] = 1; comp.push(j);
      }
    }
    if (comp.length < minPx) { for (const i of comp) data[i * 4 + 3] = 0; removedIslands++; removedPx += comp.length; }
  }
  console.log(`despeckle: removed ${removedIslands} islands (${removedPx} px) smaller than ${minPx} px`);
}

// Snap near-opaque alpha (250–254) to opaque and clear near-invisible haze (≤8), both common in generator output.
for (let i = 3; i < data.length; i += 4) { if (data[i] >= 250) data[i] = 255; else if (data[i] <= 8) data[i] = 0; }  // also clear invisible haze
const keyed = sharp(data, { raw: { width: W, height: H, channels: 4 } }).png();
const trimmed = await sharp(await keyed.toBuffer()).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 }).toBuffer({ resolveWithObject: true });
const tw = trimmed.info.width, th = trimmed.info.height;
const targetW = val('--width') ?? Math.round((spec.footprint.widthCm + 2 * (spec.maxSideOverhangCm ?? 0)) * spec.density);
let scale = val('--height') ? val('--height') / th : targetW / tw;
const maxH = spec.baseLine.y - spec.artBounds.y;
if (th * scale > maxH) { console.warn(`height-limited: content would be ${Math.round(th * scale)}px tall, max ${maxH}px — check proportions against the template`); scale = maxH / th; }
const nw = Math.round(tw * scale), nh = Math.round(th * scale);
const resized = await sharp(trimmed.data).resize(nw, nh, { kernel: 'lanczos3' }).png().toBuffer();
const left = Math.round(spec.pivot.x - nw / 2);
const top = Math.round(spec.baseLine.y - nh + 1);
await sharp({ create: { width: spec.canvas.width, height: spec.canvas.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: resized, left, top }])
  .png({ compressionLevel: 9 })
  .withMetadata({ icc: 'srgb' })
  .toFile(out);
console.log(`wrote ${out}: content ${nw}x${nh}px at (${left},${top}) on ${spec.canvas.width}x${spec.canvas.height}; scale ${scale.toFixed(3)}`);
console.log('Next: node scripts/validate-art.mjs — then LOOK at the result in the gallery (npm run gallery).');
