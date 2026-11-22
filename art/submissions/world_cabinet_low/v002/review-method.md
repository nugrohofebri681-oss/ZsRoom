# Reproduction evidence

Run the following browser-only script in an isolated P5 checkout with the masters available. Paths and ports refer to this capture workspace; adapt them to your checkout. It changes only canvas pixels in browser memory.

```js
import {chromium} from '/workspace/ZsRoom-art-batch-e/node_modules/@playwright/test/index.mjs';import fs from 'node:fs';
const entries=[['world_bench','bench-v2','v002'],['world_cabinet_low','cabinet-v2','v002'],['env_ground_yard','batch-f','v001'],['env_ground_path','batch-f','v001']];const all=Object.fromEntries(entries.map(([id,r,v])=>[id,{dir:`/workspace/ZsRoom-art-${r}/art/submissions/${id}/${v}`,data:'data:image/png;base64,'+fs.readFileSync(`/workspace/ZsRoom-art-${r}/art/submissions/${id}/${v}/${id}_${v}.png`).toString('base64')}]));
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const results=[];
for(const [label,width,height,mobile]of [['desktop',1440,1000,false],['android-landscape',800,360,true],['android-portrait',360,800,true]])for(const room of ['front_yard','living_room']){
const ctx=await b.newContext({viewport:{width,height},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4200/?fresh&room='+room);await p.waitForFunction(()=>window.__ZS?.state());
async function inject(id,target=id){return p.evaluate(async({id,target,data})=>{let keys=window.__ZS_GAME.textures.getTextureKeys().filter(k=>k.startsWith('temp:'+target+'@'));const im=new Image();im.src=data;await im.decode();for(const k of keys){const t=window.__ZS_GAME.textures.get(k),c=t.getContext();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,t.width,t.height);c.drawImage(im,0,0,t.width,t.height);t.refresh();}return keys;},{id,target,data:all[id].data})}
const id=room==='front_yard'?'world_bench':'world_cabinet_low';const keys=await inject(id);if(!keys.length)throw Error('missing '+id);if(room==='front_yard')await inject('env_ground_yard');await p.evaluate(()=>window.__ZS.setVars({phase:'afternoon'}));await p.waitForTimeout(400);await p.screenshot({path:all[id].dir+'/p5-'+label+'.png'});results.push({id,label,errors,keys,state:await p.evaluate(()=>window.__ZS.state())});
if(room==='front_yard'){await p.screenshot({path:all.env_ground_yard.dir+'/p5-'+label+'.png'});results.push({id:'env_ground_yard',label,errors,state:await p.evaluate(()=>window.__ZS.state())});await inject('env_ground_path','env_ground_yard');await p.waitForTimeout(300);await p.screenshot({path:all.env_ground_path.dir+'/p5-material-proxy-'+label+'.png'});results.push({id:'env_ground_path',label,note:'Material-only browser substitution in yard, not proposed P6 path layout or transition test',errors,state:await p.evaluate(()=>window.__ZS.state())});}
await ctx.close();}await b.close();for(const [id,e]of Object.entries(all))fs.writeFileSync(e.dir+'/browser-evidence.json',JSON.stringify(results.filter(r=>r.id===id),null,2));console.log('12 captures;0engine edits');

```
