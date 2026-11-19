# Batch production rules (Codex)

These rules apply to every batch request (004+). Each batch request lists only what is specific to its assets.

## One branch per batch, independent assets
- Branch: `codex/art/batch-<letter>-r<round>` from the latest `reboot/foundation` (e.g. `codex/art/batch-b-r1`). One **draft** PR per batch round, using `.github/PULL_REQUEST_TEMPLATE/art_submission.md`.
- Every asset is **independent**: its own `art/submissions/<asset_id>/v###/` folder, master PNG, `metadata.json`, `prompt.md`, raw outputs in `art/source/<asset_id>/v###/`, and its own validation result. CI rejects files of assets outside the batch.
- The Creative Director approves **per asset**. Approved assets are integrated. The rest get a new version (`v002`) in the next round (`r2`) without regenerating the approved ones.
- Never merge. Don't touch specs, the manifest, `art/approved/`, `public/`, `src/`, `scripts/`, `tests/` or workflows.

## Style and consistency (Art Bible v1.5)
- Condition **every** asset on the approved furniture references: `art/approved/prop_bed_zila/prop_bed_zila_v001.png` and `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`. List them in `metadata.generator.referencesUsed`.
- Within a batch, generate the **largest asset first**. Once you are satisfied with it, also attach it as a reference for the remaining assets of the batch, so the batch shares one hand. Mention this in `notes.md`.
- ZsRoom oblique ¾ view: top and front faces only, no vanishing points, depth ×0.7, verticals vertical, round forms are 0.7-ratio ellipses. Soft neutral-warm daylight from the **upper-left**. Coloured contours, no pure black. **No cast shadows, no floor, no wall, no background.**
- Light-emitting objects are painted **switched off**; the engine renders light.
- Same walnut as the bed and nightstand wherever wood is walnut (`#8A5A3C`, shadows `#5B3A29`).

## Geometry
- Use each asset's template (`art-bible/perspective/<asset_id>_template.png`) for layout only. Guide lines must never appear in the art.
- Fit with `node scripts/fit-to-spec.mjs <raw.png> <asset_id> <out.png>`. Pass `--width` when the default (footprint + overhang) is not the widest painted part.
- Report measured rows in `selfReview.knownIssues`: front-face top edge and top-plane back edge for furniture (Art Bible §11: front face ±10 %, top plane ±25 %); bottom and top rows for wall items.
- See the in-room context: `docs/reviews/foundation/desktop-slice-05-temp-labels-afternoon.png` shows every asset's place in the bedroom, as a labelled TEMP placeholder at exact final scale and position.

## Cost and honesty
- Built-in image generation in the existing ChatGPT subscription only. No paid APIs or credits.
- If image generation is unavailable, stop and report. Never substitute procedural, SVG or stock art.
- Run `npm run validate:art` and `npm run gallery`, and look at every asset beside the approved references before opening the PR.
