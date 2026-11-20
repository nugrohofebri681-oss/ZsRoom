import { expect, test, type Page } from '@playwright/test';
import { boot, state, teleport, until, press, SHOTS } from './helpers';

const S = (page: Page): Promise<any> => state(page);
const ui = (page: Page): Promise<any> => page.evaluate(() => (window as any).__ZS_UI.sound());
const tapAt = async (page: Page, isMobile: boolean, x: number, y: number) => {
  if (isMobile) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
};
/** A neutral user gesture that does not move Zila (a key press / a tap on the speaker button twice). */
async function gesture(page: Page, isMobile: boolean): Promise<void> {
  if (isMobile) { const g = await ui(page); await page.touchscreen.tap(g.button.x, g.button.y); await page.touchscreen.tap(g.button.x, g.button.y); }
  else await page.keyboard.press('Shift');
}

test.describe('living bedroom polish: sound', () => {
  test('no AudioContext before a gesture; running after one; ambience follows time of day', async ({ page, isMobile }) => {
    const errors = await boot(page);
    let a = (await S(page)).audio;
    expect(a.state).toBe('not-created');            // autoplay-safe: nothing exists until the player acts
    expect(a.wantedAmbience).toBe('night');         // default phase is evening
    await gesture(page, isMobile);
    await until(page, "s.audio.state === 'running'");
    a = (await S(page)).audio;
    expect(a.unlocks).toBe(1);
    expect(a.ambience).toBe('night');
    await page.evaluate(() => (window as any).__ZS.setVars({ phase: 'morning' }));
    expect((await S(page)).audio.ambience).toBe('day');
    // background tab → context suspended (no audio thread work), resumes when visible again
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    await until(page, "s.audio.state === 'suspended'");
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
    await until(page, "s.audio.state === 'running'");
    expect((await S(page)).audio.bufferBytes).toBeLessThan(2_000_000);
    expect(errors).toEqual([]);
  });

  test('footsteps lock to the walk cycle: wood on the floorboards, softer steps on the rug', async ({ page, isMobile }) => {
    const errors = await boot(page);
    await gesture(page, isMobile);
    await until(page, "s.audio.state === 'running'");
    await teleport(page, 300, 200);                              // wood, between bed and desk chair
    await page.evaluate(() => (window as any).__ZS.tapWorld(300, 250));   // walk 50 cm south (still wood: rug starts at y 230)
    const w0 = (await S(page)).walked;
    await until(page, 's.path === 0');
    let s = await S(page);
    const woodSteps = s.audio.played.step_wood ?? 0;
    expect(woodSteps).toBeGreaterThanOrEqual(Math.floor(((s.walked - w0) / 112) * 2) - 1);
    expect(s.audio.played.step_rug ?? 0).toBe(0);
    await teleport(page, 230, 320);                              // on the rug (330±130, 320±90)
    await page.evaluate(() => (window as any).__ZS.tapWorld(440, 320));
    const r0 = (await S(page)).walked;
    await until(page, 's.path === 0');
    s = await S(page);
    expect(s.floor).toBe('rug');
    const rugSteps = s.audio.played.step_rug ?? 0;
    const expected = ((s.walked - r0) / 112) * 2;                // 2 contacts per 112 cm stride
    expect(rugSteps).toBeGreaterThanOrEqual(Math.floor(expected) - 1);
    expect(rugSteps).toBeLessThanOrEqual(Math.ceil(expected) + 1);
    expect(s.audio.played.step_wood ?? 0).toBe(woodSteps);       // no wood steps while on the rug
    // standing still: no steps
    await page.waitForTimeout(500);
    expect((await S(page)).audio.played.step_rug).toBe(rugSteps);
    expect(errors).toEqual([]);
  });

  test('lamp switch clicks; interaction chime; sitting rustle', async ({ page, isMobile }) => {
    const errors = await boot(page);
    await gesture(page, isMobile);
    await until(page, "s.audio.state === 'running'");
    await teleport(page, 226, 80);
    await until(page, "/^prop_lamp_zila#\\d+:toggle$/.test(s.nearest)");
    await press(page, isMobile);
    await until(page, 's.audio.played.lamp_click === 1');
    await page.evaluate(() => (window as any).__ZS.tapWorld(330, 64, 70));   // tap the desk → walk to the chair and sit
    await until(page, "s.seated !== null", 15000);
    expect((await S(page)).audio.played.sit).toBeGreaterThanOrEqual(1);
    expect(errors).toEqual([]);
  });

  test('sound panel: touch-friendly mute + volume, saved across reloads, never walks Zila', async ({ page, isMobile }) => {
    const errors = await boot(page);
    let g = await ui(page);
    await tapAt(page, isMobile, g.button.x, g.button.y);
    g = await ui(page);
    expect(g.open).toBe(true);
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${SHOTS}/${isMobile ? 'mobile' : 'desktop'}-20-sound-panel.png` });
    const p0 = (await S(page)).player;
    // set the master volume to 30 % by tapping its track; set room ambience to 0 by tapping its left end
    const m = g.sliders.master, r = g.sliders.ambience;
    await tapAt(page, isMobile, m.x0 + (m.x1 - m.x0) * 0.3, m.y);
    await tapAt(page, isMobile, r.x0 - 4, r.y);
    await tapAt(page, isMobile, g.mute.x, g.mute.y);
    let s = await S(page);
    expect(s.audio.prefs.master).toBeCloseTo(0.3, 1);
    expect(s.audio.prefs.ambience).toBe(0);
    expect(s.audio.muted).toBe(true);
    expect(s.path).toBe(0);                                       // panel taps never reach the world
    expect(s.player.x).toBeCloseTo(p0.x, 0);
    await tapAt(page, isMobile, 400, 200);                        // tap outside closes the panel and does not walk
    expect((await ui(page)).open).toBe(false);
    expect((await S(page)).path).toBe(0);
    await page.reload();
    await page.waitForFunction(() => (window as any).__ZS?.state?.());
    s = await S(page);
    expect(s.audio.prefs).toMatchObject({ muted: true, ambience: 0 });
    expect(s.audio.prefs.master).toBeCloseTo(0.3, 1);
    // muted: a gesture creates the context but leaves it suspended, and nothing plays
    await gesture(page, isMobile);
    await page.waitForTimeout(200);
    s = await S(page);
    expect(s.audio.state).not.toBe('running');
    await teleport(page, 226, 80); await page.waitForTimeout(150);
    await press(page, isMobile); await page.waitForTimeout(200);
    expect((await S(page)).audio.played.lamp_click ?? 0).toBe(0);
    if (!isMobile) {                                              // M key unmutes on desktop
      await page.keyboard.press('KeyM');
      await until(page, "s.audio.muted === false && s.audio.state === 'running'");
    }
    expect(errors).toEqual([]);
  });
});

test.describe('living bedroom polish: interaction highlight', () => {
  test('one soft glow behind the usable prop only; follows focus; hidden when nothing is in reach or a dialogue is open', async ({ page, isMobile }) => {
    const errors = await boot(page);
    await teleport(page, 360, 300);                               // open floor
    await page.waitForTimeout(150);
    let s = await S(page);
    expect(s.nearest).toBeNull();
    expect(s.highlight.visible).toBe(false);
    const before = s.displayObjects;
    await teleport(page, 226, 80);                                // lamp
    await page.waitForTimeout(150);
    s = await S(page);
    const lampKey = s.nearest.split(':')[0];
    expect(s.highlight).toMatchObject({ target: lampKey, visible: true });
    const lamp = s.props.find((p: any) => p.key === lampKey);
    expect(s.highlight.depth).toBeLessThan(lamp.depth);           // behind the art: approved pixels untouched
    expect(lamp.art).toBe('approved');
    await page.screenshot({ path: `${SHOTS}/${isMobile ? 'mobile' : 'desktop'}-21-highlight-lamp.png` });
    const wardrobe = (await S(page)).props.find((p: any) => p.key.startsWith('prop_wardrobe_zila'));
    await teleport(page, 640, 120);                               // wardrobe
    await page.waitForTimeout(150);
    s = await S(page);
    expect(s.highlight.target).toBe(wardrobe.key);
    expect(s.displayObjects - before).toBeLessThanOrEqual(1);     // a single reused sprite, not one per prop
    if (!isMobile) await page.screenshot({ path: `${SHOTS}/desktop-22-highlight-wardrobe.png` });
    // a dialogue panel takes over input: the glow hides while it is open
    await page.evaluate(() => (window as any).__ZS_GAME.events.emit('dialogue', { speaker: 'Zila', lines: ['Hmm.'] }));
    await until(page, 's.modal === true && s.highlight.visible === false');
    await page.keyboard.press('KeyE');
    await until(page, 's.modal === false && s.highlight.visible === true');
    await teleport(page, 360, 300); await page.waitForTimeout(100);
    expect((await S(page)).highlight.visible).toBe(false);
    expect(errors).toEqual([]);
  });
});
