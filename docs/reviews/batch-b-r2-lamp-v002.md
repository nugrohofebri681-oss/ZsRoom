# Review — Lamp v002 (PR #10) + Batch B round 2 (PR #11)

**Reviewer:** Claude Code · **Base:** `reboot/foundation` `1f5f606` · **Status:** all seven masters TECHNICAL PASS (GitHub CI + art workflow green on both PRs; validation reproduced locally).
Nothing is approved and the production manifest is unchanged. In-game integration ran in a scratch build only. Evidence: `docs/reviews/batch-b-r2/` (11 images).

## Recommendations (technical review; the Creative Director decides VISUAL PASS)
| Asset | Recommendation | Evidence |
|---|---|---|
| `prop_lamp_zila` **v002** | **VISUAL PASS candidate** | True scale on the approved nightstand. The engine emitter sits inside the shade. On/off renders correctly, and the on state **persisted across a reload** (03). The shade ellipse is a little shallow; invisible in play. |
| `prop_desk_zila` **v002** | **VISUAL PASS candidate** (minor correction **without regeneration**, already handled by the pipeline) | Clean desktop, knee space, pedestal and wood consistent with the wardrobe, bed and nightstand. Measured: front face 74 cm (−1.3 %), top plane 89 px (+6 %); the back of the top is ~9 % narrower (slight taper, not visible in play). An alpha-1 generator haze under the desk (0.4 % opacity, invisible, 11) is now cleared automatically at runtime export. |
| `prop_laptop_zila` **v001** | **VISUAL PASS candidate** | Keyboard SOUTH, hinge NORTH, display facing seated Zila (10, 02). Placed on the measured desk-top anchor. "Use the laptop" appears only while seated, on desktop and Android (07). |
| `prop_mug_zila` **v001** | **VISUAL PASS candidate** | The body is a little short against the 10 cm profile, but it reads clearly as a cocoa mug at game scale. |
| `prop_chair_desk` **v002** | **VISUAL PASS candidate** | A correct **rear view**. Seated Zila is now drawn **behind** the chair, so the painted backrest overlaps her hips (02). The `seatBehind` engine change came out of this review. |
| `prop_vanity_zila` **v002** | **VISUAL PASS candidate** | Top depth 64 px vs 63 and front 148 px vs 150, both within tolerance. The mirror is smaller and centred. One connected alpha shape; the faint edge haze halved from r1. |
| `prop_stool_vanity` **v002** | **VISUAL PASS candidate** | Seat height within tolerance (95 vs 90 px). The seat ellipse is 0.57 vs 0.7, slightly side-on, but invisible when seated (04) and acceptable when empty. This is a perspective note, not a §11 geometry exception. |

**Targeted revisions required:** none. **Minor corrections without regeneration:** the desk haze only, which the pipeline now handles; the masters are unchanged.

## Gameplay checks (scratch build, all seven integrated)
- **Collision:** desk stops at y 80 (expected 80), chair 134.1 (134), vanity 65 (65, probed on both sides of the stool), stool 114 (114).
- **Depth sorting:**
  - Seated at the desk, Zila's depth is 117.5, behind the chair's 118, so the backrest overlaps her.
  - She draws in front of the desk, laptop and mug.
  - The stool and vanity order correctly.
- **Interactions:**
  - The laptop works seated only.
  - The lamp toggle is saved.
  - Sitting works at the desk and the vanity.
  - Every interaction spot is reachable (unit test).
- **Desk surface:** the laptop and mug anchors project inside the **measured painted** top plane (unit test). The measurement is recorded in the spec and tied to the v002 SHA-256.
- **Performance:** 10 approved-art props total 516 KB of runtime WebP. The scratch build runs 49 fps at 1280×720 in the first frames and about 21 fps steady in the software-rendered headless proxy, the same as the TEMP build. Zero console errors.
- **Android:** landscape and portrait correct, including seated use of the laptop through the E button.

## Engine and pipeline changes in this review branch
1. `seatBehind` sit flag: a sitter is drawn behind seats whose backrest faces the camera (the rear-view desk chair).
2. The desk's top surface is measured on v002 (front 74 cm, depth 63.6 cm), with the laptop and mug anchors on it.
3. Runtime alpha clean-up now also clears alpha ≤ 8, before **and** after resampling to SD (Lanczos re-creates faint edges). Previously-approved runtime files are untouched.

## Integration plan (after VISUAL PASS)
For each approved asset, take only its files from PR #10 / PR #11, then run `approve-asset` (the desk needs no exception: its geometry is within tolerance). Then run full QA, the staging CI gate, and a fast-forward of `reboot/foundation`, as for the wardrobe. Merge this review branch first, so the `seatBehind` and alpha-floor changes are in place before approval.

## Creative Director decision
**VISUAL PASS** for all seven, recorded in the PR #10 and PR #11 comments:

| Asset | Version |
|---|---|
| `prop_lamp_zila` | v002 |
| `prop_desk_zila` | v002 |
| `prop_laptop_zila` | v001 |
| `prop_mug_zila` | v001 |
| `prop_chair_desk` | v002 |
| `prop_vanity_zila` | v002 |
| `prop_stool_vanity` | v002 |

- Integrated by taking **only** these versions' files from the two PRs; neither PR was merged.
- Masters are unchanged. Runtime WebP use the alpha clean-up (snap ≥ 250, clear ≤ 8, before and after SD resampling).
- No geometry exceptions are needed: every §11 measurement is within tolerance. The stool's slightly side-on seat ellipse is noted as a perspective remark only.
