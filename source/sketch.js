/* ============================================================ SKETCH ENGINE
   Every section figure follows the overview's grammar: one drawing in the middle, handwritten
   notes around it with pen arrows. A figure is a short sequence of steps; each step moves the
   drawing, then writes its notes. Phones get the drawing on top and numbered notes below it,
   keyed to numbered markers on the drawing. */
const SPEC={};
function Sketch(id,spec){
  const V=$("#"+id),S=V.querySelector("svg.sk"),nav=V.querySelector(".sknav"),live=V.querySelector(".sklive");
  const N=spec.steps.length;
  let mode=null,api=null,cur=-1,run=0,cancels=[],auto=false,autoT=null,seed=7,uid=0,hinted=false;
  const R=()=>(seed=seed*16807%2147483647)/2147483647;
  const D=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);

  nav.innerHTML=`<button type="button" class="skb prev" aria-label="Previous step">←</button>`+
    `<ol>${spec.steps.map((s,i)=>`<li><button type="button" data-i="${i}"><b>${i+1}</b> ${s.nav}</button></li>`).join("")}</ol>`+
    `<span class="skcur" aria-hidden="true"></span><button type="button" class="skb next" aria-label="Next step">→</button>`;
  const btns=[...nav.querySelectorAll("ol button")],prev=nav.querySelector(".prev"),next=nav.querySelector(".next"),curL=nav.querySelector(".skcur");
  function updNav(){btns.forEach((b,i)=>{if(i===cur)b.setAttribute("aria-current","step");else b.removeAttribute("aria-current")});
    prev.disabled=cur<=0;const last=cur>=N-1;next.textContent=last?"↺":"→";next.setAttribute("aria-label",last?"Start again":"Next step");
    curL.innerHTML=cur<0?"":`<b>${cur+1}</b> of ${N} · ${spec.steps[cur].nav}`}
  const stop=()=>{auto=false;clearTimeout(autoT)};
  btns.forEach((b,i)=>b.onclick=()=>{stop();go(i)});
  prev.onclick=()=>{stop();if(cur>0)go(cur-1)};
  next.onclick=()=>{stop();go(cur>=N-1?0:cur+1)};
  S.addEventListener("click",()=>{stop();go(cur>=N-1?0:cur+1)});
  V.addEventListener("keydown",e=>{if(e.key==="ArrowRight"){stop();go(Math.min(N-1,cur+1))}else if(e.key==="ArrowLeft"){stop();go(Math.max(0,cur-1))}});
  // swipe on phones
  let sx=null;S.addEventListener("touchstart",e=>{sx=e.touches[0].clientX},{passive:true});
  S.addEventListener("touchend",e=>{if(sx===null)return;const dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>40){e.preventDefault();stop();go(dx<0?Math.min(N-1,cur+1):Math.max(0,cur-1))}});

  /* ---------- drawing helpers handed to each figure ---------- */
  function mkApi(){
    const land=mode==="land",W=spec.W,H=spec.H;
    let bw,bh,bx,by;
    if(land){const s=Math.min(560/W,672/H);bw=W*s;bh=H*s;bx=360+(560-bw)/2;by=24+(672-bh)/2}
    else{const s=Math.min(608/W,(spec.portH||600)/H);bw=W*s;bh=H*s;bx=(640-bw)/2;by=10}
    const sc=bw/W;
    S.innerHTML="";const defs=el("defs",{},S);
    defs.innerHTML=`<filter id="${id}-soft" x="-15%" y="-15%" width="130%" height="130%"><feGaussianBlur stdDeviation="7"/></filter>`;
    const ill=el("g",{transform:`translate(${bx} ${by}) scale(${sc})`},S);
    const notesG=el("g",{class:"skhand"},S);
    const A={S,defs,ill,notesG,W,H,land,sc,box:[bx,by,bw,bh],fast:false,st:{},R,D,
      P:p=>[bx+p[0]*sc,by+p[1]*sc],
      tw:(ms,fn)=>new Promise(r=>{cancels.push(tween(A.fast?0:ms,fn,r))}),
      wait:ms=>A.fast?Promise.resolve():new Promise(r=>setTimeout(r,REDUCE?0:ms)),
      // tween numeric attributes (or opacity) from where they are now
      to(e,attrs,ms=500){if(!e)return Promise.resolve();const f={};for(const k in attrs)f[k]=k==="opacity"?+(e.style.opacity===""?1:e.style.opacity):+(e.getAttribute(k)||0);
        return A.tw(ms,t=>{for(const k in attrs){const v=lerp(f[k],attrs[k],t);if(k==="opacity")e.style.opacity=v;else e.setAttribute(k,v)}})},
      op:(e,v,ms=450)=>Array.isArray(e)?Promise.all(e.map(x=>A.to(x,{opacity:v},ms))):A.to(e,{opacity:v},ms),
      // a pen line that draws itself
      draw:(e,v=1,ms=600)=>{e.setAttribute("pathLength",1);e.setAttribute("stroke-dasharray",1);if(!e.hasAttribute("stroke-dashoffset"))e.setAttribute("stroke-dashoffset",1);return A.to(e,{"stroke-dashoffset":1-v},ms)},
      hand:(g,x,y,s,o={})=>{const t=txt({x,y,class:"h"+(o.bold?" t":""),"font-size":o.size||24,"text-anchor":o.anchor||"start",...(o.fill?{style:"fill:"+o.fill}:{}),...(o.rot?{transform:`rotate(${o.rot} ${x} ${y})`}:{})},g,s);return t},
      wob(pts,close=true){let d="";pts.forEach((p,i)=>{d+=(i?"L":"M")+(p[0]+(R()-.5)*1.6).toFixed(1)+","+(p[1]+(R()-.5)*1.6).toFixed(1)});return d+(close?"Z":"")},
      rough(g,x,y,w,h,o={}){const n=[[x,y],[x+w*.5,y+(R()-.5)*1.5],[x+w,y],[x+w+(R()-.5)*1.5,y+h*.5],[x+w,y+h],[x+w*.5,y+h+(R()-.5)*1.5],[x,y+h],[x+(R()-.5)*1.5,y+h*.5]];
        return el("path",{d:A.wob(n),fill:o.fill||"#fff",stroke:o.stroke||"var(--n700)","stroke-width":o.sw||1.6,"stroke-linejoin":"round"},g)},
      ring(g,c,r,o={}){let d="";for(let i=0;i<=48;i++){const a=-2.3+i/48*(Math.PI*2+.75),rr=r*(1+.07*Math.sin(a*3+.6)+i*.0024);d+=(i?"L":"M")+(c[0]+Math.cos(a)*rr*(o.sx||1.2)).toFixed(1)+","+(c[1]+Math.sin(a)*rr).toFixed(1)}
        return el("path",{d,fill:"none",stroke:o.stroke||"var(--n900)","stroke-width":o.sw||2.1,"stroke-linecap":"round","stroke-linejoin":"round",pathLength:1,"stroke-dasharray":1,"stroke-dashoffset":1},g)},
      // the state, lying on the page with a soft shadow (map coordinates)
      state(g,o={}){const s=el("g",{},g);
        el("path",{d:G.state,fill:"rgba(60,50,40,.13)",transform:"translate(4 7)",filter:`url(#${id}-soft)`},s);
        el("path",{d:G.state,fill:o.fill||"#fbfaf8"},s);
        const dg=el("g",{fill:"none",stroke:o.dist||"#c9c2b8","stroke-width":1.1,"vector-effect":"non-scaling-stroke"},s);G.districts.forEach(d=>el("path",{d:d.d,"vector-effect":"non-scaling-stroke"},dg));
        el("path",{d:G.state,fill:"none",stroke:"#8f887e","stroke-width":1.6,"stroke-linejoin":"round","vector-effect":"non-scaling-stroke"},s);return s},
      // a camera onto world coordinates, drawn into the illustration box
      lens(parent,o={}){const w=o.w||W,h=o.h||H,ox=o.x||0,oy=o.y||0;const outer=el("g",{},parent);
        if(o.paper){el("rect",{x:ox+3,y:oy+7,width:w,height:h,rx:14,fill:"rgba(60,50,40,.13)",filter:`url(#${id}-soft)`},outer);el("rect",{x:ox,y:oy,width:w,height:h,rx:14,fill:o.paper},outer)}
        const g0=el("g",{},outer);if(o.clip!==false){const cid=id+"-l"+(uid++);const cp=el("clipPath",{id:cid},defs);el("rect",{x:ox,y:oy,width:w,height:h,rx:14},cp);g0.setAttribute("clip-path",`url(#${cid})`)}
        const g=el("g",{},g0);if(o.paper)el("rect",{x:ox+.5,y:oy+.5,width:w-1,height:h-1,rx:14,fill:"none",stroke:"#d9d4cc","stroke-width":1},outer);
        const fns=[];const L={outer,g,v:null,w,h,
          set(v){L.v=v;const s=w/v.w;g.setAttribute("transform",`translate(${ox+w/2-v.cx*s} ${oy+h/2-v.cy*s}) scale(${s})`);fns.forEach(f=>f(1/s))},
          fly(to,ms=900){const f={...L.v};return A.tw(ms,t=>L.set({w:Math.exp(lerp(Math.log(f.w),Math.log(to.w),t)),cx:lerp(f.cx,to.cx,t),cy:lerp(f.cy,to.cy,t)}))},
          on(f){fns.push(f);if(L.v)f(L.v.w/w)},
          ill(p){const s=w/L.v.w;return[ox+w/2+(p[0]-L.v.cx)*s,oy+h/2+(p[1]-L.v.cy)*s]},
          // a symbol that keeps its on-screen size at any zoom
          mark(p,drawFn){const mg=el("g",{},g);drawFn(mg);const m={g:mg,p:p.slice(),u:1,upd(){mg.setAttribute("transform",`translate(${m.p[0]} ${m.p[1]}) scale(${m.u})`)},
            move(q,ms=700){const f=m.p.slice();return A.tw(ms,t=>{m.p=[lerp(f[0],q[0],t),lerp(f[1],q[1],t)];m.upd()})}};L.on(u=>{m.u=u;m.upd()});m.upd();return m}};
        if(o.view)L.set(o.view);return L},
      pin(g,fill){el("path",{d:"M0,0 C-3,-8 -10,-12 -10,-20 A10,10 0 1 1 10,-20 C10,-12 3,-8 0,0Z",fill,stroke:"#fff","stroke-width":1.6},g);el("circle",{cx:0,cy:-20,r:3.6,fill:"#fff"},g)}};
    return A}

  /* ---------- notes: handwritten, revealed line by line ---------- */
  const TYPE={land:{ts:33,fs:25.5,lh:29,gap:10},port:{ts:42,fs:34,lh:38,gap:16}};
  const SLOT={l0:[40,74,"s"],l1:[40,392,"s"],r0:[1240,74,"e"],r1:[1240,392,"e"]};
  function wrap(b,max){const w=b.join(" ").split(/\s+/),out=[];let l="";w.forEach(x=>{if((l+" "+x).trim().length>max&&l){out.push(l);l=x}else l=(l+" "+x).trim()});if(l)out.push(l);return out}
  const lines=n=>mode==="port"?wrap(n.b,n.to?33:36):n.b;
  function noteH(n,T){return(n.t?T.ts+6:0)+lines(n).length*T.lh}
  function portNotesY(){return api.box[1]+api.box[3]+40}
  function portHeight(){const T=TYPE.port;let mx=0;spec.steps.forEach(s=>{let h=0;s.notes.forEach(n=>h+=noteH(n,T)+T.gap+16);mx=Math.max(mx,h)});return Math.ceil(portNotesY()+mx+6)}
  function arrow(g,a,b,bend){
    const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy),nx=-dy/d,ny=dx/d,w=bend*d;
    const c1=[a[0]+dx*.28+nx*w*(.9+R()*.2),a[1]+dy*.28+ny*w*(.9+R()*.2)],c2=[a[0]+dx*.74+nx*w*.4,a[1]+dy*.74+ny*w*.4];
    const ex=b[0]-c2[0],ey=b[1]-c2[1],l=Math.hypot(ex,ey)||1,ux=ex/l,uy=ey/l;
    const h=(t,s)=>[b[0]-s*(ux*Math.cos(t)-uy*Math.sin(t)),b[1]-s*(uy*Math.cos(t)+ux*Math.sin(t))].map(v=>v.toFixed(1));
    const f=p=>p.map(v=>(+v).toFixed(1)).join(",");
    const sh=el("path",{d:`M${f(a)} C${f(c1)} ${f(c2)} ${f(b)}`,fill:"none",stroke:"var(--n800)","stroke-width":2,"stroke-linecap":"round",pathLength:1,"stroke-dasharray":1,"stroke-dashoffset":1},g);
    const hd=el("path",{d:`M${h(.5,13)} L${f(b)} L${h(-.45,11)}`,fill:"none",stroke:"var(--n800)","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round",opacity:0},g);
    return{sh,hd}}
  function badge(g,c,n,r=15){const b=el("g",{opacity:0},g);el("circle",{cx:c[0],cy:c[1],r,fill:"#fff",stroke:"var(--n900)","stroke-width":2},b);
    txt({x:c[0],y:c[1]+r*.45,"text-anchor":"middle",class:"h t","font-size":r*1.55},b,String(n));return b}
  function layoutNotes(notes){
    const land=mode==="land",T=TYPE[mode],out=[];let py=portNotesY(),num=0;
    notes.forEach(n=>{
      const g=el("g",{class:"note"},api.notesG),lines=[];let x,y,ta;
      if(land){[x,y]=SLOT[n.at];ta=SLOT[n.at][2]==="e"?"end":"start";if(n.dy)y+=n.dy}else{x=n.to?64:24;y=py+T.ts*.8;ta="start"}
      let yy=y;
      if(n.t){lines.push(txt({x,y:yy,class:"h t","font-size":T.ts,"text-anchor":ta,style:`fill:${n.c||"var(--n950)"}`},g,n.t));yy+=T.ts*.35+T.lh}
      (mode==="port"?wrap(n.b,n.to?33:36):n.b).forEach(t=>{lines.push(txt({x,y:yy,class:"h","font-size":T.fs,"text-anchor":ta},g,t));yy+=T.lh});
      const cp=el("clipPath",{id:id+"-c"+(uid++)},api.defs);
      const rects=lines.map(e=>{const b=e.getBBox(),r=el("rect",{x:b.x-8,y:b.y-8,width:0,height:b.height+16},cp);r.dataset.w=b.width+18;return r});
      g.setAttribute("clip-path",`url(#${cp.id})`);
      const o={g,rects,marks:[]};
      const tgt=n.to?n.to(api):null;
      if(tgt){const t=api.P(tgt);
        if(land){const gb=g.getBBox();const sides=[[gb.x+gb.width+16,gb.y+gb.height*.4],[gb.x-16,gb.y+gb.height*.4],[gb.x+gb.width*.5,gb.y+gb.height+12],[gb.x+gb.width*.5,gb.y-12]];
          const a=sides.reduce((p,q)=>D(q,t)<D(p,t)?q:p),stop=n.ring?(n.ring*api.sc*1.2+6):8,d=D(a,t),b=[t[0]-(t[0]-a[0])/d*stop,t[1]-(t[1]-a[1])/d*stop];
          const ag=el("g",{},api.notesG);o.arrow=arrow(ag,a,b,(a[0]<t[0]?-1:1)*(a[1]<t[1]?1:-1)*.16);o.marks.push(ag)}
        else{num++;const bg=el("g",{},api.notesG);o.badge=badge(bg,[t[0]+(n.bx||22),t[1]-(n.by||22)],num);o.badge2=badge(api.notesG,[36,y-T.ts*.3],num,14);o.marks.push(bg,o.badge2)}
        if(n.ring){const rg=el("g",{},api.notesG);o.ring=api.ring(rg,t,n.ring*api.sc,{sx:1.15});o.marks.push(rg)}}
      if(!land)py=yy+T.gap+(n.t?4:0);
      out.push(o)});
    return out}
  function reveal(o){o.rects.forEach(r=>r.setAttribute("width",r.dataset.w));if(o.arrow){o.arrow.sh.setAttribute("stroke-dashoffset",0);o.arrow.hd.setAttribute("opacity",1)}
    if(o.badge)o.badge.setAttribute("opacity",1);if(o.badge2)o.badge2.setAttribute("opacity",1);if(o.ring)o.ring.setAttribute("stroke-dashoffset",0)}

  async function go(i,instant){
    cancels.forEach(c=>c());cancels=[];clearTimeout(autoT);const me=++run,alive=()=>me===run;
    const from=cur;cur=i;updNav();api.fast=!!instant||REDUCE;
    const old=[...api.notesG.childNodes];
    if(api.fast)old.forEach(n=>n.remove());else{old.forEach(n=>{n.style.transition="opacity .18s";n.style.opacity=0});setTimeout(()=>old.forEach(n=>n.remove()),200)}
    const s=spec.steps[i];live.textContent=`Step ${i+1} of ${N}. `+s.notes.map(n=>(n.t?n.t+": ":"")+n.b.join(" ")).join(" ");
    await (s.go(api,from)||null);if(!alive())return;
    await api.wait(80);if(!alive())return;
    const ns=layoutNotes(s.notes);
    if(api.fast)ns.forEach(reveal);
    else for(const o of ns){
      for(const r of o.rects){const w=+r.dataset.w;await api.tw(Math.min(360,w*1.2),t=>r.setAttribute("width",w*t));if(!alive())return}
      if(o.badge2)o.badge2.setAttribute("opacity",1);
      if(o.arrow){await api.tw(420,t=>o.arrow.sh.setAttribute("stroke-dashoffset",1-t));o.arrow.hd.setAttribute("opacity",1)}
      if(o.badge)await api.tw(200,t=>o.badge.setAttribute("opacity",t));
      if(o.ring&&alive())await api.tw(420,t=>o.ring.setAttribute("stroke-dashoffset",1-t));
      if(!alive())return;await api.wait(140)}
    if(!alive())return;
    if(!hinted&&!api.fast){hinted=true;V.querySelector(".skhint")?.classList.add("on")}
    if(auto)autoT=setTimeout(()=>{if(!alive()||!auto)return;if(cur<N-1)go(cur+1);else{auto=false;updNav()}},spec.dwell||4200)}

  function build(){
    mode=innerWidth<700?"port":"land";seed=7;api=mkApi();
    S.setAttribute("viewBox",mode==="land"?"0 0 1280 720":`0 0 640 ${portHeight()}`);
    V.classList.toggle("port",mode==="port");
    spec.draw(api)}
  document.fonts.load('700 30px "Caveat"').then(()=>document.fonts.load('400 26px "Caveat"')).catch(()=>{}).then(()=>{
    build();
    new IntersectionObserver((es,o)=>{if(es[0].isIntersecting){o.disconnect();auto=!OPT.auto||OPT.auto!=="off";if(OPT.step!==undefined){auto=false;go(clamp(+OPT.step,0,N-1),true)}else go(0)}},{threshold:.3}).observe(S)});
  let rt,lastW=innerWidth;addEventListener("resize",()=>{clearTimeout(rt);rt=setTimeout(()=>{const m=innerWidth<700?"port":"land";if(m!==mode||(m==="port"&&innerWidth!==lastW)){lastW=innerWidth;build();if(cur>=0){const c=cur;cur=-1;go(c,true)}}},160)})}

