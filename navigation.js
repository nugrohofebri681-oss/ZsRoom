(()=>{
 const nav={route:[],pending:null,map:null};
 const origNearest=nearest,origJ=jNearest,origS=sNearest,origMix=mixueNearest,origB=bNearest;let forced=null;bNearest=function(){return forced||origB()};mixueNearest=function(){return forced||origMix()};
 nearest=function(){return forced||origNearest()};jNearest=function(){return forced||origJ()};sNearest=function(){return forced||origS()};
 function busy(){return !!dialog||vBusy()||P.pose!=='stand'||together.sitting}
 function objects(){if(currentMap==='bromo')return bStops.map(o=>({...o,cx:o.x,cy:o.y}));let a=currentMap==='jogja'?jObjects:currentMap==='sabang'?sObjects:currentMap==='dimsum'?dsObjects:currentMap==='mixue'?mixueInteractables:interactables;return a.map(o=>({...o,cx:o.x+o.w/2,cy:o.y+o.h/2}))}
 function cancel(){nav.route=[];nav.pending=null}
 C.addEventListener('pointerdown',e=>{
 if(e.button&&e.button!==0||busy())return;let r=C.getBoundingClientRect(),scale=Math.min(r.width/W,r.height/H),x=(e.clientX-r.left-(r.width-W*scale)/2)/scale,y=(e.clientY-r.top-(r.height-H*scale)/2)/scale;if(x<0||y<0||x>W||y>H)return;
 e.preventDefault();const o=objects().find(o=>o.w?x>=o.x-10&&x<=o.x+o.w+10&&y>=o.y-15&&y<=o.y+o.h+15:Math.abs(x-o.cx)<65&&Math.abs(y-(o.cy-90))<45);
 nav.map=currentMap;nav.pending=o||null;
 if(o){let candidates=[];for(let ang=0;ang<Math.PI*2;ang+=Math.PI/8)for(let rad of [60,85,110,Math.max(o.w||0,o.h||0)/2+50]){let xx=o.cx+Math.cos(ang)*rad,yy=o.cy+Math.sin(ang)*rad;if(!blocked(xx,yy))candidates.push({x:xx,y:yy})}candidates.sort((a,b)=>Math.hypot(P.x-a.x,P.y-a.y)-Math.hypot(P.x-b.x,P.y-b.y));nav.route=[];for(let p of candidates){let route=Motion.path(P.x,P.y,p.x,p.y,blocked);if(route.length){nav.route=route;break}}}else nav.route=Motion.path(P.x,P.y,x,y,blocked);
 if(currentMap==='bromo'){B.route=[];B.target=null}
 },{passive:false});
 const before=update;update=function(dt){let old={x:P.x,y:P.y},f=currentMap==='bromo'?B.f:currentMap==='jogja'?F:currentMap==='sabang'?SF:null,fo=f?{x:f.x,y:f.y}:null;
 if(nav.route.length&&(busy()||nav.map!==currentMap||['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowRight','ArrowDown'].some(k=>keys[k])))cancel();
 if(nav.route.length&&!busy()){const n=nav.route[0],d=Math.hypot(n.x-P.x,n.y-P.y),step=(P.speed||230)*Math.min(dt,.04);if(d<step+1){P.x=n.x;P.y=n.y;nav.route.shift()}else{let dx=(n.x-P.x)/d,dy=(n.y-P.y)/d;P.dir=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';P.x+=dx*step;P.y+=dy*step}if(currentMap==='jogja')jFollow(dt);if(currentMap==='sabang')sFollow(dt);if(currentMap==='bromo'){B.trail.push({x:P.x,y:P.y});bFollow(dt)}
 if(!nav.route.length&&nav.pending){const o=nav.pending;nav.pending=null;if(Math.hypot(P.x-o.cx,P.y-o.cy)<Math.max(160,Math.max(o.w||0,o.h||0)/2+100)){const dx=o.cx-P.x,dy=o.cy-P.y;P.dir=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';forced=o;try{interact()}finally{forced=null}}}
 }else before(dt);Motion.advance(P,old);if(f)Motion.advance(f,fo)};
 const oldDraw=drawPlayer;drawPlayer=function(){let id=currentMap==='room'&&L.ready&&!['original','casual'].includes(L.outfit)?'room-'+L.outfit:null;if(P.pose==='stand'&&!(V.gesture&&performance.now()<V.gesture.until)&&id&&Motion.draw(X,P,id,'z',95))return;oldDraw()};
 const jOld=jDrawFebri;jDrawFebri=function(...args){if(Motion.draw(args[0]||X,F,'febri','z',95))return;jOld(...args)};
 const sOld=sDrawFebri;sDrawFebri=function(...args){if(Motion.draw(args[0]||X,SF,'febri','z',95))return;sOld(...args)};
 const bOld=bDrawActor;bDrawActor=function(person,a){if(Motion.draw(X,a,'bromo-'+bData.outfit,person,person==='z'?95:100))return;bOld(person,a)};
 addEventListener('blur',cancel);
})();
