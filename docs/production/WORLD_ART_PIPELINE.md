# World art pipeline — building fronts, roofs and add-ons

**Status:** pipeline support. Written by Claude on 2026-11-26 for PR #45 (G1.1), on top of the G1 contract (#43, `docs/production/ARCHITECTURE_CONTRACT_G1.md`).

**This approves no artwork.**
- Technical PASS means the master matches the contract frame and envelope.
- Visual approval stays with the Creative Director.
- Integration goes through `scripts/approve-asset.mjs` in a separate step.

## 1. What changed and why

**The original problem:** `loadSpecs()` read only `specs/props`, `specs/characters` and `specs/environments`. So every G1 world layer failed `spec exists` in `validate-art`, and `fit-to-spec` failed with `unknown asset world_house_small`. Two contract gaps were also open:
- the 32 px vs 16 px padding prose;
- the awning drawn without its projection.

| Area | Before | Now |
|---|---|---|
| Spec loader (`scripts/lib.mjs`) | 3 room directories | Also `specs/world/props` and `specs/world/environments`. Ids are unique across all directories, and every entry has `scope: room \| world`. |
| Which world specs accept art | — | Only specs with a `production` block. These are the 11 G1 layers. TEMP-only world specs, such as trees or streetlights, refuse art with an explicit reason. |
| Frames | — | **Two frames per world spec:**<br>• the runtime TEMP frame (`canvas`, `pivot`, density 1) that the engine draws placeholders in. It is unchanged, so the game looks the same.<br>• the **production frame** (`production.canvas`, `production.pivot`, density 2) that masters are made, validated, fitted and exported in.<br>Production = exactly 2 × runtime, so approved art lands on the same origin (`worldSpecErrors`). |
| Geometry | bbox inside artBounds only | **Contract envelope, edge by edge, ±8 px (4 cm):** width, top (eave, or projected rise for roofs), bottom (pivot line, or eave drop for roofs). **Roofs** must also hide the ground footprint in projection: ≥ 99 % opaque inside `production.coverage.rect`. |
| Metadata | generic schema | Generic schema **plus** `specs/schema/world-layer-metadata.schema.json` (`worldLayer`: batch, role, archetype, contract version, density, measured envelope, fit). It must match the spec. The reported measurements are compared with the pixels. Upscaling or nonuniform fits are rejected. |
| Files | top-level files only | Every file in the submission folder, including `review/` sub-folders, must be png, webp, json or md. |
| Assembly | — | A warning when a layer is not reviewed together with its siblings (front + roof + add-ons; seams and eave joins). |
| Fitter (`fit-to-spec`) | furniture fit, baseline | World layers get **one uniform scale** into the envelope:<br>• centred on the pivot, sitting on the envelope bottom;<br>• **never stretched, never upscaled**;<br>• prints the shortfall in cm and the `worldLayer.fit` record. |
| Approval export | spec canvas | Exported from the production frame: HD = master; SD = ½. |
| Gallery | footprint overlay | World layers show the envelope (green) and the roof coverage rect (dashed). |
| Manifest | every spec must be listed | Room specs must be listed (as before). World specs are listed when they are approved; until then the runtime draws the TEMP placeholder. |
| Templates | all prop specs | Room specs only. World layers use the contract sheet. |
| Branches | single asset, `batch-<letter>` | **Multi-asset world branches**, see §3. |

## 2. Production frame (masters at 2 px/cm)

**Margins:**
- **8 cm per side** (16 px HD);
- **12 cm top and bottom** (24 px HD);
- a fully transparent **8 px rim**.

This replaces the earlier "32 px" prose: the formula `(W + 16) × (E + 24)` at 1 px/cm always meant 16 px side margins at HD.

**Tolerance:** each envelope edge ±8 px (4 cm). At HD a 4 cm step at an eave join is already visible as a seam.

