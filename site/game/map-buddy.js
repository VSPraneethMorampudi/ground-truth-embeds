/* Bindu: a small articulated map-pin guide. Native Three.js geometry, no downloaded model. */
import * as THREE from 'three';
const up=new THREE.Vector3(0,1,0);
export class MapBuddy{
 constructor(world,{reduced=false}={}){
  this.world=world;this.reduced=reduced;this.root=new THREE.Group();this.root.name='Bindu-map-guide';world.scene.add(this.root);this.root.position.set(-23,.6,16);this.destination=this.root.position.clone();this.targetElement=null;this.celebrateUntil=0;this.waveUntil=2;this.time=0;
  const orange=new THREE.MeshStandardMaterial({color:0xe88d63,roughness:.72}),cream=new THREE.MeshStandardMaterial({color:0xfffae8,roughness:.8}),ink=new THREE.MeshStandardMaterial({color:0x2c485b,roughness:.75}),cheek=new THREE.MeshStandardMaterial({color:0xefb09c,roughness:.8});
  const sphere=new THREE.SphereGeometry(1,20,14),part=(parent,geometry,material,position,scale)=>{const m=new THREE.Mesh(geometry,material);m.position.set(...position);m.scale.set(...scale);m.castShadow=true;parent.add(m);return m};
  const pin=new THREE.Shape();pin.moveTo(0,1.15);pin.bezierCurveTo(-.55,1.9,-1.7,3.1,-1.7,4.05);pin.absarc(0,4.05,1.7,Math.PI,0,true);pin.bezierCurveTo(1.7,3.1,.55,1.9,0,1.15);
  const body=part(this.root,new THREE.ExtrudeGeometry(pin,{depth:.65,bevelEnabled:true,bevelSize:.19,bevelThickness:.2,bevelSegments:3,steps:1,curveSegments:24}),orange,[0,0,-.32],[1,1,1]);
  this.face=new THREE.Group();this.face.position.set(0,4.05,.65);this.face.rotation.x=-.4;this.root.add(this.face);
  part(this.face,new THREE.CylinderGeometry(1.26,1.26,.18,32),cream,[0,0,0],[1,1,1]).rotation.x=Math.PI/2;
  this.eyes=[];for(const s of [-1,1]){this.eyes.push(part(this.face,sphere,ink,[s*.43,.12,.14],[.13,.19,.06]));part(this.face,sphere,cream,[s*.43-.035,.18,.2],[.035,.045,.016]);part(this.face,sphere,cheek,[s*.77,-.28,.12],[.16,.11,.035])}
  const smile=new THREE.CatmullRomCurve3([new THREE.Vector3(-.42,-.3,.15),new THREE.Vector3(0,-.5,.17),new THREE.Vector3(.42,-.3,.15)]);this.smile=part(this.face,new THREE.TubeGeometry(smile,16,.045,6),ink,[0,0,0],[1,1,1]);
  this.arms=[];this.legs=[];
  for(const s of [-1,1]){const arm=new THREE.Group();arm.position.set(s*1.4,3.3,0);this.root.add(arm);part(arm,sphere,orange,[s*.12,-.5,0],[.18,.7,.18]);part(arm,sphere,cream,[s*.13,-1.13,.04],[.29,.32,.25]);part(arm,sphere,cream,[-s*.08,-1.0,.14],[.12,.19,.12]);this.arms.push({arm,s});
    const leg=new THREE.Group();leg.position.set(s*.58,1.18,0);this.root.add(leg);part(leg,new THREE.CylinderGeometry(.14,.14,.75,12),ink,[0,-.3,0],[1,1,1]);part(leg,sphere,ink,[0,-.84,.2],[.4,.24,.55]);this.legs.push({leg,s});}
  this.ray=new THREE.Raycaster();this.plane=new THREE.Plane(up,-.6);this.floorPoint=new THREE.Vector3();this.screen=new THREE.Vector2();this.projected=new THREE.Vector3();this.pointSide=1;this.pointUp=false;this.gaze=new THREE.Vector2();this.gazeUntil=0;this.walkWeight=0;
 }
 pointAt(element){this.targetElement=element||null;if(!element)this.destination.set(-23,.6,16)}
 greet(){this.waveUntil=this.time+2.2}
 celebrate(){this.celebrateUntil=this.time+1.1}
 lookAt(x,y){if(this.reduced)return;const r=this.world.renderer.domElement.getBoundingClientRect();this.gaze.set(THREE.MathUtils.clamp((x-r.left)/r.width*2-1,-1,1),THREE.MathUtils.clamp((y-r.top)/r.height*2-1,-1,1));this.gazeUntil=this.time+.9}
 update(time,dt){
  this.time=time;const w=this.world,r=w.renderer.domElement.getBoundingClientRect(),target=this.targetElement;
  if(target?.isConnected){const b=target.getBoundingClientRect(),phone=r.height<370&&r.width<700,grid=target.closest('.jy-drop-grid:not(.single)'),left=b.left-r.left,leftSide=grid?left+b.width/2<r.width/2:left-(phone?50:0)>=r.right-b.right;
    const beside=phone&&grid?left+b.width/2:leftSide?left-44:b.right-r.left+44,bottom=phone&&grid?b.bottom-r.top+76:b.bottom-r.top-8;
    this.pointSide=leftSide?1:-1;this.pointUp=!!(phone&&grid);this.screen.set((THREE.MathUtils.clamp(beside,44,r.width-44)/r.width)*2-1,1-(Math.min(r.height-25,bottom)/r.height)*2);this.ray.setFromCamera(this.screen,w.camera);
    if(this.ray.ray.intersectPlane(this.plane,this.floorPoint)){this.destination.set(THREE.MathUtils.clamp(this.floorPoint.x,-90,90),.6,THREE.MathUtils.clamp(this.floorPoint.z,-80,80));}}
  const distance=Math.hypot(this.root.position.x-this.destination.x,this.root.position.z-this.destination.z),blend=1-Math.exp(-dt*10);this.walkWeight=THREE.MathUtils.lerp(this.walkWeight,this.reduced?0:Math.min(1,distance/2),blend);
  if(this.reduced)this.root.position.copy(this.destination);else this.root.position.lerp(this.destination,1-Math.exp(-dt*2.4));
  const happy=!this.reduced&&time<this.celebrateUntil,jump=happy?Math.sin(Math.max(0,1-(this.celebrateUntil-time)/1.1)*Math.PI)*this.root.scale.x*.65:0;this.root.position.y=.6+jump;
  this.root.rotation.y=Math.atan2(w.camera.position.x-this.root.position.x,w.camera.position.z-this.root.position.z);
  this.root.rotation.z=this.reduced?0:Math.sin(time*9)*.035*this.walkWeight;
  // Keep the guide readable beside the picture boxes, including in a short phone map.
  const base=this.projected.copy(this.root.position).project(w.camera).y;let size=this.root.scale.x;
  for(let i=0;i<2;i++){const head=this.projected.copy(this.root.position).addScaledVector(up,6*size).project(w.camera).y;size=THREE.MathUtils.clamp(size*68/Math.max(8,Math.abs(head-base)*r.height/2),.7,7)}this.root.scale.setScalar(size);
  this.legs.forEach(({leg,s})=>leg.rotation.x=this.reduced?0:Math.sin(time*9)*.32*s*this.walkWeight);
  this.arms.forEach(({arm,s},i)=>{const wave=!this.reduced&&(time<this.waveUntil||time<this.celebrateUntil),point=!!target?.isConnected&&s===this.pointSide;
    const x=point?-.25:0,z=wave?s*(2.5+Math.sin(time*9)*.2):point?s*(this.pointUp?2.5:1.25):s*.12;arm.rotation.x=this.reduced?x:THREE.MathUtils.lerp(arm.rotation.x,x,blend);arm.rotation.z=this.reduced?z:THREE.MathUtils.lerp(arm.rotation.z,z,blend)});
  const gazeOn=!this.reduced&&time<this.gazeUntil;this.face.rotation.x=THREE.MathUtils.lerp(this.face.rotation.x,-.4+(gazeOn?this.gaze.y*.1:0),blend);this.face.rotation.y=THREE.MathUtils.lerp(this.face.rotation.y,gazeOn?this.gaze.x*.18:0,blend);this.smile.scale.x=THREE.MathUtils.lerp(this.smile.scale.x,happy?1.22:1,blend);
  const blink=this.reduced?1:1-Math.max(0,1-Math.abs((time%4.1)-.14)/.08)*.93;this.eyes.forEach(eye=>eye.scale.y=.19*blink);
 }
}
