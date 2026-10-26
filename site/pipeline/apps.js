/* Working mock-ups of the three apps that use the Geoportal's data, drawn as HTML onto the 3D devices in Explore:
   a field survey app (phone), a coverage dashboard (tablet) and a department desktop GIS (laptop).
   Geography is real (window.GEO); counts and coverage values are samples. */
import {measure,DAMS,SCHOOLS,HEALTH,STATIONS} from "./files.js?v=202610261120";
const G=()=>window.GEO,D2R=Math.PI/180;
const bb=pts=>pts.reduce((b,[x,y])=>[Math.min(b[0],x),Math.min(b[1],y),Math.max(b[2],x),Math.max(b[3],y)],[1e9,1e9,-1e9,-1e9]);
function proj(b,W,H,p=8){const cx=Math.cos((b[1]+b[3])/2*D2R),sx=(b[2]-b[0])*cx,sy=b[3]-b[1],s=Math.min((W-2*p)/sx,(H-2*p)/sy),ox=(W-sx*s)/2,oy=(H-sy*s)/2;
  const f=(lo,la)=>[ox+(lo-b[0])*cx*s,oy+(b[3]-la)*s];f.inv=(x,y)=>[b[0]+(x-ox)/(cx*s),b[3]-(y-oy)/s];return f}
const pth=(rings,f)=>rings.map(r=>"M"+r.map(p=>f(p[0],p[1]).map(v=>v.toFixed(1)).join(",")).join("L")+"Z").join("");
const ln=(pts,f)=>"M"+pts.map(p=>f(p[0],p[1]).map(v=>v.toFixed(1)).join(",")).join("L");
const CG=[80.2,17.75,84.45,24.15];
const hash=s=>{let h=7;for(const c of s)h=(h*31+c.charCodeAt(0))%10007;return h};
const SVGNS='xmlns="http://www.w3.org/2000/svg"';

