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
function armPath(pull,svgWidth=73,design='vintage'){
 const end=43-pull*(100/svgWidth),r=x=>round(x);
 const e=r(end),joint=r(end+7);
 // Alternate lamp models deliberately use completely different metal geometry,
 // not a renamed version of the linen lamp.
 if(design==='deco')return 'M'+e+' 79 L'+e+' 96 L'+r(end+10)+' 106 H86';
 if(design==='washi')return 'M'+e+' 79 C'+r(end+6)+' 90 '+r(end+7)+' 99 '+r(end+18)+' 102 Q'+r(end+28)+' 106 '+r(end+36)+' 106 H86';
 if(design==='halo')return 'M'+e+' 78 L'+e+' 101 Q'+r(end+2)+' 106 '+r(end+9)+' 106 H86';
 // LUMA is ONE CONTINUOUS BENT-METAL CENTRELINE, not SVG text and not
 // a label drawn on top. All lowercase loops are part of the same tube.
 // At rest, letter height and horizontal extension both collapse back to L.
 const t=clamp((pull-10)/130),height=t*t*(3-2*t),scale=clamp(pull/93,0,1.85);
 const x=n=>r(end+n*scale),y=n=>r(106+n*height);
 return 'M'+e+' 78 L'+e+' 99 Q'+e+' 106 '+joint+' 106'
  +' L'+x(11)+' 106'
  // u - visible upward stroke, rounded bottom and rising second stroke.
  +' C'+x(15)+' '+y(-6)+' '+x(14)+' '+y(-19)+' '+x(18)+' '+y(-20)
  +' C'+x(15)+' '+y(7)+' '+x(28)+' '+y(7)+' '+x(31)+' '+y(-3)
  +' L'+x(34)+' '+y(-19)
  +' C'+x(32)+' '+y(-4)+' '+x(37)+' '+y(3)+' '+x(40)+' 106'
  // m - two distinct upward arches, with lower downstrokes.
  +' L'+x(43)+' '+y(-20)
  +' C'+x(47)+' '+y(-28)+' '+x(53)+' '+y(-22)+' '+x(53)+' '+y(-14)
  +' L'+x(54)+' 106'
  +' C'+x(56)+' '+y(-25)+' '+x(66)+' '+y(-24)+' '+x(67)+' '+y(-14)
  +' L'+x(67)+' 106'
  +' Q'+x(71)+' '+y(-12)+' '+x(75)+' '+y(-15)
  // a - genuine cursive loop with a closing sweep into the arm's right foot.
  +' C'+x(84)+' '+y(-27)+' '+x(96)+' '+y(-18)+' '+x(92)+' '+y(-8)
  +' C'+x(88)+' '+y(6)+' '+x(76)+' '+y(5)+' '+x(78)+' '+y(-4)
  +' C'+x(80)+' '+y(-14)+' '+x(91)+' '+y(-18)+' '+x(94)+' '+y(-11)
  +' L'+x(95)+' 106'
  +' Q'+x(99)+' '+y(3)+' '+x(103)+' 106'
  +' H86';
}
function beamGeometry(width,height,x,y){
 // A truly symmetrical lamp cone, measured from the *moving shade lip*.
 // Neither outside edge is vertical: the right side mirrors the left side.
 const w=Math.max(1,width),h=Math.max(1,height),cx=round(x),rimY=round(y);
 const halfLip=16,spread=round(Math.min(w*.60,Math.max(168,h*.31)));
 const leftLip=round(x-halfLip),rightLip=round(x+halfLip);
 const farLeft=round(x-spread),farRight=round(x+spread);
 const bottomY=round(Math.max(h+48,y+h*.82));
 const bands=[];
 for(let i=0;i<3;i++){
  const a=i/3,b=(i+1)/3;
  const nearA=round(leftLip+(rightLip-leftLip)*a),
        nearB=round(leftLip+(rightLip-leftLip)*b);
  const farA=round(farLeft+(farRight-farLeft)*a),
        farB=round(farLeft+(farRight-farLeft)*b);
  bands.push('M'+nearA+' '+rimY+' L'+farA+' '+bottomY+' L'+farB+' '+bottomY+' L'+nearB+' '+rimY+' Z');
 }
 const yTop=round(y-32),span=round(Math.min(w*.24,116)),rise=round(Math.min(h*.22,174));
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
 const armHighlight=doc?.getElementById?.('v41ArmHighlight');
 if(!launcher||!grip||!overlay||!sheet||!backdrop||!arm||!beamCanvas||beamPaths.some(x=>!x)||!beamUp)return null;
 if(launcher.dataset.pullReady==='true')return null;
 launcher.dataset.pullReady='true';
 const rootStyle=doc.documentElement.style;
 const listeners=[], listen=(node,name,fn,opts)=>{node.addEventListener(name,fn,opts);listeners.push([node,name,fn,opts])};
 const raf=win.requestAnimationFrame?.bind(win)||((fn)=>win.setTimeout(fn,16));
 const caf=win.cancelAnimationFrame?.bind(win)||win.clearTimeout?.bind(win)||(()=>{});
 const now=()=>win.performance?.now?.()??Date.now();
 let current=0,session=null,animation=0,frame=0,queued=null,preview=false,ignoreClickUntil=0,settleTimer=0,dock=0;
 const initialTop=launcher.getBoundingClientRect().top;
 const opened=()=>launcher.getAttribute?.('aria-expanded')==='true';
  const mirrored=()=>doc.documentElement?.dataset?.v4Hand==='left';
 const scheduleTimeout=win.setTimeout?.bind(win)||setTimeout,clearScheduled=win.clearTimeout?.bind(win)||clearTimeout;
 const getDims=()=>({width:Math.max(1,win.innerWidth||390),height:Math.max(1,win.innerHeight||844)});
 function position(p){
  const rect=launcher.getBoundingClientRect(),{width,height}=getDims(),limit=limits(width);
  const distance=limit.pull*p,svgWidth=73;
  // A measured fixed base prevents WebKit from double-counting its own transform.
  const lift=clamp(height*.07,40,59)*p;
  const headX=mirrored()?width-(rect.right-(.31*svgWidth))-distance:rect.left+(.31*svgWidth)-distance;
  const rimY=initialTop+(78/124*96)-lift-dock;
  return {distance,lift,svgWidth,width,height,headX,rimY};
 }
 function paint(p){
  current=clamp(p);
  const g=position(current);
  const glow=beamGeometry(g.width,g.height,g.headX,g.rimY);
  rootStyle.setProperty('--luma-pull-px',round(g.distance)+'px');
  rootStyle.setProperty('--v42-dock-px',round(dock)+'px');
  rootStyle.setProperty('--luma-open-lift-px',round(g.lift)+'px');
  // WebKit SVG g translations use viewBox units: convert CSS-pixel travel
  // so the moving shade stays perfectly joined to the actual arm endpoint.
  rootStyle.setProperty('--luma-head-svg-px',round(g.distance*100/g.svgWidth)+'px');
  launcher.dataset.pullProgress=current.toFixed(3);
  overlay.dataset.pullProgress=current.toFixed(3);
  arm.setAttribute('d',armPath(g.distance,g.svgWidth,doc.documentElement?.dataset?.v42Design||'vintage'));
  armHighlight?.setAttribute('d',arm.getAttribute('d'));
  beamCanvas.setAttribute('viewBox','0 0 '+g.width+' '+g.height);
  for(let i=0;i<3;i++)beamPaths[i].setAttribute('d',glow.bands[i]);
  beamUp.setAttribute('d',glow.up);
  if(preview){
   sheet.style.transform='translate3d('+round((mirrored()?-1:1)*(1-current)*100)+'%,0,0)';
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
  const mode=session.mode,dx=(mirrored()?-1:1)*(mode==='open'?session.x-x:x-session.x);
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
  const distance=(mirrored()?-1:1)*(item.mode==='open'?item.x-x:x-item.x);
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
 const panelBody=doc.getElementById?.('quickPanelBody');
 function onScroll(){
  if(!opened()||overlay.hidden)return;
  const tree=doc.querySelector?.('#targetFastTree .g-tree-inner');
  const travel=(panelBody?.scrollTop||0)+(tree?.scrollTop||0);
  const maxDock=Math.max(0,initialTop-clamp(getDims().height*.07,40,59)-Math.max(48,Math.min(65,getDims().height*.065)));
  const next=round(clamp(travel*.6,0,Math.min(90,maxDock)));
  if(Math.abs(next-dock)<.5)return;
  dock=next;queue(current);
 }
 // Capture scroll of either the drawer or the nested lamp tree, without
 // interfering with native touch, slider dragging, or close gestures.
 listen(overlay,'scroll',onScroll,true);

 listen(win,'resize',()=>{
  if(frame)caf(frame);
  frame=0;paint(current);
 },{passive:true});
 // This is the only reset that should occur when an already opened drawer closes.
 function reset(){
  stopAnimation();
  if(frame){caf(frame);frame=0}
  session=null;dock=0;clearPreview();paint(0);
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
