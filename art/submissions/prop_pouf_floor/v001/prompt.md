# Generation provenance

Built-in image generation, transparent_background=true. No paid API. Maximum five conditioning images per call; approved bed/nightstand and asset/cube templates plus batch anchor. Window/tall plant generated first; their selected exports anchor the other batch members.

## Candidate A

Original tool output: `exec-cf5ec5c8-f557-47ed-8a42-0559cf1a45fb.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/prop_pouf_floor_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/prop_plant_tall_zila/v001/prop_plant_tall_zila_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. Round CREAM KNITTED FLOOR POUF50cm across38cm tall, chunkypaintedknit tuftedtop. Actualtopellipse0.70ratio, not shallowflatoval. Final144x192canvas base168 topfront92 topback22, paintedwidth100–108px. Bodyfrontheight76px under topplane, overallheight146px. No legs/nofloor. Softsquat substantialseat clearlyrounded top, subtlecreamshade not darkbrown. Candidate A: broad cableknit braids, understated central tuft.
```

## Candidate B

Original tool output: `exec-b30bf995-8709-4563-ba1d-9206394e24dd.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/prop_pouf_floor_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/prop_plant_tall_zila/v001/prop_plant_tall_zila_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. Round CREAM KNITTED FLOOR POUF50cm across38cm tall, chunkypaintedknit tuftedtop. Actualtopellipse0.70ratio, not shallowflatoval. Final144x192canvas base168 topfront92 topback22, paintedwidth100–108px. Bodyfrontheight76px under topplane, overallheight146px. No legs/nofloor. Softsquat substantialseat clearlyrounded top, subtlecreamshade not darkbrown. Candidate B: smaller knit stitches, soft flattened tufted seat. Taller frontwall and deeperellipse than usual ottoman photograph. TOP ellipse 70%diameter, FRONTwall76%diameter. Overall projectedheight146%width.
```

## Candidate C

Original tool output: `exec-f4428deb-f6be-426d-b9ce-73a697096152.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/prop_pouf_floor_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/prop_plant_tall_zila/v001/prop_plant_tall_zila_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. Round CREAM KNITTED FLOOR POUF50cm across38cm tall, chunkypaintedknit tuftedtop. Actualtopellipse0.70ratio, not shallowflatoval. Final144x192canvas base168 topfront92 topback22, paintedwidth100–108px. Bodyfrontheight76px under topplane, overallheight146px. No legs/nofloor. Softsquat substantialseat clearlyrounded top, subtlecreamshade not darkbrown. Candidate C: camera substantially ABOVE object looking down at deep broad seat ellipse. Draw topellipse 100wide70deep then straight sides76high below its FRONT rim; total146high, width100. Preserve this TALL projected geometry, not squat photograph. Soft illustrated knit in larger readable loops.
```

## Export

Official fitter: native alpha trim, snap alpha<=8 to0 and >=250 to255, uniform Lanczos3 resize, pivot placement, sRGB. Raw originals untouched.

node scripts/fit-to-spec.mjs art/source/prop_pouf_floor/v001/candidate-c.png prop_pouf_floor art/submissions/prop_pouf_floor/v001/prop_pouf_floor_v001.png
