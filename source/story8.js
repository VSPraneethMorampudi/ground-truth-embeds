/* ============================================================ v8 · THE NEW STORY OUTLINE
   One figure per section of the re-ordered story (Data Creation → Geodatabase → Geo Portal →
   Mobile App → Mapping → Maintenance → the cycle). Written for a reader with no GIS background:
   every figure is one picture that changes step by step, with the same v7 rules as the rest —
   pen (Caveat) only for a note with an arrow, typed labels everywhere else, ONE optional Try it,
   real Chhattisgarh geometry wherever the point is about place, and a footnote saying what is
   real and what is illustrative. */
const V8={};
V8.clip=(A,key,d)=>{const id=A.S.closest(".view").id+"-"+key;if(!A.defs.querySelector("#"+id)){const cp=el("clipPath",{id},A.defs);el("path",{d:d||G.state},cp)}return`url(#${id})`};
V8.near=(arr,q)=>arr.reduce((a,b)=>Math.hypot(b[0]-q[0],b[1]-q[1])<Math.hypot(a[0]-q[0],a[1]-q[1])?b:a);
// dots that keep their on-screen size whatever the zoom
V8.dots=(L,parent,pts,o={})=>{const g=el("g",{},parent),r=o.r||3.2,sw=o.sw||1;const cs=pts.map(p=>el("circle",{cx:p[0],cy:p[1],fill:o.fill||"var(--dv-blue-500)",stroke:o.stroke||"#fff"},g));
  L.on(u=>cs.forEach(c=>{c.setAttribute("r",r*u);c.setAttribute("stroke-width",sw*u)}));g.cs=cs;return g};
V8.diam=(L,parent,pts,o={})=>{const g=el("g",{},parent),z=o.z||8;const rs=pts.map(p=>el("rect",{fill:o.fill||"#fff",stroke:o.stroke||"var(--dv-aqua-600)"},g));
  L.on(u=>rs.forEach((r,i)=>{const p=pts[i],k=z*u;r.setAttribute("x",p[0]-k/2);r.setAttribute("y",p[1]-k/2);r.setAttribute("width",k);r.setAttribute("height",k);r.setAttribute("stroke-width",1.8*u);r.setAttribute("transform",`rotate(45 ${p[0]} ${p[1]})`)}));return g};
V8.tick=(g,x,y,k=1,c="var(--green-500)")=>el("path",{d:`M${x-10*k},${y} L${x-3*k},${y+8*k} L${x+12*k},${y-9*k}`,fill:"none",stroke:c,"stroke-width":4*k,"stroke-linecap":"round","stroke-linejoin":"round",pathLength:1,"stroke-dasharray":1,"stroke-dashoffset":1},g);
V8.cross=(g,x,y,k=1,c="var(--red-500)")=>el("path",{d:`M${x-9*k},${y-9*k} L${x+9*k},${y+9*k} M${x+9*k},${y-9*k} L${x-9*k},${y+9*k}`,fill:"none",stroke:c,"stroke-width":4*k,"stroke-linecap":"round",pathLength:1,"stroke-dasharray":1,"stroke-dashoffset":1},g);
V8.chip=(A,g,x,y,label,o={})=>{const w=o.w||label.length*8.6+26,h=o.h||28;const c=el("g",{},g);
  el("rect",{x,y,width:w,height:h,rx:h/2,fill:o.fill||"var(--green-50)",stroke:o.stroke||"var(--green-100)"},c);A.hand(c,x+w/2,y+h/2+5.5,label,{size:o.size||20,bold:1,anchor:"middle",fill:o.ink||"var(--green-700)"});return c};
// a paper card that sits on the page with a soft shadow
V8.card=(A,g,x,y,w,h,o={})=>{const c=el("g",{},g);el("rect",{x:x+3,y:y+6,width:w,height:h,rx:o.rx||12,fill:"rgba(60,50,40,.12)",filter:`url(#${A.S.closest(".view").id}-soft)`},c);
  el("rect",{x,y,width:w,height:h,rx:o.rx||12,fill:o.fill||"#fffdf7",stroke:o.stroke||"#d9d4cc","stroke-width":o.sw||1.2},c);return c};
// the state, small, as a plain group in illustration space
V8.mini=(g,cx,cy,k,o={})=>{const t=el("g",{transform:`translate(${cx-260*k} ${cy-322*k}) scale(${k})`},g);
  el("path",{d:G.state,fill:o.fill||"#fbfaf8",stroke:o.stroke||"#8f887e","stroke-width":o.sw||1.4,"vector-effect":"non-scaling-stroke","stroke-linejoin":"round"},t);
  if(o.dist!==false){const dg=el("g",{fill:"none",stroke:o.dc||"#cfc8bd","stroke-width":.8,"vector-effect":"non-scaling-stroke"},t);G.districts.forEach(d=>el("path",{d:d.d,"vector-effect":"non-scaling-stroke"},dg))}return t};
V8.area=d=>{let A=0;d.split("M").filter(Boolean).forEach(r=>{const P=r.replace(/Z/g,"").split("L").map(v=>v.split(",").map(Number));for(let i=0,j=P.length-1;i<P.length;j=i++)A+=(P[j][0]+P[i][0])*(P[j][1]-P[i][1])});return Math.abs(A/2)};

