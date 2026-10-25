(()=>{
const G=window.GT,E=G.E,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const REDUCE=matchMedia("(prefers-reduced-motion:reduce)").matches,FINE=matchMedia("(pointer:fine)").matches;
const L2=o=>o?`<span lang="en">${o.en}</span><span lang="hi">${o.hi}</span>`:"";
const url=u=>/^https?:/.test(u)?u:G.BASE+u;
const syncURL=(e,i)=>url(e.url)+`&nav=off&auto=off&step=${i}`;
const simple=o=>o?`<div class="simple"><b>${L2(G.ui.simple)}</b><span>${L2(o)}</span></div>`:"";
const pad=n=>String(n).padStart(2,"0");
const pageTop=el=>el.getBoundingClientRect().top+window.scrollY;
gsap.registerPlugin(ScrollTrigger);

/* ---------- language ---------- */
function setLang(l){const h=document.documentElement;h.dataset.lang=l;h.lang=l;
  $$("[data-setlang]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.setlang===l));
  try{localStorage.setItem("gt-lang",l)}catch(e){}
  requestAnimationFrame(()=>ScrollTrigger.refresh())}
document.addEventListener("click",e=>{const b=e.target.closest("[data-setlang]");if(b)setLang(b.dataset.setlang)});

/* ---------- orbit copy ---------- */
const C=G.cover;
$("#ocaps").innerHTML=G.orbit.map(o=>`<div class="ocap"><div class="k">${L2(o.k)}</div><p>${L2(o.t)}</p></div>`).join("");
$("#oKick").innerHTML=L2(C.kicker);
$("#oTitle").innerHTML=`<span lang="en">Ground <i>Truth</i></span><span lang="hi">ज़मीनी <i>सच्चाई</i></span>`;
$("#oSub").innerHTML=L2(C.sub);
$("#oBegin").innerHTML=L2(G.ui.begin)+" ↓";
$("#oPlay").innerHTML=`▶ ${L2(G.ui.play)} · ${L2(G.ui.min3)}`;

/* ---------- ground: build every section from content.js ---------- */
const frame=(e,id,tag,init=0)=>{const inner=e.steps
    ?`<div class="stack">${e.steps.map((u,i)=>`<iframe title="${id} step ${i+1}" loading="lazy" src="${url(u)}" class="${i===init?"on":""}"></iframe>`).join("")}</div>`
    :`<iframe title="${id}" loading="lazy" src="${e.sync?syncURL(e,init):url(e.url)}"></iframe>`;
  return `<div class="frame" data-w="${e.w||1280}" data-h="${e.h||800}" data-cursor>${tag?`<div class="tag"><i></i>${L2(tag)}</div>`:""}${inner}</div>`};
const sep=e=>e?`<div class="wrap"><div class="sep"><iframe title="Chapter separator" loading="lazy" src="${url(e.url)}" allowtransparency="true"></iframe></div></div>`:"";
const SEP={create:E.sep1,mobile:E.sep4,mapping:E.sep5};
const live={en:"Interactive",hi:"इंटरैक्टिव"};
let h=`<section id="intro"><div class="wrap">
  <p class="label">${L2({en:"Prologue",hi:"प्रस्तावना"})}</p>
  <p class="scrub" id="scrub">${L2({en:C.intro[0].en+" "+C.intro[1].en,hi:C.intro[0].hi+" "+C.intro[1].hi})}</p>
  <div class="intro-more"><div><p>${L2(C.intro[2])}</p></div>${simple(C.simple)}</div>
  <div class="fullfig">${frame(E.overview,"overview",{en:"Live figure · hover the map",hi:"लाइव चित्र · नक्शे पर कर्सर ले जाएँ"})}</div></div></section>
 <div class="marq" aria-hidden="true"><div class="tr">${[0,1,2].map(()=>G.chapters.filter(c=>!c.closing).map(c=>`<span>${L2(c.name)}</span><span>·</span>`).join("")).join("")}</div></div>`;
G.chapters.forEach((c,ci)=>{const e=E[c.id],N=c.steps.length;
  h+=`<section class="chapter${ci%2?" alt":""}" id="${c.id}" data-ch="${c.id}">${sep(SEP[c.id])}<div class="wrap">
   <div class="ch-num" aria-hidden="true">${c.closing?"∞":pad(c.n)}</div>
   <div class="ch-h"><p class="label">${c.closing?L2({en:"Epilogue",hi:"उपसंहार"}):L2(G.ui.chapter)+" "+pad(c.n)} · ${L2(c.name)}</p>
    <h2 class="split">${L2(c.head)}</h2><p class="lead">${L2(c.lead)}</p></div>`;
  if(c.id==="portal"){
    h+=`<div class="portal-note"><p>${L2(G.ui.portalNote)}</p><a class="btn ink" data-magnet href="${G.PORTAL_URL}" target="_blank" rel="noopener">${L2(G.ui.openLive)} ↗</a></div>
     <div class="browser" data-cursor><div class="bar"><i></i><i></i><i></i><span class="url">Chhattisgarh State Geoportal</span></div>
     <iframe title="Live Geoportal" loading="lazy" src="${url(e.url)}"></iframe></div>
     <div class="feats">${c.steps.map((s,i)=>`<div class="feat" data-spot><b>${pad(i+1)}</b><h4>${L2(s.t)}</h4><p>${L2(s.b)}</p></div>`).join("")}</div>
     ${c.steps.at(-1).s?`<div class="simple solo"><b>${L2(G.ui.simple)}</b><span>${L2(c.steps.at(-1).s)}</span></div>`:""}`}
  else h+=`<div class="scrolly"><div class="cards">${c.steps.map((s,i)=>`<div class="card" data-i="${i}"><div class="in" data-spot>
     <div class="no"><span>${s.k||pad(i+1)}</span><span>${pad(i+1)} / ${pad(N)}</span></div><h3>${L2(s.t)}</h3><p>${L2(s.b)}</p>${simple(s.s)}
     <div class="prog">${c.steps.map((_,j)=>`<i class="${j<=i?"on":""}"></i>`).join("")}</div></div></div>`).join("")}</div>
     <div class="stick">${frame(e,c.id,live)}</div></div>`;
  h+=`</div></section>`});
h+=`<section id="outro"><canvas id="stars2" aria-hidden="true"></canvas><div class="wrap">
  <p class="label" style="color:var(--amber)">${L2({en:"Ground truth, every day",hi:"हर दिन, ज़मीनी सच्चाई"})}</p>
  <h2 class="big"><span lang="en">Ground <i>Truth</i></span><span lang="hi">ज़मीनी <i>सच्चाई</i></span></h2>
  <div class="row">${simple(G.chapters.at(-1).steps.at(-1).s)}
   <div class="cta"><a class="btn" data-magnet href="${G.PORTAL_URL}" target="_blank" rel="noopener">${L2(G.ui.openPortal)} ↗</a>
   <button class="btn ghost" data-magnet data-play>▶ ${L2(G.ui.play)}</button></div></div>
  <div class="foot"><span>${L2(G.ui.credits)}</span><button id="toOrbit">↑ ${L2(G.ui.backOrbit)}</button></div></div></section>`;
$("#ground").innerHTML=h;

/* chapter rail */
const SHORT={create:{en:"Data",hi:"डेटा"},geodatabase:{en:"Geodatabase",hi:"भू-डेटाबेस"},portal:{en:"Portal",hi:"पोर्टल"},mobile:{en:"Mobile",hi:"मोबाइल"},mapping:{en:"Mapping",hi:"मानचित्रण"},maintain:{en:"Maintenance",hi:"रखरखाव"},cycle:{en:"The cycle",hi:"चक्र"}};
$("#rail").innerHTML=G.chapters.map(c=>`<a href="#${c.id}" data-nav="${c.id}"><span>${c.closing?"∞":pad(c.n)} · ${L2(SHORT[c.id])}</span><i></i></a>`).join("");

/* ---------- smooth scroll ---------- */
const lenis=new Lenis({lerp:REDUCE?1:.09,smoothWheel:!REDUCE,wheelMultiplier:.9});
lenis.on("scroll",ScrollTrigger.update);
gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0);
const goTo=(t,o={})=>lenis.scrollTo(t,{offset:0,duration:1.4,...o});
document.addEventListener("click",e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const t=$(a.getAttribute("href"));if(!t)return;e.preventDefault();
  goTo(a.getAttribute("href")==="#orbit"?0:t,{duration:a.getAttribute("href")==="#ground"?2.4:1.6})});
$("#toOrbit").onclick=()=>goTo(0,{duration:3.2});

/* ---------- figures: draw at their native size, scale to the frame (desktop) ---------- */
const ro=new ResizeObserver(es=>es.forEach(en=>{const f=en.target,w=+f.dataset.w,hh=+f.dataset.h,wide=innerWidth>900||f.closest(".fullfig");
  f.classList.toggle("scaled",!!wide);if(wide)f.style.aspectRatio=`${w}/${hh}`;else f.style.aspectRatio="";
  $$("iframe",f).forEach(i=>{if(wide){i.style.width=w+"px";i.style.height=hh+"px";i.style.transform=`scale(${f.clientWidth/w})`}else{i.style.width=i.style.height="";i.style.transform=""}})}));
$$(".frame").forEach(f=>ro.observe(f));

/* ---------- split headings into masked words ---------- */
$$(".split").forEach(el=>$$("[lang]",el).forEach(x=>{x.innerHTML=x.textContent.split(/\s+/).map(w=>`<span class="mask"><span>${w}</span></span>`).join(" ")}));
$$("#scrub [lang]").forEach(x=>{x.innerHTML=x.textContent.split(/\s+/).map(w=>`<span class="w">${w}</span>`).join(" ")});

/* ---------- preloader → reveal ---------- */
const pre={v:0};
const fontsReady=Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,2500))]);
gsap.to(pre,{v:100,duration:REDUCE?.2:1.6,ease:"power2.inOut",onUpdate:()=>{$("#preN").textContent=pad(Math.round(pre.v));$("#preBar").style.transform=`scaleX(${pre.v/100})`},
  onComplete:()=>fontsReady.then(()=>{document.body.classList.remove("loading");
    gsap.to("#pre",{yPercent:-100,duration:REDUCE?.01:1.1,ease:"expo.inOut",onComplete:()=>{$("#pre").remove();ScrollTrigger.refresh();if(location.hash==="#play")apStart()}});
    gsap.from(".hud-p,.hud-s",{opacity:0,y:20,duration:1,delay:.6,stagger:.15})})});

