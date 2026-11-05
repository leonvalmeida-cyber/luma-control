const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('flow-v47/index.html','utf8'),js=fs.readFileSync('flow-v47/v47.js','utf8'),css=fs.readFileSync('flow-v47/v47.css','utf8');
test('V4.7 isolated and preserves V4.6 Hue controls',()=>{assert.match(html,/flow-v46\/v46\.js/);assert.match(html,/flow-v47\/v47\.js/);assert.match(html,/flow-v47\/v47\.css/);});
test('artwork uses user room elements and actual mini lamp states',()=>{assert.match(js,/attic roof/);assert.match(js,/TV and low white cabinet/);assert.match(js,/sofa, chaise/);assert.match(js,/desk and monitor/);assert.match(js,/--v46-rgb/);assert.match(js,/is-on/);assert.match(css,/grayscale\(1\)/);});
test('V4.7 JavaScript parses',()=>{new Function(js)});
