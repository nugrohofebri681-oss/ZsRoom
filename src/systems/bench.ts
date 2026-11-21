import type * as Phaser from 'phaser';
import type { RenderScaleController } from './renderScale';

/**
 * Low-cost device benchmark: open the game with `?fresh&bench` on the phone (see docs/production/ANDROID_PERF_TEST.md).
 * It tours the heaviest maps at night at the native render scale, 1.5× and 1×, measures real frame intervals with
 * requestAnimationFrame, and shows a copyable result card. Nothing is uploaded anywhere.
 * (Headless/emulated numbers are a proxy only; only a run on the physical device counts as a device result.)
 */
interface Row { map: string; phase: string; scale: number; avgFps: number; p5Fps: number; worstMs: number; frames: number }

const MAPS: { map: string; phase: string; walk: [number, number][] }[] = [
  { map: 'zila_bedroom', phase: 'night', walk: [[150, 330], [600, 330]] },
  { map: 'batuphat_street', phase: 'night', walk: [[300, 300], [1500, 300]] },
  { map: 'batuphat_west', phase: 'night', walk: [[2200, 420], [900, 420]] },
  { map: 'batuphat_street', phase: 'afternoon', walk: [[1500, 300], [300, 300]] },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
type ZS = { setVars: (v: Record<string, unknown>) => void; teleport: (x: number, y: number) => void; tapWorld: (x: number, y: number) => void };
const zs = () => (window as unknown as { __ZS?: ZS }).__ZS;

function measure(ms: number): Promise<{ avgFps: number; p5Fps: number; worstMs: number; frames: number }> {
  return new Promise((resolve) => {
    const dts: number[] = []; let last = performance.now(); const end = last + ms;
    const tick = (t: number) => {
      dts.push(t - last); last = t;
      if (t < end) requestAnimationFrame(tick);
      else {
        const sorted = [...dts].sort((a, b) => a - b), total = dts.reduce((a, b) => a + b, 0);
        resolve({ avgFps: +(1000 * dts.length / total).toFixed(1), p5Fps: +(1000 / sorted[Math.floor(sorted.length * 0.95)]!).toFixed(1), worstMs: +sorted[sorted.length - 1]!.toFixed(1), frames: dts.length });
      }
    };
    requestAnimationFrame(tick);
  });
}

function gpuName(): string {
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    return String(ext ? gl!.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl?.getParameter(gl.RENDERER) ?? 'unknown');
  } catch { return 'unknown'; }
}

export function runBenchIfRequested(game: Phaser.Game, rs: RenderScaleController): void {
  if (!new URLSearchParams(location.search).has('bench')) return;
  rs.mode = 'sharp';                                          // the bench sets scales itself; no auto changes meanwhile
  game.events.once('room-entered', async () => {
    const scales = [...new Set([rs.native, 1.5, 1].filter((s) => s <= rs.native))];
    const rows: Row[] = [];
    const status = overlay();
    for (const scale of scales) {
      rs.apply(scale);
      for (const m of MAPS) {
        status(`Benchmark… ${m.map} · ${m.phase} · render scale ${scale}  (${rows.length + 1}/${scales.length * MAPS.length})`);
        const entered = new Promise<void>((r) => game.events.once('room-entered', () => r()));
        game.scene.getScene('Room').scene.restart({ roomId: m.map, spawn: 'default' });
        await entered; await wait(1200);
        zs()?.setVars({ phase: m.phase }); zs()?.teleport(...m.walk[0]!); zs()?.tapWorld(...m.walk[1]!);
        await wait(600);
        rows.push({ map: m.map, phase: m.phase, scale, ...(await measure(5000)) });
      }
    }
    const result = {
      zsroomBench: 1, date: new Date().toISOString(), userAgent: navigator.userAgent, gpu: gpuName(),
      screen: { css: [innerWidth, innerHeight], devicePixelRatio: devicePixelRatio, nativeRenderScale: rs.native },
      heapMB: (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory ? Math.round((performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize / 1e6) : null,
      rows,
    };
    (window as unknown as { __ZS_BENCH?: unknown }).__ZS_BENCH = result;
    console.log('ZSROOM_BENCH', JSON.stringify(result));
    rs.apply(rs.native);
    status(null, result);
  });
}

function overlay(): (msg: string | null, result?: { rows: Row[]; gpu: string }) => void {
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;left:8px;right:8px;top:8px;z-index:10;background:#2a1c22f0;color:#fff4f7;font:12px/1.4 system-ui,sans-serif;padding:10px;border-radius:10px;max-height:90vh;overflow:auto';
  document.body.appendChild(box);
  return (msg, result) => {
    if (msg) { box.textContent = msg; return; }
    if (!result) return;
    const rows = result.rows.map((r) => `<tr><td>${r.map}</td><td>${r.phase}</td><td>${r.scale}</td><td><b>${r.avgFps}</b></td><td>${r.p5Fps}</td><td>${r.worstMs}</td></tr>`).join('');
    box.innerHTML = `<b>ZsRoom benchmark</b> · GPU: ${result.gpu}<br><table style="border-collapse:collapse;margin:6px 0" cellpadding="3"><tr><th align=left>map</th><th>time</th><th>scale</th><th>avg fps</th><th>5% low</th><th>worst ms</th></tr>${rows}</table>
      <button id="zsb-copy" style="font-size:14px;padding:8px 14px;border-radius:8px;border:0;background:#c0607e;color:#fff">Copy results</button> <button id="zsb-close" style="font-size:14px;padding:8px 14px;border-radius:8px;border:0">Close</button>`;
    box.querySelector('#zsb-copy')!.addEventListener('click', () => { void navigator.clipboard?.writeText(JSON.stringify((window as unknown as { __ZS_BENCH: unknown }).__ZS_BENCH, null, 2)); });
    box.querySelector('#zsb-close')!.addEventListener('click', () => box.remove());
  };
}
