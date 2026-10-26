/* Scroll controller for the pipeline: scroll position → scene + overlay. */
import {STEPS,DEPTS,CONV,USES,APPS} from "./steps.js?v=202610260830";
import {FILES,FMTS,drawFile} from "./files.js?v=202610260830";
import {mailDraw,gisDraw} from "./screens.js?v=202610260830";
import {buildApps} from "./apps.js?v=202610260830";
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const L2=o=>o?`<span lang="en">${o.en}</span><span lang="hi">${o.hi}</span>`:"";
const T=(en,hi)=>({en,hi});
const esc=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;");
const REDUCE=matchMedia("(prefers-reduced-motion:reduce)").matches;
const N=STEPS.length,TOUCH=matchMedia("(pointer:coarse)").matches;
const filesOf=k=>FILES.filter(F=>F.d===k);

const sec=$("#pipeline");
sec.style.setProperty("--steps",N);
sec.innerHTML=`<div class="pl-stage">
  <div class="pl-3d" id="pl3d"></div>
  <div class="pl-cap" id="plCap"></div>
  <aside class="pl-side" id="plSide" aria-live="polite"></aside>
  <ol class="pl-rail" id="plRail">${STEPS.map((s,i)=>`<li data-i="${i}"><i></i><span>${L2(s.k)}</span></li>`).join("")}</ol>
  <div class="pl-bar"><i id="plBar"></i></div>
  <div class="pl-cue"><i></i>${L2(T("Scroll","स्क्रॉल करें"))}</div>
  <div class="pl-live" id="plLive"><iframe id="plPortal" title="Chhattisgarh State Geoportal (live)" width="1400" height="780" loading="lazy"></iframe></div>
  <aside class="pl-ex" id="plEx" aria-live="polite"></aside>
  <nav class="pl-dock" id="plDock" aria-label="Explore"><span>${L2(T("Explore","एक्सप्लोर"))}</span>${[["depts","buildings",T("Departments","विभाग")],["lab","paper-plane-tilt",T("CHiPS lab","चिप्स लैब")],["dc","hard-drives",T("Data centre","डेटा केंद्र")],["map","map-trifold",T("Map","नक्शा")],["portal","globe-hemisphere-east",T("Geoportal","जियोपोर्टल")]].map(([id,i,t])=>`<button data-ex="${id}">${window.icon?window.icon(i):""}<b>${L2(t)}</b></button>`).join("")}<button class="ex-close" data-ex-close>✕ <b>${L2(T("Back to story","कहानी पर लौटें"))}</b></button></nav>
</div>`;

/* ---------- caption: bold headline, word by word ---------- */
const words=o=>o.split(" ").map(w=>`<span class="w"><span>${w}</span></span>`).join(" ");
function caption(i){const st=STEPS[i],c=$("#plCap");
  c.innerHTML=`<p class="pl-k">${L2(st.k)}</p><h2 class="pl-h"><span lang="en">${words(st.h.en)}</span><span lang="hi">${words(st.h.hi)}</span></h2>${st.b.en?`<p class="pl-b">${L2(st.b)}</p>`:""}`;
  if(REDUCE)return;
  gsap.fromTo($$(".pl-h .w>span",c),{yPercent:115,rotate:4},{yPercent:0,rotate:0,duration:.9,ease:"expo.out",stagger:.04});
  gsap.fromTo([$(".pl-k",c),$(".pl-b",c)].filter(Boolean),{y:24,opacity:0},{y:0,opacity:1,duration:.8,ease:"power3.out",stagger:.12,delay:.1})}

