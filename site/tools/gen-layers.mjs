/* Builds ../../layers.html: the "data from many departments, consolidated" stacked-layers illustration.
   Geometry comes from site/geo.js (official district layer, Natural Earth roads). Run: node site/tools/gen-layers.mjs */
import fs from "fs";import path from "path";import {fileURLToPath} from "url";
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.join(here,"../..");
globalThis.window={};await import(path.join(root,"site/geo.js"));const G=window.GEO;
const D2R=Math.PI/180,B=[80.2,17.75,84.45,24.15],kx=Math.cos(20.95*D2R),MW=300,MH=430;
const s=Math.min(MW/((B[2]-B[0])*kx),MH/(B[3]-B[1])),W=(B[2]-B[0])*kx*s,H=(B[3]-B[1])*s;
const P=(lo,la)=>[(lo-B[0])*kx*s,(B[3]-la)*s],f=v=>v.toFixed(1);
const ring=r=>"M"+r.map(p=>P(...p).map(f).join(",")).join("L")+"Z",line=pts=>"M"+pts.map(p=>P(...p).map(f).join(",")).join("L");
const pip=(pt,r)=>{let a=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const[xi,yi]=r[i],[xj,yj]=r[j];if(((yi>pt[1])!==(yj>pt[1]))&&pt[0]<(xj-xi)*(pt[1]-yi)/(yj-yi)+xi)a=!a}return a};
let seed=11;const rnd=()=>(seed=seed*16807%2147483647)/2147483647;
const ptsIn=(n)=>{const out=[];G.districts.forEach(d=>{const r=d.r[0];let b=[1e9,1e9,-1e9,-1e9];r.forEach(([x,y])=>{b=[Math.min(b[0],x),Math.min(b[1],y),Math.max(b[2],x),Math.max(b[3],y)]});
  for(let k=0,t=0;k<n&&t<300;t++){const p=[b[0]+rnd()*(b[2]-b[0]),b[1]+rnd()*(b[3]-b[1])];if(d.r.some(rr=>pip(p,rr))){out.push(P(...p));k++}}});return out};
