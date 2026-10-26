/* What the CHiPS GIS team's screens show: the team inbox, each analyst's mail client with the department's
   email open, and a desktop GIS tool working on the attachment (georeferencer, attribute table + XY,
   reproject & edit, raster warp). All drawn on 2D canvases (512 × 320) that become monitor textures. */
import {FMTS} from "./files.js?v=202610261000";
const MONO='"Geist Mono",ui-monospace,monospace',SANS='"Bricolage Grotesque",system-ui,sans-serif';
const rr=(x,X,Y,W,H,r)=>{x.beginPath();x.roundRect(X,Y,W,H,r)};
const clip=(x,t,w)=>{t=String(t);if(x.measureText(t).width<=w)return t;while(t.length>1&&x.measureText(t+"…").width>w)t=t.slice(0,-1);return t+"…"};
export const timeOf=j=>{const m=2+j*3;return `10:${String(m%60).padStart(2,"0")}`};

/* which tool a file needs */
export function toolOf(F){return F.view==="cadastral"||F.view==="topo"?"georef":F.view==="tif"?"raster":["xlsx","csv","pdf","register"].includes(F.view)?"table":"vector"}
const TOOL={georef:"Georeferencer",raster:"Raster · Warp (reproject)",table:"Attribute table · Add XY",vector:"Reproject & edit"};
function rowsOf(F){if(F.view==="csv")return F.rows.slice(0,5);if(F.view==="register")return F.rows.map(l=>l.split(/\s{2,}/));return (F.rows||[]).slice(0,5)}

/* window chrome shared by every app */
function chrome(x,W,H,title,dark){x.fillStyle=dark?"#1e2632":"#f4f6f9";x.fillRect(0,0,W,H);x.fillStyle="#2b3442";x.fillRect(0,0,W,22);
  ["#ff5f57","#febc2e","#28c840"].forEach((c,i)=>{x.fillStyle=c;x.beginPath();x.arc(12+i*14,11,4,0,7);x.fill()});
  x.fillStyle="#dfe7f1";x.font=`600 11px ${SANS}`;x.fillText(title,58,15)}

export function envDraw(F,dep){return (x,W,H)=>{x.fillStyle="#fff";rr(x,0,0,W,H,16);x.fill();x.strokeStyle="#d6dbe3";x.lineWidth=3;
  x.beginPath();x.moveTo(8,10);x.lineTo(W/2,H*.56);x.lineTo(W-8,10);x.stroke();x.beginPath();x.moveTo(8,H-8);x.lineTo(W*.38,H*.46);x.moveTo(W-8,H-8);x.lineTo(W*.62,H*.46);x.stroke();
  x.fillStyle=dep.col;rr(x,0,0,W,18,[16,16,0,0]);x.fill();x.beginPath();x.arc(W/2,H*.5,34,0,7);x.fill();x.fillStyle="#fff";x.font=`800 40px ${SANS}`;x.textAlign="center";x.fillText("@",W/2,H*.5+14);
  const c=FMTS[F.f].c;x.fillStyle=c;rr(x,W/2-70,H-50,140,36,18);x.fill();x.fillStyle="#fff";x.font=`700 18px ${MONO}`;x.fillText(F.ext.split(" ")[0],W/2,H-26);x.textAlign="left"}}

/* the big screen on the lab wall: everything that has arrived, newest first */
export function inboxDraw(list,DEPTS){return (x,W,H)=>{x.fillStyle="#0b1424";rr(x,0,0,W,H,22);x.fill();
  x.fillStyle="#fff";x.font=`800 40px ${SANS}`;x.fillText("Inbox",32,58);x.fillStyle="#9fb4d0";x.font=`500 22px ${MONO}`;x.fillText("CHiPS GIS Team · data from departments",150,56);
  x.fillStyle=list.length?"#ff5a36":"#2b3442";rr(x,W-130,26,100,42,21);x.fill();x.fillStyle="#fff";x.font=`700 22px ${MONO}`;x.textAlign="center";x.fillText(`${list.length} new`,W-80,55);x.textAlign="left";
  if(!list.length){x.fillStyle="#5f7390";x.font=`600 26px ${SANS}`;x.fillText("Waiting for mail…",32,140);return}
  list.slice(-6).reverse().forEach((F,i)=>{const y=86+i*50,d=DEPTS[F.d],c=FMTS[F.f].c;x.fillStyle=i%2?"#0f1b2f":"#122038";x.fillRect(20,y,W-40,46);
    x.fillStyle=d.col;x.fillRect(20,y,8,46);x.fillStyle="#fff";x.font=`700 22px ${SANS}`;x.fillText(clip(x,d.short.en,230),44,y+31);
    x.fillStyle="#c9d6e8";x.font=`500 19px ${MONO}`;x.fillText(clip(x,F.name,420),290,y+30);
    x.fillStyle=c;rr(x,W-250,y+9,130,28,14);x.fill();x.fillStyle="#fff";x.font=`700 15px ${SANS}`;x.fillText(clip(x,FMTS[F.f].n,116),W-240,y+28);
    x.fillStyle="#7d90ab";x.font=`500 18px ${MONO}`;x.fillText(timeOf(F.i),W-100,y+30)})}}

