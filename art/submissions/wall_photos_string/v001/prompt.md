# Generation provenance

Built-in image generation, transparent_background=true. No paid API. Maximum five conditioning images per call; approved bed/nightstand and asset/cube templates plus batch anchor. Window/tall plant generated first; their selected exports anchor the other batch members.

## Candidate A

Original tool output: `exec-1855614e-c7ef-4c16-9d54-564f052e97e0.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/wall_photos_string_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/wall_window_bedroom/v001/wall_window_bedroom_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. WALL PHOTO STRING exactly FOUR polaroids on tiny pink clips on one delicate walnutbrown cord gentle sag. Four abstract painted travel scenes: sea, mountain, temple silhouette, sunset. NO PEOPLE NO FACES NO TEXT. Creamphoto borders variedgentletilt. Overall80cmwide40cmhigh, final192x128canvas, content160wide80high fromy32to112. Photofronts square-on no perspective skew. Warm personalroom illustration. Candidate A: even spacing, understated small clips.
```

## Candidate B

Original tool output: `exec-300a0b23-7e99-43be-bda0-cec706eb56af.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/wall_photos_string_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/wall_window_bedroom/v001/wall_window_bedroom_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. WALL PHOTO STRING exactly FOUR polaroids on tiny pink clips on one delicate walnutbrown cord gentle sag. Four abstract painted travel scenes: sea, mountain, temple silhouette, sunset. NO PEOPLE NO FACES NO TEXT. Creamphoto borders variedgentletilt. Overall80cmwide40cmhigh, final192x128canvas, content160wide80high fromy32to112. Photofronts square-on no perspective skew. Warm personalroom illustration. Candidate B: no bows or mounting knobs. Single thin cord, four SMALL narrow clips. More abstract simplified Indonesian sea, mountain, stepped temple, sunset. Absolutely no glow, shadow, haze or colored surroundings. Empty space must alpha zero.
```

## Candidate C

Original tool output: `exec-cde591ea-b3b3-43b8-a49d-5976097b41c4.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/wall_photos_string_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/wall_window_bedroom/v001/wall_window_bedroom_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. WALL PHOTO STRING exactly FOUR polaroids on tiny pink clips on one delicate walnutbrown cord gentle sag. Four abstract painted travel scenes: sea, mountain, temple silhouette, sunset. NO PEOPLE NO FACES NO TEXT. Creamphoto borders variedgentletilt. Overall80cmwide40cmhigh, final192x128canvas, content160wide80high fromy32to112. Photofronts square-on no perspective skew. Warm personalroom illustration. Candidate C: COMPACT almost square polaroids with thin borders. Simplified Indonesian coastal cove, volcano, temple, sunset. Four distinct readable mini paintings. Thin cord and clips. No bows. ALL outside object alphaZERO, no ambient glow or haze. Content width160px height80px ratio2:1.
```

## Export

Official fitter: native alpha trim, snap alpha<=8 to0 and >=250 to255, uniform Lanczos3 resize, pivot placement, sRGB. Raw originals untouched.

node scripts/fit-to-spec.mjs art/source/wall_photos_string/v001/candidate-c.png wall_photos_string art/submissions/wall_photos_string/v001/wall_photos_string_v001.png
