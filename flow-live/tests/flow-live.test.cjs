'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const external=[...html.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(v=>/^[\w/-]+\.(?:js|css)$/.test(v));
test('All 14 Flow LIVE assets exist in published folder',()=>{
 assert.equal(external.length,14);
 for(const file of external)assert.ok(fs.existsSync(path.join(base,file)),file);
});
test('Inline and external JS compile',()=>{
 for(const [i,m] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries()){
  if(m[1].trim())assert.doesNotThrow(()=>new vm.Script(m[1],{filename:'live '+i}));
 }
 for(const file of external.filter(x=>x.endsWith('.js')))
  assert.doesNotThrow(()=>new vm.Script(fs.readFileSync(path.join(base,file),'utf8'),{filename:file}));
});
test('Störschutz controls are optional and OFF by default',()=>{
 assert.ok(html.includes('data-flow-guard="off" aria-pressed="true"'));
 assert.ok(html.includes('data-flow-guard="ambient" aria-pressed="false"'));
 assert.ok(!html.includes('data-flow-guard="conversation"'),'Ineffective conversation mode must not be selectable');
 for(const id of ['flowStatus','flowCalibrate','flowReset','miBridgeStatus','start','stop','musicOn','musicOff','hueLoad','target']){
  assert.ok(html.includes('id="'+id+'"'),'missing '+id);
 }
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
});
test('Experimental signal processing is fed real FFT frames',()=>{
 assert.ok(html.includes('new window.LumaFlowNoiseGuard.NoiseGuard()'));
 assert.ok(html.includes('lumaFlowGuard.sampleCalibration(data,'));
 assert.ok(html.includes('lumaFlowGuard.process(data,'));
 assert.ok(html.includes('data.set(flowResult.filteredSpectrum)'));
 assert.ok(html.includes("const conv=lumaFlowGuard?.mode==='conversation'"));
 assert.ok(html.includes("window.lumaStartMusic=async()=>"));
 assert.ok(html.includes("fetch('https://'+ip+'/api/"));
});
test('Flow LIVE does not write original production settings',()=>{
 const writers=[...html.matchAll(/localStorage\.(?:setItem|removeItem)\(['"]([^'"]+)/g)].map(m=>m[1]);
 assert.equal(writers.some(x=>x.startsWith('luma07_')||['luma_groups_v2','luma_music08','luma_noise012'].includes(x)),false);
 const groups=fs.readFileSync(path.join(base,'groups-v1.js'),'utf8');
 const scenes=fs.readFileSync(path.join(base,'scenes-v1.js'),'utf8');
 assert.ok(groups.includes('luma_live_groups_v2'));
 assert.ok(!scenes.includes('luma07_'));
});
test('Guard filter has no microphone, network or persistent storage access',()=>{
 const js=fs.readFileSync(path.join(base,'flow/noise-guard.js'),'utf8');
 assert.equal(/(?:getUserMedia|fetch\(|XMLHttpRequest|WebSocket|localStorage)/.test(js),false);
 const guard=require('../flow/noise-guard.js');
 assert.equal(new guard.NoiseGuard().mode,guard.MODES.OFF);
});

test('Collapsing a group naturally shrinks the tree instead of holding a fixed height',()=>{
 const css=fs.readFileSync(path.join(base,'groups-v1-tree.css'),'utf8');
 assert.ok(css.includes('.g-tree-inner{height:auto;min-height:0;max-height:'),'tree must size to visible rows');
 assert.ok(!css.includes('min-height:230px'),'old fixed panel height must not return');
 const tree=fs.readFileSync(path.join(base,'groups-v1-tree.js'),'utf8');
 assert.ok(tree.includes('this.updateExpansion()'),'collapse updates visibility instead of re-rendering');
});
test('Entire group chooser can be collapsed to the current selection and reopened',()=>{
 assert.ok(html.includes('id="targetTreeToggle"'));
 assert.ok(html.includes('aria-controls="targetFastTree"'));
 assert.ok(html.includes('const toggleTargetTree=()=>'));
 assert.ok(html.includes("panel.hidden=!show;help.hidden=!show;"));
 assert.ok(html.includes("button.setAttribute('aria-expanded',String(show))"));
 const css=fs.readFileSync(path.join(base,'music-immersive-v1.css'),'utf8');
 assert.ok(css.includes('.target-card:has(#targetFastTree[hidden])'));
});
test('Device glow cards now live only in groups, and palette previews live in Music',()=>{
 assert.ok(!html.includes('id="miLampGallery"'));
 assert.ok(!html.includes('id="lamps"'));
 assert.ok(html.includes("button.classList.add('mi-mood-card')"));
 assert.ok(html.includes("onPower:async(lightId,on)=>"));
 const tree=fs.readFileSync(path.join(base,'groups-v1-tree.js'),'utf8');
 const treeCss=fs.readFileSync(path.join(base,'groups-v1-tree.css'),'utf8');
 const musicCss=fs.readFileSync(path.join(base,'music-immersive-v1.css'),'utf8');
 assert.ok(tree.includes('g-tree-lamp-card'))
 assert.ok(tree.includes("'g-lamp-power'"));
 assert.ok(treeCss.includes('.g-tree-lamp-grid'));
 assert.ok(musicCss.includes('.mi-mood-card'));
});
