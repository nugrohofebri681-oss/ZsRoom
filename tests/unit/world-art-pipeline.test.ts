// World layer art pipeline (fronts, roofs, add-ons): spec loading, production frames, metadata, geometry checks,
// fitting and multi-asset branch routing. SYNTHETIC fixtures in a temp dir — test geometry, not artwork.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain ESM pipeline modules
import { loadSpecs, ownershipViolations, productionSpec, sha256File, worldSpecErrors, listSubmissions } from '../../scripts/lib.mjs';
// @ts-expect-error — plain ESM pipeline modules
import { validateSubmission } from '../../scripts/validate-submission.mjs';
import archetypes from '../../src/data/archetypes.json';
import manifest from '../../public/assets/manifest.json';

type Rect = { x: number; y: number; width: number; height: number };
type Entry = { spec: any; path: string; scope: 'room' | 'world' };
type Check = { name: string; pass: boolean; detail: string };
const specs: Map<string, Entry> = loadSpecs();
const tmp = mkdtempSync(join(tmpdir(), 'zs-world-art-'));
const G1 = ['world_house_small', 'world_house_small_roof', 'world_house_large', 'world_house_large_roof', 'world_ruko', 'world_ruko_roof',
  'world_ruko_awning', 'world_warkop_open', 'world_warkop_roof', 'world_warkop_counter', 'world_warkop_bench'];
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

/** RGBA canvas with opaque rectangles (optionally with transparent holes). */
async function canvasPng(w: number, h: number, rects: Rect[], holes: Rect[] = []): Promise<Buffer> {
  const layer = async (r: Rect, colour: string) => ({ input: await sharp({ create: { width: r.width, height: r.height, channels: 4, background: colour } }).png().toBuffer(), left: r.x, top: r.y });
  let img = await sharp({ create: { width: w, height: h, channels: 4, background: transparent } }).composite(await Promise.all(rects.map((r) => layer(r, '#c98a6b')))).png().toBuffer();
  if (holes.length) img = await sharp(img).composite(await Promise.all(holes.map(async (r) => ({ ...(await layer(r, '#000000')), blend: 'dest-out' as const })))).png().toBuffer();
  return img;
}

async function bbox(png: Buffer): Promise<Rect> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3]! > 16) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

let n = 0;
async function submit(id: string, png: Buffer, opts: { worldLayer?: Record<string, unknown> | null; extraFiles?: Record<string, string>; specVersion?: string } = {}) {
  const e = specs.get(id)!, p = productionSpec(e);
  const dir = join(tmp, `s${n++}`, id, 'v001');
  mkdirSync(dir, { recursive: true });
  const master = join(dir, `${id}_v001.png`);
  writeFileSync(master, png);
  const worldLayer = opts.worldLayer === null ? undefined : {
    batch: p.world.batch, role: p.world.role, archetype: p.world.archetype, contractVersion: p.world.contractVersion, densityPxPerCm: p.density,
    measuredEnvelopePx: await bbox(png), fit: { uniformScale: 1, upscaled: false, nonuniform: false }, layerSet: p.world.assembly, ...opts.worldLayer,
  };
  writeFileSync(join(dir, 'metadata.json'), JSON.stringify({
    assetId: id, version: 'v001', specVersion: opts.specVersion ?? e.spec.specVersion, author: 'codex',
    generator: { tool: 'synthetic-test-fixture', referencesUsed: p.styleReferences }, createdAt: new Date().toISOString(),
    files: { master: { path: `${id}_v001.png`, sha256: sha256File(master) } }, provenance: 'synthetic fixture for pipeline tests',
    postProcessing: [], selfReview: { checklistComplete: true, knownIssues: [] }, cost: 'none', ...(worldLayer ? { worldLayer } : {}),
  }));
  writeFileSync(join(dir, 'prompt.md'), 'synthetic');
  for (const [f, body] of Object.entries(opts.extraFiles ?? {})) { mkdirSync(join(dir, f, '..'), { recursive: true }); writeFileSync(join(dir, f), body); }
  return validateSubmission({ assetId: id, version: 'v001', dir }, specs) as Promise<{ errors: string[]; warnings: string[]; checks: Check[] }>;
}
const failed = (r: { checks: Check[] }) => r.checks.filter((c) => !c.pass).map((c) => c.name);
/** A perfect painting for a layer: exactly its contract envelope. */
async function perfect(id: string) {
  const p = productionSpec(specs.get(id)!);
  return canvasPng(p.canvas.width, p.canvas.height, [p.world.envelope]);
}

