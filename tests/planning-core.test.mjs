import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
import '../public/planning-core.js';
const C=globalThis.EVPlanningCore;
const make=()=>({name:'Site',projId:'project',address:'Example address',earthing:'TN-S',supplyRating:'100 A',ze:'0.3',photos:[{id:'plan',name:'Plan',src:'data:image/png;base64,aW1hZ2U=',thumb:'data:image/png;base64,aW1hZ2U=',imgW:100,imgH:100,scale:{pxPerM:10},items:[{id:'supply',type:'cutout',x:0,y:0},{id:'charger',type:'unit',variant:'twin_ped',kw:'7',x:50,y:50},{id:'cable',type:'route',kind:'swa',pts:[{x:0,y:0,anchorId:'supply'},{x:30,y:40,anchorId:'charger'}]},{id:'duct',type:'route',kind:'duct',manualLen:12,pts:[{x:0,y:0},{x:10,y:0}]}]}],active:'plan'});
test('route quantities respect calibration, explicit measurements, future positions and design alternatives',()=>{
 const p=make();p.photos[0].items.push({id:'future',type:'unit',kw:'22',provision:'passive'},{id:'option-b',type:'unit',kw:'22',option:'B'});p.optionView='A';
 assert.deepEqual(C.quantities(p),{chargers:1,ports:2,passive:1,ratedKw:14,cable:5,trench:0,duct:12,unknown:0,unknownPower:0});
 delete p.photos[0].scale;assert.equal(C.quantities(p).unknown,1);assert.equal(C.quantities(p).duct,12);
});
test('partial cost totals retain missing inputs instead of treating them as priced',()=>{
 const p=make(),a=C.cost(p,{charger:1000,cable:10,duct:''});assert.equal(a.total,1050);assert.equal(a.complete,false);assert.deepEqual(a.missing,['duct']);
 assert.equal(C.cost(p,{charger:1000,cable:10,duct:5}).total,1110);
});
test('snapshots are immutable, deduplicate media and do not recursively copy history',()=>{
 const p=make(),a=C.capture(p,{name:'A'});p.name='Later';p.photos[0].items[1].kw='22';const b=C.capture(p,{name:'B'});
 assert.equal(Object.keys(C.ensure(p).assets).length,1);
 const old=C.hydrate(a.snapshot,C.ensure(p).assets);assert.equal(old.name,'Site');assert.equal(old.photos[0].items[1].kw,'7');
 assert.equal(old.workspace.planning.revisions,undefined);assert.notEqual(a.id,b.id);
});
test('snapshot backups round-trip with media and restore as a separate project',()=>{
 const p=make();C.capture(p,{name:'Quote A'});const copied=JSON.parse(JSON.stringify(p)),r=C.restore(copied,copied.workspace.planning.revisions[0]);
 assert.notEqual(r.projId,p.projId);assert.equal(r.photos[0].src,p.photos[0].src);assert.match(r.name,/Quote A/);assert.equal(r.workspace.planning.revisions.length,1);
});
test('missing snapshot assets and dangerous keys are rejected',()=>{
 assert.throws(()=>C.hydrate({src:{$asset:'missing'}},{}),/missing/);
 assert.throws(()=>C.hydrate(JSON.parse('{"__proto__":{"bad":true}}'),{}),/Invalid/);
});
test('asset pruning retains media referenced by either an option or revision',()=>{
 const p=make();C.capture(p,{name:'A'});p.photos[0].src='data:image/png;base64,bmV3';C.capture(p,{name:'B',kind:'option'});
 const l=C.ensure(p);l.revisions=[];C.pruneAssets(l);assert.equal(Object.keys(l.assets).length,2);l.options=[];C.pruneAssets(l);assert.equal(Object.keys(l.assets).length,0);
});
test('measured evidence needs an existing value, source, person and date',()=>{
 const p=make();assert.equal(C.facts(p).find(f=>f.key==='item:cable').status,'assumed');
 assert.throws(()=>C.recordEvidence(p,'item:cable',{status:'measured',source:'',by:'A',date:'2026-10-02'}),/needs/);
 C.recordEvidence(p,'item:cable',{status:'measured',source:'Laser measurement 12',by:'Surveyor',date:'2026-10-02'});
 assert.equal(C.facts(p).find(f=>f.key==='item:cable').status,'measured');
});
test('changed measurements invalidate recorded evidence and explicit missing evidence stays visible',()=>{
 const p=make();C.recordEvidence(p,'item:cable',{status:'measured',source:'Laser',by:'A',date:'2026-10-02'});p.photos[0].scale.pxPerM=5;
 const f=C.facts(p).find(f=>f.key==='item:cable');assert.equal(f.status,'assumed');assert.equal(f.stale,true);
 C.recordEvidence(p,'item:cable',{status:'missing',source:'',by:'',date:''});assert.equal(C.facts(p).find(f=>f.key==='item:cable').status,'missing');
});
test('change impact finds added, removed and changed geometry plus connected circuits',()=>{
 const a=make(),b=C.clone(a);b.photos[0].items[1].kw='22';b.photos[0].items=b.photos[0].items.filter(i=>i.id!=='duct');b.photos[0].items.push({id:'new',type:'unit',kw:'7'});
 const changes=C.differences(a,b);assert.equal(changes.filter(c=>c.kind==='changed').length,1);assert.equal(changes.filter(c=>c.kind==='removed').length,1);assert.equal(changes.filter(c=>c.kind==='added').length,1);
 assert.deepEqual(C.affectedCircuits(a,b).map(r=>r.id),['cable']);assert.deepEqual(C.differences(a,C.clone(a)),[]);
});
test('upstream site and scale changes require circuit recalculation',()=>{
 const a=make(),b=C.clone(a);b.earthing='TT';assert.equal(C.affectedCircuits(a,b).length,1);
 b.earthing=a.earthing;b.photos[0].scale.pxPerM=20;assert.equal(C.affectedCircuits(a,b).length,1);
});
const scenario=overrides=>({ports:1,portKw:10,supplyKw:10,baseKw:0,efficiency:100,offPeak:1,peak:1,peakStart:16,peakEnd:19,sessions:[{id:'a',name:'A',count:1,arrival:8,departure:10,kwh:10,maxKw:10}],...overrides});
test('charging conserves energy and tariff cost',()=>{
 const r=C.simulate(scenario());assert(Math.abs(r.totals.delivered-10)<1e-8);assert(Math.abs(r.totals.gridKwh-10)<1e-8);assert(Math.abs(r.totals.cost-10)<1e-8);assert.equal(r.totals.unserved,0);
 assert(r.series.every(x=>x.gridKw<=x.availableKw+1e-8));
});
test('queued vehicles use released ports and retain their waiting time',()=>{
 const s=scenario();s.sessions[0].count=2;const r=C.simulate(s);
 assert(Math.abs(r.totals.delivered-20)<1e-8);assert.equal(r.sessions[1].queuedMinutes,60);assert.equal(r.totals.unserved,0);
});
test('constrained supply reports shortfalls and never exceeds the power budget',()=>{
 const s=scenario({ports:2,supplyKw:8,baseKw:2});s.sessions[0].count=2;const r=C.simulate(s);
 assert(Math.abs(r.totals.delivered-12)<1e-8);assert(Math.abs(r.totals.shortfall-8)<1e-8);assert.equal(r.totals.unserved,2);assert(r.series.every(x=>x.gridKw<=6+1e-8));
});
test('efficiency applies to battery energy, with grid tariff applied before losses',()=>{
 const s=scenario({efficiency:80});const r=C.simulate(s);assert(Math.abs(r.totals.delivered-10)<1e-8);assert(Math.abs(r.totals.gridKwh-12.5)<1e-8);assert(Math.abs(r.totals.cost-12.5)<1e-8);
});
test('overnight arrivals and overnight peak tariffs use the next day correctly',()=>{
 const s=scenario({peak:2,offPeak:1,peakStart:22,peakEnd:6});s.sessions[0]={id:'night',name:'Night',count:1,arrival:23,departure:1,kwh:20,maxKw:10};
 const r=C.simulate(s);assert.equal(r.horizon,25);assert(Math.abs(r.totals.delivered-20)<1e-8);assert(Math.abs(r.totals.cost-40)<1e-8);
});
test('invalid simulation inputs fail explicitly, including impossible times and excessive groups',()=>{
 for(const [key,value]of [['ports',0],['efficiency',101],['portKw',NaN],['supplyKw',-1]])assert.throws(()=>C.simulate(scenario({[key]:value})));
 const s=scenario();s.sessions[0].arrival=8.01;assert.throws(()=>C.simulate(s),/five-minute/);s.sessions[0].arrival=10;assert.throws(()=>C.simulate(s),/differ/);
});
test('zero spare supply produces a shortfall without NaN or negative power',()=>{
 const r=C.simulate(scenario({baseKw:20}));assert.equal(r.totals.delivered,0);assert.equal(r.totals.shortfall,10);assert.equal(r.totals.cost,0);assert(r.series.every(x=>x.gridKw===0));
});
test('expansion phases filter snapshots without modifying current geometry',()=>{
 const p=make(),l=C.ensure(p);l.assignments.charger='future';const before=JSON.stringify(p);
 assert.equal(C.quantities(C.phasePack(p,0)).chargers,0);assert.equal(C.quantities(C.phasePack(p,1)).chargers,1);assert.equal(JSON.stringify(p),before);
});
test('planning backup validation rejects unsupported schemas, duplicate revisions and dangling phases',()=>{
 const p=make(),l=C.ensure(p);C.validate(l);l.schema=2;assert.throws(()=>C.validate(l));l.schema=1;C.capture(p,{name:'A'});l.revisions.push(C.clone(l.revisions[0]));assert.throws(()=>C.validate(l));l.revisions.pop();l.assignments.charger='missing';assert.throws(()=>C.validate(l));
});

