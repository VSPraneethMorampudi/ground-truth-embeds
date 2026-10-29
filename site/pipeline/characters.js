/* Small, articulated diorama characters. Geometry is shared across the whole team. */
import * as THREE from "three";

const T=(en,hi)=>({en,hi});
export const TEAM=[
  {name:T("Aarav","आरव"),role:T("Coordinate specialist","निर्देशांक विशेषज्ञ"),skin:0x955e38,shirt:0x367bc0,pants:0x283449,hair:0x241b19,style:"crop",glasses:true},
  {name:T("Meera","मीरा"),role:T("Survey analyst","सर्वेक्षण विश्लेषक"),skin:0xc18a61,shirt:0xc95c50,pants:0x384255,hair:0x30221f,style:"long"},
  {name:T("Kabir","कबीर"),role:T("Georeferencing specialist","भू-संदर्भ विशेषज्ञ"),skin:0xad754c,shirt:0xeee6d7,pants:0x51483e,hair:0x211d1c,style:"crop",beard:true},
  {name:T("Ananya","अनन्या"),role:T("Data quality analyst","डेटा गुणवत्ता विश्लेषक"),skin:0x855639,shirt:0x4e8c79,pants:0x293b43,hair:0x29201f,style:"bun",glasses:true},
  {name:T("Isha","ईशा"),role:T("Imagery specialist","उपग्रह चित्र विशेषज्ञ"),skin:0xba835a,shirt:0xd5a044,pants:0x344154,hair:0x35251e,style:"long"},
  {name:T("Rohan","रोहन"),role:T("Map services analyst","मैप सेवा विश्लेषक"),skin:0x9d6b4c,shirt:0x8370b7,pants:0x363a49,hair:0x201d20,style:"quiff",glasses:true}
];

const sphere=new THREE.SphereGeometry(1,24,16);
const capsule=new THREE.CapsuleGeometry(1,1,5,12);
const cylinder=new THREE.CylinderGeometry(1,1,1,16);
const up=new THREE.Vector3(0,1,0);
const material=(color,roughness=.75,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const white=material(0xfffaf0),ink=material(0x202b38),sole=material(0x57606a),shoe=material(0x242c36,.48),badge=material(0xe8f2f3,.4);
const iris=material(0x64452e,.45),pupil=material(0x171b22,.3),glint=new THREE.MeshBasicMaterial({color:0xffffff});
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};

/* These are introductions for the illustrated team, rather than recorded speech. */
export const INTRO=[
  T("I turn coordinates into places. A spreadsheet becomes useful when every row lands in the right village.","मैं निर्देशांकों को सही जगह पर लाता हूँ। हर पंक्ति सही गाँव में पहुँचे, तभी स्प्रेडशीट काम आती है।"),
  T("I connect field surveys to the map. I check where each observation was collected before it joins a layer.","मैं मैदानी सर्वे को नक्शे से जोड़ती हूँ। हर जानकारी परत में जोड़ने से पहले उसकी जगह जाँचती हूँ।"),
  T("I give old maps a location. Matching known landmarks helps a scanned sheet line up with today's geography.","मैं पुराने नक्शों को सही स्थान देता हूँ। पहचाने हुए स्थानों से स्कैन किए नक्शे को आज के नक्शे से मिलाता हूँ।"),
  T("I look for the small things that break a map: missing codes, duplicate records and shapes that need repair.","मैं खाली कोड, दोहरे रिकॉर्ड और गलत आकृतियाँ ढूँढती हूँ, ताकि नक्शे का डेटा भरोसेमंद बने।"),
  T("I work with satellite imagery. I align the pixels with the ground so imagery and district layers agree.","मैं उपग्रह चित्रों पर काम करती हूँ। चित्रों को जमीन से मिलाती हूँ, ताकि वे ज़िले की परतों के साथ सही बैठें।"),
  T("I help the finished layers reach you. Clean data becomes map services that the Geoportal and apps can use.","मैं तैयार परतों को आप तक पहुँचाता हूँ। साफ डेटा से वे मैप सेवाएँ बनती हैं जिन्हें जियोपोर्टल और ऐप इस्तेमाल करते हैं।")
];

