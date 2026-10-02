import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const folder=new URL('../public/vendor/pdfjs/',import.meta.url);
test('every vendored PDF.js file matches the verified upstream archive manifest',()=>{
 const manifest=JSON.parse(readFileSync(new URL('manifest.json',folder)));
 assert.equal(manifest.version,'6.3.289');assert.equal(manifest.archiveSha256,'51683fac4aff7dd31ed91e9ab735a2098a78d50899d1ec529aed6dc8aa19400d');
 assert(manifest.files.some(f=>f.path==='build/pdf.worker.mjs'));assert(manifest.files.some(f=>f.path.startsWith('wasm/')));assert(manifest.files.some(f=>f.path.startsWith('cmaps/')));
 for(const f of manifest.files){const data=readFileSync(new URL(f.path,folder));assert.equal(data.length,f.bytes,f.path);assert.equal(createHash('sha256').update(data).digest('hex'),f.sha256,f.path);}
 assert.equal(existsSync(new URL('../public/vendor/pdf.min.js',import.meta.url)),false);
 assert.equal(existsSync(new URL('../public/vendor/pdf.worker.min.js',import.meta.url)),false);
});
