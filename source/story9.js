/* ============================================================ v16 · DATA CREATION, as reviewed
   Three figures in the overview's editorial style: the words are there from the start, only the drawing and one
   highlighted line animate, and each plays once when it scrolls into view (Replay to see it again).
     #legacy   Old records, made GIS-ready      old maps, Excel, KML, CAD, shapefiles → converted → one map
     #newdata  Three ways to map what's new     satellite digitising · scanned map, georeferenced · field survey
     #updates  One central copy, always current departments update one central GIS database                    */

function edFig(id,spec){
  const S=$("#"+id+"Svg"),rep=$("#"+id+"Rep");let P,mode,cancel=[],run=0,played=false;
  const pick=()=>innerWidth<700?"port":"land";
  const tw=(ms,fn)=>new Promise(r=>{cancel.push(tween(ms,fn,r))});
  const sleep=ms=>new Promise(r=>{const t=setTimeout(r,REDUCE?0:ms);cancel.push(()=>{clearTimeout(t);r()})});
  function build(){const m=spec.L[mode=pick()];S.innerHTML="";S.setAttribute("viewBox",`0 0 ${m.vb[0]} ${m.vb[1]}`);P=spec.build(S,m,mode)}
  async function play(){cancel.forEach(c=>c());cancel=[];const me=++run,alive=()=>run===me;rep.classList.remove("on");played=true;
    spec.reset(P);if(REDUCE){spec.fin(P);rep.classList.add("on");return}
    await spec.play(P,{tw,sleep,alive});if(!alive())return;rep.classList.add("on");if(spec.idle)spec.idle(P,{tw,sleep,alive})}
  rep.onclick=()=>play();
  Promise.all(['700 31px "Avenir Next World"','400 19.5px "Avenir Next World"'].map(f=>document.fonts.load(f).catch(()=>{}))).then(()=>{build();spec.reset(P);
    new IntersectionObserver((es,o)=>{if(es[0].isIntersecting){o.disconnect();setTimeout(play,250)}},{threshold:.3}).observe(S)});
  let rt;addEventListener("resize",()=>{clearTimeout(rt);rt=setTimeout(()=>{if(pick()!==mode){cancel.forEach(c=>c());cancel=[];run++;build();if(played){spec.fin(P);rep.classList.add("on")}else spec.reset(P)}},150)})}

/* shared bits: a seeded random, a text block with one highlighted line, pen-drawn paths */
function edRnd(seed){let s=seed;return()=>(s=s*16807%2147483647)/2147483647}
function edBlock(g,x,y,p,m){let yy=y,hl=null;
  if(p.t){txt({x,y:yy,class:"u t","font-size":m.ts},g,p.t);yy+=m.lh*1.35}
  p.b.forEach(l=>{if(typeof l==="string")txt({x,y:yy,class:"u","font-size":m.fs},g,l);
    else{const e=txt({x,y:yy,class:"u hlt","font-size":m.fs},g,l.hl),b=e.getBBox();hl=el("rect",{x:b.x-1,y:b.y+b.height*.34,width:0,height:b.height*.58,rx:3,fill:"rgba(247,214,90,.75)"});hl.dataset.w=b.width+6;g.insertBefore(hl,e)}
    yy+=m.lh});
  return{hl,bottom:yy}}
const edDraw=(e,t)=>e.setAttribute("stroke-dashoffset",1-t);
const edPath=(d,a,p)=>el("path",Object.assign({d,fill:"none",pathLength:1,"stroke-dasharray":1,"stroke-dashoffset":1,"stroke-linecap":"round","stroke-linejoin":"round"},a),p);
const edPts=a=>a.map((q,i)=>(i?"L":"M")+q[0].toFixed(1)+","+q[1].toFixed(1)).join("");
const edLerp=(a,b,t)=>a+(b-a)*t;

