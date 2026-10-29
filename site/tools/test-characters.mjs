/* Run: node --experimental-vm-modules site/tools/test-characters.mjs
   Uses the vendored Three.js and the production modules; no npm dependencies. */
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const root=new URL("../",import.meta.url),cache=new Map(),pending=new Map();
const context=vm.createContext({console,window:{GEO:{districts:[],rivers:[],roads:[],rail:[]}},CustomEvent:class {constructor(type,{detail}){this.type=type;this.detail=detail}},dispatchEvent:e=>events.push(e)});
const events=[];
/* Canvas drawing is stubbed only for the scene-build smoke check, not model geometry. */
const drawing=()=>new Proxy({measureText:text=>({width:String(text).length*12}),globalAlpha:1,createLinearGradient:()=>({addColorStop(){}})}, {get:(obj,key)=>obj[key]??(()=>{})});
context.document={documentElement:{},createElement:()=>({width:0,height:0,getContext:drawing})};
context.getComputedStyle=()=>({getPropertyValue:()=>""});
vm.runInContext(await readFile(new URL("geo.js",root),"utf8"),context);
async function load(url){
  const key=url.href.split("?")[0];
  if(pending.has(key))return pending.get(key);
  const task=(async()=>{
    const module=new vm.SourceTextModule(await readFile(fileURLToPath(key),"utf8"),{context,identifier:key});
    cache.set(key,module);
    await module.link((name,parent)=>load(name==="three"?new URL("vendor/three.module.min.js",root):new URL(name,parent.identifier)));
    return module;
  })();
  pending.set(key,task);return task;
}
const sceneModule=await load(new URL("pipeline/scene.js",root));await sceneModule.evaluate();
const THREE=cache.get(new URL("vendor/three.module.min.js",root).href).namespace;
const {createAnalyst,animateAnalyst,TEAM}=cache.get(new URL("pipeline/characters.js",root).href).namespace;
const {PipelineScene}=sceneModule.namespace;
let checks=0;
const check=(value,message)=>{assert.ok(value,message);checks++};

const people=TEAM.map((_,i)=>createAnalyst(i));
check(people.length===6&&new Set(TEAM.map(p=>p.name.en)).size===6,"Six distinct teammates");
for(const a of people){
  a.root.updateMatrixWorld(true);
  check(new THREE.Box3().setFromObject(a.root).getSize(new THREE.Vector3()).y>4,"Full seated silhouette");
  let meshes=0;
  a.root.traverse(o=>{if(o.isMesh){meshes++;for(const value of o.geometry.attributes.position.array)assert.ok(Number.isFinite(value),"Finite model geometry")}});
  check(meshes>20&&meshes<55,"Detailed parts are batched without flattening the articulation");
  a.greetAt=0;
  for(let n=0;n<240;n++)animateAnalyst(a,n/60,1/60,{selected:true});
  check(Math.abs(a.arms[1].arm.rotation.x)<.001,"Greeting finishes and releases the arm");
  a.attention=0;animateAnalyst(a,5,1/60,{reduced:true});const pose=a.head.rotation.toArray().join();
  animateAnalyst(a,20,1/60,{reduced:true});check(a.head.rotation.toArray().join()===pose,"Reduced motion has a stable idle pose");
  for(let n=0;n<90;n++)animateAnalyst(a,21+n/60,1/60,{portrait:true,reduced:true});
  check(Math.abs(a.root.rotation.y-Math.PI*1.08)<.001,"Portrait faces the viewer even with reduced motion");
  /* The waving palm should rise above its shoulder, rather than swing behind the body. */
  a.greetAt=24;
  for(let n=0;n<60;n++)animateAnalyst(a,24+n/60,1/60,{portrait:true});
  a.root.updateMatrixWorld(true);
  check(a.arms[1].hand.getWorldPosition(new THREE.Vector3()).y>a.arms[1].arm.getWorldPosition(new THREE.Vector3()).y,"Greeting raises the hand above the shoulder");
  a.greetAt=-100;
  for(let n=0;n<60;n++)animateAnalyst(a,30+n/60,1/60,{portrait:true,pointer:{x:.5,y:-.5}});
  check(a.eyes.every(e=>e.gaze.position.x>0&&e.gaze.position.y>0),"Eyes respond to the pointer within the portrait");
  let closed=false,open=false;
  for(let n=0;n<480;n++){animateAnalyst(a,n/60,1/60,{});closed ||= a.eyes[0].aperture.scale.y<.3;open ||= a.eyes[0].aperture.scale.y>.99}
  check(closed&&open,"Blink closes and reopens the eye aperture");
  animateAnalyst(a,40,1/60,{reduced:true,portrait:true,pointer:{x:.5,y:.5}});
  check(a.eyes.every(e=>e.aperture.scale.y===1),"Reduced motion keeps eyes open");
}

