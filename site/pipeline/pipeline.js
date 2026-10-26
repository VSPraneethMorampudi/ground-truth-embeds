/* Scroll controller for the pipeline: scroll position → scene + overlay. */
import {STEPS,DEPTS,CONV,USES,APPS} from "./steps.js";
import {FILES,FMTS,drawFile} from "./files.js";
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
      <a class="btn ghost" href="play.html">${L2(T("Play the hands-on game","खेलकर देखें"))}</a></div>`}
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
addEventListener("gt-open-file",e=>openFile(e.detail.i));
$("#plSide").addEventListener("click",e=>{const c=e.target.closest("[data-file]");if(c)openFile(+c.dataset.file)});

ScrollTrigger.create({trigger:sec,start:"top top",end:"bottom bottom",onUpdate:st=>update(st.progress),onRefresh:st=>update(st.progress)});
update(0);
rail.forEach(li=>li.addEventListener("click",()=>{const i=+li.dataset.i,top=sec.getBoundingClientRect().top+scrollY,len=sec.offsetHeight-innerHeight;
  window.GT_GOTO?window.GT_GOTO(top+(i+.55)/N*len):scrollTo({top:top+(i+.55)/N*len,behavior:"smooth"})}));
addEventListener("gt-lang",()=>{const i=cur;cur=-1;$("#plSide").dataset.key="";update(Math.min(1,(i+.5)/N))});

/* ---------- the 3D scene loads when the reader gets close ---------- */
new IntersectionObserver(async es=>{const e=es[0];
  if(e.isIntersecting&&!scene){const {PipelineScene}=await import("./scene.js");scene=new PipelineScene($("#pl3d"));window.GTPipe=scene;ScrollTrigger.refresh()}
  if(scene)scene.setVisible(e.isIntersecting)},{rootMargin:"600px"}).observe(sec);