/* shared scenes ------------------------------------------------------------ */
// the world, equirectangular 640 x 320 (lon -180..180)
function worldLens(A,parent,view){const L=A.lens(parent,{paper:"#e8eef2",view});
  const gr=el("g",{stroke:"#d6e0e6","stroke-width":.8,fill:"none","vector-effect":"non-scaling-stroke"},L.g);
  for(let x=0;x<=640;x+=640/24)el("line",{x1:x,x2:x,y1:0,y2:320,"vector-effect":"non-scaling-stroke"},gr);for(let y=0;y<=320;y+=320/12)el("line",{x1:0,x2:640,y1:y,y2:y,"vector-effect":"non-scaling-stroke"},gr);
  el("line",{x1:0,x2:640,y1:160,y2:160,stroke:"#b8c7d1","stroke-width":1,"stroke-dasharray":"4 4","vector-effect":"non-scaling-stroke"},L.g);
  el("line",{x1:320,x2:320,y1:0,y2:320,stroke:"#b8c7d1","stroke-width":1,"stroke-dasharray":"4 4","vector-effect":"non-scaling-stroke"},L.g);
  el("path",{d:G.world.land,fill:"#fbfaf8",stroke:"#bfb9b0","stroke-width":.8,"vector-effect":"non-scaling-stroke"},L.g);
  el("path",{d:G.world.cg,fill:"#e8c9a7",stroke:"var(--dv-orange-700)","stroke-width":1,"vector-effect":"non-scaling-stroke"},L.g);
  return L}
