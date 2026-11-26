import fs from 'node:fs';import {chromium} from '/workspace/ZsRoom-art-batch-e/node_modules/@playwright/test/index.mjs';
const root='/workspace/ZsRoom-art-g11-production',out=root+'/art/submissions/world_house_small/v001/review';fs.mkdirSync(out,{recursive:true});
const records=JSON.parse(fs.readFileSync('/tmp/zs-g11-measurements.json'));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const results=[];
for(const device of [{name:'desktop',width:1440,height:900},{name:'android-landscape',width:800,height:360},{name:'android-portrait',width:360,height:800}]){
 const context=await browser.newContext({viewport:{width:device.width,height:device.height},isMobile:device.name!=='desktop',hasTouch:device.name!=='desktop',deviceScaleFactor:1});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4213/?fresh&room=batuphat_west');await page.waitForFunction(()=>window.__ZS?.state?.());await page.waitForTimeout(500);
 const base=await page.evaluate(()=>window.__ZS.state());
 const inserted=await page.evaluate(async records=>{
 const s=window.__ZS_GAME.scene.getScenes(true).find(s=>s.room);window.__ZS.setVars({phase:'afternoon'});
 const manifest=s.registry.get('manifest'),dens=s.registry.get('assetDensities')??{};
 for(const r of records){const im=new Image();im.src=`/art/submissions/${r.assetId}/v001/${r.assetId}_v001.png`;await im.decode();s.textures.addImage('asset:'+r.assetId,im);manifest.assets[r.assetId]={status:'approved',fixtureOnly:true};dens[r.assetId]=2;}
 // Ephemeral in-memory test registration only, never written to repository manifest.
 s.registry.set('assetDensities',dens);
 for(const v of s.propViews.values())v.destroy();s.propViews.clear();for(const v of s.roofViews.values())v.destroy();s.roofViews.clear();for(const t of s.tagViews)t.destroy();s.tagViews=[];
 s.drawProps();s.drawBuildings();
 const targets=['world_house_small','world_house_large','world_ruko','world_warkop_open'].map(id=>{const p=s.room.props.find(p=>p.spec.id===id);const b=s.room.buildings.find(b=>b.key===p?.key);return {id,key:p?.key,x:p?.x,y:p?.y,building:b};});
 window.__g11Targets=targets;
 const banner=document.createElement('div');banner.textContent='G1.1 REVIEW FIXTURE — unapproved art / geometry defects retained';banner.style='position:fixed;top:0;left:0;z-index:99999;background:#61242c;color:white;font:12px sans-serif;padding:4px;pointer-events:none';document.body.append(banner);
 return targets;
 },records);
 for(const t of inserted.filter(t=>t.x!==undefined)){
 await page.evaluate(t=>{window.__ZS.teleport(t.x,t.y+100);const s=window.__ZS_GAME.scene.getScenes(true).find(s=>s.room);s.input$.modal=false;},t);await page.waitForTimeout(700);
 await page.screenshot({path:`${out}/${device.name}-${t.id}.png`});
 }
 // Same behind/front positions used by the official architecture E2E.
 const states={};for(const [label,x,y]of [['behind',500,2150],['front',500,2700]]){await page.evaluate(([x,y])=>window.__ZS.teleport(x,y),[x,y]);await page.waitForTimeout(700);states[label]=await page.evaluate(()=>{const s=window.__ZS_GAME.scene.getScenes(true).find(s=>s.room),key='bld:ruko_m1';return {state:window.__ZS.state(),facadeAlpha:s.propViews.get(key)?.alpha,roofAlpha:s.roofViews.get(key)?.alpha,frontDepth:s.propViews.get(key)?.depth,roofDepth:s.roofViews.get(key)?.depth};});await page.screenshot({path:`${out}/${device.name}-ruko-${label}.png`});}
 results.push({device,errors,baselineRoofs:base.roofs,targets:inserted,checks:{singleRoof:states.front.state.roofs.art+states.front.state.roofs.engine===states.front.state.roofs.buildings,behindFades:states.behind.state.occluded.includes('bld:ruko_m1'),frontDoesNotFade:!states.front.state.occluded.includes('bld:ruko_m1'),alphaCoupled:states.behind.facadeAlpha===states.behind.roofAlpha},states});await context.close();
}
fs.writeFileSync(out+'/browser-fixture.json',JSON.stringify(results,null,2));console.log(results.map(r=>({device:r.device.name,errors:r.errors,checks:r.checks})));await browser.close();
