/* V4.8 – restrained, functional miniature room. Reuses V4.6 Hue controls. */
(()=>{'use strict';
const NS='http://www.w3.org/2000/svg',KEY='luma-v48-room-positions';
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
const room=`<svg viewBox="0 0 460 230" preserveAspectRatio="xMidYMid meet" aria-hidden="true" class="v48-scene">
<defs><linearGradient id="v48-wall" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#302b36"/><stop offset="1" stop-color="#1e242d"/></linearGradient></defs>
<!-- coherent cutaway: rear attic wall, one roof line, continuous floor -->
<path d="M10 80L125 18 318 18 450 86V202H10Z" fill="url(#v48-wall)" stroke="#a49ca5" stroke-width="1.4"/>
<path d="M10 80L125 18 318 18 450 86" fill="none" stroke="#c0b1bc" stroke-width="2"/>
<path d="M125 18L144 81M318 18L300 81" fill="none" stroke="#9d909d" opacity=".4"/>
<path d="M10 193Q225 211 450 193V217H10Z" fill="#272a30" stroke="#8b858e" stroke-width="1.2"/>
<!-- TV and white lowboard -->
<rect x="24" y="103" width="112" height="64" rx="3" fill="#171d25" stroke="#aaa4ae" stroke-width="2"/>
<path d="M81 167v8m-15 0h30" stroke="#aaa4ae" fill="none" stroke-width="1.5"/>
<rect x="17" y="176" width="126" height="26" rx="3" fill="#655d65" stroke="#b3aab1"/>
<path d="M20 185h120M80 185v15" stroke="#b6aeb5" stroke-width=".9"/>
<!-- sofa and blankets -->
<path d="M155 152q0-15 15-15h104q15 0 15 15v37H155z" fill="#49414c" stroke="#c2b7c1" stroke-width="1.6"/>
<path d="M155 164q65-12 134 0M167 141l33 2 7 19-45-3M213 141l48 0 8 20-55 0" fill="none" stroke="#b5a8b4" stroke-width="1.3"/>
<path d="M157 166l-12 21 151 0-9-21M162 188v12m124-12v12" fill="#38313b" stroke="#b9aeb8" stroke-width="1.5"/>
<path d="M178 170l-12 12 17 8 17-6-8-13" fill="#605762" stroke="#b1a6b2" stroke-width=".8"/>
<!-- compact work station behind sofa -->
<path d="M301 165h140m-130 0v34m121-34v34" stroke="#b8adb9" stroke-width="2"/>
<rect x="309" y="106" width="59" height="48" rx="2" fill="#161c25" stroke="#b9adb9" stroke-width="1.8"/>
<rect x="374" y="101" width="62" height="52" rx="2" fill="#161c25" stroke="#b9adb9" stroke-width="1.8"/>
<path d="M339 154v10m-17 0h35m83-11v11m-44 0h35" stroke="#b9adb9" stroke-width="1.2"/>
<!-- small plant -->
<path d="M147 171l4 20h16l4-20z" fill="#68616a" stroke="#b9acb7" stroke-width="1"/>
<path d="M159 174v-43m0 21q-23-10-19-24 22 3 19 24m0 8q21-13 23-26-25 4-23 26" fill="#434d49" stroke="#9eafa5" stroke-width="1"/>
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