const FOREST=new Set(["Bastar","Dantewada","Bijapur","Sukma","Narayanpur","Kanker","Kondagaon","Sarguja","Jashpur","Korba","Balrampur-Ramanujganj","Surajpur","Koriya","Gariyaband","Dhamtari","Manendragarh-Chirmiri-Bharatpur","Gaurela-Pendra-Marwahi","Mohla-Manpur-Ambagarh Chowki"]);
const all=G.districts.map(d=>d.r.map(ring).join("")).join("");
const L=[ /* bottom → top, above the base map */
  {hi:"सड़क",en:"Roads · PWD",c:"#d2733c",body:`<path d="${G.roads.map(r=>line(r.p)).join("")}" fill="none" stroke="#d2733c" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`},
  {hi:"शिक्षा",en:"Education",c:"#2f6fd6",body:ptsIn(3).map(([x,y])=>`<circle cx="${f(x)}" cy="${f(y)}" r="3.2"/>`).join("").replace(/^/,'<g fill="#2f6fd6" stroke="#fff" stroke-width="1">')+"</g>"},
  {hi:"स्वास्थ्य",en:"Health",c:"#d2423a",body:(seed=29,ptsIn(1)).map(([x,y])=>`<path d="M${f(x-1.4)},${f(y-4.2)}h2.8v2.8h2.8v2.8h-2.8v2.8h-2.8v-2.8h-2.8v-2.8h2.8z"/>`).join("").replace(/^/,'<g fill="#d2423a" stroke="#fff" stroke-width=".8">')+"</g>"},
  {hi:"वन",en:"Forest",c:"#3e8a4f",body:`<path d="${G.districts.filter(d=>FOREST.has(d.n)).map(d=>d.r.map(ring).join("")).join("")}" fill="#3e8a4f" fill-opacity=".55" stroke="#2c6b3b" stroke-width=".8"/>`},
  {hi:"राजस्व",en:"Revenue",c:"#8a6a3c",body:`<path d="${all}" fill="none" stroke="#8a6a3c" stroke-width="1.4" stroke-linejoin="round"/>`}
];
/* tilt: rotate −30°, then squash vertically (an isometric-style plane) */
const TH=0,KY=.66,M=[Math.cos(TH),Math.sin(TH)*KY,-Math.sin(TH),Math.cos(TH)*KY].map(v=>+v.toFixed(4)),iso=(x,y)=>[M[0]*x+M[2]*y,M[1]*x+M[3]*y];
const corners=G.state[0].map(p=>iso(...P(...p))),minX=Math.min(...corners.map(c=>c[0])),maxX=Math.max(...corners.map(c=>c[0])),minY=Math.min(...corners.map(c=>c[1])),maxY=Math.max(...corners.map(c=>c[1]));
const RP=corners.reduce((a,c)=>c[0]>a[0]?c:a),VW=640,GAP=126,MID=2.5,CX=250,baseY=1010-(maxY-minY)/2;
const ox=CX-(minX+maxX)/2;
const plane=(i)=>{const y=baseY-i*GAP-(minY+maxY)/2;return{tr:`translate(${f(ox)},${f(y)}) matrix(${M.join(",")},0,0)`,rx:ox+RP[0],ry:y+RP[1]}};
const base=plane(0);
let layers="";L.forEach((l,k)=>{const i=k+1,p=plane(i),lx=500,ly=plane(i).ry-40+6;
  layers+=`<g class="ly" style="--i:${i};--c:${l.c}" tabindex="0" aria-label="${l.hi} (${l.en})">
  <g class="mv" style="--d:${(i-MID)*GAP}px"><g class="pl" transform="${p.tr}"><path d="${ring(G.state[0])}" fill="${l.c}" fill-opacity=".16" stroke="${l.c}" stroke-width="2.2" stroke-linejoin="round"/>${l.body}</g></g>
  <g class="tag"><path d="M${f(p.rx+4)},${f(p.ry)} L${lx-12},${f(ly-8)}" stroke="${l.c}" stroke-width="1.6" stroke-dasharray="3 4" fill="none"/>
   <circle cx="${f(p.rx+4)}" cy="${f(p.ry)}" r="4" fill="${l.c}"/><text x="${lx}" y="${f(ly)}" class="hi">${l.hi}</text><text x="${lx}" y="${f(ly+24)}" class="en">${l.en}</text></g></g>`});
