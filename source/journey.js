/* ============================================================ JOURNEY
   One record, AWC-RPR-00412, followed through the pipeline. Each section is its own view (#j-...).
   The frame scrolls on its own: the stage on the right stays put, handwritten notes scroll past on the
   left, and each note plays its step on the stage as it crosses the middle of the frame. */
const REC={id:"AWC-RPR-00412",lat:21.251384,lon:81.629641};REC.xy=ll2xy(REC.lon,REC.lat);
const seg=(p,a,b)=>clamp((p-a)/(b-a),0,1);
const jnote=n=>`<div class="fl-note">${n.pre?`<div class="pre">${n.pre.map(s=>`<span>${s}</span>`).join("")}</div>`:""}<div class="t"${n.c?` style="color:${n.c}"`:""}><span>${n.t}</span></div><div class="b">${n.b.map(s=>`<span>${s}</span>`).join("")}</div></div>`;
const DOWN='<svg width="22" height="28" viewBox="0 0 24 30" style="overflow:visible"><path d="M8 2 C 14 9, 4 16, 12 26 M6.5 20.5 L12.2 26.4 L15.6 19.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const NSS={"vector-effect":"non-scaling-stroke"};
const J={
  hand(g,x,y,s,{size=22,anchor="start",fill,bold,rot,op}={}){const t=txt({x,y,class:"h","font-size":size,"text-anchor":anchor},g,s);if(fill)t.style.fill=fill;if(bold)t.setAttribute("font-weight",700);if(rot)t.setAttribute("transform",`rotate(${rot} ${x} ${y})`);if(op!=null)t.setAttribute("opacity",op);return t},
  mono(g,x,y,s,{size=13,anchor="start",fill,bold}={}){const t=txt({x,y,class:"m","font-size":size,"text-anchor":anchor},g,s);if(fill)t.style.fill=fill;if(bold)t.setAttribute("font-weight",700);return t},
  paper(g,x,y,w,h,ctx,{r=10,fill="#fbfaf8"}={}){el("rect",{x:x+4,y:y+8,width:w,height:h,rx:r,fill:"rgba(60,50,40,.13)",filter:ctx.sh},g);return el("rect",{x,y,width:w,height:h,rx:r,fill,stroke:"#d9d3ca","stroke-width":1},g)},
  plate(g,ctx,{k=.8,cx=300,cy=262,dist="#e0dbd3",dw=1,edge="#a39c92"}={}){const tx=cx-260*k,ty=cy-320*k,m=el("g",{transform:`translate(${tx} ${ty}) scale(${k})`},g);
    el("path",{d:G.state,fill:"rgba(60,50,40,.14)",transform:"translate(5 9)",filter:ctx.sh},m);el("path",{d:G.state,fill:"#fbfaf8"},m);
    const ds=G.districts.map(d=>el("path",{d:d.d,fill:"none",stroke:dist,"stroke-width":dw,...NSS},m));
    const e=el("path",{d:G.state,fill:"none",stroke:edge,"stroke-width":1.6,"stroke-linejoin":"round",...NSS},m);
    return{m,ds,e,k,P:(x,y)=>[tx+x*k,ty+y*k]}},
  zoom(g,ctx,{c=REC.xy,w=5,roads=false,vill=true,box=[30,22,540,476]}={}){const[X,Y,Wd,Ht]=box,k=Wd/w,cx=X+Wd/2,cy=Y+Ht/2,tx=cx-c[0]*k,ty=cy-c[1]*k,cid=ctx.id+"-z"+(J.zc=(J.zc||0)+1);
    J.paper(g,X,Y,Wd,Ht,ctx);const cp=el("clipPath",{id:cid},ctx.defs);el("rect",{x:X,y:Y,width:Wd,height:Ht,rx:10},cp);
    const o=el("g",{"clip-path":`url(#${cid})`},g),m=el("g",{transform:`translate(${tx} ${ty}) scale(${k})`},o);
    if(vill)G.carto.village.forEach((d,i)=>el("path",{d,fill:i%3===0?"#f8f5f0":i%3===1?"#f4f0ea":"#fbfaf7",stroke:"#d6cfc4","stroke-width":.8,...NSS},m));
    if(roads)el("path",{d:G.carto.roads,fill:"none",stroke:"#e7c7a5","stroke-width":1.3,...NSS},m);
    return{m,o,k,P:(x,y)=>[tx+x*k,ty+y*k]}},
  world(g,ctx,{lon0,lon1,lat0,lat1,box=[30,22,540,476]}){const ex=l=>(l+180)/360*640,ey=l=>(90-l)/180*320,[X,Y,Wd,Ht]=box;
    const k=Math.min(Wd/(ex(lon1)-ex(lon0)),Ht/(ey(lat0)-ey(lat1))),tx=X+(Wd-(ex(lon1)-ex(lon0))*k)/2-ex(lon0)*k,ty=Y+(Ht-(ey(lat0)-ey(lat1))*k)/2-ey(lat1)*k,cid=ctx.id+"-w"+(J.zc=(J.zc||0)+1);
    J.paper(g,X,Y,Wd,Ht,ctx,{fill:"#eef3f6"});const cp=el("clipPath",{id:cid},ctx.defs);el("rect",{x:X,y:Y,width:Wd,height:Ht,rx:10},cp);
    const o=el("g",{"clip-path":`url(#${cid})`},g),m=el("g",{transform:`translate(${tx} ${ty}) scale(${k})`},o);
    el("path",{d:G.world.land,fill:"#fbfaf8",stroke:"#c9c1b5","stroke-width":.8,...NSS},m);el("path",{d:G.world.cg,fill:"#e9dcc6",stroke:"#8f887e","stroke-width":1,...NSS},m);
    return{o,m,k,P:(lon,lat)=>[tx+ex(lon)*k,ty+ey(lat)*k]}},
  card(g,x,y,title,rows,{w=250,lh=20,kw=104,fill="#fff"}={}){const c=el("g",{},g),h=38+rows.length*lh;
    el("rect",{x:x+3,y:y+6,width:w,height:h,rx:8,fill:"rgba(60,50,40,.12)"},c);el("rect",{x,y,width:w,height:h,rx:8,fill,stroke:"#d9d3ca"},c);
    if(title)J.hand(c,x+12,y+24,title,{size:21,bold:1,fill:"var(--n950)"});
    const vals=rows.map((r,i)=>{J.mono(c,x+12,y+48+i*lh,r[0],{size:11.5,fill:"var(--n500)"});return J.mono(c,x+12+kw,y+48+i*lh,r[1],{size:12.5})});
    return{c,vals,h,row:i=>y+44+i*lh}},
  stamp(g,x,y,s,col,rot=-9){const st=el("g",{transform:`translate(${x} ${y}) rotate(${rot})`,opacity:0},g);const t=J.mono(st,0,6,s,{size:17,anchor:"middle",fill:col,bold:1});t.setAttribute("letter-spacing","3");
    const w=s.length*12+26;el("rect",{x:-w/2,y:-16,width:w,height:30,rx:5,fill:"none",stroke:col,"stroke-width":2.4},st);return st},
  tick(g,x,y,col="var(--green-500)",s=1){return el("path",{d:`M${x-7*s},${y} L${x-2*s},${y+6*s} L${x+9*s},${y-8*s}`,fill:"none",stroke:col,"stroke-width":2.6,"stroke-linecap":"round","stroke-linejoin":"round"},g)},
  cross(g,x,y,col="var(--red-500)",s=1){return el("path",{d:`M${x-7*s},${y-7*s} L${x+7*s},${y+7*s} M${x+7*s},${y-7*s} L${x-6*s},${y+7*s}`,fill:"none",stroke:col,"stroke-width":2.6,"stroke-linecap":"round"},g)},
  pin(g,col="var(--n900)",s=1){const p=el("g",{},g);el("path",{d:`M0,0 C${-9*s},${-12*s} ${-10*s},${-18*s} ${-10*s},${-22*s} A${10*s},${10*s} 0 1 1 ${10*s},${-22*s} C${10*s},${-18*s} ${9*s},${-12*s} 0,0Z`,fill:col,stroke:"#fff","stroke-width":1.5},p);el("circle",{cx:0,cy:-22*s,r:3.6*s,fill:"#fff"},p);return p},
  // a pen stroke with an open head; returns {g,set(p)} where p draws it in
  arrow(g,a,b,bend=.2,{head=true,w=2,col="var(--n800)",dash}={}){const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d,W=bend*d,f=p=>p.map(v=>v.toFixed(1)).join(",");
    const c1=[a[0]+dx*.3+nx*W,a[1]+dy*.3+ny*W],c2=[a[0]+dx*.72+nx*W*.45,a[1]+dy*.72+ny*W*.45],ex=b[0]-c2[0],ey=b[1]-c2[1],l=Math.hypot(ex,ey)||1,ux=ex/l,uy=ey/l;
    const h=(t,s)=>[b[0]-s*(ux*Math.cos(t)-uy*Math.sin(t)),b[1]-s*(uy*Math.cos(t)+ux*Math.sin(t))];const o=el("g",{},g);
    const sh=el("path",{d:`M${f(a)} C${f(c1)} ${f(c2)} ${f(b)}`,fill:"none",stroke:col,"stroke-width":w,"stroke-linecap":"round",pathLength:1,"stroke-dasharray":dash?"0.012 0.018":1,"stroke-dashoffset":dash?0:1},o);
    const hd=head?el("path",{d:`M${f(h(.5,12))} L${f(b)} L${f(h(-.45,10))}`,fill:"none",stroke:col,"stroke-width":w,"stroke-linecap":"round","stroke-linejoin":"round",opacity:0},o):null;
    return{g:o,set(p){if(dash)o.setAttribute("opacity",p>0?1:0),sh.setAttribute("stroke-dasharray",`${(.012*p).toFixed(4)} ${(.012*(1-p)+.018).toFixed(4)}`);else sh.setAttribute("stroke-dashoffset",1-p);hd&&hd.setAttribute("opacity",p>.96?1:0)}}},
  draw(path){path.setAttribute("pathLength",1);path.setAttribute("stroke-dasharray",1);path.setAttribute("stroke-dashoffset",1);return p=>path.setAttribute("stroke-dashoffset",1-p)},
  db(g,x,y,label){const c=el("g",{transform:`translate(${x} ${y})`},g);el("path",{d:"M-46,-50 L-46,48 A46,14 0 0 0 46,48 L46,-50",fill:"#fbfaf8",stroke:"var(--n700)","stroke-width":2},c);
    el("ellipse",{cx:0,cy:-50,rx:46,ry:14,fill:"#f1ede6",stroke:"var(--n700)","stroke-width":2},c);[-10,20].forEach(v=>el("path",{d:`M-46,${v} A46,14 0 0 0 46,${v}`,fill:"none",stroke:"var(--n300)","stroke-width":1.4},c));
    if(label)J.hand(c,0,92,label,{size:22,anchor:"middle"});return c},
  file(g,x,y,ext,sub,{w=112,col="var(--n800)"}={}){const c=el("g",{transform:`translate(${x} ${y})`},g);el("rect",{x:3,y:6,width:w,height:132,rx:6,fill:"rgba(60,50,40,.1)"},c);
    el("path",{d:`M0,0 H${w-24} L${w},24 V132 H0Z`,fill:"#fff",stroke:"#cfc8bd"},c);el("path",{d:`M${w-24},0 V24 H${w}`,fill:"none",stroke:"#cfc8bd"},c);
    J.mono(c,w/2,74,ext,{size:18,anchor:"middle",bold:1,fill:col});if(sub)sub.split("|").forEach((s,i)=>J.hand(c,w/2,102+i*19,s,{size:18,anchor:"middle"}));return c}
};

