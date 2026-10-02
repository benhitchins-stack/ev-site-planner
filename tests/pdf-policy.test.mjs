import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source=readFileSync(new URL('../public/EV Site Planner.html',import.meta.url),'utf8');
const c=vm.createContext({});
vm.runInContext(source.slice(source.indexOf('function openPdfDocument('),source.indexOf('function ensurePdfJs(')),c);
test('PDF loading forbids font-code evaluation and preserves the supplied data',()=>{
 const data=new Uint8Array([37,80,68,70]),task={promise:Promise.resolve()};
 let options;
 assert.equal(c.openPdfDocument({getDocument:value=>{options=value;return task;}},data),task);
 assert.equal(options.data,data);assert.equal(options.isEvalSupported,false);
});
test('every first-party PDF loader uses the shared policy',()=>{
 for(const name of ['report-viewer.js','profile.js']){
  const script=readFileSync(new URL('../public/'+name,import.meta.url),'utf8');
  assert.match(script,/openPdfDocument\(lib,/);assert.doesNotMatch(script,/lib\.getDocument\(/);
 }
 assert.equal((source.match(/lib\.getDocument\(/g)||[]).length,1);
 assert.match(source,/openPdfDocument\(lib,buf\)/);
});
