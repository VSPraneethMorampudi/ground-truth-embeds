/* Opening flight: a dotted Earth with a satellite, scroll zooms down to Chhattisgarh and lands on Raipur.
   Scroll progress (0..1) of #orbit drives everything; time only drives idle motion (spin, orbit, pulses). */
(()=>{
const G=window.GEO,cv=document.getElementById("globe"),ctx=cv.getContext("2d"),sec=document.getElementById("orbit");
const REDUCE=matchMedia("(prefers-reduced-motion:reduce)").matches;
const RAIPUR=[81.63,21.25],FOCUS=[82.15,21.35],D2R=Math.PI/180;
const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,sm=t=>{t=cl(t);return t*t*(3-2*t)};
const seg=(p,a,b)=>sm((p-a)/(b-a));
let W=0,H=0,DPR=1,P=0,T=0,visible=true;
const cssv=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();let PAPER="#f3efe6",SPACE="#04090b";
setTimeout(()=>{PAPER=cssv("--paper")||PAPER;SPACE=cssv("--space")||SPACE},0);
const proj=d3.geoOrthographic().clipAngle(90).precision(.3);
const path=d3.geoPath(proj,ctx);

/* star field */
let stars=[];
function resize(){DPR=Math.min(2,devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;cv.width=W*DPR;cv.height=H*DPR;
  stars=Array.from({length:Math.round(W*H/2600)},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.2+.2,a:Math.random()*.7+.2,tw:Math.random()*6}))}
addEventListener("resize",resize);resize();

/* 0/1 glyph sprites, as in the CHiPS story identity */
function glyph(ch,col,px){const c=document.createElement("canvas");c.width=c.height=px*2;const g=c.getContext("2d");
  g.font=`500 ${px*1.5}px "Geist Mono",monospace`;g.textAlign="center";g.textBaseline="middle";g.fillStyle=col;g.fillText(ch,px,px*1.05);return c}
let SPR=null;const mkSpr=()=>{SPR={0:glyph("0","#7ff0d9",24),1:glyph("1","#7ff0d9",24),h0:glyph("0","#ffd48a",24),h1:glyph("1","#ffd48a",24)}};
document.fonts.ready.then(mkSpr);mkSpr();

const ringLine=(r,close=true)=>({type:close?"Polygon":"LineString",coordinates:close?[r]:r});
const stateGeo={type:"Polygon",coordinates:G.state};
const indiaGeo={type:"MultiPolygon",coordinates:G.india.map(r=>[r])};
const distGeo=G.districts.map(d=>({n:d.n,g:{type:"MultiPolygon",coordinates:d.r.map(r=>[r])},c:d3.geoCentroid({type:"MultiPolygon",coordinates:d.r.map(r=>[r])})}));
const neighGeo=G.neigh.filter(n=>n.n!=="Chhattisgarh").map(n=>({n:n.n,g:{type:"MultiPolygon",coordinates:n.r.map(r=>[r])},c:d3.geoCentroid({type:"MultiPolygon",coordinates:n.r.map(r=>[r])})}));
const stateLen=G.state[0].length;

/* HUD hooks */
const hud={alt:document.getElementById("hAlt"),lat:document.getElementById("hLat"),lon:document.getElementById("hLon"),scan:document.getElementById("hScan"),
  get caps(){return [...document.querySelectorAll("#orbit .ocap")]},title:document.querySelector("#orbit .otitle"),hudEl:document.querySelector("#orbit .hud"),lock:document.querySelector("#orbit .lock")};
let lastCap=-1;

function frame(now){requestAnimationFrame(frame);if(!visible)return;
  const dt=Math.min(.05,(now-(frame.t||now))/1000);frame.t=now;T+=REDUCE?0:dt;
  const r=sec.getBoundingClientRect(),span=sec.offsetHeight-innerHeight;P=cl(-r.top/span);
  const m=Math.min(W,H),R0=m*.34*(W<700?1.18:1);
  /* camera keyframes */
  const aim=seg(P,0,.32);                                   // spin → face India
  const spin=-T*9+40;                                       // idle longitude while in orbit
  const lon=mix(spin,FOCUS[0],aim),lat=mix(8,FOCUS[1],aim);
  const Kcg=(m*.7)/(R0*.075);                               // scale factor at which the state fills ~70% of the screen
  const z1=seg(P,.32,.7),z2=seg(P,.72,.95);
  const K=Math.exp(mix(0,Math.log(Kcg),z1))*mix(1,1.9,z2);
  const s=R0*K;
  const shiftX=W>900?mix(0,W*.12,seg(P,.05,.3))*(1-z1):0;  // globe sits right of the copy, then centres
  const rp0=[mix(lon,RAIPUR[0],z2),mix(lat,RAIPUR[1],z2)];
  proj.rotate([-rp0[0],-rp0[1]]).scale(s).translate([W/2+shiftX,H/2+(W<700?-H*.06:0)]);
  const cx=W/2+shiftX,cy=H/2+(W<700?-H*.06:0);

  ctx.setTransform(DPR,0,0,DPR,0,0);
  /* space → ground: background warms to paper as we land */
  const land=seg(P,.93,1);
  ctx.fillStyle=SPACE;ctx.fillRect(0,0,W,H);
  /* stars */
  const sa=1-seg(K,2,6);
  if(sa>0){for(const st of stars){const a=st.a*sa*(.65+.35*Math.sin(T*1.5+st.tw));ctx.globalAlpha=a;ctx.fillStyle="#cfeee8";
    const x=(st.x-lon*3+W*10)%W;ctx.fillRect(x,st.y,st.r,st.r)}ctx.globalAlpha=1}
  /* atmosphere */
  if(K<4){const g=ctx.createRadialGradient(cx,cy,s*.9,cx,cy,s*1.35);g.addColorStop(0,`rgba(45,212,191,${.28*(1-seg(K,1.5,4))})`);g.addColorStop(1,"rgba(45,212,191,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,s*1.35,0,7);ctx.fill();
    const o=ctx.createRadialGradient(cx-s*.3,cy-s*.35,s*.1,cx,cy,s);o.addColorStop(0,"#0f3a3a");o.addColorStop(1,"#061517");
    ctx.fillStyle=o;ctx.beginPath();ctx.arc(cx,cy,s,0,7);ctx.fill()}
  else{const o=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H));o.addColorStop(0,"#0b2a2b");o.addColorStop(1,"#04090b");ctx.fillStyle=o;ctx.fillRect(0,0,W,H)}

  /* graticule on the globe */
  if(K<6){ctx.globalAlpha=.12*(1-seg(K,3,6));ctx.strokeStyle="#7ff0d9";ctx.lineWidth=.6;ctx.beginPath();path(d3.geoGraticule10());ctx.stroke();ctx.globalAlpha=1}

  /* world dots */
  const aW=1-seg(K,3,7);
  if(aW>0){const rr=Math.max(.8,Math.min(2.2,s/260));ctx.fillStyle="#3fd6be";
    const rot=proj.rotate(),c0=[-rot[0],-rot[1]];
    for(let i=0;i<G.globe.length;i+=2){const p=[G.globe[i],G.globe[i+1]];if(d3.geoDistance(p,c0)>1.53)continue;const q=proj(p);if(!q)continue;
      const inI=p[0]>68&&p[0]<97&&p[1]>7&&p[1]<36;ctx.globalAlpha=aW*(inI?.95:.55);ctx.fillRect(q[0]-rr/2,q[1]-rr/2,rr,rr)}ctx.globalAlpha=1}
  /* India region dots */
  const aI=seg(K,1.6,4)*(1-seg(K,14,30));
  if(aI>0){const rr=Math.max(1,Math.min(3,s/900));
    for(let i=0;i<G.ind.length;i+=3){const q=proj([G.ind[i],G.ind[i+1]]);if(!q||q[0]<-5||q[0]>W+5||q[1]<-5||q[1]>H+5)continue;
      ctx.globalAlpha=aI*(G.ind[i+2]?.8:.25);ctx.fillStyle=G.ind[i+2]?"#3fd6be":"#2a6b66";ctx.fillRect(q[0]-rr/2,q[1]-rr/2,rr,rr)}ctx.globalAlpha=1}
  /* India outline */
  const aIO=seg(K,1.4,3)*(1-seg(K,20,40));
  if(aIO>0){ctx.globalAlpha=aIO*.7;ctx.strokeStyle="#9ff5e4";ctx.lineWidth=1;ctx.beginPath();path(indiaGeo);ctx.stroke();ctx.globalAlpha=1}
  /* neighbouring states */
  const aN=seg(K,8,14);
  if(aN>0){ctx.globalAlpha=aN*.35;ctx.strokeStyle="#5fa9a0";ctx.lineWidth=.8;ctx.setLineDash([3,4]);ctx.beginPath();neighGeo.forEach(n=>path(n.g));ctx.stroke();ctx.setLineDash([]);
    ctx.globalAlpha=aN*.55;ctx.fillStyle="#8fb9b2";ctx.font=`600 ${Math.max(10,Math.min(13,W/90))}px "Bricolage Grotesque",sans-serif`;ctx.textAlign="center";
    neighGeo.forEach(n=>{const q=proj(n.c);if(q&&q[0]>40&&q[0]<W-40&&q[1]>40&&q[1]<H-40)ctx.fillText(n.n.toUpperCase(),q[0],q[1])});ctx.globalAlpha=1}
  /* Chhattisgarh: 0/1 glyph field with a scan wave from Raipur */
  const aC=seg(K,5,12);
  if(aC>0&&SPR){const px=Math.max(3,Math.min(13,s*.00105)),rq=proj(RAIPUR);
    for(let i=0;i<G.cg.length;i+=2){const q=proj([G.cg[i],G.cg[i+1]]);if(!q||q[0]<-10||q[0]>W+10||q[1]<-10||q[1]>H+10)continue;
      const d=rq?Math.hypot(q[0]-rq[0],q[1]-rq[1]):0,wave=Math.max(0,1-Math.abs(((T*240)%(m*1.2))-d)/40);
      const bit=(i*7919+((T*2)|0)*(i%5===0))%2,hot=wave>.15;
      ctx.globalAlpha=aC*(.45+.55*wave);const sp=SPR[(hot?"h":"")+bit];ctx.drawImage(sp,q[0]-px,q[1]-px,px*2,px*2)}ctx.globalAlpha=1}
  /* districts */
  const aD=seg(K,12,20);
  if(aD>0){ctx.globalAlpha=aD*.5;ctx.strokeStyle="#7ff0d9";ctx.lineWidth=.7;ctx.beginPath();distGeo.forEach(d=>path(d.g));ctx.stroke();
    const aL=seg(P,.74,.86);if(aL>0){ctx.globalAlpha=aD*aL*.75;ctx.fillStyle="#d8fff6";ctx.font=`600 ${Math.max(9,Math.min(12,W/110))}px "Bricolage Grotesque",sans-serif`;ctx.textAlign="center";
      distGeo.forEach(d=>{const q=proj(d.c);if(q&&q[0]>20&&q[0]<W-20&&q[1]>20&&q[1]<H-20)ctx.fillText(d.n.toUpperCase(),q[0],q[1])})}ctx.globalAlpha=1}
  /* state outline draws itself */
  const aS=seg(P,.3,.42);
  if(aS>0){ctx.save();ctx.shadowColor="#7ff0d9";ctx.shadowBlur=14;ctx.strokeStyle="#e8fffa";ctx.lineWidth=Math.max(1.2,Math.min(2.4,K/8));
    const n=Math.max(2,Math.round(stateLen*aS));ctx.beginPath();path(ringLine(G.state[0].slice(0,n),false));ctx.stroke();ctx.restore()}

  /* satellite and its beam */
  const aSat=1-seg(P,.6,.72);
  if(aSat>0){const tq=proj(FOCUS)||[cx,cy];
    const th=T*.55,ox=cx+Math.cos(th)*s*1.45,oy=cy+Math.sin(th)*s*.38-s*.25,behind=Math.sin(th)<-.2&&Math.hypot(ox-cx,oy-cy)<s;
    const park=[cx+Math.min(W*.3,s*1.1),cy-Math.min(H*.32,s*.95)];const k=seg(P,.12,.3);
    let sx=mix(ox,park[0],k),sy=mix(oy,park[1],k);const fly=seg(P,.56,.7);sx+=fly*W*.6;sy-=fly*H*.6;
    const beam=seg(P,.2,.3)*(1-seg(P,.52,.62));
    if(beam>0){const fw=Math.max(18,Math.min(W*.18,s*.06));ctx.save();ctx.globalAlpha=beam;
      const g=ctx.createLinearGradient(sx,sy,tq[0],tq[1]);g.addColorStop(0,"rgba(255,212,138,.65)");g.addColorStop(1,"rgba(255,212,138,.05)");
      ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(tq[0]-fw,tq[1]);ctx.lineTo(tq[0]+fw,tq[1]);ctx.closePath();ctx.fill();
      ctx.strokeStyle="rgba(255,212,138,.9)";ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(tq[0],tq[1],fw,fw*.35,0,0,7);ctx.stroke();
      const sl=(T*.8)%1;ctx.strokeStyle="rgba(255,240,200,.8)";ctx.beginPath();ctx.moveTo(mix(sx,tq[0]-fw,sl),mix(sy,tq[1],sl));ctx.lineTo(mix(sx,tq[0]+fw,sl),mix(sy,tq[1],sl));ctx.stroke();ctx.restore()}
    if(!(behind&&k<.05)){ctx.save();ctx.globalAlpha=aSat;ctx.translate(sx,sy);ctx.rotate(-.5+Math.sin(T)*.05);const z=Math.max(.7,Math.min(1.6,m/700))*(1+k*.5);ctx.scale(z,z);
      ctx.fillStyle="#1f5f8a";ctx.strokeStyle="#9fd3ff";ctx.lineWidth=.8;
      for(const d of [-1,1]){ctx.beginPath();ctx.rect(d*12-(d<0?26:0),-6,26,12);ctx.fill();ctx.stroke();
        ctx.beginPath();for(let j=1;j<4;j++){const x=d*12+(d<0?-26:0)+j*6.5;ctx.moveTo(x,-6);ctx.lineTo(x,6)}ctx.stroke();ctx.fillStyle="#1f5f8a"}
      ctx.fillStyle="#e9e3d4";ctx.fillRect(-9,-8,18,16);ctx.fillStyle="#c9a24a";ctx.fillRect(-9,-8,18,4);
      ctx.fillStyle="#2b2b30";ctx.beginPath();ctx.arc(0,10,4,0,7);ctx.fill();
      ctx.fillStyle=`rgba(255,90,70,${.5+.5*Math.sin(T*6)})`;ctx.beginPath();ctx.arc(7,-10,1.8,0,7);ctx.fill();ctx.restore()}}

  /* Raipur pin, reticle */
  const aP=seg(P,.7,.78);
  if(aP>0){const q=proj(RAIPUR);if(q){const drop=(1-sm((P-.7)/.06))*80;ctx.save();ctx.globalAlpha=aP;
    for(let j=0;j<3;j++){const ph=((T*.7+j/3)%1);ctx.strokeStyle=`rgba(255,180,90,${(1-ph)*.8})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(q[0],q[1],6+ph*60,0,7);ctx.stroke()}
    ctx.fillStyle="#ffb45a";ctx.beginPath();ctx.arc(q[0],q[1]-drop,6,0,7);ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.stroke();
    const lk=seg(P,.76,.86),g=mix(90,26,lk);ctx.strokeStyle=`rgba(255,255,255,${.4+.6*lk})`;ctx.lineWidth=1.5;
    for(const[a,b]of[[-1,-1],[1,-1],[1,1],[-1,1]]){ctx.beginPath();ctx.moveTo(q[0]+a*g,q[1]+b*(g-10));ctx.lineTo(q[0]+a*g,q[1]+b*g);ctx.lineTo(q[0]+a*(g-10),q[1]+b*g);ctx.stroke()}
    ctx.restore();
    if(hud.lock){hud.lock.style.opacity=lk*(1-seg(P,.88,.93));hud.lock.style.transform=`translate(${q[0]+34}px,${q[1]-40}px)`}}}
  else if(hud.lock)hud.lock.style.opacity=0;

  /* landing: paper rises */
  if(land>0){ctx.globalAlpha=land;ctx.fillStyle=PAPER;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1}

  /* HUD */
  const alt=Math.max(.4,35786/Math.pow(K,1.55)/mix(1,2.2,z2));
  if(hud.alt)hud.alt.textContent=(alt>=100?Math.round(alt).toLocaleString("en-IN"):alt.toFixed(1))+" km";
  const c=proj.rotate();if(hud.lat){hud.lat.textContent=(-c[1]).toFixed(2)+"° N";hud.lon.textContent=(((-c[0]%360)+540)%360-180).toFixed(2)+"° E"}
  if(hud.scan)hud.scan.style.transform=`scaleX(${P})`;
  const ci=P<.2?0:P<.42?1:P<.7?2:P<.88?3:4;
  if(ci!==lastCap&&hud.caps.length){lastCap=ci;hud.caps.forEach((e,i)=>e.classList.toggle("on",i===ci));hud.title&&hud.title.classList.toggle("on",ci===4)}
  if(hud.hudEl)hud.hudEl.style.opacity=1-land;
  document.documentElement.style.setProperty("--land",land.toFixed(3));
}
new IntersectionObserver(es=>{visible=es[0].isIntersecting},{rootMargin:"200px"}).observe(sec);
requestAnimationFrame(frame);
window.GT_ORBIT={get p(){return P}};
})();
