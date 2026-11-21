import { expect, test, type Page } from '@playwright/test';
import { boot, closeDialogue, holdUntil, roomData, state, until, useDoor } from './helpers';

/**
 * P5 — outdoor region. Zila's front yard and Batuphat street are ONE exterior map (`batuphat_region`): from the
 * doorstep through the yard and the gate to the shops there is no scene restart and no fade, while the camera
 * follows over a district larger than the screen. Interiors and distant districts still use transitions.
 */
const S = (p: Page): Promise<any> => state(p);
const OUT = 'docs/reviews/world01-p5';
const REGION = 'batuphat_region';
const YARD = { x: 2400, y: 0 }, STREET = { x: 2400, y: 700 };          // zone origins (src/data/regions/batuphat_region.json)

/** Tap-to-move to a ground point; a story popup on the way (first street visit) is closed and the walk resumed. */
async function walkTo(page: Page, isMobile: boolean, x: number, y: number): Promise<void> {
  for (let i = 0; i < 4; i++) {
    await page.evaluate(([a, b]) => (window as any).__ZS.tapWorld(a, b), [x, y]);
    await until(page, 's.path === 0 || s.modal', 25000);
    if (!(await S(page)).modal) { await page.waitForTimeout(200); if (!(await S(page)).modal) return; }
    await closeDialogue(page, isMobile);
  }
}

