/* Luma Flow V5.0 — real DOM dashboard, no room drawing or generated image. */
(()=>{'use strict';
const $=s=>document.querySelector(s);
let stage,layer,observer,queued=false,lastSig='';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function update(){
 queued=false;if(!stage||!layer)return;
 const snapshot=window.lumaV46Bridge?.snapshot?.();
 const entries=Object.entries(snapshot?.lights||{}).sort(([a],[b])=>a.localeCompare(b,undefined,{numeric:true}));
 const minis=[...layer.querySelectorAll('.v46-mini')];
 const sig=entries.map(([id])=>id).join('|');
 if(sig!==lastSig){lastSig=sig;}
 let on=0,reachable=0;
 for(const [id,device] of entries){if(device.state?.reachable!==false){reachable++;if(device.state?.on)on++;}}
 const count=$('#v50Count');if(count)count.textContent=entries.length?on+' von '+entries.length+' an':'Bridge verbinden';
 const status=$('#v50Status');if(status)status.textContent=entries.length?(reachable===entries.length?'Alle Lampen erreichbar':reachable+' von '+entries.length+' erreichbar'):'Deine Lampen erscheinen nach der Verbindung';
 const cards=$('#v50Cards');if(!cards)return;
 const existing=new Map([...cards.querySelectorAll('[data-v50-id]')].map(n=>[n.dataset.v50Id,n]));
 for(const [id,device] of entries){
  let card=existing.get(id);
  if(!card){card=document.createElement('div');card.className='v50-card';card.dataset.v50Id=id;card.innerHTML='<div class="v50-color"></div><div class="v50-device"><span class="v50-name"></span><span class="v50-state"></span></div><div class="v50-button-slot"></div>';cards.append(card)}
  existing.delete(id);
  const state=device.state||{},active=state.reachable!==false&&state.on===true;
  card.classList.toggle('v50-on',active);card.classList.toggle('v50-offline',state.reachable===false);
  card.querySelector('.v50-name').textContent=device.name||'Hue-Lampe '+id;
  card.querySelector('.v50-state').textContent=state.reachable===false?'Nicht erreichbar':active?'An · '+Math.round((Number(state.bri)||254)/254*100)+' %':'Aus';
  const mini=minis.find(n=>n.dataset.lightId===id);
  if(mini){const slot=card.querySelector('.v50-button-slot');if(mini.parentNode!==slot)slot.append(mini);mini.removeAttribute('style');mini.title='Lampe umschalten: '+(device.name||id)}
  const rgb=mini?.style.getPropertyValue('--v46-rgb')||'205,161,240';
  card.style.setProperty('--v50-rgb',rgb);
 }
 for(const node of existing.values())node.remove();
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(update)}
function init(){
 stage=$('#v45LampHome');if(!stage){setTimeout(init,100);return}
 stage.classList.add('v50-home');
 // Keep the original Luma launcher and all existing Hue controls; replace only room art.
 stage.querySelectorAll('.v48-scene,.v49-scene,.v410-scene,.v411-scene,.v45-room-illustration').forEach(n=>n.remove());
 const shell=document.createElement('section');shell.className='v50-dashboard';
 shell.innerHTML='<div class="v50-heading"><div><span class="v50-eyebrow">DEIN ZUHAUSE</span><h3>Home Sweet Home</h3><p id="v50Status">Deine Lampen erscheinen nach der Verbindung</p></div><span class="v50-pill" id="v50Count">Bridge verbinden</span></div><div class="v50-accent"><span class="v50-accent-icon">✦</span><div><strong>Licht, das sich nach dir richtet.</strong><small>Tippe eine Leuchte an, um sie ein- oder auszuschalten.</small></div></div><div id="v50Cards" class="v50-cards" aria-label="Einzelne Hue-Lampen"></div>';
 stage.prepend(shell);
 layer=stage.querySelector('.v46-lights');
 if(!layer){setTimeout(()=>{layer=stage.querySelector('.v46-lights');if(layer)start()},100);return}
 start();
}
function start(){
 // The original Hue controller creates/recreates its lamp buttons in .v46-lights.
 // Never clone the buttons: moving preserves their original click/long-press handlers.
 observer=new MutationObserver(schedule);observer.observe(layer,{childList:true});
 schedule();
 // Hue states change without DOM mutations: refresh visual metadata while overlay is visible.
 const timer=setInterval(()=>{if(!document.hidden&&window.lumaQuickControl?.isOpen?.())schedule()},1500);
 window.addEventListener('pagehide',()=>{clearInterval(timer);observer.disconnect()},{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();