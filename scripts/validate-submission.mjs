// Validation of one art submission against its spec. Imported by validate-art, gallery and approve.
import Ajv from 'ajv';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { analyzeImage, opaqueFraction, productionSpec, readJson, rel, sha256File, walk, worldSpecErrors, ASSET_ID_RE, VERSION_RE } from './lib.mjs';

/** Mean absolute RGB difference between opposite edges (0 = perfectly continuous when tiled). */
export async function seamDelta(path, repeat = 'xy') {
  const { data, info } = await sharp(path).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const px = (x, y, c) => data[(y * W + x) * C + c];
  let sx = 0, sy = 0;
  for (let y = 0; y < H; y++) for (let c = 0; c < 3; c++) sx += Math.abs(px(0, y, c) - px(W - 1, y, c));
  for (let x = 0; x < W; x++) for (let c = 0; c < 3; c++) sy += Math.abs(px(x, 0, c) - px(x, H - 1, c));
  return { x: sx / (H * 3), y: repeat === 'xy' ? sy / (W * 3) : 0 };
}

const schema = readJson('specs/schema/submission-metadata.schema.json');
const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false });
const validateMeta = ajv.compile(schema);
const validateWorldMeta = ajv.compile(readJson('specs/schema/world-layer-metadata.schema.json'));
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
  const isWorld = entry.scope === 'world';
  if (isWorld) {
    const se = worldSpecErrors(entry);
    if (entry.spec.production && !ok('world spec production block is consistent', se.length === 0, se.join('; '))) return { assetId, version, dir: rel(dir), spec: entry.path, errors, warnings, checks };
  }
  // Submissions are validated in the production frame: room specs as authored, world specs via their production block.
  const spec = productionSpec(entry);
  const refusal = entry.spec.status === 'greybox-only' ? 'this asset is grey-box only and does not accept art submissions'
    : `${entry.path} has no production block (world TEMP spec): art for it needs a production contract first`;
  if (!ok('spec accepts art submissions', !!spec, spec ? (isWorld ? `world ${spec.world.role} layer, batch ${spec.world.batch}, ${spec.density} px/cm` : '') : refusal)) return { assetId, version, dir: rel(dir), spec: entry.path, errors, warnings, checks };

  const files = readdirSync(dir).filter((f) => statSync(join(dir, f)).isFile());
  const masterName = `${assetId}_${version}.png`;
  ok('master file present', files.includes(masterName), masterName);
  ok('metadata.json present', files.includes('metadata.json'));
  // every file of the submission, including review sub-folders, must be an image, JSON or Markdown
  const unexpected = walk(dir).map((f) => rel(f).slice(rel(dir).length + 1)).filter((f) => !ALLOWED_EXT.test(f));
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
    if (isWorld) {
      const w = spec.world, wl = meta.worldLayer;
      const wv = validateWorldMeta(meta);
      ok('world layer metadata schema', !!wv, wv ? '' : ajv.errorsText(validateWorldMeta.errors));
      if (wl) {
        ok('worldLayer matches spec (batch, role, archetype, contract)', wl.batch === w.batch && wl.role === w.role && wl.archetype === w.archetype && wl.contractVersion === w.contractVersion,
          `${wl.batch}/${wl.role}/${wl.archetype}/${wl.contractVersion} vs ${w.batch}/${w.role}/${w.archetype}/${w.contractVersion}`);
        ok('worldLayer density matches production density', wl.densityPxPerCm === spec.density, `${wl.densityPxPerCm} vs ${spec.density}`);
      }
    }
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
    if (spec.tile) {
      // Seamless tiling: opposite edges must continue into each other (Batch E environment tiles).
      const sm = await seamDelta(masterPath, spec.tile.repeat);
      const max = spec.seamless?.maxEdgeDelta ?? 14;
      ok('seamless horizontally (left↔right edge)', sm.x <= max, `mean edge delta ${sm.x.toFixed(1)} (max ${max})`);
      if (spec.tile.repeat === 'xy') ok('seamless vertically (top↔bottom edge)', sm.y <= max, `mean edge delta ${sm.y.toFixed(1)} (max ${max})`);
    }
    if (spec.pivot && a.bbox) {
      const cx = a.bbox.x + a.bbox.width / 2;
      if (Math.abs(cx - spec.pivot.x) > 12) warnings.push(`art is off-centre: bbox centre x=${cx.toFixed(0)}, pivot x=${spec.pivot.x}`);
    }
    if (isWorld) await worldChecks(spec, a, masterPath, meta, ok, warnings);
  }
  return { assetId, version, dir: rel(dir), spec: entry.path, errors, warnings, checks, analysis, meta };
}

