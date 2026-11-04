/* Offline V4 regression checks. No bridge I/O, no user credentials. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'..');
const source=f=>fs.readFileSync(path.join(base,f),'utf8');
const v4=require('../v4.js'),pull=require('../quick-pull-v4.js');
const html=source('index.html'),css=source('v4.css'),js=source('v4.js'),gesture=source('quick-pull-v4.js');

test('standalone V4 preview, not stable Flow LIVE path',()=>{
 assert.match(html,/<base href="\.\.\/flow-live\/">/);
 assert.match(html,/flow-v4\/v4\.js/);
 assert.match(html,/flow-v4\/v4\.css/);
 assert.match(html,/flow-v4\/quick-pull-v4\.js/);
 assert.doesNotMatch(html,/src="quick-pull\.js/);
 assert.match(html,/id="ambientMovingHead"/);
 assert.match(html,/id="quickLampGrip"/);
});
test('none of the preview imports files from remote domains',()=>{
 assert.doesNotMatch(html,/(?:src|href)="https?:\/\//i);
});
test('three different shade outlines with flattened vintage apex',()=>{
 assert.deepEqual(Object.keys(v4.shape),['vintage','modern','retro']);
 assert.notEqual(v4.shape.vintage.shade,v4.shape.modern.shade);
 assert.notEqual(v4.shape.modern.shade,v4.shape.retro.shade);
 assert.match(v4.shape.vintage.shade,/H42/);
});
test('safe preferences and left-hand selection',()=>{
 const store={getItem:()=>'{malformed'};
 assert.equal(v4.load(store).hand,'right');
 assert.equal(v4.load(store).design,'vintage');
 const user=v4.load({getItem:()=>JSON.stringify({hand:'left',design:'retro',luna:false})});
 assert.deepEqual(user,{hand:'left',design:'retro',luna:false});
 assert.equal(v4.load({getItem:()=>JSON.stringify({hand:'top',design:'unknown'})}).hand,'right');
});
test('brightness maps percent to Hue bri and respects off',()=>{
 assert.equal(v4.fromPercent(1),1);
 assert.equal(v4.fromPercent(100),254);
 assert.equal(v4.fromPercent(50),126);
 assert.equal(v4.brightness({on:false,bri:254}),0);
 assert.equal(v4.brightness({on:true,bri:254}),100);
});
test('per-lamp target mapping guarded against missing states',()=>{
 assert.deepEqual(v4.selected({devices:[{name:'A',state:{bri:80}}]},['17','18']),[]);
 assert.deepEqual(v4.selected({devices:[{name:'A',state:{bri:80}}]},['17']),
  [{id:'17',name:'A',state:{bri:80}}]);
});
test('brightness sends only on change, not on input; bounded batches',()=>{
 assert.match(js,/masterSlider\.addEventListener\('change'/);
 assert.match(js,/masterSlider\.addEventListener\('input'/);
 assert.match(js,/for\(let i=0;i<job\.batch\.length;i\+=3\)/);
 assert.match(js,/Promise\.allSettled/);
 assert.match(js,/window|win\.lumaRequest/);
});
test('left-handed mode mirrors geometry and both gestures',()=>{
 assert.match(gesture,/const mirrored=\(\)=>doc\.documentElement/);
 assert.match(gesture,/const headX=mirrored\(\)\?/);
 assert.match(gesture,/const mode=session\.mode,dx=\(mirrored\(\)\?-1:1\)/);
 assert.match(gesture,/const distance=\(mirrored\(\)\?-1:1\)/);
 assert.match(css,/data-v4-hand=left/);
 assert.match(css,/quick-lamp-grip/);
 assert.match(css,/ambient-beam-canvas\{transform:scaleX\(-1\)/);
 assert.equal(typeof pull.attach,'function');
});
test('top cone modestly brighter; dark/off stays dark',()=>{
 assert.match(css,/#ambientBeamGradientUp stop:first-child\{stop-opacity:\.25\}/);
 assert.match(css,/data-ambient-state=off/);
 assert.match(css,/data-ambient-state=on\]\[aria-expanded=true\]/);
});
test('ambient colours bound to real scene state and moving shade',()=>{
 assert.match(html,/id="v4ClothGradient"/);
 assert.match(js,/win\.lumaAmbientLightState/);
 assert.match(js,/win\.lumaMusicActive/);
 assert.match(js,/ambient-lamp-diffuser/);
 assert.match(css,/rgb\(var\(--ambient-rgb\)/);
});
test('Luna concept is optional and responds to actual pull progress',()=>{
 assert.match(js,/luna\.textContent='una'/);
 assert.match(js,/const elbow=43-pull\*100\/73/);
 assert.match(js,/MutationObserver/);
 assert.match(css,/data-v4-luna=false/);
});
test('existing V3 open / close timing remains anchored',()=>{
 assert.equal(pull.limits(390).pull,167.7);
 assert.equal(pull.snap(0.45,20,400),true);
 assert.equal(pull.snapClose(0.4,20,400),true);
});
