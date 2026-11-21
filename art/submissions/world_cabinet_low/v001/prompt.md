Built-in OpenAI image_gen.imagegen; no paid API. Each candidate conditioned on approved bed v001 and nightstand v001. Tool model/version not exposed. Native transparency requested. Original outputs preserved.

## Candidate A

Generate ONE isolated original premium HD illustrated 2D low walnut cabinet asset for ZsRoom. Match attached approved bed and nightstand painted finish precisely, gentle upper-left neutral warm light, colored soft edges, warm walnut #8A5A3C and #5B3A29 shadows, subtle grain, satin wood, no plastic gloss. Modern cozy Indonesian home cabinet reusable in office/shop. Candidate A: two equal recessed rectangular walnut doors, each a small warm brass round knob; short sturdy rounded feet, softly rounded corners. Completely empty flat top, no props, no decor, no patterns, no lettering. Exact physical dimensions100cm width40cm depth50cm total height. Orthographic OBLIQUE camera from south elevated: square-on front, visible flat top drawn depth0.7, verticals vertical, all horizontals parallel; NO side faces, NO converging perspective. Target silhouette width200px, projected height156px: top plane56pxdeep, front face100pxtall. Top/front edge at56px below highest rear edge; feet156px below rear edge. Rich but restrained hand-illustrated quality, legible far-away silhouette, not 3D render, not pixel art, not generic cartoon. Transparent background with generous margins, no wall/floor, no cast shadow or disconnected shadow. Full uncut object.

## Candidate B

Generate ONE isolated original premium HD illustrated 2D low walnut cabinet asset for ZsRoom. Match attached approved bed and nightstand painted finish precisely, gentle upper-left neutral warm light, colored soft edges, warm walnut #8A5A3C and #5B3A29 shadows, subtle grain, satin wood, no plastic gloss. Modern cozy Indonesian home cabinet reusable in office/shop. Candidate A: two equal recessed rectangular walnut doors, each a small warm brass round knob; short sturdy rounded feet, softly rounded corners. Completely empty flat top, no props, no decor, no patterns, no lettering. Exact physical dimensions100cm width40cm depth50cm total height. Orthographic OBLIQUE camera from south elevated: square-on front, visible flat top drawn depth0.7, verticals vertical, all horizontals parallel; NO side faces, NO converging perspective. Target silhouette width200px, projected height156px: top plane56pxdeep, front face100pxtall. Top/front edge at56px below highest rear edge; feet156px below rear edge. Rich but restrained hand-illustrated quality, legible far-away silhouette, not 3D render, not pixel art, not generic cartoon. Transparent background with generous margins, no wall/floor, no cast shadow or disconnected shadow. Full uncut object.
Candidate B: change door design to completely plain rounded slab fronts without inset panel frames, two discreet vertical wooden pull handles near centre, short square feet. Much higher elevated camera, broad deep visible top rectangle: visible top depth must be more than half the vertical front face height. Front face physically100px and top plane56px at target, not a thin lid. Keep all cabinet edges parallel, back edge equal width to front edge, no side-face view. Subdued wood grain, calmer elegant utilitarian design, empty top.

## Candidate C

One premium HD hand-illustrated ZsRoom furniture sprite on transparent background: a LOW cabinet for shoes or general storage,100cm wide40cm deep50cm tall. Design candidate C has TWO open shelves on the LEFT half and a single plain wooden cupboard door on the RIGHT half with a tiny round brass knob. Shelves EMPTY, top EMPTY. Warm walnut wood, softly rounded corners, subtle satin wood grain, upper-left neutral daylight, colored contours and painterly shading exactly like attached approved ZsRoom references. Elevated SOUTH orthographic oblique view, front square-on, NO SIDE FACES, NO VANISHING POINTS, no foreshortening of front. Clearly visible DEEP top surface: drawn 56 units deep, front face100 units high, width200 units. Rear top edge and front top edge EQUAL length and perfectly parallel. Top plane is a rectangle, not narrowing trapezoid. Low compact proportions, short feet, furniture for mature cozy storybook game, not a realistic render, not pixel art, not simplistic cartoon. Fine wood details should remain restrained, big forms strongly readable at distant mobile gameplay. No floor, no ground, no background, no cast shadow or detached shadow, full object with transparent margins. Original painted asset only, no text.


## Reproduction and review assembly

Official fit: `node scripts/fit-to-spec.mjs art/source/world_cabinet_low/v001/candidate-b.png world_cabinet_low art/submissions/world_cabinet_low/v001/world_cabinet_low_v001.png --despeckle 40`. Requires proposed contract in isolated specs/props only; do not replace official specs.

