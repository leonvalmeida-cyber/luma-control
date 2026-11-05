const fs=require('node:fs'),test=require('node:test'),assert=require('node:assert/strict');
const html=fs.readFileSync('flow-v48/index.html','utf8'),js=fs.readFileSync('flow-v48/v48.js','utf8'),css=fs.readFileSync('flow-v48/v48.css','utf8');
test('V4.8 keeps real Hue controls',()=>{assert.match(html,/flow-v46\/v46\.js/);assert.match(html,/flow-v48\/v48\.js/);assert.match(html,/flow-v48\/v48\.css/);});
test('room elements and persistent placements',()=>{for(const key of ['TV and white lowboard','sofa and blankets','work station','localStorage.setItem','dataset.lightId','MutationObserver'])assert.ok(js.includes(key),key)});
test('scripts parse',()=>{new Function(js);for(const [,body] of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(body.trim())new Function(body)});
test('room styling remains separate',()=>assert.match(css,/\.v48-room/));
