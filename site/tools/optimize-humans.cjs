/* Reduce the six Rocketbox GLBs to the expressions and texture sizes used by the lab.
   Requires sharp; SHARP_MODULE can point to an existing installation. */
const fs=require('node:fs'),path=require('node:path');
let sharp;for(const p of [process.env.SHARP_MODULE,'sharp',path.join(process.env.USERPROFILE||'','.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp')]){if(!p)continue;try{sharp=require(p);break}catch{}}
if(!sharp)throw Error('Set SHARP_MODULE to an existing sharp installation.');
const root=path.resolve(__dirname,'../..'),keep=new Set(['eyeBlinkLeft','eyeBlinkRight','mouthSmileLeft','mouthSmileRight','browInnerUp','eyeSquintLeft','eyeSquintRight']);
(async()=>{for(const name of ['aarav','meera','kabir','ananya','isha','rohan']){
  const file=path.join(root,'site/assets/characters',name+'.glb'),original=path.join(root,'output',name+'-original.glb');
  if(!fs.existsSync(original))fs.copyFileSync(file,original);
  const b=fs.readFileSync(original),len=b.readUInt32LE(12),j=JSON.parse(b.toString('utf8',20,20+len)),bin=b.subarray(28+len);
  for(const m of j.meshes){const names=m.extras?.targetNames;if(!names)continue;const indices=names.flatMap((n,i)=>keep.has(n)?[i]:[]);
    for(const p of m.primitives)if(p.targets)p.targets=indices.map(i=>p.targets[i]);
    m.extras.targetNames=indices.map(i=>names[i]);if(m.weights)m.weights=indices.map(i=>m.weights[i]);
    for(const node of j.nodes)if(node.mesh===j.meshes.indexOf(m)&&node.weights)node.weights=indices.map(i=>node.weights[i]);
  }
  const accessors=new Set();for(const m of j.meshes)for(const p of m.primitives){Object.values(p.attributes).forEach(i=>accessors.add(i));if(p.indices!=null)accessors.add(p.indices);for(const t of p.targets||[])Object.values(t).forEach(i=>accessors.add(i))}
  for(const s of j.skins)if(s.inverseBindMatrices!=null)accessors.add(s.inverseBindMatrices);
  const am=new Map([...accessors].map((i,n)=>[i,n]));j.accessors=[...accessors].map(i=>j.accessors[i]);
  for(const m of j.meshes)for(const p of m.primitives){for(const k in p.attributes)p.attributes[k]=am.get(p.attributes[k]);if(p.indices!=null)p.indices=am.get(p.indices);for(const t of p.targets||[])for(const k in t)t[k]=am.get(t[k])}
  for(const s of j.skins)if(s.inverseBindMatrices!=null)s.inverseBindMatrices=am.get(s.inverseBindMatrices);
  const needed=new Set(j.accessors.map(a=>a.bufferView));j.images.forEach(i=>needed.add(i.bufferView));
  const replacements=new Map();for(const image of j.images){const v=j.bufferViews[image.bufferView],src=bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength);
    const meta=await sharp(src).metadata(),stats=meta.hasAlpha?await sharp(src).stats():null,alpha=meta.hasAlpha&&stats.channels[3].min<255,limit=/normal/i.test(image.name||'')?512:1024,resized=sharp(src).resize({width:limit,height:limit,fit:'inside',withoutEnlargement:true});
    const data=alpha?await resized.png({compressionLevel:9,palette:true,quality:95}).toBuffer():await resized.removeAlpha().jpeg({quality:90}).toBuffer();
    if(data.length<src.length||meta.width>limit||meta.height>limit){replacements.set(image.bufferView,data);image.mimeType=alpha?'image/png':'image/jpeg'}else replacements.set(image.bufferView,src);}
  const parts=[],views=[],vm=new Map();let offset=0;
  for(const i of needed){if(i==null)continue;const old=j.bufferViews[i],data=replacements.get(i)||bin.subarray(old.byteOffset||0,(old.byteOffset||0)+old.byteLength),pad=Buffer.alloc((4-data.length%4)%4);
    vm.set(i,views.length);views.push({...old,byteOffset:offset,byteLength:data.length});parts.push(data,pad);offset+=data.length+pad.length;}
  j.accessors.forEach(a=>{if(a.bufferView!=null)a.bufferView=vm.get(a.bufferView)});j.images.forEach(i=>i.bufferView=vm.get(i.bufferView));j.bufferViews=views;j.buffers=[{byteLength:offset}];
  const json=Buffer.from(JSON.stringify(j)),padding=Buffer.alloc((4-json.length%4)%4,32),data=Buffer.concat(parts),h=Buffer.alloc(20),bh=Buffer.alloc(8),size=28+json.length+padding.length+data.length;
  h.writeUInt32LE(0x46546c67);h.writeUInt32LE(2,4);h.writeUInt32LE(size,8);h.writeUInt32LE(json.length+padding.length,12);h.writeUInt32LE(0x4e4f534a,16);bh.writeUInt32LE(data.length);bh.writeUInt32LE(0x004e4942,4);
  fs.writeFileSync(file,Buffer.concat([h,json,padding,bh,data]));console.log(`${name}: ${b.length} → ${size} bytes`);
}})().catch(e=>{console.error(e);process.exitCode=1});
