# Generation provenance

Built-in image generation, transparent_background=true. No paid API. Maximum five conditioning images per call; approved bed/nightstand and asset/cube templates plus batch anchor. Window/tall plant generated first; their selected exports anchor the other batch members.

## Candidate A

Original tool output: `exec-625eb092-7e82-445d-8f89-c3067cdc6e3f.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/wall_fairy_lights_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/wall_window_bedroom/v001/wall_window_bedroom_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. WALL FAIRY LIGHTS unlit creamglass tinybulbs on delicatebrown cord, gentle shallow swags.6metres overall width600cm height22cm. Actual content aspect27:1 (1200px wide44high), final1232x96canvas. Four very SHALLOW swags with 24 evenlyspaced smallbulbs. Paint OFF completely no emissivecore/no yellowglow/no halo. Cord continuous, no otherobjects. Use widecanvas with transparentpadding if necessary but string itself verywideandthin. Bottom80 top36. Candidate A: four shallow arcs, tiny round cream bulbs.
```

## Candidate B

Original tool output: `exec-0f40b86c-9a6d-4941-ad30-51280c52bcfd.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/wall_fairy_lights_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/wall_window_bedroom/v001/wall_window_bedroom_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. WALL FAIRY LIGHTS unlit creamglass tinybulbs on delicatebrown cord, gentle shallow swags.6metres overall width600cm height22cm. Actual content aspect27:1 (1200px wide44high), final1232x96canvas. Four very SHALLOW swags with 24 evenlyspaced smallbulbs. Paint OFF completely no emissivecore/no yellowglow/no halo. Cord continuous, no otherobjects. Use widecanvas with transparentpadding if necessary but string itself verywideandthin. Bottom80 top36. Candidate B: slightly elongated tiny cream teardrop bulbs, four smooth shallow swags. Uniformly slender brown cord.
```

## Candidate C

Original tool output: `exec-af7fb7cb-56bf-4710-ae71-6db7c780e3e7.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/wall_fairy_lights_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/wall_window_bedroom/v001/wall_window_bedroom_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. WALL FAIRY LIGHTS unlit creamglass tinybulbs on delicatebrown cord, gentle shallow swags.6metres overall width600cm height22cm. Actual content aspect27:1 (1200px wide44high), final1232x96canvas. Four very SHALLOW swags with 24 evenlyspaced smallbulbs. Paint OFF completely no emissivecore/no yellowglow/no halo. Cord continuous, no otherobjects. Use widecanvas with transparentpadding if necessary but string itself verywideandthin. Bottom80 top36. Candidate C: tiny pearl bulbs short sockets, continuous delicate brown cord, four restrained arcs. Increase overall width versus sag: 1200width only44height. Off matte glass.
```

## Export

Official fitter: native alpha trim, snap alpha<=8 to0 and >=250 to255, uniform Lanczos3 resize, pivot placement, sRGB. Raw originals untouched.

node scripts/fit-to-spec.mjs art/source/wall_fairy_lights/v001/candidate-c.png wall_fairy_lights art/submissions/wall_fairy_lights/v001/wall_fairy_lights_v001.png
