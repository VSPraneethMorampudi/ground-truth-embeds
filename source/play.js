/* ============================================================ v7 · TRY IT
   v6 put a task on every step, which turned each figure into a quiz and competed with the story's
   own navigation. v7 keeps ONE optional task per figure, on the step where doing it teaches more
   than watching it:
     intake       step 2  drag the swapped pin back into the state's box
     conversion   step 2  snap the dangling fibre end onto its node
     projection   step 2  hunt for where UTM 44N measures worst
     cartography  step 4  zoom in until the centres appear
     provenance   step 1  guess the field most often left empty
     inuse        step 2  slide the buffer to 5 km
     update       step 2  drag the redrawn boundary
   Every other step plays as an animation. A task never blocks: the arrows and step list always move
   on, "Show me" does it for the reader, and autoplay waits, then shows it. */
const d2=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);

/* ---------- Intake ---------- */
{const I=SPEC.intake.steps,cg=G.worldPts.cg,ENV=[462.7,117.1,7.3,11.3];
 I[1].play={ask:"drag the pin back inside Chhattisgarh's box, or swap the numbers",ok:"Back inside 17.78–24.11° N, 80.25–84.40° E. It passes",
  setup(A,done,ui){const s=A.st,L=s.wL;const p=L.ill(s.wpin.p);A.pulse([p[0],p[1]-20],22);
   ui.btn("Swap lat/long",async()=>{await s.wpin.move(cg,700);done()});
   A.drag(s.wpin.g,{move:q=>{s.wpin.p=L.world([q[0],q[1]+14]);s.wpin.upd()},
    end:()=>{const q=s.wpin.p;if(q[0]>ENV[0]-5&&q[0]<ENV[0]+ENV[2]+5&&q[1]>ENV[1]-5&&q[1]<ENV[1]+ENV[3]+5)s.wpin.move(cg,250).then(()=>done());
     else ui.say("Still outside. Chhattisgarh is the orange patch in India",true)}})},
  solve:async A=>{await A.st.wpin.move(cg,800)}}}

/* ---------- Conversion ---------- */
{const I=SPEC.conversion.steps;
 const spur=(s,x,y)=>{s.spur.setAttribute("d",`M470,318 L410,296 L${x},${y}`);s.end.setAttribute("cx",x);s.end.setAttribute("cy",y)};
 // the step's own animation would snap the end for the reader; here it waits for them
 I[1].go=async A=>{const s=A.st;s.reset();s.dupB.style.opacity=0;A.op(s.map,0,250);await A.op(s.all,1,300);A.op([s.pts,s.pol],.35,300);await A.op(s.lin,1,300)};
 I[1].play={ask:"drag the loose red end onto the node it should reach",ok:"Snapped within tolerance: the route now connects",
  setup(A,done,ui){const s=A.st;s.end.setAttribute("r",9);A.pulse([346,268],20);
   A.drag(s.end,{move:p=>spur(s,p[0],p[1]),end:p=>{if(d2(p,[318,256])<24){spur(s,318,256);A.op(s.end,0,200);done()}else ui.say("Not yet: it has to land on the white node",true)}})},
  solve:async A=>{const s=A.st;const x0=+s.end.getAttribute("cx"),y0=+s.end.getAttribute("cy");await A.tw(700,t=>spur(s,lerp(x0,318,t),lerp(y0,256,t)));await A.op(s.end,0,200)}}}