function mesh(parent,geometry,mat,pos=[0,0,0],scale=[1,1,1]){
  const m=new THREE.Mesh(geometry,mat);m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function ball(parent,mat,pos,scale){return mesh(parent,sphere,mat,pos,scale)}
function bone(parent,mat,a,b,r1,r2=r1){
  const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.sub(start);
  const m=mesh(parent,new THREE.CylinderGeometry(r2,r1,delta.length(),14),mat);
  m.position.copy(start).addScaledVector(delta,.5);m.quaternion.setFromUnitVectors(up,delta.normalize());return m;
}
function line(parent,mat,points,r=.018){return mesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),12,r,5),mat)}

/* Batch static detail per material, while keeping head, shoulder and wrist pivots intact. */
function batchDetails(parent){
  parent.children.filter(o=>o.isGroup).forEach(batchDetails);
  const batches=new Map();
  parent.children.filter(o=>o.isMesh&&o.material.visible!==false&&!o.userData.animated).forEach(o=>{
    const list=batches.get(o.material)||[];list.push(o);batches.set(o.material,list);
  });
  batches.forEach((list,mat)=>{
    if(list.length<2)return;
    const parts=list.map(o=>{o.updateMatrix();const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();return g.applyMatrix4(o.matrix)});
    const geometry=new THREE.BufferGeometry();
    for(const name of ["position","normal","uv"]){
      const size=parts[0].attributes[name].itemSize,length=parts.reduce((n,g)=>n+g.attributes[name].array.length,0),data=new Float32Array(length);
      let offset=0;parts.forEach(g=>{data.set(g.attributes[name].array,offset);offset+=g.attributes[name].array.length});
      geometry.setAttribute(name,new THREE.BufferAttribute(data,size));
    }
    mesh(parent,geometry,mat);list.forEach(o=>parent.remove(o));parts.forEach(g=>g.dispose());
  });
}

