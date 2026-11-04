/* Luma Pull to Open v1.0 — actual 0..1 finger-following mechanical interaction.
 * Does not read/write Hue lights, microphones, or persistent app settings.
 * The fixed wall plate, movable lamp shade, telescopic arm, rim light cone and
 * existing Quick Control panel share exactly one progress value per frame.
 */
(function(root){'use strict';
const MIN_START_PX=7,COMMIT_AT=.43,QUICK_FLICK_PX=62;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,Number.isFinite(x)?x:0));
const round=x=>Math.round(x*10)/10;
const snap=(progress,dx,elapsedMs)=>progress>=COMMIT_AT||(dx>=QUICK_FLICK_PX&&elapsedMs>0&&elapsedMs<205);
function limits(width){
 const w=Math.max(240,Number(width)||390);
 return {drag:clamp(w*.53,174,230),pull:clamp(w*.43,132,172)};
}
const progressFromDistance=(distance,limit)=>clamp(Math.max(0,distance)/Math.max(1,limit));
function armPath(pull,svgWidth=73){
 // The arm's right end remains mounted; the left end follows the actual shade.
 const left=45-pull*(100/svgWidth),mid=left+13;
 return 'M'+round(left)+' 38 Q'+round(mid)+' 32 '+round(left+23)+' 33 H82 Q88 33 88 39 V53';
}
function beamGeometry(width,height,x,y){
 // All three light bands start precisely at the movable lower shade lip.
 // End boundaries deliberately fan much further DOWN than to the left.
 const w=Math.max(1,width),h=Math.max(1,height),ox=round(x),oy=round(y);
 const edges=[
  [round(x-w*.94),round(y+h*.10)],
  [round(x-w*1.04),round(y+h*.39)],
  [round(x-w*.99),round(y+h*.70)],
  [round(x-w*.78),round(y+h*1.14)]
 ];
 const bands=[];
 for(let i=0;i<3;i++){
  bands.push('M'+round(x-12)+' '+round(y-3+i*2)+
   ' L'+edges[i][0]+' '+edges[i][1]+
   ' L'+edges[i+1][0]+' '+edges[i+1][1]+
   ' L'+round(x+11)+' '+round(y+3+i*2)+' Z');
 }
 // Top spill emerges ONLY from the little opening, at ~35 px above the lower lip.
 const yTop=round(y-32);
 const up='M'+round(x-12)+' '+yTop+
  ' L'+round(x-w*.22)+' '+round(y-h*.24)+
  ' Q'+round(x-w*.10)+' '+round(y-h*.36)+' '+round(x+9)+' '+round(y-38)+' Z';
 return {bands,up,origin:[ox,oy],edges};
}
function attach({doc=root.document,win=root}={}){
 const launcher=doc?.getElementById?.('quickLauncher');
 const overlay=doc?.getElementById?.('quickOverlay');
 const sheet=doc?.querySelector?.('.quick-sheet');
 const backdrop=doc?.getElementById?.('quickBackdrop');
 const arm=doc?.getElementById?.('ambientLampArm');
 const beamCanvas=doc?.getElementById?.('ambientBeamCanvas');
 const beamPaths=[1,2,3].map(i=>doc?.getElementById?.('ambientBeam'+i));
 const beamUp=doc?.getElementById?.('ambientBeamUp');
 if(!launcher||!overlay||!sheet||!backdrop||!arm||!beamCanvas||beamPaths.some(x=>!x)||!beamUp)return null;
 if(launcher.dataset.pullReady==='true')return null;
 launcher.dataset.pullReady='true';
 const rootStyle=doc.documentElement.style;
 const listeners=[], listen=(node,name,fn,opts)=>{node.addEventListener(name,fn,opts);listeners.push([node,name,fn,opts])};
 const raf=win.requestAnimationFrame?.bind(win)||((fn)=>win.setTimeout(fn,16));
 const caf=win.cancelAnimationFrame?.bind(win)||win.clearTimeout?.bind(win)||(()=>{});
 const now=()=>win.performance?.now?.()||Date.now();
 let current=0,session=null,animation=0,frame=0,queued=null,preview=false,ignoreClickUntil=0;
 const getDims=()=>({width:Math.max(1,win.innerWidth||390),height:Math.max(1,win.innerHeight||844)});
 function position(p){
  const rect=launcher.getBoundingClientRect(),{width,height}=getDims(),limit=limits(width);
  const distance=limit.pull*p;
  const svgWidth=73; // exact CSS size for this 100×124 SVG
  const headX=rect.left+(.31*svgWidth)-distance;
  const rimY=rect.top+(78/124*96);
  return {distance,svgWidth,width,height,headX,rimY};
 }
 function paint(p){
  current=clamp(p);
  const g=position(current);
  const glow=beamGeometry(g.width,g.height,g.headX,g.rimY);
  rootStyle.setProperty('--luma-pull-px',round(g.distance)+'px');
  launcher.dataset.pullProgress=current.toFixed(3);
  overlay.dataset.pullProgress=current.toFixed(3);
  arm.setAttribute('d',armPath(g.distance,g.svgWidth));
  beamCanvas.setAttribute('viewBox','0 0 '+g.width+' '+g.height);
  for(let i=0;i<3;i++)beamPaths[i].setAttribute('d',glow.bands[i]);
  beamUp.setAttribute('d',glow.up);
  if(preview){
   sheet.style.transform='translate3d('+round((1-current)*100)+'%,0,0)';
   backdrop.style.opacity=String(round(current*.95));
  }
 }
 function queue(p){
  queued=clamp(p);
  if(frame)return;
  frame=raf(()=>{frame=0;paint(queued)});
 }
 function stopAnimation(){
  if(animation){caf(animation);animation=0}
 }
 function markPreview(){
  if(preview)return;
  preview=true;
  overlay.hidden=false;
  overlay.classList.add('quick-preview');
  overlay.classList.remove('quick-retract');
  overlay.dataset.pulledOpen='false';
  launcher.classList.add('quick-pulling');
  sheet.style.animation='none';
  sheet.style.transition='none';
  backdrop.style.transition='none';
  overlay.style.pointerEvents='none';
 }
 function clearPreview(){
  preview=false;
  overlay.classList.remove('quick-preview','quick-retract');
  overlay.style.pointerEvents='';
  sheet.style.animation='';
  sheet.style.transition='';
  sheet.style.transform='';
  backdrop.style.transition='';
  backdrop.style.opacity='';
  launcher.classList.remove('quick-pulling');
 }
 function rollback(){
  clearPreview();
  if(!win.lumaQuickControl?.isOpen?.())overlay.hidden=true;
  paint(0);
 }
 function settle(shouldOpen){
  stopAnimation();
  if(frame){caf(frame);frame=0;paint(queued??current)}
  const start=current,end=shouldOpen?1:0,t0=now();
  const reduce=win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const duration=reduce?0:shouldOpen?210:190;
  // No bounce: all four objects share the same easing, ending in the same frame.
  function step(t){
   const u=duration?clamp((t-t0)/duration):1;
   const eased=1-Math.pow(1-u,3);
   paint(start+(end-start)*eased);
   if(u<1){animation=raf(step);return}
   animation=0;
   if(shouldOpen){
    clearPreview();
    overlay.dataset.pulledOpen='true';
    win.lumaQuickControl?.open?.();
   }else rollback();
  }
  animation=raf(step);
 }
 const touchFor=(touches,id)=>Array.from(touches||[]).find(x=>x.identifier===id);
 function begin(x,y,id,source){
  if(session||win.lumaQuickControl?.isOpen?.())return;
  stopAnimation();
  session={x,y,id,source,started:now(),active:false,dx:0};
 }
 function move(x,y,id,event){
  if(!session||session.id!==id)return;
  const dx=session.x-x,dy=session.y-y;
  if(!session.active){
   // Ignore vertical scroll attempts — only an inward pull can capture the screen.
   if(dx<=MIN_START_PX||Math.abs(dy)>dx*1.1)return;
   session.active=true;markPreview();
  }
  session.dx=dx;
  const p=progressFromDistance(dx,limits(getDims().width).drag);
  queue(p);
  if(event?.cancelable)event.preventDefault();
 }
 function finish(x,y,id,event,cancel=false){
  if(!session||session.id!==id)return;
  const item=session;session=null;
  if(!item.active)return; // A tap still uses the existing click handler.
  if(frame){caf(frame);frame=0;paint(queued??current)}
  const dx=item.x-x;
  const p=progressFromDistance(dx,limits(getDims().width).drag);
  paint(p);
  ignoreClickUntil=Date.now()+550;
  if(event?.cancelable)event.preventDefault();
  event?.stopPropagation?.();
  settle(!cancel&&snap(p,dx,now()-item.started));
 }
 listen(launcher,'touchstart',event=>{
  if(event.touches?.length!==1)return;
  const t=event.changedTouches?.[0]||event.touches[0];
  if(t)begin(t.clientX,t.clientY,t.identifier,'touch');
 },{passive:true});
 listen(launcher,'touchmove',event=>{
  if(!session||session.source!=='touch')return;
  const t=touchFor(event.changedTouches,session.id);
  if(t)move(t.clientX,t.clientY,t.identifier,event);
 },{passive:false});
 listen(launcher,'touchend',event=>{
  if(!session||session.source!=='touch')return;
  const t=touchFor(event.changedTouches,session.id);
  if(t)finish(t.clientX,t.clientY,t.identifier,event);
 },{passive:false});
 listen(launcher,'touchcancel',event=>{
  if(session?.source!=='touch')return;
  const t=touchFor(event.changedTouches,session.id);
  finish(t?.clientX??session.x,t?.clientY??session.y,session.id,event,true);
 },{passive:false});
 // Pointer events for desktop/pen and browsers without Touch Events. On iPhone,
 // native touch events own the interaction, preventing duplicate progress.
 listen(launcher,'pointerdown',event=>{
  if(event.pointerType==='touch'&&win.TouchEvent)return;
  if(event.pointerType==='mouse'&&event.button!==0)return;
  begin(event.clientX,event.clientY,event.pointerId,'pointer');
  try{launcher.setPointerCapture?.(event.pointerId)}catch{}
 });
 listen(launcher,'pointermove',event=>{
  if(session?.source==='pointer')move(event.clientX,event.clientY,event.pointerId,event);
 });
 listen(launcher,'pointerup',event=>{
  if(session?.source==='pointer')finish(event.clientX,event.clientY,event.pointerId,event);
 });
 listen(launcher,'pointercancel',event=>{
  if(session?.source==='pointer')finish(event.clientX,event.clientY,event.pointerId,event,true);
 });
 listen(launcher,'click',event=>{
  if(Date.now()<ignoreClickUntil){event.preventDefault();event.stopImmediatePropagation?.()}
 },{capture:true});
 listen(win,'resize',()=>{
  if(frame)caf(frame);
  frame=0;paint(current);
 },{passive:true});
 // This is the only reset that should occur when an already opened drawer closes.
 function reset(){
  stopAnimation();
  if(frame){caf(frame);frame=0}
  session=null;clearPreview();paint(0);
  overlay.dataset.pulledOpen='false';
 }
 const controller={reset,get progress(){return current},paint,settle,
   destroy(){reset();for(const [node,name,fn,opts]of listeners)node.removeEventListener(name,fn,opts);delete launcher.dataset.pullReady}};
 win.lumaQuickPull=controller;
 paint(0);
 return controller;
}
const api={attach,limits,armPath,beamGeometry,progressFromDistance,snap,COMMIT_AT};
root.LumaQuickPull=api;
if(typeof module==='object'&&module.exports)module.exports=api;
if(root.document){
 const init=()=>attach();
 if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
}
})(typeof globalThis!=='undefined'?globalThis:this);
