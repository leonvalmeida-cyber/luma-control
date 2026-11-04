/* Luma Flow V4.1: vintage lamp styling and compact quick master dimmer.
   Only used by /flow-v41/; the shared lamp tree is extended in groups-v41-tree.js.
   No text glyphs on the L arm, no extra polling of the Hue Bridge. */
(function(root){'use strict';
const PREF_KEY='luma_v41_lamp_prefs';
const DESIGNS=['vintage','modern','retro'];
const shape={
 vintage:{
  shade:'M20 28 L43 28 Q45 28 46 32 L60 72 Q32 78 4 72 L18 32 Q19 28 20 28 Z',
  rim:'M20 28 L43 28',
  opening:'M20 28 Q32 26 43 28 Q33 30 20 28 Z'
 },
 modern:{
  shade:'M19 35 L44 35 L58 73 Q32 78 5 73 Z',
  rim:'M19 35 H44',
  opening:'M19 35 L44 35 L45 37 H18 Z'
 },
 retro:{
  shade:'M20 35 Q20 29 32 29 Q44 29 46 35 L60 72 Q32 79 4 72 Z',
  rim:'M20 35 Q32 30 46 35',
  opening:'M20 35 Q32 31 46 35 Q32 38 20 35 Z'
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
 if(doc.documentElement.dataset.v41Ready==='true')return null;
 doc.documentElement.dataset.v41Ready='true';
 const shade=head.querySelector('.ambient-lamp-silhouette'),
       rim=head.querySelector('.ambient-lamp-rim'),
       opening=head.querySelector('.ambient-lamp-top-opening');
 if(!shade||!rim||!opening)return null;
 let prefs=load(win.localStorage);
 const prefsCard=doc.createElement('section');
 prefsCard.id='v41SettingsCard';prefsCard.className='v41-prefs';
 prefsCard.setAttribute('aria-label','Ambient-Lampe anpassen');
 prefsCard.innerHTML=
  '<strong>✦ Lampenstil · V4.1</strong>'+
  '<div class="v41-style-choices" role="group" aria-label="Lampenschirm auswählen">'+
  '<button type="button" data-v41-design="vintage">Leinen-Plissee</button>'+
  '<button type="button" data-v41-design="modern">Modern</button>'+
  '<button type="button" data-v41-design="retro">Retro</button></div>'+
  '<label class="v41-check"><input type="checkbox" id="v41LeftHand"> Linkshänder · Lampe links</label>'+
  '<small>Deine Auswahl bleibt nur auf diesem Gerät gespeichert.</small>';
 settings.append(prefsCard);
 const handInput=el('v41LeftHand');
 function applyPrefs(){
  doc.documentElement.dataset.v4Design=prefs.design;
  doc.documentElement.dataset.v4Hand=prefs.hand;
  shade.setAttribute('d',shape[prefs.design].shade);
  rim.setAttribute('d',shape[prefs.design].rim);
  opening.setAttribute('d',shape[prefs.design].opening);
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
 const masterSlider=el('v41Master'),masterValue=el('v41MasterValue'),hint=el('v41MasterFeedback');
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
 win.addEventListener('pagehide',()=>win.clearInterval(interval),{once:true});
 return {get prefs(){return {...prefs}},applyPrefs,refresh};
}
const api={load,fromPercent,brightness,selected,shape,create};
root.LumaV41=api;
if(typeof module==='object'&&module.exports)module.exports=api;
if(root.document){
 const init=()=>create();
 if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
}
})(typeof globalThis!=='undefined'?globalThis:this);
