(()=>{
const G=window.GT,E=G.E,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const REDUCE=matchMedia("(prefers-reduced-motion:reduce)").matches,FINE=matchMedia("(pointer:fine)").matches;
const L2=o=>o?`<span lang="en">${o.en}</span><span lang="hi">${o.hi}</span>`:"";
const url=u=>/^https?:/.test(u)?u:G.BASE+u;
const syncURL=(e,i)=>url(e.url)+`&nav=off&auto=off&step=${i}`;
const simple=o=>o?`<div class="simple"><b>${L2(G.ui.simple)}</b><span>${L2(o)}</span></div>`:"";
const pad=n=>String(n).padStart(2,"0");
const pageTop=el=>el.getBoundingClientRect().top+window.scrollY;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lang=()=>document.documentElement.dataset.lang||"en";
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

/* ---------- ground: three kinds of scene, built from content.js ----------
   scene  : pinned; the chapter title fills the screen, the figure grows from a card behind it
            to full size, then scrolling plays the steps (captions cross-fade, figure follows)
   track  : pinned; the page moves sideways, one full screen per step (Data Creation)
   window : pinned; the live portal grows to full screen, feature captions play over it */
const SEP={create:E.sep1,mobile:E.sep4,mapping:E.sep5};
const sep=e=>e?`<div class="wrap"><div class="sep"><iframe title="Chapter separator" loading="lazy" src="${url(e.url)}"></iframe></div></div>`:"";
const PLAY={en:"Play",hi:"खेलें"};
const fig=(inner,e)=>`<div class="frame"${e.w?` data-w="${e.w}" data-h="${e.h}"`:""}>${inner}
  <button class="shield" aria-label="Interact with the figure"></button><div class="hint"><i></i>${L2({en:"Click to play",hi:"खेलने के लिए क्लिक करें"})}</div></div>`;
const ifr=(src,t,cls="")=>`<iframe title="${t}" loading="lazy" src="${src}" class="${cls}"></iframe>`;
const cap=(s,i,N,on)=>`<div class="cap${on?" on":""}" data-i="${i}"><div class="k"><b>${pad(i+1)}</b><span>${s.k?s.k+" · ":""}${pad(i+1)} / ${pad(N)}</span></div>
  <h3>${L2(s.t)}</h3><p>${L2(s.b)}</p>${simple(s.s)}</div>`;
const label=c=>c.closing?L2({en:"Epilogue",hi:"उपसंहार"}):c.n?`${L2(G.ui.chapter)} ${pad(c.n)} · ${L2(c.name)}`:L2(c.name);
const opener=(c,inStage)=>`<div class="${inStage?"ttl":"opener"}"><div class="wrap">${inStage?"":`<div class="num" aria-hidden="true">${c.closing?"∞":pad(c.n)}</div>`}
  <p class="label">${label(c)}</p><h2 class="big split">${L2(c.head)}</h2><p class="lead">${L2(c.lead)}</p></div></div>`;
function scene(id,c,e,steps){const N=steps.length,inner=e.steps?`<div class="stack">${e.steps.map((u,i)=>ifr(url(u),id,i?"":"on")).join("")}</div>`:ifr(e.sync?syncURL(e,0):url(e.url),id);
  return `<section class="scene" id="${id}" data-scene>${sep(SEP[id])}<div class="stage">${opener(c,true)}
    <div class="figwrap">${fig(inner,e)}</div>
    <div class="caps">${steps.map((s,i)=>cap(s,i,N,!i)).join("")}</div><div class="sbar">${steps.map(()=>"<i><b></b></i>").join("")}</div></div></section>`}
function track(c,e){const N=c.steps.length;
  return `<section class="track" id="${c.id}">${sep(SEP[c.id])}${opener(c)}<div class="hstage"><div class="hrow">
    ${c.steps.map((s,i)=>`<div class="panel">${cap(s,i,N,true)}<div class="pfig">${fig(ifr(url(e.steps[i]),c.id+" step "+(i+1)),e)}</div></div>`).join("")}
    </div><div class="hprog">${c.steps.map(()=>"<i><b></b></i>").join("")}</div></div></section>`}
function windowScene(c,e){const N=c.steps.length;
  return `<section class="window" id="${c.id}">${sep(SEP[c.id])}${opener(c)}<div class="wstage">
    <div class="browser"><div class="bar"><i></i><i></i><i></i><span class="url">Chhattisgarh State Geoportal</span></div>${fig(ifr(url(e.url),"Live Geoportal"),e)}</div>
    <div class="wcaps">${c.steps.map((s,i)=>cap({t:s.t,b:s.b},i,N,false)).join("")}</div>
    <a class="btn wcta" data-magnet href="${G.PORTAL_URL}" target="_blank" rel="noopener">${L2(G.ui.openLive)} ↗</a></div></section>`}

const ov={n:0,name:{en:"Prologue",hi:"प्रस्तावना"},head:{en:"One base map for the whole state",hi:"पूरे राज्य के लिए एक आधार नक्शा"},lead:C.intro[2]};
let h=`<section id="intro"><div class="wrap"><p class="label">${L2({en:"Prologue",hi:"प्रस्तावना"})}</p>
  <p class="scrub" id="scrub">${L2({en:C.intro[0].en+" "+C.intro[1].en,hi:C.intro[0].hi+" "+C.intro[1].hi})}</p>
  <div class="intro-more"><div></div>${simple(C.simple)}</div></div></section>`;
h+=scene("overview",ov,E.overview,[{t:{en:"Every department, one map",hi:"हर विभाग, एक नक्शा"},
  b:{en:"Hover the map: it separates into the layers each department brings, then merges back onto one base.",hi:"नक्शे पर कर्सर ले जाएँ: यह हर विभाग की परतों में बँटता है, फिर एक आधार पर जुड़ जाता है।"},s:C.simple}]);
h+=`<div class="marq" aria-hidden="true"><div class="tr">${[0,1,2].map(()=>G.chapters.filter(c=>!c.closing).map(c=>`<span>${L2(c.name)}</span><span>✦</span>`).join("")).join("")}</div></div>`;
G.chapters.forEach(c=>{const e=E[c.id];h+=c.id==="create"?track(c,e):c.id==="portal"?windowScene(c,e):scene(c.id,c,e,c.steps)});
h+=`<section id="outro"><canvas id="stars2" aria-hidden="true"></canvas><div class="wrap">
  <p class="label" style="color:var(--amber)">${L2({en:"Ground truth, every day",hi:"हर दिन, ज़मीनी सच्चाई"})}</p>
  <h2 class="gt"><span lang="en">Ground <i>Truth</i></span><span lang="hi">ज़मीनी <i>सच्चाई</i></span></h2>
  <div class="row">${simple(G.chapters.at(-1).steps.at(-1).s)}
   <div class="cta"><a class="btn" data-magnet href="${G.PORTAL_URL}" target="_blank" rel="noopener">${L2(G.ui.openPortal)} ↗</a>
   <button class="btn ghost" data-magnet data-play>▶ ${L2(G.ui.play)}</button></div></div>
  <div class="foot"><span>${L2(G.ui.credits)}</span><button id="toOrbit">↑ ${L2(G.ui.backOrbit)}</button></div></div></section>`;
$("#ground").innerHTML=h;

/* chapter rail */
const SHORT={create:{en:"Data",hi:"डेटा"},geodatabase:{en:"Geodatabase",hi:"भू-डेटाबेस"},portal:{en:"Portal",hi:"पोर्टल"},mobile:{en:"Mobile",hi:"मोबाइल"},mapping:{en:"Mapping",hi:"मानचित्रण"},maintain:{en:"Maintenance",hi:"रखरखाव"},cycle:{en:"The cycle",hi:"चक्र"}};
$("#rail").innerHTML=G.chapters.map(c=>`<a href="#${c.id}" data-nav="${c.id}"><span>${c.closing?"∞":pad(c.n)} · ${L2(SHORT[c.id])}</span><i></i></a>`).join("");

/* ---------- smooth scroll ---------- */
const lenis=new Lenis({lerp:REDUCE?1:.085,smoothWheel:!REDUCE,wheelMultiplier:.9});
lenis.on("scroll",ScrollTrigger.update);
gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0);
const goTo=(t,o={})=>lenis.scrollTo(t,{offset:0,duration:1.4,...o});
document.addEventListener("click",e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const t=$(a.getAttribute("href"));if(!t)return;e.preventDefault();
  goTo(a.getAttribute("href")==="#orbit"?0:pageTop(t),{duration:a.getAttribute("href")==="#ground"?2.4:1.6})});
