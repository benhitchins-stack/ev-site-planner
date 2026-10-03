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
test('the PDF report face is the static Hanken Grotesk build with its OFL licence',()=>{
 const source=readFileSync(new URL('../public/report-fonts.js',import.meta.url),'utf8');
 const fonts=JSON.parse(source.slice(source.indexOf('{'),source.lastIndexOf('}')+1));
 const digests={regular:'315cda587038b4d21cb4899df306fef5c15b34b6b9470352eba9a3dfce72f380',bold:'d4483ef2e26692ea2e491be712b21e0df9cd02c72aea8fa620dd167a337087e8'};
 for(const [key,digest] of Object.entries(digests)){
  const data=Buffer.from(fonts[key],'base64');
  assert.equal(data.readUInt32BE(0),0x00010000,key+' is TrueType outlines, which jsPDF needs');
  assert.equal(createHash('sha256').update(data).digest('hex'),digest,key);
 }
 assert.match(source,/Hanken Grotesk 3\.013/);assert.doesNotMatch(source,/DejaVu/);
 assert.match(readFileSync(new URL('../public/vendor/HankenGrotesk-OFL.txt',import.meta.url),'utf8'),/SIL Open Font License, Version 1\.1/);
 assert(source.length<400000,'report fonts stay small');
});
