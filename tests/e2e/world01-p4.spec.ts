import { expect, test, type Page } from '@playwright/test';
import { boot, closeDialogue, state, tapObject, until, useDoor, walkToZone } from './helpers';

/**
 * P4 — continuous floors + exploration camera. Same-floor rooms are ONE map: crossing an interior doorway never
 * restarts the scene (sceneStarts is unchanged), Zila's world position moves continuously, the camera pans.
 */
const S = (p: Page): Promise<any> => state(p);
const OUT = 'docs/reviews/world01-p4';

test.describe('P4 continuous floors', () => {
  test.setTimeout(240_000);

  test('upper floor: bedroom → hall → bedroom by walking, no scene change; screenshot of both rooms in one view', async ({ page, isMobile }) => {
    const errors = await boot(page, '?fresh&fast');
    const s0 = await S(page);
    expect(s0.roomId).toBe('home_upper'); expect(s0.zone).toBe('zila_bedroom');
    await walkToZone(page, 'upper_hall');
    await page.screenshot({ path: `${OUT}/${isMobile ? 'android' : 'desktop'}-10-upper-floor-in-hall.png` });
    await walkToZone(page, 'zila_bedroom');
    const s1 = await S(page);
    expect(s1.sceneStarts).toBe(s0.sceneStarts);
    expect(s1.visited).toEqual(expect.arrayContaining(['zila_bedroom', 'upper_hall']));
    expect(errors).toEqual([]);
  });

  test('zoomed in, the camera really pans across the doorway while Zila moves continuously (no hidden restart)', async ({ page }) => {
    const errors = await boot(page, '?fresh');
    await page.evaluate(() => (window as any).__ZS.zoomBy(1.1));                       // zoom in so the floor no longer fits
    await page.evaluate(() => (window as any).__ZS.teleport(600, 180));
    await page.waitForTimeout(600);
    const s0 = await S(page);
    await page.evaluate(() => (window as any).__ZS.tapWorld(1300, 180));
    const xs: number[] = [], cams: number[] = [];
    for (let i = 0; i < 80; i++) {
      const s = await S(page); xs.push(s.player.x); cams.push(s.camera.scrollX);
      if (s.path === 0 && i > 3) break;
      await page.waitForTimeout(100);
    }
    const s1 = await S(page);
    expect(s1.zone).toBe('upper_hall');
    expect(s1.sceneStarts).toBe(s0.sceneStarts);
    expect(s1.camera.scrollX - s0.camera.scrollX).toBeGreaterThan(200);                 // the view moved east with her
    for (let i = 1; i < xs.length; i++) expect(xs[i]! - xs[i - 1]!).toBeLessThan(60);  // no teleport-like jumps
    for (let i = 1; i < cams.length; i++) expect(Math.abs(cams[i]! - cams[i - 1]!)).toBeLessThan(120);   // smooth scrolling
    expect(errors).toEqual([]);
  });

  test('partition walls stay solid outside the opening', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard');
    await boot(page, '?fresh');
    await page.evaluate(() => (window as any).__ZS.teleport(680, 400));                // bedroom, below the opening (y 120–240)
    await page.keyboard.down('ArrowRight'); await page.waitForTimeout(900); await page.keyboard.up('ArrowRight');
    const s = await S(page);
    expect(s.zone).toBe('zila_bedroom');
    expect(s.player.x).toBeLessThanOrEqual(720 - 15);
  });

  test('ground floor: living room ↔ kitchen continuous, kitchen interaction works, stairs up/down and the front door still transition', async ({ page, isMobile }) => {
    const errors = await boot(page, '?fresh&fast&room=living_room');
    const s0 = await S(page);
    expect(s0.roomId).toBe('home_ground'); expect(s0.zone).toBe('living_room');
    await walkToZone(page, 'kitchen');
    await tapObject(page, 570, 40, 120, "s.vars.ingredients === 'eggs'");                // kitchen fridge (kitchen zone at x 0)
    await page.screenshot({ path: `${OUT}/${isMobile ? 'android' : 'desktop'}-11-ground-floor-kitchen.png` });
    await walkToZone(page, 'living_room');
    expect((await S(page)).sceneStarts).toBe(s0.sceneStarts);
    // floors/buildings still use transitions
    await useDoor(page, isMobile, 'stairs_up', 'upper_hall');
    expect((await S(page)).roomId).toBe('home_upper');
    await useDoor(page, isMobile, 'stairs_down', 'living_room');
    expect((await S(page)).roomId).toBe('home_ground');
    await useDoor(page, isMobile, 'front_door', 'front_yard');
    await useDoor(page, isMobile, 'gate', 'batuphat_street');
    if ((await S(page)).modal) await closeDialogue(page, isMobile);
    await useDoor(page, isMobile, 'home_gate', 'front_yard');
    await useDoor(page, isMobile, 'house_door', 'living_room');
    const back = await S(page);
    expect(back.roomId).toBe('home_ground');
    expect(back.player.x).toBe(660 + 450);                                              // living_room.from_yard on the floor
    expect(errors).toEqual([]);
  });

  test('save/reload in the hall resumes on the continuous floor; an old v3 save in upper_hall migrates its position', async ({ page }) => {
    await boot(page, '?fresh&fast');
    await walkToZone(page, 'upper_hall');
    const before = await S(page);
    await page.goto('/'); await page.waitForFunction(() => (window as any).__ZS?.state?.());
    const s = await S(page);
    expect(s.roomId).toBe('home_upper'); expect(s.zone).toBe('upper_hall');
    expect(Math.hypot(s.player.x - before.player.x, s.player.y - before.player.y)).toBeLessThan(2);
    // a save written by P3 (separate room maps) in the upstairs hall
    await page.addInitScript(() => { if (!sessionStorage.getItem('v3seed')) { sessionStorage.setItem('v3seed', '1'); localStorage.setItem('zsroom.save', JSON.stringify({ version: 3, savedAt: new Date().toISOString(), roomId: 'upper_hall', visited: ['zila_bedroom', 'upper_hall'], player: { characterId: 'char_zila', x: 300, y: 150, facing: 'W', outfit: 'default' }, flags: { 'light:zila_bedroom:prop_lamp_zila#17': true }, vars: { phase: 'night', day: 4 } })); } });
    await page.goto('/'); await page.waitForFunction(() => (window as any).__ZS?.state?.());
    const m = await S(page);
    expect(m.roomId).toBe('home_upper'); expect(m.zone).toBe('upper_hall');
    expect(m.player).toMatchObject({ x: 760 + 300, y: 150 });
    expect(m.vars.day).toBe(4);
  });

  test('exploration framing: Zila is a small share of the screen (desktop 12–18 %, phone landscape 16–24 %)', async ({ page, isMobile }) => {
    await boot(page, '?fresh');
    const share = await page.evaluate(() => (165 * (window as any).__ZS.state().zoom) / (window as any).__ZS_GAME.scale.height);
    if (isMobile) { expect(share).toBeGreaterThanOrEqual(0.16); expect(share).toBeLessThanOrEqual(0.24); }
    else { expect(share).toBeGreaterThanOrEqual(0.12); expect(share).toBeLessThanOrEqual(0.18); }
    // both upstairs rooms are on screen at once at the default zoom
    const view = (await S(page)).camera;
    expect(view.viewW).toBeGreaterThan(1460);
  });
});
