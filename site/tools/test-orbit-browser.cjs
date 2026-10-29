/* Local browser checks for the opening journey. Uses the existing Playwright runtime.
   node site/tools/test-orbit-browser.cjs */
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'output/cinematic-hero');
fs.mkdirSync(out,{recursive:true});
let pw;
for(const candidate of [process.env.PLAYWRIGHT_MODULE,'playwright',path.join(process.env.USERPROFILE||'','.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')]){
  if(!candidate)continue;try{pw=require(candidate);break}catch{}
}
if(!pw)throw Error('Set PLAYWRIGHT_MODULE to an existing Playwright installation.');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(name.endsWith('/')?name+'index.html':name));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data)});
});
const errors=[],report=[];
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await pw.chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    for(const [name,viewport,reducedMotion] of [
      ['desktop',{width:1440,height:900},'no-preference'],
      ['mobile',{width:390,height:844},'no-preference'],
      ['compact',{width:360,height:640},'no-preference'],
      ['reduced',{width:1280,height:800},'reduce']
    ]){
      if(process.env.ORBIT_VIEW&&name!==process.env.ORBIT_VIEW)continue;
      const page=await browser.newPage({viewport,reducedMotion});
      page.on('pageerror',e=>errors.push(name+': '+e.message));
      page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).host===`127.0.0.1:${server.address().port}`)errors.push(`${name}: ${r.status()} ${r.url()}`)});
      await page.goto(`http://127.0.0.1:${server.address().port}/site/`,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>!document.getElementById('pre'),null,{timeout:20000});
      await page.evaluate(()=>Promise.all([document.fonts.load('500 72px Fraunces'),document.fonts.load('400 18px "Instrument Sans"')]));
      assert.equal(await page.evaluate(()=>document.fonts.check('500 72px Fraunces')&&document.fonts.check('400 18px "Instrument Sans"')),true);
      const seek=async p=>{
        await page.evaluate(p=>{const o=document.getElementById('orbit');GT_GOTO(p*(o.offsetHeight-innerHeight))},p);
        await page.waitForFunction(p=>Math.abs(GT_ORBIT.p-p)<.003,p);
        await page.waitForFunction(()=>!document.documentElement.classList.contains('lenis-scrolling'));
        await page.waitForTimeout(180);
      };
      for(const [phase,p] of [['orbit',0],['signal',.31],['state',.59],['raipur',.81],['landing',.985]]){
        await seek(p);
        await page.screenshot({path:path.join(out,`${name}-${phase}.png`)});
        const state=await page.evaluate(()=>{
          const r=document.querySelector('.orbit-chapters').getBoundingClientRect(),cap=[...document.querySelectorAll('.ocap')].find(e=>e.getAttribute('aria-hidden')==='false'),c=cap?.getBoundingClientRect();
          return {p:GT_ORBIT.p,camera:GT_ORBIT.camera,overflow:document.documentElement.scrollWidth>innerWidth,caption:c?{left:c.left,right:c.right,top:c.top,bottom:c.bottom}:null,navTop:r.top,title:document.querySelector('.otitle').classList.contains('on')};
        });
        assert.equal(state.overflow,false,`${name} ${phase}: no horizontal overflow`);
        if(state.caption){assert.ok(state.caption.left>=0&&state.caption.right<=viewport.width+1,`${name} ${phase}: caption fits width`);assert.ok(state.caption.bottom<state.navTop,`${name} ${phase}: caption clears chapter navigation`);assert.ok(state.caption.top>=68,`${name} ${phase}: caption clears header`)}
        assert.ok(Object.values(state.camera).every(Number.isFinite),`${name} ${phase}: finite camera`);
        if(phase==='landing'){
          assert.equal(await page.evaluate(()=>{
            const word=document.querySelector('#oTitle [lang=en] i'),r=document.createRange();r.selectNodeContents(word);
            const tops=[...r.getClientRects()].map(r=>r.top);return Math.max(...tops)-Math.min(...tops)<1;
          }),true,`${name}: the title does not wrap within a word`);
        }
        report.push({name,phase,...state});
        console.log(`${name}: ${phase}`);
      }
      await seek(.59);
      const before=await page.evaluate(()=>GT_ORBIT.camera);
      await page.waitForTimeout(700);
      assert.deepEqual(await page.evaluate(()=>GT_ORBIT.camera),before,`${name}: camera holds still when scrolling stops`);
      await page.locator('[data-orbit-stop="0"]').click();
      await page.waitForFunction(()=>GT_ORBIT.p<.002,null,{timeout:7000});
      await page.locator('[data-orbit-stop="0.59"]').click();
      await page.waitForFunction(()=>Math.abs(GT_ORBIT.p-.59)<.003,null,{timeout:7000});
      await page.waitForFunction(()=>!document.documentElement.classList.contains('lenis-scrolling'));
      if(name==='desktop'){
        await seek(0);await page.mouse.move(720,420);const wheelStart=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,500);
        await page.waitForFunction(()=>scrollY>480);
        await page.waitForFunction(()=>!document.documentElement.classList.contains('lenis-scrolling'));
        const wheelEnd=await page.evaluate(()=>scrollY);console.log({wheelStart,wheelEnd});
        assert.ok(wheelEnd-wheelStart>=480&&wheelEnd-wheelStart<550,`Wheel scrolling settles without overshoot: ${wheelStart} → ${wheelEnd}`);
        await page.mouse.wheel(0,-500);await page.waitForFunction(()=>scrollY<5);
        await page.keyboard.press('PageDown');await page.waitForFunction(()=>scrollY>100);
        await page.locator('[data-setlang="hi"]').click();await seek(.59);
        await page.screenshot({path:path.join(out,'desktop-hindi.png')});
        await page.locator('[data-setlang="en"]').click();
        await seek(.985);await page.locator('#oBegin').click();
        await page.waitForFunction(()=>{const r=document.getElementById('pipeline').getBoundingClientRect();return Math.abs(r.top)<3},null,{timeout:7000});
        await page.locator('#pl3d canvas').waitFor({timeout:30000});
        await page.screenshot({path:path.join(out,'pipeline-handoff.png')});
      }
      await page.close();console.log(`${name}: typography, all five stages, reverse scroll and chapter navigation passed`);
    }
    assert.deepEqual(errors,[],'No page errors or missing local assets');
    fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({errors,report},null,2));
    console.log('Orbit browser checks passed. Captures: output/cinematic-hero/');
  }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
