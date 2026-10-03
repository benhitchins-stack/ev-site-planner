/* Site audit of an existing EV site: the audit page, evidence photos and the evidence pack PDF. Check data and saving rules live in audit-core.js. */
(function(){
'use strict';
const C=window.EVAuditCore,$=id=>document.getElementById(id);
const h=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const parts=()=>window.EVWorkspace?.parts||{};
const icon=(k,cls='')=>parts().icon?parts().icon(k,cls):'';
const btn=(t,a,style='',ic='')=>'<button type="button" class="ev-btn '+style+'" data-ev-action="'+a+'">'+(ic?icon(ic):'')+t+'</button>';
const count=(n,t)=>n+' '+t+(n===1?'':'s');
const meter=(pct,label='')=>'<span class="ev-meter"'+(label?' role="img" aria-label="'+h(label)+'"':' aria-hidden="true"')+'><i style="width:'+Math.max(0,Math.min(100,Number(pct)||0))+'%"></i></span>';
const DAY=/^\d{4}-\d{2}-\d{2}$/;
const niceDate=d=>{if(!d)return '';const x=DAY.test(d)?new Date(d+'T12:00:00Z'):new Date(d);return Number.isNaN(+x)?'':x.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',...(DAY.test(d)?{timeZone:'UTC'}:{})});};
const PHOTO_LIMIT=4,PHOTO_MAX=1600,STANDARDS='PAS 1899:2022 and the Public Charge Point Regulations 2023';
const pillClass={pass:'green',action:'amber',fail:'red',na:'',todo:'quiet'};
const sevClass={critical:'red',high:'amber',medium:''};
const opened=new Set();let lightReturn=null;
const audit=()=>pack.audit&&typeof pack.audit==='object'&&!Array.isArray(pack.audit)?pack.audit:null;
const current=()=>{const a=audit();return a?C.ensure(a):null;};
const isAuditProject=()=>audit()?.kind==='audit';
const siteName=()=>pack.name||$('packname')?.value||'';
const unitLabel=u=>u.label||'Chargepoint';
const unitMeta=u=>[u.make,u.kw?String(u.kw).replace(/\s*kw$/i,'')+' kW':'',u.location].filter(Boolean).join(' · ');
const rowId=key=>'eva-'+key.replace(':','-');
const saved=()=>autosave();
function edit(el){if(!el.dataset.evaEdited){pushHist();el.dataset.evaEdited='1';}}
// Starting an audit inside an ordinary project keeps its plans and details; an audit-only project is created by the workspace.
function start(kind='project'){
 if(audit())return current();
 pushHist();pack.audit=C.create({kind,auditor:pack.surveyedBy||''});saved();return pack.audit;
}

/* ---------- page ---------- */
function stats(a){
 const s=C.summary(a);
 return '<div class="ev-stats eva-stats" id="evaStats">'+[['Answered',s.done+'<small>/'+s.total+'</small>','',s.done+' of '+s.total+' checks answered'],['Pass',s.pass,s.pass?' green':''],['Action needed',s.action,s.action?' amber':''],['Fail',s.fail,s.fail?' red':'']].map(([t,n,c,label])=>'<div class="ev-stat'+(c||'')+'"><label>'+t+'</label><b'+(label?' aria-label="'+h(label)+'"':'')+'>'+n+'</b>'+(t==='Answered'?meter(s.pct):'')+'</div>').join('')+'</div>';
}
function seg(name,options,value,attr){return '<div class="eva-seg" role="group" aria-label="'+h(name)+'">'+options.map(([v,t,sub])=>'<button type="button" class="'+(String(v)===String(value)?'on':'')+'" data-'+attr+'="'+h(v)+'" aria-pressed="'+(String(v)===String(value))+'">'+h(t)+(sub?'<small>'+h(sub)+'</small>':'')+'</button>').join('')+'</div>';}
const field=(label,attr,key,value,type='text',wide=false,help='')=>'<label class="ev-field'+(wide?' wide':'')+'">'+label+(type==='textarea'?'<textarea rows="3" data-'+attr+'="'+key+'">'+h(value)+'</textarea>':'<input type="'+type+'" data-'+attr+'="'+key+'" value="'+h(value)+'"'+(type==='text'?' autocomplete="off"':'')+'>')+(help?'<small>'+help+'</small>':'')+'</label>';
function setupCard(a){
 return '<section class="ev-card eva-setup" id="evaSetup"><div class="ev-card-head"><h2>Site and audit details</h2><span class="ev-pill'+(C.setupComplete(a)?' green':' amber')+'">'+(C.setupComplete(a)?'Set up complete':'Choose the site type')+'</span></div><div class="ev-card-body"><div class="ev-form">'+
 field('Site name','eva-field','name',siteName(),'text',true)+field('Reference','eva-field','jobRef',pack.jobRef||'')+field('Postcode','eva-field','postcode',pack.postcode||'')+field('Site address','eva-field','address',pack.address||'','textarea',true)+
 field('Operator (CPO)','eva-afield','operator',a.operator,'text',false,'The chargepoint operator responsible for the units.')+field('Auditor','eva-afield','auditor',a.auditor,'text',false,'Who carried out the audit.')+
 '<div class="ev-field wide"><span id="evaSiteTypeLabel">Site type</span>'+seg('Site type',C.SITE_TYPES.map(t=>[t.id,t.name,t.power]),a.siteType,'eva-site-type')+'<small>The site type decides which checks apply. Checks that do not apply are listed with the reason.</small></div>'+
 '<div class="ev-field"><span>Open to the public</span>'+seg('Open to the public',[['true','Yes'],['false','No']],a.isPublic===null?'':a.isPublic,'eva-public')+'<small>The 2023 Regulations apply to publicly accessible chargepoints only.</small></div>'+
 field('Audit date','eva-afield','date',a.date,'date')+field('Audit notes','eva-afield','notes',a.notes,'textarea',true,'Access arrangements, who attended, weather or anything the reader of the pack should know.')+
 '</div></div></section>';
}
function unitsCard(a){
 const units=C.units(a);
 return '<section class="ev-card eva-units" id="evaUnits"><div class="ev-card-head"><h2>Chargepoints</h2><span class="ev-task-count">'+units.length+'</span></div><div class="ev-card-body"><p class="eva-help">Checks about reach, space, cables, bollards and screens are answered for each chargepoint. Checks about the site, pricing and the operator are answered once.</p>'+
 '<div class="eva-unit-list">'+units.map((u,i)=>'<div class="eva-unit" id="evaUnit-'+h(u.id)+'"><div class="ev-form">'+field('Name','eva-unit-field','label:'+u.id,u.label)+field('Make and model','eva-unit-field','make:'+u.id,u.make)+field('Power (kW)','eva-unit-field','kw:'+u.id,u.kw)+field('Location on site','eva-unit-field','location:'+u.id,u.location)+'</div>'+(units.length>1?'<button type="button" class="ev-btn quiet" data-eva-remove-unit="'+h(u.id)+'" aria-label="Remove '+h(unitLabel(u))+'">Remove</button>':'')+'</div>').join('')+'</div>'+
 '<div class="ev-actions"><button type="button" class="ev-btn" data-eva-add-unit>'+icon('plus')+'Add chargepoint</button></div></div></section>';
}
function statusLine(check,ans){
 const st=C.state(ans);if(st==='todo')return '';
 if(st==='na')return ans.reason?.trim()?'Reason: '+ans.reason.trim():'Reason needed';
 if(st==='pass')return ans.note?.trim()?ans.note.trim():'';
 const bits=[];if(check.measure&&ans.measure?.trim())bits.push(ans.measure.trim()+' '+check.measure.unit);bits.push(ans.note?.trim()?ans.note.trim():'Note needed');if(st==='fail'&&!(ans.photos||[]).length)bits.push('photo needed');
 return bits.join(' · ');
}
function photosBlock(key,ans){
 const photos=ans?.photos||[];
 return '<div class="eva-photos" data-eva-photos="'+h(key)+'">'+photos.map(p=>'<button type="button" class="eva-thumb" data-eva-view="'+h(p.id)+'" data-eva-key="'+h(key)+'" aria-label="Open photo '+h(p.name||'')+'"><img src="'+h(p.src)+'" alt=""></button>').join('')+
 (photos.length<PHOTO_LIMIT?'<label class="ev-btn eva-add">'+icon('photo')+(photos.length?'Add another':'Add photo')+'<input class="ed-sr-only" type="file" accept="image/*,.heic,.heif" multiple data-eva-upload="'+h(key)+'"></label>'+(pack.photos.length?'<button type="button" class="ev-btn quiet" data-eva-pick="'+h(key)+'">Use a project photo</button>':''):'<span class="eva-help">Up to '+PHOTO_LIMIT+' photos per check.</span>')+'</div><p class="eva-msg" id="evaMsg-'+h(rowId(key))+'" role="status"></p>';
}
function checkRow(row){
 const {key,check,unit}=row,a=current(),ans=C.answer(a,key),st=C.state(ans),section=C.section(check.section),isOpen=opened.has(key);
 const line=statusLine(check,ans);
 return '<article class="eva-check '+st+'" id="'+rowId(key)+'" data-eva-key="'+h(key)+'"><div class="eva-check-head"><div class="eva-check-title"><span class="eva-ref">'+h(check.id)+' · '+h(section.short)+' · <span class="eva-sev '+sevClass[check.sev]+'">'+h(C.SEVERITY[check.sev])+'</span></span><b>'+h(check.title)+'</b>'+(line?'<small>'+h(line)+'</small>':'')+'</div>'+
 '<div class="eva-outcome" role="group" aria-label="Outcome for '+h(check.id)+(unit?' at '+h(unitLabel(unit)):'')+'">'+C.OUTCOMES.map(o=>'<button type="button" class="'+o.id+(st===o.id?' on':'')+'" data-eva-outcome="'+o.id+'" data-eva-key="'+h(key)+'" aria-pressed="'+(st===o.id)+'">'+h(o.short)+'</button>').join('')+'</div>'+
 '<button type="button" class="ev-btn quiet eva-toggle" data-eva-toggle="'+h(key)+'" aria-expanded="'+isOpen+'" aria-controls="'+rowId(key)+'-body">'+(isOpen?'Hide details':'Details')+'</button></div>'+
 '<div class="eva-body" id="'+rowId(key)+'-body"'+(isOpen?'':' hidden')+'><div class="eva-info"><p class="eva-why">'+h(check.why)+'</p><dl class="eva-cite"><dt>Reference</dt><dd>'+h(check.cite)+(check.deadline?' · '+h(check.deadline):'')+'</dd><dt>Suggested fix</dt><dd>'+h(check.fix)+(check.cost?'<small>'+h(check.cost)+'</small>':'')+'</dd>'+(check.verify?'<dt>Confirm</dt><dd class="eva-verify">'+h(check.verify)+' Check the value against your copy of PAS 1899:2022.</dd>':'')+'</dl></div>'+
 '<div class="eva-record">'+(check.measure?'<label class="ev-field">'+h(check.measure.label)+' ('+h(check.measure.unit)+')<input type="text" inputmode="decimal" data-eva-measure="'+h(key)+'" value="'+h(ans?.measure||'')+'"><small>Limit: '+h(check.measure.limit)+'</small></label>':'')+
 '<label class="ev-field">'+(st==='na'?'Reason it does not apply':'Note')+'<textarea rows="3" data-eva-note="'+h(key)+'">'+h(st==='na'?(ans?.reason||''):(ans?.note||''))+'</textarea><small>'+h(st==='na'?C.outcome('na').needs:st==='fail'?C.outcome('fail').needs:st==='action'?C.outcome('action').needs:'What you found on site.')+'</small></label>'+
 '<div class="ev-field"><span>Photos</span>'+photosBlock(key,ans)+'</div></div></div></article>';
}
function group(id,title,sub,rows,extra=''){
 const a=current(),done=rows.filter(r=>C.state(C.answer(a,r.key))!=='todo').length;
 return '<section class="ev-card eva-group" id="evaGroup-'+h(id)+'"><div class="ev-card-head"><div><h2 id="evaGroupTitle-'+h(id)+'">'+h(title)+'</h2>'+(sub?'<small class="eva-group-sub" id="evaGroupSub-'+h(id)+'">'+h(sub)+'</small>':'')+'</div><div class="ev-actions">'+extra+'<span class="ev-task-count" id="evaCount-'+h(id)+'">'+done+'/'+rows.length+'</span></div></div>'+(rows.length?rows.map(checkRow).join(''):'<div class="ev-empty"><b>No checks apply</b>Choose a site type above.</div>')+'</section>';
}
function groups(a){
 const rows=C.slots(a),units=C.units(a),site=rows.filter(r=>!r.unit);
 let out='<h2 class="ev-group-title" id="evaChecks">Checks</h2>'+group('site','Site and operator','Answered once for the whole site',site);
 for(const u of units)out+=group(u.id,unitLabel(u),unitMeta(u)||'Chargepoint checks',rows.filter(r=>r.unit?.id===u.id),units.length>1&&u!==units[0]?'<button type="button" class="ev-btn" data-eva-copy="'+h(u.id)+'">Copy answers from '+h(unitLabel(units[0]))+'</button>':'');
 const ex=C.excluded(a);
 if(ex.length)out+='<section class="ev-card eva-excluded"><div class="ev-card-head"><h2>Not applicable to this site</h2><span class="ev-task-count">'+ex.length+'</span></div><div class="ev-card-body"><p class="eva-help">Recorded in the pack with the reason, so the reader can see each requirement was considered.</p><ul class="eva-excluded-list">'+ex.map(({check,reason})=>'<li><b>'+h(check.id)+' · '+h(check.title)+'</b><span>'+h(reason)+'</span></li>').join('')+'</ul></div></section>';
 return out;
}
function packCard(a){
 const gaps=C.gaps(a,{name:siteName()});
 return '<section class="ev-card eva-pack" id="evaPack"><div class="ev-card-head"><h2>Evidence pack</h2>'+icon('file')+'</div><div class="ev-card-body"><p class="eva-help">The pack lists the site details, a summary, every fail and action with its photos, the full checklist and the checks that do not apply.</p>'+(gaps.length?'<ul class="eva-gaps">'+gaps.map(g=>'<li>'+h(g)+'</li>').join('')+'</ul>':'<p class="eva-ready">Every applicable check is answered with the evidence the pack needs.</p>')+btn('Review evidence pack','audit-pack','primary','file')+'</div></section>';
}
const disclaimer='<p class="eva-disclaimer">The planner records your audit against '+STANDARDS+'. Check wording is draft v0.9 pending specialist review. The pack supports a council or funder submission and does not certify compliance; clauses marked for confirmation need checking against your copy of the standard, and electrical matters need a qualified person.</p>';
function render(){
 if(!C)return '<div class="ev-notice">The site audit tools did not load. Reload the page and try again.</div>';
 const a=current(),P=parts();
 if(!a)return EVWorkspace.pageHead('Site audit','Check an existing EV site against '+STANDARDS+', record photos and make an evidence pack.','','audit')+
  '<section class="ev-card"><div class="ev-card-body eva-intro"><div class="eva-intro-grid">'+[['plan','Set up','Site type, operator and whether the site is open to the public decide which of the 23 checks apply.'],['check','Checks','Answer each check as Pass, Action needed, Fail or Not applicable, with a note, a measurement where there is a limit, and photos.'],['file','Pack','Review the findings and download the evidence pack PDF, listed in the project document history.']].map(([ic,t,d])=>'<div>'+icon(ic)+'<b>'+t+'</b><p>'+d+'</p></div>').join('')+'</div><div class="ev-actions">'+btn('Audit this site','audit','primary','check')+'</div>'+disclaimer+'</div></section>';
 return EVWorkspace.pageHead('Site audit','Check this site against '+STANDARDS+', record the evidence and make the pack.',btn('Review evidence pack','audit-pack','primary','file'),'audit')+stats(a)+setupCard(a)+unitsCard(a)+groups(a)+packCard(a)+disclaimer;
}
function patchRow(key,focusOutcome){
 const a=current(),row=C.slots(a).find(r=>r.key===key),el=$(rowId(key));if(!row||!el)return;
 el.outerHTML=checkRow(row);
 if(focusOutcome)$(rowId(key))?.querySelector('[data-eva-outcome="'+focusOutcome+'"]')?.focus({preventScroll:true});
}
function patchSummary(){
 const a=current();if(!a||!$('evaStats'))return;
 $('evaStats').outerHTML=stats(a);
 const rows=C.slots(a);
 for(const id of ['site',...C.units(a).map(u=>u.id)]){const el=$('evaCount-'+id);if(!el)continue;const mine=rows.filter(r=>id==='site'?!r.unit:r.unit?.id===id);el.textContent=mine.filter(r=>C.state(C.answer(a,r.key))!=='todo').length+'/'+mine.length;}
 if($('evaPack'))$('evaPack').outerHTML=packCard(a);
}
function msg(key,text){const el=$('evaMsg-'+rowId(key));if(el)el.textContent=text;}
function refresh(){if(window.EVWorkspace?.route()==='audit')EVWorkspace.refresh();}
// Open the audit page at a section: the set-up card, the checks, or the first fail still without a photo.
function show(section){
 EVWorkspace.go('audit');
 const a=current();if(!a)return;
 let id=section==='setup'?'evaSetup':'evaChecks';
 if(section==='evidence'){const f=C.findings(a).find(x=>x.answer.outcome==='fail'&&!x.answer.photos.length)||C.findings(a)[0];if(f){opened.add(f.key);patchRow(f.key);id=rowId(f.key);}}
 requestAnimationFrame(()=>{const el=$(id);if(!el)return;el.scrollIntoView({block:'start'});const target=el.querySelector('input,textarea,button');if(section==='setup'&&target)target.focus({preventScroll:true});});
}
function setOutcome(key,value){
 const a=current();if(!a||!C.outcome(value))return;const ans=C.answerFor(a,key);if(ans.outcome===value)return;
 pushHist();ans.outcome=value;ans.at=new Date().toISOString();ans.by=a.auditor||'';
 if(value!=='pass')opened.add(key);
 saved();patchRow(key,value);patchSummary();
}

/* ---------- photos ---------- */
function decode(src){return new Promise((resolve,reject)=>{const im=new Image();const timer=setTimeout(()=>{im.onload=im.onerror=null;reject(Error('The photo took too long to read.'));},20000);im.onload=()=>{clearTimeout(timer);resolve(im);};im.onerror=()=>{clearTimeout(timer);reject(Error('That photo could not be read. Try a JPG, PNG or HEIC file.'));};im.src=src;});}
async function encode(src){
 const im=await decode(src),r=Math.min(1,PHOTO_MAX/Math.max(im.width||1,im.height||1)),cn=document.createElement('canvas');
 cn.width=Math.max(1,Math.round((im.width||1)*r));cn.height=Math.max(1,Math.round((im.height||1)*r));
 const c=cn.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,cn.width,cn.height);c.drawImage(im,0,0,cn.width,cn.height);
 return cn.toDataURL('image/jpeg',.85);
}
async function addPhotos(key,files){
 const a=current();if(!a)return;const ans=C.answerFor(a,key),room=PHOTO_LIMIT-ans.photos.length;
 if(room<=0){msg(key,'Up to '+PHOTO_LIMIT+' photos per check. Remove one first.');return;}
 let list=[...files].slice(0,room).map(f=>({name:f.name,blob:f}));if(!list.length)return;
 msg(key,'Preparing '+(list.length===1?'photo':'photos')+'…');
 try{
  if(typeof normaliseSources==='function')list=await normaliseSources(list);
  const added=[];
  for(const item of list){
   if(item.blob.size>30*1024*1024)throw Error('Each photo must be under 30 MB.');
   const url=URL.createObjectURL(item.blob);
   try{added.push({id:uid(),src:await encode(url),name:String(item.name||'photo').slice(0,120),at:new Date().toISOString()});}
   finally{URL.revokeObjectURL(url);}
  }
  if(!added.length)throw Error('That photo could not be read. Try a JPG, PNG or HEIC file.');
  pushHist();ans.photos.push(...added);saved();patchRow(key);patchSummary();msg(key,count(added.length,'photo')+' added.');
 }catch(err){msg(key,err?.message||'The photo could not be added.');}
}
function picker(key){
 const el=document.querySelector('[data-eva-photos="'+key.replace(/"/g,'')+'"]');if(!el)return;
 let box=el.nextElementSibling?.classList.contains('eva-picker')?el.nextElementSibling:null;
 if(box){box.remove();return;}
 box=document.createElement('div');box.className='eva-picker';box.innerHTML='<b>Choose a project photo or plan</b><div>'+pack.photos.map(p=>'<button type="button" data-eva-pick-photo="'+h(p.id)+'" data-eva-key="'+h(key)+'"><img src="'+h(p.thumb||p.src)+'" alt=""><span>'+h(p.name||'Plan')+'</span></button>').join('')+'</div>';
 el.after(box);box.querySelector('button')?.focus();
}
async function pickPhoto(key,id){
 const a=current(),p=pack.photos.find(x=>x.id===id);if(!a||!p)return;const ans=C.answerFor(a,key);
 if(ans.photos.length>=PHOTO_LIMIT){msg(key,'Up to '+PHOTO_LIMIT+' photos per check. Remove one first.');return;}
 msg(key,'Preparing photo…');
 try{const src=await encode(p.src);pushHist();ans.photos.push({id:uid(),src,name:String(p.name||'Plan').slice(0,120),at:new Date().toISOString()});saved();patchRow(key);patchSummary();msg(key,'Project photo added.');}
 catch(err){msg(key,err?.message||'The photo could not be added.');}
}
function openLightbox(key,id){
 const a=current(),ans=C.answer(a,key),p=ans?.photos?.find(x=>x.id===id),check=C.check(key.split(':')[0]);if(!p||!check)return;
 lightReturn=document.activeElement;
 let box=$('evaLightbox');if(!box){box=document.createElement('div');box.id='evaLightbox';box.className='ev-backdrop eva-lightbox';document.body.append(box);
  box.addEventListener('click',e=>{if(e.target===box||e.target.closest('[data-eva-close]'))closeLightbox();else if(e.target.closest('[data-eva-remove-photo]'))removePhoto();});
  box.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();closeLightbox();}});}
 box.dataset.key=key;box.dataset.photo=id;box.hidden=false;
 box.innerHTML='<div class="ev-dialog eva-lightbox-dialog" role="dialog" aria-modal="true" aria-labelledby="evaLightboxTitle"><div class="ev-dialog-head"><div><h2 id="evaLightboxTitle">'+h(check.id+' · '+check.title)+'</h2><p>'+h(p.name||'Photo')+(p.at?' · '+h(niceDate(p.at)):'')+'</p></div><button type="button" class="ev-icon-btn" data-eva-close aria-label="Close photo">'+icon('close')+'</button></div><div class="eva-lightbox-body"><img src="'+h(p.src)+'" alt="'+h(p.name||'Evidence photo')+'"></div><div class="ev-dialog-foot"><span class="ed-help">Saved with the project and included in the evidence pack.</span><div class="ev-actions"><button type="button" class="ev-btn" data-eva-remove-photo>Remove photo</button><button type="button" class="ev-btn primary" data-eva-close>Done</button></div></div></div>';
 $('evApp').inert=true;box.querySelector('[data-eva-close]').focus();
}
function closeLightbox(){const box=$('evaLightbox');if(!box||box.hidden)return;box.hidden=true;box.innerHTML='';$('evApp').inert=false;if(lightReturn?.isConnected)lightReturn.focus({preventScroll:true});lightReturn=null;}
function removePhoto(){
 const box=$('evaLightbox'),key=box?.dataset.key,id=box?.dataset.photo,a=current(),ans=a&&C.answer(a,key);if(!ans)return;
 const i=ans.photos.findIndex(p=>p.id===id);if(i<0)return;
 pushHist();ans.photos.splice(i,1);saved();lightReturn=null;closeLightbox();patchRow(key);patchSummary();$(rowId(key))?.querySelector('.eva-add,.eva-thumb')?.focus({preventScroll:true});
}

