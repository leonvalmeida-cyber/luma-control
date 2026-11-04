/* Luma Quick Control swipe gestures.
   Deliberately limited to lamp handle and drawer titlebar: tree scrolling/taps remain native. */
(function(root){'use strict';
const THRESHOLD_OPEN=34,THRESHOLD_CLOSE=80,ANGLE=1.15;
function gesture(dx,dy,kind){
 const ax=Math.abs(dx),ay=Math.abs(dy);
 if(kind==='open')return (dx<-THRESHOLD_OPEN&&ax>ay/ANGLE)||(dy<-(THRESHOLD_OPEN+8)&&ay>ax/ANGLE);
 if(kind==='close')return (dx>THRESHOLD_CLOSE&&ax>ay*ANGLE)||(dy>THRESHOLD_CLOSE+10&&ay>ax*ANGLE);
 return false;
}
function attach({doc=root.document,win=root}={}){
 const launcher=doc?.getElementById?.('quickLauncher');
 const panel=doc?.querySelector?.('.quick-titlebar');
 const sheet=doc?.querySelector?.('.quick-sheet');
 const backdrop=doc?.getElementById?.('quickBackdrop');
 const closeGrip=doc?.getElementById?.('quickSwipeClose');
 if(!launcher||!panel||!sheet||!backdrop)return null;
 if(launcher.dataset?.swipeReady==='true')return null;
 if(launcher.dataset)launcher.dataset.swipeReady='true';
 const api=()=>win.lumaQuickControl;
 const handlers=[],on=(el,event,fn,opts={passive:false})=>{el.addEventListener(event,fn,opts);handlers.push([el,event,fn,opts])};
 let suppressUntil=0;
 function restore(){
  sheet.style.transition='';
  sheet.style.transform='';
  backdrop.style.transition='';
  backdrop.style.opacity='';
 }
 function commit(kind){
  restore();
  suppressUntil=Date.now()+550;
  if(kind==='open')api()?.open?.();
  else api()?.close?.();
 }
 function bind(element,kind){
  let position=null,trackedTouch=null,handledByTouch=false;
  const reset=()=>{position=null;trackedTouch=null;restore()};
  const start=(x,y,id)=>{position={id,x,y};};
  const end=(x,y,id,event)=>{
   if(!position||id!==position.id)return false;
   const dx=x-position.x,dy=y-position.y,accepted=gesture(dx,dy,kind);
   reset();
   if(accepted){commit(kind);event?.preventDefault?.();event?.stopPropagation?.();}
   return accepted;
  };
  // iPhone Safari: Touch Events first. Relying only on pointer capture used to fail
  // when WebKit canceled the pointer as part of a native gesture.
  on(element,'touchstart',event=>{
   if(event.touches?.length!==1)return;
   if(kind==='close'&&event.target?.closest?.('button')&&event.target!==closeGrip)return;
   if(kind==='open'&&api()?.isOpen?.())return;
   if(kind==='close'&&!api()?.isOpen?.())return;
   const t=event.changedTouches?.[0]||event.touches[0];if(!t)return;
   handledByTouch=true;trackedTouch=t.identifier;
   start(t.clientX,t.clientY,t.identifier);
  },{passive:true});
  on(element,'touchmove',event=>{
   if(!position||trackedTouch==null)return;
   const t=[...(event.changedTouches||[])].find(t=>t.identifier===trackedTouch);if(!t)return;
   const dx=t.clientX-position.x,dy=t.clientY-position.y;
   // The launcher is a gesture target; prevent page scroll only once a clear swipe starts.
   if(kind==='open'&&(dx< -12||dy< -18)){
    event.preventDefault();
   }else if(kind==='close'&&(dx>17||dy>24)){
    const horizontal=dx>Math.abs(dy)*.9;
    const vertical=dy>Math.abs(dx)*1.2;
    if(horizontal||vertical){
     event.preventDefault();
     const distance=Math.min(310,horizontal?dx:dy);
     sheet.style.transition='none';
     sheet.style.transform=horizontal?'translate3d('+distance+'px,0,0)':'translate3d(0,'+distance+'px,0)';
     backdrop.style.transition='none';
     backdrop.style.opacity=String(Math.max(.33,1-distance/420));
    }
   }
  });
  on(element,'touchend',event=>{
   if(trackedTouch==null)return;
   const t=[...(event.changedTouches||[])].find(t=>t.identifier===trackedTouch);
   if(t)end(t.clientX,t.clientY,t.identifier,event);
  });
  on(element,'touchcancel',reset);
  // Pointer events remain a fallback for pen / mouse / non-WebKit mobile devices.
  on(element,'pointerdown',e=>{
   if(handledByTouch&&e.pointerType==='touch')return;
   if(e.pointerType==='mouse'&&e.button!==0)return;
   if(kind==='close'&&e.target?.closest?.('button')&&e.target!==closeGrip)return;
   if(kind==='open'&&api()?.isOpen?.())return;
   if(kind==='close'&&!api()?.isOpen?.())return;
   start(e.clientX,e.clientY,e.pointerId);
   try{element.setPointerCapture?.(e.pointerId)}catch{}
  });
  on(element,'pointermove',e=>{
   if(!position||position.id!==e.pointerId||handledByTouch&&e.pointerType==='touch')return;
   const dx=e.clientX-position.x,dy=e.clientY-position.y;
   if(kind==='close'&&dx>18&&dx>Math.abs(dy)*ANGLE){
    const distance=Math.min(310,dx);
    sheet.style.transition='none';sheet.style.transform='translate3d('+distance+'px,0,0)';
    backdrop.style.transition='none';backdrop.style.opacity=String(Math.max(.33,1-distance/420));
    e.preventDefault();
   }
  });
  on(element,'pointerup',e=>{
   if(handledByTouch&&e.pointerType==='touch')return;
   end(e.clientX,e.clientY,e.pointerId,e);
  });
  on(element,'pointercancel',reset);
  on(element,'lostpointercapture',()=>{if(position)reset()});
  return reset;
 }
 const a=bind(launcher,'open'),b=bind(panel,'close'),c=closeGrip?bind(closeGrip,'close'):()=>{};
 // Prevent a synthesized click after an accepted finger swipe from toggling again.
 on(launcher,'click',event=>{
  if(Date.now()<suppressUntil){event.preventDefault();event.stopImmediatePropagation?.()}
 },true);
 if(closeGrip)on(closeGrip,'click',event=>{
  if(Date.now()<suppressUntil){event.preventDefault();event.stopImmediatePropagation?.()}
 });
 return {destroy(){a();b();c();for(const [el,event,fn,opts]of handlers)el.removeEventListener(event,fn,opts);if(launcher.dataset)delete launcher.dataset.swipeReady}};
}
const api={gesture,attach,THRESHOLD_OPEN,THRESHOLD_CLOSE};
root.LumaQuickSwipe=api;
if(typeof module==='object'&&module.exports)module.exports=api;
if(root.document){
 const init=()=>attach();
 if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
}
})(typeof globalThis!=='undefined'?globalThis:this);
