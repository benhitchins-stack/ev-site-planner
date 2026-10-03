import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import vm from 'node:vm';

const read = name => readFileSync(new URL('../public/'+name,import.meta.url),'utf8');
const source = read('EV Site Planner.html');
// Check exactly the assets the packaging step versions, so the two lists cannot drift.
const buildScript = readFileSync(new URL('../scripts/build-site.py',import.meta.url),'utf8');
const assets = [...buildScript.match(/^assets = \[([\s\S]*?)\]/m)[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);

test('all home and workspace addresses ship the same current application',()=>{
  for(const name of ['index.html','home.html','Landing Page Final.dc.html'])
    assert.equal(read(name)===source,true,`${name} must be rebuilt`);
});

test('first-party asset URLs match their content versions',()=>{
  for(const name of assets){
    const content = read(name);
    const hash = createHash('sha256').update(content).digest('hex').slice(0,12);
    assert.ok(source.includes(`${name}?v=${hash}`),`Run npm run build after changing ${name}`);
    if(name.endsWith('.js'))assert.doesNotThrow(()=>new vm.Script(content,{filename:name}));
  }
});

test('the packaging step versions every planner asset, including the CDM stylesheet',()=>{
  assert.ok(assets.length>=27,'asset list read from scripts/build-site.py');
  for(const name of ['cdm-controls.css','planning.css','guides.css','help.css','planning-core.js','project-store.js','planning.js','guide-art.js','guides.js','help.js'])
    assert.ok(assets.includes(name),`${name} is versioned by the build`);
});

test('every first-party stylesheet and script in the shipped pages carries a content version',()=>{
  const pages = readdirSync(new URL('../public/',import.meta.url)).filter(name=>name.endsWith('.html'));
  for(const page of pages){
    const html = read(page);
    const urls = [...[...html.matchAll(/<link\b[^>]*>/g)].filter(m=>/\brel="stylesheet"/.test(m[0])).map(m=>(m[0].match(/\bhref="([^"]+)"/)||[])[1]),...[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)].map(m=>m[1])].filter(Boolean);
    for(const url of urls){
      if(/^(?:https?:|data:|\/\/|(?:\.\/)?vendor\/)/.test(url)||/['+]/.test(url))continue;
      assert.match(url,/\?v=[a-f0-9]{12}$/,`${page} links ${url} without a content version`);
    }
  }
});
