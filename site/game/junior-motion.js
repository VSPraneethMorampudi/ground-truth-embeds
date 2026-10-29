/* Small, purposeful motion for Map Buddies. The game commits actions immediately;
   these visuals never hold a lock, delay a task, or change where a drop counts. */
export class JuniorMotion{
 constructor(root,{reduced=false}={}){this.root=root;this.reduced=reduced;this.hovered=null;this.tokens=new Set()}
 animate(el,frames,options){if(this.reduced||!el)return;const a=el.animate(frames,options);a.finished.catch(()=>{});return a}
 enter(){
  if(this.reduced)return;
  this.animate(this.root.querySelector('.jy-title'),[{opacity:0,translate:'0 12px'},{opacity:1,translate:'0 0'}],{duration:280,easing:'cubic-bezier(.2,.7,.25,1)'});
  this.root.querySelectorAll('[data-card]').forEach((card,i)=>this.animate(card,[{opacity:0,translate:'0 15px',scale:'.95'},{opacity:1,translate:'0 -2px',scale:'1.015',offset:.72},{opacity:1,translate:'0 0',scale:'1'}],{duration:350,delay:i*32,easing:'ease-out',fill:'backwards'}));
  this.root.querySelectorAll('[data-drop]').forEach((box,i)=>this.animate(box,[{opacity:0,scale:'.92'},{opacity:1,scale:'1'}],{duration:300,delay:65+i*28,easing:'cubic-bezier(.2,.7,.25,1)',fill:'backwards'}));
 }
 hover(e){
  if(this.reduced||e.pointerType!=='mouse'||e.buttons)return;const card=e.target.closest('[data-card]:not(:disabled)');if(this.hovered!==card)this.resetHover();if(!card)return;
  this.hovered=card;const r=card.getBoundingClientRect();card.style.setProperty('--card-rx',((.5-(e.clientY-r.top)/r.height)*7).toFixed(2)+'deg');card.style.setProperty('--card-ry',(((e.clientX-r.left)/r.width-.5)*7).toFixed(2)+'deg');
 }
 resetHover(){if(this.hovered){this.hovered.style.removeProperty('--card-rx');this.hovered.style.removeProperty('--card-ry');this.hovered=null}}
 token(html,from,to,{returning=false}={}){
  if(this.reduced)return;const el=document.createElement('div');el.className='jy-flight';el.setAttribute('aria-hidden','true');el.innerHTML=html;this.root.appendChild(el);this.tokens.add(el);
  const dx=to.x-from.x,dy=to.y-from.y;
  const a=this.animate(el,[{transform:`translate3d(${from.x}px,${from.y}px,0) scale(1) rotate(-3deg)`,opacity:1},{transform:`translate3d(${from.x+dx*.6}px,${from.y+dy*.6-18}px,0) scale(1.08) rotate(3deg)`,opacity:1,offset:.6},{transform:`translate3d(${to.x}px,${to.y}px,0) scale(${returning?'.95':'.45'}) rotate(0deg)`,opacity:returning?.2:0}],{duration:returning?280:360,easing:'cubic-bezier(.2,.65,.3,1)',fill:'forwards'});
  a.finished.catch(()=>{}).finally(()=>{el.remove();this.tokens.delete(el)});
 }
 center(el){const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}}
 deliver(html,from,to){this.token(html,from,to)}
 returnTo(html,from,card){if(card)this.token(html,from,this.center(card),{returning:true})}
 receive(box,{earned=false,at}={}){
  if(this.reduced||!box)return;
  this.animate(box,[{scale:'1'},{scale:'1.07',offset:.4},{scale:'.985',offset:.75},{scale:'1'}],{duration:380,easing:'ease-out'});
  const p=at||this.center(box),count=earned?8:5;
  for(let i=0;i<count;i++){const bit=document.createElement('i');bit.className='jy-spark';bit.setAttribute('aria-hidden','true');bit.textContent=i%2?'✦':'★';bit.style.color=['#dcac35','#68a176','#6397c8'][i%3];this.root.appendChild(bit);this.tokens.add(bit);const angle=(i/count)*Math.PI*2,distance=42+i%3*12;
   const a=this.animate(bit,[{transform:`translate(${p.x}px,${p.y}px) scale(.3)`,opacity:1},{transform:`translate(${p.x+Math.cos(angle)*distance}px,${p.y+Math.sin(angle)*distance-12}px) scale(1) rotate(${i%2?35:-35}deg)`,opacity:0}],{duration:490+i%2*65,easing:'ease-out'});a.finished.catch(()=>{}).finally(()=>{bit.remove();this.tokens.delete(bit)})}
  if(earned)this.animate(this.root.querySelector('.jy-journey .current'),[{scale:'.8'},{scale:'1.22',offset:.5},{scale:'1'}],{duration:400,easing:'ease-out'});
 }
 revealMap(world,id,thing){
  if(this.reduced)return;
  if(id==='tree')world.growTrees();
  if(id==='river'||id==='road')world.drawLayer(id==='river'?'rivers':'roads',.55);
  if(thing?.at){const pin=world.pins.find(p=>p.lonlat===thing.at);if(pin)world.tween(.4,k=>pin.obj.scale.setScalar(Math.max(.001,k<.75?k*1.45:1+(1-k)*.35)))}
 }
 clear(){this.resetHover();for(const el of this.tokens){el.getAnimations().forEach(a=>a.cancel());el.remove()}this.tokens.clear()}
}
