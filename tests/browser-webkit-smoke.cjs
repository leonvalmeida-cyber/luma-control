'use strict';
/* Actual WebKit/iPhone-size visual smoke for the self-contained Flow feature page.
   No microphone/Bridge permission or real Hue commands; no credentials. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {webkit}=require('playwright');
const base=path.resolve(__dirname,'..'),types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '')||'index.html';
 const full=path.resolve(base,rel);
 if(full!==path.join(base,'index.html')&&!full.startsWith(base+path.sep)){res.writeHead(403);res.end();return}
 fs.readFile(full,(err,data)=>{if(err){res.writeHead(404);res.end('Not found: '+rel);return}
  res.writeHead(200,{'content-type':types[path.extname(full)]||'application/octet-stream','cache-control':'no-store'});res.end(data)});
});
const listen=()=>new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const close=()=>new Promise(resolve=>server.close(resolve));
(async()=>{
 let browser;
 try{
  await listen();
  const url='http://127.0.0.1:'+server.address().port+'/';
  browser=await webkit.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#palettes button.mi-mood-card',{timeout:15000});
  const moodData=await page.evaluate(async()=>{
   const result=[];
   for(const button of document.querySelectorAll('#palettes .mi-mood-card')){
    const style=getComputedStyle(button),background=style.backgroundImage;
    const art=button.querySelector('.mi-mood-art');
    const raw=button.style.backgroundImage.match(/data:image\/svg\+xml;base64,[a-zA-Z0-9+/=]+/)?.[0];
    let pictureWidth=0,colorCount=0,error=null;
    if(raw){
     try{
      const img=new Image();img.src=raw;await img.decode();pictureWidth=img.naturalWidth;
      const canvas=document.createElement('canvas');canvas.width=32;canvas.height=22;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,32,22);
      const px=ctx.getImageData(0,0,32,22).data,seen=new Set();
      for(let i=0;i<px.length;i+=4)seen.add([px[i]>>4,px[i+1]>>4,px[i+2]>>4].join(':'));
      colorCount=seen.size;
     }catch(e){error=e.message}
    }
    const box=button.getBoundingClientRect(),artRect=art?.getBoundingClientRect();
    result.push({name:button.dataset.palette,pictureWidth,colorCount,error,
     hasEmbeddedSVG:!!button.querySelector('.mi-mood-fallback svg'),
     bgIsData:background.includes('data:image/svg+xml;base64'),width:box.width,height:box.height,
     artWidth:artRect?.width||0,artHeight:artRect?.height||0});
   }
   return result;
  });
  console.log('WEBKIT_MOOD_RENDER='+JSON.stringify(moodData));
  assert.equal(moodData.length,4,'all 4 Music mood cards exist');
  for(const card of moodData){
   assert.ok(card.bgIsData,card.name+' must paint a real embedded illustration on the clickable button itself');
   assert.ok(card.pictureWidth>=320,card.name+' SVG must decode in WebKit');
   assert.ok(card.colorCount>12,card.name+' must contain detailed multicolor content');
   assert.ok(card.hasEmbeddedSVG,card.name+' should have inline SVG fallback');
   assert.ok(card.width>=120&&card.height>=170&&card.artHeight>65,card.name+' must be visibly sized on iPhone');
  }
  await page.locator('#miQuickPalettes').scrollIntoViewIfNeeded();
  await page.screenshot({path:'/tmp/luma-webkit-music.png'});
  // Verify the actual rendered mechanics at THREE intermediate finger positions.
  await page.waitForFunction(()=>document.getElementById('quickLauncher')?.dataset.pullReady==='true',{timeout:12000});
  const capture=async(progress,label)=>{
   await page.evaluate(({p})=>{
    const t=window.__lumaPullSmoke;
    const evt=new Event('touchmove',{bubbles:true,cancelable:true});
    const finger={identifier:31,clientX:t.x-p*t.drag,clientY:t.y};
    Object.defineProperty(evt,'touches',{value:[finger]});
    Object.defineProperty(evt,'changedTouches',{value:[finger]});
    t.launcher.dispatchEvent(evt);
   },{p:progress});
   await page.waitForTimeout(42); // at least two WebKit animation frames
   const observation=await page.evaluate(()=>{
    const t=window.__lumaPullSmoke,overlay=document.getElementById('quickOverlay');
    const shade=document.getElementById('ambientMovingHead').getBoundingClientRect();
    const mount=document.querySelector('.ambient-lamp-base').getBoundingClientRect();
    return {pull:+document.getElementById('quickLauncher').dataset.pullProgress,
      visible:!overlay.hidden,preview:overlay.classList.contains('quick-preview'),
      sheet:document.querySelector('.quick-sheet').style.transform,
      arm:document.getElementById('ambientLampArm').getAttribute('d'),
      beam:document.getElementById('ambientBeam1').getAttribute('d'),
      shadeX:shade.x,mountX:mount.x,
      rayPower:getComputedStyle(document.documentElement).getPropertyValue('--ambient-power').trim()};
   });
   assert.ok(observation.visible&&observation.preview,label+' must display drawer before finger release');
   assert.ok(Math.abs(observation.pull-progress)<.025,label+' drawer progress follows thumb');
   assert.ok(observation.sheet.includes(Math.round((1-progress)*100)+'%'),label+' panel must move proportionately');
   console.log('WEBKIT_PULL_'+label+'='+JSON.stringify(observation));
   return observation;
  };
  await page.evaluate(()=>{
   const launcher=document.getElementById('quickLauncher');
   const x=Math.min(window.innerWidth-22,342),y=launcher.getBoundingClientRect().top+44;
   const drag=window.LumaQuickPull.limits(window.innerWidth).drag;
   window.__lumaPullSmoke={launcher,x,y,drag};
   const evt=new Event('touchstart',{bubbles:true,cancelable:true});
   const finger={identifier:31,clientX:x,clientY:y};
   Object.defineProperty(evt,'touches',{value:[finger]});
   Object.defineProperty(evt,'changedTouches',{value:[finger]});
   launcher.dispatchEvent(evt);
  });
  const p25=await capture(.25,'25'),p50=await capture(.5,'50');
  await page.screenshot({path:'/tmp/luma-webkit-half-pulled.png'});
  const p75=await capture(.75,'75');
  assert.ok(p25.shadeX>p50.shadeX&&p50.shadeX>p75.shadeX,'shade actually moves with the thumb');
  assert.ok(Math.abs(p25.mountX-p50.mountX)<1&&Math.abs(p50.mountX-p75.mountX)<1,'wall mount stays fixed');
  assert.notEqual(p25.arm,p50.arm,'arm must grow between progress steps');
  assert.notEqual(p50.beam,p75.beam,'cone origin follows shade instead of staying static');
  await page.evaluate(()=>{
   const t=window.__lumaPullSmoke;
   const evt=new Event('touchend',{bubbles:true,cancelable:true});
   const finger={identifier:31,clientX:t.x-t.drag*.75,clientY:t.y};
   Object.defineProperty(evt,'touches',{value:[]});
   Object.defineProperty(evt,'changedTouches',{value:[finger]});
   t.launcher.dispatchEvent(evt);
  });
  await page.waitForTimeout(340);
  const opened=await page.evaluate(()=>({open:!document.getElementById('quickOverlay').hidden,
    preview:document.getElementById('quickOverlay').classList.contains('quick-preview'),
    pageLocked:document.body.classList.contains('quick-page-lock'),
    expanded:document.getElementById('quickLauncher').getAttribute('aria-expanded')}));
  console.log('WEBKIT_PULL_OPEN='+JSON.stringify(opened));
  assert.deepEqual(opened,{open:true,preview:false,pageLocked:true,expanded:'true'});
  await page.screenshot({path:'/tmp/luma-webkit-opened.png'});
  await page.locator('#quickClose').click();
  await page.waitForTimeout(320);
  assert.equal(await page.locator('#quickOverlay').evaluate(e=>e.hidden),true,'close X restores page');
  assert.equal(await page.locator('#quickLauncher').getAttribute('aria-expanded'),'false');
  // Below threshold: after a short pull the lamp, beams and sheet must ALL retract.
  await page.evaluate(()=>{
   const t=window.__lumaPullSmoke;
   const touch=(type,delta)=>{
    const evt=new Event(type,{bubbles:true,cancelable:true});
    const finger={identifier:35,clientX:t.x-delta,clientY:t.y};
    Object.defineProperty(evt,'touches',{value:type==='touchend'?[]:[finger]});
    Object.defineProperty(evt,'changedTouches',{value:[finger]});
    t.launcher.dispatchEvent(evt)};
   touch('touchstart',0);touch('touchmove',t.drag*.17);touch('touchend',t.drag*.17);
  });
  await page.waitForTimeout(290);
  const rolledBack=await page.evaluate(()=>({closed:document.getElementById('quickOverlay').hidden,
    shade:document.getElementById('quickLauncher').dataset.pullProgress,
    arm:document.getElementById('ambientLampArm').getAttribute('d'),
    pageLocked:document.body.classList.contains('quick-page-lock')}));
  console.log('WEBKIT_PULL_RETRACT='+JSON.stringify(rolledBack));
  assert.ok(rolledBack.closed&&rolledBack.shade==='0.000'&&!rolledBack.pageLocked);
  // Tap remains a keyboard/touch fallback.
  await page.locator('#quickLauncher').click();
  assert.equal(await page.locator('#quickOverlay').evaluate(e=>e.hidden),false);
  await page.locator('#quickClose').click();
  await page.waitForTimeout(280);
  assert.equal(await page.locator('#quickOverlay').evaluate(e=>e.hidden),true);
  // Independent touch targets: direct lamp selection and power live in one existing tree.
  const ui=await page.evaluate(()=>({lampPath:!!document.querySelector('.ambient-lamp-silhouette'),
   lightRays:document.querySelectorAll('#ambientBeamCanvas>.ambient-beam-path').length,
   onlyOneTree:document.querySelectorAll('#targetFastTree').length===1,
   offGlow:getComputedStyle(document.documentElement).getPropertyValue('--ambient-power').trim()}));
  console.log('WEBKIT_QUICK_UI='+JSON.stringify(ui));
  assert.ok(ui.lampPath&&ui.lightRays===3&&ui.onlyOneTree);
  if(pageErrors.length)console.log('WEBKIT_PAGE_ERRORS='+JSON.stringify(pageErrors.slice(0,8)));
  assert.equal(pageErrors.length,0,'No unexpected client-side JavaScript errors');
  console.log('WEBKIT_FLOW_VISUAL_SMOKE=PASS');
 }catch(e){console.error('WEBKIT_FLOW_VISUAL_SMOKE=FAIL',e);process.exitCode=1}
 finally{if(browser)await browser.close();await close()}
})();
