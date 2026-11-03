/* Luma Groups v1 – browser-only view. No network access or credentials. */
(function(root){'use strict';
const el=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!=null)n.textContent=text;return n};
const labelText={system:'Systembereich','hue-room':'Hue-Raum','hue-zone':'Hue-Zone','luma-local':'Eigene Gruppe'};
const positionLabels=[['','Keine Angabe'],['links','Links'],['mitte','Mitte'],['rechts','Rechts'],['vorne','Vorne'],['hinten','Hinten']];
function button(label,handler,kind='secondary'){const n=el('button','g-btn '+kind,label);n.type='button';if(handler)n.onclick=handler;return n}
function checkedRows(target,items,selected,{disabled=false,kind='lamp'}={}){target.replaceChildren();if(!items.length){target.append(el('p','g-help','Keine Einträge vorhanden.'));return}
for(const item of items){const row=el('label','g-check-row');const input=el('input');input.type='checkbox';input.value=item.id;input.checked=selected.includes(item.id);input.dataset.kind=kind;input.disabled=disabled;row.append(input,el('span','',item.name));target.append(row)}}
class UI{
constructor(engine,container,{onChange=()=>{},onSelect=()=>{}}={}){this.engine=engine;this.container=container;this.onChange=onChange;this.onSelect=onSelect;this.editing=null;this.error='';this.fileInput=null;this.selectedPosition={};this.currentOrder=[]}
message(msg,isError=false){this.error=msg;const status=this.container.querySelector('#gMessage');if(status){status.textContent=msg;status.classList.toggle('g-error',isError)}}
run(fn){try{fn();this.error='';this.onChange();this.render()}catch(e){this.message(e?.message||String(e),true)}}
open(id){this.editing=id;this.error='';const group=id==='new'?null:this.engine.group(id);this.currentOrder=group?this.engine.getOrder(id):[];this.selectedPosition={...(group?.type==='luma-local'?group.positions:this.engine.getMeta(id).positions)};this.render();const panel=this.container.querySelector('#gEditor');if(panel)panel.scrollIntoView({behavior:'smooth',block:'start'})}
render(){
const rootNode=this.container;rootNode.replaceChildren();rootNode.className='g-app';
const top=el('div','g-hero');const kicker=el('div','g-kicker','LUMA IMMERSIVE · LIGHT AREAS');top.append(kicker,el('h2','','Deine Lichtbereiche'),el('p','g-help','Alle Lampen, Räume und eigene Gruppen. Änderungen an Gruppen bleiben auf diesem Gerät und verändern keine Hue-Räume.'));
const actions=el('div','g-actions');actions.append(button('＋ Neue Gruppe',()=>this.open('new'),'primary'),button('↑ Export',()=>this.export()),button('↓ Import',()=>this.fileInput?.click()));top.append(actions);rootNode.append(top);
this.fileInput=el('input');this.fileInput.type='file';this.fileInput.accept='.json,application/json';this.fileInput.hidden=true;this.fileInput.onchange=e=>this.import(e);rootNode.append(this.fileInput);
const status=el('p','g-message','');status.id='gMessage';status.setAttribute('role','status');status.setAttribute('aria-live','polite');rootNode.append(status);if(this.error)this.message(this.error,true);
const all=this.engine.catalog(),room=this.engine.livingRoom(),priority=[all[0],...(room?[room]:[])],locals=this.engine.localGroups().filter(g=>g.id!==room?.id);
const section=el('section','g-section');section.append(el('h3','','Schnellauswahl'));
for(const g of priority)this.row(section,g,true);
rootNode.append(section);
const owned=el('section','g-section');owned.append(el('h3','','Eigene Luma-Gruppen'));for(const g of locals)this.row(owned,g,false);if(!locals.length)owned.append(el('p','g-help','Noch keine eigene Gruppe. Erstelle z. B. Fernseher, Küche oder Gaming.'));rootNode.append(owned);
const roomExtras=this.engine.bridgeRooms().filter(g=>g.id!==room?.id);if(roomExtras.length){const details=el('details','g-others');const summary=el('summary','','Weitere Hue-Räume und -Zonen ('+roomExtras.length+')');details.append(summary);for(const g of roomExtras)this.row(details,g,false);rootNode.append(details)}
if(this.editing!==null)this.renderEditor(rootNode);
const fine=el('p','g-fine','Lokale Gruppen ≠ Hue-Räume. Hier werden ausschließlich Anzeige, Mitgliedschaften lokaler Gruppen und Reihenfolge gespeichert.');rootNode.append(fine)}
row(parent,g,pinned){const row=el('div','g-group-card');const sig=el('div','g-group-symbol',g.type==='system'?'🌐':g.type==='hue-room'?'⌂':g.type==='hue-zone'?'◈':'✦');
const text=el('div','g-group-text');text.append(el('strong','',g.name),el('small','',labelText[g.type]||'Gruppe'));const count=this.engine.resolve(g.id,{reachableOnly:false}).length;const reachable=this.engine.resolve(g.id).length;text.append(el('span','g-count',count+' Lampen · '+reachable+' erreichbar'));const open=button('Bearbeiten ›',()=>this.open(g.id),'g-soft');open.setAttribute('aria-label',g.name+' verwalten');row.append(sig,text,open);parent.append(row)}
renderEditor(rootNode){
const g=this.editing==='new'?null:this.engine.group(this.editing);if(!g&&this.editing!=='new'){this.editing=null;return}
const local=!g||g.type==='luma-local';const editor=el('section','g-editor');editor.id='gEditor';
const head=el('div','g-editor-head');const title=el('div');title.append(el('div','g-kicker',g?(labelText[g.type]||'Gruppe'):'Neue lokale Gruppe'),el('h3','',g?.name||'Neue Gruppe'));head.append(title,button('✕',()=>{this.editing=null;this.render()},'g-soft'));editor.append(head);
if(g&&g.type==='system')editor.append(el('p','g-help','All umfasst automatisch sämtliche Lampen der verbundenen Bridge. Mitgliedschaft und Name sind nicht bearbeitbar.'));
if(g&&['hue-room','hue-zone'].includes(g.type))editor.append(el('p','g-help','Dieser Bereich stammt von der Hue Bridge. Du kannst hier die Lampenreihenfolge und Positionen speichern, aber keine Hue-Raumzuordnung ändern.'));
const nameLabel=el('label','g-field');nameLabel.append(el('span','','Gruppenname'));const name=el('input');name.type='text';name.maxLength=60;name.placeholder='Zum Beispiel: Fernseher';name.value=g?.name||'';name.disabled=!local;name.id='gName';nameLabel.append(name);editor.append(nameLabel);
let lampsContainer=null,subgroups=null;
if(local){
editor.append(el('h4','','Lampen auswählen'));lampsContainer=el('div','g-check-list');lampsContainer.id='gMembers';checkedRows(lampsContainer,this.engine.globalOrder().map(id=>({id,name:this.engine.lights[id].name||id})),g?.lights||[]);editor.append(lampsContainer);
editor.append(el('h4','','Untergruppen einschließen'));subgroups=el('div','g-check-list');subgroups.id='gNested';const others=this.engine.catalog().filter(x=>x.id!=='all'&&x.type!=='lamp'&&x.id!==g?.id);checkedRows(subgroups,others.map(x=>({id:x.id,name:x.name+' · '+labelText[x.type]})),g?.groups||[],{kind:'group'});editor.append(subgroups);
}
editor.append(el('h4','','Reihenfolge & Positionen'));
const help=el('p','g-help','Sortierung für Lichtwellen und Musik. Pfeile erlauben Änderungen auch ohne Drag & Drop.');editor.append(help);
const orderBox=el('div','g-order-list');orderBox.id='gOrderList';editor.append(orderBox);
const orderFromSelection=()=>{
let ids=g?this.engine.getOrder(g.id):[];if(local){const selected=[...(lampsContainer?.querySelectorAll('input:checked')||[])].map(n=>n.value);const selectedGroups=[...(subgroups?.querySelectorAll('input:checked')||[])].map(n=>n.value);const members=[...selected];for(const id of selectedGroups){try{for(const child of this.engine.resolve(id,{reachableOnly:false}))if(!members.includes(child))members.push(child)}catch{}}
ids=[...ids.filter(x=>members.includes(x)),...members.filter(x=>!ids.includes(x))];}
this.currentOrder=[...this.currentOrder.filter(x=>ids.includes(x)),...ids.filter(x=>!this.currentOrder.includes(x))];this.paintOrder(orderBox)}
orderFromSelection();
for(const box of editor.querySelectorAll('#gMembers input,#gNested input'))box.addEventListener('change',orderFromSelection);
const footer=el('div','g-actions g-editor-actions');
footer.append(button('Speichern',()=>this.run(()=>{
if(local){const members=[...(lampsContainer?.querySelectorAll('input:checked')||[])].map(n=>n.value),nested=[...(subgroups?.querySelectorAll('input:checked')||[])].map(n=>n.value);
const saved=this.engine.saveLocal({id:g?.id||('local:'+(root.crypto?.randomUUID?.()||String(Date.now())+Math.random().toString(36).slice(2))),name:name.value.trim(),lights:members,groups:nested,order:this.currentOrder,positions:this.selectedPosition});this.editing=saved.id;
}else this.engine.setMeta(g.id,{order:this.currentOrder,positions:this.selectedPosition});
}),'primary'));
if(g?.type==='luma-local'){footer.append(button('Duplizieren',()=>this.run(()=>{const duplicated=this.engine.duplicate(g.id);this.editing=duplicated.id})));
footer.append(button('Löschen',()=>{if(!confirm('Eigene Gruppe „'+g.name+'“ wirklich löschen? Lampen auf der Hue Bridge bleiben erhalten.'))return;this.run(()=>{this.engine.deleteLocal(g.id);this.editing=null})},'g-danger'))}
footer.append(button('Abbrechen',()=>{this.editing=null;this.render()}));editor.append(footer);rootNode.append(editor)
}
paintOrder(box){box.replaceChildren();if(!this.currentOrder.length){box.append(el('p','g-help','Keine Lampen in dieser Gruppe.'));return}
this.currentOrder.forEach((id,i)=>{const row=el('div','g-order-row');const idx=el('span','g-order-num',String(i+1));const text=el('span','g-order-name',this.engine.lights[id]?.name||'Nicht mehr vorhanden: '+id);
const controls=el('div','g-order-controls');const up=button('↑',()=>{[this.currentOrder[i-1],this.currentOrder[i]]=[this.currentOrder[i],this.currentOrder[i-1]];this.paintOrder(box)},'g-step');up.disabled=i===0;up.setAttribute('aria-label',text.textContent+' nach oben');const down=button('↓',()=>{[this.currentOrder[i],this.currentOrder[i+1]]=[this.currentOrder[i+1],this.currentOrder[i]];this.paintOrder(box)},'g-step');down.disabled=i===this.currentOrder.length-1;down.setAttribute('aria-label',text.textContent+' nach unten');controls.append(up,down);
const position=el('select','g-position');position.setAttribute('aria-label','Position für '+text.textContent);for(const [v,label] of positionLabels){const opt=el('option','',label);opt.value=v;position.append(opt)}position.value=this.selectedPosition[id]||'';position.onchange=()=>{if(position.value)this.selectedPosition[id]=position.value;else delete this.selectedPosition[id]};row.append(idx,text,controls,position);box.append(row)})}
export(){try{const data=this.engine.exportBackup(),text=JSON.stringify(data,null,2),blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='luma-gruppen-v2-'+new Date().toISOString().slice(0,10)+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);this.message(data.groups.length+' Gruppen gesichert.')}catch(e){this.message(e.message,true)}}
async import(e){const file=e.target.files?.[0];if(!file)return;try{if(file.size>500000)throw Error('Sicherung ist zu groß.');const data=JSON.parse(await file.text());let allowLegacy=false;if(data.format==='luma-groups'&&data.version===1){allowLegacy=confirm('Alte Sicherung ohne Bridge-Zuordnung importieren? Nur für dieselbe Hue Bridge empfohlen.');if(!allowLegacy)return}
const result=this.engine.importBackup(data,{allowLegacy});this.editing=null;this.onChange();this.render();this.message(result.added+' Gruppen importiert, vorhandene Einträge behalten.')}catch(err){this.message('Import fehlgeschlagen: '+err.message,true)}finally{e.target.value=''}}
}
root.LumaGroupsUI={UI};
})(typeof globalThis!=='undefined'?globalThis:this);
