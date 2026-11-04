/* Luma Ambient Lamp v1: decorative UI only; no Hue commands, no uploads or audio capture.
   State comes from the existing music frame engine and most recently read Hue lights. */
(function(root){'use strict';
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,Number.isFinite(x)?x:0));
const byte=x=>Math.round(clamp(x,0,255));
const mix=(a,b,t)=>a.map((v,i)=>byte(v*(1-t)+b[i]*t));
const PALETTES={neon:[185,91,248],sunset:[250,153,102],ocean:[59,175,230],warm:[255,194,119]};
function hueRGB(h,s,v=1){
 h=((Number(h)||0)%360+360)%360;s=clamp(s);v=clamp(v);
 const c=v*s,shift=h/60,x=c*(1-Math.abs(shift%2-1)),m=v-c;
 const bases=shift<1?[c,x,0]:shift<2?[x,c,0]:shift<3?[0,c,x]:shift<4?[0,x,c]:shift<5?[x,0,c]:[c,0,x];
 return bases.map(q=>byte((q+m)*255));
}
function xyRGB(x,y){
 if(!(x>0&&y>0&&x<1&&y<1))return null;
 const Y=1,X=Y*x/y,Z=Y*(1-x-y)/y;
 let r=X*1.656492-Y*.354851-Z*.255038;
 let g=-X*.707196+Y*1.655397+Z*.036152;
 let b=X*.051713-Y*.121364+Z*1.01153;
 const max=Math.max(r,g,b,1e-6);r=Math.max(0,r/max);g=Math.max(0,g/max);b=Math.max(0,b/max);
 const gamma=q=>byte(255*(q<=.0031308?12.92*q:1.055*Math.pow(q,1/2.4)-.055));
 return [gamma(r),gamma(g),gamma(b)];
}
function kelvinRGB(k){
 const t=clamp(k,1500,6500)/100;
 const r=t<=66?255:329.6987*Math.pow(t-60,-.1332);
 const g=t<=66?99.4708*Math.log(t)-161.1196:288.1222*Math.pow(t-60,-.07551);
 const b=t>=66?255:t<=19?0:138.5177*Math.log(t-10)-305.0448;
 return [byte(r),byte(g),byte(b)];
}
function deviceRGB(state={}){
 if(state.colormode==='ct'&&Number.isFinite(state.ct)&&state.ct>0)return kelvinRGB(1000000/state.ct);
 if(state.colormode==='hs'&&Number.isFinite(state.hue)&&Number.isFinite(state.sat))return hueRGB(state.hue/65535*360,state.sat/254,1);
 if(Array.isArray(state.xy)&&state.xy.length===2){const c=xyRGB(+state.xy[0],+state.xy[1]);if(c)return c}
 if(Number.isFinite(state.hue)&&Number.isFinite(state.sat))return hueRGB(state.hue/65535*360,state.sat/254,1);
 if(Number.isFinite(state.ct)&&state.ct>0)return kelvinRGB(1000000/state.ct);
 return [250,220,173];
}
function weightedSamples(samples){
 let weight=0,sun=0,covered=0;const rgb=[0,0,0];
 for(const sample of samples){
  const brightness=clamp(sample.level);covered+=brightness;
  const w=brightness*brightness+.001;
  if(!brightness)continue;
  for(let k=0;k<3;k++)rgb[k]+=byte(sample.rgb[k])*w;
  weight+=w;sun++;
 }
 return {rgb:weight?rgb.map(v=>byte(v/weight)):[189,145,218],
         level:samples.length?clamp(covered/samples.length):0,on:sun>0};
}
function selectBeamColors(samples,fallback){
 const bright=samples.filter(x=>x&&Array.isArray(x.rgb)&&x.rgb.length===3&&clamp(x.level)>.035)
   .sort((a,b)=>clamp(b.level)-clamp(a.level));
 if(!bright.length)return {colors:[fallback,fallback,fallback],count:0};
 const chosen=[bright[0].rgb.map(byte)];
 while(chosen.length<3){
  let winner=null,best=110;
  for(const item of bright){
   const color=item.rgb.map(byte);
   const diff=Math.min(...chosen.map(c=>Math.sqrt(c.reduce((n,v,i)=>n+(v-color[i])**2,0))));
   if(diff>best){best=diff;winner=color}
  }
  if(!winner)break;
  chosen.push(winner);
 }
 const count=chosen.length;
 while(chosen.length<3)chosen.push(chosen[chosen.length-1]);
 return {colors:chosen,count};
}
function calculate({music={},hue={}}={}){
 const mood=PALETTES[music?.palette]||PALETTES.neon;
 const connected=Boolean(hue?.connected),active=Boolean(music?.active&&music?.contextState==='running'&&music?.frameAgeMs<1100);
 if(active&&Array.isArray(music.frames)&&music.frames.length){
  const samples=music.frames.filter(f=>Array.isArray(f?.rgb)&&f.rgb.length===3).map(f=>({rgb:f.rgb,level:clamp(f.brightness)}));
  if(samples.length){
   const result=weightedSamples(samples);
   return {...result,beams:selectBeamColors(samples,mood),source:'music',connected,colorMood:music.palette||'neon'};
  }
 }
 if(connected){
  const selected=Array.isArray(hue.devices)?hue.devices:[];
  const samples=selected.map(d=>{
   const s=d?.state||{};
   const on=s.on===true&&s.reachable!==false;
   return {rgb:deviceRGB(s),level:on?(Number.isFinite(s.bri)?clamp(s.bri/254):.75):0};
  });
  if(samples.length){
   const result=weightedSamples(samples);
   return {...result,beams:selectBeamColors(samples,mood),rgb:result.on?result.rgb:mood,source:'hue',connected,colorMood:music.palette||'neon'};
  }
  return {rgb:mood,level:0,on:false,beams:selectBeamColors([],mood),connected,source:'empty',colorMood:music.palette||'neon'};
 }
 return {rgb:mood,level:0,on:false,beams:selectBeamColors([],mood),connected:false,source:'disconnected',colorMood:music.palette||'neon'};
}
function visuals(info){
 const rgb=Array.isArray(info.rgb)?info.rgb:[200,150,240];
 const level=clamp(info.level);
 // Light spread obeys actual power. When off, the symbol stays visible but emits almost no light.
 const power=info.on?clamp(Math.pow(level,.75)*.85,0,.85):0;
 const beams=(info.beams?.colors||[rgb,rgb,rgb]).map(c=>c.map(byte).join(' '));
 return {rgb:rgb.map(byte).join(' '),beams,beamCount:info.beams?.count||0,
   power:Number(power.toFixed(3)),symbol:Number((.12+power*.88).toFixed(3)),
   on:info.on?'on':'off',source:info.source};
}
function attach({doc=root.document,win=root}={}){
 const lamp=doc?.getElementById?.('quickLauncher'),wash=doc?.getElementById?.('ambientRoomGlow');
 if(!lamp||!wash)return null;
 const rootStyle=doc.documentElement?.style;
 let previous='',timer=0;
 function update(){
  if(doc.hidden)return;
  let info;
  try{info=calculate({music:win.lumaMusicState?.()||{},hue:win.lumaAmbientLightState?.()||{}})}
  catch{info={rgb:[160,139,199],level:0,on:false,source:'unknown',connected:false}}
  const v=visuals(info);
  const sig=[v.rgb,...v.beams,v.beamCount,v.power,v.symbol,v.on,v.source,info.connected].join('|');
  if(sig===previous)return;
  previous=sig;
  rootStyle?.setProperty('--ambient-rgb',v.rgb);
  v.beams.forEach((color,i)=>rootStyle?.setProperty('--ambient-ray-'+(i+1),color));
  rootStyle?.setProperty('--ambient-beam-count',String(v.beamCount));
  rootStyle?.setProperty('--ambient-power',String(v.power));
  rootStyle?.setProperty('--ambient-symbol',String(v.symbol));
  lamp.dataset.ambientState=info.connected?v.on:'disconnected';
  lamp.dataset.ambientSource=v.source;
  wash.dataset.ambientState=lamp.dataset.ambientState;
 }
 update();timer=win.setInterval?.(update,320)||0;
 const onVisible=()=>{previous='';update()};
 doc.addEventListener?.('visibilitychange',onVisible);
 win.addEventListener?.('pagehide',()=>{if(timer)win.clearInterval(timer)},{once:true});
 return {update,stop(){if(timer)win.clearInterval(timer);doc.removeEventListener?.('visibilitychange',onVisible)}};
}
const api={calculate,visuals,deviceRGB,hueRGB,xyRGB,kelvinRGB,weightedSamples,selectBeamColors,attach,PALETTES};
root.LumaAmbientLamp=api;
if(typeof module==='object'&&module.exports)module.exports=api;
if(root.document){
 const init=()=>attach();
 if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
}
})(typeof globalThis!=='undefined'?globalThis:this);
