# Review — Batch B r1 (PR #7) + lamp v001 (PR #6)

**Reviewer:** Claude Code · **Status:** all six TECHNICAL PASS (GitHub CI + art workflow green). Nothing approved; the manifest is unchanged. In-game integration ran in scratch builds only:
- **A:** as submitted.
- **B:** with no-regeneration corrections (lamp re-fitted by height, vanity despeckled).

Evidence: `docs/reviews/batch-b-r1/` (11 images).

## Verdicts
| Asset | Verdict | Why (in-game evidence) |
|---|---|---|
| `prop_wardrobe_zila` | **Ready for visual approval** | Best of the batch: walnut and pink panels match the bed and nightstand, clean alpha, correct collision and base. The top plane is −27 % (just outside the 25 % tolerance) and invisible in play. Approve with a recorded geometry exception. |
| `prop_lamp_zila` | **Targeted revision: re-export only** (v002) | v001 is toy-sized because width-fitting a wide-shaded candidate shrank it, and the engine glow floats above the shade (04). Candidate B re-fitted with `--height 106` sits at true scale on the nightstand with the glow inside the shade, and passes validation. The shallow shade ellipse is acceptable at game scale. |
| `prop_desk_zila` | **Targeted revision** | The painted laptop faces the **wall** (CD correction; caused by the wording of my r1 request). The top plane is −46 %. The wood and pedestal design are good: keep them, remove the objects, deepen the top. |
| `prop_chair_desk` | **Targeted revision** | Painted as a **front view**: the full seat shows below the backrest, so the empty chair faces away from the desk (06, 10). Seated alignment works, because Zila's back hides it, but the empty state is wrong. A rear view is needed. |
| `prop_vanity_zila` | **Targeted revision** | Charming, and true to the original room's bulb mirror. Tabletop depth −60 % and front +16 %; 27 stray alpha flecks (cleanable with `--despeckle`, no regeneration). The deeper top matters for future makeup props on the vanity. |
| `prop_stool_vanity` | **Targeted revision** | Seat too low (≈ 37 cm vs 45; front −18 %) and the seat ellipse too side-on (0.45 vs 0.7). Sitting works (06), but next to the vanity the stool reads small. |

**Needs additional gameplay review:** none blocking. One open item: once character art exists, re-check sitting on the chair, whose backrest should overlap Zila's lower back.

## Checks that passed in-game
- **Collision:** boxes and footprints match every painted base (07).
- **Sitting:** works at the desk and the vanity.
- **Layering:** correct between Zila and the chair, desk and stool.
- **Lighting:** lamp, fairy-light and neon lighting is correct at night.
- **Android:** landscape and portrait layouts are correct after the HD tile fix (08, 09).
- **Errors:** zero console errors in either configuration.

## Bug found during this review (PR #8 code)
At HD tile density (Android 2×), floor and wall tiles drew at double size past the room's right wall cap: Phaser 4's Blitter ignores object scale. Fixed with cropped tile quads plus an SD/HD bounds regression test, pushed to PR #8's branch (`586977e`).

## Desk / laptop design correction (Creative Director)
- The desk art is **clean**. The laptop (`prop_laptop_zila`) and mug (`prop_mug_zila`) are **independent surface props** on the desk's top surface (anchors `laptop` and `mug`, nominal until the desk is approved and re-measured; the manifest validator refuses desk approval without a measured surface).
- **Laptop orientation:** Zila sits SOUTH of the desk facing NORTH. The keyboard is on the south half of the base, the hinge is at the north edge, and the screen stands at the back with its **display facing south**, toward Zila and the viewer.
- **Interaction:** "Use the laptop" exists only **while seated on the desk chair** (a new `whileSeatedOn` anchor rule); standing at the desk offers only "Sit at the desk". Unit and e2e tests cover this (11).
- Art Request 004 is corrected, and its wrong r1 sentence is struck through with an explanation.

## Safe integration plan
1. **PR #8 (sprint) first:** it now includes the tile fix. Merge after CI is green on `586977e`. It touches only engine, tests and docs.
2. **Then the review branch** `claude/review-batch-b-desk-fix`: the desk/laptop correction, seated interactions, `fit-to-spec --height/--despeckle`, round-2 briefs and this review. It is based on PR #8, so it merges cleanly after it.
3. **Art:** on the CD's VISUAL PASS for the wardrobe, run `approve-asset` for **only** the wardrobe (from PR #7's files) and leave the other four for r2. PR #7 then stays open or is closed in favour of `batch-b-r2`, and PR #6 is superseded by the lamp v002 re-export.
4. Every merge goes through a staging branch with CI green on the exact commit, then a fast-forward of `reboot/foundation`. `main` and Pages are never touched.
