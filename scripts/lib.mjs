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
/**
 * World production branches (multi-asset, one architecture batch such as G1):
 *   codex/art/world-<batch>-r<round>               e.g. codex/art/world-g1-r2   (canonical)
 *   codex/art/<batch>-<rev>-production-r<round>    e.g. codex/art/g1-1-production-r1 (G1.1 correction form)
 * The batch is matched against `production.batch` of the world specs (case-insensitive).
 */
export const CODEX_WORLD_BATCH_RE = /^codex\/art\/(?:world-(g\d+)|(g\d+)-\d+-production)-r(\d+)$/;

/** Spec directories scanned by the production pipeline. `world` specs drive the town/world runtime. */
export const SPEC_DIRS = [
  { dir: 'props', scope: 'room' }, { dir: 'characters', scope: 'room' }, { dir: 'environments', scope: 'room' },
  { dir: 'world/props', scope: 'world' }, { dir: 'world/environments', scope: 'world' },
];

export function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

/**
 * Map of asset id → { spec, path, scope } for every spec under SPEC_DIRS (room specs and world specs).
 * Ids are unique across all directories.
 */
export function loadSpecs() {
  const map = new Map();
  for (const { dir, scope } of SPEC_DIRS) {
    for (const f of walk(join(ROOT, 'specs', dir)).filter((f) => f.endsWith('.json'))) {
      const spec = JSON.parse(readFileSync(f, 'utf8'));
      if (!spec.id) throw new Error(`spec without id: ${rel(f)}`);
      if (map.has(spec.id)) throw new Error(`duplicate spec id ${spec.id} (${map.get(spec.id).path} and ${rel(f)})`);
      map.set(spec.id, { spec, path: rel(f), scope });
    }
  }
  return map;
}

/** World layer roles accepted for production art. */
export const WORLD_ROLES = ['front', 'roof', 'addon'];

/**
 * The frame that art submissions are made and validated in.
 * - Room specs: the spec itself (already authored at master density).
 * - World specs: the `production` block (HD master frame, 2 px/cm) over the runtime spec. The runtime spec stays the
 *   1 px/cm TEMP frame the engine draws placeholders in; both frames share the same pivot ratio (checked by
 *   worldSpecErrors), so approved art drops into the runtime with the same origin.
 * Returns null when the spec does not accept art submissions.
 */
export function productionSpec(entry) {
  const spec = entry.spec;
  if (spec.status === 'greybox-only') return null;
  if (entry.scope !== 'world') return spec;
  const p = spec.production;
  if (!p) return null;
  const { batch, role, archetype, contractVersion, envelope, coverage, tolerancePx, assembly, ...frame } = p;
  return { ...spec, ...frame, batch, world: { batch, role, archetype, contractVersion, envelope, coverage, tolerancePx, assembly: assembly ?? [] } };
}