$("#toOrbit").onclick=()=>goTo(0,{duration:3.2});

/* ---------- figures: drawn at their native size, fitted into the frame ---------- */
function fitFrame(f){const w=+f.dataset.w,hh=+f.dataset.h,W=f.clientWidth,H=f.clientHeight;if(!w||!W||!H)return;
  const natural=W<700&&H>W*.85;f.classList.toggle("natural",natural);if(natural)return;   // phones: the figure lays itself out
  const s=Math.min(W/w,H/hh),ox=(W-w*s)/2,oy=(H-hh*s)/2;
  $$("iframe",f).forEach(i=>{i.style.width=w+"px";i.style.height=hh+"px";i.style.transform=`translate(${ox}px,${oy}px) scale(${s})`})}
const ro=new ResizeObserver(es=>es.forEach(en=>fitFrame(en.target)));
$$(".frame[data-w]").forEach(f=>ro.observe(f));

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

/* ---------- figure steps + achievements ---------- */
const cleared=new Set();
function toast(c){if(!c||cleared.has(c.id))return;cleared.add(c.id);
  const n=G.chapters.filter(x=>!x.closing).length,done=[...cleared].filter(id=>{const x=G.chapters.find(y=>y.id===id);return x&&!x.closing}).length;
  const t=document.createElement("div");t.className="t";
  t.innerHTML=`<i>✓</i><div><small>${L2(G.ui.cleared)}${c.closing?"":` · ${done}/${n}`}</small><b>${L2(c.name)}</b></div>`;
  $("#toast").append(t);setTimeout(()=>{t.classList.add("out");setTimeout(()=>t.remove(),500)},2600)}
