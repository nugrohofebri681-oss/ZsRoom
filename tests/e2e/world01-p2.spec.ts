import { expect, test, type Page } from '@playwright/test';
import { boot, closeDialogue, dimsumShift, state, until, useDoor } from './helpers';

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
    await page.evaluate(() => { const z = (window as any).__ZS; z.teleport(600, 300); z.tapWorld(900, 300); });
    await until(page, 's.path === 0', 15000);
    expect(Math.abs((await S(page)).player.x - 900)).toBeLessThan(30);
    // player picks Sharp in the settings panel → full resolution, remembered after reload
    const g0 = await page.evaluate(() => (window as any).__ZS_UI.sound());
    await page.touchscreen.tap(g0.button.x, g0.button.y);
    const g = await page.evaluate(() => (window as any).__ZS_UI.sound());
    await page.touchscreen.tap(g.quality.x, g.quality.y);                 // Auto → Sharp
    await until(page, "s.renderScale.mode === 'sharp' && s.renderScale.scale === 2");
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