/* ============================================================ 1 · DATA CREATION */
SPEC.create={W:560,H:600,portH:560,foot:"Boundaries, rivers, rail and the degree ticks are real. The scan and the village photo are illustrations.",
 draw(A){const s=A.st,V0={cx:262,cy:316,w:620};s.V0=V0;
  // ---- the legacy record: a printed sheet, scanned a little crooked, one ink. No props: a real
  // department scan has a neatline with degree ticks, a title block and nothing else
  s.old=el("g",{transform:"rotate(-1.6 280 300)"},A.ill);
  A.defs.insertAdjacentHTML("beforeend",`<filter id="create-ink" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter>`);
  s.LO=A.lens(s.old,{paper:"#f1efe9",view:V0,w:560,h:600});const go=el("g",{filter:"url(#create-ink)"},s.LO.g);
  const ink="#34322d",c=V8.clip(A,"st");
  const gr=el("g",{fill:"none",stroke:"#bdb8ad","stroke-width":.7,"vector-effect":"non-scaling-stroke"},go);G.grat.forEach(l=>el("path",{d:l.d,"vector-effect":"non-scaling-stroke"},gr));
  el("path",{d:G.state,fill:"#f7f5f0",stroke:"none"},go);
  const od=el("g",{fill:"none",stroke:ink,"stroke-width":.9,"stroke-dasharray":"7 2.5 1.5 2.5","vector-effect":"non-scaling-stroke"},go);G.districts.forEach(d=>el("path",{d:d.d,"vector-effect":"non-scaling-stroke"},od));
  const orv=el("g",{fill:"none",stroke:ink,"stroke-width":.8,"clip-path":c,"stroke-linecap":"round",opacity:.75},go);G.ctx.rivers.forEach(r=>el("path",{d:r.d,"vector-effect":"non-scaling-stroke"},orv));
  el("path",{d:G.ctx.rail,fill:"none",stroke:ink,"stroke-width":1.6,"clip-path":c,"vector-effect":"non-scaling-stroke"},go);el("path",{d:G.ctx.rail,fill:"none",stroke:"#f7f5f0","stroke-width":.7,"stroke-dasharray":"4 4","clip-path":c,"vector-effect":"non-scaling-stroke"},go);
  el("path",{d:G.state,fill:"none",stroke:ink,"stroke-width":1.8,"vector-effect":"non-scaling-stroke","stroke-linejoin":"round"},go);
  G.ctx.cities.filter(c=>c.cg).forEach(c=>s.LO.mark(c.xy,g=>{el("rect",{x:-3,y:-3,width:6,height:6,fill:ink},g);
    txt({x:c.n==="Bhilai"?-6:6,y:c.n==="Bhilai"?12:-5,"text-anchor":c.n==="Bhilai"?"end":"start",style:`fill:${ink};letter-spacing:.6px`,"font-size":10,"font-weight":600},g,c.n.toUpperCase())}));
  // neatline with the real degree ticks where the meridians and parallels meet it
  const nl=el("g",{"pointer-events":"none"},s.old),N0=22,N1=538,M0=22,M1=578;
  el("rect",{x:14,y:14,width:532,height:572,fill:"none",stroke:ink,"stroke-width":1.6},nl);el("rect",{x:N0,y:M0,width:N1-N0,height:M1-M0,fill:"none",stroke:ink,"stroke-width":.8},nl);
  const at=(lo,la)=>s.LO.ill(ll2xy(lo,la)),fs={style:`fill:${ink}`,"font-size":9.5};
  const solve=(f,lo,hi,want)=>{for(let k=0;k<40;k++){const m=(lo+hi)/2;if(f(m)<want)lo=m;else hi=m}return(lo+hi)/2};
  for(let lo=80;lo<=85;lo++){const la=solve(v=>-at(lo,v)[1],10,30,-M1),p=at(lo,la);if(p[0]>N0+14&&p[0]<N1-14){el("path",{d:`M${p[0]},${M1} L${p[0]},${M1-7}`,stroke:ink},nl);txt({x:p[0],y:M1+11,"text-anchor":"middle",...fs},nl,lo+"°E")}}
  for(let la=18;la<=24;la++){const lo=solve(v=>at(v,la)[0],70,90,N0),p=at(lo,la);if(p[1]>M0+14&&p[1]<M1-14){el("path",{d:`M${N0},${p[1]} L${N0+7},${p[1]}`,stroke:ink},nl);txt({x:N0-3,y:p[1]+3,"text-anchor":"end",...fs},nl,la+"°N")}}
  const tb=el("g",{},nl);el("rect",{x:392,y:520,width:140,height:52,fill:"#f1efe9",stroke:ink,"stroke-width":.8},tb);
  txt({x:462,y:541,"text-anchor":"middle",style:`fill:${ink};letter-spacing:2px`,"font-size":12,"font-weight":700},tb,"CHHATTISGARH");
  txt({x:462,y:558,"text-anchor":"middle",style:`fill:${ink}`,"font-size":9.5},tb,"District boundaries");
  // the scanner bed shows along one edge of a crooked scan
  el("path",{d:"M14,14 L546,14",stroke:"rgba(0,0,0,.10)","stroke-width":5},nl);
  // ---- the digital layer, revealed by the scanner
  s.dig=el("g",{},A.ill);
  s.LD=A.lens(s.dig,{paper:"#fbfaf8",view:V0,w:560,h:600});const gd=s.LD.g;
  s.ctx=drawContext(gd,{labels:false,rivers:true,rail:true,roads:true,cities:true,riverLabels:false});
  s.ctx.rivers.setAttribute("clip-path",V8.clip(A,"st"));s.ctx.roads.setAttribute("clip-path",V8.clip(A,"st"));s.ctx.rail.setAttribute("clip-path",V8.clip(A,"st"));
  s.aw=V8.dots(s.LD,gd,G.stack.aw,{r:2.6,sw:.7});
  // scanner: the line between paper and digital
  const cid="create-swipe",cp=el("clipPath",{id:cid},A.defs);s.sw=el("rect",{x:0,y:0,width:0,height:600},cp);s.dig.setAttribute("clip-path",`url(#${cid})`);
  s.scan=el("g",{},A.ill);s.scanL=el("path",{d:"M0,0 L0,600",stroke:"var(--dv-aqua-600)","stroke-width":3},s.scan);
  el("path",{d:"M0,0 L0,600",stroke:"rgba(0,144,177,.18)","stroke-width":18},s.scan);
  s.knob=el("g",{},s.scan);el("circle",{cx:0,cy:300,r:22,fill:"#fff",stroke:"var(--dv-aqua-600)","stroke-width":3},s.knob);
  el("path",{d:"M-8,293 L-13,300 L-8,307 M8,293 L13,300 L8,307",fill:"none",stroke:"var(--dv-aqua-700)","stroke-width":2.6,"stroke-linecap":"round","stroke-linejoin":"round"},s.knob);
  s.tags=el("g",{},A.ill);s.tagD=V8.chip(A,s.tags,0,14,"Digital",{fill:"#e6f4f7",stroke:"#b5dde6",ink:"var(--dv-aqua-700)"});s.tagP=V8.chip(A,s.tags,0,14,"Scan",{w:62,fill:"#fff",stroke:"var(--n200)",ink:"var(--n800)"});
  s.setSw=x=>{s.sw.setAttribute("width",x);s.scan.setAttribute("transform",`translate(${x} 0)`);s.scan.style.opacity=x<=0||x>=560?0:1;
    s.tagD.setAttribute("transform",`translate(${clamp(x-102,30,446)} 18)`);s.tagD.style.opacity=x>120?1:0;s.tagP.setAttribute("transform",`translate(${clamp(x+18,30,470)} 18)`);s.tagP.style.opacity=x<450?1:0};
  s.setSw(0);
  // ---- steps 3-4: one village, seen two ways. The old map's lines (dark ink) lie over a satellite
  // photo; what the photo shows and the map lacks is traced in orange. A key in the corner says which
  // is which, so no line is left unexplained.
  s.gnd=el("g",{opacity:0},A.ill);V8.card(A,s.gnd,0,0,560,600,{fill:"#f1efe9",rx:14});
  {const cp=el("clipPath",{id:"create-gnd"},A.defs);el("rect",{x:0,y:0,width:560,height:600,rx:14},cp)}
  const gi=el("g",{"clip-path":"url(#create-gnd)"},s.gnd);
  // the photo: farm plots, trees along a stream, roofs
  s.photo=el("g",{opacity:0},gi);const ph=s.photo;el("rect",{x:0,y:0,width:560,height:600,fill:"#8c955f"},ph);
  const fc=["#a3a86e","#b9b07c","#94a065","#c6bb8b","#adac72","#87955c","#bfb382"];let sd=11;const rn=()=>(sd=sd*16807%2147483647)/2147483647;
  const fg=el("g",{transform:"rotate(-12 280 300)"},ph);
  for(let x=-120;x<700;){const w=60+rn()*70;for(let y=-120;y<720;){const h=44+rn()*60,j=()=>(rn()-.5)*6;
      el("path",{d:`M${x+1.2+j()},${y+1.2+j()} L${x+w-1.2+j()},${y+1.2+j()} L${x+w-1.2+j()},${y+h-1.2+j()} L${x+1.2+j()},${y+h-1.2+j()}Z`,fill:fc[Math.floor(rn()*fc.length)]},fg);y+=h}x+=w}
  const brook="M-20,96 C110,150 170,232 132,330 C104,410 150,520 214,620";
  el("path",{d:brook,fill:"none",stroke:"#55693f","stroke-width":30,"stroke-linecap":"round",opacity:.85},ph);
  el("path",{d:brook,fill:"none",stroke:"#6f8a9c","stroke-width":7,"stroke-linecap":"round"},ph);
  const tr=el("g",{},ph);for(let k=0;k<70;k++){const t=k/70;
    // trees sit beside the stream: sample the curve by hand
    const P=[[-20,96],[110,150],[170,232],[132,330]],Q=[[132,330],[104,410],[150,520],[214,620]],bz=(P,u)=>{const m=1-u;return[0,1].map(i=>m*m*m*P[0][i]+3*m*m*u*P[1][i]+3*m*u*u*P[2][i]+u*u*u*P[3][i])};
    const c=t<.5?bz(P,t*2):bz(Q,t*2-1),o=(rn()-.5)*44;el("circle",{cx:c[0]+o,cy:c[1]+(rn()-.5)*16,r:6+rn()*7,fill:rn()<.5?"#4f6438":"#5d7342"},tr)}
  // roads on the photo: the old one, and the one built since
  const oldRd="M-10,470 C80,440 160,392 246,340",newRd="M300,318 C360,296 410,268 470,250 C510,238 540,232 580,226";
  el("path",{d:oldRd+" C266,330 284,322 300,318",fill:"none",stroke:"#e2d6b8","stroke-width":9,"stroke-linecap":"round"},ph);
  el("path",{d:newRd,fill:"none",stroke:"#e9e0c8","stroke-width":9,"stroke-linecap":"round"},ph);
  const roofs=(g,list,col)=>list.map(([x,y,w,h,r])=>el("rect",{x:x-w/2,y:y-h/2,width:w,height:h,rx:1.5,fill:col(),stroke:"rgba(0,0,0,.18)","stroke-width":1,transform:`rotate(${r} ${x} ${y})`},g));
  const oldH=[];for(let k=0;k<24;k++){const a=rn()*6.283,d=Math.sqrt(rn())*58;oldH.push([262+Math.cos(a)*d*1.2,312+Math.sin(a)*d,12+rn()*8,10+rn()*6,(rn()-.5)*40])}
  roofs(ph,oldH,()=>rn()<.5?"#a8604a":"#8a8780");
  s.newH=[[420,236,16,12,-14],[446,226,15,12,-12],[472,216,17,13,-10],[432,266,15,12,-14],[460,258,16,12,-12],[488,248,15,12,-10],[516,236,16,12,-8]];
  roofs(ph,s.newH,()=>"#d9d6cf");
  s.school=el("g",{opacity:0},ph);el("rect",{x:352,y:356,width:76,height:40,rx:2,fill:"#cfd3d6",stroke:"rgba(0,0,0,.2)",transform:"rotate(-12 390 376)"},s.school);
  el("rect",{x:352,y:404,width:52,height:30,rx:2,fill:"#c9a77a",transform:"rotate(-12 378 419)"},s.school);
  // the old map, on top: the road as far as the village, and the village edge
  s.ink=el("g",{},gi);const ink2="#2f2d29";
  el("path",{d:oldRd,fill:"none",stroke:"#f7f5f0","stroke-width":7,"stroke-linecap":"round"},s.ink);el("path",{d:oldRd,fill:"none",stroke:ink2,"stroke-width":3.2,"stroke-linecap":"round"},s.ink);
  el("path",{d:brook,fill:"none",stroke:ink2,"stroke-width":1.6,"stroke-dasharray":"8 4"},s.ink);
  el("path",{d:"M188,300 C190,250 250,236 300,250 C344,262 350,330 330,362 C300,400 220,398 196,366 C182,346 186,320 188,300Z",fill:"none",stroke:ink2,"stroke-width":2,"stroke-dasharray":"9 3 2 3"},s.ink);
  s.endDot=el("circle",{cx:246,cy:340,r:6,fill:"#f7f5f0",stroke:ink2,"stroke-width":2.6},s.ink);
  // traced: the new road, the new houses, later the school
  s.tr=el("g",{},gi);const or="var(--dv-orange-500)";
  s.newRoad=el("path",{d:"M246,340 C266,330 284,322 300,318 "+newRd.slice(newRd.indexOf("C")),fill:"none",stroke:or,"stroke-width":5,"stroke-linecap":"round",pathLength:1,"stroke-dasharray":1,"stroke-dashoffset":1},s.tr);
  s.newOut=s.newH.map(([x,y,w,h,r])=>el("rect",{x:x-w/2-2,y:y-h/2-2,width:w+4,height:h+4,fill:"none",stroke:or,"stroke-width":2.6,transform:`rotate(${r} ${x} ${y})`,opacity:0},s.tr));
  s.schOut=el("path",{d:"M352,356 h76 v40 h-76Z",fill:"rgba(201,93,46,.12)",stroke:or,"stroke-width":2.8,transform:"rotate(-12 390 376)",pathLength:1,"stroke-dasharray":1,"stroke-dashoffset":1},s.tr);
  // corner furniture: what the photo is, and the key
  s.pchip=el("g",{opacity:0},s.gnd);V8.card(A,s.pchip,388,16,158,32,{rx:16,fill:"#fff"});s.pyear=A.hand(s.pchip,467,38,"Satellite photo, 2024",{size:18,bold:1,anchor:"middle"});
  s.key=el("g",{},s.gnd);V8.card(A,s.key,16,518,214,66,{fill:"rgba(255,255,255,.96)"});
  el("path",{d:"M32,540 L62,540",stroke:ink2,"stroke-width":3.2,"stroke-linecap":"round"},s.key);A.hand(s.key,72,546,"On the old map",{size:19});
  s.keyNew=el("g",{opacity:0},s.key);el("path",{d:"M32,566 L62,566",stroke:or,"stroke-width":5,"stroke-linecap":"round"},s.keyNew);A.hand(s.keyNew,72,572,"Added from the photo",{size:19});
  // the change log for updates
  s.log=el("g",{opacity:0},A.ill);V8.card(A,s.log,16,16,250,178);A.hand(s.log,36,48,"Change log",{size:25,bold:1});
  s.logRows=[["New school added","traced from the 2026 photo"],["Road widened","seen on the same photo"],["Each change saved","with who did it, and when"]].map(([a,b],i)=>{const r=el("g",{opacity:0},s.log),y=78+i*40;
    el("circle",{cx:40,cy:y-5,r:4,fill:i<2?or:"var(--n500)"},r);A.hand(r,52,y,a,{size:19,bold:1});A.hand(r,52,y+18,b,{size:17,fill:"var(--n600)"});return r});
  },
 steps:[]};
{const I=SPEC.create;
 const flat=A=>{const s=A.st;A.op(s.tags,1,200);A.op([s.gnd,s.log],0,250);A.op(s.dig,1,200);A.op(s.aw,1,200);A.op(s.ctx.city,1,200)};
 const ground=(A,photo,year)=>{const s=A.st;s.setSw(560);A.op([s.tags,s.old],0,250);s.newRoad.style.strokeWidth="";s.pyear.textContent=`Satellite photo, ${year}`;
   s.school.style.opacity=0;s.schOut.setAttribute("stroke-dashoffset",1);s.logRows.forEach(r=>r.style.opacity=0);A.op(s.log,0,150);
   s.photo.style.opacity=photo?1:0;s.pchip.style.opacity=photo?1:0;return A.op([s.dig],0,300).then(()=>A.op(s.gnd,1,350))};
 const traced=(A,on)=>{const s=A.st;s.newRoad.setAttribute("stroke-dashoffset",on?0:1);s.newOut.forEach(o=>o.style.opacity=on?1:0);s.keyNew.style.opacity=on?1:0};
 I.steps=[
 {nav:"Old records",go:async A=>{const s=A.st;flat(A);s.LD.set(s.V0);s.LO.set(s.V0);s.setSw(0);await A.op(s.old,1,400)},
  notes:[{at:"l0",t:"Old printed maps",b:["decades of survey sheets","and registers, kept on paper","or as flat scans"],to:A=>A.st.LO.ill([212,250])},
         {at:"r0",t:"Precious, but scattered",b:["each sheet drawn at its","own scale, by its own","office, in its own style"]}]},
 {nav:"Paper to digital",go:async A=>{const s=A.st;flat(A);s.LD.set(s.V0);s.LO.set(s.V0);A.op(s.old,1,200);s.setSw(0);await A.wait(250);await A.tw(1600,t=>s.setSw(560*t*.62))},
  notes:[{at:"l0",t:"Scanned, then traced",c:"var(--dv-aqua-700)",b:["a road becomes a line,","a village a point, a","boundary an outline"],to:A=>[+A.st.sw.getAttribute("width"),276]},
         {at:"r0",t:"Straightened and pinned",b:["the crooked scan is lined up","with the earth, so every","shape sits on its true spot"]}]},
 {nav:"New data",go:async A=>{const s=A.st;traced(A,false);await ground(A,false,2024);await A.wait(500);
   await Promise.all([A.op(s.photo,1,900),A.op(s.pchip,1,600)]);await A.wait(500);
   await A.draw(s.newRoad,1,1200);for(const o of s.newOut){await A.op(o,1,120)}await A.op(s.keyNew,1,300)},
  notes:[{at:"l0",t:"The old map stops here",b:["it has the old road and","the village, nothing more"],to:()=>[240,344]},
         {at:"r0",t:"The photo shows more",c:"var(--dv-orange-700)",b:["a new road and new houses.","They are traced in orange,","then checked on the ground","with a GPS visit"],to:()=>[470,272]}]},
 {nav:"Keep current",go:async A=>{const s=A.st;await ground(A,true,2024);traced(A,true);await A.wait(400);
   s.pyear.textContent="Satellite photo, 2026";await A.op(s.school,1,700);await A.draw(s.schOut,1,700);
   await A.tw(500,t=>s.newRoad.style.strokeWidth=lerp(5,9,t)+"px");await A.op(s.log,1,300);for(const r of s.logRows)await A.op(r,1,240)},
  notes:[{at:"l0",dy:260,t:"A newer photo",b:["two years on, a school","has been built and the","road widened"],to:()=>[392,398]},
         {at:"r0",t:"Every change is recorded",b:["anyone can see what","changed, and when"],to:()=>[266,110]}]}]}

