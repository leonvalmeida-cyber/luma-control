'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ambient=require('../ambient-lamp.js'),swipe=require('../quick-swipe.js');
const base=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8'),css=fs.readFileSync(path.join(base,'quick-overlay.css'),'utf8'),moodCSS=fs.readFileSync(path.join(base,'music-immersive-v1.css'),'utf8');
test('Custom lamp has a local SVG design and an independent whole-app light cone',()=>{
 for(const marker of ['class="ambient-lamp-art"','class="ambient-lamp-silhouette"','class="ambient-lamp-diffuser"','id="ambientRoomGlow"'])assert.ok(html.includes(marker),marker);
 for(const marker of ['background:transparent!important','border:0!important','.ambient-room-glow{position:fixed','clip-path:polygon(100% 0','opacity:var(--ambient-power)','pointer-events:none','mix-blend-mode:screen'])assert.ok(css.includes(marker),marker);
});
test('Hue room changes tint and brightness, including lamp off',()=>{
 const hue=(bri,hue,on=true)=>ambient.calculate({hue:{connected:true,devices:[{state:{on,reachable:true,bri,hue,sat:254}}]}});
 const red=hue(254,0),blue=hue(25,45000),off=hue(254,0,false);
 assert.equal(red.on,true);assert.equal(red.level,1);
 assert.ok(red.rgb[0]>red.rgb[2]);
 assert.ok(blue.rgb[2]>blue.rgb[0]);
 assert.ok(blue.level<red.level);
 assert.equal(off.level,0);assert.equal(ambient.visuals(off).power,0);
 assert.ok(ambient.visuals(red).power>ambient.visuals(blue).power);
});
test('Fresh music signal takes precedence over saved Hue colors',()=>{
 const hue={connected:true,devices:[{state:{on:true,reachable:true,bri:254,hue:0,sat:254}}]};
 const music={palette:'ocean',active:true,contextState:'running',frameAgeMs:60,frames:[{rgb:[30,140,247],brightness:.88}]};
 assert.equal(ambient.calculate({hue,music}).source,'music');
 assert.equal(ambient.calculate({hue,music:{...music,frameAgeMs:2500}}).source,'hue');
 assert.equal(ambient.calculate({music:{palette:'neon'}}).connected,false);
});
test('Swipe opens by moving left or up, closes by moving right or down',()=>{
 assert.equal(swipe.gesture(-65,2,'open'),true);
 assert.equal(swipe.gesture(2,-78,'open'),true);
 assert.equal(swipe.gesture(135,3,'close'),true);
 assert.equal(swipe.gesture(0,130,'close'),true);
 assert.equal(swipe.gesture(-135,2,'close'),false);
 assert.equal(swipe.gesture(2,25,'close'),false);
 assert.equal(swipe.gesture(8,140,'open'),false);
});
test('Swipe binds launcher and titlebar only, never scrollable tree',()=>{
 const js=fs.readFileSync(path.join(base,'quick-swipe.js'),'utf8');
 assert.ok(js.includes("const a=bind(launcher,'open'),b=bind(panel,'close')"));
 assert.ok(js.includes("if(kind==='close'&&e.target?.closest?.('button'))return"));
 assert.ok(css.includes('.quick-titlebar{position:relative;touch-action:none'));
});
test('Four illustrated scenes load through both local img and CSS background',()=>{
 for(const name of ['neon','sunset','ocean','warm']){
  const svg=fs.readFileSync(path.join(base,'media',name+'.svg'),'utf8');
  assert.ok(svg.startsWith('<svg'),name);assert.ok(svg.includes('</svg>'));
  assert.ok(moodCSS.includes("data-mood-art="+name+"] .mi-mood-art{background-image:url('media/"+name+".svg?v=7')"),name);
 }
 assert.ok(html.includes("sceneImage.onerror=()=>{artwork.dataset.imageFailed='true'}"));
 assert.ok(moodCSS.includes('img.mi-mood-picture{position:absolute!important'));
 assert.ok(html.includes('mi-mood-art-tag'));
});
test('New UI modules have no Hue or microphone side effects',()=>{
 for(const file of ['ambient-lamp.js','quick-swipe.js']){
  const src=fs.readFileSync(path.join(base,file),'utf8');
  for(const forbidden of ['getUserMedia','XMLHttpRequest','/lights/','hue-application-key','fetch('])assert.ok(!src.includes(forbidden),file+' includes '+forbidden);
 }
 assert.ok(html.includes('frame=musicFrames[i%musicFrames.length]'));
});

test('Even if iPhone fails to load an SVG image request, the four illustrations remain inline',()=>{
 assert.ok(html.includes('const lumaMoodArtwork='));
 assert.ok(html.includes("artFallback.className='mi-mood-fallback'"));
 assert.ok(html.includes('artFallback.innerHTML=lumaMoodArtwork[id]'));
 assert.ok(moodCSS.includes('.mi-mood-fallback>svg{display:block'));
 for(const name of ['neon','sunset','ocean','warm'])assert.ok(html.includes('"'+name+'":"<svg'),name+' fallback missing');
});
