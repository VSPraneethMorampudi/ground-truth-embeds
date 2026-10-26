/* The pipeline world. Everything is a pure function of scroll position s (0..steps), so scrolling back
   rewinds it exactly. Left to right: departments → conversion → quality gate → data centre → map + portal → apps. */
import * as THREE from "three";
import {RoundedBoxGeometry} from "../vendor/RoundedBoxGeometry.js";
import {RoomEnvironment} from "../vendor/RoomEnvironment.js";
import {DEPTS,STEPS} from "./steps.js";
import {FILES,drawFile} from "./files.js";
import {envDraw,inboxDraw,mailDraw,gisDraw} from "./screens.js";

const G=window.GEO,D2R=Math.PI/180,LON0=82.15,LAT0=21.35,K=1,CX=Math.cos(LAT0*D2R),MX=75,MS=10;
export const P=(lon,lat)=>[MX+(lon-LON0)*CX*MS,-(lat-LAT0)*MS];
const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,sm=t=>{t=cl(t);return t*t*(3-2*t)};
const seg=(s,a,b)=>sm((s-a)/(b-a));
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim()||null;
const col=(n,f)=>new THREE.Color(css(n)||f);
let seed=7;const rnd=()=>(seed=seed*16807%2147483647)/2147483647;
const T2=(en,hi)=>({en,hi});
const SI=Object.fromEntries(STEPS.map((s,i)=>[s.id,i]));   // step index by id

