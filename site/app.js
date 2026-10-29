(()=>{
const G=window.GT,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const REDUCE=matchMedia("(prefers-reduced-motion:reduce)").matches,FINE=matchMedia("(pointer:fine)").matches;
const L2=o=>o?`<span lang="en">${o.en}</span><span lang="hi">${o.hi}</span>`:"";
const simple=o=>o?`<div class="simple"><b>${L2(G.ui.simple)}</b><span>${L2(o)}</span></div>`:"";
const pad=n=>String(n).padStart(2,"0");
const pageTop=el=>el.getBoundingClientRect().top+window.scrollY;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
gsap.registerPlugin(ScrollTrigger);

/* ---------- language ---------- */
function setLang(l){const h=document.documentElement;h.dataset.lang=l;h.lang=l;
  $$("[data-setlang]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.setlang===l));
  try{localStorage.setItem("gt-lang",l)}catch(e){}
  dispatchEvent(new Event("gt-lang"));requestAnimationFrame(()=>ScrollTrigger.refresh())}
document.addEventListener("click",e=>{const b=e.target.closest("[data-setlang]");if(b)setLang(b.dataset.setlang)});

/* ---------- orbit copy ---------- */
const C=G.cover;
$("#ocaps").innerHTML=G.orbit.map(o=>`<div class="ocap"><div class="k">${L2(o.k)}</div><p>${L2(o.t)}</p>${o.d?`<div class="odeck">${L2(o.d)}</div>`:""}</div>`).join("");
$("#oKick").innerHTML=L2(C.kicker);
$("#oTitle").innerHTML=`<span lang="en">Ground <i>Truth</i></span><span lang="hi">ज़मीनी <i>सच्चाई</i></span>`;
$("#oSub").innerHTML=L2(C.sub);
$("#oBegin").innerHTML=L2({en:"Follow the data",hi:"डेटा के साथ चलिए"})+" ↓";
$("#oBegin").setAttribute("href","#pipeline");
$("#oPlay").innerHTML=`▶ ${L2(G.ui.play)} · ${L2(G.ui.min3)}`;

/* ---------- outro ---------- */
$("#outro").innerHTML=`<canvas id="stars2" aria-hidden="true"></canvas><div class="wrap">
  <p class="label" style="color:var(--amber)">${L2({en:"Ground truth, every day",hi:"हर दिन, ज़मीनी सच्चाई"})}</p>
  <h2 class="gt"><span lang="en">Ground <i>Truth</i></span><span lang="hi">ज़मीनी <i>सच्चाई</i></span></h2>
  <div class="row">${simple(G.chapters.at(-1).steps.at(-1).s)}
   <div class="cta"><a class="btn" data-magnet href="${G.PORTAL_URL}" target="_blank" rel="noopener">${L2(G.ui.openPortal)} ↗</a>
   <button class="btn ghost" data-magnet data-play>▶ ${L2(G.ui.play)}</button></div></div>
  <div class="foot"><span>${L2(G.ui.credits)}</span><button id="toOrbit">↑ ${L2(G.ui.backOrbit)}</button></div></div>`;

/* ---------- smooth scroll ---------- */
/* One scroll clock. Keep touch native, and let the reader scroll inside panels. */
const lenis=new Lenis({lerp:REDUCE?1:.11,smoothWheel:!REDUCE,syncTouch:false,wheelMultiplier:1.05,
  prevent:el=>el.matches(".pl-side,.ex-body,.fv-body,.fv-info,.pl-dock")});
lenis.on("scroll",ScrollTrigger.update);
gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0);
const goTo=(t,o={})=>lenis.scrollTo(t,{offset:0,duration:1.4,easing:t=>1-Math.pow(1-t,4),...o,...(REDUCE?{immediate:true}:{})});

document.querySelectorAll("[data-orbit-stop]").forEach(b=>b.addEventListener("click",()=>{
  takeOver();const orbit=$("#orbit"),p=+b.dataset.orbitStop;
  goTo(pageTop(orbit)+p*(orbit.offsetHeight-innerHeight),{duration:1.8});
}));
document.addEventListener("click",e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const t=$(a.getAttribute("href"));if(!t)return;e.preventDefault();
  goTo(a.getAttribute("href")==="#orbit"?0:pageTop(t),{duration:a.getAttribute("href")==="#pipeline"?2.2:1.6})});
$("#toOrbit").onclick=()=>goTo(0,{duration:3.2});

window.GT_GOTO=y=>goTo(y,{duration:1.4});
/* a dialog (the file viewer) is open: pause auto-play and hold the page still */
/* (lenis.stop() would clip the page and break the sticky 3D stage, so scrolling is held by swallowing scroll input instead) */
let MODAL=false;window.GT_MODAL=v=>{MODAL=v;if(v){takeOver();lenis.stop();document.documentElement.classList.add("gt-modal")}else{lenis.start();document.documentElement.classList.remove("gt-modal")}};
const holdScroll=e=>{if(MODAL&&!(e.target.closest&&e.target.closest(".ex-body,.fv-body,.fv-info,.pl-dock")))e.preventDefault()};
addEventListener("wheel",holdScroll,{passive:false});addEventListener("touchmove",holdScroll,{passive:false});
addEventListener("keydown",e=>{if(MODAL&&[" ","PageDown","PageUp","ArrowDown","ArrowUp","Home","End"].includes(e.key)&&!/INPUT|TEXTAREA/.test(e.target.tagName))e.preventDefault()});

/* ---------- preloader → reveal ---------- */
const pre={v:0};
const fontsReady=Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,2500))]);
gsap.to(pre,{v:100,duration:REDUCE?.2:1.6,ease:"power2.inOut",onUpdate:()=>{$("#preN").textContent=pad(Math.round(pre.v));$("#preBar").style.transform=`scaleX(${pre.v/100})`},
  onComplete:()=>fontsReady.then(()=>{document.body.classList.remove("loading");
    gsap.to("#pre",{yPercent:-100,duration:REDUCE?.01:1.1,ease:"expo.inOut",onComplete:()=>{$("#pre").remove();ScrollTrigger.refresh();if(location.hash==="#play")apStart()}});
    gsap.from(".hud-p,.hud-s",{opacity:0,y:20,duration:1,delay:.6,stagger:.15})})});

