/* V4.9 – restrained, functional miniature room. Reuses V4.6 Hue controls. */
(()=>{'use strict';
const NS='http://www.w3.org/2000/svg',KEY='luma-v49-room-positions';
const anchors=[
 {x:18,y:62,label:'TV-Licht',type:'strip'},
 {x:32,y:37,label:'Pflanzenlicht',type:'wall'},
 {x:45,y:66,label:'Sofaleuchte',type:'table'},
 {x:62,y:32,label:'Dachlicht',type:'pendant'},
 {x:76,y:61,label:'Schreibtisch',type:'table'},
 {x:88,y:38,label:'Monitorlicht',type:'wall'},
 {x:60,y:81,label:'Indirektes Licht',type:'strip'},
 {x:12,y:35,label:'Wandleuchte',type:'wall'},
 {x:90,y:79,label:'Stehleuchte',type:'floor'},
 {x:37,y:83,label:'Bodenlicht',type:'strip'},
 {x:52,y:46,label:'Akzentlicht',type:'orb'},
 {x:71,y:78,label:'Regallicht',type:'wall'}
];
const room=`<svg viewBox="0 0 460 230" preserveAspectRatio="xMidYMid meet" aria-hidden="true" class="v48-scene v49-scene">
<defs>
<linearGradient id="v49-wall" x2="0" y2="1"><stop stop-color="#292637"/><stop offset="1" stop-color="#191d2b"/></linearGradient>
<linearGradient id="v49-floor" x2=".3" y2="1"><stop stop-color="#37313f"/><stop offset="1" stop-color="#20232d"/></linearGradient>
<linearGradient id="v49-screen" x2="1" y2="1"><stop stop-color="#1b2c39"/><stop offset="1" stop-color="#10131d"/></linearGradient>
</defs>
<!-- frontal sloping roof: single central plane and recessed skylight -->
<path d="M8 78L95 13H362L452 78V198H8Z" fill="url(#v49-wall)" stroke="#857c91" stroke-width="1.2"/>
<path d="M8 78L95 13H362L452 78" fill="none" stroke="#b5a6bd" stroke-width="1.7"/>
<path d="M95 13L125 82M362 13L336 82" stroke="#746a7d" stroke-width=".8"/>
<path d="M10 78H450" stroke="#5b5268" stroke-width="1"/>
<path d="M181 26L279 26 266 72 195 72Z" fill="#171b2a" stroke="#9b91ab" stroke-width="2"/>
<path d="M188 31L271 31 260 66 199 66Z" fill="#1d2535" stroke="#696b8b" stroke-width="1"/>
<path d="M8 188L452 188 460 230H0Z" fill="url(#v49-floor)" stroke="#887b8e" stroke-width="1.2"/>
<path d="M8 202L452 202M80 190L48 230M214 190L205 230M356 190L397 230" stroke="#665e6e" stroke-width=".7" opacity=".6"/>
<!-- left TV seen obliquely: narrow side plane and tapered stand -->
<path d="M27 102L48 91 52 167 29 178Z" fill="#131722" stroke="#c1b7c7" stroke-width="1.8"/>
<path d="M48 91L91 100 92 168 52 167Z" fill="url(#v49-screen)" stroke="#b3a8ba" stroke-width="1.5"/>
<path d="M48 91L52 167" stroke="#8c90b1" stroke-width=".8"/>
<path d="M27 181L94 172 110 184 42 197Z" fill="#7b707e" stroke="#c5bac8"/>
<path d="M42 197L110 184V203L42 216Z" fill="#55505d" stroke="#b7a9b8"/>
<path d="M27 181L42 197V216L27 203Z" fill="#403d4b" stroke="#a89eae"/>
<path d="M69 169V178" stroke="#a8a1b5" stroke-width="1.5"/>
<!-- a plant near TV -->
<path d="M111 174L116 193H128L134 174Z" fill="#6d606c" stroke="#ad9ea9"/>
<path d="M122 174L121 135M121 153Q96 150 102 135Q121 136 121 153M121 157Q147 146 147 130Q124 133 121 157M121 168Q103 162 108 151Q119 154 121 168" fill="#485b53" stroke="#849d88" stroke-width="1.1"/>
<!-- L-shaped sectional: back run facing us, chaise extends toward foreground -->
<path d="M150 145Q150 135 163 135H282Q291 135 293 148L293 173H150Z" fill="#514a59" stroke="#c3b5c7" stroke-width="1.4"/>
<path d="M150 158L282 158 291 173 154 175Z" fill="#63596b" stroke="#bcb0c3" stroke-width="1.2"/>
<path d="M155 174L290 173 290 189 156 190Z" fill="#3e3949" stroke="#a99dac" stroke-width="1"/>
<path d="M166 142L194 143 199 160 165 158Z M211 141L245 141 249 159 212 158Z" fill="#6b6072" stroke="#aea2b6" stroke-width="1"/>
<!-- projecting chaise with side clearly visible -->
<path d="M255 158L303 156 353 189 303 201 255 181Z" fill="#64586a" stroke="#c4b6c6" stroke-width="1.4"/>
<path d="M303 201L353 189V209L302 225Z" fill="#3d3847" stroke="#a79cab"/>
<path d="M255 181L303 201V225L255 201Z" fill="#48404f" stroke="#aa9fae"/>
<path d="M263 166L291 162 307 178 283 187Z" fill="#7a6d80" stroke="#c4b5c5" stroke-width=".8"/>
<!-- low coffee table with perspective and plant -->
<ellipse cx="207" cy="207" rx="65" ry="13" fill="#171b26" opacity=".45"/>
<path d="M167 199Q210 185 252 198L260 205Q216 222 159 208Z" fill="#756a76" stroke="#c8bbc6" stroke-width="1.2"/>
<path d="M175 211L174 227M244 212L245 228" stroke="#b5a9b8" stroke-width="2"/>
<path d="M204 195L206 201H215L217 195Z" fill="#716576" stroke="#ad9fb1"/>
<path d="M210 195V184M210 191Q196 186 198 181Q209 183 210 191M210 190Q222 182 224 185Q221 192 210 190" fill="#536656" stroke="#96a993"/>
<!-- right desk in side perspective with white PC behind curved screen -->
<path d="M361 168L440 151 452 160 372 182Z" fill="#665b6b" stroke="#c1b2c0" stroke-width="1.3"/>
<path d="M372 182V213M447 160V201" stroke="#b4a8b9" stroke-width="2"/>
<path d="M413 101L446 96 446 149 414 155Z" fill="#c6c1ca" stroke="#eee8f1" stroke-width="1.3"/>
<path d="M421 106L441 103 441 144 421 148Z" fill="#e2dce6" stroke="#8d8394" stroke-width=".6"/>
<circle cx="431" cy="138" r="4" fill="#8d88a3" stroke="#aaa2b5"/>
<!-- monitor profile: slightly curved screen facing left -->
<path d="M369 112Q379 108 391 110L398 155Q386 160 373 158Z" fill="url(#v49-screen)" stroke="#c2b6c9" stroke-width="1.8"/>
<path d="M391 110Q401 115 402 148L398 155" fill="none" stroke="#a4a0b5" stroke-width="1.2"/>
<path d="M388 158L391 169M382 169H402" stroke="#b5aabd" stroke-width="1.2"/>
<!-- desk lamp and trailing plant -->
<path d="M352 153L361 147 370 153M361 147L361 132M355 132H367" fill="none" stroke="#b4a7b6" stroke-width="1.4"/>
<path d="M442 178L447 197H457L461 178Z" fill="#655a68" stroke="#a69aa7"/>
<path d="M449 178Q436 160 431 164M449 178Q456 152 464 157" stroke="#819b84" stroke-width="2" fill="none"/>
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