function journey(id,cfg){VIEWS[id]=cfg.title;INIT[id]=()=>{
  const V=$("#"+id);V.classList.add("jv");
  V.innerHTML=`<div class="hd"><h1>${cfg.title}</h1></div><div class="jw"><div class="jst"><svg class="jsv" viewBox="0 0 600 520" role="img" aria-label="${cfg.title}"></svg><div class="jrec" aria-live="polite"></div><button type="button" class="jtry"></button></div><div class="jns"><div class="jhint">scroll here, it plays as you go ${DOWN}</div></div></div><svg class="jar" aria-hidden="true"><path/><path/></svg>`;
  const S=V.querySelector(".jsv"),NT=V.querySelector(".jns"),AR=V.querySelector(".jar"),RC=V.querySelector(".jrec"),TR=V.querySelector(".jtry"),hint=V.querySelector(".jhint");
  const defs=el("defs",{},S);defs.innerHTML=`<filter id="${id}-sh" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>`;
  const ctx={S,defs,id,sh:`url(#${id}-sh)`};
  const beats=cfg.beats.map((b,i)=>{const g=el("g",{class:"jb"},S);const R=b.build(g,ctx)||{};const n=document.createElement("div");n.className="jn";n.innerHTML=jnote(b);NT.appendChild(n);
    const sr=document.createElement("p");sr.className="sr";sr.textContent=[...(b.pre||[]),b.t,...b.b].join(" ").replace(/<[^>]+>/g,"");n.appendChild(sr);return Object.assign({},b,R,{g,n,i,seen:false,p:0})});
  const end=document.createElement("div");end.className="jend";end.innerHTML=(cfg.end?`<p>${cfg.end}</p>`:"")+(cfg.next?`<span class="nx">${cfg.next} ${DOWN}</span>`:"");NT.appendChild(end);
  const[as,ah]=AR.querySelectorAll("path");as.setAttribute("pathLength",1);as.setAttribute("stroke-dasharray",1);
  let active=-1,raf=0;
  TR.onclick=()=>{const b=beats[active];if(b&&b.try){b.try.fn();kick()}};
  const scr=pt=>{const m=S.getScreenCTM();return[m.a*pt[0]+m.c*pt[1]+m.e,m.b*pt[0]+m.d*pt[1]+m.f]};
  function frame(){raf=0;const vh=innerHeight,narrow=innerWidth<=700,line=vh*(narrow?.8:.58);let act=0;
    beats.forEach((b,i)=>{const r=b.n.getBoundingClientRect();b.p=clamp((line-r.top)/Math.max(1,r.height*.9),0,1);if(r.top<line)act=i;
      if(!b.seen&&r.top<vh*.9){b.seen=true;const note=b.n.querySelector(".fl-note");note.querySelectorAll("span").forEach((s,k)=>s.style.transitionDelay=(REDUCE?0:k*.16)+"s");note.classList.add("on")}});
    if(scrollY>24)hint.classList.add("gone");
    if(act!==active){active=act;beats.forEach((b,i)=>{b.g.classList.toggle("on",cfg.cumulative?i<=act:i===act);b.n.classList.toggle("act",i===act)});
      const b=beats[act];b.enter&&b.enter();const rec=b.rec??cfg.rec;RC.innerHTML=rec||"";RC.classList.toggle("on",!!rec);TR.textContent=b.try?b.try.label:"";TR.classList.toggle("on",!!b.try)}
    if(cfg.cumulative)beats.forEach((b,i)=>{if(i<active&&b.scrub)b.scrub(1)});
    const b=beats[active];b.scrub&&b.scrub(REDUCE?Math.max(b.p,.999):b.p);
    const f=b.feat&&b.feat(),t=b.n.querySelector(".t").getBoundingClientRect();
    if(f&&t.bottom>0&&t.top<vh){const q=scr(f),a=narrow?[t.left+t.width/2,t.top-6]:[t.right+14,t.top+t.height*.55],d=Math.hypot(q[0]-a[0],q[1]-a[1])||1,e=[q[0]-(q[0]-a[0])/d*10,q[1]-(q[1]-a[1])/d*10];
      const dx=e[0]-a[0],dy=e[1]-a[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,W=(b.i%2?.16:-.16)*L*(narrow?-1:1),c1=[a[0]+dx*.3+nx*W,a[1]+dy*.3+ny*W],c2=[a[0]+dx*.72+nx*W*.45,a[1]+dy*.72+ny*W*.45];
      const ux=(e[0]-c2[0]),uy=(e[1]-c2[1]),ul=Math.hypot(ux,uy)||1,hx=ux/ul,hy=uy/ul,hh=(r,s)=>[e[0]-s*(hx*Math.cos(r)-hy*Math.sin(r)),e[1]-s*(hy*Math.cos(r)+hx*Math.sin(r))].map(v=>v.toFixed(1)).join(",");
      const dp=REDUCE?1:clamp(b.p*3.4,0,1);as.setAttribute("d",`M${a} C${c1} ${c2} ${e}`);as.setAttribute("stroke-dashoffset",1-dp);ah.setAttribute("d",`M${hh(.5,13)} L${e} L${hh(-.45,11)}`);ah.style.opacity=dp>.95?1:0;as.style.opacity=1}
    else{as.style.opacity=0;ah.style.opacity=0}}
  const kick=()=>{if(!raf)raf=requestAnimationFrame(frame)};
  addEventListener("scroll",kick,{passive:true});addEventListener("resize",kick);
  document.fonts.load('700 30px "Caveat"').then(()=>document.fonts.load('400 24px "Caveat"')).catch(()=>{}).then(kick)}}

/* ---------------- shared bits for the record ---------------- */
const recHTML=(title,rows)=>`<b>${title}</b> `+rows.map(r=>r[0]==="id"?r[1]:r[0]==="lat"?r[1]+",":r[0]==="lon"?r[1]:`<i>${r[0]}</i> ${r[1]}`).join(" &nbsp;");
const REC_BASE=[["id",REC.id],["lat",REC.lat.toFixed(6)],["lon",REC.lon.toFixed(6)]];

/* ============================================================ INTRO */
journey("j-intro",{title:"One base, many departments",cumulative:true,
  end:"This is the pipeline that brings them together, and the checks that keep what reaches the map dependable.",next:"next: Intake",
  beats:[
  {t:"Spatial data reaches the Geoportal",b:["from departments across","Chhattisgarh, and it all has to","land on one map"],build(g,ctx){const P=J.plate(g,ctx,{dist:"none"});const d=J.draw(P.e);return{P,scrub:p=>d(seg(p,0,.6)),feat:()=>P.P(79,300)}}},
  {c:"var(--n950)",t:"The Revenue Department",b:["supplies the base: district, tehsil,","block and village boundaries","for the whole state"],build(g,ctx){const k=.8,tx=300-260*k,ty=262-320*k,m=el("g",{transform:`translate(${tx} ${ty}) scale(${k})`},g);
    const ds=G.districts.map(d=>el("path",{d:d.d,fill:"none",stroke:"#8f887e","stroke-width":1.3,...NSS},m)).map(J.draw);return{scrub:p=>ds.forEach((f,i)=>f(seg(p,i/ds.length*.4,.3+i/ds.length*.5))),feat:()=>[tx+140*k,ty+250*k]}}},
  {pre:["Every other department's data","arrives on top of that base,","in its own format, to its own schedule."],c:"var(--dv-orange-700)",t:"Mining",b:["lease boundaries"],build(g){const k=.8,tx=300-260*k,ty=262-320*k,m=el("g",{transform:`translate(${tx} ${ty}) scale(${k})`},g);
    const ps=G.stack.mines.split("M").filter(Boolean).map(s=>el("path",{d:"M"+s,fill:"var(--dv-orange-500)",stroke:"var(--dv-orange-700)","stroke-width":1.2,...NSS,opacity:0},m));
    return{scrub:p=>ps.forEach((e,i)=>e.setAttribute("opacity",seg(p,i/ps.length*.5,i/ps.length*.5+.15))),feat:()=>[tx+150*k,ty+346*k]}}},
  {c:"var(--dv-blue-700)",t:"Anganwadi",b:["centres, as points"],build(g){const k=.8,tx=300-260*k,ty=262-320*k,m=el("g",{transform:`translate(${tx} ${ty}) scale(${k})`},g);
    const pts=G.stack.aw.map(p=>el("circle",{cx:p[0],cy:p[1],r:3.6,fill:"var(--dv-blue-500)",opacity:0},m));const pk=near2(G.stack.aw,[380,170]);
    return{scrub:p=>pts.forEach((e,i)=>e.setAttribute("opacity",p*1.4>i/pts.length?1:0)),feat:()=>[tx+pk[0]*k,ty+pk[1]*k]}}},
  {c:"var(--dv-aqua-700)",t:"BharatNet",b:["fibre routes and GP nodes"],build(g){const k=.8,tx=300-260*k,ty=262-320*k,m=el("g",{transform:`translate(${tx} ${ty}) scale(${k})`},g);
    const f=J.draw(el("path",{d:G.stack.fibre,fill:"none",stroke:"var(--dv-aqua-600)","stroke-width":2.6,"stroke-linecap":"round",...NSS},m));
    const gp=G.stack.gp.map(p=>el("circle",{cx:p[0],cy:p[1],r:5,fill:"#fff",stroke:"var(--dv-aqua-600)","stroke-width":2,opacity:0},m));const pk=near2(G.stack.gp,[400,400]);
    return{scrub:p=>{f(seg(p,0,.7));gp.forEach(e=>e.setAttribute("opacity",p>.7?1:0))},feat:()=>[tx+pk[0]*k,ty+pk[1]*k]}}},
  {c:"var(--n950)",t:"The work: merge it all",b:["onto one set of boundaries and","one coordinate system, so that","a village means the same","village in every layer"],build(g){const k=.8,tx=300-260*k,ty=262-320*k,P=(x,y)=>[tx+x*k,ty+y*k],c=P(...REC.xy);
    let d="";for(let i=0;i<=48;i++){const a=-2.3+i/48*(Math.PI*2+.75),rr=19*(1+.07*Math.sin(a*3+.6)+i*.0024);d+=(i?"L":"M")+(c[0]+Math.cos(a)*rr*1.2).toFixed(1)+","+(c[1]+Math.sin(a)*rr).toFixed(1)}
    const r=J.draw(el("path",{d,fill:"none",stroke:"var(--n950)","stroke-width":2.4,"stroke-linecap":"round"},g));const dot=el("circle",{cx:c[0],cy:c[1],r:5,fill:"rgba(247,214,90,.95)",stroke:"var(--n950)","stroke-width":1.5,opacity:0},g);
    return{scrub:p=>{r(seg(p,.05,.5));dot.setAttribute("opacity",p>.3?1:0)},feat:()=>[c[0]-26,c[1]]}}},
  {c:"var(--n950)",t:"162 layers, 42 departments",b:["published to one standard.","Three applications already run on it:","Mining, Anganwadi and BharatNet"],build(g){const t=J.hand(g,40,470,"0",{size:66,bold:1,fill:"var(--n950)"});J.hand(g,40,498,"layers on one base",{size:22});
    return{scrub:p=>t.textContent=Math.round(162*seg(p,0,.6)),feat:()=>[44,440]}}}
]});
function near2(arr,q){return arr.reduce((a,b)=>Math.hypot(b[0]-q[0],b[1]-q[1])<Math.hypot(a[0]-q[0],a[1]-q[1])?b:a)}

/* ============================================================ INTAKE */
journey("j-intake",{title:"Intake: one record, four checks",next:"next: Conversion",end:"The record passed. It moves on to become geometry.",
  rec:recHTML("the record",REC_BASE),
  beats:[
  {pre:["Meet the record we'll follow:","an Anganwadi centre in Raipur."],t:"Submitted on a fixed template",b:["decimal degrees to six places,","declared as EPSG:4326, a stable","asset ID, and LGD codes for district,","tehsil, block and village"],rec:"",build(g,ctx){
    const rows=[["asset_id",REC.id],["latitude",REC.lat.toFixed(6)],["longitude",REC.lon.toFixed(6)],["crs","EPSG:4326"],["lgd_district","[code]"],["lgd_tehsil","[code]"],["lgd_block","[code]"],["lgd_village","[code]"]];
    const c=J.card(g,120,90,"Department template · one row",rows.map(r=>[r[0],""]),{w:360,lh:30,kw:130});J.hand(g,300,470,"six decimals, every time",{size:24,anchor:"middle",rot:-2});
    return{scrub:p=>c.vals.forEach((v,i)=>{const s=rows[i][1],q=seg(p,i*.08,i*.08+.2);v.textContent=s.slice(0,Math.round(s.length*q))}),feat:()=>[240,c.row(1)-4]}}},
  {pre:["Every submission is validated","before anything is converted."],t:"Outside the envelope",b:["Chhattisgarh spans 17.78°–24.11° N,","80.25°–84.40° E. Swap lat and long","and the record lands far outside it"],build(g,ctx){
    const W=J.world(g,ctx,{lon0:0,lon1:112,lat0:-12,lat1:86});const a=W.P(80.25,24.11),b=W.P(84.4,17.78);
    el("rect",{x:a[0],y:a[1],width:b[0]-a[0],height:b[1]-a[1],fill:"none",stroke:"var(--n900)","stroke-width":1.6,"stroke-dasharray":"4 3"},W.o);J.hand(W.o,b[0]+10,b[1]+20,"the envelope",{size:20});
    const bad=W.P(REC.lat,REC.lon),good=W.P(REC.lon,REC.lat),pn=J.pin(W.o,"var(--red-500)",1.1),x=J.cross(W.o,bad[0]+22,bad[1]-30),ok=J.tick(W.o,good[0]+20,good[1]-30);
    const lab=J.hand(W.o,bad[0]+36,bad[1]-6,"lat and long swapped: 81.63° N!",{size:20,fill:"var(--red-700)"});let swap=false,cur=bad;
    return{try:{label:"swap lat/long",fn:()=>swap=!swap},scrub:p=>{let q=seg(p,.35,.7);if(swap)q=1-q;cur=[lerp(bad[0],good[0],ease(q)),lerp(bad[1],good[1],ease(q))-Math.sin(q*Math.PI)*60];
      pn.setAttribute("transform",`translate(${cur[0]} ${cur[1]})`);pn.firstChild.setAttribute("fill",q>.98?"var(--green-500)":"var(--red-500)");x.setAttribute("opacity",q<.02?1:0);lab.setAttribute("opacity",q<.02?1:0);ok.setAttribute("opacity",q>.98?1:0)},feat:()=>[cur[0],cur[1]-26]}}},
  {t:"Null island",b:["empty fields saved as zero,","clustering at 0, 0"],build(g,ctx){const W=J.world(g,ctx,{lon0:-28,lon1:108,lat0:-24,lat1:62});const z=W.P(0,0);
    const dots=[...Array(46)].map((_,i)=>{const a=i*2.4,r=2+Math.sqrt(i)*2.3;return el("circle",{cx:z[0]+Math.cos(a)*r,cy:z[1]+Math.sin(a)*r,r:2.6,fill:"var(--red-500)",opacity:0},W.o)});
    J.hand(W.o,z[0]+14,z[1]+36,"0, 0 · Gulf of Guinea",{size:20,fill:"var(--red-700)"});const n=J.hand(W.o,z[0]-16,z[1]-24,"",{size:22,anchor:"end",fill:"var(--red-700)"});
    const good=W.P(REC.lon,REC.lat),pn=J.pin(W.o,"var(--green-500)",1);pn.setAttribute("transform",`translate(${good})`);J.tick(W.o,good[0]+20,good[1]-28);J.hand(W.o,good[0]+12,good[1]+22,"ours: fine",{size:19});
    return{scrub:p=>{const c=Math.round(dots.length*seg(p,.05,.7));dots.forEach((d,i)=>d.setAttribute("opacity",i<c?.85:0));n.textContent=c?`${c} empty rows`:""},feat:()=>[z[0]-8,z[1]]}}},
  {t:"Insufficient precision",b:["two decimal places locates an asset","within a kilometre: enough to","count, not enough to dispatch"],build(g,ctx){const Z=J.zoom(g,ctx,{w:5,roads:true});const c=Z.P(...REC.xy);
    const circ=el("circle",{cx:c[0],cy:c[1],r:2,fill:"rgba(221,43,14,.1)",stroke:"var(--red-500)","stroke-width":2,"stroke-dasharray":"5 4"},Z.o);el("circle",{cx:c[0],cy:c[1],r:4.5,fill:"var(--n950)"},Z.o);
    const lat=J.mono(g,300,68,"",{size:22,anchor:"middle",bold:1}),lab=J.hand(g,300,488,"",{size:23,anchor:"middle"});let R=2;
    return{scrub:p=>{const dec=6-Math.round(seg(p,.1,.8)*4),km=.5566*Math.pow(10,2-dec);R=Math.max(3,km*G.kmPx*Z.k);circ.setAttribute("r",R);
      lat.textContent=REC.lat.toFixed(dec)+", "+REC.lon.toFixed(dec);lab.textContent=`${dec} decimals: somewhere within ${km>=1?km.toFixed(1)+" km":km>=.01?Math.round(km*1000)+" m":(km*1000).toFixed(1)+" m"}`},feat:()=>[c[0]-R,c[1]]}}},
  {t:"Duplicate IDs",b:["the same asset, submitted by two","offices under two spellings"],build(g){const A=J.card(g,70,110,"from the district office",[["asset_id","AWC-RPR-00412"],["lat, lon","21.251384, 81.629641"]],{w:300,kw:80});
    const Bg=el("g",{},g);const B=J.card(Bg,0,0,"from the block office",[["asset_id","AWC-RPR-412"],["lat, lon","21.251384, 81.629641"]],{w:300,kw:80});const st=J.stamp(Bg,150,48,"DUPLICATE","var(--red-500)");let pos=[250,330];
    return{scrub:p=>{const q=ease(seg(p,.05,.55));pos=[lerp(250,110,q),lerp(330,190,q)];Bg.setAttribute("transform",`translate(${pos})`);st.setAttribute("opacity",p>.62?1:0)},feat:()=>[pos[0],pos[1]+50]}}},
  {t:"Nothing is silently corrected",b:["In [FY 2025–26], [N] of [M] records","were returned with a","record-level error report"],build(g){
    const c=J.card(g,40,110,"our record",[["envelope","inside"],["0, 0","no"],["decimals","6"],["asset_id","unique"]],{w:230,kw:90});[0,1,2,3].forEach(i=>J.tick(g,250,c.row(i)));const st=J.stamp(g,160,300,"ACCEPTED","var(--green-500)",-6);
    const r=el("g",{},g);J.paper(r,320,90,250,320,{sh:"none"},{fill:"#fff"});J.hand(r,336,122,"error report · returned",{size:21,bold:1,fill:"var(--red-700)"});
    const lines=[["row 214","lat/long swapped"],["row 377","empty: 0, 0"],["row 402","2 decimals"],["row 519","duplicate ID"]].map((l,i)=>{const e=el("g",{opacity:0},r);J.mono(e,336,160+i*56,l[0],{size:12.5,bold:1});J.hand(e,336,182+i*56,l[1],{size:20});return e});
    J.hand(r,445,440,"(example rows)",{size:17,anchor:"middle",fill:"var(--n500)"});
    return{scrub:p=>{st.setAttribute("opacity",p>.12?1:0);lines.forEach((e,i)=>e.setAttribute("opacity",p>.25+i*.12?1:0))},feat:()=>[320,150]}}}
]});

/* ============================================================ CONVERSION */
{const gpN=G.carto.gp.filter(p=>Math.hypot(p[0]-REC.xy[0],p[1]-REC.xy[1])<11);let chain=[gpN.reduce((a,b)=>b[0]<a[0]?b:a)];const left=gpN.filter(p=>p!==chain[0]);
 while(left.length&&chain.length<7){const l=chain[chain.length-1],i=left.reduce((bi,p,j)=>Math.hypot(p[0]-l[0],p[1]-l[1])<Math.hypot(left[bi][0]-l[0],left[bi][1]-l[1])?j:bi,0);chain.push(left.splice(i,1)[0])}
 const cc=[chain.reduce((a,p)=>a+p[0],0)/chain.length,chain.reduce((a,p)=>a+p[1],0)/chain.length];
journey("j-conversion",{title:"Conversion: coordinates become geometry",next:"next: Projection",end:"Our record is now a clean point, mapped to the state schema.",
  beats:[
  {t:"Validated coordinates become geometry",b:["points for discrete assets:","Anganwadi centres and","BharatNet GP nodes"],rec:recHTML("the record",REC_BASE),build(g,ctx){const Z=J.zoom(g,ctx,{w:4,roads:true});const c=Z.P(...REC.xy);
    const ln=J.arrow(g,[150,120],[c[0]-8,c[1]-8],.2,{dash:1});const dot=el("circle",{cx:c[0],cy:c[1],r:0,fill:"var(--dv-blue-500)",stroke:"#fff","stroke-width":2},g);const lab=J.mono(g,c[0]+14,c[1]+26,"POINT (81.629641 21.251384)",{size:12.5});
    return{scrub:p=>{ln.set(seg(p,.05,.45));dot.setAttribute("r",9*ease(seg(p,.4,.6)));lab.setAttribute("opacity",p>.6?1:0)},feat:()=>[c[0]-12,c[1]],rec:recHTML("the record",[...REC_BASE,["geometry","point"]])}}},
  {t:"Lines for networks",b:["BharatNet fibre routes, where","vertex order carries","direction and chainage"],build(g,ctx){const Z=J.zoom(g,ctx,{c:cc,w:13});const pts=chain.map(p=>Z.P(...p));
    const line=el("path",{d:"M"+pts.map(p=>p.map(v=>v.toFixed(1)).join(",")).join("L"),fill:"none",stroke:"var(--dv-aqua-600)","stroke-width":3,"stroke-linecap":"round","stroke-linejoin":"round"},Z.o);const d=J.draw(line);
    let km=0;const vs=pts.map((p,i)=>{if(i)km+=Math.hypot(chain[i][0]-chain[i-1][0],chain[i][1]-chain[i-1][1])/G.kmPx;const v=el("g",{opacity:0},Z.o);el("circle",{cx:p[0],cy:p[1],r:10,fill:"#fff",stroke:"var(--dv-aqua-600)","stroke-width":2},v);
      J.mono(v,p[0],p[1]+4,String(i+1),{size:11,anchor:"middle",bold:1});J.hand(v,p[0]+14,p[1]-12,`${km.toFixed(1)} km`,{size:19});return v});
    return{scrub:p=>{d(seg(p,.05,.8));vs.forEach((v,i)=>v.setAttribute("opacity",seg(p,.05,.8)>=i/(vs.length-1)-.01?1:0))},feat:()=>pts[2]}}},
  {t:"Polygons for bounded areas",b:["mining leases must close,","and must share edges cleanly","with their neighbours"],build(g,ctx){J.paper(g,30,22,540,476,ctx);
    const A=[[140,170],[310,130],[340,320],[160,360]],B0=[[330,125],[500,150],[480,340],[362,318]];const f=p=>p.map(v=>v.toFixed(1)).join(",");
    const Af=el("path",{d:`M${A.map(f).join("L")}Z`,fill:"var(--dv-orange-100)",stroke:"none",opacity:0},g);el("path",{d:`M${f(A[0])}L${f(A[1])}L${f(A[2])}L${f(A[3])}`,fill:"none",stroke:"var(--dv-orange-700)","stroke-width":2.4,"stroke-dasharray":"0"},g);
    const close=el("path",{d:`M${f(A[3])}L${f(A[0])}`,fill:"none",stroke:"var(--dv-orange-700)","stroke-width":2.4},g);close.remove();
    const openEdge=el("path",{d:`M${f(A[3])} L${f(A[0])}`,fill:"none",stroke:"var(--dv-orange-700)","stroke-width":2.4},g);const dc=J.draw(openEdge);
    const Bp=el("path",{fill:"var(--dv-orange-100)",stroke:"var(--dv-orange-700)","stroke-width":2.4,"fill-opacity":.7},g);const gap=J.hand(g,352,245,"sliver",{size:20,fill:"var(--red-700)"});
    J.hand(g,95,280,"must close",{size:21,rot:-70});const sh=J.hand(g,330,100,"shared edge",{size:21,anchor:"middle",op:0});
    return{scrub:p=>{dc(seg(p,.05,.4));Af.setAttribute("opacity",p>.4?1:0);const q=ease(seg(p,.45,.85));const B=[[lerp(B0[0][0],A[1][0],q),lerp(B0[0][1],A[1][1],q)],B0[1],B0[2],[lerp(B0[3][0],A[2][0],q),lerp(B0[3][1],A[2][1],q)]];
      Bp.setAttribute("d",`M${B.map(f).join("L")}Z`);gap.setAttribute("opacity",q<.9?1:0);sh.setAttribute("opacity",q>.95?1:0)},feat:()=>[150,265]}}},
  {t:"The work that isn't visible",b:["snapping dangling line ends,","closing slivers between polygons,","resolving self-intersections,","testing network connectivity"],build(g,ctx){J.paper(g,30,22,540,476,ctx);
    const H=(y,s)=>J.hand(g,60,y,s,{size:21,bold:1});H(62,"dangle, snapped within tolerance");H(222,"sliver, closed");H(382,"self-intersection, resolved");
    el("path",{d:"M420,78 L420,190",stroke:"var(--n700)","stroke-width":3,fill:"none"},g);el("circle",{cx:420,cy:134,r:26,fill:"none",stroke:"var(--n300)","stroke-dasharray":"3 3"},g);
    const dl=el("path",{stroke:"var(--dv-aqua-600)","stroke-width":3,fill:"none","stroke-linecap":"round"},g),t1=J.tick(g,470,110);
    const s1=el("path",{d:"M110,250 L300,250 L300,350 L110,350Z",fill:"var(--dv-orange-100)",stroke:"var(--dv-orange-700)","stroke-width":2},g),s2=el("path",{fill:"var(--dv-orange-100)",stroke:"var(--dv-orange-700)","stroke-width":2},g),t2=J.tick(g,470,300);
    const bt=el("path",{fill:"var(--dv-blue-100)",stroke:"var(--dv-blue-700)","stroke-width":2},g),t3=J.tick(g,470,450);
    return{scrub:p=>{const a=ease(seg(p,.05,.3)),b=ease(seg(p,.35,.6)),c=ease(seg(p,.65,.9));dl.setAttribute("d",`M120,134 L${lerp(398,420,a)},134`);t1.setAttribute("opacity",a>.98?1:0);
      s2.setAttribute("d",`M${lerp(318,300,b)},250 L440,250 L440,350 L${lerp(308,300,b)},350Z`);t2.setAttribute("opacity",b>.98?1:0);
      const y1=lerp(470,410,c),y2=lerp(410,470,c);bt.setAttribute("d",`M120,410 L300,${y1} L300,${y2} L120,470Z`);t3.setAttribute("opacity",c>.98?1:0)},feat:()=>[120,134]}}},
  {t:"Field names mapped onto the state schema",b:["with coded domains applied"],rec:recHTML("the record",[...REC_BASE,["geometry","point"],["schema","state"]]),build(g,ctx){J.paper(g,30,22,540,476,ctx);
    J.hand(g,70,80,"department sends",{size:22,bold:1});J.hand(g,340,80,"state schema",{size:22,bold:1});
    const L=["Centre_Nm","STS","Blk_Cd","Lat_DD, Lon_DD"],R=["centre_name","status","lgd_block_code","geom"];const ar=L.map((s,i)=>{const y=140+i*80;J.mono(g,70,y,s,{size:15});J.mono(g,340,y,R[i],{size:15,bold:1});return J.arrow(g,[70+s.length*9.2+10,y-5],[330,y-5],i%2?.1:-.1)});
    const dom=el("g",{opacity:0},g);J.hand(dom,350,245,"coded domain, e.g.",{size:19,fill:"var(--n500)"});J.mono(dom,350,266,"1 functional · 2 under repair",{size:11.5});
    return{scrub:p=>{ar.forEach((a,i)=>a.set(seg(p,i*.18,i*.18+.22)));dom.setAttribute("opacity",p>.4?1:0)},feat:()=>[60,140]}}},
  {t:"Three outputs",b:["shapefile for departmental exchange,","GeoJSON for web consumption,","and a working master in a File","Geodatabase or PostGIS"],build(g,ctx){const fs=[J.file(g,50,120,".shp","departmental|exchange"),J.file(g,244,120,".geojson","for the web"),J.file(g,438,120,"FGDB / PostGIS","working master",{w:112})];
    const n=J.hand(g,300,380,"topology rules, domains and subtypes",{size:22,anchor:"middle"});const n2=J.hand(g,300,408,"don't survive a shapefile",{size:22,anchor:"middle"});const ar=J.arrow(g,[420,372],[490,272],-.2);
    return{scrub:p=>{fs.forEach((f,i)=>{const q=ease(seg(p,i*.15,i*.15+.25));f.setAttribute("opacity",q);f.setAttribute("transform",f.getAttribute("transform").replace(/translate\(([\d.]+) [\d.-]+\)/,`translate($1 ${120-30*(1-q)})`))});[n,n2].forEach(e=>e.setAttribute("opacity",p>.55?1:0));ar.set(seg(p,.6,.85))},feat:()=>[50,190]}}}
]})}

/* ============================================================ PROJECTION */
journey("j-projection",{title:"Projection: one coordinate system to deliver, one to measure",next:"next: Storage",end:"Our record is held in WGS 84 and measured in metres.",
  rec:recHTML("the record",[...REC_BASE,["held in","EPSG:4326"]]),
  beats:[
  {t:"Degrees aren't distances",b:["Data is held in WGS 84 (EPSG:4326)","for the web, and projected to","UTM 44N (EPSG:32644) for any","measurement: buffer, route length, area"],build(g,ctx){const Z=J.zoom(g,ctx,{w:3.2,roads:true});const c=Z.P(...REC.xy);
    const a=Z.P(...ll2xy(REC.lon-.005,REC.lat+.005)),b=Z.P(...ll2xy(REC.lon+.005,REC.lat-.005)),box=el("rect",{x:a[0],y:a[1],width:b[0]-a[0],height:b[1]-a[1],fill:"rgba(97,122,226,.12)",stroke:"var(--dv-blue-700)","stroke-width":2,opacity:0},Z.o);
    const bl=el("g",{opacity:0},Z.o);J.hand(bl,(a[0]+b[0])/2,a[1]-10,"0.01° of longitude ≈ 1.04 km here",{size:20,anchor:"middle",fill:"var(--dv-blue-700)"});J.hand(bl,b[0]+10,(a[1]+b[1])/2,"0.01° of latitude",{size:20,fill:"var(--dv-blue-700)"});J.hand(bl,b[0]+10,(a[1]+b[1])/2+22,"≈ 1.11 km",{size:20,fill:"var(--dv-blue-700)"});
    const r=G.kmPx*Z.k,ci=el("circle",{cx:c[0],cy:c[1],r,fill:"none",stroke:"var(--n950)","stroke-width":2.4,"stroke-dasharray":"1",pathLength:1,"stroke-dashoffset":1},Z.o);const cl=J.hand(Z.o,c[0],c[1]+r+26,"1,000 m is 1,000 m in UTM 44N",{size:21,anchor:"middle",bold:1,op:0});el("circle",{cx:c[0],cy:c[1],r:4.5,fill:"var(--n950)"},Z.o);
    return{scrub:p=>{box.setAttribute("opacity",p>.08?1:0);bl.setAttribute("opacity",p>.15?1:0);ci.setAttribute("stroke-dashoffset",1-seg(p,.5,.8));cl.setAttribute("opacity",p>.8?1:0)},feat:()=>[a[0],(a[1]+b[1])/2]}}},
  {t:"The eastern edge crosses into Zone 45N",b:["Jashpur and Balrampur sit past 84° E.","Rather than split layers at the","meridian, state-wide analysis runs","in a Lambert Conformal Conic","defined for Chhattisgarh"],build(g,ctx){const P=J.plate(g,ctx,{k:.78});const hid=ctx.id+"-hat";
    ctx.defs.insertAdjacentHTML("beforeend",`<pattern id="${hid}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="var(--dv-magenta-500)" stroke-width="2"/></pattern>`);
    const ea=el("path",{d:G.east,fill:`url(#${hid})`,stroke:"var(--dv-magenta-700)","stroke-width":1.4,...NSS,opacity:0},P.m);const m=J.draw(el("path",{d:G.m84,fill:"none",stroke:"var(--dv-magenta-700)","stroke-width":2,"stroke-dasharray":"6 5",...NSS},P.m));
    const l=el("g",{opacity:0},g);const x84=P.P(410,0)[0];J.hand(l,x84-12,60,"44N",{size:24,anchor:"end",bold:1});J.hand(l,x84+12,60,"45N",{size:24,bold:1,fill:"var(--dv-magenta-700)"});J.hand(l,x84+8,490,"84° E",{size:20});
    const lcc=el("g",{opacity:0},g);[0,1,2,3].forEach(i=>el("path",{d:`M60,${140+i*90} Q300,${100+i*90} 540,${140+i*90}`,fill:"none",stroke:"var(--n400)","stroke-width":1.2,"stroke-dasharray":"2 5"},lcc));J.hand(lcc,70,500,"state LCC: one surface, no seam",{size:21});
    return{scrub:p=>{m(seg(p,.05,.4));l.setAttribute("opacity",p>.3?1:0);ea.setAttribute("opacity",p>.4?1:0);lcc.setAttribute("opacity",p>.7?1:0)},feat:()=>P.P(420,140)}}},
  {t:"One file governs this: .prj",b:["A shapefile is six files. Omit the","one that declares the coordinate","system: the single most frequent","cause of a layer arriving in the Atlantic"],build(g,ctx){const ext=[".shp",".shx",".dbf",".prj",".cpg",".sbn"];
    const fs=ext.map((e,i)=>J.file(g,40+i*90,40,e,"",{w:78}));fs.forEach(f=>f.querySelectorAll("text").forEach(t=>t.setAttribute("font-size",14)));
    const W=J.world(g,ctx,{lon0:-40,lon1:100,lat0:-25,lat1:45,box:[30,220,540,280]});const s=W.P(REC.lon,REC.lat),z=W.P(-2,-1);const pn=J.pin(W.o,"var(--red-500)",.9);const q=J.hand(W.o,z[0]+18,z[1]-30,"?! the Atlantic",{size:22,fill:"var(--red-700)",op:0});
    return{scrub:p=>{const d=ease(seg(p,.1,.4));fs[3].setAttribute("transform",`translate(${40+3*90+d*20} ${40+d*140}) rotate(${d*28})`);fs[3].setAttribute("opacity",1-d*.85);
      const t=ease(seg(p,.45,.85));pn.setAttribute("transform",`translate(${lerp(s[0],z[0],t)} ${lerp(s[1],z[1],t)-Math.sin(t*Math.PI)*50})`);q.setAttribute("opacity",t>.97?1:0)},feat:()=>[40+3*90,60]}}}
]});

/* ============================================================ STORAGE */
journey("j-storage",{title:"Storage: one database, one truth",next:"next: Publication",end:"Our record is a row in wcd.wcd_anganwadi_pt_10k.",
  rec:recHTML("the record",[...REC_BASE,["layer","wcd_anganwadi_pt_10k"]]),
  beats:[
  {t:"PostgreSQL / PostGIS",b:["every validated layer lands here:","the single source of truth","for the portal"],build(g){J.db(g,110,250,"PostGIS");
    const T=el("g",{},g);el("rect",{x:230,y:120,width:340,height:270,rx:8,fill:"#fff",stroke:"#d9d3ca"},T);J.mono(T,246,146,"wcd.wcd_anganwadi_pt_10k",{size:13,bold:1});
    ["asset_id","status","geom"].forEach((h,i)=>J.mono(T,246+[0,130,230][i],176,h,{size:11.5,fill:"var(--n500)"}));
    ["AWC-RPR-00409","AWC-RPR-00410","AWC-RPR-00411"].forEach((s,i)=>{J.mono(T,246,206+i*30,s,{size:12});J.mono(T,376,206+i*30,"functional",{size:12});J.mono(T,476,206+i*30,"POINT",{size:12})});
    const r=el("g",{},g);el("rect",{x:238,y:284,width:324,height:28,rx:4,fill:"rgba(247,214,90,.6)"},r);J.mono(r,246,303,REC.id,{size:12,bold:1});J.mono(r,376,303,"functional",{size:12});J.mono(r,476,303,"POINT",{size:12});
    J.hand(g,400,430,"(example rows)",{size:17,anchor:"middle",fill:"var(--n500)"});
    return{scrub:p=>{const q=ease(seg(p,.1,.55));r.setAttribute("transform",`translate(${(1-q)*-190} 0)`);r.setAttribute("opacity",q)},feat:()=>[240,298]}}},
  {t:"A spatial index on every geometry",b:["'all facilities within this block'","goes from a table scan","to a millisecond query"],build(g,ctx){
    J.hand(g,150,50,"table scan",{size:23,anchor:"middle",bold:1});const bars=[...Array(26)].map((_,i)=>el("rect",{x:70,y:70+i*15,width:160,height:10,rx:2,fill:"#e8e3db"},g));const cnt=J.mono(g,150,480,"",{size:13,anchor:"middle"});
    J.hand(g,440,50,"spatial index",{size:23,anchor:"middle",bold:1});const P=J.plate(g,ctx,{k:.62,cx:440,cy:270});const c=P.P(...REC.xy);
    const lv=[[79,24,362,592]];for(let i=0;i<4;i++){const[x,y,w,h]=lv[i],hw=w/2,hh=h/2,qx=REC.xy[0]<x+hw?x:x+hw,qy=REC.xy[1]<y+hh?y:y+hh;lv.push([qx,qy,hw,hh])}
    const boxes=lv.map((b,i)=>{const a=P.P(b[0],b[1]);return el("rect",{x:a[0],y:a[1],width:b[2]*P.k,height:b[3]*P.k,fill:i===4?"rgba(247,214,90,.6)":"none",stroke:"var(--n900)","stroke-width":i===4?2:1.3,opacity:0},g)});const ms=J.hand(g,440,500,"found",{size:22,anchor:"middle",bold:1,fill:"var(--green-700)",op:0});
    return{scrub:p=>{const s=seg(p,0,1)*26*3;bars.forEach((b,i)=>b.setAttribute("fill",i===Math.floor(s)%26?"var(--orange-400)":i<s?"#d6d0c6":"#e8e3db"));cnt.textContent=`rows read: ${Math.min(Math.floor(s)*1731,134977)}`;
      boxes.forEach((b,i)=>b.setAttribute("opacity",p>i*.06?1:0));ms.setAttribute("opacity",p>.3?1:0)},feat:()=>c}}},
  {t:"Constraints on type and SRID",b:["a point can't be written","into a polygon layer"],build(g,ctx){const B=el("g",{},g);J.paper(B,300,120,260,260,ctx,{fill:"#fff"});J.mono(B,316,150,"mining.mining_lease_poly_5k",{size:11.5,bold:1});
    J.mono(B,316,172,"type: POLYGON · SRID 4326",{size:11.5,fill:"var(--n500)"});el("path",{d:"M340,220 L460,200 L480,300 L350,320Z",fill:"var(--dv-orange-100)",stroke:"var(--dv-orange-700)","stroke-width":2},B);
    const pt=el("g",{},g);el("circle",{r:10,fill:"var(--dv-blue-500)",stroke:"#fff","stroke-width":2},pt);J.mono(pt,0,-18,"POINT",{size:12,anchor:"middle",bold:1});const x=J.cross(g,300,240),no=J.hand(g,160,420,"rejected: wrong geometry type",{size:23,anchor:"middle",fill:"var(--red-700)",op:0});let cur=[90,250];
    return{scrub:p=>{const a=ease(seg(p,.05,.45)),b=ease(seg(p,.45,.75));const X=lerp(90,285,a)-b*120;cur=[X,250-Math.sin(b*Math.PI)*40];pt.setAttribute("transform",`translate(${cur})`);x.setAttribute("opacity",p>.45?1:0);no.setAttribute("opacity",p>.55?1:0)},feat:()=>cur}}},
  {t:"A schema per department",b:["and a shared reference schema","holding the Revenue boundaries","and the LGD master, so every layer","snaps to the same village"],build(g){const S=[["wcd","var(--dv-blue-500)"],["mining","var(--dv-orange-500)"],["bharatnet","var(--dv-aqua-600)"],["reference: boundaries + LGD master","var(--n700)"]];
    const ys=[70,170,270,400],vx=330;S.forEach((s,i)=>{const y=ys[i];el("path",{d:`M110,${y} L520,${y} L480,${y+56} L70,${y+56}Z`,fill:i===3?"#f1ede6":"#fff",stroke:"#bdb6ac","stroke-width":1.4},g);J.hand(g,86,y+36,s[0],{size:21,bold:i===3?1:0});
      if(i<3)el("circle",{cx:vx-i*8,cy:y+28,r:7,fill:s[1]},g)});const vil=el("path",{d:`M${vx-50},${412} L${vx+30},${406} L${vx+44},${444} L${vx-34},${450}Z`,fill:"rgba(247,214,90,.7)",stroke:"var(--n900)","stroke-width":1.8},g);
    const drops=[0,1,2].map(i=>J.arrow(g,[vx-i*8,ys[i]+38],[vx-i*8+(i-1)*6,426],0,{dash:1,head:false}));J.hand(g,vx+60,440,"the same village",{size:21});
    return{scrub:p=>drops.forEach((d,i)=>d.set(seg(p,i*.2,i*.2+.3))),feat:()=>[vx-60,440]}}},
  {t:"Naming is fixed at load",b:["department_theme_geometry_scale,","lowercase, underscored"],build(g){const s="wcd_anganwadi_pt_10k",fs=30,cw=fs*.6,x0=300-s.length*cw/2;J.mono(g,300,230,s,{size:fs,anchor:"middle",bold:1});
    const parts=[[0,3,"department"],[4,13,"theme"],[14,16,"geometry"],[17,20,"scale"]];const br=parts.map(([a,b,l],i)=>{const x1=x0+a*cw+2,x2=x0+b*cw-2,y=250,o=el("g",{opacity:0},g);
      el("path",{d:`M${x1},${y} Q${x1},${y+12} ${(x1+x2)/2-6},${y+12} L${(x1+x2)/2},${y+22} L${(x1+x2)/2+6},${y+12} Q${x2},${y+12} ${x2},${y}`,fill:"none",stroke:"var(--n800)","stroke-width":1.8},o);J.hand(o,(x1+x2)/2,y+48+(i%2)*26,l,{size:22,anchor:"middle"});return o});
    return{scrub:p=>br.forEach((b,i)=>b.setAttribute("opacity",p>.08+i*.15?1:0)),feat:()=>[x0,222]}}},
  {t:"Versioning",b:["records who changed what and when,","and keeps the previous state","recoverable"],build(g){el("path",{d:"M80,260 L520,260",stroke:"var(--n300)","stroke-width":2},g);
    const v=[[130,"v1","loaded","status: functional"],[330,"v2","[editor] · [date]","status: under repair"],[480,"now","",""]].map((a,i)=>{const o=el("g",{opacity:0},g);el("circle",{cx:a[0],cy:260,r:9,fill:i<2?"var(--n900)":"#fff",stroke:"var(--n900)","stroke-width":2},o);
      J.hand(o,a[0],228,a[1],{size:24,anchor:"middle",bold:1});J.mono(o,a[0],292,a[2],{size:11.5,anchor:"middle",fill:"var(--n500)"});J.hand(o,a[0],318,a[3],{size:19,anchor:"middle"});return o});
    const back=J.arrow(g,[320,340],[140,340],-.35);const rl=J.hand(g,230,420,"previous state, recoverable",{size:21,anchor:"middle",op:0});
    return{scrub:p=>{v.forEach((o,i)=>o.setAttribute("opacity",p>i*.18?1:0));back.set(seg(p,.5,.8));rl.setAttribute("opacity",p>.8?1:0)},feat:()=>[330,240]}}}
]});

/* ============================================================ PUBLICATION */
journey("j-publication",{title:"Publication: services, not files",next:"next: Cartography",end:"Everyone who shows our record reads it from the same endpoint.",
  rec:recHTML("the record",[...REC_BASE,["status","functional"]]),
  beats:[
  {t:"The portal doesn't read the database",b:["layers are published as services:","WMS and map services, WFS and","feature services, WMTS and vector","tiles, image services"],build(g){J.db(g,95,250,"PostGIS");
    const sv=[["WMS · map service","rendered output"],["WFS · feature service","when the client needs geometry"],["WMTS · vector tiles","state-wide panning at speed"],["image service","imagery and elevation"]];
    const cs=sv.map((s,i)=>{const y=60+i*105,o=el("g",{opacity:0},g);el("rect",{x:270,y,width:300,height:74,rx:8,fill:"#fff",stroke:"#d9d3ca"},o);J.mono(o,286,y+28,s[0],{size:13,bold:1});J.hand(o,286,y+56,s[1],{size:20});return{o,a:J.arrow(g,[150,250],[264,y+37],i<2?-.15:.15)}});
    J.mono(g,300,505,"[https://your-real-service-url/rest/services/...]",{size:11.5,anchor:"middle",fill:"var(--n500)"});
    return{scrub:p=>cs.forEach((c,i)=>{c.a.set(seg(p,i*.15,i*.15+.2));c.o.setAttribute("opacity",p>i*.15+.18?1:0)}),feat:()=>[270,97]}}},
  {t:"Everyone reads the same endpoint",b:["the portal, the Mining, Anganwadi","and BharatNet applications, and","external agencies. A status change","propagates everywhere at once"],build(g){const C=[300,262];el("circle",{cx:C[0],cy:C[1],r:34,fill:"#fff",stroke:"var(--n900)","stroke-width":2.2},g);J.hand(g,C[0],C[1]+6,"endpoint",{size:20,anchor:"middle",bold:1});
    const U=[["Portal",300,70],["Mining app",500,170],["Anganwadi app",470,430],["BharatNet app",130,430],["External agencies",100,170]];let st=0,flip=false;
    const cs=U.map(([n,x,y])=>{const w=150,o=el("g",{},g);el("path",{d:`M${C[0]},${C[1]} L${x},${y}`,stroke:"var(--n200)","stroke-width":1.6},g).parentNode.insertBefore(g.lastChild,g.firstChild);
      el("rect",{x:x-w/2,y:y-30,width:w,height:60,rx:8,fill:"#fff",stroke:"#d9d3ca"},o);J.hand(o,x,y-8,n,{size:20,anchor:"middle",bold:1});const chip=J.mono(o,x,y+17,"",{size:11,anchor:"middle"});
      const dot=el("circle",{r:5,fill:"var(--orange-400)",opacity:0},g);return{chip,dot,x,y}});
    const env=el("g",{opacity:0,transform:"translate(300 490) rotate(-4)"},g);el("rect",{x:-40,y:-22,width:80,height:44,rx:3,fill:"#fff",stroke:"var(--n700)","stroke-width":1.8},env);el("path",{d:"M-40,-22 L0,4 L40,-22",fill:"none",stroke:"var(--n700)","stroke-width":1.8},env);J.cross(env,0,0,"var(--red-500)",2.6);J.hand(env,52,8,"no file is emailed",{size:20});
    return{try:{label:"change the status",fn:()=>flip=!flip},scrub:p=>{const on=(p>.5)!==flip,t=seg(p,.5,.7);cs.forEach(c=>{c.chip.textContent=`${REC.id} · ${on?"under repair":"functional"}`;c.chip.style.fill=on?"var(--orange-700)":"var(--n800)";
      const q=flip?1:t;c.dot.setAttribute("cx",lerp(C[0],c.x,q));c.dot.setAttribute("cy",lerp(C[1],c.y,q));c.dot.setAttribute("opacity",q>0&&q<1?1:0)});env.setAttribute("opacity",p>.75?1:0)},feat:()=>[C[0]-34,C[1]]}}}
]});

/* ============================================================ CARTOGRAPHY */
journey("j-cartography",{title:"Cartography: drawn once, at the service",next:"next: Provenance and access",end:"Our record draws the same everywhere it appears.",
  rec:recHTML("the record",[...REC_BASE,["symbol","state palette"]]),
  beats:[
  {t:"Scale dependency, per layer",b:["village boundaries draw at 1:100,000","and larger; point assets at 1:25,000.","Without it, a full-state zoom would","request [N] symbols in a single frame"],build(g,ctx){J.paper(g,30,22,540,476,ctx);const cid=ctx.id+"-cz";const cp=el("clipPath",{id:cid},ctx.defs);el("rect",{x:30,y:22,width:540,height:476,rx:10},cp);
    const o=el("g",{"clip-path":`url(#${cid})`},g),m=el("g",{},o);el("path",{d:G.state,fill:"#fff",stroke:"#8f887e","stroke-width":1.6,...NSS},m);const dg=el("g",{},m);G.districts.forEach(d=>el("path",{d:d.d,fill:"none",stroke:"#cfc8bd","stroke-width":1,...NSS},dg));
    const tg=el("g",{},m);G.carto.tehsil.forEach(d=>el("path",{d,fill:"none",stroke:"#a39c92","stroke-width":1.2,"stroke-dasharray":"5 3",...NSS},tg));
    const vg=el("g",{opacity:0},m);G.carto.village.forEach((d,i)=>el("path",{d,fill:i%2?"#f8f5f0":"#fcfbf8",stroke:"#d6cfc4","stroke-width":.7,...NSS},vg));el("path",{d:G.carto.fibre,fill:"none",stroke:"var(--dv-aqua-600)","stroke-width":1.6,...NSS},vg);
    const pg=el("g",{opacity:0},m);const aw=G.carto.aw.map(p=>el("circle",{cx:p[0],cy:p[1],fill:"var(--dv-blue-500)"},pg));const ours=el("circle",{cx:REC.xy[0],cy:REC.xy[1],fill:"var(--dv-blue-700)",stroke:"#fff"},pg);
    const lab=J.hand(g,556,58,"",{size:25,anchor:"end",bold:1}),sub=J.hand(g,556,84,"",{size:19,anchor:"end"});
    return{scrub:p=>{const q=ease(seg(p,.02,.9)),w=Math.exp(lerp(Math.log(440),Math.log(2.6),q)),c=[lerp(260,REC.xy[0],Math.min(1,q*1.15)),lerp(320,REC.xy[1],Math.min(1,q*1.15))],k=540/w;
      m.setAttribute("transform",`translate(${300-c[0]*k} ${260-c[1]*k}) scale(${k})`);const r=S0(ctx.S),den=(w/G.kmPx*1e6)/(540*r*.264583);
      vg.setAttribute("opacity",den<=100000?1:0);pg.setAttribute("opacity",den<=25000?1:0);aw.forEach(e=>e.setAttribute("r",6/k));ours.setAttribute("r",10/k);ours.setAttribute("stroke-width",2/k);
      lab.textContent="1 : "+fmt(Math.round(den/1000)*1000);sub.textContent=den<=25000?"villages and points on":den<=100000?"village boundaries on":"districts and tehsils only"},feat:()=>[556-190,50]}}},
  {t:"Symbology is defined at the service",b:["so every consumer renders identically:","colour and symbol from the state","palette, labels with defined fields,","halos, placement and conflict rules"],build(g,ctx){const Z=J.zoom(g,ctx,{w:1.6,roads:true});const c=Z.P(...REC.xy),o=Z.P(REC.xy[0]+.12,REC.xy[1]+.05);
    el("circle",{cx:o[0],cy:o[1],r:8,fill:"var(--dv-blue-500)",stroke:"#fff","stroke-width":2},Z.o);el("circle",{cx:c[0],cy:c[1],r:9,fill:"var(--dv-blue-700)",stroke:"#fff","stroke-width":2.4},Z.o);
    const l1=J.mono(Z.o,c[0]+14,c[1]-10,REC.id,{size:14,bold:1}),l2=J.mono(Z.o,o[0]+12,o[1]+4,"AWC-RPR-00413",{size:14,bold:1});[l1,l2].forEach(l=>{l.style.strokeLinejoin="round";l.style.paintOrder="stroke"});
    const n=J.hand(g,300,490,"",{size:22,anchor:"middle"});
    return{scrub:p=>{const halo=p>.33;[l1,l2].forEach(l=>{l.style.stroke=halo?"#fff":"none";l.style.strokeWidth=halo?4:0});l2.setAttribute("opacity",p>.66?0:1);n.textContent=p<.33?"label, no halo: lost in the roads":p<.66?"halo on: readable at any zoom":"conflict rule: the overlapping label drops"},feat:()=>[c[0]-10,c[1]]}}},
  {t:"Styles are held as SLD and layer files",b:["version-controlled with the data"],build(g,ctx){J.paper(g,90,60,420,380,ctx,{fill:"#fff"});J.mono(g,110,92,"wcd_anganwadi_pt.sld",{size:14,bold:1});
    const L=["<PointSymbolizer>","  <Mark> circle · state palette </Mark>","</PointSymbolizer>","<TextSymbolizer>","  <Label> asset_id </Label>","  <Halo> 2 px white </Halo>","</TextSymbolizer>","<MaxScaleDenominator>25000","</MaxScaleDenominator>"];
    const ls=L.map((s,i)=>J.mono(g,112,130+i*28,s,{size:12.5,fill:i>6?"var(--dv-magenta-700)":"var(--n700)"}));const tags=["v1","v2","v3"].map((t,i)=>{const o=el("g",{opacity:0},g);el("rect",{x:420,y:100+i*40,width:60,height:28,rx:14,fill:"#f1ede6",stroke:"#bdb6ac"},o);J.hand(o,450,120+i*40,t,{size:20,anchor:"middle",bold:1});return o});
    return{scrub:p=>{ls.forEach((l,i)=>l.setAttribute("opacity",p>i*.07?1:.15));tags.forEach((t,i)=>t.setAttribute("opacity",p>.55+i*.12?1:0))},feat:()=>[100,90]}}}
]});

/* ============================================================ PROVENANCE AND ACCESS */
journey("j-provenance",{title:"Provenance and access",next:"next: In use",end:"Our record's layer says who made it, how, and who may use it.",
  beats:[
  {t:"Every layer carries ISO 19115 metadata",b:["custodian department and nodal","officer, capture date and update","frequency, accuracy, source scale,","licence, and lineage"],rec:"",build(g){
    const rows=[["custodian","[department]"],["nodal officer","[name]"],["capture date","[date]"],["update freq.","[frequency]"],["position acc.","[± m]"],["attribute acc.","[%]"],["source scale","1:10,000"],["licence","[licence]"],["lineage","below"]];
    const c=J.card(g,110,50,"wcd_anganwadi_pt_10k · metadata",rows,{w:380,lh:40,kw:140});const hl=el("rect",{x:116,y:c.row(8)-18,width:368,height:28,rx:4,fill:"rgba(247,214,90,.7)",opacity:0},c.c);c.c.insertBefore(hl,c.c.children[2]);
    return{scrub:p=>{c.vals.forEach((v,i)=>v.setAttribute("opacity",p>i*.07?1:0));hl.setAttribute("opacity",p>.7?1:0)},feat:()=>[110,c.row(0)]}}},
  {t:"Lineage",b:["what was done to the data, by whom,","and when. The field most often omitted,","and most often needed: two years on,","it decides whether a disagreement","takes an hour or a meeting"],build(g){
    const st=[["submitted","on the department template"],["validated","four intake checks passed"],["converted","point, EPSG:4326"],["loaded","wcd.wcd_anganwadi_pt_10k"],["published","feature and map services"],["styled","wcd_anganwadi_pt.sld"]];
    const ln=J.draw(el("path",{d:"M110,52 L110,478",stroke:"var(--n800)","stroke-width":2.2,fill:"none"},g));
    const ns=st.map((s,i)=>{const y=62+i*82,o=el("g",{opacity:0},g);el("circle",{cx:110,cy:y,r:9,fill:"#fff",stroke:"var(--n900)","stroke-width":2.2},o);J.hand(o,136,y+2,s[0],{size:25,bold:1});J.hand(o,136,y+26,s[1],{size:20});J.mono(o,560,y+2,"[who] · [when]",{size:11.5,anchor:"end",fill:"var(--n500)"});return o});
    return{scrub:p=>{ln(seg(p,0,.85));ns.forEach((o,i)=>o.setAttribute("opacity",seg(p,0,.85)>=i/6?1:0))},feat:()=>[100,62]}}},
  {t:"Three tiers of access",b:["public, departmental, restricted:","authenticated by state SSO and","enforced at the service, not in the","interface. View, query, download and","edit are four separate permissions.","Access to restricted layers is logged"],build(g){
    const gate=el("g",{},g);el("rect",{x:170,y:40,width:260,height:44,rx:22,fill:"#fff",stroke:"var(--n800)","stroke-width":2},gate);J.hand(gate,300,69,"state SSO",{size:23,anchor:"middle",bold:1});
    const T=["public","departmental","restricted"].map((t,i)=>{const x=110+i*190,o=el("g",{opacity:0},g);el("path",{d:`M${x-55},250 L${x-55},140 Q${x},110 ${x+55},140 L${x+55},250Z`,fill:i===2?"#f1ede6":"#fff",stroke:"var(--n800)","stroke-width":2},o);J.hand(o,x,200,t,{size:22,anchor:"middle",bold:1});
      if(i===2){el("rect",{x:x-12,y:212,width:24,height:18,rx:3,fill:"var(--n800)"},o);el("path",{d:`M${x-7},212 V205 A7,7 0 0 1 ${x+7},205 V212`,fill:"none",stroke:"var(--n800)","stroke-width":2.4},o)}return o});
    const P=["view","query","download","edit"].map((t,i)=>{const x=90+i*140,o=el("g",{opacity:0},g);el("rect",{x:x-40,y:300,width:52,height:26,rx:13,fill:"var(--n800)"},o);el("circle",{cx:x-1,cy:313,r:9,fill:"#fff"},o);J.hand(o,x+22,319,t,{size:21});return o});
    const log=[0,1,2].map(i=>J.mono(g,80,400+i*26,`[time] · [user] opened a restricted layer`,{size:12,fill:"var(--n600)"}));J.hand(g,80,380,"access log",{size:20,bold:1});
    return{scrub:p=>{T.forEach((o,i)=>o.setAttribute("opacity",p>.05+i*.1?1:0));P.forEach((o,i)=>o.setAttribute("opacity",p>.4+i*.06?1:0));log.forEach((l,i)=>l.setAttribute("opacity",p>.7+i*.07?1:0))},feat:()=>[170,62]}}}
]});

/* ============================================================ IN USE (illustrative until a documented use is supplied) */
journey("j-inuse",{title:"In use",next:"next: Update cycle",end:"Replace the illustration with one real query, run by a real department, with the real output.",
  beats:[
  {t:"In use",b:["[One documented, verifiable use:","what was asked, what the analysis","returned, and what decision it fed.]"],build(g,ctx){const P=J.plate(g,ctx,{k:.78});el("path",{d:G.stack.mines,fill:"var(--dv-orange-500)",stroke:"var(--dv-orange-700)","stroke-width":1.2,...NSS},P.m);
    const ms=G.stack.mines.split("M").filter(Boolean).map(s=>{const n=s.replace(/Z/g,"").split("L").map(v=>v.split(",").map(Number));return[n.reduce((a,v)=>a+v[0],0)/n.length,n.reduce((a,v)=>a+v[1],0)/n.length]});
    const bufs=ms.map(c=>el("circle",{cx:c[0],cy:c[1],r:0,fill:"rgba(201,93,46,.12)",stroke:"var(--dv-orange-700)","stroke-width":1.2,"stroke-dasharray":"4 3",...NSS},P.m));const R=10*G.kmPx;
    const aw=G.stack.aw.map(p=>({p,d:Math.min(...ms.map(c=>Math.hypot(c[0]-p[0],c[1]-p[1]))),e:el("circle",{cx:p[0],cy:p[1],r:3.2,fill:"var(--dv-blue-500)"},P.m)}));
    J.hand(g,300,508,"illustrative: example query, not a documented use",{size:20,anchor:"middle",fill:"var(--red-700)"});J.hand(g,40,60,"Anganwadi centres within",{size:22,bold:1});J.hand(g,40,84,"10 km of a mining lease?",{size:22,bold:1});
    return{scrub:p=>{const r=R*ease(seg(p,.05,.6));bufs.forEach(b=>b.setAttribute("r",r));aw.forEach(a=>{const hit=a.d<=r&&r>0;a.e.setAttribute("r",hit?5.5:3.2);a.e.setAttribute("fill",hit?"var(--dv-orange-700)":"var(--dv-blue-500)")})},feat:()=>P.P(150,346)}}},
  {t:"Or: centres against GP connectivity",b:["[Anganwadi centres checked","against BharatNet GP nodes,","with the real distances","and the real decision]"],build(g,ctx){const P=J.plate(g,ctx,{k:.78});el("path",{d:G.stack.fibre,fill:"none",stroke:"var(--dv-aqua-600)","stroke-width":1.8,...NSS},P.m);
    G.stack.gp.forEach(p=>el("circle",{cx:p[0],cy:p[1],r:4.2,fill:"#fff",stroke:"var(--dv-aqua-600)","stroke-width":1.8},P.m));
    const aw=G.stack.aw.map(p=>{const d=Math.min(...G.stack.gp.map(q=>Math.hypot(q[0]-p[0],q[1]-p[1])))/G.kmPx;return{d,e:el("circle",{cx:p[0],cy:p[1],r:3.4,fill:"var(--n300)"},P.m)}});
    J.hand(g,300,508,"illustrative: replace with the documented analysis",{size:20,anchor:"middle",fill:"var(--red-700)"});
    const key=el("g",{opacity:0},g);[["within 10 km","var(--green-500)"],["10–25 km","var(--orange-400)"],["beyond 25 km","var(--red-500)"]].forEach((k,i)=>{el("circle",{cx:48,cy:60+i*26,r:6,fill:k[1]},key);J.hand(key,62,66+i*26,k[0],{size:20})});
    return{scrub:p=>{const t=seg(p,.05,.7);aw.forEach((a,i)=>a.e.setAttribute("fill",i/aw.length<t?(a.d<=10?"var(--green-500)":a.d<=25?"var(--orange-400)":"var(--red-500)"):"var(--n300)"));key.setAttribute("opacity",p>.1?1:0)},feat:()=>P.P(300,400)}}}
]});

/* ============================================================ UPDATE CYCLE */
{const TC=["var(--dv-blue-500)","var(--dv-orange-500)","var(--dv-aqua-600)","var(--dv-magenta-500)","var(--green-500)"];
journey("j-update",{title:"Update cycle",end:"That is one record's journey, from a row in a department's sheet to a symbol on every map that reads the portal.",
  rec:recHTML("the record",[...REC_BASE,["status","functional"]]),
  beats:[
  {t:"Thematic layers resubmit on schedule",b:["[monthly for scheme progress,","quarterly for asset inventories]"],build(g){const C=[300,262],R=178,N=["resubmit","validate","match on ID","update","services refresh","caches rebuild","metadata dates advance","subscribers notified"];
    let d="";for(let i=0;i<=64;i++){const a=-Math.PI/2+i/64*Math.PI*2*.97,r=R*(1+.02*Math.sin(a*5));d+=(i?"L":"M")+(C[0]+Math.cos(a)*r*1.2).toFixed(1)+","+(C[1]+Math.sin(a)*r).toFixed(1)}const lp=J.draw(el("path",{d,fill:"none",stroke:"var(--n800)","stroke-width":2},g));
    const ns=N.map((n,i)=>{const a=-Math.PI/2+i/N.length*Math.PI*2,x=C[0]+Math.cos(a)*R*1.2,y=C[1]+Math.sin(a)*R,o=el("g",{opacity:0},g);el("circle",{cx:x,cy:y,r:8,fill:"#fff",stroke:"var(--n900)","stroke-width":2},o);
      J.hand(o,x+(Math.cos(a)>.2?14:Math.cos(a)<-.2?-14:0),y+(Math.abs(Math.cos(a))<=.2?(Math.sin(a)<0?-16:30):6),n,{size:20,anchor:Math.cos(a)>.2?"start":Math.cos(a)<-.2?"end":"middle"});return o});
    J.hand(g,300,268,"one cycle",{size:26,anchor:"middle",bold:1});return{scrub:p=>{lp(seg(p,0,.9));ns.forEach((o,i)=>o.setAttribute("opacity",seg(p,0,.9)>=i/N.length?1:0))},feat:()=>[300,84]}}},
  {t:"Boundaries work differently",b:["The Revenue Department sends them","only when something changes, such as","a new tehsil or a redrawn village, and","the change carries to every layer","snapped to them"],build(g,ctx){const c=[G.carto.bbox[0]+G.carto.bbox[2]/2,G.carto.bbox[1]+G.carto.bbox[3]/2];const Z=J.zoom(g,ctx,{c,w:66,vill:false});
    G.carto.tehsil.forEach(d=>el("path",{d,fill:"#fbfaf8",stroke:"#8f887e","stroke-width":1.6,...NSS},Z.m));const T=G.carto.tehN;
    const pts=G.carto.aw.map(p=>{const i=T.reduce((bi,t,j)=>Math.hypot(t.xy[0]-p[0],t.xy[1]-p[1])<Math.hypot(T[bi].xy[0]-p[0],T[bi].xy[1]-p[1])?j:bi,0),s=Z.P(...p);return{i,s,e:el("circle",{cx:s[0],cy:s[1],r:3.4,fill:TC[i]},Z.o)}});
    T.forEach(t=>{const s=Z.P(...t.xy);J.hand(Z.o,s[0],s[1],t.n,{size:21,anchor:"middle",bold:1})});
    const h=T[0].xy,a=Z.P(h[0]+2,h[1]-11),b=Z.P(h[0]-1.5,h[1]+11),cut=el("path",{d:`M${a} Q${Z.P(h[0]+3,h[1])} ${b}`,fill:"none",stroke:"var(--dv-magenta-700)","stroke-width":3,"stroke-dasharray":"8 5"},Z.o);const dc=J.draw(cut);
    const nl=J.hand(Z.o,a[0]+10,a[1]+6,"new tehsil boundary",{size:21,fill:"var(--dv-magenta-700)",op:0});let split=false;
    return{try:{label:"redraw the tehsil",fn:()=>split=!split},scrub:p=>{const on=(p>.45)!==split;dc(split?1:seg(p,.1,.45));nl.setAttribute("opacity",on?1:0);
      pts.forEach(q=>{const west=q.i===0&&q.s[0]<lerp(a[0],b[0],(q.s[1]-a[1])/(b[1]-a[1]));q.e.setAttribute("fill",on&&west?"var(--dv-magenta-700)":TC[q.i])})},feat:()=>a}}},
  {t:"Records match on stable ID",b:["so revisions update rather than","duplicate. Retired assets are","flagged inactive, not deleted"],build(g){const v1=J.card(g,40,70,"last cycle",[["asset_id",REC.id],["status","under repair"]],{w:240,kw:74});v1.c.setAttribute("opacity",.55);
    const v2=el("g",{opacity:0},g);J.card(v2,320,70,"this cycle",[["asset_id",REC.id],["status","functional"]],{w:240,kw:74});const ar=J.arrow(g,[285,120],[315,120],0);
    const st=J.stamp(g,440,200,"UPDATED","var(--green-500)",-5);J.hand(g,440,240,"same ID: no duplicate",{size:21,anchor:"middle",op:1}).setAttribute("opacity",0);const lbl=g.lastChild;
    const ret=el("g",{opacity:0},g);J.card(ret,160,320,"a retired centre",[["asset_id","AWC-RPR-00388"],["status","inactive"]],{w:280,kw:74,fill:"#f1ede6"});J.hand(ret,300,470,"kept, flagged inactive, not deleted",{size:21,anchor:"middle"});
    return{scrub:p=>{ar.set(seg(p,.05,.25));v2.setAttribute("opacity",p>.2?1:0);st.setAttribute("opacity",p>.38?1:0);lbl.setAttribute("opacity",p>.45?1:0);ret.setAttribute("opacity",p>.65?1:0)},feat:()=>[320,110]}}},
  {t:"Then the cycle closes",b:["services refresh, affected caches","rebuild, metadata revision dates","advance, subscribers are notified"],build(g){const R=[["services refreshed"],["caches rebuilt"],["metadata revision date advanced"],["subscribers notified"]];
    const rs=R.map((r,i)=>{const y=100+i*72,o=el("g",{opacity:0},g);J.tick(o,80,y-6,"var(--green-500)",1.3);J.hand(o,104,y,r[0],{size:26});return o});
    const n=el("g",{opacity:0},g);J.mono(n,300,430,"[X] layers · [Y] published services",{size:14,anchor:"middle",bold:1});J.mono(n,300,456,"[Z] records revised in the last cycle",{size:14,anchor:"middle",bold:1});
    return{scrub:p=>{rs.forEach((o,i)=>o.setAttribute("opacity",p>.05+i*.14?1:0));n.setAttribute("opacity",p>.65?1:0)},feat:()=>[70,94]}}}
]})}
function S0(S){const r=S.getBoundingClientRect();return Math.min(r.width/600,r.height/520)||1}
