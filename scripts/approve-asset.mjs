#!/usr/bin/env node
// Promotes a validated submission to approved artwork. Run ONLY after the Creative Director has approved it.
//   node scripts/approve-asset.mjs <assetId> <version> --approved-by "<name>" --review <docs/reviews/...md> --creative-director-approved
//        [--geometry-exception '<json>']   record a CD-accepted deviation from the Art Bible §11 tolerances
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { loadSpecs, readJson, ROOT, sha256File } from './lib.mjs';
import { validateSubmission } from './validate-submission.mjs';

const ALPHA_SNAP = 250;
const [, , assetId, version, ...rest] = process.argv;
const val = (n) => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : undefined; };
const approvedBy = val('--approved-by');
const review = val('--review');
let geometryException;
if (rest.includes('--geometry-exception')) {
  try { geometryException = JSON.parse(val('--geometry-exception')); } catch (e) { console.error(`--geometry-exception must be JSON: ${e.message}`); process.exit(2); }
  if (!geometryException.decision) { console.error('--geometry-exception needs a "decision" field stating what the Creative Director accepted'); process.exit(2); }
}
if (!assetId || !version || !approvedBy || !review || !rest.includes('--creative-director-approved')) {
  console.error('usage: approve-asset.mjs <assetId> <version> --approved-by "<name>" --review <review.md> --creative-director-approved');
  console.error('Passing technical validation is NOT approval. The Creative Director must approve the artwork first.');
  process.exit(2);
}
if (!existsSync(join(ROOT, review))) { console.error(`review document ${review} not found`); process.exit(2); }
const specs = loadSpecs();
const entry = specs.get(assetId);
if (!entry) { console.error(`unknown asset ${assetId}`); process.exit(2); }
const dir = join(ROOT, 'art', 'submissions', assetId, version);
const result = await validateSubmission({ assetId, version, dir }, specs);
if (result.errors.length) { console.error('Submission fails technical validation:\n' + result.errors.map((e) => ` - ${e}`).join('\n')); process.exit(1); }

const manifestPath = 'public/assets/manifest.json';
const manifest = readJson(manifestPath);
const current = manifest.assets[assetId];
if (current?.status === 'approved' && current.version === version) { console.error(`${assetId} ${version} is already approved`); process.exit(1); }

const spec = entry.spec;
/** Generators often emit "opaque" pixels at alpha 250–254; snap those to 255 so floors never bleed through. */
async function solidified(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) if (data[i] >= ALPHA_SNAP) data[i] = 255;
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
}
const master = `art/approved/${assetId}/${assetId}_${version}.png`;
mkdirSync(join(ROOT, 'art', 'approved', assetId), { recursive: true });
copyFileSync(join(dir, `${assetId}_${version}.png`), join(ROOT, master));

const cat = `${spec.category}s`;
mkdirSync(join(ROOT, 'public', 'assets', cat), { recursive: true });
const runtime = {};
const variants = { hd: 2, sd: 1 };
for (const [name, density] of Object.entries(variants)) {
  const f = `assets/${cat}/${assetId}_${version}@${name}.webp`;
  const w = Math.round(spec.canvas.width * (density / spec.density));
  const h = Math.round(spec.canvas.height * (density / spec.density));
  await solidified(join(ROOT, master)).then((img) => img.resize(w, h, { kernel: 'lanczos3' }).webp({ lossless: true, effort: 6 }).toFile(join(ROOT, 'public', f)));
  runtime[name] = { path: f, sha256: sha256File(`public/${f}`), density };
}
manifest.assets[assetId] = {
  ...current, status: 'approved', version, spec: entry.path, runtime,
  approval: { approvedBy, approvedAt: new Date().toISOString(), review, master: { path: master, sha256: sha256File(master) }, ...(geometryException ? { geometryException } : {}) },
};
writeFileSync(join(ROOT, manifestPath), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Approved ${assetId} ${version}. Master: ${master}. Runtime: ${Object.values(runtime).map((r) => r.path).join(', ')}`);
console.log('Next: npm run qa  (manifest checksums, gameplay regression, gallery)');
