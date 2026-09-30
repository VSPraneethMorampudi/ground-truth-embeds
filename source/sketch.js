/* ============================================================ SKETCH ENGINE
   Every section figure follows the overview's grammar: one drawing in the middle, handwritten
   notes around it with pen arrows. A figure is a short sequence of steps; each step moves the
   drawing, then writes its notes. Phones get the drawing on top and numbered notes below it,
   keyed to numbered markers on the drawing. */
const SPEC={};
function Sketch(id,spec){
  const V=$("#"+id),S=V.querySelector("svg.sk"),nav=V.querySelector(".sknav"),live=V.querySelector(".sklive");
  // v7: no "next:" cue. The story's own navigation says what comes next, and the old cues went stale
  // whenever the story was reordered.
  const foot=document.createElement("p");foot.className="skfoot";foot.innerHTML=`<span>${spec.foot||""}</span>`;nav.after(foot);
  const N=spec.steps.length;
  let animating=false,solved=[],ctl=null,cp=null,noClickUntil=0;const SP=REDUCE?0:.5;
  const pb=document.createElement("div");pb.className="skplay";pb.setAttribute("aria-live","polite");nav.before(pb);
  let mode=null,api=null,cur=-1,run=0,cancels=[],auto=false,autoT=null,seed=7,uid=0,hinted=false;
  const R=()=>(seed=seed*16807%2147483647)/2147483647;
  const D=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);

  nav.innerHTML=`<button type="button" class="skb prev" aria-label="Previous step">←</button>`+
    `<ol>${spec.steps.map((s,i)=>`<li><button type="button" data-i="${i}"><b>${i+1}</b> ${s.nav}</button></li>`).join("")}</ol>`+
    `<span class="skcur" aria-hidden="true"></span><button type="button" class="skb next" aria-label="Next step">→</button>`;
  const btns=[...nav.querySelectorAll("ol button")],prev=nav.querySelector(".prev"),next=nav.querySelector(".next"),curL=nav.querySelector(".skcur");
  function updNav(){btns.forEach((b,i)=>{b.classList.toggle("done",!!solved[i]);if(i===cur)b.setAttribute("aria-current","step");else b.removeAttribute("aria-current")});
    prev.disabled=cur<=0;const last=cur>=N-1;next.textContent=last?"↺":"→";next.setAttribute("aria-label",last?"Start again":"Next step");
    curL.innerHTML=cur<0?"":`<b>${cur+1}</b> of ${N} · ${spec.steps[cur].nav}`;foot.classList.toggle("end",last)}
  const stop=()=>{auto=false;clearTimeout(autoT)};
  btns.forEach((b,i)=>b.onclick=()=>{stop();go(i)});
  prev.onclick=()=>{stop();if(cur>0)go(cur-1)};
  next.onclick=()=>{stop();go(cur>=N-1?0:cur+1)};
  S.addEventListener("click",e=>{if(e.target.closest(".plt")||Date.now()<noClickUntil)return;stop();if(animating){go(cur,true);return}
    // v7: a try-it step is optional. A stray tap on the drawing neither skips it nor scolds; the
    // arrows and the step list always move on.
    const s=spec.steps[cur];if(s&&s.play&&!solved[cur])return;go(cur>=N-1?0:cur+1)});
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
      tw:(ms,fn)=>new Promise(r=>{cancels.push(tween(A.fast?0:ms*SP,fn,r))}),
      wait:ms=>A.fast?Promise.resolve():new Promise(r=>setTimeout(r,ms*SP)),
      halt:()=>stop(),
      pt:e=>{const q=svgPt(S,e);return[(q.x-bx)/sc,(q.y-by)/sc]},
      drag(t,h){t.classList.add("plt");t.style.cursor="grab";t.style.touchAction="none";const sig=A.sig;t.addEventListener("click",e=>e.stopPropagation(),{signal:sig});
        t.addEventListener("pointerdown",e=>{if(e.button>0)return;e.preventDefault();e.stopPropagation();stop();try{t.setPointerCapture(e.pointerId)}catch(_){}t.style.cursor="grabbing";const p0=A.pt(e);h.start&&h.start(p0);
          const mv=ev=>h.move&&h.move(A.pt(ev),p0),up=ev=>{t.removeEventListener("pointermove",mv);t.removeEventListener("pointerup",up);t.removeEventListener("pointercancel",up);t.style.cursor="grab";noClickUntil=Date.now()+350;h.end&&h.end(A.pt(ev),p0)};
          t.addEventListener("pointermove",mv);t.addEventListener("pointerup",up);t.addEventListener("pointercancel",up)},{signal:sig})},
      tap(t,fn){t.classList.add("plt");t.style.cursor="pointer";t.addEventListener("click",e=>{e.stopPropagation();stop();fn(e)},{signal:A.sig})},
      pulse(ip,r=22){const p=A.P(ip);return el("circle",{cx:p[0],cy:p[1],r,class:"skpulse",fill:"none",stroke:"var(--orange-500)","stroke-width":2.6,"stroke-dasharray":"6 5"},A.notesG)},
      // tween numeric attributes (or opacity) from where they are now
      to(e,attrs,ms=500){if(!e)return Promise.resolve();const f={};for(const k in attrs)f[k]=k==="opacity"?+getComputedStyle(e).opacity:+(e.getAttribute(k)||0);
        if("opacity" in attrs&&attrs.opacity>=.05)e.style.pointerEvents="";
        return A.tw(ms,t=>{for(const k in attrs){const v=lerp(f[k],attrs[k],t);if(k==="opacity")e.style.opacity=v;else e.setAttribute(k,v)}}).then(()=>{if("opacity" in attrs&&attrs.opacity<.05)e.style.pointerEvents="none"})},
      op:(e,v,ms=450)=>Array.isArray(e)?Promise.all(e.map(x=>A.to(x,{opacity:v},ms))):A.to(e,{opacity:v},ms),
      // a pen line that draws itself
      draw:(e,v=1,ms=600)=>{e.setAttribute("pathLength",1);e.setAttribute("stroke-dasharray",1);if(!e.hasAttribute("stroke-dashoffset"))e.setAttribute("stroke-dashoffset",1);return A.to(e,{"stroke-dashoffset":1-v},ms)},
      // labels inside a drawing. v7: typed in the story's font by default (o.mono for IDs and table
      // names); handwriting (o.hand) is kept for pen annotations only. Sizes are given in the old
      // Caveat units, so the typed faces are scaled to the same visual weight.
      hand:(g,x,y,s,o={})=>{const f=o.hand?"h":o.mono?"m":"u",k=o.hand?1:o.mono?.62:.7;
        const t=txt({x,y,class:f+(o.bold?" t":""),"font-size":+((o.size||24)*k).toFixed(1),"text-anchor":o.anchor||"start",...(o.fill?{style:"fill:"+o.fill}:{}),...(o.rot?{transform:`rotate(${o.rot} ${x} ${y})`}:{})},g,s);return t},
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
          scalebar(kmPer=G.kmPx){const sg=el("g",{class:"skbar"},outer),ln=el("path",{fill:"none",stroke:"var(--n800)","stroke-width":2,"stroke-linecap":"round"},sg),lb=A.hand(sg,ox+14,oy+h-26,"",{size:21});
            el("rect",{x:ox+8,y:oy+h-46,width:10,height:10,fill:"none"},sg);
            L.on(u=>{const kmPerIll=u/kmPer,want=90*kmPerIll,steps=[.1,.2,.5,1,2,5,10,20,50,100,200],d=steps.find(x=>x>=want*.7)||200,len=d/kmPerIll,x0=ox+14,y0=oy+h-16;
              ln.setAttribute("d",`M${x0},${y0-6} L${x0},${y0} L${x0+len},${y0+.6} L${x0+len},${y0-6}`);lb.textContent=d<1?d*1000+" m":d+" km"})},
          ill(p){const s=w/L.v.w;return[ox+w/2+(p[0]-L.v.cx)*s,oy+h/2+(p[1]-L.v.cy)*s]},
          world(ip){const s=w/L.v.w;return[L.v.cx+(ip[0]-ox-w/2)/s,L.v.cy+(ip[1]-oy-h/2)/s]},
          // a symbol that keeps its on-screen size at any zoom
          mark(p,drawFn){const mg=el("g",{},g);drawFn(mg);const m={g:mg,p:p.slice(),u:1,upd(){mg.setAttribute("transform",`translate(${m.p[0]} ${m.p[1]}) scale(${m.u})`)},
            move(q,ms=700){const f=m.p.slice();return A.tw(ms,t=>{m.p=[lerp(f[0],q[0],t),lerp(f[1],q[1],t)];m.upd()})}};L.on(u=>{m.u=u;m.upd()});m.upd();return m}};
        if(o.view)L.set(o.view);return L},
      pin(g,fill){el("path",{d:"M0,0 C-3,-8 -10,-12 -10,-20 A10,10 0 1 1 10,-20 C10,-12 3,-8 0,0Z",fill,stroke:"#fff","stroke-width":1.6},g);el("circle",{cx:0,cy:-20,r:3.6,fill:"#fff"},g)}};
    return A}

  /* ---------- notes: handwritten, revealed line by line ---------- */
  // v7 type rule: a note written in pen (Caveat) only when it has a pen arrow to what it points at.
  // Every other note, and every note on phones (numbered list under the drawing), is typed in the
  // story's font: bold title, regular body.
  const TYPE={land:{ts:33,fs:25.5,lh:29,gap:10},port:{ts:42,fs:34,lh:38,gap:16},
    landU:{ts:22,fs:18,lh:25.5,gap:10},portU:{ts:28,fs:23,lh:33,gap:16}};
  const penned=n=>mode==="land"&&!!n.to;
  const typeOf=n=>penned(n)?TYPE.land:mode==="land"?TYPE.landU:TYPE.portU;
  const SLOT={l0:[40,74,"s"],l1:[40,392,"s"],r0:[1240,74,"e"],r1:[1240,392,"e"]};
  function wrap(b,max){const w=b.join(" ").split(/\s+/),out=[];let l="";w.forEach(x=>{if((l+" "+x).trim().length>max&&l){out.push(l);l=x}else l=(l+" "+x).trim()});if(l)out.push(l);return out}
  const TX=n=>typeof n.t==="function"?n.t(api):n.t,BX=n=>typeof n.b==="function"?n.b(api):n.b;
  const lines_=n=>mode==="port"?wrap(BX(n),n.to?40:44):BX(n);
  function noteH(n,T){return(n.t?T.ts+6:0)+(typeof n.b==="function"?n.bmax||4:lines_(n).length)*T.lh}
  function portNotesY(){return api.box[1]+api.box[3]+40}
  function portHeight(){let mx=0;spec.steps.forEach(s=>{let h=0;s.notes.forEach(n=>{const T=typeOf(n);h+=noteH(n,T)+T.gap+16});mx=Math.max(mx,h)});return Math.ceil(portNotesY()+mx+6)}
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
    txt({x:c[0],y:c[1]+r*.4,"text-anchor":"middle",class:"u t","font-size":r*1.05},b,String(n));return b}
  // v7.1: on wide screens a note no longer sits at the top of its column by default. A note with an
  // arrow is placed level with what it points at; a note on its own in a column is centred on the
  // drawing; the rest keep their authored slot. Notes in a column never overlap and stay on the page.
  const TOP=30,BOT=698,GAP=30,MID=352;
  function place(outs){
    ["l","r"].forEach(side=>{const col=outs.filter(o=>o.n.at&&o.n.at[0]===side);if(!col.length)return;
      col.forEach(o=>{const b=o.g.getBBox();o.bb=b;
        o.pref=o.t?o.t[1]-b.height*.32:col.length===1?MID-b.height/2:b.y});
      let y=TOP;col.forEach(o=>{o.top=Math.max(o.pref,y);y=o.top+o.bb.height+GAP});
      let lim=BOT;for(let i=col.length-1;i>=0;i--){const o=col[i];o.top=Math.min(o.top,lim-o.bb.height);lim=o.top-GAP}
      col.forEach(o=>{o.top=Math.max(TOP,o.top);o.dy=o.top-o.bb.y;o.g.setAttribute("transform",`translate(0 ${o.dy.toFixed(1)})`)})})}
  function layoutNotes(notes){
    const land=mode==="land",out=[];let py=portNotesY(),num=0;
    notes.forEach(n=>{
      const T=typeOf(n),f=penned(n)?"h":"u";
      const g=el("g",{class:"note "+(f==="h"?"pen":"typed")},api.notesG),lines=[];let x,y,ta;
      if(land){[x,y]=SLOT[n.at];ta=SLOT[n.at][2]==="e"?"end":"start";if(n.dy)y+=n.dy}else{x=n.to?64:24;y=py+T.ts*.8;ta="start"}
      let yy=y;
      if(n.t){lines.push(txt({x,y:yy,class:f+" t","font-size":T.ts,"text-anchor":ta,style:`fill:${n.c||"var(--n950)"}`},g,TX(n)));yy+=T.ts*.35+T.lh}
      lines_(n).forEach(t=>{lines.push(txt({x,y:yy,class:f+" b","font-size":T.fs,"text-anchor":ta},g,t));yy+=T.lh});
      const cp=el("clipPath",{id:id+"-c"+(uid++)},api.defs);
      const rects=lines.map(e=>{const b=e.getBBox(),r=el("rect",{x:b.x-8,y:b.y-8,width:0,height:b.height+16},cp);r.dataset.w=b.width+18;return r});
      g.setAttribute("clip-path",`url(#${cp.id})`);
      const tgt=n.to?n.to(api):null;
      out.push({n,T,y,g,rects,marks:[],t:tgt?api.P(tgt):null});
      if(!land)py=yy+T.gap+(n.t?4:0)});
    if(land)place(out);
    out.forEach(o=>{const{n,T,t}=o;if(!t)return;
      if(land){const b=o.g.getBBox(),gb={x:b.x,y:b.y+(o.dy||0),width:b.width,height:b.height};
        const sides=[[gb.x+gb.width+16,gb.y+gb.height*.4],[gb.x-16,gb.y+gb.height*.4],[gb.x+gb.width*.5,gb.y+gb.height+12],[gb.x+gb.width*.5,gb.y-12]];
        const a=sides.reduce((p,q)=>D(q,t)<D(p,t)?q:p),stop=n.ring?(n.ring*api.sc*1.2+6):8,d=D(a,t)||1,b2=[t[0]-(t[0]-a[0])/d*stop,t[1]-(t[1]-a[1])/d*stop];
        // a near-level arrow gets a gentle bow instead of a dead-straight line
        const bend=Math.abs(a[1]-t[1])<40?.12:.16;
        const ag=el("g",{},api.notesG);o.arrow=arrow(ag,a,b2,(a[0]<t[0]?-1:1)*(a[1]<=t[1]?1:-1)*bend);o.marks.push(ag)}
      else{num++;const bg=el("g",{},api.notesG);o.badge=badge(bg,[t[0]+(n.bx||22),t[1]-(n.by||22)],num);o.badge2=badge(api.notesG,[36,o.y-T.ts*.3],num,14);o.marks.push(bg,o.badge2)}
      if(n.ring){const rg=el("g",{},api.notesG);o.ring=api.ring(rg,t,n.ring*api.sc,{sx:1.15});o.marks.push(rg)}});
    return out}
  function reveal(o){o.rects.forEach(r=>r.setAttribute("width",r.dataset.w));if(o.arrow){o.arrow.sh.setAttribute("stroke-dashoffset",0);o.arrow.hd.setAttribute("opacity",1)}
    if(o.badge)o.badge.setAttribute("opacity",1);if(o.badge2)o.badge2.setAttribute("opacity",1);if(o.ring)o.ring.setAttribute("stroke-dashoffset",0)}

  function sweep(){S.querySelectorAll("g").forEach(g=>{const so=g.style.opacity,ao=g.getAttribute("opacity"),o=so!==""?+so:ao!==null?+ao:1;g.style.pointerEvents=o<.05?"none":""})}
  function setupPlay(s,i){sweep();ctl&&ctl.abort();ctl=new AbortController();api.sig=ctl.signal;cp=null;pb.innerHTML="";pb.className="skplay";
    const P=s.play;if(!P)return;
    pb.innerHTML=`<span class="ask"></span><span class="acts"></span><button type="button" class="show">Show me</button>`;
    const ask=pb.querySelector(".ask"),acts=pb.querySelector(".acts"),show=pb.querySelector(".show");
    const ui={acts,say(t,bad){ask.innerHTML=t;pb.classList.toggle("bad",!!bad);if(bad){pb.classList.remove("shake");void pb.offsetWidth;pb.classList.add("shake")}},
      btn(label,fn,cls=""){const b=document.createElement("button");b.type="button";b.className="pbtn "+cls;b.innerHTML=label;b.onclick=e=>{e.stopPropagation();stop();fn(b)};acts.appendChild(b);return b}};
    const done=msg=>{if(pb.classList.contains("ok"))return;solved[i]=true;updNav();pb.classList.remove("bad");pb.classList.add("ok");ask.innerHTML=`<b class="tick">✓</b> ${msg||P.ok||"Done"}`;acts.innerHTML="";show.remove();
      api.notesG.querySelectorAll(".skpulse").forEach(n=>n.remove());if(cur<N-1)next.classList.add("pulse");live.textContent=(msg||P.ok||"Done")};
    const rc=(P.choices||[]).find(c=>c.right);
    const autoSolve=async()=>{if(P.solve)await P.solve(api,ui);else if(rc&&rc.then)await rc.then(api);done(rc?rc.ok:undefined)};
    cp={done,autoSolve};ui.say(`<b class="lbl">Try it</b> ${P.ask[0].toUpperCase()+P.ask.slice(1)}`);
    (P.choices||[]).forEach(c=>ui.btn(c.label,async()=>{if(c.right){done(c.ok);c.then&&await c.then(api)}else ui.say(c.why,true)}));
    P.setup&&P.setup(api,m=>{stop();done(m)},ui);
    show.onclick=async e=>{e.stopPropagation();stop();show.disabled=true;await autoSolve()};
    pb.classList.add("on")}

  async function go(i,instant){
    cancels.forEach(c=>c());cancels=[];clearTimeout(autoT);const me=++run,alive=()=>me===run;next.classList.remove("pulse");animating=!instant&&!REDUCE;
    const from=cur;cur=i;updNav();api.fast=!!instant||REDUCE;
    const old=[...api.notesG.childNodes];
    if(api.fast)old.forEach(n=>n.remove());else{old.forEach(n=>{n.style.transition="opacity .18s";n.style.opacity=0});setTimeout(()=>old.forEach(n=>n.remove()),200)}
    const s=spec.steps[i];const liveTxt=()=>`Step ${i+1} of ${N}. `+s.notes.map(n=>(n.t?TX(n)+": ":"")+BX(n).join(" ")).join(" ");
    await (s.go(api,from)||null);if(!alive())return;
    setupPlay(s,i);
    await api.wait(80);if(!alive())return;
    live.textContent=liveTxt();const ns=layoutNotes(s.notes);
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
    animating=false;
    const adv=()=>{if(!alive()||!auto)return;if(cur<N-1)go(cur+1);else{auto=false;updNav()}};
    if(auto){if(s.play&&!solved[i])autoT=setTimeout(async()=>{if(!alive()||!auto)return;cp&&await cp.autoSolve();if(!alive()||!auto)return;autoT=setTimeout(adv,1800)},spec.dwell||3400);
      else autoT=setTimeout(adv,spec.dwell||3400)}}

  function build(){
    mode=innerWidth<700?"port":"land";seed=7;api=mkApi();
    S.setAttribute("viewBox",mode==="land"?"0 0 1280 720":`0 0 640 ${portHeight()}`);
    V.classList.toggle("port",mode==="port");
    spec.draw(api);requestAnimationFrame(()=>typeof fit==="function"&&fit())}
  // notes are revealed through clip rects measured from the text, so every face must be in before
  // the first build, or a late-loading font leaves words cut off at the edge
  const faces=['700 30px "Caveat"','400 26px "Caveat"','400 18px "Avenir Next World"','700 18px "Avenir Next World"','400 14px "GitLab Mono"'];
  Promise.all(faces.map(f=>document.fonts.load(f).catch(()=>{}))).then(()=>{
    build();
    new IntersectionObserver((es,o)=>{if(es[0].isIntersecting){o.disconnect();auto=!OPT.auto||OPT.auto!=="off";if(OPT.step!==undefined){auto=false;go(clamp(+OPT.step,0,N-1),true)}else go(0)}},{threshold:.3}).observe(S)});
  let rt,lastW=innerWidth;addEventListener("resize",()=>{clearTimeout(rt);rt=setTimeout(()=>{const m=innerWidth<700?"port":"land";if(m!==mode||(m==="port"&&innerWidth!==lastW)){lastW=innerWidth;build();if(cur>=0){const c=cur;cur=-1;go(c,true)}}},160)})}

