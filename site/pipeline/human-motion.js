/* Hands share the keyboard/mouse coordinate system. No independent prop bobbing. */
import * as THREE from "three";
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const pos=o=>o.getWorldPosition(new THREE.Vector3());
const worldQ=o=>o.getWorldQuaternion(new THREE.Quaternion());
function setWorldQ(bone,q){bone.quaternion.copy(worldQ(bone.parent).invert().multiply(q));bone.updateWorldMatrix(false,true)}
function pointBone(bone,child,target){const start=pos(bone),direction=pos(child).sub(start).normalize(),desired=target.clone().sub(start).normalize();setWorldQ(bone,new THREE.Quaternion().setFromUnitVectors(direction,desired).multiply(worldQ(bone)))}

export function solveArm(upper,lower,hand,target,pole){
  const shoulder=pos(upper),elbow=pos(lower),wrist=pos(hand),a=elbow.distanceTo(shoulder),b=wrist.distanceTo(elbow),direction=target.clone().sub(shoulder),distance=clamp(direction.length(),Math.abs(a-b)+.002,a+b-.005);
  direction.normalize();const bend=pole.clone().addScaledVector(direction,-pole.dot(direction)).normalize(),along=(a*a-b*b+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,a*a-along*along));
  const joint=shoulder.clone().addScaledVector(direction,along).addScaledVector(bend,height),end=shoulder.clone().addScaledVector(direction,distance);
  pointBone(upper,lower,joint);pointBone(lower,hand,end);return end.distanceTo(target);
}

export function workCycle(time,index=0,reduced=false){
  const t=reduced?0:(time+index*1.83)%12;
  const mouse=smooth((t-4.9)/.85)*(1-smooth((t-8.8)/.85));
  const u=clamp((t-5.75)/3.05),stroke=Math.sin(u*Math.PI*2)*Math.sin(u*Math.PI);
  const click=mouse>.95?Math.max(0,1-Math.abs(t-7.15)/.12):0;
  return{phase:t,mouse,dx:mouse*stroke*.19,dz:mouse*Math.sin(u*Math.PI*3)*.09,click,typing:reduced?0:1-mouse};
}

