/* The pipeline world. Everything is a pure function of scroll position s (0..steps), so scrolling back
   rewinds it exactly. Left to right: departments → conversion → quality gate → data centre → map + portal → apps. */
import * as THREE from "three";
import {RoundedBoxGeometry} from "../vendor/RoundedBoxGeometry.js";
import {RoomEnvironment} from "../vendor/RoomEnvironment.js";
import {DEPTS,STEPS} from "./steps.js";

const G=window.GEO,D2R=Math.PI/180,LON0=82.15,LAT0=21.35,K=1,CX=Math.cos(LAT0*D2R),MX=75,MS=10;
export const P=(lon,lat)=>[MX+(lon-LON0)*CX*MS,-(lat-LAT0)*MS];
const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,sm=t=>{t=cl(t);return t*t*(3-2*t)};
const seg=(s,a,b)=>sm((s-a)/(b-a));
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim()||null;
const col=(n,f)=>new THREE.Color(css(n)||f);
let seed=7;const rnd=()=>(seed=seed*16807%2147483647)/2147483647;
const SI=Object.fromEntries(STEPS.map((s,i)=>[s.id,i]));   // step index by id

/* ---------- canvas textures ---------- */
function canvasTex(w,h,draw){const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");draw(x,w,h);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;t.userData={c,x,draw};return t}
const MONO='"Geist Mono",ui-monospace,monospace',SANS='"Bricolage Grotesque",system-ui,sans-serif',HI='"Anek Devanagari",sans-serif';
function rr(x,X,Y,W,H,r){x.beginPath();x.roundRect(X,Y,W,H,r)}
function docDraw(d){return (x,W,H)=>{
  x.fillStyle="#fff";rr(x,0,0,W,H,28);x.fill();
  x.fillStyle=d.col;rr(x,0,0,W,96,[28,28,0,0]);x.fill();
  x.fillStyle="#fff";x.font=`700 40px ${SANS}`;x.fillText(d.fmt,28,58);x.font=`500 22px ${MONO}`;x.globalAlpha=.85;x.fillText(d.ext,28,86);x.globalAlpha=1;
  const B=120;x.save();x.beginPath();x.rect(20,B,W-40,H-B-20);x.clip();
  const k=d.k;
  if(k==="revenue"){["shp","shx","dbf","prj"].forEach((e,i)=>{x.fillStyle="#f3ede2";rr(x,28+i*118,B+12,104,120,14);x.fill();x.fillStyle=d.col;x.font=`700 26px ${MONO}`;x.fillText("."+e,44+i*118,B+84)});
    x.strokeStyle=d.col;x.lineWidth=5;x.beginPath();[[90,380],[200,300],[330,330],[420,260],[440,420],[300,520],[140,500]].forEach((p,i)=>i?x.lineTo(...p):x.moveTo(...p));x.closePath();x.stroke();x.fillStyle=d.col+"22";x.fill();
    x.beginPath();x.moveTo(200,300);x.lineTo(260,470);x.lineTo(440,420);x.stroke()}
  else if(k==="water"){x.font=`500 25px ${MONO}`;const L=['<Placemark>','  <name>Mahanadi</name>','  <LineString>','   <coordinates>','    81.92,20.32,0','    82.01,20.61,0','    82.18,20.96,0','   </coordinates>','  </LineString>','</Placemark>'];
    L.forEach((l,i)=>{x.fillStyle=l.includes("<")?d.col:"#333";x.fillText(l,30,B+40+i*44)})}
  else if(k==="pwd"){x.fillStyle="#13233d";x.fillRect(20,B,W-40,H-B-20);x.strokeStyle="#5fb3ff33";x.lineWidth=1;for(let i=0;i<20;i++){x.beginPath();x.moveTo(20+i*26,B);x.lineTo(20+i*26,H);x.stroke();x.beginPath();x.moveTo(20,B+i*26);x.lineTo(W,B+i*26);x.stroke()}
    x.strokeStyle="#ffd36b";x.lineWidth=6;x.beginPath();x.moveTo(40,600);x.bezierCurveTo(160,520,240,360,470,220);x.stroke();x.strokeStyle="#9fd3ff";x.lineWidth=2;x.setLineDash([10,8]);x.beginPath();x.moveTo(30,580);x.bezierCurveTo(150,500,230,340,460,200);x.stroke();x.setLineDash([]);
    x.fillStyle="#9fd3ff";x.font=`500 22px ${MONO}`;x.fillText("UTM 44N  ·  metres",36,B+40);x.fillText("ROAD_CL  NH-30",36,B+72)}
  else if(k==="edu"||k==="health"){const rows=k==="edu"?[["School","UDISE","Lat","Long"],["GPS Mana","22270101","21.180","81.723"],["GMS Abhanpur","22270215","20.987","81.754"],["GHS Tilda","22270433","81.601","21.556"],["GPS Kurud","","20.831","81.721"],["GPS Nawagaon","22270518","21.041","81.612"]]
      :[["id","type","lat","lon"],["PHC-RPR-014","PHC","20.990","81.753"],["SHC-RPR-221","SHC","21.041","81.612"],["CHC-JSP-007","CHC","22.556","83.460"],["PHC-BST-031","PHC","19.081","81.952"],["SHC-KRB-102","SHC","22.351","82.683"]];
    const cw=[170,120,80,80];rows.forEach((r,i)=>{let X=28;r.forEach((v,j)=>{x.fillStyle=i===0?d.col+"22":(i%2?"#fafafa":"#fff");x.fillRect(X,B+10+i*64,cw[j]+12,62);x.strokeStyle="#e4e4e4";x.strokeRect(X,B+10+i*64,cw[j]+12,62);
      x.fillStyle=i===0?d.col:"#333";x.font=`${i===0?700:500} ${k==="edu"?21:20}px ${MONO}`;x.fillText(v,X+8,B+50+i*64);X+=cw[j]+12})});
    if(k==="edu"){x.fillStyle="#d2423a";x.font=`700 28px ${SANS}`;x.fillText("⚠",W-60,B+50+3*64);x.fillText("⚠",W-60,B+50+4*64)}}
  else if(k==="wcd"){x.fillStyle="#fbf3dc";x.fillRect(20,B,W-40,H-B-20);x.strokeStyle="#c9b78d";for(let i=0;i<11;i++){x.beginPath();x.moveTo(20,B+40+i*48);x.lineTo(W-20,B+40+i*48);x.stroke()}
    x.strokeStyle="#d2423a";x.beginPath();x.moveTo(84,B);x.lineTo(84,H);x.stroke();x.fillStyle="#2a3b8f";x.font=`500 30px ${HI}`;
    ["1  AWC-RPR-00412  माना","2  AWC-RPR-00413  टेमरी","3  AWC-BST-00118  नगरनार","4  AWC-BST-00119  तोकापाल","5  AWC-KRB-00031  कटघोरा"].forEach((l,i)=>x.fillText(l,32,B+80+i*48));
    x.fillStyle="#d2423a";x.font=`700 24px ${MONO}`;x.fillText("no lat / long",32,H-50)}
  else if(k==="forest"){for(let i=0;i<22;i++)for(let j=0;j<24;j++){const v=Math.sin(i*.6+j*.3)+Math.cos(j*.4-i*.2)+Math.sin(i*j*.05);x.fillStyle=v>1?"#1f6b35":v>.2?"#4f9a4f":v>-.6?"#a7c77a":"#e9e2c9";x.fillRect(28+i*21,B+10+j*21,20,20)}}
  else if(k==="rail"){x.fillStyle="#efe3c4";x.fillRect(20,B,W-40,H-B-20);x.strokeStyle="#9c8a63";x.lineWidth=1;for(let i=0;i<8;i++){x.beginPath();x.moveTo(20,B+i*70);x.bezierCurveTo(200,B+i*70+30,300,B+i*70-30,W,B+i*70+10);x.stroke()}
    x.strokeStyle="#222";x.lineWidth=5;x.beginPath();x.moveTo(40,H-60);x.lineTo(W-40,B+60);x.stroke();x.lineWidth=2;for(let i=0;i<16;i++){const t=i/15,X=mix(40,W-40,t),Y=mix(H-60,B+60,t);x.beginPath();x.moveTo(X-8,Y-8);x.lineTo(X+8,Y+8);x.stroke()}
    x.strokeStyle="#c0392b";x.lineWidth=4;x.beginPath();x.arc(W-110,H-120,52,0,7);x.stroke();x.fillStyle="#c0392b";x.font=`700 18px ${MONO}`;x.fillText("SoI 64G/12",W-160,H-115)}
  x.restore()}}
function signDraw(en,hi,accent){return (x,W,H)=>{x.fillStyle="#0d1b2e";rr(x,0,0,W,H,20);x.fill();x.fillStyle=accent;x.fillRect(0,0,14,H);
  x.fillStyle="#fff";x.font=`800 ${en.length>16?44:54}px ${SANS}`;x.fillText(en,36,H*.5);x.font=`600 36px ${HI}`;x.globalAlpha=.75;x.fillText(hi,36,H*.86);x.globalAlpha=1}}

/* ---------- materials ---------- */
function mats(){const paper=col("--w-top","#ffffff"),side=col("--w-side","#c5d2e4");
  return{
    wall:new THREE.MeshStandardMaterial({color:0xf7f8fb,roughness:.55}),
    wall2:new THREE.MeshStandardMaterial({color:0xe9eef5,roughness:.6}),
    glass:new THREE.MeshPhysicalMaterial({color:0x6f8fb8,roughness:.08,metalness:.1,clearcoat:1,clearcoatRoughness:.05,envMapIntensity:1.4}),
    ink:new THREE.MeshPhysicalMaterial({color:col("--ink","#0d1b2e"),roughness:.35,metalness:.2,clearcoat:.8,clearcoatRoughness:.2}),
    steel:new THREE.MeshStandardMaterial({color:0xb9c3cf,roughness:.3,metalness:.8}),
    ground:new THREE.MeshStandardMaterial({color:col("--paper2","#dde6f1"),roughness:.95}),
    groundTop:new THREE.MeshStandardMaterial({color:col("--paper","#edf2f8"),roughness:.9}),
    belt:new THREE.MeshStandardMaterial({color:0x2a3446,roughness:.6}),
    accent:new THREE.MeshStandardMaterial({color:col("--accent","#ff5a36"),roughness:.4,emissive:col("--accent","#ff5a36"),emissiveIntensity:.25}),
    paper,side}}

export class PipelineScene{
  constructor(host){this.host=host;this.s=0;this.t=0;this.mouse=new THREE.Vector2();this.ql=/[?&]lowgl/.test(location.search)?2:0;
    const R=this.r=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});
    R.setPixelRatio(this.ql?.6:Math.min(2,devicePixelRatio||1));R.shadowMap.enabled=!this.ql;R.shadowMap.type=THREE.PCFSoftShadowMap;
    R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.0;R.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(R.domElement);
    const S=this.scene=new THREE.Scene();
    const pm=new THREE.PMREMGenerator(R);S.environment=pm.fromScene(new RoomEnvironment(),.04).texture;
    this.cam=new THREE.PerspectiveCamera(32,1,1,2000);this.cam.position.set(-30,120,170);this.look=new THREE.Vector3();
    S.add(new THREE.HemisphereLight(0xffffff,0xb8c6d8,.9));
    const sun=this.sun=new THREE.DirectionalLight(0xffffff,2.4);sun.position.set(-60,120,80);sun.castShadow=!this.ql;sun.shadow.mapSize.set(4096,2048);
    Object.assign(sun.shadow.camera,{left:-170,right:170,top:80,bottom:-80,near:20,far:400});sun.shadow.bias=-.0004;sun.shadow.normalBias=.4;S.add(sun);S.add(sun.target);
    this.M=mats();this.build();
    new ResizeObserver(()=>this.resize()).observe(host);this.resize();
    host.addEventListener("pointermove",e=>{const r=host.getBoundingClientRect();this.mouse.set((e.clientX-r.left)/r.width-.5,(e.clientY-r.top)/r.height-.5)});
    this.clock=new THREE.Clock();this.on=true;R.setAnimationLoop(()=>this.frame());
    document.fonts&&document.fonts.ready.then(()=>this.redrawTextures())}
  resize(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.r.setSize(w,h,false);this.cam.aspect=w/h;this.phone=w<760;
    this.cam.fov=this.phone?48:32;
    /* keep the subject centred in the space the caption and side panel leave free */
    if(this.phone)this.cam.setViewOffset(w,h,0,-h*.06,w,h);else this.cam.setViewOffset(w,h,Math.min(460,w*.34)/2,h*.04,w,h);
    this.cam.updateProjectionMatrix()}
  setVisible(v){this.on=v}
  redrawTextures(){(this.texs||[]).forEach(t=>{const u=t.userData;u.x.clearRect(0,0,u.c.width,u.c.height);u.draw(u.x,u.c.width,u.c.height);t.needsUpdate=true})}
  tex(w,h,draw){const t=canvasTex(w,h,draw);(this.texs=this.texs||[]).push(t);return t}
  rb(w,h,d,r,m){const g=new RoundedBoxGeometry(w,h,d,4,Math.min(r,w/2-.01,h/2-.01,d/2-.01));const o=new THREE.Mesh(g,m);o.castShadow=o.receiveShadow=true;return o}

  /* ---------------- build ---------------- */
  build(){const S=this.scene,M=this.M;
    /* ground: one long rounded platform with a soft edge */
    const base=this.rb(330,4,140,2,M.ground);base.position.set(10,-2.2,0);S.add(base);
    const top=this.rb(326,.4,136,.2,M.groundTop);top.position.set(10,-.15,0);top.receiveShadow=true;top.castShadow=false;S.add(top);
    /* conveyor from the departments to the data centre */
    const beltLen=128;this.beltTex=this.tex(64,512,(x,W,H)=>{x.fillStyle="#2a3446";x.fillRect(0,0,W,H);x.fillStyle="#3a4760";for(let i=0;i<8;i++)x.fillRect(0,i*64,W,22)});
    this.beltTex.wrapS=this.beltTex.wrapT=THREE.RepeatWrapping;this.beltTex.repeat.set(1,beltLen/8);
    const beltM=new THREE.MeshStandardMaterial({map:this.beltTex,roughness:.6});
    const belt=new THREE.Mesh(new THREE.BoxGeometry(beltLen,.6,5),beltM);belt.position.set(-94+beltLen/2+24,.4,16);belt.receiveShadow=true;S.add(belt);
    const rail1=this.rb(beltLen,1.2,.6,.3,M.steel);rail1.position.set(belt.position.x,.9,13.4);S.add(rail1);const rail2=rail1.clone();rail2.position.z=18.6;S.add(rail2);
    this.beltY=1;this.beltZ=16;
    this.buildDepts();this.buildConverter();this.buildGate();this.buildDataCentre();this.buildMap();this.buildPortal();this.buildApps();this.buildDocs();this.buildLoop()}

  buildDepts(){const S=this.scene,M=this.M;this.depts=[];
    const pos=[[-142,-18],[-124,-24],[-106,-24],[-88,-18],[-142,0],[-124,-4],[-106,-4],[-88,0]];
    DEPTS.forEach((d,i)=>{const g=new THREE.Group();const [x,z]=pos[i];g.position.set(x,0,z);S.add(g);
      const acc=new THREE.MeshStandardMaterial({color:d.col,roughness:.45});
      const H=[16,12,13,11,12,10,11,14][i],W=13,D=10;
      if(i===0){/* Revenue: the state secretariat style, columns and a dome */
        const b=this.rb(W+2,H*.7,D,.5,M.wall);b.position.y=H*.35;g.add(b);
        for(let c=0;c<6;c++){const col=new THREE.Mesh(new THREE.CylinderGeometry(.45,.5,H*.6,16),M.wall2);col.position.set(-W/2+1.6+c*2.4,H*.3,D/2+.9);col.castShadow=true;g.add(col)}
        const pedi=this.rb(W+3,1,3,.3,M.wall);pedi.position.set(0,H*.62,D/2+.9);g.add(pedi);
        const dome=new THREE.Mesh(new THREE.SphereGeometry(3.6,32,16,0,Math.PI*2,0,Math.PI/2),new THREE.MeshPhysicalMaterial({color:0xe7d7b6,roughness:.3,clearcoat:.6}));dome.position.y=H*.7;dome.castShadow=true;g.add(dome);
        const drum=new THREE.Mesh(new THREE.CylinderGeometry(3.7,3.7,1.4,32),M.wall2);drum.position.y=H*.7;g.add(drum)}
      else{const b=this.rb(W,H,D,.7,M.wall);b.position.y=H/2;g.add(b);
        const roof=this.rb(W+.6,.8,D+.6,.3,acc);roof.position.y=H+.3;g.add(roof);
        /* glass window bands */
        const rows=Math.floor((H-3)/2.6);for(let r=0;r<rows;r++){const w=this.rb(W-2.4,1.4,.3,.2,M.glass);w.position.set(0,2.8+r*2.6,D/2+.05);w.castShadow=false;g.add(w)}
        const door=this.rb(2.6,2.6,.4,.2,M.ink);door.position.set(0,1.3,D/2+.1);g.add(door)}
      /* sign: name in English and Hindi */
      const st=this.tex(512,160,signDraw(d.name.en,d.name.hi,d.col));const sign=new THREE.Mesh(new THREE.PlaneGeometry(10,3.1),new THREE.MeshBasicMaterial({map:st,transparent:true}));
      sign.position.set(0,i===0?H*.7+5.2:H+3.2,i===0?0:D/2-1);if(i===0)sign.position.z=D/2;g.add(sign);
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,2,8),M.steel);pole.position.set(0,sign.position.y-2,sign.position.z-.1);if(i!==0)g.add(pole);
      /* flag on the secretariat */
      if(i===0){const fp=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,5,8),M.steel);fp.position.set(0,H*.7+5.5+3.6,0);g.add(fp)}
      this.depts.push({g,top:i===0?H*.7+3.6:H+.8,d,acc})})}

  /* the CHiPS GIS team: an open lab behind the conveyor where analysts convert every format by hand and by script */
  buildConverter(){const S=this.scene,M=this.M,g=this.conv=new THREE.Group();g.position.set(-46,0,16);S.add(g);
    /* floor, back wall, side partitions */
    const floor=this.rb(34,.8,26,.4,new THREE.MeshStandardMaterial({color:0xe8edf4,roughness:.7}));floor.position.set(0,.4,-13);g.add(floor);
    const wall=this.rb(34,13,1,.4,M.wall);wall.position.set(0,6.5,-26);g.add(wall);
    const sideL=this.rb(1,7,24,.3,M.wall2);sideL.position.set(-16.5,3.5,-14);g.add(sideL);const sideR=sideL.clone();sideR.position.x=16.5;g.add(sideR);
    const stripe=this.rb(34,.6,1.1,.2,M.accent);stripe.position.set(0,12.6,-26);g.add(stripe);
    /* big wall screen: what everything is converted to */
    this.convTex=this.tex(768,256,(x,W,H)=>{x.fillStyle="#06101f";rr(x,0,0,W,H,24);x.fill();x.fillStyle="#3fd6a0";x.font=`600 30px ${MONO}`;x.fillText("ANY FORMAT  →  ONE STANDARD",32,60);
      x.fillStyle="#fff";x.font=`800 64px ${SANS}`;x.fillText("EPSG:4326 · WGS 84",32,150);x.fillStyle="#9fb4d0";x.font=`500 26px ${MONO}`;x.fillText("GeoJSON · state schema · UTF-8",32,210)});
    const scr=new THREE.Mesh(new THREE.PlaneGeometry(18,6),new THREE.MeshBasicMaterial({map:this.convTex,toneMapped:false}));scr.position.set(0,7.6,-25.45);g.add(scr);
    const lab=this.tex(640,160,signDraw("CHiPS GIS Team","चिप्स जीआईएस टीम","#ff5a36"));const l=new THREE.Mesh(new THREE.PlaneGeometry(14,3.5),new THREE.MeshBasicMaterial({map:lab,transparent:true}));l.position.set(0,15.6,-25.6);g.add(l);
    /* monitor screens: real GIS work */
    const scrA=this.tex(320,200,(x,W,H)=>{x.fillStyle="#1b2433";x.fillRect(0,0,W,H);x.fillStyle="#2a3446";x.fillRect(0,0,W,18);x.fillStyle="#dfe7f1";x.fillRect(40,18,W-40,H-18);
      x.strokeStyle="#ff5a36";x.lineWidth=3;x.beginPath();[[80,60],[170,40],[260,80],[240,160],[120,170],[70,120]].forEach((p,i)=>i?x.lineTo(...p):x.moveTo(...p));x.closePath();x.stroke();x.fillStyle="#ff5a3633";x.fill();
      x.fillStyle="#fff";[[80,60],[170,40],[260,80],[240,160],[120,170],[70,120]].forEach(p=>{x.fillRect(p[0]-4,p[1]-4,8,8)});x.fillStyle="#9fb4d0";for(let i=0;i<6;i++)x.fillRect(8,28+i*22,24,14)});
    const scrB=this.tex(320,200,(x,W,H)=>{x.fillStyle="#fff";x.fillRect(0,0,W,H);x.fillStyle="#0d1b2e";x.fillRect(0,0,W,22);x.fillStyle="#fff";x.font=`600 12px ${MONO}`;x.fillText("attribute table · schools",8,15);
      for(let r=0;r<8;r++)for(let c=0;c<4;c++){x.fillStyle=r%2?"#f3f6fb":"#fff";x.fillRect(c*80,24+r*22,80,22);x.strokeStyle="#e3e9f2";x.strokeRect(c*80,24+r*22,80,22);x.fillStyle=r===3?"#d2423a":"#2a3446";x.font=`500 11px ${MONO}`;x.fillText(["GPS","2227","21.1","81.7"][c]+r,c*80+6,40+r*22)}});
    const scrC=this.tex(320,200,(x,W,H)=>{x.fillStyle="#efe3c4";x.fillRect(0,0,W,H);x.strokeStyle="#9c8a63";for(let i=0;i<7;i++){x.beginPath();x.moveTo(0,i*32);x.bezierCurveTo(100,i*32+20,200,i*32-20,W,i*32+8);x.stroke()}
      x.strokeStyle="#222";x.lineWidth=3;x.beginPath();x.moveTo(20,180);x.lineTo(300,30);x.stroke();x.strokeStyle="#d2423a";x.lineWidth=2;[[40,40],[280,44],[270,170],[50,160]].forEach(([a,b])=>{x.beginPath();x.moveTo(a-10,b);x.lineTo(a+10,b);x.moveTo(a,b-10);x.lineTo(a,b+10);x.stroke()});
      x.fillStyle="#0d1b2e";x.fillRect(0,H-22,W,22);x.fillStyle="#3fd6a0";x.font=`600 12px ${MONO}`;x.fillText("georeferencer · 4 GCPs · RMS 0.8 px",8,H-7)});
    const screens=[scrA,scrB,scrC];
    /* desks with dual monitors, chairs and analysts */
    const deskM=new THREE.MeshStandardMaterial({color:0xf6f1e8,roughness:.5}),legM=M.steel,chairM=new THREE.MeshStandardMaterial({color:0x2a3446,roughness:.6});
    const shirts=[0x2f6fd6,0xff5a36,0x3e8a4f,0x6b4fd6,0xe39a1f,0x0b7a70],skins=[0x8d5524,0xc68642,0xa0662f,0x7a4a21,0xb87a46,0x95603a],hairs=[0x1b1410,0x231a14,0x111111];
    this.analysts=[];seed=3;
    [[-9,-9],[0,-9],[9,-9],[-9,-18],[0,-18],[9,-18]].forEach(([x,z],k)=>{
      const desk=this.rb(7.4,.35,3.2,.15,deskM);desk.position.set(x,3.4,z);g.add(desk);
      [-3.2,3.2].forEach(dx=>{const leg=this.rb(.3,3,2.8,.1,legM);leg.position.set(x+dx,1.9,z);g.add(leg)});
      [-1.6,1.6].forEach((dx,m)=>{const mon=this.rb(3,1.9,.2,.1,M.ink);mon.position.set(x+dx,5.3,z-.9);mon.rotation.y=dx<0?.12:-.12;g.add(mon);
        const face=new THREE.Mesh(new THREE.PlaneGeometry(2.8,1.7),new THREE.MeshBasicMaterial({map:screens[(k+m)%3],toneMapped:false}));face.position.z=.11;mon.add(face);
        const st=this.rb(.3,1,.3,.1,legM);st.position.set(x+dx,4.1,z-.9);g.add(st)});
      const kb=this.rb(2.2,.12,.7,.05,M.ink);kb.position.set(x,3.65,z+.6);g.add(kb);
      /* chair */
      const seat=this.rb(2.2,.4,2.2,.3,chairM);seat.position.set(x,2.5,z+2.6);g.add(seat);const backr=this.rb(2.2,2.4,.35,.3,chairM);backr.position.set(x,3.9,z+3.6);g.add(backr);
      const post=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,2,8),legM);post.position.set(x,1.3,z+2.6);g.add(post);
      /* analyst (seen from behind, working) */
      const p=new THREE.Group();p.position.set(x,2.7,z+2.5);g.add(p);
      const shirt=new THREE.MeshStandardMaterial({color:shirts[k],roughness:.7});
      const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.75,1.3,6,14),shirt);torso.position.y=1.45;torso.scale.z=.75;torso.castShadow=true;p.add(torso);
      [-1,1].forEach(sx=>{const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.24,1.2,4,8),shirt);arm.position.set(sx*.82,1.55,-.55);arm.rotation.x=1.15;arm.castShadow=true;p.add(arm)});
      const head=new THREE.Group();head.position.y=3.05;p.add(head);
      const skull=new THREE.Mesh(new THREE.SphereGeometry(.58,20,16),new THREE.MeshStandardMaterial({color:skins[k],roughness:.6}));skull.castShadow=true;head.add(skull);
      const hair=new THREE.Mesh(new THREE.SphereGeometry(.62,20,16,0,Math.PI*2,0,Math.PI*.55),new THREE.MeshStandardMaterial({color:hairs[k%3],roughness:.8}));hair.rotation.x=.35;head.add(hair);
      if(k===1||k===4){const bun=new THREE.Mesh(new THREE.SphereGeometry(.3,12,10),hair.material);bun.position.set(0,.2,.55);head.add(bun)}
      this.analysts.push({head,ph:rnd()*6})});
    /* intake and output on the conveyor (pulsing rings) */
    const ringM=new THREE.MeshStandardMaterial({color:col("--accent","#ff5a36"),emissive:col("--accent","#ff5a36"),emissiveIntensity:1.6});
    this.ringIn=new THREE.Mesh(new THREE.TorusGeometry(4.2,.45,20,56),ringM);this.ringIn.rotation.y=Math.PI/2;this.ringIn.position.set(-9.2,4.4,0);g.add(this.ringIn);
    const ringOutM=new THREE.MeshStandardMaterial({color:0x3fd6a0,emissive:0x3fd6a0,emissiveIntensity:1.6});
    this.ringOut=new THREE.Mesh(new THREE.TorusGeometry(4.2,.45,20,56),ringOutM);this.ringOut.rotation.y=Math.PI/2;this.ringOut.position.set(9.2,4.4,0);g.add(this.ringOut);
    this.scan=new THREE.Mesh(new THREE.PlaneGeometry(.25,7.4),new THREE.MeshBasicMaterial({color:0xff9a7a,transparent:true,opacity:.8}));this.scan.rotation.y=Math.PI/2;this.scan.position.set(-9.3,4.4,0);g.add(this.scan)}

  buildGate(){const S=this.scene,M=this.M,g=this.gate=new THREE.Group();g.position.set(-24,0,16);S.add(g);
    const p1=this.rb(1.6,12,1.6,.5,M.wall);p1.position.set(0,6,-4.5);g.add(p1);const p2=p1.clone();p2.position.z=4.5;g.add(p2);
    const beam=this.rb(1.8,1.8,11,.6,M.wall);beam.position.y=12.4;g.add(beam);
    this.gateLight=new THREE.Mesh(new THREE.BoxGeometry(.4,.4,9),new THREE.MeshStandardMaterial({color:0x3fd6a0,emissive:0x3fd6a0,emissiveIntensity:2}));this.gateLight.position.y=11.3;g.add(this.gateLight);
    this.gateCurtain=new THREE.Mesh(new THREE.PlaneGeometry(9,10),new THREE.MeshBasicMaterial({color:0x3fd6a0,transparent:true,opacity:.08,side:THREE.DoubleSide,depthWrite:false}));this.gateCurtain.rotation.y=Math.PI/2;this.gateCurtain.position.y=6;g.add(this.gateCurtain);
    const lab=this.tex(512,128,signDraw("Quality gate","गुणवत्ता जाँच","#3fd6a0"));const l=new THREE.Mesh(new THREE.PlaneGeometry(9,2.25),new THREE.MeshBasicMaterial({map:lab,transparent:true}));l.position.set(0,15.2,0);g.add(l)}

  buildDataCentre(){const S=this.scene,M=this.M,g=this.dc=new THREE.Group();g.position.set(14,0,0);S.add(g);
    /* raised data-centre floor with perforated tiles */
    const tileT=this.tex(256,256,(x,W,H)=>{x.fillStyle="#d9dee6";x.fillRect(0,0,W,H);x.strokeStyle="#b7c0cc";x.lineWidth=4;x.strokeRect(2,2,W-4,H-4);x.fillStyle="#aeb7c3";for(let i=0;i<10;i++)for(let j=0;j<10;j++){x.beginPath();x.arc(28+i*22,28+j*22,4,0,7);x.fill()}});
    tileT.wrapS=tileT.wrapT=THREE.RepeatWrapping;tileT.repeat.set(9,8);
    const floor=this.rb(36,1.2,32,.4,new THREE.MeshStandardMaterial({map:tileT,roughness:.6,metalness:.2}));floor.position.y=.6;g.add(floor);
    /* real server racks: 42U frame, stacked 1U/2U servers with drive bays, handles and status LEDs, smoked glass door */
    const frameM=new THREE.MeshStandardMaterial({color:0x15181d,roughness:.45,metalness:.6});
    const unitM=new THREE.MeshStandardMaterial({color:0x2a2f37,roughness:.4,metalness:.7});
    const bezelM=new THREE.MeshStandardMaterial({color:0x3a414c,roughness:.35,metalness:.8});
    const bayM=new THREE.MeshStandardMaterial({color:0x0c0f13,roughness:.5,metalness:.4});
    const handleM=new THREE.MeshStandardMaterial({color:0xaab3bf,roughness:.25,metalness:1});
    const doorM=new THREE.MeshPhysicalMaterial({color:0x0a1220,roughness:.05,metalness:0,transmission:.6,transparent:true,opacity:.35,clearcoat:1,envMapIntensity:1.5});
    const RW=5,RH=14,RD=7,UNIT=RH/30;
    const bays=[],leds=[],handles=[];
    const racks=[];for(let row=0;row<2;row++)for(let c=0;c<4;c++)racks.push([-10.5+c*7,-6.5+row*13,row]);
    racks.forEach(([x,z,row])=>{const r=new THREE.Group();r.position.set(x,1.2,z);g.add(r);
      /* frame: four posts, top and bottom plates, side panels */
      const top=this.rb(RW,.5,RD,.15,frameM);top.position.y=RH-.25;r.add(top);const bot=this.rb(RW,.6,RD,.15,frameM);bot.position.y=.3;r.add(bot);
      const side=this.rb(.2,RH,RD,.08,frameM);side.position.set(-RW/2+.1,RH/2,0);r.add(side);const side2=side.clone();side2.position.x=RW/2-.1;r.add(side2);
      const back=this.rb(RW,RH,.2,.08,frameM);back.position.set(0,RH/2,-RD/2+.1);r.add(back);
      /* top vents */
      for(let v=0;v<4;v++){const f=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.12,20),bayM);f.position.set(-1.2+(v%2)*2.4,RH+.02,-1.4+Math.floor(v/2)*2.8);r.add(f)}
      /* servers: a mix of 1U and 2U, a few gaps with blanking panels */
      let y=.8;seed=Math.floor((x+20)*7+row*13);
      while(y<RH-1.4){const u=rnd()<.6?1:2,h=u*UNIT-.06;
        if(rnd()<.12){const blank=this.rb(RW-.5,h,.2,.04,frameM);blank.position.set(0,y+h/2,RD/2-.4);r.add(blank);y+=u*UNIT;continue}
        const sv=this.rb(RW-.5,h,RD-1,.06,unitM);sv.position.set(0,y+h/2,-.2);r.add(sv);
        const bz=this.rb(RW-.4,h,.18,.05,bezelM);bz.position.set(0,y+h/2,RD/2-.55);r.add(bz);
        /* drive bays across the front */
        const nb=u===1?8:6,bw=(RW-1.6)/nb;for(let k=0;k<nb;k++)bays.push([r,new THREE.Vector3(-RW/2+1.1+bw*(k+.5),y+h/2,RD/2-.42),bw*.82,h*.7]);
        handles.push([r,new THREE.Vector3(-RW/2+.45,y+h/2,RD/2-.42),h*.8],[r,new THREE.Vector3(RW/2-.45,y+h/2,RD/2-.42),h*.8]);
        leds.push([r,new THREE.Vector3(-RW/2+.75,y+h/2+h*.2,RD/2-.4)],[r,new THREE.Vector3(-RW/2+.75,y+h/2-h*.2,RD/2-.4)]);
        y+=u*UNIT}
      /* smoked glass door, slightly open on the front row */
      const door=new THREE.Mesh(new THREE.BoxGeometry(RW-.1,RH-.4,.08),doorM);door.position.set(0,RH/2,RD/2+.06);r.add(door);
      const dh=this.rb(.15,2.2,.25,.06,handleM);dh.position.set(RW/2-.4,RH/2,RD/2+.2);r.add(dh)});
    /* instanced detail: bays, handles, LEDs (world matrices) */
    g.updateMatrixWorld(true);const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),v=new THREE.Vector3();
    const inst=(geo,mat,list,fn)=>{const im=new THREE.InstancedMesh(geo,mat,list.length);list.forEach((it,k)=>{fn(it,sc);v.copy(it[1]);it[0].localToWorld(v);g.worldToLocal(v);
      q.setFromRotationMatrix(new THREE.Matrix4().extractRotation(it[0].matrixWorld));m4.compose(v,q,sc);im.setMatrixAt(k,m4)});g.add(im);return im};
    inst(new THREE.BoxGeometry(1,1,.08),bayM,bays,(it,s)=>s.set(it[2],it[3],1));
    inst(new THREE.BoxGeometry(.12,1,.18),handleM,handles,(it,s)=>s.set(1,it[2],1));
    this.ledMesh=inst(new THREE.BoxGeometry(.16,.1,.06),new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}),leds,(it,s)=>s.set(1,1,1));
    this.ledMesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(leds.length*3),3);
    this.leds=leds.map(()=>({p:rnd()*6,s:.5+rnd()*2.5}));
    /* overhead cable tray with cables running to the racks */
    const tray=this.rb(30,.5,2.2,.15,M.steel);tray.position.set(0,17.2,0);g.add(tray);
    const cabM=[0x2f6fd6,0xffc93c,0x3fd6a0].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.5}));
    racks.forEach(([x,z],k)=>{for(let c=0;c<2;c++){const pts=[new THREE.Vector3(x-1+c*.6,17,0),new THREE.Vector3(x-1+c*.6,16.4,z*.5),new THREE.Vector3(x-1+c*.6,15.4,z)];
      const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),12,.09,6),cabM[(k+c)%3]);g.add(m)}});
    /* cool air glow under the floor */
    const glow=new THREE.Mesh(new THREE.PlaneGeometry(34,30),new THREE.MeshBasicMaterial({color:0x5fa8ff,transparent:true,opacity:.12,depthWrite:false}));glow.rotation.x=-Math.PI/2;glow.position.y=1.25;g.add(glow);this.dcGlow=glow;
    const lab=this.tex(640,128,signDraw("State Data Centre","राज्य डेटा केंद्र","#5fa8ff"));const l=new THREE.Mesh(new THREE.PlaneGeometry(13,2.6),new THREE.MeshBasicMaterial({map:lab,transparent:true}));l.position.set(0,20,4);g.add(l);
    /* geodatabase layers floating above the racks */
    this.sheets=[];const L=[["Boundaries","#8a6a3c"],["Forest","#3e8a4f"],["Rivers","#1d6fd6"],["Roads","#d2733c"],["Rail","#3a383d"],["Facilities","#6b4fd6"]];
    L.forEach(([n,c],i)=>{const t=this.tex(512,64,(x,W,H)=>{x.fillStyle="#ffffffee";rr(x,0,0,W,H,14);x.fill();x.fillStyle=c;x.fillRect(0,0,16,H);x.fillStyle="#0d1b2e";x.font=`700 34px ${SANS}`;x.fillText(n,32,44)});
      const sh=this.rb(22,.5,14,.4,new THREE.MeshPhysicalMaterial({color:c,transparent:true,opacity:.55,roughness:.2,clearcoat:1,transmission:0}));sh.castShadow=false;
      const lb=new THREE.Mesh(new THREE.PlaneGeometry(8,1),new THREE.MeshBasicMaterial({map:t,transparent:true}));lb.position.set(-14.5,0,0);sh.add(lb);
      g.add(sh);this.sheets.push(sh)})}

  buildMap(){const S=this.scene,M=this.M,g=this.mapG=new THREE.Group();S.add(g);
    const plinth=this.rb(54,3,78,1.5,M.wall2);plinth.position.set(MX,1.5,1);g.add(plinth);
    const shp=r=>{const s=new THREE.Shape();r.forEach(([lo,la],i)=>{const[x,z]=P(lo,la);i?s.lineTo(x,-z):s.moveTo(x,-z)});return s};
    this.dist=[];const top=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.7}),side=new THREE.MeshStandardMaterial({color:col("--w-side","#c5d2e4"),roughness:.8});
    G.districts.forEach((d,i)=>{const geo=new THREE.ExtrudeGeometry(d.r.map(shp),{depth:.8,bevelEnabled:true,bevelThickness:.08,bevelSize:.08,bevelSegments:1});
      const m=new THREE.Mesh(geo,[top.clone(),side]);m.rotation.x=-Math.PI/2;m.position.y=3;m.castShadow=m.receiveShadow=true;
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo,30),new THREE.LineBasicMaterial({color:0x9fb0c8})));
      let cx=0,cz=0;d.r[0].forEach(([lo,la])=>{const[x,z]=P(lo,la);cx+=x;cz+=z});cx/=d.r[0].length;cz/=d.r[0].length;
      g.add(m);this.dist.push({m,name:d.n,c:[cx,cz],base:new THREE.Color(0xffffff),h:rnd()})});
    const lines=(list,color,r)=>{const grp=new THREE.Group();const mt=new THREE.MeshStandardMaterial({color,roughness:.4,emissive:color,emissiveIntensity:.15});
      list.forEach(l=>{if(l.p.length<2)return;const pts=l.p.map(([lo,la])=>{const[x,z]=P(lo,la);return new THREE.Vector3(x,4.05,z)});
        const tube=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,false,"centripetal"),Math.max(8,pts.length*3),r,6,false);const m=new THREE.Mesh(tube,mt);m.userData.full=tube.index.count;tube.setDrawRange(0,0);grp.add(m)});
      g.add(grp);return grp};
    this.rivers=lines(G.rivers,0x1d6fd6,.22);this.roads=lines(G.roads,0xd2733c,.15);this.rail=lines(G.rail,0x3a383d,.1);
    /* facilities and forest: instanced, illustrative positions inside real districts */
    const pip=(pt,ring)=>{let ins=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const[xi,yi]=ring[i],[xj,yj]=ring[j];if(((yi>pt[1])!==(yj>pt[1]))&&pt[0]<(xj-xi)*(pt[1]-yi)/(yj-yi)+xi)ins=!ins}return ins};
    const pts=[];seed=21;G.districts.forEach(d=>{const r=d.r[0];let a=[1e9,1e9,-1e9,-1e9];r.forEach(([x,y])=>{a=[Math.min(a[0],x),Math.min(a[1],y),Math.max(a[2],x),Math.max(a[3],y)]});
      for(let k=0,t=0;k<3&&t<200;t++){const p=[a[0]+rnd()*(a[2]-a[0]),a[1]+rnd()*(a[3]-a[1])];if(d.r.some(rr=>pip(p,rr))){pts.push(p);k++}}});
    const pinG=new THREE.CylinderGeometry(0,.28,.9,10);pinG.translate(0,.45,0);const head=new THREE.SphereGeometry(.3,14,10);head.translate(0,1.05,0);
    const pinM=new THREE.MeshStandardMaterial({vertexColors:false,roughness:.35});
    this.fac=new THREE.InstancedMesh(pinG,pinM,pts.length);this.facH=new THREE.InstancedMesh(head,pinM,pts.length);this.facPts=pts;
    const cols=[0x2f6fd6,0xd2423a,0xe39a1f];pts.forEach((p,i)=>{const c=new THREE.Color(cols[i%3]);this.fac.setColorAt(i,c);this.facH.setColorAt(i,c)});
    this.fac.castShadow=this.facH.castShadow=true;g.add(this.fac,this.facH);
    const tg=new THREE.ConeGeometry(.6,1.6,7);tg.translate(0,.8,0);this.trees=new THREE.InstancedMesh(tg,new THREE.MeshStandardMaterial({color:0x3e8a4f,roughness:.8,flatShading:true}),220);
    const forestD=new Set(["Bastar","Dantewada","Bijapur","Sukma","Narayanpur","Kanker","Kondagaon","Sarguja","Jashpur","Korba","Balrampur-Ramanujganj","Surajpur","Koriya","Gariyaband","Dhamtari"]);
    this.treePts=[];seed=5;G.districts.filter(d=>forestD.has(d.n)).forEach(d=>{const r=d.r[0];let a=[1e9,1e9,-1e9,-1e9];r.forEach(([x,y])=>{a=[Math.min(a[0],x),Math.min(a[1],y),Math.max(a[2],x),Math.max(a[3],y)]});
      for(let k=0,t=0;k<9&&t<300&&this.treePts.length<220;t++){const p=[a[0]+rnd()*(a[2]-a[0]),a[1]+rnd()*(a[3]-a[1])];if(d.r.some(rr=>pip(p,rr))){this.treePts.push([p,.6+rnd()*.7]);k++}}});
    this.trees.count=this.treePts.length;this.trees.castShadow=true;g.add(this.trees);
    const lab=this.tex(640,128,signDraw("Chhattisgarh · 33 districts","छत्तीसगढ़ · 33 ज़िले","#ff5a36"));this.mapSign=new THREE.Mesh(new THREE.PlaneGeometry(14,2.8),new THREE.MeshBasicMaterial({map:lab,transparent:true}));this.mapSign.position.set(MX,4.6,41);g.add(this.mapSign)}

  buildPortal(){const S=this.scene,M=this.M,g=this.portal=new THREE.Group();g.position.set(MX,0,-50);S.add(g);
    const frame=this.rb(70,40,1.6,1.4,M.ink);g.add(frame);
    this.portalTex=this.tex(1400,780,(x,W,H)=>this.drawPortal(x,W,H,0));
    const scr=new THREE.Mesh(new THREE.PlaneGeometry(67,37.3),new THREE.MeshBasicMaterial({map:this.portalTex,toneMapped:false}));scr.position.z=.85;g.add(scr);
    const stand=this.rb(4,20,3,1,M.steel);stand.position.set(0,-18,-1);g.add(stand);g.position.y=-40;this.portalScr=scr}
  drawPortal(x,W,H,hl){x.fillStyle="#f3f6fb";x.fillRect(0,0,W,H);
    x.fillStyle="#e3e9f2";x.fillRect(0,0,W,64);[["#ff5f57",28],["#febc2e",54],["#28c840",80]].forEach(([c,X])=>{x.fillStyle=c;x.beginPath();x.arc(X,32,9,0,7);x.fill()});
    x.fillStyle="#fff";rr(x,300,14,560,36,10);x.fill();x.fillStyle="#5b6b80";x.font=`500 20px ${MONO}`;x.fillText("cggis.cgstate.gov.in",320,39);
    x.fillStyle="#0d1b2e";x.fillRect(0,64,W,70);x.fillStyle="#fff";x.font=`800 32px ${SANS}`;x.fillText("Chhattisgarh State Geoportal",32,110);x.fillStyle="#ffc93c";rr(x,W-230,82,200,36,18);x.fill();x.fillStyle="#1c1300";x.font=`700 20px ${SANS}`;x.fillText("✦  Ask AI",W-200,107);
    /* sidebar */
    x.fillStyle="#fff";x.fillRect(0,134,300,H-134);x.fillStyle="#0d1b2e";x.font=`700 22px ${SANS}`;x.fillText("Layers",24,176);
    [["Districts","#8a6a3c"],["Rivers","#1d6fd6"],["Roads","#d2733c"],["Rail","#3a383d"],["Schools","#2f6fd6"],["Health centres","#d2423a"],["Anganwadi","#e39a1f"],["Forest cover","#3e8a4f"]].forEach(([n,c],i)=>{
      x.fillStyle=c;rr(x,24,200+i*48,22,22,6);x.fill();x.fillStyle="#fff";x.font=`700 16px ${SANS}`;x.fillText("✓",29,217+i*48);x.fillStyle="#2a3446";x.font=`500 20px ${SANS}`;x.fillText(n,58,218+i*48)});
    x.fillStyle="#eef2f8";rr(x,24,H-70,252,44,22);x.fill();x.fillStyle="#7a8798";x.font=`500 18px ${SANS}`;x.fillText("Search a village…",44,H-42);
    /* the map */
    const ox=300,oy=134,mw=W-ox,mh=H-oy;x.fillStyle="#dfe7f1";x.fillRect(ox,oy,mw,mh);
    const lo0=80.1,lo1=84.5,la0=17.6,la1=24.2,s=Math.min(mw/((lo1-lo0)*CX),mh/(la1-la0))*.95,cx=ox+mw/2,cy=oy+mh/2;
    const pr=(lo,la)=>[cx+(lo-(lo0+lo1)/2)*CX*s,cy-(la-(la0+la1)/2)*s];
    G.districts.forEach((d,i)=>{x.beginPath();d.r.forEach(r=>r.forEach((p,j)=>{const q=pr(...p);j?x.lineTo(...q):x.moveTo(...q)}));
      x.fillStyle=hl&&d.n===hl?"#ffd9a8":"#ffffff";x.fill();x.strokeStyle="#9fb0c8";x.lineWidth=1.2;x.stroke()});
    const ln=(list,c,w)=>{x.strokeStyle=c;x.lineWidth=w;list.forEach(l=>{x.beginPath();l.p.forEach((p,j)=>{const q=pr(...p);j?x.lineTo(...q):x.moveTo(...q)});x.stroke()})};
    ln(G.rivers,"#1d6fd6",3);ln(G.roads,"#d2733c",2);ln(G.rail,"#3a383d",1.5);
    (this.facPts||[]).forEach((p,i)=>{const q=pr(...p);x.fillStyle=["#2f6fd6","#d2423a","#e39a1f"][i%3];x.beginPath();x.arc(q[0],q[1],4,0,7);x.fill()});
    /* zoom buttons and scale */
    x.fillStyle="#fff";rr(x,W-70,160,46,92,10);x.fill();x.fillStyle="#0d1b2e";x.font=`700 30px ${SANS}`;x.fillText("+",W-56,194);x.fillText("−",W-56,240);
    x.fillStyle="#0d1b2e";x.fillRect(W-200,H-40,150,4);x.font=`500 16px ${MONO}`;x.fillText("50 km",W-150,H-50)}

  buildApps(){const S=this.scene,M=this.M,g=this.apps=new THREE.Group();g.position.set(132,0,0);S.add(g);
    const screen=(w,h,draw)=>{const t=this.tex(Math.round(w*40),Math.round(h*40),draw);return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,toneMapped:false}))};
    const ped=(x,z,w)=>{const p=this.rb(w,2,w*.7,.6,M.wall2);p.position.set(x,1,z);g.add(p);return p};
    /* phone: field app */
    ped(-18,4,10);const ph=this.phoneG=new THREE.Group();ph.position.set(-18,9.5,4);ph.rotation.set(-.15,.35,0);g.add(ph);
    ph.add(this.rb(6,12,.7,.9,M.ink));const ps=screen(5.4,11.2,(x,W,H)=>{x.fillStyle="#f3f6fb";x.fillRect(0,0,W,H);x.fillStyle="#0d1b2e";x.fillRect(0,0,W,56);x.fillStyle="#fff";x.font=`700 22px ${SANS}`;x.fillText("Field app",16,36);
      x.fillStyle="#dfe7f1";x.fillRect(0,56,W,H*.55);x.strokeStyle="#1d6fd6";x.lineWidth=4;x.beginPath();x.moveTo(0,200);x.bezierCurveTo(80,170,140,260,W,230);x.stroke();
      x.fillStyle="#2f6fd6";x.beginPath();x.arc(W/2,190,12,0,7);x.fill();x.strokeStyle="#2f6fd688";x.lineWidth=3;x.beginPath();x.arc(W/2,190,30,0,7);x.stroke();
      x.fillStyle="#0d1b2e";x.font=`500 15px ${MONO}`;x.fillText("21.0602 N  81.7604 E",14,H*.55+90);x.fillStyle="#ffc93c";rr(x,14,H-90,W-28,60,30);x.fill();x.fillStyle="#1c1300";x.font=`700 20px ${SANS}`;x.fillText("Capture point",40,H-52)});
    ps.position.z=.37;ph.add(ps);
    /* tablet: dashboard */
    ped(0,-6,16);const tb=this.tabG=new THREE.Group();tb.position.set(0,10,-6);tb.rotation.set(-.12,0,0);g.add(tb);
    tb.add(this.rb(18,12.5,.7,1,M.ink));const ts=screen(17,11.5,(x,W,H)=>{x.fillStyle="#fff";x.fillRect(0,0,W,H);x.fillStyle="#0d1b2e";x.font=`800 30px ${SANS}`;x.fillText("Coverage by district",24,50);
      const v=[.92,.81,.77,.7,.66,.58,.52,.44];v.forEach((p,i)=>{x.fillStyle="#e3e9f2";rr(x,180,80+i*48,W-220,30,8);x.fill();x.fillStyle=i<3?"#3fd6a0":i<6?"#ffc93c":"#ff5a36";rr(x,180,80+i*48,(W-220)*p,30,8);x.fill();
        x.fillStyle="#2a3446";x.font=`500 18px ${SANS}`;x.fillText(["Raipur","Durg","Bilaspur","Korba","Rajnandgaon","Bastar","Kondagaon","Sukma"][i],24,101+i*48)})});
    ts.position.z=.37;tb.add(ts);
    /* laptop: department GIS */
    ped(18,6,16);const lp=this.lapG=new THREE.Group();lp.position.set(18,2.2,6);lp.rotation.y=-.3;g.add(lp);
    const kb=this.rb(16,.6,10,.4,M.steel);kb.position.y=.3;lp.add(kb);const lid=new THREE.Group();lid.position.set(0,.6,-5);lid.rotation.x=-.22;lp.add(lid);
    const lb=this.rb(16,10,.5,.4,M.ink);lb.position.y=5;lid.add(lb);const lsc=screen(15,9,(x,W,H)=>{x.fillStyle="#13233d";x.fillRect(0,0,W,H);x.fillStyle="#1d2f4d";x.fillRect(0,0,160,H);
      for(let i=0;i<7;i++){x.fillStyle="#9fb4d0";x.fillRect(16,30+i*40,110,10)}x.strokeStyle="#5fa8ff";x.lineWidth=2;for(let i=0;i<30;i++){x.beginPath();x.arc(200+((i*97)%400),60+((i*53)%300),3+i%4,0,7);x.stroke()}
      x.strokeStyle="#ffd36b";x.lineWidth=4;x.beginPath();x.moveTo(170,330);x.bezierCurveTo(300,250,420,280,W,120);x.stroke()});lsc.position.set(0,5,.26);lid.add(lsc);
    [this.phoneG,this.tabG,this.lapG].forEach(o=>o.scale.setScalar(.001))}

  buildDocs(){const S=this.scene;this.docs=DEPTS.map((d,i)=>{const t=this.tex(512,660,docDraw(d));
    const card=this.rb(6.4,8.25,.25,.5,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.5}));card.castShadow=true;
    const face=new THREE.Mesh(new THREE.PlaneGeometry(6.4,8.25),new THREE.MeshBasicMaterial({map:t,transparent:true,toneMapped:false}));face.position.z=.14;card.add(face);
    const g=new THREE.Group();g.add(card);S.add(g);g.scale.setScalar(.001);
    /* the converted output: a glowing feature of the right kind */
    const c=new THREE.Color(d.col),mt=new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.6,roughness:.3});
    let out;if(d.kind==="point"){const pin=new THREE.ConeGeometry(.9,2.4,16);pin.rotateX(Math.PI);pin.translate(0,1.2,0);out=new THREE.Group();out.add(new THREE.Mesh(pin,mt));const h=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),mt);h.position.y=2.9;out.add(h)}
    else if(d.kind==="line"){const pts=[[-2.4,0,0],[-1,0,1.2],[.6,0,-.8],[2.4,0,.6]].map(p=>new THREE.Vector3(...p));out=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),32,.35,8),mt)}
    else if(d.kind==="raster"){out=new THREE.Group();for(let a=0;a<3;a++)for(let b=0;b<3;b++){const q=this.rb(1.2,.5,1.2,.15,new THREE.MeshStandardMaterial({color:[0x1f6b35,0x4f9a4f,0xa7c77a][(a+b)%3],roughness:.5}));q.position.set(a*1.35-1.35,0,b*1.35-1.35);out.add(q)}}
    else{const s=new THREE.Shape();[[-2.2,-1.6],[0,-2.4],[2.4,-1],[1.8,1.8],[-1,2.2],[-2.6,.4]].forEach((p,i)=>i?s.lineTo(...p):s.moveTo(...p));out=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:.5,bevelEnabled:true,bevelSize:.15,bevelThickness:.15,bevelSegments:2}),mt);out.rotation.x=-Math.PI/2}
    out.traverse(o=>{if(o.isMesh)o.castShadow=true});const og=new THREE.Group();og.add(out);S.add(og);og.scale.setScalar(.001);
    return{g,card,out:og,d,reject:i===3}})}

  buildLoop(){const pts=[];for(let i=0;i<=80;i++){const t=i/80,x=mix(140,-120,t);pts.push(new THREE.Vector3(x,22+Math.sin(t*Math.PI)*40,mix(10,-14,t)))}
    this.loopCurve=new THREE.CatmullRomCurve3(pts);const tube=new THREE.TubeGeometry(this.loopCurve,160,.35,8);
    this.loop=new THREE.Mesh(tube,new THREE.MeshBasicMaterial({color:col("--accent","#ff5a36"),transparent:true,opacity:.9}));this.loop.userData.full=tube.index.count;tube.setDrawRange(0,0);this.scene.add(this.loop);
    this.loopDots=new THREE.InstancedMesh(new THREE.SphereGeometry(.8,12,8),new THREE.MeshBasicMaterial({color:0xffc93c}),6);this.loopDots.visible=false;this.scene.add(this.loopDots)}

  /* ---------------- per-frame: everything from s ---------------- */
  frame(){if(!this.on)return;const raw=Math.min(.5,this.clock.getDelta()),dt=Math.min(.05,raw),ka=1-Math.exp(-raw*5);this.t+=dt;const s=this.s,t=this.t,M=this.M;
    /* camera: glide between step keys in the first 40% of each step */
    const i=Math.floor(cl(s,0,STEPS.length-.0001)),f=s-i,k0=STEPS[Math.max(0,i-1)].cam,k1=STEPS[i].cam,e=i===0?1:sm(f/.4);
    const far=this.phone?1.55:1;
    const pos=new THREE.Vector3(...k0[0]).lerp(new THREE.Vector3(...k1[0]),e),tgt=new THREE.Vector3(...k0[1]).lerp(new THREE.Vector3(...k1[1]),e);
    pos.sub(tgt).multiplyScalar(far).add(tgt);pos.x+=this.mouse.x*6;pos.y-=this.mouse.y*4;
    this.cam.position.lerp(pos,ka);this.look.lerp(tgt,ka);this.cam.lookAt(this.look);
    /* belt moves while data flows */
    this.beltTex.offset.y-=dt*(s>SI.collect-.2&&s<SI.map?.6:.05);
    this.scan.position.z=Math.sin(t*3)*3.2;(this.analysts||[]).forEach(a=>{a.head.rotation.y=Math.sin(t*.7+a.ph)*.25;a.head.position.y=3.05+Math.abs(Math.sin(t*6+a.ph))*.03});this.ringIn.material.emissiveIntensity=1.2+Math.sin(t*4)*.5;this.ringOut.material.emissiveIntensity=1.2+Math.cos(t*4)*.5;
    /* departments: highlight the one being described */
    const fs=STEPS[i].formats,active=fs?fs[Math.min(3,Math.floor(f*4))]:-1;
    this.depts.forEach((dp,j)=>{const on=j===active;dp.g.position.y+=((on?.6:0)-dp.g.position.y)*.15;dp.acc.emissive.set(dp.d.col);dp.acc.emissiveIntensity+=((on?.8:0)-dp.acc.emissiveIntensity)*.15});
    /* documents → belt → converter → outputs → gate → data centre */
    const sD=SI.depts1,sC=SI.collect,sQ=SI.qa,sG=SI.gdb;
    const conv=this.conv.position,gate=this.gate.position,dc=this.dc.position;
    this.docs.forEach((o,j)=>{const dp=this.depts[j],home=new THREE.Vector3(dp.g.position.x,dp.top+6.5,dp.g.position.z);
      const appear=seg(s,sD-.6+j*.05,sD-.1+j*.05);const isAct=j===active;
      const flyStart=sC+.05+j*.05,flyEnd=flyStart+.55,fp=cl((s-flyStart)/(flyEnd-flyStart));
      let p=home.clone(),sc=appear*(isAct?1.45:1);
      if(fp>0){/* arc to the belt, then along it into the converter */
        const beltIn=new THREE.Vector3(-92,this.beltY+5,this.beltZ),door=new THREE.Vector3(conv.x-9,5,this.beltZ);
        if(fp<.45){const q=sm(fp/.45);p=home.clone().lerp(beltIn,q);p.y+=Math.sin(q*Math.PI)*10}else{const q=sm((fp-.45)/.55);p=beltIn.clone().lerp(door,q);sc*=mix(1,.55,q)}
        if(fp>=1)sc=0}
      o.g.position.copy(p);o.g.position.y+=isAct?Math.sin(t*2)*.25:0;o.g.scale.setScalar(Math.max(.001,sc));o.g.lookAt(this.cam.position.x,o.g.position.y,this.cam.position.z);
      /* output: emerges from the converter during conversion, waits at the gate, enters the data centre */
      const outS=SI.conv1+j*.12,toGate=sQ+.1+j*.04,toDC=sQ+.65+j*.03,absorb=sG+.25;
      const a=cl((s-outS)/.4),b=cl((s-toGate)/.35),c=cl((s-toDC)/.35);
      const exit=new THREE.Vector3(conv.x+10+(j%4)*2.4,2.2,this.beltZ+(j<4?-1.4:1.4)),atGate=new THREE.Vector3(gate.x-5+(j%4)*1.2,2.2,this.beltZ+(j<4?-1.4:1.4)),
        inDC=new THREE.Vector3(dc.x-10.5+(j%4)*7,8+Math.floor(j/4)*3,dc.z+(j<4?-3:3));
      let q=exit.clone().lerp(atGate,sm(b));let osc=sm(a);
      if(o.reject&&b>0){/* the record with a blank code is sent back */
        const back=cl((s-(sQ+.3))/.5);if(back>0){q=atGate.clone().lerp(new THREE.Vector3(-88,2,-4),sm(back));q.y+=Math.sin(back*Math.PI)*18;osc*=1-sm((back-.8)/.2)}}
      else if(c>0){q=q.lerp(inDC,sm(c));q.y+=Math.sin(c*Math.PI)*10;osc*=1-sm((s-absorb)/.3)}
      o.out.position.copy(q);o.out.position.y+=Math.sin(t*2.4+j)*.2;o.out.rotation.y=t*.8+j;o.out.scale.setScalar(Math.max(.001,osc*1.1))});
    /* gate light: red while the reject bounces */
    const rej=s>sQ+.25&&s<sQ+.85;this.gateLight.material.color.set(rej?0xff5a36:0x3fd6a0);this.gateLight.material.emissive.set(rej?0xff5a36:0x3fd6a0);this.gateCurtain.material.color.set(rej?0xff5a36:0x3fd6a0);
    this.gateCurtain.material.opacity=.06+Math.sin(t*5)*.04+(s>sQ&&s<sQ+1?.08:0);
    /* data centre LEDs and floating geodatabase layers */
    const busy=seg(s,sQ+.5,sG+.2),c3=new THREE.Color();this.leds.forEach((l,k)=>{const on=(Math.sin(t*l.s*3+l.p)>.2-busy*.6);c3.set(on?(k%5===0?0xffc93c:0x3fd6a0):0x16324a);this.ledMesh.setColorAt(k,c3)});this.ledMesh.instanceColor.needsUpdate=true;this.dcGlow.material.opacity=.08+busy*.14;
    const lay=seg(s,sG,sG+.6),toMap=seg(s,SI.map,SI.map+.5);
    this.sheets.forEach((sh,k)=>{const up=seg(s,sG+k*.07,sG+.35+k*.07);const y=mix(8,21+k*2.2,up);const mapPos=new THREE.Vector3(MX-dc.x,4+k*.1,1);
      sh.position.set(mix(0,mapPos.x,toMap),mix(y,mapPos.y+Math.sin(toMap*Math.PI)*28,toMap),mix(0,mapPos.z,toMap));sh.scale.setScalar(Math.max(.001,up*(1-sm((toMap-.7)/.3))));sh.rotation.y=Math.sin(t*.6+k)*.05*(1-toMap)});
    /* the map assembles layer by layer */
    const sm0=SI.map,mp=s-sm0;
    const dIn=seg(s,sm0-1.2,sm0-.4);this.dist.forEach((d,k)=>{const dd=seg(s,sm0-1.1+k*.012,sm0-.5+k*.012);d.m.position.y=3+(1-dd)*18;d.m.visible=dd>0.001});
    const draw=(grp,a,b)=>{const p=seg(s,a,b);grp.visible=p>0;grp.children.forEach(m=>m.geometry.setDrawRange(0,Math.floor(m.userData.full*p/3)*3))};
    draw(this.rivers,sm0+.15,sm0+.45);draw(this.roads,sm0+.3,sm0+.6);draw(this.rail,sm0+.4,sm0+.65);
    const m4=new THREE.Matrix4(),qn=new THREE.Quaternion(),v3=new THREE.Vector3();
    const tp=seg(s,sm0+.05,sm0+.35);this.treePts.forEach(([p,sc],k)=>{const[x,z]=P(...p);const g=cl(tp*1.6-k/this.treePts.length*.6);v3.setScalar(Math.max(.001,g*sc));m4.compose(new THREE.Vector3(x,3.9,z),qn,v3);this.trees.setMatrixAt(k,m4)});this.trees.instanceMatrix.needsUpdate=true;
    const pp=seg(s,sm0+.5,sm0+.8);this.facPts.forEach((p,k)=>{const[x,z]=P(...p);const g=cl(pp*1.6-k/this.facPts.length*.6);const e=g<1?1+2.7*Math.pow(g-1,3)+1.7*Math.pow(g-1,2):1;v3.setScalar(Math.max(.001,e));m4.compose(new THREE.Vector3(x,3.9,z),qn,v3);this.fac.setMatrixAt(k,m4);this.facH.setMatrixAt(k,m4)});
    this.fac.instanceMatrix.needsUpdate=this.facH.instanceMatrix.needsUpdate=true;
    /* use cases: districts rise and take a colour per question */
    const su=SI.uses,uIn=seg(s,su-.1,su+.15)*(1-seg(s,su+.9,su+1.1)),ui=Math.min(3,Math.floor(cl(s-su)*4));this.useIdx=uIn>0?ui:-1;
    const ucol=new THREE.Color(["#2f6fd6","#d2423a","#3e8a4f","#0b7a70"][ui]);
    this.dist.forEach((d,k)=>{const v=(Math.sin(k*12.9898+ui*78.233)*43758.5453)%1,vv=Math.abs(v);const h=1+uIn*vv*5;d.m.scale.z=h;
      d.m.material[0].color.copy(d.base).lerp(ucol.clone().lerp(new THREE.Color(0xffffff),1-vv),uIn*.9)});
    /* portal screen rises behind the map */
    const pr=seg(s,SI.portal-.5,SI.portal+.2);this.portal.position.y=mix(-40,24,pr);this.portal.visible=pr>0;
    /* apps pop up */
    [[this.phoneG,0],[this.tabG,.12],[this.lapG,.24]].forEach(([o,d])=>{const a=seg(s,SI.apps-.45+d,SI.apps-.05+d);const e=a<1?1+2.7*Math.pow(a-1,3)+1.7*Math.pow(a-1,2):1;o.scale.setScalar(Math.max(.001,e));o.position.y+=Math.sin(t*1.5+d*10)*.004});
    /* the loop back from the field */
    const lp=seg(s,SI.loop-.2,SI.loop+.5);this.loop.geometry.setDrawRange(0,Math.floor(this.loop.userData.full*lp/3)*3);this.loopDots.visible=lp>.95;
    if(this.loopDots.visible){for(let k=0;k<6;k++){const u=((t*.08+k/6)%1);m4.makeTranslation(...this.loopCurve.getPointAt(u).toArray());this.loopDots.setMatrixAt(k,m4)}this.loopDots.instanceMatrix.needsUpdate=true}
    this.r.render(this.scene,this.cam)}
}
