/* Isolated Luma Flow V4.5 checks — no Bridge requests or network access. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),base=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(base,file),'utf8');
const html=read('index.html'),css=read('v45.css'),source=read('v45.js');
const tree=read('groups-v45-tree.js'),pull=read('quick-pull-v45.js');
const app=require('../v45.js'),gesture=require('../quick-pull-v45.js');

test('isolated app uses V4.5 scripts; stable/LIVE/V4.4 are only read as inherited assets',()=>{
 assert.match(html,/<base href="\.\.\/flow-live\/">/);
 assert.match(html,/src="\.\.\/flow-v45\/groups-v45-tree\.js/);
 assert.match(html,/src="\.\.\/flow-v45\/quick-pull-v45\.js/);
 assert.match(html,/src="\.\.\/flow-v45\/v45\.js/);
 assert.match(html,/href="\.\.\/flow-v45\/v45\.css/);
 assert.doesNotMatch(html,/src="\.\.\/flow-v44\/v44\.js/);
 assert.doesNotMatch(html,/src="\.\.\/flow-v44\/quick-pull-v44\.js/);
 assert.doesNotMatch(html,/src="\.\.\/flow-v41\/groups-v41-tree\.js/);
 assert.match(html,/LUMA FLOW · V4\.5 LICHTRAUM/);
});
test('top is a visual living-room vignette, not the old top brightness slider',()=>{
 assert.match(source,/home\.id='v45LampHome'/);
 assert.match(source,/v45-room-illustration/);
 assert.match(source,/v45-sofa-back/);
 assert.match(source,/v45-window/);
 assert.match(source,/v45-plant/);
 assert.match(source,/first\.prepend\(home\)/);
 assert.doesNotMatch(source,/first\.prepend\(master\)|id="v41Master"/);
 assert.doesNotMatch(source,/v44DockSocket/);
 assert.match(css,/#v45LampHome/);
});
test('selected All or room row is a purple horizontal percentage slider',()=>{
 assert.match(tree,/this\.groupDimmers=\[\]/);
 assert.match(tree,/v45-group-shell/);
 assert.match(tree,/v45-group-range/);
 assert.match(tree,/v45-group-value/);
 assert.match(tree,/slider\.type='range'/);
 assert.match(tree,/slider\.min='1';slider\.max='100'/);
 assert.match(tree,/dim\.hidden=!active/);
 assert.match(tree,/shell\.classList\.toggle\('v45-selected',active\)/);
 assert.match(css,/#targetFastTree \.v45-group-shell\.v45-selected/);
 assert.match(css,/var\(--v45-level,65%\)/);
 assert.match(css,/::-webkit-slider-thumb/);
 assert.match(tree,/onSelect\(entry\.id\);this\.updateSelection\(\)/);
});
test('group range is NOT nested in a select button: native iOS drag stays reliable',()=>{
 assert.match(tree,/const shell=make\('div','v45-group-shell'\)/);
 assert.match(tree,/shell\.append\(pick\)/);
 assert.match(tree,/dim\.append\(slider,output,metaHelp\);shell\.append\(dim\)/);
 assert.match(tree,/line\.append\(toggle,shell\)/);
 assert.doesNotMatch(tree,/pick\.append\(slider/);
 assert.match(css,/touch-action:pan-x/);
});
test('Hue group brightness is committed on change only, not streamed per pointer frame',()=>{
 assert.match(tree,/slider\.addEventListener\('input',/);
 assert.match(tree,/slider\.addEventListener\('change',async/);
 assert.match(tree,/await this\.onGroupBrightness\(entry\.id,percent\)/);
 const first=tree.indexOf("slider.addEventListener('input'");
 const next=tree.indexOf("slider.addEventListener('change'",first);
 assert.ok(first>0&&next>first);
 assert.doesNotMatch(tree.slice(first,next),/onGroupBrightness\(/);
 assert.match(html,/onGroupBrightness:async\(groupId,percent\)/);
 assert.match(html,/group\.resolve\(groupId,\{reachableOnly:false\}\)/);
 assert.match(html,/ids\.slice\(start,start\+3\)/);
 assert.match(html,/request\('PUT','\/lights\/'\+encodeURIComponent\(lightId\)\+'\/state',body\)/);
 assert.match(html,/reflectLightState\(lightId,body,reply\)/);
 assert.match(html,/if\(failed\)throw Error/);
});
test('tap-to-open no longer depends on unreliable synthesized Safari click',()=>{
 assert.match(pull,/Math\.hypot\(x-item\.x,y-item\.y\)<14/);
 assert.match(pull,/win\.lumaQuickControl\?\.open\?\.\(\)/);
 assert.match(pull,/if\(event\?\.cancelable\)event\.preventDefault\(\)/);
 assert.match(pull,/event\.detail!==0&&Date\.now\(\)<ignoreClickUntil/);
 assert.match(pull,/bind\(launcher,'open'\)/);
 assert.match(pull,/bind\(grip,'close'\)/);
 assert.match(css,/width:83px!important/);
 assert.doesNotMatch(css,/scale\(\.73\)/);
});
test('invisible close grip tracks actual lampshade geometry and avoids the other buttons',()=>{
 assert.match(pull,/const art=launcher\.querySelector\?\.\('\.ambient-lamp-art'\)/);
 assert.match(pull,/setProperty\('--v45-grip-left',round\(g\.headX-38\)\+'px'\)/);
 assert.match(pull,/setProperty\('--v45-grip-top',round\(g\.rimY-58\)\+'px'\)/);
 assert.match(css,/left:var\(--v45-grip-left,auto\)!important/);
 assert.match(css,/top:var\(--v45-grip-top/);
 assert.match(pull,/setAttribute\('transform','translate\(0 '\+\(-carriageY\)\+'\)'/);
});
test('beam originates at real fabric rim, both edges flare out and is more gently diffused',()=>{
 const b=gesture.beamGeometry(390,844,174,178,34);
 assert.equal(b.bands.length,3);
 assert.equal(b.origin[0],174);
 assert.equal(b.origin[1],178);
 assert.ok(b.edges[0][0]<b.leftLip&&b.edges[1][0]>b.rightLip);
 assert.ok(Math.abs((b.edges[0][0]+b.edges[1][0])/2-174)<.25);
 assert.match(pull,/const halfLip=clamp\(lipHalf,10,24\),spread=/);
 assert.match(pull,/\(\{vintage:20,deco:22,washi:13,halo:18\}\)/);
 assert.match(css,/filter:blur\(19px\)!important;opacity:\.26!important/);
 assert.match(css,/#ambientBeamGradient1 stop:first-child/);
 assert.match(pull,/beamUp\.setAttribute\('d',glow\.up\)/);
});
test('scene-through-shade glow, four styles, left hand and per-lamp dimming survive',()=>{
 assert.match(html,/id="v42InnerGlow"/);
 assert.match(html,/v42-inner-radiance/);
 assert.match(html,/id="v43FixedRail"/);
 assert.match(html,/onBrightness:async\(lightId,percent\)/);
 assert.match(tree,/v41-dim-toggle/);
 assert.match(tree,/await this\.onBrightness\(lightId,percent\)/);
 assert.deepEqual(Object.keys(app.shape),['vintage','deco','washi','halo']);
 assert.equal(new Set(['vintage','deco','washi','halo'].map(n=>gesture.armPath(165,73,n))).size,1);
 assert.match(css,/data-v4-hand=left/);
 assert.deepEqual(app.load({getItem:key=>key==='luma_v44_lamp_prefs'?JSON.stringify({design:'washi',hand:'left'}):null}),{design:'washi',hand:'left'});
});
test('no automatic Hue commands from movement and app never resets a live slider mid-drag',()=>{
 assert.doesNotMatch(pull,/\bfetch\(|\bWebSocket\b/);
 assert.match(source,/lumaGroupsTreeInstance\?\.updateGroupBrightness\?\.\(\)/);
 assert.match(tree,/slider!==document\.activeElement/);
 assert.match(tree,/!this\.groupPending\.has\(id\)/);
 assert.match(tree,/this\.groupPending\.add\(entry\.id\)/);
 assert.match(source,/win\.lumaV45ActivateGroup=activateGroup/);
 assert.match(source,/slider\.focus\(\{preventScroll:true\}\)/);
});