/* ---------- small scroll effects ---------- */
/* reading progress */
lenis.on("scroll",({progress})=>{$("#readbar").style.transform=`scaleX(${progress||0})`});
/* split headline letters (keeps the accent <i>) */
function splitChars(el){let i=0;const walk=n=>{[...n.childNodes].forEach(c=>{if(c.nodeType===3){const f=document.createDocumentFragment();
  [...c.textContent].forEach(ch=>{if(ch===" "){f.append(" ");return}const s=document.createElement("span");s.className="ch";s.style.setProperty("--i",i++);s.textContent=ch;f.append(s)});c.replaceWith(f)}else if(c.nodeType===1)walk(c)})};
  [...el.querySelectorAll("[lang]")].forEach(x=>{i=0;walk(x)})}
/* The opening title reveals with scroll as a whole, preserving Hindi shaping. */
splitChars($("#outro .gt"));
gsap.matchMedia().add("(prefers-reduced-motion:no-preference)",()=>{
  /* the pipeline opens like a curtain as it scrolls in */
  gsap.fromTo("#pipeline .pl-stage",{clipPath:"inset(8% 4% 0% 4% round 56px)"},{clipPath:"inset(0% 0% 0% 0% round 0px)",ease:"none",scrollTrigger:{trigger:"#pipeline",start:"top bottom",end:"top top",scrub:true}});
  gsap.from("#outro .gt .ch",{yPercent:110,rotate:8,stagger:.035,ease:"none",scrollTrigger:{trigger:"#outro",start:"top 75%",end:"top 15%",scrub:true}});
  gsap.fromTo("#outro .gt",{xPercent:10},{xPercent:-12,ease:"none",scrollTrigger:{trigger:"#outro",start:"top bottom",end:"bottom top",scrub:true}});
});

