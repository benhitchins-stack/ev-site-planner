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

test('comparison lengths agree with perspective references and the existing drawing calculator',()=>{
 const photo={scale:{pxPerM:15,refs:[{mx:0,my:0,ppm:10},{mx:100,my:0,ppm:20}]}},route={pts:[{x:50,y:0},{x:150,y:0}]};
 assert.equal(C.length(route,photo),5);
 const html=readFileSync(new URL('../public/EV Site Planner.html',import.meta.url),'utf8'),context=vm.createContext({});
 vm.runInContext(html.slice(html.indexOf('function parseRouteLength('),html.indexOf('function scaleSpread(')),context);
 assert.equal(C.length(route,photo),context.routeLen(route,photo));
 route.manualLen=7.25;assert.equal(C.length(route,photo),context.routeLen(route,photo));
});

test('dual-gun DC equipment counts both connectors without doubling its cabinet power',()=>{
 const p=make();p.photos[0].items=[{id:'rapid',type:'unit',variant:'dc_rapid',kw:'150'}];
 const q=C.quantities(p);assert.equal(q.chargers,1);assert.equal(q.ports,2);assert.equal(q.ratedKw,150);
});

test('evidence and change labels use plan references and numbered plain names, and the scale is shown in words',()=>{
 const p=make();p.photos[0].items[1].planRef='CP-01';p.photos[0].items.push({id:'t1',type:'route',kind:'trench',manualLen:4,pts:[]},{id:'t2',type:'route',kind:'trench',manualLen:6,pts:[]});
 const f=C.facts(p),label=id=>f.find(x=>x.key==='item:'+id).label;
 assert.equal(label('charger'),'CP-01 · recorded rating (kW)');assert.equal(label('t1'),'Trench 1 · length (m)');assert.equal(label('t2'),'Trench 2 · length (m)');assert.equal(label('cable'),'SWA cable · length (m)');
 const scale=f.find(x=>x.key==='scale:plan');assert.equal(scale.label,'Plan scale');assert.equal(scale.value,10);assert.equal(scale.display,'Set · 1 m = 10 px');
 delete p.photos[0].scale;assert.equal(C.facts(p).find(x=>x.key==='scale:plan').display,'Not set');
 const b=C.clone(p);b.photos[0].items[1].kw='22';assert.match(C.differences(p,b).find(c=>c.kind==='changed').label,/^CP-01 · kw/);
});
test('a new charging day starts from the markup and the recorded supply, with its sources',()=>{
 const p=make(),s=C.ensure(p).simulation;
 assert.equal(s.ports,2);assert.equal(s.portKw,7);assert.equal(s.supplyKw,23);assert.equal(s.baseKw,8);
 assert.deepEqual([s.sources.ports,s.sources.portKw,s.sources.supplyKw,s.sources.baseKw],['markup','markup','site','rule']);
 assert.equal(s.sessions[0].count,2);assert.doesNotThrow(()=>C.simulate(s));
});
test('without a recorded supply the charging day uses the marked fallback and follows a rating recorded later',()=>{
 const p=make();delete p.supplyRating;const s=C.ensure(p).simulation;
 assert.equal(s.supplyKw,46);assert.equal(s.sources.supplyKw,'assumed');assert.equal(C.supplyBasis(p).source,'assumed');
 p.supplyRating='3ph 100 A';assert.equal(C.syncSimulation(p),true);assert.equal(s.supplyKw,23);assert.equal(s.sources.supplyKw,'site');assert.equal(s.baseKw,8);
 s.supplyKw=30;s.sources.supplyKw='edited';p.supplyRating='200 A';C.syncSimulation(p);assert.equal(s.supplyKw,30);assert.equal(s.baseKw,10.5);
});
test('Markup simulator settings carry into an untouched charging day in kW and pounds per kWh',()=>{
 const p=make();delete p.supplyRating;p.photos[0].items=[];p.sim={cars:3,cap:150,base:70,need:30,dlm:0,limit:60,opOnly:0,pDay:26,pNight:13,opS:0.5,opE:5.5};
 p.workspace={planning:{schema:1,simulation:{ports:4,portKw:7,supplyKw:40,baseKw:8,efficiency:90,offPeak:0.18,peak:0.32,peakStart:16,peakEnd:19,sessions:[{id:'x',name:'Workplace vehicles',count:4,arrival:8,departure:17,kwh:20,maxKw:7}]}}};
 const s=C.ensure(p).simulation;
 assert.equal(s.ports,3);assert.equal(s.supplyKw,34.5);assert.equal(s.sources.supplyKw,'simulator');assert.equal(s.baseKw,16.1);assert.equal(s.peak,0.26);assert.equal(s.offPeak,0.13);
 assert.equal(s.peakStart,5.5);assert.equal(s.peakEnd,0.5);assert.equal(s.chargerControl,'uncapped');assert.equal(s.sessions[0].count,3);assert.equal(s.sessions[0].kwh,30);
 assert.deepEqual(p.sim.cars,3,'the saved Markup simulator settings are kept');
 const edited=make();edited.workspace={planning:{schema:1,simulation:{...s,sources:undefined,supplyKw:41}}};delete edited.workspace.planning.simulation.sources;
 assert.equal(C.ensure(edited).simulation.supplyKw,41,'an edited charging day is never replaced');
});
test('uncapped chargers can exceed the supply and report the hours over; load management cannot',()=>{
 const capped=C.simulate(scenario({supplyKw:5}));assert.equal(capped.totals.overSupplyHours,0);assert(capped.totals.peakSiteKw<=5+1e-8);
 const open=C.simulate(scenario({supplyKw:5,chargerControl:'uncapped'}));assert(Math.abs(open.totals.overSupplyHours-1)<1e-8);assert(Math.abs(open.totals.peakSiteKw-10)<1e-8);assert(Math.abs(open.totals.delivered-10)<1e-8);
 assert.throws(()=>C.simulate(scenario({chargerControl:'sometimes'})),/load management/);
});
test('a Markup simulator supply that only echoed the 200 A fallback stays marked as assumed',()=>{
 const p=make();delete p.supplyRating;p.sim={cars:2,cap:200,base:70,need:30,dlm:1,pDay:26,pNight:13,opS:0.5,opE:5.5};
 const s=C.ensure(p).simulation;assert.equal(s.supplyKw,46);assert.equal(s.sources.supplyKw,'assumed');
 const q=make();delete q.supplyRating;q.sim={cars:2,cap:200,capTyped:1};assert.equal(C.ensure(q).simulation.sources.supplyKw,'simulator');
});
