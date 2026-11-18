#!/usr/bin/env node
// Validates public/assets/manifest.json: every entry has a spec; approved entries have approval records,
// approved masters and runtime files on disk, and their SHA-256 checksums match. Flags orphan runtime files.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadSpecs, readJson, rel, ROOT, sha256File, walk } from './lib.mjs';

const STATUSES = new Set(['requested', 'greybox', 'submitted', 'approved', 'retired']);
const manifest = readJson('public/assets/manifest.json');
const specs = loadSpecs();
const errors = [];
const referenced = new Set(['public/assets/manifest.json']);

if (manifest.manifestVersion !== 1) errors.push(`unsupported manifestVersion ${manifest.manifestVersion}`);
for (const [id, e] of Object.entries(manifest.assets ?? {})) {
  if (!STATUSES.has(e.status)) errors.push(`${id}: invalid status ${e.status}`);
  const s = specs.get(id);
  if (!s) { errors.push(`${id}: no spec found`); continue; }
  if (e.spec !== s.path) errors.push(`${id}: spec path ${e.spec} ≠ ${s.path}`);
  if (e.request && !existsSync(join(ROOT, e.request))) errors.push(`${id}: art request ${e.request} missing`);
  if (e.status !== 'approved') { if (e.runtime) errors.push(`${id}: runtime files listed but status is ${e.status}`); continue; }
  const ap = e.approval;
  if (!ap?.approvedBy || !ap?.approvedAt || !ap?.master?.path || !ap?.master?.sha256) { errors.push(`${id}: approved entry lacks a complete approval record`); continue; }
  if (!existsSync(join(ROOT, ap.master.path))) errors.push(`${id}: approved master ${ap.master.path} missing`);
  else if (sha256File(ap.master.path) !== ap.master.sha256) errors.push(`${id}: CHECKSUM MISMATCH on approved master ${ap.master.path}`);
  for (const [variant, f] of Object.entries(e.runtime ?? {})) {
    const p = `public/${f.path}`;
    referenced.add(p);
    if (!existsSync(join(ROOT, p))) errors.push(`${id}/${variant}: runtime file ${p} missing`);
    else if (sha256File(p) !== f.sha256) errors.push(`${id}/${variant}: CHECKSUM MISMATCH on ${p}`);
  }
}
for (const id of specs.keys()) if (!(id in (manifest.assets ?? {}))) errors.push(`${id}: spec exists but asset is not in the manifest`);
for (const f of walk(join(ROOT, 'public', 'assets')).map(rel)) if (!referenced.has(f)) errors.push(`orphan runtime file not referenced by the manifest: ${f}`);

if (errors.length) { console.error('Manifest validation FAILED:\n' + errors.map((e) => ` - ${e}`).join('\n')); process.exit(1); }
console.log(`Manifest OK — ${Object.keys(manifest.assets).length} assets, ${referenced.size - 1} runtime files checksum-verified.`);
