import { expect, test, type Page } from '@playwright/test';
import { boot, closeDialogue, press, spawnPos, state, until, useDoor } from './helpers';

/**
 * P6 — Batuphat is ONE explorable town (`batuphat_town`, 80 × 56 m): Zila walks from her garden through lanes, gangs,
 * the main street, the park and the south lanes to every shop front with no scene restart, along more than one
 * route, while the camera follows her both horizontally and vertically. Interiors and the city road still load.
 */
const S = (p: Page): Promise<any> => state(p);
const OUT = 'docs/reviews/world01-p6';
const TOWN = 'batuphat_town';
type Pt = [number, number];

/** Tap-to-move through waypoints; a story popup on the way is closed and the leg resumed. */
async function walk(page: Page, isMobile: boolean, pts: Pt[]): Promise<void> {
  for (const [x, y] of pts) {
    for (let i = 0; i < 5; i++) {
      await page.evaluate(([a, b]) => (window as any).__ZS.tapWorld(a, b), [x, y]);
      await until(page, 's.path === 0 || s.modal', 40000);
      await page.waitForTimeout(120);
      if (!(await S(page)).modal) break;
      await closeDialogue(page, isMobile);
    }
  }
}

/** Sample Zila's position and the camera while `fn` runs; asserts the map never restarts or transitions. */
async function sampled(page: Page, fn: () => Promise<void>): Promise<{ pos: Pt[]; cam: Pt[] }> {
  const pos: Pt[] = [], cam: Pt[] = [];
  let on = true;
  const loop = (async () => {
    while (on) {
      const s = await S(page).catch(() => null);
      if (s) { pos.push([s.player.x, s.player.y]); cam.push([s.camera.scrollX, s.camera.scrollY]); expect(s.roomId).toBe(TOWN); expect(s.transitioning).toBe(false); }
      await page.waitForTimeout(100);
    }
  })();
  await fn(); on = false; await loop;
  return { pos, cam };
}
const span = (v: number[]) => Math.max(...v) - Math.min(...v);
const smooth = (pts: Pt[], max: number) => { for (let i = 1; i < pts.length; i++) expect(Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1])).toBeLessThan(max); };
const passedThrough = (pts: Pt[], x0: number, x1: number, y0: number, y1: number) => pts.some(([x, y]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);

test.describe('P6 Batuphat town', () => {
  test.setTimeout(300_000);

  test('front door → garden, then a loop home → park → south lane → Indomaret → gang → home: no restart, camera scrolls in X and Y', async ({ page, isMobile }) => {
    const tag = isMobile ? 'android' : 'desktop';
    const errors = await boot(page, '?fresh&fast&room=living_room');
    await page.evaluate(() => (window as any).__ZS.setVars({ phase: 'afternoon', }));
    await useDoor(page, isMobile, 'front_door', 'front_yard');
    const s0 = await S(page);
    expect(s0.roomId).toBe(TOWN); expect(s0.zone).toBe('front_yard');
    expect(s0.player).toMatchObject(spawnPos('front_yard', 'from_house'));
    const hd = await page.evaluate(() => (window as any).__ZS.doorSpot('house_door'));
    expect(Math.hypot(hd.x - s0.player.x, hd.y - s0.player.y)).toBeLessThan(60);                  // right outside the house door
    await page.screenshot({ path: `${OUT}/${tag}-01-garden.png` });
    const shots: [string, Pt[]][] = [
      ['02-gang-w1', [[2550, 1540], [1535, 1540], [1535, 2300]]],
      ['03-park', [[1535, 3100], [1675, 3100], [1675, 4250]]],
      ['04-south-lane', [[3300, 4425], [5830, 4430]]],
      ['05-indomaret-front', [[5830, 3700], [5300, 2640]]],
      ['06-gang-w2', [[3635, 2750], [3635, 2000]]],
      ['07-home-gate', [[3635, 1540], [2550, 1540], [2550, 1380]]],
    ];
    const { pos, cam } = await sampled(page, async () => {
      for (const [name, pts] of shots) {
        await walk(page, isMobile, pts);
        if (name === '05-indomaret-front') expect((await S(page)).nearest).toBe('door:minimarket_door');
        await page.screenshot({ path: `${OUT}/${tag}-${name}.png` });
      }
    });
    const s1 = await S(page);
    expect(s1.sceneStarts).toBe(s0.sceneStarts);                                                   // the whole loop is one map
    expect(s1.zone).toBe('front_yard');
    expect(s1.visited).toEqual(expect.arrayContaining(['front_yard', 'batuphat_lanes', 'batuphat_west', 'batuphat_park', 'batuphat_south', 'batuphat_street']));
    expect(span(pos.map((p) => p[0]))).toBeGreaterThan(3500); expect(span(pos.map((p) => p[1]))).toBeGreaterThan(2500);
    expect(span(cam.map((c) => c[0]))).toBeGreaterThan(2000); expect(span(cam.map((c) => c[1]))).toBeGreaterThan(1200);   // the camera followed in X and Y
    smooth(pos, 160); smooth(cam, 220);                                                             // no teleports, no camera snaps
    expect(errors).toEqual([]);
  });

  test('two different routes from the garden gate to Indomaret: through gang W2, or down the avenue', async ({ page, isMobile }) => {
    await boot(page, '?fresh&fast&room=front_yard');
    if ((await S(page)).modal) await closeDialogue(page, isMobile);
    const gate: Pt = [2550, 1380];
    await page.evaluate(([x, y]) => (window as any).__ZS.teleport(x, y), gate);
    const a = await sampled(page, () => walk(page, isMobile, [[2550, 1540], [3635, 1540], [3635, 2700], [5300, 2640]]));
    expect((await S(page)).nearest).toBe('door:minimarket_door');
    await page.evaluate(([x, y]) => (window as any).__ZS.teleport(x, y), gate);
    await page.waitForTimeout(300);
    const b = await sampled(page, () => walk(page, isMobile, [[2550, 1560], [4730, 1560], [4730, 2760], [5300, 2640]]));
    expect((await S(page)).nearest).toBe('door:minimarket_door');
    expect(passedThrough(a.pos, 3550, 3720, 1800, 2500)).toBe(true);  expect(passedThrough(a.pos, 4600, 4860, 1800, 2500)).toBe(false);
    expect(passedThrough(b.pos, 4600, 4860, 1800, 2500)).toBe(true);  expect(passedThrough(b.pos, 3550, 3720, 1800, 2500)).toBe(false);
  });

  test('buildings, garden fence and hedges are solid; the gate and park entrances are open', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard');
    await boot(page, '?fresh&fast&room=front_yard');
    const hold = async (key: string, ms: number) => { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); };
    const tp = async (x: number, y: number) => { await page.evaluate(([a, b]) => (window as any).__ZS.teleport(a, b), [x, y]); await page.waitForTimeout(300); if ((await S(page)).modal) await closeDialogue(page, false); };
    await tp(2300, 1380); await hold('ArrowDown', 900);
    expect((await S(page)).player.y).toBeLessThan(1430);                                           // garden fence
    await tp(2550, 1380); await hold('ArrowDown', 900);
    expect((await S(page)).player.y).toBeGreaterThan(1450);                                        // through the gate
    await tp(5100, 2700); await hold('ArrowUp', 900);
    expect((await S(page)).player.y).toBeGreaterThanOrEqual(2600);                                 // Indomaret is a building, not a backdrop
    await tp(1000, 3500); await hold('ArrowDown', 900);
    expect((await S(page)).player.y).toBeLessThan(3600);                                           // park hedge
    await tp(1675, 3500); await hold('ArrowDown', 900);
    const s = await S(page); expect(s.player.y).toBeGreaterThan(3650); expect(s.zone).toBe('batuphat_park');   // park entrance
  });

  test('every shop door: interior and back to the same door; city road round trip; no texture growth', async ({ page, isMobile }) => {
    const errors = await boot(page, '?fresh&fast&room=batuphat_street');
    if ((await S(page)).modal) await closeDialogue(page, isMobile);
    let tex0 = -1;
    for (const [door, room, back, spawn] of [['minimarket_door', 'minimarket', 'batuphat_street', 'from_minimarket'], ['workplace_door', 'workplace', 'batuphat_street', 'from_workplace'],
      ['mixue_door', 'mixue', 'batuphat_west', 'from_mixue'], ['minimarket_door', 'minimarket', 'batuphat_street', 'from_minimarket']] as const) {
      const spot = await page.evaluate((d) => (window as any).__ZS.doorSpot(d), door);
      await walk(page, isMobile, [[spot.x, spot.y]]);                                                // long walks across town (first-visit popups closed)
      await useDoor(page, isMobile, door, room);
      await useDoor(page, isMobile, 'exit', TOWN);
      if ((await S(page)).modal) await closeDialogue(page, isMobile);
      const s = await S(page);
      expect(s.player).toMatchObject(spawnPos(back, spawn));
      if (tex0 < 0) tex0 = s.generatedTextures.count; else expect(s.generatedTextures.count).toBeLessThanOrEqual(tex0);
    }
    await useDoor(page, isMobile, 'road_east', 'lhokseumawe_road');
    await useDoor(page, isMobile, 'to_batuphat_street', TOWN);
    expect((await S(page)).player).toMatchObject(spawnPos('batuphat_street', 'from_lhokseumawe_road'));
    expect(errors).toEqual([]);
  });

  test('old saves: a P4 save on the street and a P5 save in batuphat_region reload beside the same buildings', async ({ page }) => {
    const seed = (save: object) => page.addInitScript((sv) => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('zsroom.save', JSON.stringify(sv)); } }, save);
    const base = { version: 3, savedAt: new Date().toISOString(), visited: ['front_yard', 'batuphat_street'], flags: { 'event:ev_street_first_visit': true, 'event:ev_west_first_visit': true, 'light:zila_bedroom:prop_lamp_zila#17': true }, vars: { phase: 'night', day: 5 } };
    await seed({ ...base, roomId: 'batuphat_street', player: { characterId: 'char_zila', x: 1420, y: 60, facing: 'N', outfit: 'default' } });
    await page.goto('/'); await page.waitForFunction(() => (window as any).__ZS?.state?.());
    let s = await S(page);
    expect(s.roomId).toBe(TOWN); expect(s.nearest).toBe('door:minimarket_door');                  // P4 Indomaret front → P6 Indomaret front
    expect(s.vars.day).toBe(5); expect(s.flagsState['light:zila_bedroom:prop_lamp_zila#17']).toBe(true);
    const p2 = await page.context().newPage();                                                    // fresh page: its own seeding script
    await p2.addInitScript((sv) => { localStorage.setItem('zsroom.save', JSON.stringify(sv)); }, { ...base, roomId: 'batuphat_region', player: { characterId: 'char_zila', x: 2160, y: 760, facing: 'N', outfit: 'default' } });
    await p2.goto('/'); await p2.waitForFunction(() => (window as any).__ZS?.state?.());
    s = await S(p2);
    expect(s.roomId).toBe(TOWN); expect(s.nearest).toBe('door:mixue_door');                       // P5 Mixue front → P6 Mixue front
    expect(s.vars.day).toBe(5);
  });

  test('framing: the town is larger than the screen in both directions; Zila stays small; manual zoom works', async ({ page, isMobile }) => {
    await boot(page, '?fresh&fast&room=batuphat_street');
    const s = await S(page);
    expect(s.bbox.w).toBeGreaterThan(s.camera.viewW * 3);
    expect(s.bbox.h * 0.7).toBeGreaterThan(s.camera.viewH * 2.5);
    const share = await page.evaluate(() => (165 * (window as any).__ZS.state().zoom) / (window as any).__ZS_GAME.scale.height);
    if (isMobile) { expect(share).toBeGreaterThanOrEqual(0.16); expect(share).toBeLessThanOrEqual(0.24); } else { expect(share).toBeGreaterThanOrEqual(0.12); expect(share).toBeLessThanOrEqual(0.18); }
    await page.evaluate(() => (window as any).__ZS.zoomBy(0.3)); await page.waitForTimeout(200);
    expect((await S(page)).camera.viewW).toBeLessThan(s.camera.viewW - 200);
    if (isMobile) await press(page, isMobile);
  });
});
