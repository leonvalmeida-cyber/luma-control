'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'music-immersive-v1.css'),'utf8');
const treeCSS=fs.readFileSync(path.join(root,'groups-v1-tree.css'),'utf8');
const treeJS=fs.readFileSync(path.join(root,'groups-v1-tree.js'),'utf8');

function fakeNode(tag='div'){
 const node={tag,attrs:{},children:[],dataset:{},hidden:false,disabled:false,style:{setProperty(){}},classList:{add(){}},textContent:'',onclick:null};
 node.append=(...xs)=>{node.children.push(...xs);return node};
 node.replaceChildren=(...xs)=>{node.children=[...xs];return node};
 node.setAttribute=(k,v)=>{node.attrs[k]=String(v)};
 node.getAttribute=k=>node.attrs[k];
 return node;
}
function treeFixture(){
 const scope={document:{createElement:fakeNode},LumaLampIcons:null};
 vm.runInNewContext(treeJS,{globalThis:scope,document:scope.document,console});
 const engine={
  bridgeId:'hue:test',
  lights:{'1':{name:'Küche Decke',modelid:'LCA011',state:{on:false,reachable:true,bri:140}},'2':{name:'Arbeitsplatte',state:{on:true,reachable:true,bri:210}}},
  livingRoom:()=>null,
  globalOrder:()=>['1','2'],
  localGroups:()=>[],
  bridgeRooms:()=>[{id:'bridge:7',name:'Küche',type:'hue-room',lights:['1','2']}],
  resolve:id=>id==='all'||id==='bridge:7'?['1','2']:id==='lamp:1'?['1']:id==='lamp:2'?['2']:[],
  currentTarget:()=>selected,
  group:id=>({id,name:id})
 };
 let selected='all',selects=[],wrote=[];
 const rootNode=fakeNode('div');
 const tree=new scope.LumaGroupsTree.Tree(engine,rootNode,{
  onSelect:id=>{selected=id;selects.push(id)},
  getSelected:()=>selected,
  onPower:async(id,on)=>{wrote.push({id,on});engine.lights[id].state.on=on}
 });
 tree.render();
 return {tree,rootNode,engine,selects,wrote,selected:()=>selected};
}