/* ---------- canvas textures ---------- */
function canvasTex(w,h,draw){const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");draw(x,w,h);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;t.userData={c,x,draw};return t}
const MONO='"Geist Mono",ui-monospace,monospace',SANS='"Bricolage Grotesque",system-ui,sans-serif',HI='"Anek Devanagari",sans-serif';
function rr(x,X,Y,W,H,r){x.beginPath();x.roundRect(X,Y,W,H,r)}
/* the department name board: big, bilingual, readable from the overview */
function boardDraw(d){return (x,W,H)=>{x.fillStyle="#0d1b2e";rr(x,0,0,W,H,26);x.fill();x.fillStyle=d.col;x.fillRect(0,0,26,H);
  const fit=(t,w,px,fam,wt)=>{let z=px;x.font=`${wt} ${z}px ${fam}`;while(x.measureText(t).width>w&&z>20){z-=2;x.font=`${wt} ${z}px ${fam}`}};
  x.fillStyle="#fff";fit(d.name.en,W-100,120,SANS,800);x.fillText(d.name.en,60,150);
  x.globalAlpha=.85;fit(d.name.hi,W-100,84,HI,600);x.fillText(d.name.hi,60,262);x.globalAlpha=1}}
function flagDraw(x,W,H){[["#ff9933",0],["#ffffff",1],["#138808",2]].forEach(([c,i])=>{x.fillStyle=c;x.fillRect(0,i*H/3,W,H/3)});x.strokeStyle="#000080";x.lineWidth=3;x.beginPath();x.arc(W/2,H/2,H/7,0,7);x.stroke()}
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
    /* pointer: parallax, hover a file card, click (or tap) to open it */
    this.hover=-1;this.ptr=null;
    host.addEventListener("pointermove",e=>{const r=host.getBoundingClientRect();this.mouse.set((e.clientX-r.left)/r.width-.5,(e.clientY-r.top)/r.height-.5);if(e.pointerType==="mouse")this.ptr=[e.clientX,e.clientY]});
    host.addEventListener("pointerleave",()=>{this.ptr=null});
    host.addEventListener("pointerdown",e=>{this.down=[e.clientX,e.clientY,performance.now()]});
    host.addEventListener("pointercancel",()=>{this.down=null});
    host.addEventListener("pointerup",e=>{const d=this.down;this.down=null;if(!d||Math.hypot(e.clientX-d[0],e.clientY-d[1])>10||performance.now()-d[2]>600)return;
      const h=this.pick(e.clientX,e.clientY);if(h)dispatchEvent(new CustomEvent("gt-pick",{detail:{type:h.type,i:h.i,id:h.id}}))});
    this.clock=new THREE.Clock();this.on=true;R.setAnimationLoop(()=>this.frame());
    document.fonts&&document.fonts.ready.then(()=>this.redrawTextures())}
  resize(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.r.setSize(w,h,false);this.cam.aspect=w/h;this.phone=w<760;
    this.cam.fov=this.phone?48:32;
    /* keep the subject centred in the space the caption and side panel leave free */
    if(this.phone)this.cam.setViewOffset(w,h,0,this.ex?h*.2:-h*.06,w,h);else this.cam.setViewOffset(w,h,Math.min(460,w*.34)/2,h*.04,w,h);
    this.cam.updateProjectionMatrix()}
  setVisible(v){this.on=v}
  redrawTextures(){(this.texs||[]).forEach(t=>{const u=t.userData;u.x.clearRect(0,0,u.c.width,u.c.height);u.draw(u.x,u.c.width,u.c.height);t.needsUpdate=true})}
  tex(w,h,draw){const t=canvasTex(w,h,draw);(this.texs=this.texs||[]).push(t);return t}
  rb(w,h,d,r,m){const g=new RoundedBoxGeometry(w,h,d,4,Math.min(r,w/2-.01,h/2-.01,d/2-.01));const o=new THREE.Mesh(g,m);o.castShadow=o.receiveShadow=true;return o}

  /* ---------------- build ---------------- */
  build(){const S=this.scene,M=this.M;
    /* ground: one long rounded platform with a soft edge */
    const base=this.rb(344,4,140,2,M.ground);base.position.set(3,-2.2,0);S.add(base);
    const top=this.rb(340,.4,136,.2,M.groundTop);top.position.set(3,-.15,0);top.receiveShadow=true;top.castShadow=false;S.add(top);
    /* data travels at this height and lane between the lab, the gate and the data centre */
    this.beltY=1;this.beltZ=16;
    this.buildDepts();this.buildConverter();this.buildGate();this.buildDataCentre();this.buildMap();this.buildPortal();this.buildApps();this.buildDocs();this.buildLoop();this.buildBlocks()}

  /* the department campus: eight named government buildings, each with its own architecture and a name board */
  buildDepts(){const S=this.scene,M=this.M;this.depts=[];
    const stone=new THREE.MeshStandardMaterial({color:0xd8d0bf,roughness:.85}),cream=new THREE.MeshStandardMaterial({color:0xf3e9d2,roughness:.7}),
      wood=new THREE.MeshStandardMaterial({color:0x8a5a36,roughness:.8}),leaf=new THREE.MeshStandardMaterial({color:0x3e8a4f,roughness:.8}),
      white=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.5}),paneG=new THREE.BoxGeometry(1,1,1);
    /* back row: the bigger offices; front row: lower buildings, so every board and file stays in view */
    const LAY=[[-153,-30,"capitol"],[-131,-30,"tower"],[-111,-30,"block"],[-92,-30,"court"],[-150,0,"slab"],[-130,0,"terrace"],[-111,0,"lodge"],[-92,0,"station"]];
    DEPTS.forEach((d,i)=>{const g=new THREE.Group(),[gx,gz,style]=LAY[i];g.position.set(gx,0,gz);S.add(g);
      const acc=new THREE.MeshStandardMaterial({color:d.col,roughness:.45});
      const B=(w,h,dd,x,y,z,m,r=.3)=>{const o=this.rb(w,h,dd,r,m);o.position.set(x,y,z);g.add(o);return o};
      const C=(rt,rb,h,x,y,z,m,seg=16)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o};
      /* windows: one instanced mesh of glass panes per building */
      const pn=[],m4=new THREE.Matrix4(),q0=new THREE.Quaternion();
      const win=(x0,y0,z,cols,rows,pw,ph,gx2,gy)=>{for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)pn.push(m4.compose(new THREE.Vector3(x0+(c-(cols-1)/2)*gx2,y0+r*gy,z),q0,new THREE.Vector3(pw,ph,.3)).clone())};
      const ledges=(w,z,y0,n,gy)=>{for(let r=0;r<n;r++)B(w,.28,.7,0,y0+r*gy,z,M.wall2,.1)};
      const steps=(w,z)=>{for(let k=0;k<3;k++)B(w-k*.8,1-k*.33,1,0,(1-k*.33)/2,z+k*.9,stone,.1)};
      const canopy=(w,z,y=4,m=acc)=>{B(w,.35,3,0,y,z+1.5,m,.12);[-1,1].forEach(sx=>C(.16,.16,y-1,sx*(w/2-.4),(y+1)/2,z+2.7,M.steel,8))};
      const door=(z,w=2.6)=>B(w,2.8,.4,0,2.4,z,M.ink,.15);
      let top=10,PD=12;
      if(style==="capitol"){/* Revenue: the secretariat — colonnade, pediment, dome, the national flag */
        PD=16;B(24,1,16,0,.5,0,stone,.2);steps(10,8.5);
        B(11,9,11,0,5.5,0,M.wall);[-1,1].forEach(sx=>{B(5.6,7,9,sx*8.3,4.5,-.5,M.wall2);win(sx*8.3,3,4.05,2,3,1.4,1.4,2.3,2.1)});
        for(let c=0;c<6;c++)C(.42,.48,7,-4.2+c*1.68,4.5,7,M.wall,16);
        B(11.6,.9,2.8,0,8.45,6.6,M.wall);B(11.8,.5,11.4,0,10.25,0,acc,.15);
        const tri=new THREE.Shape();tri.moveTo(-5.8,0);tri.lineTo(5.8,0);tri.lineTo(0,2.3);tri.closePath();
        const ped=new THREE.Mesh(new THREE.ExtrudeGeometry(tri,{depth:2.4,bevelEnabled:false}),M.wall);ped.position.set(0,8.9,5.4);ped.castShadow=true;g.add(ped);
        win(0,3,5.55,3,3,1.2,1.6,2.6,2.1);door(5.6);
        C(3.5,3.5,1.6,0,10.8,-.5,M.wall2,40);const dome=new THREE.Mesh(new THREE.SphereGeometry(3.4,40,20,0,Math.PI*2,0,Math.PI/2),new THREE.MeshPhysicalMaterial({color:0xe9d8b4,roughness:.3,clearcoat:.6}));
        dome.position.set(0,11.6,-.5);dome.castShadow=true;g.add(dome);C(.55,.7,1.3,0,15.6,-.5,M.wall2,16);
        C(.08,.08,6,0,19,-.5,M.steel,8);const fl=new THREE.Mesh(new THREE.PlaneGeometry(2.4,1.6),new THREE.MeshStandardMaterial({map:this.tex(96,64,flagDraw),side:THREE.DoubleSide,roughness:.8}));
        fl.position.set(1.25,21.1,-.5);g.add(fl);this.flag=fl;top=17}
      else if(style==="tower"){PD=14;/* Water Resources: glass tower on a podium, a water tank on the roof */
        B(17,1,14,0,.5,0,stone,.2);steps(7,7.4);B(15,4,12,0,3,0,M.wall);win(0,2.8,6.05,5,1,2,1.6,2.8,0);canopy(6,6,4.6);door(6.1);
        B(9,13,8,0,11.5,-1,M.wall2);win(0,6.6,3.05,3,5,2.2,1.9,2.7,2.45);[-1,1].forEach(sx=>B(.5,13.4,.8,sx*4.6,11.5,3.2,acc,.15));
        B(9.4,.6,8.4,0,18.3,-1,acc,.2);[[-1.6,-1],[1.6,-1],[-1.6,1],[1.6,1]].forEach(([a,b])=>C(.12,.12,1.6,a,19.3,-1+b,M.steel,6));
        C(2.4,2.4,2.4,0,21.2,-1,acc,32);C(2.5,2.5,.3,0,22.5,-1,M.steel,32);top=21.5}
      else if(style==="block"){PD=13;/* Public Works: a solid office block, ledges per floor, plant on the roof */
        B(17,1,13,0,.5,0,stone,.2);steps(7,6.9);B(15,11,11,0,6.5,0,M.wall);
        win(0,4.6,5.55,5,4,2,1.5,2.7,2.4);ledges(15.3,5.6,3.6,4,2.4);canopy(6,5.5,3.9);door(5.6);
        B(15.4,.8,11.4,0,12.4,0,acc,.2);[[-4,-2],[-1.2,-2.4],[4,2]].forEach(([a,b])=>B(2,1.3,1.6,a,13.4,b,M.steel,.2));B(3.4,2.2,3,4.2,13.9,-2.4,M.wall2,.2);top=15}
      else if(style==="court"){PD=15;/* School Education: a U-shaped school round a courtyard, clock over the hall */
        B(18,1,15,0,.5,0,stone,.2);B(16,8,4.4,0,5,-4.8,M.wall);[-1,1].forEach(sx=>{B(4.4,7,9,sx*5.8,4.5,1.6,M.wall2);win(sx*5.8,3,6.15,2,2,1.3,1.5,2,2.4);B(4.6,.5,9.2,sx*5.8,8.2,1.6,acc,.15)});
        win(0,3.2,-2.55,3,2,1.4,1.6,2.4,2.6);B(16.2,.5,4.6,0,9.2,-4.8,acc,.15);B(4.4,3.4,4.6,0,10.8,-4.8,M.wall);
        const tri=new THREE.Shape();tri.moveTo(-2.6,0);tri.lineTo(2.6,0);tri.lineTo(0,1.6);tri.closePath();const gab=new THREE.Mesh(new THREE.ExtrudeGeometry(tri,{depth:4.8,bevelEnabled:false}),acc);gab.position.set(0,12.5,-7.2);gab.castShadow=true;g.add(gab);
        const clk=C(1.2,1.2,.3,0,10.9,-2.4,white,32);clk.rotation.x=Math.PI/2;const rim=new THREE.Mesh(new THREE.TorusGeometry(1.2,.12,8,32),M.ink);rim.position.set(0,10.9,-2.25);g.add(rim);
        C(.25,.3,2,0,2,2,wood,8);const tr=new THREE.Mesh(new THREE.IcosahedronGeometry(1.8,1),leaf);tr.position.set(0,3.8,2);tr.castShadow=true;g.add(tr);B(5,.2,4,0,1.1,2.8,new THREE.MeshStandardMaterial({color:0xc9b48a,roughness:1}),.1);top=14.2}
      else if(style==="slab"){/* Health: a long white hospital block, red cross and an ambulance bay */
        B(18,1,12,0,.5,0,stone,.2);B(16,8,10,0,5,0,M.wall);win(1.4,3.2,5.05,5,3,1.7,1.3,2.5,2.1);ledges(16.2,5.1,2.4,3,2.1);
        B(4,4,.3,-5.6,6,5.2,white,.2);B(3.2,.9,.3,-5.6,6,5.4,acc,.1);B(.9,3.2,.3,-5.6,6,5.4,acc,.1);
        B(7,.35,3.6,3.4,3.9,6.6,acc,.12);[[0,1],[6.6,1]].forEach(([a])=>C(.16,.16,2.9,a+.1,2.45,8.1,M.steel,8));door(5.1,3.4);B(16.4,.6,10.4,0,9.3,0,acc,.2);
        const pad=C(2.6,2.6,.15,3,9.7,0,M.ink,32);const hh=new THREE.Mesh(new THREE.TorusGeometry(2.2,.12,6,32),white);hh.rotation.x=Math.PI/2;hh.position.set(3,9.8,0);g.add(hh);top=10.5}
      else if(style==="terrace"){/* Women & Child Development: warm two-storey office, sunshades, a pergola on the terrace */
        B(16,1,12,0,.5,0,stone,.2);steps(6,6.9);B(14,7,10,0,4.5,0,cream);win(0,3,5.05,4,2,2,1.5,3.1,2.6);
        for(let r=0;r<2;r++)B(13,.25,1.2,0,4,5.6+0*r,acc,.1).position.y=3.9+r*2.6;door(5.1);canopy(5,5,3.6,acc);
        B(14.3,.5,10.3,0,8.2,0,acc,.15);for(let k=0;k<5;k++)B(.25,.25,6,-4+k*2,10.4,-1,wood,.05);[-4.4,4.4].forEach(a=>[-3.6,1.6].forEach(b=>C(.12,.12,2,a,9.4,b,wood,6)));top=11}
      else if(style==="lodge"){/* Forest: a timber lodge with a green pitched roof among trees */
        B(16,1,12,0,.5,0,stone,.2);steps(5,6.9);B(14,5,9,0,3.5,0,wood);win(0,3.2,4.55,4,1,1.8,1.6,3,0);door(4.6);
        const tri=new THREE.Shape();tri.moveTo(-8,0);tri.lineTo(8,0);tri.lineTo(0,4.4);tri.closePath();const rf=new THREE.Mesh(new THREE.ExtrudeGeometry(tri,{depth:11,bevelEnabled:false}),acc);rf.position.set(0,6,-5.5);rf.castShadow=true;g.add(rf);
        for(let k=0;k<4;k++)C(.18,.18,3,-5+k*3.33,2.5,5.6,wood,8);B(15,.3,2,0,4.1,5.6,wood,.1);
        [[-9.5,-3],[-9.8,3],[9.6,-2.4],[9.4,3.4],[-6,-7],[5,-7]].forEach(([a,b],k)=>{const h=4+(k%3);C(.25,.3,1.6,a,.8,b,wood,6);const cn=new THREE.Mesh(new THREE.ConeGeometry(1.7,h,10),leaf);cn.position.set(a,1.6+h/2,b);cn.castShadow=true;g.add(cn)});top=10.8}
      else{/* Railways: a station with a clock tower, platform canopy and a stretch of track */
        PD=10;B(18,1,10,0,.5,0,stone,.2);B(16,5,6.5,0,3.5,-1,cream);win(0,3.2,2.3,6,1,1.3,2,2.4,0);B(16.4,.5,6.9,0,6.2,-1,acc,.15);
        B(3.8,10,3.8,0,6,-1.2,M.wall);const cl2=C(1,1,.3,0,9.2,.7,white,32);cl2.rotation.x=Math.PI/2;const rr2=new THREE.Mesh(new THREE.TorusGeometry(1,.1,8,32),M.ink);rr2.position.set(0,9.2,.86);g.add(rr2);
        const py=new THREE.Mesh(new THREE.ConeGeometry(3,2.6,4),acc);py.rotation.y=Math.PI/4;py.position.set(0,12.3,-1.2);py.castShadow=true;g.add(py);
        B(17,.35,3.2,0,4.6,3.6,acc,.12);for(let k=0;k<5;k++)C(.14,.14,3.6,-7.6+k*3.8,2.8,4.9,M.steel,8);
        [-.7,.7].forEach(o=>B(19,.25,.25,0,.35,7.4+o,M.steel,.05));for(let k=0;k<12;k++)B(.5,.18,2.2,-8.6+k*1.56,.2,7.4,wood,.05);top=13.6}
      if(pn.length){const im=new THREE.InstancedMesh(paneG,M.glass,pn.length);pn.forEach((m,k)=>im.setMatrixAt(k,m));g.add(im)}
      /* name board on a stone plinth in front of the entrance, tipped back toward the viewer */
      const bz=PD/2+(style==="station"?5:4),st=this.tex(1024,300,boardDraw(d));
      B(14.6,.8,1.8,0,.4,bz,stone,.15);const bk=B(14.8,4.6,.35,0,3.1,bz,M.ink,.2);bk.rotation.x=-.7;
      const brd=new THREE.Mesh(new THREE.PlaneGeometry(14.4,4.22),new THREE.MeshBasicMaterial({map:st,toneMapped:false}));brd.position.set(0,3.1+.12,bz+.14);brd.rotation.x=-.7;g.add(brd);
      this.depts.push({g,top,d,acc,board:brd})})}

  /* the CHiPS GIS team: an open-plan lab. Department files arrive as email, open on the analysts' screens and are worked in GIS tools */
  buildConverter(){const S=this.scene,M=this.M,g=this.conv=new THREE.Group();g.position.set(-46,0,16);S.add(g);
    const A=(o,x,y,z)=>{o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o};
    /* floor (carpet tiles), back wall with windows, low side partitions */
    const carpet=this.tex(256,256,(x,W,H)=>{for(let i=0;i<4;i++)for(let j=0;j<4;j++){x.fillStyle=(i+j)%2?"#cfd6df":"#c5ccd6";x.fillRect(i*64,j*64,64,64)}});carpet.wrapS=carpet.wrapT=THREE.RepeatWrapping;carpet.repeat.set(5,4);
    A(this.rb(36,.8,28,.4,new THREE.MeshStandardMaterial({map:carpet,roughness:.95})),0,.4,-13);
    A(this.rb(36,13,1,.4,M.wall),0,6.5,-27);A(this.rb(36,.6,1.1,.2,M.accent),0,12.6,-27);
    [-1,1].forEach(sx=>{A(this.rb(1,4.2,26,.3,M.wall2),sx*17.5,2.9,-14);A(this.rb(1.1,.4,26.2,.15,M.accent),sx*17.5,5.1,-14)});
    [-14.4,-11,11,14.4].forEach(wx=>A(this.rb(3,5,.3,.2,M.glass),wx,7,-26.4));
    /* wall: the team inbox, everything that has arrived */
    this.inboxTex=this.tex(1024,400,inboxDraw([],DEPTS));
    A(this.rb(19.4,7.9,.4,.3,M.ink),0,7.1,-26.3);const ib=new THREE.Mesh(new THREE.PlaneGeometry(19,7.4),new THREE.MeshBasicMaterial({map:this.inboxTex,toneMapped:false}));ib.position.set(0,7.1,-26.05);g.add(ib);
    const lab=this.tex(640,160,signDraw("CHiPS GIS Team","चिप्स जीआईएस टीम","#ff5a36"));const l=new THREE.Mesh(new THREE.PlaneGeometry(14,3.5),new THREE.MeshBasicMaterial({map:lab,transparent:true}));l.position.set(0,15.4,-26.6);g.add(l);
    /* plants in the corners */
    const potM=new THREE.MeshStandardMaterial({color:0xe9e2d6,roughness:.7}),leafM=new THREE.MeshStandardMaterial({color:0x3e8a4f,roughness:.8});
    [[-15.5,-24.5],[15.5,-24.5],[-15.5,-2]].forEach(([a,b])=>{A(new THREE.Mesh(new THREE.CylinderGeometry(.8,.6,1.5,16),potM),a,1.55,b);for(let k=0;k<5;k++){const lf=A(new THREE.Mesh(new THREE.SphereGeometry(.9,10,8),leafM),a+Math.sin(k*1.3)*.6,3+k*.35,b+Math.cos(k*1.3)*.6);lf.scale.set(.8,1.3,.8)}});
    /* workstations: desk, dual monitors (mail + GIS), keyboard, mouse, mug, office chair, analyst */
    const deskM=new THREE.MeshStandardMaterial({color:0xe9dcc6,roughness:.55}),frameM=new THREE.MeshStandardMaterial({color:0x3a4250,roughness:.4,metalness:.6}),
      chairM=new THREE.MeshStandardMaterial({color:0x252c38,roughness:.7}),meshM=new THREE.MeshStandardMaterial({color:0x39424f,roughness:.9}),
      shoeM=new THREE.MeshStandardMaterial({color:0x1d1a18,roughness:.6}),mugM=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.3});
    const PEOPLE=[/* skin, shirt, trousers, hair colour, hair style, glasses */
      [0x8d5524,0x2f6fd6,0x2b2f3a,0x15100c,"short",1],[0xc68642,0xd2423a,0x3b3f4a,0x1b1410,"long",0],[0xa0662f,0xf2efe8,0x4a3f35,0x111111,"short",0],
      [0x7a4a21,0x3e8a4f,0x23262e,0x1b1410,"bun",1],[0xb87a46,0xe39a1f,0x2f3542,0x231a14,"long",0],[0x95603a,0x6b4fd6,0x3a3a3a,0x0e0e0e,"short",1]];
    this.analysts=[];this.screens=[];this.deskHits=[];seed=3;
    const cap=(r,l,m)=>new THREE.Mesh(new THREE.CapsuleGeometry(r,l,6,12),m);
    [[-10.8,-8.6],[0,-8.6],[10.8,-8.6],[-10.8,-19],[0,-19],[10.8,-19]].forEach(([x,z],k)=>{
      /* desk: top, side panels, modesty panel */
      A(this.rb(8.4,.3,3.6,.12,deskM),x,3.25,z);[-4,4].forEach(dx=>A(this.rb(.25,2.5,3.3,.08,frameM),x+dx,1.95,z));A(this.rb(7.8,1.4,.15,.05,frameM),x,2.4,z-1.6);
      /* monitors on arms: left = mail, right = GIS */
      const scr=[];[-1.95,1.95].forEach((dx,m)=>{const mon=new THREE.Group();mon.position.set(x+dx,5.15,z-1);mon.rotation.y=dx<0?.16:-.16;g.add(mon);
        const bz=this.rb(3.7,2.35,.18,.08,M.ink);bz.castShadow=true;mon.add(bz);const back=this.rb(1.4,1,.4,.15,M.ink);back.position.z=-.25;mon.add(back);
        const t=this.tex(512,320,m?gisDraw(null,null,0):mailDraw(null,null,[],DEPTS));const face=new THREE.Mesh(new THREE.PlaneGeometry(3.52,2.2),new THREE.MeshBasicMaterial({map:t,toneMapped:false}));face.position.z=.1;mon.add(face);
        A(this.rb(.22,1.5,.22,.08,frameM),x+dx,4.1,z-1.35);scr.push({t,key:"",mon})});
      A(this.rb(1.6,.1,1.2,.05,frameM),x-1.95,3.42,z-1.35);A(this.rb(1.6,.1,1.2,.05,frameM),x+1.95,3.42,z-1.35);
      A(this.rb(2.6,.12,.8,.05,new THREE.MeshStandardMaterial({color:0x2b3038,roughness:.5})),x,3.46,z+.55);
      A(this.rb(1.1,.04,.9,.02,new THREE.MeshStandardMaterial({color:0x2f3a4a,roughness:.9})),x+2.2,3.41,z+.6);const mouse=A(this.rb(.32,.16,.5,.07,M.ink),x+2.2,3.5,z+.6);
      A(new THREE.Mesh(new THREE.CylinderGeometry(.22,.2,.5,14),mugM),x-3.3,3.65,z+.2);
      if(k%2===0)A(this.rb(1.4,.3,1,.05,new THREE.MeshStandardMaterial({color:0xfafafa,roughness:.8})),x-3.1,3.55,z-1);
      /* office chair: five-star base, gas lift, seat, mesh back */
      const cz=z+2.6;for(let a=0;a<5;a++){const leg=A(this.rb(1.3,.14,.22,.06,frameM),x+Math.cos(a*1.257)*.6,.95,cz+Math.sin(a*1.257)*.6);leg.rotation.y=-a*1.257;
        A(new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),M.ink),x+Math.cos(a*1.257)*1.2,.88,cz+Math.sin(a*1.257)*1.2)}
      A(new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,1.3,8),frameM),x,1.6,cz);A(this.rb(2.1,.35,2,.25,chairM),x,2.3,cz);
      const bk=A(this.rb(1.9,1.5,.2,.3,meshM),x,3.45,cz+1.2);bk.rotation.x=-.1;A(this.rb(.25,1.2,.25,.1,frameM),x,2.7,cz+1.15);
      /* the analyst, seated, facing the screens */
      const [skin,shirtC,pantC,hairC,style,glasses]=PEOPLE[k];const sk=new THREE.MeshStandardMaterial({color:skin,roughness:.55}),sh=new THREE.MeshStandardMaterial({color:shirtC,roughness:.75}),
        pt=new THREE.MeshStandardMaterial({color:pantC,roughness:.8}),hr=new THREE.MeshStandardMaterial({color:hairC,roughness:.75});
      const p=new THREE.Group();p.position.set(x,2.48,cz-.1);g.add(p);const add=(o,a,b,c)=>{o.position.set(a,b,c);o.castShadow=true;p.add(o);return o};
      add(this.rb(1.45,.55,1.3,.25,pt),0,.28,.1);
      [-1,1].forEach(sx=>{const th=add(cap(.3,1.1,pt),sx*.38,.32,-.75);th.rotation.x=Math.PI/2;const sn=add(cap(.25,1.15,pt),sx*.4,-.6,-1.42);
        add(this.rb(.42,.25,.85,.1,shoeM),sx*.4,-1.4,-1.62)});
      const torso=add(new THREE.Mesh(new THREE.CylinderGeometry(.66,.56,1.55,20),sh),0,1.3,.1);torso.scale.z=.68;torso.rotation.x=-.1;
      const sho=add(cap(.33,1.0,sh),0,2.0,.05);sho.rotation.z=Math.PI/2;sho.scale.z=.8;
      add(new THREE.Mesh(new THREE.CylinderGeometry(.17,.19,.35,12),sk),0,2.32,0);
      const arms=[];[-1,1].forEach(sx=>{const up=add(cap(.18,.75,sh),sx*.82,1.62,-.22);up.rotation.x=.55;up.rotation.z=sx*.12;
        const fa=new THREE.Group();fa.position.set(sx*.74,1.22,-.5);p.add(fa);const f=cap(.15,.8,sk);f.rotation.x=Math.PI/2-.08;f.position.z=-.45;f.castShadow=true;fa.add(f);
        const sl=cap(.19,.15,sh);sl.rotation.x=Math.PI/2;sl.position.z=-.05;fa.add(sl);const hand=new THREE.Mesh(new THREE.SphereGeometry(.17,12,10),sk);hand.scale.set(1,.6,1.3);hand.position.set(-sx*.12,-.05,-.95);fa.add(hand);
        fa.rotation.y=sx*.22;arms.push(fa)});
      const head=new THREE.Group();head.position.set(0,2.85,-.05);p.add(head);
      const skull=new THREE.Mesh(new THREE.SphereGeometry(.44,24,18),sk);skull.scale.set(.9,1.06,.98);skull.castShadow=true;head.add(skull);
      [-1,1].forEach(sx=>{const ear=new THREE.Mesh(new THREE.SphereGeometry(.1,8,6),sk);ear.position.set(sx*.4,0,.02);ear.scale.z=.6;head.add(ear)});
      const nose=new THREE.Mesh(new THREE.ConeGeometry(.07,.18,8),sk);nose.rotation.x=-Math.PI/2;nose.position.set(0,-.02,-.46);head.add(nose);
      const hair=new THREE.Mesh(new THREE.SphereGeometry(.47,24,16,0,Math.PI*2,0,Math.PI*.52),hr);hair.rotation.x=.42;hair.position.y=.05;hair.scale.set(.93,1.04,1.02);head.add(hair);
      if(style==="long"){const back=new THREE.Mesh(new THREE.CapsuleGeometry(.36,.7,6,12),hr);back.position.set(0,-.35,.26);back.scale.set(1.15,1,.55);head.add(back)}
      if(style==="bun"){const bun=new THREE.Mesh(new THREE.SphereGeometry(.22,12,10),hr);bun.position.set(0,.3,.42);head.add(bun)}
      if(glasses){const gm=new THREE.MeshStandardMaterial({color:0x111111,roughness:.3});[-1,1].forEach(sx=>{const r=new THREE.Mesh(new THREE.TorusGeometry(.11,.02,6,16),gm);r.position.set(sx*.16,.04,-.42);head.add(r)});
        [-1,1].forEach(sx=>{const tm=new THREE.Mesh(new THREE.BoxGeometry(.02,.02,.4),gm);tm.position.set(sx*.38,.04,-.22);head.add(tm)})}
      const dh=new THREE.Mesh(new THREE.BoxGeometry(8.8,7,8.4),new THREE.MeshBasicMaterial({visible:false}));dh.position.set(x,3.5,z+1.6);g.add(dh);this.deskHits.push(dh);
      this.analysts.push({head,arms,mouse,ph:rnd()*6,x,z,scr})});
    /* the path data follows out of the lab: a lit floor strip to the gate and the data centre */
    this.pathTex=this.tex(64,256,(x,W,H)=>{x.fillStyle="#0000";x.clearRect(0,0,W,H);x.fillStyle="#3fd6a0";for(let i=0;i<4;i++)x.fillRect(16,i*64+8,32,30)});
    this.pathTex.wrapS=this.pathTex.wrapT=THREE.RepeatWrapping;this.pathTex.repeat.set(1,14);
    const path=new THREE.Mesh(new THREE.PlaneGeometry(1.2,56),new THREE.MeshBasicMaterial({map:this.pathTex,transparent:true,opacity:.7,depthWrite:false}));path.rotation.x=-Math.PI/2;path.rotation.z=Math.PI/2;path.position.set(-18,.08,16);S.add(path);
    /* department mail: one envelope per file */
    this.envs=FILES.map(F=>{const t=this.tex(320,210,envDraw(F,DEPTS[F.d]));const e=new THREE.Group();const b=this.rb(5,3.3,.3,.3,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.5}));e.add(b);
      const f=new THREE.Mesh(new THREE.PlaneGeometry(5,3.3),new THREE.MeshBasicMaterial({map:t,transparent:true,toneMapped:false}));f.position.z=.16;e.add(f);e.scale.setScalar(.001);S.add(e);return e})}

  /* swap what a monitor shows; redraws only when the content changes */
  setScreen(sc,key,draw){if(sc.key===key)return;sc.key=key;const u=sc.t.userData;u.draw=draw;u.x.clearRect(0,0,u.c.width,u.c.height);draw(u.x,u.c.width,u.c.height);sc.t.needsUpdate=true}

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
    this.racks=[];const racks=[];for(let row=0;row<2;row++)for(let c=0;c<4;c++)racks.push([-10.5+c*7,-6.5+row*13,row]);
    racks.forEach(([x,z,row],ri)=>{const r=new THREE.Group();r.position.set(x,1.2,z);g.add(r);
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
      const hinge=new THREE.Group();hinge.position.set(-RW/2+.05,RH/2,RD/2+.06);r.add(hinge);
      const door=new THREE.Mesh(new THREE.BoxGeometry(RW-.1,RH-.4,.08),doorM);door.position.x=RW/2-.05;hinge.add(door);
      const dh=this.rb(.15,2.2,.25,.06,handleM);dh.position.set(RW-.45,0,.14);hinge.add(dh);
      const hit=new THREE.Mesh(new THREE.BoxGeometry(RW+.4,RH+1,RD+.6),new THREE.MeshBasicMaterial({visible:false}));hit.position.y=RH/2;r.add(hit);
      this.racks.push({r,hinge,hit,x,z,name:"AB"[row]+(ri%4+1),open:0})});
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
    /* geodatabase layers floating above the racks: each sheet carries its real layer, an exploded GIS stack */
    this.sheets=[];const L=[["Boundaries","#8a6a3c"],["Forest","#3e8a4f"],["Rivers","#1d6fd6"],["Roads","#d2733c"],["Rail","#3a383d"],["Facilities","#6b4fd6"]];
    const FOREST=new Set(["Bastar","Dantewada","Bijapur","Sukma","Narayanpur","Kanker","Kondagaon","Sarguja","Jashpur","Korba","Balrampur-Ramanujganj","Surajpur","Koriya","Gariyaband","Dhamtari","Manendragarh-Chirmiri-Bharatpur","Gaurela-Pendra-Marwahi","Mohla-Manpur-Ambagarh Chowki"]);
    const B0=[80.2,17.75,84.45,24.15],kx=Math.cos(20.95*D2R);
    L.forEach(([n,c],i)=>{const t=this.tex(512,768,(x,W,H)=>{const s0=Math.min((W-40)/((B0[2]-B0[0])*kx),(H-40)/(B0[3]-B0[1])),ox=(W-(B0[2]-B0[0])*kx*s0)/2,oy=(H-(B0[3]-B0[1])*s0)/2;
        const pr=(lo,la)=>[ox+(lo-B0[0])*kx*s0,oy+(B0[3]-la)*s0],tr=(pts,cl)=>{x.beginPath();pts.forEach((p,k)=>{const q=pr(p[0],p[1]);k?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1])});if(cl)x.closePath()};
        x.clearRect(0,0,W,H);x.fillStyle=c+"14";rr(x,4,4,W-8,H-8,22);x.fill();x.strokeStyle=c+"aa";x.lineWidth=4;x.stroke();
        /* faint state outline on every sheet so they register on top of each other */
        G.districts.forEach(d=>d.r.forEach(r=>{tr(r,true);x.strokeStyle=c+"33";x.lineWidth=1;x.stroke()}));
        if(n==="Boundaries")G.districts.forEach(d=>d.r.forEach(r=>{tr(r,true);x.fillStyle="#efe2c8cc";x.fill();x.strokeStyle=c;x.lineWidth=2.5;x.stroke()}));
        else if(n==="Forest")G.districts.forEach((d,k)=>{if(!FOREST.has(d.n))return;d.r.forEach(r=>{tr(r,true);x.fillStyle=["#2f7a43cc","#4f9a4fcc","#3e8a4fcc"][k%3];x.fill()})});
        else{const list=n==="Rivers"?G.rivers:n==="Roads"?G.roads:n==="Rail"?G.rail:null;
          if(list){x.strokeStyle=c;x.lineWidth=n==="Rivers"?6:n==="Roads"?5:4;x.lineCap=x.lineJoin="round";if(n==="Rail")x.setLineDash([10,6]);list.forEach(l=>{tr(l.p);x.stroke()});x.setLineDash([])}
          else G.districts.forEach((d,k)=>{const r=d.r[0];let a=0,b=0;r.forEach(p=>{a+=p[0];b+=p[1]});const q=pr(a/r.length,b/r.length);
            [[-9,0,"#2f6fd6"],[9,0,"#d2423a"],[0,-12,"#e39a1f"]].forEach(([dx,dy,cc])=>{x.fillStyle=cc;x.beginPath();x.arc(q[0]+dx,q[1]+dy,7,0,7);x.fill();x.strokeStyle="#fff";x.lineWidth=2;x.stroke()})})}});
      const lt=this.tex(512,96,(x,W,H)=>{x.fillStyle="#ffffffee";rr(x,0,0,W,H,18);x.fill();x.fillStyle=c;x.fillRect(0,0,18,H);x.fillStyle="#0d1b2e";x.font=`700 46px ${SANS}`;x.fillText(n,36,64)});
      const sh=new THREE.Group();const glass=this.rb(16,.25,24,.2,new THREE.MeshPhysicalMaterial({color:c,transparent:true,opacity:.18,roughness:.1,clearcoat:1,depthWrite:false}));glass.castShadow=false;sh.add(glass);
      const face=new THREE.Mesh(new THREE.PlaneGeometry(16,24),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));face.rotation.x=-Math.PI/2;face.position.y=.16;sh.add(face);
      const lb=new THREE.Mesh(new THREE.PlaneGeometry(7,1.3),new THREE.MeshBasicMaterial({map:lt,transparent:true}));lb.position.set(-12,.2,8);lb.rotation.y=.25;sh.add(lb);
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
    const pts=[];this.facD=[];seed=21;G.districts.forEach((d,di)=>{const r=d.r[0];let a=[1e9,1e9,-1e9,-1e9];r.forEach(([x,y])=>{a=[Math.min(a[0],x),Math.min(a[1],y),Math.max(a[2],x),Math.max(a[3],y)]});
      for(let k=0,t=0;k<3&&t<200;t++){const p=[a[0]+rnd()*(a[2]-a[0]),a[1]+rnd()*(a[3]-a[1])];if(d.r.some(rr=>pip(p,rr))){pts.push(p);this.facD.push(di);k++}}});
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

  /* one card per file, fanned above its department; the card face shows the file's real contents */
  buildDocs(){const S=this.scene,per={};this.docs=FILES.map((F,j)=>{const d=DEPTS[F.d],t=this.tex(512,660,drawFile(F,d));
    const k=per[F.d]=(per[F.d]??-1)+1,n=FILES.filter(x=>x.d===F.d).length;
    const card=this.rb(6.4,8.25,.25,.5,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.5,emissive:0xffffff,emissiveIntensity:0}));card.castShadow=true;
    const face=new THREE.Mesh(new THREE.PlaneGeometry(6.4,8.25),new THREE.MeshBasicMaterial({map:t,transparent:true,toneMapped:false}));face.position.z=.14;card.add(face);
    const g=new THREE.Group();g.add(card);S.add(g);g.scale.setScalar(.001);card.userData.file=j;face.userData.file=j;
    /* the converted output: a glowing feature of the right kind */
    const c=new THREE.Color(d.col),mt=new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.6,roughness:.3});
    let out;if(F.kind==="point"){const pin=new THREE.ConeGeometry(.9,2.4,16);pin.rotateX(Math.PI);pin.translate(0,1.2,0);out=new THREE.Group();out.add(new THREE.Mesh(pin,mt));const h=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),mt);h.position.y=2.9;out.add(h)}
    else if(F.kind==="line"){const pts=[[-2.4,0,0],[-1,0,1.2],[.6,0,-.8],[2.4,0,.6]].map(p=>new THREE.Vector3(...p));out=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),32,.35,8),mt)}
    else if(F.kind==="raster"){out=new THREE.Group();for(let a=0;a<3;a++)for(let b=0;b<3;b++){const q=this.rb(1.2,.5,1.2,.15,new THREE.MeshStandardMaterial({color:[0x1f6b35,0x4f9a4f,0xa7c77a][(a+b)%3],roughness:.5}));q.position.set(a*1.35-1.35,0,b*1.35-1.35);out.add(q)}}
    else{const s=new THREE.Shape();[[-2.2,-1.6],[0,-2.4],[2.4,-1],[1.8,1.8],[-1,2.2],[-2.6,.4]].forEach((p,i)=>i?s.lineTo(...p):s.moveTo(...p));out=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:.5,bevelEnabled:true,bevelSize:.15,bevelThickness:.15,bevelSegments:2}),mt);out.rotation.x=-Math.PI/2}
    out.traverse(o=>{if(o.isMesh)o.castShadow=true});const og=new THREE.Group();og.add(out);S.add(og);og.scale.setScalar(.001);
    return{g,card,out:og,F,k,n,reject:!!F.reject,hv:0}})}

  /* pointer over the 3D: which file card is under it */
  /* what is under the pointer: a file card first, then a part of the block being explored, then a whole block */
  pick(cx,cy){const r=this.host.getBoundingClientRect(),v=new THREE.Vector2((cx-r.left)/r.width*2-1,-(cy-r.top)/r.height*2+1);
    this.ray=this.ray||new THREE.Raycaster();this.ray.setFromCamera(v,this.cam);const ray=this.ray,ex=this.ex;
    const first=list=>ray.intersectObjects(list,true)[0];
    let h=first(this.docs.filter(o=>o.live).map(o=>o.card));if(h)return{type:"file",i:h.object.userData.file,obj:this.docs[h.object.userData.file].card,tag:T2("Open","खोलें")};
    if(ex){const id=ex.id;
      if(id==="depts"){h=first(this.depts.map(d=>d.g));if(h){let o=h.object;while(o&&!this.depts.some(d=>d.g===o))o=o.parent;const k=this.depts.findIndex(d=>d.g===o);if(k>=0)return{type:"dept",i:k,obj:o,tag:DEPTS[k].short}}}
      if(id==="lab"){h=first(this.deskHits);if(h){const k=this.deskHits.indexOf(h.object);return{type:"desk",i:k,obj:h.object,tag:T2(`Desk ${k+1}`,`डेस्क ${k+1}`)}}}
      if(id==="dc"){h=first(this.racks.map(q=>q.hit));if(h){const k=this.racks.findIndex(q=>q.hit===h.object);return{type:"rack",i:k,obj:h.object,tag:T2("Rack "+this.racks[k].name,"रैक "+this.racks[k].name)}}}
      if(id==="map"){h=first(this.dist.map(d=>d.m));if(h){let o=h.object;if(o.isLineSegments)o=o.parent;const k=this.dist.findIndex(d=>d.m===o);if(k>=0)return{type:"dist",i:k,obj:o,tag:T2(this.dist[k].name,this.dist[k].name)}}}
      if(id==="portal"){const dv=[this.phoneG,this.tabG,this.lapG];h=first(dv);if(h){let o=h.object;while(o&&!dv.includes(o))o=o.parent;const k=dv.indexOf(o);return{type:"device",i:k,obj:o,tag:[T2("Field app","फ़ील्ड ऐप"),T2("Dashboard","डैशबोर्ड"),T2("Department GIS","विभागीय GIS")][k]}}}}
    h=first(this.blocks.filter(b=>!ex||b.id!==ex.id).map(b=>b.hit));
    if(h){const b=this.blocks.find(b=>b.hit===h.object);return{type:"block",id:b.id,obj:b.hit,tag:b.tag}}
    return null}
  rectObj(o){const b=new THREE.Box3().setFromObject(o),r=this.host.getBoundingClientRect();let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    for(let k=0;k<8;k++){const v=new THREE.Vector3(k&1?b.max.x:b.min.x,k&2?b.max.y:b.min.y,k&4?b.max.z:b.min.z).project(this.cam);const X=r.left+(v.x+1)/2*r.width,Y=r.top+(1-v.y)/2*r.height;x0=Math.min(x0,X);y0=Math.min(y0,Y);x1=Math.max(x1,X);y1=Math.max(y1,Y)}
    x0=Math.max(r.left+4,x0);y0=Math.max(r.top+4,y0);x1=Math.min(r.right-4,x1);y1=Math.min(r.bottom-4,y1);return{left:x0,top:y0,width:x1-x0,height:y1-y0,right:x1,bottom:y1}}

  /* ---------------- explore: each block on its own ---------------- */
  explore(id){const EXS={depts:SI.depts1+.5,lab:SI.conv2+.8,dc:SI.gdb+.5,map:SI.portal+.3,portal:SI.apps+.3};this.ex={id,s:EXS[id]};this.ex.cam=this.exCam();this.resize();return this.ex}
  exSet(o){if(!this.ex)return;Object.assign(this.ex,o);this.ex.cam=this.exCam()}
  exit(){this.ex=null;this.resize()}
  exCam(){const e=this.ex,V=(x,y,z)=>[x,y,z];
    if(e.id==="depts"){if(e.dept!=null){const b=this.depts[e.dept].g.position;return[V(b.x,48,b.z+44),V(b.x,9,b.z-2)]}return[V(-122,118,104),V(-122,0,-2)]}
    if(e.id==="lab"){if(e.desk!=null){const a=this.analysts[e.desk],c=this.conv.position;return[V(c.x+a.x,12.5,c.z+a.z+10.5),V(c.x+a.x,5.2,c.z+a.z-1.5)]}return[V(-46,44,60),V(-46,4,0)]}
    if(e.id==="dc"){if(e.rack!=null){const q=this.racks[e.rack],c=this.dc.position;return[V(c.x+q.x+5,13,c.z+q.z+22),V(c.x+q.x,7.5,c.z+q.z)]}return[V(14,42,80),V(14,9,0)]}
    if(e.id==="map"){if(e.dist!=null){const[x,z]=this.dist[e.dist].c;return[V(x,40,z+34),V(x,3,z)]}return[V(75,100,82),V(75,0,6)]}
    if(e.dev!=null){const p=[this.phoneG,this.tabG,this.lapG][e.dev].getWorldPosition(new THREE.Vector3());return[V(p.x,p.y+7,p.z+30),V(p.x,p.y,p.z)]}return[V(75,32,62),V(75,22,-48)]}
  distInfo(k){const n=[0,0,0];(this.facD||[]).forEach((d,i)=>{if(d===k)n[i%3]++});return{name:this.dist[k].name,n}}

  /* clickable volumes and hover outlines for the five blocks */
  buildBlocks(){const S=this.scene,hm=new THREE.MeshBasicMaterial({visible:false});
    const B=[["depts",-123,-14,88,56,26,T2("Explore · Departments","एक्सप्लोर · विभाग")],["lab",-46,2,38,30,17,T2("Explore · CHiPS lab","एक्सप्लोर · चिप्स लैब")],
      ["dc",14,0,38,34,22,T2("Explore · Data centre","एक्सप्लोर · डेटा केंद्र")],["map",75,1,56,80,8,T2("Explore · Map","एक्सप्लोर · नक्शा")],["portal",104,-24,96,44,46,T2("Explore · Geoportal & apps","एक्सप्लोर · जियोपोर्टल व ऐप्स")]];
    this.blocks=B.map(([id,x,z,w,d,h,tag])=>{const hit=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),hm);hit.position.set(x,h/2,z);S.add(hit);
      const rr2=(W,D,r)=>{const q=new THREE.Shape();q.moveTo(-W/2+r,-D/2);q.lineTo(W/2-r,-D/2);q.quadraticCurveTo(W/2,-D/2,W/2,-D/2+r);q.lineTo(W/2,D/2-r);q.quadraticCurveTo(W/2,D/2,W/2-r,D/2);q.lineTo(-W/2+r,D/2);q.quadraticCurveTo(-W/2,D/2,-W/2,D/2-r);q.lineTo(-W/2,-D/2+r);q.quadraticCurveTo(-W/2,-D/2,-W/2+r,-D/2);return q};
      const o=rr2(w,d,3);o.holes.push(rr2(w-1.2,d-1.2,2.4));const ring=new THREE.Mesh(new THREE.ShapeGeometry(o,6),new THREE.MeshBasicMaterial({color:col("--accent","#ff5a36"),transparent:true,opacity:0,depthWrite:false}));
      ring.rotation.x=-Math.PI/2;ring.position.set(x,.32,z);S.add(ring);return{id,hit,ring,tag,a:0}})}
  rectOf(j){const b=new THREE.Box3().setFromObject(this.docs[j].card),r=this.host.getBoundingClientRect();let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    for(let k=0;k<8;k++){const v=new THREE.Vector3(k&1?b.max.x:b.min.x,k&2?b.max.y:b.min.y,k&4?b.max.z:b.min.z).project(this.cam);const X=r.left+(v.x+1)/2*r.width,Y=r.top+(1-v.y)/2*r.height;x0=Math.min(x0,X);y0=Math.min(y0,Y);x1=Math.max(x1,X);y1=Math.max(y1,Y)}
    return{left:x0,top:y0,width:x1-x0,height:y1-y0,right:x1,bottom:y1}}

  buildLoop(){const pts=[];for(let i=0;i<=80;i++){const t=i/80,x=mix(140,-120,t);pts.push(new THREE.Vector3(x,22+Math.sin(t*Math.PI)*40,mix(10,-14,t)))}
    this.loopCurve=new THREE.CatmullRomCurve3(pts);const tube=new THREE.TubeGeometry(this.loopCurve,160,.35,8);
    this.loop=new THREE.Mesh(tube,new THREE.MeshBasicMaterial({color:col("--accent","#ff5a36"),transparent:true,opacity:.9}));this.loop.userData.full=tube.index.count;tube.setDrawRange(0,0);this.scene.add(this.loop);
    this.loopDots=new THREE.InstancedMesh(new THREE.SphereGeometry(.8,12,8),new THREE.MeshBasicMaterial({color:0xffc93c}),6);this.loopDots.visible=false;this.scene.add(this.loopDots)}

  /* ---------------- per-frame: everything from s ---------------- */
  frame(){if(!this.on)return;const raw=Math.min(.5,this.clock.getDelta()),dt=Math.min(.05,raw),ka=1-Math.exp(-raw*5);this.t+=dt;const ex=this.ex,s=ex?ex.s:this.s,t=this.t,M=this.M;
    /* camera: glide between step keys in the first 40% of each step */
    const i=Math.floor(cl(s,0,STEPS.length-.0001)),f=s-i,k0=STEPS[Math.max(0,i-1)].cam,k1=STEPS[i].cam,e=i===0?1:sm(f/.4);
    const far=this.phone?1.55:1;
    const pos=new THREE.Vector3(...k0[0]).lerp(new THREE.Vector3(...k1[0]),e),tgt=new THREE.Vector3(...k0[1]).lerp(new THREE.Vector3(...k1[1]),e);
    if(ex){pos.set(...ex.cam[0]);tgt.set(...ex.cam[1])}
    pos.sub(tgt).multiplyScalar(far).add(tgt);pos.x+=this.mouse.x*6;pos.y-=this.mouse.y*4;
    this.cam.position.lerp(pos,ka);this.look.lerp(tgt,ka);this.cam.lookAt(this.look);
    /* the floor path pulses while data moves; analysts type, glance between their two screens */
    this.pathTex.offset.y-=dt*(s>SI.conv1&&s<SI.map?.8:.1);
    this.analysts.forEach((a,k)=>{a.head.rotation.y=Math.sin(t*.45+a.ph)*.3;a.head.rotation.x=.1+Math.sin(t*.8+a.ph)*.04;
      a.arms.forEach((fa,m)=>{fa.position.y=1.22+Math.max(0,Math.sin(t*(8+k)+m*2.3+a.ph))*.06});a.mouse.position.x=a.x+2.2+Math.sin(t*1.3+a.ph)*.12});
    /* departments: all of them in the overview, then one at a time; the one whose file is under the pointer lifts */
    const hh0=this.hoverHit,active=ex?(ex.id==="depts"&&ex.dept!=null?ex.dept:-1):STEPS[i].depts==="each"?Math.min(7,Math.floor(f*8)):-1,hvD=this.hover>=0?FILES[this.hover].d:hh0&&hh0.type==="dept"?hh0.i:-1;
    this.depts.forEach((dp,j)=>{const on=j===active||j===hvD;dp.g.position.y+=((on?.6:0)-dp.g.position.y)*.15;dp.acc.emissive.set(dp.d.col);dp.acc.emissiveIntensity+=((on?.8:0)-dp.acc.emissiveIntensity)*.15});
    if(this.flag)this.flag.rotation.y=Math.sin(t*2)*.18;
    /* files → belt → CHiPS lab → outputs → gate → data centre */
    const sD=SI.depts1,sC=SI.collect,sQ=SI.qa,sG=SI.gdb;
    const conv=this.conv.position,gate=this.gate.position,dc=this.dc.position;
    this.docs.forEach((o,j)=>{const F=o.F,dp=this.depts[F.d],off=o.k-(o.n-1)/2;
      const home=new THREE.Vector3(dp.g.position.x+off*6.2,dp.top+5.6-Math.abs(off)*.7,dp.g.position.z+Math.abs(off)*.5);
      const appear=seg(s,sD-.6+j*.025,sD-.1+j*.025),isAct=F.d===active;
      const an=this.analysts[j%6],flyStart=sC+.05+j*.035,fp=cl((s-flyStart)/.4);
      o.hv+=((j===this.hover?1:0)-o.hv)*.2;
      let p=home.clone(),sc=appear*(isAct?1.15:.9)*(1+o.hv*.2);
      /* sending: the file folds into an email, flies to its analyst's desk and opens on the left screen */
      const env=this.envs[j],fold=cl(fp/.15);sc*=1-fold;let es=0;
      if(fp>0){const to=new THREE.Vector3(conv.x+an.x-1.95,conv.y+5.4,conv.z+an.z-.4),q=sm(cl((fp-.15)/.85));
        env.position.copy(home).lerp(to,q);env.position.y+=Math.sin(q*Math.PI)*24;es=Math.min(fold,1-sm((q-.82)/.18))*.95;
        env.lookAt(this.cam.position);env.rotateZ(Math.sin(t*3+j)*.12*(1-q))}
      env.scale.setScalar(Math.max(.001,es));o.arrived=fp>=1;
      o.live=sc>.3&&fp<.15;
      o.g.position.copy(p);o.g.position.y+=fp>0?0:Math.sin(t*1.6+j)*.25;o.g.scale.setScalar(Math.max(.001,sc));o.g.lookAt(this.cam.position.x,o.g.position.y,this.cam.position.z);
      o.card.material.emissiveIntensity=o.hv*.3;
      /* output: emerges from the lab during conversion, waits at the gate, enters the data centre */
      const col=j%6,row=Math.floor(j/6),outS=SI.conv1+.2+j*.07,toGate=sQ+.1+j*.02,toDC=sQ+.6+j*.015,absorb=sG+.25;
      const a=cl((s-outS)/.4),b=cl((s-toGate)/.35),c=cl((s-toDC)/.35);
      const exit=new THREE.Vector3(conv.x+19.5+a*2,3,conv.z-11+col*1.6+row*.6),atGate=new THREE.Vector3(gate.x-6+col*1.15,3,this.beltZ+(row-1)*1.5),
        inDC=new THREE.Vector3(dc.x-10.5+col*4.2,8+row*3,dc.z+(row-1)*2.5);
      let q=exit.clone().lerp(atGate,sm(b));q.y+=Math.sin(sm(b)*Math.PI)*8;let osc=sm(a);
      if(o.reject&&b>0){/* the record with a blank code goes back to its department */
        const back=cl((s-(sQ+.3))/.5);if(back>0){const hp=dp.g.position;q=atGate.clone().lerp(new THREE.Vector3(hp.x,2,hp.z+8),sm(back));q.y+=Math.sin(back*Math.PI)*18;osc*=1-sm((back-.8)/.2)}}
      else if(c>0){q=q.lerp(inDC,sm(c));q.y+=Math.sin(c*Math.PI)*10;osc*=1-sm((s-absorb)/.3)}
      o.out.position.copy(q);o.out.position.y+=Math.sin(t*2.4+j)*.2;o.out.rotation.y=t*.8+j;o.out.scale.setScalar(Math.max(.001,osc*.55))});
    /* screens: the team inbox fills as mail lands; each analyst opens their newest mail and works it in the GIS tool */
    const got=this.docs.filter(o=>o.arrived).map(o=>o.F);
    if(this.inboxN!==got.length){this.inboxN=got.length;const u=this.inboxTex.userData,dr=inboxDraw(got,DEPTS);u.draw=dr;u.x.clearRect(0,0,u.c.width,u.c.height);dr(u.x,u.c.width,u.c.height);this.inboxTex.needsUpdate=true}
    this.analysts.forEach((an,k)=>{const mine=got.filter(F=>F.i%6===k);let F=mine[mine.length-1];
      const arr=F?sC+.05+F.i*.035+.4:0;let pr=F?Math.round(cl((s-arr-.15)/(sQ-.4-arr))*10)/10:0;
      if(ex&&ex.id==="lab"&&ex.desk===k&&ex.file!=null){F=FILES[ex.file];pr=Math.round((ex.labP??1)*20)/20}const d=F&&DEPTS[F.d];
      this.setScreen(an.scr[0],F?`${F.i}:${mine.length}`:"-",mailDraw(F,d,mine,DEPTS));this.setScreen(an.scr[1],F?`${F.i}:${pr}`:"-",gisDraw(F,d,pr))});
    const hh=this.ptr&&!this.down?this.pick(this.ptr[0],this.ptr[1]):null;this.hoverHit=hh;this.hover=hh&&hh.type==="file"?hh.i:-1;this.hoverRect=hh?this.rectObj(hh.obj):null;this.hoverTag=hh?hh.tag:null;
    this.blocks.forEach(b=>{const on=hh&&hh.type==="block"&&hh.id===b.id?.9:ex&&ex.id===b.id?.45:0;b.a+=(on-b.a)*.15;b.ring.material.opacity=b.a;b.ring.visible=b.a>.01});
    /* gate light: red while the reject bounces */
    const rej=s>sQ+.25&&s<sQ+.85;this.gateLight.material.color.set(rej?0xff5a36:0x3fd6a0);this.gateLight.material.emissive.set(rej?0xff5a36:0x3fd6a0);this.gateCurtain.material.color.set(rej?0xff5a36:0x3fd6a0);
    this.gateCurtain.material.opacity=.06+Math.sin(t*5)*.04+(s>sQ&&s<sQ+1?.08:0);
    /* data centre LEDs and floating geodatabase layers */
    const busy=seg(s,sQ+.5,sG+.2),c3=new THREE.Color(),bk=ex&&ex.backup!=null?t-ex.backup:-1;this.leds.forEach((l,k)=>{const on=(Math.sin(t*l.s*3+l.p)>.2-busy*.6);c3.set(on?(k%5===0?0xffc93c:0x3fd6a0):0x16324a);if(bk>=0&&bk<4)c3.set(Math.sin(t*14+k*.7)>0?0xffc93c:0x2a1e06);else if(bk>=4&&bk<7)c3.set(0x3fd6a0);this.ledMesh.setColorAt(k,c3)});
    this.racks.forEach((q,k)=>{q.open+=((ex&&ex.id==="dc"&&ex.rack===k?1:0)-q.open)*.1;q.hinge.rotation.y=-q.open*1.7});this.ledMesh.instanceColor.needsUpdate=true;this.dcGlow.material.opacity=.08+busy*.14;
    const lay=seg(s,sG,sG+.6),toMap=seg(s,SI.map,SI.map+.5);
    this.sheets.forEach((sh,k)=>{const up=seg(s,sG+k*.07,sG+.35+k*.07);const y=mix(8,18+k*3,up);const mapPos=new THREE.Vector3(MX-dc.x,4+k*.1,1);
      sh.position.set(mix(0,mapPos.x,toMap),mix(y,mapPos.y+Math.sin(toMap*Math.PI)*28,toMap),mix(0,mapPos.z,toMap));sh.scale.setScalar(Math.max(.001,up*(1-sm((toMap-.7)/.3))));sh.rotation.y=Math.sin(t*.6+k)*.05*(1-toMap)});
    /* the map assembles layer by layer */
    const sm0=SI.map,mp=s-sm0;
    const dIn=seg(s,sm0-1.2,sm0-.4);this.dist.forEach((d,k)=>{const dd=seg(s,sm0-1.1+k*.012,sm0-.5+k*.012);d.m.position.y=3+(1-dd)*18;d.m.visible=dd>0.001});
    const draw=(grp,a,b)=>{const p=seg(s,a,b);grp.visible=p>0;grp.children.forEach(m=>m.geometry.setDrawRange(0,Math.floor(m.userData.full*p/3)*3))};
    draw(this.rivers,sm0+.15,sm0+.45);draw(this.roads,sm0+.3,sm0+.6);draw(this.rail,sm0+.4,sm0+.65);
    const off=ex&&ex.off||{};if(off.rivers)this.rivers.visible=false;if(off.roads)this.roads.visible=false;if(off.rail)this.rail.visible=false;this.trees.visible=!off.forest;this.fac.visible=this.facH.visible=!off.fac;
    const m4=new THREE.Matrix4(),qn=new THREE.Quaternion(),v3=new THREE.Vector3();
    const tp=seg(s,sm0+.05,sm0+.35);this.treePts.forEach(([p,sc],k)=>{const[x,z]=P(...p);const g=cl(tp*1.6-k/this.treePts.length*.6);v3.setScalar(Math.max(.001,g*sc));m4.compose(new THREE.Vector3(x,3.9,z),qn,v3);this.trees.setMatrixAt(k,m4)});this.trees.instanceMatrix.needsUpdate=true;
    const pp=seg(s,sm0+.5,sm0+.8);this.facPts.forEach((p,k)=>{const[x,z]=P(...p);const g=cl(pp*1.6-k/this.facPts.length*.6);const e=g<1?1+2.7*Math.pow(g-1,3)+1.7*Math.pow(g-1,2):1;v3.setScalar(Math.max(.001,e));m4.compose(new THREE.Vector3(x,3.9,z),qn,v3);this.fac.setMatrixAt(k,m4);this.facH.setMatrixAt(k,m4)});
    this.fac.instanceMatrix.needsUpdate=this.facH.instanceMatrix.needsUpdate=true;
    /* use cases: districts rise and take a colour per question */
    let su=SI.uses,uIn=seg(s,su-.1,su+.15)*(1-seg(s,su+.9,su+1.1)),ui=Math.min(3,Math.floor(cl(s-su)*4));if(ex&&ex.id==="map"&&ex.use!=null){uIn=1;ui=ex.use}this.useIdx=uIn>0?ui:-1;
    const ucol=new THREE.Color(["#2f6fd6","#d2423a","#3e8a4f","#0b7a70"][ui]);
    this.dist.forEach((d,k)=>{const v=(Math.sin(k*12.9898+ui*78.233)*43758.5453)%1,vv=Math.abs(v);const h=1+uIn*vv*5;d.m.scale.z=h;
      d.m.material[0].color.copy(d.base).lerp(ucol.clone().lerp(new THREE.Color(0xffffff),1-vv),uIn*.9)});
    /* explore: the district under the pointer lifts, the chosen one turns accent */
    const hd=hh0&&hh0.type==="dist"?hh0.i:-1,sd=ex&&ex.dist!=null?ex.dist:-1;this.acc3=this.acc3||col("--accent","#ff5a36");
    if(hd>=0)this.dist[hd].m.position.y+=.6;if(sd>=0){this.dist[sd].m.position.y+=1.2;this.dist[sd].m.material[0].color.copy(this.acc3)}
    const hl=ex&&ex.hl||0;if(hl!==(this.portalHl||0)){this.portalHl=hl;const u=this.portalTex.userData;u.draw=(x,W,H)=>this.drawPortal(x,W,H,hl);u.x.clearRect(0,0,u.c.width,u.c.height);u.draw(u.x,u.c.width,u.c.height);this.portalTex.needsUpdate=true}
    /* portal screen rises behind the map */
    const pr=seg(s,SI.portal-.5,SI.portal+.2);this.portal.position.y=mix(-40,24,pr);this.portal.visible=pr>0;
    /* apps pop up */
    [[this.phoneG,0],[this.tabG,.12],[this.lapG,.24]].forEach(([o,d])=>{const a=seg(s,SI.apps-.45+d,SI.apps-.05+d);const e=a<1?1+2.7*Math.pow(a-1,3)+1.7*Math.pow(a-1,2):1;o.scale.setScalar(Math.max(.001,e));o.position.y+=Math.sin(t*1.5+d*10)*.004});
    /* the loop back from the field */
    const lp=seg(s,SI.loop-.2,SI.loop+.5);this.loop.geometry.setDrawRange(0,Math.floor(this.loop.userData.full*lp/3)*3);this.loopDots.visible=lp>.95;
    if(this.loopDots.visible){for(let k=0;k<6;k++){const u=((t*.08+k/6)%1);m4.makeTranslation(...this.loopCurve.getPointAt(u).toArray());this.loopDots.setMatrixAt(k,m4)}this.loopDots.instanceMatrix.needsUpdate=true}
    this.r.render(this.scene,this.cam)}
}