/* ───────────────────────────────────────────── 1 · OLD RECORDS, MADE GIS-READY */
INIT.legacy=()=>edFig("legacy",{
  L:{land:{vb:[1280,720],card:[36,46,290,96,14],conv:[438,226,214,190],map:[742,30,.98],txt:[438,500],ts:26,fs:18.5,lh:28},
     port:{vb:[640,1330],card:[26,22,286,96,14,2],conv:[150,388,340,150],map:[86,580,.9],txt:[40,1186],ts:28,fs:21,lh:31}},
  SRCS:[
    {k:"old",t:"Old maps",s:"paper or scanned",c:"#8a6a3a",lay:"District boundaries"},
    {k:"xls",t:"Excel",s:"rows with lat / long",c:"var(--dv-blue-500)",lay:"Anganwadi centres"},
    {k:"kml",t:"KML",s:"from Google Earth",c:"var(--dv-aqua-600)",lay:"Fibre routes"},
    {k:"cad",t:"CAD",s:"engineering drawings",c:"var(--dv-orange-500)",lay:"Mine leases"},
    {k:"shp",t:"Shapefile",s:"older GIS files",c:"#7a6f9b",lay:"Highways"}],
  build(S,m,mode){const SR=this.SRCS,ST=G.stack,P={cards:[],links:[],outs:[],lays:[],ticks:[]};
    const defs=el("defs",{},S);defs.innerHTML='<filter id="lgSoft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="7"/></filter><clipPath id="lgClip"><path d="'+G.state+'"/></clipPath>';
    const [cx0,cy0,cw,ch,gap,cols]=m.card,[vx,vy,vw,vh]=m.conv,[mx,my,mk]=m.map;
    const cardXY=i=>cols?[cx0+(i%2)*(cw+12),cy0+Math.floor(i/2)*(ch+gap)]:[cx0,cy0+i*(ch+gap)];
    // the map: where every converted layer lands
    const mg=el("g",{transform:`translate(${mx} ${my}) scale(${mk})`},S);
    el("path",{d:G.state,fill:"rgba(60,50,40,.12)",transform:"translate(4 7)",filter:"url(#lgSoft)"},mg);el("path",{d:G.state,fill:"#fbfaf8"},mg);
    const lg=el("g",{"clip-path":"url(#lgClip)"},mg);
    SR.forEach((s,i)=>{const g=el("g",{},lg);P.lays.push(g);
      if(s.k==="old")G.districts.forEach(d=>edPath(d.d,{stroke:"#a08a66","stroke-width":1.1},g));
      if(s.k==="xls"){g.dataset.pts=1;ST.aw.forEach(p=>el("circle",{cx:p[0],cy:p[1],r:2.9,fill:"var(--dv-blue-500)",opacity:0},g))}
      if(s.k==="kml")edPath(ST.fibre,{stroke:"var(--dv-aqua-600)","stroke-width":2.4},g);
      if(s.k==="cad"){g.dataset.fade=1;g.setAttribute("opacity",0);el("path",{d:ST.mines,fill:"var(--dv-orange-500)",stroke:"var(--dv-orange-700)","stroke-width":1.1},g)}
      if(s.k==="shp")edPath(G.ctx.roads,{stroke:"#9b8fbf","stroke-width":2},g)});
    P.edge=edPath(G.state,{stroke:"#8f887e","stroke-width":1.6},mg);
    // the converter
    const cg=el("g",{},S);el("rect",{x:vx,y:vy,width:vw,height:vh,rx:14,fill:"#fff",stroke:"var(--n300)","stroke-width":1.4},cg);
    txt({x:vx+vw/2,y:vy+36,class:"u t","font-size":m.ts*.82,"text-anchor":"middle"},cg,"Convert");
    const steps=["Georeference","Fix the geometry","One coordinate system"];
    steps.forEach((t,j)=>{const y=vy+70+j*36,x=vx+(mode==="port"?70:26);const b=el("rect",{x,y:y-12,width:16,height:16,rx:4,fill:"#fff",stroke:"var(--n300)","stroke-width":1.3},cg);
      const k=el("path",{d:`M${x+4},${y-4} l3.5,3.5 l6,-7`,fill:"none",stroke:"#fff","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},cg);
      txt({x:x+28,y:y+1,class:"u","font-size":m.fs*.86},cg,t);P.ticks.push({b,k})});
    // the five sources (wires sit underneath the cards)
    const wireG=el("g",{},S);
    SR.forEach((s,i)=>{const[x,y]=cardXY(i),g=el("g",{},S),c={g};P.cards.push(c);
      c.box=el("rect",{x,y,width:cw,height:ch,rx:12,fill:"#fff",stroke:"var(--n200)","stroke-width":1.3},g);
      edThumb(s.k,g,x+12,y+14,82,ch-28);
      txt({x:x+110,y:y+40,class:"u t","font-size":m.fs*1.02},g,s.t);txt({x:x+110,y:y+64,class:"u","font-size":m.fs*.8,style:"fill:var(--n600)"},g,s.s);
      el("rect",{x:x+cw-28,y:y+14,width:14,height:14,rx:3,fill:s.c},g);
      c.ok=el("g",{opacity:0},g);el("circle",{cx:x+cw-46,cy:y+21,r:9,fill:"#2f7d4f"},c.ok);el("path",{d:`M${x+cw-50.5},${y+21} l3,3 l5.5,-6`,fill:"none",stroke:"#fff","stroke-width":2,"stroke-linecap":"round"},c.ok);
      // wires: card → converter → map
      const a=mode==="port"?[x+cw/2,y+ch]:[x+cw,y+ch/2],b=mode==="port"?[vx+vw*(.18+i*.16),vy]:[vx,vy+vh*(.2+i*.15)];
      const d=mode==="port"?`M${a[0]},${a[1]} C${a[0]},${a[1]+40} ${b[0]},${b[1]-50} ${b[0]},${b[1]}`:`M${a[0]},${a[1]} C${a[0]+60},${a[1]} ${b[0]-60},${b[1]} ${b[0]},${b[1]}`;
      P.links.push(edPath(d,{stroke:s.c,"stroke-width":1.8,"stroke-dasharray":"1","opacity":.9},wireG))});
    const outA=mode==="port"?[vx+vw/2,vy+vh]:[vx+vw,vy+vh/2],cen=[mx+G.W*mk*.5,my+G.H*mk*.42];
    P.out=edPath(mode==="port"?`M${outA[0]},${outA[1]} L${outA[0]},${my+30}`:`M${outA[0]},${outA[1]} C${outA[0]+50},${outA[1]} ${cen[0]-120},${cen[1]} ${mx+G.W*mk*.28},${cen[1]}`,{stroke:"var(--n700)","stroke-width":2,"marker-end":""},S);
    P.dot=el("circle",{r:5,fill:"var(--n900)",opacity:0},S);P.wires=P.links;
    // the words
    const tg=el("g",{},S);const B=edBlock(tg,m.txt[0],m.txt[1],{t:"One format",b:["Old records come in many forms.","Each is converted and placed on",{hl:"the same coordinates."}]},m);P.hl=B.hl;
    return P},
  reset(P){P.cards.forEach(c=>{c.box.setAttribute("stroke","var(--n200)");c.ok.setAttribute("opacity",0)});P.links.forEach(l=>edDraw(l,0));edDraw(P.out,0);
    P.lays.forEach(g=>{g.querySelectorAll("path").forEach(p=>edDraw(p,0));g.querySelectorAll("circle").forEach(c=>c.setAttribute("opacity",0));if(g.dataset.fade)g.setAttribute("opacity",0)});
    edDraw(P.edge,0);P.ticks.forEach(t=>{t.b.setAttribute("fill","#fff");t.b.setAttribute("stroke","var(--n300)")});P.hl&&P.hl.setAttribute("width",0)},
  fin(P){P.cards.forEach(c=>c.ok.setAttribute("opacity",1));P.links.forEach(l=>edDraw(l,1));edDraw(P.out,1);edDraw(P.edge,1);
    P.lays.forEach(g=>{g.querySelectorAll("path").forEach(p=>edDraw(p,1));g.querySelectorAll("circle").forEach(c=>c.setAttribute("opacity",1));g.setAttribute("opacity",1)});
    P.ticks.forEach(t=>{t.b.setAttribute("fill","#2f7d4f");t.b.setAttribute("stroke","#2f7d4f")});P.hl&&P.hl.setAttribute("width",P.hl.dataset.w)},
  async play(P,{tw,sleep,alive}){
    await tw(900,t=>edDraw(P.edge,t));if(!alive())return;
    for(let i=0;i<P.cards.length;i++){const c=P.cards[i],L=P.lays[i];c.box.setAttribute("stroke",this.SRCS[i].c);
      await tw(520,t=>edDraw(P.links[i],t));if(!alive())return;
      for(const tk of P.ticks){tk.b.setAttribute("fill","#2f7d4f");tk.b.setAttribute("stroke","#2f7d4f");await sleep(90);if(!alive())return}
      if(i===0)await tw(420,t=>edDraw(P.out,t));
      const paths=[...L.querySelectorAll("path")],dots=[...L.querySelectorAll("circle")];
      await tw(800,t=>{paths.forEach(p=>edDraw(p,t));if(L.dataset.fade)L.setAttribute("opacity",t);const n=Math.round(dots.length*t);dots.forEach((d,j)=>d.setAttribute("opacity",j<n?1:0))});if(!alive())return;
      c.ok.setAttribute("opacity",1);c.box.setAttribute("stroke","var(--n200)");P.ticks.forEach(tk=>{tk.b.setAttribute("fill","#fff");tk.b.setAttribute("stroke","var(--n300)")});await sleep(160)}
    P.ticks.forEach(tk=>{tk.b.setAttribute("fill","#2f7d4f");tk.b.setAttribute("stroke","#2f7d4f")});
    if(P.hl){const w=+P.hl.dataset.w;await tw(650,t=>P.hl.setAttribute("width",w*t))}}});

/* the little picture on each source card: what that format actually looks like */
function edThumb(k,g,x,y,w,h){const t=el("g",{transform:`translate(${x} ${y})`},g);
  if(k==="old"){const p=el("g",{transform:`rotate(-4 ${w/2} ${h/2})`},t);el("rect",{x:2,y:2,width:w-4,height:h-4,fill:"#efe3c8",stroke:"#c9b48a"},p);
    for(let i=1;i<3;i++){el("line",{x1:2,y1:h*i/3,x2:w-2,y2:h*i/3,stroke:"#d8c7a1","stroke-width":.8},p);el("line",{x1:w*i/3,y1:2,x2:w*i/3,y2:h-2,stroke:"#d8c7a1","stroke-width":.8},p)}
    el("path",{d:G.state,transform:`translate(${w/2-G.W*.045} 3) scale(.09 ${(h-6)/G.H})`,fill:"none",stroke:"#8a6a3a","stroke-width":14},p)}
  if(k==="xls"){el("rect",{x:0,y:0,width:w,height:h,rx:3,fill:"#fff",stroke:"var(--n300)"},t);el("rect",{x:0,y:0,width:w,height:12,rx:3,fill:"#1d6f42"},t);
    ["Lat","Long"].forEach((s,i)=>txt({x:w*(.42+i*.3),y:9,"font-size":7,fill:"#fff","font-family":"var(--font)"},t,s));
    for(let r=1;r<5;r++){el("line",{x1:0,y1:12+r*(h-12)/5,x2:w,y2:12+r*(h-12)/5,stroke:"var(--n200)"},t)}[.32,.62].forEach(f=>el("line",{x1:w*f,y1:12,x2:w*f,y2:h,stroke:"var(--n200)"},t));
    for(let r=0;r<4;r++)[.35,.66].forEach((f,i)=>el("rect",{x:w*f+2,y:16+r*(h-12)/5,width:w*.22,height:3,fill:i?"var(--n400)":"var(--n500)"},t))}
  if(k==="kml"){el("rect",{x:0,y:0,width:w,height:h,rx:3,fill:"#f7f6f2",stroke:"var(--n300)"},t);
    [["<Placemark>","#9a2e5d"],["  <LineString>","#9a2e5d"],["  <coordinates>","#9a2e5d"],["   81.63,21.25","#3f51ae"],["   81.70,21.31","#3f51ae"]].forEach(([s,c],i)=>txt({x:5,y:12+i*(h-14)/5,"font-size":7.4,fill:c,"font-family":"ui-monospace,monospace"},t,s))}
  if(k==="cad"){el("rect",{x:0,y:0,width:w,height:h,rx:3,fill:"#21262c"},t);el("rect",{x:w*.22,y:h*.26,width:w*.42,height:h*.42,fill:"none",stroke:"#5fd3ff","stroke-width":1.2},t);
    el("rect",{x:w*.48,y:h*.4,width:w*.26,height:h*.36,fill:"none",stroke:"#f4d35e","stroke-width":1.2},t);el("path",{d:`M${w*.22},${h*.86} L${w*.74},${h*.86} M${w*.22},${h*.82} v8 M${w*.74},${h*.82} v8`,stroke:"#e9e9e9","stroke-width":.9},t);
    txt({x:w*.48,y:h*.84,"font-size":6.5,fill:"#e9e9e9","text-anchor":"middle","font-family":"ui-monospace,monospace"},t,"24.50")}
  if(k==="shp"){[".shp",".dbf",".shx"].forEach((s,i)=>{const fx=i*w*.33,fy=4+i*3;el("path",{d:`M${fx+2},${fy} h${w*.24} l6,6 v${h-18} h-${w*.24+6} z`,fill:"#fff",stroke:"var(--n400)"},t);txt({x:fx+w*.15,y:fy+h*.55,"font-size":8,"text-anchor":"middle",fill:"#5a4f84","font-family":"ui-monospace,monospace"},t,s)})}}

/* ───────────────────────────────────────────── 2 · THREE WAYS TO MAP WHAT'S NEW */
INIT.newdata=()=>edFig("newdata",{
  L:{land:{vb:[1280,730],pan:i=>[40+i*410,128,1],hd:[0,-58],bar:[440,612,400,48],ts:22,fs:17,lh:26},
     port:{vb:[640,2250],pan:i=>[54,96+i*700,1.4],hd:[0,-48],bar:[120,2150,400,56],ts:22,fs:16,lh:24}},
  build(S,m,mode){const P={};const PW=380,PH=420;
    const defs=el("defs",{},S);defs.innerHTML=[0,1,2].map(i=>`<clipPath id="ndc${i}"><rect x="0" y="0" width="${PW}" height="${PH}" rx="12"/></clipPath>`).join("")+'<clipPath id="ndSite"><rect x="0" y="0" width="380" height="236"/></clipPath>';
    const H=[["1","From satellite images","Roads and buildings traced on screen"],["2","From old paper maps","Scanned, then pinned to real coordinates"],["3","From field survey","Measured on the ground"]];
    P.panels=[0,1,2].map(i=>{const[x,y,k]=m.pan(i),g=el("g",{transform:`translate(${x} ${y}) scale(${k})`},S);
      el("circle",{cx:14,cy:m.hd[1]+6,r:14,fill:"var(--n950)"},g);txt({x:14,y:m.hd[1]+11,"text-anchor":"middle",class:"u",style:"fill:#fff;font-weight:700","font-size":15},g,H[i][0]);
      txt({x:38,y:m.hd[1]+12,class:"u t","font-size":m.ts},g,H[i][1]);txt({x:38,y:m.hd[1]+36,class:"u","font-size":m.fs*.92,style:"fill:var(--n600)"},g,H[i][2]);
      const inner=el("g",{"clip-path":`url(#ndc${i})`},g);el("rect",{x:.5,y:.5,width:PW-1,height:PH-1,rx:12,fill:"none",stroke:"var(--n300)","stroke-width":1.2},g);return{g,inner,x,y}});
    P.sat=ndSat(P.panels[0].inner,PW,PH);P.scan=ndScan(P.panels[1].inner,PW,PH);P.srv=ndSurvey(P.panels[2].inner,PW,PH,m);
    // all three feed one layer
    const[bx,by,bw,bh]=m.bar;P.arrows=[0,1,2].map(i=>{const[x,y]=m.pan(i);const a=[x+PW/2,y+PH+6],b=[bx+bw*(.2+i*.3),by-4];
      return edPath(mode==="port"?`M${x+PW+14},${y+PH*.5} C${x+PW+60},${y+PH*.5} ${bx+bw+40},${by+bh/2} ${bx+bw+4},${by+bh/2}`:`M${a[0]},${a[1]} C${a[0]},${a[1]+40} ${b[0]},${b[1]-40} ${b[0]},${b[1]}`,{stroke:"var(--n500)","stroke-width":1.6},S)});
    if(mode==="port")P.arrows.forEach(a=>a.setAttribute("opacity",0));
    const bg=el("g",{},S);el("rect",{x:bx,y:by,width:bw,height:bh,rx:24,fill:"var(--n950)"},bg);
    const bt=txt({x:bx+bw/2,y:by+bh/2+6,"text-anchor":"middle",class:"u",style:"fill:#fff;font-weight:600","font-size":m.fs},bg,"All three feed the same map layer");P.bar=bg;
    return P},
  reset(P){P.sat.reset();P.scan.reset();P.srv.reset();P.arrows.forEach(a=>edDraw(a,0));P.bar.setAttribute("opacity",0)},
  fin(P){P.sat.fin();P.scan.fin();P.srv.fin();P.arrows.forEach(a=>edDraw(a,1));P.bar.setAttribute("opacity",1)},
  async play(P,ctx){await P.sat.play(ctx);if(!ctx.alive())return;await P.scan.play(ctx);if(!ctx.alive())return;await P.srv.play(ctx);if(!ctx.alive())return;
    await ctx.tw(700,t=>P.arrows.forEach(a=>edDraw(a,t)));await ctx.tw(400,t=>P.bar.setAttribute("opacity",t))}});

/* 2a · a satellite image, and a road and a building traced over it */
function ndSat(g,W,H){const R=edRnd(7),cols=["#6f7d4f","#7d8656","#8a7f55","#5d6b44","#9a8a5e","#68774a","#a39566"];
  el("rect",{x:0,y:0,width:W,height:H,fill:"#5f6c48"},g);
  for(let r=0;r<8;r++)for(let c=0;c<7;c++){const x=c*58-8+R()*10,y=r*56-8+R()*10,w=58+R()*14,h=56+R()*12,a=(R()-.5)*.25;
    el("path",{d:`M${x},${y+h*a} L${x+w},${y} L${x+w+R()*6},${y+h} L${x},${y+h+h*a}Z`,fill:cols[Math.floor(R()*cols.length)],stroke:"rgba(40,45,30,.35)","stroke-width":.8},g)}
  el("path",{d:`M-10,300 C80,280 120,350 200,330 S330,250 400,270`,fill:"none",stroke:"#3f5a5f","stroke-width":13,opacity:.9},g);
  for(let i=0;i<70;i++){const x=R()*W,y=R()*H;if(y>270&&y<350)continue;el("circle",{cx:x,cy:y,r:2+R()*4,fill:"#3f4d2f",opacity:.75},g)}
  const road=[[24,404],[96,350],[170,318],[236,240],[300,170],[350,96],[372,20]];el("path",{d:edPts(road),fill:"none",stroke:"#cdb88f","stroke-width":7,opacity:.85},g);
  const roofs=[];for(let i=0;i<9;i++){const x=200+R()*120,y=180+R()*70;if(Math.abs(x-260)<16&&Math.abs(y-200)<14)continue;roofs.push(el("rect",{x,y,width:9+R()*8,height:7+R()*6,fill:"#c9b9a0",stroke:"#8f7e66","stroke-width":.6,transform:`rotate(${(R()-.5)*30} ${x} ${y})`},g))}
  const bld=[[120,150],[168,140],[176,178],[128,188]];el("path",{d:edPts(bld)+"Z",fill:"#d4c4a6",stroke:"#8f7e66"},g);
  const tool=el("g",{},g);el("rect",{x:12,y:12,width:136,height:28,rx:6,fill:"rgba(255,255,255,.92)"},tool);const tt=txt({x:24,y:31,class:"u","font-size":13,style:"font-weight:600;fill:var(--n900)"},tool,"Draw · Line");
  const line=el("path",{d:"",fill:"none",stroke:"#f7d65a","stroke-width":3.2,"stroke-linecap":"round","stroke-linejoin":"round"},g);const poly=el("path",{d:"",fill:"rgba(247,214,90,.25)",stroke:"#f7d65a","stroke-width":2.6,"stroke-linejoin":"round"},g);
  const vg=el("g",{},g),cur=el("g",{opacity:0},g);el("circle",{r:9,fill:"none",stroke:"#fff","stroke-width":1.6},cur);el("path",{d:"M-15,0h10M5,0h10M0,-15v10M0,5v10",stroke:"#fff","stroke-width":1.6},cur);
  const tags=el("g",{opacity:0},g);[[road[3],"Road · line"],[[176,132],"Building · polygon"]].forEach(([p,s])=>{const w=s.length*7.4+16;el("rect",{x:p[0]+12,y:p[1]-30,width:w,height:24,rx:5,fill:"rgba(20,24,20,.82)"},tags);txt({x:p[0]+20,y:p[1]-13,class:"u","font-size":12.5,style:"fill:#fff"},tags,s)});
  const mv=(p)=>cur.setAttribute("transform",`translate(${p[0]} ${p[1]})`),vtx=p=>el("rect",{x:p[0]-3.5,y:p[1]-3.5,width:7,height:7,fill:"#fff",stroke:"#3a3a2a"},vg);
  return{reset(){line.setAttribute("d","");poly.setAttribute("d","");vg.innerHTML="";cur.setAttribute("opacity",0);tags.setAttribute("opacity",0);tt.textContent="Draw · Line"},
    fin(){line.setAttribute("d",edPts(road));poly.setAttribute("d",edPts(bld)+"Z");vg.innerHTML="";road.concat(bld).forEach(vtx);tags.setAttribute("opacity",1)},
    async play({tw,sleep,alive}){cur.setAttribute("opacity",1);mv(road[0]);vtx(road[0]);
      for(let i=1;i<road.length;i++){const a=road[i-1],b=road[i];await tw(260,t=>{const p=[edLerp(a[0],b[0],t),edLerp(a[1],b[1],t)];mv(p);line.setAttribute("d",edPts(road.slice(0,i).concat([p])))});if(!alive())return;vtx(b)}
      tt.textContent="Draw · Polygon";await sleep(200);
      for(let i=0;i<=bld.length;i++){const a=i?bld[i-1]:road.at(-1),b=bld[i%bld.length];await tw(i?240:420,t=>{const p=[edLerp(a[0],b[0],t),edLerp(a[1],b[1],t)];mv(p);if(i)poly.setAttribute("d",edPts(bld.slice(0,i).concat([p])))});if(!alive())return;if(i<bld.length)vtx(b)}
      poly.setAttribute("d",edPts(bld)+"Z");cur.setAttribute("opacity",0);await tw(350,t=>tags.setAttribute("opacity",t))}}}

/* 2b · a scanned paper map, pinned to four control points, then traced */
function ndScan(g,W,H){el("rect",{x:0,y:0,width:W,height:H,fill:"#f6f4ef"},g);
  for(let i=1;i<6;i++){el("line",{x1:i*W/6,y1:0,x2:i*W/6,y2:H,stroke:"#dcd6ca"},g);txt({x:i*W/6+3,y:H-6,"font-size":9.5,fill:"var(--n500)","font-family":"ui-monospace,monospace"},g,(81.4+i*.05).toFixed(2)+"°E")}
  for(let i=1;i<7;i++){el("line",{x1:0,y1:i*H/7,x2:W,y2:i*H/7,stroke:"#dcd6ca"},g);txt({x:4,y:i*H/7-3,"font-size":9.5,fill:"var(--n500)","font-family":"ui-monospace,monospace"},g,(21.5-i*.05).toFixed(2)+"°N")}
  const sh=el("g",{},g),R=edRnd(11);
  el("rect",{x:46,y:56,width:288,height:300,fill:"#efe3c8",stroke:"#c9b48a"},sh);
  for(let i=0;i<260;i++)el("circle",{cx:46+R()*288,cy:56+R()*300,r:.6+R()*1.2,fill:"#c9b48a",opacity:.35},sh);
  el("path",{d:"M60,250 C110,230 150,262 205,240 S300,210 326,224",fill:"none",stroke:"#7aa0b4","stroke-width":5,opacity:.55},sh);
  el("path",{d:"M90,346 L130,280 L210,200 L262,120 L300,66",fill:"none",stroke:"#8a6a3a","stroke-width":2,"stroke-dasharray":"7 4"},sh);
  const bnd=[[78,96],[160,80],[236,104],[300,150],[296,232],[250,300],[160,318],[96,280],[70,190]];el("path",{d:edPts(bnd)+"Z",fill:"none",stroke:"#8a6a3a","stroke-width":2.2},sh);
  [["Tehsil",150,170],["Nala",230,232]].forEach(([s,x,y])=>txt({x,y,"font-size":13,fill:"#6b5432","font-style":"italic","font-family":"Georgia,serif"},sh,s));
  const gcp=[[78,96],[300,150],[250,300],[96,280]],pins=el("g",{},sh),tgts=el("g",{},g),ties=el("g",{},g);
  gcp.forEach((p,i)=>{const pg=el("g",{opacity:0},pins);el("circle",{cx:p[0],cy:p[1],r:8,fill:"none",stroke:"#d2422e","stroke-width":2},pg);el("path",{d:`M${p[0]-13},${p[1]}h26M${p[0]},${p[1]-13}v26`,stroke:"#d2422e","stroke-width":1.4},pg);
    txt({x:p[0]+10,y:p[1]-10,"font-size":12,"font-weight":700,fill:"#d2422e","font-family":"var(--font)"},pg,i+1);
    const tg=el("g",{opacity:0},tgts);el("circle",{cx:p[0],cy:p[1],r:6,fill:"none",stroke:"var(--dv-blue-700)","stroke-width":2},tg);el("circle",{cx:p[0],cy:p[1],r:1.6,fill:"var(--dv-blue-700)"},tg)});
  const trace=edPath(edPts(bnd)+"Z",{stroke:"#f0b400","stroke-width":3.2},g);
  const lab=el("g",{opacity:0},g);el("rect",{x:12,y:12,width:150,height:28,rx:6,fill:"rgba(255,255,255,.92)",stroke:"var(--n200)"},lab);const lt=txt({x:24,y:31,class:"u","font-size":13,style:"font-weight:600;fill:var(--n900)"},lab,"4 control points");
  const T0={tx:-34,ty:30,r:-8,s:.9},Tn={tx:0,ty:0,r:0,s:1},cxs=190,cys=206;
  const setT=q=>sh.setAttribute("transform",`translate(${q.tx} ${q.ty}) rotate(${q.r} ${cxs} ${cys}) translate(${cxs} ${cys}) scale(${q.s}) translate(${-cxs} ${-cys})`);
  const where=(p,q)=>{const a=q.r*Math.PI/180,x=(p[0]-cxs)*q.s,y=(p[1]-cys)*q.s;return[cxs+x*Math.cos(a)-y*Math.sin(a)+q.tx,cys+x*Math.sin(a)+y*Math.cos(a)+q.ty]};
  const tie=q=>{ties.innerHTML="";gcp.forEach(p=>{const a=where(p,q);el("line",{x1:a[0],y1:a[1],x2:p[0],y2:p[1],stroke:"#d2422e","stroke-width":1.2,"stroke-dasharray":"4 3"},ties)})};
  return{reset(){setT(T0);[...pins.children,...tgts.children].forEach(e=>e.setAttribute("opacity",0));ties.innerHTML="";edDraw(trace,0);lab.setAttribute("opacity",0);lt.textContent="4 control points"},
    fin(){setT(Tn);[...pins.children,...tgts.children].forEach(e=>e.setAttribute("opacity",1));ties.innerHTML="";edDraw(trace,1);lab.setAttribute("opacity",1);lt.textContent="Georeferenced"},
    async play({tw,sleep,alive}){await tw(300,t=>lab.setAttribute("opacity",t));
      for(let i=0;i<4;i++){pins.children[i].setAttribute("opacity",1);tgts.children[i].setAttribute("opacity",1);await sleep(220);if(!alive())return}
      tie(T0);await sleep(350);if(!alive())return;
      await tw(1300,t=>{const q={tx:edLerp(T0.tx,0,t),ty:edLerp(T0.ty,0,t),r:edLerp(T0.r,0,t),s:edLerp(T0.s,1,t)};setT(q);tie(q)});if(!alive())return;
      ties.innerHTML="";lt.textContent="Georeferenced";await tw(900,t=>edDraw(trace,t))}}}

/* 2c · field survey: four instruments, the same corner measured ever more precisely, then a drone over the whole site */
function ndSurvey(g,W,H,m){el("rect",{x:0,y:0,width:W,height:H,fill:"#fbfaf8"},g);
  const site=el("g",{"clip-path":"url(#ndSite)"},g);el("rect",{x:0,y:0,width:W,height:236,fill:"#eef0ea"},site);
  for(let i=0;i<6;i++)el("line",{x1:0,y1:i*44,x2:W,y2:i*44+30,stroke:"#e0e3da","stroke-width":8},site);
  el("path",{d:"M0,190 C120,176 240,200 380,170",fill:"none",stroke:"#d9cfbd","stroke-width":16},site);
  const ortho=el("g",{opacity:1},site),oc=el("clipPath",{id:"ndOrtho"},g.ownerSVGElement.querySelector("defs"));const ocr=el("rect",{x:0,y:0,width:0,height:236},oc);
  const og=el("g",{"clip-path":"url(#ndOrtho)"},ortho);el("rect",{x:0,y:0,width:W,height:236,fill:"#d9d3c3"},og);el("path",{d:"M0,190 C120,176 240,200 380,170",fill:"none",stroke:"#bfb39b","stroke-width":16},og);
  [[60,40,70,50],[250,30,80,60],[40,120,60,40],[290,110,60,44]].forEach(([x,y,w,h])=>el("rect",{x,y,width:w,height:h,fill:"#b9ad98",stroke:"#7c705c"},og));
  const bx=150,by=62,bw=92,bh=72;site.insertBefore(el("rect",{x:bx,y:by,width:bw,height:bh,fill:"#fff",stroke:"var(--n500)","stroke-width":1.4}),ortho);el("rect",{x:bx,y:by,width:bw,height:bh,fill:"#cfc4ae",stroke:"#7c705c"},og);
  const P=[bx,by],acc=el("circle",{cx:P[0],cy:P[1],r:0,fill:"rgba(63,81,174,.12)",stroke:"var(--dv-blue-700)","stroke-width":1.4},site);
  el("circle",{cx:P[0],cy:P[1],r:3.2,fill:"var(--dv-blue-700)"},site);const accT=txt({x:P[0]+10,y:P[1]-10,class:"u","font-size":12.5,style:"font-weight:600;fill:var(--dv-blue-700)"},site,"");
  const drone=el("g",{opacity:0},site);el("rect",{x:-8,y:-5,width:16,height:10,rx:3,fill:"var(--n900)"},drone);[[-14,-10],[14,-10],[-14,10],[14,10]].forEach(([x,y])=>{el("line",{x1:0,y1:0,x2:x,y2:y,stroke:"var(--n900)","stroke-width":2},drone);el("circle",{cx:x,cy:y,r:6,fill:"none",stroke:"var(--n900)","stroke-width":1.4},drone)});
  el("line",{x1:0,y1:236,x2:W,y2:236,stroke:"var(--n300)"},g);
  const I=[["Phone GPS","metres",64],["DGPS","centimetres",16],["Total Station","millimetres",5],["Drone","whole area, fast",0]],rows=[];
  I.forEach(([n,a],i)=>{const y=262+i*40,r=el("g",{},g);const bg=el("rect",{x:10,y:y-6,width:W-20,height:36,rx:8,fill:"transparent"},r);
    const ic=el("g",{transform:`translate(32 ${y+12})`},r);ndIcon(i,ic);
    txt({x:60,y:y+17,class:"u","font-size":15,style:"font-weight:600;fill:var(--n900)"},r,n);txt({x:W-22,y:y+17,class:"u","font-size":13.5,"text-anchor":"end",style:"fill:var(--n600)"},r,a);rows.push({r,bg})});
  const hi=i=>rows.forEach((o,j)=>o.bg.setAttribute("fill",j===i?"#eef1fb":"transparent"));
  return{reset(){acc.setAttribute("r",0);accT.textContent="";hi(-1);drone.setAttribute("opacity",0);ocr.setAttribute("width",0)},
    fin(){acc.setAttribute("r",5);accT.textContent="";hi(-1);ocr.setAttribute("width",W)},
    async play({tw,sleep,alive}){for(let i=0;i<3;i++){hi(i);const r0=+acc.getAttribute("r")||I[0][2]*1.4,r1=I[i][2];accT.textContent=I[i][0];
        await tw(700,t=>acc.setAttribute("r",edLerp(r0,r1,t)));if(!alive())return;await sleep(350)}
      hi(3);accT.textContent="";drone.setAttribute("opacity",1);await tw(1600,t=>{const x=-20+(W+40)*t;drone.setAttribute("transform",`translate(${x} ${110+Math.sin(t*6)*6})`);ocr.setAttribute("width",Math.max(0,x))});
      drone.setAttribute("opacity",0);hi(-1)}}}
function ndIcon(i,g){const s={fill:"none",stroke:"var(--n800)","stroke-width":1.6,"stroke-linejoin":"round","stroke-linecap":"round"};
  if(i===0){el("rect",Object.assign({x:-7,y:-12,width:14,height:24,rx:3},s),g);el("circle",{cx:0,cy:8,r:1.2,fill:"var(--n800)"},g)}
  if(i===1){el("path",Object.assign({d:"M0,-12 v24 M-6,12 h12"},s),g);el("ellipse",Object.assign({cx:0,cy:-12,rx:7,ry:2.6},s),g)}
  if(i===2){el("rect",Object.assign({x:-6,y:-13,width:12,height:9,rx:2},s),g);el("path",Object.assign({d:"M0,-4 L-8,12 M0,-4 L8,12 M0,-4 L0,12"},s),g)}
  if(i===3){el("rect",Object.assign({x:-4,y:-3,width:8,height:6,rx:1.5},s),g);[[-10,-8],[10,-8],[-10,8],[10,8]].forEach(([x,y])=>{el("line",Object.assign({x1:0,y1:0,x2:x,y2:y},s),g);el("circle",Object.assign({cx:x,cy:y,r:3.6},s),g)})}}

/* ───────────────────────────────────────────── 3 · ONE CENTRAL COPY, ALWAYS CURRENT */
INIT.updates=()=>edFig("updates",{
  L:{land:{vb:[1280,720],hub:[860,372],rx:318,ry:262,txt:[48,250],ts:30,fs:19.5,lh:30,cw:168},
     port:{vb:[640,1180],hub:[320,760],rx:212,ry:300,txt:[34,70],ts:32,fs:22,lh:33,cw:150}},
  D:["Revenue","Forest","Mining","Health","Education","Women & Child","Rural Dev.","Water Resources"],
  build(S,m,mode){const P={deps:[],spokes:[]};const[hx,hy]=m.hub;
    const tg=el("g",{},S);const B=edBlock(tg,m.txt[0],m.txt[1],{t:"Centralised data",b:["Before, each department kept","its own copy of the map.","Now every update goes to one","central database, so",{hl:"everyone sees the same change."}]},m);P.hl=B.hl;
    const cap=txt({x:hx,y:mode==="port"?hy-m.ry-74:40,"text-anchor":"middle",class:"u",style:"font-weight:600;letter-spacing:.08em;fill:var(--n600)","font-size":13},S,"");P.cap=cap;
    const sg=el("g",{},S),cg=el("g",{},S);
    // the hub: one central GIS database
    const hub=el("g",{transform:`translate(${hx} ${hy})`},S);P.hub=hub;const rg=el("circle",{r:60,fill:"none",stroke:"var(--dv-blue-500)","stroke-width":2,opacity:0},hub);P.ring=rg;
    el("circle",{r:56,fill:"#fff",stroke:"var(--n300)","stroke-width":1.4},hub);
    const dr={fill:"none",stroke:"var(--dv-blue-700)","stroke-width":2.2};[-16,0,16].forEach(y=>el("ellipse",Object.assign({cx:0,cy:y,rx:24,ry:8},dr),hub));el("path",Object.assign({d:"M-24,-16 V16 M24,-16 V16"},dr),hub);
    el("rect",{x:-92,y:66,width:184,height:44,rx:6,fill:"var(--page)"},hub);txt({x:0,y:84,"text-anchor":"middle",class:"u t","font-size":16},hub,"Central GIS database");P.ver=txt({x:0,y:104,"text-anchor":"middle",class:"u","font-size":13.5,style:"fill:var(--n600)"},hub,"version 6");
    this.D.forEach((n,i)=>{const a=-Math.PI/2+(i+.5)*Math.PI*2/this.D.length,x=hx+Math.cos(a)*m.rx,y=hy+Math.sin(a)*m.ry,g=el("g",{},cg),o={g,x,y,a,n};
      const w=m.cw,h=40;o.box=el("rect",{x:x-w/2,y:y-h/2,width:w,height:h,rx:20,fill:"#fff",stroke:"var(--n300)","stroke-width":1.3},g);
      txt({x,y:y+5.5,"text-anchor":"middle",class:"u","font-size":14.5,style:"font-weight:600;fill:var(--n900)"},g,n);
      // its own old copy of the map, with its own version
      const off=[Math.cos(a)*(w/2+28),Math.sin(a)*(h/2+30)];o.copy=el("g",{transform:`translate(${x+off[0]} ${y+off[1]})`},S);o.c0=[x+off[0],y+off[1]];
      el("path",{d:G.state,transform:`translate(-15 -18) scale(.058)`,fill:"#f3efe6",stroke:"#a8a093","stroke-width":18},o.copy);
      const vv=[2,5,1,3,4,2,1,3][i];o.vt=txt({x:0,y:30,"text-anchor":"middle",class:"u","font-size":12,style:`font-weight:700;fill:${vv===5?"var(--n700)":"#c0392b"}`},o.copy,"v"+vv);
      o.spoke=edPath(`M${hx+Math.cos(a)*58},${hy+Math.sin(a)*58} L${x-Math.cos(a)*(w/2-6)},${y-Math.sin(a)*(h/2-2)}`,{stroke:"var(--n400)","stroke-width":1.6},sg);
      o.tick=el("g",{opacity:0},g);el("circle",{cx:x+w/2-4,cy:y-h/2+4,r:9,fill:"#2f7d4f"},o.tick);el("path",{d:`M${x+w/2-8.5},${y-h/2+4} l3,3 l5.5,-6`,fill:"none",stroke:"#fff","stroke-width":2,"stroke-linecap":"round"},o.tick);
      P.deps.push(o)});
    P.pk=el("circle",{r:6,fill:"var(--dv-orange-500)",opacity:0},S);P.out=this.D.map(()=>el("circle",{r:4.5,fill:"var(--dv-blue-500)",opacity:0},S));P.v=6;
    return P},
  reset(P){P.cap.textContent="BEFORE · MANY COPIES";P.hub.setAttribute("opacity",0);P.deps.forEach(o=>{edDraw(o.spoke,0);o.copy.setAttribute("opacity",1);o.copy.setAttribute("transform",`translate(${o.c0[0]} ${o.c0[1]})`);o.tick.setAttribute("opacity",0);o.box.setAttribute("stroke","var(--n300)")});
    P.hl&&P.hl.setAttribute("width",0);P.pk.setAttribute("opacity",0);P.out.forEach(c=>c.setAttribute("opacity",0));P.v=6;P.ver.textContent="version 6"},
  fin(P){P.cap.textContent="NOW · ONE CENTRAL COPY";P.hub.setAttribute("opacity",1);P.deps.forEach(o=>{edDraw(o.spoke,1);o.copy.setAttribute("opacity",0)});P.hl&&P.hl.setAttribute("width",P.hl.dataset.w)},
  async update(P,{tw,sleep,alive},i){const o=P.deps[i],[hx,hy]=[...this.L[innerWidth<700?"port":"land"].hub];o.box.setAttribute("stroke","var(--dv-orange-500)");
    P.pk.setAttribute("opacity",1);await tw(700,t=>{P.pk.setAttribute("cx",edLerp(o.x,hx,t));P.pk.setAttribute("cy",edLerp(o.y,hy,t))});if(!alive())return;P.pk.setAttribute("opacity",0);o.box.setAttribute("stroke","var(--n300)");
    P.v++;P.ver.textContent="version "+P.v;await tw(420,t=>{P.ring.setAttribute("r",56+t*26);P.ring.setAttribute("opacity",1-t)});if(!alive())return;
    P.out.forEach(c=>c.setAttribute("opacity",1));await tw(700,t=>P.deps.forEach((d,j)=>{P.out[j].setAttribute("cx",edLerp(hx,d.x,t));P.out[j].setAttribute("cy",edLerp(hy,d.y,t))}));if(!alive())return;
    P.out.forEach(c=>c.setAttribute("opacity",0));P.deps.forEach(d=>d.tick.setAttribute("opacity",1));await sleep(900);P.deps.forEach(d=>d.tick.setAttribute("opacity",0))},
  async play(P,ctx){const{tw,sleep,alive}=ctx,[hx,hy]=this.L[innerWidth<700?"port":"land"].hub;
    await sleep(2600);if(!alive())return;P.cap.textContent="NOW · ONE CENTRAL COPY";
    P.hub.setAttribute("opacity",0);await tw(900,t=>{P.deps.forEach(o=>{o.copy.setAttribute("transform",`translate(${edLerp(o.c0[0],hx,t)} ${edLerp(o.c0[1],hy,t)}) scale(${1-t*.6})`);o.copy.setAttribute("opacity",1-t)});P.hub.setAttribute("opacity",t)});if(!alive())return;
    await tw(700,t=>P.deps.forEach(o=>edDraw(o.spoke,t)));if(!alive())return;
    await this.update(P,ctx,1);if(!alive())return;
    if(P.hl){const w=+P.hl.dataset.w;await tw(650,t=>P.hl.setAttribute("width",w*t))}},
  async idle(P,ctx){const order=[3,5,0,6,2,7,4,1];let k=0;while(ctx.alive()){await ctx.sleep(2600);if(!ctx.alive())return;await this.update(P,ctx,order[k++%order.length])}}});

/* ============================================================ v16 · GEODATABASE, steps 1 and 2 (desktop)
     #gdbrec    Every place carries its facts   map ⇄ attribute table, one feature selected at a time
     #gdbrules  Rules at the door               records pass three checks; good ones stored, bad ones sent back */

INIT.gdbrec=()=>edFig("gdbrec",{
  L:{land:{vb:[1280,720],map:[56,40,.98],tab:[640,96],txt:[640,520],ts:26,fs:18.5,lh:28},port:{vb:[1280,720],map:[56,40,.98],tab:[640,96],txt:[640,520],ts:26,fs:18.5,lh:28}},
  ROWS:[["Mana","Raipur"],["Saddu","Raipur"],["Kachna","Raipur"],["Tendua","Raipur"],["Amaseoni","Raipur"],["Labhandi","Raipur"]],
  build(S,m){const ST=G.stack,P={rows:[]};const[mx,my,mk]=m.map;
    const defs=el("defs",{},S);defs.innerHTML='<filter id="grSoft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="7"/></filter>';
    const mg=el("g",{transform:`translate(${mx} ${my}) scale(${mk})`},S);P.mg=mg;
    el("path",{d:G.state,fill:"rgba(60,50,40,.12)",transform:"translate(4 7)",filter:"url(#grSoft)"},mg);el("path",{d:G.state,fill:"#fbfaf8"},mg);
    G.districts.forEach(d=>el("path",{d:d.d,fill:"none",stroke:"#cfc8bd","stroke-width":1.1},mg));el("path",{d:G.state,fill:"none",stroke:"#8f887e","stroke-width":1.6},mg);
    ST.aw.forEach(q=>el("circle",{cx:q[0],cy:q[1],r:3.1,fill:"var(--dv-blue-500)",opacity:.55},mg));
    // six centres near Raipur become the rows
    const pin=ST.pin,near=[...ST.aw].sort((a,b)=>Math.hypot(a[0]-pin[0],a[1]-pin[1])-Math.hypot(b[0]-pin[0],b[1]-pin[1])).slice(0,6);
    const sel=el("g",{opacity:0},mg);P.ring=el("circle",{r:11,fill:"rgba(247,214,90,.35)",stroke:"var(--n950)","stroke-width":2},sel);P.dot=el("circle",{r:5,fill:"var(--dv-blue-700)",stroke:"#fff","stroke-width":2},sel);P.sel=sel;
    // callout lens around the Raipur area
    const lz=el("g",{},S),lx=mx+pin[0]*mk,ly=my+pin[1]*mk;el("circle",{cx:lx,cy:ly,r:46,fill:"none",stroke:"var(--n400)","stroke-width":1,"stroke-dasharray":"3 4"},lz);
    // the attribute table
    const[tx,ty]=m.tab,cols=[["ID",0],["Name",128],["Type",226],["District",340],["Lat, Long",440]],RW=36,TW=600;
    const tg=el("g",{},S);txt({x:tx,y:ty-34,class:"u",style:"font-weight:600;letter-spacing:.08em;fill:var(--n600)","font-size":12},tg,"LAYER · ANGANWADI_CENTRES · 260 RECORDS");
    el("rect",{x:tx,y:ty-22,width:TW,height:RW*7+4,rx:8,fill:"#fff",stroke:"var(--n200)"},tg);el("rect",{x:tx,y:ty-22,width:TW,height:RW,rx:8,fill:"var(--n100)"},tg);
    cols.forEach(([c,x])=>txt({x:tx+14+x,y:ty+1,class:"u","font-size":13,style:"font-weight:700;fill:var(--n700)"},tg,c));
    near.forEach((q,i)=>{const y=ty+RW*(i+1),ll=xy2ll(q[0],q[1]),r={q,ll,i};r.bg=el("rect",{x:tx+1,y:y-22,width:TW-2,height:RW,fill:"transparent"},tg);
      el("line",{x1:tx,y1:y-22,x2:tx+TW,y2:y-22,stroke:"var(--n200)"},tg);
      const v=[`AWC-RPR-${String(412+i*17).padStart(5,"0")}`,this.ROWS[i][0],"Anganwadi",this.ROWS[i][1],`${ll[1].toFixed(4)}, ${ll[0].toFixed(4)}`];
      r.txt=v.map((s,j)=>txt({x:tx+14+cols[j][1],y:y+1,class:"u","font-size":13.5,style:`fill:var(--n800);${j===0||j===4?"font-family:ui-monospace,Menlo,monospace;font-size:12.5px":""}`},tg,s));P.rows.push(r)});
    // the link: row ⇄ point
    P.link=el("path",{d:"",fill:"none",stroke:"var(--n950)","stroke-width":1.4,"stroke-dasharray":"4 4"},S);P.m=m;P.TW=TW;
    const B=edBlock(el("g",{},S),m.txt[0],m.txt[1],{t:"Every place carries its facts",b:["Each centre is a point on the map and a row","in its table: name, code, type, district and",{hl:"exact location, kept together as one feature."}]},m);P.hl=B.hl;
    return P},
  pick(P,i){const r=P.rows[i],[mx,my,mk]=P.m.map,[tx,ty]=P.m.tab;P.rows.forEach(o=>{o.bg.setAttribute("fill",o===r?"rgba(247,214,90,.35)":"transparent");o.txt.forEach(t=>t.style.fontWeight=o===r?"700":"")});
    P.sel.setAttribute("opacity",1);[P.ring,P.dot].forEach(c=>{c.setAttribute("cx",r.q[0]);c.setAttribute("cy",r.q[1])});
    const a=[mx+r.q[0]*mk+12,my+r.q[1]*mk],b=[tx-4,ty+36*(i+1)-4];P.link.setAttribute("d",`M${a[0]},${a[1]} C${a[0]+120},${a[1]} ${b[0]-120},${b[1]} ${b[0]},${b[1]}`)},
  reset(P){P.sel.setAttribute("opacity",0);P.link.setAttribute("d","");P.rows.forEach(o=>{o.bg.setAttribute("fill","transparent");o.txt.forEach(t=>t.style.fontWeight="")});P.hl&&P.hl.setAttribute("width",0)},
  fin(P){this.pick(P,0);P.hl&&P.hl.setAttribute("width",P.hl.dataset.w)},
  async play(P,{tw,sleep,alive}){await sleep(500);for(let i=0;i<3;i++){this.pick(P,i);await tw(420,t=>P.ring.setAttribute("r",22-11*t));if(!alive())return;await sleep(900);if(!alive())return}
    if(P.hl){const w=+P.hl.dataset.w;await tw(650,t=>P.hl.setAttribute("width",w*t))}},
  async idle(P,{tw,sleep,alive}){let i=3;while(alive()){this.pick(P,i%6);await tw(420,t=>P.ring.setAttribute("r",22-11*t));await sleep(1700);i++}}});

INIT.gdbrules=()=>edFig("gdbrules",{
  L:{land:{vb:[1280,720],ts:26,fs:18.5,lh:28},port:{vb:[1280,720],ts:26,fs:18.5,lh:28}},
  CHECKS:[["Inside its boundary","each centre inside its own village"],["Clean geometry","no gaps, overlaps or crossed lines"],["No blank fields","every record has a code and a name"]],
  build(S,m){const P={};
    const defs=el("defs",{},S);defs.innerHTML='<clipPath id="ruClip"><rect x="0" y="0" width="1280" height="720"/></clipPath>';
    // the gate: three checks, stacked
    const gx=470,gy=150,gw=330,gh=300;el("rect",{x:gx,y:gy,width:gw,height:gh,rx:14,fill:"#fff",stroke:"var(--n300)","stroke-width":1.4},S);
    txt({x:gx+gw/2,y:gy-16,"text-anchor":"middle",class:"u",style:"font-weight:600;letter-spacing:.08em;fill:var(--n600)","font-size":12.5},S,"CHECKED BEFORE IT IS STORED");
    P.checks=this.CHECKS.map(([t,d],i)=>{const y=gy+30+i*90,g=el("g",{},S),o={};o.bx=el("rect",{x:gx+20,y,width:gw-40,height:70,rx:10,fill:"var(--n100)",stroke:"transparent","stroke-width":1.6},g);
      txt({x:gx+40,y:y+30,class:"u","font-size":16.5,style:"font-weight:700;fill:var(--n950)"},g,t);txt({x:gx+40,y:y+52,class:"u","font-size":13,style:"fill:var(--n600)"},g,d);
      o.mk=el("g",{opacity:0},g);o.ok=el("path",{d:`M${gx+gw-52},${y+35} l6,6 l11,-12`,fill:"none",stroke:"#2f7d4f","stroke-width":3,"stroke-linecap":"round","stroke-linejoin":"round"},o.mk);
      o.no=el("path",{d:`M${gx+gw-50},${y+27} l14,14 M${gx+gw-36},${y+27} l-14,14`,fill:"none",stroke:"#c0392b","stroke-width":3,"stroke-linecap":"round"},o.mk);return o});
    // the database, to the right
    const dx=1010,dy=220,db=el("g",{},S),dr={fill:"#fff",stroke:"var(--dv-blue-700)","stroke-width":2.4};
    el("path",Object.assign({d:`M${dx-70},${dy} v120 a70,22 0 0 0 140,0 v-120`},dr),db);[0,40,80].forEach(o=>el("path",{d:`M${dx-70},${dy+o} a70,22 0 0 0 140,0`,fill:"none",stroke:"var(--dv-blue-700)","stroke-width":2.4,opacity:o?.5:1},db));
    el("ellipse",Object.assign({cx:dx,cy:dy,rx:70,ry:22},dr),db);txt({x:dx,y:dy+180,"text-anchor":"middle",class:"u t","font-size":17},db,"Geodatabase");
    P.acc=txt({x:dx,y:dy+204,"text-anchor":"middle",class:"u","font-size":14.5,style:"fill:#2f7d4f;font-weight:600"},db,"0 accepted");
    // sent-back tray, below the gate
    const sx=gx+gw/2,sy=560;el("rect",{x:sx-130,y:sy-30,width:260,height:86,rx:12,fill:"#fdf3f1",stroke:"#e7b8ae","stroke-dasharray":"6 4"},S);
    txt({x:sx,y:sy-8,"text-anchor":"middle",class:"u","font-size":14,style:"font-weight:700;fill:#a2321f"},S,"Sent back to fix");P.why=txt({x:sx,y:sy+40,"text-anchor":"middle",class:"u","font-size":13,style:"fill:#a2321f"},S,"");
    P.rej=txt({x:sx,y:sy+14,"text-anchor":"middle",class:"u","font-size":13,style:"fill:var(--n700)"},S,"0 records");
    // incoming queue, to the left
    txt({x:150,y:gy-16,"text-anchor":"middle",class:"u",style:"font-weight:600;letter-spacing:.08em;fill:var(--n600)","font-size":12.5},S,"INCOMING");
    P.card=el("g",{},S);el("rect",{x:-62,y:-38,width:142,height:76,rx:9,fill:"#fff",stroke:"var(--n300)","stroke-width":1.4},P.card);
    P.cmap=el("g",{transform:"translate(-50 -26) scale(.08)"},P.card);el("path",{d:G.state,fill:"#fbfaf8",stroke:"var(--n500)","stroke-width":14},P.cmap);
    P.cid=txt({x:-6,y:-12,class:"u","font-size":11,style:"font-family:ui-monospace,Menlo,monospace;fill:var(--n800)"},P.card,"");P.cnm=txt({x:-6,y:6,class:"u","font-size":12.5,style:"font-weight:700;fill:var(--n950)"},P.card,"");
    P.ccd=txt({x:-6,y:24,class:"u","font-size":11,style:"fill:var(--n600)"},P.card,"");
    [0,1,2].forEach(i=>{const x=88-i*6,y=gy+40+i*80;el("rect",{x,y,width:124,height:76,rx:9,fill:"#fff",stroke:"var(--n200)"},S);[22,40,56].forEach((dy,j)=>el("rect",{x:x+14,y:y+dy,width:j?60:90,height:5,rx:2.5,fill:"var(--n200)"},S))});P.gx=gx;P.gw=gw;P.gy=gy;P.dx=dx;P.dy=dy;P.sx=sx;P.sy=sy;
    const B=edBlock(el("g",{},S),88,gy+330,{t:"Rules at the door",b:["Every record is checked on the way in,",{hl:"so mistakes never reach the map."}]},m);P.hl=B.hl;
    P.n={a:0,r:0};return P},
  RECS:[["AWC-RPR-00412","Mana","code 412",-1,""],["AWC-RPR-00429","Saddu","code 429",-1,""],["AWC-DRG-00118","Bhilai Ward 7","",2,"blank code"],["AWC-BSR-00233","Sirgitti","code 233",-1,""],["AWC-RPR-00451","Tendua","code 451",0,"outside its village"],["AWC-KRB-00077","Darri","code 77",-1,""],["AWC-RJN-00310","Chhuria","code 310",1,"line crosses itself"]],
  show(P,r){P.cid.textContent=r[0];P.cnm.textContent=r[1];P.ccd.textContent=r[2]?r[2]:"code —";P.ccd.style.fill=r[2]?"var(--n600)":"#c0392b"},
  async one(P,{tw,sleep,alive},r){const pos=(x,y,s=1)=>P.card.setAttribute("transform",`translate(${x} ${y}) scale(${s})`);this.show(P,r);P.checks.forEach(c=>{c.mk.setAttribute("opacity",0);c.bx.setAttribute("stroke","transparent")});
    const x0=150,y0=P.gy+118,xg=P.gx-84+230;P.card.setAttribute("opacity",1);await tw(600,t=>pos(edLerp(x0,xg-230,t),y0));if(!alive())return;
    for(let i=0;i<3;i++){const c=P.checks[i],bad=r[3]===i;c.bx.setAttribute("stroke",bad?"#c0392b":"#2f7d4f");c.ok.style.display=bad?"none":"";c.no.style.display=bad?"":"none";c.mk.setAttribute("opacity",1);await sleep(330);if(!alive())return;if(bad)break}
    if(r[3]<0){await tw(700,t=>pos(edLerp(xg-230,P.dx,t),edLerp(y0,P.dy+30,t)-Math.sin(t*Math.PI)*60,1-t*.6));P.card.setAttribute("opacity",0);P.n.a++;P.acc.textContent=P.n.a+" accepted"}
    else{await tw(700,t=>pos(edLerp(xg-230,P.sx,t),edLerp(y0,P.sy+8,t),1-t*.5));P.card.setAttribute("opacity",0);P.n.r++;P.rej.textContent=P.n.r+(P.n.r>1?" records":" record");P.why.textContent="last: "+r[4]}
    await sleep(250)},
  reset(P){P.n={a:0,r:0};P.acc.textContent="0 accepted";P.rej.textContent="0 records";P.why.textContent="";P.card.setAttribute("opacity",0);P.checks.forEach(c=>c.mk.setAttribute("opacity",0));P.hl&&P.hl.setAttribute("width",0)},
  fin(P){P.acc.textContent="47 accepted";P.rej.textContent="3 records";P.why.textContent="last: line crosses itself";P.hl&&P.hl.setAttribute("width",P.hl.dataset.w)},
  async play(P,ctx){for(let i=0;i<3;i++){await this.one(P,ctx,this.RECS[i]);if(!ctx.alive())return}
    if(P.hl){const w=+P.hl.dataset.w;await ctx.tw(650,t=>P.hl.setAttribute("width",w*t))}},
  async idle(P,ctx){let i=3;while(ctx.alive()){await this.one(P,ctx,this.RECS[i%this.RECS.length]);i++;await ctx.sleep(400)}}});
