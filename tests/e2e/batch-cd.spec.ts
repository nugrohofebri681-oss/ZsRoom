import { expect, test } from '@playwright/test';
import { boot, state, until } from './helpers';

const light = (s: any, id: string) => s.lights.find((l: any) => l.key.startsWith(id));

test('string lights glow per bulb and neon tubes self-light at night, faintly by day; no core over the neon text', async ({ page }) => {
  const errors = await boot(page);
  await page.evaluate(() => (window as any).__ZS.setVars({ phase: 'afternoon' }));
  let s: any = await state(page);
  const dayFairy = light(s, 'wall_fairy_lights'), dayNeon = light(s, 'wall_neon_goodvibes');
  expect(dayFairy.glows).toBe(1);                       // one baked quad for all 32 bulbs
  expect(dayNeon.core).toBe(false);
  expect(dayNeon.glows).toBeGreaterThan(0);
  await page.evaluate(() => (window as any).__ZS.setVars({ phase: 'night' }));
  s = await state(page);
  expect(light(s, 'wall_fairy_lights').glowAlpha).toBeGreaterThan(dayFairy.glowAlpha * 3);
  expect(light(s, 'wall_neon_goodvibes').glowAlpha).toBeGreaterThan(dayNeon.glowAlpha * 3);
  // glows sit just above their own art, never above characters/furniture in front of the wall
  const fairyProp = s.props.find((p: any) => p.key.startsWith('wall_fairy_lights'));
  expect(light(s, 'wall_fairy_lights').glowDepth).toBeLessThan(fairyProp.depth + 1);
  expect(errors).toEqual([]);
});

test('closed curtains draw between the sky and the window art (painted frame stays on top)', async ({ page }) => {
  const errors = await boot(page);
  await page.evaluate(() => (window as any).__ZS.setVars({ curtainsClosed: true }));
  await until(page, 's.windows.length > 0 && s.windows[0].curtainsVisible');
  const s: any = await state(page);
  const win = s.props.find((p: any) => p.key.startsWith('wall_window_bedroom'));
  expect(s.windows[0].curtainDepth).toBeGreaterThan(s.windows[0].skyDepth);
  expect(s.windows[0].curtainDepth).toBeLessThan(win.depth);
  expect(errors).toEqual([]);
});