/* ============================================================ 2 · GEODATABASE */
SPEC.geodatabase={W:560,H:620,portH:600,foot:"Boundaries, rivers, roads and rail are real. Centres, nodes, leases, the record and the department list are examples.",
 draw(A){const s=A.st,KEYS=["bnd","net","pla"];s.KEYS=KEYS;s.pl={};
  s.stack=el("g",{},A.ill);
  KEYS.forEach(k=>{const pg=el("g",{},s.stack),inner=el("g",{},pg);s.pl[k]={g:pg,inner};
    el("path",{d:G.state,fill:"rgba(60,50,40,.10)",transform:"translate(10 14)"},inner);
    el("path",{d:G.state,fill:k==="bnd"?"#fbfaf8":"rgba(251,250,248,.66)",stroke:"#8f887e","stroke-width":1.3,"vector-effect":"non-scaling-stroke"},inner);
    if(k==="bnd"){const dg=el("g",{fill:"none",stroke:"#b9b2a8","stroke-width":1,"vector-effect":"non-scaling-stroke"},inner);G.districts.forEach(d=>el("path",{d:d.d,"vector-effect":"non-scaling-stroke"},dg))}
    if(k==="net"){const c=V8.clip(A,"st");el("path",{d:G.ctx.roads,fill:"none",stroke:"var(--road)","stroke-width":1.4,"clip-path":c,"vector-effect":"non-scaling-stroke"},inner);
      el("path",{d:G.ctx.rail,fill:"none",stroke:"var(--rail)","stroke-width":1.4,"clip-path":c,"vector-effect":"non-scaling-stroke"},inner);
      const rv=el("g",{fill:"none",stroke:"var(--water)","stroke-width":1.6,"clip-path":c},inner);G.ctx.rivers.forEach(r=>el("path",{d:r.d,"vector-effect":"non-scaling-stroke"},rv))}
    if(k==="pla"){el("path",{d:G.stack.mines,fill:"var(--dv-orange-500)",stroke:"var(--dv-orange-700)","stroke-width":1,"vector-effect":"non-scaling-stroke"},inner);
      G.stack.aw.forEach(p=>el("circle",{cx:p[0],cy:p[1],r:4.4,fill:"var(--dv-blue-500)"},inner));G.stack.gp.forEach(p=>el("rect",{x:p[0]-5,y:p[1]-5,width:10,height:10,fill:"#fff",stroke:"var(--dv-aqua-600)","stroke-width":1.6,"vector-effect":"non-scaling-stroke"},inner));
      s.me=el("circle",{cx:G.stack.pin[0],cy:G.stack.pin[1],r:9,fill:"var(--dv-blue-700)",stroke:"#fff","stroke-width":2.4,"vector-effect":"non-scaling-stroke"},inner)}});
  s.iso=(p,cy)=>[260+(p[0]-p[1])*.5+30,cy+(p[0]+p[1])*.25-145];
  s.pinLine=el("path",{fill:"none",stroke:"var(--n900)","stroke-width":1.8,"stroke-dasharray":"5 4",opacity:0},s.stack);
  s.names=el("g",{opacity:0},s.stack);
  s.gap=20;s.base=470;
  s.place=()=>{KEYS.forEach((k,i)=>{const cy=s.base-i*s.gap;s.pl[k].cy=cy;s.pl[k].inner.setAttribute("transform",`translate(290 ${cy-145}) matrix(.5 .25 -.5 .25 0 0)`)});
    const a=s.iso(G.stack.pin,s.pl.bnd.cy),b=s.iso(G.stack.pin,s.pl.pla.cy);s.pinLine.setAttribute("d",`M${a[0]},${a[1]} L${b[0]},${b[1]}`)};
  s.spread=(gap,base,ms)=>{const f=s.gap,fb=s.base;return A.tw(ms,t=>{s.gap=lerp(f,gap,t);s.base=lerp(fb,base,t);s.place()})};s.place();
  {const P=G.state.split(/[MLZ]/).filter(Boolean).map(v=>v.split(",").map(Number));s.tip=P.reduce((a,b)=>b[0]-b[1]>a[0]-a[1]?b:a)}
  s.label=()=>{s.names.innerHTML="";[["bnd","Boundaries",""],["net","Roads and","rivers"],["pla","Places and","assets"]].forEach(([k,a,b])=>{const p=s.iso(s.tip,s.pl[k].cy);
    el("path",{d:`M${p[0]+4},${p[1]} L${p[0]+16},${p[1]}`,stroke:"var(--n500)","stroke-width":1.4},s.names);
    A.hand(s.names,p[0]+20,p[1]+(b?-2:6),a,{size:22,bold:1,fill:"var(--n800)"});if(b)A.hand(s.names,p[0]+20,p[1]+17,b,{size:22,bold:1,fill:"var(--n800)"})})};
  // the record card
  s.card=el("g",{opacity:0},A.ill);V8.card(A,s.card,150,316,392,286);
  el("circle",{cx:180,cy:350,r:9,fill:"var(--dv-blue-700)",stroke:"#fff","stroke-width":2.4},s.card);A.hand(s.card,198,357,"Anganwadi centre",{size:27,bold:1});
  A.hand(s.card,172,394,"AWC-RPR-00412",{size:27,mono:1,bold:1,fill:"var(--n700)"});
  [["District","Raipur"],["Type","Anganwadi centre"],["Status","Functional"],["Location","21.251384° N, 81.629641° E"],["Village","linked by its code"]].forEach(([k,v],i)=>{const y=430+i*34;
    el("path",{d:`M172,${y+10} L522,${y+10}`,stroke:"#ece6da"},s.card);A.hand(s.card,172,y,k,{size:19,bold:1,fill:"var(--n600)"});A.hand(s.card,266,y,v,{size:k==="Location"?17:20,mono:k==="Location",fill:"var(--n900)"})});
  s.cardLine=el("path",{fill:"none",stroke:"var(--n700)","stroke-width":1.8,"stroke-dasharray":"4 4",opacity:0},A.ill);
  // the rules
  s.rules=el("g",{opacity:0},A.ill);s.rr=[];
  const R=[["A village sits inside its block","checked against the block map",true],["A road can't run along a river","a mistake in tracing",false],["No code is left blank","every place needs its code",false]];
  R.forEach(([t,b,ok],i)=>{const y=14+i*200,g=el("g",{opacity:0},s.rules);V8.card(A,g,10,y,540,176);
    const box=el("g",{},g);el("rect",{x:28,y:y+18,width:170,height:140,rx:8,fill:"#f4f2ed"},box);
    if(i===0){el("path",{d:`M44,${y+40} L170,${y+30} L182,${y+120} L120,${y+146} L52,${y+130}Z`,fill:"none",stroke:"var(--n700)","stroke-width":2,"stroke-dasharray":"7 4"},box);
      el("path",{d:`M86,${y+64} L136,${y+60} L146,${y+104} L96,${y+112}Z`,fill:"#eef3ea",stroke:"var(--green-700)","stroke-width":2},box)}
    if(i===1){el("path",{d:`M28,${y+104} C80,${y+80} 130,${y+120} 198,${y+90}`,fill:"none",stroke:"var(--water)","stroke-width":16,"stroke-linecap":"round",opacity:.75},box);
      el("path",{d:`M54,${y+96} C90,${y+86} 120,${y+108} 168,${y+96}`,fill:"none",stroke:"var(--n800)","stroke-width":4,"stroke-linecap":"round"},box);el("path",{d:`M70,${y+30} L70,${y+150}`,stroke:"var(--road)","stroke-width":5},box)}
    if(i===2){el("rect",{x:44,y:y+40,width:138,height:96,rx:6,fill:"#fff",stroke:"var(--n300)"},box);A.hand(box,56,y+68,"Name",{size:17,bold:1,fill:"var(--n600)"});el("path",{d:`M110,${y+66} L172,${y+66}`,stroke:"var(--n700)","stroke-width":2},box);
      A.hand(box,56,y+104,"Code",{size:17,bold:1,fill:"var(--n600)"});el("rect",{x:106,y:y+86,width:68,height:26,rx:4,fill:"var(--red-50)",stroke:"var(--red-500)","stroke-width":1.6,"stroke-dasharray":"4 3"},box)}
    A.hand(g,222,y+62,t,{size:24,bold:1});A.hand(g,222,y+94,b,{size:20,fill:"var(--n600)"});
    const scan=el("rect",{x:28,y:y+18,width:6,height:140,fill:"var(--dv-aqua-500)",opacity:0},g);
    const mk=ok?V8.tick(g,508,y+130,1.6):V8.cross(g,508,y+130,1.5);
    const res=ok?V8.chip(A,g,222,y+118,"Accepted"):V8.chip(A,g,222,y+118,"Sent back to fix",{fill:"var(--red-50)",stroke:"var(--red-100)",ink:"var(--red-700)"});res.style.opacity=0;
    s.rr.push({g,scan,mk,res,y})});
  // the library cabinet
  s.lib=el("g",{opacity:0},A.ill);
  const D0=[["Boundaries","Revenue"],["Roads","Public Works"],["Rivers and water","Water Resources"],["Forests","Forest"],["Schools","Education"],["Health centres","Health"],["Anganwadi centres","Women & Child"]];
  V8.card(A,s.lib,176,20,208,580,{fill:"#efe9dd",stroke:"#b9ae9b",rx:10});A.hand(s.lib,280,52,"Geodatabase",{size:24,bold:1,anchor:"middle"});
  s.dw=D0.map(([n,d],i)=>{const y=66+i*70,g=el("g",{},s.lib);const face=A.rough(g,190,y,180,58,{fill:"#fbf8f2",stroke:"#a89c87"});
    const lab=A.hand(g,280,y+26,n,{size:20,bold:1,anchor:"middle",fill:"var(--n900)"});const from=A.hand(g,280,y+45,"from "+d,{size:16,anchor:"middle",fill:"var(--n600)"});
    const side=i%2?1:0,cx=side?410:4,chip=el("g",{},s.lib);V8.card(A,chip,cx,y+12,146,40,{rx:20,fill:"#fff"});A.hand(chip,cx+73,y+38,d,{size:19,anchor:"middle",fill:"var(--n800)"});
    return{g,face,lab,from,chip,side,y}});
  s.home=el("g",{opacity:0},s.lib);V8.chip(A,s.home,196,558,"one home, one copy",{w:168,fill:"#fff",stroke:"#d9d4cc",ink:"var(--n800)"})},
 steps:[]};
{const I=SPEC.geodatabase;
 const scene=(A,k)=>{const s=A.st;return Promise.all([A.op(s.stack,k==="stack"?1:0,350),A.op(s.rules,k==="rules"?1:0,350),A.op(s.lib,k==="lib"?1:0,350),A.op([s.card,s.cardLine],0,200)])};
 const spread=async(A,ms)=>{const s=A.st;s.KEYS.forEach(k=>s.pl[k].g.style.opacity=1);await s.spread(140,470,ms);s.label();A.op(s.names,1,400);await A.op(s.pinLine,1,300)};
 const meAt=A=>{const s=A.st;return s.iso(G.stack.pin,s.pl.pla.cy)};
 const openCard=async A=>{const s=A.st,p=meAt(A);s.cardLine.setAttribute("d",`M${p[0]},${p[1]+10} L${p[0]},${316}`);await Promise.all([A.op([s.pl.bnd.g,s.pl.net.g],.12,300),A.op(s.names,0,200)]);A.op(s.cardLine,1,300);await A.op(s.card,1,400)};
 I.steps=[
 {nav:"Layers",go:async A=>{const s=A.st;await scene(A,"stack");A.op(s.names,0,150);A.op(s.pinLine,0,150);s.gap=20;s.base=470;s.place();await A.wait(250);await spread(A,1200)},
  notes:[{at:"l0",t:"Stacked like sheets",b:["each kind of place on its","own layer: boundaries,","roads and rivers, places"],to:A=>{const s=A.st;return s.iso([140,420],s.pl.bnd.cy)}},
         {at:"r0",t:"They line up exactly",b:["the same spot sits in the","same place on every layer"],to:A=>meAt(A),ring:14}]},
 {nav:"Details",go:async A=>{const s=A.st;await scene(A,"stack");if(s.gap<130)await spread(A,500);else{s.label();A.op(s.names,1,200);A.op(s.pinLine,1,200)}await openCard(A)},
  notes:[{at:"l0",t:"Every place carries its facts",b:["its name, type, code","and exact location"]},
         {at:"r0",t:"Ask for one centre",b:["and the record comes back","with where it is and what","it is"],to:A=>meAt(A),ring:14}]},
 {nav:"Rules",go:async A=>{const s=A.st;s.rr.forEach(r=>{r.g.style.opacity=0;r.mk.setAttribute("stroke-dashoffset",1);r.res.style.opacity=0;r.scan.style.opacity=0});await scene(A,"rules");
   for(const r of s.rr){await A.op(r.g,1,250);r.scan.style.opacity=.6;await A.tw(650,t=>r.scan.setAttribute("x",28+t*164));r.scan.style.opacity=0;await A.draw(r.mk,1,300);await A.op(r.res,1,200)}},
  notes:[{at:"l0",t:"Rules at the door",b:["each record is checked","before it is stored"],to:()=>[110,92]},
         {at:"r0",t:"Mistakes stay out",c:"var(--red-700)",b:["a road in a river or a","blank code is sent back","with the reason"],to:()=>[508,330]}]},
 {nav:"One home",go:async A=>{const s=A.st;s.dw.forEach(d=>{d.chip.style.opacity=1;d.chip.setAttribute("transform","");d.face.setAttribute("fill","#fbf8f2");d.from.style.opacity=0});s.home.style.opacity=0;await scene(A,"lib");await A.wait(200);
   for(const d of s.dw){const dx=d.side?-130:130;await Promise.all([A.tw(420,t=>d.chip.setAttribute("transform",`translate(${dx*t} 0)`)),A.op(d.chip,0,420)]);d.face.setAttribute("fill","#eef6f0");d.from.style.opacity=1}await A.op(s.home,1,300)},
  notes:[{at:"l0",t:"Like a library",b:["every layer has a fixed","shelf and a label"],to:()=>[192,140]},
         {at:"r0",t:"Every department",b:["sends to the same place,","so there is one copy,","not many"],to:()=>[340,325]}]}]}

