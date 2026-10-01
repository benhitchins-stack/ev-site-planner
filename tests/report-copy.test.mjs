import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source=readFileSync(new URL('../public/EV Site Planner.html',import.meta.url),'utf8');
function block(start,end){return source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));}
function reportContext(){
  const storage=new Map();
  const context=vm.createContext({
    pack:{mode:'domestic',photos:[{items:[{type:'unit',name:'Example charger'}]}]},
    unitDisplayName:u=>u.name,routeLen:i=>i.length,
    loadCheck:()=>({units:1,a1:32,a3:0,cap:0}),hasDlm:()=>false,limiterCount:()=>0,
    allUnitsPenDeclared:()=>false,
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    infoNeedsList:()=>[],TITLE_PLAN_URL:''
  });
  vm.runInContext(block('function designNarrative(){','/* ---------- customer decision pack'),context);
  vm.runInContext(block('const PM_KEY=','/* ---------- review & export modal'),context);
  return context;
}

test('a report distinguishes unrecorded supply capacity from a reviewed design',()=>{
  const c=reportContext();
  const supply=c.designNarrative().find(([title])=>title==='Supply record')[1];
  assert.match(supply,/32 A/);
  assert.match(supply,/capacity has not been recorded/);
  assert.doesNotMatch(supply,/has the headroom|design actively manages|never overloaded/);
  assert.equal(c.pack.photos[0].items.length,1);
});

test('passive charger positions are described separately from the current installation',()=>{
  const c=reportContext();c.pack.photos[0].items.push({type:'unit',provision:'passive',name:'Future charger'});
  const rows=c.designNarrative();
  assert.match(rows.find(([t])=>t==='Proposed charge points')[1],/^1 charge point /);
  assert.match(rows.find(([t])=>t==='Future charger positions')[1],/^1 position is/);
  assert.match(rows.find(([t])=>t==='Future charger positions')[1],/not included in this phase/);
});

test('a DNO reference is reported without treating it as proof of submission',()=>{
  const c=reportContext();c.pack.outcome='dno';
  assert.match(c.genEmail(),/No application reference is recorded/);
  c.pack.dnoRef='REF-123';
  assert.match(c.genEmail(),/Recorded reference: REF-123/);
  assert.match(c.genEmail(),/whether it has been submitted/);
  assert.doesNotMatch(c.genEmail(),/already submitted|I've submitted|We've submitted/);
});

test('updated defaults preserve saved email templates and support resetting a template',()=>{
  const c=reportContext();c.pack.outcome='standard';c.pack.custName='Alex Example';
  c.saveTpl('standard','Subject: Existing template\n\nHi {firstName},\nAgreed customer wording.');
  assert.match(c.genEmail(),/Hi Alex,\nAgreed customer wording/);
  c.saveTpl('standard',null);
  assert.match(c.genEmail(),/proposed EV installation plan/);
});
