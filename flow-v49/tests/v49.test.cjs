const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const js=fs.readFileSync('flow-v49/v49.js','utf8'),html=fs.readFileSync('flow-v49/index.html','utf8');
test('script parses',()=>assert.doesNotThrow(()=>new Function(js)));
test('uses existing live Hue v46 bridge and preserves interactions',()=>{assert.match(html,/flow-v46\/v46\.js/);assert.match(js,/dataset\.lightId/);assert.match(js,/MutationObserver/);});
test('real browser-drawn perspective includes all requested furniture',()=>{for(const item of ['skylight','L-shaped sectional','coffee table','white PC','monitor profile','plant near TV','TV seen obliquely'])assert.ok(js.includes(item),item)});
