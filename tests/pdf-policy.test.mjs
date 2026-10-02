import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source=readFileSync(new URL('../public/EV Site Planner.html',import.meta.url),'utf8');
const c=vm.createContext({URL,document:{baseURI:'https://example.test/'}});
vm.runInContext(source.slice(source.indexOf('function openPdfDocument('),source.indexOf('function ensurePdfJs(')),c);
test('PDF loading forbids evaluation, retains data and releases the owning loading task',async()=>{
 const data=new Uint8Array([37,80,68,70]),pdf={};let releases=0;
 const task={promise:Promise.resolve(pdf),destroy:()=>{releases++;return Promise.resolve();}};
 let options;
 const handle=c.openPdfDocument({getDocument:value=>{options=value;return task;}},data);
 assert.equal(await handle.promise,pdf);await pdf.destroy();await handle.destroy();assert.equal(releases,1);
 assert.equal(options.data,data);assert.equal(options.isEvalSupported,false);assert.equal(options.wasmUrl,'https://example.test/vendor/pdfjs/wasm/');assert.equal(options.cMapPacked,true);
});
test('every first-party PDF loader uses the shared policy',()=>{
 for(const name of ['report-viewer.js','profile.js']){
  const script=readFileSync(new URL('../public/'+name,import.meta.url),'utf8');
  assert.match(script,/openPdfDocument\(lib,/);assert.doesNotMatch(script,/lib\.getDocument\(/);
 }
 assert.equal((source.match(/lib\.getDocument\(/g)||[]).length,1);
 assert.match(source,/openPdfDocument\(lib,buf\)/);
});
