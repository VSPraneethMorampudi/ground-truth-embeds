const { chromium } = require('playwright');
const fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const FPS=30,OUT=process.argv[2],mode=process.argv[3]||'video';
(async()=>{
  const b=await chromium.launch({args:['--allow-file-access-from-files']});const p=await b.newPage({viewport:{width:1920,height:1080}});
  p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});
  await p.goto('file://'+path.resolve('index.html'));await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
  const END=await p.evaluate(()=>TL.END);
  if(mode==='stills'){fs.mkdirSync(OUT,{recursive:true});for(const t of process.argv[4].split(',').map(Number)){await p.evaluate(t=>render(t),t);await p.screenshot({path:`${OUT}/${t}.jpg`,type:'jpeg',quality:80});}await b.close();return;}
  const [t0,t1]=(process.argv[4]||`0,${END}`).split(',').map(Number);
  const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-threads','2','-movflags','+faststart',OUT],{stdio:['pipe','inherit','inherit']});
  for(let f=Math.round(t0*FPS);f<Math.round(t1*FPS);f++){await p.evaluate(t=>render(t),f/FPS);const buf=await p.screenshot({type:'jpeg',quality:93});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));if(f%300==0)console.log('t',(f/FPS).toFixed(1));}
  ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close();console.log('done',OUT);
})();
