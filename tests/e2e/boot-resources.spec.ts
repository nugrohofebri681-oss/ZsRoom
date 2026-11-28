import { expect, test } from '@playwright/test';
import { boot } from './helpers';

/**
 * Every resource a browser loads for the page must exist — including the ones it requests by itself.
 * Regression (G1.2 report, PR #47): without a declared icon, full Chromium (and every desktop/mobile browser)
 * requests /favicon.ico, which 404s on the preview server and on static hosts. The Playwright headless shell
 * never asks for an icon, so the default CI run could not see it; this test checks the declared icon directly.
 */
test('boot: the declared page icon resolves, and booting logs no errors', async ({ page, request }) => {
  const errors = await boot(page, '?fresh&fast&room=batuphat_street');
  const icons = page.locator('link[rel~="icon"]');
  expect(await icons.count(), 'index.html must declare an icon, or browsers fall back to /favicon.ico').toBeGreaterThan(0);
  const href = await icons.first().getAttribute('href');
  const url = new URL(href!, page.url()).toString();
  const r = await request.get(url);
  expect(r.status(), url).toBe(200);
  expect(r.headers()['content-type']).toContain('image/svg+xml');
  expect(errors).toEqual([]);
});
