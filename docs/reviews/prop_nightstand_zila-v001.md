# Review — `prop_nightstand_zila` v001 (PR #3, candidate C)

**Reviewer:** Claude Code (technical + consistency) · **Date:** 2026-11-18
**Status:** TECHNICAL PASS · VISUAL: **pending Creative Director** · PRODUCTION READY: no
**Recommendation:** **accept candidate C as v001. No v002.**

PR: https://github.com/nugrohofebri681-oss/ZsRoom/pull/3 (head `ea4ed3f`). Not merged and not approved. The in-game integration ran in a scratch copy only; the repository manifest is unchanged.

## Evidence (`docs/reviews/prop_nightstand_zila-v001/`)
| # | File | Shows |
|---|---|---|
| 01 | raw-candidates-abc | All three raw generator outputs |
| 02 | bed-pair-true-scale-light-night | Approved bed + candidate C at room positions, 2 px/cm, light and night floors |
| 03 | bed-pair-zoom-material | Close-up of the walnut finish next to the headboard |
| 04 | desktop-1080p-hd | In-game, 1920×1080, HD textures |
| 05 | desktop-720p-sd-interaction | In-game, 1280×720, SD textures, nightstand prompt |
| 06 | desktop-debug-collision-heights | `?debug`: collision, footprints, pivots, anchors, **designed 55 cm height line (orange)** |
| 07 | height-line-zoom-and-mobile-landscape | Painted top edge vs designed line; emulated phone, landscape, 2× |
| 08 | walkaround-and-mobile-portrait | Behind / beside / in front (free-standing in the review room); phone portrait |

## Technical results
- GitHub on `ea4ed3f`: **CI ✅** and **Art submission ✅**. Local `validate-art` reproduces **23/23**. The bed style reference is listed in `referencesUsed`, so there is no warning. Ownership is clean: 7 files, all in the allowed paths.
- Master is 160×224 RGBA, bounding box (31,32) 98×169, base row 200 (target 200), coverage 0.425. Runtime files are tiny: HD 17 KB, SD 6 KB.
- **Collision:** stops at y 68.3 coming from the south (expected 68) and x 242 coming from the right (expected 242).
- **Interaction:** "Open the nightstand" is chosen in front of it, and the bed's "rest" anchor is still chosen beside the bed. The two anchors don't conflict.
- **Depth sorting:** the player sorts in front when beside it. When behind it in the review room, the 55 cm body overlaps Zila's legs and **does not fade**, which is correct for low furniture (Art Bible §12).
- **Shadow:** the engine shadow renders and grounds the piece.
- **Textures:** SD loads at 720p, HD at 1080p and on mobile. Zero console errors in all sessions.

## Visual comparison with the approved bed
| Aspect | Measurement / observation | Verdict |
|---|---|---|
| Walnut colour | Median wood CIELAB: bed L\* 40.4 a\* 22.4 b\* 28.7; nightstand L\* 41.7 a\* 21.4 b\* 26.9. **ΔE 2.4**, about the just-noticeable threshold. Hue differs by only 0.5°; the nightstand is slightly *less* saturated. | **Match.** It is not oranger. |
| Painted finish | Grain contrast (neighbour luminance difference): bed 13.9, nightstand 10.0. The nightstand is calmer. Same rounded edges and soft rim highlights. The large top shows slightly more veneer-like straight grain. | Match, minor |
| Line work | Coloured dark-walnut contours with weights equivalent to the bed's at 2 px/cm. No black. | Match |
| Lighting | Soft, nearly frontal, like the bed. Highlights are actually dimmer than the bed's (90th-percentile L\* 50.9 vs 55.8). | Match |
| Perspective | Oblique and parallel, with no outer side faces (unlike A and B). The shelf's inner side walls are correctly visible. | Correct |
| Identity | Thin blush drawer trim echoes the headboard panel; the cream doily echoes the sheet. | Good |

## The 10–12 px tabletop discrepancy
- The painted top front edge sits at y ≈ 78–80 instead of 90. The top therefore reads about 40 cm deep → about 33 cm, and the front about 55 → 60 cm.
- This is **at the edge of the new tolerance** (Art Bible §11 v1.3: ±10%, i.e. ±11 px for a 55 cm face).
- **Gameplay impact: none.** Collision, depth sorting, shadow and interaction come from the spec, not the pixels, and all measured exactly.
- **Visual impact at gameplay zoom: not material.** In 04, 05, 07 and 08 the nightstand reads naturally as a bedside table at mattress height. The mattress edge is never seen directly next to it, so the 5 cm can't be compared by eye.
- **Real but minor consistency note:** the bed drifts slightly *steeper* than the spec (implied camera pitch ≈ 41°) and the nightstand slightly *flatter* (≈ 28°) than the designed ≈ 35°. Up close you see a bit more of the nightstand's front than of the bed's. This is a process risk for later furniture, not a reason to regenerate this one. It is handled by the new §11 rule: report measured rows, and compare pitch against approved neighbours.
- **Future surface placement:** when a lamp is placed on the nightstand, it must use the painted top (about 60 cm visual height), not the nominal 55 cm. On approval, the measured surface height will be recorded so props placed on top use it.

## Candidates
- **A:** the top flares wider than the body and the proportions are squat.
- **B:** the tabletop converges toward the back (perspective error), and the pink drawer dominates.
- **C:** parallel edges, a restrained trim, and the best match to the bed. **C is the right pick.**

## Recommendation
Grant VISUAL PASS to candidate C v001 once the Creative Director agrees. The priority this request set — the bed's walnut colour and painted finish — is met by measurement and by eye. A v002 would only chase a 5 cm geometric deviation with no gameplay consequence.

If the Creative Director prefers a v002 anyway, keep it narrow: *same design and wood; tabletop front edge on y 90 (top depth 56 px); front face 110 px; nothing else changes.*
