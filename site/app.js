(()=>{
const G=window.GT,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const REDUCE=matchMedia("(prefers-reduced-motion:reduce)").matches,FINE=matchMedia("(pointer:fine)").matches;
const L2=o=>o?`<span lang="en">${o.en}</span><span lang="hi">${o.hi}</span>`:"";
const simple=o=>o?`<div class="simple"><b>${L2(G.ui.simple)}</b><span>${L2(o)}</span></div>`:"";
const pad=n=>String(n).padStart(2,"0");
const pageTop=el=>el.getBoundingClientRect().top+window.scrollY;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
gsap.registerPlugin(ScrollTrigger);
const game=()=>window.GTGame;

/* ---------- language ---------- */
function setLang(l){const h=document.documentElement;h.dataset.lang=l;h.lang=l;
  $$("[data-setlang]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.setlang===l));
  try{localStorage.setItem("gt-lang",l)}catch(e){}
  game()&&game().relang();requestAnimationFrame(()=>ScrollTrigger.refresh())}
document.addEventListener("click",e=>{const b=e.target.closest("[data-setlang]");if(b)setLang(b.dataset.setlang)});

/* ---------- orbit copy ---------- */
const C=G.cover;
$("#ocaps").innerHTML=G.orbit.map(o=>`<div class="ocap"><div class="k">${L2(o.k)}</div><p>${L2(o.t)}</p></div>`).join("");
$("#oKick").innerHTML=L2(C.kicker);
$("#oTitle").innerHTML=`<span lang="en">Ground <i>Truth</i></span><span lang="hi">ज़मीनी <i>सच्चाई</i></span>`;
$("#oSub").innerHTML=L2(C.sub);
$("#oBegin").innerHTML=L2({en:"Play the game",hi:"खेल खेलें"})+" ↓";
$("#oBegin").setAttribute("href","#game");
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
const lenis=new Lenis({lerp:REDUCE?1:.085,smoothWheel:!REDUCE,wheelMultiplier:.9});
lenis.on("scroll",ScrollTrigger.update);
gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0);
const goTo=(t,o={})=>lenis.scrollTo(t,{offset:0,duration:1.4,...o});
document.addEventListener("click",e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const t=$(a.getAttribute("href"));if(!t)return;e.preventDefault();
  goTo(a.getAttribute("href")==="#orbit"?0:pageTop(t),{duration:a.getAttribute("href")==="#game"?2.2:1.6})});
$("#toOrbit").onclick=()=>goTo(0,{duration:3.2});

/* ---------- the game takes the whole screen while it is played ---------- */
window.GT_HOOKS={
  lock(){goTo(pageTop($("#game")),{duration:.9,force:true});setTimeout(()=>{lenis.stop();document.documentElement.classList.add("in-game")},950)},
  unlock(){document.documentElement.classList.remove("in-game");lenis.start()},
  finish(user){if(ap.on&&!ap.paused&&ap.items[ap.idx].game){apGo(ap.idx+1)}else if(user)goTo(pageTop($("#outro")),{duration:1.6})}};

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
splitChars($("#oTitle"));splitChars($("#outro .gt"));
gsap.matchMedia().add("(prefers-reduced-motion:no-preference)",()=>{
  /* the game opens like a curtain as it scrolls in */
  gsap.fromTo("#game",{clipPath:"inset(7% 4% 0% 4% round 56px)"},{clipPath:"inset(0% 0% 0% 0% round 0px)",ease:"none",scrollTrigger:{trigger:"#game",start:"top bottom",end:"top top",scrub:true}});
  addEventListener("gt-game-ready",()=>gsap.from("#game .g-start-in>*",{y:70,opacity:0,stagger:.09,duration:1.2,ease:"expo.out",scrollTrigger:{trigger:"#game",start:"top 55%"}}),{once:true});
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

/* ---------- auto-play: flight, then the game plays itself, then the ending (≈3 min) ---------- */
const ap={on:false,paused:false,idx:0,el:0,items:[],total:0};
function apBuild(){const orbit=$("#orbit");
  ap.items=[{lab:{en:"From orbit to Raipur",hi:"कक्षा से रायपुर तक"},dur:24,travel:22,ease:t=>t,y:()=>pageTop(orbit)+orbit.offsetHeight-innerHeight},
    {lab:{en:"The game plays itself",hi:"खेल अपने आप चलता है"},dur:148,game:true,y:()=>pageTop($("#game"))},
    {lab:{en:"Ground Truth",hi:"ज़मीनी सच्चाई"},dur:8,y:()=>pageTop($("#outro"))}];
  ap.total=ap.items.reduce((a,b)=>a+b.dur,0);$("#apSegs").innerHTML=ap.items.map(x=>`<i style="flex:${x.dur}"><b></b></i>`).join("")}
const ease3=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function apGo(i){ap.idx=clamp(i,0,ap.items.length-1);ap.el=0;const x=ap.items[ap.idx];$("#apLab").innerHTML=L2(x.lab);
  if(x.game){const g=game();if(g)g.start(true)}
  else{GT_HOOKS.unlock();goTo(x.y(),{duration:REDUCE?.01:(x.travel||1.6),easing:x.ease||ease3,force:true})}apPaint()}
function apPaint(){const segs=$$("#apSegs i b");ap.items.forEach((x,i)=>segs[i].style.transform=`scaleX(${i<ap.idx?1:i===ap.idx?Math.min(1,ap.el/x.dur):0})`);
  let t=ap.el;for(let i=0;i<ap.idx;i++)t+=ap.items[i].dur;t=Math.min(t,ap.total);const f=s=>`${Math.floor(s/60)}:${pad(Math.floor(s%60))}`;$("#apTime").textContent=`${f(t)} / ${f(ap.total)}`}
gsap.ticker.add((t,dt)=>{if(!ap.on||ap.paused)return;ap.el+=dt/1000;const x=ap.items[ap.idx];
  if(x.game){apPaint();return}   // the game says when it is done
  if(ap.el>=x.dur){if(ap.idx<ap.items.length-1)apGo(ap.idx+1);else apPause(true)}else apPaint()});
function apPause(v){ap.paused=v;const b=$("#apPlay");b.textContent=v?"▶":"❚❚";b.setAttribute("aria-label",v?"Play":"Pause");document.body.classList.toggle("ap-paused",v);
  const x=ap.items[ap.idx],g=game();
  if(x&&x.game&&g){g.setPaused(v);g.watch=!v;if(!v)g.autoRun()}
  else if(v)lenis.scrollTo(lenis.scroll,{immediate:true,force:true});else if(x)goTo(x.y(),{duration:Math.max(.6,(x.travel||1.6)-ap.el),easing:x.ease||ease3,force:true})}
function apStart(){if(!ap.items.length)apBuild();ap.on=true;$("#ap").hidden=false;document.body.classList.add("autoplay");
  $(".ap-hint").innerHTML=L2(G.ui.paused);ap.paused=false;$("#apPlay").textContent="❚❚";document.body.classList.remove("ap-paused");apGo(0)}
function apStop(){ap.on=false;$("#ap").hidden=true;document.body.classList.remove("autoplay","ap-paused");const g=game();if(g){g.watch=false;g.setPaused(false)}
  lenis.scrollTo(lenis.scroll,{immediate:true,force:true});if(document.fullscreenElement)document.exitFullscreen().catch(()=>{})}
document.addEventListener("click",e=>{if(e.target.closest("[data-play]"))apStart()});
$("#apPlay").onclick=()=>{if(ap.paused&&ap.idx===ap.items.length-1&&ap.el>=ap.items[ap.idx].dur){location.hash="play";location.reload();return}apPause(!ap.paused)};
$("#apNext").onclick=()=>{if(ap.items[ap.idx].game&&game())game().go(game().lv+1);else apGo(ap.idx+1);if(ap.paused)apPause(false)};
$("#apPrev").onclick=()=>{apGo(ap.el>1.5?ap.idx:ap.idx-1);if(ap.paused)apPause(false)};
$("#apSegs").onclick=e=>{const i=$$("#apSegs i").indexOf(e.target.closest("i"));if(i>=0){apGo(i);if(ap.paused)apPause(false)}};
$("#apStop").onclick=apStop;
$("#apFull").onclick=()=>{const d=document.documentElement;document.fullscreenElement?document.exitFullscreen():d.requestFullscreen&&d.requestFullscreen().catch(()=>{})};
/* the reader takes over: pause and hand over (inside the game, a click on the world or panel counts) */
function takeOver(){if(ap.on&&!ap.paused)apPause(true)}
addEventListener("wheel",e=>{if(!e.target.closest("#game"))takeOver()},{passive:true});
addEventListener("touchstart",e=>{if(!e.target.closest("#ap"))takeOver()},{passive:true});
addEventListener("pointerdown",e=>{if(e.target.closest("#game")&&!e.target.closest("#ap,.g-start"))takeOver()});
addEventListener("keydown",e=>{if(!ap.on)return;if(e.key==="Escape")return apStop();if(e.target.closest&&e.target.closest("#ap"))return;
  if(e.key===" "){e.preventDefault();$("#apPlay").click()}else if(e.key==="ArrowRight")$("#apNext").click();else if(e.key==="ArrowLeft")$("#apPrev").click();
  else if(["ArrowDown","ArrowUp","PageDown","PageUp","Home","End"].includes(e.key))takeOver()});

/* ---------- init ---------- */
let saved=null;try{saved=localStorage.getItem("gt-lang")}catch(e){}
setLang(saved||(/^hi/i.test(navigator.language)?"hi":"en"));
})();
