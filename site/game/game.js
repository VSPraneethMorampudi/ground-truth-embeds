/* Ground Truth · the game. Eight levels follow one dataset from the departments to the live map:
   collect → sort → pinpoint → merge → publish → field → cartography → maintain.
   Every level can be played (click, drag, tap) or watched (auto(): the guide solves it). */
import {World,P} from "./world.js";

const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const L2=o=>`<span lang="en">${o.en}</span><span lang="hi">${o.hi}</span>`;
const T=(en,hi)=>({en,hi});
const lang=()=>document.documentElement.dataset.lang||"en";
const REDUCE=matchMedia("(prefers-reduced-motion:reduce)").matches;

/* district names in Hindi */
const HI={"Balod":"बालोद","Balodabazar-Bhatapara":"बलौदाबाज़ार-भाटापारा","Balrampur-Ramanujganj":"बलरामपुर-रामानुजगंज","Bastar":"बस्तर","Bemetara":"बेमेतरा","Bijapur":"बीजापुर","Bilaspur":"बिलासपुर","Dantewada":"दंतेवाड़ा","Dhamtari":"धमतरी","Durg":"दुर्ग","Gariyaband":"गरियाबंद","Gaurela-Pendra-Marwahi":"गौरेला-पेंड्रा-मरवाही","Janjgir-Champa":"जांजगीर-चांपा","Jashpur":"जशपुर","Kabirdham":"कबीरधाम","Kanker":"कांकेर","Khairagarh-Chhuikhadan-Gandai":"खैरागढ़-छुईखदान-गंडई","Kondagaon":"कोंडागांव","Korba":"कोरबा","Koriya":"कोरिया","Mahasamund":"महासमुंद","Manendragarh-Chirmiri-Bharatpur":"मनेंद्रगढ़-चिरमिरी-भरतपुर","Mohla-Manpur-Ambagarh Chowki":"मोहला-मानपुर-अंबागढ़ चौकी","Mungeli":"मुंगेली","Narayanpur":"नारायणपुर","Raigarh":"रायगढ़","Raipur":"रायपुर","Rajnandgaon":"राजनांदगांव","Sakti":"सक्ती","Sarangarh-Bilaigarh":"सारंगढ़-बिलाईगढ़","Sarguja":"सरगुजा","Sukma":"सुकमा","Surajpur":"सूरजपुर"};
const DN=n=>T(n,HI[n]||n);

/* ---------------- the guide ---------------- */
const BUDDY=`<svg viewBox="0 0 80 96" aria-hidden="true"><defs><linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e46a35"/><stop offset="1" stop-color="#c24f22"/></linearGradient></defs>
  <ellipse cx="40" cy="91" rx="16" ry="4" fill="rgba(0,0,0,.15)"/>
  <path d="M40 88C40 88 10 56 10 36a30 30 0 0 1 60 0c0 20-30 52-30 52z" fill="url(#bg1)"/>
  <circle cx="40" cy="36" r="20" fill="#fbf8f2"/>
  <g class="eyes"><ellipse cx="33" cy="34" rx="3.2" ry="4.2" fill="#1d1c21"/><ellipse cx="47" cy="34" rx="3.2" ry="4.2" fill="#1d1c21"/></g>
  <path d="M33 44q7 6 14 0" stroke="#1d1c21" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <circle cx="27" cy="42" r="3" fill="#f6a98a" opacity=".7"/><circle cx="53" cy="42" r="3" fill="#f6a98a" opacity=".7"/></svg>`;

const BADGES=[
  {id:"collect",n:T("Archivist","अभिलेखपाल"),i:"📥"},{id:"sort",n:T("Sorter","छँटाई विशेषज्ञ"),i:"🗂️"},{id:"pin",n:T("Pinpoint","सटीक निशाना"),i:"📍"},
  {id:"merge",n:T("Librarian","पुस्तकालयाध्यक्ष"),i:"📚"},{id:"publish",n:T("Publisher","प्रकाशक"),i:"🌐"},{id:"field",n:T("Field ranger","फ़ील्ड रेंजर"),i:"📱"},
  {id:"carto",n:T("Cartographer","मानचित्रकार"),i:"🎨"},{id:"maintain",n:T("Guardian","संरक्षक"),i:"🛡️"}];