/* ---------- scroll animations ---------- */
const mm=gsap.matchMedia();
mm.add("(prefers-reduced-motion:no-preference)",()=>{
  $$(".split").forEach(el=>gsap.from($$(".mask>span",el),{yPercent:115,rotate:4,duration:1.1,ease:"expo.out",stagger:.045,scrollTrigger:{trigger:el,start:"top 85%"}}));
  $$(".ch-num").forEach(el=>gsap.fromTo(el,{yPercent:-12},{yPercent:30,ease:"none",scrollTrigger:{trigger:el.closest("section"),start:"top bottom",end:"bottom top",scrub:true}}));
  $$(".ch-h .lead,.ch-h .label,.portal-note,.intro-more>*").forEach(el=>gsap.from(el,{opacity:0,y:30,duration:1,ease:"power3.out",scrollTrigger:{trigger:el,start:"top 88%"}}));
  $$(".stick .frame,.fullfig .frame,.browser").forEach(el=>gsap.from(el,{clipPath:"inset(12% 8% 12% 8% round 22px)",scale:.94,duration:1.4,ease:"expo.out",scrollTrigger:{trigger:el,start:"top 85%"}}));
  gsap.from(".feat",{opacity:0,y:50,duration:1,stagger:.08,ease:"power3.out",scrollTrigger:{trigger:".feats",start:"top 88%"}});
  gsap.fromTo("#outro .big",{xPercent:8},{xPercent:-8,ease:"none",scrollTrigger:{trigger:"#outro",start:"top bottom",end:"bottom top",scrub:true}});
});
/* prologue words light up as you read */
const words=()=>$$(`#scrub [lang="${document.documentElement.dataset.lang}"] .w`);
ScrollTrigger.create({trigger:"#scrub",start:"top 80%",end:"bottom 35%",scrub:true,onUpdate:s=>{const w=words(),n=Math.round(s.progress*w.length);w.forEach((x,i)=>x.style.opacity=i<n?1:.13)}});
/* marquee speeds up and leans with scroll velocity */
{const tr=$(".marq .tr");let x=0,v=0;gsap.ticker.add(()=>{if(REDUCE)return;v+=(Math.abs(lenis.velocity||0)*.6-v)*.1;x-=(.6+v);const w=tr.scrollWidth/3;if(-x>w)x+=w;tr.style.transform=`translateX(${x}px) skewX(${-Math.min(12,(lenis.velocity||0)*.4)}deg)`})}

