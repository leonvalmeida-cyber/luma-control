'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const markup=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const scripts=[...markup.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
const inline=scripts.filter(x=>x[1].trim()).map(x=>x[1]).join('\n');
test('Bridge check page validates, has no external scripts and keeps main app isolated',()=>{
 assert.doesNotThrow(()=>new vm.Script(inline));
 const scripts=[...markup.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(scripts,['./groups-v1.js','./groups-v1-tree.js']);
 assert.ok(markup.includes('Bridge-Test'));
 assert.ok(markup.includes("connect-src https:"));
 assert.ok(!markup.includes("onclick=")); // no inline HTML commands
 assert.ok(!markup.includes('navigator.sendBeacon'));
 assert.ok(!markup.includes('fetch("https://'));
});
function sandbox({withStoredCredentials=false}={}){
 const nodes=new Map(),fetched=[],storageWrites=[];
 const stored=new Map(withStoredCredentials?[
 ['luma07_ip',JSON.stringify('192.168.1.20')],
 ['luma07_key',JSON.stringify('SAMPLE-SECRET-KEY')],
 ['luma07_groups',JSON.stringify([{id:'local:legacy',name:'Sofa',lights:['1'],groups:[]}])],
 ['luma07_order',JSON.stringify(['2','1'])]
 ]:[]);
 function element(tag='div'){
  const listeners={};
  return {tag,className:'',textContent:'',value:'',checked:false,hidden:false,disabled:false,children:[],
   options:[],style:{setProperty(){}},classList:{add(){}},addEventListener(evt,fn){listeners[evt]=fn},
   dispatch(evt){return listeners[evt]?.({target:this})},append(...items){this.children.push(...items)},
   add(x){this.options.push(x);if(!this.value)this.value=x.value},
   replaceChildren(...items){this.children=[...items];if(tag==='select'){this.options=[];this.value=''}},
   setAttribute(){},getAttribute(){},set title(v){this._title=v},get title(){return this._title}
  }
 }
 function id(name){if(!nodes.has(name))nodes.set(name,element(name==='singleLamp'?'select':'div'));return nodes.get(name)}
 const LumaGroupsV1=require('../groups-v1.js');
 class StubTree{constructor(engine,root,opts){this.engine=engine;this.opts=opts;this.root=root}render(){}updateSelection(){}getSelected(){return this.opts.getSelected()}}
 const lights={'1':{name:'Hue Iris',type:'Color',state:{reachable:true,on:false}},'2':{name:'Twilight',type:'Color',state:{reachable:true,on:true}}};
 const groups={'1':{name:'Wohnzimmer',type:'Room',lights:['1','2']}};
 async function fetch(url,opts){
  fetched.push({url,method:opts?.method||'GET',body:opts?.body,headers:opts?.headers});
  const response={ok:true,json:async()=>{
   if(url.includes('/lights/')&&opts.method==='PUT')return [{success:true}];
   if(url.endsWith('/lights')&&opts.method==='POST')return [{success:{'/lights':'Searching for new devices'}}];
   if(url.endsWith('/lights'))return lights;
   if(url.endsWith('/groups'))return groups;
   if(url.endsWith('/config'))return {bridgeid:'001788ABCDEF'};
   if(url.includes('/clip/v2/resource/light'))return {data:[{id:'abc'}],errors:[]};
   throw Error('Unexpected URL '+url);
  }};
  return response;
 }
 const global={
  document:{getElementById:id,createElement:tag=>element(tag)},
  localStorage:{getItem:k=>stored.get(k)??null,setItem(k,v){storageWrites.push([k,v])}},
  window:{confirm:()=>true,LumaGroupsV1,LumaGroupsTree:{Tree:StubTree}},
  Option:class {constructor(label,value){this.textContent=label;this.value=value}},
  fetch,URL,AbortController,Error,Map,JSON,String,Set,Promise,Array,Object,RegExp,Number,Date,
  setTimeout,clearTimeout
 };
 vm.runInNewContext(inline,global);
 return {nodes,id,fetched,storageWrites,stored};
}
test('Page load never fetches or changes Hue state',()=>{
 const x=sandbox({withStoredCredentials:true});
 assert.equal(x.fetched.length,0);assert.equal(x.storageWrites.length,0);
});
test('Reusing existing key requires an explicit action and never performs a network call',()=>{
 const x=sandbox({withStoredCredentials:true});
 assert.equal(x.id('key').value,'');x.id('reuse').dispatch('click');
 assert.equal(x.id('key').value,'SAMPLE-SECRET-KEY');assert.equal(x.id('ip').value,'192.168.1.20');
 assert.equal(x.fetched.length,0);assert.deepEqual(x.storageWrites,[]);
});
test('Explicit connect reads only light / group / config and populates real group tree',async()=>{
 const x=sandbox({withStoredCredentials:true});
 x.id('reuse').dispatch('click');
 await x.id('connect').dispatch('click');
 assert.equal(x.id('results').hidden,false);
 assert.equal(x.id('countLamps').textContent,2);
 assert.equal(x.id('countRooms').textContent,1);
 assert.equal(x.id('countLocal').textContent,1);
 assert.equal(x.fetched.length,3);
 assert.ok(x.fetched.every(call=>call.method==='GET'));
 assert.deepEqual(x.storageWrites,[]);
 assert.ok(x.fetched.every(call=>call.url.startsWith('https://192.168.1.20/api/SAMPLE-SECRET-KEY/')));
});
test('Without explicit write approval, no light command can be sent',async()=>{
 const x=sandbox({withStoredCredentials:true});
 x.id('reuse').dispatch('click');await x.id('connect').dispatch('click');
 assert.equal(x.id('turnOn').disabled,true);
 await x.id('turnOn').dispatch('click');
 assert.equal(x.fetched.filter(call=>call.method==='PUT').length,0);
 assert.deepEqual(x.storageWrites,[]);
});
test('Explicit single-light test sends only one per-light command, not groups',async()=>{
 const x=sandbox({withStoredCredentials:true});
 x.id('reuse').dispatch('click');await x.id('connect').dispatch('click');
 x.id('consent').checked=true;x.id('consent').dispatch('change');
 x.id('singleLamp').value='1';await x.id('turnOn').dispatch('click');
 const writes=x.fetched.filter(call=>call.method==='PUT');
 assert.equal(writes.length,1);
 assert.ok(writes[0].url.endsWith('/lights/1/state'));
 assert.deepEqual(JSON.parse(writes[0].body),{on:true});
 assert.ok(!writes[0].url.includes('/groups/'));
 assert.deepEqual(x.storageWrites,[]);
});
test('Optional Hue v2 check is read-only',async()=>{
 const x=sandbox({withStoredCredentials:true});x.id('reuse').dispatch('click');
 await x.id('v2test').dispatch('click');
 assert.equal(x.fetched.length,1);
 assert.equal(x.fetched[0].method,'GET');
 assert.ok(x.fetched[0].url.endsWith('/clip/v2/resource/light'));
 assert.ok(x.fetched[0].headers['hue-application-key']);
 assert.deepEqual(x.storageWrites,[]);
});

test('No serial search may start without explicit opt-in and valid serial',async()=>{
 const x=sandbox({withStoredCredentials:true});
 x.id('reuse').dispatch('click');await x.id('connect').dispatch('click');
 x.id('serial').value='ABC123';x.id('serial').dispatch('input');
 assert.equal(x.id('startSerialSearch').disabled,true);
 await x.id('startSerialSearch').dispatch('click');
 assert.equal(x.fetched.filter(c=>c.method==='POST').length,0);
 x.id('serialConsent').checked=true;x.id('serialConsent').dispatch('change');
 x.id('serial').value='WRONG!';x.id('serial').dispatch('input');
 assert.equal(x.id('startSerialSearch').disabled,true);
 assert.equal(x.fetched.filter(c=>c.method==='POST').length,0);
});
test('Consent-based serial search sends one targeted Bridge command',async()=>{
 const x=sandbox({withStoredCredentials:true});
 x.id('reuse').dispatch('click');await x.id('connect').dispatch('click');
 x.id('serial').value=' ab c1 23 ';x.id('serial').dispatch('input');
 x.id('serialConsent').checked=true;x.id('serialConsent').dispatch('change');
 assert.equal(x.id('startSerialSearch').disabled,false);
 await x.id('startSerialSearch').dispatch('click');
 const writes=x.fetched.filter(c=>c.method!=='GET');
 assert.equal(writes.length,1);
 assert.equal(writes[0].method,'POST');
 assert.ok(writes[0].url.endsWith('/lights'));
 assert.deepEqual(JSON.parse(writes[0].body),{deviceid:['ABC123']});
 assert.equal(x.fetched.some(c=>c.method==='PUT'),false);
 assert.deepEqual(x.storageWrites,[]);
});
test('Explicit synchronization re-fetches both lights and rooms, read-only',async()=>{
 const x=sandbox({withStoredCredentials:true});
 x.id('reuse').dispatch('click');await x.id('connect').dispatch('click');
 const start=x.fetched.length;
 await x.id('syncDevices').dispatch('click');
 assert.equal(x.fetched.length,start+2);
 assert.deepEqual(x.fetched.slice(start).map(c=>c.method),['GET','GET']);
 assert.ok(x.fetched.slice(start).some(c=>c.url.endsWith('/lights')));
 assert.ok(x.fetched.slice(start).some(c=>c.url.endsWith('/groups')));
 assert.deepEqual(x.storageWrites,[]);
});
