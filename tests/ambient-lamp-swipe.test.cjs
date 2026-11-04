'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {calculate,visuals,deviceRGB,hueRGB,xyRGB,kelvinRGB,attach}=require('../ambient-lamp.js');
const {gesture,THRESHOLD_OPEN,THRESHOLD_CLOSE,attach:attachSwipe}=require('../quick-swipe.js');
const home=path.join(__dirname,'..'),html=fs.readFileSync(path.join(home,'index.html'),'utf8');
const css=fs.readFileSync(path.join(home,'quick-overlay.css'),'utf8');
const cardCSS=fs.readFileSync(path.join(home,'music-immersive-v1.css'),'utf8');
const music={palette:'neon',active:false,contextState:'closed',frameAgeMs:null,frames:[]};
test('Lamp sources choose real selected device color and real brightness before idle music palette',()=>{
 const data={connected:true,devices:[{state:{on:true,reachable:true,hue:0,sat:254,bri:254}}]};
 const high=calculate({music,hue:data});
 assert.equal(high.source,'hue');
 assert.deepEqual(high.rgb,[255,0,0]);
 assert.ok(high.level>.98);
 const low=calculate({music,hue:{connected:true,devices:[{state:{on:true,reachable:true,hue:0,sat:254,bri:50}}]}});
 assert.ok(low.level<high.level);
 assert.ok(visuals(low).power<visuals(high).power,'light must dim in the entire surrounding UI');
 const blue=calculate({music,hue:{connected:true,devices:[{state:{on:true,reachable:true,hue:43690,sat:254,bri:254}}]}});
 assert.ok(blue.rgb[2]>blue.rgb[0]&&blue.rgb[2]>blue.rgb[1]);
});
test('Off or unreachable lamp emits zero page-wide wash even when a vivid palette is selected',()=>{
 for(const state of [{on:false,bri:254,hue:0,sat:254},{on:true,reachable:false,bri:254,hue:0,sat:254}]){
  const x=calculate({music,hue:{connected:true,devices:[{state}]}});
  assert.equal(x.on,false);
  assert.equal(visuals(x).power,0);
 }
});
test('Only the selected target contributes to brightness, so one on and one off is dimmer',()=>{
 const bright={state:{on:true,bri:254,hue:0,sat:254}};
 const off={state:{on:false,bri:254,hue:0,sat:254}};
 const selected=calculate({music,hue:{connected:true,devices:[bright]}});
 const all=calculate({music,hue:{connected:true,devices:[bright,off]}});
 assert.ok(selected.level>all.level);
 assert.equal(all.on,true);
});
test('Live music frames take precedence; paused microphone falls back to actual Hue states',()=>{
 const hue={connected:true,devices:[{state:{on:true,bri:254,hue:0,sat:254}}]};
 const frames=[{rgb:[20,145,240],brightness:.7},{rgb:[70,210,220],brightness:.4}];
 const active=calculate({music:{palette:'ocean',active:true,contextState:'running',frameAgeMs:80,frames},hue});
 assert.equal(active.source,'music');
 assert.ok(active.rgb[2]>active.rgb[0]&&active.level>.5);
 const paused=calculate({music:{palette:'ocean',active:true,contextState:'suspended',frameAgeMs:2400,frames},hue});
 assert.equal(paused.source,'hue');
 assert.deepEqual(paused.rgb,[255,0,0]);
});
test('Color conversion handles Hue v1 hue/saturation, color temperature and xy safely',()=>{
 assert.deepEqual(hueRGB(0,1),[255,0,0]);
 assert.ok(xyRGB(.17,.75)[1]>xyRGB(.17,.75)[0]);
 assert.ok(kelvinRGB(2200)[0]>kelvinRGB(2200)[2]);
 assert.ok(deviceRGB({ct:370})[0]>deviceRGB({ct:370})[2]);
 assert.equal(xyRGB(0,0),null);
});
test('Generated CSS variables are safe numeric RGB and optical intensity bounds',()=>{
 const x=visuals({rgb:[255,190,80],level:.67,on:true,source:'hue'});
 assert.match(x.rgb,/^\d{1,3} \d{1,3} \d{1,3}$/);
 assert.ok(x.power>.2&&x.power<1);
 assert.equal(visuals({...x,level:0,on:false}).power,0);
});
test('Ambient DOM updater changes CSS variables but does not send Hue commands or store audio',()=>{
 const stylesheet={props:{},setProperty(k,v){this.props[k]=v}};
 const nodes={
  quickLauncher:{dataset:{}},
  ambientRoomGlow:{dataset:{}}
 };
 const listeners={};let interval;
 const fakeDoc={
  hidden:false,documentElement:{style:stylesheet},
  getElementById:id=>nodes[id],
  addEventListener:(k,fn)=>{listeners[k]=fn},
  removeEventListener:k=>{delete listeners[k]}
 };
 const fakeWin={
  lumaAmbientLightState:()=>({connected:true,devices:[{state:{on:true,bri:200,hue:0,sat:254}}]}),
  lumaMusicState:()=>music,
  setInterval:fn=>{interval=fn;return 17},
  clearInterval:()=>{},
  addEventListener:()=>{}
 };
 const instance=attach({doc:fakeDoc,win:fakeWin});
 assert.ok(instance);
 assert.equal(stylesheet.props['--ambient-rgb'],'255 0 0');
 assert.ok(+stylesheet.props['--ambient-power']>.3);
 assert.equal(nodes.quickLauncher.dataset.ambientState,'on');
 fakeWin.lumaAmbientLightState=()=>({connected:true,devices:[{state:{on:false,bri:200,hue:0,sat:254}}]});
 interval();
 assert.equal(stylesheet.props['--ambient-power'],'0');
 instance.stop();
});
test('Right/up swipe opens from lamp; right/down swipe closes from drawer header',()=>{
 assert.equal(gesture(-THRESHOLD_OPEN-12,1,'open'),true);
 assert.equal(gesture(0,-THRESHOLD_OPEN-21,'open'),true);
 assert.equal(gesture(THRESHOLD_CLOSE+20,3,'close'),true);
 assert.equal(gesture(0,THRESHOLD_CLOSE+24,'close'),true);
 for(const delta of [[2,63],[5,-60],[-21,30]])assert.equal(gesture(delta[0],delta[1],'close'),false);
 assert.equal(gesture(20,6,'open'),false);
 assert.equal(gesture(0,21,'open'),false);
});
test('Native pointer handler binds ONLY to launcher and drawer header, not to lamp grid or vertical scroller',()=>{
 const make=()=>{
  const node={style:{},handlers:{},listeners:new Map(),
   addEventListener(type,fn){this.listeners.set(type,fn)},
   removeEventListener(type){this.listeners.delete(type)},
   setPointerCapture(){},
   emit(type,x,y){const fn=this.listeners.get(type);fn?.({pointerType:'touch',pointerId:3,clientX:x,clientY:y,
    preventDefault(){},target:{closest:()=>null}})}
  };
  return node
 };
 const launcher=make(),title=make(),sheet=make(),backdrop=make();let opens=0,closes=0,opened=false;
 const win={lumaQuickControl:{open(){opens++;opened=true},close(){closes++;opened=false},isOpen(){return opened}}};
 const doc={getElementById:id=>id==='quickLauncher'?launcher:id==='quickBackdrop'?backdrop:null,
  querySelector:id=>id==='.quick-titlebar'?title:id==='.quick-sheet'?sheet:null};
 const app=attachSwipe({doc,win});assert.ok(app);
 launcher.emit('pointerdown',100,100);launcher.emit('pointerup',30,100);
 assert.equal(opens,1);
 title.emit('pointerdown',20,30);title.emit('pointermove',132,34);title.emit('pointerup',132,34);
 assert.equal(closes,1);
 assert.equal(opens,1);
 assert.equal(title.listeners.has('pointermove'),true);
 app.destroy();
 assert.equal(title.listeners.has('pointermove'),false);
});
test('Ambient lamp uses a directed page-wide wash, never blocks clicks, and has a custom shade illustration',()=>{
 assert.ok(html.includes('id="ambientRoomGlow"'));
 assert.ok(html.includes('class="ambient-lamp-art"'));
 assert.ok(html.includes('class="ambient-lamp-diffuser"'));
 assert.ok(html.includes('window.lumaAmbientLightState=()=>'));
 assert.ok(css.includes('.ambient-room-glow{position:fixed;inset:0;'));
 assert.ok(css.includes('pointer-events:none'));
 assert.ok(css.includes('radial-gradient(ellipse 85vw 41vh at calc(100% - 26px)'));
 assert.ok(css.includes('clip-path:polygon(100% 0,100% 36%,0 100%,0 78%)'));
 assert.ok(css.includes('opacity:var(--ambient-power)'));
 assert.ok(css.includes('touch-action:none'));
});
test('All four mood scene assets are the primary local image AND a CSS fallback',()=>{
 for(const key of ['neon','sunset','ocean','warm']){
  assert.ok(cardCSS.includes("background-image:url('media/"+key+".svg?v=7')"));
  const svg=fs.readFileSync(path.join(home,'media',key+'.svg'),'utf8');
  assert.match(svg,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.ok(svg.length>1000,'illustration has useful complexity');
 }
 assert.ok(html.includes("sceneImage.src='media/'+id+'.svg?v=7'"));
 assert.ok(html.includes("artTag.className='mi-mood-art-tag'"));
 assert.ok(html.includes("sceneImage.onerror=()=>{artwork.dataset.imageFailed='true'}"));
 assert.ok(cardCSS.includes('.mi-mood-art[data-image-failed=true]'));
});
test('Gesture and ambient modules have zero network requests and do not mutate Bridge or persisted keys',()=>{
 for(const name of ['ambient-lamp.js','quick-swipe.js']){
  const js=fs.readFileSync(path.join(home,name),'utf8');
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage\.|\/lights\//);
 }
});
