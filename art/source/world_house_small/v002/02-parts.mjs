import fs from 'node:fs';import sharp from '/workspace/ZsRoom-art-batch-e/node_modules/sharp/dist/index.mjs';
process.chdir('/workspace/ZsRoom-art-g12-precision');
const crop=async(b,x,y,w,h)=>sharp(b).extract({left:x,top:y,width:w,height:h}).png().toBuffer();
const blank=async(w,h)=>sharp({create:{width:w,height:h,channels:4,background:'#00000000'}}).png().toBuffer();
const v1=id=>`art/submissions/${id}/v001/${id}_v001.png`,v2=id=>`art/submissions/${id}/v002/${id}_v002.png`,raw=id=>`art/source/${id}/v001/raw.png`;
let id,parts=[],ledger=[];
async function add(name,b,x,y,provenance){const p=`art/source/${id}/v002/parts/${name}.png`;fs.mkdirSync(`art/source/${id}/v002/parts`,{recursive:true});fs.writeFileSync(p,b);parts.push({input:b,left:x,top:y});const m=await sharp(b).metadata();ledger.push({name,path:p,x,y,w:m.width,h:m.height,provenance});}
async function cover(b,w,h,gravity='centre'){const m=await sharp(b).metadata(),s=Math.max(w/m.width,h/m.height);if(s>1)throw Error('Upscaling forbidden');return sharp(b).resize({width:Math.ceil(m.width*s),height:Math.ceil(m.height*s),fit:'inside'}).resize({width:w,height:h,fit:'cover',position:gravity,withoutEnlargement:true}).png().toBuffer();}
async function tile(b,w,h){const m=await sharp(b).metadata(),items=[];for(let y=0;y<h;y+=m.height)for(let x=0;x<w;x+=m.width)items.push({input:await crop(b,0,0,Math.min(m.width,w-x),Math.min(m.height,h-y)),left:x,top:y});return sharp(await blank(w,h)).composite(items).png().toBuffer();}
async function finish(base){fs.writeFileSync(v2(id),await sharp(base).composite(parts).png().toBuffer());fs.writeFileSync(`art/source/${id}/v002/parts-layout.json`,JSON.stringify({method:'Native source crop, uniform downsampling, translation and original-material infill only; no nonuniform scaling.',parts:ledger},null,2));parts=[];ledger=[];}
// Small: re-register clear leaf at90x210cm, preserving original single-door artwork.
id='world_house_small';
await add('old-frame-top-repair',await tile(await crop(v2(id),300,70,24,16),224,26),326,110,'Original blank plaster patch; covers former frame header only.');
await add('door-leaf',await cover(await crop(raw(id),634,193,300,716),180,420),346,144,'Original single-door leaf uniformly downsampled and cropped to clear90x210cm.');
await add('door-jamb-left',await cover(await crop(raw(id),600,193,33,716),20,420),326,144,'Original frame left strip.');
await add('door-jamb-right',await cover(await crop(raw(id),934,193,32,716),20,420),526,144,'Original frame right strip.');
await add('door-header',await cover(await crop(raw(id),600,159,366,33),220,20),326,124,'Original walnut header.');
await finish(v2(id));
// Large: clear100x210 door, recessed porch back wall, generated matching floor, independent source posts.
id='world_house_large';
const plaster=await crop(raw(id),810,280,165,280);
await add('old-door-top-repair',await tile(await cover(plaster,90,150),220,50),340,130,'Original plaster around old doorway.');
await add('door-leaf',await cover(await crop(`art/source/${id}/v002/door-raw.png`,25,15,810,1770),200,420),356,164,'New built-in imagegen leaf, uniform cover crop only; exact100x210 clear leaf.');
await add('door-jamb-left',await cover(await crop(raw(id),505,249,25,580),18,420),338,164,'Original frame left.');
await add('door-jamb-right',await cover(await crop(raw(id),760,249,25,580),18,420),556,164,'Original frame right.');
await add('door-header',await cover(await crop(raw(id),505,224,280,24),236,20),338,144,'Original header crop.');
await add('porch-wall',await tile(await cover(plaster,90,150),520,406),696,24,'Original plaster, full reconstructed recessed back wall, no procedural flat fill.');
// Original right window and stone plinth move to recessed wall; head200/sill90 on y=-110 plane.
await add('porch-window',await cover(await crop(raw(id),1240,284,320,312),200,220),896,30,'Original right window: centre dx190; height110; groundsetback110cm gives projected heady30.');
await add('porch-plinth',await tile(await crop(v1(id),780,484,180,80),520,88),696,342,'Original pale stone plinth reused on recessed wall.');
await add('porch-floor',await cover(await crop(`art/source/${id}/v002/porch-raw.png`,38,122,2100,470),520,154),696,430,'New imagegen painted cream floor;260x110cm projects520x154; no nonuniform resize.');
// Existing painted columns: translate and extend shaft using original material; width is not contracted.
for(const [name,x,srcx]of [['left',736,1008],['right',1196,1682]]){
 let b=await cover(await crop(raw(id),srcx,67,72,768),52,533);const top=await crop(b,0,0,52,150),band=await crop(b,0,150,52,27),bottom=await crop(b,0,150,52,383);b=await sharp(await blank(52,560)).composite([{input:top,left:0,top:0},{input:band,left:0,top:150},{input:bottom,left:0,top:177}]).png().toBuffer();await add('porch-post-'+name,b,x-26,24,'Original painted column with27px shaft infill; centre fixed by contract.');}
