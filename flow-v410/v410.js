/* V4.10 – restrained, functional miniature room. Reuses V4.6 Hue controls. */
(()=>{'use strict';
const NS='http://www.w3.org/2000/svg',KEY='luma-v410-room-positions';
const anchors=[
{x:13,y:61,label:'TV',type:'strip'},
{x:25,y:73,label:'Pflanze',type:'wall'},
{x:43,y:62,label:'Sofa',type:'table'},
{x:51,y:27,label:'Dachfenster',type:'wall'},
{x:78,y:61,label:'Schreibtisch',type:'table'},
{x:92,y:56,label:'PC',type:'wall'},
{x:52,y:86,label:'Sofatisch',type:'strip'},
{x:12,y:34,label:'Dachschräge links',type:'wall'},
{x:87,y:32,label:'Dachschräge rechts',type:'floor'},
{x:32,y:86,label:'Indirektes Licht',type:'strip'},
{x:65,y:52,label:'Sofa rechts',type:'orb'},
{x:72,y:83,label:'Bodenlicht',type:'wall'}
];
const room=`<svg viewBox="0 0 460 230" preserveAspectRatio="xMidYMid meet" aria-hidden="true" class="v48-scene v49-scene v410-scene">
<defs>
<linearGradient id="v410-wall" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#393042"/><stop offset="1" stop-color="#20232d"/></linearGradient>
<linearGradient id="v410-floor" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#39303c"/><stop offset="1" stop-color="#20232c"/></linearGradient>
<linearGradient id="v410-sofa" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#8a778d"/><stop offset="1" stop-color="#4c4254"/></linearGradient>
<linearGradient id="v410-tv" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#304657"/><stop offset="1" stop-color="#10151e"/></linearGradient>
</defs>
<!-- FRONT-FACING SLOPING ROOF AND CENTRAL SKYLIGHT -->
<path d="M4 85L94 13H366L456 85V193H4Z" fill="url(#v410-wall)" stroke="#a497ad" stroke-width="1.3"/>
<path d="M4 85L94 13H366L456 85" fill="none" stroke="#c3b2c6" stroke-width="2"/>
<path d="M94 13L130 85M366 13L330 85" stroke="#84758b" stroke-width="1"/>
<path d="M178 28L282 28 268 75 192 75Z" fill="#514758" stroke="#b8a7bf" stroke-width="2.5"/>
<path d="M185 33L275 33 262 68 198 68Z" fill="#111b2c" stroke="#7d8da5" stroke-width="1.4"/>
<path d="M198 68L262 68M185 33L198 68" stroke="#6b778c" stroke-width="1"/>
<path d="M4 193L456 193 460 230H0Z" fill="url(#v410-floor)" stroke="#8d7c90"/>
<path d="M4 204L456 204M87 193L64 230M365 193L399 230" stroke="#746979" opacity=".6"/>
<!-- LEFT TV: distinctly EDGE-ON, screen faces the sofa at right -->
<path d="M31 113L47 107 49 169 33 177Z" fill="#0c121c" stroke="#b9b0c4" stroke-width="2.5"/>
<path d="M47 107L52 109 54 170 49 169Z" fill="#576475" stroke="#b1a7b9" stroke-width="1.2"/>
<path d="M35 117L43 114 45 164 37 168Z" fill="url(#v410-tv)" stroke="#6b8da6" stroke-width=".9"/>
<path d="M41 174L44 185M36 185L53 181" stroke="#b6aabd" stroke-width="2"/>
<!-- WHITE TV LOWBOARD in oblique perspective -->
<path d="M13 188L79 176 105 186 38 203Z" fill="#b0a4b1" stroke="#e0d7df" stroke-width="1.5"/>
<path d="M38 203L105 186V209L38 225Z" fill="#786e7e" stroke="#cfc3d0"/>
<path d="M13 188L38 203V225L13 210Z" fill="#605766" stroke="#c4b8c7"/>
<path d="M49 201V220M75 194V214" stroke="#c9beca" opacity=".7"/>
<!-- plant by TV -->
<path d="M112 179L116 197H130L135 179Z" fill="#746777" stroke="#c3b4c1"/>
<path d="M124 179V133M123 158Q102 149 105 135Q123 137 123 158M124 161Q146 150 145 134Q128 136 124 161M124 174Q107 169 109 156Q122 160 124 174" fill="#486353" stroke="#91ae99" stroke-width="1.4"/>
<!-- L SECTIONAL: BACK SEATS FRONTAL, LONG CHAISE PROJECTS RIGHT TOWARD VIEWER -->
<path d="M143 139Q143 129 157 129H273Q286 129 286 143V175H143Z" fill="url(#v410-sofa)" stroke="#d5c3d4" stroke-width="1.8"/>
<path d="M153 140L198 140 201 163 153 162Z M207 140L260 140 265 163 209 163Z" fill="#807187" stroke="#c5b4c7" stroke-width="1.2"/>
<path d="M143 162L284 162 288 180 147 183Z" fill="#706174" stroke="#d2c0d2" stroke-width="1.4"/>
<path d="M147 183L288 180V196L147 198Z" fill="#403847" stroke="#a99bab"/>
<path d="M148 143L155 144 156 183 143 183Z" fill="#66596d" stroke="#c6b7c8"/>
<!-- chaise: continuous from RIGHT sofa cushion, not separate furniture -->
<path d="M253 160L289 160 353 190 306 205 253 181Z" fill="#89768d" stroke="#d7c3d3" stroke-width="1.7"/>
<path d="M306 205L353 190V213L306 229Z" fill="#44394a" stroke="#aa9bad" stroke-width="1.5"/>
<path d="M253 181L306 205V229L253 202Z" fill="#584c60" stroke="#b5a6ba" stroke-width="1.3"/>
<path d="M267 167L286 165 316 184 294 191Z" fill="#a28da4" stroke="#cdbacc" stroke-width=".9"/>
<path d="M147 198v7m103-5v6" stroke="#9c8b9d" stroke-width="2"/>
<!-- coffee table at front, clearly separate -->
<ellipse cx="191" cy="217" rx="63" ry="10" fill="#121722" opacity=".45"/>
<path d="M140 207Q187 189 244 206L251 214Q195 232 133 216Z" fill="#a091a0" stroke="#d6c5d4" stroke-width="1.3"/>
<path d="M148 218v12m92-12v12" stroke="#c5b3c4" stroke-width="2"/>
<path d="M186 201L188 207H199L201 201Z" fill="#756777" stroke="#d0bfd0"/>
<path d="M194 201v-12M194 197Q178 190 183 186Q193 189 194 197M194 197Q207 185 212 189Q207 197 194 197" fill="#52735e" stroke="#a4b9a7" stroke-width="1.2"/>
<!-- RIGHT DESK: turned in depth with white PC behind the screen -->
<path d="M355 177L435 156 456 169 373 194Z" fill="#897a8b" stroke="#cdbdcb" stroke-width="1.6"/>
<path d="M373 194v32M451 171v31" stroke="#c3b3c4" stroke-width="2.2"/>
<path d="M355 177L373 194" stroke="#c3b3c4" stroke-width="1.1"/>
<!-- white tower behind monitor, visible front panel and two fans -->
<path d="M415 113L443 106 449 113 422 122Z" fill="#eee9f0" stroke="#fff5ff" stroke-width="1"/>
<path d="M422 122L449 113V163L422 171Z" fill="#d8d2dd" stroke="#f4ecf5" stroke-width="1.7"/>
<path d="M415 113L422 122V171L415 161Z" fill="#aaa3b2" stroke="#e4dbe6"/>
<ellipse cx="437" cy="132" rx="6" ry="8" fill="#aca7b9" stroke="#8e899c"/>
<ellipse cx="437" cy="151" rx="6" ry="8" fill="#aca7b9" stroke="#8e899c"/>
<!-- monitor curved and seen edge-on, profile is visibly bent -->
<path d="M367 120Q382 111 393 119Q404 135 398 159Q383 165 372 158Q375 139 367 120Z" fill="#151a26" stroke="#cbbdd0" stroke-width="2.2"/>
<path d="M370 122Q381 116 389 121Q397 137 393 156Q384 160 375 156" fill="none" stroke="#728eae" stroke-width="1.4"/>
<path d="M389 162L391 175M380 175L401 175" stroke="#cbbdcc" stroke-width="1.6"/>
<!-- additional plants, kept clear of controls -->
<path d="M449 177L451 196H460L463 177Z" fill="#756776" stroke="#c0b1bf"/>
<path d="M455 178Q440 159 433 165M455 179Q462 155 469 159" fill="none" stroke="#92b39a" stroke-width="2.2"/>
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
 root.insertAdjacentHTML('afterbegin',room);
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