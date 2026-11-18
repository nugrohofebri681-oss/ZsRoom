// Validation of one art submission against its spec. Imported by validate-art, gallery and approve.
import Ajv from 'ajv';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { analyzeImage, readJson, rel, sha256File, ASSET_ID_RE, VERSION_RE } from './lib.mjs';

const schema = readJson('specs/schema/submission-metadata.schema.json');
const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false });
const validateMeta = ajv.compile(schema);
const ALLOWED_EXT = /\.(png|webp|json|md)$/i;

export async function validateSubmission({ assetId, version, dir }, specs) {
  const errors = [];
  const warnings = [];
  const checks = [];
  const ok = (name, pass, detail = '') => { checks.push({ name, pass, detail }); if (!pass) errors.push(`${name}${detail ? `: ${detail}` : ''}`); return pass; };

  ok('asset id format', ASSET_ID_RE.test(assetId), assetId);
  ok('version format (v###)', VERSION_RE.test(version), version);
  const entry = specs.get(assetId);
  if (!ok('spec exists', !!entry, entry ? entry.path : `no spec for ${assetId}`)) return { assetId, version, dir: rel(dir), errors, warnings, checks };
  const spec = entry.spec;
  if (spec.status === 'greybox-only') errors.push('this asset is grey-box only and does not accept art submissions');

  const files = readdirSync(dir).filter((f) => statSync(join(dir, f)).isFile());
  const masterName = `${assetId}_${version}.png`;
  ok('master file present', files.includes(masterName), masterName);
  ok('metadata.json present', files.includes('metadata.json'));
  const unexpected = files.filter((f) => !ALLOWED_EXT.test(f));
  ok('only png/webp/json/md files', unexpected.length === 0, unexpected.join(', '));
  if (!files.includes('prompt.md')) warnings.push('prompt.md missing — record the exact generation prompt for reproducibility');

  let meta = null;
  if (files.includes('metadata.json')) {
    try { meta = readJson(rel(join(dir, 'metadata.json'))); } catch (e) { ok('metadata parses', false, String(e.message)); }
  }
  if (meta) {
    const valid = validateMeta(meta);
    ok('metadata schema', !!valid, valid ? '' : ajv.errorsText(validateMeta.errors));
    ok('metadata.assetId matches folder', meta.assetId === assetId, String(meta.assetId));
    ok('metadata.version matches folder', meta.version === version, String(meta.version));
    ok('metadata.specVersion matches spec', meta.specVersion === spec.specVersion, `${meta.specVersion} vs ${spec.specVersion}`);
    ok('createdAt is a date', !Number.isNaN(Date.parse(meta.createdAt ?? '')));
    if (meta.files?.master?.path && meta.files.master.path !== masterName) ok('metadata master path', false, meta.files.master.path);
    for (const ref of spec.styleReferences ?? []) {
      if (!(meta.generator?.referencesUsed ?? []).includes(ref)) warnings.push(`style reference ${ref} not listed in generator.referencesUsed — consistency with approved art is unverified`);
    }
    if (!meta.cost) warnings.push('metadata.cost missing — state that no paid API/credits were used');
    if (meta.selfReview && meta.selfReview.checklistComplete !== true) warnings.push('self-review checklist not marked complete');
  }

  let analysis = null;
  const masterPath = join(dir, masterName);
  if (existsSync(masterPath)) {
    const sha = sha256File(rel(masterPath));
    if (meta?.files?.master?.sha256) ok('master sha256 matches metadata', meta.files.master.sha256 === sha, sha);
    analysis = await analyzeImage(masterPath, spec);
    const a = analysis;
    ok('format PNG', a.format === 'png', a.format);
    ok('canvas size', a.width === spec.canvas.width && a.height === spec.canvas.height, `${a.width}x${a.height}, expected ${spec.canvas.width}x${spec.canvas.height}`);
    ok('RGBA (alpha channel)', a.channels === 4 && a.hasAlpha === true, `${a.channels} channels`);
    ok('8-bit depth', a.depth === 'uchar', String(a.depth));
    ok('sRGB colour space', a.space === 'srgb', String(a.space));
    if (spec.export?.maxBytes) ok('file size', a.bytes <= spec.export.maxBytes, `${a.bytes} bytes (max ${spec.export.maxBytes})`);
    const t = spec.transparency ?? {};
    ok('transparent edge padding', a.edgeViolations === 0, `${a.edgeViolations} non-transparent px within ${t.edgePaddingPx}px of the edge`);
    if (t.minOpaqueRatio != null) ok('opaque coverage ≥ min', a.opaqueRatio >= t.minOpaqueRatio, a.opaqueRatio.toFixed(3));
    if (t.maxOpaqueRatio != null) ok('opaque coverage ≤ max (no baked background)', a.opaqueRatio <= t.maxOpaqueRatio, a.opaqueRatio.toFixed(3));
    if (spec.artBounds && a.bbox) {
      const b = spec.artBounds, x = a.bbox;
      const inside = x.x >= b.x && x.y >= b.y && x.x + x.width <= b.x + b.width && x.y + x.height <= b.y + b.height;
      ok('art inside artBounds', inside, `bbox ${x.x},${x.y} ${x.width}x${x.height}; allowed ${b.x},${b.y} ${b.width}x${b.height}`);
    }
    if (spec.baseLine) ok('base sits on pivot line', Math.abs(a.baseRow - spec.baseLine.y) <= spec.baseLine.tolerancePx, `lowest solid row ${a.baseRow}, expected ${spec.baseLine.y}±${spec.baseLine.tolerancePx}`);
    if (spec.pivot && a.bbox) {
      const cx = a.bbox.x + a.bbox.width / 2;
      if (Math.abs(cx - spec.pivot.x) > 12) warnings.push(`art is off-centre: bbox centre x=${cx.toFixed(0)}, pivot x=${spec.pivot.x}`);
    }
  }
  return { assetId, version, dir: rel(dir), spec: entry.path, errors, warnings, checks, analysis, meta };
}