/* shared scenes ------------------------------------------------------------ */
// v7.1: the section figures stay on home ground. Chhattisgarh sits among the eight states around it,
// all in the state's own projection; a record that lands far away is shown as a pin waiting at the
// edge of the map, pointing the way it went, with how far it went written beside it.
const SVIEW={cx:260,cy:320,w:392};
const RVIEW={cx:267,cy:323,w:670};
function regionLens(A,parent,view=RVIEW,o={}){const L=A.lens(parent,{paper:"#ebe8e2",view});const g=L.g;
  const nb=el("g",{},g);G.ctx.states.forEach(s=>el("path",{d:s.d,fill:"#f4f2ed",stroke:"#fff","stroke-width":1.6,"stroke-linejoin":"round","vector-effect":"non-scaling-stroke"},nb));
  const lab=el("g",{},g);const labs=Object.keys(LBL).map(n=>txt({x:LBL[n][0],y:LBL[n][1],"text-anchor":"middle",class:"u",style:"fill:#a39d94;font-weight:500"},lab,n.toUpperCase()));
  L.on(u=>labs.forEach(t=>{t.setAttribute("font-size",(13*u).toFixed(3));t.setAttribute("letter-spacing",(2.2*u).toFixed(3))}));
  L.nbl=lab;if(o.state!==false)L.st=A.state(g);return L}