await finish(v2(id));
// Ruko: expand walls with native strips; replace opening with original empty interior and put folded shutters outside clear rectangle.
id='world_ruko';fs.mkdirSync(`art/submissions/${id}/v002`,{recursive:true});fs.mkdirSync(`art/source/${id}/v002`,{recursive:true});
const old=await crop(v1(id),46,24,781,960);const expanded=await sharp(await blank(840,960)).composite([{input:await crop(old,0,0,60,960),left:0,top:0},{input:await crop(old,45,0,29,960),left:60,top:0},{input:await crop(old,60,0,661,960),left:89,top:0},{input:await crop(old,707,0,30,960),left:750,top:0},{input:await crop(old,721,0,60,960),left:780,top:0}]).png().toBuffer();const base=await sharp(await blank(872,1008)).composite([{input:expanded,left:16,top:24}]).png().toBuffer();
await add('clear-shop-interior',await cover(await crop(raw(id),281,686,607,577),600,480,'south'),136,504,'Original dark shop interior; exact300x240cm rectangle, no folded shutter inside.');
await add('shop-left-folds',await cover(await crop(raw(id),177,688,102,578),84,480),52,504,'Original shutters moved OUTSIDE clear opening, never conceal collision.');
await add('shop-right-folds',await cover(await crop(raw(id),892,688,92,578),76,480),736,504,'Original shutters outside opening.');
await add('shop-header',await cover(await crop(raw(id),175,672,810,13),616,9),128,495,'Original opening lintel.');
await finish(base);
// Warkop: author exact three clear bays from original three interior paintings; columns remain separate editing parts.
id='world_warkop_open';const baseW=await blank(1232,608);
for(let i=0;i<3;i++){
 const bx=[90,641,1198][i],dest=32+i*400;
 await add(`bay-${i+1}`,await cover(await crop(raw(id),bx,252,490,525),368,460,'south'),dest,124,'Original bay interior, uniform cover crop. Clear184x230cm.');
 await add(`header-${i+1}`,await cover(await crop(raw(id),bx,101,490,150),368,100,'south'),dest,24,'Original cream signstrip and walnut lintel, reassembled above clear opening.');
}
for(let i=0;i<4;i++){
 const sx=[36,590,1144,1690][i];let col=await cover(await crop(raw(id),sx,98,43,681),35,560); // Crop the central material + retain edge strips: physical column32px.
 const c=await sharp(await blank(32,560)).composite([{input:await crop(col,0,0,4,560),left:0,top:0},{input:await crop(col,5,0,24,560),left:4,top:0},{input:await crop(col,31,0,4,560),left:28,top:0}]).png().toBuffer();
 await add(`post-${i+1}`,c,i*400,24,'Original walnut post at centre dx[-300,-100,100,300], width16cm. Outer posts touch canvas edges: frozen contract/padding conflict documented.');
}
await finish(baseW);