/* ---------- step cards drive the figures ---------- */
const state={};
let cleared=new Set();
function setStep(c,i){const st=state[c.id]||(state[c.id]={cur:-1});if(st.cur===i)return;st.cur=i;const sec=$("#"+c.id),e=E[c.id];
  $$(".card",sec).forEach((k,j)=>k.classList.toggle("on",j===i));
  if(e.steps)$$(".stack iframe",sec).forEach((f,j)=>f.classList.toggle("on",j===i));
  else if(e.sync){const f=$(".stick iframe",sec);if(f)f.src=syncURL(e,i)}
  if(i===c.steps.length-1&&!cleared.has(c.id)){cleared.add(c.id);toast(c)}}
G.chapters.forEach(c=>{if(c.id==="portal")return;
  $$(`#${c.id} .card`).forEach((k,i)=>ScrollTrigger.create({trigger:k,start:()=>innerWidth<=900?"top 75%":"top center",end:()=>innerWidth<=900?"bottom 75%":"bottom center",
    onToggle:s=>{if(s.isActive)setStep(c,i)}}))});
G.chapters.filter(c=>c.id==="portal").forEach(c=>ScrollTrigger.create({trigger:".feats",start:"top 70%",once:true,onEnter:()=>{cleared.add(c.id);toast(c)}}));

