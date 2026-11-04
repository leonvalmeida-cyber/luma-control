/* Mobile Chromium smoke test of the ACTUAL V4.5 DOM and touch pipeline.
   Run from repo root after "npm install --no-save playwright" and serving
   the root via python3 -m http.server 8090.
   No Bridge credentials or Hue commands are used. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const origin=process.env.LUMA_TEST_ORIGIN||'http://127.0.0.1:8090';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext({
  viewport:{width:390,height:844},deviceScaleFactor:2,
  isMobile:true,hasTouch:true,
  reducedMotion:'reduce'
 });
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto(origin+'/flow-v45/',{waitUntil:'domcontentloaded',timeout:30000});
 assert.equal(response.status(),200);
 await page.waitForFunction(()=>window.LumaV45&&window.lumaQuickPull&&document.getElementById('v45LampHome'),null,{timeout:20000});
 assert.equal(await page.locator('.v45-living-stage').count(),1);
 assert.equal(await page.locator('#v41Master').count(),0,'no old top brightness card');
 assert.equal(await page.locator('#v44DockSocket').count(),0,'no old magnetic dimmer socket');
 await page.locator('#quickLauncher').tap();
 await page.waitForFunction(()=>document.getElementById('quickLauncher')?.getAttribute('aria-expanded')==='true',null,{timeout:5000});
 assert.equal(await page.locator('#quickOverlay').isVisible(),true,'quick control opens on a single tap');
 const home=await page.locator('#v45LampHome').boundingBox();
 const launcher=await page.locator('#quickLauncher').boundingBox();
 assert.ok(home&&home.height>145,'living room stage rendered');
 assert.ok(launcher&&launcher.width>=75,'lamp never shrinks to tiny target');
 assert.ok(await page.locator('#v43FixedRail').count()===1,'real fixed rail retained');
 assert.equal(await page.locator('#quickLampGrip').isVisible(),true);
 // Tap again on the close button, not the slider; repeated cycles must never
 // strand a hidden overlay or leave pointer interception after close.
 await page.locator('#quickClose').tap();
 await page.waitForFunction(()=>document.getElementById('quickOverlay')?.hidden===true,null,{timeout:5000});
 await page.locator('#quickLauncher').tap();
 await page.waitForFunction(()=>document.getElementById('quickOverlay')?.hidden===false,null,{timeout:5000});
 assert.equal(await page.locator('#v45LampHome').isVisible(),true);
 await page.locator('#quickClose').tap();
 await page.waitForFunction(()=>document.getElementById('quickOverlay')?.hidden===true,null,{timeout:5000});
 // The settings button is clickable after closing instead of being covered
 // by a lingering transparent drag surface.
 const gear=page.locator('#tabs .g-settings-toggle');
 assert.ok(await gear.count()===1,'settings exists');
 await gear.tap();
 assert.equal(await page.locator('#settingsMenu').isVisible(),true,'settings menu remains accessible');
 assert.equal(await page.locator('#quickLampGrip').isVisible(),false);
 assert.deepEqual(errors,[],'no uncaught browser JS errors');
 console.log('✓ V4.5 mobile tap open/close twice, visual stage, settings access, no page errors');
 await context.close();
}finally{await browser.close()}