// the state's lat/long box, traced through the projection so its edges curve as they should
function envelope(g){const P=[];for(let x=80.25;x<=84.4001;x+=.05)P.push(ll2xy(x,17.78));for(let y=17.78;y<=24.1101;y+=.05)P.push(ll2xy(84.4,y));
  for(let x=84.4;x>=80.2499;x-=.05)P.push(ll2xy(x,24.11));for(let y=24.11;y>=17.7799;y-=.05)P.push(ll2xy(80.25,y));
  return el("path",{d:"M"+P.map(p=>p.map(v=>v.toFixed(1)).join(",")).join("L")+"Z",fill:"none",stroke:"var(--n900)","stroke-width":1.6,"stroke-dasharray":"7 5","vector-effect":"non-scaling-stroke"},g)}
// where a stray record waits: on the edge of the view, on the great-circle bearing from Raipur
function offMark(A,L,brg,head,sub){const v=L.v,hw=v.w/2,hh=v.w*L.h/L.w/2,m=v.w*.075,r=brg*Math.PI/180,dx=Math.sin(r),dy=-Math.cos(r),P0=G.stack.pin;
  let t=1e9;if(dx>1e-6)t=Math.min(t,(v.cx+hw-m-P0[0])/dx);if(dx<-1e-6)t=Math.min(t,(v.cx-hw+m-P0[0])/dx);if(dy>1e-6)t=Math.min(t,(v.cy+hh-m-P0[1])/dy);if(dy<-1e-6)t=Math.min(t,(v.cy-hh+m-P0[1])/dy);
  const p=[P0[0]+dx*t,P0[1]+dy*t];
  return{p,head:()=>{const q=L.ill(p);return[q[0],q[1]-20]},
    draw(parent){const q=L.ill(p),c=[q[0],q[1]-20],g=el("g",{opacity:0},parent),f=v=>v.map(n=>n.toFixed(1)).join(",");
      const a0=[c[0]+dx*18,c[1]+dy*18],a1=[c[0]+dx*44,c[1]+dy*44];
      el("path",{d:`M${f(a0)} L${f(a1)}`,fill:"none",stroke:"var(--red-700)","stroke-width":2.4,"stroke-linecap":"round","stroke-dasharray":"1 6"},g);
      const h=(k,s)=>[a1[0]-s*(dx*Math.cos(k)-dy*Math.sin(k)),a1[1]-s*(dy*Math.cos(k)+dx*Math.sin(k))];
      el("path",{d:`M${f(h(.55,11))} L${f(a1)} L${f(h(-.55,11))}`,fill:"none",stroke:"var(--red-700)","stroke-width":2.4,"stroke-linecap":"round","stroke-linejoin":"round"},g);
      const side=Math.abs(dx)>Math.abs(dy);let x,y,an;
      if(side){x=q[0]+(dx<0?-14:14);y=q[1]+24;an=dx<0?"start":"end"}else{x=q[0];y=dy<0?q[1]+30:q[1]-58;an="middle"}
      const t1=A.hand(g,x,y,head,{mono:1,bold:1,size:23,anchor:an,fill:"var(--red-700)"}),t2=A.hand(g,x,y+20,sub,{size:21,anchor:an,fill:"var(--n700)"});
      // a paper backing so the label reads over the map
      const bb=[t1.getBBox(),t2.getBBox()],x0=Math.min(bb[0].x,bb[1].x)-7,y0=bb[0].y-5,x1=Math.max(bb[0].x+bb[0].width,bb[1].x+bb[1].width)+7,y1=bb[1].y+bb[1].height+5;
      g.insertBefore(el("rect",{x:x0,y:y0,width:x1-x0,height:y1-y0,rx:6,fill:"rgba(251,250,248,.92)",stroke:"#e3ddd3"}),t1);
      return g}}}

