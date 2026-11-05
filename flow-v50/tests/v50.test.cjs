const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const js=fs.readFileSync('flow-v50/v50.js','utf8'),html=fs.readFileSync('flow-v50/index.html','utf8'),css=fs.readFileSync('flow-v50/v50.css','utf8');
test('V5 JS parses',()=>assert.doesNotThrow(()=>new Function(js)));
test('existing Hue bridge and quick controls retained',()=>{assert.match(html,/flow-v46\/v46\.js/);assert.match(html,/flow-v50\/v50\.js/);assert.match(html,/flow-v50\/v50\.css/);});
test('no generated room illustration',()=>{assert.doesNotMatch(js,/<svg/);assert.match(js,/Home Sweet Home/);assert.match(js,/v50-cards/);});
test('reuses original live Hue buttons, no fake controls',()=>{assert.match(js,/append\(mini\)/);assert.match(js,/dataset\.lightId/);assert.match(js,/snapshot/);});
test('mobile responsive',()=>assert.match(css,/@media\(max-width:390px\)/));