const WVIEW={cx:392,cy:160,w:194};
const SVIEW={cx:260,cy:320,w:392};

/* ============================================================ INTAKE */
SPEC.intake={W:380,H:620,portH:560,steps:[],draw(A){
  const st=A.st;
  st.sS=el("g",{},A.ill);st.wS=el("g",{},A.ill);st.wS.style.opacity=0;
  st.sL=A.lens(st.sS,{view:SVIEW});
  st.vil=el("g",{opacity:0},st.sL.g);G.carto.village.forEach((d,i)=>el("path",{d,fill:i%3?"#faf8f4":"#f4f0ea",stroke:"#d6cfc4","stroke-width":.8,"vector-effect":"non-scaling-stroke"},st.vil));
  st.rd=el("path",{d:G.carto.roads,fill:"none",stroke:"#d5ccbf","stroke-width":3,"stroke-linecap":"round","vector-effect":"non-scaling-stroke",opacity:0},st.sL.g);
  st.sL.g.insertBefore(A.state(st.sL.g),st.sL.g.firstChild);
  const P0=G.stack.pin;st.P0=P0;
  st.circ=el("circle",{cx:P0[0],cy:P0[1],r:G.precR,fill:"rgba(193,125,16,.14)",stroke:"var(--orange-500)","stroke-width":2,"stroke-dasharray":"6 5","vector-effect":"non-scaling-stroke",opacity:0},st.sL.g);
  st.pin2=st.sL.mark([P0[0]+.23,P0[1]+.12],g=>A.pin(g,"var(--red-500)"));st.pin2.g.style.opacity=0;
  st.pin=st.sL.mark(P0,g=>A.pin(g,"var(--dv-blue-700)"));
  st.wL=worldLens(A,st.wS,WVIEW);
  st.env=el("rect",{x:462.7,y:117.1,width:7.3,height:11.3,fill:"none",stroke:"var(--n900)","stroke-width":1.6,"stroke-dasharray":"3 2","vector-effect":"non-scaling-stroke"},st.wL.g);
  st.wpin=st.wL.mark(G.worldPts.cg,g=>A.pin(g,"var(--red-500)"));
  // a label on the world map, drawn by hand
  st.lab=el("g",{opacity:0},A.ill)}};
{const I=SPEC.intake,st=A=>A.st;
 const scene=async(A,world)=>{const s=A.st;await Promise.all([A.op(s.sS,world?0:1,400),A.op(s.wS,world?1:0,400)])};
 const stateOnly=A=>{const s=A.st;A.op(s.pin2.g,0,200);A.op(s.circ,0,200)};
 I.steps=[
 {nav:"Template",go:async A=>{const s=A.st;stateOnly(A);await scene(A,false);await Promise.all([s.sL.fly(SVIEW,700),A.op([s.vil,s.rd],0,300)]);s.pin.p=s.P0.slice();s.pin.upd()},
  notes:[{at:"l0",t:"Sent on one template",b:["one row per asset: an ID,","latitude and longitude to","six decimal places, and","LGD codes to the village"],to:A=>A.st.sL.ill([A.st.P0[0],A.st.P0[1]-8])},
         {at:"r0",t:"Our record",c:"var(--dv-blue-700)",b:["AWC-RPR-00412, an","Anganwadi centre in Raipur.","It lands where it should"],to:A=>{const p=A.st.sL.ill(A.st.P0);return[p[0],p[1]-20]},ring:16},
         {at:"r1",dy:40,t:"Four checks run first",b:["before anything is converted.","Step through them below"]}]},
 {nav:"Swapped",go:async A=>{const s=A.st;stateOnly(A);s.wpin.p=G.worldPts.cg.slice();s.wpin.upd();await scene(A,true);await A.wait(250);await s.wpin.move(G.worldPts.transposed,900)},
  notes:[{at:"l0",t:"Latitude and longitude swapped",c:"var(--red-700)",b:["21.25, 81.63 becomes","81.63, 21.25: the Arctic","Ocean, near Svalbard"],to:A=>A.st.wL.ill(G.worldPts.transposed)},
         {at:"r0",t:"Outside the state's box",b:["17.78° to 24.11° N,","80.25° to 84.40° E.","Anything outside it","is sent back"],to:A=>A.st.wL.ill([466.3,122.7]),ring:14}]},
 {nav:"Blank = 0, 0",go:async A=>{const s=A.st;stateOnly(A);await scene(A,true);await s.wpin.move(G.worldPts.nullisl,900)},
  notes:[{at:"l0",t:"Empty fields saved as zero",c:"var(--red-700)",b:["put the centre at 0° N, 0° E,","in the Atlantic off","West Africa"],to:A=>A.st.wL.ill(G.worldPts.nullisl),ring:14},
         {at:"r0",t:"Sent back",b:["no asset in Chhattisgarh","can be at 0, 0"]}]},
 {nav:"Decimals",go:async A=>{const s=A.st;A.op(s.pin2.g,0,200);await scene(A,false);await Promise.all([s.sL.fly({cx:s.P0[0],cy:s.P0[1]+1.2,w:6.2},1100),A.op([s.vil,s.rd],1,700)]);await A.op(s.circ,1,400)},
  notes:[{at:"l0",t:"Two decimal places",c:"var(--orange-700)",b:["21.25, 81.63 could be","anywhere in this circle,","about a kilometre wide.","Enough to count a centre"],to:A=>A.st.sL.ill([A.st.P0[0]-G.precR*.72,A.st.P0[1]+G.precR*.7])},
         {at:"r0",t:"Six decimal places",c:"var(--green-700)",b:["21.251384, 81.629641","finds the building.","Enough to send","someone there"],to:A=>A.st.sL.ill([A.st.P0[0],A.st.P0[1]-.25])}]},
 {nav:"Duplicates",go:async A=>{const s=A.st;A.op(s.circ,0,200);await scene(A,false);await Promise.all([s.sL.fly({cx:s.P0[0]+.1,cy:s.P0[1]+.2,w:2.2},900),A.op([s.vil,s.rd],1,500)]);await A.op(s.pin2.g,1,300)},
  notes:[{at:"l0",t:"The same centre, twice",c:"var(--red-700)",b:["sent by two offices under","two spellings of one ID:","AWC-RPR-00412 and","AWC-Rpr-412"],to:A=>A.st.sL.ill([A.st.pin2.p[0],A.st.pin2.p[1]-.12]),bx:26},
         {at:"r0",t:"Nothing is fixed quietly",b:["each rejected row goes back","to its department with","the reason beside it"]}]}]}

