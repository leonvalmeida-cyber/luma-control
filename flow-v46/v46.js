/* Luma Flow V4.6: interactive miniature Hue room. No separate bridge connection. */
(()=>{'use strict';
const doc=document,api=()=>window.lumaV46Bridge,stage=()=>doc.getElementById('v45LampHome');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const slots=[
 {x:12,y:56,kind:'floor'},{x:82,y:59,kind:'table'},{x:30,y:19,kind:'wall'},
 {x:60,y:19,kind:'pendant'},{x:91,y:27,kind:'wall'},{x:43,y:67,kind:'table'},
 {x:72,y:73,kind:'floor'},{x:18,y:82,kind:'strip'},{x:51,y:43,kind:'orb'},
 {x:90,y:81,kind:'strip'},{x:9,y:25,kind:'orb'},{x:70,y:40,kind:'wall'}
];
const kinds=['floor','table','wall','pendant','strip','orb'];
function slotFor(id,used){let n=0;for(const c of String(id))n=(n*33+c.charCodeAt(0))>>>0;for(let i=0;i<slots.length;i++){const index=(n+i)%slots.length;if(!used.has(index)){used.add(index);return {...slots[index],index}}}return null}
function rgb(state){
 if(state?.xy&&Array.isArray(state.xy)){
  let [x,y]=state.xy;if(!y)return [255,218,170];const z=1-x-y,Y=1,X=Y/y*x,Z=Y/y*z;
  let r=X*1.656492-Y*.354851-Z*.255038,g=-X*.707196+Y*1.655397+Z*.036152,b=X*.051713-Y*.121364+Z*1.01153;
  const max=Math.max(r,g,b);if(max>1){r/=max;g/=max;b/=max}
  const enc=v=>Math.round(clamp((v<=.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-.055)*255,0,255));
  return [enc(r),enc(g),enc(b)];
 }
 if(state?.colormode==='hs'||('hue'in(state||{})&&state?.colormode!=='ct')){
  const h=(Number(state.hue)||0)/65535*6,s=clamp((Number(state.sat)||0)/254,0,1),v=1;
  const c=v*s,x=c*(1-Math.abs(h%2-1)),m=v-c;let t=h<1?[c,x,0]:h<2?[x,c,0]:h<3?[0,c,x]:h<4?[0,x,c]:h<5?[x,0,c]:[c,0,x];
  return t.map(q=>Math.round((q+m)*255));
 }
 const ct=clamp(Number(state?.ct)||320,153,500),warm=(ct-153)/347;
 return [255,Math.round(235-52*warm),Math.round(210-112*warm)];
}
function lightSvg(kind){const p={
 floor:'<path d="M13 9v21m-8 0h16M7 8l3-6h6l3 6z"/>',
 table:'<path d="M13 16v12m-7 0h14M5 15l4-9h8l4 9z"/>',
 wall:'<path d="M3 12h9l4-7m-2 0h8v10h-8z"/>',
 pendant:'<path d="M13 1v10M4 19l5-9h8l5 9z"/>',
 strip:'<path d="M3 12h20M3 17h20"/>',
 orb:'<circle cx="13" cy="12" r="8"/><path d="M9 22h8"/>'
 };return '<svg viewBox="0 0 26 32" aria-hidden="true" focusable="false">'+(p[kind]||p.orb)+'</svg>'}
let nodes=new Map(),lastSig='',busy=false,polling=false,disposed=false,press=null;
function ensureScene(){
 const home=stage();if(!home)return false;
 home.classList.add('v46-room');
 const old=home.querySelector('.v45-stage-copy');if(old)old.remove();
 home.querySelector('.v45-landing-mark')?.remove();
 if(!home.querySelector('.v46-note')){
  const note=doc.createElement('div');note.className='v46-note';note.innerHTML='<span class="v46-note-name">All</span><span class="v46-note-count">–</span>';home.append(note);
  const layer=doc.createElement('div');layer.className='v46-lights';layer.setAttribute('aria-label','Hue-Lampen im Miniatur-Wohnzimmer');home.append(layer);
 }
 return true;
}
function update(){
 if(disposed||!ensureScene())return;
 const bridge=api()?.snapshot();if(!bridge)return;
 const entries=Object.entries(bridge.lights||{}).sort(([a],[b])=>String(a).localeCompare(String(b),undefined,{numeric:true}));
 const signature=entries.map(([id])=>id).join('|');
 const layer=stage().querySelector('.v46-lights');
 if(signature!==lastSig){
  const used=new Set();nodes.clear();layer.replaceChildren();
  for(const [id,device]of entries){
   const slot=slotFor(id,used);if(!slot)continue;
   const button=doc.createElement('button');button.type='button';button.className='v46-mini';button.dataset.lightId=id;
   button.style.left=slot.x+'%';button.style.top=slot.y+'%';button.innerHTML='<span class="v46-halo"></span><span class="v46-fixture">'+lightSvg(slot.kind)+'</span>';
   button.addEventListener('click',event=>{if(button.dataset.longPressed==='1'){button.dataset.longPressed='0';return}toggleMini(id)});
   const clear=()=>{if(press){clearTimeout(press.timer);press=null}};
   button.addEventListener('pointerdown',event=>{
    if(event.pointerType==='mouse'&&event.button!==0)return;
    clear();const x=event.clientX,y=event.clientY;
    press={id,x,y,timer:setTimeout(()=>{button.dataset.longPressed='1';api()?.selectLamp(id);doc.getElementById('targetFastTree')?.scrollIntoView({block:'nearest',behavior:'smooth'});press=null},550)};
   });
   button.addEventListener('pointermove',event=>{if(press?.id===id&&Math.hypot(event.clientX-press.x,event.clientY-press.y)>9)clear()});
   button.addEventListener('pointerup',clear);button.addEventListener('pointercancel',clear);
   layer.append(button);nodes.set(id,button);
  }
  lastSig=signature;
 }
 let on=0,available=0;
 for(const [id,device]of entries){
  const node=nodes.get(id);if(!node)continue;
  const state=device.state||{},reachable=state.reachable!==false,active=reachable&&state.on===true;
  const [r,g,b]=rgb(state),power=active?clamp((Number(state.bri)||180)/254,.08,1):0;
  node.style.setProperty('--v46-rgb',r+','+g+','+b);node.style.setProperty('--v46-power',String(power));
  node.classList.toggle('is-on',active);node.classList.toggle('is-offline',!reachable);
  node.disabled=!bridge.connected||!reachable||node.dataset.busy==='1';
  node.setAttribute('aria-label',(device.name||'Lampe '+id)+(reachable?(active?' ausschalten':' einschalten'):' nicht erreichbar'));
  node.title=device.name||'Lampe '+id;
  if(reachable)available++;if(active)on++;
 }
 const ids=bridge.groups?.resolve(bridge.selected,{reachableOnly:false})||[];
 const selected=ids.map(id=>bridge.lights[id]).filter(Boolean);
 const selectedOn=selected.filter(x=>x.state?.reachable!==false&&x.state?.on===true).length;
 const label=bridge.groups?.group(bridge.selected)?.name||'All';
 stage().querySelector('.v46-note-name').textContent=label;
 stage().querySelector('.v46-note-count').textContent=selectedOn+' / '+selected.length+' an';
 stage().dataset.power=selectedOn===0?'off':selectedOn===selected.length?'on':'mixed';
 stage().dataset.connected=bridge.connected?'true':'false';
 addGroupPower();
}
async function toggleMini(id){
 const bridge=api()?.snapshot(),device=bridge?.lights[id],node=nodes.get(id);
 if(!bridge?.connected||!device||device.state?.reachable===false||node?.dataset.busy==='1')return;
 node.dataset.busy='1';update();
 try{await api().power([id],!Boolean(device.state?.on));await api().refresh()}
 catch(e){api().showError('Lampe: '+e.message)}
 finally{node.dataset.busy='0';update()}
}
async function toggleGroup(id,button){
 const bridge=api()?.snapshot();if(!bridge?.connected)return api()?.showError('Bridge nicht verbunden');
 const ids=bridge.groups?.resolve(id,{reachableOnly:false})||[];
 const available=ids.filter(x=>bridge.lights[x]&&bridge.lights[x].state?.reachable!==false);
 if(!available.length)return api()?.showError('Keine erreichbaren Lampen');
 const on=available.every(x=>bridge.lights[x].state?.on===true);
 if(button)button.disabled=true;
 try{await api().power(available,!on);await api().refresh()}
 catch(e){api().showError('Gruppe: '+e.message)}
 finally{if(button)button.disabled=false;update()}
}
function addGroupPower(){
 const tree=doc.getElementById('targetFastTree'),bridge=api()?.snapshot();if(!tree||!bridge)return;
 for(const shell of tree.querySelectorAll('.v45-group-shell')){
  const pick=shell.querySelector('[data-target-id]'),id=pick?.dataset.targetId;if(!id)continue;
  let button=shell.querySelector('.v46-group-power');
  if(!button){button=doc.createElement('button');button.type='button';button.className='v46-group-power';button.textContent='⏻';button.addEventListener('click',e=>{e.stopPropagation();toggleGroup(id,button)});shell.append(button)}
  const ids=bridge.groups?.resolve(id,{reachableOnly:false})||[],valid=ids.filter(x=>bridge.lights[x]?.state?.reachable!==false&&bridge.lights[x]);
  const on=valid.filter(x=>bridge.lights[x].state?.on===true).length;
  button.dataset.state=on===0?'off':on===valid.length?'on':'mixed';
  button.setAttribute('aria-label',(bridge.groups?.group(id)?.name||id)+' '+(on===valid.length?'ausschalten':'einschalten'));
  button.disabled=!bridge.connected||!valid.length;
 }
}
async function sync(){
 if(disposed||polling||doc.hidden||!window.lumaQuickControl?.isOpen?.()||!api()?.snapshot()?.connected)return;
 polling=true;
 try{await api().refresh()}catch(e){/* retain last confirmed values, retry later */}finally{polling=false;update()}
}
function init(){
 if(!ensureScene())return;
 const overlay=doc.getElementById('quickOverlay');
 const tree=doc.getElementById('targetFastTree');
 tree?.addEventListener('click',()=>setTimeout(update,30));
 doc.getElementById('target')?.addEventListener('change',update);
 const lamp=doc.getElementById('ambientMovingHead');
 // The existing pull controller owns shade drag; only a short stationary tap toggles power.
 if(lamp){
  let start=null;
  lamp.addEventListener('pointerdown',e=>{start={x:e.clientX,y:e.clientY,t:performance.now()}},{capture:true});
  lamp.addEventListener('pointerup',e=>{
   if(!start)return;const moved=Math.hypot(e.clientX-start.x,e.clientY-start.y),elapsed=performance.now()-start.t;start=null;
   if(moved<8&&elapsed<450&&window.lumaQuickControl?.isOpen?.()){e.stopImmediatePropagation();toggleGroup(api()?.snapshot()?.selected||'all')}
  },{capture:true});
 }
 update();
 const timer=setInterval(()=>{update();sync()},2800);
 window.addEventListener('pagehide',()=>{disposed=true;clearInterval(timer)},{once:true});
}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.LumaV46={rgb,slots};
})();
