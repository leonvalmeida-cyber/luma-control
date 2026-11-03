'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {Engine,groupNormalize,assertGraph}=require('../groups-v1.js');
const store=()=>{const db=new Map();return {getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,String(v)),read:k=>db.get(k),count:()=>db.size}};
function fixture(storage=store(),bridgeId='hue:abc'){
const lights={a:{name:'Iris',state:{reachable:true}},b:{name:'Twilight',state:{reachable:false}},c:{name:'Color',state:{reachable:true}}};
const hue={'1':{name:'Wohnzimmer',type:'Room',lights:['a','b']},'2':{name:'Entertain',type:'Entertainment',lights:['a']},'3':{name:'Arbeitszimmer',type:'Zone',lights:['c']}};
const engine=new Engine({storage});engine.sync({bridgeId,lights,bridgeGroups:hue,legacyGroups:[{id:'local:old',name:'Fernseher',lights:['a'],groups:[]}],legacyOrder:['c','a','b']});return {engine,storage,lights,hue}}
test('All follows lamp list and excludes unreachable only in commands',()=>{const {engine,lights,hue}=fixture();assert.deepEqual(engine.resolve('all'),['c','a']);assert.deepEqual(engine.resolve('all',{reachableOnly:false}),['c','a','b']);delete lights.c;engine.sync({bridgeId:'hue:abc',lights,bridgeGroups:hue});assert.deepEqual(engine.resolve('all',{reachableOnly:false}),['a','b'])});
test('Wohnzimmer deduplicated as preferred Hue room, Entertainment excluded',()=>{const {engine}=fixture();assert.equal(engine.livingRoom().id,'bridge:1');assert.equal(engine.options().filter(g=>g.name==='Wohnzimmer').length,1);assert.equal(engine.bridgeRooms().length,2)});
test('Legacy local groups migrated once without altering old keys',()=>{const storage=store(),{engine}=fixture(storage);assert.equal(engine.localGroups()[0].id,'local:old');assert.equal(engine.localGroups().length,1);fixture(storage);assert.equal(new Engine({storage}).sync({bridgeId:'hue:abc'}).localGroups().length,1)});
test('Nested groups, deduplication and cycles',()=>{const {engine}=fixture(),a=engine.createLocal({name:'A',lights:['a'],groups:['local:old']}),b=engine.createLocal({name:'B',lights:['c'],groups:[a.id]});assert.deepEqual(engine.resolve(b.id),['c','a']);assert.throws(()=>engine.saveLocal({...a,groups:[b.id]}),/Kreis/);assert.throws(()=>engine.saveLocal({...a,groups:[a.id]}),/selbst|Kreis/);assert.equal(engine.group(a.id).groups.includes(b.id),false)});
test('Multiple assignment not duplicated, unavailable preserved in model',()=>{const {engine}=fixture(),id=engine.createLocal({name:'Twilight & Iris',lights:['a','b'],groups:['local:old']}).id;assert.deepEqual(engine.resolve(id),['a']);assert.deepEqual(engine.resolve(id,{reachableOnly:false}),['a','b']);assert.deepEqual(engine.group(id).lights,['a','b'])});
test('Local group rename, duplicate and deletion clean parent',()=>{const {engine}=fixture(),a=engine.createLocal({name:'A',lights:['a']}),b=engine.createLocal({name:'B',groups:[a.id]});engine.saveLocal({...a,name:'New'});assert.equal(engine.group(a.id).name,'New');const d=engine.duplicate(a.id);assert.notEqual(a.id,d.id);engine.deleteLocal(a.id);assert.equal(engine.group(a.id),null);assert.equal(engine.group(b.id).groups.includes(a.id),false)});
test('Global and room ordering and spatial metadata persist',()=>{const {engine,storage,lights,hue}=fixture();engine.setOrder('all',['b','a','c']);engine.setMeta('bridge:1',{order:['b','a'],positions:{a:'links'}});assert.deepEqual(engine.getOrder('all'),['b','a','c']);assert.deepEqual(engine.getOrder('bridge:1'),['b','a']);const next=new Engine({storage});next.sync({bridgeId:'hue:abc',lights,bridgeGroups:hue});assert.deepEqual(next.getOrder('all'),['b','a','c']);assert.equal(next.getMeta('bridge:1').positions.a,'links')});
test('JSON v2 export/import is bridge-scoped and idempotent',()=>{const {engine,storage}=fixture(),g=engine.createLocal({name:'Gaming',lights:['a']});const backup=engine.exportBackup();assert.equal(backup.format,'luma-groups-v2');assert.ok(!JSON.stringify(backup).includes('secret'));const fresh=fixture(store()).engine;let out=fresh.importBackup(backup);assert.ok(out.total>=2);out=fresh.importBackup(backup);assert.equal(out.added,0);assert.ok(fresh.group(g.id));assert.throws(()=>fresh.importBackup({...backup,bridgeId:'hue:other'}),/anderen Bridge/)});
test('Invalid imports do not partially modify existing state',()=>{const {engine}=fixture(),base=JSON.stringify(engine.exportBackup());const damaged=engine.exportBackup();damaged.meta={'all':{order:['a'],positions:{a:'invalid position'}}};assert.throws(()=>engine.importBackup(damaged,{replacePreferences:true}),/Position/);assert.equal(JSON.stringify(engine.exportBackup().groups),JSON.stringify(JSON.parse(base).groups))});
test('Invalid references and duplicate group IDs rejected',()=>{assert.throws(()=>groupNormalize({id:'system:all',name:'X',lights:[],groups:[]}),/Nur lokale/);assert.throws(()=>assertGraph([{id:'local:x',groups:[]},{id:'local:x',groups:[]}]),/Doppelte/);const {engine}=fixture();assert.throws(()=>engine.createLocal({name:'Bad',groups:['local:missing']}),/Unbekannte/)});
test('Local groups never touch Hue Bridge nor HTTP',()=>{const {engine}=fixture();engine.createLocal({name:'Local',lights:['a']});engine.setOrder('all',['a','c','b']);assert.equal(typeof engine.request,'undefined')});

