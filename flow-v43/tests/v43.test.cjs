/* Luma Flow V4.3 isolated rail regressions. Run: node --test flow-v43/tests/v43.test.cjs
 * Pure offline tests: never connects to the Hue Bridge.
 */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'),css=read('v43.css');
const pullCode=read('quick-pull-v43.js'),appCode=read('v43.js');
const pull=require('../quick-pull-v43.js'),app=require('../v43.js');
const styles=['vintage','deco','washi','halo'];

test('V4.3 is a separate build without changing older pages',()=>{
 assert.match(html,/<base href="\.\.\/flow-live\/">/);
 assert.match(html,/flow-v43\/v43\.css/);
 assert.match(html,/flow-v43\/v43\.js/);
 assert.match(html,/flow-v43\/quick-pull-v43\.js/);
 assert.match(html,/flow-v41\/groups-v41-tree\.js/);
 assert.doesNotMatch(html,/src="\.\.\/flow-v42\/quick-pull-v42\.js/);
 assert.doesNotMatch(html,/src="\.\.\/flow-v42\/v42\.js/);
 assert.match(html,/id="quickOverlay"/);
});

test('every style has identical actual Luma arm geometry, not a different short connector',()=>{
 const paths=styles.map(style=>pull.armPath(170,73,style,false));
 assert.equal(new Set(paths).size,1);
 assert.ok(paths[0].startsWith('M-'));
 assert.ok(paths[0].endsWith('H86'));
 assert.ok((paths[0].match(/ C/g)||[]).length>=8);
 assert.equal((paths[0].match(/M/g)||[]).length,1);
 assert.doesNotMatch(html,/<text\b|<tspan\b|>una</i);
 assert.doesNotMatch(appCode,/createElementNS\([^)]*'text'/);
});

test('left-handed metal word uses actual reverse-order stroke and still connects head to carriage',()=>{
 const normal=pull.armPath(170,73,'washi',false);
 const mirrored=pull.armPath(170,73,'washi',true);
 assert.notEqual(normal,mirrored);
 assert.ok(mirrored.startsWith('M-'));
 assert.ok(mirrored.endsWith('H86'));
 assert.equal((mirrored.match(/M/g)||[]).length,1);
 assert.match(pullCode,/reverse-order/);
 assert.match(pullCode,/mirrored\(\)\)/);
});

test('fixed rail and wall are not translated; moving carriage carries entire lamp',()=>{
 const ixRail=html.indexOf('id="v43FixedRail"');
 const ixWall=html.indexOf('id="v43FixedWall"');
 const ixMoving=html.indexOf('id="v43MovingAssembly"');
 const ixArm=html.indexOf('id="ambientLampArm"');
 const ixCarriage=html.indexOf('id="v43SlidingCarriage"');
 const ixHead=html.indexOf('id="ambientMovingHead"');
 assert.ok(ixRail>0&&ixRail<ixWall&&ixWall<ixMoving);
 assert.ok(ixMoving<ixArm&&ixArm<ixCarriage&&ixCarriage<ixHead);
 assert.match(html,/v43-rail-channel/);
 assert.match(html,/v43-rail-top-cap/);
 assert.match(html,/v43-carriage-bolt/);
 assert.match(pullCode,/movingAssembly\.setAttribute\('transform','translate\(0 '\+\(-carriageY\)\+'\)'/);
 assert.match(css,/\.v43-fixed-wall,/);
 assert.match(css,/transform:none!important/);
});

test('vertical slide follows scroll and returns smoothly on closing',()=>{
 assert.match(pullCode,/listen\(overlay,'scroll',onScroll,true\)/);
 assert.match(pullCode,/const travel=\(panelBody\?\.scrollTop\|\|0\)\+\(tree\?\.scrollTop\|\|0\)/);
 assert.match(pullCode,/Math\.min\(90,maxDock\)/);
 assert.match(pullCode,/targetDock=next/);
 assert.match(pullCode,/dock\+\(reduced\?error:error\*\.35\)/);
 assert.match(pullCode,/dock=round\(initialDock\*\(1-ease\)\)/);
 assert.match(pullCode,/dock=0;targetDock=0/);
});

test('grip, lampshade and BOTH beams follow the same vertical displacement',()=>{
 assert.match(pullCode,/const rimY=initialTop\+\(lipSvg\/124\*96\)-lift-dock/);
 assert.match(pullCode,/const carriageY=round\(\(g\.lift\+dock\)\*100\/g\.svgWidth\)/);
 assert.match(pullCode,/rootStyle\.setProperty\('--v43-dock-px'/);
 assert.match(css,/--v43-dock-px/);
 assert.match(css,/\.quick-lamp-grip\{/);
 assert.match(pullCode,/beamCanvas\.setAttribute\('viewBox'/);
 assert.match(pullCode,/beamUp\.setAttribute\('d',glow\.up\)/);
});

test('no vertical right-hand edge in the symmetric lower light cone',()=>{
 const beam=pull.beamGeometry(390,844,166,213);
 assert.equal(beam.bands.length,3);
 assert.ok(beam.edges[0][0]<beam.leftLip);
 assert.ok(beam.edges[1][0]>beam.rightLip);
 assert.ok(Math.abs((beam.edges[0][0]+beam.edges[1][0])/2-166)<.2);
});

test('the four existing shades, ambient fabric glow and dimmers remain',()=>{
 assert.deepEqual(Object.keys(app.shape),styles);
 assert.equal(new Set(styles.map(x=>app.shape[x].shade)).size,4);
 assert.match(html,/v42-inner-radiance/);
 assert.match(html,/v41-pleat-shadows/);
 assert.match(html,/id="v42InnerGlow"/);
 assert.match(html,/onBrightness:async\(lightId,percent\)/);
 assert.match(appCode,/Gesamthelligkeit/);
 assert.match(appCode,/masterSlider\.addEventListener\('change'/);
 assert.equal(app.fromPercent(100),254);
 assert.deepEqual(app.load({getItem:()=>null}),{design:'vintage',hand:'right'});
 assert.deepEqual(app.load({getItem:()=>JSON.stringify({design:'washi',hand:'left'})}),{design:'washi',hand:'left'});
});

test('no new Hue, microphone or network requests in the mechanical controller',()=>{
 assert.doesNotMatch(pullCode,/\bfetch\(/);
 assert.doesNotMatch(pullCode,/\bWebSocket\b|\bnavigator\.mediaDevices/);
 assert.match(css,/pointer-events:none/);
 assert.match(css,/data-v42-design=deco/);
 assert.match(css,/data-v42-design=halo/);
});

test('the fixed rail and carriage are actually distinct SVG groups',()=>{
 const begin=html.indexOf('<svg class="ambient-lamp-art"');
 const svg=html.slice(begin,html.indexOf('</svg>',begin)+6);
 assert.equal((svg.match(/<g\b/g)||[]).length,(svg.match(/<\/g>/g)||[]).length);
 assert.match(svg,/<g id="v43FixedWall"/);
 assert.match(svg,/<g id="v43MovingAssembly"/);
 assert.match(svg,/<g id="v43SlidingCarriage"/);
 assert.match(svg,/<g id="v43FixedRail"/);
});
