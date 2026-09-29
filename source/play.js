/* ============================================================ v6 · YOUR TURN
   Every sketch step ends with one thing for the reader to do: drag, tap, swap, zoom, slide or choose.
   A step is ticked in the step bar once solved; "show me" does it for them; autoplay waits, then shows. */
const d2=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);

/* ---------- Intake ---------- */
{const I=SPEC.intake.steps,cg=G.worldPts.cg,ENV=[462.7,117.1,7.3,11.3];
 I[0].play={ask:"tap our record on the map",ok:"That's AWC-RPR-00412, exactly where it should be. Now watch it go wrong four ways",
  setup(A,done){const s=A.st,p=s.sL.ill(s.P0);A.pulse([p[0],p[1]-20],20);A.tap(s.pin.g,()=>done())},solve:async A=>{await A.wait(300)}};
 I[1].play={ask:"drag the pin back inside Chhattisgarh's box, or swap the numbers",ok:"Back inside 17.78–24.11° N, 80.25–84.40° E. It passes",
  setup(A,done,ui){const s=A.st,L=s.wL;const p=L.ill(s.wpin.p);A.pulse([p[0],p[1]-20],22);
   ui.btn("swap lat/long",async()=>{await s.wpin.move(cg,700);done()});
   A.drag(s.wpin.g,{move:q=>{s.wpin.p=L.world([q[0],q[1]+14]);s.wpin.upd()},
    end:()=>{const q=s.wpin.p;if(q[0]>ENV[0]-5&&q[0]<ENV[0]+ENV[2]+5&&q[1]>ENV[1]-5&&q[1]<ENV[1]+ENV[3]+5)s.wpin.move(cg,250).then(()=>done());
     else ui.say("Still outside. Chhattisgarh is the orange patch in India",true)}})},
  solve:async A=>{await A.st.wpin.move(cg,800)}};
 I[2].play={ask:"accept this record, or send it back?",
  choices:[{label:"accept it",why:"At 0, 0 there is only ocean: the fields were blank and saved as zero. Try again"},
           {label:"send it back",right:true,ok:"Sent back to its department, with the reason: empty coordinates"}],
  solve:async A=>{await A.wait(200)}};
 I[3].play={ask:"add decimals until the circle shrinks to a single building",ok:"Six decimals: about 10 cm. Enough to send someone to the door",
  setup(A,done,ui){const s=A.st;let d=2;const v=document.createElement("span");v.className="pval";
   const set=()=>{v.textContent=`${d} decimal${d>1?"s":""}`;s.circ.setAttribute("r",G.precR*Math.pow(10,2-d));s.circ.style.opacity=d>=5?0:1;if(d>=6)done()};
   ui.btn("−",()=>{d=Math.max(1,d-1);set()},"sq");ui.acts.appendChild(v);ui.btn("+",()=>{d=Math.min(6,d+1);set()},"sq");set()},
  solve:async A=>{const s=A.st;await A.to(s.circ,{r:G.precR*.01},900);s.circ.style.opacity=0}};
 I[4].play={ask:"drag the red pin onto the blue one: two offices sent the same centre",ok:"Merged. One centre, one ID: AWC-RPR-00412",
  setup(A,done,ui){const s=A.st,L=s.sL;s.pin2.p=[s.P0[0]+.23,s.P0[1]+.12];s.pin2.upd();s.pin2.g.style.opacity=1;const p=L.ill(s.pin2.p);A.pulse([p[0],p[1]-20],20);
   A.drag(s.pin2.g,{move:q=>{s.pin2.p=L.world([q[0],q[1]+14]);s.pin2.upd()},
    end:()=>{if(d2(L.ill(s.pin2.p),L.ill(s.pin.p))<30)s.pin2.move(s.pin.p,200).then(()=>A.op(s.pin2.g,0,250)).then(()=>done());else ui.say("Closer: drop it right on the blue pin",true)}})},
  solve:async A=>{const s=A.st;await s.pin2.move(s.pin.p,700);await A.op(s.pin2.g,0,250)}}}