### Browser context capture (local paths)
```javascript
import {chromium} from '/workspace/ZsRoom-art-batch-e/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const results=[];
for(const [id,room,root]of [['world_bench','front_yard','/workspace/ZsRoom-art-bench'],['world_cabinet_low','living_room','/workspace/ZsRoom-art-cabinet']]){
 const out=root+'/art/submissions/'+id+'/v001';const data='data:image/png;base64,'+fs.readFileSync(out+'/'+id+'_v001.png').toString('base64');
 for(const [label,width,height,mobile]of [['desktop',1440,1000,false],['android-landscape',800,360,true],['android-portrait',360,800,true]]){
 const ctx=await b.newContext({viewport:{width,height},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4198/?fresh&room='+room);await p.waitForFunction(()=>window.__ZS?.state());
 const keys=await p.evaluate(async({id,data})=>{const g=window.__ZS_GAME;const keys=g.textures.getTextureKeys().filter(k=>k.startsWith('temp:'+id+'@'));const im=new Image();im.src=data;await im.decode();for(const k of keys){const t=g.textures.get(k),c=t.getContext();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,t.width,t.height);c.drawImage(im,0,0,t.width,t.height);t.refresh();}window.__ZS.setVars({phase:'afternoon'});return keys;},{id,data});if(!keys.length)throw Error('No texture '+id);
 await p.waitForTimeout(600);await p.screenshot({path:out+'/p4-'+label+'-default.png'});results.push({id,label,mode:'default-wide',keys,errors,state:await p.evaluate(()=>window.__ZS.state())});
 if(label==='desktop'){await p.evaluate(id=>{if(id==='world_bench')window.__ZS.teleport(800,285);else {let o=window.__ZS.zoneOrigin('living_room');window.__ZS.teleport(o+570,530)}},id);await p.waitForTimeout(400);await p.screenshot({path:out+'/p4-desktop-near.png'});results.push({id,label,mode:'near-object-default-zoom',errors,state:await p.evaluate(()=>window.__ZS.state())});}await ctx.close();
 }
 fs.writeFileSync(out+'/p4-evidence.json',JSON.stringify(results.filter(r=>r.id===id),null,2));
}await b.close();console.log('8 P4 screenshots captured; browser-only unapproved texture replacement.');

```

### Comparison board assembly
```javascript
import {chromium} from '/workspace/ZsRoom-art-batch-e/node_modules/@playwright/test/index.mjs';import fs from 'node:fs';
const v='/workspace/ZsRoom-prop-validation',data=p=>'data:image/png;base64,'+fs.readFileSync(p).toString('base64');const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
for(const [id,root,w,h,chosen,issue]of [['world_bench','/workspace/ZsRoom-art-bench',316,264,'C','Seat height72px vs90: -20%; geometry review FAIL.'],['world_cabinet_low','/workspace/ZsRoom-art-cabinet',216,180,'B','Top plane28px vs56: -50%; geometry review FAIL.']]){
 const d=root+'/art/submissions/'+id+'/v001';let html=`<style>body{margin:0;padding:24px;font:18px system-ui;background:#f6ebdd;color:#3a2530}h1{font-size:28px;margin:0}.row{display:flex;gap:28px;align-items:end}.card{padding:14px;background:#ead4c0;border-radius:12px}.imgs{display:flex;gap:18px;align-items:end}small{display:block}img{display:block}.warning{background:#612f37;color:#fff8f0;padding:12px;margin:16px 0} .ref{background:#ead4c0;padding:16px}</style><h1>${id} v001 — original illustrated candidates</h1><p>Issue24 • P4 wide-camera review • candidate ${chosen} selected for comparison, NOT approved</p><div class=row>`;
 for(const c of 'abc')html+=`<div class=card><b>${c.toUpperCase()} — HD 2px/cm</b><img width=${w} height=${h} src="${data(v+'/review-gallery/candidates/'+id+'-'+c+'.png')}"><small>SD1px/cm / wide preview0.55×SD</small><div class=imgs><img width=${w/2} src="${data(v+'/review-gallery/candidates/'+id+'-'+c+'.png')}"><img width=${w*.275} src="${data(v+'/review-gallery/candidates/'+id+'-'+c+'.png')}"></div></div>`;
 html+=`</div><div class=warning>${issue} Export canvas/alpha checks pass only against PROPOSED contract. Official world spec not yet promoted.</div><b>Actual approved references + selected candidate at SD1px/cm (each native master halved)</b><div class="row ref">`;
 for(const [p,width]of [[v+'/art/approved/prop_bed_zila/prop_bed_zila_v001.png',192],[v+'/art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png',80],[d+'/'+id+'_v001.png',w/2]])html+=`<img width=${width} src="${data(p)}">`;
 html+='</div><p>Soft upper-left light; no cast shadow added. Transparent source shown on cream. Sizes are render scale examples, not a claim of P4 camera zoom.</p>';
 const p=await browser.newPage({viewport:{width:1280,height:1000},deviceScaleFactor:1});await p.setContent(html);await p.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));await p.screenshot({path:d+'/candidate-comparison.png',fullPage:true});await p.close();
}await browser.close();

```
