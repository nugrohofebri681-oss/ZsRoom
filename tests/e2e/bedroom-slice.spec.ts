import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { boot, press, propEntry, roomData, SHOTS, state, teleport, until } from './helpers';

const anchorAbs = (assetId: string, anchorId: string) => {
  const e = propEntry('zila_bedroom', assetId);
  const spec = JSON.parse(readFileSync(`specs/props/${assetId}.json`, 'utf8'));
  const a = spec.interactionAnchors.find((x: any) => x.id === anchorId);
  if (e.wall) return { x: e.wall.x + a.x, y: a.y };
  if (e.on) {                                           // surface prop: resolve through the host's measured anchor
    const host = roomData('zila_bedroom').props.find((p: any) => p.id === e.on.prop);
    const hs = JSON.parse(readFileSync(`specs/props/${host.assetId}.json`, 'utf8'));
    const anc = hs.surfaces.find((x: any) => x.id === e.on.surface).anchors.find((x: any) => x.id === e.on.anchor);
    return { x: host.x + anc.x + a.x, y: host.y + anc.y + a.y };
  }
  return { x: e.x + a.x, y: e.y + a.y };
};
const tag = (isMobile: boolean, name: string) => `${SHOTS}/${isMobile ? 'mobile' : 'desktop'}-slice-${name}.png`;

test.describe('bedroom vertical slice', () => {
  test('every prop renders (approved or labelled TEMP art), no grey-boxes, no errors', async ({ page, isMobile }) => {
    const errors = await boot(page);
    const s: any = await state(page);
    expect(s.props.filter((p: any) => p.art === 'greybox').map((p: any) => p.key)).toEqual([]);
    expect(s.props.filter((p: any) => p.art === 'approved').map((p: any) => p.key.split('#')[0]).sort()).toEqual(['prop_bed_zila', 'prop_nightstand_zila']);
    expect(s.displayObjects).toBeLessThan(150);
    await teleport(page, 365, 300);
    await page.waitForTimeout(500);
    await page.screenshot({ path: tag(isMobile, '01-evening') });
    expect(errors).toEqual([]);
  });

  test('sit at the desk, then stand up by moving', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard');
    await boot(page);
    const a = anchorAbs('prop_chair_desk', 'sit');
    await teleport(page, a.x, a.y);
    await page.waitForTimeout(150);
    expect((await state(page)).nearest).toMatch(/^prop_chair_desk#\d+:sit$/);
    await page.keyboard.press('KeyE');
    await until(page, 's.seated !== null');
    const seated: any = await state(page);
    expect(seated.seated).toMatch(/^prop_chair_desk#/);
    expect(seated.player.facing).toBe('N');
    await page.screenshot({ path: tag(false, '02-sitting-at-desk') });
    await page.keyboard.down('ArrowDown'); await page.waitForTimeout(200); await page.keyboard.up('ArrowDown');
    const stood: any = await state(page);
    expect(stood.seated).toBeNull();
    expect(stood.player.y).toBeGreaterThan(a.y - 5);
  });

  test('wardrobe changes outfit and it persists', async ({ page, isMobile }) => {
    await boot(page);
    const a = anchorAbs('prop_wardrobe_zila', 'outfit');
    await teleport(page, a.x, a.y);
    await page.waitForTimeout(150);
    await press(page, isMobile);
    await until(page, "s.vars.outfit === 'cream'");
    await page.reload();
    await page.waitForFunction(() => (window as any).__ZS?.state?.());
    expect((await state(page) as any).vars.outfit).toBe('cream');
  });

  test('resting at the bed opens dialogue and advances time; night + lamp + curtains', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard');
    await boot(page);
    const rest = anchorAbs('prop_bed_zila', 'rest');
    await teleport(page, rest.x, rest.y);
    await page.waitForTimeout(150);
    await page.keyboard.press('KeyE');
    await until(page, 's.modal === true');
    let s: any = await state(page);
    expect(s.modal).toBe(true);                       // dialogue is showing
    expect(s.vars.phase).toBe('night');               // evening → night
    await page.keyboard.down('ArrowUp'); await page.waitForTimeout(200); await page.keyboard.up('ArrowUp');
    expect((await state(page)).player.y).toBe(rest.y); // movement blocked while dialogue is open
    await page.screenshot({ path: tag(false, '03-dialogue') });
    await page.keyboard.press('KeyE');
    await until(page, 's.modal === false');
    // lamp on at night
    const lamp = anchorAbs('prop_lamp_zila', 'toggle');
    await teleport(page, lamp.x + 6, lamp.y - 2);
    await page.waitForTimeout(150);
    await until(page, "s.nearest && s.nearest.startsWith('prop_lamp_zila#')");
    await page.keyboard.press('KeyE');
    await until(page, "s.lights.find((l) => l.key.startsWith('prop_lamp_zila#')).on === true");
    // curtains
    const cur = anchorAbs('wall_window_bedroom', 'curtains');
    await teleport(page, cur.x, cur.y);
    await page.waitForTimeout(150);
    expect((await state(page)).nearest).toMatch(/^wall_window_bedroom#\d+:curtains$/);
    await page.keyboard.press('KeyE');
    await until(page, 's.vars.curtainsClosed === true');
    await page.keyboard.press('KeyE');                 // open again for the screenshot
    await teleport(page, 420, 300);
    await page.waitForTimeout(500);
    await page.screenshot({ path: tag(false, '04-night-lamp-on') });
  });

  test('labelled temporary art (T) for review', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard');
    await boot(page, '?fresh&tags');
    await page.evaluate(() => (window as any).__ZS.setVars({ phase: 'afternoon' }));
    await teleport(page, 365, 300);
    await page.waitForTimeout(400);
    await page.screenshot({ path: tag(false, '05-temp-labels-afternoon') });
  });

  test('mobile: night scene with lamp at phone scale', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile');
    await boot(page);
    await page.evaluate(() => (window as any).__ZS.setVars({ phase: 'night' }));
    const lamp = anchorAbs('prop_lamp_zila', 'toggle');
    await teleport(page, lamp.x + 6, lamp.y - 2);
    await page.waitForTimeout(150);
    await press(page, true);
    await page.waitForTimeout(150);
    await teleport(page, 300, 260);
    await page.waitForTimeout(500);
    await page.screenshot({ path: tag(true, '02-night-lamp') });
  });
});