/* ---------- pointer: magnetic buttons (the cursor itself lives in cursor.js) ---------- */
if(FINE&&!REDUCE){
  document.addEventListener("pointermove",e=>{const b=e.target.closest("[data-magnet]");$$("[data-magnet]").forEach(m=>{if(m!==b&&m._mag){m._mag=0;gsap.to(m,{x:0,y:0,duration:.7,ease:"elastic.out(1,.4)"})}});
    if(b){b._mag=1;const r=b.getBoundingClientRect();gsap.to(b,{x:(e.clientX-r.left-r.width/2)*.25,y:(e.clientY-r.top-r.height/2)*.35,duration:.4})}},{passive:true});
}

/* ---------- outro star field ---------- */
{const cv=$("#stars2"),x=cv.getContext("2d");let st=[],W,H,on=false;
  const rs=()=>{W=cv.width=cv.clientWidth;H=cv.height=cv.clientHeight;st=Array.from({length:Math.round(W*H/3500)},()=>[Math.random()*W,Math.random()*H,Math.random()*1.3+.2,Math.random()*6])};
  new ResizeObserver(rs).observe(cv);new IntersectionObserver(e=>on=e[0].isIntersecting).observe(cv);
  gsap.ticker.add(t=>{if(!on)return;x.clearRect(0,0,W,H);for(const s of st){x.globalAlpha=.3+.4*Math.sin(t*1.4+s[3]);x.fillStyle=getComputedStyle(document.documentElement).getPropertyValue("--sp-star").trim()||"#cfeee8";x.fillRect(s[0],((s[1]-lenis.scroll*.05)%H+H)%H,s[2],s[2])}})}

/* ---------- auto-play: flight, then the pipeline step by step, then the ending (≈3 min) ---------- */
const ap={on:false,paused:false,idx:0,el:0,items:[],total:0};
function apBuild(){const orbit=$("#orbit"),pl=$("#pipeline"),N=+getComputedStyle(pl).getPropertyValue("--steps")||13;
  const pt=()=>pageTop(pl),len=()=>pl.offsetHeight-innerHeight;
  const labs=[...pl.querySelectorAll(".pl-rail li span")];
  ap.items=[{lab:{en:"From orbit to Raipur",hi:"कक्षा से रायपुर तक"},dur:22,travel:20,ease:t=>t,y:()=>pageTop(orbit)+orbit.offsetHeight-innerHeight}];
  for(let i=0;i<N;i++)ap.items.push({labHTML:labs[i]?labs[i].innerHTML:"",dur:i===1||i===2||i===11?14:11,travel:2.4,y:()=>pt()+(i+.55)/N*len()});
  ap.items.push({lab:{en:"Ground Truth",hi:"ज़मीनी सच्चाई"},dur:7,y:()=>pageTop($("#outro"))});
  ap.total=ap.items.reduce((a,b)=>a+b.dur,0);$("#apSegs").innerHTML=ap.items.map(x=>`<i style="flex:${x.dur}"><b></b></i>`).join("");
  $("#playBtn em").textContent=`${Math.floor(ap.total/60)}:${pad(Math.round(ap.total%60))}`}
const ease3=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
/* inside the pipeline, glide so each step's sub-parts (formats, use cases) play out while it holds */
function apGo(i){ap.idx=clamp(i,0,ap.items.length-1);ap.el=0;const x=ap.items[ap.idx];$("#apLab").innerHTML=x.labHTML||L2(x.lab);
  goTo(x.y(),{duration:REDUCE?.01:(x.travel||1.6),easing:x.ease||ease3,force:true});apPaint()}
function apPaint(){const segs=$$("#apSegs i b");ap.items.forEach((x,i)=>segs[i].style.transform=`scaleX(${i<ap.idx?1:i===ap.idx?Math.min(1,ap.el/x.dur):0})`);
  let t=ap.el;for(let i=0;i<ap.idx;i++)t+=ap.items[i].dur;t=Math.min(t,ap.total);const f=s=>`${Math.floor(s/60)}:${pad(Math.floor(s%60))}`;$("#apTime").textContent=`${f(t)} / ${f(ap.total)}`}