/* level rail + ground state */
G.chapters.forEach(c=>ScrollTrigger.create({trigger:"#"+c.id,start:"top center",end:"bottom center",
  onToggle:s=>{const a=$(`#rail [data-nav="${c.id}"]`);a.classList.toggle("on",s.isActive);if(!s.isActive&&s.direction>0)a.classList.add("done")}}));
ScrollTrigger.create({trigger:"#ground",start:"top 40%",end:"bottom bottom",onToggle:s=>document.body.classList.toggle("on-ground",s.isActive)});

/* achievements */
function toast(c){const n=G.chapters.filter(x=>!x.closing).length,done=[...cleared].filter(id=>!G.chapters.find(x=>x.id===id).closing).length;
  const t=document.createElement("div");t.className="t";
  t.innerHTML=`<i>✓</i><div><small>${L2(G.ui.cleared)}${c.closing?"":` · ${done}/${n}`}</small><b>${L2(c.name)}</b></div>`;
  $("#toast").append(t);setTimeout(()=>{t.classList.add("out");setTimeout(()=>t.remove(),500)},2600)}

/* ---------- pointer: cursor, magnets, spotlights ---------- */
if(FINE&&!REDUCE){document.body.classList.add("has-cursor");
  const cur=$("#cur"),dot=$(".dot",cur),ring=$(".ring",cur),pos={x:innerWidth/2,y:innerHeight/2},rp={...pos};
  addEventListener("pointermove",e=>{pos.x=e.clientX;pos.y=e.clientY;cur.classList.remove("hide")},{passive:true});
  gsap.ticker.add(()=>{rp.x+=(pos.x-rp.x)*.18;rp.y+=(pos.y-rp.y)*.18;dot.style.transform=`translate(${pos.x}px,${pos.y}px)`;ring.style.transform=`translate(${rp.x}px,${rp.y}px)`});
  document.addEventListener("pointerover",e=>{const l=e.target.closest("a,button,[data-magnet]");cur.classList.toggle("link",!!l)});
  /* the pointer disappears into a live figure: hide ours, the figure shows its own */
  document.addEventListener("pointerover",e=>{if(e.target.closest(".frame,.browser,.sep"))cur.classList.add("hide")});
  document.addEventListener("pointermove",e=>{const b=e.target.closest("[data-magnet]");$$("[data-magnet]").forEach(m=>{if(m!==b)gsap.to(m,{x:0,y:0,duration:.6,ease:"elastic.out(1,.4)"})});
    if(b){const r=b.getBoundingClientRect();gsap.to(b,{x:(e.clientX-r.left-r.width/2)*.25,y:(e.clientY-r.top-r.height/2)*.35,duration:.4})}
    const s=e.target.closest("[data-spot]");if(s){const r=s.getBoundingClientRect();s.style.setProperty("--sx",e.clientX-r.left+"px");s.style.setProperty("--sy",e.clientY-r.top+"px")}},{passive:true});
}

