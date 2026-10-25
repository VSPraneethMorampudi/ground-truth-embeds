(()=>{
const G=window.GT,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const REDUCE=matchMedia("(prefers-reduced-motion:reduce)").matches,FINE=matchMedia("(pointer:fine)").matches;
const L2=o=>`<span lang="en">${o.en}</span><span lang="hi">${o.hi}</span>`;
const L2b=(tag,o,cls="")=>`<${tag} lang="en" class="${cls}">${o.en}</${tag}><${tag} lang="hi" class="${cls}">${o.hi}</${tag}>`;
const figURL=(view,step=0)=>`${G.FIG}#${view}&bare&auto=off&nav=off&step=${step}`;
const simple=o=>o?`<div class="simple"><b>${L2(G.ui.simple)}</b><span>${L2(o)}</span></div>`:"";

/* ---------- language ---------- */
function setLang(l){document.documentElement.dataset.lang=l;document.documentElement.lang=l;
  $$("[data-setlang]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.setlang===l));
  try{localStorage.setItem("gt-lang",l)}catch(e){}
  if(pres.on)renderCap()}
document.addEventListener("click",e=>{const b=e.target.closest("[data-setlang]");if(b)setLang(b.dataset.setlang)});

/* ---------- build the page ---------- */
const C=G.cover,main=$("#main");
let h=`<section id="hero"><div class="bg"></div><div class="grid"></div><div class="shade"></div>
 <div class="hero-in"><p class="kicker rv">${L2(C.kicker)}</p>
 <h1 class="title rv" style="--d:.1s">${L2(C.title)}</h1>
 <p class="sub rv" style="--d:.25s">${L2(C.sub)}</p>
 <div class="rv" style="--d:.4s;margin-top:34px;display:flex;gap:12px;flex-wrap:wrap"><a class="btn" data-magnet href="#intro">${L2({en:"Start exploring",hi:"देखना शुरू करें"})}</a>
 <button class="btn ghost" data-magnet data-present>${L2(G.ui.presentSub)}</button></div></div>
 <a class="scrollcue" href="#intro"><i></i>${L2(G.ui.explore)}</a></section>
 <div class="marquee" aria-hidden="true"><div>${[0,1].map(()=>G.chapters.filter(c=>!c.closing).map(c=>`<span>${L2(c.name)}</span>`).join("")).join("")}</div></div>
 <section id="intro"><div class="wrap intro-g"><div>${C.intro.map(p=>`<p class="big sw">${L2b("span",p)}</p>`).join("").replace(/<p class="big sw">/,'<p class="big sw">')}${simple(C.simple)}</div>
 <div class="fig intro-fig rv"><iframe title="Overview" loading="lazy" src="${G.FIG}#overview&bare&auto=off"></iframe></div></div></section>`;
G.chapters.forEach(c=>{
  const N=c.steps.length;
  h+=`<section class="chapter" id="${c.id}" data-ch="${c.id}"><div class="wrap">
   <div class="ch-num" data-par aria-hidden="true">${String(c.n).padStart(2,"0")}</div>
   <div class="ch-h"><p class="kicker rv">${c.closing?L2(G.ui.step)+" ∞":L2({en:"Chapter",hi:"अध्याय"})+" "+c.n} · ${L2(c.name)}</p>
    <h2 class="sw">${L2(c.head)}</h2><p class="lead rv">${L2(c.lead)}</p>
    ${c.cta?`<div class="cta rv"><a class="btn" data-magnet href="${G.PORTAL_URL}" target="_blank" rel="noopener">${L2(G.ui.openLive)} ↗</a></div>`:""}</div>
   <div class="scrolly"><div class="steps">${c.steps.map((s,i)=>`<div class="stepcard" data-i="${i}"><div class="in" data-spot data-tilt>
     <div class="no">${s.k?s.k:(L2(G.ui.step)+" "+(i+1))} / ${N}</div><h3>${L2(s.t)}</h3><p>${L2(s.b)}</p>${simple(s.s)}
     <div class="dots">${c.steps.map((_,j)=>`<i class="${j===i?"on":""}"></i>`).join("")}</div></div></div>`).join("")}</div>
    <div class="stick"><div class="fig" data-fig="${c.id}"><iframe title="${c.name.en}" loading="lazy" src="${figURL(c.view,0)}"></iframe>
     <div class="hint">${L2(G.ui.tryit)}</div></div></div></div></div></section>`});
h+=`<section id="end"><div class="wrap"><h2 class="sw">${L2(G.chapters.at(-1).head)}</h2>
 <a class="btn big" data-magnet href="${G.PORTAL_URL}" target="_blank" rel="noopener">${L2(G.ui.openPortal)} ↗</a>
 <div class="cta"><button class="btn ghost" data-magnet data-present>${L2(G.ui.again)} · ${L2(G.ui.presentSub)}</button></div>
 <p class="credits">${L2(G.ui.credits)}</p></div></section>`;
main.innerHTML=h;
const SHORT={create:{en:"Data",hi:"डेटा"},geodatabase:{en:"Geodatabase",hi:"भू-डेटाबेस"},portal:{en:"Portal",hi:"पोर्टल"},mobile:{en:"Mobile",hi:"मोबाइल"},mapping:{en:"Mapping",hi:"मानचित्रण"},maintain:{en:"Maintenance",hi:"रखरखाव"}};
$("#chapnav").innerHTML=G.chapters.filter(c=>!c.closing).map(c=>`<a href="#${c.id}" data-nav="${c.id}" title="${c.name.en}">${c.n} · ${L2(SHORT[c.id]||c.name)}</a>`).join("");

/* split text into words so they can blur-in one by one */
$$(".sw").forEach(el=>{let i=0;const walk=n=>{[...n.childNodes].forEach(ch=>{
  if(ch.nodeType===3){const f=document.createDocumentFragment();ch.textContent.split(/(\s+)/).forEach(t=>{if(!t.trim()){f.append(t);return}
    const s=document.createElement("span");s.className="w";s.style.setProperty("--i",i++);s.textContent=t;f.append(s)});ch.replaceWith(f)}
  else if(ch.nodeType===1&&!ch.classList.contains("w"))walk(ch)})};
  $$("[lang]",el).length?$$("[lang]",el).forEach(x=>{i=0;walk(x)}):walk(el)});

/* ---------- reveal on scroll ---------- */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.15,rootMargin:"0px 0px -6% 0px"});
$$(".rv,.sw").forEach(el=>io.observe(el));

/* ---------- scrollytelling: scroll position drives the figure's step ---------- */
const charts=G.chapters.map(c=>{const sec=$("#"+c.id),fig=$(".fig[data-fig]",sec),fr=$("iframe",fig);
  return{c,sec,fig,fr,cards:$$(".stepcard",sec),dots:null,cur:-1,hint:$(".hint",fig)}});
function setStep(o,i){if(o.cur===i)return;o.cur=i;
  o.fr.src=figURL(o.c.view,i);                       // only the #hash changes, so the figure animates to the step
  o.cards.forEach((k,j)=>k.classList.toggle("on",j===i));
  if(i>0&&o.hint)o.hint.classList.add("gone")}
let ticking=false;
function onScroll(){ticking=false;
  const vh=innerHeight,y=scrollY,doc=document.documentElement;
  $("#progress").style.transform=`scaleX(${Math.min(1,y/(doc.scrollHeight-vh))})`;
  const mobile=innerWidth<=900,focus=mobile?(vh*.46+vh)/2:vh*.5;
  let activeChap=null;
  charts.forEach(o=>{const r=o.sec.getBoundingClientRect();
    if(r.top<vh*.5&&r.bottom>vh*.4)activeChap=o.c.id;
    o.fig.classList.toggle("live",r.top<vh*.7&&r.bottom>vh*.3);
    if(r.bottom<-200||r.top>vh+200)return;
    let best=-1,bd=1e9;o.cards.forEach((k,i)=>{const b=k.getBoundingClientRect(),d=Math.abs((b.top+b.bottom)/2-focus);if(d<bd){bd=d;best=i}});
    if(r.top>vh*.55)best=0;                           // the chapter has not really started
    setStep(o,best)});
  $$("#chapnav a").forEach(a=>a.classList.toggle("on",a.dataset.nav===activeChap));
  if(!REDUCE){$$("[data-par]").forEach(el=>{const r=el.parentElement.getBoundingClientRect();el.style.transform=`translateY(${(r.top*-.12).toFixed(1)}px)`});
    const bg=$("#hero .bg");if(y<vh*1.2)bg.style.transform=`translateY(${y*.25}px)`}}
addEventListener("scroll",()=>{if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});
addEventListener("resize",onScroll);

/* ---------- hover / pointer effects ---------- */
if(FINE&&!REDUCE){
  const glow=$("#glow");addEventListener("pointermove",e=>{glow.style.transform=`translate(${e.clientX}px,${e.clientY}px)`;
    const hero=$("#hero");if(hero){const r=hero.getBoundingClientRect();hero.style.setProperty("--mx",e.clientX-r.left+"px");hero.style.setProperty("--my",e.clientY-r.top+"px")}},{passive:true});
  document.addEventListener("pointermove",e=>{const c=e.target.closest("[data-spot]");if(!c)return;const r=c.getBoundingClientRect();
    c.style.setProperty("--sx",e.clientX-r.left+"px");c.style.setProperty("--sy",e.clientY-r.top+"px");
    if(c.hasAttribute("data-tilt")){const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform=`perspective(900px) rotateY(${x*5}deg) rotateX(${-y*5}deg)`}});
  document.addEventListener("pointerout",e=>{const c=e.target.closest("[data-tilt]");if(c&&!c.contains(e.relatedTarget))c.style.transform=""});
  document.addEventListener("pointermove",e=>{const b=e.target.closest("[data-magnet]");$$("[data-magnet]").forEach(m=>{if(m!==b)m.style.transform=""});
    if(!b)return;const r=b.getBoundingClientRect();b.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.18}px,${(e.clientY-r.top-r.height/2)*.28}px)`});
  document.addEventListener("pointerleave",()=>$$("[data-magnet]").forEach(m=>m.style.transform=""));
}else $("#glow").remove();

/* ---------- presentation mode (≈3 minutes) ---------- */
const pres={on:false,paused:false,idx:0,el:0,items:[],total:0,raf:0,last:0,frames:{},cur:null};
function buildTimeline(){
  const it=[],COVER=8,CARD=1.6,END=9,steps=G.chapters.reduce((n,c)=>n+c.steps.length,0),chapN=G.chapters.length;
  const per=Math.max(3.5,(G.PRESENT_SECONDS-COVER-END-CARD*chapN)/steps);
  it.push({type:"cover",dur:COVER});
  G.chapters.forEach((c,ci)=>{it.push({type:"chapter",ci,dur:CARD});c.steps.forEach((s,si)=>it.push({type:"step",ci,si,dur:per}))});
  it.push({type:"end",dur:END});
  pres.items=it;pres.total=it.reduce((a,b)=>a+b.dur,0);
  $("#pSegs").innerHTML=it.map(x=>`<i style="flex:${x.dur}"><b></b></i>`).join("");
  $("#pFrame").innerHTML=G.chapters.map(c=>`<iframe title="${c.name.en}" data-v="${c.id}" src="${figURL(c.view,0)}"></iframe>`).join("");
  $("#pFrame").append($("#pCard"),$("#pTitle"));watchP();pres.frames=Object.fromEntries($$("#pFrame iframe").map(f=>[f.dataset.v,f]))}
function curItem(){return pres.items[pres.idx]}
function renderCap(){const x=curItem();if(!x)return;const cap=$("#pCap");
  if(x.type==="step"){const c=G.chapters[x.ci],s=c.steps[x.si];
    cap.innerHTML=`<div class="k">${L2(c.name)} · ${x.si+1}/${c.steps.length}</div><h3>${L2(s.t)}</h3><p>${L2(s.b)}</p>`}
  else if(x.type==="cover")cap.innerHTML=`<div class="k">${L2(C.kicker)}</div><h3>${L2(C.sub)}</h3><p>${L2(C.intro[0])}</p>`;
  else if(x.type==="chapter"){const c=G.chapters[x.ci];cap.innerHTML=`<div class="k">${L2({en:"Chapter",hi:"अध्याय"})} ${c.n}</div><h3>${L2(c.head)}</h3><p>${L2(c.lead)}</p>`}
  else cap.innerHTML=`<div class="k">${L2(C.title)}</div><h3>${L2(G.chapters.at(-1).head)}</h3><p>${L2(G.chapters.at(-1).steps.at(-1).s)}</p>`;
}
function enter(i){pres.idx=Math.max(0,Math.min(pres.items.length-1,i));pres.el=0;const x=curItem();
  const card=$("#pCard"),ttl=$("#pTitle");card.classList.remove("show");ttl.classList.remove("show");
  Object.values(pres.frames).forEach(f=>f.classList.remove("on"));
  if(x.type==="cover"||x.type==="end"){ttl.classList.add("show");
    ttl.innerHTML=`<div><p class="kicker">${L2(C.kicker)}</p><h1>${L2(C.title)}</h1><p>${x.type==="cover"?L2(C.sub):L2(G.ui.openPortal)}</p></div>`}
  else{const c=G.chapters[x.ci],f=pres.frames[c.id];f.classList.add("on");
    if(x.type==="chapter"){f.src=figURL(c.view,0);card.innerHTML=`<div><div class="num">${String(c.n).padStart(2,"0")}</div><h2>${L2(c.name)}</h2><p>${L2(c.head)}</p></div>`;card.classList.add("show")}
    else f.src=figURL(c.view,x.si)}
  renderCap();paintBar()}
function paintBar(){const segs=$$("#pSegs i b");let t=0;pres.items.forEach((x,i)=>{const p=i<pres.idx?1:i===pres.idx?Math.min(1,pres.el/x.dur):0;segs[i].style.transform=`scaleX(${p})`});
  for(let i=0;i<pres.idx;i++)t+=pres.items[i].dur;t+=pres.el;const f=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;
  $("#pTime").textContent=`${f(t)} / ${f(pres.total)}`}
function loop(ts){if(!pres.on)return;const dt=Math.min(.1,(ts-pres.last)/1000||0);pres.last=ts;
  if(!pres.paused){pres.el+=dt;const x=curItem();
    if(pres.el>=x.dur){if(pres.idx<pres.items.length-1)enter(pres.idx+1);else{pres.paused=true;setPlayIcon()}}else paintBar()}
  pres.raf=requestAnimationFrame(loop)}
function setPlayIcon(){const b=$("#pPlay");b.textContent=pres.paused?"▶":"⏸";b.setAttribute("aria-label",pres.paused?G.ui.play.en:G.ui.pause.en)}
let idleT;function wake(){document.body.classList.remove("idle");clearTimeout(idleT);idleT=setTimeout(()=>pres.on&&!pres.paused&&document.body.classList.add("idle"),3500)}
function openPres(){$("#pres").hidden=false;if(!pres.items.length)buildTimeline();pres.on=true;pres.paused=false;document.body.classList.add("presenting");
  setPlayIcon();enter(0);pres.last=performance.now();pres.raf=requestAnimationFrame(loop);wake();
  const r=document.documentElement;if(r.requestFullscreen&&FINE)r.requestFullscreen().catch(()=>{});$("#pPlay").focus()}
function closePres(){pres.on=false;cancelAnimationFrame(pres.raf);$("#pres").hidden=true;document.body.classList.remove("presenting","idle");
  if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});document.documentElement.focus()}
document.addEventListener("click",e=>{if(e.target.closest("#presentBtn,[data-present]"))openPres()});
$("#pExit").onclick=closePres;
$("#pPlay").onclick=()=>{if(pres.idx===pres.items.length-1&&pres.el>=curItem().dur){enter(0)}pres.paused=!pres.paused;setPlayIcon()};
$("#pNext").onclick=()=>enter(pres.idx+1);
$("#pPrev").onclick=()=>enter(pres.el>1.5?pres.idx:pres.idx-1);
$("#pSegs").onclick=e=>{const i=$$("#pSegs i").indexOf(e.target.closest("i"));if(i>=0)enter(i)};
addEventListener("keydown",e=>{if(!pres.on)return;wake();
  if(e.key==="Escape")closePres();else if(e.key===" "&&document.activeElement.tagName!=="BUTTON"){e.preventDefault();$("#pPlay").click()}
  else if(e.key==="ArrowRight")$("#pNext").click();else if(e.key==="ArrowLeft")$("#pPrev").click()});
addEventListener("pointermove",()=>pres.on&&wake());
document.addEventListener("fullscreenchange",()=>{if(!document.fullscreenElement&&pres.on&&FINE===false)closePres()});
if(location.hash==="#present")addEventListener("load",()=>setTimeout(openPres,400));

/* ---------- figures render at 1280x800 and scale to their panel (desktop) ---------- */
const FW=1280,FH=800,ro=new ResizeObserver(es=>es.forEach(e=>{const box=e.target,fr=$$("iframe",box);
  const wide=innerWidth>900||box.id==="pFrame";box.classList.toggle("scaled",wide);
  fr.forEach(f=>{f.style.transform=wide?`scale(${box.clientWidth/FW})`:""})}));
$$(".fig").forEach(f=>ro.observe(f));
const watchP=()=>ro.observe($("#pFrame"));

/* ---------- init ---------- */
let saved=null;try{saved=localStorage.getItem("gt-lang")}catch(e){}
setLang(saved||(/^hi/i.test(navigator.language)?"hi":"en"));
onScroll();
})();
