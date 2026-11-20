# Generation provenance

Built-in image generation, transparent_background=true. No paid API. Maximum five conditioning images per call; approved bed/nightstand and asset/cube templates plus batch anchor. Window/tall plant generated first; their selected exports anchor the other batch members.

## Candidate A

Original tool output: `exec-0107ab7b-1194-47b8-8413-122d3bee6d4b.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/wall_window_bedroom_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/approved/prop_wardrobe_zila/prop_wardrobe_zila_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. Cream framed double WINDOW with cross muntin, slim sill, walnut rod, blush curtains tied back on BOTH sides. Window140cm wide125cmhigh, curtains extend32cm eachside. Total width408px,height250px at final448x304 canvas. Frontbottom288, top38. Central frame width280px. CRITICAL all four pane interiors 100% TRANSPARENT HOLES (alpha0), no glass tint, NO blue/white fill, no sky, no reflections; engine supplies sky. Cream cross muntin remains visible between holes. Curtains generous softly painted folds consistent bedding. No floor. Candidate A: restrained classic folds and simple rounded finials.
```

## Candidate B

Original tool output: `exec-d0fc1997-0f62-4c66-ba0e-263ea187393c.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/wall_window_bedroom_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/approved/prop_wardrobe_zila/prop_wardrobe_zila_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. Cream framed double WINDOW with cross muntin, slim sill, walnut rod, blush curtains tied back on BOTH sides. Window140cm wide125cmhigh, curtains extend32cm eachside. Total width408px,height250px at final448x304 canvas. Frontbottom288, top38. Central frame width280px. CRITICAL all four pane interiors 100% TRANSPARENT HOLES (alpha0), no glass tint, NO blue/white fill, no sky, no reflections; engine supplies sky. Cream cross muntin remains visible between holes. Curtains generous softly painted folds consistent bedding. No floor. Candidate B: deeper drape folds, narrower elegant curtain ties. Pane interiors entirely alphaZERO, no translucent glaze.
```

## Candidate C

Original tool output: `exec-76edf469-ad74-4140-ba61-ba9b325117ec.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/wall_window_bedroom_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/approved/prop_wardrobe_zila/prop_wardrobe_zila_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. Cream framed double WINDOW with cross muntin, slim sill, walnut rod, blush curtains tied back on BOTH sides. Window140cm wide125cmhigh, curtains extend32cm eachside. Total width408px,height250px at final448x304 canvas. Frontbottom288, top38. Central frame width280px. CRITICAL all four pane interiors 100% TRANSPARENT HOLES (alpha0), no glass tint, NO blue/white fill, no sky, no reflections; engine supplies sky. Cream cross muntin remains visible between holes. Curtains generous softly painted folds consistent bedding. No floor. Candidate C: lighter restrained blush fabric, simple tailored folds, clearly square symmetrical creamframe. Truly empty four pane holes not glass material.
```

## Export

Official fitter: native alpha trim, snap alpha<=8 to0 and >=250 to255, uniform Lanczos3 resize, pivot placement, sRGB. Raw originals untouched.

node scripts/fit-to-spec.mjs art/source/wall_window_bedroom/v001/candidate-c.png wall_window_bedroom art/submissions/wall_window_bedroom/v001/wall_window_bedroom_v001.png
