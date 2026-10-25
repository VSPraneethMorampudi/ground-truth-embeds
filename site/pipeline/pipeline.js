/* Scroll controller for the pipeline: scroll position → scene + overlay. */
import {STEPS,DEPTS,CONV,USES,APPS} from "./steps.js";
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const L2=o=>o?`<span lang="en">${o.en}</span><span lang="hi">${o.hi}</span>`:"";
const T=(en,hi)=>({en,hi});
const esc=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;");
const REDUCE=matchMedia("(prefers-reduced-motion:reduce)").matches;
const N=STEPS.length;

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
  if(st.formats){const j=st.formats[Math.min(3,Math.floor(f*4))],d=DEPTS[j];key+=":"+j;
    html=`<div class="fmt" style="--c:${d.col}"><div class="fmt-h"><b>${L2(d.name)}</b><em>${d.fmt}</em><small>${d.ext}</small></div>
      <p class="fmt-w">${L2(d.what)}</p><pre class="code">${esc(d.snip)}</pre>
      <div class="fmt-dots">${st.formats.map(q=>`<i class="${q===j?"on":""}" style="--c:${DEPTS[q].col}"></i>`).join("")}</div></div>`}
  else if(st.id==="collect"){html=`<div class="chips">${DEPTS.map((d,k)=>`<span class="chip ${f>k/9?"in":""}" style="--c:${d.col}"><b>${d.fmt}</b><small>${L2(d.name)}</small></span>`).join("")}</div>
      <div class="flow-to"><span>${L2(T("into one intake","एक इनटेक में"))}</span><b>→</b></div>`;key+=":"+Math.floor(f*9)}
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
ScrollTrigger.create({trigger:sec,start:"top top",end:"bottom bottom",onUpdate:st=>update(st.progress),onRefresh:st=>update(st.progress)});
update(0);
rail.forEach(li=>li.addEventListener("click",()=>{const i=+li.dataset.i,top=sec.getBoundingClientRect().top+scrollY,len=sec.offsetHeight-innerHeight;
  window.GT_GOTO?window.GT_GOTO(top+(i+.55)/N*len):scrollTo({top:top+(i+.55)/N*len,behavior:"smooth"})}));
addEventListener("gt-lang",()=>{const i=cur;cur=-1;$("#plSide").dataset.key="";update(Math.min(1,(i+.5)/N))});

/* ---------- the 3D scene loads when the reader gets close ---------- */
new IntersectionObserver(async es=>{const e=es[0];
  if(e.isIntersecting&&!scene){const {PipelineScene}=await import("./scene.js");scene=new PipelineScene($("#pl3d"));window.GTPipe=scene;ScrollTrigger.refresh()}
  if(scene)scene.setVisible(e.isIntersecting)},{rootMargin:"600px"}).observe(sec);
