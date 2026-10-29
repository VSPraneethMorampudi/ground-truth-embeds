/* Real pointer, touch and keyboard checks for the child-friendly map adventure. */
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'output/junior-game');fs.mkdirSync(out,{recursive:true});
const pw=require(path.join(process.env.USERPROFILE||'','.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://local'),file=path.resolve(root,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(file,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(e?'missing':b)})});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),base='http://127.0.0.1:'+server.address().port;
 try{const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('Browser:',e.message)});await page.goto(base+'/site/play.html',{waitUntil:'domcontentloaded'});
 if(process.argv.includes('--before')){await page.locator('#gPlay').waitFor();await page.screenshot({path:path.join(out,'before-start.png')});await page.locator('#gPlay').click();await page.waitForTimeout(1800);await page.screenshot({path:path.join(out,'before-level.png')});console.log('Baseline screenshots captured');return}
 let checks=0;const check=(condition,label)=>{assert.ok(condition,label);checks++};
 const state=p=>p.evaluate(()=>({level:GTGame.level,done:GTGame.doneIds.size,completed:GTGame.completed.size,finished:!!GTGame.finished}));
 async function drag(p,card,target,offset={x:0,y:0}){
  const c=p.locator(`[data-card="${card}"]`),t=p.locator(`[data-drop="${target}"]`);await c.scrollIntoViewIfNeeded();const a=await c.boundingBox(),b=await t.boundingBox();
  await p.mouse.move(a.x+a.width/2,a.y+a.height/2);await p.mouse.down();await p.mouse.move(b.x+b.width/2+offset.x,b.y+b.height/2+offset.y,{steps:14});await p.mouse.up();await p.waitForTimeout(230);
 }
 async function tap(p,card,target){await p.locator(`[data-card="${card}"]`).tap();await p.locator(`[data-drop="${target}"]`).tap()}
 async function next(p){await p.locator('[data-next]').click();await p.waitForTimeout(1000)}
 await page.locator('[data-start]').waitFor();await page.screenshot({path:path.join(out,'welcome-desktop.png')});
 await page.locator('[data-start]').click();await page.waitForTimeout(1800);await page.screenshot({path:path.join(out,'adventure-desktop.png')});
 check(await page.evaluate(()=>GTGame.guide.root.name==='Bindu-map-guide'&&GTGame.guide.root.children.length>5),'An articulated Three.js guide is present');
 const beforeGuide=await page.evaluate(()=>GTGame.guide.root.position.toArray());
 await page.locator('[data-demo]').click();await page.waitForTimeout(1700);check((await state(page)).done===0,'Show me demonstrates without completing the task');
 // Releasing over empty map space is safe and restores the source card.
 const first=await page.locator('[data-card=school]').boundingBox();await page.mouse.move(first.x+first.width/2,first.y+first.height/2);await page.mouse.down();await page.mouse.move(180,220,{steps:10});await page.mouse.up();
 check((await state(page)).done===0,'A missed drop does not advance');check(!await page.locator('.jy-ghost').isVisible(),'Missed-drop ghost is cleared');await page.waitForTimeout(250);
 // A little tolerance around the box helps imprecise mouse movement.
 const basket=await page.locator('[data-drop=basket]').boundingBox();await drag(page,'school','basket',{x:basket.width/2+10,y:0});check((await state(page)).done===1,'A drop 10px beyond the target edge is accepted');
 await page.reload();await page.locator('[data-start]').click();await page.waitForTimeout(900);check((await state(page)).done===1,'Progress resumes after reload');
 await page.locator('[data-card=hospital]').focus();await page.keyboard.press('Enter');check(await page.locator('[data-card=hospital]').getAttribute('aria-pressed')==='true','Keyboard selects a card');await page.locator('[data-drop=basket]').focus();await page.keyboard.press('Enter');check((await state(page)).completed===1,'Keyboard places the card');
 await next(page);check((await state(page)).level===1,'Next advances only after completion');
 await drag(page,'school','hospital');check((await state(page)).done===0,'A mismatched box gives a retry without progress');
 await drag(page,'school','school');check(await page.locator('[data-drop=school]').isDisabled(),'An individually matched box shows completion');
 for(const id of ['hospital','tree','road'])await drag(page,id,id);check((await state(page)).completed===2,'All four picture matches complete');
 await page.screenshot({path:path.join(out,'matched-desktop.png')});await next(page);
 const target=await page.locator('[data-drop=star]').boundingBox();check(target.x>=0&&target.y>=76&&target.x+target.width<980,'The world-projected star is reachable');
 await drag(page,'pin','star');check((await state(page)).completed===3,'A pin can be dropped on the 3D map');await next(page);
 await drag(page,'tree','basket');await drag(page,'river','basket');check(await page.evaluate(()=>GTGame.world.trees.visible&&GTGame.world.layers.rivers.visible),'Trees and rivers appear on the map');await next(page);
 await drag(page,'map','friend-a');check(!await page.locator('[data-card=map]').isDisabled(),'The map can be reused for another friend');await drag(page,'map','friend-b');check((await state(page)).completed===5,'Both friends receive a map');await next(page);
 await drag(page,'newSchool','star');check(await page.evaluate(()=>GTGame.world.pins.some(p=>p.lonlat[0]===81.49)),'The new school becomes a map pin');await next(page);
 await drag(page,'sea','water');check(await page.evaluate(()=>GTGame.color==='#249cb9'&&GTGame.doneIds.size===1),'Any of the three blue choices completes the painting');await next(page);
 await drag(page,'map','chest');await next(page);check((await state(page)).finished&&(await state(page)).completed===8,'All eight adventures reach the ending');
 await page.screenshot({path:path.join(out,'finished-desktop.png')});const download=page.waitForEvent('download');await page.locator('[data-download]').click();const file=await download;await file.saveAs(path.join(out,file.suggestedFilename()));check(fs.statSync(path.join(out,'my-map-explorer.png')).size>15000,'The child can keep a real PNG map');
 await page.reload();await page.locator('[data-start]').click();check((await state(page)).finished,'A completed save reopens the finished map');await page.locator('[data-replay]').click();check((await state(page)).done===0&&(await state(page)).completed===0,'Play again clears the adventure');
 // Fresh touch phone, including small-width layout and Hindi switching.
 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});phone.on('pageerror',e=>errors.push(e.message));await phone.goto(base+'/site/play.html');await phone.locator('[data-start]').waitFor();await phone.screenshot({path:path.join(out,'welcome-phone.png')});await phone.locator('[data-start]').tap();await phone.waitForTimeout(1100);
 check(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'The phone has no horizontal overflow');
 await tap(phone,'school','basket');check((await state(phone)).done===1,'Tap then tap works on a touch phone');
 // Real touch events drive the same captured-pointer drag path.
 const touch=await phone.context().newCDPSession(phone),a=await phone.locator('[data-card=hospital]').boundingBox(),b=await phone.locator('[data-drop=basket]').boundingBox();
 await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x+a.width/2,y:a.y+a.height/2}]});for(let i=1;i<=12;i++)await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:a.x+a.width/2+(b.x+b.width/2-a.x-a.width/2)*i/12,y:a.y+a.height/2+(b.y+b.height/2-a.y-a.height/2)*i/12}]});await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});check((await state(phone)).completed===1,'Real touch dragging completes the task');
 await next(phone);await phone.locator('.jy-language [data-setlang=hi]').tap();check(await phone.locator('html').getAttribute('lang')==='hi','Hindi changes the document language');check(await phone.locator('.jy-title [lang=hi]').isVisible()&&!await phone.locator('.jy-title [lang=en]').isVisible(),'Hindi instructions replace English');await phone.screenshot({path:path.join(out,'match-phone-hindi.png')});
 for(const id of ['school','hospital','tree','road'])await tap(phone,id,id);await next(phone);await phone.waitForTimeout(900);await phone.screenshot({path:path.join(out,'star-phone-hindi.png')});
 const visibleGuide=await phone.evaluate(()=>{const g=GTGame.guide,w=GTGame.world,p=g.root.position.clone().project(w.camera),el=w.renderer.domElement.getBoundingClientRect();return{x:(p.x/2+.5)*el.width,y:(.5-p.y/2)*el.height,scale:g.root.scale.x}});check(visibleGuide.x>0&&visibleGuide.x<390&&visibleGuide.y>0&&visibleGuide.y<300&&visibleGuide.scale>1,'Bindu stays visible at a readable phone size');
 await tap(phone,'pin','star');check((await state(phone)).completed===3,'The phone star accepts tap placement');
 // Smaller phone, short landscape, and reduced motion.
 await phone.setViewportSize({width:320,height:640});await phone.waitForTimeout(300);await phone.screenshot({path:path.join(out,'small-phone.png')});check(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'A 320px phone has no horizontal overflow');
 const calm=await browser.newPage({viewport:{width:900,height:600},reducedMotion:'reduce'});calm.on('pageerror',e=>errors.push(e.message));await calm.goto(base+'/site/play.html');await calm.locator('[data-start]').click();await calm.waitForTimeout(350);await calm.locator('[data-demo]').click();check(!await calm.locator('.jy-ghost').isVisible(),'Reduced motion shows a static hint without a moving ghost');check(await calm.evaluate(()=>GTGame.guide.reduced&&!GTGame.world.clouds.visible),'Reduced motion keeps guide animation and clouds still');await calm.screenshot({path:path.join(out,'reduced-landscape.png')});
 const legacy=await browser.newPage({viewport:{width:1280,height:900}});legacy.on('pageerror',e=>errors.push(e.message));await legacy.goto(base+'/site/play.html?mode=original');await legacy.locator('#gPlay').waitFor();await legacy.locator('#gPlay').click();await legacy.waitForTimeout(1300);check(await legacy.locator('.g-panel').count()>0,'The original game is still available');
 check(errors.length===0,'No browser runtime errors: '+errors.join(', '));console.log(`${checks} junior game checks passed, including all 8 adventures, desktop pointer, keyboard, touch, Hindi, save/resume and reduced motion.`);
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