/* ============================================================ 3 · GEO PORTAL */
SPEC.portal={W:600,H:560,portH:520,foot:"Boundaries, rivers, roads and rail are real. Centres, nodes and the Ask AI exchange are illustrative.",
 draw(A){const s=A.st;
  s.win=el("g",{},A.ill);V8.card(A,s.win,0,0,600,560,{fill:"#fff",stroke:"#cfcac3",rx:14});
  el("path",{d:"M0,14 Q0,0 14,0 L586,0 Q600,0 600,14 L600,42 L0,42Z",fill:"#ecebe7"},s.win);el("path",{d:"M0,42 L600,42",stroke:"#d9d4cc"},s.win);
  ["#e5675c","#e9b44c","#64b863"].forEach((c,i)=>el("circle",{cx:22+i*18,cy:21,r:6,fill:c},s.win));
  el("rect",{x:92,y:9,width:420,height:24,rx:12,fill:"#fff",stroke:"#dcd8d0"},s.win);icon(s.win,"lock",110,21,.42);A.hand(s.win,122,26,"Chhattisgarh State Geoportal",{size:19,fill:"var(--n700)"});
  // layer panel
  s.panel=el("g",{},s.win);el("rect",{x:0,y:42,width:190,height:518,fill:"#f8f7f4"},s.panel);el("path",{d:"M190,42 L190,560",stroke:"#e3dfd8"},s.panel);
  A.hand(s.panel,16,74,"Layers",{size:24,bold:1});
  s.LY=[["dist","Districts"],["riv","Rivers"],["road","Roads and rail"],["aw","Anganwadi centres"],["bn","Internet nodes"]].map(([k,n],i)=>{const y=100+i*46,g=el("g",{},s.panel);
    const tr=el("rect",{x:16,y,width:34,height:20,rx:10,fill:"var(--n300)"},g),kn=el("circle",{cx:26,cy:y+10,r:7,fill:"#fff"},g);A.hand(g,58,y+15,n,{size:18,fill:"var(--n800)"});
    const hit=el("rect",{x:8,y:y-8,width:176,height:36,fill:"transparent"},g);return{k,g,tr,kn,hit,on:false,y}});
  s.panelBig=el("g",{opacity:0},s.win);
  // the map
  s.L=A.lens(s.win,{x:190,y:42,w:410,h:518,view:{cx:258,cy:318,w:560}});const g=s.L.g;
  el("rect",{x:-3000,y:-3000,width:7000,height:7000,fill:"var(--land-out)"},g);G.ctx.states.forEach(t=>el("path",{d:t.d,fill:"#f1efeb",stroke:"#fff","stroke-width":1.4,"vector-effect":"non-scaling-stroke"},g));
  el("path",{d:G.state,fill:"#fff"},g);const c=V8.clip(A,"st");
  s.vill=el("g",{opacity:0},g);
  s.lay={};
  s.lay.road=el("g",{},g);el("path",{d:G.ctx.roads,fill:"none",stroke:"var(--road)","stroke-width":1.3,"clip-path":c,"vector-effect":"non-scaling-stroke"},s.lay.road);
  el("path",{d:G.ctx.rail,fill:"none",stroke:"var(--rail)","stroke-width":1.4,"clip-path":c,"vector-effect":"non-scaling-stroke"},s.lay.road);
  s.lay.riv=el("g",{fill:"none",stroke:"var(--water)","stroke-width":1.5,"clip-path":c},g);G.ctx.rivers.forEach(r=>el("path",{d:r.d,"vector-effect":"non-scaling-stroke"},s.lay.riv));
  s.lay.dist=el("g",{fill:"none",stroke:"#c3bcb1","stroke-width":1,"vector-effect":"non-scaling-stroke"},g);G.districts.forEach(d=>el("path",{d:d.d,"vector-effect":"non-scaling-stroke"},s.lay.dist));
  el("path",{d:G.state,fill:"none",stroke:"var(--outline)","stroke-width":1.6,"vector-effect":"non-scaling-stroke"},g);
  s.lay.bn=el("g",{},g);el("path",{d:G.stack.fibre,fill:"none",stroke:"var(--dv-aqua-600)","stroke-width":1.6,"vector-effect":"non-scaling-stroke"},s.lay.bn);el("path",{d:G.carto.fibre,fill:"none",stroke:"var(--dv-aqua-600)","stroke-width":1.3,"vector-effect":"non-scaling-stroke"},s.lay.bn);
  V8.diam(s.L,s.lay.bn,G.stack.gp.concat(G.carto.gp),{z:7});
  s.lay.aw=el("g",{},g);V8.dots(s.L,s.lay.aw,G.stack.aw.concat(G.carto.aw),{r:3.4,sw:1});
  const lab=el("g",{},g);const cities=G.ctx.cities.filter(c=>c.cg).map(c=>{const t=txt({x:c.xy[0],y:c.xy[1],class:"halo","font-weight":700,fill:"var(--n900)"},lab,c.n);return{c,t}});
  s.L.on(u=>cities.forEach(({c,t})=>{t.setAttribute("x",c.xy[0]+6*u);t.setAttribute("y",c.xy[1]-6*u);t.setAttribute("font-size",14*u);t.style.strokeWidth=3.6*u+"px";t.style.opacity=c.n==="Bhilai"&&u>.5?0:1}));
  s.hits=el("g",{},g);
  // high contrast copy
  s.hc=el("g",{opacity:0,"pointer-events":"none"},g);el("rect",{x:-3000,y:-3000,width:7000,height:7000,fill:"#0b0b0d"},s.hc);el("path",{d:G.state,fill:"#151518",stroke:"#ffd400","stroke-width":2.6,"vector-effect":"non-scaling-stroke"},s.hc);
  const hd=el("g",{fill:"none",stroke:"#f2f2f2","stroke-width":1.1,"vector-effect":"non-scaling-stroke"},s.hc);G.districts.forEach(d=>el("path",{d:d.d,"vector-effect":"non-scaling-stroke"},hd));
  const hr=el("g",{fill:"none",stroke:"#3fd8ff","stroke-width":2,"clip-path":c},s.hc);G.ctx.rivers.forEach(r=>el("path",{d:r.d,"vector-effect":"non-scaling-stroke"},hr));
  const hl=el("g",{},s.hc);const hcc=G.ctx.cities.filter(c=>c.cg&&c.n!=="Bhilai"),hct=hcc.map(c=>txt({x:c.xy[0],y:c.xy[1],"font-weight":700,fill:"#ffd400"},hl,c.n));s.L.on(u=>hct.forEach((t,i)=>{const c=hcc[i];t.setAttribute("x",c.xy[0]+6*u);t.setAttribute("y",c.xy[1]-6*u);t.setAttribute("font-size",19*u)}));
  // map chrome
  s.chrome=el("g",{},s.win);V8.card(A,s.chrome,560,58,28,56,{rx:6,fill:"#fff"});A.hand(s.chrome,574,82,"+",{size:30,anchor:"middle",bold:1});A.hand(s.chrome,574,108,"−",{size:30,anchor:"middle",bold:1});
  s.search=el("g",{},s.win);V8.card(A,s.search,206,58,250,36,{rx:18,fill:"#fff"});icon(s.search,"query",228,76,.55);s.q=A.hand(s.search,246,82,"Search a place",{size:19,fill:"var(--n500)"});
  s.sug=el("g",{opacity:0},s.win);V8.card(A,s.sug,206,100,250,70,{rx:10,fill:"#fff"});A.hand(s.sug,226,128,"Raipur",{size:20,bold:1});A.hand(s.sug,226,154,"district headquarters",{size:17,fill:"var(--n600)"});
  s.pin=s.L.mark([203.06,292.15],g2=>A.pin(g2,"var(--red-500)"));s.pin.g.style.opacity=0;
  s.ai=el("g",{},s.win);V8.chip(A,s.ai,474,516,"✦ Ask AI",{w:112,h:32,fill:"var(--n900)",stroke:"var(--n900)",ink:"#fff"});
  s.a11y=el("g",{},s.win);el("circle",{cx:218,cy:532,r:16,fill:"var(--blue-500)"},s.a11y);el("circle",{cx:218,cy:524,r:2.6,fill:"#fff"},s.a11y);el("path",{d:"M210,529 L226,529 M218,529 L218,537 M218,537 L213,545 M218,537 L223,545",stroke:"#fff","stroke-width":2,"stroke-linecap":"round"},s.a11y);
  // the ask AI exchange, worked out from the sample data
  const R2=.5*G.kmPx,near=G.carto.aw.filter(p=>G.carto.gp.some(q=>Math.hypot(q[0]-p[0],q[1]-p[1])<=R2));s.near=near;
  s.chat=el("g",{opacity:0},s.win);V8.card(A,s.chat,204,300,300,206,{fill:"#fff"});A.hand(s.chat,220,326,"✦ Ask AI",{size:19,bold:1,fill:"var(--n700)"});
  s.qB=el("g",{opacity:0},s.chat);el("rect",{x:260,y:338,width:232,height:70,rx:12,fill:"var(--dv-blue-100)"},s.qB);
  ["Which Anganwadi centres near","Raipur are within 500 m of","an internet node?"].forEach((t,i)=>A.hand(s.qB,272,358+i*19,t,{size:18,fill:"var(--n900)"}));
  s.dotsB=el("g",{opacity:0},s.chat);[0,1,2].forEach(i=>el("circle",{cx:232+i*12,cy:436,r:4,fill:"var(--n400)"},s.dotsB));
  s.aB=el("g",{opacity:0},s.chat);el("rect",{x:216,y:418,width:270,height:76,rx:12,fill:"#f4f2ed"},s.aB);
  [`I found ${near.length} centres. They are`,"ringed on the map. Want them","as a list to download?"].forEach((t,i)=>A.hand(s.aB,228,438+i*19,t,{size:18,fill:"var(--n900)"}));
  // accessibility panel
  s.acc=el("g",{opacity:0},s.win);V8.card(A,s.acc,392,140,196,212,{fill:"#fff"});A.hand(s.acc,408,168,"Accessibility",{size:21,bold:1});
  s.accR=["Larger text","High contrast","Keyboard only","Read aloud"].map((n,i)=>{const y=186+i*40,g2=el("g",{},s.acc);A.hand(g2,408,y+15,n,{size:18,fill:"var(--n800)"});
    const tr=el("rect",{x:540,y,width:34,height:20,rx:10,fill:"var(--n300)"},g2),kn=el("circle",{cx:550,cy:y+10,r:7,fill:"#fff"},g2);return{tr,kn}});
  s.rings=near.map(p=>{const m=s.L.mark(p,g2=>el("circle",{r:9,fill:"none",stroke:"var(--orange-400)","stroke-width":2.6},g2));s.hits.appendChild(m.g);m.g.style.opacity=0;return m});
  const mx=near.reduce((a,p)=>a+p[0],0)/(near.length||1),my=near.reduce((a,p)=>a+p[1],0)/(near.length||1);
  s.V={state:{cx:258,cy:318,w:560},city:{cx:212,cy:283,w:44},ask:{cx:mx,cy:my+10,w:34}}},
 steps:[]};
{const I=SPEC.portal;
 const setLay=(A,k,on,ms=300)=>{const s=A.st,r=s.LY.find(x=>x.k===k);r.on=on;r.tr.setAttribute("fill",on?"var(--blue-500)":"var(--n300)");A.to(r.kn,{cx:on?40:26},ms);A.op(s.lay[k],on?1:0,ms)};
 const lays=(A,on)=>A.st.LY.forEach(r=>setLay(A,r.k,on.includes(r.k)));
 const acc=(A,on)=>{const s=A.st;s.LY.forEach(r=>{const t=r.g.querySelector("text");if(!t.dataset.fs)t.dataset.fs=t.getAttribute("font-size");t.setAttribute("font-size",(+t.dataset.fs*(on?1.15:1)).toFixed(1))});s.accR.forEach((r,i)=>{const v=on&&i<2;r.tr.setAttribute("fill",v?"var(--blue-500)":"var(--n300)");r.kn.setAttribute("cx",v?564:550)});A.op(s.hc,on?1:0,500);
};
 const reset=A=>{const s=A.st;s.q.textContent="Search a place";s.q.style.fill="var(--n500)";A.op([s.sug,s.chat,s.acc,s.pin.g],0,200);s.rings.forEach(m=>m.g.style.opacity=0);acc(A,false)};
 I.steps=[
 {nav:"Open it",go:async A=>{const s=A.st;reset(A);lays(A,["dist","riv","road"]);A.op(s.vill,0,200);await s.L.fly(s.V.state,800)},
  notes:[{at:"l0",t:"Open the portal",b:["the whole state on one map,","in any web browser.","Nothing to install"],to:()=>[300,24]},
         {at:"r0",t:"Move like any map",b:["zoom in, pan, measure","a distance"],to:()=>[574,96]}]},
 {nav:"Layers",go:async A=>{const s=A.st;reset(A);lays(A,["dist","riv","road","bn"]);A.op(s.vill,0,200);await s.L.fly(s.V.state,500)},
  notes:[{at:"l0",t:"Switch layers on and off",b:["show only what you need:","rivers, roads, centres,","internet nodes"],to:()=>[30,260]},
         {at:"r0",t:"Every layer is live",b:["it comes straight from the","geodatabase, so it is","always the latest"]}]},
 {nav:"Search",go:async A=>{const s=A.st;reset(A);lays(A,["dist","riv","road","aw"]);await s.L.fly(s.V.state,300);s.q.style.fill="var(--n900)";s.q.textContent="";
   for(const ch of "Raipur"){s.q.textContent+=ch;await A.wait(110)}await A.op(s.sug,1,250);await A.wait(450);A.op(s.sug,0,200);
   await Promise.all([s.L.fly(s.V.city,1300),A.op(s.vill,1,1000)]);await A.op(s.pin.g,1,250)},
  notes:[{at:"l0",t:"Search a place",b:["type a village, a district or","a centre's name, and the","map takes you there"],to:()=>[300,76]},
         {at:"r0",t:"Detail appears as you zoom",b:["centres show once","there is room to","read them"],to:A=>A.st.L.ill([203.06,289.6])}]},
 {nav:"Ask AI",go:async A=>{const s=A.st;reset(A);lays(A,["dist","riv","road","aw","bn"]);A.op(s.vill,1,300);await s.L.fly(s.V.ask,900);
   [s.qB,s.dotsB,s.aB].forEach(e=>e.style.opacity=0);await A.op(s.chat,1,300);await A.op(s.qB,1,300);await A.op(s.dotsB,1,200);await A.wait(700);await A.op(s.dotsB,0,150);
   await A.op(s.aB,1,300);for(const m of s.rings){m.g.style.opacity=1;await A.wait(40)}},
  notes:[{at:"l0",t:"Ask in plain words",c:"var(--n900)",b:["no map skills needed: the","assistant reads the map","data and answers"],to:()=>[258,372]},
         {at:"r0",t:"Answers on the map",c:"var(--orange-700)",b:["the centres it found","are ringed. It runs on the","state's own servers"],to:A=>{const s=A.st,d=p=>{const q=s.L.ill(p);return Math.hypot(q[0]-520,q[1]-200)};return s.L.ill(s.near.reduce((a,b)=>d(b)<d(a)?b:a))}}]},
 {nav:"For everyone",go:async A=>{const s=A.st;reset(A);lays(A,["dist","riv"]);A.op(s.vill,0,200);await s.L.fly(s.V.state,700);await A.op(s.acc,1,300);await A.wait(300);acc(A,true)},
  notes:[{at:"l0",t:"Built for everyone",b:["it follows India's GIGW","and the WCAG rules","for accessible websites"],to:()=>[218,532],ring:12},
         {at:"r0",t:"Use it your way",b:["larger text, high contrast,","keyboard or screen reader"],to:()=>[588,200]}]}]}

