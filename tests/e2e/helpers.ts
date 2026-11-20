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

// ---------------------------------------------------------------- World 01 route helpers
export async function closeDialogue(page: Page, isMobile: boolean): Promise<void> {
  for (let i = 0; i < 12 && ((await state(page)) as any).modal; i++) { await press(page, isMobile); await page.waitForTimeout(120); }
  await until(page, 's.modal === false');
}

export function doorAnchor(roomId: string, doorId: string): { x: number; y: number } {
  const r = roomData(roomId), d = r.doors.find((x: any) => x.id === doorId), { w, h } = r.sizeCm;
  const side = d.side ?? (d.y <= 10 ? 'north' : d.y >= h - 20 ? 'south' : d.x <= 10 ? 'west' : 'east');
  return side === 'north' ? { x: d.x + d.w / 2, y: 25 } : side === 'south' ? { x: d.x + d.w / 2, y: h - 15 } : side === 'west' ? { x: 15, y: d.y + d.h / 2 } : { x: w - 15, y: d.y + d.h / 2 };
}

/** Walk (tap-to-move) to a door's spot, then use it with E / the touch button. */
export async function useDoor(page: Page, isMobile: boolean, doorId: string, expectRoom: string): Promise<void> {
  const from = ((await state(page)) as any).roomId, a = doorAnchor(from, doorId);
  await page.evaluate(([x, y]) => (window as any).__ZS.tapWorld(x, y), [a.x, a.y]);
  await until(page, 's.path === 0', 20000);
  await until(page, `s.nearest === 'door:${doorId}'`);
  await press(page, isMobile);
  await until(page, `s.roomId === '${expectRoom}' && !s.transitioning`, 8000);
  await page.waitForTimeout(250);
}

/** Tap the visible part of an object (ground x/y + height z): Zila walks to its interaction spot and uses it. */
export async function tapObject(page: Page, x: number, y: number, z: number, used: string): Promise<void> {
  await page.evaluate(([gx, gy, gz]) => (window as any).__ZS.tapWorld(gx, gy, gz), [x, y, z]);
  await until(page, `s.path === 0 && s.pending === null && (${used})`, 20000);
  await page.waitForTimeout(150);
}