test('complete backup validation checks hydrated revision contents and rejects unsafe hidden media',()=>{
 const html=readFileSync(new URL('../public/EV Site Planner.html',import.meta.url),'utf8'),context=vm.createContext({EVPlanningCore:C});
 vm.runInContext(html.slice(html.indexOf('function validateProjectBackup('),html.indexOf('function normalisePack(')),context);
 const p=make();C.capture(p,{name:'Portable revision'});assert.doesNotThrow(()=>context.validateProjectBackup(p));
 const revision=p.workspace.planning.revisions[0];revision.snapshot.photos[0].src='https://invalid.example/tracking.png';
 assert.throws(()=>context.validateProjectBackup(p),/Invalid project backup/);
});
test('snapshot validation rejects missing assets and recursive revision histories',()=>{
 const html=readFileSync(new URL('../public/EV Site Planner.html',import.meta.url),'utf8'),context=vm.createContext({EVPlanningCore:C});
 vm.runInContext(html.slice(html.indexOf('function validateProjectBackup('),html.indexOf('function normalisePack(')),context);
 const p=make();C.capture(p,{name:'A'});const r=p.workspace.planning.revisions[0];r.snapshot.photos[0].src={$asset:'absent'};assert.throws(()=>context.validateProjectBackup(p),/missing/);
 const q=make();C.capture(q,{name:'A'});const nested=make();C.capture(nested,{name:'nested'});q.workspace.planning.revisions[0].snapshot.workspace.planning.revisions=nested.workspace.planning.revisions;Object.assign(q.workspace.planning.assets,nested.workspace.planning.assets);
 assert.throws(()=>context.validateProjectBackup(q),/Invalid project backup/);
});

test('impact detects plan captions, moved equipment and report branding changes',()=>{
 const a=make(),b=C.clone(a);b.photos[0].caption='New survey note';b.brandLogo='data:image/png;base64,bG9nbw==';b.workspace={authorProfile:{company:'New company'}};
 const moved=b.photos[0].items.splice(1,1)[0];b.photos.push({id:'second',name:'Second plan',items:[moved]});
 const changes=C.differences(a,b);assert(changes.some(c=>c.kind==='plan'));assert(changes.some(c=>c.kind==='moved'&&c.target.itemId==='charger'));assert(changes.filter(c=>c.kind==='branding').length>=2);
});