/* ---------- outro star field ---------- */
{const cv=$("#stars2"),x=cv.getContext("2d");let st=[],W,H,on=false;
  const rs=()=>{W=cv.width=cv.clientWidth;H=cv.height=cv.clientHeight;st=Array.from({length:Math.round(W*H/3500)},()=>[Math.random()*W,Math.random()*H,Math.random()*1.3+.2,Math.random()*6])};
  new ResizeObserver(rs).observe(cv);new IntersectionObserver(e=>on=e[0].isIntersecting).observe(cv);
  gsap.ticker.add(t=>{if(!on)return;x.clearRect(0,0,W,H);for(const s of st){x.globalAlpha=.3+.4*Math.sin(t*1.4+s[3]);x.fillStyle="#cfeee8";x.fillRect(s[0],(s[1]-(lenis.scroll*.05))%H+(s[1]<lenis.scroll*.05%H?H:0),s[2],s[2])}})}

/* ---------- auto-play: the page flies itself through the story ---------- */
const ap={on:false,paused:false,idx:0,el:0,items:[],total:0};
const lab=(o)=>L2(o);
function apBuild(){const it=[],orbit=$("#orbit");
  it.push({lab:{en:"From orbit to Raipur",hi:"कक्षा से रायपुर तक"},dur:26,travel:24,ease:t=>t,y:()=>pageTop(orbit)+orbit.offsetHeight-innerHeight});
  it.push({lab:{en:"Prologue",hi:"प्रस्तावना"},dur:9,y:()=>pageTop($("#scrub"))-innerHeight*.3});
  it.push({lab:{en:"The base map",hi:"आधार नक्शा"},dur:8,el:()=>$(".fullfig .frame")});
  const fixed=26+9+8+G.chapters.length*3.5+10+7,steps=G.chapters.filter(c=>c.id!=="portal").reduce((n,c)=>n+c.steps.length,0);
  const per=Math.max(3.5,(G.PRESENT_SECONDS-fixed)/steps);
  G.chapters.forEach(c=>{it.push({lab:c.name,dur:3.5,y:()=>pageTop($(`#${c.id} .ch-h`))-innerHeight*.25});
    if(c.id==="portal")it.push({lab:{en:"Live portal",hi:"लाइव पोर्टल"},dur:10,el:()=>$("#portal .browser")});
    else c.steps.forEach((s,i)=>it.push({lab:s.t,dur:per,el:()=>$$(`#${c.id} .card`)[i]}))});
  it.push({lab:{en:"Ground Truth",hi:"ज़मीनी सच्चाई"},dur:7,y:()=>pageTop($("#outro"))});
  ap.items=it;ap.total=it.reduce((a,b)=>a+b.dur,0);
  $("#apSegs").innerHTML=it.map(x=>`<i style="flex:${x.dur}"><b></b></i>`).join("")}
function apY(x){if(x.y)return x.y();const r=x.el().getBoundingClientRect(),focus=innerWidth<=900?innerHeight*.75:innerHeight*.5;
  return r.top+window.scrollY+r.height/2-focus}
