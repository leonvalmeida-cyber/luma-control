const fs=require('node:fs'),assert=require('node:assert/strict'),test=require('node:test');
const html=fs.readFileSync('flow-v46/index.html','utf8'),js=fs.readFileSync('flow-v46/v46.js','utf8'),css=fs.readFileSync('flow-v46/v46.css','utf8');
test('isolated V4.6 assets',()=>{assert.match(html,/flow-v46\/v46\.js/);assert.match(html,/flow-v46\/v46\.css/);assert.match(html,/lumaV46Bridge/);assert.match(html,/flow-v45\/v45\.js/);});
test('real Hue state and commands rather than demo',()=>{assert.match(html,/request\('GET','\/lights'\)/);assert.match(html,/request\('PUT','\/lights\/'/);assert.match(js,/api\(\)\.power/);assert.match(js,/api\(\)\.refresh/);assert.match(js,/state\.reachable/);});
test('room contains group power, accessible minis, no big ad copy',()=>{assert.match(js,/v46-group-power/);assert.match(js,/aria-label/);assert.match(js,/v45-stage-copy/);assert.match(css,/v46-note/);});
test('all scripts parse',()=>{new Function(js);for(const [,body] of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){if(body.trim())new Function(body)}});
