# Art Request 001 — `prop_bed_zila` v001 (Zila's Bed)

| Field | Value |
|---|---|
| Asset id | `prop_bed_zila` |
| Version | `v001` |
| Spec | [`specs/props/prop_bed_zila.json`](../../specs/props/prop_bed_zila.json) (specVersion **1.0.0**) |
| Art Bible | [`art-bible/ART_BIBLE.md`](../../art-bible/ART_BIBLE.md) v1.0 — read §0–§7, §11–§15 |
| Template | [`art-bible/perspective/prop_bed_zila_template.png`](../../art-bible/perspective/prop_bed_zila_template.png) (+ `.svg`) |
| Projection | [`art-bible/perspective/projection_cube.png`](../../art-bible/perspective/projection_cube.png) |
| Scale | [`art-bible/perspective/scale_lineup.png`](../../art-bible/perspective/scale_lineup.png) |
| Owner | Codex (art production) → review by Claude Code (technical) → approval by Creative Director (visual) |
| Branch | `codex/art/prop_bed_zila-v001` (from `reboot/foundation`) |
| PR target | `reboot/foundation`, template `art_submission.md` |
| Cost | **$0** — use only image generation included in the existing ChatGPT subscription. No API keys, no credits. |

This is the **first** production asset. Its purpose is to validate the workflow and the visual standard. Produce **one** bed — do not produce other furniture.

---

## 1. What the object is

Zila's bed: a cozy single-plus bed (120 × 200 cm) standing with its **headboard against the north (back) wall**, long axis running **away from the viewer** (head at the top of the image, foot at the bottom). It is the emotional centre of her bedroom.

**Design**
- **Frame:** warm walnut wood (`#8A5A3C`, shadows `#5B3A29`), softly rounded edges, satin sheen on top edges. Short, sturdy wooden legs or a low plinth.
- **Headboard:** walnut, 110 cm tall, gently arched or softly rounded top corners; optionally a padded blush-pink (`#F4C7D3`) inset panel. Must read clearly as the "back" of the bed.
- **Mattress:** top at 55 cm, mostly hidden by bedding.
- **Bedding:** rose-pink duvet (`#E8A0B4`, folds shading to `#C0607E`, highlights `#F4C7D3`) with soft quilting lines, covering the front ~⅔ of the bed and draping over the foot and the sides; the top edge is folded back to show a cream (`#F6EBDD`) sheet.
- **Pillows:** two cream/warm-white pillows side by side against the headboard (top ≈ 68 cm).
- **Heart cushion:** one small pink heart-shaped cushion resting on the pillows (identity detail from the original room).
- **Not included:** no teddy bear (separate future prop), no nightstand, no rug, no floor, no wall, no lamp, no cast shadow.

**Mood:** warm, soft, lived-in, premium storybook illustration. Neutral-warm daylight-interior lighting (the engine adds night/lamp light later).

## 2. Exact geometry (canvas pixels — see the template)

| Item | Value |
|---|---|
| Canvas | **384 × 576 px**, RGBA, transparent |
| Density | 2 px per cm |
| Pivot | **(192, 544)** — front-centre of the footprint at floor level |
| Floor footprint | x **72 → 312**, y **264 → 544** (120 cm wide, 200 cm deep × 0.7) |
| Front base / legs touch floor at | y **544** (± 10 px) |
| Mattress top, front edge | y ≈ **434** (55 cm) |
| Mattress top, back edge | y ≈ **154** |
| Headboard top | y ≈ **44** (110 cm) — visible headboard face ≈ y 44 → 154 |
| Pillow tops | y ≈ 128–154, sitting on the back ~50 cm of the mattress |
| Side overhang of duvet | ≤ 8 cm → art may extend to x **56 → 328** |
| artBounds (all opaque px) | x 56 → 328, y 32 → 552 |
| Transparent edge padding | ≥ 8 px on all sides |
| Opaque coverage | 25 %–80 % of the canvas |

**Perspective:** ZsRoom oblique ¾ top-down (Art Bible §2). No vanishing points, **no visible side faces**, verticals vertical, front face square-on, top foreshortened to ×0.7. The bed should look like the reference cube: you see the **top of the bedding** and the **front (foot) face**, nothing of the left/right sides except the drape of fabric over the edges.

**Lighting:** key light from **upper-left**. Top planes brightest, foot-face mid-tone, underside of duvet and gap under the bed darkest. **No cast shadow on the floor**; only a thin soft contact darkening right at the legs, inside the footprint.

**Lines:** coloured line work (dark-walnut on wood, deep-rose on pink, warm grey-plum on cream). Outer silhouette ≈ 3 px, inner ≈ 1.5–2 px. No pure black anywhere.

## 3. Collision, pivot & interaction (for reference — engine-side)

- Collision rect relative to pivot: x −64 → +64 cm, y −200 → 0 cm.
- Interaction anchors: `rest` at (+84, −110) cm (right side), `make_bed` at (0, +30) cm (foot end).
- Keep the right side of the bed visually open (no hanging objects) so the "rest" interaction reads.

## 4. Generation procedure