/* ---------- events ---------- */
const onPage=()=>window.EVWorkspace?.route()==='audit'&&current();
document.addEventListener('click',async e=>{
 if(!onPage())return;const a=current();
 const outcome=e.target.closest('[data-eva-outcome]');if(outcome){setOutcome(outcome.dataset.evaKey,outcome.dataset.evaOutcome);return;}
 const toggle=e.target.closest('[data-eva-toggle]');if(toggle){const key=toggle.dataset.evaToggle;if(opened.has(key))opened.delete(key);else opened.add(key);patchRow(key);$(rowId(key))?.querySelector('[data-eva-toggle]')?.focus({preventScroll:true});return;}
 const type=e.target.closest('[data-eva-site-type]');if(type){if(a.siteType===type.dataset.evaSiteType)return;pushHist();a.siteType=type.dataset.evaSiteType;saved();refresh();return;}
 const pub=e.target.closest('[data-eva-public]');if(pub){const v=pub.dataset.evaPublic==='true';if(a.isPublic===v)return;pushHist();a.isPublic=v;saved();refresh();return;}
 if(e.target.closest('[data-eva-add-unit]')){pushHist();a.units.push(C.nextUnit(a));saved();refresh();requestAnimationFrame(()=>$('evaUnit-'+a.units.at(-1).id)?.querySelector('input')?.focus());return;}
 const remove=e.target.closest('[data-eva-remove-unit]');if(remove){const u=a.units.find(x=>x.id===remove.dataset.evaRemoveUnit);if(!u)return;const answered=C.slots(a).filter(r=>r.unit===u&&C.state(C.answer(a,r.key))!=='todo').length;
  if(answered&&typeof askConfirm==='function'&&!await askConfirm({title:'Remove '+unitLabel(u)+'?',label:count(answered,'answered check')+' and any photos for it will be removed.',okText:'Remove'}))return;
  pushHist();C.removeUnit(a,u.id);saved();refresh();return;}
 const copy=e.target.closest('[data-eva-copy]');if(copy){const from=C.units(a)[0],to=copy.dataset.evaCopy;if(!C.slots(a).some(r=>r.unit===from&&C.state(C.answer(a,r.key))!=='todo')){toast('Nothing to copy yet: answer '+unitLabel(from)+' first.');return;}pushHist();const n=C.copyAnswers(a,from.id,to);if(!n){toast('Every answer here is already recorded.');return;}saved();C.slots(a).filter(r=>r.unit?.id===to).forEach(r=>patchRow(r.key));patchSummary();toast(count(n,'answer')+' copied');return;}
 const view=e.target.closest('[data-eva-view]');if(view){openLightbox(view.dataset.evaKey,view.dataset.evaView);return;}
 const pick=e.target.closest('[data-eva-pick]');if(pick){picker(pick.dataset.evaPick);return;}
 const chosen=e.target.closest('[data-eva-pick-photo]');if(chosen){chosen.closest('.eva-picker')?.remove();await pickPhoto(chosen.dataset.evaKey,chosen.dataset.evaPickPhoto);return;}
});
document.addEventListener('input',e=>{
 if(!onPage())return;const a=current(),t=e.target;
 if(t.dataset.evaField){edit(t);pack[t.dataset.evaField]=t.value;if(t.dataset.evaField==='name'&&$('packname'))$('packname').value=pack.name;if(typeof syncSiteChip==='function')syncSiteChip();saved();return;}
 if(t.dataset.evaAfield){edit(t);a[t.dataset.evaAfield]=t.value;saved();return;}
 if(t.dataset.evaUnitField){const [k,id]=t.dataset.evaUnitField.split(':'),u=a.units.find(x=>x.id===id);if(!u)return;edit(t);u[k]=t.value;saved();
  const title=$('evaGroupTitle-'+id),sub=$('evaGroupSub-'+id);if(title)title.textContent=unitLabel(u);if(sub)sub.textContent=unitMeta(u)||'Chargepoint checks';return;}
 if(t.dataset.evaNote){const ans=C.answerFor(a,t.dataset.evaNote);edit(t);ans[C.state(ans)==='na'?'reason':'note']=t.value;saved();return;}
 if(t.dataset.evaMeasure){edit(t);C.answerFor(a,t.dataset.evaMeasure).measure=t.value;saved();}
});
document.addEventListener('focusout',e=>{const t=e.target;if(!(t instanceof Element)||!t.dataset?.evaEdited)return;delete t.dataset.evaEdited;if(onPage()&&(t.dataset.evaNote||t.dataset.evaMeasure||t.dataset.evaAfield||t.dataset.evaField))patchSummary();});
document.addEventListener('change',e=>{const t=e.target;if(!onPage()||!t.dataset?.evaUpload)return;const files=[...(t.files||[])];t.value='';if(files.length)addPhotos(t.dataset.evaUpload,files);});

