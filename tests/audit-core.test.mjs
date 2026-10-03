import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
import '../public/audit-core.js';
const C=globalThis.EVAuditCore;
const image='data:image/jpeg;base64,aW1hZ2U=';
const planner=readFileSync(new URL('../public/EV Site Planner.html',import.meta.url),'utf8');

test('the first release carries the 23 PAS 1899 and PCPR 2023 checks with the fields the page and pack need',()=>{
 assert.equal(C.CHECKS.length,23);
 assert.equal(C.CHECKS.filter(c=>c.section==='access').length,14);
 assert.equal(C.CHECKS.filter(c=>c.section==='payment').length,9);
 assert.equal(new Set(C.CHECKS.map(c=>c.id)).size,23);
 for(const c of C.CHECKS){
  assert.ok(['site','unit'].includes(c.scope),c.id+' has a scope');
  assert.ok(['critical','high','medium'].includes(c.sev),c.id+' has a severity');
  for(const k of ['title','why','cite','fix','cost'])assert.ok(String(c[k]||'').trim(),c.id+' has '+k);
  assert.ok(c.applies.length&&c.applies.every(t=>C.siteType(t)),c.id+' applies to known site types');
  if(c.measure)for(const k of ['label','unit','limit'])assert.ok(c.measure[k],c.id+' measurement has '+k);
 }
 // Copy rules: UK English, no em dashes or en dashes in anything shown on screen or printed.
 assert.doesNotMatch(readFileSync(new URL('../public/audit-core.js',import.meta.url),'utf8'),/[–—]/);
 assert.doesNotMatch(readFileSync(new URL('../public/audit.js',import.meta.url),'utf8'),/[–—]|seamless|robust|leverage/i);
});

test('site type and public access decide which checks apply, and excluded checks keep a reason',()=>{
 const a=C.create({kind:'audit'});
 assert.equal(C.slots(a).length,23,'every check is listed until the site type is chosen');
 a.siteType='lamppost';a.isPublic=true;
 const ids=C.slots(a).map(r=>r.key);
 assert.ok(!ids.includes('ACC-07:cp1'),'bay dimension check is for car parks and rapid hubs');
 assert.ok(!ids.includes('PAY-07'),'rapid reliability duty is for rapid hubs');
 assert.ok(ids.includes('PAY-05'),'roaming applies to every public site');
 assert.ok(C.excluded(a).every(x=>x.reason.length>10));
 a.siteType='depot';a.isPublic=false;
 assert.deepEqual(C.slots(a).map(r=>r.check.id),['ACC-01','ACC-02','ACC-03','ACC-04','ACC-08','ACC-11','ACC-13']);
 assert.match(C.excludedReason(C.check('PAY-01'),a),/public chargepoints only/);
});

test('chargepoint checks are answered once per chargepoint and answers copy to units without one',()=>{
 const a=C.create({kind:'audit'});a.siteType='rapid';a.isPublic=true;
 a.units.push(C.nextUnit(a));a.units.push(C.nextUnit(a));
 assert.deepEqual(a.units.map(u=>u.id),['cp1','cp2','cp3']);
 const s=C.summary(a);
 assert.equal(s.total,C.CHECKS.filter(c=>c.scope==='site'&&c.applies.includes('rapid')).length+3*C.CHECKS.filter(c=>c.scope==='unit'&&c.applies.includes('rapid')).length);
 Object.assign(C.answerFor(a,'ACC-02:cp1'),{outcome:'fail',note:'Reader at 1,350 mm',measure:'1350'});
 Object.assign(C.answerFor(a,'ACC-03:cp1'),{outcome:'pass'});
 Object.assign(C.answerFor(a,'ACC-03:cp2'),{outcome:'na',reason:'Already answered'});
 assert.equal(C.copyAnswers(a,'cp1','cp2'),1,'an answered target is left alone');
 assert.equal(C.answer(a,'ACC-02:cp2').note,'Reader at 1,350 mm');
 assert.equal(C.answer(a,'ACC-03:cp2').outcome,'na');
 assert.equal(C.copyAnswers(a,'cp1','cp1'),0);
 assert.deepEqual(C.findings(a).map(f=>f.key),['ACC-02:cp1','ACC-02:cp2']);
 C.removeUnit(a,'cp2');
 assert.equal(Object.keys(a.answers).some(k=>k.endsWith(':cp2')),false,'removing a chargepoint removes its answers');
 assert.throws(()=>{C.removeUnit(a,'cp1');C.removeUnit(a,'cp3');},/at least one chargepoint/);
});