/* ============================================================ CONVERSION */
SPEC.conversion={W:540,H:540,portH:520,draw(A){const s=A.st,g=el("g",{},A.ill);
  el("rect",{x:3,y:7,width:540,height:540,rx:14,fill:"rgba(60,50,40,.13)",filter:`url(#conversion-soft)`},g);
  el("rect",{x:0,y:0,width:540,height:540,rx:14,fill:"#fbfaf8",stroke:"#d9d4cc"},g);
  s.all=el("g",{},g);const bg=el("g",{fill:"none",stroke:"#e4ddd2","stroke-width":7,"stroke-linecap":"round"},s.all);
  ["M-10,200 C120,180 260,210 560,170","M150,-10 C170,120 140,260 175,560","M400,-10 C380,140 430,300 410,560"].forEach(d=>el("path",{d},bg));
  el("path",{d:"M-10,375 C140,350 300,400 560,350",fill:"none",stroke:"#bcd3ea","stroke-width":6,"stroke-linecap":"round"},s.all);
  // points
  s.pts=el("g",{},s.all);[[90,90],[300,70],[470,120],[60,250],[480,250]].forEach(p=>el("circle",{cx:p[0],cy:p[1],r:8,fill:"var(--dv-blue-500)",stroke:"#fff","stroke-width":2},s.pts));
  s.dupA=el("circle",{cx:245,cy:120,r:8,fill:"var(--dv-blue-500)",stroke:"#fff","stroke-width":2},s.pts);
  s.dupB=el("circle",{cx:262,cy:130,r:8,fill:"var(--dv-blue-500)",stroke:"#fff","stroke-width":2},s.pts);
  // line: block to node, and a spur that stops short
  s.lin=el("g",{},s.all);
  el("path",{d:"M70,318 L150,292 L235,286 L318,256",fill:"none",stroke:"var(--dv-aqua-600)","stroke-width":4,"stroke-linecap":"round","stroke-linejoin":"round"},s.lin);
  s.spur=el("path",{d:"M470,318 L410,296 L346,268",fill:"none",stroke:"var(--dv-aqua-600)","stroke-width":4,"stroke-linecap":"round","stroke-linejoin":"round"},s.lin);
  s.end=el("circle",{cx:346,cy:268,r:5,fill:"#fff",stroke:"var(--red-500)","stroke-width":2.4},s.lin);
  el("rect",{x:60,y:308,width:20,height:20,fill:"var(--dv-aqua-700)"},s.lin);
  el("circle",{cx:318,cy:256,r:8,fill:"#fff",stroke:"var(--dv-aqua-600)","stroke-width":3},s.lin);
  el("rect",{x:462,y:310,width:16,height:16,fill:"#fff",stroke:"var(--dv-aqua-600)","stroke-width":3,transform:"rotate(45 470 318)"},s.lin);
  // two leases that should share an edge
  s.pol=el("g",{},s.all);
  s.slv=el("path",{d:"M262,410 L288,408 L300,516 L272,518Z",fill:"url(#conversion-hatch)",stroke:"none"},s.pol);
  A.defs.insertAdjacentHTML("beforeend",`<pattern id="conversion-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#fdf1ef"/><line x1="0" y1="0" x2="0" y2="7" stroke="#dd2b0e" stroke-width="2"/></pattern>`);
  el("path",{d:"M52,420 L262,410 L272,518 L60,526Z",fill:"#f5d9a8",stroke:"var(--dv-orange-700)","stroke-width":2.4,"stroke-linejoin":"round"},s.pol);
  s.polB=el("path",{d:"M288,408 L488,402 L494,512 L300,516Z",fill:"#f1dcc2",stroke:"var(--dv-orange-500)","stroke-width":2.4,"stroke-linejoin":"round"},s.pol);
  A.hand(s.pol,150,478,"Lease A",{size:28,bold:1,fill:"var(--dv-orange-700)"});A.hand(s.pol,360,470,"Lease B",{size:28,bold:1,fill:"var(--dv-orange-700)"});
  // field mapping, written on the sheet
  s.map=el("g",{opacity:0},g);const rows=[["Functional / F / functional","status = 1"],["Raipur / RAIPUR / Rpr","LGD district 22"],["LAT, LONG as text","a point, EPSG:4326"]];
  rows.forEach((r,i)=>{const y=90+i*150;A.hand(s.map,40,y,r[0],{size:30,fill:"var(--n700)"});
    el("path",{d:`M60,${y+18} C70,${y+50} 90,${y+60} 128,${y+62}`,fill:"none",stroke:"var(--n800)","stroke-width":2,"stroke-linecap":"round"},s.map);
    el("path",{d:`M116,${y+54} L128,${y+62} L116,${y+70}`,fill:"none",stroke:"var(--n800)","stroke-width":2,"stroke-linecap":"round"},s.map);
    A.hand(s.map,140,y+72,r[1],{size:34,bold:1,fill:"var(--dv-aqua-700)"})});
  s.reset=()=>{s.dupB.setAttribute("cx",262);s.dupB.setAttribute("cy",130);s.dupB.style.opacity=1;s.spur.setAttribute("d","M470,318 L410,296 L346,268");s.end.setAttribute("cx",346);s.end.setAttribute("cy",268);s.end.style.opacity=1;
    s.polB.setAttribute("d","M288,408 L488,402 L494,512 L300,516Z");s.slv.style.opacity=1}},
 steps:[
 {nav:"Points",go:async A=>{const s=A.st;s.reset();A.op(s.map,0,250);await A.op(s.all,1,300);A.op([s.lin,s.pol],.35,300);await A.op(s.pts,1,300);await A.wait(500);await A.to(s.dupB,{cx:245,cy:120},700);await A.op(s.dupB,0,200)},
  notes:[{at:"l0",t:"Points",c:"var(--dv-blue-700)",b:["for things you can stand at:","Anganwadi centres,","GP nodes"],to:()=>[90,90]},
         {at:"r0",t:"Sent twice",c:"var(--red-700)",b:["two offices, one centre.","Kept once"],to:()=>[245,120],ring:22}]},
 {nav:"Lines",go:async A=>{const s=A.st;s.reset();s.dupB.style.opacity=0;A.op(s.map,0,250);await A.op(s.all,1,300);A.op([s.pts,s.pol],.35,300);await A.op(s.lin,1,300);await A.wait(600);
   await A.tw(700,t=>{const x=lerp(346,318,t),y=lerp(268,256,t);s.spur.setAttribute("d",`M470,318 L410,296 L${x},${y}`);s.end.setAttribute("cx",x);s.end.setAttribute("cy",y)});await A.op(s.end,0,200)},
  notes:[{at:"l0",t:"Lines",c:"var(--dv-aqua-700)",b:["for networks: fibre from","block to village. The order","of the points gives direction","and distance along it"],to:()=>[190,288]},
         {at:"r0",t:"11 m short",c:"var(--red-700)",b:["this end never reached","the node. Snapped within","tolerance, it connects"],to:()=>[330,262],ring:24}]},
 {nav:"Polygons",go:async A=>{const s=A.st;s.reset();s.dupB.style.opacity=0;A.op(s.map,0,250);await A.op(s.all,1,300);A.op([s.pts,s.lin],.35,300);await A.op(s.pol,1,300);await A.wait(600);
   await Promise.all([A.tw(800,t=>s.polB.setAttribute("d",`M${lerp(288,262,t)},${lerp(408,410,t)} L488,402 L494,512 L${lerp(300,272,t)},${lerp(516,518,t)}Z`)),A.op(s.slv,0,800)])},
  notes:[{at:"l0",t:"Polygons",c:"var(--dv-orange-700)",b:["for areas: mining leases","must close, and share","edges with neighbours"],to:()=>[150,440]},
         {at:"r0",t:"A 0.4 ha gap",c:"var(--red-700)",b:["between two leases.","Closed, so no land is","lost or counted twice"],to:()=>[280,462],ring:30}]},
 {nav:"Fields",go:async A=>{const s=A.st;await A.op(s.all,.08,400);await A.op(s.map,1,500)},
  notes:[{at:"l0",t:"Every office writes it",b:["its own way"],to:()=>[36,84]},
         {at:"r0",t:"One state schema",c:"var(--dv-aqua-700)",b:["the same field names and","codes for every department"],to:()=>[330,156]},
         {at:"r1",dy:40,t:"Kept three ways",b:["shapefile to exchange,","GeoJSON for the web,","PostGIS as the master"]}]}]};

