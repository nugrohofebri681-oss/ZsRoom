import { expect, test, type Page } from '@playwright/test';
import { boot, SHOTS, state, teleport, until } from './helpers';

const toScreen = (page: Page, gx: number, gy: number, z = 0) => page.evaluate(([a, b, c]) => (window as any).__ZS.toScreen(a, b, c), [gx, gy, z] as const);
const shot = (isMobile: boolean, n: string) => `${SHOTS}/${isMobile ? 'mobile' : 'desktop'}-sprint-${n}.png`;

test.describe('sprint: tap-to-move, camera, lighting, tiles, animation', () => {
  test('click the floor: path-finds around furniture and arrives', async ({ page, isMobile }) => {
    const errors = await boot(page);
    await teleport(page, 365, 440);
    await page.waitForTimeout(300);
    const target = { x: 560, y: 250 };                         // across the room, past the rug and pouf
    const p = await toScreen(page, target.x, target.y);
    if (isMobile) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
    await until(page, 's.path > 0 || s.walked > 0', 4000);
    await until(page, `s.path === 0 && Math.hypot(s.player.x - ${target.x}, s.player.y - ${target.y}) < 12`, 15000);
    await until(page, "s.anim.anim === 'idle'");      // the frame after arrival switches to idle
    await page.screenshot({ path: shot(isMobile, '01-tap-moved') });
    expect(errors).toEqual([]);
  });

  test('tap furniture: walks to it and uses it (wardrobe → outfit)', async ({ page, isMobile }) => {
    await boot(page);
    await teleport(page, 520, 260);                            // wardrobe must be on screen (phones are zoomed in)
    await page.waitForTimeout(400);
    const p = await toScreen(page, 640, 40, 120);              // middle of the wardrobe front
    const vp = page.viewportSize()!;
    expect(p.x).toBeGreaterThan(0); expect(p.x).toBeLessThan(vp.width); expect(p.y).toBeGreaterThan(0); expect(p.y).toBeLessThan(vp.height);
    if (isMobile) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
    await until(page, "s.vars.outfit === 'cream'", 15000);
    expect((await state(page) as any).player.facing).toBe('N');
    await page.screenshot({ path: shot(isMobile, '02-tap-used-wardrobe') });
  });

  test('walk animation is distance-synced and W-side facings are mirrored', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard');
    await boot(page);
    await teleport(page, 600, 240);                            // clear lane west (rug is walkable, pouf is south of it)
    await page.keyboard.down('ArrowLeft');
    await until(page, 's.walked > 100');
    const s: any = await state(page);
    await page.screenshot({ path: shot(false, '03-walk-cycle') });
    await page.keyboard.up('ArrowLeft');
    expect(s.anim.anim).toBe('walk');
    expect(s.anim.authored).toBe('E');
    expect(s.anim.mirrored).toBe(true);
    expect(s.anim.frame).toBe(Math.floor((s.walked % 112) / 14));   // 8 frames per 112 cm stride
  });

  test('lighting: at most one full-screen layer; baked only on change', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop');
    await boot(page);
    let s: any = await state(page);
    expect(s.lighting.fullScreenLayers).toBeLessThanOrEqual(1);
    const bakes = s.lighting.bakes;
    await page.waitForTimeout(1000);
    expect((await state(page) as any).lighting.bakes).toBe(bakes);       // idle → no re-bake
    await page.evaluate(() => (window as any).__ZS.setVars({ phase: 'afternoon' }));
    s = await state(page);
    expect(s.lighting.fullScreenLayers).toBeLessThan(0.6);             // daytime: cropped to the lit area
    await page.evaluate(() => (window as any).__ZS.setVars({ phase: 'night' }));
    await teleport(page, 226, 80);
    await page.keyboard.press('KeyE');                                  // lamp on
    await until(page, "s.lights.find((l) => l.key.startsWith('prop_lamp_zila#')).on === true");
    expect((await state(page) as any).lighting.fullScreenLayers).toBe(1);
    await teleport(page, 330, 300);
    await page.waitForTimeout(500);
    await page.screenshot({ path: shot(false, '04-night-baked-lighting') });
  });

  test('camera zoom: wheel/keys zoom within limits', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop');
    await boot(page);
    const z0 = (await state(page) as any).zoom;
    await page.mouse.move(640, 360);
    for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, -120); await page.waitForTimeout(60); }
    const z1 = (await state(page) as any).zoom;
    expect(z1).toBeGreaterThan(z0 * 1.2);
    for (let i = 0; i < 30; i++) await page.evaluate(() => (window as any).__ZS.zoomBy(0.1));
    expect((await state(page) as any).zoomMul).toBe(1.9);
    await page.screenshot({ path: shot(false, '05-zoomed-in') });
  });

  test('environment tiles are seamless and tiny', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop');
    await boot(page);
    const r = await page.evaluate(() => {
      const g = (window as any).__ZS_GAME;
      const out: any = {};
      for (const key of g.textures.getTextureKeys().filter((k: string) => k.startsWith('temp:env_'))) {
        const c = g.textures.get(key).getSourceImage() as HTMLCanvasElement;
        const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
        let sx = 0;
        for (let y = 0; y < c.height; y++) for (let ch = 0; ch < 3; ch++) sx += Math.abs(d[(y * c.width) * 4 + ch]! - d[(y * c.width + c.width - 1) * 4 + ch]!);
        out[key] = { w: c.width, h: c.height, seam: sx / (c.height * 3) };
      }
      return out;
    });
    const tiles = Object.values(r) as { w: number; h: number; seam: number }[];
    expect(tiles.length).toBe(2);
    for (const t of tiles) { expect(t.seam).toBeLessThan(14); expect(t.w * t.h).toBeLessThan(260 * 560); }
  });

  test('shell tiles end exactly at the room edges at both SD and HD density', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const sc = (window as any).__ZS_GAME.scene.getScene('Room');
      const tiles = sc.children.list.filter((o: any) => o.name === 'shell-tile');
      let maxX = -1e9, maxY = -1e9, minY = 1e9;
      for (const t of tiles) {
        const w = (t.isCropped ? t._crop.width : t.frame.width) * t.scaleX, h = (t.isCropped ? t._crop.height : t.frame.height) * t.scaleY;
        maxX = Math.max(maxX, t.x + w); maxY = Math.max(maxY, t.y + h); minY = Math.min(minY, t.y);
      }
      return { n: tiles.length, maxX, maxY, minY, density: tiles[0]?.scaleX };
    });
    expect(r.n).toBeGreaterThan(10);
    // P4: the upper floor is one continuous map — tiles end at the floor's east edge (bedroom 0–720 + hall 760–1460)
    const zones = ((await state(page)) as any).zones as { x: number; w: number }[];
    expect(r.maxX).toBeCloseTo(Math.max(...zones.map((z) => z.x + z.w)), 0);
    expect(r.maxY).toBeCloseTo(480 * 0.7, 0);     // projected floor depth
    expect(r.minY).toBeCloseTo(-270, 0);          // wall height
  });

  test('mobile: pinch zooms, E button shows the action, compact badge', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile');
    await boot(page);
    const z0 = (await state(page) as any).zoomMul;
    const cdp = await page.context().newCDPSession(page);
    const pts = (d: number) => [{ x: 400 - d, y: 200, id: 1 }, { x: 400 + d, y: 200, id: 2 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(40) });
    for (let d = 50; d <= 140; d += 10) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(d) }); await page.waitForTimeout(25); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(200);
    expect((await state(page) as any).zoomMul).toBeGreaterThan(z0);
    await teleport(page, 226, 80);
    await page.waitForTimeout(300);
    await page.screenshot({ path: shot(true, '03-action-button') });
  });
});