describe('world specs in the production spec loader', () => {
  it('loads room and world specs with unique ids and a scope', () => {
    const scopes = new Set([...specs.values()].map((e) => e.scope));
    expect(scopes).toEqual(new Set(['room', 'world']));
    for (const id of G1) expect(specs.get(id)?.scope, id).toBe('world');
    expect(specs.get('prop_bed_zila')?.scope).toBe('room');
  });

  it('the 11 G1 layers — and only they — accept world production art', () => {
    const prod = [...specs.values()].filter((e) => e.scope === 'world' && productionSpec(e)).map((e) => e.spec.id).sort();
    expect(prod).toEqual([...G1].sort());
    expect(productionSpec(specs.get('world_tree')!)).toBeNull();          // TEMP-only world spec
  });

  it('every production block is consistent: 2 px/cm, frame = 2 × runtime TEMP frame, envelope inside artBounds', () => {
    for (const id of G1) {
      const e = specs.get(id)!, p = e.spec.production;
      expect(worldSpecErrors(e), id).toEqual([]);
      expect(p.density).toBe(2);
      expect(p.canvas).toEqual({ width: e.spec.canvas.width * 2, height: e.spec.canvas.height * 2 });
      expect([p.pivot.x, p.pivot.y]).toEqual([e.spec.pivot.x * 2, e.spec.pivot.y * 2]);
      // padding: 8 cm side margins (16 px HD), 12 cm top/bottom (24 px HD), fully transparent 8 px rim
      expect([p.envelope.x, p.envelope.y]).toEqual([16, 24]);
      expect(p.canvas.width - p.envelope.x - p.envelope.width).toBe(16);
      expect(p.canvas.height - p.envelope.y - p.envelope.height).toBe(24);
      expect(p.transparency.edgePaddingPx).toBe(8);
      expect(p.tolerancePx).toBe(8);
    }
  });

  it('production frames match the frozen G1 architecture contract', () => {
    const A = (archetypes as any).archetypes;
    for (const k of ['house_small', 'house_large', 'ruko', 'warkop_open']) {
      const c = A[k].contract;
      for (const role of ['front', 'roof'] as const) {
        const l = c.layers[role], p = specs.get(l.assetId)!.spec.production;
        expect(p.canvas, l.assetId).toEqual({ width: l['canvasPx@1cm'][0] * 2, height: l['canvasPx@1cm'][1] * 2 });
        expect([p.pivot.x, p.pivot.y], l.assetId).toEqual([l['pivotPx@1cm'][0] * 2, l['pivotPx@1cm'][1] * 2]);
        expect(p.archetype).toBe(k);
        expect(p.contractVersion).toBe(c.version);
      }
      const front = specs.get(c.layers.front.assetId)!.spec.production, roof = specs.get(c.layers.roof.assetId)!.spec.production;
      expect(front.envelope.width).toBe(c.widthCm * 2);
      expect(front.envelope.height).toBe(c.eaveCm * 2);
      expect(roof.envelope.width).toBe((c.widthCm + 2 * c.roof.overhangSideCm) * 2);
      expect(roof.envelope.height).toBe((c.roof.projectedRiseCm + c.roof.overhangFrontDropCm) * 2);
      expect(roof.coverage.rect).toEqual({ x: roof.pivot.x - c.widthCm, y: roof.pivot.y - Math.round(c.depthCm * 0.7 * 2), width: c.widthCm * 2, height: Math.round(c.depthCm * 0.7 * 2) });
    }
  });

  it('the ruko awning envelope includes its 60 cm projection (band 30 cm + 60 × 0.7)', () => {
    const p = specs.get('world_ruko_awning')!.spec.production;
    expect(p.envelope.heightCm).toBe(72);
    expect(p.canvas).toEqual({ width: 672, height: 192 });
    expect(p.pivot).toMatchObject({ x: 336, y: 168 });
  });
});