/* ============================================================ INTAKE */
SPEC.intake={W:560,H:620,portH:560,foot:"District and state boundaries are real. The record and its errors are illustrative.",steps:[],draw(A){
  const st=A.st;
  st.sS=el("g",{},A.ill);
  st.sL=regionLens(A,st.sS,RVIEW);st.sL.scalebar();
  st.env=envelope(st.sL.g);st.env.style.opacity=0;
  st.vil=el("g",{opacity:0},st.sL.g);G.carto.village.forEach((d,i)=>el("path",{d,fill:i%3?"#faf8f4":"#f4f0ea",stroke:"#d6cfc4","stroke-width":.8,"vector-effect":"non-scaling-stroke"},st.vil));
  st.rd=el("path",{d:G.carto.roads,fill:"none",stroke:"#d5ccbf","stroke-width":3,"stroke-linecap":"round","vector-effect":"non-scaling-stroke",opacity:0},st.sL.g);
  const P0=G.stack.pin;st.P0=P0;
  st.circ=el("circle",{cx:P0[0],cy:P0[1],r:G.precR,fill:"rgba(193,125,16,.14)",stroke:"var(--orange-500)","stroke-width":2,"stroke-dasharray":"6 5","vector-effect":"non-scaling-stroke",opacity:0},st.sL.g);
  st.pin2=st.sL.mark([P0[0]+.23,P0[1]+.12],g=>A.pin(g,"var(--red-500)"));st.pin2.g.style.opacity=0;
  st.pin=st.sL.mark(P0,g=>A.pin(g,"var(--dv-blue-700)"));
  // the stray copy of the record, and where it ends up
  st.spin=st.sL.mark(P0,g=>A.pin(g,"var(--red-500)"));st.spin.g.style.opacity=0;
  st.offN=offMark(A,st.sL,352,"81.63° N, 21.25° E","about 7,200 km north");
  st.offW=offMark(A,st.sL,267,"0° N, 0° E","9,100 km west");
  st.offG=el("g",{},A.ill)}};
{const I=SPEC.intake;
 const home=A=>{const s=A.st;A.op(s.pin2.g,0,200);A.op(s.circ,0,200);A.op(s.env,0,200);A.op(s.spin.g,0,200);s.offG.innerHTML=""};
 // the stray pin leaves Raipur for the edge of the map, then its marker is written in
 const stray=async(A,off)=>{const s=A.st;s.offG.innerHTML="";s.spin.p=s.P0.slice();s.spin.upd();
   await Promise.all([s.sL.fly(RVIEW,600),A.op([s.vil,s.rd],0,250),A.op(s.env,1,400)]);await A.op(s.spin.g,1,200);
   await s.spin.move(off.p,900);const g=off.draw(s.offG);await A.op(g,1,300)};
 I.stray=stray;
 I.steps=[
 {nav:"Template",go:async A=>{const s=A.st;home(A);await Promise.all([s.sL.fly(RVIEW,700),A.op([s.vil,s.rd],0,300)]);s.pin.p=s.P0.slice();s.pin.upd()},
  notes:[{at:"l0",t:"Sent on one template",b:["one row per asset: an ID,","latitude and longitude to","six decimal places, and","LGD codes to the village"],to:A=>A.st.sL.ill([A.st.P0[0]-6,A.st.P0[1]-10])},
         {at:"r0",t:"Our record",c:"var(--dv-blue-700)",b:["AWC-RPR-00412, an","Anganwadi centre in Raipur.","It lands where it should"],to:A=>{const p=A.st.sL.ill(A.st.P0);return[p[0],p[1]-20]},ring:16},
         {at:"r1",t:"Four checks run first",b:["before anything is converted.","Step through them below"]}]},
 {nav:"Swapped",go:async A=>{home(A);await stray(A,A.st.offN)},
  notes:[{at:"l0",t:"Latitude and longitude swapped",c:"var(--red-700)",b:["21.25, 81.63 becomes","81.63, 21.25: far off the","top of this map, in the","Arctic Ocean near Svalbard"],to:A=>A.st.offN.head()},
         {at:"r0",t:"Outside the state's box",b:["17.78° to 24.11° N,","80.25° to 84.40° E.","Anything outside it","is sent back"],to:A=>A.st.sL.ill(ll2xy(84.4,20.4))}]},
 {nav:"Blank = 0, 0",go:async A=>{home(A);await stray(A,A.st.offW)},
  notes:[{at:"l0",t:"Empty fields saved as zero",c:"var(--red-700)",b:["put the centre at 0° N, 0° E,","in the Atlantic off","West Africa"],to:A=>A.st.offW.head()},
         {at:"r0",t:"Sent back",b:["no asset in Chhattisgarh","can be at 0, 0"]}]},
 {nav:"Decimals",go:async A=>{const s=A.st;home(A);await Promise.all([s.sL.fly({cx:s.P0[0],cy:s.P0[1]+1.2,w:9},1100),A.op([s.vil,s.rd],1,700)]);await A.op(s.circ,1,400)},
  notes:[{at:"l0",t:"Two decimal places",c:"var(--orange-700)",b:["21.25, 81.63 could be","anywhere in this circle,","about a kilometre wide.","Enough to count a centre"],to:A=>A.st.sL.ill([A.st.P0[0]-G.precR*.72,A.st.P0[1]+G.precR*.7])},
         {at:"r0",t:"Six decimal places",c:"var(--green-700)",b:["21.251384, 81.629641","finds the building.","Enough to send","someone there"],to:A=>A.st.sL.ill([A.st.P0[0],A.st.P0[1]-.25])}]},
 {nav:"Duplicates",go:async A=>{const s=A.st;home(A);await Promise.all([s.sL.fly({cx:s.P0[0]+.1,cy:s.P0[1]+.2,w:3.2},900),A.op([s.vil,s.rd],1,500)]);await A.op(s.pin2.g,1,300)},
  notes:[{at:"l0",t:"The same centre, twice",c:"var(--red-700)",b:["sent by two offices under","two spellings of one ID:","AWC-RPR-00412 and","AWC-Rpr-412"],to:A=>A.st.sL.ill([A.st.pin2.p[0],A.st.pin2.p[1]-.12]),bx:26},
         {at:"r0",t:"Nothing is fixed quietly",b:["each rejected row goes back","to its department with","the reason beside it"]}]}]}