export function createAnalyst(index){
  const profile=TEAM[index],root=new THREE.Group();root.name=`analyst-${index}`;
  const skin=material(profile.skin,.68),cloth=material(profile.shirt,.88),pants=material(profile.pants,.9),hair=material(profile.hair,.92);
  const seam=material(new THREE.Color(profile.shirt).multiplyScalar(.76)),lip=material(new THREE.Color(profile.skin).lerp(new THREE.Color(0x6c302b),.48));
  const warm=material(new THREE.Color(profile.skin).lerp(new THREE.Color(0xb8614d),.18),.85);
  /* Seated proportions: hips, joined knees and shins, shaped shoes and visible soles. */
  ball(root,pants,[0,.3,.06],[.68,.36,.54]);
  [-1,1].forEach(s=>{
    bone(root,pants,[s*.36,.3,0],[s*.42,.22,-1.28],.28,.26);
    ball(root,pants,[s*.42,.17,-1.28],[.27,.28,.27]);
    bone(root,pants,[s*.42,.13,-1.28],[s*.43,-1.28,-1.34],.24,.19);
    ball(root,sole,[s*.43,-1.46,-1.55],[.255,.09,.49]);
    ball(root,shoe,[s*.43,-1.36,-1.55],[.25,.18,.47]);
    [0,1,2].forEach(k=>bone(root,sole,[s*.43-.12,-1.24,-1.58+k*.09],[s*.43+.12,-1.24,-1.58+k*.09],.015));
  });
  const body=new THREE.Group();root.add(body);
  /* A tailored silhouette instead of a straight cylinder. */
  const profilePoints=[[.49,.48],[.55,.57],[.55,.9],[.59,1.38],[.65,1.76],[.58,1.98],[.32,2.12]];
  const torso=mesh(body,new THREE.LatheGeometry(profilePoints.map(([r,y])=>new THREE.Vector2(r,y)),28),cloth);torso.scale.z=.65;
  ball(body,cloth,[0,1.91,.01],[.62,.23,.34]);
  bone(body,skin,[0,2.0,0],[0,2.49,0],.18,.175);
  /* Collar, stitched placket, buttons, chest pocket and an ID on a lanyard. */
  [-1,1].forEach(s=>{const collar=mesh(body,new THREE.BoxGeometry(.19,.23,.045),white,[s*.17,1.99,-.31]);collar.rotation.z=-s*.38;collar.rotation.x=.18});
  bone(body,seam,[0,.66,-.37],[0,1.96,-.39],.022);
  [.88,1.17,1.47,1.77].forEach(y=>ball(body,white,[0,y,-.402],[.035,.035,.025]));
  line(body,seam,[[.28,1.61,-.36],[.44,1.59,-.32],[.43,1.35,-.34],[.28,1.36,-.38]],.012);
  [-1,1].forEach(s=>line(body,ink,[[s*.17,2.12,-.17],[s*.31,1.82,-.4],[s*.17,1.36,-.43]],.018));
  ball(body,badge,[.12,1.25,-.43],[.15,.2,.035]);
  ball(body,cloth,[.12,1.31,-.47],[.07,.07,.015]);
  bone(body,ink,[.04,1.17,-.47],[.2,1.17,-.47],.012);
  const arms=[];
  [-1,1].forEach(s=>{
    const arm=new THREE.Group();arm.position.set(s*.66,1.91,0);body.add(arm);
    const sleeve=mesh(arm,capsule,cloth,[s*.065,-.3,-.08],[.21,.275,.21]);
    sleeve.quaternion.setFromUnitVectors(up,new THREE.Vector3(s*.14,-.66,-.18).normalize());
    const forearm=new THREE.Group();forearm.position.set(s*.14,-.66,-.18);arm.add(forearm);
    bone(forearm,skin,[0,0,0],[-s*.15,-.13,-.86],.15,.115);
    bone(forearm,white,[0,-.01,-.04],[-s*.02,-.025,-.16],.17);
    const hand=new THREE.Group();hand.position.set(-s*.15,-.13,-.91);forearm.add(hand);
    ball(hand,skin,[0,0,-.03],[.13,.075,.17]);
    for(let f=0;f<4;f++){
      const finger=mesh(hand,capsule,skin,[(f-1.5)*.059,0,-.205],[.028,.075-(f===0||f===3?.013:0),.028]);finger.rotation.x=Math.PI/2;
    }
    const thumb=ball(hand,skin,[-s*.15,0,-.07],[.065,.07,.13]);thumb.rotation.y=-s*.55;
    if(s===-1){const watch=mesh(forearm,cylinder,ink,[-s*.13,-.12,-.73],[.14,.09,.14]);watch.rotation.x=Math.PI/2;ball(forearm,badge,[-s*.13,-.255,-.73],[.1,.02,.09])}
    arms.push({arm,forearm,hand,side:s});
  });
  const head=new THREE.Group();head.position.set(0,2.76,-.035);body.add(head);
  /* A continuous jaw avoids the overlapping sphere seam across the cheeks. */
  const faceGeometry=new THREE.SphereGeometry(1,32,24),positions=faceGeometry.attributes.position;
  for(let n=0;n<positions.count;n++){
    const y=positions.getY(n),taper=y<-.12?1-(Math.abs(y)-.12)*.22:1;
    positions.setXYZ(n,positions.getX(n)*.445*taper,y*.55,positions.getZ(n)*.38);
  }
  faceGeometry.computeVertexNormals();mesh(head,faceGeometry,skin);
  const eyes=[],brows=[];
  [-1,1].forEach(s=>{
    ball(head,skin,[s*.43,-.035,.005],[.075,.135,.075]);
    ball(head,warm,[s*.468,-.035,-.025],[.015,.07,.035]);
    /* An almond socket holds the eye; the whole aperture closes during a blink. */
    const eye=new THREE.Group();eye.position.set(s*.168,.045,-.351);head.add(eye);
    ball(eye,warm,[0,0,.004],[.116,.081,.034]);
    const aperture=new THREE.Group();eye.add(aperture);
    ball(aperture,white,[0,0,-.022],[.102,.06,.034]);
    const gaze=new THREE.Group();gaze.position.z=-.052;aperture.add(gaze);
    ball(gaze,iris,[0,0,0],[.044,.047,.011]);
    ball(gaze,pupil,[0,0,-.009],[.024,.029,.006]);
    ball(gaze,glint,[-.014,.019,-.016],[.012,.012,.004]);
    line(eye,hair,[[-.103,.002,-.02],[-.058,.055,-.043],[.025,.06,-.049],[.101,.008,-.022]],.009);
    const lid=line(eye,warm,[[-.098,0,-.03],[0,-.006,-.056],[.098,0,-.03]],.013);lid.visible=false;lid.userData.animated=true;
    eyes.push({aperture,gaze,lid});
    const brow=new THREE.Group();brow.position.set(s*.168,.183,-.346);head.add(brow);
    line(brow,hair,[[-.094,-.008,.018],[0,.016,-.022],[.085,-.005,.014]],.018);brows.push(brow);
  });
  ball(head,skin,[0,-.046,-.377],[.047,.105,.06]);
  ball(head,skin,[0,-.105,-.415],[.069,.047,.069]);
  [-1,1].forEach(s=>ball(head,lip,[s*.041,-.135,-.443],[.014,.008,.014]));
  if(profile.beard){
    /* A thin fitted surface follows the cheek and chin, leaving the lips clear. */
    const stubble=faceGeometry.clone(),p=stubble.attributes.position,source=stubble.index.array,indices=[];
    for(let n=0;n<source.length;n+=3){const tri=[source[n],source[n+1],source[n+2]],x=tri.reduce((v,i)=>v+p.getX(i),0)/3,y=tri.reduce((v,i)=>v+p.getY(i),0)/3,z=tri.reduce((v,i)=>v+p.getZ(i),0)/3;
      if(y<-.13&&z<.18&&(Math.abs(x)>.23||y<-.365))indices.push(...tri)}
    stubble.setIndex(indices);stubble.scale(1.018,1.018,1.018);
    mesh(head,stubble,material(new THREE.Color(profile.hair).lerp(new THREE.Color(profile.skin),.24),.95));
  }
  const mouth=new THREE.Group();mouth.position.set(0,-.249,-.34);head.add(mouth);
  const smile=line(mouth,lip,[[-.132,.032,.01],[-.065,-.01,-.014],[0,-.018,-.024],[.065,-.01,-.014],[.132,.032,.01]],.012);
  ball(mouth,warm,[0,-.043,-.014],[.072,.015,.014]);
  [-1,1].forEach(s=>ball(head,warm,[s*.145,-.214,-.307],[.019,.025,.012]));
  const cap=mesh(head,new THREE.SphereGeometry(1,32,18,0,Math.PI*2,0,Math.PI*.49),hair,[0,.035,.035],[.48,.565,.43]);cap.rotation.x=.04;
  const fringe=ball(head,hair,[.045,.36,-.23],[.32,.13,.15]);fringe.rotation.z=-.2;
  [-1,1].forEach(s=>ball(head,hair,[s*.402,.14,.02],[.048,.2,.12]));
  /* A few swept strands give the hair a direction without a separate texture. */
  const hairLight=material(new THREE.Color(profile.hair).lerp(new THREE.Color(0x806855),.17),.9);
  [0,1,2].forEach(k=>line(head,hairLight,[[-.23+k*.075,.39+k*.018,-.27],[.01+k*.06,.46,-.27],[.25+k*.02,.37,-.22]],.006));
  if(profile.style==="quiff")ball(head,hair,[.1,.47,-.12],[.3,.17,.27]);
  if(profile.style==="long"){
    ball(head,hair,[0,-.2,.25],[.45,.6,.23]);
    [-1,1].forEach(s=>{const lock=ball(head,hair,[s*.36,-.17,.08],[.12,.46,.22]);lock.rotation.z=s*.12});
  }
  if(profile.style==="bun")ball(head,hair,[0,.24,.46],[.235,.24,.23]);
  if(profile.glasses){
    [-1,1].forEach(s=>{
      const rim=mesh(head,new THREE.TorusGeometry(.126,.012,8,28),ink,[s*.168,.045,-.414]);rim.scale.y=.8;
      bone(head,ink,[s*.29,.06,-.4],[s*.43,.06,0],.012);
    });bone(head,ink,[-.042,.058,-.428],[.042,.058,-.428],.012);
  }
  batchDetails(root);
  const fallback=new THREE.Group();root.children.slice().forEach(o=>fallback.add(o));root.add(fallback);
  const hit=mesh(root,new THREE.BoxGeometry(2.15,3.65,1.8),new THREE.MeshBasicMaterial({visible:false}),[0,1.5,-.13]);hit.name=`analyst-hit-${index}`;
  /* A quiet floor halo makes selection readable without recolouring skin or clothes. */
  const ring=mesh(root,new THREE.RingGeometry(1.2,1.34,40),new THREE.MeshBasicMaterial({color:profile.shirt,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}),[0,-1.63,0]);ring.rotation.x=-Math.PI/2;ring.castShadow=ring.receiveShadow=false;
  return{root,fallback,body,head,arms,eyes,brows,mouth,smile,hit,ring,profile,index,attention:0,turn:0,greetAt:-100,explainAt:-100,expression:0,gazeX:0,gazeY:0,pose:0};
}

