# Generation provenance

Built-in image generation, transparent_background=true. No paid API. Maximum five conditioning images per call; approved bed/nightstand and asset/cube templates plus batch anchor. Window/tall plant generated first; their selected exports anchor the other batch members.

## Candidate A

Original tool output: `exec-ed99464d-00a5-4882-9bb8-142ec40df51d.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/prop_plant_small_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/prop_plant_tall_zila/v001/prop_plant_tall_zila_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. Small leafy pottedplant60cm overallheight in blushpink ceramic pot30cmhigh35cmwide, foliage50cmwide. Final144x224canvas base200, potfronttop140 back91 (ellipse0.70), foliage topabout50–80. Leafclusters #6E9B5A with2–3 paintedtones fewindividualleaves. Cleanattachedsilhouette, no detachedleaves. Compactroundedplant not talltree, pot halfphysicalheight. Candidate A: broad softly heartshaped leaves, plain satin blush pot.
```

## Candidate B

Original tool output: `exec-fe8d301f-120f-4333-bb86-45c3079d26f7.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/prop_plant_small_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/prop_plant_tall_zila/v001/prop_plant_tall_zila_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. Small leafy pottedplant60cm overallheight in blushpink ceramic pot30cmhigh35cmwide, foliage50cmwide. Final144x224canvas base200, potfronttop140 back91 (ellipse0.70), foliage topabout50–80. Leafclusters #6E9B5A with2–3 paintedtones fewindividualleaves. Cleanattachedsilhouette, no detachedleaves. Compactroundedplant not talltree, pot halfphysicalheight. Candidate B: compact oval leaves, balanced rounded foliage, pot with deeper visible soil ellipse and slightly tapered ceramic sides. Retain painted quiet leaf texture.
```

## Candidate C

Original tool output: `exec-bea89138-3268-4c8d-a2cf-8f0cd4efe027.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/prop_plant_small_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/prop_plant_tall_zila/v001/prop_plant_tall_zila_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. Small leafy pottedplant60cm overallheight in blushpink ceramic pot30cmhigh35cmwide, foliage50cmwide. Final144x224canvas base200, potfronttop140 back91 (ellipse0.70), foliage topabout50–80. Leafclusters #6E9B5A with2–3 paintedtones fewindividualleaves. Cleanattachedsilhouette, no detachedleaves. Compactroundedplant not talltree, pot halfphysicalheight. Candidate C: short rounded foliage with 7 broad heart leaves, HALF total physical height is pot. Deep 0.70-ratio pot rim ellipse, look more from above, rimwidth70 depth49 at final. Simplify leaf texture to match illustrated furniture.
```

## Export

Official fitter: native alpha trim, snap alpha<=8 to0 and >=250 to255, uniform Lanczos3 resize, pivot placement, sRGB. Raw originals untouched.

node scripts/fit-to-spec.mjs art/source/prop_plant_small/v001/candidate-c.png prop_plant_small art/submissions/prop_plant_small/v001/prop_plant_small_v001.png
