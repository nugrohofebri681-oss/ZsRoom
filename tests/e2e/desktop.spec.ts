import { expect, test } from '@playwright/test';
import { boot, hold, SHOTS, state, teleport } from './helpers';

test.describe('desktop gameplay', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop only');

  test('boots without errors and renders the bedroom', async ({ page }) => {
    const errors = await boot(page);
    const s = await state(page);
    expect(s.roomId).toBe('zila_bedroom');
    expect(s.props.map((p) => p.key)).toContain('prop_bed_zila#0');
    await page.screenshot({ path: `${SHOTS}/desktop-01-boot.png` });
    expect(errors).toEqual([]);
  });

  test('8-direction keyboard movement', async ({ page }) => {
    await boot(page);
    const a = await state(page);
    await page.keyboard.down('KeyD');
    await page.keyboard.down('KeyW');
    await page.waitForFunction((y0) => (window as any).__ZS.state().player.y < y0 - 25, a.player.y, { timeout: 4000 });
    const mid = await state(page);
    await page.keyboard.up('KeyD');
    await page.keyboard.up('KeyW');
    expect(mid.player.facing).toBe('NE');
    // equal x/y displacement ⇒ true diagonal, not two sequential axes
    const ratio = (mid.player.x - a.player.x) / (a.player.y - mid.player.y);
    expect(ratio).toBeGreaterThan(0.8);
    expect(ratio).toBeLessThan(1.25);
  });

  test('bed collision blocks the player and they slide along it', async ({ page }) => {
    await boot(page);
    await teleport(page, 240, 120);          // right of the bed (collision x ≤ 174)
    await hold(page, 'ArrowLeft', 2000);     // generous: must stop at the bed regardless of frame rate
    const s = await state(page);
    expect(s.player.x).toBeGreaterThanOrEqual(174 + 16 - 0.5);
    expect(s.player.x).toBeLessThan(195);
    expect(s.player.depth, 'beside the bed, actor sorts in front of it').toBeGreaterThan(212);
    await page.screenshot({ path: `${SHOTS}/desktop-02-bed-collision.png` });
  });

  test('walking behind a tall prop fades it (occlusion)', async ({ page }) => {
    await boot(page);
    await teleport(page, 400, 150);
    await page.waitForTimeout(200);
    expect((await state(page)).occluded, 'well behind and above: head not hidden yet').toEqual([]);
    await teleport(page, 400, 190);          // directly behind the 165 cm plant (its collision starts at y 210)
    await page.waitForTimeout(500);
    const s = await state(page);
    expect(s.player.y).toBeLessThan(210);
    const plantKey = s.props.find((p) => p.key.startsWith('greybox_plant_tall#'))!.key; // index-independent
    expect(s.occluded).toContain(plantKey);
    const plant = s.props.find((p) => p.key === plantKey)!;
    expect(plant.alpha).toBeLessThan(0.8);
    await page.screenshot({ path: `${SHOTS}/desktop-03-occlusion.png` });
  });

  test('interaction prompt near the bed', async ({ page }) => {
    await boot(page);
    await teleport(page, 194, 102);          // bed "rest" anchor
    await page.waitForTimeout(150);
    expect((await state(page)).nearest).toBe('prop_bed_zila#0:rest');
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${SHOTS}/desktop-04-interaction.png` });
  });

  test('door transition to the hall and back, with save', async ({ page }) => {
    await boot(page);
    await teleport(page, 285, 400);
    // Hold until the transition fires (frame-rate independent: CI runners can be several times slower).
    await page.keyboard.down('ArrowDown');
    await page.waitForFunction(() => (window as any).__ZS.state().roomId === 'upper_hall', null, { timeout: 15000 });
    await page.keyboard.up('ArrowDown');
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SHOTS}/desktop-05-hall.png` });
    await teleport(page, 285, 60);
    await page.waitForTimeout(100);
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => (window as any).__ZS.state().roomId === 'zila_bedroom', null, { timeout: 5000 });
    // reload without ?fresh → resumes from the save
    await page.reload();
    await page.waitForFunction(() => (window as any).__ZS?.state?.());
    expect((await state(page)).roomId).toBe('zila_bedroom');
  });
});