/* ============================================================ PROJECTION */
SPEC.projection={W:380,H:620,portH:560,draw(A){const s=A.st;
  s.sS=el("g",{},A.ill);s.wS=el("g",{},A.ill);s.wS.style.opacity=0;
  s.L=A.lens(s.sS,{view:SVIEW});const g=s.L.g;
  el("path",{d:G.state,fill:"rgba(60,50,40,.13)",transform:"translate(4 7)",filter:"url(#projection-soft)"},g);
  el("path",{d:G.state,fill:"#fbfaf8"},g);
  const cid="projection-st";const cp=el("clipPath",{id:cid},A.defs);el("path",{d:G.state},cp);
  s.cells=el("g",{"clip-path":`url(#${cid})`,opacity:0},g);s.cellEls=G.cells.map(c=>el("path",{d:c.d,fill:"#fff",stroke:"none"},s.cells));
  const dg=el("g",{fill:"none",stroke:"#c9c2b8","stroke-width":1,"vector-effect":"non-scaling-stroke"},g);G.districts.forEach(d=>el("path",{d:d.d,"vector-effect":"non-scaling-stroke"},dg));
  el("path",{d:G.state,fill:"none",stroke:"#8f887e","stroke-width":1.6,"vector-effect":"non-scaling-stroke"},g);
  s.grat=el("g",{opacity:0},g);G.grat.forEach(l=>{el("path",{d:l.d,fill:"none",stroke:"#9fb6cc","stroke-width":1,"stroke-dasharray":"3 4","vector-effect":"non-scaling-stroke"},s.grat)});
  s.east=el("path",{d:G.east,fill:"url(#projection-hatch)",stroke:"var(--dv-magenta-700)","stroke-width":1.4,"vector-effect":"non-scaling-stroke",opacity:0},g);
  A.defs.insertAdjacentHTML("beforeend",`<pattern id="projection-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#f7e3ec"/><line x1="0" y1="0" x2="0" y2="6" stroke="#9a2e5d" stroke-width="1.6"/></pattern>`);
  s.m84=el("path",{d:G.m84,fill:"none",stroke:"var(--dv-magenta-500)","stroke-width":2,"stroke-dasharray":"8 5","vector-effect":"non-scaling-stroke",opacity:0},g);
  // degree labels, in hand, along the left and bottom
  s.glab=el("g",{opacity:0},A.ill);
  s.labs=G.grat.filter(l=>["20°N","22°N","24°N","81°E","83°E"].includes(l.t));
  // colour key
  s.key=el("g",{opacity:0},A.ill);const ky=600;
  for(let i=0;i<24;i++){const v=i/23*2-1;el("rect",{x:70+i*10,y:ky-12,width:10.5,height:12,fill:ramp(v)},s.key)}
  A.hand(s.key,60,ky-1,"−1 m",{size:20,anchor:"end"});A.hand(s.key,320,ky-1,"+1 m per km",{size:20});
  s.wL=worldLens(A,s.wS,WVIEW);s.wpin=s.wL.mark(G.worldPts.nullisl,g2=>A.pin(g2,"var(--red-500)"));
  s.paint=k=>{s.cellEls.forEach((e,i)=>e.setAttribute("fill",ramp(clamp(G.cells[i][k]/1062,-1,1))))}},
 steps:[]};
function ramp(v){const a=[[63,81,174],[210,220,255],[251,250,248],[245,214,179],[146,67,10]],t=(v+1)/2*4,i=Math.min(3,Math.floor(t)),f=t-i;const c=a[i].map((x,j)=>Math.round(lerp(x,a[i+1][j],f)));return`rgb(${c})`}
{const I=SPEC.projection;
 const scene=(A,w)=>Promise.all([A.op(A.st.sS,w?0:1,400),A.op(A.st.wS,w?1:0,400)]);
 const lab=A=>{const s=A.st;s.glab.innerHTML="";s.labs.forEach(l=>{const p=s.L.ill(l.lab);A.hand(s.glab,l.ax==="y"?p[0]+26:p[0],l.ax==="y"?p[1]+6:p[1]-2,l.t.replace("°"," °").replace(" °","°"),{size:20,anchor:"middle",fill:"#6c8aa6"})})};
 I.steps=[
 {nav:"Degrees",go:async A=>{const s=A.st;await scene(A,false);lab(A);await Promise.all([A.op([s.cells,s.m84,s.east,s.key],0,300),A.op([s.grat,s.glab],1,600)])},
  notes:[{at:"l0",t:"Stored in WGS 84",b:["latitude and longitude","in degrees: what every","web map expects"],to:A=>A.st.L.ill([98,314])},
         {at:"r0",t:"A degree isn't a distance",b:["one degree of longitude is","about 104 km here and","111 km at the equator.","You can't measure in it"],to:A=>A.st.L.ill([324,420])}]},
 {nav:"UTM 44N",go:async A=>{const s=A.st;await scene(A,false);s.paint("u44");await Promise.all([A.op([s.grat,s.glab],.35,300),A.op([s.cells,s.key],1,700)]);await A.op([s.m84,s.east],1,500)},
  notes:[{at:"l0",t:"Measured in UTM zone 44N",c:"var(--dv-blue-700)",b:["in metres. Across the state","a kilometre stays within","about a metre of true"],to:A=>A.st.L.ill([200,300])},
         {at:"r0",t:"The zone ends at 84° E",c:"var(--dv-magenta-700)",b:["Jashpur and Balrampur,","1,528 km² of the state,","sit beyond the line"],to:A=>A.st.L.ill([424,130]),ring:16},
         {at:"r1",dy:60,t:"Colour = error per km",b:["blue reads a little short,","orange a little long"],to:A=>[330,588]}]},
 {nav:"Lambert",go:async A=>{const s=A.st;await scene(A,false);await A.op([s.cells],.2,250);s.paint("lcc");await Promise.all([A.op([s.m84,s.east],0,400),A.op([s.cells,s.key],1,600),A.op([s.grat,s.glab],.35,300)])},
  notes:[{at:"l0",t:"One projection for the state",c:"var(--green-700)",b:["a Lambert conformal conic","fitted to Chhattisgarh, so","nothing splits at 84° E"],to:A=>A.st.L.ill([250,250])},
         {at:"r0",t:"Still under a metre",b:["per kilometre, everywhere:","good enough to measure","fibre routes and lease areas"]}]},
 {nav:"The .prj file",go:async A=>{const s=A.st;await scene(A,true);s.wpin.p=G.worldPts.cg.slice();s.wpin.upd();await A.wait(200);await s.wpin.move(G.worldPts.nullisl,1000)},
  notes:[{at:"l0",t:"A shapefile is six files",b:["lose the .prj, the one","that names its coordinate","system…"]},
         {at:"r0",t:"…and it turns up",c:"var(--red-700)",b:["in the Atlantic, nowhere","near Chhattisgarh. The most","common layer mistake"],to:A=>A.st.wL.ill(G.worldPts.nullisl),ring:14}]}]}

