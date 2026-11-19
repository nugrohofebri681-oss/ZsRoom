// Exercises the art pipeline end-to-end on SYNTHETIC fixtures in a temp dir (never committed).
// The fixtures are test geometry, not artwork.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { beforeAll, describe, expect, it } from 'vitest';
// @ts-expect-error — plain ESM pipeline modules
import { loadSpecs, ownershipViolations, sha256File } from '../../scripts/lib.mjs';
// @ts-expect-error — plain ESM pipeline modules
import { seamDelta, validateSubmission } from '../../scripts/validate-submission.mjs';

const tmp = mkdtempSync(join(tmpdir(), 'zs-pipeline-'));
const specs = loadSpecs();

async function makeSubmission(name: string, png: Buffer, patch: Record<string, unknown> = {}) {
  const dir = join(tmp, name, 'prop_bed_zila', 'v001');
  mkdirSync(dir, { recursive: true });
  const master = join(dir, 'prop_bed_zila_v001.png');
  writeFileSync(master, png);
  const meta = {
    assetId: 'prop_bed_zila', version: 'v001', specVersion: '1.0.0', author: 'codex',
    generator: { tool: 'synthetic-test-fixture' }, createdAt: new Date().toISOString(),
    files: { master: { path: 'prop_bed_zila_v001.png', sha256: sha256File(master) } },
    provenance: 'synthetic fixture for pipeline tests', postProcessing: [], selfReview: { checklistComplete: true, knownIssues: [] },
    cost: 'none', ...patch,
  };
  writeFileSync(join(dir, 'metadata.json'), JSON.stringify(meta));
  writeFileSync(join(dir, 'prompt.md'), 'synthetic');
  return { assetId: 'prop_bed_zila', version: 'v001', dir };
}

let raw: string;
beforeAll(async () => {
  // A raw "generator output": 1024x1536 RGBA with a blocky shape on transparent background.
  const shape = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><rect x="200" y="120" width="620" height="1280" fill="#e8a0b4"/><rect x="200" y="120" width="620" height="300" fill="#8a5a3c"/></svg>`);
  raw = join(tmp, 'raw.png');
  await sharp(shape).png().toFile(raw);
});

describe('art pipeline', () => {
  it('fit-to-spec output passes technical validation', async () => {
    const fitted = join(tmp, 'fitted.png');
    execFileSync('node', ['scripts/fit-to-spec.mjs', raw, 'prop_bed_zila', fitted]);
    const sub = await makeSubmission('good', await sharp(fitted).toBuffer());
    const r = await validateSubmission(sub, specs);
    expect(r.errors).toEqual([]);
  });

  it('rejects an opaque background, wrong canvas and checksum mismatch', async () => {
    const png = await sharp({ create: { width: 512, height: 512, channels: 4, background: '#ffffff' } }).png().toBuffer();
    const sub = await makeSubmission('bad', png, { files: { master: { path: 'prop_bed_zila_v001.png', sha256: 'f'.repeat(64) } } });
    const r = await validateSubmission(sub, specs);
    const names = r.checks.filter((c: { pass: boolean }) => !c.pass).map((c: { name: string }) => c.name);
    expect(names).toEqual(expect.arrayContaining(['canvas size', 'transparent edge padding', 'master sha256 matches metadata']));
  });

  it('rejects art that floats above the pivot line', async () => {
    const png = await sharp({ create: { width: 384, height: 576, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: await sharp({ create: { width: 240, height: 300, channels: 4, background: '#e8a0b4' } }).png().toBuffer(), left: 72, top: 100 }])
      .png().toBuffer();
    const r = await validateSubmission(await makeSubmission('float', png), specs);
    expect(r.errors.join()).toMatch(/base sits on pivot line/);
  });
});

describe('ownership policy', () => {
  it('codex branch may only touch its own submission/source folders', () => {
    expect(ownershipViolations('codex/art/prop_bed_zila-v001', ['art/submissions/prop_bed_zila/v001/metadata.json', 'art/source/prop_bed_zila/v001/raw.png'])).toEqual([]);
    expect(ownershipViolations('codex/art/prop_bed_zila-v001', ['src/main.ts'])).toHaveLength(1);
    expect(ownershipViolations('codex/art/prop_bed_zila-v001', ['art/approved/prop_bed_zila/x.png'])).toHaveLength(1);
    expect(ownershipViolations('codex/art/prop_bed_zila-v001', ['art/submissions/prop_bed_zila/v002/x.png'])).toHaveLength(1);
  });
  it('batch branches may touch only their own batch assets, each in its own versioned folder', () => {
    const ok = ['art/submissions/prop_desk_zila/v001/prop_desk_zila_v001.png', 'art/source/prop_wardrobe_zila/v001/raw-a.png', 'art/submissions/prop_stool_vanity/v002/metadata.json'];
    expect(ownershipViolations('codex/art/batch-b-r1', ok)).toEqual([]);
    expect(ownershipViolations('codex/art/batch-b-r1', ['art/submissions/decal_rug_zila/v001/x.png'])).toHaveLength(1); // batch C asset
    expect(ownershipViolations('codex/art/batch-b-r1', ['art/approved/prop_desk_zila/x.png'])).toHaveLength(1);
    expect(ownershipViolations('codex/art/batch-b-r1', ['src/main.ts'])).toHaveLength(1);
    expect(ownershipViolations('codex/art/batch-z-r1', [])).toHaveLength(1);
  });
  it('rejects malformed codex branch names and non-codex submission edits', () => {
    expect(ownershipViolations('codex/bed', [])).toHaveLength(1);
    expect(ownershipViolations('claude/feature', ['art/submissions/prop_bed_zila/v001/x.png'])).toHaveLength(1);
  });
});

describe('environment tiles', () => {
  it('seam check passes a wrap-continuous tile and fails a gradient tile', async () => {
    const W = 64, H = 32;
    const smooth = Buffer.alloc(W * H * 3), ramp = Buffer.alloc(W * H * 3);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let c = 0; c < 3; c++) {
      smooth[(y * W + x) * 3 + c] = 128 + Math.round(40 * Math.sin((2 * Math.PI * x) / W) * Math.cos((2 * Math.PI * y) / H));
      ramp[(y * W + x) * 3 + c] = Math.round((x / W) * 255);
    }
    const a = join(tmp, 'seam-ok.png'), b = join(tmp, 'seam-bad.png');
    await sharp(smooth, { raw: { width: W, height: H, channels: 3 } }).png().toFile(a);
    await sharp(ramp, { raw: { width: W, height: H, channels: 3 } }).png().toFile(b);
    expect((await seamDelta(a, 'xy')).x).toBeLessThan(14);
    expect((await seamDelta(b, 'xy')).x).toBeGreaterThan(100);
  });
  it('tile specs are geometrically consistent', () => {
    const floor = specs.get('env_floor_planks_honey').spec, wall = specs.get('env_wall_bedroom').spec;
    expect(floor.canvas.width).toBe(floor.tile.widthCm * floor.density);
    expect(floor.canvas.height).toBe(Math.round(floor.tile.groundDepthCm * 0.7 * floor.density));
    expect(wall.canvas.height).toBe(wall.tile.heightCm * wall.density);
    expect(Math.max(...Object.values(wall.bandsCm as Record<string, number[]>).map((b) => b[1]!))).toBe(wall.tile.heightCm);
  });
});