/** Structural checks on a world spec's production block (spec authoring errors, not art errors). */
export function worldSpecErrors(entry) {
  const e = [];
  const s = entry.spec, p = s.production;
  if (!p) return e;
  const need = ['batch', 'role', 'archetype', 'contractVersion', 'density', 'canvas', 'pivot', 'envelope', 'tolerancePx', 'artBounds', 'transparency', 'export'];
  for (const k of need) if (p[k] == null) e.push(`${s.id}: production.${k} missing`);
  if (e.length) return e;
  if (!WORLD_ROLES.includes(p.role)) e.push(`${s.id}: production.role ${p.role} not in ${WORLD_ROLES.join('/')}`);
  if (p.density < PROJECTION.masterDensityPxPerCm) e.push(`${s.id}: production.density ${p.density} below master density ${PROJECTION.masterDensityPxPerCm}`);
  const k = p.density / s.density;
  if (p.canvas.width !== s.canvas.width * k || p.canvas.height !== s.canvas.height * k) e.push(`${s.id}: production canvas ${p.canvas.width}x${p.canvas.height} is not runtime canvas × ${k}`);
  if (p.pivot.x !== s.pivot.x * k || p.pivot.y !== s.pivot.y * k) e.push(`${s.id}: production pivot ${p.pivot.x},${p.pivot.y} is not runtime pivot × ${k}`);
  const v = p.envelope, a = p.artBounds, pad = p.transparency.edgePaddingPx;
  if (a.x < pad || a.y < pad || a.x + a.width > p.canvas.width - pad || a.y + a.height > p.canvas.height - pad) e.push(`${s.id}: artBounds reach into the ${pad}px transparent rim`);
  if (v.x - p.tolerancePx < a.x || v.y - p.tolerancePx < a.y || v.x + v.width + p.tolerancePx > a.x + a.width || v.y + v.height + p.tolerancePx > a.y + a.height) e.push(`${s.id}: envelope ± tolerance does not fit inside artBounds`);
  if (Math.abs(v.x + v.width / 2 - p.pivot.x) > 0.5) e.push(`${s.id}: envelope is not centred on the pivot`);
  if (p.role === 'roof' && !p.coverage) e.push(`${s.id}: roof layer needs production.coverage (the footprint it must hide)`);
  if (p.coverage) {
    const c = p.coverage.rect;
    if (c.x < v.x || c.y < v.y || c.x + c.width > v.x + v.width || c.y + c.height > v.y + v.height) e.push(`${s.id}: coverage rect lies outside the envelope`);
  }
  if (p.role !== 'roof' && p.coverage) e.push(`${s.id}: coverage applies to roof layers only`);
  return e;
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

/** Fraction of pixels with alpha > 128 inside rect (canvas px) of an RGBA image. */
export async function opaqueFraction(path, rect) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  let n = 0, total = 0;
  for (let y = Math.max(0, rect.y); y < Math.min(H, rect.y + rect.height); y++) for (let x = Math.max(0, rect.x); x < Math.min(W, rect.x + rect.width); x++) {
    total++; if (data[(y * W + x) * C + 3] > 128) n++;
  }
  return total ? n / total : 0;
}

export function md(rows) { return rows.join('\n'); }

/** Path-ownership policy. Returns a list of violations for the changed files of a branch. */
export function ownershipViolations(branchName, changed) {
  const v = [];
  const m = CODEX_BRANCH_RE.exec(branchName);
  const b = CODEX_BATCH_RE.exec(branchName);
  const w = CODEX_WORLD_BATCH_RE.exec(branchName);
  if (w) {
    // A world production branch may touch the submission/source folders of every world layer (front, roof, add-on)
    // whose production block belongs to that batch — several assets of one architecture batch in one PR.
    const batch = (w[1] ?? w[2]).toUpperCase();
    const ids = [...loadSpecs().values()].filter((e) => e.scope === 'world' && e.spec.production?.batch?.toUpperCase() === batch).map((e) => e.spec.id);
    if (!ids.length) return [`no world production specs belong to batch ${batch}`];
    const re = new RegExp(`^art/(submissions|source)/(${ids.join('|')})/v\\d{3}/`);
    for (const f of changed) if (!re.test(f)) v.push(`world batch ${batch} branch may only change art/submissions|source/<asset>/v###/ for: ${ids.join(', ')} — found ${f}`);
    return v;
  }
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
    if (!m) return [`branch "${branchName}" must match codex/art/<asset_id>-v###, codex/art/batch-<letter>-r<n> or codex/art/world-<batch>-r<n>`];
    const [, id, ver] = m;
    const allowed = [`art/submissions/${id}/${ver}/`, `art/source/${id}/${ver}/`];
    for (const f of changed) if (!allowed.some((a) => f.startsWith(a))) v.push(`codex branch may only change ${allowed.join(' or ')} — found ${f}`);
  } else {
    // Non-codex branches must not add or edit artwork submissions on Codex's behalf — except an integration
    // branch carrying the submission of an asset that the same diff approves (manifest status 'approved').
    const manifest = JSON.parse(readFileSync(join(ROOT, 'public/assets/manifest.json'), 'utf8'));
    for (const f of changed) {
      if (!f.startsWith('art/submissions/') && !f.startsWith('art/source/')) continue;
      const [, , id, ver] = f.split('/');
      const m = manifest.assets?.[id];
      const integrating = m?.status === 'approved' && m.version === ver && changed.includes(m.approval?.master?.path);
      if (f.startsWith('art/submissions/') && !integrating) v.push(`only codex/art/* branches may change submissions (or an integration that approves that exact version) — found ${f}`);
    }
  }
  // Approved artwork and runtime assets change only via scripts/approve-asset.mjs (checksums verified by validate-manifest).
  return v;
}