/* ============================================================ 4 · MOBILE APP */
SPEC.mobile={W:560,H:600,portH:580,foot:"Village boundaries and roads are drawn around Raipur. The app screens, record and photo are a sketch.",
 draw(A){const s=A.st;const P0=V8.near(G.carto.aw,[214,300]);s.P0=P0;s.you=[P0[0]-.42,P0[1]+.52];
  s.dist=Math.round(Math.hypot(P0[0]-s.you[0],P0[1]-s.you[1])/G.kmPx*1000/10)*10;
  // the ground behind the phone
  s.bg=A.lens(A.ill,{paper:"#eef0e6",view:{cx:P0[0]+1.6,cy:P0[1]+.2,w:16}});const bg=s.bg.g;
  el("rect",{x:-3000,y:-3000,width:7000,height:7000,fill:"#e6e9da"},bg);
  // the phone
  s.ph=el("g",{},A.ill);const X=120,Y=8,W=240,H=584;s.scr={x:X+12,y:Y+48,w:W-24,h:H-72};
  el("rect",{x:X+4,y:Y+10,width:W,height:H,rx:38,fill:"rgba(40,39,45,.25)",filter:"url(#mobile-soft)"},s.ph);
  el("rect",{x:X,y:Y,width:W,height:H,rx:38,fill:"var(--n900)"},s.ph);el("rect",{x:X+86,y:Y+16,width:68,height:16,rx:8,fill:"#000"},s.ph);
  el("rect",{x:s.scr.x,y:s.scr.y,width:s.scr.w,height:s.scr.h,rx:14,fill:"#fff"},s.ph);
  A.hand(s.ph,s.scr.x+12,s.scr.y+18,"9:41",{size:17,bold:1});[0,1,2].forEach(i=>el("rect",{x:s.scr.x+168+i*7,y:s.scr.y+14-i*3,width:4,height:6+i*3,rx:1,fill:"var(--n900)"},s.ph));
  el("rect",{x:s.scr.x,y:s.scr.y+26,width:s.scr.w,height:38,fill:"var(--n900)"},s.ph);A.hand(s.ph,s.scr.x+14,s.scr.y+51,"Field app",{size:20,bold:1,fill:"#fff"});
  A.hand(s.ph,s.scr.x+s.scr.w-14,s.scr.y+51,"Raipur",{size:17,anchor:"end",fill:"#c1bfbe"});
  const my=s.scr.y+64,mh=s.scr.h-64;
  s.L=A.lens(s.ph,{x:s.scr.x,y:my,w:s.scr.w,h:mh,view:{cx:P0[0]-.15,cy:P0[1]+.25,w:3}});const g=s.L.g;
  el("rect",{x:-3000,y:-3000,width:7000,height:7000,fill:"#f4f1ea"},g);
  el("path",{d:G.carto.roads,fill:"none",stroke:"#d8cdbd","stroke-width":5,"vector-effect":"non-scaling-stroke","stroke-linecap":"round"},g);el("path",{d:G.carto.roads,fill:"none",stroke:"#fff","stroke-width":2.8,"vector-effect":"non-scaling-stroke","stroke-linecap":"round"},g);
  el("path",{d:G.carto.fibre,fill:"none",stroke:"var(--dv-aqua-600)","stroke-width":2.4,"vector-effect":"non-scaling-stroke"},g);V8.diam(s.L,g,G.carto.gp,{z:11});
  V8.dots(s.L,g,G.carto.aw,{r:5.5,sw:1.6});
  s.sel=s.L.mark(P0,g2=>el("circle",{r:12,fill:"none",stroke:"var(--dv-blue-700)","stroke-width":3},g2));s.sel.g.style.opacity=0;
  s.me=s.L.mark(s.you,g2=>{el("circle",{r:26,fill:"rgba(31,117,203,.14)",stroke:"rgba(31,117,203,.35)"},g2);el("circle",{r:8,fill:"var(--blue-500)",stroke:"#fff","stroke-width":3},g2)});
  s.halo=s.me.g.firstChild;
  s.newPin=s.L.mark(s.you,g2=>A.pin(g2,"var(--dv-orange-500)"));s.newPin.g.style.opacity=0;
  s.hit=el("rect",{x:s.scr.x,y:my,width:s.scr.w,height:mh,fill:"transparent"},s.ph);s.hit.style.pointerEvents="none";
  // bottom sheets
  const sh=(h)=>{const g2=el("g",{opacity:0},s.ph),y0=s.scr.y+s.scr.h-h;el("path",{d:`M${s.scr.x},${y0+16} Q${s.scr.x},${y0} ${s.scr.x+16},${y0} L${s.scr.x+s.scr.w-16},${y0} Q${s.scr.x+s.scr.w},${y0} ${s.scr.x+s.scr.w},${y0+16} L${s.scr.x+s.scr.w},${s.scr.y+s.scr.h-14} Q${s.scr.x+s.scr.w},${s.scr.y+s.scr.h} ${s.scr.x+s.scr.w-14},${s.scr.y+s.scr.h} L${s.scr.x+14},${s.scr.y+s.scr.h} Q${s.scr.x},${s.scr.y+s.scr.h} ${s.scr.x},${s.scr.y+s.scr.h-14}Z`,fill:"#fff",stroke:"#e3dfd8"},g2);
    el("rect",{x:s.scr.x+s.scr.w/2-18,y:y0+8,width:36,height:5,rx:2.5,fill:"var(--n200)"},g2);return{g:g2,y0}};
  s.info=sh(150);{const{g:g2,y0}=s.info,x=s.scr.x+16;A.hand(g2,x,y0+40,"Anganwadi centre",{size:21,bold:1});A.hand(g2,x,y0+66,"AWC-RPR-00412",{size:19,mono:1,fill:"var(--n700)"});
    V8.chip(A,g2,x,y0+82,"Functional",{w:96,h:24,size:17});A.hand(g2,x,y0+132,`about ${s.dist} m from you`,{size:18,fill:"var(--n600)"})}
  s.form=sh(214);{const{g:g2,y0}=s.form,x=s.scr.x+16;A.hand(g2,x,y0+38,"New place",{size:21,bold:1});
    el("rect",{x,y:y0+52,width:70,height:52,rx:6,fill:"#c9d6e3"},g2);el("path",{d:`M${x},${y0+104} L${x+22},${y0+76} L${x+36},${y0+92} L${x+48},${y0+80} L${x+70},${y0+104}Z`,fill:"#7f9a7a"},g2);el("circle",{cx:x+54,cy:y0+66,r:6,fill:"#f2d27a"},g2);
    A.hand(g2,x+82,y0+76,"Photo added",{size:17,fill:"var(--n700)"});A.hand(g2,x+82,y0+96,"just now",{size:16,fill:"var(--n500)"});s.gps=A.hand(g2,x,y0+124,"",{size:16,mono:1,fill:"var(--n700)"});
    A.hand(g2,x,y0+146,"Note: new centre building",{size:17,fill:"var(--n800)"});
    el("rect",{x,y:y0+158,width:s.scr.w-32,height:36,rx:18,fill:"var(--blue-500)"},g2);A.hand(g2,s.scr.x+s.scr.w/2,y0+182,"Submit",{size:20,bold:1,anchor:"middle",fill:"#fff"})}
  // where the record goes
  s.flow=el("g",{opacity:0},A.ill);
  V8.card(A,s.flow,394,96,160,120);icon(s.flow,"query",430,140,.9);A.hand(s.flow,456,148,"Review",{size:22,bold:1});A.hand(s.flow,410,186,"a supervisor checks",{size:16,fill:"var(--n600)"});
  V8.card(A,s.flow,394,384,160,128,{fill:"#efe9dd",stroke:"#b9ae9b"});[0,1,2].forEach(i=>{A.rough(s.flow,410,402+i*30,128,24,{fill:"#fbf8f2",stroke:"#a89c87"})});A.hand(s.flow,474,500,"Geodatabase",{size:19,bold:1,anchor:"middle"});
  s.arr1=el("path",{d:"M352,330 C380,300 400,260 430,222",fill:"none",stroke:"var(--n700)","stroke-width":2,"stroke-dasharray":"5 5"},s.flow);s.arr2=el("path",{d:"M474,222 C482,280 482,330 474,378",fill:"none",stroke:"var(--n700)","stroke-width":2,"stroke-dasharray":"5 5"},s.flow);
  s.ok1=V8.tick(s.flow,534,146,.9);s.ok2=V8.tick(s.flow,546,402,.8);
  s.env=el("g",{opacity:0},A.ill);el("rect",{x:-22,y:-15,width:44,height:30,rx:4,fill:"#fff",stroke:"var(--dv-orange-500)","stroke-width":2.2},s.env);el("circle",{cx:-10,cy:-3,r:4,fill:"var(--dv-orange-500)"},s.env);el("path",{d:"M-2,-4 L14,-4 M-2,4 L10,4",stroke:"var(--n500)","stroke-width":2},s.env);
  s.newAt=[P0[0]+.55,P0[1]-.35]},
 steps:[]};
{const I=SPEC.mobile;
 const base=A=>{const s=A.st;A.op([s.info.g,s.form.g,s.sel.g,s.newPin.g,s.flow,s.env],0,200);A.to(s.ph,{opacity:1},200);s.ph.setAttribute("transform","")};
 const pulse=A=>{const s=A.st;return A.tw(1400,t=>{const k=1+Math.sin(t*Math.PI*3)*.25;s.halo.setAttribute("r",26*k)})};
 const capture=async(A,p)=>{const s=A.st;s.newPin.p=p.slice();s.newPin.upd();s.newPin.g.setAttribute("opacity",1);s.newPin.g.style.opacity=1;
   const[lo,la]=xy2ll(p[0],p[1]);s.gps.textContent=`${la.toFixed(4)}° N, ${lo.toFixed(4)}° E`;await A.op(s.form.g,1,350)};
 I.steps=[
 {nav:"In your pocket",go:async A=>{const s=A.st;base(A);s.ph.style.transition="";await A.tw(700,t=>s.ph.setAttribute("transform",`translate(0 ${(1-t)*80})`));await pulse(A)},
  notes:[{at:"l0",t:"The map in your pocket",b:["field staff carry the state's","map on their phone,","out in the villages"],to:()=>[240,20]},
         {at:"r0",t:"You are here",c:"var(--blue-700)",b:["the phone's GPS puts","you on the map"],to:A=>A.st.L.ill(A.st.you),ring:14}]},
 {nav:"What's nearby",go:async A=>{const s=A.st;base(A);await A.wait(300);await A.op(s.sel.g,1,250);await A.op(s.info.g,1,350)},
  notes:[{at:"l0",t:"Check what's nearby",b:["tap a place to see its","details on the spot"],to:A=>A.st.L.ill(A.st.P0)},
         {at:"r0",t:"Is it still right?",b:["staff see what the map says","and compare it with what","is in front of them"]}]},
 {nav:"Capture",go:async A=>{const s=A.st;base(A);await A.wait(300);await capture(A,s.newAt)},
  notes:[{at:"l0",t:"Record something new",c:"var(--dv-orange-700)",b:["a point, a photo and a","short note, right where","you stand"],to:A=>A.st.L.ill(A.st.newAt)},
         {at:"r0",t:"The location is exact",b:["the phone fills in the","coordinates itself"]}]},
 {nav:"Send",go:async A=>{const s=A.st;base(A);s.newPin.p=s.newAt.slice();s.newPin.upd();s.newPin.g.style.opacity=1;[s.ok1,s.ok2].forEach(t=>t.setAttribute("stroke-dashoffset",1));
   await A.op(s.flow,1,350);const fly=async(a,b,ms)=>A.tw(ms,t=>s.env.setAttribute("transform",`translate(${lerp(a[0],b[0],t)} ${lerp(a[1],b[1],t)-Math.sin(t*Math.PI)*30})`));
   s.env.style.opacity=1;await fly([240,470],[474,156],900);await A.draw(s.ok1,1,300);await A.wait(200);await fly([474,156],[474,440],800);await A.op(s.env,0,150);await A.draw(s.ok2,1,300)},
  notes:[{at:"l0",t:"Checked, then added",b:["what is captured is reviewed","before it joins the map"],to:()=>[398,150]},
         {at:"r0",t:"Everyone keeps it true",c:"var(--green-700)",b:["the person at the site","helps keep the map right"],to:()=>[554,450]}]}]}

