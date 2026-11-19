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

import { readFileSync } from 'node:fs';
/** Room data straight from the game's JSON, so tests follow layout changes instead of hard-coding them. */
export function roomData(id: string): any { return JSON.parse(readFileSync(`src/data/rooms/${id}.json`, 'utf8')); }
export function propEntry(roomId: string, assetId: string): any { return roomData(roomId).props.find((p: any) => p.assetId === assetId); }
export const press = async (page: Page, isMobile: boolean) => {
  if (isMobile) await page.locator('canvas').tap({ position: { x: 800 - 64, y: 360 - 70 } });
  else await page.keyboard.press('KeyE');
};

/** Wait until the game state satisfies a predicate (frame-rate independent). */
export async function until(page: Page, fn: string, timeout = 8000): Promise<void> {
  await page.waitForFunction(`(() => { const s = window.__ZS.state(); return ${fn}; })()`, null, { timeout });
}

/** Hold a key until the state predicate holds (or timeout): frame-rate independent movement for slow CI runners. */
export async function holdUntil(page: Page, key: string, fn: string, timeout = 12000): Promise<void> {
  await page.keyboard.down(key);
  try { await until(page, fn, timeout); } finally { await page.keyboard.up(key); }
}
