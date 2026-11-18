/**
 * Render-resolution policy. The canvas backing store is rendered at device pixels (capped at 2x for
 * budget-Android fill-rate) and shown at CSS size, so HD illustrated art stays sharp on phones.
 */
export const MAX_RENDER_DPR = 2;
export function renderDpr(): number {
  return Math.max(1, Math.min(window.devicePixelRatio || 1, MAX_RENDER_DPR));
}