function showCap(sec,i){$$(".caps .cap,.wcaps .cap",sec).forEach((k,j)=>k.classList.toggle("on",j===i))}
function figStep(sec,e,i){if(e.steps)$$(".stack iframe",sec).forEach((f,j)=>f.classList.toggle("on",j===i));
  else if(e.sync){const f=$(".frame iframe",sec),u=syncURL(e,i);if(f&&!f.src.endsWith(u.split("#")[1]))f.src=u}}

/* ---------- scenes ---------- */
const SC={};   // id → {st, stepY(i), headY()}
function setupScene(sec){const id=sec.id,stage=$(".stage",sec),N=$$(".cap",sec).length,c=G.chapters.find(x=>x.id===id),e=id==="overview"?E.overview:E[id];
  const U=1.15+N*.9,per=(U-1.15)/N,bars=$$(".sbar b",sec);let cur=0;
  const tl=gsap.timeline({defaults:{ease:"none"}});
  tl.fromTo($(".figwrap",sec),{yPercent:REDUCE?0:(innerWidth<=900?82:46),scale:REDUCE?1:.46,borderRadius:28},{yPercent:0,scale:1,borderRadius:26,duration:1},0)
    .to($(".ttl",sec),{yPercent:-70,opacity:0,duration:.75},.15)
    .fromTo([$(".caps",sec),$(".sbar",sec)],{opacity:0},{opacity:1,duration:.25},.85)
    .to({},{duration:U-1.1});
  const st=ScrollTrigger.create({trigger:stage,pin:true,start:"top top",end:()=>"+="+innerHeight*U,scrub:REDUCE?true:.5,animation:tl,anticipatePin:1,
    onUpdate:s=>{const u=s.progress*U,f=(u-1.15)/per,i=clamp(Math.floor(f),0,N-1);
      bars.forEach((b,j)=>b.style.transform=`scaleX(${j<i?1:j>i?0:clamp(f-i,0,1)})`);
      if(i!==cur){cur=i;showCap(sec,i);figStep(sec,e,i)}
      if(c&&i===N-1&&f>N-1+.4)toast(c)}});
  SC[id]={st,headY:()=>st.start+innerHeight*.05,stepY:i=>st.start+innerHeight*(1.15+(i+.5)*per)}}