export function animateAnalyst(a,time,dt,{hover=false,selected=false,portrait=false,reduced=false,pointer=null,working=false}={}){
  const k=1-Math.exp(-clamp(dt,0,.1)*9),phase=a.index*1.71,clock=reduced?0:time;
  a.attention+=((hover||selected?1:0)-a.attention)*k;
  const elapsed=time-a.greetAt;
  const greeting=!reduced?smooth(elapsed/.45)*(1-smooth((elapsed-1.9)/.65)):0;
  const explained=time-a.explainAt,explaining=!reduced?smooth(explained/.45)*(1-smooth((explained-3.2)/.7)):0;
  a.turn+=((portrait?Math.PI*1.08:greeting*Math.PI*1.08)-a.turn)*k;
  a.root.rotation.y=a.turn;
  a.pose+=((portrait?1:0)-a.pose)*k;
  a.body.position.y=reduced?0:Math.sin(clock*1.5+phase)*.018;
  const gx=portrait&&pointer&&!reduced?clamp(pointer.x,-.5,.5):0,gy=portrait&&pointer&&!reduced?clamp(pointer.y,-.5,.5):0;
  a.gazeX+=(gx-a.gazeX)*k;a.gazeY+=(gy-a.gazeY)*k;
  a.head.rotation.set((portrait?-.025:.06)+Math.sin(clock*.72+phase)*.02+a.gazeY*.13-greeting*.045+explaining*Math.sin(clock*3)*.035,
    (portrait?.025:Math.sin(clock*.43+phase)*.12)+a.gazeX*.22,Math.sin(clock*.6+phase)*.012-greeting*.035);
  a.expression+=((portrait||greeting>0||hover?.85:.15)-a.expression)*k;
  a.mouth.scale.set(1+a.expression*.13,1+a.expression*.45,1);
  a.brows.forEach((b,n)=>{b.position.y=.183+a.expression*.018+greeting*.015;b.rotation.z=(n?1:-1)*a.expression*.055});
  /* Different blink periods keep the six teammates from blinking in unison. */
  const blinkPhase=(clock+phase)%(3.6+a.index*.37),blink=reduced?0:Math.max(0,1-Math.abs(blinkPhase-.14)/.095);
  a.eyes.forEach(({aperture,gaze,lid})=>{aperture.scale.y=Math.max(.045,1-blink);lid.visible=blink>.8;
    gaze.position.x=a.gazeX*.035;gaze.position.y=-a.gazeY*.022});
  a.arms.forEach(({arm,forearm,hand,side},n)=>{
    const wave=n===1?greeting:0,present=n===0?explaining:0,idle=reduced||portrait?0:Math.sin(clock*(working?8:3.5)+n*2.2+phase)*.025;
    arm.rotation.set(-wave*.08-present*.18,0,side*(a.pose*.04+wave*.85+present*.26));
    forearm.rotation.set(-a.pose*.55*(1-wave-present)+wave*1.35+present*.42,0,-side*wave*1.15,"ZYX");
    hand.rotation.set(idle+present*.12,wave*Math.sin(elapsed*10)*.28,present*.18);
  });
  a.ring.material.opacity=a.attention*.55;
  if(a.animateHuman)a.animateHuman(time,dt,{portrait,reduced,working});
}