/* ---------- side panel per step ---------- */
const PORTAL_URL=(window.GT&&window.GT.PORTAL_URL)||"#";
function side(i,f){const st=STEPS[i],p=$("#plSide");let key=st.id,html="";
  if(st.depts==="all"){/* the whole campus: every department and the formats it sends */
    html=`<div class="dl"><div class="dl-n"><span><b>${DEPTS.length}</b>${L2(T("departments","विभाग"))}</span><span><b>${FILES.length}</b>${L2(T("files","फ़ाइलें"))}</span><span><b>${Object.keys(FMTS).length}</b>${L2(T("formats","प्रारूप"))}</span></div>
      <ul class="dl-list">${DEPTS.map((d,k)=>`<li style="--c:${d.col}"><b>${L2(d.short)}</b><span>${filesOf(k).map(F=>`<button class="fchip" data-file="${F.i}" style="--f:${FMTS[F.f].c}">${FMTS[F.f].n}</button>`).join("")}</span></li>`).join("")}</ul>
      <p class="dl-hint">${TOUCH?L2(T("Tap a file to open it.","फ़ाइल खोलने के लिए टैप करें।")):L2(T("Click a file, here or in 3D, to open it.","फ़ाइल खोलने के लिए यहाँ या 3D में क्लिक करें।"))}</p></div>`}
  else if(st.depts==="each"){const k=Math.min(7,Math.floor(f*8)),d=DEPTS[k];key+=":"+k;
    html=`<div class="de" style="--c:${d.col}"><small>${String(k+1).padStart(2,"0")} / 08</small><b>${L2(d.name)}</b>
      <ul class="de-files">${filesOf(k).map(F=>`<li><button data-file="${F.i}"><em style="--f:${FMTS[F.f].c}">${FMTS[F.f].n}</em><span><b>${F.name}</b><small>${L2(F.what)}</small></span><i class="${F.xy?"y":"n"}">${F.xy?L2(T("has XY","XY है")):L2(T("no XY","XY नहीं"))}</i></button></li>`).join("")}</ul>
      <div class="fmt-dots">${DEPTS.map((q,m)=>`<i class="${m===k?"on":""}" style="--c:${q.col}"></i>`).join("")}</div></div>`}
  else if(st.id==="collect"){html=`<div class="chips">${DEPTS.map((d,k)=>`<span class="chip ${f>k/9?"in":""}" style="--c:${d.col}"><b>${L2(d.short)}</b><small>${[...new Set(filesOf(k).map(F=>FMTS[F.f].n))].join(" · ")}</small></span>`).join("")}</div>
      <div class="flow-to"><span>${L2(T("by email, to the CHiPS GIS team","ईमेल से, चिप्स जीआईएस टीम को"))}</span><b>→</b></div>`;key+=":"+Math.floor(f*9)}
  else if(st.conv!==undefined){const c=CONV[st.conv],ph=f<.25?0:f<.5?1:f<.72?2:3;key+=":"+ph;
    html=`<div class="conv"><div class="cbox"><small>${L2(T("In","इनपुट"))} · ${L2(c.in.t)}</small><pre class="code">${esc(c.in.code)}</pre></div>
      ${c.steps.map((s,k)=>`<div class="cstep ${ph>k?"on":""}"><i>${k+1}</i>${L2(s)}</div>`).join("")}
      <div class="cbox out ${ph>=3?"on":""}"><small>${L2(T("Out","आउटपुट"))} · ${L2(c.out.t)}</small><pre class="code">${esc(c.out.code)}</pre></div></div>`}
  else if(st.qa){const R=[T("Inside Chhattisgarh","छत्तीसगढ़ के भीतर"),T("Inside its own district","अपने ज़िले के भीतर"),T("Valid geometry","सही ज्यामिति"),T("No blank codes","कोई खाली कोड नहीं")],n=Math.floor(f*5);key+=":"+n;
    html=`<ul class="qa">${R.map((r,k)=>`<li class="${k<n?(k===3?"bad":"ok"):""}"><i></i>${L2(r)}</li>`).join("")}</ul>
      ${n>=4?`<div class="reject"><b>GPS Kurud</b><span>${L2(T("UDISE code blank → back to Education","UDISE कोड खाली → शिक्षा विभाग को वापस"))}</span></div>`:""}`}
  else if(st.gdb){const L=[["Boundaries","33",T("districts","ज़िले")],["Forest","1",T("raster","रास्टर")],["Rivers","12",T("lines","रेखाएँ")],["Roads","59",T("lines","रेखाएँ")],["Rail","44",T("lines","रेखाएँ")],["Facilities","198",T("points","बिंदु")]],n=Math.ceil(f*6.5);key+=":"+n;
    html=`<ul class="layers">${L.map(([a,b,c],k)=>`<li class="${k<n?"in":""}"><b>${a}</b><em>${b}</em><small>${L2(c)}</small></li>`).join("")}</ul>
      <div class="stats"><span>${L2(T("Nightly backup","हर रात बैकअप"))}</span><span>${L2(T("Change history","बदलाव इतिहास"))}</span><span>${L2(T("Government servers","सरकारी सर्वर"))}</span></div>`}
  else if(st.id==="portal"){html=`<div class="feats">${[T("Switch layers","परतें बदलें"),T("Search a village","गाँव खोजें"),T("Measure","नापें"),T("Ask AI","AI से पूछें"),T("GIGW · WCAG","GIGW · WCAG")].map(x=>`<span>${L2(x)}</span>`).join("")}</div>
      <a class="btn" href="${PORTAL_URL}" target="_blank" rel="noopener">${L2(T("Open the Geoportal","जियोपोर्टल खोलें"))} ↗</a>`}
  else if(st.id==="apps"){const a=Math.min(2,Math.floor(f*3));key+=":"+a;html=`<div class="cards">${APPS.map((x,k)=>`<div class="card ${k===a?"on":""}"><b>${L2(x.t)}</b><span>${L2(x.b)}</span></div>`).join("")}</div>`}
  else if(st.uses){const a=Math.min(3,Math.floor(f*4));key+=":"+a;html=`<div class="cards uses">${USES.map((x,k)=>`<div class="card ${k===a?"on":""}" style="--c:${x.col}"><b>${L2(x.t)}</b><span>${L2(x.b)}</span></div>`).join("")}</div>
      <small class="note">${L2(T("Illustrative values on real district boundaries.","असली ज़िला सीमाओं पर उदाहरण मान।"))}</small>`}
  else if(st.id==="loop"){html=`<div class="end"><a class="btn" href="${PORTAL_URL}" target="_blank" rel="noopener">${L2(T("Open the Geoportal","जियोपोर्टल खोलें"))} ↗</a>
      <p class="ex-k">${L2(T("Now explore each block","अब हर हिस्से को खुद देखें"))}</p><div class="ex-q">${[["depts",T("Departments","विभाग")],["lab",T("CHiPS lab","चिप्स लैब")],["dc",T("Data centre","डेटा केंद्र")],["map",T("Map","नक्शा")],["portal",T("Geoportal","जियोपोर्टल")]].map(([id,t])=>`<button data-ex="${id}">${L2(t)}</button>`).join("")}</div></div>`}
  if(p.dataset.key===key)return;const first=p.dataset.key?.split(":")[0]!==key.split(":")[0];p.dataset.key=key;p.innerHTML=html;p.classList.toggle("empty",!html);
  if(!REDUCE&&html&&first)gsap.fromTo(p,{clipPath:"inset(0 0 100% 0 round 22px)",y:30},{clipPath:"inset(0 0 0% 0 round 22px)",y:0,duration:.8,ease:"expo.out"})}

