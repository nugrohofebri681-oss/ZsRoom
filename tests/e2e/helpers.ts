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

/**
 * Walk (tap-to-move) to a door's spot and use it with E / the touch button. `expect` may be a map id or a
 * zone (legacy room id) of a continuous floor, e.g. 'living_room' on 'home_ground'.
 */
export async function useDoor(page: Page, isMobile: boolean, doorId: string, expectRoom: string): Promise<void> {
  const a = await page.evaluate((id) => (window as any).__ZS.doorSpot(id), doorId);
  if (!a) throw new Error(`door ${doorId} not on this map`);
  await page.evaluate(([x, y]) => (window as any).__ZS.tapWorld(x, y), [a.x, a.y]);
  await until(page, 's.path === 0', 20000);
  await until(page, `s.nearest === 'door:${doorId}'`);
  await press(page, isMobile);
  await until(page, `(s.roomId === '${expectRoom}' || s.zone === '${expectRoom}') && !s.transitioning`, 8000);
  await page.waitForTimeout(250);
}

/**
 * Walk across a continuous floor into another zone (room) with tap-to-move: asserts there is NO scene restart
 * and that the camera really scrolled (world position of the view changes).
 */
export async function walkToZone(page: Page, zone: string): Promise<void> {
  const before = (await state(page)) as any;
  const sp = await page.evaluate((z) => (window as any).__ZS.zoneSpawn(z), zone);
  if (!sp) throw new Error(`zone ${zone} not on ${before.roomId}`);
  await page.evaluate(([x, y]) => (window as any).__ZS.tapWorld(x, y), [sp.x, sp.y]);
  await until(page, `s.path === 0 && s.zone === '${zone}'`, 20000);
  const after = (await state(page)) as any;
  if (after.sceneStarts !== before.sceneStarts || after.roomId !== before.roomId) throw new Error(`scene restarted while walking ${before.zone} → ${zone}`);
  // The camera follows Zila: it must pan when the floor is wider than the view, and otherwise keep a stable
  // framing (the whole floor is visible — no hidden re-framing jump at the doorway).
  const floorW = Math.max(...(after.zones ?? [{ x: 0, w: 0 }]).map((z: any) => z.x + z.w)) + 120;
  const dx = Math.abs(after.camera.scrollX - before.camera.scrollX);
  if (after.camera.viewW < floorW - 50 && dx < 40) throw new Error(`camera did not pan (${before.camera.scrollX} → ${after.camera.scrollX})`);
  if (after.camera.viewW >= floorW + 50 && dx > 2) throw new Error(`framing jumped although the whole floor is visible (${dx})`);
}

/** Tap the visible part of an object (ground x/y + height z): Zila walks to its interaction spot and uses it. */
export async function tapObject(page: Page, x: number, y: number, z: number, used: string): Promise<void> {
  await page.evaluate(([gx, gy, gz]) => (window as any).__ZS.tapWorld(gx, gy, gz), [x, y, z]);
  await until(page, `s.path === 0 && s.pending === null && (${used})`, 20000);
  await page.waitForTimeout(150);
}


/** Dimsum workplace (cashier duty): clock in → 3× (take order from the customer → kitchen pass → hand over & pay) → clock out. */
export async function dimsumShift(page: Page, isMobile: boolean, shot?: string): Promise<void> {
  await tapObject(page, 640, 4, 148, "s.vars.shift === 'in_progress'");                       // time clock
  for (let n = 1; n <= 3; n++) {
    await page.evaluate(() => (window as any).__ZS.tapWorld(600, 410)); await until(page, 's.path === 0', 15000);
    await until(page, "s.nearest === 'npc:npc_dimsum_customer'");
    await press(page, isMobile);
    await until(page, "s.vars.order === 'taken'");
    await closeDialogue(page, isMobile);
    await tapObject(page, 400, 130, 80, "s.vars.order === 'ready'");                           // kitchen pass
    await tapObject(page, 600, 300, 80, `s.vars.ordersDone === ${n}`);                         // cashier counter
    if (shot && n === 2 && !isMobile) await page.screenshot({ path: shot });
  }
  await until(page, 's.npcs.find((x) => x.id === "npc_dimsum_customer").visible === false');   // no customer waiting after 3 orders
  await tapObject(page, 730, 4, 148, 's.modal === true');
  await closeDialogue(page, isMobile);
}
