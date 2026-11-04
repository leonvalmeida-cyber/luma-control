'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {NoiseGuard,MODES}=require('../flow/noise-guard.js');
const SAMPLE_RATE=44100,BIN_COUNT=1024;
function spectrum(defaultDb=-102,tones=[]){
 const f=new Float32Array(BIN_COUNT).fill(defaultDb);
 for(const [hz,dbValue]of tones){
  const x=Math.round(hz/(SAMPLE_RATE/2/BIN_COUNT));
  f[x]=dbValue;
 }
 return f;
}
function calibratedGuard(mode,noise=spectrum(-80)){
 const g=new NoiseGuard({mode,profileDurationMs:1000});
 g.startCalibration({sampleRate:SAMPLE_RATE,binCount:BIN_COUNT,nowMs:0});
 for(let i=0;i<20;i++)g.sampleCalibration(noise,{sampleRate:SAMPLE_RATE,nowMs:50*i+80});
 g.sampleCalibration(noise,{sampleRate:SAMPLE_RATE,nowMs:1100});
 return g;
}
test('Default is OFF and leaves raw audio energy unchanged with no profile',()=>{
 const g=new NoiseGuard(),s=spectrum(-101,[[86,-33],[800,-35]]);
 const o=g.process(s,{sampleRate:SAMPLE_RATE,nowMs:20});
 assert.equal(o.mode,MODES.OFF);
 assert.equal(o.protectionActive,false);
 assert.ok(o.signal>.2);
 assert.deepEqual(Array.from(s),Array.from(spectrum(-101,[[86,-33],[800,-35]])),'input spectrum is not mutated');
});
test('Ambient mode without calibration does not pretend to filter noise',()=>{
 const g=new NoiseGuard({mode:MODES.AMBIENT});
 const o=g.process(spectrum(-70),{sampleRate:SAMPLE_RATE,nowMs:40});
 assert.equal(o.protectionActive,false);
 assert.equal(o.profileReady,false);
 assert.equal(o.suppression,0);
});
test('Room noise calibration captures stationary fan spectrum',()=>{
 const noise=spectrum(-85,[[86,-45],[800,-59]]);
 const g=calibratedGuard(MODES.AMBIENT,noise);
 assert.equal(g.profileReady,true);
 const filtered=g.process(noise,{sampleRate:SAMPLE_RATE,nowMs:1300});
 assert.equal(filtered.protectionActive,true);
 assert.ok(filtered.suppression>.999,'identical noise removed');
 assert.ok(filtered.signal<.005);
});
test('After calibration a new bass music note remains while fan noise is removed',()=>{
 const noise=spectrum(-85,[[86,-45],[800,-59]]);
 const g=calibratedGuard(MODES.AMBIENT,noise);
 const f=g.process(spectrum(-85,[[86,-24],[800,-59]]),{sampleRate:SAMPLE_RATE,nowMs:1350});
 assert.ok(f.bands.bass>.48,'music bass passes through background filter');
 assert.ok(f.bands.mid<.05,'unchanged conversational mid noise does not contribute');
 assert.ok(f.signal>.15);
});
test('Conversation mode strongly reduces mid-range-only speech-like triggers',()=>{
 const voice=spectrum(-110,[[780,-20],[1430,-27]]);
 const normal=new NoiseGuard();
 const conversation=new NoiseGuard({mode:MODES.CONVERSATION});
 const a=normal.process(voice,{sampleRate:SAMPLE_RATE,nowMs:25});
 const b=conversation.process(voice,{sampleRate:SAMPLE_RATE,nowMs:25});
 assert.ok(a.signal>.2);
 assert.ok(b.signal<a.signal*.2,'midrange influence reduced but not acoustically removed');
 assert.ok(b.bands.mid<a.bands.mid*.15);
});
test('Conversation mode retains bass-driven beat response',()=>{
 const g=new NoiseGuard({mode:MODES.CONVERSATION});
 const idle=spectrum(-105);
 g.process(idle,{sampleRate:SAMPLE_RATE,nowMs:15});
 const beat=g.process(spectrum(-105,[[86,-20],[129,-21]]),{sampleRate:SAMPLE_RATE,nowMs:50});
 assert.ok(beat.transient>.15);
 assert.ok(beat.signal>.3);
});
test('Off mode disables profile suppression; mode switching resets dynamics',()=>{
 const noise=spectrum(-70,[[86,-39]]);
 const g=calibratedGuard(MODES.AMBIENT,noise);
 assert.ok(g.process(noise,{sampleRate:SAMPLE_RATE,nowMs:1300}).signal<.01);
 g.setMode(MODES.OFF);
 const o=g.process(noise,{sampleRate:SAMPLE_RATE,nowMs:1400});
 assert.equal(o.protectionActive,false);
 assert.ok(o.signal>.2);
 g.setMode(MODES.AMBIENT);
 assert.ok(g.process(noise,{sampleRate:SAMPLE_RATE,nowMs:1450}).signal<.01);
});
test('Wrong sample rate never reuses a room profile',()=>{
 const g=calibratedGuard(MODES.AMBIENT,spectrum(-65));
 const o=g.process(spectrum(-65),{sampleRate:48000,nowMs:1300});
 assert.equal(o.profileReady,false);
 assert.equal(o.protectionActive,false);
});
test('Reset profile drops calibration and prevents stale suppression',()=>{
 const g=calibratedGuard(MODES.CONVERSATION,spectrum(-50));
 assert.equal(g.profileReady,true);
 g.resetProfile();
 assert.equal(g.profileReady,false);
 assert.equal(g.process(spectrum(-50),{sampleRate:SAMPLE_RATE,nowMs:1300}).protectionActive,false);
});
test('Calibration refuses invalid parameters and mismatched formats',()=>{
 const g=new NoiseGuard();
 assert.throws(()=>g.setMode('magic'),/Unbekannter/);
 assert.throws(()=>g.startCalibration({sampleRate:0,binCount:12}),/Ungültiges/);
 g.startCalibration({sampleRate:SAMPLE_RATE,binCount:BIN_COUNT,nowMs:0});
 assert.throws(()=>g.sampleCalibration(spectrum(-85),{sampleRate:48000,nowMs:50}),/Sample-Rate/);
 g.cancelCalibration();
 assert.equal(g.calibrating,false);
});
test('No raw audio is stored and no network APIs used',()=>{
 const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
 const js=fs.readFileSync(path.join(__dirname,'../flow/noise-guard.js'),'utf8');
 assert.doesNotThrow(()=>new vm.Script(js));
 assert.equal(/(?:fetch\(|WebSocket|XMLHttpRequest|getUserMedia|localStorage)/.test(js),false);
 assert.equal(/(?:Float32Array|Float64Array)/.test(js),true);
});