/* ---------- scroll → s ---------- */
let scene=null,cur=-1;
const bar=$("#plBar"),rail=$$("#plRail li");
function update(p){const s=Math.min(N-.0001,Math.max(0,p*N)),i=Math.floor(s),f=s-i;
  if(scene)scene.s=s;bar.style.transform=`scaleX(${p})`;
  if(i!==cur){cur=i;caption(i);rail.forEach((li,k)=>{li.classList.toggle("on",k===i);li.classList.toggle("done",k<i)})}
  side(i,f);sec.classList.toggle("started",s>.15)}
/* ---------- the file viewer: open any department file ---------- */
const fv=document.createElement("div");fv.className="fv";fv.id="fv";fv.hidden=true;fv.setAttribute("role","dialog");fv.setAttribute("aria-modal","true");fv.setAttribute("aria-labelledby","fvT");
fv.innerHTML=`<div class="fv-back" data-close></div><div class="fv-win"><header class="fv-bar"><span class="fv-dots"><i></i><i></i><i></i></span><b id="fvT"></b><em id="fvE"></em>
  <button class="fv-x" data-close aria-label="Close">✕</button></header><div class="fv-body"><div class="fv-doc"><canvas id="fvC" width="1024" height="1320"></canvas></div><div class="fv-info" id="fvI"></div></div>
  <footer class="fv-foot"><button class="btn ghost" data-step="-1">← ${L2(T("Previous","पिछली"))}</button><span id="fvN"></span><button class="btn ghost" data-step="1">${L2(T("Next file","अगली फ़ाइल"))} →</button></footer></div>`;