/* ============================================================ STORAGE */
SPEC.storage={W:520,H:640,portH:560,draw(A){const s=A.st;
  const KEYS=["ref","min","awc","bn"];s.pl={};
  const g=el("g",{},A.ill);
  KEYS.forEach(k=>{const pg=el("g",{},g),inner=el("g",{},pg);s.pl[k]={g:pg,inner};
    el("path",{d:G.state,fill:k==="ref"?"#fbfaf8":"rgba(251,250,248,.62)",stroke:"#8f887e","stroke-width":1.4,"vector-effect":"non-scaling-stroke"},inner);
    if(k==="ref"){const dg=el("g",{fill:"none",stroke:"#b9b2a8","stroke-width":1,"vector-effect":"non-scaling-stroke"},inner);G.districts.forEach(d=>el("path",{d:d.d,"vector-effect":"non-scaling-stroke"},dg))}
    if(k==="min")el("path",{d:G.stack.mines,fill:"var(--dv-orange-500)",stroke:"var(--dv-orange-700)","stroke-width":1,"vector-effect":"non-scaling-stroke"},inner);
    if(k==="awc"){s.awc=G.stack.aw.map(p=>el("circle",{cx:p[0],cy:p[1],r:4.2,fill:"var(--dv-blue-500)"},inner));
      s.grid=el("g",{opacity:0,stroke:"#9aa7c9","stroke-width":1,"vector-effect":"non-scaling-stroke"},inner);for(let x=80;x<=440;x+=40)el("line",{x1:x,x2:x,y1:24,y2:616,"vector-effect":"non-scaling-stroke"},s.grid);for(let y=24;y<=616;y+=40)el("line",{x1:80,x2:440,y1:y,y2:y,"vector-effect":"non-scaling-stroke"},s.grid);
      const px=G.stack.pin,cx=80+Math.floor((px[0]-80)/40)*40,cy=24+Math.floor((px[1]-24)/40)*40;s.cellB=[cx,cy];
      s.cell=el("rect",{x:cx,y:cy,width:40,height:40,fill:"rgba(247,214,90,.75)",stroke:"var(--n900)","stroke-width":1.6,"vector-effect":"non-scaling-stroke",opacity:0},inner);inner.insertBefore(s.cell,inner.children[1])}
    if(k==="bn"){el("path",{d:G.stack.fibre,fill:"none",stroke:"var(--dv-aqua-600)","stroke-width":2.2,"vector-effect":"non-scaling-stroke"},inner);G.stack.gp.forEach(p=>el("circle",{cx:p[0],cy:p[1],r:5,fill:"#fff",stroke:"var(--dv-aqua-600)","stroke-width":1.6,"vector-effect":"non-scaling-stroke"},inner))}});
  // the plates lie flat: rotate 45°, squash; world centre (260,320)
  s.iso=(p,cy)=>[260+(p[0]-p[1])*.5+30,cy+(p[0]+p[1])*.25-145];
  s.pinLine=el("path",{fill:"none",stroke:"var(--n900)","stroke-width":1.8,"stroke-dasharray":"5 4",opacity:0},g);
  s.names=el("g",{opacity:0},A.ill);
  s.gap=18;s.place=()=>{KEYS.forEach((k,i)=>{const cy=500-i*s.gap;s.pl[k].cy=cy;s.pl[k].inner.setAttribute("transform",`translate(${290} ${cy-145}) matrix(.5 .25 -.5 .25 0 0)`)});
    const a=s.iso(G.stack.pin,s.pl.ref.cy),b=s.iso(G.stack.pin,s.pl.bn.cy);s.pinLine.setAttribute("d",`M${a[0]},${a[1]} L${b[0]},${b[1]}`)};
  s.spread=(gap,ms)=>{const f=s.gap;return A.tw(ms,t=>{s.gap=lerp(f,gap,t);s.place()})};
  s.place();
  s.KEYS=KEYS},
 steps:[]};
{const I=SPEC.storage;const P=(A,k,p)=>A.st.iso(p||[260,320],A.st.pl[k].cy);
 const names=A=>{const s=A.st;s.names.innerHTML="";[["ref","rev_village_py_10k"],["min","min_lease_py_4k"],["awc","wcd_anganwadi_pt_10k"],["bn","bbnl_fibre_ln_10k"]].forEach(([k,n])=>{const p=P(A,k,[441,380]);A.hand(s.names,p[0]+30,p[1]+6,n,{size:A.land?24:34,fill:"var(--n700)"})})};
 const plain=A=>{const s=A.st;return Promise.all([A.op(s.grid,0,250),A.op(s.cell,0,250),A.op(s.names,0,250),A.op(s.KEYS.map(k=>s.pl[k].g),1,300)])};
 I.steps=[
 {nav:"One database",go:async A=>{const s=A.st;await plain(A);A.op(s.pinLine,0,200);await s.spread(18,700)},
  notes:[{at:"l0",t:"Everything lands in PostGIS",b:["one database: the single","source of truth for","the portal"],to:A=>P(A,"bn",[120,420])},
         {at:"r0",t:"Checked on the way in",b:["a point can't be written","into a polygon table, or in","the wrong coordinate system"]}]},
 {nav:"Layers",go:async A=>{const s=A.st;await plain(A);await s.spread(122,1000);await A.op(s.pinLine,1,400)},
  notes:[{at:"l0",t:"Revenue boundaries",b:["one shared reference that","every layer snaps to"],to:A=>P(A,"ref",[110,420])},
         {at:"l1",dy:-60,t:"Mining leases",c:"var(--dv-orange-700)",b:["each department keeps its","own tables, in its own schema"],to:A=>P(A,"min",[150,400])},
         {at:"r0",t:"Same village, every layer",b:["point anywhere and all four","agree on where it is"],to:A=>A.st.iso(G.stack.pin,A.st.pl.bn.cy),ring:14},
         {at:"r1",dy:40,t:"Centres and fibre",c:"var(--dv-blue-700)",b:["Anganwadi and BharatNet,","on the same base"],to:A=>P(A,"awc",[380,300])}]},
 {nav:"Index",go:async A=>{const s=A.st;await plain(A);A.op(s.pinLine,0,200);await s.spread(122,500);await A.op(["ref","min","bn"].map(k=>s.pl[k].g),.12,400);await A.op(s.grid,1,500);await A.op(s.cell,1,400)},
  notes:[{at:"l0",t:"A spatial index",b:["files every shape by where","it is. “All centres in this","block” reads one square,","not every row"],to:A=>A.st.iso([A.st.cellB[0]+20,A.st.cellB[1]+20],A.st.pl.awc.cy),ring:16},
         {at:"r0",t:"Milliseconds",b:["instead of reading","the whole table"]}]},
 {nav:"Names & versions",go:async A=>{const s=A.st;await plain(A);A.op(s.pinLine,0,200);await s.spread(122,500);names(A);await A.op(s.names,1,500)},
  notes:[{at:"l0",t:"Named one way, at load",b:["department_theme_","geometry_scale: lowercase,","underscored (examples)"],to:A=>{const p=P(A,"awc",[441,380]);return[p[0]+12,p[1]]}},
         {at:"r0",dy:300,t:"Every change is versioned",b:["who changed what, and when.","The last version can","always be brought back"]}]}]}

