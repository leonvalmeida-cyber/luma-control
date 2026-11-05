const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');const js=fs.readFileSync('flow-v411/v411.js','utf8'),html=fs.readFileSync('flow-v411/index.html','utf8');
test('JavaScript parses',()=>assert.doesNotThrow(()=>new Function(js)));
test('Hue controls retained',()=>{assert.match(html,/flow-v46\/v46\.js/);assert.match(js,/dataset\.lightId/);});
test('Home Sweet Home no cut roof, recognizable furniture',()=>{for(const x of ['full-width comfortable room','front-facing television','sectional','coffee table','white tower','small roof window'])assert.ok(js.includes(x),x);assert.doesNotMatch(js,/FRONT-FACING SLOPING ROOF/);});
