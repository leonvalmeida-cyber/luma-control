'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const pull=require('../quick-pull.js');
const dir=path.join(__dirname,'..'),html=fs.readFileSync(path.join(dir,'index.html'),'utf8'),css=fs.readFileSync(path.join(dir,'quick-overlay.css'),'utf8');

test('L-shaped arm agrees with user screenshot: vertical under shade then horizontal foot to right wall',()=>{
 const a=pull.armPath(0),b=pull.armPath(168);
 assert.ok(/^M43 78 V100 Q43 106 50 106 H86$/.test(a),a);
 assert.ok(b.endsWith('106 H86'),b);
 assert.ok(b.includes(' 78 V100 Q'),'vertical is kept during telescoping');
 assert.ok(html.includes('class="ambient-lamp-base" d="M85 72'));
 assert.ok(html.includes('id="quickLampGrip"'));
 assert.ok(!html.includes('<small>Licht</small>'));
});
test('Main light cone starts exactly at lower lip, with vertical right boundary',()=>{
 for(const x of [335,170,70]){
  const g=pull.beamGeometry(390,844,x,210);
  assert.deepEqual(g.origin,[x,210]);
  assert.equal(g.rightLip,x+15);
  assert.equal(g.wallEdgeX,x+15);
  assert.ok(g.bands.every(b=>b.startsWith('M')&&b.endsWith('210 Z')));
  assert.ok(g.edges.every(e=>e[1]>844));
  assert.equal(g.edges[1][0],x+15,'rightmost cone boundary must stay vertical');
  assert.equal(g.topEndpoints[0]+g.topEndpoints[1],2*x,'upward opening must be mathematically symmetrical');
  assert.equal(g.topOrigin[0],x);
  assert.ok(g.up.includes('Q'+x+' '));
 }
 assert.ok(html.includes('x1="50%" y1="100%" x2="50%" y2="0%"'),'upper glow fade must be vertical and symmetric');
});
test('Lamp moves higher when open and a separate transparent thumb target follows the shade',()=>{
 assert.ok(css.includes('--luma-open-lift-px'));
 assert.ok(css.includes('top:calc(clamp(135px,22dvh,238px) - var(--luma-open-lift-px) + 3px)'));
 assert.ok(css.includes('right:calc(max(6px,env(safe-area-inset-right)) + 21px + var(--luma-pull-px))'));
 assert.ok(css.includes('.quick-launcher[aria-expanded=true]'));
 assert.ok(css.includes('.quick-lamp-grip[hidden]{display:none!important}'));
 assert.ok(css.includes('.quick-swipe-close{display:none!important}'));
 assert.ok(html.includes("window.lumaQuickPull?.showOpened?.()"));
 assert.ok(html.includes("if(options?.immediate===true){finish();return}"));
});
function fixture(){
 let clock=0,tick=0,openCalls=0,closeCalls=0,openState=false;
 const rafs=new Map(),timers=new Map(),elements=new Map(),vars=new Map();
 const make=name=>{
  const listeners=new Map(),attributes={},classes=new Set();
  const node={name,hidden:name==='quickOverlay'||name==='quickLampGrip',dataset:{},style:{},inert:false,attributes,
   addEventListener(type,fn){listeners.set(type,fn)},removeEventListener(type){listeners.delete(type)},
   setPointerCapture(){},setAttribute(k,v){attributes[k]=String(v)},getAttribute(k){return attributes[k]??null},
   getBoundingClientRect(){return {left:310,top:186,width:73,height:99}},
   classList:{add(...names){names.forEach(n=>classes.add(n))},remove(...names){names.forEach(n=>classes.delete(n))},contains(n){return classes.has(n)}},
   fire(type,x,y,id=9){
    const point={identifier:id,clientX:x,clientY:y},event={
     touches:type==='touchend'?[]:[point],changedTouches:[point],pointerId:id,
     clientX:x,clientY:y,pointerType:'touch',cancelable:true,
     preventDefault(){this.prevented=true},stopPropagation(){},stopImmediatePropagation(){}};
    listeners.get(type)?.(event);return event;
   }};
  elements.set(name,node);return node;
 };
 const launcher=make('quickLauncher'),grip=make('quickLampGrip'),overlay=make('quickOverlay'),sheet=make('quickSheet');
 make('quickBackdrop');make('ambientLampArm');make('ambientBeamCanvas');make('ambientBeamUp');
 for(let i=1;i<=3;i++)make('ambientBeam'+i);
 launcher.setAttribute('aria-expanded','false');
 const win={innerWidth:390,innerHeight:844,TouchEvent:function TouchEvent(){},performance:{now:()=>clock},
  matchMedia(){return {matches:false}},
  requestAnimationFrame(fn){const id=++tick;rafs.set(id,fn);return id},
  cancelAnimationFrame(id){rafs.delete(id)},
  setTimeout(fn,ms){const id=++tick;timers.set(id,{fn,at:clock+ms});return id},
  clearTimeout(id){timers.delete(id)},
  addEventListener(){},removeEventListener(){},
  lumaQuickControl:{
   isOpen(){return !overlay.hidden},
   open(){openCalls++;openState=true;overlay.hidden=false;launcher.setAttribute('aria-expanded','true');controller.showOpened()},
   close(){closeCalls++;openState=false;overlay.hidden=true;launcher.setAttribute('aria-expanded','false');controller.reset()}
  }
 };
 const doc={documentElement:{style:{setProperty(k,v){vars.set(k,v)},getPropertyValue:k=>vars.get(k)}},
  getElementById:name=>elements.get(name),querySelector:q=>q==='.quick-sheet'?sheet:null};
 const controller=pull.attach({doc,win});
 function step(dt=16){
  clock+=dt;
  const queue=[...rafs.values()];rafs.clear();for(const fn of queue)fn(clock);
  const expired=[...timers].filter(([,t])=>t.at<=clock);for(const [id,t]of expired){timers.delete(id);t.fn()}
 }
 return {controller,launcher,grip,overlay,sheet,vars,elements,win,step,
   get opened(){return openState},get openCalls(){return openCalls},get closeCalls(){return closeCalls}};
}
function open(t){
 const distance=pull.limits(390).drag,base=330;
 t.launcher.fire('touchstart',base,230);
 t.launcher.fire('touchmove',base-distance*.75,230);
 t.launcher.fire('touchend',base-distance*.75,230);
 for(let i=0;i<22;i++)t.step();
 assert.equal(t.opened,true);assert.equal(t.grip.hidden,false);return distance;
}
test('Shade pull opens and immediately exposes a draggable grip above the panel contents',()=>{
 const t=fixture();open(t);
 assert.equal(t.openCalls,1);
 assert.equal(t.controller.progress,1);
 assert.ok(parseFloat(t.vars.get('--luma-open-lift-px'))>=40);
 assert.equal(t.launcher.getAttribute('aria-expanded'),'true');
 t.controller.destroy();
});
test('Grabbing opened shade and dragging RIGHT moves arm, light and panel continuously 75/50/25% to closed',()=>{
 const t=fixture(),distance=open(t);
 t.grip.fire('touchstart',100,220);
 const values=[];
 for(const p of [.75,.5,.25]){
  t.grip.fire('touchmove',100+distance*(1-p),220);
  const state={p,progress:t.controller.progress,panel:t.sheet.style.transform,
   arm:t.elements.get('ambientLampArm').attributes.d,
   light:t.elements.get('ambientBeam1').attributes.d,
   lift:parseFloat(t.vars.get('--luma-open-lift-px')),present:!t.overlay.hidden};
  values.push(state);
  assert.ok(Math.abs(state.progress-p)<.01,JSON.stringify(state));
  assert.ok(state.panel.startsWith('translate3d('+Math.round((1-p)*100)),state.panel);
  assert.equal(state.present,true);
 }
 assert.notEqual(values[0].arm,values[1].arm);
 assert.notEqual(values[1].light,values[2].light);
 assert.ok(values[0].lift>values[1].lift&&values[1].lift>values[2].lift);
 t.grip.fire('touchend',100+distance*.75,220);
 for(let i=0;i<22;i++)t.step();
 assert.equal(t.closeCalls,1);
 assert.equal(t.opened,false);
 assert.equal(t.overlay.hidden,true);
 assert.equal(t.grip.hidden,true);
 assert.equal(t.vars.get('--luma-pull-px'),'0px');
 t.controller.destroy();
});
test('Short rightward swipe snaps BACK to open without re-running open and losing scroll state',()=>{
 const t=fixture(),distance=open(t);
 t.grip.fire('touchstart',100,220);
 t.grip.fire('touchmove',100+distance*.12,220);
 assert.ok(t.controller.progress>.87);
 t.grip.fire('touchend',100+distance*.12,220);
 for(let i=0;i<22;i++)t.step();
 assert.equal(t.opened,true);
 assert.equal(t.openCalls,1,'must not repeat open() and reset saved scroll position');
 assert.equal(t.closeCalls,0);
 assert.equal(t.grip.hidden,false);
 assert.equal(t.controller.progress,1);
 t.controller.destroy();
});
test('Direction reversal while still holding shade immediately restores open progress',()=>{
 const t=fixture(),distance=open(t);
 t.grip.fire('touchstart',100,220);
 t.grip.fire('touchmove',100+distance*.70,220);
 const a=t.controller.progress;
 t.grip.fire('touchmove',100+distance*.18,220);
 assert.ok(t.controller.progress>a);
 t.grip.fire('touchend',100+distance*.18,220);
 for(let i=0;i<22;i++)t.step();
 assert.equal(t.opened,true);
 t.controller.destroy();
});
test('X and backdrop keep normal close; no duplicate lamp tree or Hue write is introduced',()=>{
 assert.equal((html.match(/id="targetFastTree"/g)||[]).length,1);
 assert.ok(html.includes("el('quickClose').onclick=quickClose"));
 assert.ok(html.includes("el('quickBackdrop').onclick=quickClose"));
 const js=fs.readFileSync(path.join(dir,'quick-pull.js'),'utf8');
 assert.ok(!js.includes("fetch(")&&!js.includes("hue-application-key")&&!js.includes("getUserMedia"));
});