/* ---------- Conversion ---------- */
{const C=SPEC.conversion,I=C.steps,d0=C.draw;
 C.draw=A=>{d0(A);const s=A.st,k=[...s.map.children];s.rowSrc=[];s.rowLink=[];
  for(let i=0;i<3;i++){const[t,p1,p2,t2]=k.slice(i*4,i*4+4);const g=el("g",{},s.map);g.append(p1,p2,t2);s.rowSrc.push(t);s.rowLink.push(g)}};
 const base=async(A,show,dim)=>{const s=A.st;s.reset();A.op(s.map,0,250);await A.op(s.all,1,300);A.op(dim,.35,300);await A.op(show,1,300)};
 I[0].go=async A=>{const s=A.st;await base(A,s.pts,[s.lin,s.pol])};
 I[0].play={ask:"drag the second dot onto its twin",ok:"Kept once. The duplicate is gone",
  setup(A,done,ui){const s=A.st;s.dupB.setAttribute("r",11);A.pulse([262,130],22);
   A.drag(s.dupB,{move:p=>{s.dupB.setAttribute("cx",p[0]);s.dupB.setAttribute("cy",p[1])},
    end:p=>{if(d2(p,[245,120])<22)A.to(s.dupB,{cx:245,cy:120},150).then(()=>A.op(s.dupB,0,200)).then(()=>done());else ui.say("Drop it on its twin, just up and to the left",true)}})},
  solve:async A=>{const s=A.st;await A.to(s.dupB,{cx:245,cy:120},700);await A.op(s.dupB,0,200)}};
 const spur=(s,x,y)=>{s.spur.setAttribute("d",`M470,318 L410,296 L${x},${y}`);s.end.setAttribute("cx",x);s.end.setAttribute("cy",y)};
 I[1].go=async A=>{const s=A.st;s.dupB.style.opacity=0;await base(A,s.lin,[s.pts,s.pol]);s.dupB.style.opacity=0};
 I[1].play={ask:"drag the loose red end onto the node it should reach",ok:"Snapped within tolerance: the route now connects",
  setup(A,done,ui){const s=A.st;s.end.setAttribute("r",9);A.pulse([346,268],20);
   A.drag(s.end,{move:p=>spur(s,p[0],p[1]),end:p=>{if(d2(p,[318,256])<24){spur(s,318,256);A.op(s.end,0,200);done()}else ui.say("Not yet: it has to land on the white node",true)}})},
  solve:async A=>{const s=A.st;const x0=+s.end.getAttribute("cx"),y0=+s.end.getAttribute("cy");await A.tw(700,t=>spur(s,lerp(x0,318,t),lerp(y0,256,t)));await A.op(s.end,0,200)}};
 const leaseB=(s,t)=>{s.polB.setAttribute("d",`M${lerp(288,262,t)},${lerp(408,410,t)} L488,402 L494,512 L${lerp(300,272,t)},${lerp(516,518,t)}Z`);s.slv.style.opacity=1-t;s.tB=t};
 I[2].go=async A=>{const s=A.st;s.dupB.style.opacity=0;await base(A,s.pol,[s.pts,s.lin]);s.dupB.style.opacity=0};
 I[2].play={ask:"push Lease B left until the red gap closes",ok:"Closed. No land lost, none counted twice",
  setup(A,done,ui){const s=A.st;s.pol.querySelectorAll("text").forEach(t=>t.style.pointerEvents="none");leaseB(s,0);A.pulse([392,462],30);
   A.drag(s.polB,{move:(p,p0)=>leaseB(s,clamp((p0[0]-p[0])/26,0,1)),end:()=>{if(s.tB>.65)A.tw(200,k=>leaseB(s,lerp(s.tB,1,k))).then(()=>done());else{A.tw(200,k=>leaseB(s,lerp(s.tB,0,k)));ui.say("A little further: the edge has to meet Lease A",true)}}})},
  solve:async A=>{const s=A.st;await A.tw(800,t=>leaseB(s,t))}};
 I[3].go=async A=>{const s=A.st;await A.op(s.all,.08,400);s.rowLink.forEach(g=>g.style.opacity=0);await A.op(s.map,1,400)};
 I[3].play={ask:"tap each way of writing it to map it onto the state schema",ok:"Three spellings, one schema. Every department now reads alike",
  setup(A,done){const s=A.st;let n=0;const b=s.rowSrc[0].getBBox();A.pulse([b.x+b.width/2,b.y+b.height/2],34);
   s.rowSrc.forEach((t,i)=>A.tap(t,()=>{if(s.rowLink[i].dataset.on)return;s.rowLink[i].dataset.on=1;A.op(s.rowLink[i],1,300);if(++n===3)done()}))},
  solve:async A=>{for(const g of A.st.rowLink){await A.op(g,1,350)}}}}

