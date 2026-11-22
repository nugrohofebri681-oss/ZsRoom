import { expect, test, type Page } from '@playwright/test';
import { boot, closeDialogue, dimsumShift, state, until, useDoor, zoneOrigin } from './helpers';

const S = (p: Page): Promise<any> => state(p);
const OUT = 'docs/reviews/world01';

test.describe('World 01 P2', () => {
  test.setTimeout(240_000);

  test('workplace (dimsum, registry default): cashier duty — 3 orders taken, sent to the kitchen, handed over and paid', async ({ page, isMobile }) => {
    const errors = await boot(page, '?fresh&fast&room=workplace');
    expect((await S(page)).variant).toBe('dimsum');
    expect((await S(page)).npcs.find((n: any) => n.id === 'npc_dimsum_customer').visible).toBe(false);   // no customer before the shift
    await dimsumShift(page, isMobile, `${OUT}/desktop-14-workplace-dimsum-cashier.png`);
    expect((await S(page)).vars).toMatchObject({ shift: 'done', ordersDone: 3 });
    await useDoor(page, isMobile, 'exit', 'batuphat_street');        // the shared door still leads to the street
    expect(errors).toEqual([]);
  });

  test('the office variant stays available as a switchable placeholder (QA preview)', async ({ page }) => {
    await boot(page, '?fresh&room=workplace&variant=office');
    expect((await S(page)).variant).toBe('office');
  });

  test('adaptive render resolution steps down when frames are slow, the game stays playable, and the Display setting persists', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'emulated Android only (native render scale 2)');
    const errors = await boot(page, '?fresh&fast&adaptive&room=batuphat_street');
    if ((await S(page)).modal) await closeDialogue(page, isMobile);
    await page.evaluate(() => (window as any).__ZS.setVars({ phase: 'night' }));
    expect((await S(page)).renderScale.scale).toBe(2);
    await until(page, 's.renderScale.scale < 2', 40_000);                // headless software rendering is slow → auto step-down
    const scaled = (await S(page)).renderScale.scale;
    // still playable after the change: tap-to-move arrives
    const o = zoneOrigin('batuphat_street');                              // P5: the street is a zone of the outdoor region
    await page.evaluate(([x0, y0]) => { const z = (window as any).__ZS; z.teleport(x0 + 600, y0 + 300); z.tapWorld(x0 + 900, y0 + 300); }, [o.x, o.y] as const);
    await until(page, 's.path === 0', 15000);
    expect(Math.abs((await S(page)).player.x - o.x - 900)).toBeLessThan(30);
    // player picks Sharp in the settings panel → full resolution, remembered after reload
    const g0 = await page.evaluate(() => (window as any).__ZS_UI.sound());
    await page.touchscreen.tap(g0.button.x, g0.button.y);
    const g = await page.evaluate(() => (window as any).__ZS_UI.sound());
    await page.touchscreen.tap(g.quality.x, g.quality.y);                 // Auto → Sharp
    await until(page, "s.renderScale.mode === 'sharp' && s.renderScale.scale === 2");
    // Sharp → Smooth (render scale exactly 1): the canvas must still fill the screen and the HUD stay on it
    // (regression: at scale 1 the canvas kept its old, larger CSS size and the E button went off-screen)
    let g2 = await page.evaluate(() => (window as any).__ZS_UI.sound());
    if (!g2.open) { await page.touchscreen.tap(g2.button.x, g2.button.y); g2 = await page.evaluate(() => (window as any).__ZS_UI.sound()); }
    await page.touchscreen.tap(g2.quality.x, g2.quality.y);
    await until(page, "s.renderScale.mode === 'smooth' && s.renderScale.scale === 1");
    const fit = await page.evaluate(() => { const c = (window as any).__ZS_GAME.canvas as HTMLCanvasElement, r = c.getBoundingClientRect(); return { w: r.width, h: r.height, vw: innerWidth, vh: innerHeight }; });
    expect(Math.abs(fit.w - fit.vw)).toBeLessThan(2); expect(Math.abs(fit.h - fit.vh)).toBeLessThan(2);
    // …and touches map to the right game pixel (a tap on the E button must hit it, not the ground at half the position)
    const map = await page.evaluate(() => { const g = (window as any).__ZS_GAME; return { ds: g.scale.displayScale.x, expected: g.scale.width / g.canvas.getBoundingClientRect().width }; });
    expect(Math.abs(map.ds - map.expected)).toBeLessThan(0.01);
    await page.evaluate(() => (window as any).__ZS_GAME.registry.get('renderScale').setMode('sharp'));   // back to Sharp (persisted below)
    await until(page, "s.renderScale.mode === 'sharp'");
    await page.goto('/?fast&adaptive'); await page.waitForFunction(() => (window as any).__ZS?.state?.());
    await until(page, "s.renderScale.mode === 'sharp' && s.renderScale.scale === 2");
    expect(scaled).toBeLessThan(2);
    expect(errors).toEqual([]);
  });

  test('device benchmark mode runs its tour and produces a result', async ({ page, isMobile }) => {
    test.skip(isMobile, 'one run is enough');
    test.setTimeout(120_000);
    await page.goto('/?fresh&bench'); await page.waitForFunction(() => (window as any).__ZS_BENCH, null, { timeout: 110_000 });
    const r = await page.evaluate(() => (window as any).__ZS_BENCH);
    expect(r.rows.length).toBeGreaterThanOrEqual(4);
    for (const row of r.rows) { expect(row.avgFps).toBeGreaterThan(0); expect(row.frames).toBeGreaterThan(5); }
    expect(r.gpu).toBeTruthy();
  });
});
