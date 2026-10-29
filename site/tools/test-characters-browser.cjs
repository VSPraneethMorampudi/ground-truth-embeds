/* Browser integration + visual captures. Uses an existing Playwright installation.
   node site/tools/test-characters-browser.cjs
   Optional: PLAYWRIGHT_MODULE and CHROME_PATH. Screenshots go to output/characters/. */
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
let pw;
for(const p of [process.env.PLAYWRIGHT_MODULE,'playwright',path.join(process.env.USERPROFILE||'','.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')]){
  if(!p)continue;try{pw=require(p);break}catch{}
}
if(!pw)throw Error('Playwright is required for browser checks. Set PLAYWRIGHT_MODULE.');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(name.endsWith('/')?name+'index.html':name));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data)});
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await pw.chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--hide-scrollbars']});
  const out=path.join(root,'output/characters');fs.mkdirSync(out,{recursive:true});
  const errors=[];
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/site/`,{waitUntil:'domcontentloaded'});
    await page.locator('#pipeline').scrollIntoViewIfNeeded();
    await page.locator('#pl3d canvas').waitFor({timeout:45000});
    await page.waitForFunction(()=>window.GTPipe?.analysts.every(a=>a.human),null,{timeout:45000});
    await page.evaluate(()=>GTPipe.humansReady);
    assert.equal(await page.evaluate(()=>GTPipe.analysts.every(a=>a.human.hands?.length===2&&!a.fallback.visible)),true,'All six complete human rigs replace the fallback');
    assert.equal(await page.evaluate(()=>new Set(GTPipe.analysts.map(a=>a.human.asset)).size),6,'Six different character assets');
    assert.equal(await page.evaluate(()=>GTPipe.analysts.every(a=>a.human.faceTexture.flipY&&a.human.faceTexture.image.width===1024)),true,'Authored face atlas orientation and resolution');
    assert.equal(await page.evaluate(()=>new Set(GTPipe.analysts.map(a=>a.human.bones.Head)).size),6,'Every human has an independent skeleton');
    await page.locator('#plDock [data-ex="lab"]').click();
    await page.locator('[data-analyst="0"]').first().click();
    await page.waitForTimeout(3000);
    assert.equal(await page.locator('#exMail').count(),0,'Portrait focuses on the introduction');
    await page.screenshot({path:path.join(out,'aarav-portrait.png')});
    const face=await page.evaluate(()=>{const a=GTPipe.analysts[0],p=a.human.bones.Head.getWorldPosition(a.head.position.clone()).project(GTPipe.cam),r=GTPipe.host.getBoundingClientRect();return{x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2}});
    await page.mouse.click(face.x,face.y);
    assert.match(await page.locator('.ex-person').innerText(),/Aarav/,'Skinned human is selectable directly in 3D');
    await page.locator('[data-greet]').click();
    await page.waitForTimeout(900);
    assert.match(await page.locator('#exHello').innerText(),/Good to meet you/);
    const waveError=await page.evaluate(()=>GTPipe.analysts[0].human.wristErrors[0]);
    assert.ok(waveError<.5,`Waving hand reaches its IK target (${waveError})`);
    await page.screenshot({path:path.join(out,'aarav-wave.png')});
    await page.locator('[data-intro]').click();
    assert.match(await page.locator('#exHello').innerText(),/coordinates/);
    for(const [index,name] of [[1,'meera'],[2,'kabir'],[3,'ananya'],[4,'isha'],[5,'rohan']]){
      await page.locator(`[data-analyst="${index}"]`).click();
      await page.waitForTimeout(2800);
      await page.screenshot({path:path.join(out,`${name}-portrait.png`)});
    }
    await page.locator('[data-portrait]').click();
    await page.locator('[data-run]').waitFor({state:'visible'});
    assert.equal(await page.locator('[data-run]').isDisabled(),true,'Work demo starts with feedback');
    await page.waitForTimeout(4300);
    assert.equal(await page.locator('[data-run]').isDisabled(),false,'Demo can be replayed');
    assert.match(await page.locator('#exProcess').innerText(),/validated/);
    await page.screenshot({path:path.join(out,'workstation.png')});
    const motion=await page.evaluate(()=>{
      const scene=GTPipe;scene.on=false;const previous=scene.analysts.map(a=>({visible:a.station.visible,turn:a.root.rotation.y})),results=[];
      try{for(const a of scene.analysts){a.station.visible=true;a.root.rotation.y=0;a.greetAt=a.explainAt=-100;
        const states=[];for(const phase of [2,7.15]){a.animateHuman(24+phase-a.index*1.83,1/60,{portrait:false,reduced:false});
          states.push({phase,mouse:a.workState.mouse,click:a.workState.click,wrists:a.human.wristErrors,contacts:a.human.contacts.map(c=>({finger:c.finger,side:c.side,error:c.error})),pressed:[...a.keyPresses].filter(p=>p>.05).length})}
        results.push({name:a.human.asset,states});}
      }finally{scene.analysts.forEach((a,i)=>{a.station.visible=previous[i].visible;a.root.rotation.y=previous[i].turn});scene.on=true}return results;
    });
    fs.writeFileSync(path.join(out,'motion-contact-report.json'),JSON.stringify(motion,null,2));
    for(const character of motion)for(const state of character.states){assert.ok(state.wrists.every(error=>error<.01),`${character.name} reaches keyboard and mouse`);assert.ok(state.contacts.every(c=>Math.abs(c.error)<.01),`${character.name} fingertips touch the controls`)}
    console.log('Motion contacts:',JSON.stringify(motion.map(a=>({name:a.name,maxContact:Math.max(...a.states.flatMap(s=>s.contacts.map(c=>Math.abs(c.error)))),maxWrist:Math.max(...a.states.flatMap(s=>s.wrists))}))));
    await page.locator('[data-run]').click();
    await page.locator('[data-greet]').click();
    await page.waitForTimeout(4100);
    assert.equal(await page.locator('#exMail').count(),0,'Greeting cancels processing and opens portrait');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#pipeline').evaluate(el=>el.classList.contains('exploring')),false);
    await page.setViewportSize({width:390,height:844});
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#pipeline').scrollIntoViewIfNeeded();
    await page.locator('#pl3d canvas').waitFor({timeout:45000});
    await page.waitForFunction(()=>window.GTPipe?.analysts.every(a=>a.human),null,{timeout:45000});
    await page.locator('#plDock [data-ex="lab"]').click();
    await page.locator('[data-analyst="3"]').first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({path:path.join(out,'mobile-reduced-motion.png')});
    assert.equal(await page.locator('html').evaluate(el=>el.scrollWidth>innerWidth),false,'Mobile does not overflow');
    await page.locator('[data-intro]').click();
    assert.match(await page.locator('#exHello').innerText(),/missing codes/);
    await page.locator('[data-setlang="hi"]').click();
    assert.match(await page.locator('#exHello').innerText(),/कोड/);
    assert.deepEqual(errors,[],'No browser runtime errors');
    console.log('Passed desktop/mobile character introductions, greetings, navigation, processing, cancellation and reduced-motion browser checks.');
    console.log(`Screenshots: ${out}`);
  }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