/* ============================================================ CONVERSION */
SPEC.conversion={W:540,H:540,portH:520,next:"Projection",foot:"An illustrative sheet: centres, one fibre route and two leases.",draw(A){const s=A.st,g=el("g",{},A.ill);
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
  rows.forEach((r,i)=>{const y=90+i*150;A.hand(s.map,40,y,r[0],{size:30,mono:1,fill:"var(--n700)"});
    el("path",{d:`M60,${y+18} C70,${y+50} 90,${y+60} 128,${y+62}`,fill:"none",stroke:"var(--n800)","stroke-width":2,"stroke-linecap":"round"},s.map);
    el("path",{d:`M116,${y+54} L128,${y+62} L116,${y+70}`,fill:"none",stroke:"var(--n800)","stroke-width":2,"stroke-linecap":"round"},s.map);
    A.hand(s.map,140,y+72,r[1],{size:36,mono:1,bold:1,fill:"var(--dv-aqua-700)"})});
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
SPEC.projection={W:560,H:620,portH:560,foot:"Colour shows scale error per kilometre, worked out for every 0.1° cell of the state.",draw(A){const s=A.st;
  s.sS=el("g",{},A.ill);
  s.L=regionLens(A,s.sS,RVIEW,{state:false});s.L.scalebar();const g=s.L.g;
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
  // v7: the key starts clear of the scale bar, which sits at the same height on the left
  for(let i=0;i<24;i++){const v=i/23*2-1;el("rect",{x:150+i*10,y:ky-12,width:10.5,height:12,fill:ramp(v)},s.key)}
  A.hand(s.key,142,ky-1,"−1 m",{size:20,anchor:"end"});A.hand(s.key,398,ky-1,"+1 m per km",{size:20});
  s.spin=s.L.mark(G.stack.pin,g2=>A.pin(g2,"var(--red-500)"));s.spin.g.style.opacity=0;
  s.offW=offMark(A,s.L,267,"0° N, 0° E","9,100 km west");s.offG=el("g",{},A.ill);
  s.paint=k=>{s.cellEls.forEach((e,i)=>e.setAttribute("fill",ramp(clamp(G.cells[i][k]/1062,-1,1))))}},
 steps:[]};
function ramp(v){const a=[[63,81,174],[210,220,255],[251,250,248],[245,214,179],[146,67,10]],t=(v+1)/2*4,i=Math.min(3,Math.floor(t)),f=t-i;const c=a[i].map((x,j)=>Math.round(lerp(x,a[i+1][j],f)));return`rgb(${c})`}
{const I=SPEC.projection;
 // v7.1: no world map. The layer that lost its .prj leaves the state for the edge of the map
 const scene=async(A,w)=>{const s=A.st;if(!w){s.offG.innerHTML="";return A.op(s.spin.g,0,200)}
   s.offG.innerHTML="";s.spin.p=G.stack.pin.slice();s.spin.upd();await A.op(s.spin.g,1,200);await s.spin.move(s.offW.p,1000);await A.op(s.offW.draw(s.offG),1,300)};
 const lab=A=>{const s=A.st;s.glab.innerHTML="";s.labs.forEach(l=>{const p=s.L.ill(l.lab);A.hand(s.glab,l.ax==="y"?p[0]+26:p[0],l.ax==="y"?p[1]+6:p[1]-2,l.t.replace("°"," °").replace(" °","°"),{size:20,anchor:"middle",fill:"#6c8aa6"})})};
 I.steps=[
 {nav:"Degrees",go:async A=>{const s=A.st;await scene(A,false);lab(A);await Promise.all([A.op([s.cells,s.m84,s.east,s.key],0,300),A.op([s.grat,s.glab],1,600)])},
  notes:[{at:"l0",t:"Stored in WGS 84",b:["latitude and longitude","in degrees: what every","web map expects"],to:A=>A.st.L.ill([98,314])},
         {at:"r0",t:"A degree isn't a distance",b:["one degree of longitude is","about 104 km here and","111 km at the equator.","You can't measure in it"],to:A=>A.st.L.ill([324,420])}]},
 {nav:"UTM 44N",go:async A=>{const s=A.st;await scene(A,false);s.paint("u44");await Promise.all([A.op([s.grat,s.glab],.35,300),A.op([s.cells,s.key],1,700)]);await A.op([s.m84,s.east],1,500)},
  notes:[{at:"l0",t:"Measured in UTM zone 44N",c:"var(--dv-blue-700)",b:["in metres. Across the state","a kilometre stays within","about a metre of true"],to:A=>A.st.L.ill([200,300])},
         {at:"r0",t:"The zone ends at 84° E",c:"var(--dv-magenta-700)",b:["Jashpur and Balrampur,","1,528 km² of the state,","sit beyond the line"],to:A=>A.st.L.ill([424,130]),ring:16},
         {at:"r1",dy:60,t:"Colour = error per km",b:["blue reads a little short,","orange a little long"],to:A=>[392,588]}]},
 {nav:"Lambert",go:async A=>{const s=A.st;await scene(A,false);await A.op([s.cells],.2,250);s.paint("lcc");await Promise.all([A.op([s.m84,s.east],0,400),A.op([s.cells,s.key],1,600),A.op([s.grat,s.glab],.35,300)])},
  notes:[{at:"l0",t:"One projection for the state",c:"var(--green-700)",b:["a Lambert conformal conic","fitted to Chhattisgarh, so","nothing splits at 84° E"],to:A=>A.st.L.ill([250,250])},
         {at:"r0",t:"Still under a metre",b:["per kilometre, everywhere:","good enough to measure","fibre routes and lease areas"]}]},
 {nav:"The .prj file",go:async A=>{const s=A.st;await Promise.all([A.op([s.cells,s.key,s.m84,s.east],0,300),A.op([s.grat,s.glab],.35,300)]);await scene(A,true)},
  notes:[{at:"l0",t:"A lost .prj file",c:"var(--red-700)",b:["a shapefile is six files. Lose","the .prj, the one that names","the coordinate system, and the","layer lands at 0° N, 0° E"],to:A=>A.st.offW.head()},
         {at:"r0",t:"The most common mistake",b:["a missing .prj is the most","frequent reason a layer","turns up in the Atlantic,","9,100 km from home"]}]}]}

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
SPEC.cartography={W:540,H:540,portH:540,next:"Provenance and access",foot:"Districts, rivers, roads and rail are real. Villages, centres and fibre are illustrative, drawn around Raipur.",draw(A){const s=A.st;
  const L=s.L=A.lens(A.ill,{paper:"#eceae5",view:{cx:258,cy:318,w:600}});L.scalebar();const S0=L.g;
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


/* ============================================================ PROVENANCE AND ACCESS */
const ICON_D={
  eye:g=>{el("path",{d:"M-20,0 C-11,-13 11,-13 20,0 C11,13 -11,13 -20,0Z",fill:"#fff",stroke:"var(--n800)","stroke-width":2.2,"stroke-linejoin":"round"},g);el("circle",{r:5.5,fill:"var(--n800)"},g)},
  query:g=>{el("circle",{cx:-4,cy:-4,r:11,fill:"#fff",stroke:"var(--n800)","stroke-width":2.4},g);el("path",{d:"M4,4 L15,15",stroke:"var(--n800)","stroke-width":3.2,"stroke-linecap":"round"},g)},
  down:g=>{el("path",{d:"M0,-16 L0,7 M-9,-2 L0,8 L9,-2 M-14,15 L14,15",fill:"none",stroke:"var(--n800)","stroke-width":2.6,"stroke-linecap":"round","stroke-linejoin":"round"},g)},
  edit:g=>{el("path",{d:"M-13,13 L-9,3 L7,-13 L13,-7 L-3,9 Z M-9,3 L-3,9",fill:"#fff",stroke:"var(--n800)","stroke-width":2.2,"stroke-linejoin":"round"},g)},
  lock:g=>{el("path",{d:"M-8,-3 L-8,-10 C-8,-19 8,-19 8,-10 L8,-3",fill:"none",stroke:"var(--n800)","stroke-width":2.4},g);el("rect",{x:-12,y:-3,width:24,height:19,rx:3,fill:"var(--n800)"},g)},
  book:g=>{el("path",{d:"M-15,-14 L-2,-11 L-2,15 L-15,12Z M15,-14 L2,-11 L2,15 L15,12Z",fill:"#fff",stroke:"var(--n800)","stroke-width":2,"stroke-linejoin":"round"},g);[-5,0,5].forEach(y=>el("path",{d:`M-12,${y-2} L-5,${y} M5,${y} L12,${y-2}`,stroke:"var(--n400)","stroke-width":1.4},g))}};
const icon=(g,k,x,y,sc=1)=>{const i=el("g",{transform:`translate(${x} ${y}) scale(${sc})`},g);ICON_D[k](i);return i};
const sheet=(A,g,x,y,sc,o={})=>{const t=el("g",{transform:`translate(${x-79*sc} ${y-24*sc}) scale(${sc})`},g);
  el("path",{d:G.state,fill:"rgba(60,50,40,.12)",transform:"translate(5 9)",filter:`url(#${o.id}-soft)`},t);el("path",{d:G.state,fill:o.fill||"#fbfaf8",stroke:"#8f887e","stroke-width":1.6,"vector-effect":"non-scaling-stroke"},t);
  if(o.aw)G.stack.aw.forEach(p=>el("circle",{cx:p[0],cy:p[1],r:4.5,fill:"var(--dv-blue-500)"},t));
  if(o.dist){const dg=el("g",{fill:"none",stroke:"#c9c2b8","stroke-width":1,"vector-effect":"non-scaling-stroke"},t);G.districts.forEach(d=>el("path",{d:d.d,"vector-effect":"non-scaling-stroke"},dg))}return t};
SPEC.provenance={W:560,H:560,portH:540,next:"In use",foot:"The card shows the fields every layer carries. Names and layers are examples.",
 draw(A){const s=A.st;
  // scene 1 and 2: the layer and the card tied to it
  s.card=el("g",{},A.ill);
  sheet(A,s.card,22,90,.48,{id:"provenance",aw:1,dist:1});
  el("path",{d:"M160,150 C200,120 220,150 262,96",fill:"none",stroke:"var(--n600)","stroke-width":1.8,"stroke-linecap":"round"},s.card);
  A.rough(s.card,246,40,300,480,{fill:"#fffdf7",stroke:"var(--n700)"});el("circle",{cx:268,cy:64,r:7,fill:"var(--page)",stroke:"var(--n600)","stroke-width":1.6},s.card);
  A.hand(s.card,286,72,"wcd_anganwadi_pt_10k",{size:27,mono:1,bold:1});
  // v7: short values so the typed column stays inside the card at every width
  const F=[["Custodian","WCD, nodal officer"],["Captured","date of survey"],["Updated","how often"],["Position","accuracy, metres"],["Attributes","how checked"],["Source scale","1:10,000"],["Licence","who may reuse it"],["Lineage","who did what, when"]];
  s.rows=F.map(([k,v],i)=>{const y=124+i*48,r=el("g",{},s.card);A.hand(r,266,y,k,{size:21,bold:1,fill:"var(--n900)"});A.hand(r,398,y,v,{size:20,fill:"var(--n600)"});
    el("path",{d:`M266,${y+12} L528,${y+11}`,stroke:"#ece6da","stroke-width":1},r);return r});
  s.lin=el("g",{opacity:0},s.card);
  const E=[["Received","from WCD, on the template"],["Checked","four intake tests passed"],["Converted","snapped to its village"],["Published","as a feature service"]];
  el("path",{d:"M282,150 L282,420",stroke:"var(--n400)","stroke-width":2,"stroke-dasharray":"4 5"},s.lin);
  E.forEach(([k,v],i)=>{const y=150+i*90;el("circle",{cx:282,cy:y,r:9,fill:i===3?"var(--green-500)":"#fff",stroke:"var(--n800)","stroke-width":2.2},s.lin);
    A.hand(s.lin,302,y+7,k,{size:26,bold:1});A.hand(s.lin,302,y+34,v,{size:21,fill:"var(--n700)"});A.hand(s.lin,302,y+58,"by whom · when",{size:18,fill:"var(--n500)"})});
  // scene 3 and 4: three rings of access
  s.acc=el("g",{opacity:0},A.ill);const cx=280,cy=250;
  [[250,215,"#f4f7f1","Public"],[170,146,"#eef2ea","Departmental"],[90,78,"#e6ebe2","Restricted"]].forEach(([rx,ry,f,n],i)=>{
    el("ellipse",{cx,cy,rx,ry,fill:f,stroke:"var(--n600)","stroke-width":1.8,"stroke-dasharray":i?"":"6 5"},s.acc);A.hand(s.acc,cx,cy-ry+30,n,{size:24,bold:1,anchor:"middle",fill:"var(--n800)"})});
  sheet(A,s.acc,104,214,.12,{id:"provenance"});sheet(A,s.acc,440,200,.13,{id:"provenance",aw:1});sheet(A,s.acc,150,250,.12,{id:"provenance",aw:1});sheet(A,s.acc,380,250,.12,{id:"provenance",dist:1});sheet(A,s.acc,262,232,.11,{id:"provenance",fill:"#f6e3d6"});
  s.gate=el("g",{},s.acc);icon(s.gate,"lock",cx-250,cy+6,1.1);A.hand(s.gate,cx-250,cy+46,"state SSO",{size:22,anchor:"middle"});
  s.keys=el("g",{opacity:0},A.ill);[["eye","view"],["query","query"],["down","download"],["edit","edit"]].forEach(([k,n],i)=>{const x=95+i*123;icon(s.keys,k,x,500,1.1);A.hand(s.keys,x,540,n,{size:23,anchor:"middle"})});
  s.log=el("g",{opacity:0},A.ill);icon(s.log,"book",cx+48,cy+30,1.1);A.hand(s.log,cx+66,cy+38,"log",{size:22})},
 steps:[
 {nav:"The card",go:async A=>{const s=A.st;await Promise.all([A.op(s.acc,0,300),A.op([s.keys,s.log],0,200)]);await A.op(s.card,1,400);await Promise.all([A.op(s.lin,0,250),A.op(s.rows,1,300)])},
  notes:[{at:"l0",t:"Every layer carries a card",b:["an ISO 19115 metadata record:","who owns it, when it was","captured, how accurate it is"],to:()=>[160,150]},
         {at:"r0",t:"A name to call",b:["the custodian department","and its nodal officer"],to:()=>[536,120]}]},
 {nav:"Lineage",go:async A=>{const s=A.st;await A.op(s.card,1,300);await A.op(s.rows,.0,350);await A.op(s.lin,1,500)},
  notes:[{at:"l0",t:"Lineage",b:["what was done to the data,","by whom, and when. The field","most often left out"],to:()=>[282,150]},
         {at:"r0",dy:220,t:"Two years later",b:["a layer disagrees with a","register. With lineage it takes","an hour; without it, a meeting"]}]},
 {nav:"Three tiers",go:async A=>{const s=A.st;await A.op(s.card,0,350);A.op([s.keys,s.log],0,200);await A.op(s.acc,1,500)},
  notes:[{at:"l0",t:"Three tiers",b:["public, departmental and","restricted layers"],to:()=>[100,120]},
         {at:"r0",t:"Checked at the service",b:["state single sign-on decides","who gets in, not the app","showing the map"],to:()=>[30,248],ring:22}]},
 {nav:"Permissions",go:async A=>{const s=A.st;await A.op(s.card,0,200);await A.op(s.acc,1,300);await A.op(s.keys,1,500);await A.op(s.log,1,400)},
  notes:[{at:"l0",t:"Four separate permissions",b:["view, query, download, edit.","Seeing a layer doesn't mean","you can change it"],to:()=>[95,490]},
         {at:"r0",t:"Restricted means logged",b:["every look at a restricted","layer is written down"],to:()=>[328,280],ring:20}]}]};

/* ============================================================ IN USE */
{const polys=G.stack.mines.split("M").filter(Boolean).map(p=>p.replace(/Z/g,"").split("L").map(v=>v.split(",").map(Number)));
 const dseg=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)};
 const inside=(p,P)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c}return c};
 const dist=(p,P)=>inside(p,P)?0:Math.min(...P.map((a,i)=>dseg(p,a,P[(i+1)%P.length])));
 const KM=5,R=KM*G.kmPx,hits=G.stack.aw.filter(p=>polys.some(P=>dist(p,P)<=R));
 SPEC.inuse={W:380,H:620,portH:560,next:"Update cycle",foot:"An illustrative query on sample leases and centres. The story will name a real, documented one.",
 draw(A){const s=A.st;s.L=A.lens(A.ill,{view:SVIEW});s.L.scalebar();const g=s.L.g;
  A.state(g);
  s.buf=el("path",{d:G.stack.mines,fill:"rgba(201,93,46,.16)",stroke:"rgba(201,93,46,.16)","stroke-width":R*2,"stroke-linejoin":"round",opacity:0},g);
  s.bufE=el("path",{d:G.stack.mines,fill:"none",stroke:"var(--dv-orange-500)","stroke-width":R*2,"stroke-linejoin":"round",opacity:0,"stroke-opacity":.0},g);
  el("path",{d:G.stack.mines,fill:"var(--dv-orange-500)",stroke:"var(--dv-orange-700)","stroke-width":1.2,"vector-effect":"non-scaling-stroke"},g);
  s.aw=G.stack.aw.map(p=>{const c=el("circle",{cx:p[0],cy:p[1],r:3.4,fill:"var(--dv-blue-500)",stroke:"#fff","stroke-width":.8},g);c._hit=hits.includes(p);return c});
  s.L.on(u=>{s.aw.forEach(c=>{c.setAttribute("r",(c._on?6:4.2)*u);c.setAttribute("stroke-width",(c._on?2:1)*u)})});
  s.list=el("g",{opacity:0},A.ill);A.rough(s.list,40,380,300,210,{fill:"#fffdf7"});A.hand(s.list,60,414,`${hits.length} centres within ${KM} km`,{size:27,bold:1});
  hits.slice(0,4).forEach((p,i)=>{const[lo,la]=xy2ll(p[0],p[1]);A.hand(s.list,60,452+i*32,`AWC-${String(100+i*37).padStart(5,"0")}  ${la.toFixed(3)}° N  ${lo.toFixed(3)}° E`,{size:24,mono:1,fill:"var(--n700)"})});
  A.hand(s.list,60,578,`… and ${Math.max(0,hits.length-4)} more (sample IDs)`,{size:19,fill:"var(--n500)"});
  s.mark=(on)=>{s.aw.forEach(c=>{c._on=on&&c._hit;c.setAttribute("fill",c._on?"var(--dv-blue-700)":on?"#b9c4ee":"var(--dv-blue-500)")});s.L.set(s.L.v)}},
 steps:[
 {nav:"The question",go:async A=>{const s=A.st;s.mark(false);await Promise.all([A.op([s.buf,s.list],0,300),s.L.fly(SVIEW,800)])},
  notes:[{at:"l0",t:"A question for two departments",b:["which Anganwadi centres sit","close to a mining lease?"],to:A=>A.st.L.ill([300,190])},
         {at:"r0",t:"Only possible on one base",b:["leases and centres snap to","the same villages, so the","two layers can be compared"],to:A=>A.st.L.ill(G.stack.aw[40])}]},
 {nav:`${KM} km buffer`,go:async A=>{const s=A.st;s.mark(false);A.op(s.list,0,200);await s.L.fly({cx:318,cy:178,w:150},1000);await A.op(s.buf,1,700)},
  notes:[{at:"l0",t:`A ${KM} km buffer`,c:"var(--dv-orange-700)",b:["drawn around every lease"],to:A=>A.st.L.ill([285,196])},
         {at:"r0",t:"Measured in metres",b:["in the state's projection,","never in degrees"]}]},
 {nav:"The answer",go:async A=>{const s=A.st;await s.L.fly({cx:318,cy:178,w:150},400);A.op(s.buf,1,200);s.mark(true);await A.wait(300)},
  notes:[{at:"l0",t:`${hits.length} centres inside`,c:"var(--dv-blue-700)",b:["picked out in seconds from","live services, not files"],to:A=>A.st.L.ill(hits.find(p=>p[0]>290&&p[0]<350&&p[1]>150&&p[1]<210)||hits[0]),ring:12},
         {at:"r0",t:"Re-run it any time",b:["when a lease or a centre","changes, the same question","gives the new answer"]}]},
 {nav:"A list to act on",go:async A=>{const s=A.st;s.mark(true);await s.L.fly({cx:300,cy:250,w:330},800);await A.op(s.list,1,500)},
  notes:[{at:"l0",t:"The output is a list",b:["IDs and locations a","department can act on"],to:()=>[340,420]},
         {at:"r0",t:"One real case goes here",b:["the story names the query,","what it returned and the","decision it fed"]}]}]}}