document.body.appendChild(fv);
let fvI=-1,fvFrom=null;
function openFile(i){i=(i+FILES.length)%FILES.length;const F=FILES[i],d=DEPTS[F.d],fm=FMTS[F.f],first=fv.hidden;fvI=i;
  if(first){fvFrom=document.activeElement;fv.hidden=false;document.body.classList.add("fv-open");window.GT_MODAL&&window.GT_MODAL(true)}
  fv.style.setProperty("--f",fm.c);fv.style.setProperty("--c",d.col);
  $("#fvT").textContent=F.name;$("#fvE").textContent=F.ext;$("#fvN").textContent=`${i+1} / ${FILES.length}`;
  const cv=$("#fvC"),x=cv.getContext("2d");x.clearRect(0,0,cv.width,cv.height);drawFile(F,d,{head:false})(x,cv.width,cv.height);
  $("#fvI").innerHTML=`<p class="fv-dep"><i></i>${L2(d.name)}</p><p class="fv-fmt"><em>${fm.n}</em><span class="${F.xy?"y":"n"}">${F.xy?L2(T("Has coordinates","निर्देशांक हैं")):L2(T("No coordinates","निर्देशांक नहीं"))}</span></p>
    <h3>${L2(F.what)}</h3><small>${L2(T("Inside the file","फ़ाइल के अंदर"))}</small><pre class="code">${esc(F.raw)}</pre>
    <div class="fv-todo"><small>${L2(T("What the CHiPS GIS team does","चिप्स जीआईएस टीम क्या करती है"))}</small><b>${L2(F.todo)}</b></div>
    <small>${L2(T("Also from this department","इसी विभाग से"))}</small><div class="fv-more">${filesOf(F.d).filter(G=>G!==F).map(G=>`<button class="fchip" data-file="${G.i}" style="--f:${FMTS[G.f].c}">${FMTS[G.f].n}</button>`).join("")}</div>`;
  if(!REDUCE)first?gsap.fromTo(".fv-win",{y:40,scale:.96,opacity:0},{y:0,scale:1,opacity:1,duration:.6,ease:"expo.out"}):gsap.fromTo(".fv-body",{opacity:.2,x:12},{opacity:1,x:0,duration:.35,ease:"power2.out"});
  if(first)$(".fv-x").focus()}
function closeFile(){if(fv.hidden)return;fv.hidden=true;document.body.classList.remove("fv-open");window.GT_MODAL&&window.GT_MODAL(false);fvFrom&&fvFrom.focus&&fvFrom.focus({preventScroll:true})}
fv.addEventListener("click",e=>{if(e.target.closest("[data-close]"))return closeFile();const b=e.target.closest("[data-step]");if(b)return openFile(fvI+ +b.dataset.step);
  const c=e.target.closest("[data-file]");if(c)openFile(+c.dataset.file)});
addEventListener("keydown",e=>{if(fv.hidden)return;if(e.key==="Escape"){e.preventDefault();closeFile()}else if(e.key==="ArrowRight")openFile(fvI+1);else if(e.key==="ArrowLeft")openFile(fvI-1);
  else if(e.key==="Tab"){const f=$$("button",fv),a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}});
$("#plSide").addEventListener("click",e=>{const c=e.target.closest("[data-file]");if(c)openFile(+c.dataset.file)});

/* ---------- Explore: every block is its own playground ---------- */
const BL=[{id:"depts",ic:"buildings",t:T("Departments","विभाग")},{id:"lab",ic:"paper-plane-tilt",t:T("CHiPS lab","चिप्स लैब")},
  {id:"dc",ic:"hard-drives",t:T("Data centre","डेटा केंद्र")},{id:"map",ic:"map-trifold",t:T("Map","नक्शा")},{id:"portal",ic:"globe-hemisphere-east",t:T("Geoportal","जियोपोर्टल")}];
const ROLES=[T("Map services","मैप सेवाएँ"),T("Geodatabase","भू-डेटाबेस"),T("Tile cache","टाइल कैश"),T("Web portal","वेब पोर्टल"),T("Processing","प्रोसेसिंग"),T("Backup store","बैकअप भंडार"),T("Monitoring","निगरानी"),T("Standby","स्टैंडबाय")];
const LAYERS=[["rivers",T("Rivers","नदियाँ"),"#1d6fd6"],["roads",T("Roads","सड़कें"),"#d2733c"],["rail",T("Rail","रेल"),"#3a383d"],["forest",T("Forest","वन"),"#3e8a4f"],["fac",T("Facilities","सुविधाएँ"),"#6b4fd6"]];
const APPS3=[T("Field app","फ़ील्ड ऐप"),T("Dashboard","डैशबोर्ड"),T("Department GIS","विभागीय GIS")];
const ic=n=>window.icon?window.icon(n):"";
let EX=null,labRaf=0,bkRaf=0;
const exEl=$("#plEx"),dock=$("#plDock");
function exOpen(id){if(!scene)return;if(id==="portal")setTimeout(liveStart,0);if(!fv.hidden)closeFile();cancelAnimationFrame(labRaf);cancelAnimationFrame(bkRaf);
  if(!EX){window.GT_MODAL&&window.GT_MODAL(true);sec.classList.add("exploring")}
  EX={id};scene.explore(id);exRender(true)}