/* ============================================================ PUBLICATION */
SPEC.publication={W:600,H:640,portH:600,draw(A){const s=A.st,g=el("g",{},A.ill);
  // database
  const db=el("g",{},g);el("path",{d:"M225,40 L225,112 C225,132 375,132 375,112 L375,40",fill:"#3a383d",stroke:"#28272d","stroke-width":2},db);
  el("ellipse",{cx:300,cy:40,rx:75,ry:18,fill:"#4d4b4e",stroke:"#28272d","stroke-width":2},db);A.hand(db,300,100,"PostGIS",{size:30,bold:1,anchor:"middle",fill:"#fff"});
  s.dbDot=el("circle",{cx:398,cy:82,r:10,fill:"var(--green-500)",stroke:"#fff","stroke-width":2.5},g);
  s.dbLab=A.hand(g,414,90,"Functional",{size:26,fill:"var(--n800)"});
  // endpoint
  el("path",{d:"M300,132 C302,160 298,180 300,204",fill:"none",stroke:"var(--n500)","stroke-width":2},g);
  A.rough(g,150,204,300,56,{fill:"#fff"});A.hand(g,300,241,"one service endpoint",{size:28,anchor:"middle"});
  // consumers
  const C=[["State Geoportal",150,390,"map"],["Mining app",450,390,"list"],["Anganwadi app",150,560,"phone"],["Partner agency",450,560,"map"]];
  s.wires=[];s.env=[];s.dots=[];
  C.forEach(([n,x,y,kind],i)=>{const w=el("path",{d:`M${300+(i%2?40:-40)},260 C${300+(i%2?60:-60)},${y-120} ${x},${y-140} ${x},${y-72}`,fill:"none",stroke:"var(--n500)","stroke-width":2,"stroke-linecap":"round"},g);w.setAttribute("pathLength",1);s.wires.push(w);
    const eg=el("g",{opacity:0},g);const m=w.getPointAtLength?null:null;s.env.push({g:eg,w});
    const fg=el("g",{},g);A.rough(fg,x-110,y-72,220,140,{fill:"#fff"});A.hand(fg,x-98,y-46,n,{size:24,bold:1});
    if(kind==="list"){for(let r=0;r<3;r++){el("path",{d:`M${x-96},${y-10+r*26} L${x-30},${y-10+r*26}`,stroke:"#d6d1c9","stroke-width":6,"stroke-linecap":"round"},fg)}}
    else{el("path",{d:G.inset.state,fill:"#f4f1ec",stroke:"#8f887e","stroke-width":1.4,transform:`translate(${x-60} ${y-40}) scale(.27)`,"vector-effect":"non-scaling-stroke"},fg)}
    const dp=kind==="list"?[x+40,y+16]:[x-60+203*.27*1.0-10,y-40+170*.27*1.0];
    const dot=el("circle",{cx:kind==="list"?x+30:x-18,cy:kind==="list"?y+16:y+12,r:9,fill:"var(--green-500)",stroke:"#fff","stroke-width":2.5},fg);s.dots.push(dot)});
  s.pulse=el("circle",{r:7,fill:"var(--dv-orange-500)",opacity:0},g);
  s.col={ok:"var(--green-500)",rep:"var(--dv-orange-500)",cl:"var(--red-500)"};
  s.set=(k,lab,which)=>{s.dbDot.setAttribute("fill",s.col[k]);s.dbLab.textContent=lab;(which||[0,1,2,3]).forEach(i=>s.dots[i].setAttribute("fill",s.col[k]))};
  s.envs=[0,1,2,3].map(i=>{const w=s.wires[i],p=w.getPointAtLength(.55*w.getTotalLength()),eg=el("g",{opacity:0,transform:`translate(${p.x} ${p.y})`},g);
    el("rect",{x:-17,y:-12,width:34,height:24,rx:3,fill:"#fff",stroke:"var(--n700)","stroke-width":1.8},eg);el("path",{d:"M-17,-12 L0,2 L17,-12",fill:"none",stroke:"var(--n700)","stroke-width":1.8},eg);return eg})},
 steps:[]};
{const I=SPEC.publication;
 const reset=A=>{const s=A.st;s.envs.forEach(e=>e.style.opacity=0);s.wires.forEach(w=>{w.setAttribute("stroke-dasharray",1);w.setAttribute("stroke","var(--n500)")})};
 const pulse=async A=>{const s=A.st;await Promise.all(s.wires.map(async(w,i)=>{await A.wait(i*120);const L=w.getTotalLength();s.pulse.style.opacity=1;
   const p=el("circle",{r:7,fill:"var(--dv-orange-500)"},w.parentNode);await A.tw(800,t=>{const q=w.getPointAtLength(t*L);p.setAttribute("cx",q.x);p.setAttribute("cy",q.y)});p.remove();s.dots[i].setAttribute("fill",s.col.rep)}));s.pulse.style.opacity=0};
 I.steps=[
 {nav:"Services",go:async A=>{const s=A.st;reset(A);s.set("ok","Functional");s.wires.forEach(w=>w.setAttribute("stroke-dashoffset",1));await Promise.all(s.wires.map(w=>A.to(w,{"stroke-dashoffset":0},900)))},
  notes:[{at:"l0",t:"The portal never reads",b:["the database directly. It","reads published services:","map images, features, tiles"],to:()=>[150,232]},
         {at:"r0",t:"One endpoint for everyone",b:["the portal, the Mining,","Anganwadi and BharatNet","apps, partner agencies"],to:()=>[450,320]}]},
 {nav:"Change once",go:async A=>{const s=A.st;reset(A);s.wires.forEach(w=>w.setAttribute("stroke-dashoffset",0));s.set("ok","Functional");await A.wait(300);s.dbDot.setAttribute("fill",s.col.rep);s.dbLab.textContent="Under repair";await A.wait(300);await pulse(A)},
  notes:[{at:"l0",t:"A centre goes under repair",c:"var(--dv-orange-700)",b:["one edit, in one place"],to:()=>[398,82],ring:16},
         {at:"r0",t:"Every screen shows it",b:["at the same moment.","No file is emailed"],to:()=>[480,405]}]},
 {nav:"Files by email",go:async A=>{const s=A.st;s.set("rep","Under repair");s.wires.forEach(w=>{w.setAttribute("stroke-dashoffset",0);w.setAttribute("stroke-dasharray","0.012 0.02");w.setAttribute("stroke","var(--n300)")});
   await A.op(s.envs,1,400);await A.wait(300);s.dbDot.setAttribute("fill",s.col.cl);s.dbLab.textContent="Closed";await A.wait(500);s.dots[0].setAttribute("fill",s.col.cl);await A.wait(250);s.dots[1].setAttribute("fill",s.col.cl)},
  notes:[{at:"l0",t:"The old way: files by email",b:["every app keeps its own copy,","updated when someone","remembers to send it"],to:A=>{const b=A.st.envs[2].getAttribute("transform").match(/[\d.]+/g).map(Number);return[b[0]-18,b[1]]}},
         {at:"r0",t:"Already out of date",c:"var(--red-700)",b:["two screens still show","the old status"],to:()=>[450,572],ring:40}]}]}

