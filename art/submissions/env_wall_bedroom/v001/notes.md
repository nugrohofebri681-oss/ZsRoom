# env_wall_bedroom — Batch E R1

Pending Creative Director review.

![Master](env_wall_bedroom_v001.png)

A fine pinstripes; B selected plain matte paper with lowest pattern noise; C reintroduces thin vertical stripe rhythm.

## Candidate A

![Raw a](../../../source/env_wall_bedroom/v001/candidate-a.png)

## Candidate B

![Raw b](../../../source/env_wall_bedroom/v001/candidate-b.png)

## Candidate C

![Raw c](../../../source/env_wall_bedroom/v001/candidate-c.png)

## Export details

Band-aware Lanczos export to120x540. Original B source rows0,64,1478,1515,2073,2172 mapped to0,12,356,364,516,540. This adjusts generator proportions, not invented replacement art. Symmetric horizontal edge-colour correction fading across6px. Fully opaque RGBA.

## Actual validation and visual review

{
  "status": "TECHNICAL PASS",
  "checksPassed": 22,
  "checks": [
    {
      "name": "asset id format",
      "pass": true,
      "detail": "env_wall_bedroom"
    },
    {
      "name": "version format (v###)",
      "pass": true,
      "detail": "v001"
    },
    {
      "name": "spec exists",
      "pass": true,
      "detail": "specs/environments/env_wall_bedroom.json"
    },
    {
      "name": "master file present",
      "pass": true,
      "detail": "env_wall_bedroom_v001.png"
    },
    {
      "name": "metadata.json present",
      "pass": true,
      "detail": ""
    },
    {
      "name": "only png/webp/json/md files",
      "pass": true,
      "detail": ""
    },
    {
      "name": "metadata schema",
      "pass": true,
      "detail": ""
    },
    {
      "name": "metadata.assetId matches folder",
      "pass": true,
      "detail": "env_wall_bedroom"
    },
    {
      "name": "metadata.version matches folder",
      "pass": true,
      "detail": "v001"
    },
    {
      "name": "metadata.specVersion matches spec",
      "pass": true,
      "detail": "1.0.0 vs 1.0.0"
    },
    {
      "name": "createdAt is a date",
      "pass": true,
      "detail": ""
    },
    {
      "name": "master sha256 matches metadata",
      "pass": true,
      "detail": "e955060709eac4ba9fabf786d216aa9876dc0c3e9e946c60f490edbd4ba9031e"
    },
    {
      "name": "format PNG",
      "pass": true,
      "detail": "png"
    },
    {
      "name": "canvas size",
      "pass": true,
      "detail": "120x540, expected 120x540"
    },
    {
      "name": "RGBA (alpha channel)",
      "pass": true,
      "detail": "4 channels"
    },
    {
      "name": "8-bit depth",
      "pass": true,
      "detail": "uchar"
    },
    {
      "name": "sRGB colour space",
      "pass": true,
      "detail": "srgb"
    },
    {
      "name": "file size",
      "pass": true,
      "detail": "67966 bytes (max 600000)"
    },
    {
      "name": "transparent edge padding",
      "pass": true,
      "detail": "0 non-transparent px within 0px of the edge"
    },
    {
      "name": "opaque coverage \u2265 min",
      "pass": true,
      "detail": "1.000"
    },
    {
      "name": "opaque coverage \u2264 max (no baked background)",
      "pass": true,
      "detail": "1.000"
    },
    {
      "name": "seamless horizontally (left\u2194right edge)",
      "pass": true,
      "detail": "mean edge delta 0.0 (max 14)"
    }
  ],
  "pixelMetrics": {
    "alphaMin": 255,
    "alphaMax": 255,
    "edgeDeltaX": 0.0,
    "edgeDeltaY": 13.583333333333334
  },
  "officialGallery": "FAIL: build-gallery.mjs overlay accesses missing environment spec.pivot; not changed.",
  "alternativeGallery": "review-gallery/batch-e-review.html inspected; repeated tiles and native candidates.",
  "browser": {
    "screenshots": 9,
    "contexts": [
      "1440x1000 desktop DPR1",
      "360x800 Android portrait DPR2/touch",
      "800x360 Android landscape DPR2/touch"
    ],
    "zoomMultipliers": [
      0.75,
      1,
      1.6
    ],
    "pageErrors": 0,
    "method": "Browser-only TEMP canvas texture replacement via __ZS_GAME; no engine or manifest changes.",
    "hardware": "Emulation only, not physical Samsung A05 performance validation."
  },
  "visualApproval": "pending"
}

No obvious edge discontinuity in the inspected repeated patterns or bedroom screenshots. Floor grain recurrence remains visible on large uninterrupted areas; panel repetition is intentional. Android detail zoom crops the room as the existing camera dictates. FPS in these screenshots reflects cloud Chromium and is not A05 evidence.

Official gallery has an environment-pivot bug; temporary alternative gallery and nine actual bedroom captures are in ignored local review-gallery. No approved art changed, no new assets integrated.

## Reproduce actual bedroom preview

Use npm run dev -- --host 127.0.0.1 --port 4195, then this local Playwright script (adjust absolute workspace path):

```js
import {chromium} from '/workspace/ZsRoom-art-batch-e/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs';
const root='/workspace/ZsRoom-art-batch-e',out=root+'/review-gallery';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const results=[];
for(const device of [{name:'desktop',viewport:{width:1440,height:1000},deviceScaleFactor:1},{name:'android-portrait',viewport:{width:360,height:800},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 13; SM-A055F) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36'},{name:'android-landscape',viewport:{width:800,height:360},deviceScaleFactor:2,isMobile:true,hasTouch:true}]){
 const {name,...opts}=device,ctx=await browser.newContext(opts),p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4195/?fresh');await p.waitForFunction(()=>window.__ZS?.state());
 const inject=await p.evaluate(async()=>{const g=window.__ZS_GAME,keys=g.textures.getTextureKeys().filter(k=>k.startsWith('temp:env_'));for(const k of keys){const id=k.split(':')[1].split('@')[0],im=new Image();im.src='/art/submissions/'+id+'/v001/'+id+'_v001.png';await im.decode();const t=g.textures.get(k),c=t.getContext();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,t.width,t.height);c.drawImage(im,0,0,t.width,t.height);t.refresh();}return keys;});
 if(inject.length!==2)throw Error('missing tile injection');
 for(const [label,z]of [['wide',.75],['normal',1],['detail',1.6]]){await p.evaluate(z=>{window.__ZS.zoomBy(z-window.__ZS.state().zoomMul);window.__ZS.teleport(300,230)},z);await p.waitForTimeout(400);await p.screenshot({path:out+'/'+name+'-'+label+'.png'});results.push({device:name,zoom:label,injected:inject,errors,state:await p.evaluate(()=>window.__ZS.state())});}await ctx.close();
}
fs.writeFileSync(out+'/browser-evidence.json',JSON.stringify(results,null,2));await browser.close();console.log('9 actual bedroom screenshots; runtime canvas injection only, no source or manifest edits.');

```
