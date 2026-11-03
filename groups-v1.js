/* Luma Groups v1 — no network requests, no bridge writes, no dependencies.
 * Pure model + storage adapter; browser and Node-compatible. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.LumaGroupsV1=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const STORAGE='luma_groups_v2',VERSION=2,MAX_GROUPS=150,MAX_REFS=500,POSITIONS=['links','mitte','rechts','vorne','hinten',''];
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const copy=x=>JSON.parse(JSON.stringify(x));
function fail(message){throw new Error(message)}
function isId(s){return typeof s==='string'&&s.length>0&&s.length<=140&&!/[\u0000-\u001f]/.test(s)}
function uniqueStrings(arr,max=MAX_REFS){if(!Array.isArray(arr)||arr.length>max||arr.some(x=>!isId(x)))fail('Ungültige Lampen- oder Gruppenreferenzen.');return [...new Set(arr)]}
function groupNormalize(g){if(!g||typeof g!=='object'||Array.isArray(g)||!isId(g.id)||typeof g.name!=='string'||!g.name.trim()||g.name.length>60)fail('Ungültige Gruppe.');if(!g.id.startsWith('local:'))fail('Nur lokale Luma-Gruppen dürfen verändert werden.');if(!Array.isArray(g.lights)||!Array.isArray(g.groups))fail('Ungültige Gruppeneinträge.');
const out={id:g.id,name:g.name.trim(),type:'luma-local',lights:uniqueStrings(g.lights),groups:uniqueStrings(g.groups),order:uniqueStrings(g.order||[]),positions:{}};
if(g.positions!=null){if(typeof g.positions!=='object'||Array.isArray(g.positions))fail('Ungültige Positionsdaten.');for(const [id,pos] of Object.entries(g.positions)){if(!isId(id)||!POSITIONS.includes(pos))fail('Ungültige Lampenposition.');if(pos)out.positions[id]=pos}}
return out}
function assertGraph(groups){if(groups.length>MAX_GROUPS)fail('Zu viele Gruppen.');const ids=new Set();for(const g of groups){if(ids.has(g.id))fail('Doppelte Gruppen-ID.');ids.add(g.id)}
const index=new Map(groups.map(g=>[g.id,g]));const visited=new Set(),active=new Set();
function dfs(id){if(active.has(id))fail('Gruppen dürfen keinen Kreis bilden.');if(visited.has(id))return;active.add(id);const g=index.get(id);if(g)for(const child of g.groups){if(child===id)fail('Gruppe kann nicht sich selbst enthalten.');if(child.startsWith('local:')&&!index.has(child))continue;if(index.has(child))dfs(child)}active.delete(id);visited.add(id)}
for(const g of groups)dfs(g.id);
return groups}
function normalizeState(data){if(!data||data.version!==VERSION||!data.bridges||typeof data.bridges!=='object'||Array.isArray(data.bridges))return {version:VERSION,bridges:{}};return data}
function normalizeLegacy(input){if(!Array.isArray(input))return [];const groups=[];for(const raw of input.slice(0,MAX_GROUPS)){try{if(raw&&typeof raw==='object'&&isId(raw.id)&&raw.id.startsWith('local:')&&typeof raw.name==='string'){groups.push(groupNormalize({id:raw.id,name:raw.name,lights:Array.isArray(raw.lights)?raw.lights:[],groups:Array.isArray(raw.groups)?raw.groups:[],order:[],positions:{}}))}}catch{/* preserve original luma07_groups; skip malformed group only in v2 copy */}}return groups}
function sortedBy(reference,ids){const unique=[...new Set(ids)];return [...reference.filter(x=>unique.includes(x)),...unique.filter(x=>!reference.includes(x))]}
function randomId(){const bytes=new Uint8Array(10);if(typeof crypto!=='undefined'&&typeof crypto.getRandomValues==='function')crypto.getRandomValues(bytes);else{for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256)}return 'local:'+Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('')}
class Engine{
constructor(options={}){this.storage=options.storage||null;this.root={version:VERSION,bridges:{}};try{this.root=normalizeState(JSON.parse(this.storage?.getItem(STORAGE)||'null'))}catch{}this.bridgeId=null;this.lights={};this.hue={};this.bucket=null}
persist(){if(!this.storage)return true;let data;try{data=JSON.stringify(this.root);this.storage.setItem(STORAGE,data);return true}catch(e){fail('Speichern fehlgeschlagen. Änderungen wurden nicht dauerhaft gespeichert.')}}
sync({bridgeId,lights={},bridgeGroups={},legacyGroups=[],legacyOrder=[]}={}){
const id=isId(bridgeId)?bridgeId:'offline';this.bridgeId=id;this.lights=lights&&typeof lights==='object'&&!Array.isArray(lights)?lights:{};this.hue=bridgeGroups&&typeof bridgeGroups==='object'&&!Array.isArray(bridgeGroups)?bridgeGroups:{};
if(!own(this.root.bridges,id)){this.root.bridges[id]={groups:[],order:[],meta:{},target:'all',migrated:false};}
const b=this.root.bridges[id];this.bucket=b;
if(!b.migrated){const imported=normalizeLegacy(legacyGroups);try{assertGraph(imported);b.groups=imported}catch{b.groups=imported.map(g=>({...g,groups:[]}))};b.order=uniqueStrings(Array.isArray(legacyOrder)?legacyOrder:[]);b.migrated=true;this.persist()}
if(!Array.isArray(b.groups))b.groups=[];if(!Array.isArray(b.order))b.order=[];if(!b.meta||typeof b.meta!=='object')b.meta={};
return this}
lightIds(){return Object.keys(this.lights)}
globalOrder(){const ids=this.lightIds();return sortedBy(this.bucket?.order||[],ids)}
bridgeRooms(){return Object.entries(this.hue).filter(([id,g])=>g&&typeof g==='object'&&Array.isArray(g.lights)&&['Room','Zone'].includes(g.type)).map(([id,g])=>({id:'bridge:'+id,name:g.name||'Hue-Bereich '+id,type:g.type==='Room'?'hue-room':'hue-zone',lights:g.lights.filter(x=>isId(x)),groups:[],order:[],positions:{},bridgeId:this.bridgeId,sourceId:id}))}
localGroups(){return (this.bucket?.groups||[]).map(g=>({...g,type:'luma-local',bridgeId:this.bridgeId}))}
catalog(){const all={id:'all',name:'All',type:'system',lights:this.lightIds(),groups:[],order:[],positions:{},bridgeId:this.bridgeId};return [all,...this.bridgeRooms(),...this.localGroups()]}
group(id){if(id==='all')return this.catalog()[0];if(id.startsWith('lamp:')){const key=id.slice(5);return this.lights[key]?{id,name:this.lights[key].name||key,type:'lamp',lights:[key],groups:[]}:null}return this.catalog().find(g=>g.id===id)||null}
livingRoom(){return this.bridgeRooms().find(g=>g.type==='hue-room'&&g.name.trim().toLocaleLowerCase('de')==='wohnzimmer')||this.bridgeRooms().find(g=>g.name.trim().toLocaleLowerCase('de')==='wohnzimmer')||this.localGroups().find(g=>g.name.trim().toLocaleLowerCase('de')==='wohnzimmer')||null}
options(){const all=[{id:'all',name:'All',type:'system'}],room=this.livingRoom();if(room)all.push(room);for(const g of this.localGroups()){if(g.id!==room?.id)all.push(g)}for(const g of this.bridgeRooms()){if(g.id!==room?.id&&!all.some(x=>x.id===g.id))all.push(g)}for(const id of this.globalOrder()){all.push({id:'lamp:'+id,name:this.lights[id]?.name||id,type:'lamp'})}return all}
resolve(id,{reachableOnly=true}={}){if(!this.bucket)return [];const index=new Map(this.catalog().map(g=>[g.id,g]));const visitedGroups=new Set(),found=new Set(),ordered=[];const add=x=>{if(!found.has(x)&&own(this.lights,x)){found.add(x);ordered.push(x)}};
function visit(key,stack){if(stack.has(key))fail('Zyklische Gruppe erkannt.');if(visitedGroups.has(key))return;const g=index.get(key);if(!g)return;const next=new Set(stack);next.add(key);for(const x of g.lights||[])add(x);for(const child of g.groups||[])visit(child,next);visitedGroups.add(key)}
if(id.startsWith('lamp:'))add(id.slice(5));else visit(id,new Set());
const g=index.get(id),metadata=this.getMeta(id),preferred=g?.order?.length?g.order:metadata.order?.length?metadata.order:this.bucket.order;const sorted=sortedBy(preferred,ordered);return sorted.filter(x=>!reachableOnly||this.lights[x]?.state?.reachable!==false)}
getMeta(id){if(!this.bucket)return {order:[],positions:{}};const meta=this.bucket.meta?.[id]||{};return {order:Array.isArray(meta.order)?meta.order:[],positions:meta.positions&&typeof meta.positions==='object'?meta.positions:{}}}
setMeta(id,meta){if(!this.group(id))fail('Gruppe nicht gefunden.');const prev=this.bucket.meta[id],next={order:uniqueStrings(meta.order||[]),positions:{}};for(const [lamp,pos] of Object.entries(meta.positions||{})){if(!isId(lamp)||!POSITIONS.includes(pos))fail('Ungültige Position.');if(pos)next.positions[lamp]=pos}this.bucket.meta[id]=next;try{this.persist()}catch(e){if(prev===undefined)delete this.bucket.meta[id];else this.bucket.meta[id]=prev;throw e}return next}
getOrder(id){const ids=this.resolve(id,{reachableOnly:false});const preferred=id==='all'?this.bucket.order:(this.group(id)?.type==='luma-local'?this.group(id)?.order:this.getMeta(id).order);return sortedBy(preferred||[],ids)}
setOrder(id,ids){if(!Array.isArray(ids)||new Set(ids).size!==ids.length)fail('Ungültige Reihenfolge.');const actual=this.resolve(id,{reachableOnly:false});if(ids.length!==actual.length||actual.some(x=>!ids.includes(x)))fail('Die Lampenliste hat sich verändert. Bitte neu laden.');const old=copy(this.bucket);if(id==='all')this.bucket.order=[...ids];else{const g=this.bucket.groups.find(x=>x.id===id);if(g)g.order=[...ids];else{const meta=this.getMeta(id);meta.order=[...ids];this.bucket.meta[id]=meta}}try{this.persist()}catch(e){Object.assign(this.bucket,old);throw e}return ids}
saveLocal(raw){const g=groupNormalize(raw);if(!this.bucket)fail('Bitte zuerst mit einer Bridge verbinden.');const known=new Set(this.catalog().map(x=>x.id));for(const child of g.groups){if(!known.has(child))fail('Unbekannte Untergruppe: '+child)}const before=copy(this.bucket),idx=this.bucket.groups.findIndex(x=>x.id===g.id);const proposed=[...this.bucket.groups];if(idx<0)proposed.push(g);else proposed[idx]=g;assertGraph(proposed);
this.bucket.groups=proposed;try{this.persist()}catch(e){Object.assign(this.bucket,before);throw e}return g}
createLocal({name,lights=[],groups=[]}){let id=randomId();while(this.group(id))id=randomId();return this.saveLocal({id,name,lights,groups,order:[],positions:{}})}
duplicate(id){const g=this.group(id);if(!g||g.type!=='luma-local')fail('Nur eigene Gruppen können dupliziert werden.');return this.createLocal({name:(g.name+' Kopie').slice(0,60),lights:g.lights,groups:g.groups})}
deleteLocal(id){const target=this.group(id);if(!target||target.type!=='luma-local')fail('Nur eigene Luma-Gruppen können gelöscht werden.');const before=copy(this.bucket);
this.bucket.groups=this.bucket.groups.filter(g=>g.id!==id).map(g=>({...g,groups:g.groups.filter(x=>x!==id)}));delete this.bucket.meta[id];if(this.bucket.target===id)this.bucket.target='all';try{this.persist()}catch(e){Object.assign(this.bucket,before);throw e}return true}
setTarget(id){if(!this.group(id))fail('Auswahl ist nicht mehr verfügbar.');const previous=this.bucket.target;this.bucket.target=id;try{this.persist()}catch(e){this.bucket.target=previous;throw e};return id}
currentTarget(){return this.group(this.bucket?.target||'all')?this.bucket.target:'all'}
exportBackup(){if(!this.bucket)fail('Keine Bridge ausgewählt.');const b=this.bucket;return {format:'luma-groups-v2',version:2,bridgeId:this.bridgeId,exportedAt:new Date().toISOString(),groups:copy(b.groups),order:copy(b.order),meta:copy(b.meta)}}
importBackup(payload,{merge=true,allowLegacy=false}={}){if(!this.bucket)fail('Keine Bridge ausgewählt.');let incoming;
if(payload?.format==='luma-groups-v2'&&payload.version===2){if(payload.bridgeId!==this.bridgeId)fail('Die Sicherung gehört zu einer anderen Bridge.');if(!Array.isArray(payload.groups)||!Array.isArray(payload.order)||typeof payload.meta!=='object'||Array.isArray(payload.meta))fail('Ungültige Sicherung.');incoming=payload.groups}
else if(allowLegacy&&payload?.format==='luma-groups'&&payload.version===1&&Array.isArray(payload.groups)){incoming=payload.groups}
else fail('Ungültiges oder nicht unterstütztes Sicherungsformat.');
if(incoming.length>MAX_GROUPS)fail('Zu viele Gruppen.');const parsed=incoming.map(groupNormalize);const existing=new Map((merge?this.bucket.groups:[]).map(g=>[g.id,g]));let added=0;for(const g of parsed){if(!existing.has(g.id)){existing.set(g.id,g);added++}}
const combined=[...existing.values()];assertGraph(combined);const before=copy(this.bucket);const proposed={...copy(this.bucket),groups:combined};
if(payload.version===2){proposed.order=uniqueStrings(payload.order);if(payload.meta!=null){for(const [id,meta] of Object.entries(payload.meta)){if(!isId(id)||!meta||typeof meta!=='object'||Array.isArray(meta))fail('Ungültige Metadaten.');const normalized={order:uniqueStrings(meta.order||[]),positions:{}};if(meta.positions!=null&&(typeof meta.positions!=='object'||Array.isArray(meta.positions)))fail('Ungültige Positionsdaten.');for(const [lamp,pos] of Object.entries(meta.positions||{})){if(!isId(lamp)||!POSITIONS.includes(pos))fail('Ungültige Position.');if(pos)normalized.positions[lamp]=pos}proposed.meta[id]=normalized}}}
Object.assign(this.bucket,proposed);try{this.persist()}catch(e){Object.assign(this.bucket,before);throw e}
return {added,total:this.bucket.groups.length}}
}
return {Engine,STORAGE,VERSION,POSITIONS,groupNormalize,assertGraph,normalizeLegacy,sortedBy};
});
