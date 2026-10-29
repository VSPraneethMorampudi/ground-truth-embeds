/* QA contact sheet from actual browser screenshots, not generated character renders. */
const fs=require('fs'),path=require('path'),sharp=require(path.join(process.env.USERPROFILE||'','.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'));
const dir=path.resolve(__dirname,'../../output/characters'),names=['aarav','meera','kabir','ananya','isha','rohan'];
(async()=>{const tiles=[];for(const [i,name] of names.entries()){
  const input=await sharp(path.join(dir,name+'-portrait.png')).extract({left:375,top:145,width:250,height:420}).resize(320,538).png().toBuffer(),left=(i%3)*336+8,top=Math.floor(i/3)*585+8;
  tiles.push({input,left,top},{input:Buffer.from(`<svg width="320" height="32"><rect width="320" height="32" fill="#f7f5ef"/><text x="16" y="23" font-size="20" font-family="sans-serif" fill="#172334">${name[0].toUpperCase()+name.slice(1)}</text></svg>`),left,top:top+538});
}await sharp({create:{width:1008,height:1170,channels:3,background:'#e2e6e9'}}).composite(tiles).png().toFile(path.join(dir,'indian-team-preview.png'));console.log(path.join(dir,'indian-team-preview.png'));})().catch(e=>{console.error(e);process.exitCode=1});
