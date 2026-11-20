# Generation provenance

Built-in image generation, transparent_background=true. No paid API. Maximum five conditioning images per call; approved bed/nightstand and asset/cube templates plus batch anchor. Window/tall plant generated first; their selected exports anchor the other batch members.

## Candidate A

Original tool output: `exec-febd415f-35fc-437b-a9e7-00a0be545d67.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/prop_plant_tall_zila_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/approved/prop_desk_zila/prop_desk_zila_v002.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. Tall fiddle-leaf fig in cream ceramic pot. Overall165cm; pot40cmhigh40cmdiameter, foliage64cmwide; 2px/cm. Final160x432 canvas base408, foliage top about50–78, potfronttop328, rimback272 (ellipse0.70). Long vertical trunk with clustered broad glossy leaves 2–3 green tone steps, clean separated silhouette, no floating leaves. Painted greens#6E9B5A. Pot elegantly plain warmcream. Clean contour for character occlusion. Overall silhouette tall/slender width128,height~358. Candidate A: balanced upright branching, nine broad fiddle leaves with calm spacing.
```

## Candidate B

Original tool output: `exec-1be9c85c-d7b3-46c0-b9aa-a534c535a3f7.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/prop_plant_tall_zila_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/approved/prop_desk_zila/prop_desk_zila_v002.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. Tall fiddle-leaf fig in cream ceramic pot. Overall165cm; pot40cmhigh40cmdiameter, foliage64cmwide; 2px/cm. Final160x432 canvas base408, foliage top about50–78, potfronttop328, rimback272 (ellipse0.70). Long vertical trunk with clustered broad glossy leaves 2–3 green tone steps, clean separated silhouette, no floating leaves. Painted greens#6E9B5A. Pot elegantly plain warmcream. Clean contour for character occlusion. Overall silhouette tall/slender width128,height~358. Candidate B: slightly asymmetrical grouped leaves, stronger broad pot, lower cluster closer to pot. Rim deep oval0.7 NOT thin ellipse.
```

## Candidate C

Original tool output: `exec-321b67af-c857-4d4d-a128-c1f0212d20cb.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/prop_plant_tall_zila_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/approved/prop_desk_zila/prop_desk_zila_v002.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. Tall fiddle-leaf fig in cream ceramic pot. Overall165cm; pot40cmhigh40cmdiameter, foliage64cmwide; 2px/cm. Final160x432 canvas base408, foliage top about50–78, potfronttop328, rimback272 (ellipse0.70). Long vertical trunk with clustered broad glossy leaves 2–3 green tone steps, clean separated silhouette, no floating leaves. Painted greens#6E9B5A. Pot elegantly plain warmcream. Clean contour for character occlusion. Overall silhouette tall/slender width128,height~358. Candidate C: about11 broad leaves arranged in3 readableclusters, shorter exposedtrunk, pot occupies roughly27percent totalheight. Look DOWN into pot, rimellipse0.7. Less realistic leaftexture, 3 paintedtone groups.
```

## Export

Official fitter: native alpha trim, snap alpha<=8 to0 and >=250 to255, uniform Lanczos3 resize, pivot placement, sRGB. Raw originals untouched.

node scripts/fit-to-spec.mjs art/source/prop_plant_tall_zila/v001/candidate-c.png prop_plant_tall_zila art/submissions/prop_plant_tall_zila/v001/prop_plant_tall_zila_v001.png --height 358
