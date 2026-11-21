/**
 * Render-resolution policy. The canvas backing store is rendered at device pixels (capped at 2x for
 * budget-Android fill-rate) and shown at CSS size, so HD illustrated art stays sharp on phones.
 */
export const MAX_RENDER_DPR = 2;
export function renderDpr(search = '', qa = false): number {
  // QA/dev builds only: `?dpr=1.5` overrides the render scale (performance measurements, adaptive-resolution study).
  const forced = qa ? Number(new URLSearchParams(search).get('dpr')) : NaN;
  const want = Number.isFinite(forced) && forced > 0 ? forced : window.devicePixelRatio || 1;
  return Math.max(1, Math.min(want, MAX_RENDER_DPR));
}
