# Review — `prop_bed_zila` v001 (PR #1, candidate C)

**Reviewer:** Claude Code (technical + consistency) · **Date:** 2026-11-18
**Status:** TECHNICAL PASS · VISUAL: **pending Creative Director** · PRODUCTION READY: no
**Recommendation:** accept candidate C as v001. No v002 regeneration needed.

PR: https://github.com/nugrohofebri681-oss/ZsRoom/pull/1. Not merged, and the manifest is not modified. The gameplay integration below ran in a scratch copy only.

## Evidence (`docs/reviews/prop_bed_zila-v001/`)
| # | File | Shows |
|---|---|---|
| 01 | raw-candidates-abc | All three raw generator outputs on checker |
| 02 | master-template-floors-sd | Master with spec template overlay; light floor; night floor; SD 1 px/cm |
| 03 | desktop-720p-sd-rest | In-game, 1280×720, SD texture, character at the "rest" anchor |
| 04 | desktop-debug-collision-pivot | `?debug`: collision (red), footprint (pink), pivot (+), anchors (green) |
| 05 | occlusion-shadow-before-after | Engine fixes made during this review |
| 06 | review-room-in-front | Free-standing bed, character in front of the foot |
| 07 | desktop-1080p-hd | 1920×1080, HD texture |
| 08 / 09 | mobile-landscape / portrait | Emulated budget Android at 2× DPR, HD texture |

## Technical assessment
- `validate-art` reproduces locally: **23/23 checks pass**. Canvas 384×576, bounding box (67,34) 250×511, base row 543 vs pivot 544, coverage 0.54. Ownership is clean: 7 files, all in the allowed paths. The PR's GitHub art workflow also passed.
- **Pivot alignment:** the legs land on the pivot line, and the painted bed matches the footprint and collision box (04).
- **Collision:** stops at x = 191 approaching from the right (expected 174 + 16) and y = 229 approaching from the south (expected 228). No art hangs outside the 128 cm collision width.
- **Depth sorting:** correct beside the bed, near the head, and in front of the foot (05, 06).
- **Geometry vs spec:**
  - The front (foot) face is about 49.5 cm tall vs 55 cm.
  - The headboard top is at y 35 vs 44, so about 4.5 cm too tall.
  - Both are within about 10% and invisible at gameplay zoom.
- **Alpha:** 97% of solid pixels are alpha 250–254. That's imperceptible on screen, but technically incorrect. The pipeline now snaps these to 255 in runtime textures and in `fit-to-spec`, so no re-export is needed.
- **Runtime cost:** HD 136 KB, SD 40 KB lossless WebP. The correct density loaded at every viewport tested. Zero console errors.

## Artistic assessment
**Strengths**
- Premium painted look that is clearly not pixel art and not a 3D render.
- Coherent palette that hits the Art Bible tokens.
- Clean edges on both light and night floors, with no halos.
- Parallel sides with no perspective flare.
- The heart cushion is an iconic, readable identity mark, even at phone scale.
- Strong continuity with the original room: pink duvet, cream pillows, wooden headboard, heart cushion.

**Minor deviations (not worth a revision on their own)**
- The upper-left key light is weak; the shading is nearly frontal and symmetric.
- Line hierarchy is softer than the Art Bible asks for, but the silhouette still reads at SD thanks to value contrast.
- The rendering is slightly "plush/product-like". This should become the style anchor so later assets match it, rather than pushing the bed toward other assets.

**Candidates**
- **A:** almost no front (foot) face, so it reads as a flat plan view. The diamond quilting gets busy at SD.
- **B:** strongest foot drape, but the duvet flares wider toward the foot, which breaks the parallel-projection rule.
- **C:** parallel silhouette, clear foot face, quiet square quilting that reads best at small size. **C is the right pick.**

## Problems found in gameplay — all engine-side, fixed on `claude/art-review-tools`
1. **Low furniture faded when the character stood behind it** (05 before): the whole bed dropped to 40%. Now objects fade only when they hide the character's head and shoulders. A unit test covers this.
2. **No cast shadow:** the Art Bible assigns floor shadows to the engine, which didn't draw them yet. Now there's a soft footprint shadow offset away from the upper-left light.
3. **Walnut bed on a walnut floor** hid the legs. The grey-box floors are now lighter, and Art Bible v1.1 §6 requires floors to be visibly lighter than furniture wood.
4. **Phone landscape camera** framed the bed too small. The character is now about 36% of screen height on short screens.
5. **Portrait mode:** the interact prompt was under the E button. The prompt is moved up.
6. **Near-opaque alpha** is snapped to 255 in the pipeline (Art Bible v1.1 §13).

## Decision requested
- **Recommended:** grant VISUAL PASS to v001 candidate C. Claude then runs `approve-asset`, merges PR #1 into `reboot/foundation`, and runs gameplay regression.
- **Alternative:** if you want stronger directional light or crisper contours as a house standard, say so. A v002 brief will target only those two points.
