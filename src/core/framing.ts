/**
 * Exploration camera framing (P4). The camera follows Zila smoothly and shows a wide slice of the world:
 * the character is a SMALL share of the screen height (classic 2D exploration framing), and the map is never
 * squeezed to fit — small rooms simply sit centred in the dark surround, big floors scroll.
 *
 *   desktop            interior 15 %  · exterior 14 %   (target range 12–18 %)
 *   phone landscape    interior 20 %  · exterior 19 %   (target range 16–24 %; CSS height < 500)
 *
 * Manual zoom (wheel, pinch, ± buttons) multiplies on top. HD art is simply sampled down; never pixelated.
 */
export const FRAMING = { desktop: { interior: 0.15, exterior: 0.14 }, phoneLandscape: { interior: 0.2, exterior: 0.19 } } as const;

/** Target share of the screen height for the character. */
export function characterShare(cssHeight: number, exterior: boolean): number {
  const f = cssHeight < 500 ? FRAMING.phoneLandscape : FRAMING.desktop;
  return exterior ? f.exterior : f.interior;
}

/** Camera zoom (render px per world unit) so the character spans `share` of the canvas height. */
export function exploreZoom(canvasHeight: number, dpr: number, characterCm: number, exterior: boolean, zoomMul = 1): number {
  return ((canvasHeight * characterShare(canvasHeight / dpr, exterior)) / characterCm) * zoomMul;
}
