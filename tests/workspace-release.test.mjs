import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import vm from 'node:vm';

const read = name => readFileSync(new URL('../public/'+name,import.meta.url),'utf8');
const source = read('EV Site Planner.html');
const assets = ['design-preview.css','workbench.css','workbench.js','report-viewer.js', 'profile.css', 'profile.js', 'workspace.css','home.css','workspace.js','home.js','delivery.js','cdm-controls.js','report-fonts.js','bay-markings.js','audit-core.js','audit.js','audit.css'];

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