function apScroll(rem){const x=ap.items[ap.idx];const d=Math.max(.6,(x.travel||1.4)-rem);goTo(apY(x),{duration:REDUCE?.01:d,easing:x.ease||(t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2),lock:false,force:true})}
function apGo(i){ap.idx=Math.max(0,Math.min(ap.items.length-1,i));ap.el=0;$("#apLab").innerHTML=lab(ap.items[ap.idx].lab);apScroll(0);apPaint()}
function apPaint(){const segs=$$("#apSegs i b");ap.items.forEach((x,i)=>segs[i].style.transform=`scaleX(${i<ap.idx?1:i===ap.idx?Math.min(1,ap.el/x.dur):0})`);
  let t=ap.el;for(let i=0;i<ap.idx;i++)t+=ap.items[i].dur;const f=s=>`${Math.floor(s/60)}:${pad(Math.floor(s%60))}`;$("#apTime").textContent=`${f(t)} / ${f(ap.total)}`}
gsap.ticker.add((t,dt)=>{if(!ap.on||ap.paused)return;ap.el+=dt/1000;const x=ap.items[ap.idx];
  if(ap.el>=x.dur){if(ap.idx<ap.items.length-1)apGo(ap.idx+1);else apPause(true)}else apPaint()});
function apPause(v){ap.paused=v;const b=$("#apPlay");b.textContent=v?"▶":"❚❚";b.setAttribute("aria-label",v?"Play":"Pause");document.body.classList.toggle("ap-paused",v);
  if(v)lenis.scrollTo(lenis.scroll,{immediate:true,force:true});else apScroll(ap.el)}
function apStart(){if(!ap.items.length)apBuild();ap.on=true;$("#ap").hidden=false;document.body.classList.add("autoplay");
  $(".ap-hint").innerHTML=L2(G.ui.paused);ap.paused=false;$("#apPlay").textContent="❚❚";document.body.classList.remove("ap-paused");apGo(0)}
function apStop(){ap.on=false;$("#ap").hidden=true;document.body.classList.remove("autoplay","ap-paused");lenis.scrollTo(lenis.scroll,{immediate:true,force:true});
  if(document.fullscreenElement)document.exitFullscreen().catch(()=>{})}
document.addEventListener("click",e=>{if(e.target.closest("[data-play]"))apStart()});
$("#apPlay").onclick=()=>{if(ap.paused&&ap.idx===ap.items.length-1&&ap.el>=ap.items[ap.idx].dur){apGo(0);apPause(false);return}apPause(!ap.paused)};
$("#apNext").onclick=()=>{apGo(ap.idx+1);if(ap.paused)apPause(false)};
$("#apPrev").onclick=()=>{apGo(ap.el>1.5?ap.idx:ap.idx-1);if(ap.paused)apPause(false)};
$("#apSegs").onclick=e=>{const i=$$("#apSegs i").indexOf(e.target.closest("i"));if(i>=0){apGo(i);if(ap.paused)apPause(false)}};
$("#apStop").onclick=apStop;
$("#apFull").onclick=()=>{const d=document.documentElement;document.fullscreenElement?document.exitFullscreen():d.requestFullscreen&&d.requestFullscreen().catch(()=>{})};
/* the reader grabs the wheel: pause and hand over */
const takeOver=()=>{if(ap.on&&!ap.paused)apPause(true)};
addEventListener("wheel",takeOver,{passive:true});
addEventListener("touchstart",e=>{if(!e.target.closest("#ap"))takeOver()},{passive:true});
addEventListener("blur",()=>setTimeout(()=>{if(document.activeElement&&document.activeElement.tagName==="IFRAME")takeOver()},0));
addEventListener("keydown",e=>{if(!ap.on)return;if(e.key==="Escape")return apStop();if(e.target.closest&&e.target.closest("#ap"))return;
  if(e.key===" "){e.preventDefault();$("#apPlay").click()}else if(e.key==="ArrowRight")$("#apNext").click();else if(e.key==="ArrowLeft")$("#apPrev").click();
  else if(["ArrowDown","ArrowUp","PageDown","PageUp","Home","End"].includes(e.key))takeOver()});

/* ---------- init ---------- */
let saved=null;try{saved=localStorage.getItem("gt-lang")}catch(e){}
setLang(saved||(/^hi/i.test(navigator.language)?"hi":"en"));
})();
