/* Convert the pinned Rocketbox FBXs to compact web GLBs with original color/normal maps.
   Run fetch-office-humans.cjs first. Requires existing sharp and Playwright installs. */
const fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve(__dirname,'../..'),source=path.join(root,'output/human-sources'),manifest=require(path.join(source,'sources.json'));
const deps=path.join(process.env.USERPROFILE||'','.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const sharp=require(path.join(deps,'sharp')),pw=require(path.join(deps,'playwright'));
function tga(bytes){
  const w=bytes.readUInt16LE(12),h=bytes.readUInt16LE(14),channels=bytes[16]/8,type=bytes[2],out=Buffer.alloc(w*h*channels),top=!!(bytes[17]&32);let at=18+bytes[0],pixel=0;
  const put=(offset)=>{const row=Math.floor(pixel/w),col=pixel%w,to=((top?row:h-1-row)*w+col)*channels;out[to]=bytes[offset+2];out[to+1]=bytes[offset+1];out[to+2]=bytes[offset];if(channels===4)out[to+3]=bytes[offset+3];pixel++};
  if(type===2){while(pixel<w*h){put(at);at+=channels}}
  else if(type===10){while(pixel<w*h){const header=bytes[at++],n=(header&127)+1;if(header&128){for(let k=0;k<n;k++)put(at);at+=channels}else for(let k=0;k<n;k++){put(at);at+=channels}}}
  else throw Error('Unsupported TGA '+type);return{out,w,h,channels};
}
const pageHTML=`<!doctype html><script type="importmap">{"imports":{"three":"/site/vendor/three.module.min.js"}}</script><script type="module">
import * as T from 'three';import{FBXLoader}from'/site/tools/vendor/FBXLoader.js';import{GLTFExporter}from'/site/tools/vendor/GLTFExporter.js';import{mergeVertices}from'/site/vendor/BufferGeometryUtils.js';
window.inspect=async(name)=>{
  const base='/output/human-sources/'+name+'/',manager=new T.LoadingManager();
  manager.setURLModifier(url=>{if(/\\.tga$/i.test(url)){const file=url.split(/[\\\\/]/).pop().replace(/\\.tga$/i,/_opacity/.test(url)?'.png':'.jpg');return base+file}return url});
  manager.addHandler(/\\.tga$/i,new T.TextureLoader(manager));
  const model=await new FBXLoader(manager).loadAsync(base+name+'_facial.fbx');model.scale.setScalar(.01);model.updateMatrixWorld(true);window.sourceModel=model;window.T=T;
  const meshes=[],bones=[];model.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox();meshes.push({name:o.name,vertices:o.geometry.attributes.position.count,materials:(Array.isArray(o.material)?o.material:[o.material]).map(m=>({name:m.name,map:m.map?.name})),morphs:Object.keys(o.morphTargetDictionary||{}),min:o.geometry.boundingBox.min.toArray(),max:o.geometry.boundingBox.max.toArray()})}if(o.isBone)bones.push({name:o.name,p:o.getWorldPosition(new T.Vector3()).toArray()})});return{meshes,bones,box:new T.Box3().setFromObject(model).getSize(new T.Vector3()).toArray()};
};
window.exportModel=async()=>{const data=await new GLTFExporter().parseAsync(sourceModel,{binary:true,onlyVisible:true,animations:[],maxTextureSize:1024});return Array.from(new Uint8Array(data))};
window.prepare=async(index)=>{
  const names=['aarav','meera','kabir','ananya','isha','rohan'],keep=new Set(['eyeBlinkLeft','eyeBlinkRight','mouthSmileLeft','mouthSmileRight','browInnerUp','eyeSquintLeft','eyeSquintRight']);
  const rename={'Bip01':'Root','Bip01_Pelvis':'Hips','Bip01_Spine':'Spine','Bip01_Spine1':'Spine1','Bip01_Spine2':'Spine2','Bip01_Neck':'Neck','Bip01_Head':'Head','Bip01_LEye':'LeftEye','Bip01_REye':'RightEye'};
  for(const [prefix,side] of [['L','Left'],['R','Right']]){
    for(const [part,canonical] of Object.entries({Clavicle:'Shoulder',UpperArm:'Arm',Forearm:'ForeArm',Hand:'Hand',Thigh:'UpLeg',Calf:'Leg',Foot:'Foot',Toe0:'ToeBase'}))rename['Bip01_'+prefix+'_'+part]=side+canonical;
    for(let f=0;f<5;f++)for(let j=0;j<3;j++)rename['Bip01_'+prefix+'_Finger'+f+(j||'')]=side+'Hand'+['Thumb','Index','Middle','Ring','Pinky'][f]+(j+1);
  }
  const pending=[],meshes=[];sourceModel.traverse(o=>{
    if(o.isBone&&rename[o.name])o.name=rename[o.name];
    if(!o.isMesh)return;meshes.push(o);
    const entries=Object.entries(o.morphTargetDictionary||{}).map(([name,i])=>[name.replace(/^.*AK_\\d+_/,'').replace(/^./,s=>s.toLowerCase()),i]).filter(([name])=>keep.has(name));
    for(const key of Object.keys(o.geometry.morphAttributes))o.geometry.morphAttributes[key]=entries.map(([,i])=>o.geometry.morphAttributes[key][i]);
    o.morphTargetDictionary=Object.fromEntries(entries.map(([name],i)=>[name,i]));o.morphTargetInfluences=entries.map(()=>0);
    o.geometry=mergeVertices(o.geometry,1e-5);o.geometry.deleteAttribute('color');
    o.material=(Array.isArray(o.material)?o.material:[o.material]).map(old=>{
      const part=old.name.includes('opacity')?'opacity':old.name.includes('head')?'head':'body',prefix=old.name.split('_')[0],base='/output/human-sources/'+window.currentName+'/'+prefix+'_'+part;
      const mat=new T.MeshStandardMaterial({name:names[index]+'_'+part,color:0xffffff,roughness:part==='head'?.8:.9,metalness:0,side:part==='opacity'?T.DoubleSide:T.FrontSide,alphaTest:part==='opacity'?.38:0});
      pending.push(new T.TextureLoader().loadAsync(base+'_color.'+(part==='opacity'?'png':'jpg')).then(t=>{t.colorSpace=T.SRGBColorSpace;mat.map=t}));
      if(part!=='opacity')pending.push(new T.TextureLoader().loadAsync(base+'_normal.jpg').then(t=>{mat.normalMap=t;mat.normalScale.set(.45,-.45)}));
      return mat;
    });
    o.frustumCulled=false;
  });
  await Promise.all(pending);
  for(const side of ['Left','Right'])for(const finger of ['Thumb','Index','Middle','Ring','Pinky']){
    const last=sourceModel.getObjectByName(side+'Hand'+finger+'3');if(last){const tip=new T.Bone();tip.name=side+'Hand'+finger+'4';tip.position.copy(last.position).multiplyScalar(.65);last.add(tip)}
  }
  sourceModel.userData={character:names[index],source:window.currentName};return meshes.map(m=>({name:m.name,vertices:m.geometry.attributes.position.count,morphs:Object.keys(m.morphTargetDictionary)}));
};
window.ready=true;
</script>`;
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://local');if(url.pathname==='/build'){res.setHeader('Content-Type','text/html');res.end(pageHTML);return}
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  fs.readFile(file,(e,d)=>{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.jpg')?'image/jpeg':file.endsWith('.png')?'image/png':'application/octet-stream');res.statusCode=e?404:200;res.end(e?'missing':d)});
});
(async()=>{
  for(const name of manifest.models)for(const file of fs.readdirSync(path.join(source,name)).filter(f=>f.endsWith('.tga'))){
    const target=path.join(source,name,file.replace('.tga',file.includes('opacity')?'.png':'.jpg'));if(fs.existsSync(target))continue;
    const {out,w,h,channels}=tga(fs.readFileSync(path.join(source,name,file))),image=sharp(out,{raw:{width:w,height:h,channels}}).resize({width:file.includes('head_color')?1024:768,height:file.includes('head_color')?1024:768,fit:'inside'});
    await (file.includes('opacity')?image.png({compressionLevel:9}):image.jpeg({quality:file.includes('normal')?92:90})).toFile(target);
  }
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{const page=await browser.newPage();page.on('pageerror',e=>console.error(e));await page.goto('http://127.0.0.1:'+server.address().port+'/build');await page.waitForFunction(()=>window.ready);
    for(let i=0;i<manifest.models.length;i++){
      const name=manifest.models[i],info=await page.evaluate(async name=>{window.currentName=name;return inspect(name)},name);fs.writeFileSync(path.join(source,name,'structure.json'),JSON.stringify(info,null,2));
      console.log(name,await page.evaluate(i=>prepare(i),i));const data=await page.evaluate(()=>exportModel()),file=path.join(root,'site/assets/characters',['aarav','meera','kabir','ananya','isha','rohan'][i]+'.glb');fs.writeFileSync(file,Buffer.from(data));console.log(path.basename(file),data.length);
    }
  }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
