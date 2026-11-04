/* Luma Flow V4.4: magnetic brightness docking with true physical rail, preserving Hue controls.
   Only used by /flow-v44/; keeps V4.1 live Hue controls and lamp-card dimmers.
   No text glyphs on the L arm, no extra polling of the Hue Bridge. */
(function(root){'use strict';
const PREF_KEY='luma_v44_lamp_prefs';
const DESIGNS=['vintage','deco','washi','halo'];
// Each option has a genuinely different silhouette, not a recolored pleated cone.
const shape={
 vintage:{
  shade:'M20 28 L43 28 Q45 28 46 32 L60 72 Q32 78 4 72 L18 32 Q19 28 20 28 Z',
  rim:'M20 28 L43 28',opening:'M20 28 Q32 26 43 28 Q33 30 20 28 Z'
 },
 deco:{
  shade:'M22 31 H43 L54 48 L62 59 Q33 66 2 59 L10 48 Z',
  rim:'M22 31 H43',opening:'M22 31 H43 L45 34 H20 Z'
 },
 washi:{
  shade:'M28 19 Q44 17 51 33 Q61 50 58 70 Q56 85 41 91 Q24 95 14 82 Q4 66 9 48 Q13 28 28 19 Z',
  rim:'M28 19 Q39 16 51 33',opening:'M28 20 Q39 17 51 33 Q38 29 28 20 Z'
 },
 halo:{
  shade:'M32 42 C49 42 61 50 61 65 C61 81 49 89 32 89 C15 89 3 81 3 65 C3 50 15 42 32 42 Z M32 50 C20 50 11 56 11 65 C11 75 20 81 32 81 C44 81 53 75 53 65 C53 56 44 50 32 50 Z',
  rim:'M11 51 Q32 32 54 51',opening:'M26 44 Q32 40 38 44 Q32 46 26 44 Z'
 }
};
const clamp=(x,a,b)=>Math.min(b,Math.max(a,Number.isFinite(+x)?+x:a));
function load(store){try{
 const x=JSON.parse(store.getItem(PREF_KEY)||'{}');
 return {design:DESIGNS.includes(x.design)?x.design:'vintage',hand:x.hand==='left'?'left':'right'};
}catch{return {design:'vintage',hand:'right'}}}
function fromPercent(n){return Math.round(1+(clamp(n,1,100)-1)*253/99)}
function brightness(state){return state?.on===false?0:Math.round(clamp((state?.bri??180)/254,0,1)*100)}
function selected(snapshot,ids){
 if(!Array.isArray(ids)||!Array.isArray(snapshot?.devices)||snapshot.devices.length!==ids.length)return [];
 return ids.map((id,index)=>({id,name:snapshot.devices[index]?.name||'Lampe '+(index+1),state:snapshot.devices[index]?.state||{}}));
}
function create(doc=root.document,win=root){
 const el=id=>doc.getElementById(id);
 const launcher=el('quickLauncher'),head=el('ambientMovingHead'),
       first=el('quickPanelBody'),settings=el('settingsMenu');
 if(!launcher||!head||!first||!settings)return null;
 if(doc.documentElement.dataset.v44Ready==='true')return null;
 doc.documentElement.dataset.v44Ready='true';
 const shade=head.querySelector('.ambient-lamp-silhouette'),
       rim=head.querySelector('.ambient-lamp-rim'),
       opening=head.querySelector('.ambient-lamp-top-opening');
 if(!shade||!rim||!opening)return null;
 let prefs=load(win.localStorage);
 const prefsCard=doc.createElement('section');
 prefsCard.id='v44SettingsCard';prefsCard.className='v41-prefs';
 prefsCard.setAttribute('aria-label','Ambient-Lampe anpassen');
 prefsCard.innerHTML=
  '<strong>✦ Lampenstil · V4.4</strong>'+
  '<div class="v41-style-choices" role="group" aria-label="Lampenschirm auswählen">'+
  '<button type="button" data-v41-design="vintage">Leinen</button>'+
  '<button type="button" data-v41-design="deco">Art Déco</button>'+
  '<button type="button" data-v41-design="washi">Washi</button>'+
  '<button type="button" data-v41-design="halo">Halo</button></div>'+
  '<label class="v41-check"><input type="checkbox" id="v41LeftHand"> Linkshänder · Lampe links</label>'+
  '<small>Deine Auswahl bleibt nur auf diesem Gerät gespeichert.</small>';
 settings.append(prefsCard);
 const handInput=el('v41LeftHand');
 function applyPrefs(){
  doc.documentElement.dataset.v4Design=prefs.design==='vintage'?'vintage':'v42-custom';
  doc.documentElement.dataset.v42Design=prefs.design;
  doc.documentElement.dataset.v4Hand=prefs.hand;
  shade.setAttribute('d',shape[prefs.design].shade);
  rim.setAttribute('d',shape[prefs.design].rim);
  opening.setAttribute('d',shape[prefs.design].opening);
  const clothClip=doc.querySelector('#v41ClothClip path');
  if(clothClip)clothClip.setAttribute('d',shape[prefs.design].shade);
  const edge=doc.querySelector('.v41-shade-edge-shadow');
  if(edge)edge.setAttribute('d',shape[prefs.design].shade);
  const warmth=doc.querySelector('.v41-shade-warmth');
  if(warmth)warmth.setAttribute('d',shape[prefs.design].shade);
  const inner=doc.querySelector('.v42-inner-radiance');
  if(inner)inner.setAttribute('d',shape[prefs.design].shade);
  const innerEdge=doc.querySelector('.v42-inner-edge');
  if(innerEdge)innerEdge.setAttribute('d',shape[prefs.design].shade);
  handInput.checked=prefs.hand==='left';
  const left=prefs.hand==='left';
  launcher.setAttribute('aria-label',left?'Lampe nach rechts ziehen oder öffnen':'Lampe nach links ziehen oder öffnen');
  const grip=el('quickLampGrip');
  if(grip)grip.setAttribute('aria-label',left?'Lampenschirm nach links ziehen, um Quick Control zu schließen':'Lampenschirm nach rechts ziehen, um Quick Control zu schließen');
  for(const button of prefsCard.querySelectorAll('[data-v41-design]')){
   button.setAttribute('aria-pressed',String(button.dataset.v41Design===prefs.design));
  }
  win.lumaQuickPull?.paint?.(win.lumaQuickPull?.progress??0);
 }
 function savePrefs(){
  try{win.localStorage.setItem(PREF_KEY,JSON.stringify(prefs))}catch{}
  applyPrefs();
 }
 prefsCard.addEventListener('click',event=>{
  const b=event.target.closest?.('[data-v41-design]');
  if(!b||!DESIGNS.includes(b.dataset.v41Design))return;
  prefs.design=b.dataset.v41Design;savePrefs();
 });
 handInput.addEventListener('change',()=>{
  if(win.lumaQuickControl?.isOpen?.()){
   handInput.checked=prefs.hand==='left';
   showFeedback('Zum Seitenwechsel Quick-Control erst schließen.');
   return;
  }
  prefs.hand=handInput.checked?'left':'right';savePrefs();
 });

 const master=doc.createElement('section');master.className='v41-master';
 master.innerHTML=
  '<div class="v41-master-head"><strong>☀ Gesamthelligkeit</strong><output id="v41MasterValue" for="v41Master">–</output></div>'+
  '<input id="v41Master" type="range" min="1" max="100" step="1" value="75" aria-label="Gesamthelligkeit für aktuell ausgewählten Lichtbereich">'+
  '<p id="v41MasterFeedback" role="status" aria-live="polite">Bridge verbinden · beim Loslassen anwenden</p>';
 first.prepend(master);
 // The physical shade docks beside the existing master slider, not on top of it.
 // The socket is a focus target, never a second Hue brightness control.
 const socket=doc.createElement('button');
 socket.id='v44DockSocket';socket.className='v44-dock-socket';
 socket.type='button';socket.setAttribute('aria-label','Lampe andocken · Gesamthelligkeit einstellen');
 socket.setAttribute('aria-pressed','false');
 socket.setAttribute('aria-controls','v41Master');
 socket.innerHTML='<span class="v44-dock-ring" aria-hidden="true">◉</span><span class="v44-dock-title">LUMA</span>';
 master.append(socket);
 const masterSlider=el('v41Master'),masterValue=el('v41MasterValue'),hint=el('v41MasterFeedback');
 let highlightTimer=0;
 function activateBrightness(){
  if(!win.lumaQuickControl?.isOpen?.())return;
  master.classList.add('v44-brightness-active');
  // Never change Hue brightness unless the user actually moves the slider.
  masterSlider.focus({preventScroll:true});
  hint.textContent='☀ Helligkeit hier einstellen · beim Loslassen übernehmen';
  win.clearTimeout(highlightTimer);
  highlightTimer=win.setTimeout(()=>master.classList.remove('v44-brightness-active'),1700);
 }
 socket.addEventListener('click',activateBrightness);
 win.lumaV44ActivateBrightness=activateBrightness;
 let busy=false,pending=null,sequence=0;
 function showFeedback(msg){hint.textContent=msg;}
 function devices(){
  const state=win.lumaAmbientLightState?.(),ids=win.lumaTargetIds?.();
  return state?.connected?selected(state,ids):[];
 }
 function refresh(){
  if(doc.hidden||busy||doc.activeElement===masterSlider)return;
  const entries=devices();
  masterSlider.disabled=!entries.length;
  if(!entries.length){masterValue.textContent='–';showFeedback('Bridge verbinden, um Licht zu dimmen.');return;}
  const lit=entries.filter(x=>x.state?.on!==false&&x.state?.reachable!==false);
  const average=lit.length?Math.round(lit.reduce((n,x)=>n+brightness(x.state),0)/lit.length):0;
  masterSlider.value=String(Math.max(1,average));
  masterValue.textContent=average+' %';
  showFeedback(lit.length?'Für '+entries.length+' Lampen · beim Loslassen anwenden':'Lampen aus · Schieben schaltet Auswahl ein');
 }
 masterSlider.addEventListener('input',()=>{
  masterValue.textContent=masterSlider.value+' %';
  showFeedback('Loslassen zum Übernehmen');
 });
 masterSlider.addEventListener('change',()=>{
  const batch=devices().filter(x=>x.state?.reachable!==false).map(x=>({id:x.id,percent:+masterSlider.value}));
  if(!batch.length){refresh();return;}
  if(!win.lumaBridgeConnected?.()){showFeedback('Bridge nicht verbunden.');return;}
  if(win.lumaMusicActive?.()){showFeedback('Musiklicht stoppen, bevor du die Helligkeit änderst.');return;}
  win.lumaStopMotion?.();
  pending={batch,target:el('target')?.value,sequence:++sequence};
  if(!busy)void drain();
 });
 async function drain(){
  busy=true;
  try{
   while(pending){
    const job=pending;pending=null;
    showFeedback('Helligkeit wird eingestellt …');
    let success=0,fail=0;
    for(let offset=0;offset<job.batch.length;offset+=3){
     if(job.sequence!==sequence||job.target!==el('target')?.value)break;
     const chunk=job.batch.slice(offset,offset+3);
     const results=await Promise.allSettled(chunk.map(async x=>{
      const body={on:true,bri:fromPercent(x.percent)};
      const reply=await win.lumaRequest('PUT','/lights/'+encodeURIComponent(x.id)+'/state',body,{music:true});
      if(!Array.isArray(reply)||!reply.some(item=>item?.success))throw Error('Hue hat Befehl nicht bestätigt');
      const allIds=win.lumaTargetIds?.()||[];
      const index=allIds.indexOf(x.id);
      const lamp=win.lumaAmbientLightState?.()?.devices?.[index];
      if(lamp?.state)Object.assign(lamp.state,body);
     }));
     success+=results.filter(r=>r.status==='fulfilled').length;
     fail+=results.filter(r=>r.status==='rejected').length;
    }
    if(job.sequence===sequence){
     showFeedback(fail?success+' geändert · '+fail+' fehlgeschlagen':success+' Lampen angepasst ✓');
    }
   }
  }finally{busy=false;win.setTimeout(refresh,850);}
 }
 const interval=win.setInterval(refresh,1050);
 el('target')?.addEventListener('change',()=>win.setTimeout(refresh,220));
 applyPrefs();refresh();
 win.setTimeout(()=>win.lumaQuickPull?.updateDock?.(),150);
 win.addEventListener('pagehide',()=>{
  win.clearInterval(interval);
  win.clearTimeout(highlightTimer);
  if(win.lumaV44ActivateBrightness===activateBrightness)delete win.lumaV44ActivateBrightness;
 },{once:true});
 return {get prefs(){return {...prefs}},applyPrefs,refresh};
}
const api={load,fromPercent,brightness,selected,shape,create};
root.LumaV44=api;
if(typeof module==='object'&&module.exports)module.exports=api;
if(root.document){
 const init=()=>create();
 if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
}
})(typeof globalThis!=='undefined'?globalThis:this);
