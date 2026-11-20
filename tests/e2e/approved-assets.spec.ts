import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { boot, SHOTS, state, teleport } from './helpers';

test.describe('approved asset regression', () => {
  test('approved bed and nightstand render from checksum-verified runtime textures', async ({ page, isMobile }) => {
    const errors = await boot(page);
    const tex = await page.evaluate(() => {
      const g = (window as any).__ZS_GAME;
      if (!g.textures.exists('asset:prop_bed_zila')) return null;
      const img = g.textures.get('asset:prop_bed_zila').getSourceImage();
      return { w: img.width, h: img.height };
    });
    expect(tex, 'approved texture loaded instead of grey-box').not.toBeNull();
    const ns = await page.evaluate(() => {
      const g = (window as any).__ZS_GAME;
      if (!g.textures.exists('asset:prop_nightstand_zila')) return null;
      const img = g.textures.get('asset:prop_nightstand_zila').getSourceImage();
      return { w: img.width, h: img.height };
    });
    expect(ns, 'approved nightstand texture loaded').not.toBeNull();
    expect(ns!.w / tex!.w).toBeCloseTo(160 / 384, 2); // same density variant for both furniture pieces
    // HD (2 px/cm) = 384x576, SD (1 px/cm) = 192x288 — both must map to the same world size.
    expect([384, 192]).toContain(tex!.w);
    expect(tex!.h / tex!.w).toBeCloseTo(576 / 384);
    await teleport(page, 194, 102);
    await page.waitForTimeout(200);
    const s = await state(page);
    expect(s.nearest).toMatch(/^prop_bed_zila#\d+:rest$/);
    expect(s.props.some((p) => p.key.startsWith('prop_nightstand_zila#'))).toBe(true);
    await page.screenshot({ path: `${SHOTS}/${isMobile ? 'mobile' : 'desktop'}-06-approved-bed.png` });
    await teleport(page, 300, 250);   // stand clear so the approved furniture set is fully visible
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SHOTS}/${isMobile ? 'mobile' : 'desktop'}-07-furniture-set.png` });
    expect(errors).toEqual([]);
  });

  test('approved wardrobe renders, collides and still changes outfits', async ({ page, isMobile }) => {
    const errors = await boot(page);
    const w = await page.evaluate(() => {
      const g = (window as any).__ZS_GAME;
      if (!g.textures.exists('asset:prop_wardrobe_zila')) return null;
      const img = g.textures.get('asset:prop_wardrobe_zila').getSourceImage();
      return { w: img.width, h: img.height };
    });
    expect(w, 'approved wardrobe texture loaded').not.toBeNull();
    expect(w!.h / w!.w).toBeCloseTo(544 / 272, 2);
    const s: any = await state(page);
    expect(s.props.find((p: any) => p.key.startsWith('prop_wardrobe_zila#')).art).toBe('approved');
    // every prop renders exactly as the manifest says: approved art if approved, TEMP otherwise
    const manifest = JSON.parse(readFileSync('public/assets/manifest.json', 'utf8'));
    for (const p of s.props) {
      const id = p.key.split('#')[0];
      expect(p.art, id).toBe(manifest.assets[id]?.status === 'approved' ? 'approved' : 'temp');
    }
    await teleport(page, 640, 94);                                   // wardrobe interaction spot
    await page.waitForTimeout(200);
    expect((await state(page)).nearest).toMatch(/^prop_wardrobe_zila#\d+:outfit$/);
    if (!isMobile) {
      await page.keyboard.down('ArrowUp'); await page.waitForTimeout(600); await page.keyboard.up('ArrowUp');
      expect((await state(page)).player.y).toBeGreaterThanOrEqual(64 + 16 - 0.5);   // stops at the wardrobe front
    }
    await teleport(page, 560, 260);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/${isMobile ? 'mobile' : 'desktop'}-09-approved-wardrobe.png` });
    expect(errors).toEqual([]);
  });

  test('nightstand blocks movement and has its own interaction', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop only');
    await boot(page);
    await teleport(page, 202, 72);   // standing at the nightstand's front (collision ends at y 52 + radius 16)
    await page.waitForTimeout(150);
    expect((await state(page)).nearest).toMatch(/^prop_nightstand_zila#\d+:nightstand$/);
    await page.keyboard.down('ArrowUp'); await page.waitForTimeout(1200); await page.keyboard.up('ArrowUp');
    expect((await state(page)).player.y).toBeGreaterThanOrEqual(52 + 16 - 0.5);
  });
});

test.describe('all approved assets together', () => {
  test('every approved texture loads at the device density and the room shows them together', async ({ page, isMobile }) => {
    const errors = await boot(page);
    const manifest = JSON.parse(readFileSync('public/assets/manifest.json', 'utf8'));
    const approved = Object.entries(manifest.assets).filter(([, e]: any) => e.status === 'approved').map(([id]) => id);
    const loaded = await page.evaluate((ids) => ids.map((id: string) => (window as any).__ZS_GAME.textures.exists('asset:' + id)), approved);
    expect(loaded.every(Boolean), approved.filter((_, i) => !loaded[i]).join(',')).toBe(true);
    const s: any = await state(page);
    expect(s.props.filter((p: any) => p.art === 'approved').length).toBe(approved.length);
    await teleport(page, 420, 300);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/${isMobile ? 'mobile' : 'desktop'}-10-all-approved.png` });
    expect(errors).toEqual([]);
  });
});
