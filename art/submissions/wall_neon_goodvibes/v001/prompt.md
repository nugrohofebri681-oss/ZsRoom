# Generation provenance

Built-in image generation, transparent_background=true. No paid API. Maximum five conditioning images per call; approved bed/nightstand and asset/cube templates plus batch anchor. Window/tall plant generated first; their selected exports anchor the other batch members.

## Candidate A

Original tool output: `exec-0c4757db-e990-45df-8fe8-7fea91653a0a.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/wall_neon_goodvibes_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/wall_window_bedroom/v001/wall_window_bedroom_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. WALL NEON sign reading exactly 'good vibes' in soft handwritten connectedscript, pale blushpink GLASS TUBES switched OFF. Two compact lines 'good' above 'vibes', clear acrylic backing tiny4standoffs. NO emittedlight/no bloom/no halo/no glow. Acrylicinterior transparent. Frontsquareon overall70cmwide32cmhigh: final176x112canvas content140wide64high top32bottom96. Tubes dimensionalmatte pale pink with small neutraldaylight highlights. Legible at140px width. Candidate A: airy rounded handwritten lettering, pale pink tubes.
```

## Candidate B

Original tool output: `exec-7097d3bb-176c-493f-b297-015d4e46b35b.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/wall_neon_goodvibes_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/wall_window_bedroom/v001/wall_window_bedroom_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. WALL NEON sign reading exactly 'good vibes' in soft handwritten connectedscript, pale blushpink GLASS TUBES switched OFF. Two compact lines 'good' above 'vibes', clear acrylic backing tiny4standoffs. NO emittedlight/no bloom/no halo/no glow. Acrylicinterior transparent. Frontsquareon overall70cmwide32cmhigh: final176x112canvas content140wide64high top32bottom96. Tubes dimensionalmatte pale pink with small neutraldaylight highlights. Legible at140px width. Candidate B: THIN GLASS tubing not chunky rubber, no white solid backing! Backing invisible except delicate clear contour and tiny four mounts, all spaces between letters truly transparent alpha0. Wide low handwritten script overall2.2:1widthheight.
```

## Candidate C

Original tool output: `exec-1530602c-ac1c-420e-baaf-5d1e869860a8.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/wall_neon_goodvibes_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/wall_window_bedroom/v001/wall_window_bedroom_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. WALL NEON sign reading exactly 'good vibes' in soft handwritten connectedscript, pale blushpink GLASS TUBES switched OFF. Two compact lines 'good' above 'vibes', clear acrylic backing tiny4standoffs. NO emittedlight/no bloom/no halo/no glow. Acrylicinterior transparent. Frontsquareon overall70cmwide32cmhigh: final176x112canvas content140wide64high top32bottom96. Tubes dimensionalmatte pale pink with small neutraldaylight highlights. Legible at140px width. Candidate C: electricity disconnected UNLIT sign, MATTE dusty pale pink tubes WITHOUT WHITE CENTER STRIPE. Low contrast daylight highlights only. Transparent mounting plate barely visible edge, NOT white panel. Betweenletters holes transparent. Thin cursive strokes, long low lettering (width/height2.2). No bloom.
```

## Export

Official fitter: native alpha trim, snap alpha<=8 to0 and >=250 to255, uniform Lanczos3 resize, pivot placement, sRGB. Raw originals untouched.

node scripts/fit-to-spec.mjs art/source/wall_neon_goodvibes/v001/candidate-c.png wall_neon_goodvibes art/submissions/wall_neon_goodvibes/v001/wall_neon_goodvibes_v001.png