/* ---------- stages and overview ---------- */
function stages(){
 const a=current(),s=C.summary(a),issues=(pack.workspace?.issues||[]).filter(i=>/evidence pack/i.test(i.label||'')).length;
 const noPhoto=C.findings(a).filter(f=>f.answer.outcome==='fail'&&!f.answer.photos.length).length;
 return [
  ['audit-setup','Set up','plan',C.setupComplete(a)?['done',C.siteType(a.siteType).name]:['todo','Site type to choose']],
  ['audit','Checks','check',!s.total?['todo','No checks apply']:!s.todo?['done','All '+s.total+' answered']:s.done?['active',s.done+' of '+s.total+' answered']:['todo',count(s.total,'check')+' to answer']],
  ['audit-evidence','Evidence','photo',noPhoto?['attention',count(noPhoto,'fail')+' without a photo']:s.photos?['done',count(s.photos,'photo')]:['todo','No photos yet']],
  ['audit-pack','Pack','file',issues?['done',count(issues,'download')]:['todo','Not downloaded yet']]
 ];
}
const stageLabel={done:'Done',active:'In progress',attention:'Needs attention',todo:'To do'};
function stageStrip(route){
 let steps;try{steps=stages();}catch(_){return '';}
 return '<nav class="ev-stage-strip eva-stages" aria-label="Audit stages"><ol>'+steps.map(([a,t,ic,[state,d]],i)=>'<li><button type="button" class="ev-stage '+state+(a===route?' current':'')+'" data-ev-action="'+a+'"'+(a===route?' aria-current="page"':'')+' title="'+h(d)+'"><span class="ev-stage-mark">'+icon(state==='done'?'check':state==='attention'?'alert':ic)+'</span><span class="ev-stage-copy"><small>Step '+(i+1)+'<span class="ed-sr-only"> · '+stageLabel[state]+'</span></small><b>'+t+'</b></span></button></li>').join('')+'</ol></nav>';
}
function flow(){
 return '<nav class="ev-flow eva-flow" aria-label="Audit stages"><ol>'+stages().map(([a,t,ic,[state,d]],i)=>'<li><button type="button" class="ev-flow-step '+state+'" data-ev-action="'+a+'"><span class="ev-flow-mark">'+icon(state==='done'?'check':state==='attention'?'alert':ic)+'</span><span class="ev-flow-copy"><small>Step '+(i+1)+'<span class="ed-sr-only"> · '+stageLabel[state]+'</span></small><b>'+t+'</b><em>'+h(d)+'</em></span></button></li>').join('')+'</ol></nav>';
}
// The overview of an audit-only project: progress, findings and the pack instead of plans and programme.
function overview(){
 const a=current(),s=C.summary(a),P=parts(),w=pack.workspace||{},issues=Array.isArray(w.issues)?w.issues:[],findings=C.findings(a),tasks=[];
 if(!C.setupComplete(a))tasks.push(['audit-setup','Finish the set-up','Choose the site type and whether the site is open to the public','plan']);
 if(!siteName())tasks.push(['audit-setup','Add the site name','Enter it in the site and audit details','plan']);
 if(s.todo)tasks.push(['audit',s.done?'Continue the checks':'Start the checks',s.done+' of '+s.total+' answered','check']);
 const noPhoto=findings.filter(f=>f.answer.outcome==='fail'&&!f.answer.photos.length).length;if(noPhoto)tasks.push(['audit-evidence','Add photos to '+count(noPhoto,'fail'),'A fail needs a photo in the pack','photo']);
 if(!tasks.length)tasks.push(['audit-pack','Make the evidence pack','Review the findings and download the PDF','file']);
 const kv=[['Site type',C.siteType(a.siteType)?.name||''],['Public access',a.isPublic===true?'Open to the public':a.isPublic===false?'Not open to the public':''],['Operator',a.operator],['Chargepoints',C.units(a).map(unitLabel).join(', ')],['Auditor',a.auditor],['Audit date',niceDate(a.date)]];
 return '<div class="ev-overview-heading"><div><div class="ev-eyebrow">Site audit'+(pack.jobRef?' / '+h(pack.jobRef):'')+'</div><h1>'+h(siteName()||'Site audit')+'</h1><p>'+h([pack.address,pack.postcode].filter(Boolean).join(', ')||'Add the site address in the audit set-up.')+'</p></div>'+btn('Edit details','audit-setup','','pen')+'</div>'+flow()+(P.backupNudge?P.backupNudge():'')+
 '<div class="ev-overview-grid"><section class="ev-card eva-progress-card"><div class="ev-card-head"><h2>Audit progress</h2><span class="ev-pill'+(s.fail?' red':s.action?' amber':s.total&&!s.todo?' green':'')+'">'+s.pct+'% answered</span></div><div class="ev-card-body">'+meter(s.pct,s.done+' of '+s.total+' checks answered')+'</div>'+
 '<div class="ev-metrics">'+[['check','Answered',s.done+' / '+s.total,''],['check','Pass',s.pass,''],['alert','Action needed',s.action,s.action?'amber':''],['alert','Fail',s.fail,s.fail?'amber':'']].map(([ic,t,n,c])=>'<div class="ev-metric"><span class="ev-metric-icon '+c+'">'+icon(ic)+'</span><div><b>'+n+'</b><span>'+t+'</span></div></div>').join('')+'</div>'+
 '<div class="ev-card-body">'+(findings.length?'<h3 class="eva-subheading">Findings</h3><ul class="eva-finding-list">'+findings.slice(0,6).map(f=>'<li><span class="ev-pill '+pillClass[f.answer.outcome]+'">'+h(C.outcome(f.answer.outcome).short)+'</span><div><b>'+h(f.check.id+' · '+f.check.title)+'</b><small>'+h(f.unit?unitLabel(f.unit):'Site')+(f.answer.note?.trim()?' · '+h(f.answer.note.trim()):'')+'</small></div></li>').join('')+'</ul>'+(findings.length>6?'<p class="eva-help">'+(findings.length-6)+' more in the checks.</p>':''):'<p class="eva-help">'+(s.done?'No fails or actions recorded so far.':'Answer the checks to build the findings list.')+'</p>')+btn(s.todo?'Continue the checks':'Open the checks','audit','primary','arrow')+'</div></section>'+
 '<div class="ev-overview-side"><section class="ev-card ev-next-card"><div class="ev-card-head"><h2>Next actions</h2><span class="ev-task-count">'+tasks.length+'</span></div><div class="ev-next-list">'+tasks.map(([act,t,d,ic])=>'<button type="button" data-ev-action="'+act+'"><span class="ev-next-icon">'+icon(ic)+'</span><span><b>'+h(t)+'</b><small>'+h(d)+'</small></span>'+icon('arrow')+'</button>').join('')+'</div></section>'+
 '<section class="ev-card"><div class="ev-card-head"><h2>Site and operator</h2>'+btn('Edit','audit-setup','quiet')+'</div><div class="ev-card-body"><dl class="ev-kv">'+kv.map(([t,v])=>'<dt>'+t+'</dt><dd>'+(v?h(v):'<span class="ev-muted">Not recorded</span>')+'</dd>').join('')+'</dl></div></section></div></div>'+
 '<div class="ev-dashboard-bottom eva-bottom"><section class="ev-card ev-downloads-card"><div class="ev-card-head"><h2>Recent downloads</h2>'+icon('file')+'</div><div class="ev-card-body">'+(issues.length?'<ul class="ev-download-list">'+issues.slice(-3).reverse().map(i=>'<li><b>'+h(i.label)+'</b><small>Rev '+h(i.rev)+' · '+h(niceDate(i.at))+'</small></li>').join('')+'</ul>':'<p>The evidence pack download will appear here.</p>')+btn('Review evidence pack','audit-pack','','arrow')+'</div></section>'+(P.backupCard?P.backupCard():'')+'</div>';
}
// A normal project's overview: the next step and a card to start or continue its audit.
function task(){const a=current();if(!a)return null;const s=C.summary(a);return s.todo?['audit',s.done?'Continue the site audit':'Start the site audit checks',s.done+' of '+s.total+' checks answered','check']:null;}
function card(){
 const a=current(),s=a?C.summary(a):null;
 return '<section class="ev-card eva-overview-card"><div class="ev-card-head"><h2>Site audit</h2>'+(s?'<span class="ev-task-count">'+s.done+'/'+s.total+'</span>':icon('check'))+'</div><div class="ev-card-body">'+(s?meter(s.pct,s.done+' of '+s.total+' checks answered')+'<p>'+h(s.fail||s.action?count(s.fail,'fail')+' and '+count(s.action,'action')+' recorded.':s.todo?'Checks against '+STANDARDS+'.':'All checks answered.')+'</p>'+btn(s.todo?'Continue audit':'Review evidence pack',s.todo?'audit':'audit-pack','','arrow'):'<p>Check an existing site against '+STANDARDS+' and make an evidence pack.</p>'+btn('Audit this site','audit','','check'))+'</div></section>';
}