/* ============================================================ 5 · MAPPING AND CARTOGRAPHY */
SPEC.mapping={W:560,H:600,portH:560,foot:"Districts, rivers, roads and rail are real; district areas are worked out from the boundaries. Centres and leases are samples.",
 draw(A){const s=A.st;s.L=A.lens(A.ill,{paper:"#f1efeb",view:{cx:262,cy:318,w:600}});s.L.scalebar();const g=s.L.g;const c=V8.clip(A,"st");
  s.L.outer.querySelector(".skbar").style.opacity=0;s.bar=s.L.outer.querySelector(".skbar");
  // styled base
  s.sty=el("g",{opacity:0},g);G.ctx.states.forEach(t=>el("path",{d:t.d,fill:"#f1efeb",stroke:"#fff","stroke-width":1.4,"vector-effect":"non-scaling-stroke"},s.sty));
  el("path",{d:G.state,fill:"#fff"},s.sty);
  s.theme=el("g",{opacity:0},s.sty);
  const ar=G.districts.map(d=>V8.area(d.d)/(G.kmPx*G.kmPx));const so=ar.slice().sort((a,b)=>a-b),qs=[.2,.4,.6,.8].map(q=>so[Math.floor(q*so.length)]);
  const pal=["#fdf1dd","#f5d9a8","#eebd8c","#d98c4f","#a8541c"],cls=v=>qs.filter(q=>v>=q).length;s.qs=qs;s.pal=pal;
  G.districts.forEach((d,i)=>el("path",{d:d.d,fill:pal[cls(ar[i])],stroke:"#fff","stroke-width":1.2,"vector-effect":"non-scaling-stroke"},s.theme));
  s.road=el("g",{},s.sty);el("path",{d:G.ctx.roads,fill:"none",stroke:"var(--road)","stroke-width":1.3,"clip-path":c,"vector-effect":"non-scaling-stroke"},s.road);
  el("path",{d:G.ctx.rail,fill:"none",stroke:"var(--rail)","stroke-width":1.6,"clip-path":c,"vector-effect":"non-scaling-stroke"},s.road);el("path",{d:G.ctx.rail,fill:"none",stroke:"#fff","stroke-width":.8,"stroke-dasharray":"3 3","clip-path":c,"vector-effect":"non-scaling-stroke"},s.road);
  s.dist=el("g",{fill:"none",stroke:"#cfc9bf","stroke-width":1,"vector-effect":"non-scaling-stroke"},s.sty);G.districts.forEach(d=>el("path",{d:d.d,"vector-effect":"non-scaling-stroke"},s.dist));
  s.min=el("path",{d:G.stack.mines,fill:"var(--dv-orange-500)",stroke:"var(--dv-orange-700)","stroke-width":1,"vector-effect":"non-scaling-stroke"},s.sty);
  el("path",{d:G.state,fill:"none",stroke:"var(--outline)","stroke-width":1.7,"vector-effect":"non-scaling-stroke"},s.sty);
  s.aw=V8.dots(s.L,s.sty,G.stack.aw,{r:3,sw:.9});
  // rivers, three candidate inks for the Try it
  s.riv=el("g",{fill:"none","stroke-width":1.7,"stroke-linecap":"round","clip-path":c},g);G.ctx.rivers.forEach(r=>el("path",{d:r.d,"vector-effect":"non-scaling-stroke"},s.riv));
  s.rivInk=v=>{s.riv.setAttribute("stroke",v)};s.rivInk("var(--n900)");
  // raw: every feature in the same black
  s.raw=el("g",{},g);el("path",{d:G.state,fill:"#fff",stroke:"#111","stroke-width":1,"vector-effect":"non-scaling-stroke"},s.raw);
  const rk=el("g",{fill:"none",stroke:"#222","stroke-width":.9,"vector-effect":"non-scaling-stroke"},s.raw);G.districts.forEach(d=>el("path",{d:d.d,"vector-effect":"non-scaling-stroke"},rk));
  el("path",{d:G.ctx.roads,fill:"none",stroke:"#222","stroke-width":1,"clip-path":c,"vector-effect":"non-scaling-stroke"},s.raw);el("path",{d:G.ctx.rail,fill:"none",stroke:"#222","stroke-width":1,"clip-path":c,"vector-effect":"non-scaling-stroke"},s.raw);
  const rr=el("g",{fill:"none",stroke:"#222","stroke-width":1,"clip-path":c},s.raw);G.ctx.rivers.forEach(r=>el("path",{d:r.d,"vector-effect":"non-scaling-stroke"},rr));
  el("path",{d:G.stack.mines,fill:"none",stroke:"#222","stroke-width":1,"vector-effect":"non-scaling-stroke"},s.raw);V8.dots(s.L,s.raw,G.stack.aw,{r:2.2,sw:0,fill:"#222"});
  g.appendChild(s.riv);
  // labels
  s.labs=el("g",{opacity:0},g);const cities=G.ctx.cities.filter(c=>c.cg||["Nagpur","Sambalpur","Jabalpur","Raurkela"].includes(c.n)).map(c=>{const d=el("circle",{fill:c.cg?"var(--n900)":"#9d978e",stroke:"#fff"},s.labs),t=txt({class:"halo","font-weight":c.cg?700:400,fill:c.cg?"var(--n900)":"#8a857d"},s.labs,c.n);return{c,d,t}});
  s.rl=el("g",{"font-style":"italic",fill:"var(--water-ink)",class:"halo"},s.labs);const seen={};
  s.riv.querySelectorAll("path").forEach((p,i)=>{const n=G.ctx.rivers[i].n;if(!n||seen[n]||!["Mahanadi","Indravati"].includes(n))return;const len=p.getTotalLength();if(len<50)return;seen[n]=1;
    const a=p.getPointAtLength(len*.5),b=p.getPointAtLength(len*.5+6);let ang=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;if(ang>90)ang-=180;if(ang<-90)ang+=180;
    txt({x:a.x,y:a.y-3,transform:`rotate(${ang.toFixed(1)} ${a.x} ${a.y})`,"text-anchor":"middle","font-size":11},s.rl,n)});
  s.L.on(u=>cities.forEach(({c,d,t})=>{d.setAttribute("cx",c.xy[0]);d.setAttribute("cy",c.xy[1]);d.setAttribute("r",(c.cg?3.6:2.8)*u);d.setAttribute("stroke-width",1.2*u);
    t.setAttribute("x",c.xy[0]+(c.n==="Bhilai"?-6:6)*u);t.setAttribute("y",c.xy[1]+(c.n==="Bhilai"?12:-5)*u);t.setAttribute("text-anchor",c.n==="Bhilai"?"end":"start");t.setAttribute("font-size",(c.cg?14:12)*u);t.style.strokeWidth=3.4*u+"px"}));
  // map furniture in illustration space
  s.furn=el("g",{opacity:0},A.ill);
  const tb=el("g",{},s.furn);V8.card(A,tb,14,14,206,64,{fill:"rgba(255,255,255,.94)"});A.hand(tb,30,44,"Chhattisgarh",{size:27,bold:1});A.hand(tb,30,66,"rivers, roads and rail",{size:18,fill:"var(--n600)"});
  const na=el("g",{transform:"translate(522 46)"},s.furn);el("path",{d:"M0,-24 L10,14 L0,7 L-10,14Z",fill:"var(--n900)"},na);el("path",{d:"M0,-24 L0,7 L-10,14Z",fill:"#fff",stroke:"var(--n900)","stroke-width":1.4,"stroke-linejoin":"round"},na);A.hand(na,0,34,"N",{size:22,bold:1,anchor:"middle"});
  s.leg=el("g",{},s.furn);V8.card(A,s.leg,368,410,180,176,{fill:"rgba(255,255,255,.95)"});A.hand(s.leg,384,436,"Legend",{size:21,bold:1});
  [["riv","River"],["road","Road"],["rail","Railway"],["aw","Anganwadi centre"],["min","Mining lease"],["dist","District boundary"]].forEach(([k,n],i)=>{const y=458+i*21,x=384;
    if(k==="riv")el("path",{d:`M${x},${y-4} q6,-5 12,0 t12,0`,fill:"none",stroke:"var(--water)","stroke-width":2.4},s.leg);
    if(k==="road")el("path",{d:`M${x},${y-4} L${x+24},${y-4}`,stroke:"var(--road)","stroke-width":3},s.leg);
    if(k==="rail"){el("path",{d:`M${x},${y-4} L${x+24},${y-4}`,stroke:"var(--rail)","stroke-width":3},s.leg);el("path",{d:`M${x},${y-4} L${x+24},${y-4}`,stroke:"#fff","stroke-width":1.2,"stroke-dasharray":"3 3"},s.leg)}
    if(k==="aw")el("circle",{cx:x+12,cy:y-4,r:4.5,fill:"var(--dv-blue-500)"},s.leg);if(k==="min")el("rect",{x:x+4,y:y-10,width:16,height:12,fill:"var(--dv-orange-500)",stroke:"var(--dv-orange-700)"},s.leg);
    if(k==="dist")el("path",{d:`M${x},${y-4} L${x+24},${y-4}`,stroke:"#b8b1a6","stroke-width":1.6},s.leg);A.hand(s.leg,x+34,y+1,n,{size:17,fill:"var(--n800)"})});
  // thematic legend and outputs
  const tx=388,ty=236;s.tleg=el("g",{opacity:0},A.ill);V8.card(A,s.tleg,tx,ty,166,124,{fill:"rgba(255,255,255,.95)"});A.hand(s.tleg,tx+14,ty+30,"District area",{size:23,bold:1});
  pal.forEach((p,i)=>el("rect",{x:tx+14+i*27.6,y:ty+44,width:27.6,height:16,fill:p,stroke:"#fff"},s.tleg));const k=v=>Math.round(v/1000)+"k";
  A.hand(s.tleg,tx+14,ty+80,"smaller",{size:16,fill:"var(--n600)"});A.hand(s.tleg,tx+152,ty+80,"larger",{size:16,anchor:"end",fill:"var(--n600)"});
  A.hand(s.tleg,tx+14,ty+104,`${k(so[0])} to ${k(so[so.length-1])} km²`,{size:15,fill:"var(--n500)"});
  s.out=el("g",{opacity:0},A.ill);[["Printed map","book"],["PDF atlas","down"],["Web map","eye"]].forEach(([n,ic],i)=>{const x=372,y=430+i*52;V8.card(A,s.out,x,y,176,42,{rx:21,fill:"#fff"});icon(s.out,ic,x+24,y+21,.6);A.hand(s.out,x+46,y+27,n,{size:19,bold:1})})},
 steps:[]};
{const I=SPEC.mapping;
 const look=(A,o)=>{const s=A.st;A.op(s.raw,o.raw?1:0,500);A.op(s.sty,o.raw?0:1,500);A.op(s.labs,o.lab?1:0,400);A.op(s.furn,o.lab?1:0,400);s.bar.style.transition="opacity .4s";s.bar.style.opacity=o.lab?1:0;
   A.op(s.theme,o.th?1:0,600);A.op([s.road,s.min,s.aw],o.th?.0:1,500);A.op(s.dist,o.th?0:1,500);A.op([s.tleg,s.out],o.th?1:0,400);if(o.th)A.op(s.furn,0,300)};
 I.steps=[
 {nav:"Raw data",go:async A=>{const s=A.st;s.rivInk("#222");look(A,{raw:1});await s.L.fly({cx:262,cy:318,w:600},500)},
  notes:[{at:"l0",t:"Raw data",b:["thousands of points and","lines, all alike.","Hard to read"],to:A=>A.st.L.ill([250,330])},
         {at:"r0",t:"Which line is a river?",b:["and which is a road, a","railway or a boundary?"],to:A=>{const p=A.st.riv.querySelectorAll("path")[4];const q=p.getPointAtLength(p.getTotalLength()*.55);return A.st.L.ill([q.x,q.y])}}]},
 {nav:"Colour",go:async A=>{const s=A.st;s.rivInk("#222");look(A,{});s.L.fly({cx:262,cy:318,w:600},500);await A.wait(400);s.riv.style.transition="stroke .5s";s.rivInk("var(--water)")},
  notes:[{at:"l0",t:"Colours that mean something",b:["water is blue, roads warm,","centres stand out"],to:A=>{const p=A.st.riv.querySelectorAll("path")[4];const q=p.getPointAtLength(p.getTotalLength()*.4);return A.st.L.ill([q.x,q.y])}},
         {at:"r0",t:"Shapes too",b:["a dot for a centre, a block","for a lease, a dashed line","for the railway"],to:A=>A.st.L.ill(G.stack.mines.match(/M([\d.]+),([\d.]+)/).slice(1).map(Number))}]},
 {nav:"Labels",go:async A=>{const s=A.st;s.rivInk("var(--water)");look(A,{lab:1});await s.L.fly({cx:262,cy:318,w:600},500)},
  notes:[{at:"l0",t:"Names, legend, north arrow",b:["so anyone can read the","map without help"],to:()=>[370,470]},
         {at:"r0",t:"Less is more",b:["a good map leaves out","what doesn't matter","at this size"]}]},
 {nav:"A map that decides",go:async A=>{const s=A.st;s.rivInk("var(--water)");look(A,{th:1});await s.L.fly({cx:304,cy:318,w:680},700)},
  notes:[{at:"l0",t:"One question, one map",b:["shade the districts by what","you want to compare:","here, their size"],to:A=>A.st.L.ill([200,330])},
         {at:"r0",t:"Shared every way",b:["printed maps, PDF atlases","and live web maps"],to:()=>[548,480]}]}]}