1. Verify that image generation is available in your environment (e.g. `$imagegen`). **If it is not available, stop and report** — do not substitute procedural/SVG/rectangle art.
2. Condition on (if your tool accepts reference images): `prop_bed_zila_template.png`, `projection_cube.png`. Use the template for **layout only** — guide lines must not appear in the output.
3. Request a **transparent background**, highest available resolution, portrait aspect (2:3).
4. Generate **3–4 candidates**. Keep all raw outputs in `art/source/prop_bed_zila/v001/` (`raw-01.png` …).
5. Pick the best candidate against the checklist in §6.
6. Fit it to the canvas:
   ```bash
   npm ci
   node scripts/fit-to-spec.mjs art/source/prop_bed_zila/v001/raw-0N.png prop_bed_zila art/submissions/prop_bed_zila/v001/prop_bed_zila_v001.png
   ```
   Add `--key-background` only if the generator could not output alpha, then inspect light edges (pillows!) closely.
7. Write `art/submissions/prop_bed_zila/v001/metadata.json` (schema: `specs/schema/submission-metadata.schema.json`) and `prompt.md` (exact prompts, tool, model, candidate notes).
8. Validate and preview:
   ```bash
   npm run validate:art
   npm run gallery   # open review-gallery/index.html and look at it on light AND dark floors
   ```
9. Fix every technical failure. Then open the PR.

### Suggested generation prompt (adapt, but keep every constraint)

> Premium hand-painted HD 2D game asset, cozy storybook illustration style, single object on a fully transparent background: a single-plus bed for a young woman's bedroom, seen from a top-down three-quarter orthographic oblique game view — the camera looks down from the front; we see the top of the bedding and the front (foot) face square-on; no perspective convergence, no vanishing points, no visible left or right side faces, vertical lines perfectly vertical. The headboard is at the top of the image (far side), the foot of the bed at the bottom (near side), long axis pointing away from the viewer. Warm walnut wooden frame with softly rounded edges and short sturdy legs; 110 cm walnut headboard with softly rounded top corners and a padded blush-pink inset panel; rose-pink quilted duvet draping softly over the foot and sides, top folded back showing a cream sheet; two cream pillows against the headboard; a small pink heart-shaped cushion on the pillows. Soft neutral-warm interior daylight from the upper left, painted form shading, coloured line work (no black outlines), gentle fabric folds, satin wood sheen. No floor, no rug, no wall, no shadow on the floor, no text, no characters, no teddy bear. Not pixel art, not 3D render, not anime. Proportions: width 120 cm, length 200 cm, mattress height 55 cm.

## 5. Delivery

- Branch: `codex/art/prop_bed_zila-v001` from the latest `reboot/foundation`.
- You may change **only**:
  - `art/submissions/prop_bed_zila/v001/**` — `prop_bed_zila_v001.png`, `metadata.json`, `prompt.md`, optional `notes.md`
  - `art/source/prop_bed_zila/v001/**` — raw generator outputs
  CI rejects any other path (`scripts/validate-art.mjs`).
- Commit message: `art(prop_bed_zila): submit v001`
- Open a PR into `reboot/foundation` titled `art(prop_bed_zila): v001 submission` using `.github/PULL_REQUEST_TEMPLATE/art_submission.md` (`?template=art_submission.md`).
- **Do not merge.** Do not edit specs, the manifest, `art/approved/`, `public/`, or `src/`.

### `metadata.json` example

```json
{
  "assetId": "prop_bed_zila",
  "version": "v001",
  "specVersion": "1.0.0",
  "author": "codex",
  "generator": { "tool": "codex $imagegen", "model": "<as reported by the tool>", "referencesUsed": ["art-bible/perspective/prop_bed_zila_template.png", "art-bible/perspective/projection_cube.png"] },
  "createdAt": "2026-11-18T12:00:00Z",
  "files": { "master": { "path": "prop_bed_zila_v001.png", "sha256": "<sha256 of the master png>" } },
  "provenance": "Original AI-generated artwork created for ZsRoom from the Art Bible and art request 001. No third-party assets.",
  "postProcessing": ["selected raw-02", "fit-to-spec.mjs (trim, lanczos3 scale 0.41, pivot alignment)"],
  "selfReview": { "checklistComplete": true, "knownIssues": [] },
  "cost": "Included in existing ChatGPT subscription; no API credits used."
}
```

Get the checksum with `sha256sum art/submissions/prop_bed_zila/v001/prop_bed_zila_v001.png`.

## 6. Review checklist (self-review before PR; repeated by Claude and the Creative Director)

**Technical (automated)** — canvas 384×576 · PNG RGBA 8-bit sRGB · transparent padding · art inside artBounds · base on y 544 ± 10 · coverage 25–80 % · metadata valid · checksum matches · only allowed paths.

**Visual (human)**
- [ ] Premium HD illustration that matches the Art Bible — not pixel art, not 3D, not generic anime.
- [ ] Correct ZsRoom oblique perspective: no side faces, no convergence, headboard at top.
- [ ] Plausible true scale next to Zila (158 cm) in the gallery's scale view.
- [ ] Light from upper-left; coloured lines; no pure black.
- [ ] No baked floor shadow, rug, wall, or background.
- [ ] Clean alpha edges on both light and dark floors; no halos.
- [ ] Identity: rose-pink bedding, walnut wood, cream pillows, heart cushion — clearly Zila's bed.
- [ ] Still readable at SD (half) size.

**Outcome labels:** TECHNICAL PASS (CI) · VISUAL PASS (Creative Director) · PRODUCTION READY (both + integrated + gameplay tests). Only the Creative Director grants VISUAL PASS.