/* ---------- field app (390 × 809) ---------- */
function fieldApp(el){const d=G().districts.find(x=>x.n==="Raipur"),b=bb(d.r.flat()),W=390,H=372,f=proj([b[0]-.05,b[1]-.05,b[2]+.05,b[3]+.05],W,H,0);
  const pts=[[81.7236,21.1804,"#2f6fd6"],[81.7542,20.9871,"#2f6fd6"],[81.7531,20.9902,"#d2423a"],[81.6122,21.041,"#d2423a"],[81.66,21.05,"#e39a1f"]];
  let cur=[81.6296,21.2514],layer=0,photo=false,pending=3;const L=[["School","#2f6fd6"],["Health","#d2423a"],["Anganwadi","#e39a1f"]];
  el.innerHTML=`<div class="fa"><div class="fa-st"><b>9:41</b><i class="fa-isl"></i><span><svg viewBox="0 0 18 12" width="18" height="12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg viewBox="0 0 16 12" width="16" height="12"><path d="M8 11.5 5.6 9a3.4 3.4 0 0 1 4.8 0zM3.4 6.8a6.5 6.5 0 0 1 9.2 0l-1.5 1.5a4.4 4.4 0 0 0-6.2 0zM1.2 4.6a9.6 9.6 0 0 1 13.6 0l-1.5 1.5a7.5 7.5 0 0 0-10.6 0z"/></svg><span class="fa-bat"><i></i></span><b>78</b></span></div>
    <header class="fa-bar"><b>CG Field Survey</b><span class="fa-off" id="faOff"></span></header>
    <div class="fa-map"><svg viewBox="0 0 ${W} ${H}" ${SVGNS}><rect width="${W}" height="${H}" fill="#e8eef5"/>
      ${G().districts.map(x=>`<path d="${pth(x.r,f)}" fill="${x===d?"#fff":"#f2f5f9"}" stroke="#b9c6d6" stroke-width="${x===d?2:1}"/>`).join("")}
      ${G().rivers.map(r=>`<path d="${ln(r.p,f)}" fill="none" stroke="#7fb3e0" stroke-width="3"/>`).join("")}
      ${G().roads.map(r=>`<path d="${ln(r.p,f)}" fill="none" stroke="#e7a57c" stroke-width="3"/>`).join("")}
      ${G().rail.map(r=>`<path d="${ln(r.p,f)}" fill="none" stroke="#6b7480" stroke-width="2" stroke-dasharray="5 4"/>`).join("")}
      <g id="faPts">${pts.map(p=>{const q=f(p[0],p[1]);return`<circle cx="${q[0]}" cy="${q[1]}" r="6" fill="${p[2]}" stroke="#fff" stroke-width="2"/>`}).join("")}</g>
      <g id="faMe"><circle r="22" fill="#2f6fd633"/><circle r="8" fill="#2f6fd6" stroke="#fff" stroke-width="3"/></g></svg>
      <span class="fa-hint">Tap the map to place the point</span><span class="fa-dist">Raipur district</span></div>
    <div class="fa-sheet"><small>NEW FEATURE</small><div class="fa-chips" id="faL"></div>
      <label>Name<input id="faN" value="GPS Mana" autocomplete="off"></label>
      <div class="fa-row"><button class="fa-ph" id="faPh">📷 Add photo</button><div class="fa-xy"><b id="faXY"></b><span>GPS ±3 m · EPSG:4326</span></div></div>
      <div class="fa-row"><button class="fa-go" id="faGo">Capture point</button><button class="fa-sync" id="faSy">Sync</button></div></div><i class="fa-home"></i></div>`;
  const $=s=>el.querySelector(s),me=$("#faMe"),svg=$("svg");
  const paint=()=>{const q=f(...cur);me.setAttribute("transform",`translate(${q[0]},${q[1]})`);$("#faXY").textContent=`${cur[1].toFixed(4)} N  ${cur[0].toFixed(4)} E`;
    $("#faL").innerHTML=L.map(([n,c],i)=>`<button data-l="${i}" class="${i===layer?"on":""}" style="--c:${c}">${n}</button>`).join("");
    $("#faOff").textContent=pending?`Offline · ${pending} pending`:"Synced ✓";$("#faOff").classList.toggle("ok",!pending);$("#faPh").classList.toggle("on",photo);$("#faPh").textContent=photo?"✓ Photo added":"📷 Add photo"};
  svg.addEventListener("click",e=>{const r=svg.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H;cur=f.inv(x,y);paint()});
  el.addEventListener("click",e=>{const t=e.target;if(t.dataset.l!==undefined){layer=+t.dataset.l;paint()}
    else if(t.id==="faPh"){photo=!photo;paint()}
    else if(t.id==="faGo"){const q=f(...cur);$("#faPts").insertAdjacentHTML("beforeend",`<circle cx="${q[0]}" cy="${q[1]}" r="0" fill="${L[layer][1]}" stroke="#fff" stroke-width="2"><animate attributeName="r" from="0" to="7" dur=".35s" fill="freeze"/></circle>`);pending++;photo=false;$("#faN").value="";paint()}
    else if(t.id==="faSy"){if(!pending)return;t.textContent="Syncing…";setTimeout(()=>{pending=0;t.textContent="Sync";paint()},1200)}});
  paint()}

/* ---------- dashboard (1024 × 693) ---------- */
function dashboard(el){const W=430,H=560,f=proj(CG,W,H,10),DS=[["Schools","#2f6fd6"],["Health centres","#d2423a"],["Anganwadi","#e39a1f"]];let ds=0;
  el.innerHTML=`<div class="db"><header><div><b>Coverage dashboard</b><span>Chhattisgarh · 33 districts · updated today 06:00 · sample values</span></div><nav id="dbDs"></nav></header>
    <div class="db-kpi" id="dbK"></div><div class="db-main"><div class="db-map"><svg viewBox="0 0 ${W} ${H}" ${SVGNS} id="dbM"></svg><div class="db-tip" id="dbT"></div>
      <div class="db-leg"><i style="--c:#d2423a"></i>&lt;70%<i style="--c:#ffc93c"></i>70–85%<i style="--c:#2bb673"></i>&gt;85%</div></div><div class="db-list" id="dbL"></div></div></div>`;
  const $=s=>el.querySelector(s),val=n=>55+hash(n+DS[ds][0])%45,colr=v=>v>85?"#2bb673":v>=70?"#ffc93c":"#d2423a";
  const paint=()=>{const ds0=DS[ds],vals=G().districts.map(d=>[d.n,val(d.n)]).sort((a,b)=>b[1]-a[1]);
    $("#dbDs").innerHTML=DS.map(([n,c],i)=>`<button data-ds="${i}" class="${i===ds?"on":""}" style="--c:${c}">${n}</button>`).join("");
    const tot=vals.reduce((a,v)=>a+v[1],0);$("#dbK").innerHTML=[[`${Math.round([56000,5800,52000][ds]*tot/33/100).toLocaleString("en-IN")}`,`${ds0[0]} mapped`],[`${vals.filter(v=>v[1]>85).length} / 33`,"districts above 85%"],[`${(hash(ds0[0])%40)+12}`,"records waiting for QA"],[`${(hash(ds0[0]+"w")%300)+140}`,"field updates this week"]].map(([a,b])=>`<div><b>${a}</b><span>${b}</span></div>`).join("");
    $("#dbM").innerHTML=G().districts.map(d=>`<path data-n="${d.n}" d="${pth(d.r,f)}" fill="${colr(val(d.n))}" fill-opacity=".85" stroke="#fff" stroke-width="1.2"/>`).join("");
    $("#dbL").innerHTML=vals.map(([n,v])=>`<div data-n="${n}"><span>${n}</span><i><s style="width:${v}%;background:${colr(v)}"></s></i><b>${v}%</b></div>`).join("")};
  el.addEventListener("click",e=>{const b=e.target.closest("[data-ds]");if(b){ds=+b.dataset.ds;paint()}});
  el.addEventListener("pointermove",e=>{const n=e.target.closest("[data-n]")?.dataset.n,t=$("#dbT");el.querySelectorAll(".hl").forEach(x=>x.classList.remove("hl"));
    if(!n){t.style.opacity=0;return}el.querySelectorAll(`[data-n="${n}"]`).forEach(x=>x.classList.add("hl"));t.innerHTML=`<b>${n}</b> ${val(n)}% ${DS[ds][0].toLowerCase()} mapped`;t.style.opacity=1});
  paint()}

/* ---------- department desktop GIS (1280 × 768) ---------- */
function deskGIS(el){const W=900,H=560,f=proj(CG,W,H,16);let vb=[0,0,W,H];const on={Districts:1,Rivers:1,Roads:1,Rail:1,Dams:1,Schools:1};
  const LY={Districts:"#8a6a3c",Rivers:"#1d6fd6",Roads:"#d2733c",Rail:"#3a383d",Dams:"#0b7a70",Schools:"#2f6fd6"};
  el.innerHTML=`<div class="dg"><div class="dg-title">● ● ●<b>Department GIS — Water Resources</b><span>Connected to State Geoportal map services ✓</span></div>
    <div class="dg-menu">Project  Edit  View  Layer  Vector  Raster  Processing  Help</div>
    <div class="dg-body"><aside><small>LAYERS</small><div id="dgL"></div><small>BASEMAP</small><p>Geoportal · light</p></aside>
      <div class="dg-map"><svg viewBox="0 0 ${W} ${H}" ${SVGNS} id="dgM"></svg><div class="dg-zoom"><button data-z="-1">+</button><button data-z="1">−</button><button data-z="0">⌂</button></div></div></div>
    <div class="dg-table" id="dgT"><span>Click a district to see its attributes</span></div><div class="dg-status"><span id="dgXY">—</span><span>EPSG:4326 · WGS 84</span><span>Render 38 ms</span></div></div>`;
  const $=s=>el.querySelector(s),svg=$("#dgM");let sel=null;
  const pts=(list,c,r)=>list.map(([lo,la,t])=>{const q=f(lo,la);return`<circle cx="${q[0]}" cy="${q[1]}" r="${r}" fill="${c}" stroke="#fff" stroke-width="1.5"><title>${t}</title></circle>`}).join("");
  const paint=()=>{$("#dgL").innerHTML=Object.keys(LY).map(k=>`<label><input type="checkbox" data-ly="${k}" ${on[k]?"checked":""}><i style="--c:${LY[k]}"></i>${k}</label>`).join("");
    svg.setAttribute("viewBox",vb.join(" "));const g=G();
    svg.innerHTML=`<rect x="-2000" y="-2000" width="6000" height="6000" fill="#eef3f8"/>`+
      (on.Districts?g.districts.map(d=>`<path data-d="${d.n}" d="${pth(d.r,f)}" fill="${d.n===sel?"#ffe2c4":"#fff"}" stroke="#8a6a3c" stroke-width="${d.n===sel?2.5:1}" vector-effect="non-scaling-stroke"/>`).join(""):"")+
      (on.Rivers?g.rivers.map(r=>`<path d="${ln(r.p,f)}" fill="none" stroke="#1d6fd6" stroke-width="2.5" vector-effect="non-scaling-stroke"/>`).join(""):"")+
      (on.Roads?g.roads.map(r=>`<path d="${ln(r.p,f)}" fill="none" stroke="#d2733c" stroke-width="2" vector-effect="non-scaling-stroke"/>`).join(""):"")+
      (on.Rail?g.rail.map(r=>`<path d="${ln(r.p,f)}" fill="none" stroke="#3a383d" stroke-width="1.5" stroke-dasharray="5 3" vector-effect="non-scaling-stroke"/>`).join(""):"")+
      (on.Dams?pts(DAMS.slice(1).map(r=>[+r[3],+r[2],r[0]]),"#0b7a70",6):"")+(on.Schools?pts(SCHOOLS.slice(1).filter(r=>+r[2]<24.5&&r[2]).map(r=>[+r[3],+r[2],r[0]]),"#2f6fd6",5):"")};
  const zoom=(k,cx=vb[0]+vb[2]/2,cy=vb[1]+vb[3]/2)=>{if(k===0){vb=[0,0,W,H];return paint()}const s=k<0?.7:1/.7,w=Math.min(W*1.2,Math.max(W*.08,vb[2]*s)),h=w*H/W;vb=[cx-(cx-vb[0])*w/vb[2],cy-(cy-vb[1])*h/vb[3],w,h];paint()};
  const toSvg=e=>{const r=svg.getBoundingClientRect();return[vb[0]+(e.clientX-r.left)/r.width*vb[2],vb[1]+(e.clientY-r.top)/r.height*vb[3]]};
  let drag=null;
  svg.addEventListener("pointerdown",e=>{drag={x:e.clientX,y:e.clientY,vb:[...vb],moved:false};svg.setPointerCapture(e.pointerId)});
  svg.addEventListener("pointermove",e=>{const[x,y]=toSvg(e),[lo,la]=f.inv(x,y);$("#dgXY").textContent=`${la.toFixed(4)}° N  ${lo.toFixed(4)}° E`;
    if(drag){const r=svg.getBoundingClientRect(),dx=(e.clientX-drag.x)/r.width*vb[2],dy=(e.clientY-drag.y)/r.height*vb[3];if(Math.abs(dx)+Math.abs(dy)>2)drag.moved=true;vb=[drag.vb[0]-dx,drag.vb[1]-dy,vb[2],vb[3]];svg.setAttribute("viewBox",vb.join(" "))}});
  svg.addEventListener("pointerup",e=>{const d=drag;drag=null;if(d&&!d.moved){const p=e.target.closest("[data-d]");if(p){sel=p.dataset.d;const m=measure(G().districts.find(x=>x.n===sel));
    $("#dgT").innerHTML=`<table><tr><th>FID</th><th>dist_name</th><th>area_km2</th><th>cen_lat</th><th>cen_lon</th><th>source</th></tr><tr><td>${G().districts.findIndex(x=>x.n===sel)}</td><td>${sel}</td><td>${Math.round(m.area).toLocaleString("en-IN")}</td><td>${m.lat.toFixed(4)}</td><td>${m.lon.toFixed(4)}</td><td>State Geoportal</td></tr></table>`;paint()}}});
  svg.addEventListener("wheel",e=>{e.preventDefault();const[x,y]=toSvg(e);zoom(e.deltaY<0?-1:1,x,y)},{passive:false});
  el.addEventListener("click",e=>{const z=e.target.closest("[data-z]");if(z)zoom(+z.dataset.z)});
  el.addEventListener("change",e=>{const c=e.target.closest("[data-ly]");if(c){on[c.dataset.ly]=c.checked?1:0;paint()}});
  paint()}

export function buildApps(host){const make=(cls,w,h,fn)=>{const d=document.createElement("div");d.className="pl-dev "+cls;d.style.width=w+"px";d.style.height=h+"px";host.appendChild(d);fn(d);return d};
  return[make("dev-phone",390,815,fieldApp),make("dev-tab",1024,693,dashboard),make("dev-lap",1280,768,deskGIS)]}
