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
 if(!launcher||!panel||!sheet||!backdrop)return null;
 const api=()=>win.lumaQuickControl;
 const handlers=[],on=(el,event,fn)=>{el.addEventListener(event,fn,{passive:false});handlers.push([el,event,fn])};
 function bind(element,kind){
  let position=null;
  const reset=()=>{
   position=null;
   if(kind==='close'){
    sheet.style.transition='';
    sheet.style.transform='';
    backdrop.style.transition='';
    backdrop.style.opacity='';
   }
  };
  on(element,'pointerdown',e=>{
   if(e.pointerType==='mouse'&&e.button!==0)return;
   if(kind==='close'&&e.target?.closest?.('button'))return; // close-button tap always wins
   if(kind==='open'&&api()?.isOpen?.())return;
   if(kind==='close'&&!api()?.isOpen?.())return;
   position={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
   try{element.setPointerCapture?.(e.pointerId)}catch{}
  });
  on(element,'pointermove',e=>{
   if(!position||position.id!==e.pointerId)return;
   const dx=e.clientX-position.x,dy=e.clientY-position.y;
   if(kind!=='close')return;
   const right=dx>0&&Math.abs(dx)>Math.abs(dy)*ANGLE;
   const down=dy>0&&Math.abs(dy)>Math.abs(dx)*ANGLE;
   if(!right&&!down)return;
   position.moved=true;
   const distance=Math.min(320,right?dx:dy);
   sheet.style.transition='none';
   sheet.style.transform=right?'translate3d('+distance+'px,0,0)':'translate3d(0,'+distance+'px,0)';
   backdrop.style.transition='none';
   backdrop.style.opacity=String(Math.max(.34,1-distance/410));
   e.preventDefault();
  });
  on(element,'pointerup',e=>{
   if(!position||position.id!==e.pointerId)return;
   const dx=e.clientX-position.x,dy=e.clientY-position.y;
   const accepted=gesture(dx,dy,kind);
   reset();
   if(accepted){
    if(kind==='open')api()?.open?.();
    else api()?.close?.();
    e.preventDefault();
   }
  });
  on(element,'pointercancel',reset);
  on(element,'lostpointercapture',()=>{if(position)reset()});
  return reset;
 }
 const a=bind(launcher,'open'),b=bind(panel,'close');
 return {destroy(){a();b();for(const [el,event,fn]of handlers)el.removeEventListener(event,fn)}};
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