/* Data Creation: sideways */
function setupTrack(){const c=G.chapters.find(x=>x.id==="create"),sec=$("#create"),row=$(".hrow",sec),N=c.steps.length,bars=$$(".hprog b",sec);
  const dist=()=>row.scrollWidth-innerWidth;
  const tl=gsap.to(row,{x:()=>-dist(),ease:"none"});
  const st=ScrollTrigger.create({trigger:$(".hstage",sec),pin:true,start:"top top",end:()=>"+="+dist()*1.15,scrub:REDUCE?true:.6,animation:tl,invalidateOnRefresh:true,anticipatePin:1,
    onUpdate:s=>{const f=s.progress*(N-1);bars.forEach((b,j)=>b.style.transform=`scaleX(${clamp(f-j+1,0,1)})`);if(f>N-1.15)toast(c)}});
  if(!REDUCE)$$(".panel",sec).forEach((p,i)=>{if(!i)return;
    gsap.from($(".cap",p),{xPercent:40,opacity:0,ease:"none",scrollTrigger:{containerAnimation:tl,trigger:p,start:"left 85%",end:"left 25%",scrub:true}});
    gsap.from($(".pfig",p),{scale:.86,rotate:1.5,ease:"none",scrollTrigger:{containerAnimation:tl,trigger:p,start:"left 100%",end:"left 20%",scrub:true}})});
  SC.create={st,headY:()=>pageTop($(".opener",sec))-innerHeight*.08,stepY:i=>st.start+(st.end-st.start)*(i/(N-1))}}

/* Live portal: the window grows */
function setupWindow(){const c=G.chapters.find(x=>x.id==="portal"),sec=$("#portal"),N=c.steps.length,U=1+N*.6,per=(U-1)/N;let cur=-2;
  const tl=gsap.timeline({defaults:{ease:"none"}});
  tl.fromTo($(".browser",sec),{scale:REDUCE?1:.62,yPercent:REDUCE?0:14},{scale:1,yPercent:0,duration:1}).to({},{duration:U-1});
  const st=ScrollTrigger.create({trigger:$(".wstage",sec),pin:true,start:"top top",end:()=>"+="+innerHeight*U,scrub:REDUCE?true:.5,animation:tl,anticipatePin:1,
    onUpdate:s=>{const u=s.progress*U,i=u<1?-1:clamp(Math.floor((u-1)/per),0,N-1);if(i!==cur){cur=i;showCap(sec,i)}if(i===N-1)toast(c)}});
  SC.portal={st,headY:()=>pageTop($(".opener",sec))-innerHeight*.08,stepY:i=>st.start+innerHeight*(1+(i+.5)*per)}}
/* pins must be created top to bottom so each one accounts for the space of those above it */
$$("#ground>section").forEach(sec=>{if(sec.matches("[data-scene]"))setupScene(sec);else if(sec.id==="create")setupTrack();else if(sec.id==="portal")setupWindow()});

/* ---------- other scroll animations ---------- */
gsap.matchMedia().add("(prefers-reduced-motion:no-preference)",()=>{
  $$(".opener .split").forEach(el=>gsap.from($$(".mask>span",el),{yPercent:115,rotate:3,duration:1.2,ease:"expo.out",stagger:.04,scrollTrigger:{trigger:el,start:"top 85%"}}));
  $$(".ttl .split").forEach(el=>gsap.from($$(".mask>span",el),{yPercent:115,rotate:3,duration:1.2,ease:"expo.out",stagger:.04,scrollTrigger:{trigger:el.closest(".scene"),start:"top 70%"}}));
  $$(".opener .num").forEach(el=>gsap.fromTo(el,{yPercent:-10},{yPercent:35,ease:"none",scrollTrigger:{trigger:el.closest("section"),start:"top bottom",end:"top top",scrub:true}}));
  $$(".lead,.label,.intro-more>*").forEach(el=>{if(el.closest(".stage"))return;gsap.from(el,{opacity:0,y:30,duration:1,ease:"power3.out",scrollTrigger:{trigger:el,start:"top 90%"}})});
  gsap.fromTo("#outro .gt",{xPercent:10},{xPercent:-12,ease:"none",scrollTrigger:{trigger:"#outro",start:"top bottom",end:"bottom top",scrub:true}});
});
/* prologue words light up as you read */
ScrollTrigger.create({trigger:"#scrub",start:"top 80%",end:"bottom 40%",scrub:true,onUpdate:s=>{const w=$$(`#scrub [lang="${lang()}"] .w`),n=Math.round(s.progress*w.length);w.forEach((x,i)=>x.style.opacity=i<n?1:.12)}});
/* marquee speeds up and leans with scroll velocity */
{const tr=$(".marq .tr");let x=0,v=0;gsap.ticker.add(()=>{if(REDUCE)return;const vel=lenis.velocity||0;v+=(Math.abs(vel)*.6-v)*.1;x-=(.7+v);const w=tr.scrollWidth/3;if(-x>w)x+=w;tr.style.transform=`translateX(${x}px) skewX(${-clamp(vel*.4,-12,12)}deg)`})}
/* level rail + ground state */
G.chapters.forEach(c=>ScrollTrigger.create({trigger:"#"+c.id,start:"top center",end:"bottom center",
  onToggle:s=>{const a=$(`#rail [data-nav="${c.id}"]`);a.classList.toggle("on",s.isActive);if(!s.isActive&&s.direction>0)a.classList.add("done")}}));
