import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source=readFileSync(new URL('../public/EV Site Planner.html',import.meta.url),'utf8');
function harness(){
 const requests=[],timers=new Map();let timerId=0;
 const c=vm.createContext({pack:{postcode:'',address:''},document:{activeElement:null},syncSiteChip(){},autosave(){},esc:String,
  setTimeout(fn){timers.set(++timerId,fn);return timerId;},clearTimeout(id){timers.delete(id);},
  fetch(url){return new Promise(resolve=>requests.push({url,respond:result=>resolve({json:async()=>({result})})}));}
 });
 vm.runInContext(source.slice(source.indexOf('function attachPostcodeLookup('),source.indexOf('(function(){',source.indexOf('function postcodePicked('))),c);
 return {c,requests,tick(){const list=[...timers.values()];timers.clear();list.forEach(fn=>fn());}};
}
const settled=async()=>{for(let n=0;n<8;n++)await Promise.resolve();};

test('clearing a postcode query invalidates an already pending autocomplete response',async()=>{
 const {c,requests,tick}=harness(),listeners={};
 const input={value:'SW1',addEventListener:(key,fn)=>listeners[key]=fn};
 const suggestions={style:{},innerHTML:'',querySelectorAll:()=>[]};
 c.attachPostcodeLookup(input,suggestions,()=>{});listeners.input();tick();
 input.value='';listeners.input();requests[0].respond(['SW1A 1AA']);await settled();
 assert.equal(suggestions.style.display,'none');assert.equal(suggestions.innerHTML,'');
});
test('typing a new query invalidates old results before the next debounce fires',async()=>{
 const {c,requests,tick}=harness(),listeners={};
 const input={value:'SW1',addEventListener:(key,fn)=>listeners[key]=fn};
 const suggestions={style:{display:'none'},innerHTML:'',querySelectorAll:()=>[]};
 c.attachPostcodeLookup(input,suggestions,()=>{});listeners.input();tick();
 input.value='EC1';listeners.input();requests[0].respond(['SW1A 1AA']);await settled();
 assert.equal(suggestions.innerHTML,'');
 tick();requests[1].respond(['EC1A 1BB']);await settled();assert.match(suggestions.innerHTML,/EC1A 1BB/);
});
test('a postcode response cannot add an address to a different project',async()=>{
 const {c,requests}=harness(),previous=c.pack;
 c.postcodePicked('SW1A 1AA');c.pack={postcode:'',address:''};
 requests[0].respond({admin_ward:'Old ward',admin_district:'Old district'});await settled();
 assert.equal(c.pack.address,'');assert.equal(previous.address,'');
});
test('only the latest selected postcode can fill an empty address',async()=>{
 const {c,requests}=harness();c.postcodePicked('SW1A 1AA');c.postcodePicked('EC1A 1BB');
 requests[0].respond({admin_ward:'Old ward'});await settled();assert.equal(c.pack.address,'');
 requests[1].respond({admin_ward:'Current ward',admin_district:'Current district'});await settled();
 assert.equal(c.pack.address,'Current ward, Current district');
});
