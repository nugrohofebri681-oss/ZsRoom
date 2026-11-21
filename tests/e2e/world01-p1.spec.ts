import { expect, test, type Page } from '@playwright/test';
import { boot, closeDialogue, press, roomData, state, tapObject, until, useDoor, walkToZone, SHOTS } from './helpers';

/** World 01 continuation: kitchen, west Batuphat block, Mixue, NPC yielding, memory over many transitions. */
const S = (p: Page): Promise<any> => state(p);
const OUT = 'docs/reviews/world01';

async function start(page: Page, isMobile: boolean, room: string): Promise<string[]> {
  const errors = await boot(page, `?fresh&fast&room=${room}`);
  if ((await S(page)).modal) await closeDialogue(page, isMobile);
  return errors;
}

test.describe('World 01 continuation', () => {
  test.setTimeout(240_000);

  test('kitchen: through the living-room door, breakfast loop (fridge → stove → table), and back', async ({ page, isMobile }) => {
    const errors = await start(page, isMobile, 'living_room');
    await walkToZone(page, 'kitchen');                                 // P4: same floor, walk through the opening
    await tapObject(page, 570, 40, 120, "s.vars.ingredients === 'eggs'");
    await tapObject(page, 320, 40, 80, 's.modal === true');
    await closeDialogue(page, isMobile);
    expect((await S(page)).flagsState['kitchen:breakfast_ready']).toBe(true);
    if (!isMobile) await page.screenshot({ path: `${OUT}/desktop-08-kitchen-breakfast.png` });
    await tapObject(page, 260, 315, 40, 's.modal === true');
    await closeDialogue(page, isMobile);
    expect((await S(page)).vars.mealsEaten).toBe(1);
    await walkToZone(page, 'living_room');
    expect(errors).toEqual([]);
  });

  test('west block: from the street, talk to the becak driver, Mixue order loop, back to the same doors', async ({ page, isMobile }) => {
    const errors = await start(page, isMobile, 'batuphat_street');
    await useDoor(page, isMobile, 'road_west', 'batuphat_west');
    expect((await S(page)).player).toMatchObject({ x: roomData('batuphat_west').spawns.from_street.x });
    // becak driver (NPC dialogue)
    await page.evaluate(() => (window as any).__ZS.tapWorld(1400, 500)); await until(page, 's.path === 0', 20000);
    await until(page, "s.nearest === 'npc:npc_becak_driver'"); await press(page, isMobile);
    await until(page, 's.modal === true');
    if (!isMobile) await page.screenshot({ path: `${OUT}/desktop-09-west-block-becak.png` });
    await closeDialogue(page, isMobile);
    // Mixue
    await useDoor(page, isMobile, 'mixue_door', 'mixue');
    await tapObject(page, 300, 170, 80, "s.vars.mixueOrder === 'ice cream cone'");
    await tapObject(page, 130, 345, 40, 's.modal === true');
    if (!isMobile) await page.screenshot({ path: `${OUT}/desktop-10-mixue.png` });
    await closeDialogue(page, isMobile);
    expect((await S(page)).flagsState['mixue:first_treat']).toBe(true);
    await useDoor(page, isMobile, 'exit', 'batuphat_west');
    expect((await S(page)).player.x).toBe(roomData('batuphat_west').spawns.from_mixue.x);
    await useDoor(page, isMobile, 'to_street', 'batuphat_street');
    expect((await S(page)).player).toMatchObject({ x: roomData('batuphat_street').spawns.from_west.x, y: roomData('batuphat_street').spawns.from_west.y });
    // save → resume after the new maps
    await page.goto('/?fast'); await page.waitForFunction(() => (window as any).__ZS?.state?.());
    const s = await S(page);
    expect(s.roomId).toBe('batuphat_street');
    expect(s.visited).toEqual(expect.arrayContaining(['batuphat_west', 'mixue']));
    expect(errors).toEqual([]);
  });

  test('an NPC standing in a tap-to-move route makes way; Zila arrives', async ({ page, isMobile }) => {
    const errors = await start(page, isMobile, 'batuphat_street');
    await page.evaluate(() => { const z = (window as any).__ZS; z.teleport(500, 300); z.npcAt('npc_neighbour', 640, 300); });
    await page.evaluate(() => (window as any).__ZS.tapWorld(900, 300));
    await until(page, 's.path === 0', 15000);
    const s = await S(page);
    expect(Math.hypot(s.player.x - 900, s.player.y - 300)).toBeLessThan(30);
    const n = s.npcs.find((x: any) => x.id === 'npc_neighbour');
    expect(Math.abs(n.y - 300) + Math.abs(n.x - 640)).toBeGreaterThan(30);                  // it stepped aside
    expect(errors).toEqual([]);
  });

  test('many map changes keep generated-texture memory and object counts flat', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop memory check');
    const errors = await start(page, isMobile, 'batuphat_street');
    const sample = async () => { const s = await S(page); return { bytes: s.generatedTextures.bytes, count: s.generatedTextures.count, objs: s.displayObjects }; };
    const first = await sample();
    for (let i = 0; i < 4; i++) {
      await useDoor(page, isMobile, 'road_west', 'batuphat_west');
      await useDoor(page, isMobile, 'to_street', 'batuphat_street');
      await useDoor(page, isMobile, 'minimarket_door', 'minimarket');
      await useDoor(page, isMobile, 'exit', 'batuphat_street');
    }
    const last = await sample();
    expect(last.count).toBe(first.count);
    expect(last.bytes).toBeLessThanOrEqual(first.bytes * 1.05);
    expect(Math.abs(last.objs - first.objs)).toBeLessThanOrEqual(3);
    const heap = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize ?? 0);
    expect(heap).toBeLessThan(120e6);
    expect(errors).toEqual([]);
  });
});
