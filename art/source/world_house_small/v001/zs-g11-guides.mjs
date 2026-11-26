import fs from 'node:fs';
import sharp from '/workspace/ZsRoom-art-batch-e/node_modules/sharp/dist/index.mjs';
const root='/workspace/ZsRoom-art-g11-production';
const aa=JSON.parse(fs.readFileSync(root+'/src/data/archetypes.json')).archetypes;
for(const a of Object.values(aa).filter(a=>a.contract)){
const c=a.contract;
for(const layer of ['front','roof']) {
const l=c.layers[layer], [w,h]=l['canvasPx@1cm'].map(x=>x*3),[px,py]=l['pivotPx@1cm'].map(x=>x*3);
let shapes='';
const rect=(x,y,w,h,fill)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="#182d3a" stroke-width="3"/>`;
if(layer==='front'){
shapes+=rect(px-c.widthCm*1.5,py-c.eaveCm*3,c.widthCm*3,c.eaveCm*3,'#f6ebdd');
const e=c.entrance; shapes+=rect(px+(e.dx-e.clearWidthCm/2)*3,py-e.clearHeightCm*3,e.clearWidthCm*3,e.clearHeightCm*3,'#8a5a3c');
for(const o of c.openings){if(o.kind==='window')shapes+=rect(px+(o.dx-o.widthCm/2)*3,py-o.headCm*3,o.widthCm*3,(o.headCm-o.sillCm)*3,'#99c4ce');if(o.kind==='sign board')shapes+=rect(px-o.widthCm*1.5,py-o.topCm*3,o.widthCm*3,(o.topCm-o.bottomCm)*3,'#dbbd87');if(o.kind==='upper floor')shapes+=rect(px-c.widthCm*1.5+25,py-o.toCm*3+25,c.widthCm*3-50,(o.toCm-o.fromCm)*3-40,'#b9cacc');}
if(c.porch){const p=c.porch;shapes+=rect(px+p.dxFrom*3,py-231, (p.dxTo-p.dxFrom)*3,231,'#dbd1b2');for(const x of p.posts)shapes+=rect(px+x*3-12,py-c.eaveCm*3,24,c.eaveCm*3,'#af906c');}
if(c.entrance.kind==='open bay'){for(const dx of [-300,-100,100,300])shapes+=rect(px+dx*3-24,py-c.eaveCm*3,48,c.eaveCm*3,'#8a5a3c');}
} else {
const rw=(c.widthCm+40)*3,rh=(c.roof.projectedRiseCm+15)*3,top=py-c.roof.projectedRiseCm*3;
shapes+=rect(px-rw/2,top,rw,rh,'#ae7765');
const ridgeY=py-(c.depthCm*.35+c.ridgeCm-c.eaveCm)*3;
shapes+=`<path d="M${px-rw/2},${ridgeY}H${px+rw/2}" stroke="#273c4b" stroke-width="6"/>`;
shapes+=`<path d="M${px-rw/2},${py}H${px+rw/2}" stroke="#4c6056" stroke-width="6"/>`;
}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${shapes}</svg>`;
await sharp(Buffer.from(svg)).png().toFile('/tmp/'+l.assetId+'-guide.png');
}
}