/* an analyst's mail client with the department's email open */
export function mailDraw(F,dep,list,DEPTS){return (x,W,H)=>{chrome(x,W,H,"Mail — CHiPS GIS Team",false);
  x.fillStyle="#e9edf3";x.fillRect(0,22,160,H-22);x.fillStyle="#2b3442";x.font=`700 13px ${SANS}`;x.fillText("Inbox",12,42);
  if(!F){x.fillStyle="#8593a6";x.font=`600 14px ${SANS}`;x.fillText("No new mail",200,170);return}
  list.slice(-5).reverse().forEach((G,i)=>{const y=52+i*50,d=DEPTS[G.d];if(G===F){x.fillStyle="#d7e6ff";x.fillRect(0,y,160,48)}x.fillStyle=d.col;x.fillRect(0,y+4,4,40);
    x.fillStyle="#1d2633";x.font=`700 11px ${SANS}`;x.fillText(clip(x,d.short.en,140),10,y+18);x.fillStyle="#5d6b7e";x.font=`500 10px ${MONO}`;x.fillText(clip(x,G.name,140),10,y+34)});
  const X=176;x.fillStyle="#1d2633";x.font=`800 16px ${SANS}`;x.fillText(clip(x,`${FMTS[F.f].n}: ${F.name}`,W-X-12),X,48);
  x.font=`500 11px ${SANS}`;x.fillStyle="#5d6b7e";x.fillText(clip(x,`From  ${dep.name.en}`,W-X-12),X,68);x.fillText(`To  CHiPS GIS Team   ·   ${timeOf(F.i)}`,X,84);
  x.fillStyle="#d9dee6";x.fillRect(X,94,W-X-14,1);x.fillStyle="#2b3442";x.font=`500 12px ${SANS}`;x.fillText("Sir/Madam, please find the latest data attached",X,116);x.fillText("for the State Geoportal.",X,132);
  x.fillStyle="#c9d0da";[0,1].forEach(i=>x.fillRect(X,146+i*14,W-X-40-i*70,6));
  const c=FMTS[F.f].c;x.fillStyle="#fff";rr(x,X,186,W-X-14,58,10);x.fill();x.strokeStyle="#d9dee6";x.lineWidth=1;x.stroke();x.fillStyle=c;rr(x,X+10,196,38,38,8);x.fill();
  x.fillStyle="#fff";x.font=`700 10px ${MONO}`;x.textAlign="center";x.fillText(F.ext.split(" ")[0].replace(/[()]/g,"").slice(0,5),X+29,219);x.textAlign="left";
  x.fillStyle="#1d2633";x.font=`600 12px ${MONO}`;x.fillText(clip(x,F.name,W-X-80),X+58,210);x.fillStyle="#7a8698";x.font=`500 11px ${SANS}`;x.fillText(`${(1.2+F.i*.37%3).toFixed(1)} MB · attachment`,X+58,228);
  x.fillStyle="#2f6fd6";rr(x,X,258,124,30,15);x.fill();x.fillStyle="#fff";x.font=`700 12px ${SANS}`;x.fillText("Open in GIS  →",X+16,278)}}