/* ---------- Projection ---------- */
{const I=SPEC.projection.steps;
 const cellAt=(lo,la)=>{let b=null,bd=1e9;for(const c of G.cells){const d=Math.abs(c.lo-lo)+Math.abs(c.la-la);if(d<bd){bd=d;b=c}}return bd<.12?b:null};
 const probe=(A,ui,read)=>{const s=A.st,L=s.L,g=el("g",{},A.notesG),dot=el("circle",{r:7,fill:"var(--n900)",stroke:"#fff","stroke-width":2,opacity:0},g),lab=txt({class:"h t","font-size":26,opacity:0},g,"");
  lab.style.paintOrder="stroke";lab.style.stroke="#fbfaf8";lab.style.strokeWidth="6px";
  const at=p=>{const w=L.world(p),[lo,la]=xy2ll(w[0],w[1]),c=cellAt(lo,la);if(!c)return;const q=A.P(p);dot.setAttribute("cx",q[0]);dot.setAttribute("cy",q[1]);dot.setAttribute("opacity",1);
   const t=read(c,lo,la);lab.textContent=t;lab.setAttribute("x",q[0]<640?q[0]+14:q[0]-14);lab.setAttribute("text-anchor",q[0]<640?"start":"end");lab.setAttribute("y",q[1]-12);lab.setAttribute("opacity",1)};
  return{g,at}};
 const cm=v=>`${v>=0?"+":"−"}${Math.abs(v/10).toFixed(0)} cm per km`;
 const measure=(A,done,ui,read,ok)=>{const s=A.st,pr=probe(A,ui,read);let n=0;
  A.drag(s.sS,{start:p=>{pr.at(p)},move:p=>pr.at(p),end:p=>{pr.at(p);n++;const r=ok(p,n);if(r===true)done();else if(typeof r==="string")ui.say(r)}});return pr};
 I[0].play={ask:"tap anywhere on the state: how long is one degree there?",ok:"And 111 km at the equator. A degree isn't a distance",
  setup(A,done,ui){const s=A.st;A.pulse(s.L.ill([200,300]),26);measure(A,done,ui,(c,lo,la)=>`1° of longitude ≈ ${(111.32*Math.cos(la*Math.PI/180)).toFixed(1)} km`,()=>true)},
  solve:async A=>{const s=A.st,pr=probe(A,null,(c,lo,la)=>`1° of longitude ≈ ${(111.32*Math.cos(la*Math.PI/180)).toFixed(1)} km`);pr.at(s.L.ill([200,300]));await A.wait(900)}};
 I[1].play={ask:"tap around the state: find where UTM 44N measures worst",ok:"Past 84° E, in zone 45N's ground. That's why state-wide work uses Lambert",
  setup(A,done,ui){const s=A.st;A.pulse(s.L.ill([424,130]),26);measure(A,done,ui,c=>`a km reads ${cm(c.u44)}`,p=>{const w=A.st.L.world(p),[lo,la]=xy2ll(w[0],w[1]),c=cellAt(lo,la);return c&&Math.abs(c.u44)>=700?true:"Close to true here. Try further east, past the dashed line"})},
  solve:async A=>{const s=A.st,pr=probe(A,null,c=>`a km reads ${cm(c.u44)}`);pr.at(s.L.ill([200,300]));await A.wait(700);pr.at(s.L.ill([430,110]));await A.wait(900)}};
 I[2].play={ask:"tap the same far-east spot again, now in Lambert",ok:"Within a metre per km everywhere, and no seam to split layers at",
  setup(A,done,ui){const s=A.st;A.pulse(s.L.ill([430,110]),26);measure(A,done,ui,c=>`a km reads ${cm(c.lcc)}  (UTM: ${cm(c.u44)})`,(p,n)=>n>=1)},
  solve:async A=>{const s=A.st,pr=probe(A,null,c=>`a km reads ${cm(c.lcc)}  (UTM: ${cm(c.u44)})`);pr.at(s.L.ill([430,110]));await A.wait(900)}};
 I[3].play={ask:"the layer lost its .prj file. Put it back",
  choices:[{label:"guess the system",why:"Guessing is how layers land in the ocean. Declare it instead"},
           {label:"put the .prj back",right:true,ok:"Coordinate system declared: the layer lands in Chhattisgarh",then:A=>A.st.wpin.move(G.worldPts.cg,900)}],
  solve:async A=>{await A.st.wpin.move(G.worldPts.cg,900)}}}

