# ZsRoom Art Bible — v1.0

**Style name:** ZsRoom OG Enhanced — Premium HD Illustrated 2D
**Status:** v1.0 technical standard (Claude Code). Characters §8 are **draft — pending Creative Director approval**.
**Machine-readable source of truth:** `specs/projection.json`, `specs/props/*.json`, `specs/characters/*.json`. If this document and a spec JSON disagree, the JSON wins and this document gets fixed.

---

## 0. Ground rules

1. **Not pixel art. Not 3D. Not 2.5D. Not generic anime.** Hand-illustrated-looking HD 2D, as if painted by one artist for one book.
2. **One world, one hand.** Every asset must look like it belongs next to every other asset. Consistency beats individual brilliance.
3. **Readability first.** At gameplay zoom the player must instantly read what an object is, where its base is and whether it can be used.
4. **Warmth.** Cozy, lived-in, personal. Never sterile, never neon-glossy, never grim.
5. **Grey-box ≠ art.** Grey-box shapes in the engine are engineering stand-ins. They are labelled, never shipped, and never presented as artwork.
6. **Generated ≠ approved.** An asset is production art only after the Creative Director approves it (§14).

## 1. What we keep from the original game

The OG bedroom (on `main`) defines the emotional identity — not the rendering technique:

| Keep | Change |
|---|---|
| Night-time coziness: warm lamp pools, fairy lights, city window | Pixel-art rendering → HD painterly illustration |
| Rose/blush pinks against warm walnut wood | Low-res sprites → 2 px/cm masters |
| Personal props: heart cushion, teddy, plants, photos, neon "good vibes" | Ad-hoc scale → true-scale world in cm |
| Zila & Febri as recognisable people | Chibi 2.5–3 head proportions → 4.5–4.75 heads (draft, §8) |

## 2. Perspective — "top-down three-quarter" (ZsRoom oblique)

See `art-bible/perspective/projection_cube.png`.

- **Orthographic oblique.** No vanishing points. Parallel edges stay parallel.
- **Verticals are vertical.** Front faces are seen **square-on** at full height (height scale **×1.0**).
- **Top surfaces are visible**, foreshortened: floor depth is drawn at **×0.7** of its true length.
- **Side faces are not visible.** A box shows exactly two faces: top and front.
- Camera looks from the south (bottom of screen) toward the north wall.

Formula (cm → render units): `screenX = x`, `screenY = y × 0.7 − z × 1.0`.

**Common mistakes to reject:** two-point perspective, visible side faces, isometric diamonds, tilted verticals, fish-eye, front faces drawn shorter than true height.

## 3. Units, density and canvases

- **World unit = 1 cm.** Everything is designed at true scale.
- **Master density = 2 px per cm** (render units). A 120 cm wide bed is 240 px wide in the master file.
- **Runtime densities:** HD = 2 px/cm, SD = 1 px/cm (generated automatically from the master by `scripts/approve-asset.mjs`). Draw so the asset still reads at SD.
- **Canvas** and **pivot** are fixed per asset by its spec. Never resize a canvas to fit the art — fit the art to the canvas (`scripts/fit-to-spec.mjs`).
- **Pivot** = front-centre floor contact point of the footprint (props) or midpoint between the feet (characters). The engine places the pivot at the object's ground position and depth-sorts by it.
- World coordinates never depend on image pixels; changing density never moves gameplay.

## 4. Scale reference (true scale)

See `art-bible/perspective/scale_lineup.png`.

| Thing | Size |
|---|---|
| Zila | 158 cm tall |
| Febri | 170 cm tall (12 cm taller — subtle, believable) |
| Interior wall / ceiling | 270 cm |
| Interior door | 90 × 210 cm |
| Bed (Zila) | 120 × 200 cm, mattress top 55 cm, headboard 110 cm |
| Desk | 120 × 60 cm, top 75 cm |
| Chair seat | 45 cm |
| Wardrobe | 110 × 60 cm, 210 cm tall |

Furniture is **not** enlarged for "cuteness". Characters must be able to sit on a 45 cm seat and lie on a 55 cm mattress without cheating.

## 5. Silhouette & shape language

