# Generation provenance

Built-in image generation, transparent_background=true. No paid API. Maximum five conditioning images per call; approved bed/nightstand and asset/cube templates plus batch anchor. Window/tall plant generated first; their selected exports anchor the other batch members.

## Candidate A

Original tool output: `exec-14416c95-4cab-4d27-8279-4fc05dc1f835.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/decal_rug_zila_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/wall_window_bedroom/v001/wall_window_bedroom_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. Flat FLOOR RUG roundedrectangle, rosepink with lighter blushborder subtle tone-on-tone petal/hearts. Plush paintedtexture but NO raised cushion/no side thickness/no shadow. Fringe shortends left/right. Orthographic flat decal width520px,depth252px aspect2.06:1, totalcanvas560x288 centre280,144. Edges parallel horizontal/vertical, no trapezoid. Do not use isometricdiamond. Thin1cm textile flatonfloor. Candidate A: small scattered tone-on-tone petals, generous clean border.
```

## Candidate B

Original tool output: `exec-28153a4a-5206-4a86-93cb-583e212be7c0.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/decal_rug_zila_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/wall_window_bedroom/v001/wall_window_bedroom_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. Flat FLOOR RUG roundedrectangle, rosepink with lighter blushborder subtle tone-on-tone petal/hearts. Plush paintedtexture but NO raised cushion/no side thickness/no shadow. Fringe shortends left/right. Orthographic flat decal width520px,depth252px aspect2.06:1, totalcanvas560x288 centre280,144. Edges parallel horizontal/vertical, no trapezoid. Do not use isometricdiamond. Thin1cm textile flatonfloor. Candidate B: quiet tiny hearts, thin double border, flatter textile shading with no inset beveled impression.
```

## Candidate C

Original tool output: `exec-c44f5264-4121-4a01-9c49-1e6a4ca46e76.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/decal_rug_zila_template.png`
- `art-bible/perspective/projection_cube.png`
- `art/submissions/wall_window_bedroom/v001/wall_window_bedroom_v001.png`

Exact prompt:

```text
Original premium HD hand-illustrated 2D ZsRoom prop, same painter as approved bed/nightstand. Warm cream#F6EBDD blush#F4C7D3 rose#E8A0B4 walnut#8A5A3C. Soft neutral-warm upperleft daylight, colored contours, brushed satin materials. NOT 3D, pixel art or vector. Orthographic oblique: square front, visible top depth0.7, verticals vertical, no sidefaces/convergence. Transparent isolated single asset, no floor/wall/castshadow/background/glow. Template is geometryguide only; never paint its labels/lines. Flat FLOOR RUG roundedrectangle, rosepink with lighter blushborder subtle tone-on-tone petal/hearts. Plush paintedtexture but NO raised cushion/no side thickness/no shadow. Fringe shortends left/right. Orthographic flat decal width520px,depth252px aspect2.06:1, totalcanvas560x288 centre280,144. Edges parallel horizontal/vertical, no trapezoid. Do not use isometricdiamond. Thin1cm textile flatonfloor. Candidate C: sparse small tone-on-tone petals, single flat woven border, absolutely flat surface, no raised inset trim. Short neat fringe.
```

## Export

Official fitter attempted and fails TypeError reading spec.baseLine.y; spec intentionally has centre pivot.

One-off equivalent alpha normalization and trim; uniform Lanczos3 width520 resulting height236; composite at20,26 on560x288 transparent canvas, sRGB. No repainting, nonuniform scaling or official code/spec modifications.

Reproducible fallback (local tool, not an engine change):

```js
import {createRequire} from 'node:module'; const require=createRequire('/workspace/ZsRoom-art-batch-c/package.json'); const sharp=require('sharp');
const root='/workspace/ZsRoom-art-batch-c';
for(const c of ['a','b','c']){
const {data,info}=await sharp(`${root}/art/source/decal_rug_zila/v001/candidate-${c}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
for(let i=3;i<data.length;i+=4){if(data[i]>=250)data[i]=255;else if(data[i]<=8)data[i]=0;}
const trimmed=await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
const t=await sharp(trimmed).trim({background:{r:0,g:0,b:0,alpha:0},threshold:1}).toBuffer({resolveWithObject:true});
const w=520,h=Math.round(t.info.height*w/t.info.width),left=Math.round(280-w/2),top=Math.round(144-h/2);
const resized=await sharp(t.data).resize(w,h,{kernel:'lanczos3'}).png().toBuffer();
await sharp({create:{width:560,height:288,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:resized,left,top}]).png({compressionLevel:9}).withMetadata({icc:'srgb'}).toFile(`${root}/review-gallery/candidates/decal_rug_zila-${c}.png`);
console.log(c,{w,h,left,top});
}

```
