'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const external=[...html.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(v=>/^[\w/-]+\.(?:js|css)$/.test(v));
test('All 11 Flow LIVE assets exist in published folder',()=>{
 assert.equal(external.length,11);
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
 assert.ok(html.includes('data-flow-guard="conversation" aria-pressed="false"'));
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