test('summaries, index rows and gaps describe what the pack still needs',()=>{
 const a=C.create({kind:'audit',auditor:'A Surveyor'});a.siteType='carpark';a.isPublic=true;
 const first=C.summary(a);assert.equal(first.done,0);assert.equal(first.pct,0);
 Object.assign(C.answerFor(a,'PAY-01'),{outcome:'pass'});
 Object.assign(C.answerFor(a,'ACC-07:cp1'),{outcome:'fail'});
 Object.assign(C.answerFor(a,'ACC-06'),{outcome:'na'});
 const s=C.summary(a);
 assert.equal(s.done,3);assert.equal(s.fail,1);assert.equal(s.na,1);assert.equal(s.todo,s.total-3);
 assert.deepEqual(C.indexSummary(a),{kind:'audit',siteType:'carpark',done:3,total:s.total,fail:1,action:0});
 const gaps=C.gaps(a,{name:''});
 assert.ok(gaps.some(g=>/Site name is missing/.test(g)));
 assert.ok(gaps.some(g=>/1 finding has no note/.test(g)));
 assert.ok(gaps.some(g=>/1 fail has no photo/.test(g)));
 assert.ok(gaps.some(g=>/1 not applicable answer has no reason/.test(g)));
 assert.ok(gaps.some(g=>/no measurement/.test(g)));
 assert.ok(gaps.some(g=>/confirm against your copy of PAS 1899/.test(g)));
 assert.equal(C.indexSummary({kind:'project'}).total,11,'a record with no chargepoints still summarises its site checks');
 assert.equal(C.indexSummary(null),null);
});

test('ensure repairs a damaged record in place without dropping unknown fields',()=>{
 const a=C.ensure({kind:'other',siteType:'moon',isPublic:'yes',units:'none',answers:[],extra:{keep:true},operator:42});
 assert.equal(a.kind,'project');assert.equal(a.siteType,'');assert.equal(a.isPublic,null);
 assert.deepEqual(a.units.map(u=>u.id),['cp1']);assert.deepEqual(a.answers,{});assert.equal(a.operator,'42');assert.deepEqual(a.extra,{keep:true});
 assert.throws(()=>C.ensure(null),/Invalid site audit/);
});

test('backup validation accepts complete records and rejects shapes the page cannot show',()=>{
 const good=C.create({kind:'audit'});good.siteType='pillar';good.isPublic=true;
 Object.assign(C.answerFor(good,'ACC-02:cp1'),{outcome:'fail',note:'Too high',measure:'1300',photos:[{id:'p1',src:image,name:'reader.jpg',at:'2026-10-03T09:00:00.000Z'}]});
 assert.doesNotThrow(()=>C.validate(JSON.parse(JSON.stringify(good))));
 assert.doesNotThrow(()=>C.validate({}),'an older or minimal record is fine');
 const bad=[
  JSON.parse('{"answers":{"__proto__":{"outcome":"pass"}}}'),
  JSON.parse('{"units":[{"id":"__proto__"}]}'),
  {units:[{id:'cp1'},{id:'cp1'}]},
  {units:[{id:'bad id'}]},
  {answers:{'ACC-02:cp1':{outcome:'maybe'}}},
  {answers:{'ACC-02:cp1':{photos:[{src:'https://example.com/x.jpg'}]}}},
  {answers:{'ACC-02:cp1':{photos:[{src:'data:image/png;base64,x" onerror="alert(1)'}]}}},
  {answers:{'ACC-02:cp1':{photos:Array.from({length:9},()=>({src:image}))}}},
  {answers:{'ACC-02:cp1':{note:'x'.repeat(4001)}}},
  {answers:{'not a key':{outcome:'pass'}}},
  {siteType:'moon'},
  {isPublic:'yes'},
  {schema:2},
  []
 ];
 for(const record of bad)assert.throws(()=>C.validate(record),/Invalid site audit/,JSON.stringify(record).slice(0,80));
 assert.equal({}.outcome,undefined);
});

test('the planner validates, keeps and counts the audit inside project backups',()=>{
 const context=vm.createContext({EVAuditCore:C});
 vm.runInContext(planner.slice(planner.indexOf('function validateProjectBackup('),planner.indexOf('function normalisePack(')),context);
 const project=()=>({photos:[],audit:JSON.parse(JSON.stringify(C.create({kind:'audit'})))});
 assert.doesNotThrow(()=>context.validateProjectBackup(project()));
 assert.doesNotThrow(()=>context.validateProjectBackup({photos:[]}),'projects saved before the audit existed still import');
 const broken=project();broken.audit.answers={'ACC-02:cp1':{outcome:'maybe'}};
 assert.throws(()=>context.validateProjectBackup(broken),/Invalid project backup/);
 const list=project();list.audit=[];
 assert.throws(()=>context.validateProjectBackup(list),/Invalid project backup/);
 const helpers=vm.createContext({Object,Array,String,Boolean,Number});
 vm.runInContext(planner.slice(planner.indexOf('const MEANINGFUL_PROJECT_TEXT_FIELDS='),planner.indexOf('function serialisablePack()')),helpers);
 const empty={mode:'commercial',photos:[],attachments:[],compliance:[],complianceNA:[],programme:{start:'',days:{},skip:{}},cdm:{docs:{},risks:[]}};
 assert.equal(helpers.hasMeaningfulPackContent({...empty,audit:C.create({kind:'audit'})}),false,'a bare audit shell is not saved as a project');
 assert.equal(helpers.hasMeaningfulPackContent({...empty,audit:{...C.create({kind:'audit'}),siteType:'carpark'}}),true);
 assert.equal(helpers.hasMeaningfulPackContent({...empty,audit:{...C.create({kind:'audit'}),answers:{'PAY-01':{outcome:'pass'}}}}),true);
 assert.match(planner,/audit=EVAuditCore\.indexSummary\(pack\.audit\)/,'project list rows carry the audit summary');
});
