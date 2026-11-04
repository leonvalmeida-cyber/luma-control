/* Luma V4.2 independent regression tests (no network or Hue hardware). */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html'),css=read('v42.css'),appJs=read('v42.js'),pullJs=read('quick-pull-v42.js');
const app=require('../v42.js'),pull=require('../quick-pull-v42.js');

test('standalone V4.2 remains separate from all stable app files',()=>{
 assert.match(html,/<base href="\.\.\/flow-live\/">/);
 assert.match(html,/src="\.\.\/flow-v42\/quick-pull-v42\.js/);
 assert.match(html,/src="\.\.\/flow-v42\/v42\.js/);
 assert.match(html,/href="\.\.\/flow-v42\/v42\.css/);
 assert.match(html,/src="\.\.\/flow-v41\/groups-v41-tree\.js/);
 assert.doesNotMatch(html,/src="\.\.\/flow-v41\/v41\.js/);
 assert.doesNotMatch(html,/src="quick-pull\.js/);
 assert.match(html,/id="quickLampGrip"/);
});

test('the actual brass arm visibly shapes Luma via SVG geometry, without any text',()=>{
 const closed=pull.armPath(0,73,'vintage'),open=pull.armPath(172,73,'vintage');
 assert.ok(closed.startsWith('M43 78'),closed);
 assert.ok(open.startsWith('M-'),open);
 assert.ok(open.endsWith('H86'),open);
 assert.equal((open.match(/M/g)||[]).length,1,'one physically continuous metal route');
 assert.ok((open.match(/\bC/g)||[]).length>=10,'u-m-a require real letter loops');
 assert.notEqual(open,closed);
 assert.doesNotMatch(html,/<text\b|<tspan\b|>una</i);
 assert.doesNotMatch(appJs,/createElementNS\([^)]*'text'/);
 assert.match(pullJs,/LUMA is ONE CONTINUOUS BENT-METAL CENTRELINE/);
});

test('each new design has a unique silhouette AND metal arm profile',()=>{
 const keys=Object.keys(app.shape);
 assert.deepEqual(keys,['vintage','deco','washi','halo']);
 assert.equal(new Set(keys.map(k=>app.shape[k].shade)).size,4);
 assert.equal(new Set(keys.map(k=>pull.armPath(170,73,k))).size,4);
 for(const style of ['deco','washi','halo']){
  assert.match(css,new RegExp('data-v42-design='+style));
 }
 assert.match(html,/v42-deco-details/);
 assert.match(html,/v42-washi-details/);
 assert.match(html,/v42-halo-details/);
 assert.match(html,/id="v42DecoGlass"/);
 assert.match(html,/id="v42WashiPaper"/);
 assert.match(html,/id="v42HaloFinish"/);
});

test('accepted linen fabric geometry and optional left-hand setting preserved',()=>{
 assert.match(app.shape.vintage.shade,/^M20 28 L43 28/);
 const defaultPref=app.load({getItem:()=>null});
 assert.deepEqual(defaultPref,{design:'vintage',hand:'right'});
 assert.deepEqual(app.load({getItem:()=>JSON.stringify({design:'washi',hand:'left'})}),
 {design:'washi',hand:'left'});
 assert.match(appJs,/dataset\.v4Hand=prefs\.hand/);
 assert.match(pullJs,/const mirrored=\(\)=>doc\.documentElement/);
});

test('downward light fans symmetrically outward from moving shade, no right vertical edge',()=>{
 const x=178,lip=219,geom=pull.beamGeometry(390,844,x,lip);
 assert.ok(geom.leftLip<x&&geom.rightLip>x);
 assert.ok(geom.edges[0][0]<geom.leftLip,'left side expands');
 assert.ok(geom.edges[1][0]>geom.rightLip,'right side expands');
 assert.ok(Math.abs((geom.edges[0][0]+geom.edges[1][0])/2-x)<.2);
 assert.equal(geom.bands.length,3);
 assert.equal(geom.origin[0],x);
 assert.equal(geom.origin[1],lip);
 assert.match(pullJs,/const farLeft=round\(x-spread\),farRight=round\(x\+spread\)/);
});

test('actual shade lip and top aperture determine each design beam origin',()=>{
 assert.match(pullJs,/const lipSvg=\(\{vintage:78,deco:61,washi:90,halo:87\}\)/);
 assert.match(pullJs,/const topOffset=\(\{vintage:37,deco:23,washi:53,halo:33\}\)/);
 assert.match(pullJs,/beamGeometry\(g\.width,g\.height,g\.headX,g\.rimY,g\.topOffset\)/);
 assert.match(pullJs,/arm\.setAttribute\('d',armPath\(g\.distance,g\.svgWidth,doc\.documentElement/);
});

test('scrolling open controls docks ENTIRE lamp and its light cone away from cards',()=>{
 assert.match(pullJs,/const panelBody=doc\.getElementById\?\.\('quickPanelBody'\)/);
 assert.match(pullJs,/listen\(overlay,'scroll',onScroll,true\)/);
 assert.match(pullJs,/const travel=\(panelBody\?\.scrollTop\|\|0\)\+\(tree\?\.scrollTop\|\|0\)/);
 assert.match(pullJs,/initialTop\+\(lipSvg\/124\*96\)-lift-dock/);
 assert.match(pullJs,/rootStyle\.setProperty\('--v42-dock-px'/);
 assert.match(pullJs,/session=null;dock=0;clearPreview\(\);paint\(0\)/);
 assert.match(css,/--v42-dock-px/);
 assert.match(css,/quick-lamp-grip/);
});

test('scene colours shine THROUGH the shade not merely around its outline',()=>{
 assert.match(html,/id="v42InnerGlow"/);
 assert.match(html,/class="v42-inner-radiance"/);
 assert.match(html,/class="v42-inner-edge"/);
 assert.match(css,/#v42InnerGlow \.v42-glow-center\{stop-color:rgb\(var\(--ambient-rgb\)\)\}/);
 assert.match(css,/fill:url\(#v42InnerGlow\)/);
 assert.match(css,/opacity:clamp\(0,calc\(var\(--ambient-power\) \* 1\.7\),\.96\)/);
 assert.match(css,/data-ambient-state=off/);
 assert.match(css,/z-index:39605!important/);
 assert.match(css,/pointer-events:none!important/);
 assert.match(html,/src="ambient-lamp\.js/);
});

test('single-lamp card dimmers and upper master brightness retained',()=>{
 assert.match(html,/src="\.\.\/flow-v41\/groups-v41-tree\.js/);
 assert.match(html,/onBrightness:async\(lightId,percent\)/);
 assert.match(html,/request\('PUT','\/lights\/'\+encodeURIComponent\(lightId\)\+'\/state',body\)/);
 assert.match(appJs,/☀ Gesamthelligkeit/);
 assert.match(appJs,/masterSlider\.addEventListener\('change'/);
 assert.equal(app.fromPercent(100),254);
 assert.equal(app.fromPercent(1),1);
 assert.doesNotMatch(appJs,/Einzelhelligkeit · optional/);
});

test('the app does not autonomously send light commands for lamp animations',()=>{
 assert.doesNotMatch(pullJs,/\bfetch\(/);
 assert.doesNotMatch(css,/pointer-events:auto!important/);
 assert.match(appJs,/pending=\{batch,target:el\('target'\)\?\.value,sequence:\+\+sequence\}/);
});