/* ============================================================ 6 · MAINTENANCE */
SPEC.maintain={W:560,H:600,portH:560,foot:"The servers, the report and the incoming record are illustrative.",
 draw(A){const s=A.st;
  // the state outline, for "it stays in the state"
  s.home=el("g",{opacity:0},A.ill);V8.mini(s.home,280,300,.9,{fill:"#f6f4ee",stroke:"#b9b2a8",dist:false});
  {const P=G.state.split(/[MLZ]/).filter(Boolean).map(v=>v.split(",").map(Number)).filter(p=>p[1]>40&&p[1]<130);const e=P.reduce((a,b)=>b[0]>a[0]?b:a);s.edgeP=[280+(e[0]-260)*.9,300+(e[1]-322)*.9]}
  s.rack=el("g",{},A.ill);const rack=(g,x,y,w,n)=>{el("rect",{x:x+4,y:y+8,width:w,height:n*52+20,rx:10,fill:"rgba(40,39,45,.22)",filter:"url(#maintain-soft)"},g);
    el("rect",{x,y,width:w,height:n*52+20,rx:10,fill:"var(--n800)"},g);const leds=[];for(let i=0;i<n;i++){const yy=y+10+i*52;el("rect",{x:x+10,y:yy,width:w-20,height:44,rx:5,fill:"var(--n700)"},g);
      for(let v=0;v<5;v++)el("path",{d:`M${x+22+v*8},${yy+12} L${x+22+v*8},${yy+32}`,stroke:"var(--n600)","stroke-width":3,"stroke-linecap":"round"},g);
      leds.push(el("circle",{cx:x+w-34,cy:yy+22,r:5,fill:"var(--green-500)"},g),el("circle",{cx:x+w-20,cy:yy+22,r:5,fill:"var(--green-500)"},g))}return leds};
  s.rackM=el("g",{},s.rack);s.leds=rack(s.rackM,200,120,160,6);
  s.rackB=el("g",{opacity:0},s.rack);s.ledsB=rack(s.rackB,340,170,130,5);A.hand(s.rackB,405,476,"Backup copy",{size:20,bold:1,anchor:"middle"});
  s.mainLab=A.hand(s.rack,280,486,"Portal servers",{size:20,bold:1,anchor:"middle"});
  s.hb=el("path",{d:"M30,540 L170,540 L186,540 L198,506 L212,572 L226,522 L238,540 L380,540 L396,540 L408,512 L420,566 L432,540 L530,540",fill:"none",stroke:"var(--green-500)","stroke-width":3,"stroke-linejoin":"round"},s.rack);
  s.ticket=el("g",{opacity:0},A.ill);V8.card(A,s.ticket,372,22,180,92);A.hand(s.ticket,388,48,"User report",{size:19,bold:1,fill:"var(--n600)"});A.hand(s.ticket,388,74,"Map slow to load",{size:20});
  s.tStat=el("g",{},s.ticket);s.tFix=V8.chip(A,s.tStat,388,82,"Fixed",{w:66,h:24,size:17});s.tOpen=V8.chip(A,s.tStat,388,82,"Open",{w:60,h:24,size:17,fill:"var(--orange-50)",stroke:"var(--orange-100)",ink:"var(--orange-700)"});
  s.wrench=el("g",{opacity:0},A.ill);el("path",{d:"M0,-16 a10,10 0 1 0 10,14 L26,14 L26,4 L12,4 a10,10 0 0 0 -12,-20Z",fill:"var(--n500)"},s.wrench);
  s.shield=el("g",{opacity:0},A.ill);el("path",{d:"M0,-30 L24,-20 L24,2 C24,18 12,28 0,34 C-12,28 -24,18 -24,2 L-24,-20Z",fill:"var(--blue-500)",stroke:"#fff","stroke-width":3},s.shield);icon(s.shield,"lock",0,4,.62);
  s.copies=el("g",{},A.ill);
  // keeping it current
  s.inc=el("g",{opacity:0},A.ill);V8.card(A,s.inc,40,30,480,300);A.hand(s.inc,64,66,"Incoming update",{size:19,bold:1,fill:"var(--n600)"});A.hand(s.inc,64,96,"New school, from a department",{size:25,bold:1});
  el("rect",{x:64,y:116,width:200,height:190,rx:8,fill:"#f4f2ed"},s.inc);el("path",{d:"M84,140 L230,130 L246,250 L170,290 L92,270Z",fill:"#fff",stroke:"var(--n700)","stroke-width":2,"stroke-dasharray":"7 4"},s.inc);
  A.hand(s.inc,110,160,"its block",{size:17,fill:"var(--n600)"});s.bad=el("circle",{cx:252,cy:150,r:8,fill:"var(--dv-orange-500)",stroke:"#fff","stroke-width":2.4},s.inc);
  s.badR=el("circle",{cx:252,cy:150,r:17,fill:"none",stroke:"var(--red-500)","stroke-width":2.6,"stroke-dasharray":"5 4"},s.inc);
  A.hand(s.inc,292,156,"The school's location",{size:20,bold:1,fill:"var(--red-700)"});A.hand(s.inc,292,182,"falls outside its block",{size:20,fill:"var(--red-700)"});
  A.hand(s.inc,292,226,"Everything else",{size:19,fill:"var(--n600)"});A.hand(s.inc,292,250,"passes the checks",{size:19,fill:"var(--n600)"});
  s.stamp=el("g",{opacity:0},s.inc);el("rect",{x:300,y:262,width:196,height:48,rx:6,fill:"rgba(255,255,255,.8)",stroke:"var(--red-500)","stroke-width":3,transform:"rotate(-6 398 286)"},s.stamp);A.hand(s.stamp,398,296,"SENT BACK",{size:30,bold:1,anchor:"middle",fill:"var(--red-500)",rot:-6});
  s.fix=el("g",{opacity:0},A.ill);V8.card(A,s.fix,40,356,480,196);A.hand(s.fix,64,392,"Corrected and resent",{size:19,bold:1,fill:"var(--n600)"});A.hand(s.fix,64,422,"New school",{size:25,bold:1});
  el("rect",{x:64,y:438,width:120,height:96,rx:8,fill:"#f4f2ed"},s.fix);el("path",{d:"M76,452 L164,446 L174,512 L128,528 L80,518Z",fill:"#fff",stroke:"var(--n700)","stroke-width":2,"stroke-dasharray":"6 4"},s.fix);el("circle",{cx:128,cy:486,r:7,fill:"var(--dv-orange-500)",stroke:"#fff","stroke-width":2.2},s.fix);
  A.hand(s.fix,210,470,"Inside its block, all checks pass",{size:20,fill:"var(--n800)"});s.live=V8.chip(A,s.fix,210,490,"Live on the portal",{w:170,h:30});s.live.style.opacity=0;s.okT=V8.tick(s.fix,480,410,1.4);
  // the three habits
  s.trio=el("g",{opacity:0},A.ill);s.cards=[["Keep it running","servers watched,","reports fixed"],["Keep it safe","backed up, patched,","kept in the state"],["Keep it current","every update checked","before it goes live"]].map(([t,a,b],i)=>{const x=6+i*186,g=el("g",{opacity:0},s.trio);
    V8.card(A,g,x,170,176,250);const cx=x+88;
    if(i===0)el("path",{d:`M${cx-50},236 L${cx-20},236 L${cx-10},208 L${cx+4},262 L${cx+14},228 L${cx+22},236 L${cx+50},236`,fill:"none",stroke:"var(--green-500)","stroke-width":4,"stroke-linejoin":"round","stroke-linecap":"round"},g);
    if(i===1){const sh=el("g",{transform:`translate(${cx} 236)`},g);el("path",{d:"M0,-30 L24,-20 L24,2 C24,18 12,28 0,34 C-12,28 -24,18 -24,2 L-24,-20Z",fill:"var(--blue-500)"},sh);icon(sh,"lock",0,4,.62)}
    if(i===2){el("path",{d:`M${cx+26},226 A28,28 0 1 0 ${cx+20},254`,fill:"none",stroke:"var(--dv-orange-500)","stroke-width":5,"stroke-linecap":"round"},g);el("path",{d:`M${cx+14},214 L${cx+28},228 L${cx+38},210`,fill:"none",stroke:"var(--dv-orange-500)","stroke-width":5,"stroke-linecap":"round","stroke-linejoin":"round"},g)}
    A.hand(g,cx,316,t,{size:24,bold:1,anchor:"middle"});A.hand(g,cx,350,a,{size:19,anchor:"middle",fill:"var(--n700)"});A.hand(g,cx,376,b,{size:19,anchor:"middle",fill:"var(--n700)"});return g});
  s.blink=()=>{const all=s.leds.concat(s.ledsB);return A.tw(2200,t=>{const k=Math.floor(t*14);all.forEach((l,i)=>l.setAttribute("opacity",(i*7+k)%5===0?.35:1))})}},
 steps:[]};
{const I=SPEC.maintain;
 const scene=(A,k)=>{const s=A.st;return Promise.all([A.op(s.rack,k==="run"||k==="safe"?1:0,350),A.op(s.home,k==="safe"?1:0,350),A.op([s.inc],k==="cur"?1:0,350),A.op(s.fix,0,200),A.op(s.trio,k==="trio"?1:0,350),A.op([s.ticket,s.wrench,s.shield],0,200)])};
 const cur=A=>{const s=A.st;s.stamp.style.opacity=0;s.badR.style.opacity=1;s.live.style.opacity=0;s.okT.setAttribute("stroke-dashoffset",1)};
 const sendBack=async A=>{const s=A.st;await A.op(s.stamp,1,250);await A.wait(300);await A.op(s.fix,1,400);await A.draw(s.okT,1,300);await A.op(s.live,1,300)};
 I.sendBack=sendBack;
 I.steps=[
 {nav:"Keep it running",go:async A=>{const s=A.st;s.copies.innerHTML="";s.rackM.setAttribute("transform","");s.rackB.style.opacity=0;s.mainLab.setAttribute("x",280);s.tFix.style.opacity=0;s.tOpen.style.opacity=1;await scene(A,"run");
   s.hb.setAttribute("stroke-dasharray","1200");await Promise.all([A.tw(1400,t=>s.hb.setAttribute("stroke-dashoffset",1200*(1-t))),A.op(s.ticket,1,400)]);
   s.wrench.setAttribute("transform","translate(440 140) rotate(-30)");await A.op(s.wrench,1,200);await A.tw(600,t=>s.wrench.setAttribute("transform",`translate(440 140) rotate(${-30+Math.sin(t*Math.PI*3)*30})`));await A.op(s.wrench,0,200);
   s.tOpen.style.opacity=0;s.tFix.style.opacity=1;await s.blink()},
  notes:[{at:"l0",t:"Kept running every day",b:["the team watches the","servers around the clock"],to:()=>[200,260]},
         {at:"r0",t:"A report, then a fix",b:["when users report a","problem, it is fixed","and closed"],to:()=>[552,90]}]},
 {nav:"Keep it safe",go:async A=>{const s=A.st;s.tFix.style.opacity=1;s.tOpen.style.opacity=0;s.copies.innerHTML="";await scene(A,"safe");
   await Promise.all([A.tw(600,t=>s.rackM.setAttribute("transform",`translate(${-110*t} ${10*t}) scale(1)`)),A.tw(600,t=>s.mainLab.setAttribute("x",280-110*t))]);await A.op(s.rackB,1,400);
   s.shield.setAttribute("transform","translate(170 112)");await A.op(s.shield,1,300);
   for(let k=0;k<3;k++){const d=el("g",{},s.copies);el("rect",{x:-12,y:-9,width:24,height:18,rx:3,fill:"var(--blue-500)"},d);el("circle",{cx:0,cy:0,r:4,fill:"#fff"},d);
     await A.tw(700,t=>d.setAttribute("transform",`translate(${lerp(250,404,t)} ${lerp(200,240,t)-Math.sin(t*Math.PI)*60})`));d.remove()}},
  notes:[{at:"l0",t:"Backed up",c:"var(--blue-700)",b:["a copy of everything,","kept on a second server,","with security updates"],to:()=>[170,112],ring:20},
         {at:"r0",t:"It stays in the state",b:["hosted on government","servers inside Chhattisgarh"],to:A=>A.st.edgeP}]},
 {nav:"Keep it current",go:async A=>{cur(A);await scene(A,"cur")},
  notes:[{at:"l0",t:"Checked before it goes live",b:["new data from departments","and the field app is","tested first"],to:()=>[64,96],bx:-30,by:34},
         {at:"r0",t:"Something is wrong",c:"var(--red-700)",b:["one location doesn't fit.","What should happen?"],to:()=>[262,138]}]},
 {nav:"All three",go:async A=>{const s=A.st;s.cards.forEach(c=>c.style.opacity=0);await scene(A,"trio");for(const c of s.cards){await A.op(c,1,300)}},
  notes:[{at:"l0",t:"A map is never finished",b:["building it was the start;","caring for it is the work"]},
         {at:"r0",t:"Like servicing a vehicle",b:["regular care keeps it","running for years"]}]}]}

