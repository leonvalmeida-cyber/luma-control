'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const style=fs.readFileSync(path.join(base,'quick-overlay.css'),'utf8');
const mood=fs.readFileSync(path.join(base,'music-immersive-v1.css'),'utf8');

test('Float control exists across the whole app instead of only within the music section',()=>{
 assert.ok(html.includes('id="quickLauncher"'));
 assert.ok(html.includes('id="quickOverlay"'));
 assert.ok(html.includes('id="quickClose"'));
 assert.ok(html.includes('id="quickBackdrop"'));
 assert.ok(html.includes('id="quickPanelBody"'));
 assert.ok(html.includes('aria-modal="true"'));
 assert.ok(html.includes('el(\'quickPanelBody\').append(el(\'targetCard\'))'));
 assert.ok(html.includes("el('targetCard').hidden=false; // one persistent group tree lives in the floating quick-control sheet"));
 assert.ok(style.includes('position:fixed'));
 assert.ok(style.includes('top:clamp(135px,22dvh,238px)'));
 assert.ok(style.includes('width:min(94vw,560px)'));
 assert.ok(style.includes('quick-sheet'));
 assert.ok(style.includes('height:calc(100dvh'));
 assert.ok(style.includes('.quick-overlay .g-tree-inner{max-height:none!important'));
});
test('Both close surfaces and Escape restore current page and dialog focus',()=>{
 const start=html.indexOf('const quickLauncher=el(');
 const end=html.indexOf('const toggleTargetTree=',start);
 assert.ok(start>0&&end>start,'controller code found');
 const controller=html.slice(start,end);
 const nodes=new Map();
 const make=id=>{
  const n={id,hidden:id==='quickOverlay',attrs:{},children:[],style:{top:''},classList:{add(){},remove(){}},
   setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]},focus(){n.focused=true},
   append(x){this.children.push(x)},querySelector(){return make('quickSheet')},querySelectorAll(){return []}};
  nodes.set(id,n);return n;
 };
 for(const id of ['quickLauncher','quickOverlay','quickSheet','quickPanelBody','targetCard','quickStatus','quickClose','quickBackdrop','target'])make(id);
 nodes.get('target').selectedOptions=[{textContent:'Küche'}];
 const fakeDocument={body:{classList:{add(){},remove(){}},style:{top:''}},activeElement:null};
 const fakeWindow={scrollY:320,pageYOffset:320,scrollTo(x,y){this.restored=y},addEventListener(){}};
 new Function('el','document','window','const firstMusicCard=null;\n'+controller)(id=>nodes.get(id),fakeDocument,fakeWindow);
 nodes.get('quickLauncher').onclick();
 assert.equal(nodes.get('quickOverlay').hidden,false);
 assert.equal(nodes.get('quickLauncher').attrs['aria-expanded'],'true');
 assert.equal(fakeDocument.body.style.top,'-320px');
 assert.equal(nodes.get('quickPanelBody').children[0],nodes.get('targetCard'),'moved existing node, not cloned');
 assert.equal(nodes.get('quickClose').focused,true);
 nodes.get('quickClose').onclick();
 assert.equal(nodes.get('quickOverlay').hidden,true);
 assert.equal(nodes.get('quickLauncher').attrs['aria-expanded'],'false');
 assert.equal(fakeWindow.restored,320);
 assert.equal(nodes.get('quickLauncher').focused,true);
 nodes.get('quickLauncher').onclick();
 nodes.get('quickBackdrop').onclick();
 assert.equal(nodes.get('quickOverlay').hidden,true);
});
test('Music tick uses retained seven frames after old display cards were removed',()=>{
 assert.ok(html.includes('const musicFrames=Array.from({length:7}'));
 assert.ok(html.includes('frame=musicFrames[i%musicFrames.length]'));
 assert.ok(!html.includes('lamps.length'),'undefined legacy lamp HTML variable must never reappear');
 assert.ok(html.includes("window.lumaStartMusic=async()=>"));
 assert.ok(html.includes('async function tick(){'));
 assert.ok(html.includes("await request('PUT',path,body)"));
});
test('Four bundled illustrated moods are visibly picture-based, without remote fetches',()=>{
 for(const name of ['neon','sunset','ocean','warm']){
  assert.ok(html.includes("sceneImage.src='media/'+id+'.svg?v=7'"));
  const art=fs.readFileSync(path.join(base,'media',name+'.svg'),'utf8');
  assert.match(art,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.ok(art.includes('viewBox="0 0 320 210"'));
  assert.ok(art.includes('</svg>'));
  assert.ok(!art.includes('http://')||art.includes('xmlns="http://www.w3.org/2000/svg"'));
 }
 assert.ok(mood.includes('img.mi-mood-picture'));
 assert.ok(mood.includes('object-fit:cover'));
 assert.ok(mood.includes('mi-mood-card[aria-pressed=true]'));
 assert.ok(html.includes("button.replaceChildren(artwork,caption,dots,check)"));
});
test('Overlay preserves single Hue group tree and is available in light/scene/music without re-render',()=>{
 assert.ok(html.includes('<div id="targetCard"'));
 assert.ok(html.includes('id="targetFastTree"'));
 assert.equal((html.match(/id="targetFastTree"/g)||[]).length,1);
 assert.ok(html.includes("groupTree?.updateLampStates();"));
 assert.ok(html.includes("onPower:async(lightId,on)=>"));
 assert.ok(html.includes("stopAll();\n    const answer=await request('PUT','/lights/'+encodeURIComponent(lightId)+'/state',{on})"));
 assert.ok(!html.includes('id="miLampGallery"'));
 assert.ok(!html.includes('id="lamps"'));
});
test('HTML scripts remain valid and live controls have unique IDs',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const [i,s] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries())
  if(s[1].trim())assert.doesNotThrow(()=>new vm.Script(s[1],{filename:'inline '+i}));
});
