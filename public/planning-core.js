/* Pure planning models shared by the browser and regression checks. */
(function(root){
'use strict';
const clone=value=>JSON.parse(JSON.stringify(value));
const record=v=>v&&typeof v==='object'&&!Array.isArray(v);
const finite=(v,min=0,max=Infinity)=>v!==''&&v!=null&&Number.isFinite(Number(v))&&Number(v)>=min&&Number(v)<=max;
const stable=v=>JSON.stringify(v,(_,x)=>record(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
const id=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now().toString(36);
const rows=pack=>(pack.photos||[]).flatMap(photo=>(photo.items||[]).map(item=>({photo,item})));
const visible=(pack,item)=>!item.option||!pack.optionView||pack.optionView==='all'||item.option===pack.optionView;
function length(item,photo){
 if(item.manualLen!=null)return finite(item.manualLen,Number.MIN_VALUE)?Number(item.manualLen):null;
 if(!finite(photo?.scale?.pxPerM,Number.MIN_VALUE)||!Array.isArray(item.pts)||item.pts.length<2)return null;
 let pixels=0;for(let n=1;n<item.pts.length;n++){const a=item.pts[n-1],b=item.pts[n];if(![a.x,a.y,b.x,b.y].every(Number.isFinite))return null;pixels+=Math.hypot(b.x-a.x,b.y-a.y);}
 return pixels>0?pixels/Number(photo.scale.pxPerM):null;
}
function ensure(pack){
 pack.workspace=record(pack.workspace)?pack.workspace:{};
 let lab=pack.workspace.planning;
 if(!record(lab))lab=pack.workspace.planning={schema:1};
 if(lab.schema!=null&&lab.schema!==1)throw Error('This planning record uses a newer schema. Keep the original backup.');
 lab.schema=1;
 for(const key of ['evidence','assets','assignments','reviews'])if(!record(lab[key]))lab[key]={};
 for(const key of ['options','revisions'])if(!Array.isArray(lab[key]))lab[key]=[];
 if(!Array.isArray(lab.phases)||!lab.phases.length)lab.phases=[{id:'now',name:'Initial installation',date:'',capacityKw:''},{id:'future',name:'Future expansion',date:'',capacityKw:''}];
 if(!record(lab.costs))lab.costs={charger:'',cable:'',trench:'',duct:''};
 if(!record(lab.simulation))lab.simulation={ports:4,portKw:7,supplyKw:40,baseKw:8,efficiency:90,offPeak:0.18,peak:0.32,peakStart:16,peakEnd:19,sessions:[{id:id(),name:'Workplace vehicles',count:4,arrival:8,departure:17,kwh:20,maxKw:7}]};
 return lab;
}
function validate(lab){
 if(!record(lab)||lab.schema!==1)throw Error('Unsupported planning schema');
 for(const k of ['evidence','assets','assignments','reviews','costs','simulation'])if(lab[k]!=null&&!record(lab[k]))throw Error('Invalid planning '+k);
 for(const k of ['options','revisions','phases'])if(lab[k]!=null&&(!Array.isArray(lab[k])||lab[k].length>250))throw Error('Invalid planning '+k);
 const keys=new Set();
 for(const k of ['options','revisions','phases'])for(const r of lab[k]||[]){if(!record(r)||typeof r.id!=='string'||!/^[a-zA-Z0-9_.-]{1,128}$/.test(r.id)||keys.has(k+':'+r.id))throw Error('Invalid planning record');keys.add(k+':'+r.id);if(k!=='phases'&&!record(r.snapshot))throw Error('Missing design snapshot');}
 for(const [key,value]of Object.entries(lab.assets||{}))if(!/^[a-zA-Z0-9_.-]{1,128}$/.test(key)||typeof value!=='string'||!/^data:/i.test(value))throw Error('Invalid snapshot asset');
 for(const value of Object.values(lab.evidence||{}))if(!record(value)||!['measured','assumed','missing'].includes(value.status)||typeof value.value!=='string')throw Error('Invalid evidence');
 for(const value of Object.values(lab.assignments||{}))if(typeof value!=='string')throw Error('Invalid phase assignment');
 for(const value of Object.values(lab.reviews||{}))if(!record(value))throw Error('Invalid review record');
 if(lab.simulation&&(!Array.isArray(lab.simulation.sessions)||lab.simulation.sessions.length>100||lab.simulation.sessions.some(r=>!record(r)||typeof r.id!=='string')))throw Error('Invalid arrival groups');
 const phaseIds=new Set((lab.phases||[]).map(p=>p.id));for(const value of Object.values(lab.assignments||{}))if(!phaseIds.has(value))throw Error('Unknown installation phase');
}
function design(pack){
 const result=clone(pack);
 if(result.workspace){delete result.workspace.issues;delete result.workspace.backupAt;if(result.workspace.planning){delete result.workspace.planning.assets;delete result.workspace.planning.options;delete result.workspace.planning.revisions;}}
 delete result.safetySummary;delete result.revHistory;delete result._ratesOpen;return result;
}
function storeSnapshot(pack,source){
 const lab=ensure(pack),lookup=new Map(Object.entries(lab.assets).map(([key,value])=>[value,key]));
 const visit=v=>{
  if(typeof v==='string'&&/^data:/i.test(v)){let key=lookup.get(v);if(!key){key=id();lab.assets[key]=v;lookup.set(v,key);}return {$asset:key};}
  if(Array.isArray(v))return v.map(visit);
  if(record(v))return Object.fromEntries(Object.entries(v).map(([key,value])=>[key,visit(value)]));
  return v;
 };
 return visit(source?design(source):design(pack));
}
function hydrate(snapshot,assets){
 const visit=(v,depth=0)=>{
  if(depth>75)throw Error('Snapshot nesting is too deep');
  if(record(v)&&Object.hasOwn(v,'$asset')){if(Object.keys(v).length!==1||!Object.hasOwn(assets,v.$asset))throw Error('A snapshot image is missing');return assets[v.$asset];}
  if(Array.isArray(v))return v.map(x=>visit(x,depth+1));
  if(record(v))return Object.fromEntries(Object.entries(v).map(([key,value])=>{if(['__proto__','constructor','prototype'].includes(key))throw Error('Invalid snapshot key');return [key,visit(value,depth+1)];}));
  return v;
 };
 return visit(snapshot);
}
function capture(pack,{name,kind='revision',file='',source=null}={}){
 const lab=ensure(pack),list=kind==='option'?lab.options:lab.revisions;
 if(list.length>=100)throw Error('Export a backup and remove an older snapshot before adding another. The limit is 100 per list.');
 const value={id:id(),name:String(name||'Saved revision').slice(0,120),kind,file:String(file).slice(0,200),at:new Date().toISOString(),snapshot:storeSnapshot(pack,source)};
 list.push(value);return value;
}
function restore(pack,entry){
 const lab=ensure(pack),restored=hydrate(entry.snapshot,lab.assets);
 const config=restored.workspace?.planning||{};
 restored.workspace=restored.workspace||{};
 restored.workspace.planning={...config,schema:1,assets:clone(lab.assets),revisions:clone(lab.revisions),options:clone(lab.options)};
 restored.projId=id();restored.name=(restored.name||'Project')+' · '+entry.name;
 return restored;
}
function pruneAssets(lab){
 const used=new Set();const visit=v=>{if(Array.isArray(v))v.forEach(visit);else if(record(v)){if(typeof v.$asset==='string')used.add(v.$asset);else Object.values(v).forEach(visit);}};
 [...lab.options,...lab.revisions].forEach(r=>visit(r.snapshot));for(const key of Object.keys(lab.assets))if(!used.has(key))delete lab.assets[key];
}
function facts(pack){
 const out=[],lab=pack.workspace?.planning;
 const add=(key,label,value,target,needed=true)=>{
  const present=typeof value==='number'?Number.isFinite(value):!!String(value??'').trim();
  const encoded=stable(value??''),e=lab?.evidence?.[key],stale=!!e&&e.value!==encoded;
  const status=!present||!stale&&e?.status==='missing'?'missing':!stale&&e?.status==='measured'&&e.source?.trim()&&e.by?.trim()&&e.date?'measured':'assumed';
  out.push({key,label,value:present?value:'Not recorded',status,stale,source:e?.source||'',by:e?.by||'',date:e?.date||'',target,needed,present,encoded});
 };
 for(const [key,label]of [['address','Site address'],['earthing','Earthing arrangement'],['supplyRating','Supply rating'],['ze','External earth fault loop impedance']])add('site:'+key,label,pack[key],{section:'site',field:key});
 for(const photo of pack.photos||[]){
  add('scale:'+photo.id,(photo.name||'Plan')+' · scale',finite(photo.scale?.pxPerM,Number.MIN_VALUE)?Number(photo.scale.pxPerM):null,{photoId:photo.id});
  for(const item of photo.items||[]){
   if(!visible(pack,item))continue;
   if(item.type==='route'&&!['__area','hedge','fence','wallline','heras','cones'].includes(item.kind))add('item:'+item.id,(item.label||item.ref||item.kind||'Route')+' · length (m)',length(item,photo),{photoId:photo.id,itemId:item.id});
   else if(item.type==='unit')add('item:'+item.id,(item.ref||item.label||'Charger')+' · recorded rating (kW)',finite(item.kw,Number.MIN_VALUE)?Number(item.kw):null,{photoId:photo.id,itemId:item.id});
  }
 }
 return out;
}
function recordEvidence(pack,key,{status,source,by,date}){
 const fact=facts(pack).find(x=>x.key===key);if(!fact)throw Error('The survey item no longer exists.');
 if(!['measured','assumed','missing'].includes(status))throw Error('Choose an evidence status.');
 if(status==='measured'&&(!fact.present||!String(source||'').trim()||!String(by||'').trim()||!/^\d{4}-\d{2}-\d{2}$/.test(date||'')))throw Error('Measured evidence needs a recorded value, source, person and date.');
 ensure(pack).evidence[key]={status,source:String(source||'').slice(0,1000),by:String(by||'').slice(0,200),date:String(date||''),value:fact.encoded};
}
function quantities(pack){
 const q={chargers:0,ports:0,passive:0,ratedKw:0,cable:0,trench:0,duct:0,unknown:0,unknownPower:0};
 for(const {photo,item}of rows(pack)){
  if(!visible(pack,item))continue;
  if(item.type==='unit'){
   if(item.provision==='passive'){q.passive++;continue;}
   q.chargers++;const ports=['twin_ped','solo_dfsm'].includes(item.variant)?2:1;q.ports+=ports;
   if(finite(item.kw,Number.MIN_VALUE))q.ratedKw+=Number(item.kw)*ports;else q.unknownPower++;
  }
  const category=item.type==='route'?(item.kind==='trench'?'trench':item.kind==='duct'?'duct':['run','swa','hituff','tails','earthcable','data'].includes(item.kind)?'cable':null):null;
  if(category){const m=length(item,photo);if(m==null)q.unknown++;else q[category]+=m;}
 }
 return q;
}
function cost(pack,rates){
 const q=quantities(pack);let total=0,missing=[];
 for(const [key,count]of [['charger',q.chargers],['cable',q.cable],['trench',q.trench],['duct',q.duct]])if(count){if(finite(rates[key],0))total+=count*Number(rates[key]);else missing.push(key);}
 if(q.unknown)missing.push('unmeasured routes');
 return {total,missing,complete:missing.length===0};
}
const technical=['variant','kw','maxA','provision','array','vdPh','vdAmps','vdCsa','ccDev','ccIn','ccMeth','ccAmb','ccGrp','ccCpc','kind','manualLen','pts','x','y','option'];
function differences(before,after){
 const changes=[];
 const add=(kind,label,oldValue,newValue,target,affects)=>{
  if(stable(oldValue??null)!==stable(newValue??null))changes.push({kind,label,before:oldValue,after:newValue,target,affects});
 };
 for(const key of ['name','address','postcode','jobRef','rev','earthing','supplyRating','ze','mainFuse','capacityNote','notes','engineerNote','custName','surveyedBy','surveyDate','brandName','replyEmail','replyPhone'])add('site',key,before[key],after[key],{},['Recorded site details','Reports',...(['earthing','supplyRating','ze','mainFuse'].includes(key)?['Electrical calculations','Capacity assumptions']:[])]);
 const oldPhotos=new Map((before.photos||[]).map(p=>[p.id,p])),newPhotos=new Map((after.photos||[]).map(p=>[p.id,p]));
 for(const [pid,p]of oldPhotos)if(!newPhotos.has(pid))changes.push({kind:'removed',label:'Plan removed: '+p.name,target:{photoId:pid},affects:['Drawings','Evidence','Reports']});
 for(const [pid,p]of newPhotos){
  const old=oldPhotos.get(pid);if(!old){changes.push({kind:'added',label:'Plan added: '+p.name,target:{photoId:pid},affects:['Drawings','Evidence','Reports']});continue;}
  for(const key of ['name','caption','includeInPdf'])add('plan',(p.name||'Plan')+' · '+key,old[key],p[key],{photoId:pid},['Drawings','Reports']);
  add('scale',p.name+' · calibration',old.scale,p.scale,{photoId:pid},['Route lengths','Electrical calculations','Materials','Reports']);
  if(old.src!==p.src)changes.push({kind:'image',label:p.name+' · plan image changed',target:{photoId:pid},affects:['Evidence','Drawings','Measurements','Reports']});
 }
 const oldItems=new Map(rows(before).map(r=>[r.item.id,r])),newItems=new Map(rows(after).map(r=>[r.item.id,r]));
 for(const key of new Set([...oldItems.keys(),...newItems.keys()])){
  const a=oldItems.get(key),b=newItems.get(key),r=b||a,label=r.item.ref||r.item.label||r.item.kind||r.item.type,target={photoId:r.photo.id,itemId:key};
  if(!a||!b){changes.push({kind:b?'added':'removed',label:(b?'Added: ':'Removed: ')+label,target,affects:['Drawings','Materials','Electrical calculations','Reports']});continue;}
  if(a.photo.id!==b.photo.id)changes.push({kind:'moved',label:label+' · moved to another plan',target,affects:['Drawings','Measurements','Electrical calculations','Reports']});
  const changed=Object.keys({...a.item,...b.item}).filter(k=>stable(a.item[k]??null)!==stable(b.item[k]??null));
  if(changed.length)changes.push({kind:'changed',label:label+' · '+changed.join(', '),fields:changed,target,affects:['Drawings','Reports',...(changed.some(k=>technical.includes(k))?['Materials','Electrical calculations','Capacity assumptions']:[])]});
 }
 if(before.brandLogo!==after.brandLogo)changes.push({kind:'branding',label:'Company logo changed',target:{},affects:['Report branding']});
 add('branding','Author and company profile',before.workspace?.authorProfile,after.workspace?.authorProfile,{},['Report branding']);
 add('programme','Programme',before.programme,after.programme,{},['Construction programme','Programme report']);
 add('phases','Expansion phases',before.workspace?.planning?.phases,after.workspace?.planning?.phases,{},['Expansion assumptions','Site replay']);
 add('assignments','Phase assignments',before.workspace?.planning?.assignments,after.workspace?.planning?.assignments,{},['Expansion quantities','Site replay','Reports']);
 return changes;
}
function affectedCircuits(before,after,changes=differences(before,after)){
 const seeds=new Set(changes.map(c=>c.target.itemId).filter(Boolean)),all=rows(after),adjacency=new Map();
 const connect=(a,b)=>{if(!a||!b)return;if(!adjacency.has(a))adjacency.set(a,new Set());adjacency.get(a).add(b);};
 for(const {item}of [...rows(before),...all])if(item.type==='route'&&Array.isArray(item.pts)){
  for(const point of [item.pts[0],item.pts.at(-1)])if(point?.anchorId){connect(item.id,point.anchorId);connect(point.anchorId,item.id);}
 }
 const wholeProject=changes.some(c=>c.kind==='scale'||c.kind==='site'&&['earthing','supplyRating','ze','mainFuse'].includes(c.label));
 const seen=new Set(seeds),queue=[...seeds];while(queue.length){const at=queue.shift();for(const next of adjacency.get(at)||[])if(!seen.has(next)){seen.add(next);queue.push(next);}}
 return all.filter(r=>r.item.type==='route'&&['run','swa','hituff','tails'].includes(r.item.kind)&&(wholeProject||seen.has(r.item.id))).map(r=>({id:r.item.id,photoId:r.photo.id,label:r.item.ref||r.item.label||r.item.kind}));
}
function validateSimulation(s){
 const check=(ok,message)=>{if(!ok)throw Error(message);};
 check(finite(s.ports,1,200)&&Number.isInteger(Number(s.ports)),'Enter between 1 and 200 charging ports.');
 for(const [key,min,max,label]of [['portKw',0.1,1000,'Port power'],['supplyKw',0,10000,'Supply limit'],['baseKw',0,10000,'Other site demand'],['efficiency',1,100,'Charging efficiency'],['offPeak',0,20,'Off-peak tariff'],['peak',0,20,'Peak tariff'],['peakStart',0,24,'Peak start'],['peakEnd',0,24,'Peak end']])check(finite(s[key],min,max),label+' is outside the supported range.');
 check(Array.isArray(s.sessions)&&s.sessions.length>0&&s.sessions.length<=100,'Add at least one arrival group (maximum 100).');
 let count=0;
 for(const r of s.sessions){
  check(finite(r.count,1,200)&&Number.isInteger(Number(r.count)),'Vehicle counts must be whole numbers from 1 to 200.');count+=Number(r.count);
  check(finite(r.arrival,0,23.999)&&finite(r.departure,0,24),'Use arrival/departure hours between 0 and 24.');
  check(Number(r.arrival)!==Number(r.departure),'Arrival and departure must differ.');
  check(Number.isInteger(Number(r.arrival)*12)&&Number.isInteger(Number(r.departure)*12),'Use arrival/departure times in five-minute increments.');
  check(finite(r.kwh,0.1,1000)&&finite(r.maxKw,0.1,1000),'Enter positive energy and vehicle charging limits.');
 }
 check(count<=500,'This scenario supports up to 500 vehicles.');
}
function simulate(s){
 validateSimulation(s);
 const sessions=[];let order=0;
 for(const r of s.sessions)for(let n=0;n<Number(r.count);n++){
  const arrival=Number(r.arrival),departure=Number(r.departure)<=arrival?Number(r.departure)+24:Number(r.departure);
  sessions.push({id:(r.id||'group'+order)+'-'+n,name:String(r.name||'Vehicle')+(Number(r.count)>1?' '+(n+1):''),arrival,departure,required:Number(r.kwh),maxKw:Math.min(Number(r.maxKw),Number(s.portKw)),delivered:0,gridKwh:0,cost:0,queuedMinutes:0,order:order++,connected:false,started:null});
 }
 const step=1/12,efficiency=Number(s.efficiency)/100,available=Math.max(0,Number(s.supplyKw)-Number(s.baseKw)),horizon=Math.max(24,...sessions.map(r=>r.departure)),series=[];
 const inPeak=hour=>Number(s.peakStart)===Number(s.peakEnd)?false:Number(s.peakStart)<Number(s.peakEnd)?hour>=Number(s.peakStart)&&hour<Number(s.peakEnd):hour>=Number(s.peakStart)||hour<Number(s.peakEnd);
 for(let tick=0;tick<Math.ceil(horizon/step);tick++){
  const hour=tick*step,active=sessions.filter(r=>r.arrival<=hour+1e-8&&r.departure>hour+1e-8&&r.delivered<r.required-1e-8);
  const connected=active.filter(r=>r.connected),waiting=active.filter(r=>!r.connected).sort((a,b)=>a.arrival-b.arrival||a.order-b.order);
  while(connected.length<Number(s.ports)&&waiting.length){const r=waiting.shift();r.connected=true;r.started=hour;connected.push(r);}
  waiting.forEach(r=>r.queuedMinutes+=5);
  const allocation=new Map(connected.map(r=>[r,0]));let pool=connected.slice(),remaining=available;
  for(let pass=0;pass<=connected.length&&pool.length&&remaining>1e-10;pass++){
   const share=remaining/pool.length,next=[];
   for(const r of pool){const duration=Math.min(step,r.departure-hour),cap=Math.min(r.maxKw,(r.required-r.delivered)/(duration*efficiency)),old=allocation.get(r),grant=Math.max(0,Math.min(share,cap-old));allocation.set(r,old+grant);remaining-=grant;if(cap-old-grant>1e-8)next.push(r);}
   pool=next;
  }
  const tariff=inPeak(hour%24)?Number(s.peak):Number(s.offPeak);let gridKw=0;
  for(const r of connected){const power=allocation.get(r),grid=power*Math.min(step,r.departure-hour);r.gridKwh+=grid;r.delivered=Math.min(r.required,r.delivered+grid*efficiency);r.cost+=grid*tariff;gridKw+=power;}
  series.push({hour,gridKw,availableKw:available,queued:waiting.length,connected:connected.length,tariff});
 }
 const totals={required:0,delivered:0,gridKwh:0,cost:0,shortfall:0,queuedMinutes:0,unserved:0,peakKw:Math.max(0,...series.map(r=>r.gridKw))};
 for(const r of sessions){r.shortfall=Math.max(0,r.required-r.delivered);for(const key of ['required','delivered','gridKwh','cost','shortfall','queuedMinutes'])totals[key]+=r[key];if(r.shortfall>0.01)totals.unserved++;}
 return {sessions,series,totals,horizon,stepMinutes:5};
}
function phasePack(pack,index){
 const copy=design(pack),lab=ensure(pack),allowed=new Set(lab.phases.slice(0,index+1).map(x=>x.id));
 const phaseOf=i=>lab.assignments[i.id]||lab.phases[0].id;
 copy.photos.forEach(p=>p.items=p.items.filter(i=>allowed.has(phaseOf(i))));
 return copy;
}
root.EVPlanningCore={clone,stable,id,ensure,validate,design,storeSnapshot,hydrate,capture,restore,pruneAssets,facts,recordEvidence,quantities,cost,differences,affectedCircuits,simulate,validateSimulation,phasePack,length,rows,visible};
})(globalThis);
