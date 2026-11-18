# prop_nightstand_zila v001 — generation record

Built-in image_gen.imagegen, model identifier not exposed. Three calls with transparent_background=true. All three calls conditioned on the actual approved bed and both official geometry PNGs. No paid API or service used. Raw outputs are preserved byte-identically.

References:
- art/approved/prop_bed_zila/prop_bed_zila_v001.png
- art-bible/perspective/prop_nightstand_zila_template.png
- art-bible/perspective/projection_cube.png

## Candidate A

```text
Create ONE isolated original nightstand, premium HD hand-painted 2D game illustration on native transparent background. First attached image is the APPROVED BED: match exactly its artist, warm walnut hue, soft painted grain, satin edge sheen, colored contour softness. Do NOT draw the bed. Other images are geometry guides ONLY, never draw their labels or diagram colors.
Nightstand 45cm wide,40cm deep,55cm high. Orthographic oblique south looking north: TOP and square-on FRONT only, ZERO left/right side faces, parallel edges and verticals, no convergence. Geometry is crucial: silhouette width about98 units and height166 units; top surface depth56 units, front height110 units. Top horizontal back edge at y34, front edge at y90, feet at y200 on a conceptual160x224 canvas, x35..125 body, top rim at most x31..129. Thus narrow TALL silhouette, NOT a squat square cabinet. Reproduce these ratios at high resolution portrait.
One drawer with small round wood knob, OPEN shelf below, four short sturdy legs like bed, rear legs can be occluded. Walnut #8A5A3C shadows #5B3A29, cream highlights, no black. Soft rounded corners. One SMALL folded cream cloth doily on the top, all within it, most top wood visible. No other props: no lamp, clock, phone, books, plant. Soft upper-left daylight, top plane brightest, front midtone, shelf interior darker. Painted self shading only, no floor cast shadow, no halo, no backdrop or vignette. Same soft material finish as approved bed, slightly clearer dark-walnut contours without heavy outlines. Not photorealism, not 3D render, not pixel art. Clean alpha around and beneath legs.
Candidate A: plain walnut drawer, rounded wooden knob, restrained smooth top rim and a small cream folded rectangular cloth near back-left. Hand-painted warm cozy book illustration.
```

## Candidate B

```text
Create ONE isolated original nightstand, premium HD hand-painted 2D game illustration on native transparent background. First attached image is the APPROVED BED: match exactly its artist, warm walnut hue, soft painted grain, satin edge sheen, colored contour softness. Do NOT draw the bed. Other images are geometry guides ONLY, never draw their labels or diagram colors.
Nightstand 45cm wide,40cm deep,55cm high. Orthographic oblique south looking north: TOP and square-on FRONT only, ZERO left/right side faces, parallel edges and verticals, no convergence. Geometry is crucial: silhouette width about98 units and height166 units; top surface depth56 units, front height110 units. Top horizontal back edge at y34, front edge at y90, feet at y200 on a conceptual160x224 canvas, x35..125 body, top rim at most x31..129. Thus narrow TALL silhouette, NOT a squat square cabinet. Reproduce these ratios at high resolution portrait.
One drawer with small round wood knob, OPEN shelf below, four short sturdy legs like bed, rear legs can be occluded. Walnut #8A5A3C shadows #5B3A29, cream highlights, no black. Soft rounded corners. One SMALL folded cream cloth doily on the top, all within it, most top wood visible. No other props: no lamp, clock, phone, books, plant. Soft upper-left daylight, top plane brightest, front midtone, shelf interior darker. Painted self shading only, no floor cast shadow, no halo, no backdrop or vignette. Same soft material finish as approved bed, slightly clearer dark-walnut contours without heavy outlines. Not photorealism, not 3D render, not pixel art. Clean alpha around and beneath legs.
Candidate B: very subtle narrow blush-pink inset panel within walnut drawer border, small round warm brass knob, small folded cream doily back-left. IMPORTANT exact shape: overall object WIDTH:HEIGHT = 98:166; top plane WIDTH:DEPTH = 98:56, front face height110. TOP SURFACE is a rectangular shape with straight parallel vertical left and right edges, NOT a trapezoid. No narrower rear edge. Increase visible top depth, not a shallow top sliver. Compact modest knob and thin tabletop lip.
```

## Candidate C

```text
Create ONE isolated original nightstand, premium HD hand-painted 2D game illustration on native transparent background. First attached image is the APPROVED BED: match exactly its artist, warm walnut hue, soft painted grain, satin edge sheen, colored contour softness. Do NOT draw the bed. Other images are geometry guides ONLY, never draw their labels or diagram colors.
Nightstand 45cm wide,40cm deep,55cm high. Orthographic oblique south looking north: TOP and square-on FRONT only, ZERO left/right side faces, parallel edges and verticals, no convergence. Geometry is crucial: silhouette width about98 units and height166 units; top surface depth56 units, front height110 units. Top horizontal back edge at y34, front edge at y90, feet at y200 on a conceptual160x224 canvas, x35..125 body, top rim at most x31..129. Thus narrow TALL silhouette, NOT a squat square cabinet. Reproduce these ratios at high resolution portrait.
One drawer with small round wood knob, OPEN shelf below, four short sturdy legs like bed, rear legs can be occluded. Walnut #8A5A3C shadows #5B3A29, cream highlights, no black. Soft rounded corners. One SMALL folded cream cloth doily on the top, all within it, most top wood visible. No other props: no lamp, clock, phone, books, plant. Soft upper-left daylight, top plane brightest, front midtone, shelf interior darker. Painted self shading only, no floor cast shadow, no halo, no backdrop or vignette. Same soft material finish as approved bed, slightly clearer dark-walnut contours without heavy outlines. Not photorealism, not 3D render, not pixel art. Clean alpha around and beneath legs.
Candidate C: plain walnut drawer with ONLY a very thin blush trim around its inset, small wooden knob, small folded cream cloth back-left. Match the approved bed soft wood and subdued sheen. PRIORITIZE THE TEMPLATE OVER CONVENTIONAL PERSPECTIVE: top plane is a deep rectangle, NOT trapezoid. Its left and right boundaries remain vertical in screen coordinates with same width at back and front. Overall width98 to height166. Top plane56 tall, front face110 tall. Hence top plane occupies ONE THIRD of full object height, front two thirds. Please do not make top shallow. No outward taper. Small rim, modest knob, open shelf. No side faces.
```

Selected C. Official fit-to-spec.mjs only: snap alpha >=250 to255, native-alpha trim, proportional Lanczos3 downsample, pivot placement, sRGB. No keying, repainting or nonuniform scaling. Output content98x169 at31,32 on160x224.