const stPath=G.state.map(ring).join("");
const VY=Math.floor(plane(L.length).ry-(RP[1]-minY)-40),VH=Math.ceil(baseY+(maxY-minY)/2+80-VY);
const svg=`<svg viewBox="0 ${VY} ${VW} ${VH}" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="t d" xmlns="http://www.w3.org/2000/svg">
<title id="t">विभिन्न विभागों से डाटा समेकित</title><desc id="d">Chhattisgarh outline at the bottom with five translucent Chhattisgarh-shaped department layers above it (Revenue, Forest, Health, Education, Roads) that settle down and merge into one map.</desc>
<g class="base" style="--i:0"><g class="mv" style="--d:${-MID*GAP}px"><ellipse cx="${CX}" cy="${f(baseY+(maxY-minY)/2+14)}" rx="${f((maxX-minX)/2+10)}" ry="18" fill="#0d1b2e" opacity=".08"/><g transform="${base.tr}"><path d="${all}" fill="#f7f3ea" stroke="#c9bfa8" stroke-width=".8"/><path d="${stPath}" fill="none" stroke="#0d1b2e" stroke-width="2.4" stroke-linejoin="round"/></g>
 <text x="${CX}" y="${f(baseY+(maxY-minY)/2+38)}" class="hi base-t" text-anchor="middle">छत्तीसगढ़</text><text x="${CX}" y="${f(baseY+(maxY-minY)/2+60)}" class="en" text-anchor="middle">33 districts · one boundary</text></g>
 <g class="one"><text x="440" y="${f(plane(MID).ry-6)}" class="hi">एक नक्शा</text><text x="440" y="${f(plane(MID).ry+18)}" class="en">One consolidated map</text></g></g>
${layers}</svg>`;
const html=`<!doctype html>
<html lang="hi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>विभिन्न विभागों से डाटा समेकित</title>
<style>
  /* Same Avenir Next World the story loads from the portal; Devanagari falls back to the system's Hindi fonts.
     Transparent so it sits on the story background. Tall frame. Flags: layers.html#bare (no heading), #static (no motion). */
  @font-face{font-family:"Avenir Next World";font-weight:700;font-display:swap;src:local("Avenir Next World Bold"),local("AvenirNextWorld-Bold"),url("https://cogcg.cgstate.gov.in/portal/apps/storymaps/static/storymaps-website-common/fonts/Avenir_Next_World/074dfc70-6436-4f4b-9314-d1e69287aea1.woff2") format("woff2")}
  html,body{margin:0;height:100%;background:transparent;overflow:hidden}
  body{display:flex;align-items:center;justify-content:center}
  svg{width:100%;height:100%;display:block}
  text{font-family:"Avenir Next World","Nirmala UI","Noto Sans Devanagari","Mangal","Kohinoor Devanagari","Avenir Next","Segoe UI",sans-serif;fill:#0d1b2e}
  .h1{font-size:44px;font-weight:700}.sub{font-size:16px;font-weight:600;fill:#5d6b7e}
  .hi{font-size:30px;font-weight:700}.en{font-size:14px;font-weight:600;fill:#6a778a;letter-spacing:.04em}
  .base-t{font-size:26px}
  .bare .head{display:none}
  /* layers drop in one by one, then float; hover or focus lifts one */
  .ly,.base{animation:drop .9s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i)*.22s)}
  .ly .mv,.base .mv{animation:merge 11s cubic-bezier(.6,0,.3,1) 2.4s infinite}
  .ly .tag{animation:tagfade 11s ease 2.4s infinite}
  .base .one{opacity:0;animation:onefade 11s ease 2.4s infinite}
  .ly .pl{animation:bob 6s ease-in-out infinite;animation-delay:calc(var(--i)*-.9s);transition:transform .35s}
  .ly{cursor:pointer;outline:none;transition:opacity .3s}
  .ly .tag text.hi{transition:fill .25s}
  .ly:hover .pl,.ly:focus .pl{translate:0 -16px}
  .ly:hover .tag text.hi,.ly:focus .tag text.hi{fill:var(--c)}
  svg:has(.ly:hover) .ly:not(:hover),svg:has(.ly:focus) .ly:not(:focus){opacity:.45}
  @keyframes drop{from{opacity:0;translate:0 -60px}to{opacity:1;translate:0 0}}
  @keyframes bob{50%{translate:0 -5px}}
  @keyframes merge{0%,28%{translate:0 0}46%,72%{translate:0 var(--d)}90%,100%{translate:0 0}}
  @keyframes tagfade{0%,26%{opacity:1}38%,78%{opacity:0}90%,100%{opacity:1}}
  @keyframes onefade{0%,40%{opacity:0}50%,70%{opacity:1}80%,100%{opacity:0}}
  .static .ly,.static .base,.static .ly .pl,.static .ly .mv,.static .base .mv,.static .ly .tag,.static .base .one{animation:none}
  @media (prefers-reduced-motion:reduce){.ly,.base,.ly .pl,.ly .mv,.base .mv,.ly .tag,.base .one{animation:none}}
</style>
</head>
<body>
${svg}
<script>(function(){var h=location.hash;if(/static/.test(h))document.body.classList.add("static")})()</script>
</body>
</html>
`;
fs.writeFileSync(path.join(root,"layers.html"),html);console.log("layers.html",html.length,"bytes");