/* ============================================================ UPDATE CYCLE */
SPEC.update={W:540,H:540,portH:520,foot:"Schedules and records shown are examples.",
 draw(A){const s=A.st;const cx=270,cy=275;
  // 1 the calendar
  s.cal=el("g",{},A.ill);el("circle",{cx,cy,r:205,fill:"#fffdf7",stroke:"var(--n600)","stroke-width":2},s.cal);
  "JFMAMJJASOND".split("").forEach((m,i)=>{const a=-Math.PI/2+i/12*Math.PI*2;A.hand(s.cal,cx+Math.cos(a)*232,cy+Math.sin(a)*232+8,m,{size:24,anchor:"middle",fill:"var(--n700)"});
    el("circle",{cx:cx+Math.cos(a)*205,cy:cy+Math.sin(a)*205,r:9,fill:"var(--dv-blue-500)",stroke:"#fff","stroke-width":2},s.cal);
    if(i%3===2)el("rect",{x:cx+Math.cos(a)*150-10,y:cy+Math.sin(a)*150-10,width:20,height:20,fill:"var(--dv-aqua-600)",stroke:"#fff","stroke-width":2,transform:`rotate(45 ${cx+Math.cos(a)*150} ${cy+Math.sin(a)*150})`},s.cal)});
  A.hand(s.cal,cx,cy-14,"Revenue boundaries:",{size:25,bold:1,anchor:"middle"});A.hand(s.cal,cx,cy+18,"only when",{size:24,anchor:"middle"});A.hand(s.cal,cx,cy+46,"something changes",{size:24,anchor:"middle"});
  // 2 a boundary moves
  s.bnd=el("g",{opacity:0},A.ill);A.rough(s.bnd,10,10,520,520,{fill:"#fbfaf8",stroke:"#d9d4cc"});
  s.vA=el("path",{fill:"#f6f1e8",stroke:"none"},s.bnd);s.vB=el("path",{fill:"#eef3ea",stroke:"none"},s.bnd);
  s.edge=el("path",{fill:"none",stroke:"var(--n800)","stroke-width":2.6,"stroke-linejoin":"round"},s.bnd);
  s.lA=A.hand(s.bnd,80,90,"Village A",{size:28,bold:1});s.lB=A.hand(s.bnd,360,90,"Village B",{size:28,bold:1});
  s.pt=el("circle",{cx:236,cy:300,r:11,fill:"var(--dv-blue-500)",stroke:"#fff","stroke-width":3},s.bnd);s.tag=A.hand(s.bnd,258,308,"counted in A",{size:24,fill:"var(--n800)"});
  s.setEdge=t=>{const xs=[300,286,lerp(290,190,t),lerp(282,176,t),lerp(296,210,t),300],ys=[20,120,220,330,430,520];const P=xs.map((x,i)=>[x,ys[i]]);
    const d="M"+P.map(p=>p.join(",")).join(" L");s.edge.setAttribute("d",d);s.vA.setAttribute("d",`M20,20 ${P.map(p=>"L"+p).join(" ")} L20,520Z`);s.vB.setAttribute("d",`M520,20 ${P.map(p=>"L"+p).join(" ")} L520,520Z`)};
  s.setEdge(0);
  // 3 records revised in place
  s.rec=el("g",{opacity:0},A.ill);
  A.rough(s.rec,60,60,420,170,{fill:"#fff"});A.hand(s.rec,84,104,"AWC-RPR-00412",{size:32,mono:1,bold:1});A.hand(s.rec,84,150,"status",{size:23,fill:"var(--n600)"});A.hand(s.rec,84,196,"version",{size:23,fill:"var(--n600)"});
  s.st1=A.hand(s.rec,210,150,"Functional",{size:26});s.v1=A.hand(s.rec,210,196,"3",{size:26});
  s.hl=el("path",{d:"M202,145 L420,143",stroke:"rgba(247,214,90,.85)","stroke-width":26,"stroke-linecap":"round",opacity:0},s.rec);s.rec.insertBefore(s.hl,s.st1);
  s.old=el("g",{},s.rec);A.rough(s.old,60,300,420,150,{fill:"#fff"});A.hand(s.old,84,344,"AWC-RPR-00388",{size:32,mono:1,bold:1});A.hand(s.old,84,392,"status",{size:23,fill:"var(--n600)"});A.hand(s.old,210,392,"Closed",{size:26});
  s.stamp=el("g",{opacity:0},s.rec);el("rect",{x:300,y:350,width:160,height:52,rx:6,fill:"none",stroke:"var(--red-500)","stroke-width":3,transform:"rotate(-8 380 376)"},s.stamp);A.hand(s.stamp,380,388,"INACTIVE",{size:30,bold:1,anchor:"middle",fill:"var(--red-500)",rot:-8});
  // 4 what follows
  s.chain=el("g",{opacity:0},A.ill);s.ticks=[];
  ["Services refresh","Map caches rebuild","Metadata dates move on","Subscribers are told"].forEach((t,i)=>{const y=40+i*125;A.rough(s.chain,110,y,320,76,{fill:"#fff"});A.hand(s.chain,136,y+46,t,{size:27});
    s.ticks.push(el("path",{d:`M392,${y+38} L402,${y+50} L420,${y+24}`,fill:"none",stroke:"var(--green-500)","stroke-width":4,"stroke-linecap":"round","stroke-linejoin":"round",pathLength:1,"stroke-dasharray":1,"stroke-dashoffset":1},s.chain));
    if(i<3)el("path",{d:`M270,${y+80} L270,${y+120} M262,${y+110} L270,${y+121} L278,${y+110}`,fill:"none",stroke:"var(--n600)","stroke-width":2,"stroke-linecap":"round"},s.chain)});
  s.scene=k=>Promise.all(["cal","bnd","rec","chain"].map(n=>A.op(s[n],n===k?1:0,400)))},
 steps:[
 {nav:"On a schedule",go:async A=>{await A.st.scene("cal")},
  notes:[{at:"l0",t:"Thematic layers resubmit",b:["on a schedule: scheme","progress every month (dots),","inventories each quarter"],to:()=>[270,70]},
         {at:"r0",t:"Boundaries don't",b:["Revenue sends them only","when something changes:","a new tehsil, a redrawn village"],to:()=>[380,280]}]},
 {nav:"A boundary moves",go:async A=>{const s=A.st;s.setEdge(0);s.tag.textContent="counted in A";await s.scene("bnd");await A.wait(400);await A.tw(1100,t=>s.setEdge(t));s.tag.textContent="now counted in B"},
  notes:[{at:"l0",t:"Revenue redraws a village",b:["one boundary moves"],to:()=>[190,320]},
         {at:"r0",t:"Every layer follows",b:["everything snapped to it moves","too: this centre now counts","in its new village"],to:()=>[236,300],ring:18}]},
 {nav:"Revise, don't copy",go:async A=>{const s=A.st;s.st1.textContent="Functional";s.v1.textContent="3";s.hl.style.opacity=0;s.stamp.style.opacity=0;s.old.style.opacity=1;await s.scene("rec");await A.wait(400);
   await A.op(s.hl,1,300);s.st1.textContent="Under repair";s.v1.textContent="4";await A.wait(300);await Promise.all([A.op(s.old,.45,400),A.op(s.stamp,1,400)])},
  notes:[{at:"l0",dy:64,t:"Matched on a stable ID",b:["a revision updates the row;","it never adds a second one"],to:()=>[62,146]},
         {at:"r0",t:"Retired, not deleted",b:["a closed centre is flagged","inactive, so its history","stays on record"],to:()=>[380,378]}]},
 {nav:"What follows",go:async A=>{const s=A.st;s.ticks.forEach(t=>t.setAttribute("stroke-dashoffset",1));await s.scene("chain");for(const t of s.ticks){await A.draw(t,1,350)}},
  notes:[{at:"l0",t:"One update, four follow-ons",b:["all automatic, in order"],to:()=>[110,78]},
         {at:"r0",t:"No one has to go looking",b:["apps and agencies that","subscribe hear about it"],to:()=>[430,452]}]}]};

INIT.intake=()=>Sketch("intake",SPEC.intake);
INIT.provenance=()=>Sketch("provenance",SPEC.provenance);
INIT.inuse=()=>Sketch("inuse",SPEC.inuse);
INIT.update=()=>Sketch("update",SPEC.update);
INIT.conversion=()=>Sketch("conversion",SPEC.conversion);
INIT.projection=()=>Sketch("projection",SPEC.projection);
INIT.cartography=()=>Sketch("cartography",SPEC.cartography);