test('Editing a group preserves missing device references',()=>{
 const {engine}=fixture();
 const old=engine.group('local:old');
 engine.saveLocal({...old,lights:['a','missing-light']});
 assert.deepEqual(engine.resolve(old.id),['a']);
 assert.deepEqual(engine.group(old.id).lights,['a','missing-light']);
 engine.saveLocal({...engine.group(old.id),name:'Renamed'});
 assert.deepEqual(engine.group(old.id).lights,['a','missing-light']);
});
test('Existing missing subgroup refs may be preserved; new unknown refs are blocked',()=>{
 const {engine}=fixture();
 const original=engine.group('local:old');
 engine.bucket.groups[0]={...original,groups:['local:removed']};
 const saved=engine.saveLocal({...engine.group(original.id),name:'Renamed'});
 assert.deepEqual(saved.groups,['local:removed']);
 assert.throws(()=>engine.saveLocal({...saved,groups:['local:new-missing']}),/Unbekannte/);
});

test('Feature HTML inline JS parses and IDs remain unique',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
 for(const [index,m] of scripts.entries()){if(m[1].trim())assert.doesNotThrow(()=>new vm.Script(m[1],{filename:'index inline '+index}))}
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length);
 assert.ok(html.includes('groups-v1.js'));assert.ok(html.includes('scenes-v1.js'));
 assert.ok(html.includes("window.lumaTargetIds=targetIds"));
 assert.ok(!html.includes("el('groupSave').onclick"));
});

test('Import never overwrites existing order unless explicitly requested',()=>{
 const original=fixture().engine;original.setOrder('all',['b','a','c']);
 const restored=fixture().engine;restored.setOrder('all',['c','a','b']);
 const backup=original.exportBackup();
 restored.importBackup(backup);
 assert.deepEqual(restored.getOrder('all'),['c','a','b']);
 restored.importBackup(backup,{replacePreferences:true});
 assert.deepEqual(restored.getOrder('all'),['b','a','c']);
});
test('Hue room order from metadata controls the actual shared target resolver',()=>{
 const {engine}=fixture();engine.setMeta('bridge:1',{order:['b','a'],positions:{}});
 assert.deepEqual(engine.resolve('bridge:1',{reachableOnly:false}),['b','a']);
});