/* Exercise actual production ray picking with desktop and phone viewports. */
function world(width=1200,height=800){
  const w=Object.create(PipelineScene.prototype);
  Object.assign(w,{host:{getBoundingClientRect:()=>({left:20,top:30,right:width+20,bottom:height+30,width,height})},scene:new THREE.Scene(),cam:new THREE.PerspectiveCamera(40,width/height,.1,1000),docs:[],depts:[],analysts:[],racks:[],dist:[],deskHits:[],blocks:[],ex:null});
  w.cam.position.set(0,5,25);w.cam.lookAt(0,2,0);return w;
}
function point(w,obj){w.scene.updateMatrixWorld(true);w.cam.updateMatrixWorld(true);const v=new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3()).project(w.cam),r=w.host.getBoundingClientRect();return[r.left+(v.x+1)/2*r.width,r.top+(1-v.y)/2*r.height]}
const box=()=>new THREE.Mesh(new THREE.BoxGeometry(2,3,2),new THREE.MeshBasicMaterial({visible:false}));
for(const size of [[1200,800],[390,844]]){
  for(let i=0;i<6;i++){
    const w=world(...size),a=createAnalyst(i);w.scene.add(a.root);w.analysts=[a];
    const p=point(w,a.hit),hit=w.pick(...p);check(hit?.type==="analyst","Each analyst picks directly from story");
    w.t=12;w.activate(hit);check(a.greetAt===12&&events.at(-1).detail.type==="analyst","Activation greets and dispatches the selected teammate");
    a.root.visible=false;check(w.pick(...p)===null,"Hidden parent cannot intercept input");
  }
  for(const type of ["dept","rack","dist","device","server","portal","desk","file","block","sheet","mail"]){
    const w=world(...size),obj=box();w.scene.add(obj);
    if(type==="dept")w.depts=[{g:obj,d:{short:{en:"Office",hi:"Office"}}}];
    if(type==="rack")w.racks=[{hit:obj,name:"A1"}];
    if(type==="dist")w.dist=[{m:obj,name:"Raipur"}];
    if(type==="device")w.phoneG=obj;
    if(type==="server")w.tsrv=obj;
    if(type==="portal")w.portalScr=obj;
    if(type==="desk")w.deskHits=[obj];
    if(type==="file")w.docs=[{live:true,card:obj,F:{i:0}}];
    if(type==="block")w.blocks=[{id:"lab",hit:obj,tag:{en:"Lab",hi:"Lab"}}];
    if(type==="sheet")w.sheets=[obj];
    if(type==="mail")w.envs=[obj];
    check(w.pick(...point(w,obj))?.type===(type==="mail"?"file":type),`${type} picks without entering Explore`);
    obj.visible=false;check(w.pick(...point(w,obj))===null,`Hidden ${type} is ignored`);
  }
  const w=world(...size);check(w.pick(-1,-1)===null,"Input outside the canvas is ignored");
}

/* Build the complete production diorama and rewind through every story chapter. */
const full=world();full.M={};
for(const key of ["accent","glass","ground","groundTop","ink","steel","wall","wall2"])full.M[key]=new THREE.MeshStandardMaterial({color:0x8090a0});
full.M.paper=new THREE.Color(0xffffff);full.M.side=new THREE.Color(0xc5d2e4);full.build();
check(full.analysts.length===6&&full.depts.length===7&&full.racks.length===8&&full.dist.length===33,"Full scene uses all characters, buildings, racks and real districts");
Object.assign(full,{on:true,clock:{getDelta:()=>1/60},t:0,mouse:new THREE.Vector2(),look:new THREE.Vector3(),r:{render(){},setSize(){}},phone:false,offX:0,ptr:null});
full.host.clientWidth=1200;full.host.clientHeight=800;full.host.style={};
const {STEPS}=cache.get(new URL("pipeline/steps.js",root).href).namespace;
for(let i=STEPS.length-1;i>=0;i--){full.s=i+.7;full.frame();check(full.cam.position.toArray().every(Number.isFinite),`Chapter ${i} updates and rewinds without runtime errors`)}
for(let i=0;i<6;i++){
  full.explore("lab");full.exSet({desk:i,portrait:true,file:i,labP:.5});full.frame();
  check(full.analysts[i].chair.rotation.y===full.analysts[i].root.rotation.y,"Chair swivels with its analyst");
}
full.exSet({server:true,desk:null});full.frame();check(full.ex.cam.flat().every(Number.isFinite),"Team server has a valid inspection camera");
console.log(`Passed ${checks} character, animation and picking checks.`);