/* ---------- Projection ---------- */
{const I=SPEC.projection.steps;
 const cellAt=(lo,la)=>{let b=null,bd=1e9;for(const c of G.cells){const d=Math.abs(c.lo-lo)+Math.abs(c.la-la);if(d<bd){bd=d;b=c}}return bd<.12?b:null};
 const probe=(A,read)=>{const s=A.st,L=s.L,g=el("g",{},A.notesG),dot=el("circle",{r:7,fill:"var(--n900)",stroke:"#fff","stroke-width":2,opacity:0},g),lab=txt({class:"u t","font-size":18,opacity:0},g,"");
  lab.style.paintOrder="stroke";lab.style.stroke="#fbfaf8";lab.style.strokeWidth="6px";
  const at=p=>{const w=L.world(p),[lo,la]=xy2ll(w[0],w[1]),c=cellAt(lo,la);if(!c)return;const q=A.P(p);dot.setAttribute("cx",q[0]);dot.setAttribute("cy",q[1]);dot.setAttribute("opacity",1);
   lab.textContent=read(c,lo,la);lab.setAttribute("x",q[0]<640?q[0]+14:q[0]-14);lab.setAttribute("text-anchor",q[0]<640?"start":"end");lab.setAttribute("y",q[1]-12);lab.setAttribute("opacity",1)};
  return{g,at}};
 const cm=v=>`${v>=0?"+":"−"}${Math.abs(v/10).toFixed(0)} cm per km`;
 const read=c=>`a km reads ${cm(c.u44)}`;
 I[1].play={ask:"tap around the state to find where UTM 44N measures worst",ok:"Past 84° E, in zone 45N's ground. That's why state-wide work uses Lambert",
  setup(A,done,ui){const s=A.st,pr=probe(A,read);A.pulse(s.L.ill([424,130]),26);
   A.drag(s.sS,{start:p=>pr.at(p),move:p=>pr.at(p),end:p=>{pr.at(p);const w=s.L.world(p),[lo,la]=xy2ll(w[0],w[1]),c=cellAt(lo,la);
    if(c&&Math.abs(c.u44)>=700)done();else ui.say("Close to true here. Try further east, past the dashed line")}})},
  solve:async A=>{const s=A.st,pr=probe(A,read);pr.at(s.L.ill([200,300]));await A.wait(700);pr.at(s.L.ill([430,110]));await A.wait(900)}}}

/* ---------- Cartography: the reader zooms, once ---------- */
{const C=SPEC.cartography,I=C.steps;
 const lay=A=>{const s=A.st,w=s.L.v.w,set=(e,v)=>{if(!e)return;e.style.transition="opacity .25s";e.style.opacity=v?1:0};
  set(s.C.rail,w>40);set(s.C.roads,w>40);set(s.teh,w<=260);set(s.tl,w<=260&&w>6);set(s.vill,w<=24);set(s.road,w<=24);set(s.pts,w<=6);set(s.fib,w<=6);set(s.clut,0);set(s.clutV,0)};
 // start at village level; the reader takes it the last step down to the street
 I[3].go=async A=>{const s=A.st;await s.L.fly(s.V[2],900);lay(A)};
 I[3].notes.forEach(n=>delete n.to);
 I[3].play={ask:"zoom in until the Anganwadi centres appear: scroll on the map, or use +",ok:"Street level, 1:25,000. Only now do centres and GP nodes draw",
  setup(A,done,ui){const s=A.st,L=s.L;let v0=null;const tgt=[s.V[3].cx,s.V[3].cy];
   const check=()=>{lay(A);if(L.v.w<=5)done()};
   const zoomTo=(f,c)=>{const v=L.v,nw=clamp(v.w*f,2.2,640);const cx=c?lerp(v.cx,c[0],.6):v.cx,cy=c?lerp(v.cy,c[1],.6):v.cy;return L.fly({cx,cy,w:nw},350).then(check)};
   L.outer.addEventListener("wheel",e=>{e.preventDefault();e.stopPropagation();A.halt();const p=L.world(A.pt(e)),v=L.v,nw=clamp(v.w*Math.exp(e.deltaY*.0016),2.2,640),k=nw/v.w;
    L.set({cx:p[0]+(v.cx-p[0])*k,cy:p[1]+(v.cy-p[1])*k,w:nw});check()},{passive:false,signal:A.sig});
   A.drag(L.outer,{start:()=>{v0={...L.v}},move:(p,p0)=>{const k=v0.w/L.w;L.set({...v0,cx:v0.cx-(p[0]-p0[0])*k,cy:v0.cy-(p[1]-p0[1])*k});lay(A)},end:check});
   ui.btn("+",()=>zoomTo(.4,tgt),"sq").setAttribute("aria-label","Zoom in");ui.btn("−",()=>zoomTo(2.5),"sq").setAttribute("aria-label","Zoom out");
   A.pulse(L.ill(tgt),26)},
  solve:async A=>{const s=A.st;await s.L.fly(s.V[3],1000);lay(A)}}}

