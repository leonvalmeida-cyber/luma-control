'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const folder=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(folder,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/g)];
const externals=[...html.matchAll(/<(?:script|link)\\b[^>]*?(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(p=>/^(?:[\\w-]+\\.(?:js|css))$/.test(p));
test('All published JS and CSS assets exist',()=>{
 assert.equal(externals.length,9);
 for(const file of externals)assert.ok(fs.existsSync(path.join(folder,file)), 'Missing '+file);
});
test('Inline scripts and bundled JS compile',()=>{
 scripts.forEach(([all,src],i)=>{if(src.trim())assert.doesNotThrow(()=>new vm.Script(src,{filename:'inline '+i}))});
 for(const file of externals.filter(x=>x.endsWith('.js')))assert.doesNotThrow(()=>new vm.Script(fs.readFileSync(path.join(folder,file),'utf8'),{filename:file}));
});
test('Unique element IDs and active music controls',()=>{
 const ids=[...html.matchAll(/\\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const id of ['musicPane','miBridgeStatus','miMusicTarget','start','stop','musicOn','musicOff','musicInfo','musicDiagnostics','target','hueLoad','hueKey','bridgeIp'])assert.ok(ids.includes(id),'Missing '+id);
});
test('Original Hue & mic sender retained; no mock audio-only response',()=>{
 assert.ok(html.includes('navigator.mediaDevices.getUserMedia'));
 assert.ok(html.includes("window.lumaStartMusic=async()=>"));
 assert.ok(html.includes("window.lumaRequest=request"));
 assert.ok(html.includes("window.lumaEnsureConnection=async()=>"));
 assert.ok(html.includes("'/lights/'+encodeURIComponent(d.id)+'/state'"));
 assert.ok(html.includes("window.lumaTargetIds=targetIds"));
 assert.ok(html.includes("fetch('https://'+ip+'/api/'"));
 assert.ok(html.includes("window.lumaBridgeConnected=()=>connected"));
});
test('Production browser settings remain isolated in test namespace',()=>{
 assert.ok(html.includes("localStorage.setItem('luma_live_'+k"));
 assert.ok(html.includes("localStorage.getItem('luma07_'+k"));
 assert.ok(!html.includes("localStorage.setItem('luma07_'+k"));
 assert.ok(!html.includes("localStorage.removeItem('luma07_key')"));
 assert.ok(!html.includes("localStorage.setItem('luma_music08'"));
 assert.ok(!html.includes("localStorage.setItem('luma_noise012'"));
 const groups=fs.readFileSync(path.join(folder,'groups-v1.js'),'utf8');
 assert.ok(groups.includes("STORAGE='luma_live_groups_v2'"));
 const scenes=fs.readFileSync(path.join(folder,'scenes-v1.js'),'utf8');
 assert.ok(!scenes.includes('luma07_'));
});
test('User sees live test and landing on music, with optional bridge setup',()=>{
 assert.ok(html.includes('LIVE-TEST MIT HUE BRIDGE'));
 assert.ok(html.includes("el('hueKey').value=read('key','');tab('music');"));
 assert.ok(html.includes("if(!connected)throw Error('Bridge ist nicht verbunden."));
 assert.ok(html.includes("tab('music');"));
 assert.ok(!html.includes("Demo-Animation starten"));
});
