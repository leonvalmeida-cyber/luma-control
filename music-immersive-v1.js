/* Luma Music Immersive enhancement — presentation only. Keeps existing audio & Hue sender.
   Must load after index.html inline scripts (defer). */
(function(root){'use strict';
function init(){
 const pane=document.getElementById('musicPane');
 if(!pane||!document.getElementById('miVisual'))return;
 const $=id=>document.getElementById(id);
 const quick=$('miQuick'),target=$('miMusicTarget'),orb=$('miVisual'),bars=$('miBars');
 const move=(id,host)=>{const n=$(id),dst=$(host);if(n&&dst)dst.append(n)};
 move('palettes','miQuickPalettes');
 move('paletteSwatches','miQuickSwatches');
 move('modes','miQuickModes');
 move('focusPresets','miQuickFocus');
 move('musicPresets','miQuickPresets');
 move('musicSelection','miQuickSelection');
 const barEls=[];for(let i=0;i<17;i++){const bar=document.createElement('i');bar.style.setProperty('--mi-height','7px');barEls.push(bar);bars.append(bar)}
 let lastFrameAge=Infinity;
 function update(){
  if(document.hidden||pane.hidden)return;
  const state=typeof root.lumaMusicState==='function'?root.lumaMusicState():null;
  const transmitting=typeof root.lumaMusicActive==='function'&&root.lumaMusicActive();
  const running=state?.contextState==='running';
  const fresh=running&&state?.frameAgeMs!=null&&state.frameAgeMs<850;
  const active=Boolean(fresh);
  orb.dataset.live=String(active);
  const frames=Array.isArray(state?.frames)?state.frames:[];
  const signal=active?Math.max(0,...frames.map(x=>Number.isFinite(x?.brightness)?x.brightness:0)):0;
  const scale=Math.min(1.19,.77+Math.max(0,signal)*.32);
  orb.style.setProperty('--mi-scale',String(scale));
  const palette=frames[0]?.rgb;
  if(Array.isArray(palette)&&palette.length===3&&palette.every(x=>Number.isFinite(x))){
   const rgb='rgb('+palette.map(x=>Math.max(0,Math.min(255,Math.round(x)))).join(',')+')';
   orb.style.setProperty('--mi-palette',rgb);
  }
  const drift=active?(performance.now()/400):0;
  barEls.forEach((bar,i)=>{
   const frame=frames[i%Math.max(1,frames.length)],level=active?Math.max(0,Math.min(1,frame?.brightness||0)):0;
   const shape=.55+.45*Math.abs(Math.sin(i*.74+drift));
   bar.style.setProperty('--mi-height',Math.round(7+32*level*shape)+'px')
  });
  const chip=$('miTransportStatus'),source=$('miSourceStatus');
  if(chip){const label=transmitting?'Licht aktiv':fresh?'Mikrofon aktiv':'Bereit';if(chip.textContent!==label)chip.textContent=label}
  if(source){const text=transmitting?'Mikrofon → Hue Bridge':fresh?'Mikrofonanalyse läuft':'Mikrofon noch nicht aktiv';if(source.textContent!==text)source.textContent=text}
  const targetChoice=$('target'),current=targetChoice?.selectedOptions?.[0]?.textContent||'All';
  if(target&&target.textContent!==current)target.textContent=current;
  lastFrameAge=state?.frameAgeMs??Infinity;
 }
 function onInputChange(){update()}
 for(const key of ['start','stop','gain','speed','focus','peak','light','gate']){
  $(key)?.addEventListener(key==='start'||key==='stop'?'click':'input',()=>{setTimeout(onInputChange,80)})
 }
 window.addEventListener('visibilitychange',update);
 if(root.matchMedia?.('(prefers-reduced-motion: reduce)').matches)orb.classList.add('mi-no-animation');
 const timer=setInterval(update,180);
 root.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
 update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof window!=='undefined'?window:globalThis);
