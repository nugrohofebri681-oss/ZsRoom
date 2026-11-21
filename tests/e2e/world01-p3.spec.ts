import { expect, test, type Page } from '@playwright/test';
import { boot, closeDialogue, roomData, state, tapObject, until, useDoor } from './helpers';

/** World 01 P3: Batuphat → road → Lhokseumawe centre → Unimal → home, inspectable background, save/reload, memory. */
const S = (p: Page): Promise<any> => state(p);
const OUT = 'docs/reviews/world01';

async function dismiss(page: Page, isMobile: boolean): Promise<void> { if ((await S(page)).modal) await closeDialogue(page, isMobile); }

test.describe('World 01 P3 — city and Unimal', () => {
  test.setTimeout(360_000);

  test('bedroom → Batuphat → road → city centre → Unimal → back home to the bedroom, through real doors, with save/reload on campus', async ({ page, isMobile }) => {
    const errors = await boot(page, '?fresh&fast');
    const go = async (door: string, to: string) => { await useDoor(page, isMobile, door, to); await dismiss(page, isMobile); };
    await go(roomData('zila_bedroom').doors[0].id, 'upper_hall');
    await go('stairs_down', 'living_room');
    await go('front_door', 'front_yard');
    await go('gate', 'batuphat_street');
    await go('road_east', 'lhokseumawe_road');
    expect((await S(page)).player).toMatchObject({ x: roomData('lhokseumawe_road').spawns.from_batuphat_street.x });
    await go('to_lhokseumawe_centre', 'lhokseumawe_centre');
    await go('to_unimal_campus', 'unimal_campus');
    if (!isMobile) await page.screenshot({ path: `${OUT}/desktop-21-route-arrived-unimal.png` });

    // save → reload → resume on campus at the same spot
    const before = await S(page);
    await page.goto('/?fast'); await page.waitForFunction(() => (window as any).__ZS?.state?.());
    let s = await S(page);
    expect(s.roomId).toBe('unimal_campus');
    expect(Math.hypot(s.player.x - before.player.x, s.player.y - before.player.y)).toBeLessThan(2);
    expect(s.visited).toEqual(expect.arrayContaining(['lhokseumawe_road', 'lhokseumawe_centre', 'unimal_campus']));
    await dismiss(page, isMobile);

    // home again: every door returns next to the door it was entered from
    await go('to_lhokseumawe_centre', 'lhokseumawe_centre');
    expect((await S(page)).player).toMatchObject({ x: roomData('lhokseumawe_centre').spawns.from_unimal_campus.x, y: roomData('lhokseumawe_centre').spawns.from_unimal_campus.y });
    await go('to_lhokseumawe_road', 'lhokseumawe_road');
    await go('to_batuphat_street', 'batuphat_street');
    expect((await S(page)).player).toMatchObject({ x: roomData('batuphat_street').spawns.from_lhokseumawe_road.x });
    await go('home_gate', 'front_yard');
    await go('house_door', 'living_room');
    await go('stairs_up', 'upper_hall');
    await go('door_to_bedroom', 'zila_bedroom');
    expect(errors).toEqual([]);
  });

  test('background buildings are inspectable: tap shows the name and a neutral comment', async ({ page, isMobile }) => {
    const errors = await boot(page, '?fresh&fast&room=lhokseumawe_centre');
    await dismiss(page, isMobile);
    await tapObject(page, 1300, 4, 200, 's.modal === true');                               // tap the mosque landmark
    if (!isMobile) await page.screenshot({ path: `${OUT}/desktop-22-inspect-landmark.png` });
    expect((await S(page)).inspectables.find((i: any) => i.name === 'Grand mosque').inspected).toBe(true);
    await closeDialogue(page, isMobile);
    await useDoor(page, isMobile, 'to_unimal_campus', 'unimal_campus');
    await dismiss(page, isMobile);
    await tapObject(page, 1280, 4, 150, 's.modal === true');                               // tap the library
    expect((await S(page)).inspectables.find((i: any) => i.name === 'Library').inspected).toBe(true);
    await closeDialogue(page, isMobile);
    // the locked east end of the city stays closed (planned), never traps the player
    await page.goto('/?fresh&fast&room=lhokseumawe_centre'); await page.waitForFunction(() => (window as any).__ZS?.state?.());
    await dismiss(page, isMobile);
    await page.evaluate(() => (window as any).__ZS.tapWorld(2780, 690)); await until(page, 's.path === 0', 30000);
    await until(page, "s.nearest === 'door:city_east'");
    expect((await S(page)).roomId).toBe('lhokseumawe_centre');
    expect(errors).toEqual([]);
  });

  test('repeated trips street ↔ road ↔ city ↔ Unimal keep generated textures and objects flat', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop memory check');
    const errors = await boot(page, '?fresh&fast&room=batuphat_street');
    await dismiss(page, isMobile);
    const sample = async () => { const s = await S(page); return { bytes: s.generatedTextures.bytes, count: s.generatedTextures.count, objs: s.displayObjects }; };
    const first = await sample();
    for (let i = 0; i < 2; i++) {
      for (const [d, to] of [['road_east', 'lhokseumawe_road'], ['to_lhokseumawe_centre', 'lhokseumawe_centre'], ['to_unimal_campus', 'unimal_campus'],
        ['to_lhokseumawe_centre', 'lhokseumawe_centre'], ['to_lhokseumawe_road', 'lhokseumawe_road'], ['to_batuphat_street', 'batuphat_street']] as const) {
        await useDoor(page, isMobile, d, to); await dismiss(page, isMobile);
      }
    }
    const last = await sample();
    expect(last.count).toBe(first.count);
    expect(last.bytes).toBeLessThanOrEqual(first.bytes * 1.05);
    expect(Math.abs(last.objs - first.objs)).toBeLessThanOrEqual(3);
    expect(await page.evaluate(() => (performance as any).memory?.usedJSHeapSize ?? 0)).toBeLessThan(150e6);
    expect(errors).toEqual([]);
  });
});
