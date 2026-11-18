import type { Page } from '@playwright/test';

export interface ZsState {
  roomId: string;
  player: { x: number; y: number; facing: string; depth: number };
  nearest: string | null;
  occluded: string[];
  props: { key: string; depth: number; alpha: number }[];
  fps: number;
  transitioning: boolean;
}

export async function boot(page: Page, query = '?fresh'): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`/${query}`);
  await page.waitForFunction(() => (window as any).__ZS?.state?.());
  await page.waitForTimeout(400);
  return errors;
}

export const state = (page: Page): Promise<ZsState> => page.evaluate(() => (window as any).__ZS.state());
export const teleport = (page: Page, x: number, y: number) => page.evaluate(([a, b]) => (window as any).__ZS.teleport(a, b), [x, y] as const);

export async function hold(page: Page, key: string, ms: number): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
}

export const SHOTS = 'docs/reviews/foundation';
