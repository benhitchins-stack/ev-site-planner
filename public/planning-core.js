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
 const refs=(Array.isArray(photo.scale.refs)?photo.scale.refs:[]).filter(r=>r&&finite(r.ppm,Number.MIN_VALUE)&&Number.isFinite(Number(r.mx))&&Number.isFinite(Number(r.my)));
 const scaleAt=(x,y)=>{
  if(refs.length<2)return Number(photo.scale.pxPerM);
  let weights=0,weighted=0;
  for(const r of refs){const distance=(x-Number(r.mx))**2+(y-Number(r.my))**2;if(distance<1)return Number(r.ppm);const weight=1/distance;weights+=weight;weighted+=weight*Number(r.ppm);}
  return weighted/weights;
 };
 let metres=0;for(let n=1;n<item.pts.length;n++){const a=item.pts[n-1],b=item.pts[n];if(![a.x,a.y,b.x,b.y].every(Number.isFinite))return null;metres+=Math.hypot(b.x-a.x,b.y-a.y)/scaleAt((a.x+b.x)/2,(a.y+b.y)/2);}
 const rounded=Number(metres.toFixed(1));return rounded>0&&Number.isFinite(rounded)?rounded:null;
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
 // A charging day that was never set up (absent, or the untouched original defaults) starts from the markup, the site details and any Markup simulator settings.
 if(!record(lab.simulation)||untouchedSimulation(lab.simulation))lab.simulation=simulationDefaults(pack);
 return lab;
}
// The defaults every Design lab charging day used before it read the project. Seeing exactly these (session ids aside) means nobody has edited them.
function untouchedSimulation(s){
 if(record(s.sources))return false;
 const legacy={ports:4,portKw:7,supplyKw:40,baseKw:8,efficiency:90,offPeak:0.18,peak:0.32,peakStart:16,peakEnd:19};
 if(Object.entries(legacy).some(([k,v])=>String(s[k])!==String(v)))return false;
 const r=Array.isArray(s.sessions)&&s.sessions.length===1?s.sessions[0]:null;
 return !!r&&r.name==='Workplace vehicles'&&String(r.count)==='4'&&String(r.arrival)==='8'&&String(r.departure)==='17'&&String(r.kwh)==='20'&&String(r.maxKw)==='7';
}
const VOLTS=230;
const kwFromAmps=a=>Math.round(a*VOLTS/100)/10;
function ampsFrom(text){const s=String(text??'');const a=s.match(/(\d+(?:\.\d+)?)\s*A\b/i);if(a)return Number(a[1]);const all=s.match(/\d+(?:\.\d+)?/g);return all&&all.length?Math.max(...all.map(Number)):null;}
// Where the supply limit comes from: the recorded supply rating or main fuse, or the built-in fallback the Markup simulator also used (80 A domestic, 200 A otherwise).
function supplyBasis(pack){
 const dom=pack.mode==='domestic',recorded=dom?ampsFrom(pack.mainFuse):(ampsFrom(pack.supplyRating)||ampsFrom(pack.mainFuse));
 if(recorded>0)return {amps:recorded,kw:kwFromAmps(recorded),source:'site'};
 const fallback=dom?80:200;return {amps:fallback,kw:kwFromAmps(fallback),source:'assumed'};
}
// Other site demand when nothing better is known: 35% of the supply on a commercial site, 4 kW for a house.
const baseRule=(pack,supplyKw)=>pack.mode==='domestic'?4:Math.round(Number(supplyKw)*0.35*10)/10;
// Defaults for the charging day, each with its source so the page can say where a value came from: markup, site, simulator (Markup simulator settings), rule (rule of thumb), assumed (fallback) or default.
function simulationDefaults(pack){
 const dom=pack.mode==='domestic',q=quantities(pack),old=record(pack.sim)?pack.sim:null,supply=supplyBasis(pack),sources={};
 const kws=rows(pack).filter(({item})=>visible(pack,item)&&item.type==='unit'&&item.provision!=='passive'&&finite(item.kw,Number.MIN_VALUE)).map(({item})=>Number(item.kw));
 const s={efficiency:90,offPeak:0.18,peak:0.32,peakStart:16,peakEnd:19,chargerControl:'shared'};
 if(q.ports){s.ports=Math.min(200,q.ports);sources.ports='markup';}else if(old&&finite(old.cars,1,200)){s.ports=Math.round(Number(old.cars));sources.ports='simulator';}else{s.ports=dom?1:4;sources.ports='default';}
 if(kws.length){s.portKw=Math.max(...kws);sources.portKw='markup';}else{s.portKw=7;sources.portKw='default';}
 // A saved Markup simulator supply counts only when someone typed it; older saves echoed the 200 A fallback on every slider change.
 const typedCap=old&&finite(old.cap,1,5000)&&(old.capTyped||Number(old.cap)!==supply.amps);
 if(supply.source==='site'||!typedCap){s.supplyKw=supply.kw;sources.supplyKw=supply.source;}else{s.supplyKw=kwFromAmps(Number(old.cap));sources.supplyKw='simulator';}
 if(old&&finite(old.base,0,5000)){s.baseKw=dom?Number(old.base):kwFromAmps(Number(old.base));sources.baseKw='simulator';}
 else{s.baseKw=baseRule(pack,s.supplyKw);sources.baseKw='rule';}
 if(old&&finite(old.pDay,0,2000)&&finite(old.pNight,0,2000)){s.peak=Math.round(Number(old.pDay)*10)/1000;s.offPeak=Math.round(Number(old.pNight)*10)/1000;sources.peak=sources.offPeak='simulator';}
 // The Markup simulator stored an off-peak window; the peak period is the rest of the day.
 if(old&&finite(old.opS,0,24)&&finite(old.opE,0,24)){s.peakStart=Math.round(Number(old.opE)*12)/12%24;s.peakEnd=Math.round(Number(old.opS)*12)/12%24;sources.peakStart=sources.peakEnd='simulator';}
 if(old&&old.dlm!=null){s.chargerControl=old.dlm?'shared':'uncapped';sources.chargerControl='simulator';}
 const count=Math.max(1,Math.min(200,old&&finite(old.cars,1,200)?Math.round(Number(old.cars)):s.ports)),kwh=old&&finite(old.need,0.1,1000)?Number(old.need):dom?30:20;
 s.sessions=[dom?{id:id(),name:'Household vehicles',count,arrival:17.5,departure:7,kwh,maxKw:s.portKw}:{id:id(),name:'Workplace vehicles',count,arrival:8,departure:17,kwh,maxKw:s.portKw}];
 s.sources=sources;
 return s;
}
// Values that follow the project until someone edits them: chargers from the markup, supply from the site details (or the fallback), and the 35% rule.
function syncSimulation(pack){
 const s=ensure(pack).simulation;if(!record(s.sources))return false;
 const d=simulationDefaults(pack);let changed=false;
 const follow={
  ports:from=>['markup','default'].includes(from)&&['markup','default'].includes(d.sources.ports),
  portKw:from=>['markup','default'].includes(from),
  // A saved Markup simulator supply gives way once a rating is recorded, so it never shadows the site details.
  supplyKw:from=>['site','assumed'].includes(from)||from==='simulator'&&d.sources.supplyKw==='site',
  baseKw:from=>from==='rule'
 };
 for(const [key,ok]of Object.entries(follow)){
  if(!ok(s.sources[key]))continue;
  const value=key==='baseKw'?baseRule(pack,s.supplyKw):d[key],from=key==='baseKw'?'rule':d.sources[key];
  if(String(s[key])!==String(value)||s.sources[key]!==from){s[key]=value;s.sources[key]=from;changed=true;}
 }
 return changed;
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
// Installer-facing names: the plan reference (CP-01, FP-01), then the label, then a plain type name.
const ROUTE_NAMES={trench:'Trench',duct:'Duct',swa:'SWA cable',run:'Cable run',hituff:'Hi-Tuff cable',tails:'Meter tails',earthcable:'Earth cable',data:'Data cable',tray:'Cable tray',mt2:'Metal trunking',basket:'Cable basket',gully:'Pavement channel'};
const TYPE_NAMES={unit:'Charger',evdb:'EVDB',ipevdb:'IP rated EVDB',feeder:'Feeder pillar',arrayboard:'Load management board',cutout:'Main fuse / cut-out',consumerunit:'Distribution board',panelboard:'Panel board',isolator:'Isolator',meter:'Meter',mark:'Marker'};
const sentence=text=>{const t=String(text||'').replace(/[_-]+/g,' ').trim();return t?t[0].toUpperCase()+t.slice(1):'';};
function kindName(item){return item.type==='route'?ROUTE_NAMES[item.kind]||sentence(item.kind)||'Route':item.type==='mark'&&item.kind==='supply'?'Incoming supply':item.type==='mark'&&item.kind==='cu'?'Consumer unit':TYPE_NAMES[item.type]||sentence(item.kind||item.type)||'Item';}
// Names for every item on each plan. Unreferenced routes and items are numbered per plan when their kind repeats ("Trench 1", "Trench 2").
function itemNames(pack,namer=kindName){
 const names=new Map();
 for(const photo of pack.photos||[]){
  const items=(photo.items||[]).filter(i=>visible(pack,i)),counts=new Map(),seen=new Map();
  const base=i=>String(i.planRef||i.label||'').trim()||namer(i)||kindName(i);
  const plain=i=>!String(i.planRef||i.label||'').trim();
  for(const i of items)if(plain(i)){const k=base(i);counts.set(k,(counts.get(k)||0)+1);}
  for(const i of items){const k=base(i);if(plain(i)&&counts.get(k)>1){const n=(seen.get(k)||0)+1;seen.set(k,n);names.set(i.id,k+' '+n);}else names.set(i.id,k);}
 }
 return names;
}
function facts(pack,namer){
 const out=[],lab=pack.workspace?.planning,names=itemNames(pack,namer);
 const add=(key,label,value,target,display,missingText='Not recorded')=>{
  const present=typeof value==='number'?Number.isFinite(value):!!String(value??'').trim();
  const encoded=stable(value??''),e=lab?.evidence?.[key],stale=!!e&&e.value!==encoded;
  const status=!present||!stale&&e?.status==='missing'?'missing':!stale&&e?.status==='measured'&&e.source?.trim()&&e.by?.trim()&&e.date?'measured':'assumed';
  out.push({key,label,value:present?value:'Not recorded',display:present?display??value:missingText,status,stale,source:e?.source||'',by:e?.by||'',date:e?.date||'',target,needed:true,present,encoded});
 };
 for(const [key,label]of [['address','Site address'],['earthing','Earthing arrangement'],['supplyRating','Supply rating'],['ze','External earth fault loop impedance']])add('site:'+key,label,pack[key],{section:'site',field:key});
 const plans=(pack.photos||[]).length;
 for(const photo of pack.photos||[]){
  const ppm=finite(photo.scale?.pxPerM,Number.MIN_VALUE)?Number(photo.scale.pxPerM):null;
  // The stored value stays the calibration number so recorded evidence keeps matching; only the wording changes.
  add('scale:'+photo.id,'Plan scale'+(plans>1?' · '+(photo.name||'Plan'):''),ppm,{photoId:photo.id},ppm==null?null:'Set · 1 m = '+(Math.round(ppm*10)/10)+' px','Not set');
  for(const item of photo.items||[]){
   if(!visible(pack,item))continue;
   if(item.type==='route'&&!['__area','hedge','fence','wallline','heras','cones'].includes(item.kind)){const m=length(item,photo);add('item:'+item.id,names.get(item.id)+' · length (m)',m,{photoId:photo.id,itemId:item.id});}
   else if(item.type==='unit')add('item:'+item.id,names.get(item.id)+' · recorded rating (kW)',finite(item.kw,Number.MIN_VALUE)?Number(item.kw):null,{photoId:photo.id,itemId:item.id});
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
   q.chargers++;const ports=['twin_ped','solo_dfsm','dc_rapid'].includes(item.variant)?2:1;q.ports+=ports;
   if(finite(item.kw,Number.MIN_VALUE))q.ratedKw+=Number(item.kw)*(item.variant==='dc_rapid'?1:ports);else q.unknownPower++;
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
 const oldNames=itemNames({...before,optionView:'all'}),newNames=itemNames({...after,optionView:'all'});
 for(const key of new Set([...oldItems.keys(),...newItems.keys()])){
  const a=oldItems.get(key),b=newItems.get(key),r=b||a,label=newNames.get(key)||oldNames.get(key)||kindName(r.item),target={photoId:r.photo.id,itemId:key};
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
 const seeds=new Set(changes.map(c=>c.target.itemId).filter(Boolean)),all=rows(after),adjacency=new Map(),names=itemNames({...after,optionView:'all'});
 const connect=(a,b)=>{if(!a||!b)return;if(!adjacency.has(a))adjacency.set(a,new Set());adjacency.get(a).add(b);};
 for(const {item}of [...rows(before),...all])if(item.type==='route'&&Array.isArray(item.pts)){
  for(const point of [item.pts[0],item.pts.at(-1)])if(point?.anchorId){connect(item.id,point.anchorId);connect(point.anchorId,item.id);}
 }
 const wholeProject=changes.some(c=>c.kind==='scale'||c.kind==='site'&&['earthing','supplyRating','ze','mainFuse'].includes(c.label));
 const seen=new Set(seeds),queue=[...seeds];while(queue.length){const at=queue.shift();for(const next of adjacency.get(at)||[])if(!seen.has(next)){seen.add(next);queue.push(next);}}
 return all.filter(r=>r.item.type==='route'&&['run','swa','hituff','tails'].includes(r.item.kind)&&(wholeProject||seen.has(r.item.id))).map(r=>({id:r.item.id,photoId:r.photo.id,label:names.get(r.item.id)||kindName(r.item)}));
}
function validateSimulation(s){
 const check=(ok,message)=>{if(!ok)throw Error(message);};
 check(finite(s.ports,1,200)&&Number.isInteger(Number(s.ports)),'Enter between 1 and 200 charging ports.');
 for(const [key,min,max,label]of [['portKw',0.1,1000,'Port power'],['supplyKw',0,10000,'Supply limit'],['baseKw',0,10000,'Other site demand'],['efficiency',1,100,'Charging efficiency'],['offPeak',0,20,'Off-peak tariff'],['peak',0,20,'Peak tariff'],['peakStart',0,24,'Peak start'],['peakEnd',0,24,'Peak end']])check(finite(s[key],min,max),label+' is outside the supported range.');
 check(s.chargerControl==null||s.chargerControl===''||['shared','uncapped'].includes(s.chargerControl),'Choose load management or uncapped charging.');
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
 // Load management shares what the supply leaves after other demand; uncapped chargers each draw up to their limit, so the site can go over its supply.
 const uncapped=s.chargerControl==='uncapped',supplyKw=Number(s.supplyKw),baseKw=Number(s.baseKw);
 const step=1/12,efficiency=Number(s.efficiency)/100,available=Math.max(0,supplyKw-baseKw),budget=uncapped?Infinity:available,horizon=Math.max(24,...sessions.map(r=>r.departure)),series=[];
 const inPeak=hour=>Number(s.peakStart)===Number(s.peakEnd)?false:Number(s.peakStart)<Number(s.peakEnd)?hour>=Number(s.peakStart)&&hour<Number(s.peakEnd):hour>=Number(s.peakStart)||hour<Number(s.peakEnd);
 for(let tick=0;tick<Math.ceil(horizon/step);tick++){
  const hour=tick*step,active=sessions.filter(r=>r.arrival<=hour+1e-8&&r.departure>hour+1e-8&&r.delivered<r.required-1e-8);
  const connected=active.filter(r=>r.connected),waiting=active.filter(r=>!r.connected).sort((a,b)=>a.arrival-b.arrival||a.order-b.order);
  while(connected.length<Number(s.ports)&&waiting.length){const r=waiting.shift();r.connected=true;r.started=hour;connected.push(r);}
  waiting.forEach(r=>r.queuedMinutes+=5);
  const allocation=new Map(connected.map(r=>[r,0]));let pool=connected.slice(),remaining=budget;
  for(let pass=0;pass<=connected.length&&pool.length&&remaining>1e-10;pass++){
   const share=remaining===Infinity?Infinity:remaining/pool.length,next=[];
   for(const r of pool){const duration=Math.min(step,r.departure-hour),cap=Math.min(r.maxKw,(r.required-r.delivered)/(duration*efficiency)),old=allocation.get(r),grant=Math.max(0,Math.min(share,cap-old));allocation.set(r,old+grant);remaining-=grant;if(cap-old-grant>1e-8)next.push(r);}
   pool=next;
  }
  const tariff=inPeak(hour%24)?Number(s.peak):Number(s.offPeak);let gridKw=0;
  for(const r of connected){const power=allocation.get(r),grid=power*Math.min(step,r.departure-hour);r.gridKwh+=grid;r.delivered=Math.min(r.required,r.delivered+grid*efficiency);r.cost+=grid*tariff;gridKw+=power;}
  series.push({hour,gridKw,availableKw:available,siteKw:baseKw+gridKw,over:baseKw+gridKw>supplyKw+1e-8,queued:waiting.length,connected:connected.length,tariff});
 }
 const totals={required:0,delivered:0,gridKwh:0,cost:0,shortfall:0,queuedMinutes:0,unserved:0,peakKw:Math.max(0,...series.map(r=>r.gridKw)),peakSiteKw:Math.max(baseKw,...series.map(r=>r.siteKw)),overSupplyHours:series.filter(r=>r.over).length*step,supplyKw,baseKw,uncapped};
 for(const r of sessions){r.shortfall=Math.max(0,r.required-r.delivered);for(const key of ['required','delivered','gridKwh','cost','shortfall','queuedMinutes'])totals[key]+=r[key];if(r.shortfall>0.01)totals.unserved++;}
 return {sessions,series,totals,horizon,stepMinutes:5};
}
function phasePack(pack,index){
 const copy=design(pack),lab=ensure(pack),allowed=new Set(lab.phases.slice(0,index+1).map(x=>x.id));
 const phaseOf=i=>lab.assignments[i.id]||lab.phases[0].id;
 copy.photos.forEach(p=>p.items=p.items.filter(i=>allowed.has(phaseOf(i))));
 return copy;
}
root.EVPlanningCore={itemNames,kindName,clone,stable,id,ensure,simulationDefaults,syncSimulation,supplyBasis,untouchedSimulation,validate,design,storeSnapshot,hydrate,capture,restore,pruneAssets,facts,recordEvidence,quantities,cost,differences,affectedCircuits,simulate,validateSimulation,phasePack,length,rows,visible};
})(globalThis);
