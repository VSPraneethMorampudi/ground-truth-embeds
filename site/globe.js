/* Opening flight: a dotted Earth with a satellite, scroll zooms down to Chhattisgarh and lands on Raipur.
   Scroll progress (0..1) of #orbit drives everything; time only drives idle motion (spin, orbit, pulses). */
(()=>{
const G=window.GEO,cv=document.getElementById("globe"),ctx=cv.getContext("2d"),sec=document.getElementById("orbit");
const REDUCE=matchMedia("(prefers-reduced-motion:reduce)").matches;
const RAIPUR=[81.63,21.25],FOCUS=[82.15,21.35],D2R=Math.PI/180;
const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,sm=t=>{t=cl(t);return t*t*(3-2*t)};
const seg=(p,a,b)=>sm((p-a)/(b-a));
const ease=t=>{t=cl(t);return t*t*t*(t*(t*6-15)+10)};
const glide=(p,a,b)=>ease((p-a)/(b-a));
let W=0,H=0,DPR=1,P=0,T=0,visible=true;
let cameraState={},capEls=null,chapterEls=null,lastHud=-1;
const cssv=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
/* space palette from the theme (defaults: teal) */
const SP={glow:"#7ff0d9",dot:"#3fd6be",dim:"#2a6b66",line:"#9ff5e4",neigh:"#5fa9a0",text:"#8fb9b2",label:"#d8fff6",star:"#cfeee8",oceanA:"#0f3a3a",oceanB:"#061517",deep:"#0b2a2b",atmo:"45,212,191"};
Object.keys(SP).forEach(k=>{const v=cssv("--sp-"+k);if(v)SP[k]=v});
let PAPER=cssv("--paper")||"#f3efe6",SPACE=cssv("--space")||"#04090b";
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
let SPR=null;const mkSpr=()=>{SPR={0:glyph("0",SP.glow,24),1:glyph("1",SP.glow,24),h0:glyph("0","#ffd48a",24),h1:glyph("1","#ffd48a",24)}};
document.fonts.ready.then(mkSpr);mkSpr();

const ringLine=(r,close=true)=>({type:close?"Polygon":"LineString",coordinates:close?[r]:r});
const stateGeo={type:"Polygon",coordinates:G.state};
const indiaGeo={type:"MultiLineString",coordinates:G.india};
const ISLES=G.india.filter(r=>{const xs=r.map(p=>p[0]),ys=r.map(p=>p[1]);return Math.max(...xs)-Math.min(...xs)<.15&&Math.max(...ys)-Math.min(...ys)<.15}).map(r=>[r.reduce((s,p)=>s+p[0],0)/r.length,r.reduce((s,p)=>s+p[1],0)/r.length]);   /* official boundary, drawn as outline */
// These GeoJSON rings wind counter-clockwise. A spherical centroid treats them
// as the rest of the Earth and can return the antipode. Find interior points
// directly in the district's planar rings instead.
function insideRing(p,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
}return inside}
function edgeDistance(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=cl(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1));
  return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)}
function interiorPoints(rings){
  const candidates=[];
  for(const ring of rings){
    const xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    for(let i=0;i<20;i++)for(let j=0;j<20;j++){
      const p=[mix(x0,x1,(i+.5)/20),mix(y0,y1,(j+.5)/20)];if(!insideRing(p,ring))continue;
      let clearance=Infinity;for(let k=0;k<ring.length;k++)clearance=Math.min(clearance,edgeDistance(p,ring[k],ring[(k+1)%ring.length]));
      candidates.push({p,clearance});
    }
  }
  return candidates.sort((a,b)=>b.clearance-a.clearance).slice(0,80).map(c=>c.p);
}
const distGeo=G.districts.map(d=>({n:d.n,r:d.r,g:{type:"MultiPolygon",coordinates:d.r.map(r=>[r])},anchors:interiorPoints(d.r)}));
let districtLabels=[],labelCacheKey="";
document.fonts.addEventListener("loadingdone",()=>{labelCacheKey=""});
/* Exact segment/rectangle clipping avoids dozens of point-in-polygon scans per
   candidate label. No boundary may cross the label, including concave edges. */
