import fs from 'node:fs';import sharp from '/workspace/ZsRoom-art-batch-e/node_modules/sharp/dist/index.mjs';
const root='/workspace/ZsRoom-art-g12-precision';process.chdir(root);
const old=JSON.parse(fs.readFileSync('art/submissions/world_house_small/v001/review/measurements-all.json'));const logs={};
const png=async(b)=>sharp(b).png().toBuffer();
const crop=async(b,x,y,w,h)=>sharp(b).extract({left:x,top:y,width:w,height:h}).png().toBuffer();
const blank=async(w,h)=>sharp({create:{width:w,height:h,channels:4,background:'#00000000'}}).png().toBuffer();
async function stack(parts,w){let y=0,items=[];for(const b of parts){items.push({input:b,left:0,top:y});y+=(await sharp(b).metadata()).height;}return sharp(await blank(w,y)).composite(items).png().toBuffer();}
async function insert(b,y,n,sy,sh=n){const {width:w,height:h}=await sharp(b).metadata();let band=await crop(b,0,sy,w,sh);if(sh<n){const parts=[];for(let z=0;z<n;z+=sh)parts.push(await crop(band,0,0,w,Math.min(sh,n-z)));band=await stack(parts,w);}return stack([await crop(b,0,0,w,y),band,await crop(b,0,y,w,h-y)],w);}
async function remove(b,y,n){const {width:w,height:h}=await sharp(b).metadata();return stack([await crop(b,0,0,w,y),await crop(b,0,y+n,w,h-y-n)],w);}
const corrections={world_house_small:{at:32,add:46,sample:20,sampleH:12},world_house_small_roof:{at:150,add:17,sample:150},world_house_large_roof:{removeAt:40,remove:82,at:170,add:133,sample:60},world_ruko_roof:{at:190,add:26,sample:180},world_warkop_roof:{at:140,add:41,sample:140},world_ruko_awning:{at:12,add:16,sample:6},world_warkop_counter:{at:130,add:25,sample:130},world_warkop_bench:{at:40,add:20,sample:40},world_house_large:{at:45,add:27,sample:45},world_warkop_open:{at:160,add:55,sample:160}};
for(const r of old){if(!corrections[r.assetId])continue;const c=corrections[r.assetId],id=r.assetId,dir=`art/submissions/${id}/v002`,source=`art/source/${id}/v002`;fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(source,{recursive:true});
let b=await crop(`art/submissions/${id}/v001/${id}_v001.png`,...r.placement,...r.actualContent);if(c.remove)b=await remove(b,c.removeAt,c.remove);b=await insert(b,c.at,c.add,c.sample,c.sampleH);
const {width:w,height:h}=await sharp(b).metadata();const base=r.pivot[1]+(r.layer==='roof'?30:0),left=Math.round(r.pivot[0]-w/2),top=base-h;
await sharp(await blank(...r.canvas)).composite([{input:b,left,top}]).png().toFile(`${dir}/${id}_v002.png`);
logs[id]={operation:'Source-pixel re-composition: translate original sections and insert original painted material band. No nonuniform scaling, upscaling or procedural illustration.',source:`art/submissions/${id}/v001/${id}_v001.png`,sourceContent:r.actualContent,remove:c.remove?[c.removeAt,c.remove]:null,insert:{at:c.at,height:c.add,sampledAt:c.sample},resultContent:[w,h],placement:[left,top],canvas:r.canvas,pivot:r.pivot,remaining:'Opening/porch corrections and image review pending'};
fs.writeFileSync(`${source}/composition.json`,JSON.stringify(logs[id],null,2));}
fs.writeFileSync('/tmp/g12-composition-log.json',JSON.stringify(logs,null,2));
