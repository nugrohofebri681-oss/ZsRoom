# Exact concept generation provenance

User-authorized exploratory concept task supersedes draft4.6-head lock; no final spec changed. Built-in imagegen only, transparent_background=false.

## Direction A

Original tool file: `exec-78472ec4-5239-4171-8179-4ab8667fbae5.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`

```text
Create an ORIGINAL premium HD hand-illustrated 2D character CONCEPT STUDY sheet for Zila, an adult young woman in a cozy Indonesian life-sim. Reference furniture is ONLY for painterly finish, warm palette, softness, not character shape. No generic anime, no pixel art, no 3D, no photorealism, no toddler/chibi anatomy. Identity locks: long layered warm brown hair reaching mid-back, bangs and face-framing strands; exactly TWO small pink hair ornaments one each side, warm-brown eyes with modest natural highlights, rounded soft face and gentle expression. Default soft pink TOP and cream/white BOTTOM, comfortable shoes, no bag. Opaque warm ivory sheet. Layout: left HALF a LARGE unobstructed full-body FRONT neutral standing figure from hair crown to soles, arms slightly apart hands visible, both feet level. Middle quarter full-body SIDE and BACK studies with clean easily-read silhouettes and consistent proportions. Right quarter three large face studies: neutral, smile, thoughtful. No furniture on sheet, no props, no extra characters. Minimal labels FRONT SIDE BACK NEUTRAL SMILE THOUGHTFUL; no invented numeric measurements or scale bars. Soft hand-painted finish, restrained contours and folds; readable simple garment construction suitable for future separate layers. All full-body views SAME HEIGHT and one identity; hair ornaments placed consistently. View from slightly above for gameplay compatibility, upright verticals. DIRECTION A: Tender Storybook. Target about4.6 head units, adult stylized proportions, softly rounded cheeks, subtly arched brows, medium-large brown eyes not anime. Softly scalloped side bangs and broad flowing hair layers, paired tiny rose flower clips. Pink short-sleeve blouse with modest rounded collar and small buttons, cream knee-length A-line skirt, simple cream flats. Organic rounded silhouette, calm and warm, no excessive lace. Fullbody front dominant.
```

## Direction B

Original tool file: `exec-5ac42627-6c39-4d74-b760-0bb0bccbeb23.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`

```text
Create an ORIGINAL premium HD hand-illustrated 2D character CONCEPT STUDY sheet for Zila, an adult young woman in a cozy Indonesian life-sim. Reference furniture is ONLY for painterly finish, warm palette, softness, not character shape. No generic anime, no pixel art, no 3D, no photorealism, no toddler/chibi anatomy. Identity locks: long layered warm brown hair reaching mid-back, bangs and face-framing strands; exactly TWO small pink hair ornaments one each side, warm-brown eyes with modest natural highlights, rounded soft face and gentle expression. Default soft pink TOP and cream/white BOTTOM, comfortable shoes, no bag. Opaque warm ivory sheet. Layout: left HALF a LARGE unobstructed full-body FRONT neutral standing figure from hair crown to soles, arms slightly apart hands visible, both feet level. Middle quarter full-body SIDE and BACK studies with clean easily-read silhouettes and consistent proportions. Right quarter three large face studies: neutral, smile, thoughtful. No furniture on sheet, no props, no extra characters. Minimal labels FRONT SIDE BACK NEUTRAL SMILE THOUGHTFUL; no invented numeric measurements or scale bars. Soft hand-painted finish, restrained contours and folds; readable simple garment construction suitable for future separate layers. All full-body views SAME HEIGHT and one identity; hair ornaments placed consistently. View from slightly above for gameplay compatibility, upright verticals. DIRECTION B: Everyday Illustrated. Carefully enforce FIVE HEADS TOTAL from crown to sole: head one fifth entire standingheight, NOT six or seven. Enlarged but mature soft round face, modest eyes, visible small nose, no anime lashes. Gentle eyebrow expressions. Hair brown with full straight fringe and two softly separated curved frontlocks, clean broad mid-back layers, two SMALL pink rounded bow clips. Pink simple short-sleeve knit top with cream rounded neckline, cream above-knee A-line skirt, cream slip-ons. Simpler garment silhouette and broad hair masses for layered animation, less ruffle, no necklace. Keep front side back all exactly same proportions and height.
```

## Direction C

Original tool file: `exec-590ed511-d2b5-4249-9505-b4a999bdd9e1.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`

