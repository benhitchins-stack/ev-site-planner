import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source=readFileSync(new URL('../public/EV Site Planner.html',import.meta.url),'utf8');
const context=vm.createContext({});
vm.runInContext(source.slice(source.indexOf('function validateProjectBackup('),source.indexOf('function normalisePack(')),context);
const validate=context.validateProjectBackup;
const image='data:image/png;base64,aGVsbG8=';
const project=()=>({photos:[{id:'plan-1',name:'Plan',src:image,thumb:image,items:[{id:'route-1',type:'route',kind:'swa',pts:[{x:0,y:0},{x:100,y:100}],manualLen:12.5}]}]});

test('portable current and legacy backups keep ordinary text and optional fields',()=>{
 assert.doesNotThrow(()=>validate({photos:[]}));
 const pk=project();pk.name='Depot <north> & "south"';pk.programme={activities:[{name:'Legacy activity'}]};
 assert.doesNotThrow(()=>validate(pk));
});
test('photo, item and anchor identifiers cannot inject HTML or alter dictionaries',()=>{
 for(const bad of ['x"><img src=x onerror=alert(1)>','__proto__','constructor','prototype','toString','hasOwnProperty','a:b']){
  for(const apply of [p=>p.photos[0].id=bad,p=>p.photos[0].items[0].id=bad,p=>p.photos[0].items[0].pts[0].anchorId=bad]){
   const pk=project();apply(pk);assert.throws(()=>validate(pk),/Invalid project backup/);
  }
 }
});
test('embedded image attributes and non-portable image URLs are rejected',()=>{
 for(const bad of ['x" onerror="alert(1)','https://example.com/track.png','javascript:alert(1)','data:image/png;base64,x" onerror="alert(1)']){
  for(const key of ['src','srcOrig','thumb']){const pk=project();pk.photos[0][key]=bad;assert.throws(()=>validate(pk),/Invalid project backup/);}
  const pk=project();pk.photos[0].items[0].ph1=bad;assert.throws(()=>validate(pk),/Invalid project backup/);
 }
});
test('prototype keys cannot enter imported records through JSON',()=>{
 for(const key of ['__proto__','constructor','prototype']){
  const pk=JSON.parse('{"photos":[],"workspace":{"'+key+'":{"polluted":true}}}');
  assert.throws(()=>validate(pk),/Invalid project backup/);
 }
 assert.equal({}.polluted,undefined);
});
test('programme and attachment IDs are unique, while missing legacy IDs are accepted',()=>{
 const pk=project();pk.programme={activities:[{id:'a',name:'One'},{id:'a',name:'Two'}]};
 assert.throws(()=>validate(pk),/Invalid project backup/);
 pk.programme.activities=[{name:'One'},{name:'Two'}];assert.doesNotThrow(()=>validate(pk));
 pk.attachments=[{id:'a'},{id:'a'}];assert.throws(()=>validate(pk),/Invalid project backup/);
});
test('invalid manual lengths and negative scales cannot enter calculation data',()=>{
 for(const value of [-1,0,'-2','Infinity','12 metres',{},true]){
  const pk=project();pk.photos[0].items[0].manualLen=value;
  // Booleans and objects are not lengths, even if JavaScript can coerce them.
  assert.throws(()=>validate(pk),/Invalid project backup/);
 }
 const pk=project();pk.photos[0].scale={pxPerM:-10};assert.throws(()=>validate(pk),/Invalid project backup/);
});
