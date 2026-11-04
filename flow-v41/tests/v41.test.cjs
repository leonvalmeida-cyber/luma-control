/* V4.1 isolated checks: DOM contracts, real Hue command gating, arm geometry.
   No microphone / bridge access. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'),js=read('v41.js'),css=read('v41.css');
const tree=read('groups-v41-tree.js'),pullSource=read('quick-pull-v41.js');
const app=require('../v41.js'),pull=require('../quick-pull-v41.js');

test('V4.1 preview is isolated and keeps the proven Flow baseline',()=>{
 assert.match(html,/<base href="\.\.\/flow-live\/">/);
 for(const p of ['flow-v41/v41.css','flow-v41/v41.js','flow-v41/quick-pull-v41.js','flow-v41/groups-v41-tree.js']){
  assert.ok(html.includes(p),p+' not linked');
 }
 assert.doesNotMatch(html,/src="groups-v1-tree\.js/);
 assert.doesNotMatch(html,/flow-v4\/v4\.js/);
 assert.doesNotMatch(html,/flow-v4\/quick-pull-v4\.js/);
 assert.match(html,/id="quickLampGrip"/);
 assert.match(html,/id="quickOverlay"/);
 assert.match(html,/id="ambientBeamUp"/);
});
test('first-hand vintage reference: flat top, tapered fabric, real pleats and subtle fringe',()=>{
 const vintage=app.shape.vintage.shade;
 assert.match(vintage,/M20 28 L43 28/);
 assert.match(vintage,/L60 72/);
 assert.match(html,/id="v41Linen"/);
 assert.match(html,/v41-pleat-shadows/);
 assert.match(html,/v41-pleat-highlights/);
 assert.match(html,/v41-fringe/);
 assert.match(css,/fill:url\(#v41Linen\)!important/);
 assert.match(css,/stroke-opacity:\.42/);
});
test('no visible Luna lettering in lamp or scripts; the single brass tube itself has curved contours',()=>{
 assert.doesNotMatch(html,/<text\b[^>]*>/i);
 assert.doesNotMatch(js,/createElementNS\(ns,'text'\)/);
 assert.doesNotMatch(html,/>una</i);
 assert.match(pullSource,/This is ONE continuous brass arm, not text/);
 assert.match(html,/id="v41ArmHighlight"/);
 const closed=pull.armPath(0),open=pull.armPath(155);
 assert.match(closed,/^M43 78/);
 assert.match(open,/^M-/);
 assert.match(open,/C/);
 assert.equal((open.match(/M/g)||[]).length,1,'one unbroken path not text overlay');
 assert.ok(open.endsWith('H86'));
});
test('pebble-like wall mounting is fixed, golden and not a simple rectangular bracket',()=>{
 assert.match(html,/v41-pebble-mount/);
 assert.match(html,/M87 73 C93 70/);
 assert.match(css,/v41Brass/);
 assert.match(html,/v41-mount-jewel/);
});
test('light cone renders above open drawer without intercepting touch',()=>{
 assert.match(css,/body:has\(#quickOverlay:not\(\[hidden\]\)\) \.ambient-room-glow/);
 assert.match(css,/z-index:39605!important/);
 assert.match(css,/pointer-events:none!important/);
 assert.match(css,/\.ambient-beam-up/);
 assert.match(css,/data-ambient-state=off/);
 assert.match(css,/data-ambient-state=on/);
 assert.match(html,/src="ambient-lamp\.js/);
});
test('master brightness retained, individual panel removed',()=>{
 assert.match(js,/Gesamthelligkeit/);
 assert.match(js,/masterSlider\.addEventListener\('change'/);
 assert.match(js,/masterSlider\.addEventListener\('input'/);
 assert.doesNotMatch(js,/Einzelhelligkeit · optional/);
 assert.doesNotMatch(js,/v4IndividualRows/);
 assert.equal(app.fromPercent(1),1);
 assert.equal(app.fromPercent(100),254);
});
test('in-card individual dimming only for a lamp, not on group rows',()=>{
 assert.match(tree,/if\(entry\.kind==='lamp'\)\{/);
 assert.match(tree,/v41-dim-toggle/);
 assert.match(tree,/v41-dimmer/);
 assert.match(tree,/dimRange\.onchange=async/);
 assert.match(tree,/await this\.onBrightness\(lightId,percent\)/);
 assert.match(tree,/dimRange\.oninput=/);
 assert.match(html,/onBrightness:async\(lightId,percent\)/);
 assert.match(html,/const body=\{on:true,bri:Math\.max\(1,Math\.round\(percent\*2\.54\)\)\}/);
 assert.match(html,/request\('PUT','\/lights\/'\+encodeURIComponent\(lightId\)\+'\/state',body\)/);
 assert.match(css,/\.g-tree-lamp-node \.v41-dim-toggle/);
});
test('styles selectable, left-handed mode preserved',()=>{
 assert.deepEqual(Object.keys(app.shape),['vintage','modern','retro']);
 const prefs=app.load({getItem:()=>'{broken json'});
 assert.deepEqual(prefs,{design:'vintage',hand:'right'});
 const left=app.load({getItem:()=>JSON.stringify({design:'retro',hand:'left'})});
 assert.deepEqual(left,{design:'retro',hand:'left'});
 assert.match(js,/dataset\.v4Hand=prefs\.hand/);
 assert.match(pullSource,/const mirrored=\(\)=>doc\.documentElement/);
});
test('single-lamp slider is released once, not streaming a command per input frame',()=>{
 const changed=tree.indexOf('dimRange.onchange=async'),input=tree.indexOf('dimRange.oninput=');
 assert.ok(input>0&&changed>0);
 const inputBody=tree.slice(input,changed);
 assert.doesNotMatch(inputBody,/onBrightness\(/);
 assert.match(html,/stopAll\(\);\s+const body=\{on:true,bri:/);
 assert.match(js,/for\(let offset=0;offset<job\.batch\.length;offset\+=3\)/);
});
test('no production Hue files are shadow-written in preview',()=>{
 assert.doesNotMatch(js,/(?:delete|localStorage\.clear)\(/);
 assert.match(js,/luma_v41_lamp_prefs/);
 assert.match(js,/flow-v41/);
});