function exClose(){if(!EX)return;cancelAnimationFrame(labRaf);cancelAnimationFrame(bkRaf);EX=null;scene&&scene.exit();sec.classList.remove("exploring");window.GT_MODAL&&window.GT_MODAL(false);
  $$("button",dock).forEach(b=>b.classList.remove("on"));cur=-1;$("#plSide").dataset.key="";ScrollTrigger.refresh()}
function exSet(o,anim){Object.assign(EX,o);scene.exSet(o);exRender(anim)}
function exRender(anim){const id=EX.id,b=BL.find(x=>x.id===id),k=BL.indexOf(b);$$("button[data-ex]",dock).forEach(x=>x.classList.toggle("on",x.dataset.ex===id));
  let body="";
  if(id==="depts"){if(EX.dept==null)body=`<p class="ex-hint">${L2(T("Pick a building. Click a file to open it.","कोई इमारत चुनें। फ़ाइल खोलने के लिए क्लिक करें।"))}</p>
      <div class="ex-grid">${DEPTS.map((d,q)=>`<button data-dept="${q}" style="--c:${d.col}"><b>${L2(d.short)}</b><small>${filesOf(q).length} ${L2(T("files","फ़ाइलें"))}</small></button>`).join("")}</div>`;
    else{const d=DEPTS[EX.dept];body=`<button class="ex-back" data-dept="">‹ ${L2(T("All departments","सभी विभाग"))}</button><div class="de" style="--c:${d.col}"><b>${L2(d.name)}</b>
      <ul class="de-files">${filesOf(EX.dept).map(F=>`<li><button data-file="${F.i}"><em style="--f:${FMTS[F.f].c}">${FMTS[F.f].n}</em><span><b>${F.name}</b><small>${L2(F.what)}</small></span><i class="${F.xy?"y":"n"}">${F.xy?L2(T("has XY","XY है")):L2(T("no XY","XY नहीं"))}</i></button></li>`).join("")}</ul></div>`}}
  else if(id==="lab"){if(EX.desk==null)body=`<p class="ex-hint">${L2(T("Every department file arrives here by email. Pick a mail, or click a desk.","हर विभागीय फ़ाइल ईमेल से यहाँ आती है। कोई मेल चुनें, या डेस्क पर क्लिक करें।"))}</p>
      <ul class="ex-mail">${FILES.map(F=>`<li><button data-mail="${F.i}" style="--c:${DEPTS[F.d].col}"><b>${L2(DEPTS[F.d].short)}</b><span>${F.name}</span><em style="--f:${FMTS[F.f].c}">${FMTS[F.f].n}</em></button></li>`).join("")}</ul>`;
    else{const F=FILES[EX.file],d=DEPTS[F.d],mine=FILES.filter(G=>G.i%6===EX.desk);body=`<button class="ex-back" data-mail="">‹ ${L2(T("Team inbox","टीम इनबॉक्स"))}</button>
      <p class="ex-k">${L2(T(`Desk ${EX.desk+1}`,`डेस्क ${EX.desk+1}`))} · ${L2(d.short)}</p><canvas class="ex-scr" id="exMail" width="1024" height="640"></canvas><canvas class="ex-scr" id="exGis" width="1024" height="640"></canvas>
      <div class="ex-row"><button class="btn" data-run>▶ ${L2(T("Process this file","इस फ़ाइल को प्रोसेस करें"))}</button><button class="btn ghost" data-file="${F.i}">${L2(T("Open file","फ़ाइल खोलें"))}</button></div>
      <div class="ex-tabs">${mine.map(G=>`<button data-mail="${G.i}" class="${G===F?"on":""}" style="--f:${FMTS[G.f].c}">${FMTS[G.f].n}</button>`).join("")}</div>`}}
  else if(id==="dc"){if(EX.rack==null)body=`<p class="ex-hint">${L2(T("Click a rack to open it.","रैक खोलने के लिए क्लिक करें।"))}</p>
      <div class="ex-grid racks">${scene.racks.map((q,r)=>`<button data-rack="${r}"><b>${q.name}</b><small>${L2(ROLES[r])}</small></button>`).join("")}</div>
      <div class="ex-bk"><button class="btn" data-backup>${ic("cloud-check")} ${L2(T("Run nightly backup","रात का बैकअप चलाएँ"))}</button><div class="ex-bar"><i id="exBk"></i></div><small id="exBkT">${L2(T("Last backup 02:00 · OK","पिछला बैकअप 02:00 · ठीक"))}</small></div>`;
    else{const q=scene.racks[EX.rack];body=`<button class="ex-back" data-rack="">‹ ${L2(T("All racks","सभी रैक"))}</button><p class="ex-k">${L2(T("Rack","रैक"))} ${q.name} · ${L2(ROLES[EX.rack])}</p>
      <ul class="ex-units">${[0,1,2,3,4,5].map(u=>{const load=20+((EX.rack*37+u*53)%70);return`<li><b>srv-${q.name.toLowerCase()}-${String(u+1).padStart(2,"0")}</b><span class="ok">● OK</span><i><s style="width:${load}%"></s></i><small>${load}%</small></li>`}).join("")}</ul>
      <small class="note">${L2(T("Illustrative loads.","उदाहरण मान।"))}</small>`}}
  else if(id==="map"){const off=EX.off||{},di=EX.dist!=null?scene.distInfo(EX.dist):null;
    body=`<p class="ex-hint">${L2(T("Switch layers, ask a question, tap a district.","परतें बदलें, सवाल पूछें, ज़िले पर टैप करें।"))}</p>
      <div class="ex-sw">${LAYERS.map(([k,t,c])=>`<label style="--c:${c}"><input type="checkbox" data-layer="${k}" ${off[k]?"":"checked"}><i></i>${L2(t)}</label>`).join("")}</div>
      <p class="ex-k">${L2(T("Ask the map","नक्शे से पूछें"))}</p><div class="ex-q">${USES.map((u,q)=>`<button data-use="${q}" class="${EX.use===q?"on":""}" style="--c:${u.col}">${L2(u.t)}</button>`).join("")}</div>
      ${di?`<div class="ex-dist"><b>${di.name}</b><span><i style="--c:#2f6fd6"></i>${di.n[0]} ${L2(T(di.n[0]===1?"school":"schools","स्कूल"))}</span><span><i style="--c:#d2423a"></i>${di.n[1]} ${L2(T(di.n[1]===1?"health centre":"health centres","स्वास्थ्य केंद्र"))}</span><span><i style="--c:#e39a1f"></i>${di.n[2]} ${L2(T(di.n[2]===1?"anganwadi centre":"anganwadi centres","आंगनवाड़ी"))}</span><small>${L2(T("Sample points, illustrative.","नमूना बिंदु, उदाहरण।"))}</small></div>`:""}`}
  else{const names=scene.dist.map(d=>d.name).sort();
    body=`<p class="ex-hint">${L2(T("The real Geoportal is live on the screen: pan, click, explore. Or pick an app and use it.","असली जियोपोर्टल स्क्रीन पर चालू है: खिसकाएँ, क्लिक करें। या कोई ऐप चुनकर चलाएँ।"))}</p>
      <label class="ex-search">${ic("magnifying-glass")}<input id="exQ" list="exQL" placeholder="Raipur, Bastar, Korba…" autocomplete="off" value="${EX.hl||""}"><datalist id="exQL">${names.map(n=>`<option value="${n}">`).join("")}</datalist></label>
      <div class="ex-q">${APPS3.map((a,q)=>`<button data-dev="${q}" class="${EX.dev===q?"on":""}">${L2(a)}</button>`).join("")}${EX.dev!=null?`<button data-dev="">${L2(T("Portal screen","पोर्टल स्क्रीन"))}</button>`:""}</div>
      ${EX.dev!=null?`<p class="ex-txt">${L2(APPS[EX.dev].b)}</p>`:""}
      <a class="btn" href="${PORTAL_URL}" target="_blank" rel="noopener">${L2(T("Open the real Geoportal","असली जियोपोर्टल खोलें"))} ↗</a>`}
  exEl.innerHTML=`<header><span class="ex-ic">${ic(b.ic)}</span><div><small>${L2(T("Explore","एक्सप्लोर"))} · ${k+1}/5</small><h3>${L2(b.t)}</h3></div>
    <button class="ex-x" data-ex-close aria-label="Back to the story">✕</button></header><div class="ex-body">${body}</div>
    <footer><button data-ex="${BL[(k+4)%5].id}">‹ ${L2(BL[(k+4)%5].t)}</button><button data-ex="${BL[(k+1)%5].id}">${L2(BL[(k+1)%5].t)} ›</button></footer>`;
  if(id==="lab"&&EX.desk!=null)drawLab();
  if(anim&&!REDUCE)gsap.fromTo(exEl,{x:30,opacity:0},{x:0,opacity:1,duration:.55,ease:"expo.out"})}
