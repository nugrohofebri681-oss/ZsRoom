# G1.1 production correction — review checkpoint, integration blocked

**Not TECHNICAL PASS, not VISUAL PASS, not PRODUCTION READY.** This is actual new illustrated artwork and measured evidence, not a replacement contract. It must not be approved or integrated as-is.

Based on PR #43 / `claude/arch-contract-g1` at `d5830d7f42529f62ec3e541fd2895c2140592cac`. The public GitHub checks page showed success for that commit; see `contract-ci.json`. PR #42 selections remain Small A, Large B, Ruko B, Warung C. PR #44's old missing-contract blocker is superseded; the new pipeline and painted-geometry blockers below are independently verified.

## What is supplied

- Eleven independent asset folders: four facades, four roofs, and separate ruko awning, warkop counter and bench. Each has native raw image(s), exact prompts, transparent contract-canvas master, SD preview, metadata and SHA-256.
- Targeted edits of the four selected designs, **not another twelve-candidate exploration**. Original G1 files and all approved art remain unchanged.
- Four `comparison-*.png` sheets: G1 / new layer assembly / contract overlay. `index.html` includes native HD/SD views. Cyan outlines are contract positions, not measured approval.
- Eighteen runtime screenshots: four building views plus front/behind ruko on desktop1440×900, Android landscape800×360 and portrait360×800 CSS pixels.
- `browser-fixture.json`, `export-verification.json`, official validation report, contract test/build logs, preservation report, measurements and file checksums.
- Built-in imagegen only; no paid APIs. The retained sources include rejected attempts, not just selected outputs. Flat layout guides are technical diagrams used to condition the generator, never substitute artwork.

## Actual checks

| Check | Result / limit |
|---|---|
| Official fitter | **FAIL** `unknown asset world_house_small`. `loadSpecs()` excludes `specs/world/props`. |
| Official art validator | **FAIL** all11 new IDs at `spec exists`; actual report preserved. No claim that G1 failure disappeared. |
| Official gallery | Command succeeds; gallery opened in browser. World entries inherit unknown-spec error. Supplementary gallery provides layer/geometry review. |
| Export-only checks |11/11 metadata schema, SHA-256, canvas, RGBA, sRGB, native width density≥2 and no upscale pass. These are NOT an official technical pass. |
| Contract unit tests |11/11 pass, unmodified tests. |
| Production build | Pass, no engine changes. |
| P6.1 browser fixture |3 viewport runs, zero JS errors;12/12 assertions: exactly one roof per building, behind-ruko fade, no fade in front, matching facade/roof alpha. |
| Painted geometry | **FAIL / needs revision**, see measurements and overlays. Canvas accuracy is insufficient. |
| Preservation |91/91 original G1 checksums match; tracked source/approved files unchanged. |

The browser fixture registers candidates **only in memory**, invokes the existing draw methods, and uses the same behind/front positions as the official contract E2E. The manifest on disk is untouched. It exercises the art-roof path without granting approval. It is not the complete official P6.1 regression suite. Add-ons are demonstrated in static assemblies, not wired as new gameplay interactions. Browser emulation is not a physical Samsung A05 performance test; no FPS performance pass is claimed.

## Visual findings and blocking defects

- **Small house:** central door is substantially taller and close to the target silhouette. Facade envelope remains23cm short. The corrective roof reduces its missing projected height from42.5cm to8.5cm and removes most taper; it still does not cover the exact contract envelope. The facade/roof seam remains visible.
- **Large house:** the final corrective attempt moves the doorway left toward the contract anchor and makes it taller; it is still too narrow. Porch depth/floor readability regressed compared with G1 B and must be restored. Roof remains25.5cm short in projected height; porch-gable alignment needs another manual/controlled geometry correction. See latest comparison, not the earlier raw attempt.
- **Ruko:** native source is now1063px wide before fitting, satisfying source-resolution minimum without upscaling. Uniform height fit produces a facade29.5cm narrower than420cm. Folded shutters reduce clear opening;300×240cm is **not verified/met**. Roof remains13cm short; dense tile texture needs CD review at SD.
- **Warkop:** three bays, four posts, clear middle passage, separate right counter/left bench are now present. Facade envelope is27.5cm short and painted centre opening is too low for230cm. Roof is20.5cm short. Assembly visibly exposes the eave seam; do not move anchors or stretch layers to conceal it.
- **Add-ons:** awning supports removed in the selected correction, restoring320cm width; height is8cm below the shallow JSON target. Counter and bench are respectively12.5cm and10cm short. They require geometry correction before interaction alignment.
- Form/material identity is substantially preserved, but some roofs remain visually repetitive at wider camera zoom. Clear painted entrances and a continuous facade/eave join are higher priority than additional detail.

All envelope differences are computed in `measurements-all.json`. Opening assessments are visual overlay findings, not fabricated precise measurements. Full coverage, entrance alignment and production-ready geometry are explicitly **not passed**.

## Pipeline issues for Claude (not modified here)

1. Register `specs/world/props` in official art loading and supply production art fields. Current JSON is `world-temp`, density1; contract requires HD2 masters. Merely exposing these JSONs would then fail the HD canvas checks.
2. Reconcile contract32px HD padding prose with formula16px side margin. This export follows exact contract canvas/pivot formulas.
3. Awning60cm projection implies42 render-cm before vertical drop, but addon JSON gives a30cm height envelope/54px SD canvas. Its selected image is a shallow candidate, not certification of60cm projection.
4. Give the multi-asset world production branch an explicit ownership route. Current `codex/art/g1-1-production-r1` is not recognized by the old single-asset/batch-letter regex. Do not bypass this by modifying scripts in the artwork PR.

## Reproduction and next correction

Run repository commands from this worktree: `npm run validate:art`, `npm run gallery`, `npm test -- tests/unit/architecture-contract.test.ts`, `npm run build`. Supplementary export/fixture source snapshots are under `art/source/world_house_small/v001/`; they record this environment's absolute paths and require path adjustment elsewhere. Start Vite on4213 for the fixture. Generated artwork must not be stretched to fit; the next revision needs tightly controlled re-authoring of the measured deficient regions, especially shop opening, porch and eave seams.

Do not merge. Creative Director review and Claude's pipeline correction are still required. No `main`, engine, spec, approved manifest, old concept or audit files were changed by the artwork commit.