test('Four distinct mood artworks use existing palette keys and original event handlers',()=>{
 for(const key of ['neon','sunset','ocean','warm']){
  assert.ok(html.includes(key+":{name:"),'mood '+key+' is absent');
  assert.ok(css.includes('data-mood-art='+key+']'),'artwork missing for '+key);
 }
 assert.ok(html.includes("button.classList.add('mi-mood-card')"));
 assert.ok(html.includes('button.replaceChildren(artwork,caption,dots,check)'));
 assert.ok(html.includes("for(const b of document.querySelectorAll('[data-palette]'))b.onclick="));
 assert.ok(html.includes("document.querySelectorAll('[data-palette]').forEach(b=>{const selected=b.dataset.palette===palette;"));
 assert.ok(css.includes('.mi-mood-card[aria-pressed=true]'));
 assert.ok(css.includes('scroll-snap-type:x proximity'));
 assert.ok(!css.includes('background-image:url('),'no external product photos');
});
test('Single music destination: old anonymous seven-light gallery is removed without losing seven music frames',()=>{
 assert.ok(!html.includes('id="miLampGallery"'));
 assert.ok(!html.includes('id="miLampCount"'));
 assert.ok(!html.includes('id="lamps"'));
 assert.ok(html.includes('const musicFrames=Array.from({length:7}'));
 assert.ok(html.includes('musicFrames.forEach((frame,i)=>{'));
 assert.ok(html.includes('window.lumaMusicState=()=>'));
 assert.ok(html.includes("window.lumaStartMusic=async()=>"));
});
test('Tree renders two lamp tiles under a room with parent disclosure intact',()=>{
 const {tree}=treeFixture();
 assert.equal(tree.selectables.filter(x=>x.power).length,2);
 assert.ok(tree.expandables.some(x=>x.id==='bridge:7'));
 assert.ok(tree.expandables.some(x=>x.id==='all'));
 const room=tree.expandables.find(x=>x.id==='bridge:7');
 assert.ok(room.children.className.includes('g-tree-lamp-grid'));
 assert.ok(treeCSS.includes('grid-template-columns:repeat(2,minmax(0,1fr))'));
 assert.ok(treeCSS.includes('g-tree-lamp-card'));
 assert.ok(treeCSS.includes('g-lamp-art'));
 assert.ok(treeCSS.includes('g-lamp-power'));
 assert.ok(treeCSS.includes('.g-tree-lamp-grid'));
});
test('Selecting a lamp never sends light commands; power never changes selection',async()=>{
 const {tree,selects,wrote,engine}=treeFixture();
 const item=tree.selectables.find(x=>x.id==='lamp:1');
 item.pick.onclick();
 assert.equal(selects.join(','),'lamp:1');
 assert.equal(wrote.length,0);
 const selectedCount=selects.length;
 await item.power.onclick();
 assert.deepEqual(wrote,[{id:'1',on:true}]);
 assert.equal(selects.length,selectedCount);
 assert.equal(item.lightStatus.textContent,'● An');
 assert.equal(engine.lights['2'].state.on,true,'other light remains unchanged');
 assert.equal(item.power.attrs['aria-pressed'],'true');
 await item.power.onclick();
 assert.deepEqual(wrote,[{id:'1',on:true},{id:'1',on:false}]);
 assert.equal(item.lightStatus.textContent,'○ Aus');
});
test('Unreachable lamp cannot be selected or sent a Hue write',async()=>{
 const {tree,engine,selects,wrote}=treeFixture();
 engine.lights['1'].state.reachable=false;tree.updateLampStates();
 const item=tree.selectables.find(x=>x.id==='lamp:1');
 assert.equal(item.pick.disabled,true);
 assert.equal(item.power.disabled,true);
 await item.power.onclick();
 assert.equal(wrote.length,0);
 assert.equal(selects.length,0);
 assert.equal(item.lightStatus.textContent,'Nicht erreichbar');
});
test('Expanding/collapsing a room reuses the original DOM rather than rebuilding it',()=>{
 const {tree,rootNode}=treeFixture();
 const room=tree.expandables.find(x=>x.id==='bridge:7');
 const first=rootNode.children[1],existingCard=tree.selectables.find(x=>x.id==='lamp:1').pick;
 assert.equal(room.children.hidden,true);
 room.toggle.onclick();
 assert.equal(room.children.hidden,false);
 assert.equal(rootNode.children[1],first);
 room.toggle.onclick();
 assert.equal(room.children.hidden,true);
 assert.equal(tree.selectables.find(x=>x.id==='lamp:1').pick,existingCard);
 assert.ok(treeCSS.includes('height:auto;min-height:0;max-height:'));
});
test('Power commands are explicitly limited to the clicked lamp and stop competing music',()=>{
 assert.ok(html.includes('onPower:async(lightId,on)=>'));
 assert.ok(html.includes("stopAll();\n    const answer=await request('PUT','/lights/'+encodeURIComponent(lightId)+'/state',{on})"));
 assert.ok(html.includes('device.state.on=on;renderLights()'));
 assert.ok(html.includes('groupTree?.updateLampStates()'));
 assert.ok(!html.includes("request('PUT','/groups/0/action',{on})"));
});
test('Music/DSP/transport and main production storage keys remain unchanged by view',()=>{
 assert.ok(html.includes('new window.LumaFlowNoiseGuard.NoiseGuard()'));
 assert.ok(html.includes("window.lumaRequest=request"));
 assert.ok(html.includes("fetch('https://'+ip+'/api/'"));
 assert.ok(!html.includes("localStorage.setItem('luma07_'"));
 const allIds=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(new Set(allIds).size,allIds.length);
 for(const [i,m]of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries()){
  if(m[1].trim())assert.doesNotThrow(()=>new vm.Script(m[1],{filename:'inline '+i}));
 }
});
