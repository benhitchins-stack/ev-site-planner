import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source=readFileSync(new URL('../public/EV Site Planner.html',import.meta.url),'utf8');
function calculator(){
 const c=vm.createContext({pack:{photos:[],earthing:'TN-S',ze:'0.3'},optVisible:i=>i.option!=='hidden',routeLen:i=>i.length??null,routeDisplayName:i=>i.id});
 vm.runInContext(source.slice(source.indexOf('const CC_R20='),source.indexOf('function cableCheckData()'))+'\nthis.families=CC_FAMS;',c);
 return c;
}
function connected(c,units){
 const supply={id:'s',type:'cutout'},board={id:'b',type:'evdb'};
 const edge=(id,a,b)=>({id,type:'route',kind:'swa',pts:[{anchorId:a},{anchorId:b}],length:20});
 const target=edge('main','s','b');c.pack.photos=[{items:[supply,board,target,...units,...units.map(u=>edge('to-'+u.id,'b',u.id))]}];return target;
}
test('detected circuit load honours recorded caps and excludes future and hidden chargers',()=>{
 const c=calculator(),target=connected(c,[{id:'active',type:'unit',variant:'twin_ped',kw:'22',maxA:20},{id:'future',type:'unit',variant:'twin_ped',kw:'22',provision:'passive'},{id:'hidden',type:'unit',kw:'7',option:'hidden'}]);
 const load=c.ccDetectLoad(target);assert.equal(load.amps,40);assert.equal(load.n,2);assert.equal(load.ph,3);
});
test('lamp and 11 kW circuit loads agree with the configured socket ratings',()=>{
 const c=calculator();let target=connected(c,[{id:'lamp',type:'unit',variant:'lamp_fsm',kw:'5.5'}]);assert.equal(c.ccDetectLoad(target).amps,25);
 target=connected(c,[{id:'eleven',type:'unit',variant:'solo',kw:'11',maxA:32}]);assert.equal(c.ccDetectLoad(target).amps,16);
 target=connected(c,[{id:'future',type:'unit',kw:'7',provision:'passive'}]);assert.equal(c.ccDetectLoad(target),null);
});
test('cable calculations retain missing lengths and scale voltage drop with route length',()=>{
 const c=calculator();let checked=0;
 for(const [family,F] of Object.entries(c.families))for(const size of F.sizes)for(const [method] of F.methods)for(const phase of [1,3]){
  const item={id:'test',type:'route',kind:'run',ccFam:family,vdCsa:size,ccMeth:method,vdPh:phase,vdAmps:16,pts:[]};
  const missing=c.fullCalc(item,{}, {nosuggest:true});assert.equal(missing.vd.v,null);assert.equal(missing.checks.find(x=>x.k==='vd').ok,null);
  item.length=10;const a=c.fullCalc(item,{}, {nosuggest:true});item.length=20;const b=c.fullCalc(item,{}, {nosuggest:true});
  assert(Number.isFinite(a.vd.v));assert(Math.abs(b.vd.v-2*a.vd.v)<1e-10);assert(Math.abs(b.vd.pct-b.vd.v/b.vd.base*100)<1e-10);checked++;
 }
 assert(checked>100);
});

test('known missing upstream cable data keeps earth-fault and CPC checks incomplete',()=>{
 const c=calculator(),supply={id:'s',type:'cutout'},board={id:'b',type:'evdb'},unit={id:'u',type:'unit'};
 const upstream={id:'upstream',type:'route',kind:'swa',pts:[{anchorId:'s'},{anchorId:'b'}]};
 const target={id:'final',type:'route',kind:'swa',length:10,vdCsa:6,vdAmps:16,pts:[{anchorId:'b'},{anchorId:'u'}]};
 c.pack.photos=[{items:[supply,board,unit,upstream,target]}];
 let result=c.fullCalc(target,{}, {nosuggest:true});
 assert.equal(result.zs.up.incomplete,true);assert.equal(result.zs.v,null);
 assert.equal(result.checks.find(x=>x.k==='zs').ok,null);assert.equal(result.checks.find(x=>x.k==='ad').ok,null);
 assert.equal(result.overall,'nolen');
 upstream.length=10;result=c.fullCalc(target,{}, {nosuggest:true});
 assert.equal(result.zs.up.incomplete,false);assert(Number.isFinite(result.zs.v));
});
test('a TT electrode value alone does not certify CPC disconnection performance',()=>{
 const c=calculator();c.pack.earthing='TT';c.pack.ra='100';
 const result=c.fullCalc({id:'test',kind:'swa',length:10,vdCsa:6,vdAmps:16,pts:[]},{},{nosuggest:true});
 assert.equal(result.checks.find(x=>x.k==='zs').ok,true);
 assert.equal(result.checks.find(x=>x.k==='ad').ok,null);
 assert.equal(result.overall,'nolen');
});