- Soft, rounded corners on furniture (radius ≈ 2–6 cm); nothing razor-sharp except glass and metal trims.
- Clear outer silhouette that reads at SD (1 px/cm). Test by filling the alpha black: can you still tell what it is?
- Big shapes → medium shapes → small details. Detail density is highest where the player looks (tops of desks, bedding, shelves) and lowest on undersides.

## 6. Colour

Master palette (anchor swatches — local colours may shift around them, but stay in family):

| Token | Hex | Use |
|---|---|---|
| rose | `#E8A0B4` | Zila's signature pink, bedding, accents |
| blush | `#F4C7D3` | Highlights on pink, soft fabrics |
| deep-rose | `#C0607E` | Pink shadows, ribbons, UI accent |
| cream | `#F6EBDD` | Pillows, cream jacket, walls (day) |
| warm-white | `#FFF8F0` | Brightest highlights (never pure #FFFFFF in large areas) |
| walnut | `#8A5A3C` | Wood mid-tone (furniture, floors) |
| dark-walnut | `#5B3A29` | Wood shadows, trims |
| plum-shadow | `#3A2530` | Darkest shadow / line colour (never pure black) |
| night-navy | `#1F2440` | Window night sky |
| lamp-amber | `#FFC872` | Lamp light, fairy lights |
| leaf | `#6E9B5A` | Plants |
| febri-blue | `#5B7FB5` | Febri's shirt |

Rules: no pure `#000000`; no fully saturated primaries; shadows shift **toward plum/warm**, highlights toward **warm cream**. Saturation is highest in mid-tones.

## 7. Line work, materials, lighting, shadows

**Line work.** Coloured lines — a darker, slightly more saturated version of the local colour (wood → dark-walnut, pink → deep-rose, white → warm grey-plum). Master weights: outer silhouette ≈ 3 px, interior form lines ≈ 1.5–2 px, texture/detail ≈ 1 px. Lines may break where light hits. No uniform vector-stroke look.

**Materials** (painted, not photo-textured):
- *Wood*: warm walnut, visible but soft grain following the form; satin sheen highlight on top edges.
- *Fabric*: soft folds with weight, gentle quilting/stitch lines on duvets, slight fuzz on edges; no hard plastic sheen.
- *Ceramic/glass*: one crisp highlight, reflected warm light.
- *Metal*: thin, warm-tinted, minimal.
- *Plants*: clustered leaf masses with 2–3 tone steps, a few individually readable leaves.

**Lighting.** Key light from the **upper-left** (north-west, slightly toward the viewer). Neutral-warm "daylight interior" (≈ 5000–5500 K). Top planes are brightest, front planes mid, undersides darkest. Assets are painted in this neutral light; the engine adds time-of-day and lamp lighting on top, so **do not bake night lighting or coloured lamp glow into props**.

**Shadows.**
- Form shading and self-shadows (e.g. pillow onto duvet): **baked**.
- **Contact occlusion**: a thin, soft darkening where the object meets the floor, **inside the footprint only**: baked.
- **Cast shadows on the floor/walls: NOT baked.** The engine renders them so they can change with time of day.

## 8. Characters — draft, pending Creative Director approval

Specs: `specs/characters/char_zila.json`, `specs/characters/char_febri.json`.

Proposed proportion: **"storybook"** — Zila ≈ 4.5 heads, Febri ≈ 4.75 heads. More mature and expressive than the OG chibi sprites, still warm and soft, never realistic-gritty and never generic anime. **This is a major artistic decision and needs the Creative Director's approval before any character art is generated.**

**Zila (identity locks):** long layered brown hair to mid-back, bangs, face-framing strands; **two pink hair ornaments** (one each side, symmetric); large warm-brown eyes; soft round face; gentle expression; default outfit pink & white.

**Febri (identity locks):** short textured dark hair with a side-swept fringe; **cream jacket over blue shirt**; dark trousers; **crossbody bag** (strap over left shoulder, bag at right hip — asymmetric, never mirrored).

Character sheet canvas: 256 × 400 px @ 2 px/cm, pivot (128, 376) between the feet.

## 9. Animation principles

- **8 facings** in-game (S, SE, E, NE, N, NW, W, SW). Author S, SE, E, NE, N; W-side facings may be mirrored **only** for layers without asymmetric details (Febri's bag, side-parted hair, logos are authored per side).
- **Hybrid pipeline:** key body poses frame-by-frame (walk 8 frames/cycle at 10–12 fps; idle 4–6 frames); secondary motion (hair sway, bag bounce, skirt) via layered/skeletal assistance.
- **Layered outfits:** body, face, hair-back, hair-front, outfit-top, outfit-bottom, shoes, accessories as separate aligned layers on the same canvas and pivot, so new outfits do not require redrawing bodies.
- **Contact & weight:** feet plant on the pivot line (no sliding — stride length is matched to movement speed: walk 150 cm/s), clear passing pose, body bob ≤ 3 cm.
- **Quality gate first:** one character, one facing, one walk cycle must pass Creative Director review before any further frames are produced.

## 10. Environment scale & modularity

- Rooms are built from **data** (`src/data/rooms/*.json`): size in cm, walls 270 cm, doors, props by asset id and ground position.
- Walls, floors and trims are modular pieces aligned to a **10 cm grid**; furniture footprints are multiples of 5 cm.
- Both floors of the Dream Home share one architectural grid so stairs, windows and room positions line up vertically.

## 11. Object footprints & collision

Each prop spec defines: `footprint` (true floor size), `collision` rectangles relative to the pivot (may add up to `maxSideOverhangCm` on the sides to cover overhanging fabric), and `artBounds` (the box every opaque pixel must stay inside). Art may overhang the footprint sideways by at most `maxSideOverhangCm`; it must never extend below the pivot line except for a ≤ 10 px contact-occlusion fade.

## 12. Occlusion & depth sorting

- Depth = ground y of the pivot (front edge of the footprint). Characters standing **beside** a deep object sort in front of it; standing **behind** a tall object (`occluder: true`) fades the object to ≈ 42 % opacity.
- Therefore every prop must be **one clean piece** whose silhouette matches its true volume — no floating decorations far outside the footprint.
- Tall back-wall objects (wardrobes, shelves) are authored as single sprites; very large structures (buildings) will be split into base + roof layers (future spec).

## 13. Export specification

| Property | Requirement |
|---|---|
| Format | PNG, 8-bit per channel, RGBA, sRGB |
| Alpha | Straight (unpremultiplied); real transparency, never a baked checkerboard or white |
| Canvas | Exactly the spec canvas; transparent edge padding as specified |
| Base | Lowest solid row on the spec `baseLine` ± tolerance |
| Name | `<asset_id>_<v###>.png` in `art/submissions/<asset_id>/<v###>/` |
| Metadata | `metadata.json` per `specs/schema/submission-metadata.schema.json` + `prompt.md` |
| Raw sources | Original, unprocessed generator outputs in `art/source/<asset_id>/<v###>/` |
| Layers | When the tool cannot export layers, keep the raw output and document cleanup steps in `metadata.postProcessing` |

## 14. Review & approval

1. **TECHNICAL PASS** — automated: format, canvas, alpha, padding, bounds, base line, metadata, checksums, file ownership (`scripts/validate-art.mjs`).
2. **VISUAL PASS** — human: the Creative Director reviews the gallery (`npm run gallery`) against the checklist in this bible. Claude gives a technical/consistency opinion; the CD decides.
3. **PRODUCTION READY** — both passed **and** the asset is integrated and gameplay regression tests pass.

Passing step 1 never implies step 2.

## 15. Using generators (Codex `$imagegen` or similar)

- Always attach/condition on: the asset's perspective template (`art-bible/perspective/<asset_id>_template.png`), `projection_cube.png`, and any **approved** master references. Never condition on OG pixel sprites as style references (identity only).
- Ask for a **transparent background** natively; fall back to `fit-to-spec.mjs --key-background` only when unavoidable and inspect the edges.
- Generate at the highest resolution available, then fit to the canvas — never upscale a small output.
- Record the exact prompt, tool and model in `prompt.md` / `metadata.json`.
- Zero additional cost: use only capabilities already included in existing subscriptions; never start paid API usage.

## Changelog

- **v1.0 (2026-11-18)** — Clean-rebuild Art Bible. Projection, units, scale, palette, materials, lighting, export, review gates. Characters drafted for CD approval.
