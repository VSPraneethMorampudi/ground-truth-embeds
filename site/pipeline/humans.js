/* Six distinct office characters with local skin, cloth and normal maps. */
import * as THREE from "three";
import {GLTFLoader} from "../vendor/GLTFLoader.js";
import {prepareHands,animateHands} from "./human-motion.js?v=202610272300";
export const HUMAN_FILES=["aarav","meera","kabir","ananya","isha","rohan"];
const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
const position=o=>o.getWorldPosition(new THREE.Vector3()),rotation=o=>o.getWorldQuaternion(new THREE.Quaternion());
function aim(bone,child,direction){const from=position(child).sub(position(bone)).normalize(),q=new THREE.Quaternion().setFromUnitVectors(from,direction.clone().normalize()).multiply(rotation(bone));bone.quaternion.copy(rotation(bone.parent).invert().multiply(q));bone.updateWorldMatrix(false,true)}
function morph(meshes,name,value){for(const m of meshes){const index=m.morphTargetDictionary?.[name];if(index!=null)m.morphTargetInfluences[index]=value}}
function skinMaterials(mesh,profile,faceTexture){
  const geometry=mesh.geometry,indices=geometry.attributes.skinIndex,weights=geometry.attributes.skinWeight,skin=new Float32Array(indices.count),eyes=new Float32Array(indices.count),neck=position(mesh.skeleton.bones.find(b=>b.name==="Neck")),vertex=new THREE.Vector3();
  for(let n=0;n<indices.count;n++)for(let j=0;j<4;j++){const name=mesh.skeleton.bones[indices.getComponent(n,j)]?.name||"",weight=weights.getComponent(n,j);if(/Hand|ForeArm|Neck|Head|Eye|Mouth|Lip|Cheek|Nose|Brow|Jaw/.test(name))skin[n]+=weight;if(/^(Left|Right)Eye$/.test(name))eyes[n]+=weight}
  for(let n=0;n<indices.count;n++){vertex.fromBufferAttribute(geometry.attributes.position,n).applyMatrix4(mesh.matrixWorld);if(vertex.y>neck.y-.17&&vertex.y<neck.y+.06&&Math.abs(vertex.x-neck.x)<.1)skin[n]=1}
  geometry.setAttribute("officeSkin",new THREE.BufferAttribute(skin,1));geometry.setAttribute("officeEye",new THREE.BufferAttribute(eyes,1));
  for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
    material.envMapIntensity=.32;material.roughness=material.name.endsWith("_head")?.78:.88;
    if(material.name.endsWith("_opacity")){material.color.setRGB(.3,.27,.24);continue}
    const head=material.name.endsWith("_head");
    if(head){material.map=faceTexture;material.normalScale.set(.18,-.18)}
    material.onBeforeCompile=shader=>{
      shader.uniforms.officeTone={value:new THREE.Vector3(...profile.bodyTint)};shader.uniforms.officeHead={value:head?1:0};
      shader.vertexShader="attribute float officeSkin;attribute float officeEye;varying float vOfficeSkin;varying float vOfficeEye;\n"+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\nvOfficeSkin=officeSkin;vOfficeEye=officeEye;");
      shader.fragmentShader="uniform vec3 officeTone;uniform float officeHead;varying float vOfficeSkin;varying float vOfficeEye;\n"+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
        float warm=smoothstep(.008,.055,diffuseColor.r-diffuseColor.g)*smoothstep(.008,.07,diffuseColor.r-diffuseColor.b);
        diffuseColor.rgb*=mix(vec3(1.0),officeTone,warm*(1.0-officeHead)*vOfficeSkin);`);
    };material.customProgramCacheKey=()=>"office-human-indian-faces-v2";
  }
}
function addGlasses(model,bones){
  model.updateWorldMatrix(true,true);const group=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:0x263747,roughness:.65});
  for(const eye of [bones.LeftEye,bones.RightEye]){const p=model.worldToLocal(position(eye));p.z+=.035;const rim=new THREE.Mesh(new THREE.TorusGeometry(.027,.002,6,24),mat);rim.position.copy(p);rim.scale.y=.72;group.add(rim)}
  const left=group.children[0].position,right=group.children[1].position,bridge=new THREE.Mesh(new THREE.CylinderGeometry(.0017,.0017,Math.max(.008,left.distanceTo(right)-.05),8),mat);bridge.position.copy(left).add(right).multiplyScalar(.5);bridge.rotation.z=Math.PI/2;group.add(bridge);model.add(group);bones.Head.attach(group);
}
export async function loadHumanTeam(analysts){
  const loader=new GLTFLoader(),manifest=await new THREE.FileLoader().setResponseType("json").loadAsync(new URL("../assets/characters/faces/manifest.json?v=202610272300",import.meta.url).href);
  await Promise.all(analysts.map(async(a,index)=>{
    const {scene:model}=await loader.loadAsync(new URL(`../assets/characters/${HUMAN_FILES[index]}.glb?v=202610272300`,import.meta.url).href),bones={},morphs=[];
    const profile=manifest.characters[HUMAN_FILES[index]],faceTexture=await new THREE.TextureLoader().loadAsync(new URL(`../assets/characters/faces/${profile.texture}?v=202610272300`,import.meta.url).href);faceTexture.colorSpace=THREE.SRGBColorSpace;
    /* The edited atlases retain the source FBX image orientation. GLB's embedded maps were flipped during export. */
    faceTexture.flipY=true;faceTexture.anisotropy=4;
    model.updateMatrixWorld(true);model.traverse(o=>{if(o.isBone||/^(Left|Right)(Hand(Thumb|Index|Middle|Ring|Pinky)4|ToeBase)$/.test(o.name))bones[o.name]=o;if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;skinMaterials(o,profile,faceTexture);if(o.morphTargetInfluences)morphs.push(o)}});
    if(a.profile.glasses)addGlasses(model,bones);
    const wrapper=new THREE.Group();wrapper.name=`human-${index}`;wrapper.rotation.y=Math.PI;wrapper.scale.setScalar(3.4);wrapper.add(model);
    model.updateMatrixWorld(true);const hips=model.worldToLocal(position(bones.Hips));wrapper.position.y=.29-hips.y*3.4;a.root.add(wrapper);model.updateWorldMatrix(true,true);const orientation=rotation(wrapper);
    for(const side of ["Left","Right"]){const sign=side==="Left"?1:-1;aim(bones[`${side}UpLeg`],bones[`${side}Leg`],new THREE.Vector3(sign*.07,-.06,1).applyQuaternion(orientation));aim(bones[`${side}Leg`],bones[`${side}Foot`],new THREE.Vector3(0,-1,.02));aim(bones[`${side}Foot`],bones[`${side}ToeBase`],new THREE.Vector3(0,-.04,1).applyQuaternion(orientation))}
    const base=new Map(Object.values(bones).map(b=>[b,b.quaternion.clone()]));a.human={model,wrapper,bones,base,morphs,asset:HUMAN_FILES[index],faceTexture,contacts:[]};prepareHands(a.human);
    a.fallback.visible=false;a.hit.geometry.dispose();a.hit.geometry=new THREE.BoxGeometry(3.7,5,3.3);a.hit.position.set(0,1,-.25);
    a.animateHuman=(time,dt,options)=>animateHuman(a,time,dt,options);animateHuman(a,0,1/60,{reduced:true});
  }));return analysts;
}
function animateHuman(a,time,dt,options={}){
  if(a.station&&!a.station.visible)return;
  const {portrait=false,reduced=false}=options,h=a.human,clock=reduced?0:time,elapsed=time-a.greetAt,wave=reduced?0:ease(elapsed/.5)*(1-ease((elapsed-1.9)/.7)),exp=time-a.explainAt,explain=reduced?0:ease(exp/.45)*(1-ease((exp-3.2)/.7));
  for(const [bone,q] of h.base)bone.quaternion.copy(q);h.model.updateWorldMatrix(true,true);
  const head=h.bones.Head,yaw=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),a.gazeX*.2),pitch=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0).applyQuaternion(rotation(h.wrapper)),a.gazeY*.12+Math.sin(clock*.8+a.index)*.007),headWorld=yaw.multiply(pitch).multiply(rotation(head));head.quaternion.copy(rotation(head.parent).invert().multiply(headWorld));
  animateHands(a,time,{portrait,reduced,wave,explain});const phase=(clock+a.index*1.71)%(3.7+a.index*.31),blink=reduced?0:Math.max(0,1-Math.abs(phase-.15)/.095);
  morph(h.morphs,"eyeBlinkLeft",blink);morph(h.morphs,"eyeBlinkRight",blink);morph(h.morphs,"mouthSmileLeft",.04+a.expression*.14+wave*.08);morph(h.morphs,"mouthSmileRight",.04+a.expression*.14+wave*.08);morph(h.morphs,"browInnerUp",wave*.1+explain*.05);morph(h.morphs,"eyeSquintLeft",.07);morph(h.morphs,"eyeSquintRight",.07);
}
