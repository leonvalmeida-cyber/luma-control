/* Luma Flow V4 - isolated ambient shade personalization and quick brightness.
   Active ONLY on /flow-v4/. Existing Luma Flow remains untouched.
   No networking except existing user-authorized Hue API commands after slider release. */
(function(root){'use strict';
const PREF_KEY='luma_v4_lamp_prefs';
const DESIGNS=['vintage','modern','retro'];
const shape={
 vintage:{shade:'M15 39 Q16 37 21 36 H42 Q47 37 49 40 L59 70 Q32 82 3 69 Z',rim:'M17 38Q31 35 47 39',opening:'M18 38Q32 35 46 39Q32 41 18 38Z'},
 modern:{shade:'M18 39 L44 39 L60 69 Q32 78 3 69 Z',rim:'M18 38H44',opening:'M18 39H44L45 42H17Z'},
 retro:{shade:'M20 40Q21 30 32 29Q43 30 46 40L61 69Q33 84 3 69Z',rim:'M20 39Q32 31 46 39',opening:'M20 39Q32 34 46 39Q32 44 20 39Z'}
};
const clamp=(n,a,b)=>Math.min(b,Math.max(a,Number.isFinite(Number(n))?Number(n):a));
function load(store){try{const x=JSON.parse(store.getItem(PREF_KEY)||'{}');return {
 design:DESIGNS.includes(x.design)?x.design:'vintage',
 hand:x.hand==='left'?'left':'right',
 luna:x.luna!==false
 }}catch{return {design:'vintage',hand:'right',luna:true}}}
function brightness(state){return state?.on===false?0:Math.round(clamp((state?.bri??180)/254,0,1)*100)}
function selected(snapshot,ids){
 if(!Array.isArray(ids)||!Array.isArray(snapshot?.devices)||ids.length!==snapshot.devices.length)return [];
 return ids.map((id,i)=>({id,name:snapshot.devices[i]?.name||'Lampe '+(i+1),state:snapshot.devices[i]?.state||{}}));
}
function fromPercent(value){return Math.round(1+(clamp(value,1,100)-1)*253/99)}
function create(doc=root.document,win=root){
 if(!doc?.getElementById?.('quickLauncher'))return null;
 if(doc.documentElement.dataset.v4Ready==='true')return null;
 doc.documentElement.dataset.v4Ready='true';
 const store=win.localStorage;
 let prefs=load(store);
 const el=id=>doc.getElementById(id);
 const launcher=el('quickLauncher'),head=el('ambientMovingHead');
 const lampArt=launcher.querySelector('.ambient-lamp-art');
 const shade=head?.querySelector('.ambient-lamp-silhouette');
 const rim=head?.querySelector('.ambient-lamp-rim');
 const opening=head?.querySelector('.ambient-lamp-top-opening');
 const first=el('quickPanelBody');
 const setting=el('settingsMenu');
 if(!head||!shade||!rim||!opening||!first||!setting)return null;

 // Vintage pinstripes are painted on the existing moving head, never on a second copy.
 const ns='http://www.w3.org/2000/svg';
 const pleats=doc.createElementNS(ns,'path');
 pleats.classList.add('v4-pleats');
 pleats.setAttribute('d','M19 40Q17 55 14 71 M27 39Q26 58 25 77 M34 38L34 79 M42 40Q44 58 48 74 M50 49L55 70');
 head.insertBefore(pleats,head.querySelector('.ambient-lamp-diffuser'));

 const luna=doc.createElementNS(ns,'text');
 luna.id='v4LunaLettering';
 luna.setAttribute('class','v4-luna');
 luna.setAttribute('y','97');luna.setAttribute('text-anchor','start');
 luna.setAttribute('aria-hidden','true');luna.textContent='una';
 // The L is the existing L-shaped arm, so only "una" is drawn on the arm.
 lampArt.append(luna);

 const prefsCard=doc.createElement('section');prefsCard.id='v4SettingsCard';prefsCard.className='v4-prefs';prefsCard.setAttribute('aria-label','Ambient-Lampe anpassen');
 prefsCard.innerHTML=
   '<div class="v4-pref-title">✦ Lampenstil <small>V4 Vorschau</small></div>'+
   '<div class="v4-designs" role="group" aria-label="Lampenschirm wählen">'+
   '<button data-v4-choice="vintage" type="button">Plissee</button>'+
   '<button data-v4-choice="modern" type="button">Modern</button>'+
   '<button data-v4-choice="retro" type="button">Retro</button></div>'+
   '<label class="v4-check"><input id="v4LeftHand" type="checkbox"> Linkshänder · Lampe links</label>'+
   '<label class="v4-check"><input id="v4LunaEnabled" type="checkbox"> „Luna“ beim Herausziehen zeigen</label>'+
   '<p class="v4-hint">Design und Bedienseite werden nur auf diesem Gerät gespeichert.</p>';
 setting.append(prefsCard);
 const handInput=el('v4LeftHand'),lunaInput=el('v4LunaEnabled');

 function applyPrefs(){
  doc.documentElement.dataset.v4Design=prefs.design;
  doc.documentElement.dataset.v4Hand=prefs.hand;
  doc.documentElement.dataset.v4Luna=String(prefs.luna);
  shade.setAttribute('d',shape[prefs.design].shade);
  rim.setAttribute('d',shape[prefs.design].rim);
  opening.setAttribute('d',shape[prefs.design].opening);
  handInput.checked=prefs.hand==='left';
  lunaInput.checked=prefs.luna;
  for(const b of prefsCard.querySelectorAll('[data-v4-choice]')){
   b.setAttribute('aria-pressed',String(b.dataset.v4Choice===prefs.design));
  }
  win.lumaQuickPull?.paint?.(win.lumaQuickPull?.progress??0);
  paintLettering();
 }
 function savePrefs(){try{store.setItem(PREF_KEY,JSON.stringify(prefs))}catch{}applyPrefs()}
 prefsCard.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-v4-choice]');
  if(!button)return;
  if(!DESIGNS.includes(button.dataset.v4Choice))return;
  prefs.design=button.dataset.v4Choice;savePrefs();
 });
 handInput.addEventListener('change',()=>{
  // Do not mirror an in-progress drag or open panel.
  if(win.lumaQuickControl?.isOpen?.()){
   handInput.checked=prefs.hand==='left';
   showFeedback('Schließe erst die Lichtsteuerung, bevor du die Bedienseite wechselst.');
   return;
  }
  prefs.hand=handInput.checked?'left':'right';savePrefs();
 });
 lunaInput.addEventListener('change',()=>{prefs.luna=lunaInput.checked;savePrefs()});

 // No cloned panel: the existing group tree stays in its original shared host.
 const master=doc.createElement('section');master.className='v4-master';
 master.innerHTML=
   '<div class="v4-master-top"><span>☀ Gesamthelligkeit</span><output id="v4BrightnessValue" for="v4Brightness">–</output></div>'+
   '<input id="v4Brightness" aria-label="Gesamthelligkeit für die ausgewählten Lampen" type="range" min="1" max="100" step="1" value="72">'+
   '<p class="v4-help" id="v4BrightnessHint">Lampen verbinden · beim Loslassen anwenden</p>'+
   '<details id="v4Individual"><summary>Einzelhelligkeit · optional</summary><div id="v4IndividualRows"></div></details>';
 first.prepend(master);
 const masterSlider=el('v4Brightness'),masterValue=el('v4BrightnessValue'),
       hint=el('v4BrightnessHint'),individual=el('v4Individual'),rows=el('v4IndividualRows');
 let busy=false,pending=null,version=0,lastTarget='';
 function showFeedback(message){hint.textContent=message;}
 function currentDevices(){
  const snapshot=win.lumaAmbientLightState?.();
  const ids=win.lumaTargetIds?.()||[];
  if(!snapshot?.connected)return [];
  return selected(snapshot,ids);
 }
 function sync(){
  if(busy||doc.hidden)return;
  const devices=currentDevices();
  const activeTarget=el('target')?.value||'all';
  if(activeTarget!==lastTarget){lastTarget=activeTarget;rows.replaceChildren();}
  masterSlider.disabled=!devices.length;
  if(!devices.length){masterValue.textContent='–';showFeedback('Bridge verbinden, um Helligkeit zu steuern.');individual.hidden=true;return;}
  const lit=devices.filter(d=>d.state?.on!==false);
  const average=lit.length?Math.round(lit.reduce((sum,d)=>sum+brightness(d.state),0)/lit.length):0;
  if(doc.activeElement!==masterSlider){
   masterSlider.value=String(Math.max(1,average));
   masterValue.textContent=average+' %';
  }
  if(!busy)showFeedback(lit.length?'Für '+devices.length+' Lampen · beim Loslassen anwenden':'Alle ausgewählten Lampen aus · Regler schaltet sie ein');
  individual.hidden=devices.length<2||devices.length>14;
  if(individual.open&&doc.activeElement?.closest?.('#v4IndividualRows')==null)renderIndividuals(devices);
 }
 function renderIndividuals(devices){
  rows.replaceChildren();
  for(const device of devices){
   const row=doc.createElement('label');row.className='v4-individual-row';
   const title=doc.createElement('span');title.textContent=device.name;
   const range=doc.createElement('input');range.type='range';range.min='1';range.max='100';range.value=String(Math.max(1,brightness(device.state)));
   range.setAttribute('aria-label','Helligkeit '+device.name);
   const output=doc.createElement('output');output.textContent=brightness(device.state)+' %';
   range.addEventListener('input',()=>{output.textContent=range.value+' %'});
   range.addEventListener('change',()=>schedule([{id:device.id,percent:Number(range.value)}]));
   row.append(title,range,output);rows.append(row);
  }
 }
 individual.addEventListener('toggle',()=>{if(individual.open)renderIndividuals(currentDevices())});
 masterSlider.addEventListener('input',()=>{masterValue.textContent=masterSlider.value+' %';showFeedback('Loslassen zum Übernehmen');});
 masterSlider.addEventListener('change',()=>{
  const devices=currentDevices();
  if(!devices.length){sync();return;}
  const pct=Number(masterSlider.value);
  schedule(devices.map(x=>({id:x.id,percent:pct})));
 });
 // Latest committed state wins. Only one batch is allowed to run; no command backlog.
 function schedule(batch){
  if(!win.lumaBridgeConnected?.()){showFeedback('Bridge nicht verbunden.');return;}
  if(win.lumaMusicActive?.()){showFeedback('Musiklicht läuft. Bitte erst stoppen, dann Helligkeit einstellen.');return;}
  win.lumaStopMotion?.();
  const token=++version;
  pending={token,batch,target:el('target')?.value};
  if(!busy)void drain();
 }
 async function drain(){
  busy=true;
  try{
   while(pending){
    const job=pending;pending=null;
    showFeedback('Helligkeit wird eingestellt …');
    let successful=0,failed=0;
    for(let i=0;i<job.batch.length;i+=3){
     if(job.token!==version||job.target!==(el('target')?.value))break;
     // One command per lamp, up to three concurrent. No continuous requests while sliding.
     const items=job.batch.slice(i,i+3);
     const results=await Promise.allSettled(items.map(async item=>{
      const body={on:true,bri:fromPercent(item.percent)};
      await win.lumaRequest('PUT','/lights/'+encodeURIComponent(item.id)+'/state',body,{music:true});
      // Update the real device snapshot after success; the ambient lamp already
      // consumes these objects. No separate fake rendering state is required.
      const index=(win.lumaTargetIds?.()||[]).indexOf(item.id);
      const lamp=win.lumaAmbientLightState?.()?.devices?.[index];
      if(lamp?.state){lamp.state.on=true;lamp.state.bri=body.bri;}
     }));
     successful+=results.filter(x=>x.status==='fulfilled').length;
     failed+=results.filter(x=>x.status==='rejected').length;
    }
    if(job.token===version){
     showFeedback(failed?successful+' geändert · '+failed+' fehlgeschlagen':successful+' Lampen angepasst ✓');
    }
   }
  }finally{busy=false;win.setTimeout(sync,450);}
 }
 function paintLettering(){
  const progress=clamp(Number(launcher.dataset.pullProgress||0),0,1);
  const pull=Number(doc.documentElement.style.getPropertyValue('--luma-pull-px').replace('px',''))||0;
  const elbow=43-pull*100/73;
  luna.setAttribute('x',String(elbow+12));
  luna.style.opacity=String(prefs.luna?Math.max(0,Math.min(.9,(progress-.28)/.48)):0);
 }
 const observer=new MutationObserver(()=>paintLettering());
 observer.observe(launcher,{attributes:true,attributeFilter:['data-pull-progress']});
 const ambientInterval=win.setInterval(()=>{
  if(!win.lumaQuickControl?.isOpen?.() && doc.activeElement!==masterSlider)sync();
  // While open, the current scene is still monitored by the ambient engine.
  paintLettering();
 },650);
 el('target')?.addEventListener('change',()=>{lastTarget='';win.setTimeout(sync,400);});
 // Wrap successful Hue writes only on this preview. Existing app methods unchanged.
 // This keeps the ambient head aligned with freshly applied scenes without extra polling.
 const oldRequest=win.lumaRequest;
 if(typeof oldRequest==='function'){
  win.lumaRequest=async function(method,path,body,options){
   const result=await oldRequest(method,path,body,options);
   if(method==='PUT'&&body&&typeof body==='object'){
    const ids=path.match(/^\/lights\/([^/]+)\/state$/);
    if(ids){
     const deviceIds=win.lumaTargetIds?.()||[];
     const idx=deviceIds.indexOf(decodeURIComponent(ids[1]));
     const lamp=win.lumaAmbientLightState?.()?.devices?.[idx];
     if(lamp?.state)Object.assign(lamp.state,body);
    }
   }
   return result;
  };
 }
 applyPrefs();sync();
 win.addEventListener('pagehide',()=>{observer.disconnect();win.clearInterval(ambientInterval);},{once:true});
 return {get prefs(){return {...prefs}},sync,applyPrefs,fromPercent,shape};
}
const api={load,brightness,selected,fromPercent,shape,create};
root.LumaV4=api;
if(typeof module==='object'&&module.exports)module.exports=api;
if(root.document){
 const init=()=>create();
 if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
}
})(typeof globalThis!=='undefined'?globalThis:this);
