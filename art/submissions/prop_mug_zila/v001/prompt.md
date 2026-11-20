# Generation record

Built-in image_gen.imagegen; model identifier not exposed. transparent_background=true. No paid APIs. Candidate references below are exact per call. Earlier A–C explorations (A–B stool) used R1 + bed + template; later selected candidates add nightstand + projection cube. This omission in early exploration is disclosed rather than backfilling false conditioning. Revised assets required five references (tool limit5); R1 style carries batch identity. Wardrobe is unchanged and used directly for new props where a reference slot is available.

R1 masters are from branch codex/art/batch-b-r1, commit48bce5bd7304c705590c071d8322ba634d60ec07, recorded by SHA256 in metadata; they are not yet in this foundation tree. All official templates and approved references are from foundation06bb459.

## Candidate A

References, in order:
- art-bible/perspective/prop_mug_zila_template.png
- art/approved/prop_bed_zila/prop_bed_zila_v001.png
- art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png
- art-bible/perspective/projection_cube.png
- art/submissions/prop_wardrobe_zila/v001/prop_wardrobe_zila_v001.png

```text
Original single cream ceramic cocoa mug premiumHD handillustrated ZsRoom prop, same artist as suppliedbed/nightstand, warm cream#F6EBDD subtlebrushfinish,coloredcontour. Transparentisolated nofloor/castshadow/glow. Handle RIGHT; a little cocoa visible; no steam/text/logo/decor. Above-front orthographic gameview: roundrim ELLIPSE h/w0.7, frontvisible, straight uprightmug not tilted. 8cm diameter,10cm tall,2px/cm. Final48x56canvas: basecentre24,38 basefront44, rimcentre18, rimwidth17,height12. Fullheight~32 and includinghandle~24wide. Topdepthfactor0.7, no perspectiveconvergence. Upperleft softneutralwarmlight. Templategeometricguides excludedfromoutput. Candidate A: warmcream glaze finehighlight, rounded handle, natural cocoasurface. Subtlebrushedshading.
```

## Candidate B

References, in order:
- art/source/prop_mug_zila/v001/candidate-a.png
- art-bible/perspective/prop_mug_zila_template.png
- art/approved/prop_bed_zila/prop_bed_zila_v001.png
- art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png
- art-bible/perspective/projection_cube.png

```text
Revise creamcocoa mug FIRST image: keep SAME handillustrated warmcream ceramic finish, subtlepaintedtexture, handleRIGHT, cocoa. But view distinctly MORE FROM ABOVE: RIM ellipse height exactly70percent ofwidth, not40percent. Need broad oval cocoa surface and shorter visiblefront. Topdiameter8.5cm, bodyheight10cm. Final48x56 canvas bodywidth17px,rimellipse12high, rimcentre18, bottomfront44, basecentre24,38. Transparent single isolated 2D cozygameprop, nofloor, no glow/shadow, no steam. Match approvedbed/nightstand same artist upperleftwarmkey,coloredlines. Respect projectioncube. Candidate B.
```

## Export

```sh
node scripts/fit-to-spec.mjs art/source/prop_mug_zila/v001/candidate-b.png prop_mug_zila art/submissions/prop_mug_zila/v001/prop_mug_zila_v001.png --width 26
```
