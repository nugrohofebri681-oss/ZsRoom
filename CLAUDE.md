# CLAUDE.md — Claude Code operating notes for ZsRoom

Read `AGENTS.md` first (roles, branch rules, status vocabulary). This file adds what Claude Code needs.

## Mission
Lead development of ZsRoom: a premium HD illustrated 2D exploration / life-sim about Zila and Febri.
Benchmark Stardew Valley for world coherence, interactivity and readability — **not** for its pixel-art look.
Style: *ZsRoom OG Enhanced — Premium HD Illustrated 2D* (`art-bible/ART_BIBLE.md`).

## Hard rules
- Never modify `main` or the existing GitHub Pages deployment. Work on `claude/<feature>` branches, integrate into `reboot/foundation`.
- Never merge art submissions without explicit Creative Director approval. Promote approved art only with `scripts/approve-asset.mjs … --creative-director-approved`.
- Never publish private material (the OG `surat/` letters, conversations, personal photos) — the repo is public. `npm run validate:privacy` must pass before every push.
- Zero additional cost: no paid APIs, credits, asset packs or services.
- Never claim a visual result from tests; show rendered evidence (screenshots in `docs/reviews/`, the gallery).
- Never claim a GitHub protection is enforced unless verified in repository settings.
- Ask before: deleting/rewriting history, touching `main`/deployments, spending, major art-direction changes, merging unapproved art.

## Architecture map
| Path | What |
|---|---|
| `specs/projection.json` | World projection + densities (single source of truth) |
| `specs/{props,characters}/*.json` | Asset specs: canvas, pivot, footprint, collision, anchors (read by game + validators) |
| `src/core/` | projection math, spec loading, display/DPR policy |
| `src/world/` | room compiler (data → solids/props/anchors), collision, depth sorting & occlusion |
| `src/actors/` | 8-direction facing & input normalisation |
| `src/interaction/` | interaction anchors |
| `src/systems/` | input, versioned save/load, asset manifest |
| `src/scenes/` | Phaser scenes: Boot (manifest/textures), Room (gameplay), UI (HUD/touch) |
| `src/data/rooms/*.json` | Room definitions (data-driven; no per-room code) |
| `public/assets/manifest.json` | Runtime asset manifest (approved assets + checksums) |
| `scripts/` | validate-art, validate-manifest, privacy-scan, fit-to-spec, approve-asset, generate-templates, build-gallery |
| `tests/unit`, `tests/e2e` | Vitest; Playwright desktop + emulated budget-Android |

World units are centimetres. `screenY = y·0.7 − z`. Sprites are scaled by `1/density`, so art resolution never changes gameplay.

## Workflow per milestone
1. Spec → art request (`docs/art-requests/NNN-<asset>.md`) → commit to `reboot/foundation`.
2. Codex PR `codex/art/<asset>-v###` → CI technical checks + gallery artifact.
3. Claude reviews integration/consistency in the PR; Creative Director decides VISUAL PASS.
4. After approval: `npm run approve -- <asset> <v###> --approved-by "<CD>" --review docs/reviews/<file>.md --creative-director-approved`, then `npm run qa`.

## In the Claude Code cloud container
Chromium is pre-installed; `@playwright/test` is pinned to the matching version (1.63.0). Run `npm run qa`.
