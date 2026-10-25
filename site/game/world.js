/* The miniature world: Chhattisgarh as a diorama on a plinth, built from the official 33-district layer.
   Layers arrive as the player clears levels. Real: districts, state outline, rivers, roads, rail, towns
   (Natural Earth). Illustrative: facility points, trees, clouds. */
import * as THREE from "three";
import {OrbitControls} from "../vendor/OrbitControls.js";

const G=window.GEO,D2R=Math.PI/180,LON0=82.15,LAT0=21.35,K=10,CX=Math.cos(LAT0*D2R);
export const P=(lon,lat)=>[(lon-LON0)*CX*K,-(lat-LAT0)*K];            // lon/lat → world x,z
const TOP=.5;                                                           // district top surface
const pip=(pt,ring)=>{let ins=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const[xi,yi]=ring[i],[xj,yj]=ring[j];if(((yi>pt[1])!==(yj>pt[1]))&&pt[0]<(xj-xi)*(pt[1]-yi)/(yj-yi)+xi)ins=!ins}return ins};
const inDistrict=(d,pt)=>d.r.some(r=>pip(pt,r));
let seed=11;const rnd=()=>(seed=seed*16807%2147483647)/2147483647;

export const COLORS={paper:0xfbf8f2,side:0xe2d9c6,plinth:0xe9e1d0,plinthSide:0xcfc4ad,line:0xb7ad9b,
  river:0x3c8fd6,road:0xd2733c,rail:0x3a383d,school:0x2f6fd6,health:0xd2423a,anganwadi:0xe39a1f,pending:0xffc23a,tree:0x5f8f4e,trunk:0x8a6a4a};
export const FOREST=new Set(["Bastar","Dantewada","Bijapur","Sukma","Narayanpur","Kanker","Kondagaon","Sarguja","Jashpur","Korba","Balrampur-Ramanujganj","Surajpur","Koriya","Manendragarh-Chirmiri-Bharatpur","Gariyaband","Dhamtari","Gaurela-Pendra-Marwahi","Mohla-Manpur-Ambagarh Chowki"]);

