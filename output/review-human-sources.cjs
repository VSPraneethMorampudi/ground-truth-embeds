const fs=require('fs'),path=require('path');
const sharp=require(process.env.USERPROFILE+'/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const tree=require('./rocketbox-tree.json'),sha=tree.sha;
const dir=path.join(__dirname,'human-sources');fs.mkdirSync(dir,{recursive:true});
const files=tree.tree.filter(x=>x.type==='blob'&&/Assets\/Avatars\/Adults\/(Female|Male)_Adult_\d+\/[^/]+\.png$/.test(x.path));
(async()=>{
  let next=0;await Promise.all(Array.from({length:5},async()=>{while(next<files.length){const file=files[next++],name=path.basename(file.path),target=path.join(dir,name);if(!fs.existsSync(target)){const r=await fetch('https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/'+sha+'/'+file.path);if(!r.ok)throw Error(r.status+' '+file.path);fs.writeFileSync(target,Buffer.from(await r.arrayBuffer()))}}}));
  const columns=8,w=190,h=260,tiles=[];
  for(let i=0;i<files.length;i++){const name=path.basename(files[i].path),photo=await sharp(path.join(dir,name)).resize(w,h-25,{fit:'contain',background:'#eef0f2'}).png().toBuffer();tiles.push({input:photo,left:(i%columns)*w,top:Math.floor(i/columns)*h});tiles.push({input:Buffer.from(`<svg width="190" height="25"><rect width="190" height="25" fill="white"/><text x="8" y="18" font-size="14">${name.slice(0,-4)}</text></svg>`),left:(i%columns)*w,top:Math.floor(i/columns)*h+h-25})}
  await sharp({create:{width:columns*w,height:Math.ceil(files.length/columns)*h,channels:3,background:'#fff'}}).composite(tiles).png().toFile(path.join(__dirname,'human-source-contact-sheet.png'));console.log('Source contact sheet ready');
})().catch(e=>{console.error(e);process.exitCode=1});
