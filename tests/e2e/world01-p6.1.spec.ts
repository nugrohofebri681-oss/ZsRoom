import { expect, test, type Page } from '@playwright/test';
import { boot, closeDialogue, press, spawnPos, state, until, useDoor } from './helpers';

/**
 * P6.1 — Batuphat with places that live by the time of day: a morning market (sellers, shoppers browsing and
 * buying), an open-front warkop (fullest in the evening) with a real interior, quiet residential lanes.
 */
const S = (p: Page): Promise<any> => state(p);
const OUT = 'docs/reviews/world01-p6.1';
const TOWN = 'batuphat_town';
const setPhase = (p: Page, phase: string) => p.evaluate((ph) => (window as any).__ZS.setVars({ phase: ph }), phase);
const tp = async (p: Page, x: number, y: number, isMobile: boolean) => { await p.evaluate(([a, b]) => (window as any).__ZS.teleport(a, b), [x, y]); await p.waitForTimeout(350); if ((await S(p)).modal) await closeDialogue(p, isMobile); };
const visibleIn = (s: any, zone: string) => s.npcs.filter((n: any) => n.visible && n.zone === zone);

test.describe('P6.1 Batuphat life', () => {
  test.setTimeout(240_000);

  test('morning market: busy, shoppers move between stalls; buying works; in the evening the stall is closed and the market empty', async ({ page, isMobile }) => {
    const tag = isMobile ? 'android' : 'desktop';
    const errors = await boot(page, '?fresh&fast&room=batuphat_street');
    if ((await S(page)).modal) await closeDialogue(page, isMobile);
    await setPhase(page, 'morning');
    await tp(page, 5450, 3935, isMobile);                                        // aisle, in front of the vegetable stall
    let s = await S(page);
    expect(s.zone).toBe('batuphat_market');
    expect(visibleIn(s, 'batuphat_market').length).toBeGreaterThanOrEqual(6);
    // shoppers really move and stop at stalls
    const pos0 = Object.fromEntries(s.npcs.filter((n: any) => n.id.startsWith('market_shopper_') && n.visible).map((n: any) => [n.id, `${n.x},${n.y}`]));
    const acts = new Set<string>();
    for (let i = 0; i < 12; i++) { await page.waitForTimeout(500); for (const n of (await S(page)).npcs) if (n.id.startsWith('market_shopper_') && n.visible && n.act) acts.add(n.act); }
    s = await S(page);
    const moved = s.npcs.filter((n: any) => pos0[n.id] && pos0[n.id] !== `${n.x},${n.y}`).length;
    expect(moved).toBeGreaterThanOrEqual(2);
    expect([...acts].some((a) => a === 'browsing' || a === 'buying' || a === 'walking')).toBe(true);
    await page.screenshot({ path: `${OUT}/${tag}-01-morning-market.png` });
    await until(page, "s.nearest === 'bld:kiosk_a2:talk'");
    await press(page, isMobile);
    await until(page, 's.modal === true');
    await closeDialogue(page, isMobile);
    expect((await S(page)).vars.market_veg).toBe(1);
    // evening: stalls covered, market empty; the same stall does not sell
    await setPhase(page, 'evening');
    await page.waitForTimeout(400);
    s = await S(page);
    expect(visibleIn(s, 'batuphat_market').length).toBe(0);
    await press(page, isMobile);
    await until(page, 's.modal === true');
    await page.screenshot({ path: `${OUT}/${tag}-02-evening-market-closed.png` });
    await closeDialogue(page, isMobile);
    expect((await S(page)).vars.market_veg).toBe(1);
    expect(s.npcs.some((n: any) => n.id.startsWith('night_food_') && n.visible)).toBe(true);
    expect(errors).toEqual([]);
  });

  test('warkop: fuller in the evening; inside: order a sanger, sit and drink, chat with the regulars, leave by the same door', async ({ page, isMobile }) => {
    const tag = isMobile ? 'android' : 'desktop';
    const errors = await boot(page, '?fresh&fast&room=batuphat_west');
    if ((await S(page)).modal) await closeDialogue(page, isMobile);
    const patrons = async (ph: string) => { await setPhase(page, ph); await page.waitForTimeout(300); return (await S(page)).npcs.filter((n: any) => n.id.startsWith('warkop_patron_') && n.visible).length; };
    const morning = await patrons('morning'), evening = await patrons('evening');
    expect(evening).toBeGreaterThan(morning);
    await tp(page, 1110, 2640, isMobile);
    await page.screenshot({ path: `${OUT}/${tag}-03-warkop-evening.png` });
    await useDoor(page, isMobile, 'warkop_door', 'warkop');
    expect((await S(page)).roomId).toBe('warkop');
    await page.screenshot({ path: `${OUT}/${tag}-04-warkop-inside.png` });
    const use = async (x: number, y: number, nearest: string) => { await tp(page, x, y, isMobile); await until(page, `s.nearest === '${nearest}'`); await press(page, isMobile); await until(page, 's.modal === true'); await closeDialogue(page, isMobile); };
    const sits = (await S(page)).props.filter((p: any) => p.key.startsWith('world_cafe_table'));
    expect(sits.length).toBe(3);
    await use(170, 335, 'world_cafe_table#3:sit');                              // before ordering: "order something first"
    expect((await S(page)).vars.warkopVisits ?? 0).toBe(0);
    await use(540, 210, 'world_counter#1:order');
    expect((await S(page)).vars.warkopOrder).toBe('sanger');
    await use(170, 335, 'world_cafe_table#3:sit');
    expect((await S(page)).vars.warkopVisits).toBe(1);
    await use(100, 360, 'npc:npc_warkop_regular_a');
    await useDoor(page, isMobile, 'exit', TOWN);
    expect((await S(page)).player).toMatchObject(spawnPos('batuphat_west', 'from_warkop'));
    expect(errors).toEqual([]);
  });

  test('quiet places stay quiet: residential lanes never crowded; LOD keeps far-away people idle', async ({ page }) => {
    await boot(page, '?fresh&fast&room=front_yard');
    for (const ph of ['morning', 'afternoon', 'evening', 'night']) {
      await setPhase(page, ph); await page.waitForTimeout(300);
      const s = await S(page);
      expect(visibleIn(s, 'batuphat_lanes').length, ph).toBeLessThanOrEqual(3);
      expect(s.npcActive, ph).toBeLessThan(s.npcs.filter((n: any) => n.visible).length + 1);
    }
    await setPhase(page, 'morning'); await page.waitForTimeout(400);
    const s = await S(page);                                                         // in the garden: the far market crowd is not simulated
    expect(s.npcActive).toBeLessThan(s.npcs.filter((n: any) => n.visible).length);
  });
});