/* ============================================================ 7 · THE CYCLE (closing) */
SPEC.cycle={W:640,H:600,portH:600,foot:"The six stages of the story. The state outline and districts are real.",
 draw(A){const s=A.st,cx=320,cy=300,R=196;s.c=[cx,cy];s.R=R;
  const ST=[["Data Creation",""],["Geodatabase","Creation"],["Geo Portal","Development"],["Mobile App",""],["Mapping and","Cartography"],["Maintenance",""]];
  s.ang=i=>-Math.PI/2+i*Math.PI/3;s.at=(a,r=R)=>[cx+Math.cos(a)*r,cy+Math.sin(a)*r];
  s.ring=el("path",{d:`M${cx},${cy-R} A${R},${R} 0 1 1 ${cx-.01},${cy-R}`,fill:"none",stroke:"var(--n300)","stroke-width":3,"stroke-dasharray":"2 8","stroke-linecap":"round"},A.ill);
  s.arcs=[0,1,2,3,4,5].map(i=>{const a0=s.ang(i)+.17,a1=s.ang(i+1)-.17,p0=s.at(a0),p1=s.at(a1);const g=el("g",{},A.ill);
    const p=el("path",{d:`M${p0[0].toFixed(1)},${p0[1].toFixed(1)} A${R},${R} 0 0 1 ${p1[0].toFixed(1)},${p1[1].toFixed(1)}`,fill:"none",stroke:i===5?"var(--dv-orange-500)":"var(--n700)","stroke-width":i===5?3.4:2.6,"stroke-linecap":"round"},g);
    const t=s.at(a1),d=[Math.cos(a1+Math.PI/2),Math.sin(a1+Math.PI/2)],nrm=[Math.cos(a1),Math.sin(a1)],h=(k,o)=>[t[0]-d[0]*k+nrm[0]*o,t[1]-d[1]*k+nrm[1]*o].map(v=>v.toFixed(1)).join(",");
    const hd=el("path",{d:`M${h(12,6)} L${t[0].toFixed(1)},${t[1].toFixed(1)} L${h(12,-6)}`,fill:"none",stroke:i===5?"var(--dv-orange-500)":"var(--n700)","stroke-width":2.6,"stroke-linecap":"round","stroke-linejoin":"round"},g);
    return{g,p,hd}});
  s.nodes=ST.map(([a,b],i)=>{const p=s.at(s.ang(i)),g=el("g",{},A.ill);const c=el("circle",{cx:p[0],cy:p[1],r:22,fill:"#fff",stroke:"var(--n800)","stroke-width":2.4},g);
    const n=A.hand(g,p[0],p[1]+7,String(i+1),{size:27,bold:1,anchor:"middle"});
    const side=Math.abs(Math.cos(s.ang(i)))<.2?(Math.sin(s.ang(i))<0?"top":"bot"):Math.cos(s.ang(i))>0?"right":"left";
    let x=p[0],y=p[1],an="middle";if(side==="top")y-=38;if(side==="bot")y+=52;if(side==="right"){x+=34;an="start";y-=b?4:-6}if(side==="left"){x-=34;an="end";y-=b?4:-6}
    A.hand(g,x,y,a,{size:24,bold:1,anchor:an});if(b)A.hand(g,x,y+22,b,{size:24,bold:1,anchor:an});return{g,c,n,p}});
  // the map at the centre, out of focus until the loop turns
  s.fid="cycle-blur";A.defs.insertAdjacentHTML("beforeend",`<filter id="${s.fid}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur id="${s.fid}-b" stdDeviation="5"/></filter>`);
  s.map=el("g",{filter:`url(#${s.fid})`},A.ill);const m=V8.mini(s.map,cx,cy+4,.42,{fill:"#fbfaf8"});s.mdots=el("g",{opacity:0},m);G.stack.aw.forEach(p=>el("circle",{cx:p[0],cy:p[1],r:5,fill:"var(--dv-blue-500)"},s.mdots));
  s.blur=v=>A.defs.querySelector(`#${s.fid}-b`).setAttribute("stdDeviation",v);
  el("circle",{cx,cy,r:R-40,fill:"none",stroke:"var(--n200)","stroke-width":1.4,"stroke-dasharray":"3 6"},A.ill);
  s.tok=el("g",{},A.ill);el("circle",{r:15,fill:"var(--dv-orange-500)",stroke:"#fff","stroke-width":3.4},s.tok);el("circle",{r:4.5,fill:"#fff"},s.tok);
  s.setTok=a=>{const p=s.at(a,R-40);s.tok.setAttribute("transform",`translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})`)};s.setTok(s.ang(0)-.001);
  s.light=k=>s.nodes.forEach((n,i)=>{const on=i<k;n.c.setAttribute("fill",on?"var(--n900)":"#fff");n.n.style.fill=on?"#fff":"var(--n900)"})},
 steps:[]};
{const I=SPEC.cycle;
 const draw=async A=>{const s=A.st;s.arcs.forEach(a=>{a.p.setAttribute("pathLength",1);a.p.setAttribute("stroke-dasharray",1);a.p.setAttribute("stroke-dashoffset",1);a.hd.style.opacity=0});s.nodes.forEach(n=>n.g.style.opacity=0);
   for(let i=0;i<6;i++){await A.op(s.nodes[i].g,1,220);await A.tw(320,t=>s.arcs[i].p.setAttribute("stroke-dashoffset",1-t));s.arcs[i].hd.style.opacity=1}};
 const done=A=>{const s=A.st;s.arcs.forEach(a=>{a.p.setAttribute("stroke-dashoffset",0);a.hd.style.opacity=1});s.nodes.forEach(n=>n.g.style.opacity=1)};
 const spin=async(A,ms)=>{const s=A.st;await A.tw(ms,t=>{const a=s.ang(0)+t*Math.PI*2;s.setTok(a);s.light(Math.min(6,Math.floor(t*6+.02)+1));s.blur(5*(1-t)+.0)})};
 I.spin=spin;
 I.steps=[
 {nav:"Six stages",go:async A=>{const s=A.st;s.light(0);s.blur(5);s.mdots.style.opacity=0;s.setTok(s.ang(0));await draw(A)},
  notes:[{at:"l0",t:"Then it begins again",c:"var(--dv-orange-700)",b:["maintenance leads","back to new data"],to:A=>{const s=A.st;return s.at(s.ang(5.5),s.R+6)}},
         {at:"r0",t:"Six stages, one loop",b:["data is created, stored,","shared, checked in the","field, mapped and cared for"]}]},
 {nav:"Round once",go:async A=>{const s=A.st;done(A);s.light(0);s.blur(5);s.mdots.style.opacity=0;s.setTok(s.ang(0));await A.wait(300);await spin(A,2600)},
  notes:[{at:"l0",t:"Field updates feed back",b:["what the mobile app","captures becomes","new data"],to:A=>{const s=A.st;return s.at(s.ang(3))}},
         {at:"r0",t:"Each turn, sharper",b:["the map in the middle","comes into focus"],to:A=>[A.st.c[0]+40,A.st.c[1]-40]}]},
 {nav:"Ground truth",go:async A=>{const s=A.st;done(A);s.light(6);s.setTok(s.ang(0));await A.tw(600,t=>s.blur(5*(1-t)));s.blur(0);await A.op(s.mdots,1,500)},
  notes:[{at:"l0",t:"Grounded in truth",b:["better roads, schools and","services, because the map","matches the ground"]},
         {at:"r0",t:"Explore it yourself",b:["the Chhattisgarh State","Geoportal is open to all"]}]}]}

/* ============================================================ TRY IT · one per figure */
// create: drag the scanner across the sheet
{const I=SPEC.create.steps;
 I[1].go=async A=>{const s=A.st;A.op([s.gnd,s.log],0,150);A.op(s.dig,1,150);A.op(s.tags,1,150);s.LD.set(s.V0);s.LO.set(s.V0);A.op(s.old,1,200);A.op(s.aw,1,200);A.op(s.ctx.city,1,200);s.setSw(0);await A.wait(200);await A.tw(700,t=>s.setSw(84*t))};
 I[1].play={ask:"drag the scanner across the sheet to turn paper into digital",ok:"The whole sheet is digital: every line, point and outline now sits on the earth",
  setup(A,done,ui){const s=A.st;let x=84;A.pulse([84,300],26);
   A.drag(s.knob,{move:p=>{x=clamp(p[0],0,560);s.setSw(x)},end:()=>{if(x>470){A.tw(300,t=>s.setSw(lerp(x,560,t))).then(()=>done())}else ui.say("Keep going: take it all the way across",true)}});
   s.knob.style.cursor="ew-resize"},
  solve:async A=>{const s=A.st,x0=+s.sw.getAttribute("width");await A.tw(1300,t=>s.setSw(lerp(x0,560,t)))}};
 // the steps after start from a fully scanned sheet, whatever the reader did
}
// geodatabase: tap our centre to open its record
{const I=SPEC.geodatabase.steps;
 I[1].go=async A=>{const s=A.st;await Promise.all([A.op(s.rules,0,200),A.op(s.lib,0,200),A.op([s.card,s.cardLine],0,150),A.op(s.stack,1,300)]);
   s.KEYS.forEach(k=>s.pl[k].g.style.opacity=1);if(s.gap<130){await s.spread(140,470,600)}s.label();A.op(s.names,1,200);A.op(s.pinLine,1,200)};
 I[1].play={ask:"tap the dark blue centre on the top layer to open its record",ok:"Its record opens: what it is, where it is, and whether it is working",
  setup(A,done,ui){const s=A.st;const p=s.iso(G.stack.pin,s.pl.pla.cy);A.pulse(p,22);const hit=el("circle",{cx:p[0],cy:p[1],r:26,fill:"transparent"},s.stack);
   A.tap(hit,async()=>{hit.remove();await open(A);done()})},
  solve:async A=>{await open(A)}};
 async function open(A){const s=A.st,p=s.iso(G.stack.pin,s.pl.pla.cy);A.notesG.querySelectorAll(".skpulse").forEach(n=>n.remove());s.cardLine.setAttribute("d",`M${p[0]},${p[1]+10} L${p[0]},316`);
   await Promise.all([A.op([s.pl.bnd.g,s.pl.net.g],.12,300),A.op(s.names,0,200)]);A.op(s.cardLine,1,300);await A.op(s.card,1,400)}}
// portal: switch a layer on
{const I=SPEC.portal.steps;
 I[1].play={ask:"switch on the Anganwadi centres layer in the panel",ok:"Every centre in the state appears, straight from the geodatabase",
  setup(A,done,ui){const s=A.st;const r=s.LY.find(x=>x.k==="aw");
   // start with the centres off so the reader turns them on
   r.on=false;r.tr.setAttribute("fill","var(--n300)");r.kn.setAttribute("cx",26);s.lay.aw.style.opacity=0;A.pulse([33,r.y+10],20);
   s.LY.forEach(x=>A.tap(x.hit,()=>{x.on=!x.on;x.tr.setAttribute("fill",x.on?"var(--blue-500)":"var(--n300)");A.to(x.kn,{cx:x.on?40:26},200);A.op(s.lay[x.k],x.on?1:0,300);
     if(x.k==="aw"&&x.on)done();else if(x.k!=="aw")ui.say(`${x.on?"On":"Off"}. Now find the Anganwadi centres`)}))},
  solve:async A=>{const s=A.st,r=s.LY.find(x=>x.k==="aw");r.on=true;r.tr.setAttribute("fill","var(--blue-500)");await Promise.all([A.to(r.kn,{cx:40},300),A.op(s.lay.aw,1,400)])}}}
// mobile: tap where the new centre stands
{const I=SPEC.mobile.steps;
 I[2].go=async A=>{const s=A.st;A.op([s.info.g,s.form.g,s.sel.g,s.newPin.g,s.flow,s.env],0,200);s.ph.setAttribute("transform","")};
 I[2].play={ask:"tap the phone's map where the new centre stands",ok:"Pinned, with a photo, a note and the exact coordinates",
  setup(A,done,ui){const s=A.st;s.hit.style.pointerEvents="";A.pulse(s.L.ill(s.newAt),20);
   A.tap(s.hit,async e=>{s.hit.style.pointerEvents="none";A.notesG.querySelectorAll(".skpulse").forEach(n=>n.remove());const p=s.L.world(A.pt(e));s.newAt=p;await cap(A,p);done()})},
  solve:async A=>{await cap(A,A.st.newAt)}};
 async function cap(A,p){const s=A.st;s.newPin.p=p.slice();s.newPin.upd();s.newPin.g.style.opacity=0;await A.op(s.newPin.g,1,200);const[lo,la]=xy2ll(p[0],p[1]);s.gps.textContent=`${la.toFixed(4)}° N, ${lo.toFixed(4)}° E`;await A.op(s.form.g,1,350)}}
// mapping: pick the colour for rivers
{const I=SPEC.mapping.steps;
 I[1].go=async A=>{const s=A.st;s.L.fly({cx:262,cy:318,w:600},500);s.riv.style.transition="stroke .4s";s.rivInk("#222");A.op(s.raw,0,500);A.op(s.sty,1,500);A.op([s.labs,s.furn,s.theme,s.tleg,s.out],0,300);A.op([s.road,s.min,s.aw,s.dist],1,400);s.bar.style.opacity=0};
 I[1].play={ask:"pick a colour for the rivers",ok:"Blue: everyone reads it as water, without a legend",
  setup(A,done,ui){const s=A.st;
   ui.btn(`<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#dd2b0e;margin-right:6px;vertical-align:-1px"></span>Red`,()=>{s.rivInk("var(--red-500)");ui.say("Red reads as danger, or as a main road. Try another",true)});
   ui.btn(`<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#a5a3a3;margin-right:6px;vertical-align:-1px"></span>Grey`,()=>{s.rivInk("var(--n300)");ui.say("Grey makes the rivers disappear into the background",true)});
   ui.btn(`<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#6f9bc8;margin-right:6px;vertical-align:-1px"></span>Blue`,()=>{s.rivInk("var(--water)");done()})},
  solve:async A=>{A.st.rivInk("var(--water)");await A.wait(400)}}}
// maintenance: decide what happens to the incoming record
{const I=SPEC.maintain.steps,M=SPEC.maintain;
 I[2].play={ask:"one location is wrong. What should happen?",ok:"Sent back with the reason. Once fixed, it goes live",
  choices:[{label:"Publish it anyway",why:"That would put a mistake on every screen that uses the map"},
           {label:"Send it back with the reason",right:true,ok:"Sent back with the reason. Once fixed, it goes live",then:A=>M.sendBack(A)}]}}
// cycle: drag the marker once round
{const I=SPEC.cycle.steps,C=SPEC.cycle;
 I[1].go=async A=>{const s=A.st;s.arcs.forEach(a=>{a.p.setAttribute("stroke-dashoffset",0);a.hd.style.opacity=1});s.nodes.forEach(n=>n.g.style.opacity=1);s.light(1);s.blur(5);s.mdots.style.opacity=0;s.setTok(s.ang(0))};
 I[1].play={ask:"drag the orange marker once round the loop",ok:"Round once. The map is sharper than when it started",
  setup(A,done,ui){const s=A.st;let tot=0,last=s.ang(0);A.pulse(s.at(s.ang(0)),24);
   A.drag(s.tok,{move:p=>{const a=Math.atan2(p[1]-s.c[1],p[0]-s.c[0]);let d=a-last;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;last=a;tot=clamp(tot+d,0,2*Math.PI);
     s.setTok(s.ang(0)+tot);const t=tot/(2*Math.PI);s.light(Math.min(6,Math.floor(t*6+.02)+1));s.blur(5*(1-t));if(tot>=2*Math.PI-.05){s.blur(0);done()}},
    end:()=>{if(tot<2*Math.PI-.05)ui.say("Keep going: all the way round, clockwise",true)}})},
  solve:async A=>{await C.spin(A,2200);A.st.blur(0)}}}

INIT.create=()=>Sketch("create",SPEC.create);
INIT.geodatabase=()=>Sketch("geodatabase",SPEC.geodatabase);
INIT.portal=()=>Sketch("portal",SPEC.portal);
INIT.mobile=()=>Sketch("mobile",SPEC.mobile);
INIT.mapping=()=>Sketch("mapping",SPEC.mapping);
INIT.maintain=()=>Sketch("maintain",SPEC.maintain);
INIT.cycle=()=>Sketch("cycle",SPEC.cycle);
