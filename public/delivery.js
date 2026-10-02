/* Delivery workflows adapted from Commercial Build 129 for generic EV projects. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dayMs=86400000;
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const parse=v=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(v||''))return null;const d=new Date(v+'T12:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===v?d:null;};
const iso=d=>d?d.toISOString().slice(0,10):'';
const date=v=>{const d=v instanceof Date?v:parse(v);return d?d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}):'Not set';};
const dateShort=d=>d?d.toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'}):'Not set';
const legacyDate=v=>{if(parse(v))return v;const m=String(v||'').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);return m&&parse(m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'))?m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'):'';};
const fixedDate=v=>parse(v)?v.split('-').reverse().join('/'):'';
const duration=v=>Math.min(3660,Math.max(1,Math.round(Number(v)||1)));
const statusNames={planned:'Planned',inprogress:'In progress',complete:'Complete'};
const severityNames={minor:'Minor',major:'Major',safety:'Safety'};
let snagFilter='all',snagSeverity='all',snagSearch='',busy=false,session=null,pdfDocument=null,renderTask=null;
let reportViewer=null;
const modal=document.createElement('div');modal.id='edModal';modal.className='ev-backdrop';modal.hidden=true;document.body.append(modal);
const button=(t,action,style='')=>'<button type="button" class="ev-btn '+style+'" data-ed-action="'+action+'">'+t+'</button>';
const select=(label,key,value,options)=>'<label class="ev-field">'+label+'<select data-ed-field="'+key+'">'+options.map(([v,t])=>'<option value="'+esc(v)+'" '+(v===value?'selected':'')+'>'+t+'</option>').join('')+'</select></label>';
const field=(label,key,value,type='text',wide=false,help='')=>'<label class="ev-field '+(wide?'wide':'')+'">'+label+(type==='textarea'?'<textarea rows="3" data-ed-field="'+key+'">'+esc(value)+'</textarea>':'<input data-ed-field="'+key+'" type="'+type+'" value="'+esc(value)+'" '+(type==='number'?'min="1" max="3660" step="1"':'')+'>')+(help?'<small>'+help+'</small>':'')+'</label>';
const note=t=>'<p class="ed-help">'+t+'</p>';
const pill=(t,c='')=>'<span class="ev-pill '+c+'">'+esc(t)+'</span>';
const changed=()=>{autosave();};

// Additional activity fields live in the existing programme record; legacy fields remain intact.
function programme(){
 const p=progState();
 if(!Array.isArray(p.activities)){
  p.activities=progAutoPhases().map(a=>({id:uid(),source:a.k,name:a.t,days:duration(p.days[a.k]??a.d),note:a.note,owner:'',start:'',status:'planned',included:p.skip[a.k]!==true}));
  p.schema=2;
 }
 if(!Array.isArray(p.nonWorkingDates))p.nonWorkingDates=[];
 return p;
}
function working(d,p){return d.getUTCDay()!==0&&d.getUTCDay()!==6&&!p.nonWorkingDates.includes(iso(d));}
function nextWorking(d,p){const x=new Date(d);let guard=0;while(!working(x,p)){x.setUTCDate(x.getUTCDate()+1);if(++guard>10000)throw Error('Check the programme calendar.');}return x;}
function after(d,p){const x=new Date(d);x.setUTCDate(x.getUTCDate()+1);return nextWorking(x,p);}
function endDate(d,n,p){let x=nextWorking(d,p);for(let i=1;i<duration(n);i++)x=after(x,p);return x;}
function schedule(){
 const p=programme();let cursor=parse(p.start);if(cursor)cursor=nextWorking(cursor,p);
 return p.activities.map(a=>{
  const days=duration(a.days),included=a.included!==false;
  const requested=parse(a.start),from=included?(requested?nextWorking(requested,p):cursor):null;
  const to=from?endDate(from,days,p):null;
  if(included)cursor=to?after(to,p):null;
  return {...a,days,included,from,to,shifted:!!requested&&iso(from)!==iso(requested)};
 });
}
function bounds(rows){const dated=rows.filter(r=>r.included&&r.from);if(!dated.length)return null;const from=new Date(Math.min(...dated.map(r=>+r.from))),to=new Date(Math.max(...dated.map(r=>+r.to)));return{from,to,span:Math.max(1,Math.round((to-from)/dayMs)+1)};}
function programmeSummary(){const rows=schedule(),active=rows.filter(r=>r.included),b=bounds(rows);return{rows,active,b,complete:active.filter(r=>r.status==='complete').length,undated:active.filter(r=>!r.from).length};}
function timeline(rows){
 const b=bounds(rows);if(!b)return '<div class="ev-empty"><b>Set a start date to see the timeline</b>Activities can follow one another or have their own start date.</div>';
 const dated=rows.filter(r=>r.included&&r.from);
 const ticks=Array.from({length:5},(_,i)=>{const d=new Date(+b.from+Math.round((b.span-1)*i/4)*dayMs);return '<span>'+esc(dateShort(d))+'</span>';}).join('');
 return '<div class="ed-timeline" tabindex="0" role="region" aria-label="Programme timeline. Scroll horizontally on smaller screens."><div class="ed-timeline-inner"><div class="ed-time-head"><b>Activity</b><div>'+ticks+'</div></div>'+dated.map(r=>'<div class="ed-time-row"><div class="ed-time-label"><b>'+esc(r.name||'Untitled activity')+'</b><small>'+esc(r.owner||'Not assigned')+'</small></div><div class="ed-time-track"><span class="ed-time-bar '+esc(r.status||'planned')+'" style="left:'+((r.from-b.from)/dayMs/b.span*100)+'%;width:'+(Math.max(0.4,((r.to-r.from)/dayMs+1)/b.span*100))+'%" title="'+esc(date(r.from)+' to '+date(r.to))+'"></span></div></div>').join('')+'</div></div>';
}
function mountProgramme(){
 const el=$('evProgrammeMount');if(!el)return;
 const p=programme(),s=programmeSummary();
 el.innerHTML='<div class="ed-toolbar ev-card"><label class="ev-field">Start on site<input type="date" id="edProgrammeStart" value="'+esc(p.start)+'"></label><div class="ed-toolbar-copy"><b>'+s.active.length+' activities · '+s.complete+' complete</b><small>'+(s.b?date(s.b.from)+' to '+date(s.b.to):'Dates have not been set')+(s.undated?' · '+s.undated+' undated':'')+'</small></div><div class="ev-actions">'+button('Add activity','add-activity')+button('Review programme PDF','programme-report','primary')+'</div></div>'+
 '<section class="ev-card"><div class="ev-card-head"><h2>Programme timeline</h2><div class="ed-legend"><span>Planned</span><span class="progress">In progress</span><span class="complete">Complete</span></div></div>'+timeline(s.rows)+'</section>'+
 '<section class="ev-card"><div class="ev-card-head"><h2>Activities & responsibilities</h2>'+button('Add suggestions from markup','suggest')+'</div><div class="ed-activity-list">'+(s.rows.length?s.rows.map((r,i)=>'<article class="ed-activity '+(!r.included?'excluded':'')+'"><span class="ed-number">'+String(i+1).padStart(2,'0')+'</span><div class="ed-activity-name"><b>'+esc(r.name||'Untitled activity')+'</b><small>'+esc(r.owner||'Not assigned')+'</small></div><div class="ed-activity-dates"><b>'+(r.included?(r.from?esc(dateShort(r.from)+' to '+dateShort(r.to)):'Dates not set'):'Excluded')+'</b><small>'+r.days+' working day'+(r.days===1?'':'s')+(r.start?' · separate start date':' · follows previous')+'</small></div>'+pill(statusNames[r.status]||'Planned',r.status==='complete'?'green':r.status==='inprogress'?'amber':'')+'<button class="ev-btn" data-ed-activity="'+esc(r.id)+'">Edit<span class="ed-sr-only"> '+esc(r.name)+'</span></button></article>').join(''):'<div class="ev-empty"><b>No activities yet</b>Add an activity or use suggestions from the site markup.</div>')+'</div></section>'+
 '<section class="ev-card"><div class="ev-card-head"><h2>Working calendar & programme notes</h2></div><div class="ev-card-body ev-form"><label class="ev-field">Additional non-working dates<textarea id="edNonWorking" rows="3" placeholder="2026-12-25&#10;2026-12-28">'+esc(p.nonWorkingDates.join('\n'))+'</textarea><small>One date per line, YYYY-MM-DD. Weekends are excluded automatically.</small><span id="edCalendarError" role="alert"></span></label><label class="ev-field">Programme notes<textarea id="edProgrammeNotes" rows="3" placeholder="Access arrangements, agreed working hours or dates to confirm">'+esc(p.notes||'')+'</textarea><small>Included in the programme PDF.</small></label></div></section>'+note('Dates use Monday to Friday and the additional non-working dates above. Give an activity its own start date to plan overlapping work. Durations suggested from the markup remain editable.');
 $('edProgrammeStart').onchange=e=>{pushHist();p.start=e.target.value;changed();mountProgramme();};
 $('edNonWorking').onchange=e=>{const raw=e.target.value.split(/[\s,;]+/).filter(Boolean);if(raw.some(v=>!parse(v))){$('edCalendarError').textContent='Use valid dates in YYYY-MM-DD format.';e.target.setAttribute('aria-invalid','true');return;}pushHist();p.nonWorkingDates=[...new Set(raw)].sort();changed();mountProgramme();};
 let notesEdited=false;
 $('edProgrammeNotes').onblur=()=>{notesEdited=false;};
 $('edProgrammeNotes').oninput=e=>{if(!notesEdited){pushHist();notesEdited=true;}p.notes=e.target.value;changed();};
}
function openDialog(type,title,sub,body,foot='',wide=false){
 if(busy)return;
 session={type,focus:document.activeElement,history:false};
 $('evApp').inert=true;modal.hidden=false;
 modal.innerHTML='<div class="ev-dialog ed-dialog '+(wide?'ed-report-dialog':'')+'" role="dialog" aria-modal="true" aria-labelledby="edTitle"><div class="ev-dialog-head"><div><h2 id="edTitle">'+esc(title)+'</h2><p>'+esc(sub)+'</p></div><button class="ev-icon-btn" data-ed-action="close" aria-label="Close '+esc(title)+'">×</button></div><div class="ev-dialog-body" id="edBody">'+body+'</div><div class="ev-dialog-foot"><span id="edMessage" class="ed-help" role="status">Changes save automatically.</span><div class="ev-actions">'+foot+button('Done','close','primary')+'</div></div></div>';
 modal.querySelector('input,textarea,select,button')?.focus();
}
function closeDialog(){
 if(busy)return;
 const prev=session?.focus,kind=session?.type;
 reportViewer?.destroy();reportViewer=null;modal.hidden=true;session=null;modal.innerHTML='';$('evApp').inert=false;
 if(renderTask){renderTask.cancel();renderTask=null;}
 if(pdfDocument){pdfDocument.destroy().catch(()=>{});pdfDocument=null;}
 if(kind==='activity')mountProgramme();
 if(kind==='snag'){mountSnags();renderSide();draw();}
 if(EVWorkspace.route()==='issue')EVWorkspace.refresh();
 if(prev?.isConnected)prev.focus();
}
function saveOnce(){if(session&&!session.history){pushHist();session.history=true;}}
function openActivity(id){
 const p=programme(),a=p.activities.find(a=>a.id===id);if(!a)return;
 openDialog('activity','Edit activity','Name the person or team responsible, set the dates and update progress.',
  '<div class="ev-form">'+field('Activity','name',a.name,'text',true)+field('Responsible person / team','owner',a.owner)+field('Duration in working days','days',duration(a.days),'number')+field('Separate start date (optional)','start',a.start,'date',false,'Leave blank to follow the previous included activity. The first activity follows the project start date.')+select('Progress','status',a.status||'planned',Object.entries(statusNames))+field('Activity notes','note',a.note,'textarea',true)+'<label class="ed-check wide"><input type="checkbox" data-ed-field="included" '+(a.included!==false?'checked':'')+'> Include this activity in the programme</label></div>'+note('Set a separate start date for work that overlaps another activity. Starts on non-working dates move to the next working day.'),button('Move up','activity-up')+button('Move down','activity-down'));
 session.id=id;
 const idx=p.activities.indexOf(a);modal.querySelector('[data-ed-action="activity-up"]').disabled=idx===0;modal.querySelector('[data-ed-action="activity-down"]').disabled=idx===p.activities.length-1;
}
function addSuggestions(){
 const p=programme(),existing=new Set(p.activities.map(a=>a.source)),add=progAutoPhases().filter(a=>!existing.has(a.k));
 if(!add.length){toast('All current markup suggestions are already listed.');return;}
 pushHist();p.activities.push(...add.map(a=>({id:uid(),source:a.k,name:a.t,days:a.d,note:a.note,owner:'',start:'',status:'planned',included:true})));changed();mountProgramme();toast(add.length+' suggested activities added');
}

function reportSettings(){if(!pack.workspace)pack.workspace={};if(!pack.workspace.snagReport)pack.workspace.snagReport={date:'',preparedBy:''};return pack.workspace.snagReport;}
function filteredSnags(){return snagList().filter(({it,photo})=>(snagFilter==='all'||(it.st==='fixed'?'fixed':'open')===snagFilter)&&(snagSeverity==='all'||it.sev===snagSeverity)&&[it.label,it.who,it.n,it.action,photo.name].join(' ').toLowerCase().includes(snagSearch.toLowerCase()));}
function overdue(it){return it.st!=='fixed'&&parse(it.targetDate)&&it.targetDate<today();}
function snagRows(){const rows=filteredSnags();return rows.length?'<div class="ev-table-wrap"><table class="ev-table ed-snag-table"><thead><tr><th>Item / finding</th><th>Owner / target</th><th>Severity</th><th>Status</th><th>Evidence</th><th></th></tr></thead><tbody>'+rows.map(({it,photo})=>'<tr><td><span class="ed-ref">SN-'+String(it.n||0).padStart(2,'0')+'</span><b>'+esc(it.label||'Untitled finding')+'</b><small>'+esc(photo.name)+'</small></td><td>'+esc(it.who||'Unassigned')+'<small class="'+(overdue(it)?'ed-overdue':'')+'">'+(it.targetDate?'Due '+esc(date(it.targetDate))+(overdue(it)?' · overdue':''):'No target date')+'</small></td><td>'+pill(severityNames[it.sev]||'Minor',it.sev==='safety'?'red':it.sev==='major'?'amber':'')+'</td><td>'+pill(it.st==='fixed'?'Fixed':'Open',it.st==='fixed'?'green':'amber')+'</td><td><div class="ed-evidence-mini">'+['ph1','ph2'].map((k,i)=>it[k]?'<img src="'+esc(it[k])+'" alt="'+(i?'After':'Before')+' evidence">':'<span title="'+(i?'After':'Before')+' photo not recorded">'+(i?'A':'B')+'</span>').join('')+'</div></td><td><button class="ev-btn" data-ev-snag="'+esc(it.id)+'" data-photo-id="'+esc(photo.id)+'">Open<span class="ed-sr-only"> snag '+esc(it.n)+'</span></button></td></tr>').join('')+'</tbody></table></div>':'<div class="ev-empty"><b>'+(!snagList().length?'No snags recorded':'No matching findings')+'</b>'+(!snagList().length?'Add a numbered marker in Markup to start a record.':'Change the search or filters to see other findings.')+'</div>';}
function mountSnags(){
 const el=$('evSnagMount');if(!el)return;const all=snagList(),r=reportSettings();
 el.innerHTML='<div class="ev-stats">'+[['Findings',all.length],['Open',all.filter(x=>x.it.st!=='fixed').length],['Fixed',all.filter(x=>x.it.st==='fixed').length],['Overdue',all.filter(x=>overdue(x.it)).length]].map(([t,n])=>'<div class="ev-stat"><label>'+t+'</label><b>'+n+'</b></div>').join('')+'</div><section class="ev-card"><div class="ed-snag-filters"><input class="ev-input" id="edSnagSearch" aria-label="Search snags" placeholder="Search finding, owner or plan" value="'+esc(snagSearch)+'"><select class="ev-select" id="edSnagStatus" aria-label="Filter snag status">'+[['all','All statuses'],['open','Open'],['fixed','Fixed']].map(([v,t])=>'<option value="'+v+'" '+(v===snagFilter?'selected':'')+'>'+t+'</option>').join('')+'</select><select class="ev-select" id="edSnagSeverity" aria-label="Filter snag severity">'+[['all','All severities'],...Object.entries(severityNames)].map(([v,t])=>'<option value="'+v+'" '+(v===snagSeverity?'selected':'')+'>'+t+'</option>').join('')+'</select></div><div id="edSnagRows">'+snagRows()+'</div></section><section class="ev-card"><div class="ev-card-head"><h2>Report details</h2>'+button('Review report PDF','snag-report')+'</div><div class="ev-card-body ev-form"><label class="ev-field">Inspection date<input id="edInspectionDate" type="date" value="'+esc(r.date)+'"></label><label class="ev-field">Prepared by<input id="edPreparedBy" value="'+esc(r.preparedBy)+'" placeholder="'+esc(pack.surveyedBy||'Name / organisation')+'"><small>'+(pack.surveyedBy?'Defaults to project lead: '+esc(pack.surveyedBy):'Uses the project lead if left blank.')+'</small></label><label class="ev-field wide">Report notes<textarea id="edSnagNotes" rows="2">'+esc(r.notes||'')+'</textarea></label></div></section>';
 $('edSnagSearch').oninput=e=>{snagSearch=e.target.value;$('edSnagRows').innerHTML=snagRows();};
 $('edSnagStatus').onchange=e=>{snagFilter=e.target.value;$('edSnagRows').innerHTML=snagRows();};
 $('edSnagSeverity').onchange=e=>{snagSeverity=e.target.value;$('edSnagRows').innerHTML=snagRows();};
 for(const [id,key] of [['edInspectionDate','date'],['edPreparedBy','preparedBy'],['edSnagNotes','notes']]){let edited=false;$(id).onblur=()=>{edited=false;};$(id).oninput=e=>{if(!edited){pushHist();edited=true;}r[key]=e.target.value;changed();};}
}
function snagPair(id,photoId){return snagList().find(x=>x.it.id===id&&(!photoId||x.photo.id===photoId));}
function evidence(it){return '<div class="ed-evidence">'+[['ph1','Before','As found'],['ph2','After','Completed work']].map(([k,t,sub])=>'<div><div class="ed-evidence-head"><b>'+t+'</b><span>'+sub+'</span></div>'+(it[k]?'<img src="'+esc(it[k])+'" alt="'+t+' evidence for snag '+esc(it.n)+'">':'<div class="ed-photo-empty">No '+t.toLowerCase()+' photo attached</div>')+'<div class="ev-actions"><label class="ev-btn">'+(it[k]?'Replace photo':'Add photo')+'<input class="ed-sr-only" data-ed-photo="'+k+'" type="file" accept="image/jpeg,image/png,image/webp"></label>'+(it[k]?'<button class="ev-btn quiet" data-ed-remove-photo="'+k+'">Remove</button>':'')+'</div></div>').join('')+'</div>';}
function openSnag(id,photoId){
 const pair=snagPair(id,photoId);if(!pair)return;const {it,photo}=pair;
 openDialog('snag','Snag '+String(it.n||0).padStart(2,'0'),photo.name||'Site plan',
  '<div class="ev-form">'+field('Finding','label',it.label,'textarea',true)+field('Required action','action',it.action,'textarea',true)+field('Assigned to','who',it.who)+field('Target date','targetDate',it.targetDate,'date')+select('Severity','sev',it.sev||'minor',Object.entries(severityNames))+select('Status','st',it.st==='fixed'?'fixed':'open',[['open','Open'],['fixed','Fixed']])+'</div><h3 class="ed-subheading">Photo evidence</h3><div id="edEvidence">'+evidence(it)+'</div><h3 class="ed-subheading">Close-out record</h3><div class="ev-form">'+field('Date fixed','fixedOn',legacyDate(it.fixedOn),'date')+field('Checked by','checkedBy',it.checkedBy)+field('Resolution / check notes','resolution',it.resolution,'textarea',true)+'</div>'+note('Mark the snag as fixed when the work is complete. Record who checked it and add an after photo.'),button('Show on plan','show-snag'));
 session.id=id;session.photoId=photo.id;
}
async function imageFrom(src){return new Promise((resolve,reject)=>{const im=new Image();const timer=setTimeout(()=>{im.onload=im.onerror=null;reject(Error('The image could not be loaded.'));},15000);im.onload=()=>{clearTimeout(timer);resolve(im);};im.onerror=()=>{clearTimeout(timer);reject(Error('The image could not be loaded.'));};im.src=src;});}
async function preparePlan(p){if(!p.src)throw Error('The plan source image is missing.');const cached=imgCache[p.id];if(cached?.complete&&cached.naturalWidth)return cached;const im=await imageFrom(p.src);imgCache[p.id]=im;return im;}
async function uploadPhoto(input){
 const f=input.files?.[0],slot=input.dataset.edPhoto,pair=snagPair(session?.id,session?.photoId);if(!f||!pair)return;
 if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>30*1024*1024){$('edMessage').textContent='Choose a JPG, PNG or WebP image under 30 MB.';input.value='';return;}
 busy=true;modal.setAttribute('aria-busy','true');modal.querySelectorAll('button,input,textarea,select').forEach(x=>x.disabled=true);$('edMessage').textContent='Preparing photo…';
 const url=URL.createObjectURL(f);
 try{const im=await imageFrom(url),ratio=Math.min(1,1800/Math.max(im.width,im.height)),cn=document.createElement('canvas');cn.width=Math.max(1,Math.round(im.width*ratio));cn.height=Math.max(1,Math.round(im.height*ratio));const c=cn.getContext('2d');c.fillStyle='white';c.fillRect(0,0,cn.width,cn.height);c.drawImage(im,0,0,cn.width,cn.height);saveOnce();pair.it[slot]=cn.toDataURL('image/jpeg',.88);pair.it[slot+'Name']=f.name;changed();$('edEvidence').innerHTML=evidence(pair.it);$('edMessage').textContent=(slot==='ph1'?'Before':'After')+' photo attached.';}
 catch(err){$('edMessage').textContent=err.message;}
 finally{URL.revokeObjectURL(url);busy=false;modal.removeAttribute('aria-busy');modal.querySelectorAll('button,input,textarea,select').forEach(x=>x.disabled=false);}
}

// Measured PDF layout, with bundled fonts and continued rows for long records.
function installFonts(doc){
 doc.addFileToVFS('EVSans.ttf',EVReportFonts.regular);doc.addFont('EVSans.ttf','EVSans','normal');
 doc.addFileToVFS('EVSans-Bold.ttf',EVReportFonts.bold);doc.addFont('EVSans-Bold.ttf','EVSans','bold');
 return doc;
}
function pdfKit(title,landscape=false){
 const doc=new window.jspdf.jsPDF({orientation:landscape?'landscape':'portrait',unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true});
 installFonts(doc);
 const W=landscape?297:210,H=landscape?210:297,M=14,B=H-17,C={navy:[23,43,59],blue:[30,107,255],dim:[95,112,128],line:[218,226,234],soft:[244,247,250],green:[97,138,65]},width=W-2*M;
 let y=43,page=0,sectionTitle=title;
 const clean=v=>String(v??'').replace(/[\u2010-\u2015]/g,'-');
 const font=(size=9,bold=false)=>{doc.setFont('EVSans',bold?'bold':'normal');doc.setFontSize(size);};
 const lines=(text,w,size=9,bold=false)=>{font(size,bold);return doc.splitTextToSize(clean(text),w);};
 const write=(t,x,yy,size=9,bold=false,col=C.navy)=>{font(size,bold);doc.setTextColor(...col);doc.text(clean(t),x,yy);};
 const fit=(t,w,size=9,bold=false)=>{font(size,bold);let s=clean(t);if(doc.getTextWidth(s)<=w)return s;while(s.length&&doc.getTextWidth(s+'…')>w)s=s.slice(0,-1);return s+'…';};
 function newPage(section=title){sectionTitle=section.replace(/ · continued$/,'');if(page++)doc.addPage();EVReportBranding.header(doc,{title:section,W,M});y=43;}
 const ensure=h=>{if(y+h>B)newPage(sectionTitle+' · continued');};
 function paragraph(text,size=9,bold=false,col=C.navy){const ll=lines(text,width,size,bold),lineH=size*.47;for(const l of ll){ensure(lineH+2);write(l,M,y,size,bold,col);y+=lineH;}y+=3;}
 function section(text){ensure(13);y+=2;write(text,M,y,11,true);y+=8;}
 function table(headers,rows,widths){
  const xs=widths.map((_,i)=>M+widths.slice(0,i).reduce((a,b)=>a+b,0));
  const head=()=>{ensure(11);doc.setFillColor(...C.soft);doc.rect(M,y,width,8,'F');headers.forEach((t,i)=>write(t,xs[i]+2,y+5.3,7.4,true,C.dim));y+=8;};
  head();
  for(const row of rows){const wrapped=row.map((v,i)=>lines(v||'Not recorded',widths[i]-4,8.3)),n=Math.max(...wrapped.map(a=>a.length));let offset=0;
   while(offset<n){if(y+10>B){newPage(sectionTitle+' · continued');head();}const room=Math.max(1,Math.floor((B-y-5)/4.1)),count=Math.min(n-offset,room),height=count*4.1+5;
    wrapped.forEach((ll,i)=>ll.slice(offset,offset+count).forEach((l,j)=>write(l,xs[i]+2,y+4.5+j*4.1,8.3,i===0)));
    doc.setDrawColor(...C.line);doc.setLineWidth(.2);doc.line(M,y+height,W-M,y+height);y+=height;offset+=count;
   }
  }y+=5;
 }
 function details(extra=[]){table(['Project details','Recorded information'],[['Reference',pack.jobRef],['Client',pack.custName],['Site address',[pack.address,pack.postcode].filter(Boolean).join(', ')],['Project lead',pack.surveyedBy],['Site contact',[pack.workspace?.contactName,pack.workspace?.contactPhone,pack.workspace?.contactEmail].filter(Boolean).join(' · ')],['Revision / prepared',String(pack.rev||'A')+' / '+date(today())],...(window.EVProfile?.reportRows(pack)||[]),...extra],[43,width-43]);}
 function footer(){return EVReportBranding.footer(doc,{M});}
 newPage();return{doc,W,H,M,B,C,width,lines,write,fit,newPage,ensure,paragraph,section,table,details,footer,get y(){return y;},set y(v){y=v;}};
}
async function buildProgramme(){
 const p=programme(),s=programmeSummary();if(!s.active.length)throw Error('Add or include an activity before creating the programme.');
 const k=pdfKit('Programme of works',true);k.details([['Programme dates',s.b?date(s.b.from)+' to '+date(s.b.to):'Not set'],['Progress',s.complete+' of '+s.active.length+' activities complete']]);
 if(p.notes){k.section('Programme notes');k.paragraph(p.notes);}
 k.section('Activities & responsibilities');
 k.table(['Activity','Responsibility','Start / finish','Days','Progress'],s.active.map(r=>[r.name,r.owner,r.from?date(r.from)+'\n'+date(r.to):'Not set',String(r.days),statusNames[r.status]||'Planned']),[95,54,57,17,46]);
 const notes=s.active.filter(r=>r.note);if(notes.length){k.section('Activity notes');for(const r of notes){k.paragraph(r.name||'Untitled activity',9,true);k.paragraph(r.note);}}
 if(s.b){const dated=s.active.filter(r=>r.from);for(let offset=0;offset<dated.length;offset+=12){k.newPage('Programme timeline');const bx=110,bw=k.W-k.M-bx,b=s.b,chunk=dated.slice(offset,offset+12);k.write('Activity / responsibility',k.M,43,8,true,k.C.dim);for(let t=0;t<5;t++){const x=bx+t*bw/4;k.write(dateShort(new Date(+b.from+Math.round((b.span-1)*t/4)*dayMs)),x-(t===4?15:0),43,7,false,k.C.dim);}k.y=51;
   for(const r of chunk){const yy=k.y;k.write(k.fit(r.name||'Untitled activity',91,8,true),k.M,yy+3,8,true);k.write(k.fit(r.owner||'Not assigned',91,7),k.M,yy+7,7,false,k.C.dim);k.doc.setFillColor(...k.C.soft);k.doc.rect(bx,yy,bw,7,'F');k.doc.setFillColor(...(r.status==='complete'?k.C.green:r.status==='inprogress'?[193,145,41]:k.C.blue));k.doc.rect(bx+(r.from-b.from)/dayMs/b.span*bw,yy,Math.max(.6,((r.to-r.from)/dayMs+1)/b.span*bw),7,'F');k.y+=11;}
   k.y+=5;k.paragraph('Blue: planned. Amber: in progress. Green: complete. Bar lengths include the calendar span between the working dates.',8,false,k.C.dim);
  }}
 k.section('Calendar basis');k.paragraph('Monday to Friday. Additional non-working dates: '+(p.nonWorkingDates.length?p.nonWorkingDates.map(date).join(', '):'none entered')+'. Starts on non-working dates move to the next working day. Separate start dates allow activities to overlap. Durations and recorded progress should be reviewed with the delivery team.');
 return k.footer();
}
async function buildSnags(options){
 const all=snagList(),rows=all.filter(({it})=>options.scope==='all'||(it.st==='fixed'?'fixed':'open')===options.scope);if(!rows.length)throw Error('There are no snags in this selection.');
 const settings=reportSettings(),k=pdfKit('Snag report');
 k.details([['Inspection date',parse(settings.date)?date(settings.date):'Not recorded'],['Prepared by',settings.preparedBy||pack.surveyedBy],['Report selection',options.scope==='all'?'All findings':options.scope==='open'?'Open findings only':'Fixed findings only']]);
 k.paragraph(rows.length+(rows.length===1?' finding included: ':' findings included: ')+rows.filter(x=>x.it.st!=='fixed').length+' open, '+rows.filter(x=>x.it.st==='fixed').length+' fixed.',10,true);
 if(settings.notes){k.section('Report notes');k.paragraph(settings.notes);}
 k.section('Register summary');k.table(['Ref / finding','Owner / target','Severity','Status'],rows.map(({it})=>['SN-'+String(it.n||0).padStart(2,'0')+'\n'+(it.label||'Untitled finding'),(it.who||'Unassigned')+'\n'+(parse(it.targetDate)?date(it.targetDate):'No target date'),severityNames[it.sev]||'Minor',it.st==='fixed'?'Fixed':'Open']),[82,45,27,28]);
 for(const {it,photo} of rows){
  k.newPage('Snag '+String(it.n||0).padStart(2,'0')+' · '+(it.st==='fixed'?'Fixed':'Open'));k.paragraph(it.label||'Finding not recorded',13,true);
  k.table(['Finding details','Recorded information'],[['Location plan',photo.name],['Severity',severityNames[it.sev]||'Minor'],['Assigned to',it.who],['Target date',parse(it.targetDate)?date(it.targetDate):'Not recorded'],['Required action',it.action],['Date fixed',it.st==='fixed'?(legacyDate(it.fixedOn)?date(legacyDate(it.fixedOn)):it.fixedOn||'Not recorded'):'Open'],['Checked by',it.checkedBy],['Resolution / check notes',it.resolution]],[43,139]);
  if(options.photos){k.ensure(98);k.section('Photo evidence');const start=k.y,iw=(k.width-6)/2,ih=77;
   for(let j=0;j<2;j++){const slot=j?'ph2':'ph1',x=k.M+j*(iw+6);k.write(j?'AFTER · COMPLETED WORK':'BEFORE · AS FOUND',x,start,8,true,k.C.dim);k.doc.setFillColor(...k.C.soft);k.doc.rect(x,start+4,iw,ih,'F');
    if(it[slot]){let im;try{im=await imageFrom(it[slot]);}catch{throw Error('The '+(j?'after':'before')+' photo for snag '+it.n+' could not be loaded. Replace it or exclude photos.');}const cn=document.createElement('canvas');cn.width=im.width;cn.height=im.height;const c=cn.getContext('2d');c.fillStyle='white';c.fillRect(0,0,cn.width,cn.height);c.drawImage(im,0,0);const ratio=Math.min(iw/im.width,ih/im.height),w=im.width*ratio,h=im.height*ratio;k.doc.addImage(cn.toDataURL('image/jpeg',.88),'JPEG',x+(iw-w)/2,start+4+(ih-h)/2,w,h,undefined,'FAST');}
    else k.write('No photo recorded',x+4,start+43,9,false,k.C.dim);
   }k.y=start+87;
  }
 }
 if(options.plans){const photos=[...new Map(rows.map(x=>[x.photo.id,x.photo])).values()];for(const p of photos){await preparePlan(p);const cn=renderPhotoToCanvas(p,2000);k.newPage('Plan locations');k.paragraph(p.name,11,true);const available=k.B-k.y-3,ratio=Math.min(k.width/cn.width,available/cn.height);k.doc.addImage(cn,'PNG',k.M+(k.width-cn.width*ratio)/2,k.y,cn.width*ratio,cn.height*ratio,undefined,'FAST');}}
 return k.footer();
}
function reportChecks(type,options){
 const gaps=[];if(!pack.name)gaps.push('Project name is missing.');if(!pack.jobRef)gaps.push('Project reference is missing.');
 if(type==='programme'){const s=programmeSummary();if(s.undated)gaps.push(s.undated+' activities have no dates.');const n=s.active.filter(r=>!r.owner?.trim()).length;if(n)gaps.push(n+' activities have no owner.');}
 else{const r=reportSettings(),rows=snagList().filter(x=>options.scope==='all'||(x.it.st==='fixed'?'fixed':'open')===options.scope);if(!r.date)gaps.push('Inspection date is missing.');if(!r.preparedBy&&!pack.surveyedBy)gaps.push('Prepared by is missing.');const n=rows.filter(x=>!x.it.who?.trim()).length;if(n)gaps.push(n+' findings have no assigned owner.');const evidence=rows.filter(x=>x.it.st==='fixed'&&(!x.it.checkedBy||!x.it.ph2)).length;if(evidence)gaps.push(evidence+' fixed findings have no checker or after photo.');const safety=rows.filter(x=>x.it.sev==='safety'&&x.it.st!=='fixed').length;if(safety)gaps.unshift(safety+' safety findings remain open.');}
 return gaps;
}
async function openReport(type){
 if(busy)return;
 if(type==='snags'&&!snagList().length){EVWorkspace.go('snags');toast('Add a snag before creating its report.');return;}
 if(type==='programme'&&!programmeSummary().active.length){EVWorkspace.go('programme');toast('Add an activity before creating the programme.');return;}
 openDialog('report',type==='programme'?'Review programme':'Review snag report',(pack.name||'Untitled project')+' · Rev '+(pack.rev||'A'),
  '<div class="ev-document-layout"><div id="edReportViewer"></div><aside class="ev-document-options ed-report-controls"><h3>Report contents</h3>'+(type==='snags'?'<label class="ev-field">Findings<select id="edReportScope"><option value="all">All findings</option><option value="open">Open findings only</option><option value="fixed">Fixed findings only</option></select></label><label class="ed-check"><input id="edReportPhotos" type="checkbox" checked> Include before / after photos</label><label class="ed-check"><input id="edReportPlans" type="checkbox"> Include location plans</label>':'<p>Activities, responsibilities, dates, progress and the programme timeline.</p>')+'<h3>Document details</h3><dl class="ev-document-meta"><dt>Prepared by</dt><dd>'+esc(pack.surveyedBy||'Not recorded')+'</dd><dt>Company</dt><dd>'+esc(pack.brandName||'Not recorded')+'</dd><dt>Revision</dt><dd>'+esc(pack.rev||'A')+'</dd></dl><div id="edReportChecks"></div><p>Close this review to edit project details or report records.</p></aside></div>',button('Download PDF','download-report','primary'),true);
 session.reportType=type;session.page=1;session.doc=null;reportViewer=EVReportViewer.mount($('edReportViewer'),{canvasId:'edPdfCanvas'});$('edMessage').textContent='The preview matches the PDF download.';
 modal.querySelector('.ev-dialog-foot [data-ed-action="close"]').classList.remove('primary');
 for(const id of ['edReportScope','edReportPhotos','edReportPlans'])if($(id))$(id).onchange=()=>prepareReport();
 await prepareReport();
}

async function prepareReport(){
 if(!session||session.type!=='report'||busy)return;busy=true;session.doc=null;modal.setAttribute('aria-busy','true');modal.querySelectorAll('button,input,select').forEach(x=>x.disabled=true);$('edPdfCanvas').textContent='Preparing PDF…';
 const options={scope:$('edReportScope')?.value||'all',photos:$('edReportPhotos')?.checked!==false,plans:$('edReportPlans')?.checked===true};
 const gaps=reportChecks(session.reportType,options);$('edReportChecks').innerHTML='<h3>Before downloading</h3>'+(gaps.length?'<ul>'+gaps.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>':'<p class="ed-help">Project details and responsibilities are recorded.</p>');
 try{
  const doc=session.reportType==='programme'?await buildProgramme():await buildSnags(options);doc.__evIssueLabel=session.reportType==='programme'?'Programme':'Snag report';
  await reportViewer.set(doc);
  session.doc=doc;session.page=1;session.filename=(pack.name||'EV-project').replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,90)+'_'+(session.reportType==='programme'?'programme':'snag-report')+'_rev-'+String(pack.rev||'A').replace(/[^a-zA-Z0-9_-]/g,'_')+'.pdf';

 }catch(err){session.doc=null;$('edPdfCanvas').innerHTML='<div class="ev-empty"><b>PDF could not be prepared</b>'+esc(err.message)+'</div>';}
 finally{busy=false;modal.removeAttribute('aria-busy');modal.querySelectorAll('button,input,select').forEach(x=>x.disabled=false);reportButtons();}
}
function reportButtons(){if(session?.type!=='report')return;modal.querySelector('[data-ed-action="download-report"]').disabled=busy||!session.doc;reportViewer?.sync();}


modal.addEventListener('input',e=>{
 const key=e.target.dataset.edField;if(!key||!session||busy)return;
 const item=session.type==='activity'?programme().activities.find(a=>a.id===session.id):session.type==='snag'?snagPair(session.id,session.photoId)?.it:null;if(!item)return;
 saveOnce();let value=e.target.type==='checkbox'?e.target.checked:e.target.value;if(key==='days')value=duration(value);if(key==='fixedOn')value=fixedDate(value);item[key]=value;
 if(key==='st'){item.fixedOn=value==='fixed'?(item.fixedOn||fixedDate(today())):'';const d=modal.querySelector('[data-ed-field="fixedOn"]');if(d)d.value=legacyDate(item.fixedOn);syncSnagSign();}
 changed();
});
modal.addEventListener('change',e=>{if(e.target.dataset.edPhoto)uploadPhoto(e.target);});
modal.addEventListener('click',e=>{const remove=e.target.closest('[data-ed-remove-photo]');if(remove&&!busy){const pair=snagPair(session.id,session.photoId);if(pair){saveOnce();delete pair.it[remove.dataset.edRemovePhoto];changed();$('edEvidence').innerHTML=evidence(pair.it);}}if(e.target===modal)closeDialog();});
modal.addEventListener('keydown',e=>{
 e.stopPropagation();if(e.key==='Escape'){e.preventDefault();closeDialog();return;}
 if(e.key==='Tab'){const els=[...modal.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href]')].filter(el=>el.getClientRects().length&&!el.closest('[hidden]'));const a=els[0],b=els.at(-1);if(!a)return;if(e.shiftKey&&(document.activeElement===a||!modal.contains(document.activeElement))){e.preventDefault();b.focus();}else if(!e.shiftKey&&(document.activeElement===b||!modal.contains(document.activeElement))){e.preventDefault();a.focus();}}
});
document.addEventListener('click',async e=>{
 const edit=e.target.closest('[data-ed-activity]');if(edit){openActivity(edit.dataset.edActivity);return;}
 const snag=e.target.closest('[data-ed-open-snag]');if(snag){openSnag(snag.dataset.edOpenSnag,pack.active);return;}
 const b=e.target.closest('[data-ed-action]');if(!b||busy)return;const a=b.dataset.edAction;
 if(a==='close'){closeDialog();return;}
 if(a==='add-activity'){const p=programme();pushHist();const row={id:uid(),name:'New activity',days:1,owner:'',start:'',status:'planned',note:'',included:true};p.activities.push(row);changed();mountProgramme();openActivity(row.id);return;}
 if(a==='suggest'){addSuggestions();return;}
 if(a==='programme-report'||a==='snag-report'){await openReport(a==='programme-report'?'programme':'snags');return;}
 if(a==='activity-up'||a==='activity-down'){const p=programme(),idx=p.activities.findIndex(r=>r.id===session.id),to=idx+(a==='activity-up'?-1:1);if(p.activities[to]){saveOnce();[p.activities[idx],p.activities[to]]=[p.activities[to],p.activities[idx]];changed();modal.querySelector('[data-ed-action="activity-up"]').disabled=to===0;modal.querySelector('[data-ed-action="activity-down"]').disabled=to===p.activities.length-1;$('edMessage').textContent='Activity moved to position '+(to+1)+'.';}return;}
 if(a==='show-snag'){const {id,photoId}=session;closeDialog();EVWorkspace.openPlan(photoId);sel=id;sideTab='props';setSideTab();$('side').classList.add('open');draw();return;}
 if(a==='download-report'&&session.doc){busy=true;reportButtons();$('edMessage').textContent='Downloading PDF…';try{await session.doc.save(session.filename,{returnPromise:true});$('edMessage').textContent='PDF downloaded. The download is listed in the document history.';}catch(err){$('edMessage').textContent='Download failed: '+err.message;}finally{busy=false;reportButtons();}return;}
});
// A full record is also reachable from a selected canvas pin.
const baseRenderSide=renderSide;
renderSide=function(){baseRenderSide();const it=activePhoto()?.items.find(i=>i.id===sel);if(it?.type==='mark'&&it.kind==='snag'&&$('sglabel')&&!$('edFullSnag')){const b=document.createElement('button');b.id='edFullSnag';b.className='pbtn';b.textContent='Open full snag record';b.dataset.edOpenSnag=it.id;$('sglabel').parentElement.append(b);}};
progPdfBuild=()=>openReport('programme');
// Drawing shortcuts only act on the drawing page. Keep delivery views in step with undo.
const previousUndo=undo,previousRedo=redo;
undo=function(){previousUndo();if(EVWorkspace.route()!=='markup')EVWorkspace.refresh();};
redo=function(){previousRedo();if(EVWorkspace.route()!=='markup')EVWorkspace.refresh();};
document.addEventListener('keydown',e=>{
 if(document.documentElement.classList.contains('evsp-cdm-modal-open'))return;
 if(EVWorkspace.route()==='markup')return;
 e.stopPropagation();
 if(!modal.hidden||e.target.matches('input,textarea,select,[contenteditable]'))return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();}
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redo();}
});
window.EVDelivery={mountProgramme,mountSnags,openSnag,openReport,preparePlan,installFonts,schedule,programmeSummary,version:'delivery-r2'};
})();