ScrollTrigger.create({trigger:"#ground",start:"top 40%",end:"bottom bottom",onToggle:s=>document.body.classList.toggle("on-ground",s.isActive)});

/* ---------- figures are played on purpose: click to take control, move away to give it back ---------- */
const cur=$("#cur"),curL=$("#curL");
function release(){$$(".frame.live").forEach(f=>f.classList.remove("live"))}
document.addEventListener("click",e=>{const s=e.target.closest(".shield");if(!s)return;const f=s.closest(".frame");release();f.classList.add("live");takeOver();
  cur.classList.add("hide");const i=$(".stack iframe.on",f)||$("iframe",f);try{i.focus()}catch(_){}});
document.addEventListener("pointerover",e=>{if(!e.target.closest(".frame.live"))release()});
document.addEventListener("pointerdown",e=>{if(!e.target.closest(".frame"))release()});
addEventListener("keydown",e=>{if(e.key==="Escape")release()});

/* ---------- pointer: cursor, magnets ---------- */
if(FINE&&!REDUCE){document.body.classList.add("has-cursor");
  const dot=$(".dot",cur),ring=$(".ring",cur),pos={x:innerWidth/2,y:innerHeight/2},rp={...pos};
  addEventListener("pointermove",e=>{pos.x=e.clientX;pos.y=e.clientY;cur.classList.remove("hide")},{passive:true});
  gsap.ticker.add(()=>{rp.x+=(pos.x-rp.x)*.18;rp.y+=(pos.y-rp.y)*.18;dot.style.transform=`translate(${pos.x}px,${pos.y}px)`;ring.style.transform=`translate(${rp.x}px,${rp.y}px)`});
  document.addEventListener("pointerover",e=>{const sh=e.target.closest(".shield"),l=!sh&&e.target.closest("a,button,[data-magnet]");
    cur.classList.toggle("big",!!sh);cur.classList.toggle("link",!!l);curL.textContent=sh?PLAY[lang()]:"";
    if(e.target.closest(".sep"))cur.classList.add("hide")});
  document.addEventListener("pointermove",e=>{const b=e.target.closest("[data-magnet]");$$("[data-magnet]").forEach(m=>{if(m!==b&&m._mag){m._mag=0;gsap.to(m,{x:0,y:0,duration:.7,ease:"elastic.out(1,.4)"})}});
    if(b){b._mag=1;const r=b.getBoundingClientRect();gsap.to(b,{x:(e.clientX-r.left-r.width/2)*.25,y:(e.clientY-r.top-r.height/2)*.35,duration:.4})}},{passive:true});
}

/* ---------- outro star field ---------- */
{const cv=$("#stars2"),x=cv.getContext("2d");let st=[],W,H,on=false;
  const rs=()=>{W=cv.width=cv.clientWidth;H=cv.height=cv.clientHeight;st=Array.from({length:Math.round(W*H/3500)},()=>[Math.random()*W,Math.random()*H,Math.random()*1.3+.2,Math.random()*6])};
  new ResizeObserver(rs).observe(cv);new IntersectionObserver(e=>on=e[0].isIntersecting).observe(cv);
  gsap.ticker.add(t=>{if(!on)return;x.clearRect(0,0,W,H);for(const s of st){x.globalAlpha=.3+.4*Math.sin(t*1.4+s[3]);x.fillStyle="#cfeee8";x.fillRect(s[0],((s[1]-lenis.scroll*.05)%H+H)%H,s[2],s[2])}})}

