/* Render the real site canvas with Chromium WebCodecs, then mux H.264 into MP4.
   Usage: node site/tools/render-orbit-video.cjs [--preview]
   Set PLAYWRIGHT_MODULE and CHROME_PATH when they are not installed locally. */
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const root=path.resolve(__dirname,'../..');
const out=path.join(root,'output');fs.mkdirSync(out,{recursive:true});
let pw;
for(const candidate of [process.env.PLAYWRIGHT_MODULE,'playwright','playwright-core',
  path.join(process.env.USERPROFILE||'','.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')]){
  if(!candidate)continue;try{pw=require(candidate);break}catch{}
}
if(!pw)throw Error('Install playwright or set PLAYWRIGHT_MODULE.');
const WIDTH=1920,HEIGHT=1080,FPS=30,DURATION=24;
const VIDEO_NAME='chhattisgarh-geo-informatics-v3.mp4';
const u16=n=>{const b=Buffer.alloc(2);b.writeUInt16BE(n);return b};
const u32=n=>{const b=Buffer.alloc(4);b.writeUInt32BE(n);return b};
const str=s=>Buffer.from(s,'ascii');
const cat=(...b)=>Buffer.concat(b);
const box=(type,...b)=>{const data=cat(...b);return cat(u32(data.length+8),str(type),data)};
const full=(type,version,flags,...b)=>box(type,Buffer.from([version,flags>>16&255,flags>>8&255,flags&255]),...b);
const zeros=n=>Buffer.alloc(n);
const matrix=cat(u32(0x10000),u32(0),u32(0),u32(0),u32(0x10000),u32(0),u32(0),u32(0),u32(0x40000000));
function mux(samples,avcc){
  const timescale=90000,delta=timescale/FPS,duration=samples.length*delta;
  const ftyp=box('ftyp',str('isom'),u32(512),str('isomiso2avc1mp41'));
  const moov=offset=>{
    const mvhd=full('mvhd',0,0,u32(0),u32(0),u32(1000),u32(samples.length/FPS*1000),u32(0x10000),u16(0x100),zeros(10),matrix,zeros(24),u32(2));
    const tkhd=full('tkhd',0,7,u32(0),u32(0),u32(1),u32(0),u32(samples.length/FPS*1000),zeros(8),u16(0),u16(0),u16(0),u16(0),matrix,u32(WIDTH*65536),u32(HEIGHT*65536));
    const mdhd=full('mdhd',0,0,u32(0),u32(0),u32(timescale),u32(duration),u16(0x55c4),u16(0));
    const hdlr=full('hdlr',0,0,u32(0),str('vide'),zeros(12),str('Chhattisgarh State Centre of Geo-Informatics\0'));
    const compressor=Buffer.alloc(32);compressor[0]=5;compressor.write('H.264',1);
    const avc1=box('avc1',zeros(6),u16(1),zeros(16),u16(WIDTH),u16(HEIGHT),u32(0x480000),u32(0x480000),u32(0),u16(1),compressor,u16(24),u16(0xffff),box('avcC',avcc));
    const keys=samples.flatMap((s,i)=>s.key?[u32(i+1)]:[]);
    const stbl=box('stbl',full('stsd',0,0,u32(1),avc1),
      full('stts',0,0,u32(1),u32(samples.length),u32(delta)),
      full('stss',0,0,u32(keys.length),...keys),
      full('stsc',0,0,u32(1),u32(1),u32(samples.length),u32(1)),
      full('stsz',0,0,u32(0),u32(samples.length),...samples.map(s=>u32(s.data.length))),
      full('stco',0,0,u32(1),u32(offset)));
    const dinf=box('dinf',full('dref',0,0,u32(1),full('url ',0,1)));
    const minf=box('minf',full('vmhd',0,1,zeros(8)),dinf,stbl);
    return box('moov',mvhd,box('trak',tkhd,box('mdia',mdhd,hdlr,minf)));
  };
  const movie=moov(ftyp.length+moov(0).length+8);
  return cat(ftyp,movie,box('mdat',...samples.map(s=>s.data)));
}
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404).end();return}
    res.setHeader('Content-Type',mime[path.extname(file)]||(file.endsWith('.mp4')?'video/mp4':'application/octet-stream'));
    res.setHeader('Accept-Ranges','bytes');
    const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
    if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),data.length-1):data.length-1;
      if(start>end){res.writeHead(416,{'Content-Range':`bytes */${data.length}`}).end();return}
      res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1});
      res.end(data.subarray(start,end+1));
    }else{res.setHeader('Content-Length',data.length);res.end(data)}
  });
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await pw.chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:['--hide-scrollbars']});
  try{
    const page=await browser.newPage({viewport:{width:WIDTH,height:HEIGHT},deviceScaleFactor:1});
    page.on('pageerror',e=>console.error('PAGE ERROR:',e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/site/video.html?render`);
    await page.evaluate(()=>window.videoReady);
    for(const [name,t] of [['start',0],['reveal',.85],['title',2.25],['globe',6],['india',12],['state',17],['end',24]]){
      console.log(name,await page.evaluate(t=>renderVideoFrame(t),t));
      await page.screenshot({path:path.join(out,`chips-gis-${name}.png`)});
    }
    const labelAudit=await page.evaluate(()=>{
      let checked=0;const names=new Set();
      for(let t=17;t<=24;t+=.5){
        renderVideoFrame(t);
        for(const label of GT_ORBIT.labels){
          const geometry=new Path2D();for(const r of label.rings){geometry.moveTo(...r[0]);for(const p of r.slice(1))geometry.lineTo(...p);geometry.closePath()}
          const test=document.createElement('canvas').getContext('2d');
          const [x0,y0,x1,y1]=label.rect;
          if(GT_LABEL_EXCLUSIONS.some(r=>x0<r[2]&&x1>r[0]&&y0<r[3]&&y1>r[1]))throw Error(`Label overlaps logo: ${label.name}`);
          for(let x=x0;x<=x1;x+=2)for(let y=y0;y<=y1;y+=2){
            if(!test.isPointInPath(geometry,x,y,'evenodd'))throw Error(`Label outside district: ${label.name} at ${t}s`);
          }
          checked++;names.add(label.name);
        }
      }
      return {checked,visibleDistricts:[...names]};
    });
    fs.writeFileSync(path.join(out,'chips-gis-label-audit.json'),JSON.stringify(labelAudit,null,2)+'\n');
    console.log('District label audit:',labelAudit.checked,'placements inside their districts');
    if(process.argv.includes('--preview'))return;
    if(!process.argv.includes('--verify-only')){
    const samples=[];let avcc;
    await page.exposeFunction('receiveSample',(data,key,description)=>{
      samples.push({data:Buffer.from(data,'base64'),key});
      if(description)avcc=Buffer.from(description,'base64');
    });
    await page.exposeFunction('reportProgress',n=>console.log(`Encoded ${n}/${DURATION*FPS} frames`));
    await page.evaluate(async({FPS,DURATION,WIDTH,HEIGHT})=>{
      const base64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s)};
      const config={codec:'avc1.640028',width:WIDTH,height:HEIGHT,bitrate:12000000,framerate:FPS,latencyMode:'realtime',avc:{format:'avc'}};
      const support=await VideoEncoder.isConfigSupported(config);
      if(!support.supported)throw Error('H.264 encoding unavailable in this browser.');
      let failure;const writes=[];
      const encoder=new VideoEncoder({
        output:(chunk,metadata)=>{const bytes=new Uint8Array(chunk.byteLength);chunk.copyTo(bytes);
          writes.push(receiveSample(base64(bytes),chunk.type==='key',metadata.decoderConfig?.description?base64(new Uint8Array(metadata.decoderConfig.description)):null))},
        error:e=>{failure=e.message}
      });
      encoder.configure(config);
      for(let i=0;i<DURATION*FPS;i++){
        renderVideoFrame(i/FPS);
        const frame=new VideoFrame(document.getElementById('globe'),{timestamp:Math.round(i*1000000/FPS),duration:Math.round(1000000/FPS)});
        encoder.encode(frame,{keyFrame:i%(FPS*2)===0});frame.close();
        if((i+1)%FPS===0){await encoder.flush();await reportProgress(i+1);if(failure)throw Error(failure)}
      }
      await encoder.flush();await Promise.all(writes);encoder.close();
    },{FPS,DURATION,WIDTH,HEIGHT});
    if(samples.length!==FPS*DURATION||!avcc)throw Error('Incomplete H.264 output.');
    const file=path.join(out,VIDEO_NAME);
    fs.writeFileSync(file,mux(samples,avcc));
    console.log(`Saved ${file} (${(fs.statSync(file).size/1048576).toFixed(1)} MB)`);
    }
    // Read the muxed MP4 in Chromium to check the final playable artifact.
    await page.goto(`http://127.0.0.1:${server.address().port}/site/video.html?render`);
    await page.evaluate(()=>window.videoReady);
    const metadata=await page.evaluate(async videoName=>{
      const v=document.createElement('video');v.src='/output/'+videoName;v.muted=true;document.body.replaceChildren(v);
      v.style='width:100vw;height:100vh;object-fit:contain;background:#030814';
      await new Promise((r,j)=>{v.onloadedmetadata=r;v.onerror=()=>j(Error('Exported MP4 could not be decoded'))});
      const result={duration:v.duration,width:v.videoWidth,height:v.videoHeight};
      v.currentTime=23.95;await new Promise(r=>v.onseeked=r);
      const still=document.createElement('canvas');still.width=v.videoWidth;still.height=v.videoHeight;
      still.getContext('2d').drawImage(v,0,0);still.style='width:100vw;height:100vh';
      const verifiedTime=v.currentTime;document.body.replaceChildren(still);
      if(Math.abs(verifiedTime-23.95)>.1)throw Error('Could not seek to the final MP4 frame');
      return {...result,verifiedTime};
    },VIDEO_NAME);
    await page.screenshot({path:path.join(out,'chips-gis-mp4-verification.png')});
    fs.writeFileSync(path.join(out,'chips-gis-video-metadata.json'),JSON.stringify(metadata,null,2)+'\n');
    console.log('Verified MP4:',metadata);
  }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
