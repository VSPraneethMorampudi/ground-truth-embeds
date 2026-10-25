/* FX: the feel layer. Buttons (rolling label, fill from the cursor, springy press), cards (tilt + glare),
   game juice (particle bursts, floating +1, soft synthesised sounds, phone vibration), number count-ups.
   Everything enhances by class through event delegation, so panels the game builds later get it too. */
(()=>{
const REDUCE=matchMedia("(prefers-reduced-motion:reduce)").matches,FINE=matchMedia("(pointer:fine)").matches;
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const FX=window.FX={last:{x:innerWidth/2,y:innerHeight/2,t:0}};

/* ---------- buttons: rolling label + arrow hop ---------- */
const BTN=".btn,.lv-show,.g-exit,.ask button,.acts button,.search button";
function roll(b){if(b.dataset.fx||b.closest("#ap"))return;b.dataset.fx=1;
  const html=b.innerHTML;b.innerHTML=`<span class="roll"><span class="ra">${html}</span><span class="rb" aria-hidden="true">${html}</span></span>`}
function enhance(root=document){$$(BTN,root).forEach(roll)}
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType!==1)return;if(n.matches&&n.matches(BTN))roll(n);enhance(n)}))).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener("DOMContentLoaded",()=>enhance());

/* fill grows from where the cursor entered */
document.addEventListener("pointerover",e=>{const b=e.target.closest(".btn,.lv-show");if(!b||b.contains(e.relatedTarget))return;
  const r=b.getBoundingClientRect();b.style.setProperty("--fx",e.clientX-r.left+"px");b.style.setProperty("--fy",e.clientY-r.top+"px")});
document.addEventListener("pointerout",e=>{const b=e.target.closest(".btn,.lv-show");if(!b||b.contains(e.relatedTarget))return;
  const r=b.getBoundingClientRect();b.style.setProperty("--fx",e.clientX-r.left+"px");b.style.setProperty("--fy",e.clientY-r.top+"px")});

/* ---------- cards: 3D tilt with glare ---------- */
const CARD=".file,.rec,.pinc,.sheet,.upd,.themes button,.end-stats div,.phone,.bin";
if(FINE&&!REDUCE){
  let cur=null;
  document.addEventListener("pointermove",e=>{const c=e.target.closest(CARD);
    if(cur&&cur!==c){cur.style.removeProperty("--rx");cur.style.removeProperty("--ry");cur.classList.remove("fx-on");cur=null}
    if(!c||c.classList.contains("gone")||e.buttons)return;cur=c;c.classList.add("fx-tilt","fx-on");
    const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height,k=c.matches(".phone")?4:8;
    c.style.setProperty("--rx",((.5-y)*k).toFixed(2)+"deg");c.style.setProperty("--ry",((x-.5)*k).toFixed(2)+"deg");
    c.style.setProperty("--gx",(x*100).toFixed(1)+"%");c.style.setProperty("--gy",(y*100).toFixed(1)+"%")},{passive:true});
}
document.addEventListener("pointerdown",e=>{FX.last={x:e.clientX,y:e.clientY,t:performance.now()};
  const c=e.target.closest(CARD+","+BTN);if(c){c.classList.add("fx-press");setTimeout(()=>c.classList.remove("fx-press"),180)}
  if(e.target.closest(BTN+",.file,.bin,.sheet,.swatches button,[data-l]"))FX.sound("tap")},{passive:true});

/* ---------- sound: tiny Web Audio synth, no files ---------- */
let ctx=null,muted=false;try{muted=localStorage.getItem("gt-mute")==="1"}catch(e){}
FX.muted=()=>muted;
FX.mute=v=>{muted=v;try{localStorage.setItem("gt-mute",v?"1":"0")}catch(e){}document.documentElement.classList.toggle("fx-muted",v)};
document.documentElement.classList.toggle("fx-muted",muted);
function ac(){if(!ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ctx=new A()}if(ctx.state==="suspended")ctx.resume();return ctx}
function tone(f,t0,d,{type="sine",g=.12,slide=0}={}){const a=ac();if(!a)return;const o=a.createOscillator(),v=a.createGain(),t=a.currentTime+t0;
  o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(f*slide,t+d);
  v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(g,t+.008);v.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(v).connect(a.destination);o.start(t);o.stop(t+d+.02)}