/* ---------- Cartography: the reader zooms ---------- */
{const C=SPEC.cartography,I=C.steps;
 const lay=A=>{const s=A.st,w=s.L.v.w,lim=!s.nolim,set=(e,v)=>{if(!e)return;e.style.transition="opacity .25s";e.style.opacity=v?1:0};
  set(s.C.rail,w>40||!lim);set(s.C.roads,w>40||!lim);set(s.teh,w<=260||!lim);set(s.tl,lim&&w<=260&&w>6);set(s.vill,lim&&w<=24);set(s.road,lim&&w<=24);
  set(s.pts,lim&&w<=6);set(s.fib,lim&&w<=6);set(s.clut,!lim);set(s.clutV,!lim)};
 const zoomable=(A,done,ui,goal,target)=>{const s=A.st,L=s.L;let v0=null;
  const check=()=>{lay(A);if(goal(L.v))done()};
  const zoomTo=(f,c)=>{const v=L.v,nw=clamp(v.w*f,2.2,640);const cx=c?lerp(v.cx,c[0],.6):v.cx,cy=c?lerp(v.cy,c[1],.6):v.cy;return L.fly({cx,cy,w:nw},350).then(check)};
  L.outer.addEventListener("wheel",e=>{e.preventDefault();e.stopPropagation();A.halt();const p=L.world(A.pt(e)),v=L.v,nw=clamp(v.w*Math.exp(e.deltaY*.0016),2.2,640),k=nw/v.w;
   L.set({cx:p[0]+(v.cx-p[0])*k,cy:p[1]+(v.cy-p[1])*k,w:nw});check()},{passive:false,signal:A.sig});
  A.drag(L.outer,{start:()=>{v0={...L.v}},move:(p,p0)=>{const k=v0.w/L.w;L.set({...v0,cx:v0.cx-(p[0]-p0[0])*k,cy:v0.cy-(p[1]-p0[1])*k});lay(A)},end:check});
  ui.btn("+",()=>zoomTo(.4,target&&target()),"sq");ui.btn("−",()=>zoomTo(2.5),"sq")};
  const zgo=A=>{const s=A.st;s.nolim=false;lay(A)};
 [[0,"drag the map to look around",A=>{const v=A.st.L.v;return Math.hypot(v.cx-258,v.cy-318)>18},"Districts, rivers and rail: all this scale can carry",0],
  [1,"zoom into a district: scroll on the map, or use +",v=>v.w<=100,"Tehsil boundaries switched on by themselves",1],
  [2,"keep going, to a village",v=>v.w<=18,"Village boundaries and village roads appear",2],
  [3,"closer still, to street level",v=>v.w<=5,"Centres and GP nodes: only at street level",3]].forEach(([i,ask,goal,ok,vi])=>{
  const g0=I[i].go;I[i].go=i===0?g0:async A=>{zgo(A)};I[i].notes.forEach(n=>{if(i>0)delete n.to});
  I[i].play={ask,ok,setup(A,done,ui){const s=A.st;zgo(A);zoomable(A,done,ui,i===0?()=>goal(A):goal,()=>[s.V[vi].cx,s.V[vi].cy]);A.pulse(s.L.ill([s.V[Math.max(1,vi)].cx,s.V[Math.max(1,vi)].cy]),26)},
   solve:async A=>{const s=A.st;await s.L.fly(i===0?{...s.V[0],cx:s.V[0].cx-30}:s.V[vi],1000);lay(A)}}});
 I[4].go=async A=>{const s=A.st;s.nolim=false;await s.L.fly(s.V[4],900);lay(A)};I[4].notes.forEach(n=>delete n.to);
 I[4].play={ask:"switch the scale limits off and see what the whole state would draw",ok:"Every village and asset at once: slow and unreadable. That's why each layer waits",
  choices:[{label:"scale limits: off",right:true,then:A=>{A.st.nolim=true;lay(A)}}],solve:async A=>{A.st.nolim=true;lay(A);await A.wait(600)}}}