/* ---------- Provenance ---------- */
{const I=SPEC.provenance.steps;
 const mark=r=>{const b=r.getBBox();const hl=el("rect",{x:256,y:b.y-6,width:284,height:b.height+12,rx:6,fill:"rgba(247,214,90,.7)"},r);r.insertBefore(hl,r.firstChild)};
 I[0].play={ask:"tap the field most often left empty",ok:"Lineage. The next step shows why it matters",
  setup(A,done,ui){const s=A.st;s.rows.forEach((r,i)=>{const b=r.getBBox();el("rect",{x:256,y:b.y-6,width:284,height:b.height+12,fill:"transparent"},r);
   A.tap(r,()=>{if(i===7){mark(r);done()}else ui.say("That one is usually filled in. Try another",true)})})},
  solve:async A=>{mark(A.st.rows[7]);await A.wait(500)}}}

/* ---------- In use ---------- */
{const I=SPEC.inuse.steps;
 const polys=G.stack.mines.split("M").filter(Boolean).map(p=>p.replace(/Z/g,"").split("L").map(v=>v.split(",").map(Number)));
 const dseg=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)};
 const inside=(p,P)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c}return c};
 const dmin=G.stack.aw.map(p=>Math.min(...polys.map(P=>inside(p,P)?0:Math.min(...P.map((a,i)=>dseg(p,a,P[(i+1)%P.length]))))));
 const N5=dmin.filter(d=>d<=5*G.kmPx).length;
 const setKm=(A,km)=>{const s=A.st;s.buf.setAttribute("stroke-width",km*2*G.kmPx);s.aw.forEach((c,i)=>c._hit=dmin[i]<=km*G.kmPx)};
 I[1].play={ask:"slide the buffer to 5 km",ok:`At 5 km, ${N5} centres fall inside. Change the distance and the answer changes with it`,
  setup(A,done,ui){const s=A.st;let km=1;const r=document.createElement("input");r.type="range";r.min=1;r.max=15;r.step=1;r.value=km;r.className="prange";r.setAttribute("aria-label","Buffer distance in km");
   const v=document.createElement("span");v.className="pval";const set=()=>{km=+r.value;setKm(A,km);s.mark(true);v.textContent=`${km} km`;if(km===5&&r.dataset.moved)done()};
   r.addEventListener("input",()=>{r.dataset.moved=1;A.halt();set()});r.addEventListener("click",e=>e.stopPropagation());ui.acts.append(r,v);s.buf.style.opacity=1;set()},
  solve:async A=>{for(let k=1;k<=5;k++){setKm(A,k);A.st.mark(true);await A.wait(220)}}};
 // leave the buffer at 5 km for the steps after, whatever the reader did with the slider
 const g2=I[2].go,g3=I[3].go;I[2].go=async(A,f)=>{setKm(A,5);await g2(A,f)};I[3].go=async(A,f)=>{setKm(A,5);await g3(A,f)}}

/* ---------- Update cycle ---------- */
{const I=SPEC.update.steps;
 const edgeX=t=>lerp(282,176,t),tag=(s,t)=>{s.tag.textContent=edgeX(t)<236?"now counted in B":"counted in A"};
 I[1].go=async A=>{const s=A.st;s.setEdge(0);tag(s,0);await s.scene("bnd")};
 I[1].play={ask:"drag the boundary left, as Revenue redraws it",ok:"The centre snaps to the new boundary: it now counts in Village B",
  setup(A,done,ui){const s=A.st;let t=0;const set=v=>{t=v;s.setEdge(t);tag(s,t)};set(0);A.pulse([284,330],26);
   A.drag(s.bnd,{move:(p,p0)=>set(clamp((p0[0]-p[0])/110,0,1)),end:()=>{if(t>.8){A.tw(200,k=>set(lerp(t,1,k))).then(()=>done())}else ui.say("Keep going: move it past the centre",true)}})},
  solve:async A=>{const s=A.st;await A.tw(900,t=>{s.setEdge(t);tag(s,t)})}}}
