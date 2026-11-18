# Art Request 003 — `prop_lamp_zila` v001 (Zila's Bedside Lamp)

| Field | Value |
|---|---|
| Asset id | `prop_lamp_zila` |
| Version | `v001` |
| Spec | [`specs/props/prop_lamp_zila.json`](../../specs/props/prop_lamp_zila.json) (specVersion **1.0.0**) |
| Art Bible | [`art-bible/ART_BIBLE.md`](../../art-bible/ART_BIBLE.md) **v1.4**: §2–§7, §11 (geometry, measured surfaces), §13, §16 |
| **Style references (required)** | [`prop_bed_zila_v001.png`](../../art/approved/prop_bed_zila/prop_bed_zila_v001.png), [`prop_nightstand_zila_v001.png`](../../art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png), both approved |
| **Attachment template (required)** | [`prop_lamp_zila_on_host_template.png`](../../art-bible/perspective/prop_lamp_zila_on_host_template.png): the lamp guide drawn on the approved nightstand at the exact anchor |
| Canvas template | [`prop_lamp_zila_template.png`](../../art-bible/perspective/prop_lamp_zila_template.png) (+ `.svg`) |
| Projection | [`projection_cube.png`](../../art-bible/perspective/projection_cube.png) |
| Branch | `codex/art/prop_lamp_zila-v001` (from the latest `reboot/foundation`) |
| PR target | `reboot/foundation`, **draft**, template `art_submission.md` |
| Cost | **$0**: built-in image generation in the existing ChatGPT subscription only |

## Goal

A small bedside lamp that stands on the approved nightstand and completes the bed + nightstand + lamp set. It must look as if painted by **the same hand on the same day** as the bed and the nightstand.

**The lamp is painted UNLIT.** The game engine renders the light: the glow at the shade, the warm pool on the floor, and on/off toggling (`src/systems/lighting.ts`). Painted glow would double-light the scene and can't be switched off.

## 1. The object