function hitsRect(a,b,r){
  let lo=0,hi=1;
  for(let axis=0;axis<2;axis++){
    const delta=b[axis]-a[axis];
    if(Math.abs(delta)<1e-12){if(a[axis]<r[axis]||a[axis]>r[axis+2])return false;continue}
    const u=(r[axis]-a[axis])/delta,v=(r[axis+2]-a[axis])/delta;
    lo=Math.max(lo,Math.min(u,v));hi=Math.min(hi,Math.max(u,v));if(lo>hi)return false;
  }
  return true;
}
function drawDistrictLabels(alpha){
  const key=[W,H,proj.scale(),...proj.rotate(),...proj.translate(),JSON.stringify(window.GT_LABEL_EXCLUSIONS||[])].join("|");
  ctx.save();ctx.globalAlpha=alpha;ctx.textAlign="center";ctx.textBaseline="middle";
  if(key!==labelCacheKey){labelCacheKey=key;districtLabels=[];
  for(const d of distGeo){
    const rings=d.r.map(r=>r.map(p=>proj(p))),inside=p=>rings.some(r=>insideRing(p,r));
    const words=d.n.toUpperCase().split(/[- ]/),wrapped=[];
    for(const word of words){if(wrapped.length&&wrapped.at(-1).length+word.length<17)wrapped[wrapped.length-1]+=' '+word;else wrapped.push(word)}
    const layouts=[[d.n.toUpperCase()]];if(wrapped.length>1)layouts.push(wrapped);
    if(words.length>wrapped.length)layouts.push(words);
    let label;
    for(let size=14;size>=10&&!label;size--){
      ctx.font=`600 ${size}px "Bricolage Grotesque",sans-serif`;
      for(const lines of layouts){
        const w=Math.max(...lines.map(s=>ctx.measureText(s).width))+10,h=lines.length*size*1.18+8;
        for(const anchor of d.anchors){
          const [x,y]=proj(anchor),rect=[x-w/2,y-h/2,x+w/2,y+h/2];
          if(rect[0]<16||rect[1]<16||rect[2]>W-16||rect[3]>H-16)continue;
          if((window.GT_LABEL_EXCLUSIONS||[]).some(r=>rect[0]<r[2]&&rect[2]>r[0]&&rect[1]<r[3]&&rect[3]>r[1]))continue;
          let fits=[[rect[0],rect[1]],[rect[2],rect[1]],[rect[2],rect[3]],[rect[0],rect[3]]].every(inside);
          if(fits&&rings.some(r=>r.some((p,j)=>hitsRect(p,r[(j+1)%r.length],rect))))fits=false;
          if(fits){label={name:d.n,x,y,rect,lines,size,rings};break}
        }
        if(label)break;
      }
    }
    if(!label)continue;
    districtLabels.push(label);
  }}
  for(const label of districtLabels){
    const rings=label.rings;ctx.font=`600 ${label.size}px "Bricolage Grotesque",sans-serif`;
    ctx.save();ctx.beginPath();for(const r of rings){ctx.moveTo(...r[0]);for(const p of r.slice(1))ctx.lineTo(...p);ctx.closePath()}ctx.clip('evenodd');
    ctx.lineWidth=4;ctx.lineJoin="round";ctx.strokeStyle=SPACE;ctx.fillStyle=SP.label;
    label.lines.forEach((line,i)=>{const y=label.y+(i-(label.lines.length-1)/2)*label.size*1.18;ctx.strokeText(line,label.x,y);ctx.fillText(line,label.x,y)});
    ctx.restore();
  }
  ctx.restore();
}
const neighGeo=G.neigh.filter(n=>n.n!=="Chhattisgarh").map(n=>({n:n.n,g:{type:"MultiPolygon",coordinates:n.r.map(r=>[r])},c:d3.geoCentroid({type:"MultiPolygon",coordinates:n.r.map(r=>[r])})}));
const stateLen=G.state[0].length;

/* HUD hooks */
const hud={alt:document.getElementById("hAlt"),lat:document.getElementById("hLat"),lon:document.getElementById("hLon"),scan:document.getElementById("hScan"),
  get caps(){return [...document.querySelectorAll("#orbit .ocap")]},title:document.querySelector("#orbit .otitle"),hudEl:document.querySelector("#orbit .hud"),lock:document.querySelector("#orbit .lock")};
let lastCap=-1;