export class Game{
  constructor(root,{onLock,onUnlock,onFinish}={}){
    this.root=root;this.onLock=onLock;this.onUnlock=onUnlock;this.onFinish=onFinish;
    this.ok=0;this.bad=0;this.badges=new Set();this.lv=-1;this.watch=false;this.paused=false;this.t0=0;
    root.innerHTML=`<div class="g-world" id="gWorld"></div><div class="g-labels" id="gLabels"></div>
      <div class="g-hud"><ol class="g-levels" id="gLevels"></ol>
        <div class="g-q"><span>${L2(T("Data quality","डेटा गुणवत्ता"))}</span><b id="gQ">—</b></div>
        <div class="g-bad" id="gBadges"></div>
        <button class="g-exit" id="gExit">${L2(T("Exit game","खेल से बाहर"))} ↓</button></div>
      <aside class="g-panel" id="gPanel" aria-live="polite"></aside>
      <div class="g-buddy" id="gBuddy">${BUDDY}<div class="g-say" id="gSay"></div></div>
      <div class="g-zoom"><button data-z="in" aria-label="Zoom in">+</button><button data-z="out" aria-label="Zoom out">−</button><button data-z="home" aria-label="Reset view">⟲</button></div>
      <div class="g-tip" id="gTip"></div><div class="g-pop" id="gPop"></div><div class="g-ghost" id="gGhost"></div>
      <div class="g-start" id="gStart"><div class="g-start-in">
        <p class="label">${L2(T("Play · 8 levels","खेलें · 8 स्तर"))}</p>
        <h2>${L2(T("Build the state map","राज्य का नक्शा बनाइए"))}</h2>
        <p class="g-start-sub">${L2(T("Data arrives from every department. Sort it, fix it, merge it into one map, open it to everyone and keep it true. About six minutes, or watch it play in three.","हर विभाग से डेटा आता है। उसे छाँटिए, सुधारिए, एक नक्शे में जोड़िए, सबके लिए खोलिए और सच्चा बनाए रखिए। लगभग छह मिनट, या तीन मिनट में चलता हुआ देखें।"))}</p>
        <div class="g-start-b"><button class="btn" id="gPlay" data-magnet>▶ ${L2(T("Start playing","खेलना शुरू करें"))}</button><button class="btn ghost" id="gWatch" data-magnet>${L2(T("Watch it play · 3 min","चलता हुआ देखें · 3 मिनट"))}</button></div>
        <p class="g-note">${L2(T("Real: the 33 district boundaries, rivers, roads and rail. Illustrative: the centres, records and updates.","असली: 33 ज़िलों की सीमाएँ, नदियाँ, सड़कें और रेल। उदाहरण: केंद्र, रिकॉर्ड और अपडेट।"))}</p></div></div>`;
    this.world=new World($("#gWorld",root),$("#gLabels",root));
    this.world.hoverCb=(rec,e)=>this.hover(rec,e);
    this.world.home(0);
    $("#gLevels",root).innerHTML=LEVELS.map((l,i)=>`<li data-i="${i}"><b>${i+1}</b><span>${L2(l.name)}</span></li>`).join("");
    $("#gPlay",root).onclick=()=>this.start(false);
    $("#gWatch",root).onclick=()=>this.start(true);
    $("#gExit",root).onclick=()=>this.exit();
    root.addEventListener("click",e=>{const z=e.target.closest("[data-z]");if(!z)return;const w=this.world;z.dataset.z==="in"?w.zoom(.75):z.dataset.z==="out"?w.zoom(1.33):w.home(.8)});
    this.renderBadges();
  }
  /* ---------- flow ---------- */
  start(watch){this.watch=watch;this.paused=false;this.t0=performance.now();this.root.classList.add("playing");$("#gStart",this.root).classList.add("gone");
    this.world.controls.enableZoom=true;this.onLock&&this.onLock();this.go(0)}
  exit(){this.root.classList.remove("playing");this.world.controls.enableZoom=false;this.watch=false;this.onUnlock&&this.onUnlock()}
  async go(i){if(this.lv>=0&&LEVELS[this.lv].leave)await LEVELS[this.lv].leave(this);
    this.lv=i;this.done=false;const L=LEVELS[i];this.token=(this.token||0)+1;
    $$("#gLevels li",this.root).forEach((li,j)=>{li.classList.toggle("on",j===i);li.classList.toggle("done",j<i)});
    if(!L){return this.finish()}
    const p=$("#gPanel",this.root);
    p.innerHTML=`<div class="lv-k">${L2(T("Level","स्तर"))} ${i+1}/${LEVELS.length} · ${L2(L.chapter)}</div><h3>${L2(L.title)}</h3><p class="lv-task">${L2(L.task)}</p>
      <div class="lv-body"></div><div class="lv-act"><button class="lv-show">${L2(T("Show me","दिखाइए"))}</button><button class="lv-next btn" disabled>${L2(T("Next level","अगला स्तर"))} →</button></div>`;
    p.classList.remove("in");void p.offsetWidth;p.classList.add("in");
    $(".lv-show",p).onclick=()=>this.autoRun();
    $(".lv-next",p).onclick=()=>this.go(i+1);
    this.say(L.say);
    await L.enter(this,$(".lv-body",p));
    if(this.watch)this.autoRun();}
  async autoRun(){const L=LEVELS[this.lv],tk=this.token;if(!L||this.done||this.autoTok===tk)return;this.autoTok=tk;$(".lv-show",this.root)?.setAttribute("disabled","");
    await this.wait(this.watch?1400:200);if(tk!==this.token)return;await L.auto(this,tk)}
  complete(){if(this.done)return;this.done=true;const L=LEVELS[this.lv],tk=this.token;
    this.badge(L.badge);const n=$(".lv-next",this.root);if(n){n.disabled=false;n.classList.add("pulse")}
    $(".lv-show",this.root)?.setAttribute("disabled","");
    if(L.win)this.say(L.win);
    if(this.watch)this.wait(L.hold||2200).then(()=>{if(tk===this.token&&this.watch)this.go(this.lv+1)})}
  async finish(){const w=this.world,p=$("#gPanel",this.root),secs=Math.round((performance.now()-this.t0)/1000);
    w.home(2);w.autoRotate(true);
    const q=this.quality();
    p.innerHTML=`<div class="lv-k">${L2(T("Complete","पूर्ण"))}</div><h3>${L2(T("Ground truth, built.","ज़मीनी सच्चाई, तैयार।"))}</h3>
      <div class="end-stats"><div><b>${q}</b><span>${L2(T("data quality","डेटा गुणवत्ता"))}</span></div><div><b>${this.badges.size}/8</b><span>${L2(T("badges","बैज"))}</span></div><div><b>${Math.floor(secs/60)}:${String(secs%60).padStart(2,"0")}</b><span>${L2(T("time","समय"))}</span></div></div>
      <p class="lv-task">${L2(T("Data is created, stored safely, shared through the portal, checked in the field, turned into clear maps and kept up to date. Then the cycle begins again.","डेटा बनता है, सुरक्षित रखा जाता है, पोर्टल से साझा होता है, मैदान में जाँचा जाता है, साफ़ नक्शों में ढलता है और अद्यतन रखा जाता है। फिर चक्र दोबारा शुरू होता है।"))}</p>
      <div class="lv-act col"><button class="btn" id="gCard">⤓ ${L2(T("Download your map card","अपना मैप कार्ड डाउनलोड करें"))}</button>
      <button class="lv-show" id="gAgain">↺ ${L2(T("Play again","फिर से खेलें"))}</button><button class="lv-show" id="gOut">${L2(T("Continue the story","कहानी आगे देखें"))} ↓</button></div>`;
    $("#gCard",p).onclick=()=>this.card();$("#gAgain",p).onclick=()=>location.reload();$("#gOut",p).onclick=()=>{this.exit();this.onFinish&&this.onFinish(true)};
    this.say(T("The map listens to the ground, and the ground benefits from the map. Thank you for building it with me!","नक्शा ज़मीन की सुनता है, और ज़मीन को नक्शे से लाभ मिलता है। मेरे साथ इसे बनाने के लिए धन्यवाद!"));
    if(this.watch)this.wait(5000).then(()=>{if(this.watch){this.exit();this.onFinish&&this.onFinish(false)}})}
  /* ---------- helpers ---------- */
  wait(ms){return new Promise(r=>{const t0=performance.now();let acc=0,last=t0;const tick=n=>{if(!this.paused)acc+=n-last;last=n;acc>=ms?r():requestAnimationFrame(tick)};requestAnimationFrame(tick)})}
  setPaused(v){this.paused=v;this.root.classList.toggle("paused",v)}
  good(n=1){this.ok+=n;this.q()}
  oops(){this.bad++;this.q();this.root.classList.remove("shake");void this.root.offsetWidth;this.root.classList.add("shake")}
  quality(){const t=this.ok+this.bad;return t?Math.round(100*this.ok/t)+"%":"—"}
  q(){$("#gQ",this.root).textContent=this.quality()}
  say(o){const el=$("#gSay",this.root),b=$("#gBuddy",this.root);this.lastSay=o;el.innerHTML=L2(o);b.classList.remove("talk");void b.offsetWidth;b.classList.add("talk");
    if(REDUCE)return;const span=$(`[lang="${lang()}"]`,el);if(!span)return;const full=span.textContent;span.textContent=full.slice(0,2);let i=2;clearInterval(this.typer);
    this.typer=setInterval(()=>{i+=2;span.textContent=full.slice(0,i);if(i>=full.length)clearInterval(this.typer)},16)}
  relang(){if(this.lastSay){const el=$("#gSay",this.root);el.innerHTML=L2(this.lastSay)}}
  badge(id){if(this.badges.has(id))return;this.badges.add(id);const b=BADGES.find(x=>x.id===id),pop=$("#gPop",this.root);
    pop.innerHTML=`<div class="pop"><i>${b.i}</i><small>${L2(T("Badge earned","बैज मिला"))}</small><b>${L2(b.n)}</b></div>`;pop.classList.remove("show");void pop.offsetWidth;pop.classList.add("show");this.renderBadges()}
  renderBadges(){$("#gBadges",this.root).innerHTML=BADGES.map(b=>`<i class="${this.badges.has(b.id)?"got":""}" title="${b.n.en}">${b.i}</i>`).join("")}
  hover(rec,e){const tip=$("#gTip",this.root);if(!rec){tip.classList.remove("show");return}
    const r=this.root.getBoundingClientRect();tip.innerHTML=L2(DN(rec.name));tip.style.transform=`translate(${e.clientX-r.left+14}px,${e.clientY-r.top+14}px)`;tip.classList.add("show")}
  /* drag a DOM card onto the 3D world (or tap card, then tap map) */
  dragToMap(card,onDrop){const gh=$("#gGhost",this.root);let sel=false;
    const drop=(x,y)=>{const h=this.world.pick(x,y);onDrop(h)};
    card.addEventListener("pointerdown",e=>{if(this.done)return;e.preventDefault();const r=this.root.getBoundingClientRect();
      gh.innerHTML=card.querySelector(".pin-h").outerHTML;gh.classList.add("show");const mv=ev=>{gh.style.transform=`translate(${ev.clientX-r.left}px,${ev.clientY-r.top}px)`};mv(e);
      const up=ev=>{removeEventListener("pointermove",mv);removeEventListener("pointerup",up);gh.classList.remove("show");
        const moved=Math.hypot(ev.clientX-e.clientX,ev.clientY-e.clientY)>8;
        if(moved)drop(ev.clientX,ev.clientY);else{$$(".pinc",this.root).forEach(c=>c.classList.remove("sel"));card.classList.add("sel");this.armed=(x,y)=>{card.classList.remove("sel");drop(x,y)}}};
      addEventListener("pointermove",mv);addEventListener("pointerup",up)})}
  armMapTap(){const cv=this.world.renderer.domElement;let d0=null;
    cv.addEventListener("pointerdown",e=>d0=[e.clientX,e.clientY]);
    cv.addEventListener("pointerup",e=>{if(!d0||Math.hypot(e.clientX-d0[0],e.clientY-d0[1])>6)return;if(this.armed){const f=this.armed;this.armed=null;f(e.clientX,e.clientY)}else if(this.mapTap)this.mapTap(e.clientX,e.clientY)})}
  /* map card for sharing */
  card(){const w=this.world,img=new Image();img.onload=()=>{const W=1200,H=1500,c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");
      x.fillStyle="#f3efe6";x.fillRect(0,0,W,H);const s=Math.min(W/img.width,1100/img.height);x.drawImage(img,(W-img.width*s)/2,170,img.width*s,img.height*s);
      x.fillStyle="#c95d2e";x.font="500 26px 'JetBrains Mono',monospace";x.fillText("CHHATTISGARH STATE GEOPORTAL",70,90);
      x.fillStyle="#1d1c21";x.font="400 92px 'Instrument Serif',Georgia,serif";x.fillText(lang()==="hi"?"ज़मीनी सच्चाई":"Ground Truth",66,150+0);
      x.font="500 34px 'Inter Tight',sans-serif";x.fillText((lang()==="hi"?"डेटा गुणवत्ता ":"Data quality ")+this.quality()+"   ·   "+this.badges.size+"/8 "+(lang()==="hi"?"बैज":"badges"),70,1340);
      x.fillStyle="#5b5752";x.font="400 26px 'Inter Tight',sans-serif";x.fillText(lang()==="hi"?"मैंने राज्य का नक्शा बनाया: 33 ज़िले, एक भरोसेमंद नक्शा।":"I built the state map: 33 districts, one trusted map.",70,1395);
      x.fillText(new Date().toLocaleDateString(lang()==="hi"?"hi-IN":"en-IN",{day:"numeric",month:"long",year:"numeric"}),70,1440);
      const a=document.createElement("a");a.download="ground-truth-map-card.png";a.href=c.toDataURL("image/png");a.click()};img.src=w.snapshot()}
}

