import {World} from './world.js';
import {MapBuddy} from './map-buddy.js?v=202610280002';
import {JuniorMotion} from './junior-motion.js?v=202610280002';
import {T,THINGS,MISSIONS,picture,BUDDY} from './junior-data.js?v=202610280002';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const L=o=>`<span lang="en">${o.en}</span><span lang="hi">${o.hi}</span>`;
const language=()=>document.documentElement.dataset.lang==='hi'?'hi':'en';
const words=o=>o[language()];
const REDUCED=matchMedia('(prefers-reduced-motion:reduce)').matches;
const SAVE='gt-map-buddies-v1';

export class JuniorGame{
 constructor(root){
  this.root=root;this.level=0;this.doneIds=new Set();this.completed=new Set();this.selected=null;this.color='#2879cf';this.started=false;this.drag=null;this.demoToken=0;
  try{const saved=JSON.parse(localStorage.getItem(SAVE));if(saved?.version===1){this.level=Math.max(0,Math.min(7,Number(saved.level)||0));this.completed=new Set((saved.completed||[]).filter(id=>MISSIONS.some(m=>m.id===id)));this.doneIds=new Set((saved.done||[]).filter(id=>typeof id==='string'));if(['#42b4e6','#2879cf','#249cb9'].includes(saved.color))this.color=saved.color}}catch{}
  root.classList.add('junior-mode');document.documentElement.classList.add('junior-game');
  root.innerHTML=`<header class="jy-header"><a class="jy-home" href="./" aria-label="Back to Ground Truth">⌂ <span>${L(T('Home','घर'))}</span></a><b class="jy-brand">${L(T('Map Buddies','नक्शे के दोस्त'))}</b><div class="jy-journey" aria-label="Adventure progress"></div><div class="jy-language" role="group" aria-label="Language"><button data-setlang="en">EN</button><button data-setlang="hi">हिं</button></div></header>
   <main class="jy-layout"><section class="jy-playarea" aria-label="Your map"><div class="jy-world" id="jyWorld"></div><div class="jy-labels" id="jyLabels"></div><div class="jy-targets" id="jyTargets"></div><div class="jy-map-caption">${L(T('Our map of Chhattisgarh','हमारा छत्तीसगढ़ का नक्शा'))}</div><div class="jy-zoom"><button data-view="in" aria-label="Zoom in">+</button><button data-view="home" aria-label="Show the whole map">⌖</button><button data-view="out" aria-label="Zoom out">−</button></div></section>
   <section class="jy-panel" aria-label="Your adventure"><div class="jy-coach"><div class="jy-buddy">${BUDDY}</div><p>${L(T("Hi! I'm Bindu. Let's make a map!","नमस्ते! मैं बिंदु हूँ। चलो नक्शा बनाएँ!"))}</p></div><div class="jy-activity"></div></section></main>
   <div class="jy-welcome"></div><div class="jy-feedback" role="status" aria-live="polite" aria-atomic="true"></div><div class="jy-ghost" aria-hidden="true"></div><div class="jy-celebration" aria-hidden="true"></div>`;
  this.world=new World($('#jyWorld',root),$('#jyLabels',root));this.world.setInset({right:0,top:0,bottom:0});this.world.controls.enableRotate=false;this.world.controls.enableZoom=false;this.world.controls.enablePan=false;this.world.setStage(1);this.world.home(.01);
  if(REDUCED){this.world.clouds.visible=false;this.world.autoRotate(false)}
  this.guide=new MapBuddy(this.world,{reduced:REDUCED});this.motion=new JuniorMotion(root,{reduced:REDUCED});this.world.onFrame=(time,dt)=>this.guide.update(time,dt);
  this.observer=new ResizeObserver(()=>this.world.setInset({right:0,top:0,bottom:0}));this.observer.observe($('#jyWorld',root));
  root.addEventListener('pointerdown',e=>this.pointerDown(e));root.addEventListener('pointermove',e=>this.pointerMove(e));root.addEventListener('pointerup',e=>this.pointerUp(e));root.addEventListener('pointercancel',()=>this.cancelDrag());root.addEventListener('lostpointercapture',()=>{if(this.drag)this.cancelDrag()});
  root.addEventListener('click',e=>this.click(e));root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();this.cancelDrag();this.stopDemo();this.clearSelection();this.stopSpeech()}});
  root.addEventListener('pointerleave',()=>this.motion.resetHover());addEventListener('pagehide',()=>{this.stopSpeech();this.motion.clear();clearTimeout(this.idleTimer)});this.relang();this.welcome();
 }
 get mission(){return MISSIONS[this.level]}
 key(card,target){return this.mission.repeat?target:card}
 get required(){return this.mission.chooseOne?1:this.mission.repeat?this.mission.targets.length:this.mission.cards.length}
 get done(){return this.doneIds.size>=this.required}
 persist(){try{localStorage.setItem(SAVE,JSON.stringify({version:1,level:this.level,done:[...this.doneIds],completed:[...this.completed],color:this.color}))}catch{}}
 welcome(){
  this.started=false;this.root.classList.remove('jy-playing');$('.jy-welcome',this.root).hidden=false;
  const returning=this.completed.size>0||this.doneIds.size>0;
  $('.jy-welcome',this.root).innerHTML=`<div class="jy-welcome-card"><div class="jy-welcome-buddy">${BUDDY}</div><p class="jy-eyebrow">${L(T('A little map adventure','नक्शे का छोटा-सा सफ़र'))}</p><h1>${L(T('Let’s make a map!','चलो नक्शा बनाएँ!'))}</h1><p>${L(T('A map shows where places are. Help Bindu build one!','नक्शा बताता है कि जगहें कहाँ हैं। बिंदु की मदद करो!'))}</p>
   <div class="jy-how"><div>${picture('school')}<b>1</b><span>${L(T('Pick a picture','तस्वीर चुनो'))}</span></div><i>→</i><div>${picture('map')}<b>2</b><span>${L(T('Move it to a box','डिब्बे तक ले जाओ'))}</span></div><i>→</i><div>${picture('star')}<b>3</b><span>${L(T('Let go!','छोड़ दो!'))}</span></div></div>
   <button class="jy-primary" data-start>${L(returning?T('Keep playing →','आगे खेलो →'):T('Let’s play! →','चलो खेलें! →'))}</button><p class="jy-tap-note">${L(T('You can also tap a picture, then its box.','तस्वीर पर, फिर डिब्बे पर टैप भी कर सकते हो।'))}</p><div class="jy-welcome-links">${returning?`<button data-new>${L(T('Start again','फिर से शुरू करो'))}</button>`:''}<a href="?mode=original">${L(T('Original game · older players','पहले वाला खेल · बड़े बच्चों के लिए'))}</a></div><small>${L(T('8 small adventures. No timer. Take your time.','8 छोटे खेल। कोई जल्दी नहीं। आराम से खेलो।'))}</small></div>`;
  this.renderJourney();
 }
 start(){this.started=true;this.finished=false;$('.jy-welcome',this.root).hidden=true;this.root.classList.add('jy-playing');this.guide.greet();if(this.completed.size===8)this.finish();else this.go(this.level,false)}
 restart(){this.cancelDrag();this.stopSpeech();clearTimeout(this.idleTimer);this.finished=false;this.level=0;this.doneIds.clear();this.completed.clear();this.color='#2879cf';this.persist();this.start()}
 go(level,focus=true){
  this.cancelDrag();this.stopSpeech();this.stopDemo();this.motion.clear();clearTimeout(this.idleTimer);this.selected=null;
  if(level!==this.level)this.doneIds.clear();this.level=level;
  if(level>=MISSIONS.length){this.finish();return}
  const valid=this.mission.repeat?this.mission.targets.map(t=>t.id):this.mission.cards;this.doneIds=new Set([...this.doneIds].filter(id=>valid.includes(id)));this.persist();
  this.root.classList.toggle('jy-placing',!!this.mission.at);this.drawMap();this.renderJourney();this.renderActivity();this.renderTargets();
  this.motion.enter();this.message(this.mission.task);if(focus)$('.jy-title',this.root).focus({preventScroll:true});this.idle();
 }
 renderJourney(){
  $('.jy-journey',this.root).innerHTML=`<span class="jy-count">${L(T('Adventure','खेल'))} ${Math.min(this.level+1,8)}/8</span><ol>${MISSIONS.map((m,i)=>`<li class="${this.completed.has(m.id)?'earned':''} ${i===this.level?'current':''}" aria-label="${words(m.name)}${this.completed.has(m.id)?': ✓':''}"><span>${this.completed.has(m.id)?'★':i+1}</span></li>`).join('')}</ol>`;
 }
 renderActivity(){
  const m=this.mission,activity=$('.jy-activity',this.root);
  $('.jy-coach p',this.root).innerHTML=L(this.done?m.win:T('Follow me! I’ll show you the box.','मेरे साथ आओ! मैं डिब्बा दिखाऊँगा।'));
  activity.innerHTML=`<div class="jy-task-head"><p class="jy-eyebrow">${L(T('Adventure','खेल'))} ${this.level+1} ${L(T('of 8','/ 8'))}</p><button class="jy-read" data-read aria-label="Read the instruction aloud" ${'speechSynthesis'in window?'':'hidden'}>◖)) <span>${L(T('Read to me','मुझे सुनाओ'))}</span></button></div><h1 class="jy-title" tabindex="-1">${L(m.title)}</h1><p class="jy-instruction">${L(m.task)}</p><p class="jy-drag-help" id="jyDragHelp">${L(T('Drag a picture. Or tap it, then tap its box.','तस्वीर खींचो। या तस्वीर पर, फिर डिब्बे पर टैप करो।'))}</p>
   <div class="jy-cards ${m.cards.length===4?'four':''}" aria-label="Pictures to move">${m.cards.map(id=>this.cardHTML(id)).join('')}</div>
   <div class="jy-progress" aria-label="Pictures placed"><div class="jy-mini-progress">${Array.from({length:this.required},(_,i)=>`<span class="${i<this.doneIds.size?'filled':''}">${i<this.doneIds.size?'✓':'○'}</span>`).join('')}</div><span>${this.doneIds.size}/${this.required} ${L(T('done','पूरे'))}</span></div>
   <div class="jy-success" ${this.done?'':'hidden'}><b>★ ${L(m.win)}</b><p>${L(m.learn)}</p></div><div class="jy-actions"><button data-demo class="jy-demo" ${this.done?'disabled':''}>☝ ${L(T('Show me how','कैसे खेलें?'))}</button><button data-next class="jy-primary" ${this.done?'':'hidden'}>${L(this.level===7?T('See my map! →','मेरा नक्शा देखो! →'):T('Next adventure →','अगला खेल →'))}</button></div>`;
 }
 cardHTML(id){const thing=THINGS[id],used=this.mission.chooseOne?this.done:!this.mission.repeat&&this.doneIds.has(id);return `<button class="jy-card ${used?'placed':''}" data-card="${id}" style="--picture-color:${thing.color}" aria-label="${words(thing.label)}" aria-pressed="false" aria-describedby="jyDragHelp" ${used?'disabled':''}><span class="jy-card-picture">${picture(id)}</span><b>${L(thing.label)}</b><small>${used?'✓':L(T('Move me','मुझे रखो'))}</small></button>`}
 targetHTML(t){const used=this.mission.repeat?this.doneIds.has(t.id):this.mission.chooseOne?this.done:t.accept.every(id=>this.doneIds.has(id));return `<button class="jy-drop ${used?'full':''}" data-drop="${t.id}" aria-label="${words(t.label)}" ${used?'disabled':''}>${picture(used&&t.id==='star'?'star':t.picture)}<b>${L(t.label)}</b><small>${used?'✓':L(T('Put it here','यहाँ रखो'))}</small></button>`}
 renderTargets(){
  const host=$('#jyTargets',this.root);host.innerHTML='';
  if(this.mission.at){this.targetLabel=this.world.labelAt(this.mission.at,this.targetHTML(this.mission.targets[0]),'jy-world-target',2.4)}
  else host.innerHTML=`<div class="jy-drop-grid ${this.mission.targets.length===1?'single':''} ${this.mission.targets.length===4?'four':''}">${this.mission.targets.map(t=>this.targetHTML(t)).join('')}</div>`;
  const id=this.nextCard(),target=this.mission.targets.find(t=>t.accept.includes(id)&&!this.doneIds.has(this.key(id,t.id)));this.guide.pointAt(target?$(`[data-drop="${target.id}"]`,this.root):null);
 }
 drawMap(frame=true){
  const w=this.world;w.setStage(1);w.tintAll(0xb9d9c0,.12);
  const has=id=>this.completed.has(id),current=id=>this.mission.id===id;
  if(has('find')||current('find'))for(const id of ['school','hospital'])if(has('find')||this.doneIds.has(id))this.placeOnMap(id);
  if(has('match')||current('match')&&this.doneIds.has('road'))this.showLayer('roads');
  if(has('layers')||current('layers')&&this.doneIds.has('tree'))w.setLayer('trees',true);
  if(has('layers')||current('layers')&&this.doneIds.has('river'))this.showLayer('rivers');
  if(has('new')||current('new')&&this.doneIds.has('newSchool'))this.placeOnMap('newSchool');
  w.riverColor(this.color);
  if(frame){if(this.mission.at&&!REDUCED){const district=this.mission.id==='place'?'Raipur':'Kanker';w.flyTo(district,.9)}else w.home(REDUCED?.01:.65)}
 }
 showLayer(name){const layer=this.world.layers[name];layer.visible=true;layer.children.forEach(m=>m.geometry.setDrawRange(0,m.userData.full))}
 placeOnMap(id){const thing=THINGS[id];if(!thing?.at)return;this.world.addPin(thing.at,thing.color,{big:1.15,bob:false});this.world.labelAt(thing.at,`<span>${picture(id)}<b>${L(thing.label)}</b></span>`,'jy-place',3.6)}
 choose(id){
  if(this.done)return;const card=$(`[data-card="${id}"]`,this.root);if(!card||card.disabled)return;
  this.stopDemo();
  this.selected=this.selected===id?null:id;$$('[data-card]',this.root).forEach(c=>{const on=c.dataset.card===this.selected;c.classList.toggle('selected',on);c.setAttribute('aria-pressed',String(on))});
  $$('[data-drop]',this.root).forEach(el=>{const target=this.mission.targets.find(t=>t.id===el.dataset.drop),matches=this.selected&&target.accept.includes(this.selected)&&!el.disabled;el.classList.toggle('ready',!!matches);el.setAttribute('aria-label',matches?words(T(`Put ${THINGS[this.selected].label.en} here`,`${THINGS[this.selected].label.hi} यहाँ रखो`)):words(target.label))});
  if(this.selected)this.message(T(`Now move it to the glowing box. Or tap the box.`,`अब चमकते डिब्बे तक ले जाओ। या डिब्बे पर टैप करो।`));
  if(this.selected){const target=this.mission.targets.find(t=>t.accept.includes(id)&&!this.doneIds.has(this.key(id,t.id)));this.guide.pointAt(target?$(`[data-drop="${target.id}"]`,this.root):null)}
 }
 clearSelection(){this.selected=null;$$('[data-card]',this.root).forEach(c=>{c.classList.remove('selected');c.setAttribute('aria-pressed','false')});$$('[data-drop]',this.root).forEach(c=>c.classList.remove('ready','over'))}
 accept(id,targetId,origin){
  if(!this.started||this.done)return false;const target=this.mission.targets.find(t=>t.id===targetId);
  if(!target||!target.accept.includes(id)||this.doneIds.has(this.key(id,targetId))){const correct=this.mission.targets.find(t=>t.accept.includes(id)&&!this.doneIds.has(this.key(id,t.id)));this.message(correct?T(`Try the ${correct.label.en} box. You can do it!`,`${correct.label.hi} वाले डिब्बे में रखो। तुम कर सकते हो!`):this.mission.task);this.glowCorrect(id);return false}
  const box=$(`[data-drop="${targetId}"]`,this.root),from=origin||this.motion.center($(`[data-card="${id}"]`,this.root)),to=this.motion.center(box);
  this.doneIds.add(this.key(id,targetId));if(this.mission.id==='color')this.color=THINGS[id].color;
  if(this.done)this.completed.add(this.mission.id);this.persist();this.clearSelection();this.stopDemo();
  this.drawMap(false);this.renderActivity();this.renderTargets();this.renderJourney();this.motion.deliver(picture(id),from,to);this.motion.receive($(`[data-drop="${targetId}"]`,this.root),{earned:this.done,at:to});this.motion.revealMap(this.world,id,THINGS[id]);this.message(this.done?this.mission.win:T('Nice! Keep going!','बहुत अच्छे! खेलते रहो!'));
  window.FX?.sound(this.done?'done':'good');this.root.classList.remove('jy-pop');void this.root.offsetWidth;this.root.classList.add('jy-pop');
  this.guide.celebrate();
  if(this.done){clearTimeout(this.idleTimer);$('[data-next]',this.root).focus({preventScroll:true})}else this.idle();return true;
 }
 click(e){
  if(e.target.closest('[data-start]'))return this.start();if(e.target.closest('[data-new]'))return this.restart();
  if(e.target.closest('[data-next]')){if(this.done)this.go(this.level+1);return}
  if(e.target.closest('[data-demo]'))return this.demo();if(e.target.closest('[data-read]'))return this.speak();
  if(e.target.closest('[data-replay]'))return this.restart();if(e.target.closest('[data-download]'))return this.download();
  const zoom=e.target.closest('[data-view]');if(zoom){if(zoom.dataset.view==='home')this.world.home(.6);else this.world.zoom(zoom.dataset.view==='in'?.8:1.25);return}
  const card=e.target.closest('[data-card]');if(card){if(this.ignoreClick)return;this.choose(card.dataset.card);return}
  const target=e.target.closest('[data-drop]');if(target&&!target.disabled){if(this.selected)this.accept(this.selected,target.dataset.drop);else this.message(T('First, choose a picture.','पहले एक तस्वीर चुनो।'))}
 }
 pointerDown(e){
  const card=e.target.closest('[data-card]');if(!card||card.disabled||this.done||e.button!==0||e.isPrimary===false)return;
  this.stopDemo();this.motion.resetHover();clearTimeout(this.idleTimer);this.drag={id:card.dataset.card,card,pointer:e.pointerId,x:e.clientX,y:e.clientY,moved:false};card.setPointerCapture(e.pointerId);
 }
 pointerMove(e){
  this.motion.hover(e);this.guide.lookAt(e.clientX,e.clientY);const d=this.drag;if(!d||d.pointer!==e.pointerId)return;if(!d.moved&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<7)return;
  if(!d.moved){d.moved=true;this.selected=null;this.choose(d.id);d.card.classList.add('in-hand');const ghost=$('.jy-ghost',this.root);ghost.innerHTML=picture(d.id)+`<b>${L(THINGS[d.id].label)}</b>`;ghost.classList.add('visible');this.root.classList.add('jy-dragging')}
  e.preventDefault();const ghost=$('.jy-ghost',this.root),turn=Math.max(-7,Math.min(7,(e.clientX-(d.lastX??e.clientX))*.45));ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';ghost.style.setProperty('--drag-turn',turn+'deg');d.lastX=e.clientX;const target=this.targetAt(e.clientX,e.clientY);$$('[data-drop]',this.root).forEach(t=>t.classList.toggle('over',t===target));
 }
 pointerUp(e){
  const d=this.drag;if(!d||d.pointer!==e.pointerId)return;const target=d.moved?this.targetAt(e.clientX,e.clientY):null;this.cancelDrag();
  if(d.moved){this.ignoreClick=true;setTimeout(()=>this.ignoreClick=false,200);const origin={x:e.clientX,y:e.clientY};if(target){if(!this.accept(d.id,target.dataset.drop,origin))this.motion.returnTo(picture(d.id),origin,d.card)}else{this.motion.returnTo(picture(d.id),origin,d.card);this.message(T('Nearly! Let go inside the glowing box.','बस थोड़ा और! चमकते डिब्बे के अंदर छोड़ो।'));this.glowCorrect(d.id)}}this.idle();
 }
 targetAt(x,y){return $$('[data-drop]:not(:disabled)',this.root).map(el=>{const r=el.getBoundingClientRect(),padding=16;return{el,r,d:Math.hypot(x-r.left-r.width/2,y-r.top-r.height/2),inside:x>=r.left-padding&&x<=r.right+padding&&y>=r.top-padding&&y<=r.bottom+padding}}).filter(t=>t.inside).sort((a,b)=>a.d-b.d)[0]?.el||null}
 cancelDrag(){const d=this.drag;this.drag=null;if(d){d.card.classList.remove('in-hand');try{if(d.card.hasPointerCapture(d.pointer))d.card.releasePointerCapture(d.pointer)}catch{}}$('.jy-ghost',this.root)?.classList.remove('visible');this.root.classList.remove('jy-dragging');$$('[data-drop]',this.root).forEach(t=>t.classList.remove('over'))}
 glowCorrect(id){$$('.jy-hint',this.root).forEach(el=>el.classList.remove('jy-hint'));const target=this.mission.targets.find(t=>t.accept.includes(id)&&!this.doneIds.has(this.key(id,t.id)));if(target)$(`[data-drop="${target.id}"]`,this.root)?.classList.add('jy-hint');$(`[data-card="${id}"]`,this.root)?.classList.add('jy-hint')}
 idle(){clearTimeout(this.idleTimer);if(!this.started||this.done)return;this.idleTimer=setTimeout(()=>{const id=this.nextCard();if(id)this.glowCorrect(id)},16000)}
 nextCard(){return this.mission.cards.find(id=>this.mission.repeat?this.mission.targets.some(t=>!this.doneIds.has(t.id)):!this.doneIds.has(id))}
 stopDemo(){this.demoToken++;$('.jy-ghost',this.root)?.classList.remove('visible','demo');$('.jy-ghost',this.root)?.getAnimations().forEach(a=>a.cancel())}
 async demo(){
  if(this.done||this.drag)return;this.stopDemo();const id=this.nextCard();if(!id)return;this.clearSelection();this.choose(id);this.glowCorrect(id);const target=this.mission.targets.find(t=>t.accept.includes(id)&&!this.doneIds.has(this.key(id,t.id))),card=$(`[data-card="${id}"]`,this.root),box=$(`[data-drop="${target.id}"]`,this.root);
  this.message(T('Watch the picture. Then you try!','तस्वीर को देखो। फिर तुम करके देखो!'));
  if(REDUCED)return;const token=this.demoToken,r=card.getBoundingClientRect(),b=box.getBoundingClientRect(),ghost=$('.jy-ghost',this.root);ghost.innerHTML=picture(id);ghost.style.left='0';ghost.style.top='0';ghost.classList.add('visible','demo');
  const animation=ghost.animate([{transform:`translate(${r.left+r.width/2-44}px,${r.top+r.height/2-44}px)`,opacity:.8},{transform:`translate(${b.left+b.width/2-44}px,${b.top+b.height/2-44}px)`,opacity:1}],{duration:1500,easing:'ease-in-out',fill:'forwards'});
  try{await animation.finished}catch{}if(token===this.demoToken){ghost.classList.remove('visible','demo');animation.cancel();this.message(T('Your turn! Move the picture to the glowing box.','अब तुम्हारी बारी! तस्वीर को चमकते डिब्बे में रखो।'))}
 }
 message(text){this.lastMessage=text;$('.jy-feedback',this.root).innerHTML=L(text)}
 speak(){
  if(!('speechSynthesis'in window))return;if(this.reading){this.stopSpeech();return}const m=this.mission,text=this.started&&!this.finished?`${words(m.title)}. ${words(m.task)}`:words(T('A map shows where places are. Help Bindu make a map.','नक्शा बताता है कि जगहें कहाँ हैं। बिंदु के साथ नक्शा बनाओ।'));
  const utterance=new SpeechSynthesisUtterance(text);utterance.lang=language()==='hi'?'hi-IN':'en-IN';utterance.rate=.83;const voice=speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith(language()));if(voice)utterance.voice=voice;
  this.reading=true;$('[data-read]',this.root)?.setAttribute('aria-pressed','true');utterance.onend=utterance.onerror=()=>{this.reading=false;$('[data-read]',this.root)?.setAttribute('aria-pressed','false')};speechSynthesis.speak(utterance);
 }
 stopSpeech(){if('speechSynthesis'in window)speechSynthesis.cancel();this.reading=false;$('[data-read]',this.root)?.setAttribute('aria-pressed','false')}
 relang(){this.stopSpeech();$$('[data-setlang]',this.root).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.setlang===language())));$$('[data-card]',this.root).forEach(c=>c.setAttribute('aria-label',words(THINGS[c.dataset.card].label)));if(this.started&&!this.finished)$$('[data-drop]',this.root).forEach(c=>c.setAttribute('aria-label',words(this.mission.targets.find(t=>t.id===c.dataset.drop).label)))}
 finish(){
  this.finished=true;this.level=7;this.doneIds=new Set(['map']);this.completed=new Set(MISSIONS.map(m=>m.id));this.persist();this.root.classList.remove('jy-placing');this.drawMap();$('#jyTargets',this.root).innerHTML='';this.world.home(REDUCED?.01:.8);this.renderJourney();this.guide.celebrate();
  $('.jy-activity',this.root).innerHTML=`<div class="jy-finish-stars">★ ★ ★</div><h1 class="jy-title" tabindex="-1">${L(T('You’re a Map Explorer!','तुम नक्शा खोजी हो!'))}</h1><p class="jy-instruction">${L(T('You helped Bindu make a map of Chhattisgarh.','तुमने बिंदु के साथ छत्तीसगढ़ का नक्शा बनाया।'))}</p><div class="jy-sticker-wall">${MISSIONS.map((m,i)=>`<span>★<small>${L(m.name)}</small></span>`).join('')}</div><p class="jy-learn">${L(T('Your map shows schools, a hospital, trees and a river.','तुम्हारे नक्शे में स्कूल, अस्पताल, पेड़ और नदी हैं।'))}</p><button class="jy-primary" data-download>↓ ${L(T('Keep my map','मेरा नक्शा रखो'))}</button><button class="jy-demo" data-replay>↺ ${L(T('Play again','फिर खेलो'))}</button><a class="jy-home-link" href="./">${L(T('Back to Ground Truth','ग्राउंड ट्रुथ पर वापस'))}</a>`;
  $('.jy-coach p',this.root).innerHTML=L(T('We made a map together!','हमने साथ मिलकर नक्शा बनाया!'));this.message(T('All 8 adventures complete. Well done!','सभी 8 खेल पूरे। शाबाश!'));$('.jy-title',this.root).focus({preventScroll:true});
 }
 download(){const source=new Image();source.onload=()=>{const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=1150;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff9ec';ctx.fillRect(0,0,1000,1150);ctx.fillStyle='#213e52';ctx.font='bold 52px sans-serif';ctx.textAlign='center';ctx.fillText(words(T('I am a Map Explorer!','मैं नक्शा खोजी हूँ!')),500,95);const scale=Math.min(920/source.width,800/source.height);ctx.drawImage(source,(1000-source.width*scale)/2,155,source.width*scale,source.height*scale);ctx.fillStyle='#c68c24';ctx.font='48px sans-serif';ctx.fillText('★ ★ ★ ★ ★ ★ ★ ★',500,1020);ctx.fillStyle='#213e52';ctx.font='28px sans-serif';ctx.fillText(words(T('My map of Chhattisgarh','मेरा छत्तीसगढ़ का नक्शा')),500,1090);const link=document.createElement('a');link.download='my-map-explorer.png';link.href=canvas.toDataURL('image/png');link.click()};source.src=this.world.snapshot()}
}
