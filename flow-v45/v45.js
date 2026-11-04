/* Luma Flow V4.5: furniture vignette, in-group brightness and highly reliable touch launcher.
   Only used by /flow-v45/; keeps V4.1 live Hue controls and lamp-card dimmers.
   No text glyphs on the L arm, no extra polling of the Hue Bridge. */
(function(root){'use strict';
const PREF_KEY='luma_v45_lamp_prefs';
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
 const x=JSON.parse(store.getItem(PREF_KEY)||store.getItem('luma_v44_lamp_prefs')||'{}');
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
 if(doc.documentElement.dataset.v45Ready==='true')return null;
 doc.documentElement.dataset.v45Ready='true';
 const shade=head.querySelector('.ambient-lamp-silhouette'),
       rim=head.querySelector('.ambient-lamp-rim'),
       opening=head.querySelector('.ambient-lamp-top-opening');
 if(!shade||!rim||!opening)return null;
 let prefs=load(win.localStorage);
 const prefsCard=doc.createElement('section');
 prefsCard.id='v45SettingsCard';prefsCard.className='v41-prefs';
 prefsCard.setAttribute('aria-label','Ambient-Lampe anpassen');
 prefsCard.innerHTML=
  '<strong>✦ Lampenstil · V4.5</strong>'+
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

 // Vintage lantern lands visually in a warm, noninteractive living-room
 // illustration. The actual Hue lamp remains the ONE moving SVG from the rail.
 const home=doc.createElement('section');
 home.id='v45LampHome';home.className='v45-living-stage';
 home.setAttribute('aria-label','Luma Lichtraum mit beweglicher Lampe');
 home.innerHTML=
 '<div class="v45-room-wash" aria-hidden="true"></div>'+
 '<svg class="v45-room-illustration" viewBox="0 0 340 174" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">'+
 '<defs><linearGradient id="v45Wall" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7e6894" stop-opacity=".26"/><stop offset="1" stop-color="#2a253e" stop-opacity=".08"/></linearGradient></defs>'+
 '<path class="v45-room-outline" d="M19 149V41Q19 32 30 32H310Q321 32 321 41V149"/>'+
 '<path class="v45-room-ceiling" d="M31 40H309M19 150H321"/>'+
 '<rect class="v45-window" x="208" y="51" width="69" height="59" rx="29"/>'+
 '<path class="v45-window-bars" d="M242 53V107M209 79H276"/>'+
 '<path class="v45-window-star" d="M260 61l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/>'+
 '<path class="v45-sofa-back" d="M47 128v-25q0-9 10-9h86q11 0 11 9v25"/>'+
 '<rect class="v45-sofa-seat" x="44" y="119" width="114" height="20" rx="9"/>'+
 '<path class="v45-sofa-legs" d="M56 139v10m91-10v10"/>'+
 '<path class="v45-shelf" d="M207 123h77m-70 0v21m63-21v21"/>'+
 '<path class="v45-plant" d="M293 129v-21m0 3q-19-20-20-26m20 32q16-15 12-28m-13 28q-22-5-23-20"/>'+
 '<path class="v45-pot" d="M283 129h20l-4 17h-11z"/>'+
 '<ellipse class="v45-rug" cx="167" cy="150" rx="115" ry="11"/>'+
 '</svg>'+
 '<div class="v45-stage-copy"><span class="v45-stage-eyebrow">✦ DEIN LICHTRAUM</span>'+
 '<h3>Ein Zuhause<br>voll Licht.</h3>'+
 '<p>Deine Luma-Lampe leuchtet im Raum.</p>'+
 '<span id="v45HomeStatus" class="v45-stage-status">Lichter verbinden …</span></div>'+
 '<span class="v45-landing-mark" aria-hidden="true">⌂</span>';
 first.prepend(home);
 const info=el('v45HomeStatus');
 function showFeedback(message){
  if(info)info.textContent=message;
 }
 function refresh(){
  if(doc.hidden)return;
  const snapshot=win.lumaAmbientLightState?.();
  const activeIds=win.lumaTargetIds?.()||[];
  const groupName=el('target')?.selectedOptions?.[0]?.textContent||'All';
  if(!snapshot?.connected){showFeedback('Bridge verbinden, um Licht zu steuern.');return;}
  const list=selected(snapshot,activeIds),lit=list.filter(x=>x.state?.on===true);
  const next=groupName+' · '+lit.length+' von '+list.length+' Lichtern an';
  if(info&&info.textContent!==next)info.textContent=next;
  // Refresh percent from already existing Hue state only; never recreate
  // the DOM or trigger a new network request while iOS is sliding.
  if(win.lumaQuickControl?.isOpen?.()){
   const tree=el('targetFastTree');
   const slider=tree?.querySelector?.('.v45-group-range:not([disabled])');
   if(slider!==doc.activeElement)win.lumaGroupsTreeInstance?.updateGroupBrightness?.();
  }
 }
 const interval=win.setInterval(refresh,1350);
 el('target')?.addEventListener('change',()=>win.setTimeout(refresh,80));
 applyPrefs();refresh();
 win.addEventListener('pagehide',()=>win.clearInterval(interval),{once:true});
 return {get prefs(){return {...prefs}},applyPrefs,refresh};
}
const api={load,fromPercent,brightness,selected,shape,create};
root.LumaV45=api;
if(typeof module==='object'&&module.exports)module.exports=api;
if(root.document){
 const init=()=>create();
 if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
}
})(typeof globalThis!=='undefined'?globalThis:this);