function drawLab(){const F=FILES[EX.file],d=DEPTS[F.d],mine=FILES.filter(G=>G.i%6===EX.desk),p=EX.labP??1;
  [["#exMail",mailDraw(F,d,mine,DEPTS)],["#exGis",gisDraw(F,d,p)]].forEach(([s,dr])=>{const c=$(s);if(!c)return;const x=c.getContext("2d");x.setTransform(2,0,0,2,0,0);x.clearRect(0,0,512,320);dr(x,512,320)})}
function labRun(){cancelAnimationFrame(labRaf);const t0=performance.now();const go=now=>{const p=Math.min(1,(now-t0)/3800);EX.labP=p;scene.ex.labP=p;drawLab();if(p<1)labRaf=requestAnimationFrame(go)};labRaf=requestAnimationFrame(go)}
function backup(){cancelAnimationFrame(bkRaf);scene.exSet({backup:scene.t});const t0=performance.now();
  const go=now=>{const p=Math.min(1,(now-t0)/4000),b=$("#exBk"),tx=$("#exBkT");if(b)b.style.transform=`scaleX(${p})`;
    if(tx)tx.innerHTML=p<1?L2(T(`Backing up 33 layers… ${Math.round(p*100)}%`,`33 परतों का बैकअप… ${Math.round(p*100)}%`)):L2(T("Backup complete · 0 errors ✓","बैकअप पूरा · 0 त्रुटि ✓"));if(p<1)bkRaf=requestAnimationFrame(go)};bkRaf=requestAnimationFrame(go)}