/* ---------- auto-play: the page flies itself through the story ---------- */
const ap={on:false,paused:false,idx:0,el:0,items:[],total:0};
function apBuild(){const it=[],orbit=$("#orbit"),chs=G.chapters;
  it.push({lab:{en:"From orbit to Raipur",hi:"कक्षा से रायपुर तक"},dur:26,travel:24,ease:t=>t,y:()=>pageTop(orbit)+orbit.offsetHeight-innerHeight});
  it.push({lab:{en:"Prologue",hi:"प्रस्तावना"},dur:8,y:()=>pageTop($("#scrub"))-innerHeight*.25});
  it.push({lab:ov.head,dur:7,y:()=>SC.overview.stepY(0)});
  const fixed=26+8+7+chs.length*3+10+7,steps=chs.filter(c=>c.id!=="portal").reduce((n,c)=>n+c.steps.length,0);
  const per=Math.max(3.5,(G.PRESENT_SECONDS-fixed)/steps);
  chs.forEach(c=>{const S=()=>SC[c.id];it.push({lab:c.name,dur:3,y:()=>S().headY()});
    c.steps.forEach((s,i)=>it.push({lab:s.t,dur:c.id==="portal"?10/c.steps.length:per,y:()=>S().stepY(i)}))});
  it.push({lab:{en:"Ground Truth",hi:"ज़मीनी सच्चाई"},dur:7,y:()=>pageTop($("#outro"))});
  ap.items=it;ap.total=it.reduce((a,b)=>a+b.dur,0);
  $("#apSegs").innerHTML=it.map(x=>`<i style="flex:${x.dur}"><b></b></i>`).join("")}
const ease3=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function apScroll(rem){const x=ap.items[ap.idx];goTo(x.y(),{duration:REDUCE?.01:Math.max(.6,(x.travel||1.4)-rem),easing:x.ease||ease3,force:true})}
function apGo(i){ap.idx=clamp(i,0,ap.items.length-1);ap.el=0;$("#apLab").innerHTML=L2(ap.items[ap.idx].lab);apScroll(0);apPaint()}
function apPaint(){const segs=$$("#apSegs i b");ap.items.forEach((x,i)=>segs[i].style.transform=`scaleX(${i<ap.idx?1:i===ap.idx?Math.min(1,ap.el/x.dur):0})`);
  let t=ap.el;for(let i=0;i<ap.idx;i++)t+=ap.items[i].dur;const f=s=>`${Math.floor(s/60)}:${pad(Math.floor(s%60))}`;$("#apTime").textContent=`${f(t)} / ${f(ap.total)}`}
gsap.ticker.add((t,dt)=>{if(!ap.on||ap.paused)return;ap.el+=dt/1000;const x=ap.items[ap.idx];
  if(ap.el>=x.dur){if(ap.idx<ap.items.length-1)apGo(ap.idx+1);else apPause(true)}else apPaint()});
function apPause(v){ap.paused=v;const b=$("#apPlay");b.textContent=v?"▶":"❚❚";b.setAttribute("aria-label",v?"Play":"Pause");document.body.classList.toggle("ap-paused",v);
  if(v)lenis.scrollTo(lenis.scroll,{immediate:true,force:true});else apScroll(ap.el)}
function apStart(){if(!ap.items.length)apBuild();release();ap.on=true;$("#ap").hidden=false;document.body.classList.add("autoplay");
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
function takeOver(){if(ap.on&&!ap.paused)apPause(true)}
addEventListener("wheel",takeOver,{passive:true});
addEventListener("touchstart",e=>{if(!e.target.closest("#ap"))takeOver()},{passive:true});
addEventListener("keydown",e=>{if(!ap.on)return;if(e.key==="Escape")return apStop();if(e.target.closest&&e.target.closest("#ap"))return;
  if(e.key===" "){e.preventDefault();$("#apPlay").click()}else if(e.key==="ArrowRight")$("#apNext").click();else if(e.key==="ArrowLeft")$("#apPrev").click();
  else if(["ArrowDown","ArrowUp","PageDown","PageUp","Home","End"].includes(e.key))takeOver()});

/* ---------- init ---------- */
let saved=null;try{saved=localStorage.getItem("gt-lang")}catch(e){}
setLang(saved||(/^hi/i.test(navigator.language)?"hi":"en"));
})();