- **Base:** round, 16 cm diameter, 4 cm tall. A thin walnut foot ring that matches the furniture wood (`#8A5A3C`, shadows `#5B3A29`).
- **Body:** a softly rounded ceramic gourd or vase shape, 4–22 cm high, 12 cm wide (up to 14 cm at the bulge). Glazed **blush pink** (`#F4C7D3`, with shadows toward `#C0607E`), with one soft glaze highlight on the upper-left.
- **Shade:** a fabric drum, slightly tapered, 22–42 cm high. 24 cm diameter at the bottom, 18 cm at the top. Warm cream linen (`#F6EBDD`), with a thin rose (`#E8A0B4`) piping at the bottom edge. The top opening shows a sliver of the shade's darker inner fabric. **No bulb visible, no glow, no light rays, no light pool.**
- **Total height:** 42 cm.
- **Not included:** no cord, plug, books, doily (it's painted on the nightstand already) or tabletop. The nightstand is **not** part of this sprite.

## 2. Exact geometry (canvas pixels)

| Item | Value |
|---|---|
| Canvas | **96 × 152 px**, RGBA, transparent |
| Density | 2 px per cm |
| **Pivot** | **(48, 124)**: the **centre** of the base where it touches the tabletop (surface props pivot at their base centre, unlike floor furniture) |
| Base ellipse | 32 × 22 px, centred on the pivot; front edge at y **135** (± 4) |
| Shade bottom rim | y ≈ **80** (22 cm), 48 px wide (x 24 → 72) |
| Shade top rim | y ≈ **40** (42 cm), 36 px wide (x 30 → 66); the top opening ellipse ≈ 36 × 25 px |
| artBounds | x 16 → 80, y 16 → 138 |
| Transparent padding | ≥ 8 px |
| Opaque coverage | 12 %–60 % |

**Perspective:** ZsRoom oblique ¾ top-down, matching the bed and nightstand. Round forms read as **horizontal ellipses with a height:width ratio of 0.7** (the top of the shade opening, the base). No perspective convergence: the shade's taper is real taper, not perspective. Verticals stay vertical.

**Lighting (as painted):** the same soft neutral-warm interior daylight from the upper-left as the approved furniture. The left side is lighter, with a soft shadow on the right. Contact darkening only right under the base ring. **No cast shadow** on the tabletop.

**Lines:** coloured contours: dark walnut on the ring, deep rose on the ceramic, warm grey on the cream shade. The same weight and softness as the bed and nightstand.

## 3. The exact attachment point (engine data, already implemented)

| | Value |
|---|---|
| Host | `prop_nightstand_zila` v001 (approved), surface `top`, anchor **`lamp`** |
| Measured painted top plane (host canvas) | y 33 → 73.5, x 34 → 126 (front edge ≈ 63 cm, not the nominal 55 cm) |
| Anchor | ground offset **(+10, −20) cm** from the nightstand pivot, height **z = 60 cm** → host canvas **(100, 52)** |
| Lamp pivot lands on | host canvas **(100, 52)**: right of the doily, mid-depth of the painted top |
| Room position | lamp ground (212, 32) cm in `zila_bedroom` |
| Collision | none (sits on furniture) · draws just above the nightstand · never fades |
| Interaction | `toggle` "Switch the lamp", in front and to the right of the nightstand |
| Engine light | emitter 32 cm above the base (inside the shade), colour `#FFC872`, radius 240 cm, off by default |

Open `prop_lamp_zila_on_host_template.png`: the green box is the nightstand's measured painted top, and the lamp guide stands exactly where your sprite will be drawn. Your base ellipse must fit inside that green box when placed at the cross.

## 4. Generation procedure

1. Confirm built-in image generation is available. **If it isn't, stop and report.** No procedural or SVG substitutes, no paid APIs.
2. Condition on the **two approved masters** (style), the **on-host template** (placement and scale), the canvas template (layout only) and the projection cube. List all of them in `metadata.generator.referencesUsed`; the validator warns if an approved reference is missing.
3. Request a transparent background at the highest available resolution, with the lamp alone.
4. Generate **3 candidates** into `art/source/prop_lamp_zila/v001/`.
5. Fit the chosen candidate. The default width (48 px) is the shade's diameter.
   ```bash
   node scripts/fit-to-spec.mjs art/source/prop_lamp_zila/v001/candidate-X.png prop_lamp_zila art/submissions/prop_lamp_zila/v001/prop_lamp_zila_v001.png
   ```
6. Measure and report in `selfReview.knownIssues`: the base-ellipse front row (target 135), the shade bottom-rim row (target ~80), and the shade top-rim row (target ~40).
7. Run `npm run validate:art` and `npm run gallery`. The gallery shows the lamp beside **both** approved references at the same scale.
8. Open a **draft** PR into `reboot/foundation`. Change only `art/submissions/prop_lamp_zila/v001/**` and `art/source/prop_lamp_zila/v001/**`. Do not merge.

### Suggested generation prompt

> Premium hand-painted HD 2D game asset in exactly the same painting style, colour handling and finish as the attached approved bed and nightstand: a small bedside table lamp, single object on a fully transparent background, painted UNLIT (the lamp is switched off). ZsRoom top-down three-quarter orthographic oblique view: round shapes appear as horizontal ellipses about 0.7 as tall as they are wide; no perspective convergence; vertical lines perfectly vertical. A round base with a thin warm-walnut foot ring; a softly rounded blush-pink glazed ceramic body like a small gourd vase, with one soft glaze highlight on the upper left; a slightly tapered cream linen drum lampshade with a thin rose-pink piping along its bottom edge, the top opening showing a sliver of darker inner fabric. Total height 42 cm: body 18 cm, shade 20 cm, shade 24 cm wide at the bottom. Soft warm interior daylight from the upper left, painted form shading, coloured contour lines (no black). NO glow, NO light rays, NO light pool, NO visible bulb, no cord, no table, no floor, no shadow, no text. Not pixel art, not a 3D render.

## 5. Review checklist

**Technical (automated):** canvas 96×152 · PNG RGBA 8-bit sRGB · padding · artBounds · base front at y 135 ± 4 · coverage 12–60 % · metadata, checksum and paths valid · both approved references listed.

**Visual (human):**
- [ ] With the bed and nightstand, it reads as **one furniture set**.
- [ ] Unlit. No painted glow. It still looks cosy and premium when off.
- [ ] Ellipses are consistent with the oblique view (no convergence, no isometric diamonds).
- [ ] Placed on the nightstand at the anchor, it looks like it **stands on** the painted top, neither floating nor sunk.
- [ ] Proportions are believable (a 42 cm lamp beside a 165 cm character).
- [ ] Clean alpha on light and dark backgrounds; readable at SD size.

Geometry tolerances (Art Bible §11): shade-rim and base rows within ±10 % of the designed height, min ±6 px.

TECHNICAL PASS (CI) · VISUAL PASS (Creative Director only) · PRODUCTION READY (both + in-game regression, including the lit state).