const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function themeColors(){[["paper","--w-top"],["side","--w-side"],["plinth","--w-plinth"],["plinthSide","--w-plinth-side"],["line","--w-line"],["slab","--w-slab"]].forEach(([k,v])=>{const c=css(v);if(c)COLORS[k]=new THREE.Color(c).getHex()})}
export class World{
  constructor(host,labelHost){themeColors();this.ql=/[?&]lowgl/.test(location.search)?2:0;this.qn=0;this.qs=0;
    this.host=host;this.labelHost=labelHost;this.labels=[];this.hoverCb=null;this.anim=[];this.t=0;
    const R=this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
    R.setPixelRatio(this.ql?.5:Math.min(2,devicePixelRatio||1));R.shadowMap.enabled=!this.ql;R.shadowMap.type=THREE.PCFSoftShadowMap;
    R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.05;R.outputColorSpace=THREE.SRGBColorSpace;
    host.appendChild(R.domElement);
    const S=this.scene=new THREE.Scene();
    const cam=this.camera=new THREE.PerspectiveCamera(30,1,1,1000);cam.position.set(0,92,88);
    const ctl=this.controls=new OrbitControls(cam,R.domElement);ctl.enableDamping=true;ctl.dampingFactor=.08;ctl.enablePan=false;
    ctl.minDistance=28;ctl.maxDistance=170;ctl.maxPolarAngle=1.22;ctl.minPolarAngle=.15;ctl.rotateSpeed=.6;ctl.zoomSpeed=.7;
    ctl.enableZoom=false;   // the page scrolls; zoom is offered with buttons and pinch
    S.add(new THREE.HemisphereLight(0xfff8ec,0xcdbf9f,1.6));
    const sun=this.sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(-40,80,30);sun.castShadow=!this.ql;
    sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-55,right:55,top:55,bottom:-55,near:10,far:200});sun.shadow.bias=-.0006;S.add(sun);
    this.build();
    this.ray=new THREE.Raycaster();this.mouse=new THREE.Vector2();
    R.domElement.addEventListener("pointermove",e=>this.onMove(e));
    R.domElement.addEventListener("pointerleave",()=>{this.setHover(null)});
    new ResizeObserver(()=>this.resize()).observe(host);this.resize();
    this.clock=new THREE.Clock();R.setAnimationLoop(()=>this.frame());
  }
  resize(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;
    this.camera.fov=w<700?42:30;
    /* keep the diorama centred in the space the panel leaves free: right panel on desktop, bottom sheet on phones */
    const wide=w>900,ox=wide?Math.min(410,w*.34)/2+14:0,oy=wide?0:-h*.2;
    if(this.offset!==false)this.camera.setViewOffset(w,h,ox,-oy,w,h);this.camera.updateProjectionMatrix()}
  setOffset(on){this.offset=on;if(!on)this.camera.clearViewOffset();this.resize()}

  /* ---------------- build ---------------- */
  shapeOf(ring){const s=new THREE.Shape();ring.forEach(([lo,la],i)=>{const[x,z]=P(lo,la);i?s.lineTo(x,-z):s.moveTo(x,-z)});return s}
  build(){const S=this.scene;
    /* plinth: a museum-style base under the state */
    const st=G.state[0],ss=this.shapeOf(st);
    const plinth=new THREE.Mesh(new THREE.CylinderGeometry(52,54,3,96),[new THREE.MeshStandardMaterial({color:COLORS.plinthSide,roughness:.9}),new THREE.MeshStandardMaterial({color:COLORS.plinth,roughness:.95}),new THREE.MeshStandardMaterial({color:COLORS.plinthSide})]);
    plinth.position.y=-1.5-1.2;plinth.receiveShadow=true;S.add(plinth);
    const slab=new THREE.Mesh(new THREE.ExtrudeGeometry(ss,{depth:1.2,bevelEnabled:false}),[new THREE.MeshStandardMaterial({color:COLORS.slab||0xf1eadb,roughness:.9}),new THREE.MeshStandardMaterial({color:COLORS.side,roughness:.9})]);
    slab.rotation.x=-Math.PI/2;slab.position.y=-1.2;slab.receiveShadow=true;slab.castShadow=true;S.add(slab);this.slab=slab;
    /* ghost outline of the state before any data arrives */
    const gpts=st.map(([lo,la])=>{const[x,z]=P(lo,la);return new THREE.Vector3(x,.02,z)});
    const gg=new THREE.BufferGeometry().setFromPoints(gpts);this.ghost=new THREE.Line(gg,new THREE.LineDashedMaterial({color:0x8a7f6c,dashSize:.8,gapSize:.6,transparent:true}));
    this.ghost.computeLineDistances();S.add(this.ghost);
    /* districts */
    this.districts=[];const dg=new THREE.Group();S.add(dg);this.dGroup=dg;
    G.districts.forEach((d,i)=>{const shapes=d.r.map(r=>this.shapeOf(r));
      const geo=new THREE.ExtrudeGeometry(shapes,{depth:TOP,bevelEnabled:true,bevelThickness:.06,bevelSize:.06,bevelSegments:1});
      const tint=new THREE.Color(COLORS.paper).offsetHSL(0,0,(i%3-1)*.012);
      const top=new THREE.MeshStandardMaterial({color:tint,roughness:.85}),side=new THREE.MeshStandardMaterial({color:COLORS.side,roughness:.9});
      const m=new THREE.Mesh(geo,[top,side]);m.rotation.x=-Math.PI/2;m.castShadow=m.receiveShadow=true;
      const edge=new THREE.LineSegments(new THREE.EdgesGeometry(geo,35),new THREE.LineBasicMaterial({color:COLORS.line,transparent:true,opacity:.9}));m.add(edge);
      const g=new THREE.Group();g.add(m);dg.add(g);
      let cx=0,cz=0,n=0;d.r[0].forEach(([lo,la])=>{const[x,z]=P(lo,la);cx+=x;cz+=z;n++});
      const c=this.centroid(d);
      const rec={name:d.n,i,group:g,mesh:m,top,base:tint.clone(),c,h:1,lift:0,targetLift:0,data:d};m.userData.rec=rec;this.districts.push(rec);
      g.visible=false});
    /* layers */
    this.layers={rivers:this.lines(G.rivers,COLORS.river,.16),roads:this.lines(G.roads,COLORS.road,.11),rail:this.lines(G.rail,COLORS.rail,.07)};
    this.facilities=this.makeFacilities();
    this.trees=this.makeTrees();
    this.clouds=this.makeClouds();
    this.pins=[];
  }
  centroid(d){let best=null,bc=-1;d.r.forEach(r=>{if(r.length>bc){bc=r.length;best=r}});let a=0,x=0,y=0;
    for(let i=0,j=best.length-1;i<best.length;j=i++){const[x0,y0]=best[j],[x1,y1]=best[i],f=x0*y1-x1*y0;a+=f;x+=(x0+x1)*f;y+=(y0+y1)*f}
    a*=.5;let c=[x/(6*a),y/(6*a)];if(!inDistrict(d,c)){c=best[Math.floor(best.length/2)]}return c}
  lines(list,color,r){const g=new THREE.Group();g.visible=false;const mat=new THREE.MeshStandardMaterial({color,roughness:.5});
    list.forEach(l=>{if(l.p.length<2)return;const pts=l.p.map(([lo,la])=>{const[x,z]=P(lo,la);return new THREE.Vector3(x,TOP+.12,z)});
      const curve=new THREE.CatmullRomCurve3(pts,false,"centripetal");const tube=new THREE.TubeGeometry(curve,Math.max(8,pts.length*3),r,6,false);
      const m=new THREE.Mesh(tube,mat);m.castShadow=true;m.userData.full=tube.index.count;tube.setDrawRange(0,0);g.add(m)});
    this.scene.add(g);g.userData.mat=mat;return g}
  makeFacilities(){seed=11;const types=[["school",COLORS.school,[1,4]],["health",COLORS.health,[1,2]],["anganwadi",COLORS.anganwadi,[2,5]]];
    const out={},list=[];
    types.forEach(([t,col,[a,b]])=>{const pts=[];this.districts.forEach(d=>{const n=a+Math.floor(rnd()*(b-a+1));const bb=this.bbox(d.data);
        for(let k=0,tries=0;k<n&&tries<400;tries++){const p=[bb[0]+rnd()*(bb[2]-bb[0]),bb[1]+rnd()*(bb[3]-bb[1])];if(inDistrict(d.data,p)){pts.push({p,d:d.name});k++}}});
      const geo=new THREE.CylinderGeometry(.0,.2,.7,8);geo.translate(0,.35,0);const head=new THREE.SphereGeometry(.22,12,8);head.translate(0,.8,0);
      const merged=this.merge([geo,head]);const mat=new THREE.MeshStandardMaterial({color:col,roughness:.4});
      const im=new THREE.InstancedMesh(merged,mat,pts.length);im.castShadow=true;im.visible=false;im.userData.pts=pts;
      const M=new THREE.Matrix4();pts.forEach((q,i)=>{const[x,z]=P(...q.p);M.makeTranslation(x,TOP,z);im.setMatrixAt(i,M)});
      this.scene.add(im);out[t]=im;pts.forEach(q=>list.push({...q,t}))});
    out.list=list;return out}
  merge(geos){const pos=[],nor=[],idx=[];let off=0;geos.forEach(g=>{const ng=g.index?g:g;const p=ng.attributes.position.array,n=ng.attributes.normal.array;
      pos.push(...p);nor.push(...n);const ii=ng.index?Array.from(ng.index.array):[...Array(p.length/3).keys()];idx.push(...ii.map(v=>v+off));off+=p.length/3});
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("normal",new THREE.Float32BufferAttribute(nor,3));g.setIndex(idx);return g}
  bbox(d){let a=[999,999,-999,-999];d.r.forEach(r=>r.forEach(([x,y])=>{a[0]=Math.min(a[0],x);a[1]=Math.min(a[1],y);a[2]=Math.max(a[2],x);a[3]=Math.max(a[3],y)}));return a}
  makeTrees(){seed=29;const pts=[];this.districts.forEach(d=>{if(!FOREST.has(d.name))return;const bb=this.bbox(d.data);
      for(let k=0,t=0;k<10&&t<300;t++){const p=[bb[0]+rnd()*(bb[2]-bb[0]),bb[1]+rnd()*(bb[3]-bb[1])];if(inDistrict(d.data,p)){pts.push(p);k++}}});
    const cone=new THREE.ConeGeometry(.42,1.1,6);cone.translate(0,.95,0);const trunk=new THREE.CylinderGeometry(.09,.11,.45,5);trunk.translate(0,.22,0);
    const a=new THREE.InstancedMesh(cone,new THREE.MeshStandardMaterial({color:COLORS.tree,roughness:.8,flatShading:true}),pts.length);
    const b=new THREE.InstancedMesh(trunk,new THREE.MeshStandardMaterial({color:COLORS.trunk}),pts.length);
    const M=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3();
    pts.forEach(([lo,la],i)=>{const[x,z]=P(lo,la);const sc=.7+rnd()*.6;s.set(sc,sc,sc);M.compose(new THREE.Vector3(x,TOP,z),q,s);a.setMatrixAt(i,M);b.setMatrixAt(i,M)});
    a.castShadow=b.castShadow=true;const g=new THREE.Group();g.add(a,b);g.visible=false;this.scene.add(g);return g}
  makeClouds(){const g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,transparent:true,opacity:.92,flatShading:true});seed=5;
    for(let i=0;i<6;i++){const c=new THREE.Group();for(let j=0;j<4;j++){const s=new THREE.Mesh(new THREE.IcosahedronGeometry(.8+rnd()*.8,0),mat);s.position.set(j*1.1-1.7,rnd()*.5,rnd()*.8);c.add(s)}
      c.position.set(-60+rnd()*120,9+rnd()*4,-40+rnd()*80);c.userData.v=.6+rnd()*.8;g.add(c)}
    this.scene.add(g);return g}

  /* ---------------- per-frame ---------------- */
  frame(){const raw=this.clock.getDelta(),dt=Math.min(.05,raw);this.t+=dt;
    /* adaptive quality: weak machines get fewer pixels and no shadows */
    if(this.ql<3&&raw<1){this.qn++;this.qs+=raw;if(this.qn===40){const avg=this.qs/40;this.qn=0;this.qs=0;
      if(avg>.034){this.ql++;const R=this.renderer;if(this.ql===1)R.setPixelRatio(1);if(this.ql===2){R.shadowMap.enabled=false;this.sun.castShadow=false;R.setPixelRatio(.75)}if(this.ql===3)R.setPixelRatio(.5);this.resize()}}}
    this.controls.update();
    this.clouds.children.forEach(c=>{c.position.x+=c.userData.v*dt;if(c.position.x>70)c.position.x=-70});
    this.districts.forEach(d=>{d.lift+=(d.targetLift-d.lift)*.15;d.group.position.y=d.lift});
    this.pins.forEach(p=>{if(p.bob)p.obj.position.y=p.y+Math.sin(this.t*3+p.ph)*.25;if(p.ring){const k=(this.t*.8+p.ph)%1;p.ring.scale.setScalar(1+k*4);p.ring.material.opacity=1-k}});
    for(let i=this.anim.length-1;i>=0;i--){const a=this.anim[i];a.t+=dt;const k=Math.min(1,a.t/a.d);a.f(a.e?a.e(k):k);if(k>=1){this.anim.splice(i,1);a.done&&a.done()}}
    if(!window.__noRender)this.renderer.render(this.scene,this.camera);
    const w=this.host.clientWidth,h=this.host.clientHeight,v=new THREE.Vector3();
    this.labels.forEach(l=>{v.copy(l.pos).project(this.camera);const vis=v.z<1&&l.on;l.el.style.opacity=vis?1:0;
      l.el.style.transform=`translate(${(v.x*.5+.5)*w}px,${(-v.y*.5+.5)*h}px)`})}
  tween(d,f,e=x=>1-Math.pow(1-x,3)){return new Promise(r=>this.anim.push({t:0,d,f,e,done:r}))}

  /* ---------------- camera ---------------- */
  fly(pos,target=[0,0,0],d=1.6){const c=this.camera,ctl=this.controls,p0=c.position.clone(),t0=ctl.target.clone(),p1=new THREE.Vector3(...pos),t1=new THREE.Vector3(...target);
    return this.tween(d,k=>{c.position.lerpVectors(p0,p1,k);ctl.target.lerpVectors(t0,t1,k)},x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2)}
  home(d=1.6){return this.fly(this.host.clientWidth<700?[0,150,120]:[0,104,96],[0,0,4],d)}
  flyTo(name,d=1.6){const r=this.byName(name);if(!r)return;const[x,z]=P(...r.c);return this.fly([x+8,46,z+44],[x,0,z],d)}
  zoom(f){const c=this.camera,t=this.controls.target,v=c.position.clone().sub(t).multiplyScalar(f);const L=v.length();if(L<28||L>170)return;return this.fly(t.clone().add(v).toArray(),t.toArray(),.5)}
  autoRotate(on){this.controls.autoRotate=on;this.controls.autoRotateSpeed=.6}

  /* ---------------- layers ---------------- */
  byName(n){return this.districts.find(d=>d.name===n)}
  async dropDistricts(stagger=.035){this.ghost.material.opacity=.35;const order=[...this.districts].sort((a,b)=>b.c[1]-a.c[1]);
    await Promise.all(order.map((d,i)=>new Promise(res=>setTimeout(()=>{d.group.visible=true;const y0=14;
      this.tween(.7,k=>{d.group.position.y=y0*(1-k);d.lift=d.group.position.y},x=>{const n=7.5625,d1=2.75;if(x<1/d1)return n*x*x;if(x<2/d1)return n*(x-=1.5/d1)*x+.75;if(x<2.5/d1)return n*(x-=2.25/d1)*x+.9375;return n*(x-=2.625/d1)*x+.984375}).then(res)},i*stagger*1000))));
    this.ghost.visible=false}
  showDistrictsNow(){this.districts.forEach(d=>{d.group.visible=true;d.lift=0});this.ghost.visible=false}
  async drawLayer(name,d=1.6){const g=this.layers[name];g.visible=true;g.children.forEach(m=>m.geometry.setDrawRange(0,0));
    await this.tween(d,k=>g.children.forEach(m=>m.geometry.setDrawRange(0,Math.floor(m.userData.full*k/3)*3)),x=>x)}
  setLayer(name,on){if(this.layers[name])this.layers[name].visible=on;else if(this.facilities[name])this.facilities[name].visible=on;else if(name==="trees")this.trees.visible=on}
  async popFacilities(types=["school","health","anganwadi"],d=1.1){
    for(const t of types){const im=this.facilities[t];im.visible=true;const pts=im.userData.pts,M=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3();
      await this.tween(d,k=>{pts.forEach((p,i)=>{const kk=Math.max(0,Math.min(1,k*1.6-i/pts.length*.6));const e=kk<1?1+2.7*Math.pow(kk-1,3)+1.7*Math.pow(kk-1,2):1;
        const[x,z]=P(...p.p);s.setScalar(Math.max(.001,e));M.compose(new THREE.Vector3(x,TOP,z),q,s);im.setMatrixAt(i,M)});im.instanceMatrix.needsUpdate=true},x=>x)}}
  async growTrees(){this.trees.visible=true;await this.tween(.8,k=>this.trees.scale.set(1,Math.max(.01,k),1))}
  riverColor(hex){this.layers.rivers.userData.mat.color.set(hex)}
  tintAll(hex,amt){this.districts.forEach(d=>d.top.color.copy(d.base).lerp(new THREE.Color(hex),amt))}
  resetTint(){this.districts.forEach(d=>{d.top.color.copy(d.base);d.group.scale.y=1})}
  highlight(name,hex=0xffb45a){this.districts.forEach(d=>{d.targetLift=d.name===name?.8:0;d.top.color.copy(d.base);if(d.name===name)d.top.color.lerp(new THREE.Color(hex),.55)})}
  async choropleth(vals,ramp){const max=Math.max(...Object.values(vals)),min=Math.min(...Object.values(vals));
    const c0=new THREE.Color(ramp[0]),c1=new THREE.Color(ramp[1]);
    await this.tween(1.2,k=>this.districts.forEach(d=>{const v=(vals[d.name]-min)/((max-min)||1);d.group.scale.y=1+v*5*k;d.top.color.copy(d.base).lerp(c0.clone().lerp(c1,v),k)}))}
  async flatten(){const s=this.districts.map(d=>d.group.scale.y);await this.tween(.6,k=>this.districts.forEach((d,i)=>d.group.scale.y=s[i]+(1-s[i])*k));this.resetTint()}

  /* ---------------- pins ---------------- */
  addPin(lonlat,color,{bob=false,ring=false,big=1,y=TOP}={}){const g=new THREE.Group();
    const cone=new THREE.ConeGeometry(.5*big,1.5*big,12);cone.rotateX(Math.PI);cone.translate(0,.75*big,0);
    const ball=new THREE.SphereGeometry(.62*big,16,12);ball.translate(0,1.8*big,0);
    const mat=new THREE.MeshStandardMaterial({color,roughness:.35,emissive:color,emissiveIntensity:.15});
    g.add(new THREE.Mesh(cone,mat),new THREE.Mesh(ball,mat));g.children.forEach(m=>m.castShadow=true);
    const[x,z]=P(...lonlat);g.position.set(x,y,z);this.scene.add(g);
    const pin={obj:g,mat,y,bob,ph:Math.random()*6,lonlat};
    if(ring){const r=new THREE.Mesh(new THREE.RingGeometry(.6,.8,32),new THREE.MeshBasicMaterial({color,transparent:true,side:THREE.DoubleSide}));r.rotation.x=-Math.PI/2;r.position.set(x,TOP+.05,z);this.scene.add(r);pin.ring=r}
    this.pins.push(pin);return pin}
  pinColor(p,color){p.mat.color.set(color);p.mat.emissive.set(color)}
  removePin(p){this.scene.remove(p.obj);p.ring&&this.scene.remove(p.ring);this.pins=this.pins.filter(x=>x!==p)}
  async movePin(p,lonlat,d=1){const a=p.obj.position.clone(),[x,z]=P(...lonlat),b=new THREE.Vector3(x,TOP,z);p.bob=false;
    await this.tween(d,k=>{p.obj.position.lerpVectors(a,b,k);p.obj.position.y+=Math.sin(k*Math.PI)*10});p.y=TOP;p.lonlat=lonlat;p.obj.position.y=TOP;
    if(p.ring)p.ring.position.set(x,TOP+.05,z)}
  pinAt(p,x,y,z){p.obj.position.set(x,y,z);p.y=y}

  /* ---------------- labels (HTML, projected) ---------------- */
  label(html,pos,cls=""){const el=document.createElement("div");el.className="w-label "+cls;el.innerHTML=html;this.labelHost.appendChild(el);
    const l={el,pos:new THREE.Vector3(...pos),on:true};this.labels.push(l);return l}
  labelAt(lonlat,html,cls,dy=2.6){const[x,z]=P(...lonlat);return this.label(html,[x,TOP+dy,z],cls)}
  unlabel(l){if(!l)return;l.el.remove();this.labels=this.labels.filter(x=>x!==l)}

  /* ---------------- picking ---------------- */
  pick(cx,cy){const r=this.renderer.domElement.getBoundingClientRect();this.mouse.set(((cx-r.left)/r.width)*2-1,-((cy-r.top)/r.height)*2+1);
    this.ray.setFromCamera(this.mouse,this.camera);const hit=this.ray.intersectObjects(this.districts.filter(d=>d.group.visible).map(d=>d.mesh),false)[0];
    if(!hit)return null;const p=hit.point;const lon=p.x/(CX*K)+LON0,lat=-p.z/K+LAT0;return{rec:hit.object.userData.rec,lonlat:[lon,lat]}}
  onMove(e){if(e.buttons)return;const h=this.pick(e.clientX,e.clientY);this.setHover(h&&h.rec,e)}
  setHover(rec,e){if(this.hoverRec===rec)return;this.hoverRec=rec;this.hoverCb&&this.hoverCb(rec,e)}
  snapshot(){this.renderer.render(this.scene,this.camera);return this.renderer.domElement.toDataURL("image/png")}
  facilityCounts(){const c={};this.facilities.list.forEach(f=>{(c[f.d]=c[f.d]||{school:0,health:0,anganwadi:0})[f.t]++});return c}
}
