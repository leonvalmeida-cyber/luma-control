'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const pull=require('../quick-pull.js');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../quick-overlay.css'),'utf8');

test('Wall fixture stays still: moving shade is independent of the fixed mount',()=>{
 assert.ok(html.includes('id="ambientMovingHead"'));
 assert.ok(html.includes('id="ambientLampArm"'));
 assert.ok(html.includes('ambient-lamp-mount-line'));
 assert.ok(html.includes('class="ambient-lamp-base"'));
 assert.ok(!html.includes('<small>Licht</small>'));
 assert.ok(css.includes('var(--luma-head-svg-px)'),'WebKit renders SVG group transforms in viewBox units');
 assert.ok(css.includes('.ambient-moving-head'));
 assert.ok(css.includes('quick-pulling'));
 assert.ok(pull.armPath(160).includes('78 V100 Q'),'L downstroke preserved');
 assert.ok(pull.armPath(160).endsWith('106 H86'),'L foot connects to right wall');
 assert.notEqual(pull.armPath(0),pull.armPath(160));
});
test('Progress maps thumb distance to continuous physical extension',()=>{
 const l=pull.limits(390);
 assert.ok(l.drag>=170&&l.drag<=230);
 assert.ok(l.pull>=132&&l.pull<=172);
 for(const p of [.25,.5,.75,1])assert.ok(Math.abs(pull.progressFromDistance(l.drag*p,l.drag)-p)<.0001);
 assert.equal(pull.progressFromDistance(-22,l.drag),0);
 assert.equal(pull.progressFromDistance(l.drag*3,l.drag),1);
 assert.equal(pull.snap(.2,42,360),false);
 assert.equal(pull.snap(.5,115,400),true);
 assert.equal(pull.snap(.27,78,135),true);
});
test('All beams originate at moving lower rim and diverge downward; weak secondary spill above',()=>{
 const a=pull.beamGeometry(390,844,335,245),b=pull.beamGeometry(390,844,205,245);
 assert.equal(a.bands.length,3);
 assert.equal(b.bands.length,3);
 assert.deepEqual(a.origin,[335,245]);assert.deepEqual(b.origin,[205,245]);
 assert.ok(a.bands[0].startsWith('M320 245'));
 assert.ok(b.bands[0].startsWith('M190 245'));
 assert.equal(a.wallEdgeX,350,'rightmost cone edge is vertical below shade rim');
 assert.ok(a.edges.every(edge=>edge[1]>844),'all ray segments finish below viewport');
 assert.equal(a.topEndpoints[0]+a.topEndpoints[1],670,'top spill perfectly symmetrical');
 assert.ok(css.includes('.ambient-beam-up'));
 assert.ok(css.includes('url(#ambientBeamGradientUp)'));
});
function fixture(){
 let clock=0,id=0,raf=new Map(),openCount=0;
 const elements=new Map(),styles=new Map();
 function make(name){
  const events=new Map(),classes=new Set(),attrs={},cssVars={};
  const el={name,dataset:{},style:{setProperty(k,v){cssVars[k]=v},getPropertyValue:k=>cssVars[k]},attrs,hidden:name==='quickOverlay',inert:false,
    events,classes,cssVars,classList:{add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),contains:x=>classes.has(x)},
    addEventListener:(name,cb)=>events.set(name,cb),removeEventListener:name=>events.delete(name),
    setAttribute:(k,v)=>attrs[k]=String(v),getBoundingClientRect:()=>({left:310,top:186,width:73,height:99}),
    fire(type,x,y,touchId=11){
     const finger={identifier:touchId,clientX:x,clientY:y};
     let prevented=false;
     const e={touches:type==='touchend'?[]:[finger],changedTouches:[finger],
       pointerId:touchId,clientX:x,clientY:y,pointerType:'touch',cancelable:true,
       preventDefault(){prevented=true},stopPropagation(){},stopImmediatePropagation(){}};
     events.get(type)?.(e);return {prevented}
    }
  };
  elements.set(name,el);return el;
 }
 const launcher=make('quickLauncher'),grip=make('quickLampGrip'),overlay=make('quickOverlay'),sheet=make('quickSheet'),backdrop=make('quickBackdrop'),arm=make('ambientLampArm'),canvas=make('ambientBeamCanvas'),up=make('ambientBeamUp');
 for(let i=1;i<=3;i++)make('ambientBeam'+i);
 const rootStyle={setProperty(k,v){styles.set(k,v)},getPropertyValue:k=>styles.get(k)};
 const win={innerWidth:390,innerHeight:844,TouchEvent:function TouchEvent(){},
  performance:{now:()=>clock},matchMedia:()=>({matches:false}),
  requestAnimationFrame(fn){const newId=++id;raf.set(newId,fn);return newId},
  cancelAnimationFrame(id){raf.delete(id)},
  addEventListener(){},removeEventListener(){},
  lumaQuickControl:{isOpen(){return false},open(){openCount++},close(){}}
 };
 const doc={documentElement:{style:rootStyle},getElementById:n=>elements.get(n),querySelector:n=>n==='.quick-sheet'?sheet:null};
 const controller=pull.attach({doc,win});
 function step(dt=16){
  clock+=dt;
  const entries=[...raf.entries()];raf.clear();
  for(const [,fn]of entries)fn(clock);
 }
 return {controller,launcher,grip,overlay,sheet,backdrop,arm,canvas,up,elements,styles,win,step,get opened(){return openCount}};
}
test('Real finger movement at 25%, 50%, 75% moves arm, lamp, cone and drawer together before release',()=>{
 const t=fixture(),drag=pull.limits(390).drag;
 t.launcher.fire('touchstart',330,245);
 const positions=[];
 for(const p of [.25,.5,.75]){
  t.launcher.fire('touchmove',330-drag*p,245);
  t.step();
  const rootPull=parseFloat(t.styles.get('--luma-pull-px'));
  const panel=t.sheet.style.transform;
  const arm=t.arm.attrs.d;
  const beam=t.elements.get('ambientBeam1').attrs.d;
  positions.push({p,rootPull,panel,arm,beam,shown:!t.overlay.hidden});
  assert.equal(t.overlay.hidden,false,'panel must already be visible during partial drag');
  assert.equal(t.sheet.inert,true,'partial drawer must not be interactive');
  assert.ok(Math.abs(rootPull-p*pull.limits(390).pull)<2,'arm movement must match finger position');
  assert.ok(panel.startsWith('translate3d('+Math.round((1-p)*100)),'panel tracks exact progress');
  assert.ok(beam.startsWith('M')&&beam.includes('L'),'beam must be recomputed per frame');
 }
 assert.notEqual(positions[0].arm,positions[1].arm);
 assert.notEqual(positions[1].beam,positions[2].beam);
 assert.ok(parseFloat(t.overlay.dataset.pullProgress)>.74);
 t.launcher.fire('touchend',330-drag*.75,245);
 for(let i=0;i<18;i++)t.step();
 assert.equal(t.opened,1,'past threshold should snap to open');
 assert.ok(t.controller.progress>.99);
 t.controller.destroy();
});
test('Reversing thumb position while still touching reverses the panel and mechanical extension',()=>{
 const t=fixture(),drag=pull.limits(390).drag;
 t.launcher.fire('touchstart',330,245);
 t.launcher.fire('touchmove',330-drag*.68,245);t.step();
 const before=parseFloat(t.styles.get('--luma-pull-px')),panelBefore=t.sheet.style.transform;
 t.launcher.fire('touchmove',330-drag*.18,245);t.step();
 const after=parseFloat(t.styles.get('--luma-pull-px')),panelAfter=t.sheet.style.transform;
 assert.ok(before>after);
 assert.notEqual(panelBefore,panelAfter);
 t.launcher.fire('touchend',330-drag*.18,245);
 for(let i=0;i<18;i++)t.step();
 assert.equal(t.opened,0,'early release must retract instead of opening');
 assert.equal(t.overlay.hidden,true);
 assert.equal(t.styles.get('--luma-pull-px'),'0px');
 assert.equal(t.controller.progress,0);
 t.controller.destroy();
});
test('A simple tap remains a tap and never starts a preview or seizes focus',()=>{
 const t=fixture();
 t.launcher.fire('touchstart',330,245);
 t.launcher.fire('touchend',330,245);
 t.step();
 assert.equal(t.overlay.hidden,true);
 assert.equal(t.opened,0);
 assert.equal(t.controller.progress,0);
 t.controller.destroy();
});
test('The old one-shot quick-swipe script is not active in the live page',()=>{
 assert.ok(html.includes('quick-pull.js?v=11'));
 assert.ok(!html.includes('src="quick-swipe.js?v=9"'));
 assert.ok(html.includes("quickOverlay.dataset.pulledOpen==='true'"));
 assert.ok(html.includes('window.lumaQuickPull?.reset?.()'));
 assert.ok(html.includes("const quickOpen=()=>"));
 assert.ok(html.includes("quickLauncher.onclick=quickOpen"));
});