describe('valid world submissions', () => {
  it.each(G1)('%s: a painting that fills its contract envelope passes', async (id) => {
    const r = await submit(id, await perfect(id));
    expect(r.errors).toEqual([]);
    expect(r.warnings.filter((w) => w.includes('not reviewed together'))).toEqual([]);
  });

  it('fit-to-spec places a correctly proportioned raw source exactly on the front envelope (uniform scale, no stretch)', async () => {
    const raw = join(tmp, 'raw-front.png');
    await sharp(await canvasPng(1100, 760, [{ x: 25, y: 35, width: 1050, height: 675 }])).toFile(raw);   // 420×270 cm at 2.5 px/cm
    const out = join(tmp, 'fit-front.png');
    const log = execFileSync('node', ['scripts/fit-to-spec.mjs', raw, 'world_house_small', out], { encoding: 'utf8' });
    expect(log).toMatch(/"uniformScale":0\.8,"upscaled":false,"nonuniform":false/);
    const r = await submit('world_house_small', readFileSync(out), { worldLayer: { fit: { uniformScale: 0.8, upscaled: false, nonuniform: false } } });
    expect(r.errors).toEqual([]);
  });
});

describe('invalid world submissions', () => {
  it('a facade painted 20 cm short of the eave fails the envelope top, not the canvas', async () => {
    const p = productionSpec(specs.get('world_house_small')!), v = p.world.envelope;
    const r = await submit('world_house_small', await canvasPng(p.canvas.width, p.canvas.height, [{ ...v, y: v.y + 40, height: v.height - 40 }]));
    expect(failed(r)).toEqual(['envelope top (270 cm high)']);
  });

  it('a narrow ruko facade fails the envelope width', async () => {
    const p = productionSpec(specs.get('world_ruko')!), v = p.world.envelope;
    const r = await submit('world_ruko', await canvasPng(p.canvas.width, p.canvas.height, [{ ...v, x: v.x + 30, width: v.width - 60 }]));
    expect(failed(r)).toEqual(['envelope width (facade 420 cm)']);
  });

  it('a front-elevation roof (too short) fails the projected rise and leaves the footprint uncovered', async () => {
    const p = productionSpec(specs.get('world_ruko_roof')!), v = p.world.envelope;
    const r = await submit('world_ruko_roof', await canvasPng(p.canvas.width, p.canvas.height, [{ ...v, y: v.y + 200, height: v.height - 200 }]));
    expect(failed(r)).toEqual(expect.arrayContaining(['envelope top (projected rise 252 cm above the eave)', 'roof hides the 420×360 cm footprint']));
  });

  it('a roof with a hole over the footprint fails coverage even with a perfect outline', async () => {
    const p = productionSpec(specs.get('world_warkop_roof')!), v = p.world.envelope;
    const r = await submit('world_warkop_roof', await canvasPng(p.canvas.width, p.canvas.height, [v], [{ x: 400, y: 200, width: 200, height: 120 }]));
    expect(failed(r)).toEqual(['roof hides the 600×420 cm footprint']);
  });

  it('the flat awning of the old (projection-less) envelope fails the new awning contract', async () => {
    const p = productionSpec(specs.get('world_ruko_awning')!);
    const r = await submit('world_ruko_awning', await canvasPng(p.canvas.width, p.canvas.height, [{ x: 16, y: 24, width: 640, height: 60 }]));
    expect(failed(r)).toEqual(expect.arrayContaining(['envelope bottom (on the pivot line)']));
  });

  it('A1: a warkop front with its outer posts centred on ±300 (painted 616 cm) still fails; posts flush at ±300 pass', async () => {
    const p = productionSpec(specs.get('world_warkop_open')!), v = p.world.envelope, cx = p.pivot.x;
    const post = (dx: number) => ({ x: cx + (dx - 8) * 2, y: v.y, width: 32, height: v.height });
    const fascia = { x: v.x, y: v.y, width: v.width, height: 100 }, interior = { x: v.x + 40, y: v.y + 100, width: v.width - 80, height: v.height - 100 };
    const old = await submit('world_warkop_open', await canvasPng(p.canvas.width, p.canvas.height, [fascia, interior, ...[-300, -100, 100, 300].map(post)]));
    // ±308 cm reaches the canvas edge: wrong width, and through the transparent rim
    expect(failed(old)).toEqual(expect.arrayContaining(['envelope width (facade 600 cm)', 'transparent edge padding']));
    const a1 = await submit('world_warkop_open', await canvasPng(p.canvas.width, p.canvas.height, [fascia, interior, ...[-292, -100, 100, 292].map(post)]));
    expect(a1.errors).toEqual([]);
  });

  it('A1: a 184 cm counter no longer fits its 176 cm bay (it would cover the posts); 176 and slightly narrower pass', async () => {
    const p = productionSpec(specs.get('world_warkop_counter')!), v = p.world.envelope;
    const wide = await submit('world_warkop_counter', await canvasPng(p.canvas.width, p.canvas.height, [{ ...v, x: v.x - 8, width: v.width + 16 }]));
    expect(failed(wide)).toEqual(['stays between its bay posts (max 0 cm past the envelope sides)']);
    expect((await submit('world_warkop_counter', await perfect('world_warkop_counter'))).errors).toEqual([]);
    const narrow = await submit('world_warkop_counter', await canvasPng(p.canvas.width, p.canvas.height, [{ ...v, x: v.x + 6, width: v.width - 12 }]));
    expect(narrow.errors).toEqual([]);
  });

  it('art in the 1 px/cm TEMP frame is refused: HD canvas required', async () => {
    const e = specs.get('world_house_large')!;
    const r = await submit('world_house_large', await canvasPng(e.spec.canvas.width, e.spec.canvas.height, [{ x: 8, y: 12, width: 600, height: 280 }]));
    expect(failed(r)).toContain('canvas size');
  });

  it('art touching the transparent rim fails the padding check', async () => {
    const p = productionSpec(specs.get('world_warkop_counter')!);
    const r = await submit('world_warkop_counter', await canvasPng(p.canvas.width, p.canvas.height, [p.world.envelope, { x: 0, y: 100, width: 20, height: 20 }]));
    expect(failed(r)).toContain('transparent edge padding');
  });

  it('metadata: missing worldLayer, wrong role, misreported measurements, upscaling and the old spec version all fail', async () => {
    const png = await perfect('world_house_large_roof');
    expect(failed(await submit('world_house_large_roof', png, { worldLayer: null }))).toEqual(['world layer metadata schema']);
    expect(failed(await submit('world_house_large_roof', png, { worldLayer: { role: 'front' } }))).toEqual(['worldLayer matches spec (batch, role, archetype, contract)']);
    expect(failed(await submit('world_house_large_roof', png, { worldLayer: { measuredEnvelopePx: { x: 16, y: 24, width: 1280, height: 540 } } }))).toEqual(['reported measuredEnvelopePx matches the pixels']);
    expect(failed(await submit('world_house_large_roof', png, { worldLayer: { fit: { uniformScale: 1.4, upscaled: true, nonuniform: false } } }))).toEqual(expect.arrayContaining(['world layer metadata schema', 'no upscaling of the source']));
    expect(failed(await submit('world_house_large_roof', png, { specVersion: '0.1.0' }))).toEqual(['metadata.specVersion matches spec']);
  });

  it('non-image files are refused anywhere in the submission, including review sub-folders', async () => {
    const r = await submit('world_warkop_bench', await perfect('world_warkop_bench'), { extraFiles: { 'review/index.html': '<html></html>', 'review/notes.md': 'ok' } });
    expect(failed(r)).toEqual(['only png/webp/json/md files']);
  });

  it('a world TEMP spec without a production block refuses art with an explicit reason', async () => {
    const dir = join(tmp, 'temp-only', 'world_tree', 'v001');
    mkdirSync(dir, { recursive: true });
    const r = await validateSubmission({ assetId: 'world_tree', version: 'v001', dir }, specs);
    expect(failed(r)).toEqual(['spec accepts art submissions']);
    expect(r.errors.join()).toMatch(/no production block/);
  });

  it('a layer reviewed without its siblings gets a warning (assembled review of seams and eave joins)', async () => {
    const r = await submit('world_ruko', await perfect('world_ruko'), { worldLayer: { layerSet: [] } });
    expect(r.errors).toEqual([]);
    expect(r.warnings.join()).toMatch(/not reviewed together with this one: world_ruko_roof, world_ruko_awning/);
  });

  it('fit-to-spec never stretches a wrongly proportioned source: the result still fails, and it refuses to upscale', async () => {
    const raw = join(tmp, 'raw-squat.png');
    await sharp(await canvasPng(1000, 400, [{ x: 10, y: 10, width: 980, height: 380 }])).toFile(raw);   // too squat for a 420×480 ruko
    const out = join(tmp, 'fit-squat.png');
    execFileSync('node', ['scripts/fit-to-spec.mjs', raw, 'world_ruko', out], { encoding: 'utf8', stdio: 'pipe' });
    const r = await submit('world_ruko', readFileSync(out));
    expect(failed(r)).toContain('envelope top (480 cm high)');
    const tiny = join(tmp, 'raw-tiny.png');
    await sharp(await canvasPng(220, 140, [{ x: 5, y: 5, width: 210, height: 135 }])).toFile(tiny);
    const out2 = join(tmp, 'fit-tiny.png');
    const log = execFileSync('node', ['scripts/fit-to-spec.mjs', tiny, 'world_house_small', out2], { encoding: 'utf8', stdio: 'pipe' });
    expect(log).toMatch(/"uniformScale":1,"upscaled":false/);
    expect(failed(await submit('world_house_small', readFileSync(out2)))).toEqual(expect.arrayContaining(['envelope width (facade 420 cm)', 'envelope top (270 cm high)']));
  });
});

