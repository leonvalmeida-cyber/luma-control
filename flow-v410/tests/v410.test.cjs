const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const js=fs.readFileSync('flow-v410/v410.js','utf8'),html=fs.readFileSync('flow-v410/index.html','utf8');
test('JS parses',()=>assert.doesNotThrow(()=>new Function(js)));
test('V4.10 loads existing Hue controller',()=>{assert.match(html,/flow-v46\/v46\.js/);assert.match(html,/flow-v410\/v410\.js/);});
test('room has correct physical objects',()=>{for(const term of ['EDGE-ON','L SECTIONAL','coffee table','white tower','monitor curved','FRONT-FACING SLOPING ROOF','plant by TV'])assert.ok(js.includes(term),term)});
test('7 live Hue controls remain interactive',()=>{assert.match(js,/dataset\.lightId/);assert.match(js,/MutationObserver/);assert.match(js,/localStorage\.setItem/)});
