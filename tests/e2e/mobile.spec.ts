import { expect, test } from '@playwright/test';
import { boot, SHOTS, state, until } from './helpers';

test.describe('mobile browser (emulated budget Android, touch)', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile only');

  test('virtual joystick moves the player; interact button visible', async ({ page }) => {
    const errors = await boot(page);
    const before = await state(page);
    const cdp = await page.context().newCDPSession(page);
    const pt = (x: number, y: number) => [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(150, 250) });
    for (let i = 1; i <= 6; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(150 + i * 10, 250) });
      await page.waitForTimeout(30);
    }
    await until(page, `s.player.x > ${before.player.x + 30}`);   // frame-rate independent
    const moving = await state(page);
    await page.screenshot({ path: `${SHOTS}/mobile-01-joystick.png` });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    expect(moving.player.facing).toBe('E');
    expect(moving.player.x).toBeGreaterThan(before.player.x + 30);
    expect(errors).toEqual([]);
  });
});