/* ---------------- shared bits ---------------- */
const FILES=[
  {d:T("Revenue","राजस्व"),f:T("Shapefile","शेपफ़ाइल"),c:T("District boundaries","ज़िलों की सीमाएँ"),k:"bound",col:"#7a5c3a"},
  {d:T("Water Resources","जल संसाधन"),f:T("KML","KML"),c:T("Rivers","नदियाँ"),k:"rivers",col:"#3c8fd6"},
  {d:T("Public Works","लोक निर्माण"),f:T("CAD drawing","CAD ड्रॉइंग"),c:T("Roads","सड़कें"),k:"roads",col:"#d2733c"},
  {d:T("Railways","रेलवे"),f:T("Paper map (scan)","कागज़ी नक्शा (स्कैन)"),c:T("Rail lines","रेल लाइनें"),k:"rail",col:"#3a383d"},
  {d:T("Education","शिक्षा"),f:T("Excel","एक्सेल"),c:T("Schools","स्कूल"),k:"school",col:"#2f6fd6"},
  {d:T("Health","स्वास्थ्य"),f:T("Excel","एक्सेल"),c:T("Health centres","स्वास्थ्य केंद्र"),k:"health",col:"#d2423a"},
  {d:T("Women & Child Dev.","महिला एवं बाल विकास"),f:T("Paper register","कागज़ी रजिस्टर"),c:T("Anganwadi centres","आंगनवाड़ी केंद्र"),k:"anganwadi",col:"#e39a1f"},
  {d:T("Forest","वन"),f:T("Paper map","कागज़ी नक्शा"),c:T("Forest cover","वन आवरण"),k:"forest",col:"#5f8f4e"}];
