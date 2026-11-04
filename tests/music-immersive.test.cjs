'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'music-immersive-v1.js'),'utf8');
const styles=fs.readFileSync(path.join(root,'music-immersive-v1.css'),'utf8');
const allIds=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
test('No duplicate element ids and all music controls remain present',()=>{
 assert.equal(new Set(allIds).size,allIds.length);
 for(const id of ['musicPane','start','stop','status','message','miVisual','miBars','miOutputHost','miQuickPalettes','miQuickSwatches','miQuickModes','miQuickFocus','miQuickPresets','palettes','modes','focusPresets','musicPresets','gain','speed','gate','light','peak','focus','musicInfo','musicDiagnostics','musicOn','musicOff','target'])
 assert.ok(allIds.includes(id),'missing '+id);
});
test('All inline scripts compile and initial Hue sender is retained',()=>{
 for(const [i,script]of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries()){
  if(script[1].trim())assert.doesNotThrow(()=>new vm.Script(script[1],{filename:'index inline '+i}));
 }
 assert.ok(html.includes('window.lumaMusicFrames=musicFrames'));
 assert.ok(html.includes('function groupDelay()'));
 assert.ok(html.includes('function tick()'));
 assert.ok(html.includes('window.lumaStartMusic='));
 assert.ok(html.includes('window.lumaStopMusic='));
 assert.ok(html.includes("el('miOutputHost').append(el('musicOutput'))"));
 assert.ok(html.includes('music-immersive-v1.js'));
});
test('Music UI module compiles and does not contain Hue commands or microphone capture',()=>{
 assert.doesNotThrow(()=>new vm.Script(js));
 assert.equal(/fetch\s*\(/.test(js),false);
 assert.equal(/getUserMedia\s*\(/.test(js),false);
 assert.equal(/localStorage\.setItem/.test(js),false);
 assert.ok(styles.includes('prefers-reduced-motion'));
});
test('Enhancer can mount, relink existing inputs and update without breaking selections',()=>{
 const nodes=new Map();let interval=null;
 const make=(tag='div')=>({tag,children:[],style:{setProperty(){}},classList:{add(){}},append(x){this.children.push(x)},setAttribute(){},addEventListener(type,fn){this['on'+type]=fn},getAttribute(){return null},textContent:'',dataset:{},hidden:false});
 const get=id=>{if(!nodes.has(id))nodes.set(id,make());return nodes.get(id)};
 const rootWindow={lumaMusicState:()=>({frames:[{rgb:[240,28,94],brightness:.5}],contextState:'running',frameAgeMs:30}),lumaMusicActive:()=>true,matchMedia:()=>({matches:false}),addEventListener(){},setTimeout(){return 1}};
 const doc={readyState:'complete',hidden:false,createElement:make,getElementById:get};
 // querySelectorAll is used only when physically interacting with old buttons, not by the enhancer.
 for(const id of ['musicPane','miVisual','miQuick','miMusicTarget','miBars','miTransportStatus','miSourceStatus','target','palettes','paletteSwatches','modes','focusPresets','musicPresets','musicSelection','miQuickPalettes','miQuickSwatches','miQuickModes','miQuickFocus','miQuickPresets','miQuickSelection'])
 get(id);
 get('target').selectedOptions=[{textContent:'Wohnzimmer'}];
 vm.runInNewContext(js,{window:rootWindow,document:doc,globalThis:rootWindow,setInterval:fn=>{interval=fn;return 1},clearInterval(){},performance:{now:()=>2000},setTimeout(){},console});
 assert.ok(nodes.get('miQuickPalettes').children.includes(nodes.get('palettes')));
 assert.ok(nodes.get('miQuickFocus').children.includes(nodes.get('focusPresets')));
 assert.ok(nodes.get('miQuickModes').children.includes(nodes.get('modes')));
 assert.equal(nodes.get('miBars').children.length,17);
 interval();
 assert.equal(nodes.get('miMusicTarget').textContent,'Wohnzimmer');
 assert.equal(nodes.get('miTransportStatus').textContent,'Licht aktiv');
 assert.equal(nodes.get('miVisual').dataset.live,'true');
});