describe('multi-asset world production branches', () => {
  const files = (ids: string[]) => ids.flatMap((id) => [`art/submissions/${id}/v002/${id}_v002.png`, `art/source/${id}/v002/raw.png`]);
  it('a G1 world branch may change every G1 layer, each in its own versioned folder', () => {
    expect(ownershipViolations('codex/art/world-g1-r2', files(G1))).toEqual([]);
    expect(ownershipViolations('codex/art/g1-1-production-r1', [...files(G1), 'art/submissions/world_house_small/v001/review/README.md'])).toEqual([]);
  });
  it('and nothing else: room assets, TEMP-only world specs, specs, runtime, approved art or code', () => {
    for (const f of ['art/submissions/prop_bed_zila/v002/x.png', 'art/submissions/world_tree/v001/x.png', 'specs/world/props/world_ruko.json',
      'public/assets/manifest.json', 'art/approved/world_ruko/world_ruko_v001.png', 'src/main.ts', 'art/submissions/world_ruko/latest/x.png']) {
      expect(ownershipViolations('codex/art/world-g1-r2', [f]), f).toHaveLength(1);
    }
    expect(ownershipViolations('codex/art/world-g9-r1', [])).toEqual(['no world production specs belong to batch G9']);
  });
  it('single-asset world branches still work, and room batch branches cannot touch world layers', () => {
    expect(ownershipViolations('codex/art/world_ruko_roof-v002', files(['world_ruko_roof']))).toEqual([]);
    expect(ownershipViolations('codex/art/batch-b-r3', files(['world_ruko']))).toHaveLength(2);
    expect(ownershipViolations('codex/art/world-g1', [])).toHaveLength(1);   // malformed
  });
});

describe('approved assets are unaffected', () => {
  it('all 20 approved submissions still pass technical validation unchanged', async () => {
    const approved = Object.entries((manifest as any).assets).filter(([, e]: any) => e.status === 'approved');
    expect(approved).toHaveLength(20);
    for (const [id, e] of approved as [string, any][]) {
      const s = listSubmissions().find((q: any) => q.assetId === id && q.version === e.version);
      expect(s, id).toBeTruthy();
      expect(specs.get(id)!.scope).toBe('room');
      const r = await validateSubmission(s, specs);
      expect(r.errors, id).toEqual([]);
    }
  }, 120_000);
});
