# Review — Batch E r1 (PR #19): bedroom floor + wall tiles

**Reviewer:** Claude Code · **Base:** `reboot/foundation` `7796f60` (20 approved bedroom assets) · **Status:** both masters **TECHNICAL PASS**. Nothing is approved and the production manifest is unchanged. The scratch integration was local only. Evidence: `docs/reviews/batch-e-r1/`.

## Why PR #19's CI failed
- `npm run gallery` crashed, because the gallery read `spec.pivot`, which environment tiles do not have.
- Artwork validation itself passed:
  - every strict production check;
  - seam delta 0.0 on both edges of the floor and on the wall's left/right edge.
- **Fixed in the tooling branch** (`claude/art-pipeline-env-concept`). Environment specs now get their own gallery card:
  - the single tile;
  - the repeat (**X+Y for the floor, X only for the wall**) at HD, with tile edges marked, at SD, and zoomed out ×0.5 (moiré check);
  - for walls, a wall-over-floor room composite.
- Production validation is unchanged. Once the fix is merged, re-running PR #19's checks should pass (reproduced locally).

## In-game review (scratch build: both tiles through `approve-asset`, all 20 approved props)
| Check | Floor `env_floor_planks_honey` v001 | Wall `env_wall_bedroom` v001 |
|---|---|---|
| **Seams in play** | None visible at min, default or max zoom, HD or SD (04) | None visible; the 60 cm strip repeats with evenly spaced wainscot panels (03) |
| **Repetition** | Faint repeating diagonal grain highlights in the wide preview (08); not noticeable under furniture in play | Plain textured wallpaper; repetition reads as intended panelling |
| **Scale** | ~15 cm planks, consistent with the bed and desk | Wainscot (to 90 cm) and the chair rail line up with the desk and vanity heights (03) |
| **Cohesion** | Lighter honey oak; good contrast with the walnut furniture (01) | Warmer, more saturated pink than the TEMP wall. Matches the bedding, curtains and wardrobe panels. Pink-on-pink lowers contrast for the curtains and the **unlit neon by day**; at night the engine lights the tubes and it reads clearly (02) |
| **Lighting** | Flat, evenly lit; engine light pools read correctly at night (02) | Same |
| **Android** | Correct in landscape and portrait, at default and evening zoom (05–07) | Same |
| **Errors** | None | None |

## Recommendation (the Creative Director decides VISUAL PASS)
- **`env_floor_planks_honey` v001: VISUAL PASS candidate.**
- **`env_wall_bedroom` v001: VISUAL PASS candidate.** One note for the CD: the wall is noticeably pinker than the TEMP version. If daytime contrast for the neon and curtains matters, a **v002 tone-down of the wallpaper by about 10 % saturation** is the only targeted change I would consider; it is not required for function.
- **No geometry exceptions:** both canvases match the spec exactly (256×126, 120×540).
- **Integration plan after VISUAL PASS:**
  1. Merge the tooling branch first.
  2. Selectively integrate the two v001 folders with `approve-asset`.
  3. Run full QA and the staging CI gate, then fast-forward `reboot/foundation`.
- This completes the bedroom: 22 approved assets, with no TEMP art left in the room except Zila herself.
