# Generation provenance

Built-in image generation, transparent_background=true. No paid API. Maximum five conditioning images per call; approved bed/nightstand and asset/cube templates plus batch anchor. Window/tall plant generated first; their selected exports anchor the other batch members.

## Candidate A

Original tool output: `exec-1b64947f-f6b1-4207-9edc-10c0e5d3f638.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/prop_catbed_mochi_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/prop_plant_tall_zila/v001/prop_plant_tall_zila_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. Sleeping GREY CAT curled inside round blush plush catbed with creamcushion. Closedeyes tinysoftnose, visible ears andtail wrapped aroundbody, peaceful. No accessories/collar/text. Match beddingillustration not realisticphoto.60cmwide50cmdeep, rim22cmhigh cattop30cm; final160x176canvas, content124wide~114high base152. Bed ellipse top70px deep (depth0.7), rimfront108 back38. Greycat readable in centre at62pxSDsize, no darkfacialblob. Candidate A: cat face towards viewer-left, soft wide plush rim.
```

## Candidate B

Original tool output: `exec-72324121-9ed1-4999-a539-04921f7706ad.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/prop_catbed_mochi_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/prop_plant_tall_zila/v001/prop_plant_tall_zila_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. Sleeping GREY CAT curled inside round blush plush catbed with creamcushion. Closedeyes tinysoftnose, visible ears andtail wrapped aroundbody, peaceful. No accessories/collar/text. Match beddingillustration not realisticphoto.60cmwide50cmdeep, rim22cmhigh cattop30cm; final160x176canvas, content124wide~114high base152. Bed ellipse top70px deep (depth0.7), rimfront108 back38. Greycat readable in centre at62pxSDsize, no darkfacialblob. Candidate B: simplified soft grey fur masses, thin darker closed eyelid curves, face towards viewer-right, less thick rim. More handpainted than photorealistic.
```

## Candidate C

Original tool output: `exec-e5edb77c-30d6-4f5b-b4af-8958fd223c51.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/prop_catbed_mochi_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/prop_plant_tall_zila/v001/prop_plant_tall_zila_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. Sleeping GREY CAT curled inside round blush plush catbed with creamcushion. Closedeyes tinysoftnose, visible ears andtail wrapped aroundbody, peaceful. No accessories/collar/text. Match beddingillustration not realisticphoto.60cmwide50cmdeep, rim22cmhigh cattop30cm; final160x176canvas, content124wide~114high base152. Bed ellipse top70px deep (depth0.7), rimfront108 back38. Greycat readable in centre at62pxSDsize, no darkfacialblob. Candidate C: soft grey cat curled face frontleft; simpler fur brush masses, both closedeyes readable. Medium plushrim, deep top ellipse, less tall frontwall. Cozy relaxedpose.
```

## Export

Official fitter: native alpha trim, snap alpha<=8 to0 and >=250 to255, uniform Lanczos3 resize, pivot placement, sRGB. Raw originals untouched.

node scripts/fit-to-spec.mjs art/source/prop_catbed_mochi/v001/candidate-c.png prop_catbed_mochi art/submissions/prop_catbed_mochi/v001/prop_catbed_mochi_v001.png