/* ---------- Provenance ---------- */
{const I=SPEC.provenance.steps;
 I[0].play={ask:"tap the field most often left empty",ok:"Lineage. The next step shows why it matters",
  setup(A,done,ui){const s=A.st;s.rows.forEach((r,i)=>{const b=r.getBBox();const hit=el("rect",{x:256,y:b.y-6,width:284,height:b.height+12,fill:"transparent"},r);
   A.tap(r,()=>{if(i===7){const hl=el("rect",{x:256,y:b.y-6,width:284,height:b.height+12,rx:6,fill:"rgba(247,214,90,.7)"},r);r.insertBefore(hl,r.firstChild);done()}else ui.say("That one is usually filled in. Try another",true)})})},
  solve:async A=>{const r=A.st.rows[7],b=r.getBBox();const hl=el("rect",{x:256,y:b.y-6,width:284,height:b.height+12,rx:6,fill:"rgba(247,214,90,.7)"},r);r.insertBefore(hl,r.firstChild);await A.wait(500)}};
 I[1].play={ask:"tap each step of the record's history",ok:"Four steps, each with who and when. Two years on, that's an hour, not a meeting",
  setup(A,done){const s=A.st,cs=[...s.lin.querySelectorAll("circle")];let n=0;A.pulse([282,150],20);
   cs.forEach(c=>{c.setAttribute("fill","#fff");c.setAttribute("r",12);A.tap(c,()=>{if(c.dataset.on)return;c.dataset.on=1;c.setAttribute("fill","var(--green-500)");if(++n===cs.length)done()})})},
  solve:async A=>{for(const c of A.st.lin.querySelectorAll("circle")){c.setAttribute("fill","var(--green-500)");await A.wait(250)}}};
 I[2].play={ask:"which ring can anyone open?",
  choices:[{label:"Restricted",why:"No: restricted layers need sign-in and every look is logged"},{label:"Departmental",why:"No: only signed-in departments see those"},{label:"Public",right:true,ok:"Public. The other two ask for the state sign-on first"}]};
 I[3].play={ask:"someone can view a layer. Can they edit it too?",
  choices:[{label:"yes",why:"No: view, query, download and edit are four separate permissions"},{label:"no",right:true,ok:"Right. Seeing a layer never means changing it"}]}}

