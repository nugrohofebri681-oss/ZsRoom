// Shared helpers for ZsRoom pipeline scripts. Node ≥ 20, ESM. No network access, no paid services.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

export const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
export const rel = (p) => relative(ROOT, p).split(sep).join('/');
export const readJson = (p) => JSON.parse(readFileSync(resolve(ROOT, p), 'utf8'));
export const sha256File = (p) => createHash('sha256').update(readFileSync(resolve(ROOT, p))).digest('hex');
export const PROJECTION = readJson('specs/projection.json');

export const ASSET_ID_RE = /^[a-z][a-z0-9_]+$/;
export const VERSION_RE = /^v\d{3}$/;
export const CODEX_BRANCH_RE = /^codex\/art\/([a-z][a-z0-9_]+)-(v\d{3})$/;
/** Batch branches: codex/art/batch-<letter>-r<round>, e.g. codex/art/batch-b-r1. */
export const CODEX_BATCH_RE = /^codex\/art\/batch-([a-z])-r(\d+)$/;

export function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

/** Map of asset id → { spec, path } for every spec under specs/{props,characters,environments}. */
export function loadSpecs() {
  const map = new Map();
  for (const sub of ['props', 'characters', 'environments']) {
    for (const f of walk(join(ROOT, 'specs', sub)).filter((f) => f.endsWith('.json'))) {
      const spec = JSON.parse(readFileSync(f, 'utf8'));
      if (map.has(spec.id)) throw new Error(`duplicate spec id ${spec.id}`);
      map.set(spec.id, { spec, path: rel(f) });
    }
  }
  return map;
}

/** All submission directories: art/submissions/<assetId>/<version>/ */
export function listSubmissions() {
  const base = join(ROOT, 'art', 'submissions');
  if (!existsSync(base)) return [];
  const out = [];
  for (const assetId of readdirSync(base).sort()) {
    const ad = join(base, assetId);
    if (!statSync(ad).isDirectory()) continue;
    for (const version of readdirSync(ad).sort()) {
      const vd = join(ad, version);
      if (statSync(vd).isDirectory()) out.push({ assetId, version, dir: vd });
    }
  }
  return out;
}

/** Pixel analysis of an RGBA image used by validation and the gallery. */
export async function analyzeImage(path, spec) {
  const img = sharp(path);
  const meta = await img.metadata();
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  let opaque = 0, minX = W, minY = H, maxX = -1, maxY = -1, edgeViolations = 0, solidBottom = -1;
  const pad = spec?.transparency?.edgePaddingPx ?? 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const a = data[(y * W + x) * C + 3];
      if (a > 16) {
        opaque++;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
      if (a > 128 && y > solidBottom) solidBottom = y;
      if (a > 0 && (x < pad || y < pad || x >= W - pad || y >= H - pad)) edgeViolations++;
    }
  }
  return {
    format: meta.format, width: meta.width, height: meta.height, channels: meta.channels, hasAlpha: meta.hasAlpha,
    depth: meta.depth, space: meta.space, bytes: statSync(path).size,
    opaqueRatio: opaque / (W * H),
    bbox: maxX < 0 ? null : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 },
    baseRow: solidBottom, edgeViolations,
  };
}

export function md(rows) { return rows.join('\n'); }

/** Path-ownership policy. Returns a list of violations for the changed files of a branch. */
export function ownershipViolations(branchName, changed) {
  const v = [];
  const m = CODEX_BRANCH_RE.exec(branchName);
  const b = CODEX_BATCH_RE.exec(branchName);
  if (b) {
    // A batch branch may touch the submission/source folders of every asset whose spec belongs to that batch.
    const letter = b[1].toUpperCase();
    const ids = [...loadSpecs().values()].filter((e) => e.spec.batch === letter).map((e) => e.spec.id);
    if (!ids.length) return [`no specs belong to batch ${letter}`];
    const re = new RegExp(`^art/(submissions|source)/(${ids.join('|')})/v\\d{3}/`);
    for (const f of changed) if (!re.test(f)) v.push(`batch ${letter} branch may only change art/submissions|source/<asset>/v###/ for: ${ids.join(', ')} — found ${f}`);
    return v;
  }
  if (branchName.startsWith('codex/')) {
    if (!m) return [`branch "${branchName}" must match codex/art/<asset_id>-v### or codex/art/batch-<letter>-r<n>`];
    const [, id, ver] = m;
    const allowed = [`art/submissions/${id}/${ver}/`, `art/source/${id}/${ver}/`];
    for (const f of changed) if (!allowed.some((a) => f.startsWith(a))) v.push(`codex branch may only change ${allowed.join(' or ')} — found ${f}`);
  } else {
    // Non-codex branches must not add or edit artwork submissions on Codex's behalf.
    for (const f of changed) if (f.startsWith('art/submissions/')) v.push(`only codex/art/* branches may change submissions — found ${f}`);
  }
  // Approved artwork and runtime assets change only via scripts/approve-asset.mjs (checksums verified by validate-manifest).
  return v;
}

