(()=>{'use strict';
const $=id=>document.getElementById(id);
const KEY='luma_scene_v1';
const categories=['Alle','Neon','Natur','Wärme','Fantasie','Alltag','Atmosphäre','Eigene'];
const seeds=[
 ['Neon','Cyberpunk Tokyo','#F12DAA','#3B65FF','#00C9FA','#9017E9'],
 ['Neon','Retro Arcade','#FF6383','#4F38D2','#00F7CC','#F8B32E'],
 ['Neon','Midnight City','#203C88','#894CF0','#DD5EC3','#65BAE4'],
 ['Neon','Electric Violet','#681CF2','#C13BFF','#372C94','#DB78F7'],
 ['Neon','Neon Dreams','#FF349A','#00C9D8','#8E38F1','#EC7BCA'],
 ['Neon','Synthwave Sunset','#FF7B63','#B42DCF','#372285','#F7B64B'],
 ['Neon','Blue District','#1063E9','#5AD3FC','#303D9B','#887BFF'],
 ['Neon','Pink Horizon','#DB3878','#FF8BCB','#5F3FD6','#714DE1'],
 ['Natur','Deep Forest','#173F3A','#3D8059','#82B882','#D6B975'],
 ['Natur','Northern Lights','#143965','#4D74C8','#4ADFC0','#A460DB'],
 ['Natur','Ocean Depths','#07365C','#1E75AD','#37A4C5','#8AE2D1'],
 ['Natur','Tropical Paradise','#14877A','#65BD87','#F0C77D','#3A9AAE'],
 ['Natur','Mountain Sunrise','#7E8EAB','#F5B17A','#DC8E91','#7A9C8F'],
 ['Natur','Moss & Mist','#3F5D51','#92AA8E','#BFC5AE','#627C66'],
 ['Natur','Sea Glass','#5AA3AD','#B0DDD1','#5B819B','#C7E6E4'],
 ['Natur','Rainforest','#124D39','#3E8D54','#B4C66C','#4FADA3'],
 ['Wärme','Golden Hour','#F6A34D','#E46F4B','#F9D28E','#A95E42'],
 ['Wärme','Fireplace','#AA351F','#E46B30','#F9BA6B','#6C271E'],
 ['Wärme','Desert Sunset','#C65851','#EDA266','#B57382','#F5C68E'],
 ['Wärme','Candlelight','#B96D36','#E8A95F','#FFDC9A','#805239'],
 ['Wärme','Autumn Evening','#8D3F2E','#CB7540','#D99B57','#685342'],
 ['Wärme','Amber Room','#C18236','#E7AF65','#F0CC8D','#A45C36'],
 ['Wärme','Terracotta','#9B4E3D','#C57D63','#E7B79A','#715344'],
 ['Wärme','Soft Ember','#8F3831','#D37050','#F2B383','#A75B57'],
 ['Fantasie','Cosmic Dreams','#271E70','#7440BB','#B265DC','#3449AF'],
 ['Fantasie','Nebula','#512688','#BC4EAD','#F190B8','#33459E'],
 ['Fantasie','Lunar Eclipse','#232A5F','#6172AA','#D2A3CA','#433A87'],
 ['Fantasie','Mystic Forest','#164956','#2D8A93','#8761C8','#668D76'],
 ['Fantasie','Galaxy Flow','#151C66','#4D39B9','#9D60F1','#3294C0'],
 ['Fantasie','Crystal Cave','#245D82','#5DB3CA','#A19BDA','#4374A8'],
 ['Fantasie','Stardust','#302B7C','#A273E9','#E0B9DC','#6056AE'],
 ['Fantasie','Moonlit Garden','#24405F','#597B9C','#9F80AB','#4A756F'],
 ['Alltag','Cozy Evening','#CA865D','#EFC694','#A67C6D','#E5B98D'],
 ['Alltag','Reading','#E1BC81','#F2D9A8','#9BA48D','#D9C5A3'],
 ['Alltag','Relax','#669D9B','#A9C9BE','#D5D9C5','#7FAAA6'],
 ['Alltag','Soft Morning','#E9C5A1','#EBCFCA','#B6C4D1','#D7D5C2'],
 ['Alltag','Dinner','#B78056','#D9AF77','#E0C49E','#7F5655'],
 ['Alltag','Movie Night','#171B4D','#324477','#5F3B7B','#1E2B5C'],
 ['Alltag','Focus','#9EC2C8','#D1DADD','#B8CEC6','#8AADB9'],
 ['Alltag','Warm Welcome','#EFC5A2','#F4D9AB','#D3B6A8','#E0BB82'],
 ['Atmosphäre','Blue Hour','#24538A','#5187AF','#85A8B5','#3B628E'],
 ['Atmosphäre','After Rain','#386373','#829DA1','#AEC5C0','#526D87'],
 ['Atmosphäre','Velvet Night','#34254D','#6B3B70','#AC6E8D','#49345D'],
 ['Atmosphäre','Quiet Lake','#386F7B','#84B6B6','#B8CFCD','#4A8594'],
 ['Atmosphäre','City Dawn','#677EA2','#D39CAA','#EAC6B1','#586A98'],
 ['Atmosphäre','Winter Glow','#8FA8C7','#DAE8E7','#9E99C1','#B2D4DD'],
 ['Atmosphäre','Dusky Rose','#A56789','#E3A2A9','#C88E99','#695C88'],
 ['Atmosphäre','Smoke & Gold','#4B525D','#B08D61','#D2B78E','#73717B']
];
const hexToRGB=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const toHex=rgb=>'#'+rgb.map(c=>Math.round(Math.max(0,Math.min(255,c))).toString(16).padStart(2,'0')).join('').toUpperCase();
function normalize(src){
 if(!src||typeof src.name!=='string'||src.name.length>48||!Array.isArray(src.colors)||src.colors.length!==7)return null;
 if(src.colors.some(c=>!Array.isArray(c)||c.length!==3||c.some(v=>!Number.isFinite(v)||v<0||v>255)))return null;
 const brightnesses=Array.isArray(src.brightnesses)&&src.brightnesses.length===7?src.brightnesses.map(x=>Math.max(0,Math.min(1,Number(x)||0))):Array(7).fill(.8);
 return {id:String(src.id||'').slice(0,100),name:src.name.trim().slice(0,48),category:categories.includes(src.category)?src.category:'Eigene',colors:src.colors.map(c=>c.map(x=>Math.round(x))),brightnesses,legacy:!!src.legacy,user:!!src.user};
}
const curated=seeds.map(([category,name,...palette],index)=>{
 const shift=index%4;
 const colors=Array.from({length:7},(_,i)=>hexToRGB(palette[(i+(i>3?shift:0))%palette.length]));
 const brightnesses=Array.from({length:7},(_,i)=>[.95,.72,.56,.86,.68,.82,.47][(i+shift)%7]);
 return {id:'builtin-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name,category,colors,brightnesses};
});
const legacy=(window.lumaLegacyScenes||[]).map(s=>normalize({...s,category:'Atmosphäre',brightnesses:Array(7).fill(.85),legacy:true})).filter(Boolean);
function load(){
 let data;try{data=JSON.parse(localStorage.getItem(KEY)||'null')}catch{}
 const oldFav=(()=>{
  try{const v=JSON.parse(localStorage.getItem('luma_live_favorites')||'[]');return Array.isArray(v)?v.filter(i=>Number.isInteger(i)&&i>=0&&i<192).map(i=>'legacy-'+i):[]}catch{return []}
 })();
 const users=Array.isArray(data?.userScenes)?data.userScenes.filter(s=>s.user===true).slice(0,150).map(normalize).filter(x=>x&&x.id.startsWith('user-')):[];
 let oldSelected=0;try{const n=JSON.parse(localStorage.getItem('luma_live_selected')||'0');if(Number.isInteger(n)&&n>=0&&n<192)oldSelected=n}catch{}
 return {favorites:[...new Set(data?.version===1&&Array.isArray(data.favorites)?data.favorites.filter(x=>typeof x==='string'):oldFav)],userScenes:users,selectedId:typeof data?.selectedId==='string'?data.selectedId:('legacy-'+oldSelected),tab:data?.tab==='discover'?'discover':'favorites',filter:'Alle'};
}
let state=load();
let editorId=null,tab=state.tab,filter='Alle';
const all=()=>[...curated,...state.userScenes,...legacy.filter(s=>state.favorites.includes(s.id)||s.id===state.selectedId)];
const byId=id=>all().find(s=>s.id===id)||curated[0];
const uniqueById=arr=>[...new Map(arr.map(s=>[s.id,s])).values()];
function save(){
 try{localStorage.setItem(KEY,JSON.stringify({version:1,selectedId:state.selectedId,tab,userScenes:state.userScenes,favorites:state.favorites}))}
 catch(e){$('sceneBackupStatus').textContent='Speicherfehler: '+e.message}
}
function art(scene,index){
 // Original SVG illustration generated locally. No external image requests.
 const cs=scene.colors.map(toHex),cat=scene.category;
 const skyline=Array.from({length:14},(_,i)=>{
  const x=i*24, height=38+((i*29+index*11)%87);
  return '<rect x="'+x+'" y="'+(220-height)+'" width="22" height="'+height+'" fill="#111525" opacity=".82"/>'+
   '<rect x="'+(x+5)+'" y="'+(225-height)+'" width="3" height="7" fill="'+cs[(i+1)%cs.length]+'" opacity=".8"/>';
 }).join('');
 const mountains='<path d="M0 214 L30 170 61 198 120 109 161 168 222 119 320 200 320 245 0 245Z" fill="#172940" opacity=".85"/><path d="M0 229 L77 183 128 209 195 160 251 208 320 181 320 245 0 245Z" fill="#081d2b" opacity=".88"/>';
 const trees=Array.from({length:11},(_,i)=>'<path d="M'+(i*35-10)+' 225 l14 -55 14 55z" fill="#0d2830" opacity=".9"/>').join('');
 const horizon='<path d="M0 180 Q80 160 160 183 T320 180 L320 240 0 240Z" fill="#172b48" opacity=".68"/><path d="M0 203 Q80 180 160 204 T320 206" stroke="'+cs[2]+'" opacity=".6" stroke-width="2" fill="none"/>';
 const visual=cat==='Neon'?skyline:cat==='Natur'?mountains+trees:cat==='Wärme'?mountains:cat==='Alltag'?'<path d="M0 183 H320 V240 H0z" fill="#29263c" opacity=".76"/><rect x="30" y="120" width="128" height="72" rx="7" fill="#3c3440" opacity=".7"/><rect x="179" y="95" width="95" height="98" rx="7" fill="#3c3440" opacity=".6"/><circle cx="224" cy="135" r="37" fill="'+cs[2]+'" opacity=".22"/>':horizon;
 const stars=Array.from({length:19},(_,i)=>'<circle cx="'+((i*71+index*13)%315+3)+'" cy="'+((i*43+index*7)%142+4)+'" r="'+(i%4===0?'2':'1')+'" fill="#fff" opacity="'+(i%3===0?'.75':'.38')+'"/>').join('');
 const glows='<ellipse cx="190" cy="55" rx="105" ry="84" fill="'+cs[1]+'" opacity=".28"/><circle cx="227" cy="96" r="44" fill="'+cs[2]+'" opacity=".13"/>';
 const colorGlints=cs.map((color,i)=>'<circle cx="'+(25+i*44)+'" cy="'+(53+(i%3)*21)+'" r="'+(3+(i%3)*2)+'" fill="'+color+'" opacity=".72"/>').join('');
 const gradientStops=cs.map((color,i)=>'<stop offset="'+(i/(cs.length-1)*100).toFixed(1)+'%" stop-color="'+color+'"/>').join('');
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">'+gradientStops+'</linearGradient></defs><rect width="320" height="240" fill="url(#bg)"/><rect width="320" height="240" fill="#0c1020" opacity=".35"/>'+glows+stars+visual+colorGlints+'</svg>';
 return svg;
}
function render(){
 const selected=byId(state.selectedId);
 $('selectedScene').textContent=selected?.name||'Noch keine Szene gewählt';
 const v=tab==='favorites'?uniqueById(all().filter(s=>state.favorites.includes(s.id))):uniqueById([...curated,...state.userScenes]);
 const q=$('sceneSearch').value.trim().toLocaleLowerCase('de');
 const shown=v.filter(s=>(filter==='Alle'||s.category===filter||(filter==='Eigene'&&s.user))&&(s.name+' '+s.category).toLocaleLowerCase('de').includes(q));
 for(const [id,is] of [['favScenes',tab==='favorites'],['allScenes',tab==='discover']]){$(id).setAttribute('aria-selected',String(is))}
 $('sceneCount').textContent=shown.length+' '+(shown.length===1?'Szene':'Szenen');
 const filters=$('sceneFilters');filters.replaceChildren();
 for(const category of categories){
  if(category==='Eigene'&&!state.userScenes.length)continue;
  const b=document.createElement('button');b.type='button';b.className='scene-filter';b.textContent=category;
  b.setAttribute('aria-pressed',String(filter===category));b.onclick=()=>{filter=category;render()};filters.append(b);
 }
 const grid=$('sceneGrid');grid.replaceChildren();
 if(!shown.length){
  const d=document.createElement('div');d.className='scene-blank';
  const heading=document.createElement('strong');heading.textContent=tab==='favorites'&&!state.favorites.length?'Deine Sammlung beginnt hier.':'Keine passenden Szenen.';
  const p=document.createElement('p');p.textContent=tab==='favorites'?'Entdecke Lichtwelten und markiere deine Favoriten mit dem Stern.':'Versuche eine andere Suche oder Kategorie.';d.append(heading,p);
  const b=document.createElement('button');b.textContent='Szenen entdecken';b.onclick=()=>{tab='discover';filter='Alle';$('sceneSearch').value='';save();render()};d.append(b);grid.append(d);return;
 }
 for(const scene of shown){
  const card=document.createElement('article');card.className='scene-card';if(state.selectedId===scene.id)card.classList.add('is-selected');
  const artEl=document.createElement('div');artEl.className='scene-card-art';artEl.innerHTML=art(scene,seeds.findIndex(x=>x[1]===scene.name));
  const star=document.createElement('button');star.type='button';star.className='scene-card-star';star.textContent=state.favorites.includes(scene.id)?'★':'☆';
  star.setAttribute('aria-label','Favorit '+scene.name);star.setAttribute('aria-pressed',String(state.favorites.includes(scene.id)));
  star.onclick=()=>{state.favorites=state.favorites.includes(scene.id)?state.favorites.filter(id=>id!==scene.id):[...state.favorites,scene.id];save();render()};
  artEl.append(star);
  const content=document.createElement('div');content.className='scene-card-content';
  const category=document.createElement('span');category.className='scene-card-category';category.textContent=scene.legacy?'Übernommener Favorit':scene.user?'Eigene Szene':scene.category;
  const name=document.createElement('button');name.type='button';name.className='scene-card-name';name.textContent=scene.name;name.onclick=()=>activate(scene);
  const palette=document.createElement('div');palette.className='scene-card-swatches';for(const c of scene.colors){const i=document.createElement('i');i.style.background=toHex(c);palette.append(i)}
  const bottom=document.createElement('div');bottom.className='scene-card-bottom';
  const activateButton=document.createElement('button');activateButton.textContent='Anwenden';activateButton.type='button';activateButton.onclick=()=>activate(scene);bottom.append(activateButton);
  const edit=document.createElement('button');edit.className='edit';edit.type='button';edit.textContent=scene.user?'Bearbeiten':'Kopie';
  edit.onclick=()=>openEditor(scene,scene.user);bottom.append(edit);
  content.append(category,name,palette,bottom);card.append(artEl,content);grid.append(card);
 }
}
async function activate(scene){
 state.selectedId=scene.id;save();render();
 try{await window.lumaApplyCuratedScene(scene)}catch(e){$('selectedScene').textContent='Fehler: '+e.message}
}
function openEditor(source,editExisting=false){
 editorId=editExisting?source.id:null;
 $('sceneEditorTitle').textContent=editExisting?'Eigene Szene bearbeiten':'Neue Lichtwelt erstellen';
 $('sceneEditorName').value=editExisting?source.name:source.name+' – eigene';
 $('sceneEditorCategory').value=categories.includes(source.category)?source.category:'Eigene';
 $('sceneEditorDelete').hidden=!editExisting;
 $('sceneEditorStatus').textContent='';
 $('sceneEditorLights').replaceChildren();
 for(let i=0;i<7;i++){
  const row=document.createElement('div');row.className='scene-editor-light';
  const title=document.createElement('span');title.textContent='Licht '+(i+1);
  const c=document.createElement('input');c.type='color';c.value=toHex(source.colors[i]);c.setAttribute('aria-label','Farbe Licht '+(i+1));
  const label=document.createElement('label');label.textContent='Helligkeit';
  const range=document.createElement('input');range.type='range';range.min='0';range.max='100';range.value=String(Math.round((source.brightnesses?.[i]??.8)*100));
  label.append(range);row.append(title,c,label);row.dataset.index=String(i);$('sceneEditorLights').append(row);
 }
 $('sceneEditor').showModal();
}
$('sceneEditorSave').onclick=()=>{
 const name=$('sceneEditorName').value.trim();
 if(!name){$('sceneEditorStatus').textContent='Bitte einen Namen eingeben.';return}
 const rows=[...$('sceneEditorLights').children];
 const candidate=normalize({id:editorId||'user-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)),name,category:$('sceneEditorCategory').value,user:true,colors:rows.map(row=>hexToRGB(row.querySelector('input[type=color]').value)),brightnesses:rows.map(row=>Number(row.querySelector('input[type=range]').value)/100)});
 if(!candidate){$('sceneEditorStatus').textContent='Ungültige Szenendaten.';return}
 state.userScenes=state.userScenes.filter(s=>s.id!==candidate.id).concat(candidate);
 state.selectedId=candidate.id;window.lumaSceneSelection=candidate;save();$('sceneEditor').close();tab='favorites';if(!state.favorites.includes(candidate.id))state.favorites.push(candidate.id);save();render();
};
$('sceneEditorDelete').onclick=()=>{
 if(!editorId)return;
 if(!confirm('Diese eigene Szene wirklich löschen?'))return;
 state.userScenes=state.userScenes.filter(x=>x.id!==editorId);
 state.favorites=state.favorites.filter(id=>id!==editorId);
 if(state.selectedId===editorId){state.selectedId=curated[0].id;window.lumaSceneSelection=curated[0]}
 save();$('sceneEditor').close();render();
};
$('sceneEditorClose').onclick=()=>$('sceneEditor').close();
$('sceneNew').onclick=()=>openEditor(byId(state.selectedId),false);
$('sceneSaveCopy').onclick=()=>openEditor(byId(state.selectedId),false);
$('favScenes').onclick=()=>{tab='favorites';filter='Alle';save();render()};
$('allScenes').onclick=()=>{tab='discover';filter='Alle';save();render()};
$('sceneSearch').oninput=render;
$('sceneTransition').oninput=()=>{
 window.lumaSceneTransition=Number($('sceneTransition').value);
 $('sceneTransitionValue').textContent=(window.lumaSceneTransition/10).toFixed(1).replace('.',',')+' s';
 try{localStorage.setItem('luma_live_scene_transition',String(window.lumaSceneTransition))}catch{}
};
try{$('sceneTransition').value=String(Math.max(0,Math.min(50,Number(localStorage.getItem('luma_live_scene_transition')??'10'))))}catch{}
$('sceneTransition').oninput();
$('sceneExport').onclick=()=>{
 const payload={format:'luma-scenes-v1',version:1,userScenes:state.userScenes,favorites:state.favorites,selectedId:state.selectedId};
 const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='luma-szenen-'+new Date().toISOString().slice(0,10)+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
 $('sceneBackupStatus').textContent='Szenen und Favoriten exportiert.';
};
$('sceneImport').onclick=()=>$('sceneImportFile').click();
$('sceneImportFile').onchange=async event=>{
 const file=event.target.files?.[0];if(!file)return;
 try{
  if(file.size>350000)throw Error('Datei zu groß');
  const data=JSON.parse(await file.text());
  if(data?.format!=='luma-scenes-v1'||data.version!==1||!Array.isArray(data.userScenes)||!Array.isArray(data.favorites)||data.userScenes.length>150||data.favorites.length>300)throw Error('Ungültige Sicherungsdatei');
  const imports=data.userScenes.map(normalize);
  if(imports.some(x=>!x||!x.user))throw Error('Ungültige eigene Szene');
  state.userScenes=uniqueById([...state.userScenes,...imports]);
  state.favorites=[...new Set([...state.favorites,...data.favorites.filter(x=>typeof x==='string'&&x.length<110)])];
  save();render();$('sceneBackupStatus').textContent=imports.length+' eigene Szenen gelesen. Bestehende Daten behalten.';
 }catch(e){$('sceneBackupStatus').textContent='Import fehlgeschlagen: '+e.message}
 finally{event.target.value=''}
};
window.lumaScenesV1={render,getActive:()=>byId(state.selectedId),sceneCount:curated.length};
window.lumaSceneSelection=byId(state.selectedId);
render();
})();
