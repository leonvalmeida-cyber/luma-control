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
  // Real WebKit event dispatch to verify touch listeners are registered and work with the DOM.
  const swipeResult=await page.evaluate(async()=>{
   function flick(target,from,to){
    const event=(type,x,y)=>{const evt=new Event(type,{bubbles:true,cancelable:true});
     const p={identifier:15,clientX:x,clientY:y};
     Object.defineProperty(evt,'touches',{value:type==='touchend'?[]:[p]});
     Object.defineProperty(evt,'changedTouches',{value:[p]});
     target.dispatchEvent(evt)};
    event('touchstart',...from);event('touchmove',...to);event('touchend',...to);
   }
   const handle=document.getElementById('quickLauncher'),overlay=document.getElementById('quickOverlay');
   const ready=handle.dataset.swipeReady;
   flick(handle,[180,250],[65,250]);
   const opened=!overlay.hidden;
   const close=document.getElementById('quickSwipeClose');
   flick(close,[12,251],[145,251]);
   await new Promise(r=>setTimeout(r,320));
   return {ready,opened,closed:overlay.hidden,rightGrip:!!close};
  });
  console.log('WEBKIT_SWIPE='+JSON.stringify(swipeResult));
  assert.equal(swipeResult.ready,'true');
  assert.equal(swipeResult.opened,true,'left thumb swipe should open without tapping');
  assert.equal(swipeResult.closed,true,'right thumb swipe on same-height edge grip should close');
  assert.equal(swipeResult.rightGrip,true);
  // Independent touch targets: direct lamp selection and power live in one existing tree.
  const ui=await page.evaluate(()=>({lampPath:!!document.querySelector('.ambient-lamp-silhouette'),
   lightRays:document.querySelectorAll('#ambientRoomGlow>.ambient-ray').length,
   onlyOneTree:document.querySelectorAll('#targetFastTree').length===1,
   offGlow:getComputedStyle(document.documentElement).getPropertyValue('--ambient-power').trim()}));
  console.log('WEBKIT_QUICK_UI='+JSON.stringify(ui));
  assert.ok(ui.lampPath&&ui.lightRays===3&&ui.onlyOneTree);
  if(pageErrors.length)console.log('WEBKIT_PAGE_ERRORS='+JSON.stringify(pageErrors.slice(0,8)));
  console.log('WEBKIT_FLOW_VISUAL_SMOKE=PASS');
 }catch(e){console.error('WEBKIT_FLOW_VISUAL_SMOKE=FAIL',e);process.exitCode=1}
 finally{if(browser)await browser.close();await close()}
})();
