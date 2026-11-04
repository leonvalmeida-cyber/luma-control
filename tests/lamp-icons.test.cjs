'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {icons,Store,STORAGE,guess,svg}=require('../lamp-icons.js');
const collection=['bulb','iris','twilight','strip','ceiling','pendant','floor','table','spot','indirect','kitchen','tv','desk','bathroom','bedroom'];
const mem=()=>{const data=new Map();return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v))}};
test('15 curated symbols include 5 requested household icons',()=>{
 assert.deepEqual(Object.keys(icons),collection);
 for(const name of ['kitchen','tv','desk','bathroom','bedroom'])assert.ok(icons[name]?.parts,'missing '+name);
});
test('Overrides survive reload but remain limited to specific bridge and light',()=>{
 const storage=mem(),store=new Store(storage);
 assert.equal(store.icon('hue:bridgeA','1',{name:'Hue Iris'}),'iris');
 store.set('hue:bridgeA','1','kitchen');
 store.set('hue:bridgeA','2','tv');
 const afterReload=new Store(storage);
 assert.equal(afterReload.get('hue:bridgeA','1'),'kitchen');
 assert.equal(afterReload.get('hue:bridgeA','2'),'tv');
 assert.equal(afterReload.get('hue:bridgeB','1'),null);
 assert.equal(afterReload.get('hue:bridgeA','3'),null);
 assert.ok(storage.data.has(STORAGE));
 assert.ok(!storage.data.has('luma07_key'));
});
test('Automatic mode resets only one override and preserves Hue-based detection',()=>{
 const storage=mem(),store=new Store(storage);
 store.set('hue:A','42','desk');
 store.set('hue:A','43','bathroom');
 store.set('hue:A','42',null);
 assert.equal(new Store(storage).get('hue:A','42'),null);
 assert.equal(new Store(storage).get('hue:A','43'),'bathroom');
 assert.equal(store.icon('hue:A','42',{name:'Hue Twilight'}),'twilight');
});
test('Invalid icons and bridge IDs are rejected without persisting',()=>{
 const storage=mem(),store=new Store(storage);
 assert.throws(()=>store.set('hue:A','1','evil'),/Unbekannt/);
 assert.throws(()=>store.set('','1','kitchen'),/gültiger/);
 assert.throws(()=>store.set('hue:A','','kitchen'),/gültiger/);
 assert.equal(storage.data.size,0);
});
test('Store does not show success when local browser storage is unavailable',()=>{
 const storage={getItem:()=>null,setItem:()=>{throw Error('quota')}};
 const store=new Store(storage);
 assert.throws(()=>store.set('hue:A','1','bedroom'),/quota/);
 assert.equal(store.get('hue:A','1'),null);
});
test('Automatic guesses fallback safely for unmatched devices',()=>{
 assert.equal(guess({name:'Iris living room'}),'iris');
 assert.equal(guess({modelid:'Twilight'}),'twilight');
 assert.equal(guess({name:'Lightstrip'}),'strip');
 assert.equal(guess({type:'Unknown'}),'bulb');
});
test('No network or real Hue writes in icon module',()=>{
 const js=fs.readFileSync(path.join(__dirname,'../lamp-icons.js'),'utf8');
 assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|WebSocket|\/lights\/|hue-application-key/);
 assert.doesNotMatch(js,/localStorage\.setItem\(['"]luma07_/);
});
test('SVG markup is from curated constants, not user-provided strings',()=>{
 const original=global.document;
 global.document={createElementNS:()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v},innerHTML:''})};
 try{
  const ok=svg('kitchen','mini');
  assert.equal(ok.attrs.class,'mini');
  assert.ok(ok.innerHTML.includes('<path'));
  const fallback=svg('<script>alert(1)</script>');
  assert.equal(fallback.innerHTML,icons.bulb.parts);
 }finally{global.document=original}
});
test('Settings submenu and tree callback are wired without Hue commands',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const tree=fs.readFileSync(path.join(__dirname,'../groups-v1-tree.js'),'utf8');
 assert.ok(html.includes('id="settingsLamps"'));
 assert.ok(html.includes("tab('lampSettings')"));
 assert.ok(html.includes('id="lampSettingsPane"'));
 assert.ok(html.includes("getLampIcon:(id,device)=>lampIconPrefs.icon(bridgeIdentity,id,device)"));
 assert.ok(html.includes('groupTree?.updateLampIcons()'));
 assert.ok(html.includes("lampIconPrefs.set(bridgeIdentity,editLampId,id==='auto'?null:id)"));
 assert.ok(tree.includes('updateLampIcons()'));
 assert.ok(tree.includes("root.LumaLampIcons.svg(type,'g-tree-lamp-svg')"));
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
});
