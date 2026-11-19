# Art Request 007 — Batch E: Room shell tiles

**Read first:** [`BATCH_RULES.md`](BATCH_RULES.md) · Art Bible v1.5 · approved references (bed, nightstand) · in-room context: `docs/reviews/foundation/desktop-sprint-04-night-baked-lighting.png` (the TEMP tiles in place).

**Branch:** `codex/art/batch-e-r1` → one **draft** PR. Each tile has its own folder, metadata, validation and approval.

| Asset | Canvas | Repeats | What it is | Spec |
|---|---|---|---|---|
| `env_floor_planks_honey` | 256×126 | x **and** y | 128 × 90 cm of honey-oak floor, seen at ×0.7: **6 planks of 15 cm running east–west**, with staggered joints | [spec](../../specs/environments/env_floor_planks_honey.json) |
| `env_wall_bedroom` | 120×540 | x only | One 60 cm wide, full-height (270 cm) strip of the back wall. Bands from the floor: skirting 0–12, wainscot panel 12–90, chair rail 88–92, blush wallpaper 92–264, crown 264–270 cm | [spec](../../specs/environments/env_wall_bedroom.json) |

## Must-haves
- **Seamless.** Opposite edges must continue into each other. `validate-art` measures the mean left↔right (and, for the floor, top↔bottom) edge difference and fails above 14. Paint across the wrap, or use the free *offset/wrap* tools in Krita or Photopea to clean the seams, and note that step in `postProcessing`.
- **Fully opaque.** These are backgrounds, so no transparency.
- **Value separation (Art Bible §6):** the floor must be clearly **lighter** than the walnut furniture, so legs and frames read against it. The wall stays soft and low-contrast, so props and the window read in front of it.
- **Quiet repetition.** No single knot, stain or ornament that becomes an obvious repeating stamp. Keep any wallpaper motif to a tiny, regular dot or stripe rhythm that divides 60 cm evenly (e.g. a 20 cm period).
- Same painted finish and upper-left light as the approved bed and nightstand. No baked shadows of furniture.

Fit to the exact canvas (tiles are not trimmed): `node scripts/fit-to-spec.mjs` is **not** suitable for tiles. Export at exactly 256×126 / 120×540, run `npm run validate:art`, and check the in-game look with `npm run dev` after copying your PNG over the TEMP tile locally (do not commit that copy).
