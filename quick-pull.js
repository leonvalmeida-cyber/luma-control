/* Luma Pull to Open v1.0 — actual 0..1 finger-following mechanical interaction.
 * Does not read/write Hue lights, microphones, or persistent app settings.
 * The fixed wall plate, movable lamp shade, telescopic arm, rim light cone and
 * existing Quick Control panel share exactly one progress value per frame.
 */
(function(root){'use strict';
const MIN_START_PX=7,COMMIT_AT=.43,CLOSE_AT=.57,QUICK_FLICK_PX=62;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,Number.isFinite(x)?x:0));
const round=x=>Math.round(x*10)/10;
const snap=(progress,dx,elapsedMs)=>progress>=COMMIT_AT||(dx>=QUICK_FLICK_PX&&elapsedMs>0&&elapsedMs<205);
const snapClose=(progress,rightDx,elapsedMs)=>progress<=CLOSE_AT||(rightDx>=QUICK_FLICK_PX&&elapsedMs>0&&elapsedMs<205);
function limits(width){
 const w=Math.max(240,Number(width)||390);
 return {drag:clamp(w*.53,174,230),pull:clamp(w*.43,132,172)};
}
const progressFromDistance=(distance,limit)=>clamp(Math.max(0,distance)/Math.max(1,limit));
function armPath(pull,svgWidth=73){
 // The user's drawn L: shade-supported vertical downstroke + rightward foot
 // connected to a fixed wall plate. Only the free-end x coordinate changes.
 const end=43-pull*(100/svgWidth);
 return 'M'+round(end)+' 78 V100 Q'+round(end)+' 106 '+round(end+7)+' 106 H86';
}
function beamGeometry(width,height,x,y){
 // shade lip in viewport CSS px; both main cone and top spill originate here.
 const w=Math.max(1,width),h=Math.max(1,height),cx=round(x),rimY=round(y);
 const leftLip=round(x-15),rightLip=round(x+15),bottomY=round(Math.max(h+50,y+h*.80));
 const farLeft=round(x-w*.92),farRight=rightLip;
 const bands=[];
 for(let i=0;i<3;i++){
  const nearA=round(leftLip+(rightLip-leftLip)*(i/3));
  const nearB=round(leftLip+(rightLip-leftLip)*((i+1)/3));
  const farA=round(farLeft+(farRight-farLeft)*(i/3));
  const farB=round(farLeft+(farRight-farLeft)*((i+1)/3));
  // Same lower edge for every band. The extreme right side is a *vertical*
  // boundary from the right lip to the floor, never an arbitrary slanted wedge.
  bands.push('M'+nearA+' '+rimY+' L'+farA+' '+bottomY+' L'+farB+' '+bottomY+' L'+nearB+' '+rimY+' Z');
 }
 const yTop=round(y-32),span=round(Math.min(w*.24,116)),rise=round(Math.min(h*.22,174));
 // Symmetric upper aperture: equally wide left/right spread about the exact center.
 const up='M'+round(x-12)+' '+yTop+
  ' L'+round(x-span)+' '+round(yTop-rise)+
  ' Q'+cx+' '+round(yTop-rise*1.18)+' '+round(x+span)+' '+round(yTop-rise)+
  ' L'+round(x+12)+' '+yTop+' Z';
 return {bands,up,origin:[cx,rimY],leftLip,rightLip,wallEdgeX:farRight,
   topOrigin:[cx,yTop],topEndpoints:[round(x-span),round(x+span)],edges:[[farLeft,bottomY],[farRight,bottomY]]};
}
function attach({doc=root.document,win=root}={}){
 const launcher=doc?.getElementById?.('quickLauncher');
 const grip=doc?.getElementById?.('quickLampGrip');
 const overlay=doc?.getElementById?.('quickOverlay');
 const sheet=doc?.querySelector?.('.quick-sheet');
 const backdrop=doc?.getElementById?.('quickBackdrop');
 const arm=doc?.getElementById?.('ambientLampArm');
 const beamCanvas=doc?.getElementById?.('ambientBeamCanvas');
 const beamPaths=[1,2,3].map(i=>doc?.getElementById?.('ambientBeam'+i));
 const beamUp=doc?.getElementById?.('ambientBeamUp');
 if(!launcher||!grip||!overlay||!sheet||!backdrop||!arm||!beamCanvas||beamPaths.some(x=>!x)||!beamUp)return null;
 if(launcher.dataset.pullReady==='true')return null;
 launcher.dataset.pullReady='true';
 const rootStyle=doc.documentElement.style;
 const listeners=[], listen=(node,name,fn,opts)=>{node.addEventListener(name,fn,opts);listeners.push([node,name,fn,opts])};
 const raf=win.requestAnimationFrame?.bind(win)||((fn)=>win.setTimeout(fn,16));
 const caf=win.cancelAnimationFrame?.bind(win)||win.clearTimeout?.bind(win)||(()=>{});
 const now=()=>win.performance?.now?.()??Date.now();
 let current=0,session=null,animation=0,frame=0,queued=null,preview=false,ignoreClickUntil=0,settleTimer=0;
 const initialTop=launcher.getBoundingClientRect().top;
 const opened=()=>launcher.getAttribute?.('aria-expanded')==='true';
 const scheduleTimeout=win.setTimeout?.bind(win)||setTimeout,clearScheduled=win.clearTimeout?.bind(win)||clearTimeout;
 const getDims=()=>({width:Math.max(1,win.innerWidth||390),height:Math.max(1,win.innerHeight||844)});
 function position(p){
  const rect=launcher.getBoundingClientRect(),{width,height}=getDims(),limit=limits(width);
  const distance=limit.pull*p,svgWidth=73;
  // A measured fixed base prevents WebKit from double-counting its own transform.
  const lift=clamp(height*.07,40,59)*p;
  const headX=rect.left+(.31*svgWidth)-distance;
  const rimY=initialTop+(78/124*96)-lift;
  return {distance,lift,svgWidth,width,height,headX,rimY};
 }
 function paint(p){
  current=clamp(p);
  const g=position(current);
  const glow=beamGeometry(g.width,g.height,g.headX,g.rimY);
  rootStyle.setProperty('--luma-pull-px',round(g.distance)+'px');
  rootStyle.setProperty('--luma-open-lift-px',round(g.lift)+'px');
  // WebKit SVG g translations use viewBox units: convert CSS-pixel travel
  // so the moving shade stays perfectly joined to the actual arm endpoint.
  rootStyle.setProperty('--luma-head-svg-px',round(g.distance*100/g.svgWidth)+'px');
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
  if(settleTimer){clearScheduled(settleTimer);settleTimer=0}
 }
 function markPreview(mode){
  if(preview)return;
  preview=true;
  overlay.hidden=false;
  sheet.inert=true; // During the partial drag the drawer is a visual preview, not a focusable modal.
  overlay.classList.add('quick-preview');
  overlay.classList.remove('quick-retract');
  overlay.dataset.pulledOpen=mode==='close'?'true':'false';
  launcher.classList.add('quick-pulling');
  sheet.style.animation='none';
  sheet.style.transition='none';
  backdrop.style.transition='none';
  overlay.style.pointerEvents='none';
 }
 function clearPreview(){
  preview=false;
  sheet.inert=false;
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
  // A preview is visible, but not an opened modal: never mistake it for isOpen().
  if(!opened())overlay.hidden=true;
  paint(0);
 }
 function settle(shouldOpen,fromOpen=false){
  stopAnimation();
  if(frame){caf(frame);frame=0;paint(queued??current)}
  const start=current,end=shouldOpen?1:0,t0=now();
  const reduce=win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const duration=reduce?0:shouldOpen?210:190;
  let completed=false;
  const finish=()=>{
   if(completed)return;
   completed=true;stopAnimation();paint(end);
   if(shouldOpen){
    launcher.dataset.pullPhase='opened';
    clearPreview();
    overlay.dataset.pulledOpen='true';
    grip.hidden=false;
    if(!fromOpen)win.lumaQuickControl?.open?.();
    // Returning to open must not re-lock body or recapture scrollY.
   }else if(fromOpen){
    launcher.dataset.pullPhase='closed';
    clearPreview();
    win.lumaQuickControl?.close?.({immediate:true});
   }else{
    launcher.dataset.pullPhase='retracted';
    rollback();
   }
  };
  settleTimer=scheduleTimeout(finish,duration+85);
  function step(t){
   if(completed)return;
   const u=duration?clamp((t-t0)/duration):1;
   launcher.dataset.pullPhase='settling-'+round(u);
   paint(start+(end-start)*(1-Math.pow(1-u,3)));
   if(u<1){animation=raf(step);return}
   finish();
  }
  animation=raf(step);
 }
 const touchFor=(touches,id)=>Array.from(touches||[]).find(x=>x.identifier===id);
 function begin(x,y,id,source,mode){
  if(session)return;
  if(mode==='open'&&opened())return;
  if(mode==='close'&&!opened())return;
  stopAnimation();
  session={x,y,id,source,mode,started:now(),active:false};
 }
 function move(x,y,id,event){
  if(!session||session.id!==id)return;
  const mode=session.mode,dx=mode==='open'?session.x-x:x-session.x;
  const dy=session.y-y;
  if(!session.active){
   if(dx<=MIN_START_PX||Math.abs(dy)>dx*1.12)return;
   session.active=true;
   markPreview(mode);
  }
  const fraction=progressFromDistance(dx,limits(getDims().width).drag);
  // The SAME progress controls the L arm, shade, rim-origin light and drawer.
  paint(mode==='open'?fraction:1-fraction);
  if(event?.cancelable)event.preventDefault();
 }
 function finish(x,y,id,event,cancel=false){
  if(!session||session.id!==id)return;
  const item=session;session=null;
  if(!item.active)return; // tap remains a normal button action
  const distance=item.mode==='open'?item.x-x:x-item.x;
  const fraction=progressFromDistance(distance,limits(getDims().width).drag);
  const p=item.mode==='open'?fraction:1-fraction;
  paint(p);
  ignoreClickUntil=Date.now()+330;
  launcher.dataset.pullPhase='released-'+round(p);
  if(event?.cancelable)event.preventDefault();
  event?.stopPropagation?.();
  const shouldOpen=cancel?(item.mode==='close'):
    item.mode==='open'?snap(p,distance,now()-item.started):
    !snapClose(p,distance,now()-item.started);
  settle(shouldOpen,item.mode==='close');
 }
 function bind(node,mode){
  listen(node,'touchstart',event=>{
   if(event.touches?.length!==1)return;
   const t=event.changedTouches?.[0]||event.touches[0];
   if(t)begin(t.clientX,t.clientY,t.identifier,'touch',mode);
  },{passive:true});
  listen(node,'touchmove',event=>{
   if(!session||session.source!=='touch'||session.mode!==mode)return;
   const t=touchFor(event.changedTouches,session.id);
   if(t)move(t.clientX,t.clientY,t.identifier,event);
  },{passive:false});
  listen(node,'touchend',event=>{
   if(!session||session.source!=='touch'||session.mode!==mode)return;
   const t=touchFor(event.changedTouches,session.id);
   if(t)finish(t.clientX,t.clientY,t.identifier,event);
  },{passive:false});
  listen(node,'touchcancel',event=>{
   if(session?.source!=='touch'||session.mode!==mode)return;
   const t=touchFor(event.changedTouches,session.id);
   finish(t?.clientX??session.x,t?.clientY??session.y,session.id,event,true);
  },{passive:false});
  // Safari Touch Events own touch interactions. Pointer events are fallbacks
  // for desktop mouse, pen and other browsers.
  listen(node,'pointerdown',event=>{
   if(event.pointerType==='touch'&&win.TouchEvent)return;
   if(event.pointerType==='mouse'&&event.button!==0)return;
   begin(event.clientX,event.clientY,event.pointerId,'pointer',mode);
   try{node.setPointerCapture?.(event.pointerId)}catch{}
  });
  listen(node,'pointermove',event=>{
   if(session?.source==='pointer'&&session.mode===mode)move(event.clientX,event.clientY,event.pointerId,event);
  });
  listen(node,'pointerup',event=>{
   if(session?.source==='pointer'&&session.mode===mode)finish(event.clientX,event.clientY,event.pointerId,event);
  });
  listen(node,'pointercancel',event=>{
   if(session?.source==='pointer'&&session.mode===mode)finish(event.clientX,event.clientY,event.pointerId,event,true);
  });
  listen(node,'click',event=>{
   if(Date.now()<ignoreClickUntil){event.preventDefault();event.stopImmediatePropagation?.()}
  },{capture:true});
 }
 bind(launcher,'open');
 bind(grip,'close');
 listen(win,'resize',()=>{
  if(frame)caf(frame);
  frame=0;paint(current);
 },{passive:true});
 // This is the only reset that should occur when an already opened drawer closes.
 function reset(){
  stopAnimation();
  if(frame){caf(frame);frame=0}
  session=null;clearPreview();paint(0);
  grip.hidden=true;
  overlay.dataset.pulledOpen='false';
 }
 function showOpened(){
  stopAnimation();paint(1);grip.hidden=false;
  overlay.dataset.pulledOpen='true';
 }
 const controller={reset,showOpened,get progress(){return current},paint,settle,
   destroy(){reset();for(const [node,name,fn,opts]of listeners)node.removeEventListener(name,fn,opts);delete launcher.dataset.pullReady}};
 win.lumaQuickPull=controller;
 paint(0);
 return controller;
}
const api={attach,limits,armPath,beamGeometry,progressFromDistance,snap,snapClose,COMMIT_AT,CLOSE_AT};
root.LumaQuickPull=api;
if(typeof module==='object'&&module.exports)module.exports=api;
if(root.document){
 const init=()=>attach();
 if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
}
})(typeof globalThis!=='undefined'?globalThis:this);
