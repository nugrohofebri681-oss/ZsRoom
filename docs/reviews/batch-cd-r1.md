# Review — Batch C (PR #14) + Batch D (PR #15), round 1

**Reviewer:** Claude Code · **Base:** `reboot/foundation` `7e3706d` + PR #13 (audio/highlight) · **Status:** all ten masters **TECHNICAL PASS** (GitHub CI and the art workflow are green on both PRs).
- Nothing is approved and the production manifest is unchanged.
- The ten masters were integrated together in a **local scratch build** only, which used a throw-away manifest.
- Evidence: `docs/reviews/batch-cd-r1/` (13 images).

## Recommendations (technical review; the Creative Director decides VISUAL PASS)
| Asset | Recommendation | Why (in-game evidence) |
|---|---|---|
| `wall_window_bedroom` v001 | **Accept with documented noncritical exception** | **Glass:** fully transparent; every enclosed pane pixel (x 116–332, y 63–242) lies inside the engine sky rect (104–344 × 62–272). Day skyline and night moon/stars render correctly (03, 11). Curtain toggling works and is saved. **Exception:** the pivot is at the curtain hem (canvas y 288), so the painted sill sits 10 cm higher than a sill-pivot would put it (≈ 105 cm instead of 95 cm). This is correct for an art piece whose lowest pixel is the hem, and it is invisible in play. The frame is 240 px wide vs 280 nominal (height-limited export); it still reads as the room's main window. |
| `decal_rug_zila` v001 | **Accept v001** | Centred on (330, 320). The painted depth of 236 px vs 252 nominal (−6 %) is within tolerance. It draws under every standing prop and Zila. The soft-footstep region (260 × 180 cm footprint) matches the painted rug to within ~5 cm at the fringe. |
| `wall_shelf_books` v001 | **Accept with documented noncritical exception** | The top plane is 15 px vs 33.6 nominal. Seen from the room it reads correctly as a wall shelf with books and a succulent (12). Nothing is placed on it, so no surface anchor depends on that depth. |
| `wall_photos_string` v001 | **Accept with documented noncritical exception** | 52 px tall vs 80 nominal; the width is correct. The four travel scenes are readable at gameplay zoom (12) and read as photos at full-room scale. No people or private images. |
| `wall_fairy_lights` v001 | **Accept v001** | Spans the full 600 cm wall, level and aligned (02, 10). The bulbs are painted unlit as briefed. 32 bulbs instead of 24 is not a spec property. The **engine** now adds one soft glow per painted bulb, positioned from the measured v001 bulb centroids. |
| `wall_neon_goodvibes` v001 | **Accept v001** (engine change) | Painted tubes are off, with no painted bloom. "good vibes" is legible at desktop and phone scale (07, 10). The old engine core (36 cm) sat **on the lettering**; it is replaced by self-lit tubes (an additive light-coloured copy of the art), strong at night and faint by day. |
| `prop_plant_tall_zila` v001 | **Accept with documented noncritical exception** | The pot's top depth is 23 px vs 56 nominal, but at game scale the pot reads as a cylinder seen from slightly above (09). Collision is exact (Zila stops at y 316.1 = pot front + radius). Walking behind it fades the foliage to ~0.56 alpha, as for all occluders. |
| `prop_catbed_mochi` v001 | **Accept with documented noncritical exception** | The sleeping cat (ears, closed eyes, tail) reads clearly at full-room scale. The front wall is 26 px vs 44 px; it reads as a low plush bed, and the rim and base sit on the floor with a correct engine shadow. "Pet Mochi" works (13), collision is exact, and the highlight shows on approach. |
| `prop_pouf_floor` v001 | **Accept with documented exception + measured seat (engine)** | Painted as a believable low knit pouf: 54 cm wide, seat ≈ 30 cm. With the nominal 38 cm seat, Zila **floated ~9 cm** above the knit top (08 left). The spec's seat is now set to the **measured 30 cm**; the engine seat point is 47.5 render-cm above the pivot vs the painted seat-plane centre at 46.5, i.e. within 1 cm (unit-tested, 08 right). The TEMP figure's crude seated legs cannot judge final posture: re-check once the character art exists. |
| `prop_plant_small` v001 | **Accept with documented noncritical exception** | The pot's top depth is shallow (18 vs 49 px) but reads correctly at game scale. Collision is exact. **Placement:** the room layout had it in the far SW corner, while Request 006 says "the corner by the door". It is moved to **(285, 470)**, just left of the door opening (01, 02). Every interaction is still reachable (unit test). |