/* ============================================================ CARTOGRAPHY */
SPEC.cartography={W:540,H:540,portH:540,draw(A){const s=A.st;
  const L=s.L=A.lens(A.ill,{paper:"#eceae5",view:{cx:258,cy:318,w:600}});const S0=L.g;
  const C=drawContext(S0,{labels:true,rivers:true,rail:true,roads:true,cities:false,riverLabels:false});s.C=C;
  const under=C.dist.parentNode;
  s.vill=el("g",{opacity:0},S0);G.carto.village.forEach((d,i)=>el("path",{d,fill:i%3===0?"#faf8f4":i%3===1?"#f6f3ee":"#fdfcfa",stroke:"#d6cfc4","stroke-width":.8,"vector-effect":"non-scaling-stroke"},s.vill));
  s.road=el("g",{opacity:0},S0);s.rC=el("path",{d:G.carto.roads,fill:"none",stroke:"#c3baad","stroke-width":5,"stroke-linecap":"round","stroke-linejoin":"round","vector-effect":"non-scaling-stroke"},s.road);el("path",{d:G.carto.roads,fill:"none",stroke:"#fff","stroke-width":2.6,"stroke-linecap":"round","stroke-linejoin":"round","vector-effect":"non-scaling-stroke"},s.road);
  s.teh=el("g",{opacity:0,fill:"none",stroke:"#8f8172","stroke-width":1.4,"stroke-dasharray":"6 2 1.5 2"},S0);G.carto.tehsil.forEach(d=>el("path",{d,"vector-effect":"non-scaling-stroke"},s.teh));
  under.insertBefore(s.vill,C.dist);under.insertBefore(s.road,C.dist);under.insertBefore(s.teh,C.dist);
  s.fib=el("path",{d:G.carto.fibre,fill:"none",stroke:"var(--dv-aqua-600)","stroke-width":3,"stroke-linecap":"round","stroke-linejoin":"round","vector-effect":"non-scaling-stroke",opacity:0},S0);
  s.pts=el("g",{opacity:0},S0);
  const gp=G.carto.gp.map(p=>el("rect",{fill:"#fff",stroke:"var(--dv-aqua-600)"},s.pts)),aw=G.carto.aw.map(p=>el("circle",{cx:p[0],cy:p[1],fill:"var(--dv-blue-500)",stroke:"#fff"},s.pts));
  s.clut=el("g",{opacity:0,fill:"var(--dv-blue-500)","fill-opacity":.8},S0);const cl=G.clutter.map(p=>el("circle",{cx:p[0],cy:p[1]},s.clut));
  s.clutV=el("g",{opacity:0},S0);G.carto.village.forEach(d=>el("path",{d,fill:"none",stroke:"#d6cfc4","stroke-width":.6,"vector-effect":"non-scaling-stroke"},s.clutV));
  const lab=el("g",{"pointer-events":"none"},S0);
  const cities=G.ctx.cities.filter(c=>c.cg).map(c=>{const d=el("circle",{cx:c.xy[0],cy:c.xy[1],fill:"var(--n900)",stroke:"#fff"},lab),t=txt({x:c.xy[0],y:c.xy[1],"font-weight":700,fill:"var(--n900)",class:"halo"},lab,c.n);return{c,d,t}});
  s.tl=el("g",{opacity:0},lab);const tl=G.carto.tehN.filter(t=>t.n!=="Raipur").map(t=>txt({x:t.xy[0],y:t.xy[1],"text-anchor":"middle",fill:"#6f6356",class:"halo","font-weight":500},s.tl,t.n.toUpperCase()));
  L.on(u=>{const k=u*540/540;aw.forEach(c=>{c.setAttribute("r",6*k);c.setAttribute("stroke-width",1.6*k)});
    gp.forEach((r,i)=>{const p=G.carto.gp[i],z=13*k;r.setAttribute("x",p[0]-z/2);r.setAttribute("y",p[1]-z/2);r.setAttribute("width",z);r.setAttribute("height",z);r.setAttribute("stroke-width",2.4*k);r.setAttribute("transform",`rotate(45 ${p[0]} ${p[1]})`)});
    cl.forEach(c=>c.setAttribute("r",1.7*k));
    cities.forEach(({c,d,t})=>{d.setAttribute("r",4*k);d.setAttribute("stroke-width",1.4*k);t.setAttribute("x",c.xy[0]+7*k);t.setAttribute("y",c.xy[1]-6*k);t.setAttribute("font-size",15*k);t.style.strokeWidth=3.6*k+"px";t.style.opacity=c.n==="Bhilai"&&u>.5?0:1});
    tl.forEach(t=>{t.setAttribute("font-size",12*k);t.setAttribute("letter-spacing",1.8*k);t.style.strokeWidth=3.4*k+"px"});
    if(C.slab){C.slab.setAttribute("font-size",12*k)}
    C.rivers&&(C.rivers.style.opacity=1)});
  // stops
  const bc=[G.carto.bbox[0]+G.carto.bbox[2]/2,G.carto.bbox[1]+G.carto.bbox[3]/2],near=(p,q,r)=>Math.abs(p[0]-q[0])<r&&Math.abs(p[1]-q[1])<r;
  const solo=G.carto.aw.filter(a=>!G.carto.gp.some(g=>Math.hypot(g[0]-a[0],g[1]-a[1])<.08));
  const pair=solo.map(a=>{const g=G.carto.gp.reduce((p,q)=>Math.hypot(q[0]-a[0],q[1]-a[1])<Math.hypot(p[0]-a[0],p[1]-a[1])?q:p);return{a,g,d:Math.hypot(g[0]-a[0],g[1]-a[1])}}).filter(p=>p.d>.5&&p.d<1.4).sort((x,y)=>x.d-y.d)[0]||{a:G.carto.aw[0],g:G.carto.gp[0]};
  s.SA=pair.a;s.SG=pair.g;const t=[(pair.a[0]+pair.g[0])/2,(pair.a[1]+pair.g[1])/2];s.T=t;
  s.V=[{cx:258,cy:318,w:600},{cx:bc[0],cy:bc[1],w:62},{cx:G.carto.hub[0]+2,cy:G.carto.hub[1]+2,w:12},{cx:t[0],cy:t[1],w:3.2},{cx:258,cy:318,w:600}];
  s.nearest=(arr,q)=>arr.reduce((a,b)=>Math.hypot(b[0]-q[0],b[1]-q[1])<Math.hypot(a[0]-q[0],a[1]-q[1])?b:a)},
 steps:[]};
{const I=SPEC.cartography;
 const show=(A,on)=>{const s=A.st,C=s.C;const set=(e,v)=>e&&A.op(e,v?1:0,500);
   set(s.teh,on.teh);set(s.tl,on.teh&&!on.all);set(s.vill,on.vil);set(s.road,on.vil);set(C.rail,on.rail);set(C.roads,on.rail);set(s.pts,on.pts);set(s.fib,on.pts);set(s.clut,on.all);set(s.clutV,on.all)};
 const at=(A,p)=>A.st.L.ill(p);
 I.steps=[
 {nav:"State",go:async A=>{const s=A.st;show(A,{rail:1});await s.L.fly(s.V[0],1000)},
  notes:[{at:"l0",t:"The whole state",b:["districts, rivers, main","roads and rail. Nothing","smaller: at this size it","would only be a smudge"],to:A=>{let best=[200,400],bd=1e9;A.st.C.rivers.querySelectorAll("path").forEach(p=>{const T=p.getTotalLength();for(let i=0;i<=60;i++){const q=p.getPointAtLength(T*i/60),d=Math.hypot(q.x-150,q.y-470);if(d<bd){bd=d;best=[q.x,q.y]}}});return at(A,best)}},
         {at:"r0",t:"Drawn once, at the service",b:["colours and symbols come","from the state palette, so","every app shows them alike"]}]},
 {nav:"District",go:async A=>{const s=A.st;show(A,{rail:1,teh:1});await s.L.fly(s.V[1],1100)},
  notes:[{at:"l0",t:"Zoom to a district",b:["tehsil boundaries switch on","from 1:1,000,000"],to:A=>{const p=G.carto.tehN[2].xy;return at(A,[p[0]-6,p[1]-8])}},
         {at:"r0",t:"Labels follow rules",b:["a white halo keeps them","readable; where two","would collide, one gives way"],to:A=>{const p=G.carto.tehN[1].xy;return at(A,[p[0]+8,p[1]-4])}}]},
 {nav:"Village",go:async A=>{const s=A.st;show(A,{teh:1,vil:1});await s.L.fly(s.V[2],1100)},
  notes:[{at:"l0",t:"Closer: 1:100,000",b:["village boundaries and","village roads appear"],to:A=>at(A,A.st.nearest(G.carto.vill_c,[A.st.V[2].cx-2.5,A.st.V[2].cy+1.5]))},
         {at:"r0",t:"Main rail steps back",b:["so the local detail","has room"]}]},
 {nav:"Street",go:async A=>{const s=A.st;show(A,{teh:1,vil:1,pts:1});await s.L.fly(s.V[3],1100)},
  notes:[{at:"l0",t:"Street level: 1:25,000",c:"var(--dv-blue-700)",b:["Anganwadi centres","appear as blue dots"],to:A=>at(A,A.st.SA),ring:12},
         {at:"r0",t:"GP nodes and fibre",c:"var(--dv-aqua-700)",b:["a diamond for each node,","the teal line for fibre"],to:A=>at(A,A.st.SG),ring:14}]},
 {nav:"No limits",go:async A=>{const s=A.st;show(A,{rail:1,teh:1,all:1});await s.L.fly(s.V[4],1100)},
  notes:[{at:"l0",t:"Without scale limits",c:"var(--red-700)",b:["the whole-state view would","draw every village and","every asset at once"],to:A=>at(A,[300,200])},
         {at:"r0",t:"Slow and unreadable",b:["which is why each layer","waits for its zoom level"]}]}]}

INIT.intake=()=>Sketch("intake",SPEC.intake);
INIT.conversion=()=>Sketch("conversion",SPEC.conversion);
INIT.projection=()=>Sketch("projection",SPEC.projection);
INIT.cartography=()=>Sketch("cartography",SPEC.cartography);
