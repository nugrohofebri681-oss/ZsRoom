/* Shared walking assets and click navigation for Zila's World. */
const Motion=(()=>{
 const cache={},dist=new WeakMap();let meta={};
 const ready=fetch('motion.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(v=>meta=v).catch(()=>{});
 function advance(a,old){const d=Math.hypot(a.x-old.x,a.y-old.y);a.moving=d>.015;let n=dist.get(a)||0;if(d<50&&a.moving)n+=d;dist.set(a,n)}
 function draw(ctx,a,id,person,h){const m=meta[id];if(!m||!a.moving)return false;const phase=Math.floor((dist.get(a)||0)/10)%4;if(phase%2)return false;const n=person==='f'?2:0,index=(n+Math.floor(phase/2))*4+['down','left','up','right'].indexOf(a.dir||'down'),r=m.rects[index];if(!r)return false;let im=cache[id];if(!im){im=new Image;im.src=m.src;cache[id]=im}if(!im.complete||!im.naturalWidth)return false;const w=r[2]/r[3]*h;ctx.save();ctx.fillStyle='#22182730';ctx.beginPath();ctx.ellipse(a.x,a.y,19,4,0,0,7);ctx.fill();ctx.imageSmoothingEnabled=true;ctx.drawImage(im,...r,a.x-w/2,a.y-h+7,w,h);ctx.restore();return true}
 function path(sx,sy,tx,ty,block,size=18){const key=(x,y)=>x+','+y,start=[Math.round(sx/size),Math.round(sy/size)],q=[start],prev=new Map([[key(...start),null]]);let best=start,bestD=Infinity;
 for(let i=0;i<q.length&&i<13000;i++){const n=q[i],d=Math.hypot(n[0]*size-tx,n[1]*size-ty);if(d<bestD){bestD=d;best=n}if(d<size*.75)break;for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const m=[n[0]+dx,n[1]+dy],k=key(...m);if(prev.has(k)||block(m[0]*size,m[1]*size))continue;prev.set(k,n);q.push(m)}}
 const route=[];for(let n=best;n&&key(...n)!==key(...start);n=prev.get(key(...n)))route.unshift({x:n[0]*size,y:n[1]*size});return route}
 return {advance,draw,path,ready};
})();