test.describe('P5 outdoor region (Phase A: yard + Batuphat street)', () => {
  test.setTimeout(240_000);

  test('house front door → just outside the facade, then doorstep → yard → gate → street → Indomaret front with zero scene restarts and a scrolling camera', async ({ page, isMobile }) => {
    const errors = await boot(page, '?fresh&fast&room=living_room');
    await page.evaluate(() => (window as any).__ZS.setVars({ phase: 'afternoon' }));
    await useDoor(page, isMobile, 'front_door', 'front_yard');
    const s0 = await S(page);
    expect(s0.roomId).toBe(REGION); expect(s0.zone).toBe('front_yard');
    const fromHouse = roomData('front_yard').spawns.from_house;
    expect(s0.player).toMatchObject({ x: YARD.x + fromHouse.x, y: YARD.y + fromHouse.y });         // right outside the house door
    const houseDoor = await page.evaluate(() => (window as any).__ZS.doorSpot('house_door'));
    expect(Math.abs(houseDoor.x - s0.player.x)).toBeLessThan(80);
    await page.screenshot({ path: `${OUT}/${isMobile ? 'android' : 'desktop'}-01-doorstep.png` });

    // sample the walk: world position continuous, camera moving, never transitioning
    const xs: number[] = [], ys: number[] = [], cams: [number, number][] = [];
    let sampling = true;
    const sampler = (async () => {
      while (sampling) {
        const s = await S(page).catch(() => null);
        if (s) { xs.push(s.player.x); ys.push(s.player.y); cams.push([s.camera.scrollX, s.camera.scrollY]); expect(s.transitioning).toBe(false); expect(s.roomId).toBe(REGION); }
        await page.waitForTimeout(100);
      }
    })();
    await walkTo(page, isMobile, YARD.x + 450, YARD.y + 600);                                      // across the yard to the gate
    await page.screenshot({ path: `${OUT}/${isMobile ? 'android' : 'desktop'}-02-yard-gate.png` });
    await walkTo(page, isMobile, STREET.x + 450, STREET.y + 200);                                  // through the gate onto the street
    expect((await S(page)).zone).toBe('batuphat_street');
    const shop = await page.evaluate(() => (window as any).__ZS.doorSpot('minimarket_door'));
    await walkTo(page, isMobile, shop.x, shop.y);                                                  // along the street to Indomaret
    sampling = false; await sampler;
    const s1 = await S(page);
    await page.screenshot({ path: `${OUT}/${isMobile ? 'android' : 'desktop'}-03-indomaret-front.png` });
    expect(s1.sceneStarts).toBe(s0.sceneStarts);                                                   // no restart after leaving the house
    expect(s1.nearest).toBe('door:minimarket_door');
    expect(s1.visited).toEqual(expect.arrayContaining(['front_yard', 'batuphat_street']));
    for (let i = 1; i < xs.length; i++) expect(Math.hypot(xs[i]! - xs[i - 1]!, ys[i]! - ys[i - 1]!)).toBeLessThan(160);  // no teleports (?fast walk ≈ 90 cm per sample)
    for (let i = 1; i < cams.length; i++) expect(Math.hypot(cams[i]![0] - cams[i - 1]![0], cams[i]![1] - cams[i - 1]![1])).toBeLessThan(220);  // no camera snaps
    // the camera really followed: it scrolled east with her and down from the yard to the street
    expect(s1.camera.scrollX - s0.camera.scrollX).toBeGreaterThan(400);
    expect(s1.camera.scrollY - s0.camera.scrollY).toBeGreaterThan(60);
    expect(errors).toEqual([]);
  });

  test('world larger than the viewport: wide exterior framing, no auto-fit of the district, manual zoom still works', async ({ page, isMobile }) => {
    await boot(page, '?fresh&fast&room=front_yard');
    const s = await S(page);
    expect(s.roomId).toBe(REGION);
    expect(s.bbox.w).toBeGreaterThan(s.camera.viewW + 300);                                       // she must walk to see the rest
    const share = await page.evaluate(() => (165 * (window as any).__ZS.state().zoom) / (window as any).__ZS_GAME.scale.height);
    if (isMobile) { expect(share).toBeGreaterThanOrEqual(0.16); expect(share).toBeLessThanOrEqual(0.24); }
    else { expect(share).toBeGreaterThanOrEqual(0.12); expect(share).toBeLessThanOrEqual(0.18); }
    await page.evaluate(() => (window as any).__ZS.zoomBy(0.3));
    await page.waitForTimeout(200);
    expect((await S(page)).camera.viewW).toBeLessThan(s.camera.viewW - 200);
  });

  test('fences and the void are solid; the gate is the only way through the yard front', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard');
    await boot(page, '?fresh&fast&room=front_yard');
    await page.evaluate(([x, y]) => (window as any).__ZS.teleport(x, y), [YARD.x + 200, 600]);   // yard, west of the gate
    await page.keyboard.down('ArrowDown'); await page.waitForTimeout(1200); await page.keyboard.up('ArrowDown');
    let s = await S(page);
    expect(s.zone).toBe('front_yard'); expect(s.player.y).toBeLessThan(686);
    await page.evaluate(([x, y]) => (window as any).__ZS.teleport(x, y), [YARD.x + 450, 620]);   // in front of the gate
    await holdUntil(page, 'ArrowDown', `s.zone === 'batuphat_street'`);
    if ((await S(page)).modal) await closeDialogue(page, false);
    await page.evaluate(([x, y]) => (window as any).__ZS.teleport(x, y), [STREET.x + 1500, STREET.y + 100]);   // street, east of the yard
    await page.keyboard.down('ArrowUp'); await page.waitForTimeout(1200); await page.keyboard.up('ArrowUp');
    s = await S(page);
    expect(s.player.y).toBeGreaterThanOrEqual(STREET.y + 10);                                     // the shop row is a wall, not a walkway
    await page.evaluate(([x, y]) => (window as any).__ZS.teleport(x, y), [YARD.x + 950, 300]);   // yard, by the east fence
    await page.keyboard.down('ArrowRight'); await page.waitForTimeout(1000); await page.keyboard.up('ArrowRight');
    expect((await S(page)).player.x).toBeLessThan(YARD.x + 1000 - 15);
  });

  test('shops, workplace and the district road keep proper transitions with exact return spawns; no leaks after repeated trips', async ({ page, isMobile }) => {
    const errors = await boot(page, '?fresh&fast&room=batuphat_street');
    if ((await S(page)).modal) await closeDialogue(page, isMobile);
    const street = roomData('batuphat_street').spawns;
    let tex0 = 0;
    for (let i = 0; i < 4; i++) {
      await useDoor(page, isMobile, 'minimarket_door', 'minimarket');
      await useDoor(page, isMobile, 'exit', REGION);
      const s = await S(page);
      expect(s.zone).toBe('batuphat_street');
      expect(s.player).toMatchObject({ x: STREET.x + street.from_minimarket.x, y: STREET.y + street.from_minimarket.y });
      if (i === 0) tex0 = s.generatedTextures.count;
      else expect(s.generatedTextures.count).toBeLessThanOrEqual(tex0);                            // nothing piles up
    }
    await useDoor(page, isMobile, 'workplace_door', 'workplace');
    await useDoor(page, isMobile, 'exit', REGION);
    expect((await S(page)).player).toMatchObject({ x: STREET.x + street.from_workplace.x, y: STREET.y + street.from_workplace.y });
    await useDoor(page, isMobile, 'road_east', 'lhokseumawe_road');
    await useDoor(page, isMobile, 'to_batuphat_street', REGION);
    expect((await S(page)).player).toMatchObject({ x: STREET.x + street.from_lhokseumawe_road.x, y: STREET.y + street.from_lhokseumawe_road.y });
    expect(errors).toEqual([]);
  });

  test('old v3 saves in front_yard / batuphat_street reload at the matching region position; flags, visited and lights survive', async ({ page }) => {
    const seed = (save: object) => page.addInitScript((sv) => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('zsroom.save', JSON.stringify(sv)); } }, save);
    await seed({ version: 3, savedAt: new Date().toISOString(), roomId: 'batuphat_street', visited: ['zila_bedroom', 'front_yard', 'batuphat_street', 'minimarket'],
      player: { characterId: 'char_zila', x: 1420, y: 60, facing: 'N', outfit: 'default' }, flags: { 'event:ev_street_first_visit': true, 'light:zila_bedroom:prop_lamp_zila#17': true }, vars: { phase: 'night', day: 3 } });
    await page.goto('/'); await page.waitForFunction(() => (window as any).__ZS?.state?.());
    const s = await S(page);
    expect(s.roomId).toBe(REGION); expect(s.zone).toBe('batuphat_street');
    // P4 stood in front of Indomaret's door (x 1420); the shop moved 400 cm east in the region → still in front of it
    expect(s.player).toMatchObject({ x: STREET.x + 1420 + 400, y: STREET.y + 60 });
    expect(s.nearest).toBe('door:minimarket_door');
    expect(s.vars.day).toBe(3);
    expect(s.visited).toEqual(expect.arrayContaining(['front_yard', 'batuphat_street', 'minimarket', REGION]));
    expect(s.flagsState['light:zila_bedroom:prop_lamp_zila#17']).toBe(true);
  });
});
