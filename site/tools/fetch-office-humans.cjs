/* Pin six textured, finger-rigged human assets from Microsoft Rocketbox (MIT).
   Raw sources stay in output/; only optimized GLBs are shipped by the site. */
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const SHA='0943055db6ec570bcef9f2c8b41c9e5467c808f9',base=`https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/${SHA}/`;
const models=['Male_Adult_08','Female_Adult_05','Male_Adult_10','Female_Adult_07','Female_Adult_14','Male_Adult_07'];
const dest=path.join(root,'output/human-sources');fs.mkdirSync(dest,{recursive:true});
(async()=>{
const cache=path.join(root,'output/rocketbox-tree.json');let tree;
if(fs.existsSync(cache))tree=JSON.parse(fs.readFileSync(cache,'utf8'));
if(!tree||tree.sha!==SHA){const response=await fetch(`https://api.github.com/repos/microsoft/Microsoft-Rocketbox/git/trees/${SHA}?recursive=1`);if(!response.ok)throw Error('Could not fetch pinned source tree: '+response.status);tree=await response.json();fs.writeFileSync(cache,JSON.stringify(tree))}
const files=models.flatMap(name=>tree.tree.filter(x=>x.type==='blob'&&x.path.startsWith(`Assets/Avatars/Adults/${name}/`)&&(/_facial\.fbx$/.test(x.path)||/_(body|head)_(color|normal)\.tga$/.test(x.path)||/_opacity_color\.tga$/.test(x.path))).map(x=>({url:base+x.path,file:path.join(dest,name,path.basename(x.path))})));
const helperBase='https://raw.githubusercontent.com/mrdoob/three.js/r170/examples/jsm/';
for(const [name,url] of Object.entries({'FBXLoader.js':'loaders/FBXLoader.js','fflate.module.js':'libs/fflate.module.js','NURBSCurve.js':'curves/NURBSCurve.js','NURBSUtils.js':'curves/NURBSUtils.js','GLTFExporter.js':'exporters/GLTFExporter.js'}))files.push({url:helperBase+url,file:path.join(root,'site/tools/vendor',name)});
files.push({url:base+'LICENSE.md',file:path.join(root,'site/assets/characters/LICENSE-rocketbox.txt')});
files.push({url:'https://raw.githubusercontent.com/101arrowz/fflate/v0.8.2/LICENSE',file:path.join(root,'site/tools/vendor/LICENSE-fflate.txt')});
  let next=0,done=0;await Promise.all(Array.from({length:5},async()=>{while(next<files.length){const {url,file}=files[next++];fs.mkdirSync(path.dirname(file),{recursive:true});if(!fs.existsSync(file)){const r=await fetch(url);if(!r.ok)throw Error(`${r.status}: ${url}`);fs.writeFileSync(file,Buffer.from(await r.arrayBuffer()))}console.log(`${++done}/${files.length}: ${path.basename(file)}`)}}));
  const helper=path.join(root,'site/tools/vendor');for(const name of ['FBXLoader.js','GLTFExporter.js','NURBSCurve.js']){const file=path.join(helper,name);let s=fs.readFileSync(file,'utf8');s=s.replaceAll('../libs/fflate.module.js','./fflate.module.js').replaceAll('../curves/NURBSCurve.js','./NURBSCurve.js').replaceAll('../curves/NURBSUtils.js','./NURBSUtils.js').replaceAll('../utils/BufferGeometryUtils.js','../../vendor/BufferGeometryUtils.js');fs.writeFileSync(file,s)}
  fs.writeFileSync(path.join(dest,'sources.json'),JSON.stringify({repository:'microsoft/Microsoft-Rocketbox',commit:SHA,models},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