const shuffle=(a,s=7)=>{a=[...a];for(let i=a.length-1;i>0;i--){s=s*16807%2147483647;const j=s%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
/* fly a DOM element's clone to a target element */
function flyEl(el,to,root,{dur=.55,remove=true}={}){const a=el.getBoundingClientRect(),b=to.getBoundingClientRect(),r=root.getBoundingClientRect();
  const c=el.cloneNode(true);c.classList.add("flying");Object.assign(c.style,{left:a.left-r.left+"px",top:a.top-r.top+"px",width:a.width+"px",height:a.height+"px"});root.appendChild(c);
  if(remove)el.classList.add("gone");
  return new Promise(res=>{requestAnimationFrame(()=>{c.style.transition=`transform ${dur}s cubic-bezier(.6,-.2,.3,1),opacity ${dur}s`;
    c.style.transform=`translate(${b.left+b.width/2-(a.left+a.width/2)}px,${b.top+b.height/2-(a.top+a.height/2)}px) scale(.25)`;c.style.opacity=".2"});
    setTimeout(()=>{c.remove();res()},dur*1000)})}

/* ---------------- levels ---------------- */
const LEVELS=[
/* 1 · COLLECT */
{id:"collect",badge:"collect",name:T("Collect","संग्रह"),chapter:T("Data creation","डेटा निर्माण"),
 title:T("Departments are sending their data","विभाग अपना डेटा भेज रहे हैं"),
 task:T("Click each file to bring it into the inbox. Boundaries first make a good frame!","हर फ़ाइल पर क्लिक करके उसे इनबॉक्स में लाएँ। पहले सीमाएँ लाना अच्छा रहेगा!"),
 say:T("Hi, I'm Bindu, a map pin! For years Chhattisgarh's map lived in paper sheets, registers and spreadsheets, spread across departments. Let's bring it all in.","नमस्ते, मैं बिंदु हूँ, एक मैप पिन! वर्षों तक छत्तीसगढ़ का नक्शा कागज़ी शीटों, रजिस्टरों और स्प्रेडशीट में, अलग-अलग विभागों में बिखरा रहा। चलिए, सब एक जगह लाते हैं।"),
 win:T("Eight departments, eight formats. Precious, like an old family album, but not organised yet.","आठ विभाग, आठ प्रारूप। पुराने पारिवारिक एल्बम जैसा अनमोल, पर अभी बिखरा हुआ।"),
 async enter(g,body){g.world.home(1.2);
   body.innerHTML=`<div class="files">${FILES.map((f,i)=>`<button class="file" data-i="${i}" style="--c:${f.col};--d:${(i%4)*.4}s"><i>${L2(f.f)}</i><b>${L2(f.d)}</b><span>${L2(f.c)}</span></button>`).join("")}</div>
     <div class="tray"><span>${L2(T("Inbox","इनबॉक्स"))}</span><b class="tray-n">0/${FILES.length}</b></div>`;
   let n=0;const tray=$(".tray",body);
   this.take=async(btn)=>{if(btn.classList.contains("gone"))return;const f=FILES[+btn.dataset.i];await flyEl(btn,tray,g.root);n++;$(".tray-n",body).textContent=`${n}/${FILES.length}`;tray.classList.remove("bump");void tray.offsetWidth;tray.classList.add("bump");g.good();
     if(f.k==="bound"){g.say(T("Boundaries from Revenue: the frame every other layer sits in. Watch the 33 districts drop in.","राजस्व से सीमाएँ: वह ढाँचा जिसमें बाकी हर परत बैठती है। 33 ज़िलों को आते देखिए।"));g.world.dropDistricts()}
     if(n===FILES.length){if(!g.world.districts[0].group.visible)g.world.dropDistricts();g.complete()}};
   $$(".file",body).forEach(b=>b.onclick=()=>this.take(b))},
 async auto(g,tk){const order=[0,1,2,3,4,5,6,7];for(const i of order){if(tk!==g.token)return;const b=$(`.file[data-i="${i}"]`,g.root);if(b&&!b.classList.contains("gone")){await this.take(b);await g.wait(i===0?1400:420)}}}},

/* 2 · SORT */
{id:"sort",badge:"sort",name:T("Sort","छँटाई"),chapter:T("Conversion","रूपांतरण"),
 title:T("Give every record a shape and a shelf","हर रिकॉर्ड को आकार और जगह दें"),
 task:T("Drag each record onto its layer (or tap the record, then the layer). Anything broken goes to Fix.","हर रिकॉर्ड को उसकी परत पर खींचें (या रिकॉर्ड, फिर परत पर टैप करें)। जो टूटा है वह 'सुधारें' में जाए।"),
 say:T("Converting old records means giving each one a shape, a point, a line or an outline, and a home layer. Careful: three of these are broken.","पुराने रिकॉर्ड को बदलने का मतलब है हर एक को आकार देना, बिंदु, रेखा या रूपरेखा, और उसकी परत। ध्यान दें: इनमें तीन टूटे हुए हैं।"),
 win:T("Sorted! Tracing a drawing onto a computer so it can be zoomed, searched and shared: that's digitisation.","छँट गया! चित्र को कंप्यूटर पर उतारना ताकि उसे ज़ूम, खोज और साझा किया जा सके: यही अंकीयकरण है।"),
 async enter(g,body){g.world.fly([0,84,80],[0,0,4],1.4);
   const BINS=[{k:"bound",n:T("Boundaries","सीमाएँ"),s:"▢"},{k:"water",n:T("Water","जल"),s:"〰"},{k:"move",n:T("Roads & rail","सड़क और रेल"),s:"═"},{k:"fac",n:T("Facilities","सुविधाएँ"),s:"●"},{k:"fix",n:T("Fix","सुधारें"),s:"⚠"}];
   const REC=[{t:T("Raipur district boundary","रायपुर ज़िला सीमा"),k:"bound"},{t:T("Mahanadi river","महानदी"),k:"water"},{t:T("Govt. Primary School, Mana","शासकीय प्राथमिक शाला, माना"),k:"fac"},
     {t:T("School: latitude and longitude swapped","स्कूल: अक्षांश और देशांतर उलटे"),k:"fix"},{t:T("Highway, Raipur to Jagdalpur","राजमार्ग, रायपुर से जगदलपुर"),k:"move"},{t:T("Bastar district boundary","बस्तर ज़िला सीमा"),k:"bound"},
     {t:T("Indravati river","इंद्रावती नदी"),k:"water"},{t:T("Anganwadi: location blank (0°, 0°)","आंगनवाड़ी: स्थान खाली (0°, 0°)"),k:"fix"},{t:T("Primary Health Centre, Abhanpur","प्राथमिक स्वास्थ्य केंद्र, अभनपुर"),k:"fac"},
     {t:T("Rail line, Bilaspur to Raipur","रेल लाइन, बिलासपुर से रायपुर"),k:"move"},{t:T("Health centre: no projection file (.prj)","स्वास्थ्य केंद्र: प्रोजेक्शन फ़ाइल (.prj) नहीं"),k:"fix"},{t:T("Anganwadi AWC-RPR-00412","आंगनवाड़ी AWC-RPR-00412"),k:"fac"}];
   const HINT={bound:T("Outlines of areas go to Boundaries.","क्षेत्रों की रूपरेखा 'सीमाएँ' में जाती है।"),water:T("Rivers are lines on the Water layer.","नदियाँ 'जल' परत पर रेखाएँ हैं।"),move:T("Roads and rail are lines on Roads & rail.","सड़क और रेल 'सड़क और रेल' पर रेखाएँ हैं।"),fac:T("A building is a point on Facilities.","भवन 'सुविधाएँ' पर एक बिंदु है।"),fix:T("Look again: that record has a problem. It goes to Fix.","फिर देखें: उस रिकॉर्ड में समस्या है। वह 'सुधारें' में जाएगा।")};
   body.innerHTML=`<div class="recs">${REC.map((r,i)=>`<button class="rec" data-i="${i}" data-k="${r.k}">${L2(r.t)}</button>`).join("")}</div>
     <div class="bins">${BINS.map(b=>`<div class="bin" data-k="${b.k}"><i>${b.s}</i><b>${L2(b.n)}</b><em>0</em></div>`).join("")}</div>`;
   let left=REC.length,sel=null;const gh=$("#gGhost",g.root);
   const put=async(card,bin)=>{const k=card.dataset.k;if(bin.dataset.k!==k){g.oops();card.classList.remove("wob");void card.offsetWidth;card.classList.add("wob");g.say(HINT[k]);return false}
     await flyEl(card,bin,g.root,{dur:.4});const em=$("em",bin);em.textContent=+em.textContent+1;bin.classList.remove("bump");void bin.offsetWidth;bin.classList.add("bump");g.good();
     if(--left===0)g.complete();return true};
   this.put=put;
   $$(".rec",body).forEach(card=>{card.addEventListener("pointerdown",e=>{if(card.classList.contains("gone"))return;e.preventDefault();const r=g.root.getBoundingClientRect();
     gh.innerHTML=`<div class="rec">${card.innerHTML}</div>`;gh.classList.add("show");const mv=ev=>{gh.style.transform=`translate(${ev.clientX-r.left}px,${ev.clientY-r.top}px)`;$$(".bin",body).forEach(b=>b.classList.toggle("hov",b===document.elementFromPoint(ev.clientX,ev.clientY)?.closest(".bin")))};mv(e);
     const up=ev=>{removeEventListener("pointermove",mv);removeEventListener("pointerup",up);gh.classList.remove("show");$$(".bin",body).forEach(b=>b.classList.remove("hov"));
       const bin=document.elementFromPoint(ev.clientX,ev.clientY)?.closest(".bin");
       if(bin&&Math.hypot(ev.clientX-e.clientX,ev.clientY-e.clientY)>8)put(card,bin);else{$$(".rec",body).forEach(c=>c.classList.remove("sel"));card.classList.add("sel");sel=card}};
     addEventListener("pointermove",mv);addEventListener("pointerup",up)})});
   $$(".bin",body).forEach(bin=>bin.addEventListener("click",()=>{if(sel){const c=sel;sel=null;c.classList.remove("sel");put(c,bin)}}))},
 async auto(g,tk){for(const card of $$(".rec:not(.gone)",g.root)){if(tk!==g.token)return;await this.put(card,$(`.bin[data-k="${card.dataset.k}"]`,g.root));await g.wait(230)}}},

/* 3 · PINPOINT */
{id:"pin",badge:"pin",name:T("Pinpoint","सटीक स्थान"),chapter:T("Georeferencing","भू-संदर्भ"),
 title:T("Put the lost records back on the ground","भटके रिकॉर्ड को ज़मीन पर वापस रखें"),
 task:T("Three broken records landed far away. Drag each pin onto its district (or tap the pin, then the district).","तीन टूटे रिकॉर्ड बहुत दूर जा गिरे। हर पिन को उसके ज़िले पर खींचें (या पिन, फिर ज़िले पर टैप करें)।"),
 say:T("Swapped latitude and longitude sends a school about 7,200 km north. A blank location drops it at 0°, 0°, in the ocean. Every shape must sit on its true spot.","अक्षांश-देशांतर उलटने से स्कूल लगभग 7,200 किमी उत्तर पहुँच जाता है। खाली स्थान उसे 0°, 0° पर, समुद्र में गिरा देता है। हर आकृति अपनी सही जगह होनी चाहिए।"),
 win:T("Every record is back on its true spot, lined up with satellite images and every other layer.","हर रिकॉर्ड अपनी सही जगह लौट आया, उपग्रह चित्रों और बाकी हर परत के साथ।"),
 async enter(g,body){const w=g.world;w.showDistrictsNow();w.home(1.4);
   const R=[{t:T("School, Mana","स्कूल, माना"),d:"Raipur",ll:[81.72,21.18],e:T("≈ 7,200 km north · lat/long swapped","≈ 7,200 किमी उत्तर · अक्षांश/देशांतर उलटे"),at:[-14,9,-40]},
            {t:T("Anganwadi AWC-BST-00118","आंगनवाड़ी AWC-BST-00118"),d:"Bastar",ll:[81.95,19.15],e:T("≈ 9,100 km west · blank = 0°, 0°","≈ 9,100 किमी पश्चिम · खाली = 0°, 0°"),at:[-38,9,14]},
            {t:T("Health centre, Pathalgaon","स्वास्थ्य केंद्र, पत्थलगांव"),d:"Jashpur",ll:[83.46,22.56],e:T("off the map · no .prj","नक्शे से बाहर · .prj नहीं"),at:[30,9,-30]}];
   this.R=R;let left=R.length;
   R.forEach(r=>{r.pin=w.addPin([82,21],0xd2423a,{bob:true,big:1.3});w.pinAt(r.pin,...r.at);r.lab=w.label(`<b>${L2(r.t)}</b><span>${L2(r.e)}</span>`,[r.at[0],r.at[1]+4,r.at[2]],"lost")});
   body.innerHTML=`<div class="pins">${R.map((r,i)=>`<div class="pinc" data-i="${i}"><span class="pin-h">📍</span><div><b>${L2(r.t)}</b><span>${L2(T("belongs in","यहाँ का है:"))} <em>${L2(DN(r.d))}</em></span><small>${L2(r.e)}</small></div></div>`).join("")}</div>`;
   const place=async(i)=>{const r=R[i],card=$(`.pinc[data-i="${i}"]`,body);if(card.classList.contains("ok"))return;card.classList.add("ok");w.unlabel(r.lab);
     await w.movePin(r.pin,r.ll,1);w.pinColor(r.pin,0x2e9b5a);w.highlight(r.d,0x2e9b5a);setTimeout(()=>w.highlight(null),900);g.good();
     if(--left===0)g.complete()};
   this.place=place;
   $$(".pinc",body).forEach(card=>g.dragToMap(card,h=>{const r=R[+card.dataset.i];
     if(h&&h.rec.name===r.d)place(+card.dataset.i);
     else{g.oops();if(h)w.highlight(h.rec.name,0xd2423a);setTimeout(()=>w.highlight(r.d,0x2e9b5a),500);setTimeout(()=>w.highlight(null),2200);
       g.say(T(`Not quite. ${r.t.en} is in ${r.d}: look for the glowing district.`,`थोड़ा चूक गए। ${r.t.hi} ${HI[r.d]} में है: चमकता ज़िला देखें।`))}}));
   if(!g._tapArmed){g._tapArmed=true;g.armMapTap()}},
 async auto(g,tk){for(let i=0;i<3;i++){if(tk!==g.token)return;await this.place(i);await g.wait(500)}},
 leave(g){(this.R||[]).forEach(r=>{g.world.unlabel(r.lab);g.world.removePin(r.pin)})}},

/* 4 · MERGE */
{id:"merge",badge:"merge",name:T("Merge","विलय"),chapter:T("Geodatabase","भू-डेटाबेस"),
 title:T("Stack the layers into one geodatabase","परतों को एक भू-डेटाबेस में जमाएँ"),
 task:T("Boundaries are at the bottom. Tap the other layers from the bottom up: areas first, then lines, then points.","सीमाएँ सबसे नीचे हैं। बाकी परतें नीचे से ऊपर टैप करें: पहले क्षेत्र, फिर रेखाएँ, फिर बिंदु।"),
 say:T("A geodatabase is one safe home for every layer. It stores each fact and where it sits on the earth, in an order that keeps the map readable.","भू-डेटाबेस हर परत का एक सुरक्षित घर है। यह हर तथ्य और पृथ्वी पर उसकी जगह को ऐसे क्रम में रखता है कि नक्शा पढ़ने योग्य रहे।"),
 win:T("One home, one copy. The geodatabase also checks every record at the door: inside its boundary, clean geometry, no blank fields.","एक घर, एक प्रति। भू-डेटाबेस हर रिकॉर्ड को दरवाज़े पर जाँचता भी है: सीमा के भीतर, साफ़ ज्यामिति, कोई खाली फ़ील्ड नहीं।"),
 async enter(g,body){const w=g.world;w.showDistrictsNow();w.fly([0,74,86],[0,2,4],1.4);
   const S=[{k:"forest",n:T("Forest cover","वन आवरण"),t:T("area","क्षेत्र"),r:1},{k:"rivers",n:T("Rivers","नदियाँ"),t:T("line","रेखा"),r:2},{k:"move",n:T("Roads & rail","सड़क और रेल"),t:T("line","रेखा"),r:2},{k:"fac",n:T("Facilities","सुविधाएँ"),t:T("point","बिंदु"),r:3}];
   body.innerHTML=`<div class="stackui"><div class="sheets">${shuffle(S,3).map(s=>`<button class="sheet" data-k="${s.k}" data-r="${s.r}"><b>${L2(s.n)}</b><i>${L2(s.t)}</i></button>`).join("")}</div>
     <ol class="tower"><li class="base"><b>${L2(T("Boundaries","सीमाएँ"))}</b><i>${L2(T("area","क्षेत्र"))}</i></li></ol>
     <div class="gate"><span>${L2(T("Rules at the door","प्रवेश पर नियम"))}</span><em>✓ ${L2(T("inside its boundary","सीमा के भीतर"))}</em><em>✓ ${L2(T("clean geometry","साफ़ ज्यामिति"))}</em><em>✓ ${L2(T("no blank fields","कोई खाली फ़ील्ड नहीं"))}</em></div></div>`;
   let need=1;const tower=$(".tower",body);
   const tap=async(b)=>{if(b.classList.contains("gone")||this.busy)return;const r=+b.dataset.r;
     if(r!==need&&!(r===2&&need===2)){g.oops();b.classList.remove("wob");void b.offsetWidth;b.classList.add("wob");g.say(T("Areas first, then lines, then points: points must stay visible on top.","पहले क्षेत्र, फिर रेखाएँ, फिर बिंदु: बिंदु ऊपर दिखते रहने चाहिए।"));return}
     this.busy=true;const li=document.createElement("li");li.innerHTML=b.innerHTML;li.style.visibility="hidden";tower.prepend(li);await flyEl(b,li,g.root,{dur:.45});li.style.visibility="";g.good();
     const k=b.dataset.k;if(k==="forest")await w.growTrees();if(k==="rivers")await w.drawLayer("rivers",1.4);if(k==="move"){await Promise.all([w.drawLayer("roads",1.2),w.drawLayer("rail",1.2)])}if(k==="fac")await w.popFacilities();
     this.busy=false;
     if(r===1)need=2;if(r===2&&$$(".sheet[data-r='2']:not(.gone)",body).length===0)need=3;
     if($$(".sheet:not(.gone)",body).length===0){$(".gate",body).classList.add("on");g.complete()}};
   this.tap=tap;$$(".sheet",body).forEach(b=>b.onclick=()=>tap(b))},
 async auto(g,tk){for(const k of ["forest","rivers","move","fac"]){if(tk!==g.token)return;await this.tap($(`.sheet[data-k="${k}"]`,g.root));await g.wait(300)}}},

/* 5 · PUBLISH */
{id:"publish",badge:"publish",name:T("Publish","प्रकाशन"),chapter:T("Geo Portal","जियोपोर्टल"),hold:2600,
 title:T("Open it to everyone: the Geoportal","सबके लिए खोलें: जियोपोर्टल"),
 task:T("Try three things: switch a layer, search a district, ask a question.","तीन चीज़ें आज़माएँ: एक परत बदलें, एक ज़िला खोजें, एक प्रश्न पूछें।"),
 say:T("Data locked in a database helps no one. The portal puts this same map in every browser, for departments and citizens alike, and it follows GIGW and WCAG so everyone can use it.","डेटाबेस में बंद डेटा किसी के काम नहीं आता। पोर्टल यही नक्शा हर ब्राउज़र में पहुँचाता है, विभागों और नागरिकों दोनों के लिए, और GIGW व WCAG का पालन करता है ताकि हर कोई इसे चला सके।"),
 win:T("Like Google Maps, but built for the government's own trusted data about Chhattisgarh.","गूगल मैप्स जैसा, पर छत्तीसगढ़ के बारे में सरकार के अपने भरोसेमंद डेटा के लिए।"),
 async enter(g,body){const w=g.world,cnt=w.facilityCounts();w.home(1.2);
   const LAY=[["rivers",T("Rivers","नदियाँ")],["roads",T("Roads","सड़कें")],["rail",T("Rail","रेल")],["trees",T("Forest","वन")],["school",T("Schools","स्कूल")],["health",T("Health","स्वास्थ्य")],["anganwadi",T("Anganwadi","आंगनवाड़ी")]];
   const names=w.districts.map(d=>d.name).sort();
   const most=k=>names.reduce((a,b)=>(cnt[b]?.[k]||0)>(cnt[a]?.[k]||0)?b:a);
   const QS=[{q:T("Which district has the most Anganwadi centres?","किस ज़िले में सबसे ज़्यादा आंगनवाड़ी केंद्र हैं?"),a:()=>{const d=most("anganwadi");return{d,t:T(`${d}, with ${cnt[d].anganwadi} centres on this map.`,`${HI[d]}, इस नक्शे पर ${cnt[d].anganwadi} केंद्र।`)}}},
     {q:T("How many health centres are in Bastar?","बस्तर में कितने स्वास्थ्य केंद्र हैं?"),a:()=>({d:"Bastar",t:T(`${cnt.Bastar.health} health centres in Bastar.`,`बस्तर में ${cnt.Bastar.health} स्वास्थ्य केंद्र।`)})},
     {q:T("Schools in Raipur?","रायपुर में स्कूल?"),a:()=>({d:"Raipur",t:T(`${cnt.Raipur.school} schools in Raipur.`,`रायपुर में ${cnt.Raipur.school} स्कूल।`)})}];
   body.innerHTML=`<ul class="check"><li data-c="layer">${L2(T("Switch a layer","एक परत बदलें"))}</li><li data-c="search">${L2(T("Search a district","एक ज़िला खोजें"))}</li><li data-c="ask">${L2(T("Ask AI a question","AI से प्रश्न पूछें"))}</li></ul>
     <div class="portal"><div class="toggles">${LAY.map(([k,n])=>`<label><input type="checkbox" data-l="${k}" checked><span>${L2(n)}</span></label>`).join("")}</div>
     <form class="search"><input list="gDistricts" placeholder="${lang()==="hi"?"ज़िला खोजें…":"Search a district…"}" aria-label="Search a district"><button>${L2(T("Go","जाएँ"))}</button>
       <datalist id="gDistricts">${names.map(n=>`<option value="${n}">${HI[n]||""}</option>`).join("")}</datalist></form>
     <div class="ask"><b>✦ ${L2(T("Ask AI","AI से पूछें"))}</b>${QS.map((q,i)=>`<button data-q="${i}">${L2(q.q)}</button>`).join("")}</div>
     <div class="answer" aria-live="polite"></div><small class="note">${L2(T("Answers come from this map's sample data.","उत्तर इस नक्शे के नमूना डेटा से हैं।"))}</small></div>`;
   const done=new Set(),tick=c=>{done.add(c);$(`.check [data-c="${c}"]`,body).classList.add("ok");g.good();if(done.size===3)g.complete()};
   const info=(d,extra)=>{const c=cnt[d]||{};$(".answer",body).innerHTML=`<b>${L2(DN(d))}</b>${extra?`<p>${L2(extra)}</p>`:""}<span>🏫 ${c.school||0} · 🏥 ${c.health||0} · 🧒 ${c.anganwadi||0}</span>`};
   this.toggle=(k,on)=>{const cb=$(`[data-l="${k}"]`,body);cb.checked=on;w.setLayer(k,on);if(!done.has("layer"))tick("layer")};
   this.search=d=>{if(!names.includes(d))return;$(".search input",body).value=d;w.flyTo(d,1.4);w.highlight(d);info(d);if(!done.has("search"))tick("search")};
   this.ask=i=>{const r=QS[i].a();w.flyTo(r.d,1.4);w.highlight(r.d);info(r.d,r.t);if(!done.has("ask"))tick("ask")};
   $$("[data-l]",body).forEach(cb=>cb.onchange=()=>this.toggle(cb.dataset.l,cb.checked));
   $(".search",body).onsubmit=e=>{e.preventDefault();const v=$(".search input",body).value.trim().toLowerCase();
     const d=names.find(n=>n.toLowerCase()===v||(HI[n]||"")===v)||names.find(n=>n.toLowerCase().startsWith(v)||(HI[n]||"").startsWith(v));if(d)this.search(d);else g.say(T("I couldn't find that district. Try Bastar or Korba.","वह ज़िला नहीं मिला। बस्तर या कोरबा आज़माएँ।"))};
   $$("[data-q]",body).forEach(b=>b.onclick=()=>this.ask(+b.dataset.q))},
 async auto(g,tk){this.toggle("school",false);await g.wait(900);if(tk!==g.token)return;this.toggle("school",true);await g.wait(500);if(tk!==g.token)return;
   this.search("Bastar");await g.wait(2200);if(tk!==g.token)return;this.ask(0)},
 leave(g){["rivers","roads","rail","trees","school","health","anganwadi"].forEach(k=>g.world.setLayer(k,true));g.world.highlight(null)}},

/* 6 · FIELD */
{id:"field",badge:"field",name:T("Field","मैदान"),chapter:T("Mobile app","मोबाइल ऐप"),
 title:T("Take the map to the field","नक्शा मैदान तक ले जाएँ"),
 task:T("You're a field officer near Abhanpur. Tap the map inside the pulsing ring to record a new Anganwadi centre, then send it for review.","आप अभनपुर के पास एक फ़ील्ड अधिकारी हैं। नया आंगनवाड़ी केंद्र दर्ज करने के लिए धड़कते घेरे के भीतर नक्शे पर टैप करें, फिर समीक्षा के लिए भेजें।"),
 say:T("Not everyone sits at a desk. The mobile app is a field notebook that knows exactly where you are standing.","हर कोई डेस्क पर नहीं बैठता। मोबाइल ऐप एक फ़ील्ड नोटबुक है जो ठीक-ठीक जानती है कि आप कहाँ खड़े हैं।"),
 win:T("Sent! What you capture flows back into the geodatabase after review. The person at the site keeps the map accurate.","भेज दिया! आपका दर्ज किया डेटा समीक्षा के बाद भू-डेटाबेस में लौटता है। साइट पर खड़ा व्यक्ति नक्शे को सटीक रखता है।"),
 async enter(g,body){const w=g.world,HERE=[81.76,21.06];const[hx,hz]=P(...HERE);await w.fly([hx+6,44,hz+42],[hx,0,hz],1.6);
   this.me=w.addPin(HERE,0x2f6fd6,{ring:true,big:.8});this.meL=w.labelAt(HERE,L2(T("You are here","आप यहाँ हैं")),"me",2.4);
   body.innerHTML=`<div class="phone"><div class="ph-top"><span>9:41</span><span>●●● 4G</span></div><div class="ph-bar">${L2(T("Field app","फ़ील्ड ऐप"))}</div>
     <div class="ph-body"><p class="ph-gps">GPS <b>21.0600° N, 81.7600° E</b></p><p class="ph-hint">${L2(T("Tap the map inside the ring","घेरे के भीतर नक्शे पर टैप करें"))}</p>
     <div class="ph-form"><label>${L2(T("Type","प्रकार"))}<select><option>${lang()==="hi"?"आंगनवाड़ी केंद्र":"Anganwadi centre"}</option><option>${lang()==="hi"?"स्कूल":"School"}</option><option>${lang()==="hi"?"स्वास्थ्य केंद्र":"Health centre"}</option></select></label>
       <div class="ph-photo">📷 ${L2(T("Photo attached","फ़ोटो संलग्न"))}</div><button class="btn ph-send" disabled>${L2(T("Send for review","समीक्षा के लिए भेजें"))}</button></div></div></div>`;
   const send=$(".ph-send",body);
   this.drop=(ll)=>{const[x,z]=P(...ll),d=Math.hypot(x-hx,z-hz);if(d>3.2){g.oops();g.say(T("That's outside the ring. Field points are recorded where you stand.","यह घेरे के बाहर है। फ़ील्ड बिंदु वहीं दर्ज होते हैं जहाँ आप खड़े हैं।"));return}
     if(this.newPin)w.removePin(this.newPin);this.newPin=w.addPin(ll,0xffc23a,{bob:true});g.field=ll;$(".ph-gps b",body).textContent=`${ll[1].toFixed(4)}° N, ${ll[0].toFixed(4)}° E`;
     body.querySelector(".phone").classList.add("form");send.disabled=false;g.good()};
   this.send=()=>{if(send.disabled)return;send.disabled=true;send.innerHTML=L2(T("Sent ✓ · waiting for review","भेजा ✓ · समीक्षा बाकी"));g.good();g.complete()};
   send.onclick=this.send;
   g.mapTap=(x,y)=>{if(g.lv!==5||g.done)return;const h=w.pick(x,y);if(h)this.drop(h.lonlat)}},
 async auto(g,tk){await g.wait(400);if(tk!==g.token)return;this.drop([81.775,21.07]);await g.wait(1300);if(tk!==g.token)return;this.send()},
 leave(g){g.mapTap=null;g.world.removePin(this.me);g.world.unlabel(this.meL)}},

/* 7 · CARTOGRAPHY */
{id:"carto",badge:"carto",name:T("Map","नक्शा"),chapter:T("Cartography","मानचित्रकला"),hold:3000,
 title:T("Make a map people understand","ऐसा नक्शा बनाएँ जो लोग समझें"),
 task:T("Pick the right colour for rivers, then choose a question for your map.","नदियों के लिए सही रंग चुनें, फिर अपने नक्शे के लिए एक प्रश्न चुनें।"),
 say:T("Raw data is just points and lines. Cartography is the craft of turning it into a map that tells a clear story at a glance.","कच्चा डेटा केवल बिंदु और रेखाएँ हैं। मानचित्रकला उसे ऐसे नक्शे में बदलने की कला है जो एक नज़र में साफ़ कहानी कहे।"),
 win:T("Data is the ingredient; cartography is the cooking that makes it worth eating. Maps like this decide where the next centre goes.","डेटा सामग्री है; मानचित्रकला वह पकाना है जो उसे परोसने लायक बनाता है। ऐसे नक्शे तय करते हैं कि अगला केंद्र कहाँ बने।"),
 async enter(g,body){const w=g.world,cnt=w.facilityCounts();w.fly([-10,80,92],[0,0,4],1.4);w.riverColor(0x6b6b6b);
   const SW=[["#3c8fd6",1],["#8e5bd6",0],["#a3683a",0],["#d2423a",0]];
   const TH=[{k:"anganwadi",n:T("Anganwadi centres per district","प्रति ज़िला आंगनवाड़ी केंद्र"),r:[0xf6e3b8,0xc95d2e]},{k:"health",n:T("Health centres per district","प्रति ज़िला स्वास्थ्य केंद्र"),r:[0xf7d6d2,0xb3261e]},{k:"school",n:T("Schools per district","प्रति ज़िला स्कूल"),r:[0xd8e6f8,0x1f4f9e]}];
   body.innerHTML=`<p class="mini">${L2(T("1 · River colour","1 · नदी का रंग"))}</p><div class="swatches">${SW.map(([c],i)=>`<button style="--c:${c}" data-s="${i}" aria-label="${c}"></button>`).join("")}</div>
     <p class="mini">${L2(T("2 · Your map's question","2 · आपके नक्शे का प्रश्न"))}</p><div class="themes">${TH.map((t,i)=>`<button data-t="${i}" disabled>${L2(t.n)}</button>`).join("")}</div>
     <div class="legend"></div><small class="note">${L2(T("Heights and colours show the sample counts on this map.","ऊँचाई और रंग इस नक्शे के नमूना आँकड़े दिखाते हैं।"))}</small>`;
   let blue=false;
   this.swatch=i=>{const[c,ok]=SW[i];w.riverColor(c);$$(".swatches button",body).forEach((b,j)=>b.classList.toggle("on",j===i));
     if(ok){if(!blue){blue=true;g.good();$$(".themes button",body).forEach(b=>b.disabled=false);g.say(T("Rivers in blue: everyone reads that instantly. Now, what should your map answer?","नदियाँ नीले रंग में: हर कोई तुरंत समझ जाता है। अब, आपका नक्शा किस प्रश्न का उत्तर दे?"))}}
     else{g.oops();g.say(T("Readers expect water in blue. Try again!","पाठक पानी को नीले रंग में देखने की उम्मीद करते हैं। फिर कोशिश करें!"))}};
   this.theme=async i=>{const t=TH[i],vals={};w.districts.forEach(d=>vals[d.name]=(cnt[d.name]||{})[t.k]||0);$$(".themes button",body).forEach((b,j)=>b.classList.toggle("on",j===i));
     ["school","health","anganwadi","trees","rivers","roads","rail"].forEach(k=>w.setLayer(k,false));await w.choropleth(vals,t.r);
     const sorted=Object.entries(vals).sort((a,b)=>b[1]-a[1]);
     $(".legend",body).innerHTML=`<div class="ramp" style="--a:#${t.r[0].toString(16).padStart(6,"0")};--b:#${t.r[1].toString(16).padStart(6,"0")}"></div><span>${L2(T("Most","सबसे अधिक"))}: <b>${L2(DN(sorted[0][0]))}</b> (${sorted[0][1]})</span><span>${L2(T("Fewest","सबसे कम"))}: <b>${L2(DN(sorted.at(-1)[0]))}</b> (${sorted.at(-1)[1]})</span>`;
     g.good();g.complete()};
   $$(".swatches button",body).forEach(b=>b.onclick=()=>this.swatch(+b.dataset.s));$$(".themes button",body).forEach(b=>b.onclick=()=>this.theme(+b.dataset.t))},
 async auto(g,tk){this.swatch(0);await g.wait(1200);if(tk!==g.token)return;await this.theme(0)},
 async leave(g){const w=g.world;await w.flatten();["school","health","anganwadi","trees","rivers","roads","rail"].forEach(k=>w.setLayer(k,true));w.riverColor(0x3c8fd6)}},

/* 8 · MAINTAIN */
{id:"maintain",badge:"maintain",name:T("Maintain","रखरखाव"),chapter:T("Maintenance","रखरखाव"),
 title:T("Keep it running, safe and current","चालू, सुरक्षित और नवीनतम रखें"),
 task:T("Updates are arriving. Read the checks, then publish each one or send it back.","अपडेट आ रहे हैं। जाँच पढ़ें, फिर हर एक को प्रकाशित करें या वापस भेजें।"),
 say:T("A map is never finished. The team keeps the servers running, backs up the data, and checks every update before it goes live.","नक्शा कभी पूरा नहीं होता। टीम सर्वर चालू रखती है, डेटा का बैकअप लेती है, और हर अपडेट को लाइव होने से पहले जाँचती है।"),
 win:T("Like servicing a vehicle: regular care keeps the map running smoothly for years.","जैसे वाहन की सर्विस: नियमित देखभाल नक्शे को वर्षों तक सुचारु चलाती है।"),
 async enter(g,body){const w=g.world;w.home(1.4);
   const U=[{t:T("New Anganwadi centre near Abhanpur (your field point)","अभनपुर के पास नया आंगनवाड़ी केंद्र (आपका फ़ील्ड बिंदु)"),c:[1,1,1],ll:g.field||[81.775,21.07]},
     {t:T("Road widened, Raipur ring road","सड़क चौड़ी हुई, रायपुर रिंग रोड"),c:[1,1,1]},
     {t:T("School moved, Kanker","स्कूल स्थानांतरित, कांकेर"),c:[0,1,1],why:T("the new point falls outside the state","नया बिंदु राज्य के बाहर पड़ता है")},
     {t:T("Health centre, Korba","स्वास्थ्य केंद्र, कोरबा"),c:[1,1,0],why:T("its code is blank","इसका कोड खाली है")}];
   const CH=[T("inside boundary","सीमा के भीतर"),T("clean geometry","साफ़ ज्यामिति"),T("code filled","कोड भरा")];
   body.innerHTML=`<div class="status"><span class="ok">● ${L2(T("Servers running","सर्वर चालू"))}</span><span class="ok">✓ ${L2(T("Backup 02:00","बैकअप 02:00"))}</span><span class="ok">✓ ${L2(T("Security updates","सुरक्षा अपडेट"))}</span></div>
     <div class="queue">${U.map((u,i)=>`<div class="upd" data-i="${i}"><b>${L2(u.t)}</b><div class="chk">${u.c.map((v,j)=>`<em class="${v?"y":"n"}">${v?"✓":"✗"} ${L2(CH[j])}</em>`).join("")}</div>
       <div class="acts"><button data-a="pub">${L2(T("Publish","प्रकाशित करें"))}</button><button data-a="back">${L2(T("Send back","वापस भेजें"))}</button></div></div>`).join("")}</div>`;
   if(g.field)this.fp=w.addPin(g.field,0xffc23a,{bob:true});
   let left=U.length;
   this.decide=(i,a)=>{const u=U[i],el=$(`.upd[data-i="${i}"]`,body);if(el.classList.contains("done"))return;const good=u.c.every(Boolean);
     if((a==="pub")!==good){g.oops();el.classList.remove("wob");void el.offsetWidth;el.classList.add("wob");
       g.say(good?T("All three checks pass: this one can go live.","तीनों जाँच पास हैं: इसे लाइव किया जा सकता है।"):T(`Look at the red check: ${u.why.en}. Send it back to be fixed.`,`लाल जाँच देखें: ${u.why.hi}। इसे सुधारने के लिए वापस भेजें।`));return}
     el.classList.add("done",a);g.good();if(i===0&&this.fp){this.fp.bob=false;w.pinColor(this.fp,0xe39a1f);w.flyTo("Raipur",1.2).then(()=>setTimeout(()=>w.home(1.2),900))}
     if(--left===0)g.complete()};
   $$(".upd",body).forEach(el=>$$("[data-a]",el).forEach(b=>b.onclick=()=>this.decide(+el.dataset.i,b.dataset.a)))},
 async auto(g,tk){for(const[i,a]of[[0,"pub"],[1,"pub"],[2,"back"],[3,"back"]]){if(tk!==g.token)return;this.decide(i,a);await g.wait(i===0?2200:700)}}}
];