```text
Create an ORIGINAL premium HD hand-illustrated 2D character CONCEPT STUDY sheet for Zila, an adult young woman in a cozy Indonesian life-sim. Reference furniture is ONLY for painterly finish, warm palette, softness, not character shape. No generic anime, no pixel art, no 3D, no photorealism, no toddler/chibi anatomy. Identity locks: long layered warm brown hair reaching mid-back, bangs and face-framing strands; exactly TWO small pink hair ornaments one each side, warm-brown eyes with modest natural highlights, rounded soft face and gentle expression. Default soft pink TOP and cream/white BOTTOM, comfortable shoes, no bag. Opaque warm ivory sheet. Layout: left HALF a LARGE unobstructed full-body FRONT neutral standing figure from hair crown to soles, arms slightly apart hands visible, both feet level. Middle quarter full-body SIDE and BACK studies with clean easily-read silhouettes and consistent proportions. Right quarter three large face studies: neutral, smile, thoughtful. No furniture on sheet, no props, no extra characters. Minimal labels FRONT SIDE BACK NEUTRAL SMILE THOUGHTFUL; no invented numeric measurements or scale bars. Soft hand-painted finish, restrained contours and folds; readable simple garment construction suitable for future separate layers. All full-body views SAME HEIGHT and one identity; hair ornaments placed consistently. View from slightly above for gameplay compatibility, upright verticals. DIRECTION C: Quiet Urban Storybook. About5.3 head units, adult rounded face, SMALLER relaxed warmbrown eyes, softly defined nose and warm gentle asymmetrical smile, minimal lashes. Brown layered mid-back hair with airy blunt bangs, broader soft waves at ends, two pink petal-shaped barrette ornaments. Comfortable pink short-sleeve button top with understated cream piping, CREAM ankle-length straight relaxed TROUSERS (not skirt), pink-and-cream simple flats. Slightly more grounded and practical silhouette but still painted stylized, not realistic. Clearly distinct from skirt concepts, quiet sophisticated softness, folds simplified.
```

## Reproduce comparison board

Local browser composition only; adjust absolute paths.

```js
import fs from 'node:fs';
import {chromium} from '/workspace/ZsRoom-art-batch-e/node_modules/@playwright/test/index.mjs';
const root='/workspace/ZsRoom-art-zila-concept',out=root+'/review-gallery';fs.mkdirSync(out,{recursive:true});
const uri=p=>'data:image/png;base64,'+fs.readFileSync(root+'/'+p).toString('base64');
const measures=[{c:'a',name:'A — Tender Storybook',crop:[12,41,350,1148],chin:214,ratio:6.40},{c:'b',name:'B — Everyday Illustrated',crop:[20,124,331,1150],chin:300,ratio:5.83},{c:'c',name:'C — Quiet Urban Storybook',crop:[30,97,351,1098],chin:252,ratio:6.46}];
function fig(m,height){const[x,y,x1,y1]=m.crop,s=height/(y1-y);return `<div style="width:${(x1-x)*s}px;height:${height}px;overflow:hidden;position:relative"><img src="${uri('art/concepts/char_zila/v001/sources/concept-'+m.c+'.png')}" style="position:absolute;max-width:none;width:${(m.c==='a'?1227:m.c==='b'?1221:1312)*s}px;left:${-x*s}px;top:${-y*s}px"></div>`;}
let h='<!doctype html><meta charset="utf-8"><style>body{font:18px Arial;background:#fcf4e9;color:#4c3731;margin:24px}h1{font-size:28px}h2{font-size:22px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}section{border:1px solid #d4beb0;padding:12px}img.sheet{width:100%}.pair{display:flex;align-items:end;gap:12px;height:600px;border-bottom:2px solid #b88b79}.small{display:flex;align-items:end;gap:16px;height:200px}p{line-height:1.4}</style><h1>Zila — concept exploration R1, NOT approved</h1><p>Illustrated identity and costume exploration only. Raw sheets are preserved; views below are display crops, not layered sprites.</p><div class="grid">';
for(const m of measures)h+=`<section><h2>${m.name}</h2><img class="sheet" src="${uri('art/concepts/char_zila/v001/sources/concept-'+m.c+'.png')}"><p>Measured crown-to-sole/head ratio ≈ ${m.ratio}. Target prompt was ${m.c==='a'?'4.6':m.c==='b'?'5.0':'5.3'} — NOT achieved.</p></section>`;
h+='</div><h2>Equal draft world height: 165 cm, 2 px/cm; approved furniture unchanged</h2><p>Front views aligned by soles. Bed is shown in the game projection, not a flat height ruler. No pose or contact integration tested.</p><div class="grid">';
for(const m of measures){const bed=JSON.parse(fs.readFileSync(root+'/specs/props/prop_bed_zila.json'));const stand=JSON.parse(fs.readFileSync(root+'/specs/props/prop_nightstand_zila.json'));h+=`<section><h2>${m.name}</h2><div class="pair">${fig(m,330)}<img src="${uri('art/approved/prop_bed_zila/prop_bed_zila_v001.png')}" style="width:${bed.canvas.width}px;height:${bed.canvas.height}px;margin-bottom:-${bed.canvas.height-bed.pivot.y}px"></div><div class="small">${fig(m,165)}<img src="${uri('art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png')}" style="width:${stand.canvas.width/2}px;height:${stand.canvas.height/2}px;margin-bottom:-${(stand.canvas.height-stand.pivot.y)/2}px"><span>SD: 165 px<br>1 px/cm</span></div></section>`;}
h+='</div><p>Recommendation: B as a refinement starting point only. Correct head/body ratio, frontal camera pitch, hair volume and view registration before layered masters. Febri is not playable; future companion/portrait compatibility retained, no movement sprites produced.</p>';
fs.writeFileSync(out+'/zila-concept-review.html',h);
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:1800,height:1000}});await p.setContent(h);await p.locator('img').evaluateAll(xs=>Promise.all(xs.map(x=>x.decode())));await p.screenshot({path:root+'/art/concepts/char_zila/v001/char_zila_v001.png',fullPage:true});await browser.close();fs.writeFileSync(out+'/measurements.json',JSON.stringify(measures,null,2));

```
