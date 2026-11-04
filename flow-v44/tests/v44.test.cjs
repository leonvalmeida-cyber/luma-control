/* V4.4 magnetic brightness docking regression checks.
 * No Hue bridge, microphone, network, device credentials or camera required. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'..'),read=(f)=>fs.readFileSync(path.join(dir,f),'utf8');
const html=read('index.html'),css=read('v44.css'),main=read('v44.js'),pull=read('quick-pull-v44.js');
const a=require('../v44.js'),p=require('../quick-pull-v44.js');

test('V4.4 remains isolated and keeps all existing Hue UI assets',()=>{
 assert.match(html,/<base href="\.\.\/flow-live\/">/);
 assert.match(html,/src="\.\.\/flow-v44\/quick-pull-v44\.js/);
 assert.match(html,/src="\.\.\/flow-v44\/v44\.js/);
 assert.match(html,/href="\.\.\/flow-v44\/v44\.css/);
 assert.match(html,/href="\.\.\/flow-v43\/v43\.css/);
 assert.match(html,/src="\.\.\/flow-v41\/groups-v41-tree\.js/);
 assert.doesNotMatch(html,/src="\.\.\/flow-v43\/quick-pull-v43\.js/);
 assert.doesNotMatch(html,/src="\.\.\/flow-v43\/v43\.js/);
});
test('compact closed lamp is controlled by real 0..1 pull progress and safely positioned',()=>{
 assert.match(css,/--v44-launcher-top:clamp\(104px,17dvh,158px\)/);
 assert.match(css,/--v44-open-progress:0/);
 assert.match(css,/scale\(calc\(\.73 \+ var\(--v44-open-progress\)\*\.27\)\)/);
 assert.match(pull,/setProperty\('--v44-open-progress',String\(current\)\)/);
 assert.match(pull,/const fixedY=\(\)=>launcher\.getBoundingClientRect\(\)\.top/);
});
test('reserved real master card gutter avoids an overlapping invisible grip',()=>{
 assert.match(css,/#quickOverlay \.v41-master\{/);
 assert.match(css,/padding-right:88px!important/);
 assert.match(css,/#v44DockSocket\{/);
 assert.match(css,/right:10px;top:10px/);
 assert.match(css,/\.quick-lamp-grip,/);
 assert.match(css,/--luma-pull-px/); // real shade/grip geometric position retained from previous stylesheet
});
test('physical Luma arm telescopes into dock rather than cloning artwork',()=>{
 assert.match(pull,/const magnetic=p\*magnet/);
 assert.match(pull,/limit\.pull\*p\*\(1-\.93\*magnetic\)/);
 assert.match(pull,/const lift=clamp\(height\*\.07,40,59\)\*p\*\(1-\.99\*magnetic\)/);
 assert.match(pull,/arm\.setAttribute\('d',armPath\(g\.distance/);
 assert.match(pull,/movingAssembly\.setAttribute\('transform'/);
 assert.match(pull,/rootStyle\.setProperty\('--luma-pull-px'/);
 assert.match(pull,/rootStyle\.setProperty\('--v44-magnet'/);
 assert.equal(new Set(['vintage','deco','washi','halo'].map(x=>p.armPath(172,73,x,false))).size,1);
});
test('snap is based on master brightness socket visibility and approximate height',()=>{
 assert.match(pull,/getElementById\?\.\('v44DockSocket'\)/);
 assert.match(pull,/rect\.top>55/);
 assert.match(pull,/rect\.bottom<Math\.min\(height-50,340\)/);
 assert.match(pull,/Math\.abs\(\(rect\.top\+rect\.bottom\)\/2-baseline\)<115/);
 assert.match(pull,/magnetTarget=next;animateMagnet\(\)/);
 assert.match(pull,/magnet\+\(reduced\?error:error\*\.28\)/);
});
test('tap focuses existing master slider, never directly changes actual brightness',()=>{
 assert.match(main,/socket\.addEventListener\('click',activateBrightness\)/);
 assert.match(main,/win\.lumaV44ActivateBrightness=activateBrightness/);
 assert.match(main,/masterSlider\.focus\(\{preventScroll:true\}\)/);
 assert.match(main,/Helligkeit hier einstellen/);
 assert.match(pull,/listen\(grip,'click',event=>/);
 assert.match(pull,/win\.lumaV44ActivateBrightness\?\.\(\)/);
 const begin=main.indexOf('function activateBrightness()');
 const end=main.indexOf("socket.addEventListener('click'",begin);
 assert.ok(begin>0&&end>begin);
 assert.doesNotMatch(main.slice(begin,end),/\blumaRequest\(|request\('PUT'/);
});
test('drag-to-close still works and snap/motion reset fully on close',()=>{
 assert.match(pull,/bind\(grip,'close'\)/);
 assert.match(pull,/const shouldOpen=cancel\?/);
 assert.match(pull,/const initialMagnet=magnet|initialMagnet=magnet/);
 assert.match(pull,/magnet=round\(initialMagnet\*\(1-ease\)\)/);
 assert.match(pull,/magnet=0;magnetTarget=0/);
 assert.match(pull,/if\(magnetFrame\)\{caf\(magnetFrame\);magnetFrame=0;\}/);
});
test('scroll rail, rays, left-hand preference and source lighting are preserved',()=>{
 assert.match(pull,/listen\(overlay,'scroll',onScroll,true\)/);
 assert.match(pull,/const next=round\(clamp\(travel\*\.6,0,Math\.min\(82,maxDock\)\)\)/);
 assert.match(pull,/beamUp\.setAttribute\('d',glow\.up\)/);
 assert.match(html,/id="v43FixedRail"/);
 assert.match(html,/id="v43MovingAssembly"/);
 assert.match(html,/id="v42InnerGlow"/);
 assert.match(css,/pointer-events:none!important/);
 assert.deepEqual(Object.keys(a.shape),['vintage','deco','washi','halo']);
 assert.deepEqual(a.load({getItem:()=>JSON.stringify({design:'halo',hand:'left'})}),{design:'halo',hand:'left'});
});
test('master and per-lamp dimmers retain original release-only Hue command behaviour',()=>{
 assert.match(main,/masterSlider\.addEventListener\('change'/);
 assert.match(main,/masterSlider\.addEventListener\('input'/);
 assert.match(html,/src="\.\.\/flow-v41\/groups-v41-tree\.js/);
 assert.match(html,/onBrightness:async\(lightId,percent\)/);
 assert.equal(a.fromPercent(1),1);
 assert.equal(a.fromPercent(100),254);
 assert.doesNotMatch(pull,/\bfetch\(|\bWebSocket\b/);
});
