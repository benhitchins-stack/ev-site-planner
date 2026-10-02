import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source=readFileSync(new URL('../public/EV Site Planner.html',import.meta.url),'utf8');
const c=vm.createContext({activePhoto:()=>null});
vm.runInContext(source.slice(source.indexOf('function parseRouteLength('),source.indexOf('function scaleRefs(')),c);
test('manual lengths accept finite positive metres, and an empty field clears the override',()=>{
 assert.equal(c.parseRouteLength('12.5'),12.5);assert.equal(c.parseRouteLength(' 2 '),2);
 assert.equal(c.parseRouteLength(''),null);
 for(const value of ['-5','0','Infinity','12m','1.5.5'])assert(Number.isNaN(c.parseRouteLength(value)));
});
test('invalid saved lengths do not produce negative voltage drop or fall back to the photo scale',()=>{
 const p={scale:{pxPerM:10}},pts=[{x:0,y:0},{x:100,y:0}];
 for(const manualLen of [-4,0,Infinity,'bad'])assert.equal(c.routeLen({manualLen,pts},p),null);
 assert.equal(c.routeLen({manualLen:'12.5'},p),12.5);
});
test('scaled measurements reject unusable scales and preserve positive distances',()=>{
 c.pxPerMAt=p=>p.scale.pxPerM;
 const item={pts:[{x:0,y:0},{x:100,y:0}]};
 assert.equal(c.routeLen(item,{scale:{pxPerM:10}}),10);
 for(const scale of [-10,0,Infinity])assert.equal(c.routeLen(item,{scale:{pxPerM:scale}}),null);
});