/* ---------- In use ---------- */
{const I=SPEC.inuse.steps;
 const polys=G.stack.mines.split("M").filter(Boolean).map(p=>p.replace(/Z/g,"").split("L").map(v=>v.split(",").map(Number)));
 const dseg=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)};
 const inside=(p,P)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c}return c};
 const dmin=G.stack.aw.map(p=>Math.min(...polys.map(P=>inside(p,P)?0:Math.min(...P.map((a,i)=>dseg(p,a,P[(i+1)%P.length]))))));
 const count=km=>dmin.filter(d=>d<=km*G.kmPx).length,N5=count(5);
 const setKm=(A,km)=>{const s=A.st;s.buf.setAttribute("stroke-width",km*2*G.kmPx);s.aw.forEach((c,i)=>c._hit=dmin[i]<=km*G.kmPx)};
 I[0].play={ask:"tap a mining lease",ok:"Orange: a lease. Blue: Anganwadi centres. Both on the same base",
  setup(A,done){const s=A.st,m=s.L.g.querySelector('path[fill="var(--dv-orange-500)"]');A.pulse(s.L.ill([300,190]),24);A.tap(m,()=>done())},solve:async A=>{await A.wait(300)}};
 I[1].play={ask:"slide the buffer to 5 km",ok:`At 5 km, ${N5} centres fall inside. Change the distance and the answer changes with it`,
  setup(A,done,ui){const s=A.st;let km=1;const r=document.createElement("input");r.type="range";r.min=1;r.max=15;r.step=1;r.value=km;r.className="prange";r.setAttribute("aria-label","Buffer distance in km");
   const v=document.createElement("span");v.className="pval";const set=()=>{km=+r.value;setKm(A,km);s.mark(true);v.textContent=`${km} km`;if(km===5&&r.dataset.moved)done()};
   r.addEventListener("input",()=>{r.dataset.moved=1;A.halt();set()});r.addEventListener("click",e=>e.stopPropagation());ui.acts.append(r,v);s.buf.style.opacity=1;set()},
  solve:async A=>{for(let k=1;k<=5;k++){setKm(A,k);A.st.mark(true);await A.wait(220)}}};
 I[2].go=async A=>{const s=A.st;setKm(A,5);await s.L.fly({cx:318,cy:178,w:150},400);A.op(s.buf,1,200);s.mark(false)};
 {const opts=[N5-3,N5,N5+6];I[2].play={ask:"how many centres fall inside the 5 km buffers?",
  choices:opts.map(n=>({label:String(n),right:n===N5,why:n<N5?"More than that: look along the lease edges":"Fewer than that: count only the ones inside the shading",ok:`${N5}. Picked out in seconds, from live services`,then:A=>A.st.mark(true)})),
  solve:async A=>{A.st.mark(true);await A.wait(400)}}}}

/* ---------- Update cycle ---------- */
{const I=SPEC.update.steps;
 I[0].play={ask:"which layer arrives only when something changes?",
  choices:[{label:"scheme progress",why:"That one comes every month (the blue dots)"},{label:"asset inventory",why:"That one comes every quarter (the diamonds)"},{label:"Revenue boundaries",right:true,ok:"Boundaries. Revenue sends them only when one changes"}]};
 const edgeX=t=>lerp(282,176,t);
 I[1].go=async A=>{const s=A.st;s.setEdge(0);s.tag.textContent="counted in A";await s.scene("bnd")};
 I[1].play={ask:"drag the boundary left, as Revenue redraws it",ok:"The centre snaps to the new boundary: it now counts in Village B",
  setup(A,done,ui){const s=A.st;let t=0;const set=v=>{t=v;s.setEdge(t);s.tag.textContent=edgeX(t)<236?"now counted in B":"counted in A"};set(0);A.pulse([284,330],26);
   A.drag(s.bnd,{move:(p,p0)=>set(clamp((p0[0]-p[0])/110,0,1)),end:()=>{if(t>.8){A.tw(200,k=>set(lerp(t,1,k))).then(()=>done())}else ui.say("Keep going: move it past the centre",true)}});s.setT=set},
  solve:async A=>{const s=A.st;await A.tw(900,t=>{s.setEdge(t);s.tag.textContent=edgeX(t)<236?"now counted in B":"counted in A"})}};
 I[2].go=async A=>{const s=A.st;s.st1.textContent="Functional";s.v1.textContent="3";s.hl.style.opacity=0;s.stamp.style.opacity=0;s.old.style.opacity=1;await s.scene("rec")};
 const revise=async A=>{const s=A.st;await A.op(s.hl,1,300);s.st1.textContent="Under repair";s.v1.textContent="4";await A.wait(300);await Promise.all([A.op(s.old,.45,400),A.op(s.stamp,1,400)])};
 I[2].play={ask:"a new status arrives for AWC-RPR-00412. What happens?",
  choices:[{label:"add a second row",why:"That would count the centre twice. Records match on their ID"},{label:"update the same row",right:true,ok:"Same row, version 4. And a closed centre is flagged, never deleted",then:revise}],
  solve:revise}}