/**
 * World layer geometry (fronts, roofs, add-ons). The painted opaque bounding box must match the contract envelope
 * edge by edge within production.tolerancePx; roofs must also hide the whole ground footprint in projection.
 * Pixels decide — the author's measuredEnvelopePx is only compared with them.
 */
async function worldChecks(spec, a, masterPath, meta, ok, warnings) {
  const w = spec.world, v = w.envelope, t = w.tolerancePx, d = spec.density;
  const b = a.bbox;
  if (!ok('art present on the canvas', !!b)) return;
  const cm = (px) => `${px >= 0 ? '+' : ''}${(px / d).toFixed(1)} cm`;
  const L = b.x - v.x, R = (b.x + b.width) - (v.x + v.width), T = b.y - v.y, B = (b.y + b.height) - (v.y + v.height);
  const what = w.role === 'roof' ? 'roof' : w.role === 'front' ? 'facade' : 'add-on';
  ok(`envelope width (${what} ${v.widthCm} cm)`, Math.abs(L) <= t && Math.abs(R) <= t,
    `painted ${(b.width / d).toFixed(1)} cm; left edge ${cm(L)}, right edge ${cm(R)} (±${t / d} cm)`);
  ok(`envelope top (${w.role === 'roof' ? `projected rise ${v.projectedRiseCm} cm above the eave` : `${v.heightCm} cm high`})`, Math.abs(T) <= t,
    `painted top ${cm(-T)} vs contract (±${t / d} cm)`);
  ok(`envelope bottom (${w.role === 'roof' ? `eave drop ${v.frontDropCm} cm below the pivot` : 'on the pivot line'})`, Math.abs(B) <= t,
    `painted bottom ${cm(B)} vs contract (±${t / d} cm)`);
  if (w.coverage) {
    const f = await opaqueFraction(masterPath, w.coverage.rect);
    ok(`roof hides the ${w.coverage.widthCm}×${w.coverage.depthCm} cm footprint`, f >= w.coverage.minOpaqueRatio, `${(f * 100).toFixed(1)}% opaque (min ${(w.coverage.minOpaqueRatio * 100).toFixed(0)}%)`);
  }
  const m = meta?.worldLayer?.measuredEnvelopePx;
  if (m) {
    const off = Math.max(Math.abs(m.x - b.x), Math.abs(m.y - b.y), Math.abs(m.width - b.width), Math.abs(m.height - b.height));
    ok('reported measuredEnvelopePx matches the pixels', off <= 2, `reported ${m.x},${m.y} ${m.width}x${m.height}; measured ${b.x},${b.y} ${b.width}x${b.height}`);
  }
  if (meta?.worldLayer?.fit && meta.worldLayer.fit.uniformScale > 1) ok('no upscaling of the source', false, `uniformScale ${meta.worldLayer.fit.uniformScale}`);
  const missing = w.assembly.filter((id) => !(meta?.worldLayer?.layerSet ?? []).includes(id));
  if (missing.length) warnings.push(`layers of ${w.archetype} not reviewed together with this one: ${missing.join(', ')} — fronts, roofs and add-ons must be checked assembled (seams, eave joins)`);
}
