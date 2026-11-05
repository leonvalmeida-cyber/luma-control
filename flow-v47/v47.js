/* V4.7: hand-drawn cutaway of the user's attic, illuminated by confirmed Hue states. */
(()=>{'use strict';
const ns='http://www.w3.org/2000/svg';
const drawing=`<defs>
<pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(22)"><path d="M0 0V7" stroke="#c5bdc4" stroke-width=".65" opacity=".18"/></pattern>
<pattern id="floor" width="16" height="8" patternUnits="userSpaceOnUse"><path d="M0 7h16M4 0l-2 7M12 0l-2 7" stroke="#b8afb8" stroke-width=".6" opacity=".25"/></pattern>
<filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".46" numOctaves="2" seed="9" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".055"/></feComponentTransfer></filter>
</defs>
<g class="v47-architecture" fill="none" stroke="#d1c5d0" stroke-linejoin="round" stroke-linecap="round">
<!-- attic roof and panoramic cutaway -->
<path d="M0 17L114 0 223 49 348 0 460 13M0 17v167l80 18 288 0 92-18V13" stroke-width="2.1"/>
<path d="M0 17l116 100 107-68 114 72L460 13M116 0l107 49L348 0" stroke-width="1.2" opacity=".68"/>
<path d="M0 184l80 18 288 0 92-18M80 202l-16 15 326 0-22-15" stroke-width="1.5"/>
<path d="M0 184h460v33H0z" fill="url(#floor)" opacity=".3"/>
<!-- left TV and low white cabinet -->
<path d="M18 111l116-5 2 67-116 4z" stroke-width="2" fill="#26242e"/>
<path d="M23 114l106-4 2 58-108 5z" stroke-width=".7" opacity=".7"/>
<path d="M71 176v6m-20 0h41M13 181l133-5 1 26-133 0zM18 188h123M77 188v13M18 202l-4 7m128-7 5 7" stroke-width="1.6"/>
<!-- left plants -->
<path d="M7 173l2 17 18 0 3-17zM17 174v-57M17 144Q-4 125 4 113Q24 122 17 144M17 154Q40 132 41 126Q14 124 17 154M17 130Q3 102 11 95Q28 112 17 130" stroke-width="1.1"/>
<!-- center sofa, chaise and plaid throw -->
<path d="M145 155Q143 137 159 135L275 136Q294 134 297 152l-4 44-149 0z" fill="#39313c" stroke-width="2"/>
<path d="M149 163Q160 153 186 161L284 161M161 140l35 0 6 22-45-3zM211 139l44 0 12 23-56-3z" stroke-width="1.4"/>
<path d="M154 169l-10 23 149 1-12-23zM169 169l0 24M222 169l0 24M282 169l0 24M155 195l-4 12m137-12 4 12" stroke-width="1.6"/>
<path d="M179 165l-14 16 12 8-6 5 31-1 13-12-9-12zM181 168l18 20m-28-8 33-6m-27 15 27-13" stroke-width=".9" opacity=".6"/>
<!-- coffee table -->
<path d="M156 202q43-11 88 0q-40 10-88 0zM164 206l-3 11m73-11 4 11M187 200q10-6 20 0m-13 0v-6h12" stroke-width="1.5"/>
<!-- desk and monitor zone, right -->
<path d="M302 145l150-2 2 9-151 1zM312 153v47m133-47v47" stroke-width="1.8"/>
<path d="M318 95l54-3 2 44-55 3zM379 87l68 3-1 48-67-2zM346 139v5m-13 0h28m80-5v5m-25 0h36" fill="#26242e" stroke-width="1.7"/>
<path d="M326 102l41-2m18-5 55 3M313 159l132-3" stroke-width=".6" opacity=".65"/>
<!-- physical Hue spotlight behind sofa -->
<path d="M288 133l14-18 20 10-8 14zM304 123l5-11 5 2-5 11" stroke-width="1.4"/>
<!-- monitor cables -->
<path d="M358 140q9 14 2 19m44-22q-5 15 2 22" stroke-width=".7"/>
</g>
<rect width="460" height="217" fill="url(#hatch)" opacity=".5" pointer-events="none"/>
<rect width="460" height="217" filter="url(#paper)" opacity=".35" pointer-events="none"/>`;
function setup(){
 const home=document.getElementById('v45LampHome');if(!home||home.querySelector('.v47-sketch'))return;
 home.classList.add('v47-room');
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('class','v47-sketch');svg.setAttribute('viewBox','0 0 460 217');svg.setAttribute('preserveAspectRatio','xMidYMid slice');svg.setAttribute('aria-hidden','true');svg.innerHTML=drawing;
 home.insertBefore(svg,home.firstChild);
 const tint=document.createElement('div');tint.className='v47-tints';home.insertBefore(tint,home.querySelector('.v46-lights'));
 const observer=new MutationObserver(()=>{const minis=home.querySelectorAll('.v46-mini');for(const mini of minis){
  let wash=tint.querySelector('[data-id="'+CSS.escape(mini.dataset.lightId)+'"]');
  if(!wash){wash=document.createElement('div');wash.className='v47-wash';wash.dataset.id=mini.dataset.lightId;tint.append(wash)}
  wash.style.left=mini.style.left;wash.style.top=mini.style.top;
  wash.style.setProperty('--wash-rgb',mini.style.getPropertyValue('--v46-rgb')||'255,215,160');
  wash.style.setProperty('--wash-power',mini.classList.contains('is-on')?(mini.style.getPropertyValue('--v46-power')||'0'):'0');
  wash.classList.toggle('offline',mini.classList.contains('is-offline'));
 }
 const ids=new Set([...minis].map(n=>n.dataset.lightId));for(const wash of tint.children)if(!ids.has(wash.dataset.id))wash.remove();
 });
 observer.observe(home,{subtree:true,attributes:true,attributeFilter:['style','class'],childList:true});
 window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();