// CONCEPT-ONLY validation route (character / location exploration boards).
//
// Concept boards live in art/concepts/<asset_id>/<v###>/ and are NEVER production assets:
//   - they are not checked against runtime sprite specs (canvas, alpha, pivot…) because they are not sprites;
//   - they can never be approved: scripts/approve-asset.mjs reads only art/submissions/ and refuses concept metadata;
//   - production submissions in art/submissions/ keep the full strict validator (validate-submission.mjs).
// What IS checked: identity, provenance, ownership (via lib.ownershipViolations), byte-exact integrity of the board
// and every raw source (SHA-256), that each image decodes, size limits, and privacy (no EXIF/GPS/XMP metadata).
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import sharp from 'sharp';
import { ASSET_ID_RE, ROOT, VERSION_RE } from './lib.mjs';
const hash = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

export const CONCEPT_ROOT = 'art/concepts';
const MAX_BYTES = 8_000_000, MAX_SIDE = 4096;
const ALLOWED = /\.(png|webp|json|md)$/i;

/** Every concept folder: { assetId, version, dir }. */
export function listConcepts() {
  const base = join(ROOT, CONCEPT_ROOT);
  if (!existsSync(base)) return [];
  const out = [];
  for (const assetId of readdirSync(base).sort()) {
    const ad = join(base, assetId);
    if (!statSync(ad).isDirectory()) continue;
    for (const version of readdirSync(ad).sort()) if (statSync(join(ad, version)).isDirectory()) out.push({ assetId, version, dir: join(ad, version) });
  }
  return out;
}

function listFiles(dir, prefix = '') {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listFiles(p, `${prefix}${name}/`)); else out.push(`${prefix}${name}`);
  }
  return out;
}

async function imageCheck(path) {
  const meta = await sharp(path).metadata();             // throws if the file does not decode
  const bytes = statSync(path).size;
  const privacy = [meta.exif && 'EXIF', meta.xmp && 'XMP', meta.iptc && 'IPTC'].filter(Boolean);
  return { meta, bytes, privacy };
}

/** `root` is the repository root (tests pass a temp root with the same art/concepts/<id>/<v###>/ layout). */
export async function validateConcept({ assetId, version, dir }, specs, root = ROOT) {
  const checks = [], errors = [], warnings = [];
  const ok = (name, pass, detail = '') => { checks.push({ name, pass, detail }); if (!pass) errors.push(`${name}${detail ? `: ${detail}` : ''}`); return pass; };
  const relDir = relative(root, dir).split(sep).join('/');
  ok('route: concept only (never a production asset)', relDir.startsWith(`${CONCEPT_ROOT}/`), relDir);
  ok('asset id format', ASSET_ID_RE.test(assetId), assetId);
  ok('version format (v###)', VERSION_RE.test(version), version);
  ok('a spec exists for this id (concept of a planned asset)', specs.has(assetId), assetId);
  const files = listFiles(dir);
  const bad = files.filter((f) => !ALLOWED.test(f));
  ok('only png/webp/json/md files', bad.length === 0, bad.join(', '));
  ok('metadata.json present', files.includes('metadata.json'));
  if (!files.includes('notes.md')) warnings.push('notes.md missing — explain what the board explores and its known issues');
  if (!files.includes('prompt.md')) warnings.push('prompt.md missing — record the exact generation prompt for reproducibility');
  let meta = null;
  try { meta = files.includes('metadata.json') ? JSON.parse(readFileSync(join(dir, 'metadata.json'), 'utf8')) : null; } catch (e) { ok('metadata parses', false, String(e.message)); }
  const result = { assetId, version, kind: 'concept', checks, errors, warnings, meta };
  if (!meta) return result;

  ok('metadata.assetId matches folder', meta.assetId === assetId, String(meta.assetId));
  ok('metadata.version matches folder', meta.version === version, String(meta.version));
  ok('declared as a concept (submissionType contains "concept")', /concept/i.test(String(meta.submissionType ?? '')), String(meta.submissionType));
  ok('author recorded', typeof meta.author === 'string' && meta.author.length > 0, String(meta.author));
  ok('createdAt is a date', !Number.isNaN(Date.parse(meta.createdAt ?? '')));
  ok('provenance recorded', typeof meta.provenance === 'string' && meta.provenance.length >= 20);
  ok('generator recorded', !!meta.generator?.tool, String(meta.generator?.tool));
  ok('cost statement (no paid services)', typeof meta.cost === 'string' && meta.cost.length > 0);

  // Integrity: the board and every raw source are byte-identical to what metadata records, and all live in this folder.
  const board = meta.files?.board ?? meta.files?.master;
  const entries = [...(board ? [{ ...board, role: 'board' }] : []), ...(meta.files?.rawCandidates ?? meta.files?.sources ?? []).map((s) => ({ ...s, role: 'source' }))];
  ok('board image declared', !!board?.path);
  for (const e of entries) {
    const repoPath = e.path.startsWith('art/') ? e.path : `${relDir}/${e.path}`;
    const inside = repoPath.startsWith(`${relDir}/`);
    ok(`${e.role} inside the concept folder`, inside, repoPath);
    if (!inside || !existsSync(join(root, repoPath))) { ok(`${e.role} present`, false, repoPath); continue; }
    ok(`${e.role} sha256 matches metadata`, hash(join(root, repoPath)) === e.sha256, repoPath.split('/').pop());
  }
  // Every image decodes, fits the size limits and carries no camera / location / editing metadata.
  for (const f of files.filter((x) => /\.(png|webp)$/i.test(x))) {
    try {
      const { meta: im, bytes, privacy } = await imageCheck(join(dir, f));
      ok(`decodes: ${f}`, true, `${im.width}×${im.height}`);
      ok(`size limits: ${f}`, bytes <= MAX_BYTES && im.width <= MAX_SIDE && im.height <= MAX_SIDE, `${bytes} bytes, ${im.width}×${im.height}`);
      ok(`privacy: no EXIF/XMP/IPTC in ${f}`, privacy.length === 0, privacy.join(', '));
    } catch (e) { ok(`decodes: ${f}`, false, String(e.message)); }
  }
  const listed = new Set(entries.map((e) => (e.path.startsWith('art/') ? e.path : `${relDir}/${e.path}`)));
  for (const f of files.filter((x) => /\.(png|webp)$/i.test(x))) if (!listed.has(`${relDir}/${f}`)) warnings.push(`${f} is not listed in metadata.files (no recorded checksum)`);
  return result;
}
