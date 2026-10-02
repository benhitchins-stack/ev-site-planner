// Verify the published bytes, HTTPS redirect and local PDF worker after Pages deploys.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {lookup} from 'node:dns/promises';
const origin=new URL(process.env.EVSP_LIVE_URL||'https://ev-site-planner.co.uk/');
assert.equal(origin.protocol,'https:');
const hash=data=>createHash('sha256').update(data).digest('hex');
const expected=await readFile(new URL('../public/index.html',import.meta.url));
console.log('DNS resolves:',(await lookup(origin.hostname,{all:true})).map(x=>x.address).join(', '));
let html,last;
for(let attempt=0;attempt<12;attempt++){
 try{
  const response=await fetch(origin,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)});
  assert(response.ok,'Home page HTTP '+response.status);assert.equal(new URL(response.url).protocol,'https:');
  const bytes=Buffer.from(await response.arrayBuffer());assert.equal(hash(bytes),hash(expected),'The deployed home page has not reached the expected version yet');
  html=bytes.toString('utf8');console.log('Published HTML matches the release; cache header:',response.headers.get('cache-control'));break;
 }catch(error){last=error;if(attempt<11)await new Promise(resolve=>setTimeout(resolve,15000));}
}
if(!html)throw last;
const http=new URL(origin);http.protocol='http:';
const redirect=await fetch(http,{redirect:'manual',signal:AbortSignal.timeout(20000)});
assert([301,302,307,308].includes(redirect.status),'HTTP must redirect to HTTPS');
assert.equal(new URL(redirect.headers.get('location'),http).protocol,'https:');
const resources=[...html.matchAll(/(?:src|href)="((?:planning-core|project-store|planning|workspace)\.(?:js|css)\?v=[a-f0-9]+)"/g)].map(m=>m[1]);
resources.push('vendor/pdfjs/build/pdf.mjs?v=6.3.289','vendor/pdfjs/build/pdf.worker.mjs?v=6.3.289');
for(const resource of new Set(resources)){
 const response=await fetch(new URL(resource,origin),{signal:AbortSignal.timeout(20000)});assert(response.ok,resource+' HTTP '+response.status);
 assert.match(response.headers.get('content-type')||'',resource.split('?')[0].endsWith('.css')?/text\/css/:/(?:javascript|ecmascript)/);
 const bytes=Buffer.from(await response.arrayBuffer()),local=await readFile(new URL('../public/'+resource.split('?')[0],import.meta.url));assert.equal(hash(bytes),hash(local),resource+' matches the release');
}
console.log('Verified HTTPS, HTTP redirect, release HTML and '+new Set(resources).size+' deployed script/style resources.');