function pickMail(i){const F=FILES[i];exSet({desk:i%6,file:i,labP:0},true);labRun()}
document.addEventListener("click",e=>{const t=e.target;if(t.closest("[data-play]")){exClose();return}
  if(!t.closest("#plEx,#plDock,.end"))return;let b;
  if(b=t.closest("[data-ex-close]"))return exClose();
  if(b=t.closest("[data-ex]"))return exOpen(b.dataset.ex);
  if(!EX)return;
  if(b=t.closest("[data-dept]"))return exSet({dept:b.dataset.dept===""?null:+b.dataset.dept},true);
  if(b=t.closest("[data-mail]"))return b.dataset.mail===""?exSet({desk:null,file:null},true):pickMail(+b.dataset.mail);
  if(b=t.closest("[data-run]"))return labRun();
  if(b=t.closest("[data-rack]"))return exSet({rack:b.dataset.rack===""?null:+b.dataset.rack},true);
  if(b=t.closest("[data-backup]"))return backup();
  if(b=t.closest("[data-use]")){const q=+b.dataset.use;return exSet({use:EX.use===q?null:q})}
  if(b=t.closest("[data-dev]"))return exSet({dev:b.dataset.dev===""?null:+b.dataset.dev})});
exEl.addEventListener("change",e=>{const c=e.target.closest("[data-layer]");if(c){const off={...(EX.off||{})};off[c.dataset.layer]=!c.checked;exSet({off})}});
exEl.addEventListener("input",e=>{if(e.target.id!=="exQ")return;const v=e.target.value.trim().toLowerCase(),k=scene.dist.findIndex(d=>d.name.toLowerCase()===v);
  if(k>=0){Object.assign(EX,{hl:scene.dist[k].name});scene.exSet({hl:scene.dist[k].name,dist:k})}});
/* live layer: in Explore → Geoportal the real Geoportal app and three working apps sit on the 3D screens,
   kept in place every frame with a perspective (matrix3d) transform from each screen's four projected corners */