gsap.ticker.add((t,dt)=>{if(!ap.on||ap.paused)return;ap.el+=dt/1000;const x=ap.items[ap.idx];
  /* a slow drift through multi-part steps */
  if(x.labHTML!==undefined&&ap.el>x.travel){const pl=$("#pipeline"),N=ap.items.length-2,len=pl.offsetHeight-innerHeight,i=ap.idx-1,f=.15+.75*Math.min(1,(ap.el-x.travel)/(x.dur-x.travel));lenis.scrollTo(pageTop(pl)+(i+f)/N*len,{immediate:true,force:true})}
  if(ap.el>=x.dur){if(ap.idx<ap.items.length-1)apGo(ap.idx+1);else apPause(true)}else apPaint()});
function apPause(v){ap.paused=v;const b=$("#apPlay");b.textContent=v?"▶":"❚❚";b.setAttribute("aria-label",v?"Play":"Pause");document.body.classList.toggle("ap-paused",v);
  const x=ap.items[ap.idx];if(v)lenis.scrollTo(lenis.scroll,{immediate:true,force:true});else if(x&&ap.el<x.travel)goTo(x.y(),{duration:Math.max(.6,(x.travel||1.6)-ap.el),easing:x.ease||ease3,force:true})}
function apStart(){apBuild();ap.on=true;$("#ap").hidden=false;document.body.classList.add("autoplay");
  $(".ap-hint").innerHTML=L2(G.ui.paused);ap.paused=false;$("#apPlay").textContent="❚❚";document.body.classList.remove("ap-paused");apGo(0)}
function apStop(){ap.on=false;$("#ap").hidden=true;document.body.classList.remove("autoplay","ap-paused");
  lenis.scrollTo(lenis.scroll,{immediate:true,force:true});if(document.fullscreenElement)document.exitFullscreen().catch(()=>{})}
document.addEventListener("click",e=>{if(e.target.closest("[data-play]"))apStart()});
$("#apPlay").onclick=()=>{if(ap.paused&&ap.idx===ap.items.length-1&&ap.el>=ap.items[ap.idx].dur){apGo(0);apPause(false);return}apPause(!ap.paused)};
$("#apNext").onclick=()=>{apGo(ap.idx+1);if(ap.paused)apPause(false)};
$("#apPrev").onclick=()=>{apGo(ap.el>1.5?ap.idx:ap.idx-1);if(ap.paused)apPause(false)};
$("#apSegs").onclick=e=>{const i=$$("#apSegs i").indexOf(e.target.closest("i"));if(i>=0){apGo(i);if(ap.paused)apPause(false)}};
$("#apStop").onclick=apStop;
$("#apFull").onclick=()=>{const d=document.documentElement;document.fullscreenElement?document.exitFullscreen():d.requestFullscreen&&d.requestFullscreen().catch(()=>{})};
/* the reader takes over: pause and hand over */
function takeOver(){if(ap.on&&!ap.paused)apPause(true)}
addEventListener("wheel",takeOver,{passive:true});
addEventListener("touchstart",e=>{if(!e.target.closest("#ap"))takeOver()},{passive:true});
addEventListener("keydown",e=>{
  const editing=e.target.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])');
  /* A keyboard scroll must take over even while wheel inertia is settling. */
  if(!editing&&!MODAL&&!e.defaultPrevented&&[" ","ArrowDown","ArrowUp","PageDown","PageUp","Home","End"].includes(e.key))
    lenis.scrollTo(lenis.scroll,{immediate:true,force:true});
  if(editing||!ap.on||document.body.classList.contains("fv-open"))return;if(e.key==="Escape")return apStop();if(e.target.closest&&e.target.closest("#ap"))return;
  if(e.key===" "){e.preventDefault();$("#apPlay").click()}else if(e.key==="ArrowRight")$("#apNext").click();else if(e.key==="ArrowLeft")$("#apPrev").click();
  else if(["ArrowDown","ArrowUp","PageDown","PageUp","Home","End"].includes(e.key))takeOver()});

/* ---------- init ---------- */
let saved=null;try{saved=localStorage.getItem("gt-lang")}catch(e){}
setLang(saved||(/^hi/i.test(navigator.language)?"hi":"en"));
})();