function noise(t0,d,g=.06){const a=ac();if(!a)return;const n=a.sampleRate*d,b=a.createBuffer(1,n,a.sampleRate),ch=b.getChannelData(0);for(let i=0;i<n;i++)ch[i]=(Math.random()*2-1)*(1-i/n);
  const s=a.createBufferSource(),f=a.createBiquadFilter(),v=a.createGain(),t=a.currentTime+t0;s.buffer=b;f.type="bandpass";f.frequency.setValueAtTime(400,t);f.frequency.exponentialRampToValueAtTime(2400,t+d);
  v.gain.value=g;s.connect(f).connect(v).connect(a.destination);s.start(t)}
FX.sound=k=>{if(muted||!document.documentElement.classList.contains("in-game"))return;
  if(k==="tap")tone(880,0,.05,{type:"triangle",g:.05});
  if(k==="good"){tone(660,0,.12,{type:"triangle",g:.09});tone(990,.07,.16,{type:"triangle",g:.08})}
  if(k==="bad"){tone(180,0,.22,{type:"square",g:.04,slide:.7})}
  if(k==="done"){[523,659,784].forEach((f,i)=>tone(f,i*.08,.25,{type:"triangle",g:.08}))}
  if(k==="badge"){[523,659,784,1047].forEach((f,i)=>tone(f,i*.09,.35,{type:"triangle",g:.09}));tone(2093,.4,.6,{g:.03})}
  if(k==="whoosh")noise(0,.35,.05)};
FX.buzz=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};

/* ---------- particles: burst + floating text ---------- */
let layer=null;const L=()=>layer||(layer=Object.assign(document.body.appendChild(document.createElement("div")),{className:"fx-layer"}));
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
FX.at=(el)=>{if(el&&el.getBoundingClientRect){const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}}
  return performance.now()-FX.last.t<1500?FX.last:{x:innerWidth*.72,y:innerHeight*.3}};
FX.burst=(p,{n=14,colors}={})=>{if(REDUCE)return;colors=colors||[css("--accent"),css("--cta"),css("--ok"),css("--teal")];
  for(let i=0;i<n;i++){const s=document.createElement("i");s.className="fx-bit"+(i%3?"":" sq");const a=Math.random()*Math.PI*2,d=40+Math.random()*70;
    s.style.cssText=`left:${p.x}px;top:${p.y}px;background:${colors[i%colors.length]};--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d-30}px;--r:${Math.random()*540-270}deg;animation-delay:${Math.random()*40}ms`;
    L().appendChild(s);setTimeout(()=>s.remove(),1200)}};
FX.float=(p,txt,cls="")=>{const s=document.createElement("b");s.className="fx-float "+cls;s.textContent=txt;s.style.left=p.x+"px";s.style.top=p.y+"px";L().appendChild(s);setTimeout(()=>s.remove(),1300)};

/* game-level helpers */
FX.good=el=>{const p=FX.at(el);FX.burst(p,{n:10});FX.float(p,"+1");FX.sound("good");FX.buzz(12)};
FX.bad=el=>{const p=FX.at(el);FX.float(p,"✕","bad");FX.sound("bad");FX.buzz([40,30,40])};
FX.badge=()=>{FX.sound("badge");FX.buzz([20,40,20]);const p={x:innerWidth/2,y:innerHeight/2};FX.burst(p,{n:28});setTimeout(()=>FX.burst(p,{n:18}),180)};

/* ---------- count up numbers ---------- */
FX.count=(el,to,{suffix="",dur=900}={})=>{if(REDUCE){el.textContent=to+suffix;return}const t0=performance.now();
  const f=n=>{const k=Math.min(1,(n-t0)/dur),e=1-Math.pow(1-k,3);el.textContent=Math.round(to*e)+suffix;if(k<1)requestAnimationFrame(f)};requestAnimationFrame(f)};
})();
