import { expect, test } from '@playwright/test';

/**
 * Browsers using full Chromium can implicitly request /favicon.ico when HTML
 * has no icon declaration. The headless shell used by CI often does not.
 * Test the declared icon explicitly, regardless of Playwright browser mode.
 */
test('web app declares a usable favicon without a missing-asset 404', async ({ page }) => {
  const errors: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });

  await page.goto('/?fresh&fast&room=front_yard');
  const icon = page.locator('head link[rel="icon"]');
  await expect(icon).toHaveCount(1);
  expect(await icon.getAttribute('type')).toBe('image/svg+xml');

  const href = await icon.getAttribute('href');
  expect(href).toBeTruthy();
  const url = new URL(href!, page.url());

  // Explicitly request the icon because headless shell may not do so.
  const response = await page.request.get(url.href);
  expect(response.status(), `favicon URL: ${url.href}`).toBe(200);
  expect(response.headers()['content-type']).toContain('image/svg+xml');
  expect(await response.text()).toContain('<svg');

  expect(errors, 'unexpected HTTP failure during game boot').toEqual([]);
});