function frame(now){requestAnimationFrame(frame);if(!visible)return;
  const dt=Math.min(.05,(now-(frame.t||now))/1000);frame.t=now;T+=REDUCE?0:dt;
  const r=sec.getBoundingClientRect(),span=sec.offsetHeight-innerHeight;P=cl(-r.top/span);
  const mobile=W<=900,m=Math.min(W,H),R0=mobile?m*.61:m*.43;
  /* A bounded idle drift hands over to one continuous logarithmic descent.
     Camera orientation must never depend on how long the reader waited in orbit. */
  const cp=REDUCE?(P<.46?0:.78):P;
  const aim=glide(cp,.04,.55),idle=(1-glide(cp,0,.12))*Math.sin(T*.09)*3;
  const lon=mix(65,FOCUS[0],aim)+idle,lat=mix(12,FOCUS[1],aim);
  const Kcg=(m*(mobile?.74:.62))/(R0*.075);
  const z1=glide(cp,.14,.80),z2=glide(cp,.76,.94);
  const K=Math.exp(Math.log(Kcg)*z1)*mix(1,1.5,z2);
  const s=R0*K;
  const shiftX=mobile?0:W*.18*(1-glide(cp,.78,.98));
  const rp0=[mix(lon,RAIPUR[0],z2),mix(lat,RAIPUR[1],z2)];
  const cx=W/2+shiftX,cy=mobile?H*.32:H*.51;
  proj.rotate([-rp0[0],-rp0[1]]).scale(s).translate([cx,cy]);
  cameraState={scale:s,zoom:K,lon:rp0[0],lat:rp0[1],cx,cy};

  ctx.setTransform(DPR,0,0,DPR,0,0);
  /* space → ground: background warms to paper as we land */
  const land=glide(P,.91,.995);
  ctx.fillStyle=SPACE;ctx.fillRect(0,0,W,H);
  /* stars */
  const sa=1-seg(K,2,6);
  if(sa>0){for(const st of stars){const a=st.a*sa*(.65+.35*Math.sin(T*1.5+st.tw));ctx.globalAlpha=a;ctx.fillStyle=SP.star;
    const x=(st.x-lon*(1+st.r)*.65+W*10)%W,y=(st.y-P*H*st.r*.11+H)%H;
    ctx.fillRect(x,y,st.r,st.r)}ctx.globalAlpha=1}
  /* atmosphere */
  if(K<4){const g=ctx.createRadialGradient(cx,cy,s*.94,cx,cy,s*1.32);g.addColorStop(0,`rgba(${SP.atmo},${.24*(1-seg(K,1.5,4))})`);g.addColorStop(.28,`rgba(${SP.atmo},${.08*(1-seg(K,1.5,4))})`);g.addColorStop(1,`rgba(${SP.atmo},0)`);
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,s*1.32,0,7);ctx.fill();
    const o=ctx.createRadialGradient(cx-s*.48,cy-s*.45,s*.02,cx+s*.18,cy+s*.12,s*1.12);o.addColorStop(0,SP.oceanA);o.addColorStop(.65,SP.oceanB);o.addColorStop(1,SPACE);
    ctx.fillStyle=o;ctx.beginPath();ctx.arc(cx,cy,s,0,7);ctx.fill()}
  else{const o=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H));o.addColorStop(0,SP.deep);o.addColorStop(1,SPACE);ctx.fillStyle=o;ctx.fillRect(0,0,W,H)}

  /* A thin sunlit rim and an orbital path add depth without an image download. */
  if(K<2.5){ctx.save();ctx.globalAlpha=.26*(1-seg(K,1.2,2.5));ctx.strokeStyle=SP.glow;ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(cx,cy,s,-2.6,-.5);ctx.stroke();
    ctx.globalAlpha*=.55;ctx.beginPath();ctx.ellipse(cx,cy,s*1.34,s*.36,-.28,0,Math.PI*2);ctx.stroke();ctx.restore()}

  /* graticule on the globe */
  if(K<6){ctx.globalAlpha=.12*(1-seg(K,3,6));ctx.strokeStyle=SP.glow;ctx.lineWidth=.6;ctx.beginPath();path(d3.geoGraticule10());ctx.stroke();ctx.globalAlpha=1}

  /* world dots */
  const aW=1-seg(K,3,7);
  if(aW>0){const rr=Math.max(.8,Math.min(2.2,s/260));ctx.fillStyle=SP.dot;
    const rot=proj.rotate(),c0=[-rot[0],-rot[1]];
    for(let i=0;i<G.globe.length;i+=2){const p=[G.globe[i],G.globe[i+1]];if(d3.geoDistance(p,c0)>1.53)continue;const q=proj(p);if(!q)continue;
      const inI=p[0]>68&&p[0]<97&&p[1]>7&&p[1]<36;ctx.globalAlpha=aW*(inI?.95:.55);ctx.fillRect(q[0]-rr/2,q[1]-rr/2,rr,rr)}ctx.globalAlpha=1}
  /* India region dots */
  const aI=seg(K,1.6,4)*(1-seg(K,14,30));
  if(aI>0){const rr=Math.max(1,Math.min(3,s/900));
    for(let i=0;i<G.ind.length;i+=3){const q=proj([G.ind[i],G.ind[i+1]]);if(!q||q[0]<-5||q[0]>W+5||q[1]<-5||q[1]>H+5)continue;
      ctx.globalAlpha=aI*(G.ind[i+2]?.8:.25);ctx.fillStyle=G.ind[i+2]?SP.dot:SP.dim;ctx.fillRect(q[0]-rr/2,q[1]-rr/2,rr,rr)}ctx.globalAlpha=1}
  /* India outline */
  const aIO=seg(K,1.4,3)*(1-seg(K,20,40));
  if(aIO>0){ctx.globalAlpha=aIO*.7;ctx.strokeStyle=SP.line;ctx.lineWidth=1;ctx.beginPath();path(indiaGeo);ctx.stroke();
    /* tiny islands (Lakshadweep, small Andaman & Nicobar islands) would vanish at this scale: mark each with a dot */
    ctx.fillStyle=SP.line;ISLES.forEach(c=>{const q=proj(c);if(q)ctx.fillRect(q[0]-1.2,q[1]-1.2,2.4,2.4)});ctx.globalAlpha=1}
  /* neighbouring states */
  const aN=seg(K,8,14);
  if(aN>0){ctx.globalAlpha=aN*.35;ctx.strokeStyle=SP.neigh;ctx.lineWidth=.8;ctx.setLineDash([3,4]);ctx.beginPath();neighGeo.forEach(n=>path(n.g));ctx.stroke();ctx.setLineDash([]);
    ctx.globalAlpha=aN*.55;ctx.fillStyle=SP.text;ctx.font=`600 ${Math.max(10,Math.min(13,W/90))}px "Bricolage Grotesque",sans-serif`;ctx.textAlign="center";
    neighGeo.forEach(n=>{const q=proj(n.c);if(q&&q[0]>40&&q[0]<W-40&&q[1]>40&&q[1]<H-40)ctx.fillText(n.n.toUpperCase(),q[0],q[1])});ctx.globalAlpha=1}
  /* Chhattisgarh: 0/1 glyph field with a scan wave from Raipur */
  const aC=seg(K,5,12);
  if(aC>0&&SPR){const px=Math.max(3,Math.min(13,s*.00105)),rq=proj(RAIPUR);
    for(let i=0;i<G.cg.length;i+=2){const q=proj([G.cg[i],G.cg[i+1]]);if(!q||q[0]<-10||q[0]>W+10||q[1]<-10||q[1]>H+10)continue;
      const d=rq?Math.hypot(q[0]-rq[0],q[1]-rq[1]):0,wave=Math.max(0,1-Math.abs(((T*240)%(m*1.2))-d)/40);
      const bit=(i*7919+((T*2)|0)*(i%5===0))%2,hot=wave>.15;
      ctx.globalAlpha=aC*(.24+.46*wave);const sp=SPR[(hot?"h":"")+bit];ctx.drawImage(sp,q[0]-px,q[1]-px,px*2,px*2)}ctx.globalAlpha=1}
  /* districts */
  const aD=seg(K,12,20);
  if(aD>0){ctx.globalAlpha=aD*.5;ctx.strokeStyle=SP.glow;ctx.lineWidth=.7;ctx.beginPath();distGeo.forEach(d=>path(d.g));ctx.stroke();
    const aL=seg(P,.74,.86);if(aL>0)drawDistrictLabels(aD*aL*.95);ctx.globalAlpha=1}
  /* state outline draws itself */
  const aS=seg(P,.3,.42);
  if(aS>0){ctx.save();ctx.shadowColor=SP.glow;ctx.shadowBlur=14;ctx.strokeStyle="#ffffff";ctx.lineWidth=Math.max(1.2,Math.min(2.4,K/8));
    const n=Math.max(2,Math.round(stateLen*aS));ctx.beginPath();path(ringLine(G.state[0].slice(0,n),false));ctx.stroke();ctx.restore()}

  /* satellite and its beam */
  const aSat=1-seg(P,.6,.72);
  if(aSat>0){const tq=proj(FOCUS)||[cx,cy];
    const th=1.2+Math.sin(T*.13)*.5*(1-glide(P,0,.2))+glide(P,0,.2)*.4,ox=cx+Math.cos(th)*s*1.34,oy=cy+Math.sin(th)*s*.36-s*.25,behind=Math.sin(th)<-.2&&Math.hypot(ox-cx,oy-cy)<s;
    const park=[cx+Math.min(W*.3,s*1.1),cy-Math.min(H*.32,s*.95)];const k=seg(P,.12,.3);
    let sx=mix(ox,park[0],k),sy=mix(oy,park[1],k);const fly=seg(P,.56,.7);sx+=fly*W*.6;sy-=fly*H*.6;
    const beam=seg(P,.2,.3)*(1-seg(P,.52,.62));
    if(beam>0){const fw=Math.max(18,Math.min(W*.18,s*.06));ctx.save();ctx.globalAlpha=beam;
      const g=ctx.createLinearGradient(sx,sy,tq[0],tq[1]);g.addColorStop(0,"rgba(255,212,138,.65)");g.addColorStop(1,"rgba(255,212,138,.05)");
      ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(tq[0]-fw,tq[1]);ctx.lineTo(tq[0]+fw,tq[1]);ctx.closePath();ctx.fill();
      ctx.strokeStyle="rgba(255,212,138,.9)";ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(tq[0],tq[1],fw,fw*.35,0,0,7);ctx.stroke();
      const sl=(T*.8)%1;ctx.strokeStyle="rgba(255,240,200,.8)";ctx.beginPath();ctx.moveTo(mix(sx,tq[0]-fw,sl),mix(sy,tq[1],sl));ctx.lineTo(mix(sx,tq[0]+fw,sl),mix(sy,tq[1],sl));ctx.stroke();ctx.restore()}
    if(!(behind&&k<.05)){ctx.save();ctx.globalAlpha=aSat;ctx.translate(sx,sy);ctx.rotate(-.5+Math.sin(T*.3)*.035);const z=Math.max(.85,Math.min(1.8,m/550))*(1+k*.3);ctx.scale(z,z);
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
  if(now-lastHud>100||lastHud<0){lastHud=now;
    if(hud.alt)hud.alt.textContent=(alt>=100?Math.round(alt).toLocaleString("en-IN"):alt.toFixed(1))+" km";
    const c=proj.rotate();if(hud.lat){hud.lat.textContent=(-c[1]).toFixed(2)+"° N";hud.lon.textContent=(((-c[0]%360)+540)%360-180).toFixed(2)+"° E"}}
  if(hud.scan)hud.scan.style.transform=`scaleX(${P})`;
  const phases=[0,.24,.46,.73,.91],ci=P<phases[1]?0:P<phases[2]?1:P<phases[3]?2:P<phases[4]?3:4;
  capEls??=hud.caps.length?hud.caps:null;
  chapterEls??=[...document.querySelectorAll("[data-orbit-stop]")];
  if(capEls)capEls.forEach((el,i)=>{
    const start=phases[i],end=phases[i+1],alpha=REDUCE?+(ci===i):(i===0?1:seg(P,start-.025,start+.025))*(1-seg(P,end-.04,end+.01));
    el.style.opacity=alpha;el.style.transform=`translateY(${(mobile?0:-50)}%) translateY(${REDUCE?0:(1-seg(P,start-.025,start+.025))*22-seg(P,end-.04,end+.01)*18}px)`;
    el.setAttribute("aria-hidden",ci!==i);
  });
  if(ci!==lastCap){lastCap=ci;hud.title?.classList.toggle("on",ci===4);hud.title?.setAttribute("aria-hidden",ci!==4);
    chapterEls.forEach((el,i)=>{if(i===Math.min(3,ci))el.setAttribute("aria-current","step");else el.removeAttribute("aria-current")});}
  const cue=document.querySelector(".ocue");if(cue)cue.style.opacity=1-seg(P,.03,.15);
  const chapters=document.querySelector(".orbit-chapters");if(chapters)chapters.style.visibility=P>.94?"hidden":"visible";
  if(hud.hudEl)hud.hudEl.style.opacity=1-land;
  document.documentElement.style.setProperty("--land",land.toFixed(3));
}
new IntersectionObserver(es=>{visible=es[0].isIntersecting},{rootMargin:"200px"}).observe(sec);
requestAnimationFrame(frame);
window.GT_ORBIT={get p(){return P},get labels(){return districtLabels},get raipur(){return proj(RAIPUR)},get camera(){return cameraState}};
})();