**Targeted v002 revisions: none required.** No asset has a visual or functional problem that the engine or a measured spec value cannot resolve without regeneration.

**Optional, not blocking (Codex, only if time permits):** a painted closed-curtains state of the window (`wall_window_bedroom` variant). The engine's closed curtains (now drawn behind the frame) are acceptable for v001.

## Engine and spec changes in this review branch (no artwork changes)
1. **String lights:** `light.points` gives the bulb centres (32, measured on the fairy-lights v001 master). The engine bakes every bulb glow into **one** small additive texture (one quad) and lifts the darkness locally around each bulb in the lightmap. The glow is drawn just above its own art, so characters in front still cover it.
2. **Self-lit neon:** `light.selfLit` adds an additive, light-coloured copy of the art (plus a soft 4 % larger copy) that lights the painted tubes. `coreSizeCm` is 0, so no dot covers the text.
3. **Glow by time of day:** the glows scale with the phase (faint in the afternoon, full at night).
4. **Closed curtains:** drawn between the sky and the window art, with soft vertical folds, so the painted frame, glazing bars and tie-backs stay on top (11). Before, a flat slab was painted over the frame.
5. **Pouf:** `heightsCm.seat`/`top` and the sit `heightCm` go from 38 to **30 cm**, measured on the v001 master (note in the spec).
6. **Room layout:** the small plant moves to beside the door (285, 470).
7. **Tests:**
   - 3 unit tests: the pouf seat matches the painted plane; the bulb points lie inside the art; the neon has no core and is self-lit.
   - 4 e2e tests: night vs day glow strength, a single glow quad, glow depth, and curtains between sky and art.

## Gameplay checks (scratch build, all 20 assets as approved art)
- **Full e2e suite:** 46/46 pass with every asset rendered as approved art. This covers movement, collision, save/load, sitting at desk and vanity, lamp, tap-to-move, zoom, tiles, room transition, audio and highlight, and the manifest-driven approved-asset checks.
- **Collision probes:**
  - Tall plant: stops at 316.1 (expected 316).
  - Pouf: 376.0 (376).
  - Cat bed: 436.0 (436).
  - Small plant: 93.5 from the east and 408.9 from the north (93.5 / 409).
- **Interactions:** pet Mochi, sit on the pouf, curtains (saved), and the photos all work. Transition to the upper hall and back works.
- **Alpha:** no halos or haze on light, dark or night backgrounds. Shadows: engine floor shadows are present for the plants, pouf and cat bed.
- **Camera:** full-room framing on desktop and in portrait (07). On short landscape phones the camera keeps Zila ≥ 36 % of the screen height, so the top strip of wall (fairy lights) comes into view as she walks north (06). This is existing, intended framing.
- **Highlight (PR #13) on the new art:** visible on the pale wall pieces and the dark wood. The soft halo shows around the tall plant's leaves behind Zila and never covers the art (09).

## Performance (headless software-rendered Chromium, 1280×720, walking; two runs each — not a device measurement)
| Build | fps afternoon | fps night | JS heap |
|---|---|---|---|
| TEMP art (review branch) | 35–36 | 22–23 | 20.2–21.5 MB |
| All 10 new assets (scratch) | 36 | 23 | 17.1–18.3 MB |

The runtime WebP for all 20 assets total **716 KB (HD) / 256 KB (SD)**, far inside the 48 / 16 MB budgets. The new glows add 1 quad (fairy lights) and 2 small quads (neon). The physical Android test is still outstanding.

## Integration plan (after VISUAL PASS)
1. Merge **PR #13**, then **this review branch**: engine, spec and test changes only, including the pouf's measured seat.
2. Take **only** the approved assets' files from PR #14 / #15 (`art/submissions/<id>/v001` plus sources) and run `approve-asset` for each. Record a geometry exception for the window (pivot at hem), shelf, photos, tall plant, cat bed, pouf (front 57 px; seat measured 30 cm) and small plant.
3. Full QA → staging branch with CI green on the exact commit → fast-forward `reboot/foundation`. `main` and Pages are never touched.
