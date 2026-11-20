import { expect, test, type Page } from '@playwright/test';
import { boot, press, roomData, state, until, SHOTS } from './helpers';

/**
 * World 01 P0 route, walked for real: every map change goes through a door (walk to it, use it).
 * No teleports between maps. Bedroom → hall → stairs → living room → yard → street → minimarket →
 * street → workplace → street → yard → living room → stairs → hall → bedroom, with save/reload.
 */
const S = (p: Page): Promise<any> => state(p);

async function closeDialogue(page: Page, isMobile: boolean): Promise<void> {
  for (let i = 0; i < 12 && (await S(page)).modal; i++) { await press(page, isMobile); await page.waitForTimeout(120); }
  await until(page, 's.modal === false');
}

function doorAnchor(roomId: string, doorId: string): { x: number; y: number } {
  const r = roomData(roomId), d = r.doors.find((x: any) => x.id === doorId), { w, h } = r.sizeCm;
  const side = d.side ?? (d.y <= 10 ? 'north' : d.y >= h - 20 ? 'south' : d.x <= 10 ? 'west' : 'east');
  return side === 'north' ? { x: d.x + d.w / 2, y: 25 } : side === 'south' ? { x: d.x + d.w / 2, y: h - 15 } : side === 'west' ? { x: 15, y: d.y + d.h / 2 } : { x: w - 15, y: d.y + d.h / 2 };
}

/** Walk (tap-to-move) to a door's spot, then use it with E / the touch button. */
async function useDoor(page: Page, isMobile: boolean, doorId: string, expectRoom: string): Promise<void> {
  const from = (await S(page)).roomId, a = doorAnchor(from, doorId);
  await page.evaluate(([x, y]) => (window as any).__ZS.tapWorld(x, y), [a.x, a.y]);
  await until(page, 's.path === 0', 20000);
  await until(page, `s.nearest === 'door:${doorId}'`);
  await press(page, isMobile);
  await until(page, `s.roomId === '${expectRoom}' && !s.transitioning`, 8000);
  await page.waitForTimeout(250);
}

/** Tap the visible part of an object (ground x/y + height z): Zila walks to its interaction spot and uses it. */
async function tapObject(page: Page, x: number, y: number, z: number, used: string): Promise<void> {
  await page.evaluate(([gx, gy, gz]) => (window as any).__ZS.tapWorld(gx, gy, gz), [x, y, z]);
  await until(page, `s.path === 0 && s.pending === null && (${used})`, 20000);
  await page.waitForTimeout(150);
}