/* the desktop GIS tool, working on the attachment; p = progress 0..1 */
export function gisDraw(F,dep,p){return (x,W,H)=>{const tool=F?toolOf(F):"idle";chrome(x,W,H,`CHiPS GIS — ${F?TOOL[tool]:"Map"}`,true);
  x.fillStyle="#f2f4f7";x.fillRect(0,22,W,16);x.fillStyle="#3a4455";x.font=`500 10px ${SANS}`;x.fillText("Project   Edit   View   Layer   Vector   Raster   Processing   Help",8,34);
  x.fillStyle="#e6e9ee";x.fillRect(0,38,W,22);for(let i=0;i<16;i++){x.fillStyle=[3,7,11].includes(i)?"#2f6fd6":i%4===0?"#3e8a4f":"#8592a5";rr(x,8+i*20,42,14,14,3);x.fill()}
  /* layers panel */
  x.fillStyle="#262f3d";x.fillRect(0,60,118,H-78);x.fillStyle="#9fb4d0";x.font=`700 10px ${SANS}`;x.fillText("Layers",8,74);
  const lays=F?[[F.name,FMTS[F.f].c],["cg_districts","#ff5a36"],["villages","#e39a1f"],["basemap","#6b7d96"]]:[["cg_districts","#ff5a36"],["basemap","#6b7d96"]];
  lays.forEach(([n,c],i)=>{const y=84+i*20;x.fillStyle=i===0&&F?"#33415a":"transparent";x.fillRect(0,y-11,118,18);x.strokeStyle="#9fb4d0";x.strokeRect(8,y-7,9,9);x.fillStyle="#3fd6a0";x.fillRect(10,y-5,5,5);
    x.fillStyle=c;x.fillRect(22,y-7,9,9);x.fillStyle="#dfe7f1";x.font=`500 9px ${MONO}`;x.fillText(clip(x,n,80),35,y+1)});
  /* status bar */
  x.fillStyle="#2b3442";x.fillRect(0,H-18,W,18);x.fillStyle="#9fb4d0";x.font=`500 9px ${MONO}`;x.fillText("EPSG:4326 · 81.63°E 21.25°N · 1:50 000",8,H-6);
  if(F){if(p<1){x.fillStyle="#3a4659";rr(x,W-150,H-14,110,9,4);x.fill();x.fillStyle="#3fd6a0";rr(x,W-150,H-14,Math.max(4,110*p),9,4);x.fill();x.fillStyle="#dfe7f1";x.fillText(Math.round(p*100)+"%",W-34,H-6)}
    else{x.fillStyle="#3fd6a0";x.font=`700 10px ${SANS}`;x.fillText("✓ Done · validated",W-110,H-6)}}
  /* main canvas */
  const X0=118,Y0=60,MW=W-X0,MH=H-78;x.save();x.beginPath();x.rect(X0,Y0,MW,MH);x.clip();
  x.fillStyle="#e8edf2";x.fillRect(X0,Y0,MW,MH);x.strokeStyle="#c7d0db";x.lineWidth=1;for(let i=0;i<6;i++){x.beginPath();x.moveTo(X0,Y0+i*48+10);x.bezierCurveTo(X0+120,Y0+i*48+40,X0+260,Y0+i*48-20,W,Y0+i*48+20);x.stroke()}
  x.strokeStyle="#ff5a3699";x.lineWidth=2;x.beginPath();[[150,90],[260,70],[380,100],[470,90],[490,200],[400,260],[260,250],[160,220]].forEach((q,i)=>i?x.lineTo(...q):x.moveTo(...q));x.closePath();x.stroke();
  const n=Math.ceil(p*4);
  if(tool==="georef"){x.fillStyle="#efe3c4";x.fillRect(X0+10,Y0+8,MW*.58,MH-70);x.strokeStyle="#9c8a63";for(let i=0;i<7;i++){x.beginPath();x.moveTo(X0+10,Y0+14+i*24);x.lineTo(X0+10+MW*.58,Y0+20+i*24);x.stroke()}
      x.strokeStyle="#222";x.lineWidth=2;x.beginPath();x.moveTo(X0+20,Y0+MH-80);x.lineTo(X0+MW*.55,Y0+20);x.stroke();
      const g=[[X0+22,Y0+18],[X0+MW*.56,Y0+18],[X0+MW*.56,Y0+MH-72],[X0+22,Y0+MH-72]];x.strokeStyle="#d2423a";x.lineWidth=2;g.slice(0,n).forEach(([a,b])=>{x.beginPath();x.moveTo(a-8,b);x.lineTo(a+8,b);x.moveTo(a,b-8);x.lineTo(a,b+8);x.stroke()});
      x.fillStyle="#fff";x.fillRect(X0,Y0+MH-58,MW,58);x.font=`500 9px ${MONO}`;["GCP1  412,388  → 81.625 21.250","GCP2  5980,401 → 81.750 21.250","GCP3  5961,7012 → 81.750 21.125","GCP4  398,7030 → 81.625 21.125"].slice(0,n).forEach((t,i)=>{x.fillStyle="#2b3442";x.fillText(t,X0+8,Y0+MH-44+i*12)});
      x.fillStyle="#d2423a";x.font=`700 10px ${SANS}`;x.fillText(p>=1?"RMS 0.8 px ✓":"Add ground control points…",X0+MW*.62,Y0+30)}
  else if(tool==="table"){const R=rowsOf(F);x.fillStyle="#fff";x.fillRect(X0,Y0,MW,MH*.52);const cw=MW/Math.max(3,R[0].length);
      R.forEach((r,i)=>r.slice(0,4).forEach((v,j)=>{x.fillStyle=i===0?"#dbe5f2":i%2?"#f7f9fc":"#fff";x.fillRect(X0+j*cw,Y0+i*18,cw,18);x.strokeStyle="#e1e6ee";x.strokeRect(X0+j*cw,Y0+i*18,cw,18);
        x.fillStyle=i===0?"#1d2633":"#3a4455";x.font=`${i===0?700:500} 9px ${MONO}`;x.fillText(clip(x,v,cw-8),X0+j*cw+4,Y0+i*18+12)}));
      const hl=Math.min(R.length-1,1+Math.floor(p*(R.length-1)));x.strokeStyle="#2f6fd6";x.lineWidth=2;x.strokeRect(X0+1,Y0+hl*18,MW-2,18);
      x.fillStyle="#2f6fd6";[[200,200],[260,180],[330,215],[400,190],[300,240],[440,230]].slice(0,Math.ceil(p*6)).forEach(([a,b])=>{x.beginPath();x.arc(a,b,5,0,7);x.fill()});
      x.fillStyle="#1d2633";rr(x,X0+MW-170,Y0+MH-30,162,22,6);x.fill();x.fillStyle="#fff";x.font=`600 9px ${SANS}`;x.fillText(F.xy?"Add XY: X = Long, Y = Lat":"Geocode by village name…",X0+MW-162,Y0+MH-15)}
  else if(tool==="raster"){for(let i=0;i<26;i++)for(let j=0;j<14;j++){const q=Math.sin(i*.6+j*.3)+Math.cos(j*.4-i*.2);x.fillStyle=q>1?"#1f6b35":q>.2?"#4f9a4f":q>-.6?"#a7c77a":"#e9e2c9";x.fillRect(X0+6+i*14,Y0+6+j*14,13,13)}
      x.fillStyle="#fff";rr(x,X0+MW-150,Y0+MH-62,142,54,6);x.fill();x.fillStyle="#1d2633";x.font=`700 9px ${SANS}`;x.fillText("Warp (reproject)",X0+MW-142,Y0+MH-46);x.font=`500 9px ${MONO}`;x.fillText("EPSG:32644 → 4326",X0+MW-142,Y0+MH-32);x.fillText(`tiles ${Math.round(p*412)} / 412`,X0+MW-142,Y0+MH-18)}
  else if(tool==="vector"){const c=FMTS[F.f].c;x.strokeStyle=c;x.fillStyle=c+"33";x.lineWidth=3;const P=[[170,110],[250,90],[340,120],[430,110],[450,200],[360,240],[250,230],[180,200]];
      x.beginPath();P.forEach((q,i)=>i?x.lineTo(...q):x.moveTo(...q));if(F.kind==="polygon"){x.closePath();x.fill()}x.stroke();
      x.fillStyle="#fff";x.strokeStyle="#d2423a";x.lineWidth=1.5;P.slice(0,2+Math.ceil(p*6)).forEach(([a,b])=>{x.fillRect(a-3,b-3,6,6);x.strokeRect(a-3,b-3,6,6)});
      x.fillStyle="#1d2633";rr(x,X0+MW-180,Y0+8,172,40,6);x.fill();x.fillStyle="#fff";x.font=`700 9px ${SANS}`;x.fillText(F.f==="dwg"||F.view==="shp"&&F.d===6?"Reproject layer":"Fix geometry · snap",X0+MW-172,Y0+22);
      x.font=`500 9px ${MONO}`;x.fillText(F.f==="dwg"||F.d===6?"UTM 44N → WGS 84":"→ state schema",X0+MW-172,Y0+38)}
  else{x.fillStyle="#5f7390";x.font=`600 12px ${SANS}`;x.fillText("Waiting for data…",X0+MW/2-50,Y0+MH/2)}
  x.restore()}}
