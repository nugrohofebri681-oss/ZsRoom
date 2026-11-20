# Generation provenance

Built-in image generation, transparent_background=true. No paid API. Maximum five conditioning images per call; approved bed/nightstand and asset/cube templates plus batch anchor. Window/tall plant generated first; their selected exports anchor the other batch members.

## Candidate A

Original tool output: `exec-392293c8-a215-4b48-a471-b9371fe9f77d.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/wall_shelf_books_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/wall_window_bedroom/v001/wall_window_bedroom_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. Floating walnut WALLSHELF 90cmwide24cmdeep36cm overallheight, 2 small brackets beneath. Upright and slightlyleaning books cream/blush/rose/mutedblue spines NOtext, tiny pottedsucculent oneend. Oblique top andfront no outside sidefaces. Final224x144canvas, shelf totalwidth180; bottom128, overalltop~22–56. Shelfplane depth34px front~106 back~72; books extendabove. Clean delicatebrackets not talllegs. Candidate A: six books left, small succulent right, substantial visible shelf top.
```

## Candidate B

Original tool output: `exec-8696d856-5cd4-4eb1-84b0-54c8e8658ea4.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/wall_shelf_books_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/wall_window_bedroom/v001/wall_window_bedroom_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. Floating walnut WALLSHELF 90cmwide24cmdeep36cm overallheight, 2 small brackets beneath. Upright and slightlyleaning books cream/blush/rose/mutedblue spines NOtext, tiny pottedsucculent oneend. Oblique top andfront no outside sidefaces. Final224x144canvas, shelf totalwidth180; bottom128, overalltop~22–56. Shelfplane depth34px front~106 back~72; books extendabove. Clean delicatebrackets not talllegs. Candidate B: five books grouped right and succulent left. Rectangular top plane with PARALLEL vertical sideedges, no trapezoid. Smaller unobtrusive brackets. Generous topdepth.
```

## Candidate C

Original tool output: `exec-269cdb1a-c7c0-450f-8430-73d8459831cb.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/wall_shelf_books_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/wall_window_bedroom/v001/wall_window_bedroom_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. Floating walnut WALLSHELF 90cmwide24cmdeep36cm overallheight, 2 small brackets beneath. Upright and slightlyleaning books cream/blush/rose/mutedblue spines NOtext, tiny pottedsucculent oneend. Oblique top andfront no outside sidefaces. Final224x144canvas, shelf totalwidth180; bottom128, overalltop~22–56. Shelfplane depth34px front~106 back~72; books extendabove. Clean delicatebrackets not talllegs. Candidate C: four slimmer books left two gently leaning, simple plain succulent cream pot right. Less chunky board, understated small brackets. Camera HIGH enough to see 34px topdepth on180pxwidth. Top MUST be a rectangle NOT trapezoid.
```

## Export

Official fitter: native alpha trim, snap alpha<=8 to0 and >=250 to255, uniform Lanczos3 resize, pivot placement, sRGB. Raw originals untouched.

node scripts/fit-to-spec.mjs art/source/wall_shelf_books/v001/candidate-c.png wall_shelf_books art/submissions/wall_shelf_books/v001/wall_shelf_books_v001.png