const live=$("#plLive"),frame=$("#plPortal");let devs=null,liveOn=false;
function homog(w,h,q){const adj=m=>[m[4]*m[8]-m[5]*m[7],m[2]*m[7]-m[1]*m[8],m[1]*m[5]-m[2]*m[4],m[5]*m[6]-m[3]*m[8],m[0]*m[8]-m[2]*m[6],m[2]*m[3]-m[0]*m[5],m[3]*m[7]-m[4]*m[6],m[1]*m[6]-m[0]*m[7],m[0]*m[4]-m[1]*m[3]];
  const mm=(a,b)=>{const c=[];for(let i=0;i<3;i++)for(let j=0;j<3;j++){let t=0;for(let k=0;k<3;k++)t+=a[3*i+k]*b[3*k+j];c.push(t)}return c},mv=(m,v)=>[m[0]*v[0]+m[1]*v[1]+m[2]*v[2],m[3]*v[0]+m[4]*v[1]+m[5]*v[2],m[6]*v[0]+m[7]*v[1]+m[8]*v[2]];
  const basis=(p)=>{const m=[p[0],p[2],p[4],p[1],p[3],p[5],1,1,1],v=mv(adj(m),[p[6],p[7],1]);return mm(m,[v[0],0,0,0,v[1],0,0,0,v[2]])};
  const t=mm(basis(q),adj(basis([0,0,w,0,0,h,w,h])));for(let i=0;i<9;i++)t[i]/=t[8];
  return`matrix3d(${t[0]},${t[3]},0,${t[6]},${t[1]},${t[4]},0,${t[7]},0,0,1,0,${t[2]},${t[5]},0,${t[8]})`}
function liveStart(){if(!frame.src)frame.src=new URL("../versions/v18/portal.html#portal&bare",location.href).href;if(!devs)devs=buildApps(live);if(!liveOn){liveOn=true;requestAnimationFrame(liveTick)}}
function liveTick(){if(!EX||EX.id!=="portal"||!scene){live.classList.remove("on");liveOn=false;return}live.classList.add("on");
  [[frame,scene.portalScr,1400,780],[devs[0],scene.appScr[0],390,809],[devs[1],scene.appScr[1],1024,693],[devs[2],scene.appScr[2],1280,768]].forEach(([el,m,w,h])=>{
    const q=scene.quad(m);if(!q){el.style.visibility="hidden";return}el.style.visibility="visible";el.style.transform=homog(w,h,q)});
  requestAnimationFrame(liveTick)}

/* clicks in 3D: files open, block parts select, blocks enter explore */
addEventListener("gt-pick",e=>{const h=e.detail;if(h.type==="file")return openFile(h.i);if(h.type==="block")return exOpen(h.id);if(!EX)return;
  if(h.type==="dept")exSet({dept:h.i},true);else if(h.type==="desk"){const mine=FILES.filter(G=>G.i%6===h.i);pickMail(mine[mine.length-1].i)}
  else if(h.type==="rack")exSet({rack:h.i},true);else if(h.type==="dist")exSet({dist:EX.dist===h.i?null:h.i});else if(h.type==="device")exSet({dev:h.i})});
addEventListener("keydown",e=>{if(EX&&fv.hidden&&e.key==="Escape")exClose()});
$("#pl3d").addEventListener("wheel",()=>{if(EX&&fv.hidden)exClose()},{passive:true});

ScrollTrigger.create({trigger:sec,start:"top top",end:"bottom bottom",onUpdate:st=>update(st.progress),onRefresh:st=>update(st.progress)});
update(0);
rail.forEach(li=>li.addEventListener("click",()=>{const i=+li.dataset.i,top=sec.getBoundingClientRect().top+scrollY,len=sec.offsetHeight-innerHeight;
  window.GT_GOTO?window.GT_GOTO(top+(i+.55)/N*len):scrollTo({top:top+(i+.55)/N*len,behavior:"smooth"})}));
addEventListener("gt-lang",()=>{const i=cur;cur=-1;$("#plSide").dataset.key="";update(Math.min(1,(i+.5)/N))});

/* ---------- the 3D scene loads when the reader gets close ---------- */
new IntersectionObserver(async es=>{const e=es[0];
  if(e.isIntersecting&&!scene){const {PipelineScene}=await import("./scene.js?v=202610260830");scene=new PipelineScene($("#pl3d"));window.GTPipe=scene;ScrollTrigger.refresh()}
  if(scene)scene.setVisible(e.isIntersecting)},{rootMargin:"600px"}).observe(sec);
