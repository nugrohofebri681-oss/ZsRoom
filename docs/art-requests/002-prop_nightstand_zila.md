# Art Request 002 — `prop_nightstand_zila` v001 (Zila's Nightstand)

| Field | Value |
|---|---|
| Asset id | `prop_nightstand_zila` |
| Version | `v001` |
| Spec | [`specs/props/prop_nightstand_zila.json`](../../specs/props/prop_nightstand_zila.json) (specVersion **1.0.0**) |
| Art Bible | [`art-bible/ART_BIBLE.md`](../../art-bible/ART_BIBLE.md) **v1.2**. Read §2–§7, §11–§13 and **§16 Style references** |
| **Style reference (required)** | [`art/approved/prop_bed_zila/prop_bed_zila_v001.png`](../../art/approved/prop_bed_zila/prop_bed_zila_v001.png), approved furniture reference |
| Template | [`art-bible/perspective/prop_nightstand_zila_template.png`](../../art-bible/perspective/prop_nightstand_zila_template.png) (+ `.svg`) |
| Projection | [`art-bible/perspective/projection_cube.png`](../../art-bible/perspective/projection_cube.png) |
| Branch | `codex/art/prop_nightstand_zila-v001` (from the latest `reboot/foundation`) |
| PR target | `reboot/foundation`, template `art_submission.md` |
| Cost | **$0**: built-in image generation included in the existing ChatGPT subscription only |

## Goal of this request

The bed proved that the pipeline works. This request tests **consistency**: the nightstand must look as if **the same artist painted it on the same day as the approved bed**, and it must sit naturally to the right of the bed's headboard. Matching the bed matters more than making the nightstand impressive on its own.

## 1. The object

A small bedside table standing against the north (back) wall, immediately to the right of the bed's headboard (4 cm gap).

- **Size:** 45 cm wide × 40 cm deep × 55 cm tall. Its top is level with the bed's mattress top (55 cm).
- **Construction:** the **same walnut** as the bed frame: same hue, grain softness, satin sheen and rounded edges. One drawer at the top with a small round brass or wood knob, an open shelf below, and four short legs that echo the bed's legs.
- **Top surface:** empty, apart from one small accent: a folded cream cloth doily or a tiny potted succulent, kept within the top surface. **No lamp, clock, phone or books**; those will be separate props.
- **Optional warmth:** a thin blush-pink (`#F4C7D3`) inset on the drawer front is allowed if it echoes the headboard panel. Keep it subtle.

## 2. Exact geometry (canvas pixels, see the template)

| Item | Value |
|---|---|
| Canvas | **160 × 224 px**, RGBA, transparent |
| Density | 2 px per cm (same as the bed) |
| Pivot | **(80, 200)**, front-centre of the footprint at floor level |
| Floor footprint | x **35 → 125**, y **144 → 200** |
| Legs touch floor at | y **200** (± 8 px) |
| Top surface, front edge | y ≈ **90** (55 cm) |
| Top surface, back edge | y ≈ **34** |
| Front face | y 90 → 200, square-on, full height |
| Side overhang | ≤ 2 cm → art may extend to x **31 → 129** |
| artBounds | x 24 → 136, y 20 → 208 |
| Transparent padding | ≥ 8 px |
| Opaque coverage | 20 %–75 % |

**Perspective:** identical to the bed. ZsRoom oblique ¾ top-down, top and front faces only, **no side faces**, no convergence, verticals vertical, depth at ×0.7.

**Light and shadow:** upper-left key light. You may make it slightly more visible than on the bed (lighter left half of the top surface, a soft darker right edge of the front face), but the two pieces must still look lit by the same lamp in the same room. Thin contact darkening at the leg bases only. **No cast floor shadow** (the engine draws it).

**Lines:** coloured contours (dark walnut on wood), with weights matching the bed at the same scale. They may be slightly crisper than the bed's, but not thicker.

## 3. Engine data (reference)

Collision is x −24 → +24 cm and y −40 → 0 cm from the pivot. The interaction anchor `nightstand` sits 28 cm in front of it. It is placed at room position (202, 52), directly to the right of the bed head.

## 4. Generation procedure

1. Confirm built-in image generation is available. **If it isn't, stop and report.** Do not substitute procedural or SVG art.
2. Condition on **the approved bed master** (style), the nightstand template (layout only), and the projection cube. List all three in `metadata.generator.referencesUsed`; the validator warns if the bed reference is missing.
3. Request a transparent background at the highest available resolution.
4. Generate **3 candidates**. Save the raw outputs to `art/source/prop_nightstand_zila/v001/`.
5. Fit the chosen candidate. Near-opaque alpha is now snapped to 255 automatically.
   ```bash
   node scripts/fit-to-spec.mjs art/source/prop_nightstand_zila/v001/candidate-X.png prop_nightstand_zila art/submissions/prop_nightstand_zila/v001/prop_nightstand_zila_v001.png
   ```
6. Write `metadata.json` (with the SHA-256 and the `cost` statement) and `prompt.md`.
7. Run `npm run validate:art` and `npm run gallery`. The gallery now shows your nightstand **beside the approved bed at the same scale**. Check that pairing before opening the PR.
8. Open a **draft** PR into `reboot/foundation`. Change only `art/submissions/prop_nightstand_zila/v001/**` and `art/source/prop_nightstand_zila/v001/**`. Do not merge.

### Suggested generation prompt

> Premium hand-painted HD 2D game asset in exactly the same painting style, wood colour and finish as the attached approved bed: a small walnut bedside nightstand, single object on a fully transparent background. ZsRoom top-down three-quarter orthographic oblique view: we see the top surface and the front face square-on; no perspective convergence, no visible left or right side faces, vertical lines perfectly vertical. 45 cm wide, 40 cm deep, 55 cm tall: the top is level with the bed's mattress. Warm walnut wood (#8A5A3C, shadows #5B3A29) with soft grain, satin sheen and softly rounded edges like the bed frame; one top drawer with a small round knob and an optional subtle blush-pink inset panel; an open shelf below; four short legs matching the bed's legs; a small folded cream doily on top. Soft warm interior daylight from the upper left, painted form shading, coloured dark-walnut contour lines, no black outlines. No lamp, no books, no floor, no wall, no shadow on the floor, no text. Not pixel art, not a 3D render.

## 5. Review checklist

**Technical (automated):** canvas 160×224 · PNG RGBA 8-bit sRGB · padding · art inside artBounds · base at y 200 ± 8 · coverage 20–75 % · metadata, checksum and paths valid · bed style reference listed.

**Visual (human):**
- [ ] Next to the bed in the gallery pairing, it reads as **the same set of furniture**: same wood, same finish, same line softness.
- [ ] Same oblique perspective as the bed: no side faces.
- [ ] The top looks level with the bed's mattress at the same scale.
- [ ] Clean alpha on light and dark floors.
- [ ] Readable at SD size: you can tell there's a drawer and a shelf.
- [ ] Nothing on top that should be a separate prop.

TECHNICAL PASS (CI) · VISUAL PASS (Creative Director only) · PRODUCTION READY (both + in-game regression).