| Asset | Role | Canvas | Pivot | Envelope (x, y, w × h) | Extra |
|---|---|---|---|---|---|
| world_house_small | front | 872 × 588 | 436, 564 | 16, 24, 840 × 540 (420 × 270 cm) | — |
| world_house_small_roof | roof | 952 × 526 | 476, 472 | 16, 24, 920 × 478 (rise 224 + drop 15) | covers 840 × 448 |
| world_house_large | front | 1232 × 608 | 616, 584 | 16, 24, 1200 × 560 | — |
| world_house_large_roof | roof | 1312 × 638 | 656, 584 | 16, 24, 1280 × 590 (rise 280 + 15) | covers 1200 × 560 |
| world_ruko | front | 872 × 1008 | 436, 984 | 16, 24, 840 × 960 | — |
| world_ruko_roof | roof | 952 × 582 | 476, 528 | 16, 24, 920 × 534 (rise 252 + 15) | covers 840 × 504 |
| world_ruko_awning | add-on | **672 × 192** | **336, 168** | 16, 24, 640 × 144 (**30 cm band + 60 cm projection × 0.7 = 72 cm**) | pivot = front edge of the awning |
| world_warkop_open | front | 1232 × 608 | 616, 584 | 16, 24, 1200 × 560 | — |
| world_warkop_roof | roof | 1312 × 666 | 656, 612 | 16, 24, 1280 × 618 (rise 294 + 15) | covers 1200 × 588 |
| world_warkop_counter | add-on | 400 × 238 | 200, 214 | 16, 24, 368 × 190 (184 × 95 cm) | — |
| world_warkop_bench | add-on | 400 × 138 | 200, 114 | 16, 24, 368 × 90 (184 × 45 cm) | — |

**Awning correction:** the earlier awning canvas (336 × 54 at 1 px/cm) had no room for the 60 cm projection, so the art could only be a flat band. The awning's runtime spec now uses 336 × 96 at 1 px/cm. It is not placed in any map yet, so nothing in the game changes.

**Not automated:** door and opening rectangles inside a facade cannot be measured reliably from pixels. They are checked on the contract overlay in review, not by this validator.

## 3. Branch rules for multi-asset world production

| Branch | May change |
|---|---|
| `codex/art/world-<batch>-r<round>` (canonical, e.g. `codex/art/world-g1-r2`) | `art/submissions/<id>/v###/` and `art/source/<id>/v###/` for **every world layer whose `production.batch` is that batch** (G1: the 11 layers above) |
| `codex/art/<batch>-<rev>-production-r<round>` (the G1.1 form already in use: `codex/art/g1-1-production-r1`) | same as above |
| `codex/art/<asset_id>-v###` | one asset's submission and source folder (unchanged rule, now also for world layers) |

A world branch may **not** touch:
- room assets or TEMP-only world specs;
- specs, the manifest, `public/`, `art/approved/`;
- code, tests or workflows.

Unknown batches are refused. Each asset keeps its own versioned folder, so a correction round (`v002`) never overwrites the reviewed `v001`.

## 4. Workflow for Codex
1. Fit each layer: `node scripts/fit-to-spec.mjs <raw.png> <asset_id> <out.png>`.
   - Read the printed shortfall. If it exceeds 4 cm, **repaint or recompose** the source; do not stretch.
   - Copy the printed `worldLayer.fit` record into the metadata.
2. Write `metadata.json` with `specVersion` **1.0.0** and the `worldLayer` block:
   - `measuredEnvelopePx` is the opaque bbox, alpha > 16;
   - `layerSet` lists the sibling layers reviewed together.
3. Run `npm run validate:art` and `npm run gallery`. Then look at the layers assembled (front + roof + add-ons) beside the contract overlay.
4. Keep review material as png, webp, json or md (no HTML in submission folders).

## 5. What PR #45 gets from the new validator
- Audit run: on a throw-away worktree, read-only.
- Nothing in PR #45 was changed, fixed up or approved.

**What now passes:**
- the branch `codex/art/g1-1-production-r1` passes ownership;
- `spec exists` and `spec accepts art submissions` pass for all 11 layers.

**What fails, for real reasons.** The validator's numbers match Codex's own measurements:
- **Metadata:** `specVersion` 0.1.0 → 1.0.0 and the missing `worldLayer` block, all 11.
- **Fronts too low:** small −23.5 cm, large −13.5 cm, warkop −27.5 cm.
- **Ruko front too narrow:** 390.5 cm wide.
- **Roofs short of the projected rise:** small −8.5, large −25.5, ruko −13, warkop −20.5 cm. They also leave the footprint visible: 95.7 / 90.4 / 94.0 / 92.9 % covered, against a 99 % minimum.
- **Awning:** 672 × 108 canvas instead of 672 × 192, with no projection.
- **Add-ons:** counter −12.5 cm, bench −10 cm.
- **Review folder:** `review/index.html` is not an allowed file type.