/* ---------- evidence pack PDF ---------- */
function summaryLine(s){
 if(!s.total)return 'No checks apply to this site as set up.';
 const bits=[s.pass+' pass'+(s.pass===1?'':'es'),s.action+' action'+(s.action===1?'':'s')+' needed',count(s.fail,'fail'),s.na+' not applicable'];
 return s.done+' of '+s.total+' checks answered: '+bits.join(', ')+'.'+(s.todo?' '+count(s.todo,'check')+' still to answer.':'');
}
async function buildPack(options={}){
 const a=current();if(!a)throw Error('Start the site audit before making its pack.');
 const D=window.EVDelivery;if(!D?.pdfKit)throw Error('The report tools have not loaded. Reload the page and try again.');
 await D.reportFonts();
 const s=C.summary(a),rows=C.slots(a),findings=C.findings(a),units=C.units(a),k=D.pdfKit('Site audit evidence pack');
 const where=r=>r.unit?unitLabel(r.unit):'Site',outcomeName=ans=>{const st=C.state(ans);return st==='todo'?'Not answered':C.outcome(st).label;};
 const measure=(check,ans)=>check.measure&&ans?.measure?.trim()?check.measure.label+': '+ans.measure.trim()+' '+check.measure.unit+' (limit '+check.measure.limit+')':'';
 const recorded=(check,ans)=>{const st=C.state(ans);if(st==='todo')return ' ';const bits=[];if(st==='na')bits.push(ans.reason?.trim()||'No reason recorded');else if(ans.note?.trim())bits.push(ans.note.trim());const m=measure(check,ans);if(m)bits.push(m);if(st!=='na'&&ans.photos?.length)bits.push(count(ans.photos.length,'photo'));return bits.join('\n')||' ';};
 k.details([['Site type',C.siteType(a.siteType)?.name||'Not recorded'],['Public access',a.isPublic===true?'Open to the public':a.isPublic===false?'Not open to the public':'Not recorded'],['Operator (CPO)',a.operator],['Chargepoints',units.map(u=>unitLabel(u)+(unitMeta(u)?' ('+unitMeta(u)+')':'')).join('\n')],['Auditor',a.auditor],['Audit date',niceDate(a.date)||'Not recorded'],['Standards',STANDARDS]]);
 k.paragraph('This pack records a site audit of an existing EV charging site against PAS 1899:2022 (accessible public chargepoints) and the Public Charge Point Regulations 2023. It sets out what was checked, what was found and the evidence recorded, to support a council or funder submission. It is not a certificate of compliance.',9,false,k.C.dim);
 if(a.notes){k.section('Audit notes');k.paragraph(a.notes);}
 k.section('Summary');k.paragraph(summaryLine(s),10,true);
 k.table(['Outcome','Checks','Meaning'],[['Pass',String(s.pass),'Meets the requirement as found on site.'],['Action needed',String(s.action),'Falls short; a fix is planned or needed.'],['Fail',String(s.fail),'Does not meet the requirement. A firm finding.'],['Not applicable',String(s.na),'Considered and recorded as not applying, with the reason.'],['Not answered',String(s.todo),'Still to be checked.']],[40,24,118]);
 k.section('Actions list');
 if(findings.length)k.table(['Ref','Check','Where','Outcome','Suggested fix and indicative cost'],findings.map(f=>[f.check.id+'\n'+C.SEVERITY[f.check.sev],f.check.title,where(f),C.outcome(f.answer.outcome).label,[f.check.fix,f.check.cost].filter(Boolean).join('\n')]),[20,58,26,24,54]);
 else k.paragraph('No fails or actions needed were recorded.');
 if(findings.length){
  k.newPage('Findings');
  for(const f of findings){
   const ans=f.answer,check=f.check;k.ensure(60);k.section(check.id+' · '+check.title);
   k.table(['Finding','Recorded information'],[['Where',where(f)],['Outcome',C.outcome(ans.outcome).label+' · '+C.SEVERITY[check.sev]],['Reference',check.cite+(check.deadline?' · '+check.deadline:'')],['Why it matters',check.why],['Note',ans.note?.trim()||'No note recorded'],...(check.measure?[[check.measure.label,ans.measure?.trim()?ans.measure.trim()+' '+check.measure.unit+' (limit '+check.measure.limit+')':'Not measured']]:[]),['Suggested fix',check.fix],['Indicative cost',check.cost],['Recorded',[niceDate(ans.at),ans.by].filter(Boolean).join(' · ')]],[43,139]);
   if(options.photos!==false&&ans.photos?.length){
    const iw=(k.width-6)/2,ih=64;
    for(let i=0;i<ans.photos.length;i+=2){
     k.ensure(ih+12);const top=k.y;
     for(let j=0;j<2&&i+j<ans.photos.length;j++){const p=ans.photos[i+j],x=k.M+j*(iw+6);let im;try{im=await decode(p.src);}catch{throw Error('A photo for '+check.id+' could not be loaded. Replace it or leave photos out.');}
      const cn=document.createElement('canvas');cn.width=im.width;cn.height=im.height;const c=cn.getContext('2d');c.fillStyle='white';c.fillRect(0,0,cn.width,cn.height);c.drawImage(im,0,0);
      const r=Math.min(iw/im.width,ih/im.height),w=im.width*r,ht=im.height*r;k.doc.setFillColor(...k.C.soft);k.doc.rect(x,top,iw,ih,'F');k.doc.addImage(cn.toDataURL('image/jpeg',.86),'JPEG',x+(iw-w)/2,top+(ih-ht)/2,w,ht,undefined,'FAST');
      k.write(k.fit(p.name||'Photo',iw,7),x,top+ih+4,7,false,k.C.dim);}
     k.y=top+ih+9;
    }
   }
  }
 }
 if(options.scope!=='findings'){
  k.newPage('Full checklist');
  let starred=false;
  for(const sec of C.SECTIONS){
   const mine=rows.filter(r=>r.check.section===sec.id);if(!mine.length)continue;
   k.section(sec.name+' · '+sec.reg);k.paragraph(sec.scope,8.5,false,k.C.dim);
   k.table(['Ref','Check','Where','Outcome','Note, reason or measurement'],mine.map(r=>{const ans=C.answer(a,r.key);if(r.check.verify&&C.state(ans)!=='todo')starred=true;return [r.check.id+(r.check.verify?' *':''),r.check.title,where(r),outcomeName(ans),recorded(r.check,ans)];}),[18,62,26,24,52]);
  }
  if(starred)k.paragraph('* The threshold values for this check come from the draft check library and need confirming against your copy of PAS 1899:2022.',8,false,k.C.dim);
  const ex=C.excluded(a);
  if(ex.length){k.section('Checks that do not apply to this site');k.table(['Ref','Check','Reason recorded'],ex.map(({check,reason})=>[check.id,check.title,reason]),[18,74,90]);}
 }
 if(options.plans&&pack.photos.length){
  for(const p of pack.photos.filter(x=>x.includeInPdf!==false)){
   await D.preparePlan(p);const cn=renderPhotoToCanvas(p,2000);k.newPage('Site plan');k.paragraph(p.name||'Site plan',11,true);
   const available=k.B-k.y-3,r=Math.min(k.width/cn.width,available/cn.height);k.doc.addImage(cn,'PNG',k.M+(k.width-cn.width*r)/2,k.y,cn.width*r,cn.height*r,undefined,'FAST');
  }
 }
 k.ensure(60);k.section('About this pack');
 k.paragraph('The check wording is draft v0.9 and pending specialist review. Clauses marked for confirmation should be checked against the purchased text of PAS 1899:2022; the Public Charge Point Regulations 2023 are enforced by the Office for Product Safety and Standards and the duties fall on the chargepoint operator. This pack supports a submission and does not certify compliance with either standard. Electrical matters need a qualified person.',8.5,false,k.C.dim);
 return k.footer();
}
function gaps(){const a=current();return a?C.gaps(a,{name:siteName()}):['Start the site audit first.'];}
window.EVAudit={render,overview,card,task,stageStrip,flow,start,isAuditProject,show,buildPack,gaps,summary:()=>{const a=audit();return a?C.indexSummary(a):null;},closeLightbox,version:'audit-1'};
})();
