import { expect, test } from '@playwright/test';
import { boot, SHOTS, state, teleport } from './helpers';

const lampOn = async (page: import('@playwright/test').Page) =>
  ((await state(page)) as any).lights.find((l: { key: string }) => l.key.startsWith('prop_lamp_zila#'))?.on;

test.describe('bedside lamp (surface prop + engine light)', () => {
  test('switch prompt, engine light toggles, state survives reload', async ({ page, isMobile }) => {
    const errors = await boot(page);
    expect(await lampOn(page)).toBe(false);          // default off
    await teleport(page, 226, 80);                   // in front of the lamp, right of the nightstand anchor
    await page.waitForTimeout(150);
    expect((await state(page)).nearest).toMatch(/^prop_lamp_zila#\d+:toggle$/);
    if (isMobile) await page.locator('canvas').tap({ position: { x: 800 - 64, y: 360 - 70 } });
    else await page.keyboard.press('KeyE');
    await page.waitForTimeout(250);
    expect(await lampOn(page)).toBe(true);
    await teleport(page, 300, 250);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SHOTS}/${isMobile ? 'mobile' : 'desktop'}-08-lamp-on-greybox.png` });
    await page.reload();                             // resumes from save (no ?fresh)
    await page.waitForFunction(() => (window as any).__ZS?.state?.());
    expect(await lampOn(page)).toBe(true);
    expect(errors).toEqual([]);
  });
});
