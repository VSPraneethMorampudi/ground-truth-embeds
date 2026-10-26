/* The surveyor's cursor.
   - a fine crosshair, not a circle; it leaves a fading GPS breadcrumb track as it moves
   - on anything you can press, four corner brackets lock onto the element (the Raipur lock-on, at hand scale)
   - on draggable cards the lock carries a "Drag" tag; while dragging, the track becomes a dashed route
   - over the 3D map it reads out the district and real coordinates under the pointer; a click drops a ping
   Desktop pointers only; off for reduced motion. */
(()=>{
const FINE=matchMedia("(pointer:fine)").matches,REDUCE=matchMedia("(prefers-reduced-motion:reduce)").matches;
if(!FINE||REDUCE)return;
const lang=()=>document.documentElement.dataset.lang||"en";
const T={drag:{en:"Drag",hi:"खींचें"},play:{en:"Play",hi:"खेलें"},open:{en:"Open",hi:"खोलें"},rotate:{en:"Drag to rotate",hi:"घुमाने के लिए खींचें"}};
const el=document.createElement("div");el.id="sv";el.setAttribute("aria-hidden","true");
el.innerHTML=`<canvas class="sv-trail"></canvas><div class="sv-x"><i></i><i></i><i></i><i></i><b></b></div>
  <div class="sv-lock"><i></i><i></i><i></i><i></i><em class="sv-tag"></em></div><div class="sv-read"></div>`;
document.body.appendChild(el);document.documentElement.classList.add("sv-on");
const x=el.querySelector(".sv-x"),lock=el.querySelector(".sv-lock"),tag=el.querySelector(".sv-tag"),read=el.querySelector(".sv-read"),cv=el.querySelector(".sv-trail"),ctx=cv.getContext("2d");
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
let W,H,DPR=Math.min(2,devicePixelRatio||1);const rs=()=>{W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR};addEventListener("resize",rs);rs();

const P={x:-100,y:-100},S={x:-100,y:-100};let target=null,down=false,dragging=false,pts=[],pings=[],last=null,visible=false,overDark=false;
const box={x:0,y:0,w:24,h:24};const bs={...box};
const LOCK="a,button,[data-magnet],label,.bin,.file,.sheet,.rec,.pinc,.upd,.swatches button,input[type=checkbox],select,summary";
const DRAG=".rec,.pinc";

addEventListener("pointermove",e=>{P.x=e.clientX;P.y=e.clientY;if(!visible){visible=true;S.x=P.x;S.y=P.y;el.classList.add("sv-show")}
  if(!last||Math.hypot(P.x-last.x,P.y-last.y)>14){last={x:P.x,y:P.y,t:performance.now(),d:dragging};pts.push(last);if(pts.length>40)pts.shift()}
  probe(e)},{passive:true});
document.addEventListener("pointerleave",()=>{visible=false;el.classList.remove("sv-show")});
addEventListener("pointerdown",e=>{down=true;el.classList.add("sv-down");if(e.target.closest(DRAG))dragging=true;
  if(e.target.closest("#game.playing canvas"))pings.push({x:P.x,y:P.y,t:performance.now()})},{passive:true});
addEventListener("pointerup",()=>{down=false;dragging=false;el.classList.remove("sv-down")},{passive:true});

function probe(e){const t=e.target;
  /* inside a live 3D map: crosshair with a readout of the place under the pointer */
  const canvas=t.closest&&t.closest("#game.playing canvas");
  if(canvas&&window.GTGame&&!dragging){target=null;el.classList.add("sv-map");el.classList.remove("sv-lockon","sv-drag");
    const h=window.GTGame.world.pick(P.x,P.y);
    if(h){const [lo,la]=h.lonlat,n=h.rec.name;read.innerHTML=`<b>${n}</b><span>${la.toFixed(2)}° N · ${lo.toFixed(2)}° E</span>`;read.classList.add("on")}
    else{read.innerHTML=`<span>${T.rotate[lang()]}</span>`;read.classList.add("on")}
    return}
  el.classList.remove("sv-map");read.classList.remove("on");
  /* a file card in the pipeline's 3D: lock onto its projected outline */
  if(t.closest&&t.closest("#pl3d")&&window.GTPipe&&window.GTPipe.hoverRect&&!dragging){target={fake:true,getBoundingClientRect:()=>window.GTPipe.hoverRect||{left:P.x,top:P.y,width:0,height:0}};
    el.classList.add("sv-lockon");el.classList.remove("sv-drag");const ht=window.GTPipe.hoverTag;tag.textContent=ht?ht[lang()]:T.open[lang()];tag.classList.add("on");return}
  const hit=t.closest&&t.closest(LOCK);
  if(hit&&!hit.classList.contains("gone")&&!hit.disabled&&!dragging){target=hit;el.classList.add("sv-lockon");
    const isDrag=hit.matches(DRAG);el.classList.toggle("sv-drag",isDrag);
    tag.textContent=isDrag?T.drag[lang()]:hit.matches(".shield")?T.play[lang()]:(hit.target==="_blank"?T.open[lang()]+" ↗":"");tag.classList.toggle("on",!!tag.textContent)}
  else{target=null;el.classList.remove("sv-lockon","sv-drag");tag.classList.remove("on")}
  /* dark backgrounds: switch to light lines */
  overDark=!!(t.closest&&t.closest("#orbit,#outro,#pre,.g-say,.btn.ink,.g-exit,#ap"))&&!document.querySelector(".otitle.on")||!!(t.closest&&t.closest("#outro,.g-say,#ap"));
  el.classList.toggle("sv-dark",overDark)}

function loop(now){requestAnimationFrame(loop);if(!visible)return;
  S.x+=(P.x-S.x)*.35;S.y+=(P.y-S.y)*.35;
  x.style.transform=`translate(${P.x}px,${P.y}px)`;read.style.transform=`translate(${P.x+18}px,${P.y+18}px)`;
  if(target){const r=target.getBoundingClientRect(),pad=down?2:6;box.x=r.left-pad;box.y=r.top-pad;box.w=r.width+pad*2;box.h=r.height+pad*2;
    if(target.fake?!(window.GTPipe&&window.GTPipe.hoverRect):!document.contains(target)){target=null;el.classList.remove("sv-lockon","sv-drag");tag.classList.remove("on")}}
  else{const s=down?14:22;box.x=S.x-s/2;box.y=S.y-s/2;box.w=s;box.h=s}
  const k=target?.28:.4;bs.x+=(box.x-bs.x)*k;bs.y+=(box.y-bs.y)*k;bs.w+=(box.w-bs.w)*k;bs.h+=(box.h-bs.h)*k;
  lock.style.transform=`translate(${bs.x}px,${bs.y}px)`;lock.style.width=bs.w+"px";lock.style.height=bs.h+"px";
  /* trail + pings */
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,W,H);
  const col=overDark?"#ffffff":(css("--ink")||"#0d1b2e"),acc=css("--accent")||"#ff5a36";
  const life=dragging?1400:700;pts=pts.filter(p=>now-p.t<life);
  if(pts.length>1&&pts.some(p=>p.d)){ctx.setLineDash([5,6]);ctx.lineWidth=1.6;ctx.strokeStyle=acc;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.lineTo(P.x,P.y);ctx.stroke();ctx.setLineDash([])}
  ctx.fillStyle=col;pts.forEach(p=>{const a=1-(now-p.t)/life;ctx.globalAlpha=a*.55;ctx.beginPath();ctx.arc(p.x,p.y,1.4+a*1.2,0,7);ctx.fill()});ctx.globalAlpha=1;
  pings=pings.filter(p=>now-p.t<900);pings.forEach(p=>{const k=(now-p.t)/900;ctx.strokeStyle=acc;ctx.globalAlpha=1-k;ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,6+k*40,0,7);ctx.stroke();
    ctx.beginPath();ctx.arc(p.x,p.y,4,0,7);ctx.fillStyle=acc;ctx.fill();ctx.globalAlpha=1})}
requestAnimationFrame(loop);
})();
