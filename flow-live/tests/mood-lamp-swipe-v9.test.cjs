'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const quickCSS=fs.readFileSync(path.join(root,'quick-overlay.css'),'utf8');
const lamp=require('../ambient-lamp.js'),swipe=require('../quick-swipe.js');

test('Four music illustrations are painted on the MUSIC cards themselves, independent of nested images',()=>{
 assert.ok(html.includes("document.querySelectorAll('#palettes [data-palette]')"));
 assert.ok(html.includes("const embeddedSVG='data:image/svg+xml;base64,'+btoa(lumaMoodArtwork[id])"));
 assert.ok(html.includes("button.style.setProperty('background-image'"));
 assert.ok(html.includes("'background-position','center center,center top','important'"));
 assert.ok(html.includes('const lumaMoodArtwork='));
 assert.ok(html.includes('button.replaceChildren(artwork,caption,dots,check)'));
 assert.ok(!html.includes('background-image: url(https://'));
 for(const name of ['neon','sunset','ocean','warm']){
  assert.ok(html.includes('"'+name+'":"<svg'),name+' missing embedded picture');
 }
});
test('Custom launch icon is a left-facing floor lamp with shade-left and stand-right',()=>{
 assert.ok(html.includes('viewBox="0 0 100 124"'));
 assert.ok(html.includes('class="ambient-lamp-silhouette"'));
 assert.ok(html.includes('class="ambient-lamp-base"'));
 assert.ok(html.includes('class="ambient-lamp-stem"'));
 assert.ok(html.includes('class="ambient-lamp-lumen ambient-lamp-lumen-one"'));
 assert.ok(quickCSS.includes('.quick-launcher .ambient-lamp-lumen-three'));
});
test('Multi-color lamp beams are derived from distinct selected Hue lights',()=>{
 const states=[0,21845,43690].map(hue=>({state:{on:true,reachable:true,hue,sat:254,bri:215,colormode:'hs'}}));
 const value=lamp.calculate({hue:{connected:true,devices:states}});
 assert.equal(value.beams.count,3);
 const rays=lamp.visuals(value).beams;
 assert.equal(rays.length,3);
 assert.equal(new Set(rays).size,3);
 assert.ok(quickCSS.includes('.ambient-room-glow .ambient-ray-1'));
 assert.ok(quickCSS.includes('.ambient-room-glow .ambient-ray-2'));
 assert.ok(quickCSS.includes('.ambient-room-glow .ambient-ray-3'));
 assert.ok(quickCSS.includes('clip-path:polygon(100% 0%,100% 2%,0 99%,0 78%)'));
 assert.ok(html.includes('class="ambient-ray ambient-ray-1"'));
});
test('One light or lights-off never invents multiple distinct beams',()=>{
 const first=lamp.calculate({hue:{connected:true,devices:[{state:{on:true,reachable:true,hue:0,sat:254,bri:100}}]}});
 const colors=lamp.visuals(first).beams;
 assert.equal(new Set(colors).size,1);
 assert.equal(first.beams.count,1);
 const off=lamp.calculate({hue:{connected:true,devices:[{state:{on:false,bri:254}}]}});
 assert.equal(lamp.visuals(off).power,0);
});
test('Native Touch Events open from right lamp on LEFT swipe and close from right edge grip on RIGHT swipe',()=>{
 const make=()=>{
  const listeners=new Map(),node={style:{},dataset:{},listeners,
   addEventListener(k,fn){listeners.set(k,fn)},
   removeEventListener(k){listeners.delete(k)},
   setPointerCapture(){},contains(x){return x===this},
   fire(type,start,end,identifier=9){
    const value=(x,y)=>({identifier,clientX:x,clientY:y});
    const evt={touches:type==='touchend'?[]:[value(...start)],changedTouches:[value(...end)],preventDefault(){this.prevented=true},stopPropagation(){},target:this};
    listeners.get(type)?.(evt);return evt;
   }
  };return node;
 };
 const launcher=make(),title=make(),sheet=make(),backdrop=make(),closeGrip=make();
 let opened=false,openCount=0,closeCount=0;
 const win={lumaQuickControl:{open(){openCount++;opened=true},close(){closeCount++;opened=false},isOpen(){return opened}}};
 const doc={getElementById:id=>id==='quickLauncher'?launcher:id==='quickBackdrop'?backdrop:id==='quickSwipeClose'?closeGrip:null,
  querySelector:x=>x==='.quick-titlebar'?title:x==='.quick-sheet'?sheet:null};
 const inst=swipe.attach({doc,win});assert.ok(inst);
 const point=(x,y)=>[x,y];
 launcher.fire('touchstart',point(140,200),point(140,200));
 launcher.fire('touchmove',point(140,200),point(65,200));
 const open=launcher.fire('touchend',point(140,200),point(65,200));
 assert.equal(opened,true);assert.equal(openCount,1);assert.equal(open.prevented,true);
 closeGrip.fire('touchstart',point(12,200),point(12,200));
 closeGrip.fire('touchmove',point(12,200),point(120,200));
 closeGrip.fire('touchend',point(12,200),point(120,200));
 assert.equal(opened,false);assert.equal(closeCount,1);
 inst.destroy();
 assert.equal(launcher.dataset.swipeReady,undefined);
});
test('Right-side close grip remains at launcher thumb height, and scrollable group tree is untouched',()=>{
 assert.ok(html.includes('id="quickSwipeClose"'));
 assert.ok(html.includes("el('quickSwipeClose').onclick=quickClose;"));
 assert.ok(quickCSS.includes('.quick-swipe-close{'));
 assert.ok(quickCSS.includes('top:clamp(135px,22dvh,238px)'));
 assert.ok(quickCSS.includes('.quick-swipe-close>span{pointer-events:none}'));
 const swipeJS=fs.readFileSync(path.join(root,'quick-swipe.js'),'utf8');
 assert.ok(swipeJS.includes("const a=bind(launcher,'open'),b=bind(panel,'close'),c=closeGrip?bind(closeGrip,'close')"));
 assert.ok(!swipeJS.includes("bind(doc.getElementById('quickPanelBody')"));
});
test('Beam variables propagate into whole-app pointer transparent light surface',()=>{
 const source=fs.readFileSync(path.join(root,'ambient-lamp.js'),'utf8');
 assert.ok(source.includes("rootStyle?.setProperty('--ambient-ray-'+(i+1),color)"));
 assert.ok(quickCSS.includes('.ambient-room-glow{'));
 assert.ok(quickCSS.includes('pointer-events:none'));
 assert.ok(quickCSS.includes('--ambient-power'));
 assert.ok(!/getUserMedia|XMLHttpRequest|WebSocket|fetch\(/.test(source));
});
