/* V4.11 – restrained, functional miniature room. Reuses V4.6 Hue controls. */
(()=>{'use strict';
const NS='http://www.w3.org/2000/svg',KEY='luma-v411-room-positions';
const anchors=[
{x:18,y:63,label:'TV',type:'strip'},
{x:32,y:70,label:'Pflanze',type:'wall'},
{x:52,y:63,label:'Sofa',type:'table'},
{x:50,y:26,label:'Fenster',type:'wall'},
{x:82,y:64,label:'Schreibtisch',type:'table'},
{x:94,y:56,label:'PC',type:'wall'},
{x:47,y:85,label:'Sofatisch',type:'strip'},
{x:12,y:38,label:'Regal',type:'wall'},
{x:69,y:60,label:'Stehleuchte',type:'floor'},
{x:27,y:84,label:'TV-Lowboard',type:'strip'},
{x:61,y:77,label:'Sofa rechts',type:'orb'},
{x:75,y:83,label:'Bodenlicht',type:'wall'}
];
const room=`<svg viewBox="0 0 460 230" preserveAspectRatio="xMidYMid meet" aria-hidden="true" class="v48-scene v411-scene">
<defs>
<linearGradient id="homeWall" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#322c3b"/><stop offset="1" stop-color="#24242f"/></linearGradient>
<linearGradient id="homeSofa" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#8d798e"/><stop offset="1" stop-color="#5c5064"/></linearGradient>
<linearGradient id="homeFloor" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#403541"/><stop offset="1" stop-color="#292630"/></linearGradient>
</defs>
<!-- full-width comfortable room, no cut-off roof slopes -->
<rect width="460" height="230" rx="12" fill="url(#homeWall)"/>
<rect x="0" y="175" width="460" height="55" fill="url(#homeFloor)"/>
<path d="M0 175H460" stroke="#746476" stroke-width="1.5"/>
<!-- single small roof window: enough to suggest attic -->
<rect x="179" y="22" width="101" height="56" rx="4" fill="#605568" stroke="#b6a6ba" stroke-width="2"/>
<rect x="186" y="29" width="87" height="42" rx="2" fill="#182336" stroke="#8494b2"/>
<path d="M186 64L273 64" stroke="#7686a3"/>
<!-- low shelf and clearly recognizable front-facing television -->
<rect x="21" y="109" width="106" height="66" rx="5" fill="#131a25" stroke="#aaa0b2" stroke-width="3"/>
<path d="M75 175V183M58 183H92" stroke="#c1b4c5" stroke-width="2"/>
<rect x="14" y="185" width="122" height="27" rx="4" fill="#8b7a88" stroke="#c9b9c8" stroke-width="1.5"/>
<path d="M75 185V211M20 199H129" stroke="#b2a2b1" opacity=".65"/>
<!-- plant in pot -->
<path d="M144 181L149 202H165L170 181Z" fill="#786775" stroke="#bdacbb"/>
<path d="M157 181V137M157 160Q135 147 138 135Q156 138 157 160M157 164Q180 148 180 133Q159 140 157 164M157 176Q141 170 143 158Q154 160 157 176" fill="#526b5a" stroke="#9db3a0" stroke-width="1.2"/>
<!-- inviting, legible sectional: back cushions and foreground right chaise -->
<rect x="173" y="133" width="139" height="49" rx="12" fill="url(#homeSofa)" stroke="#d0bed0" stroke-width="2"/>
<rect x="183" y="143" width="54" height="31" rx="7" fill="#88778f" stroke="#b9a9bc"/>
<rect x="244" y="143" width="57" height="31" rx="7" fill="#88778f" stroke="#b9a9bc"/>
<rect x="170" y="165" width="146" height="26" rx="7" fill="#65576c" stroke="#c6b3c6" stroke-width="1.5"/>
<path d="M175 189V198M304 189V198" stroke="#c0adbf" stroke-width="3"/>
<!-- chaise is joined to right end of couch and visibly projects forward -->
<path d="M277 168L314 168 352 194 311 208 277 190Z" fill="#96809a" stroke="#d3bfd2" stroke-width="2"/>
<path d="M277 190L311 208V226L277 208Z" fill="#584a5c" stroke="#c0aebf"/>
<path d="M311 208L352 194V213L311 226Z" fill="#4d4052" stroke="#b5a2b5"/>
<path d="M284 174L308 173 332 191 309 198Z" fill="#ad97ae" stroke="#cdb9cc"/>
<!-- round coffee table, warm candle, rug -->
<ellipse cx="219" cy="217" rx="58" ry="9" fill="#514657" stroke="#8e7c90" opacity=".8"/>
<ellipse cx="216" cy="201" rx="40" ry="11" fill="#9b8596" stroke="#d4c0d0" stroke-width="1.5"/>
<path d="M185 205V224M246 205V224" stroke="#c4afc1" stroke-width="2"/>
<rect x="211" y="190" width="10" height="9" rx="2" fill="#c9a477" stroke="#f1d5ac"/>
<!-- desk clearly drawn with monitor facing front and white tower to right -->
<rect x="354" y="174" width="96" height="9" rx="2" fill="#8f7c8d" stroke="#cdbbc9"/>
<path d="M361 183V219M443 183V219" stroke="#b6a5b5" stroke-width="2"/>
<rect x="359" y="117" width="56" height="45" rx="5" fill="#151b2b" stroke="#c6b6c7" stroke-width="2.5"/>
<path d="M365 125Q387 117 409 125M387 162V172M374 172H402" fill="none" stroke="#8197b3" stroke-width="1.5"/>
<rect x="420" y="117" width="26" height="53" rx="3" fill="#e2dce5" stroke="#faf3fa" stroke-width="2"/>
<circle cx="433" cy="133" r="6" fill="#b9a5c9" stroke="#9483a7"/>
<circle cx="433" cy="152" r="6" fill="#b9a5c9" stroke="#9483a7"/>
<!-- shelf, plant and warm floor lamp -->
<path d="M323 124V174M314 174H332" stroke="#b6a4b6" stroke-width="2"/>
<path d="M310 132L315 119H329L334 132Z" fill="#a98e9b" stroke="#d4b8c5" stroke-width="1.5"/>
<path d="M16 74H75" stroke="#8c788a" stroke-width="4"/>
<path d="M32 72L35 62 39 72M52 74V54M52 54Q41 46 44 38Q54 41 52 54M52 56Q65 46 67 40Q55 43 52 56" fill="#59705c" stroke="#a1b49d" stroke-width="1"/>
</svg>`;
let scheduled=false,observer=null,root=null,layer=null,positions={};
try{positions=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{}
function save(){try{localStorage.setItem(KEY,JSON.stringify(positions))}catch{}}
function layout(){
 scheduled=false;
 if(!root||!layer)return;
 const minis=[...root.querySelectorAll('.v46-mini')];
 const live=new Set(minis.map(n=>n.dataset.lightId));
 for(const key of Object.keys(positions))if(!live.has(key))delete positions[key];
 const used=new Set(Object.values(positions).filter(Number.isInteger));
 for(const mini of minis){
  const id=mini.dataset.lightId;if(!id)continue;
  if(!Number.isInteger(positions[id])||positions[id]>=anchors.length){
   const free=anchors.findIndex((_,i)=>!used.has(i));
   if(free<0){mini.style.display='none';continue}
   positions[id]=free;used.add(free);
  }
  const slot=anchors[positions[id]];
  mini.style.display='';
  if(mini.style.left!==slot.x+'%')mini.style.left=slot.x+'%';
  if(mini.style.top!==slot.y+'%')mini.style.top=slot.y+'%';
  mini.dataset.roomAnchor=slot.label;
  mini.title=(window.lumaV46Bridge?.snapshot()?.lights?.[id]?.name||'Hue-Lampe')+' · '+slot.label;
 }
 save();
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(layout)}
function setup(){
 root=document.getElementById('v45LampHome');if(!root)return;
 root.classList.add('v48-room');
 root.insertAdjacentHTML('afterbegin',room);root.setAttribute('aria-label','Home Sweet Home – interaktive Hue-Lampen');
 layer=root.querySelector('.v46-lights');
 if(!layer){setTimeout(setup,250);return}
 observer=new MutationObserver(mutations=>{if(mutations.some(m=>m.type==='childList'))schedule()});
 observer.observe(layer,{childList:true});
 schedule();
 window.addEventListener('pagehide',()=>observer?.disconnect(),{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
window.LumaV48={anchors};
})();