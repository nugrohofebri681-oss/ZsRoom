# AGENTS.md — rules for AI agents working in ZsRoom

This repository is shared by two AI agents and one human:

| Role | Who | Owns |
|---|---|---|
| Creative Director | The user (repository owner) | Vision, final visual approval, approval of character identities, public deployment, any spending |
| Lead Developer / Technical & Art Director | Claude Code | Engine, TypeScript, world/collision/animation systems, Art Bible, specs, manifests, validation, tests, integration |
| Art Production Agent | OpenAI Codex | Generating artwork for open art requests and submitting it by pull request |

**Branch `main` holds the original game and its GitHub Pages deployment. No agent may touch `main`.**
The integration branch for the rebuild is `reboot/foundation`. The repository is **public** — never commit private letters, conversations, personal photos, credentials or tokens.

## If you are Codex (art production)

1. Work only on open requests in `docs/art-requests/`. Read, in order: the request, `art-bible/ART_BIBLE.md`, the asset's spec in `specs/`, and its template in `art-bible/perspective/`.
2. Branch from the latest `reboot/foundation` as `codex/art/<asset_id>-v###` (e.g. `codex/art/prop_bed_zila-v001`), or, for **batch requests** (004+), as `codex/art/batch-<letter>-r<round>` (e.g. `codex/art/batch-b-r1`). See `docs/art-requests/BATCH_RULES.md`.
3. You may create/modify **only**:
   - `art/submissions/<asset_id>/<v###>/`: `<asset_id>_<v###>.png`, `metadata.json`, `prompt.md`, optional `notes.md`
   - `art/source/<asset_id>/<v###>/`: raw, unprocessed generator outputs
   - (batch branches: the same folders for every asset whose spec has that `batch` letter)
   CI fails the PR if anything else changes.
4. Generate artwork with your built-in image generation (e.g. `$imagegen`). **First verify it is available. If it is not, stop and report it in a PR comment or issue — never substitute procedural shapes, SVG drawings, rectangles, stock images or third-party assets.**
5. **Zero additional cost.** Never use paid APIs, API keys, credits, or paid services. Record `"cost"` in `metadata.json`.
6. Fit outputs to the spec canvas with `node scripts/fit-to-spec.mjs`, then run `npm run validate:art` and `npm run gallery` and look at the result before opening the PR.
7. Open a PR into `reboot/foundation` using `.github/PULL_REQUEST_TEMPLATE/art_submission.md`. **Never merge.** A new attempt is a new version (`v002`), never an overwrite of a submitted version.
8. Do not edit specs, the Art Bible, the manifest, `art/approved/`, `public/`, `src/`, `scripts/`, `tests/`, or workflows. If a spec seems wrong, say so in the PR.

## If you are Claude Code (lead developer)

See `CLAUDE.md`.

## Status vocabulary (use exactly)

- **TECHNICAL PASS** — automated checks pass. Says nothing about beauty.
- **VISUAL PASS** — the Creative Director approved the artwork.
- **PRODUCTION READY** — both, plus integrated and gameplay-tested.

Never report artistic success from automated results.

## Commands

```bash
npm ci                    # install (Node 22)
npm run dev               # play locally (http://localhost:5173)
npm run validate:art      # technical checks on art submissions
npm run gallery           # build review-gallery/index.html
npm run qa                # everything: privacy, manifest, art, types, unit, build, e2e, gallery
```