test.describe('World 01 P0 route', () => {
  test.setTimeout(300_000);

  test('bedroom → street → minimarket → workplace → home → bedroom, through real doors, with save/reload', async ({ page, isMobile }) => {
    const errors = await boot(page, '?fresh&fast');
    const shot = async (n: string) => { if (!isMobile) await page.screenshot({ path: `${SHOTS}/world01-${n}.png` }); };
    expect((await S(page)).roomId).toBe('zila_bedroom');
    const bedroomTextures = (await S(page)).generatedTextures.bytes;

    await useDoor(page, isMobile, roomData('zila_bedroom').doors[0].id, 'upper_hall');
    await useDoor(page, isMobile, 'stairs_down', 'living_room');
    await shot('01-living-room');
    await useDoor(page, isMobile, 'front_door', 'front_yard');
    await shot('02-front-yard');
    await useDoor(page, isMobile, 'gate', 'batuphat_street');

    // first visit: placeholder chat from Febri (comms contract), shown once
    await until(page, 's.modal === true');
    await shot('03-street-first-visit-chat');
    await closeDialogue(page, isMobile);
    expect((await S(page)).flagsState['event:ev_street_first_visit']).toBe(true);

    // save → reload → resume on the street at a valid position
    const before = await S(page);
    await page.goto('/?fast'); await page.waitForFunction(() => (window as any).__ZS?.state?.());   // resume from save (no ?fresh)
    let s = await S(page);
    expect(s.roomId).toBe('batuphat_street');
    expect(Math.hypot(s.player.x - before.player.x, s.player.y - before.player.y)).toBeLessThan(2);
    expect(s.visited).toEqual(expect.arrayContaining(['zila_bedroom', 'upper_hall', 'living_room', 'front_yard', 'batuphat_street']));
    expect(s.modal).toBe(false);                                         // once-event does not repeat after reload

    // locked road end
    await page.evaluate(() => (window as any).__ZS.tapWorld(2780, 610)); await until(page, 's.path === 0', 30000);
    await until(page, "s.nearest === 'door:road_east'"); await press(page, isMobile);
    expect((await S(page)).roomId).toBe('batuphat_street');

    // minimarket: pick a drink, pay the cashier
    await useDoor(page, isMobile, 'minimarket_door', 'minimarket');
    await shot('04-minimarket');
    await tapObject(page, 230, 60, 150, "s.vars.cart === 'cold tea'");                       // tap the fridge above the shelves
    await tapObject(page, 660, 460, 80, 's.modal === true');                                   // tap the counter → pay → cashier thanks
    await closeDialogue(page, isMobile);
    s = await S(page);
    expect(s.vars.purchases).toBe(1); expect(s.vars.cart).toBe('');
    await useDoor(page, isMobile, 'exit', 'batuphat_street');
    expect((await S(page)).player.x).toBeCloseTo(roomData('batuphat_street').spawns.from_minimarket.x, 0);   // back out of the same shop door

    // workplace: clock in → 3 tasks → clock out
    await useDoor(page, isMobile, 'workplace_door', 'workplace');
    await shot('05-workplace');
    await tapObject(page, 640, 4, 148, "s.vars.shift === 'in_progress'");                     // time clock on the wall
    let n = 0;
    for (const [x, y] of [[180, 180], [180, 370], [560, 310]] as const) await tapObject(page, x, y, 70, `s.vars.tasksDone === ${++n}`);
    expect((await S(page)).vars.tasksDone).toBe(3);
    await tapObject(page, 730, 4, 148, 's.modal === true');                                     // clock out → shift complete
    await closeDialogue(page, isMobile);
    expect((await S(page)).vars.shift).toBe('done');
    await useDoor(page, isMobile, 'exit', 'batuphat_street');

    // home again, up the stairs, into the bedroom
    await useDoor(page, isMobile, 'home_gate', 'front_yard');
    await useDoor(page, isMobile, 'house_door', 'living_room');
    await useDoor(page, isMobile, 'stairs_up', 'upper_hall');
    await useDoor(page, isMobile, 'door_to_bedroom', 'zila_bedroom');
    s = await S(page);
    expect(s.visited).toEqual(expect.arrayContaining(['minimarket', 'workplace']));
    // only the active map's generated textures are in memory: back home, nothing from the street/shop/office remains
    expect(s.generatedTextures.bytes).toBeLessThanOrEqual(bedroomTextures * 1.1 + 1);
    await page.goto('/?fast'); await page.waitForFunction(() => (window as any).__ZS?.state?.());   // resume from save (no ?fresh)
    s = await S(page);
    expect(s.roomId).toBe('zila_bedroom');
    expect(s.vars).toMatchObject({ purchases: 1, shift: 'done' });
    expect(errors).toEqual([]);
  });

  test('walking out through doorways (keyboard), not only by using them', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard walk');
    const errors = await boot(page, '?fresh&room=living_room');
    // south front door: walk south through the doorway
    await page.evaluate(() => (window as any).__ZS.teleport(450, 520));
    await page.keyboard.down('ArrowDown'); await until(page, "s.roomId === 'front_yard'", 8000); await page.keyboard.up('ArrowDown');
    // arriving next to the house door must not bounce straight back in (doorways arm only after leaving them)
    await page.waitForTimeout(600);
    expect((await S(page)).roomId).toBe('front_yard');
    // east-side stairs in the hall: walk east
    await page.goto('/?fresh&room=upper_hall'); await page.waitForFunction(() => (window as any).__ZS?.state?.());
    await page.evaluate(() => (window as any).__ZS.teleport(600, 135));
    await page.keyboard.down('ArrowRight'); await until(page, "s.roomId === 'living_room'", 8000); await page.keyboard.up('ArrowRight');
    const s = await S(page);
    expect(s.player).toMatchObject({ x: roomData('living_room').spawns.from_stairs.x, y: roomData('living_room').spawns.from_stairs.y });
    // locked kitchen: walking into it is blocked by the wall
    await page.evaluate(() => (window as any).__ZS.teleport(60, 280));
    await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(800); await page.keyboard.up('ArrowLeft');
    expect((await S(page)).roomId).toBe('living_room');
    expect((await S(page)).player.x).toBeGreaterThanOrEqual(15);
    expect(errors).toEqual([]);
  });

  test('a resumed position inside furniture (layout changed) falls back to a valid spawn', async ({ page }) => {
    await boot(page, '?fresh&room=minimarket');
    await page.evaluate(() => { const k = 'zsroom.save'; const s = JSON.parse(localStorage.getItem(k)!); s.player.x = 200; s.player.y = 240; localStorage.setItem(k, JSON.stringify(s)); });
    await page.goto('/'); await page.waitForFunction(() => (window as any).__ZS?.state?.());
    const s = await S(page);
    expect(s.roomId).toBe('minimarket');
    expect(s.player).toMatchObject({ x: roomData('minimarket').spawns.default.x, y: roomData('minimarket').spawns.default.y });
  });

  test('a version-2 bedroom save migrates to v3 and resumes', async ({ page }) => {
    // an old (v2) save already on the device before the game loads
    await page.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('zsroom.save', JSON.stringify({ version: 2, savedAt: new Date().toISOString(), roomId: 'zila_bedroom', player: { characterId: 'char_zila', x: 330, y: 300, facing: 'S', outfit: 'default' }, flags: {}, vars: { phase: 'night', day: 3 } })); } });
    await page.goto('/'); await page.waitForFunction(() => (window as any).__ZS?.state?.());
    const s = await S(page);
    expect(s.roomId).toBe('zila_bedroom'); expect(s.vars.day).toBe(3); expect(s.visited).toContain('zila_bedroom');
  });
});