export function prepareHands(h){
  const {bones,model,wrapper}=h;model.updateWorldMatrix(true,true);h.hands=[];
  for(const [n,side] of ["Left","Right"].entries()){
    const sign=n===0?1:-1,hand=bones[`${side}Hand`],middle=bones[`${side}HandMiddle1`],index=bones[`${side}HandIndex1`],pinky=bones[`${side}HandPinky1`];
    const forward=pos(middle).sub(pos(hand)).normalize(),across=pos(index).sub(pos(pinky)).normalize(),normal=new THREE.Vector3().crossVectors(forward,across).normalize();across.crossVectors(normal,forward).normalize();
    const inverse=worldQ(hand).invert(),basis=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(across.clone().applyQuaternion(inverse),normal.clone().applyQuaternion(inverse),forward.clone().applyQuaternion(inverse)));
    const curlAxis=normal.clone().multiplyScalar(-sign).cross(forward).normalize();
    const fingers=["Thumb","Index","Middle","Ring","Pinky"].map(name=>{
      const joints=[1,2,3].map(j=>bones[`${side}Hand${name}${j}`]),tip=bones[`${side}Hand${name}4`];
      return{name,joints,tip,axes:joints.map(b=>curlAxis.clone().applyQuaternion(worldQ(b).invert()))};
    });
    h.hands.push({side,sign,hand,upper:bones[`${side}Arm`],lower:bones[`${side}ForeArm`],basis,fingers});
  }
}
function orientHand(h,hand,forward){
  const direction=forward.clone().normalize(),across=new THREE.Vector3(-hand.sign,0,0).applyQuaternion(worldQ(h.wrapper)),normal=new THREE.Vector3().crossVectors(direction,across).normalize();across.crossVectors(normal,direction).normalize();
  const q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(across,normal,direction)).multiply(hand.basis.clone().invert());setWorldQ(hand.hand,q);
}
function fingerPose(h,f,angle){for(let j=0;j<3;j++){const bone=f.joints[j];bone.quaternion.copy(h.base.get(bone)).multiply(new THREE.Quaternion().setFromAxisAngle(f.axes[j],angle*[.55,.8,.5][j]));bone.updateWorldMatrix(false,true)}}
function contactFinger(h,f,height){
  let low=-.65,high=1.3;for(let k=0;k<7;k++){const angle=(low+high)/2;fingerPose(h,f,angle);if(pos(f.tip).y>height)low=angle;else high=angle}fingerPose(h,f,(low+high)/2);
  return pos(f.tip);
}
export function animateHands(a,time,{portrait=false,reduced=false,wave=0,explain=0}={}){
  const h=a.human,cycle=workCycle(time,a.index,reduced),orientation=worldQ(h.wrapper),front=new THREE.Vector3(0,0,1).applyQuaternion(orientation),up=new THREE.Vector3(0,1,0);
  a.workState=cycle;a.keyPresses.fill(0);
  /* The model and mouse use the very same movement and click signal. */
  a.mouse.position.copy(a.mouseOrigin);if(!portrait){a.mouse.position.x+=cycle.dx;a.mouse.position.z+=cycle.dz;a.mouse.position.y-=cycle.click*.012}
  const contacts=[];
  h.wristErrors=[];
  for(const [n,hand] of h.hands.entries()){
    const s=hand.sign,w=n===0?wave:0,p=n===1?explain:0,mouse=n===1&&!portrait?cycle.mouse:0;
    const keyIndex=n===0?19:23,key=a.keys.localToWorld(a.keyHomes[keyIndex].clone()),mousePosition=a.mouse.getWorldPosition(new THREE.Vector3());
    const wrist=key.clone().addScaledVector(front,-.48).addScaledVector(up,.19);
    wrist.lerp(mousePosition.clone().addScaledVector(front,-.31).addScaledVector(up,.19),mouse);
    if(portrait)wrist.copy(a.root.localToWorld(new THREE.Vector3(-s*.43,.58,-.77)));
    if(w>0)wrist.lerp(a.root.localToWorld(new THREE.Vector3(-s*1.24,2.9,-.15)),w);
    if(p>0)wrist.lerp(a.root.localToWorld(new THREE.Vector3(-s*.95,1.6,-.8)),p);
    const pole=new THREE.Vector3(s*.85,-.3,-.38).applyQuaternion(orientation);
    const error=solveArm(hand.upper,hand.lower,hand.hand,wrist,pole);
    h.wristErrors.push(error);
    const direction=front.clone().addScaledVector(up,portrait?-.38:-.04);
    if(w>.05)direction.set(0,1,0).addScaledVector(new THREE.Vector3(1,0,0).applyQuaternion(orientation),Math.sin((time-a.greetAt)*9)*.13);
    orientHand(h,hand,direction);
    const pressing=!portrait&&w<.01&&p<.01;
    for(const [f,finger] of hand.fingers.entries()){
      if(f===0||!pressing){fingerPose(h,finger,portrait?.15:0);continue}
      const beat=(time*(1.7+f*.09)+f*.235+n*.46+a.index*.13)%1,press=reduced?0:Math.max(0,1-Math.abs(beat-.5)/.11)*(n===1?1-mouse:1-cycle.mouse*.6);
      const height=key.y+.017+(1-press)*.025;
      const targetHeight=mouse>.2?height*(1-mouse)+(mousePosition.y+.085+((f===1?1-cycle.click:1)*.012))*mouse:height;
      const tip=contactFinger(h,finger,targetHeight);contacts.push({side:hand.side,finger:finger.name,y:tip.y,targetY:targetHeight,error:tip.y-targetHeight,wristError:error});
      if(mouse<.2){let nearest=0,distance=Infinity;for(let k=0;k<a.keyHomes.length;k++){const candidate=a.keys.localToWorld(a.keyHomes[k].clone()),d=Math.hypot(candidate.x-tip.x,candidate.z-tip.z);if(d<distance){distance=d;nearest=k}}if(distance<.22)a.keyPresses[nearest]=Math.max(a.keyPresses[nearest],press)}
    }
  }
  h.contacts=contacts;
}
