/* Package built-in Image Gen atlas edits and measure a matching hand/neck tint.
   Source PNGs are copied into output/indian-faces-source without altering originals. */
const fs=require('fs'),path=require('path');
const sharp=require(path.join(process.env.USERPROFILE||'','.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'));
const root=path.resolve(__dirname,'../..'),dest=path.join(root,'site/assets/characters/faces');fs.mkdirSync(dest,{recursive:true});
const profiles=[['aarav','Male_Adult_08','m014'],['meera','Female_Adult_05','f005'],['kabir','Male_Adult_10','m024'],['ananya','Female_Adult_07','f007'],['isha','Female_Adult_14','f017'],['rohan','Male_Adult_07','m013']];
const linear=x=>{x/=255;return x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4)};
async function neck(file){const {data,info}=await sharp(file).resize(1024,1024).removeAlpha().raw().toBuffer({resolveWithObject:true}),sum=[0,0,0];let n=0;for(let y=625;y<660;y++)for(let x=475;x<550;x++){for(let c=0;c<3;c++)sum[c]+=linear(data[(y*info.width+x)*3+c]);n++}return sum.map(s=>s/n)}
(async()=>{const manifest={generator:'OpenAI built-in image_gen',characters:{}};
for(const [name,folder,prefix] of profiles){const source=path.join(root,'output/indian-faces-source',name+'.png'),target=path.join(dest,name+'.jpg');await sharp(source).resize(1024,1024).jpeg({quality:93}).toFile(target);
  const original=await neck(path.join(root,'output/human-sources',folder,prefix+'_head_color.jpg')),edited=await neck(target),bodyTint=edited.map((v,c)=>Math.max(.2,Math.min(1.5,v/original[c])));
  manifest.characters[name]={texture:name+'.jpg',bodyTint};console.log(name,bodyTint.map(n=>n.toFixed(3)).join(', '));}
fs.writeFileSync(path.join(dest,'manifest.json'),JSON.stringify(manifest,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
