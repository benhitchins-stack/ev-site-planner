/* Project shell for the existing EV Site Planner engine. No Pod-specific contacts or processes. */
(function(){
'use strict';
const $=id=>document.getElementById(id), h=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={collapse:'M4 3h16v18H4zM9 3v18m7-13-3 4 3 4',focus:'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5',user:'M4 22v-3a8 8 0 0 1 16 0v3M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0',grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',home:'m3 11 9-8 9 8M5 9v12h14V9M9 21v-7h6v7',plan:'M4 3h16v18H4zM8 7h8M8 11h4M8 15h8',pen:'m16 3 5 5-12 12-6 1 1-6ZM13 6l5 5',calendar:'M3 5h18v16H3zM7 2v6M17 2v6M3 10h18M7 14h4M13 18h4',flag:'M5 22V3M5 3h14l-3 5 3 5H5',send:'m3 3 18 9-18 9 3-9ZM6 12h15',file:'M5 3h10l4 4v14H5zM15 3v5h4M9 12h6M9 16h6',plus:'M12 5v14M5 12h14',arrow:'M4 12h16m-6-6 6 6-6 6',download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',book:'M4 4h6l2 2 2-2h6v16h-6l-2 2-2-2H4zM12 6v16',learn:'m2 9 10-5 10 5-10 5ZM6 11v7c4 3 8 3 12 0v-7',cube:'m12 2 9 5v10l-9 5-9-5V7ZM3 7l9 5 9-5M12 12v10',check:'m5 12 4 4L19 6',close:'m6 6 12 12M6 18 18 6',menu:'M4 6h16M4 12h16M4 18h16',folder:'M3 6h6l2 2h10v12H3z',tools:'m14 7 3 3 4-4a6 6 0 0 1-8 8l-7 7-3-3 7-7a6 6 0 0 1 8-8Z',photo:'M3 5h18v14H3zM3 16l6-5 5 4 3-3 4 4M8 8h1',backup:'M4 7h16v14H4zM7 3h10v4M9 12h6',alert:'m12 3 10 18H2ZM12 9v5M12 17v1',search:'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4',circle:'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z',audit:'M9 3h6v4H9zM9 5H5v16h14V5h-4M8.5 14l2.5 2.5 4.5-5'};
const icon=(k,cls='')=>'<svg class="'+cls+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(paths[k]||paths.file)+'"/></svg>';
const btn=(t,a,style='',ic='')=>'<button type="button" class="ev-btn '+style+'" data-ev-action="'+a+'">'+(ic?icon(ic):'')+t+'</button>';
const empty=(title,desc,actions='')=>'<div class="ev-empty">'+icon('plan')+'<b>'+title+'</b>'+desc+(actions?'<div class="ev-actions">'+actions+'</div>':'')+'</div>';
const card=(t,body,action='')=>'<section class="ev-card"><div class="ev-card-head"><h2>'+t+'</h2>'+action+'</div><div class="ev-card-body">'+body+'</div></section>';
const niceDate=d=>{const date=new Date(d);return Number.isNaN(+date)?'':date.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});};
const modeName=()=>pack.mode==='domestic'?'Domestic':'Commercial';
// Help: a small ? beside a card title opens the matching guide in the help drawer; the header Help button opens the page guide.
const hq=(id,label,tip)=>window.EVHelp?EVHelp.q(id,label,tip):'';
const helpBtn=key=>window.EVHelp?EVHelp.button(key):'';
const routes=[['overview','Overview','home'],['markup','Markup','pen'],['planning','Design lab','tools'],['programme','Programme','calendar'],['snags','Snags','flag'],['audit','Site audit','audit'],['issue','Issue','send']];
let route='projects',search='',filter='all',drawerStep=0,returnFocus=null,reviewId=null,saveQueue=Promise.resolve(),saveSequence=0,activeIssue=null,previewToken=0,reviewBusy=false;
let originalProgrammeParent=$('progBackdrop'),programmeNode=originalProgrammeParent.querySelector('.wlc');
const ensure=()=>{if(!pack.workspace||typeof pack.workspace!=='object')pack.workspace={};const w=pack.workspace;w.schema=1;if(!Array.isArray(w.issues))w.issues=[];return w;};
const allItems=()=>pack.photos.flatMap(p=>p.items||[]);
const stats=()=>{const items=allItems();return{plans:pack.photos.length,units:items.filter(i=>i.type==='unit').length,routes:items.filter(i=>i.type==='route'&&i.kind!=='__area').length,snags:snagStats().open};};
const hasWork=()=>hasMeaningfulPackContent(pack)||['contactName','contactRole','contactEmail','contactPhone','scope','notes'].some(k=>String(pack.workspace?.[k]||'').trim());
let projectBusy=false;
function finishDrawing(){finishDrawingContext();}
async function changeProject(operation,failureMessage='The project could not be opened. Your current work is still available.') {
 if(projectBusy)return false;
 projectBusy=true;app.inert=true;app.setAttribute('aria-busy','true');
 try{await Promise.all([...pendingFileImports]);return await operation();}
 catch(err){console.error(err);toast(failureMessage);return false;}
 finally{projectBusy=false;app.removeAttribute('aria-busy');app.inert=!$('evDetails').hidden||!review.hidden;}
}

// Retain a complete, current snapshot for every project, including metadata-only jobs.
function savedState(state,text){const el=$('evSaveState');if(el){el.dataset.state=state;el.textContent=text;}}
async function persist(){
 if(!hasWork()){savedState('saved','No project open');return true;}
 const serial=++saveSequence;pack.projId=pack.projId||uid();ensure();
 const snapshot=JSON.parse(JSON.stringify(serialisablePack())),id=pack.projId,now=Date.now();
 const full={pack:snapshot,ts:now};
 const recovery={pack:snapshot,view:{...view},ts:now};
 const summary={id,name:pack.name||'Untitled project',mode:pack.mode,date:new Date(now).toISOString().slice(0,10),updatedAt:now,thumb:pack.photos[0]?.thumb||'',n:pack.photos.length,cust:pack.custName||'',ref:pack.jobRef||'',...projStatusMeta()};
 savedState('pending','Saving…');
 saveQueue=saveQueue.catch(()=>false).then(async()=>{
  await window.__evProjectIndexReady;
  let ok=false;
  try{const committed=await EVProjectStore.save(full,recovery,summary);ok=true;savedMark={id,ts:Number(committed?.ts)||now};if(serial===saveSequence)savedState('saved','Saved in this browser');syncBackupState();keepStorage();}
  catch(error){
   if(error?.code==='EVSP_CONFLICT')savedState('error','Newer version in another tab');
   else{savedState('error','Save failed · download backup');toast('Browser storage is unavailable or full. Download a project backup to keep your work.');}
  }
  return ok;
 });
 return saveQueue;
}
// Backup status. A save within the grace period after a download is the backup's own save, not a later change.
const BACKUP_GRACE=15000,freshProjects=new Set();
let savedMark={id:'',ts:0},storageKept=null,keepAsked=false,backupSignature='';
function lastSaved(){
 if(savedMark.id!==pack.projId){const row=pack.projId?projIndex().find(r=>r.id===pack.projId):null;savedMark={id:pack.projId||'',ts:Number(row?.updatedAt)||0};}
 return savedMark.ts;
}
function backupStatus(){const at=Date.parse(pack.workspace?.backupAt||'')||0;return {at,pending:hasWork()&&(!at||lastSaved()-at>BACKUP_GRACE)};}
function syncBackupState(){
 const b=$('evBackupTop');if(!b)return;const s=backupStatus(),signature=pack.projId+':'+s.at+':'+s.pending;if(signature===backupSignature)return;backupSignature=signature;
 b.classList.toggle('ev-backup-due',s.pending);
 b.setAttribute('aria-label',!s.pending?'Download project backup':s.at?'Download project backup. Changes since your backup on '+niceDate(s.at)+' are only in this browser.':'Download project backup. This project has not been backed up yet.');
 b.title=!s.pending?(s.at?'Last backup '+niceDate(s.at):'Download project backup'):s.at?'Changes since your last backup on '+niceDate(s.at):'Not backed up yet';
}
// Ask the browser to keep saved projects when space runs low. Browsers decide; nothing changes if they decline.
try{navigator.storage?.persisted?.().then(v=>{storageKept=v;}).catch(()=>{});}catch(_){}
function keepStorage(){
 if(keepAsked||storageKept||!navigator.storage?.persist)return;keepAsked=true;
 navigator.storage.persist().then(v=>{storageKept=v;const note=$('evStorageNote');if(note&&v)note.textContent=storageNote();}).catch(()=>{});
}
const storageNote=()=>storageKept?'This browser has agreed to keep its saved projects rather than clear them for space.':'Browsers can clear saved data, for example Safari after about a week without a visit, so keep a recent backup.';
const laterKey='evsp_backup_later';
function backupLater(id){try{return JSON.parse(sessionStorage.getItem(laterKey)||'[]').includes(id);}catch(_){return false;}}
function nudgeDue(){const s=backupStatus();return s.pending&&!freshProjects.has(pack.projId)&&!backupLater(pack.projId)&&(!s.at||Date.now()-s.at>=7*864e5);}
function backupNudge(){
 if(!nudgeDue())return '';const s=backupStatus();
 return '<section class="ev-backup-nudge" aria-labelledby="evBackupNudgeTitle"><span class="ev-backup-nudge-icon">'+icon('backup')+'</span><div><h2 id="evBackupNudgeTitle">Back up this project</h2><p>'+h(s.at?'Your last backup was on '+niceDate(s.at)+'. Changes since then are saved only in this browser on this device.':'This project is saved only in this browser on this device. A backup keeps a copy you can restore if browser data is cleared.')+'</p></div><div class="ev-actions">'+btn('Download backup','backup','primary','download')+btn('Not now','backup-later','quiet')+'</div></section>';
}
function backupCard(){
 const s=backupStatus(),title=!s.at?'Not backed up yet':s.pending?'Last backup '+niceDate(s.at):'Backed up '+niceDate(s.at);
 const text=!s.at?'This project is saved only in this browser. Download a backup to keep a copy you can restore or open on another device.':s.pending?'Changes since then are saved only in this browser. Download a new backup to keep them.':'No changes since this backup. Your work also saves in this browser as you go.';
 return '<section class="ev-card ev-backup-card'+(s.pending?' due':'')+'"><div class="ev-card-head"><h2>Project backup'+hq('planner-backups','About backups','overview-backup')+'</h2>'+icon('backup')+'</div><div class="ev-card-body"><b>'+h(title)+'</b><p>'+h(text)+'</p><p class="ev-backup-keep" id="evStorageNote">'+h(storageNote())+'</p>'+btn('Download backup','backup',s.pending?'primary':'','download')+'</div></section>';
}
autosaveNow=function(){return persist();};
const baseAutosave=autosave;
autosave=function(){previewStale=true;savedState('pending','Saving…');baseAutosave();};
saveCurrentToProjects=function(){return persist();};
loadProject=function(id,discard=false){return changeProject(async()=>{
 if(pack.projId===id&&!discard){go('overview');return true;}
 finishDrawing();
 if(hasWork()&&!discard&&!await persist()){toast('Download a backup before switching projects.');return false;}
 let data;try{data=await idbGet('proj_'+id);}catch(_){}
 try{const fallback=JSON.parse(localStorage.getItem('evsp_proj_'+id)||'null');if(fallback?.pack&&!fallback.slim&&(!data?.pack||(fallback.ts||0)>(data.ts||0)))data=fallback;}catch(_){}
 if(!data?.pack||data.slim){toast('A full saved copy could not be found. Open your downloaded project backup.');return false;}
 validateProjectBackup(data.pack);pack=normalisePack(data.pack);pack.projId=id;window.__evLoadedRecord=data;savedMark={id,ts:Number(data.ts)||0};EVProjectStore.adopt(data);ensure();imgKeys();history=[];redoStack=[];sel=null;draftRoute=null;draftScale=null;updateUndo();
 pack.photos.forEach(p=>{const im=new Image();im.onload=draw;im.src=p.src;imgCache[p.id]=im;});
 syncSiteChip();syncBrand();applyMode(false);buildRail();sideTab='pack';setSideTab();fitView();draw();await persist();go('overview');return true;
});};

const app=document.createElement('div');app.id='evApp';
const navButton=(key,label,ic)=>'<button data-ev-route="'+key+'" title="'+label+'" aria-label="'+label+'">'+icon(ic,'ev-nav-icon')+'<span class="ev-nav-label">'+label+'</span></button>';
app.innerHTML='<aside class="ev-sidebar" id="evSidebar"><a class="ev-brand" href="index.html" data-ev-route="home" aria-label="EV Site Planner home"><img src="assets/logo-mark.svg" alt=""><span>EV Site Planner<small>SURVEYS · PLANS · REPORTS</small></span></a><div class="ev-nav-group">'+navButton('home','Home','home')+navButton('projects','Your projects','grid')+'</div><div class="ev-side-divider"></div><nav aria-label="Project sections"><div class="ev-nav-caption">This project</div>'+routes.map(([key,label,ic])=>navButton(key,label==='Overview'?'Overview':label,ic)).join('')+'</nav><div class="ev-sidebar-bottom"><div class="ev-nav-caption">Resources</div><button data-ev-action="showroom" title="3D showroom" aria-label="3D showroom">'+icon('cube','ev-nav-icon')+'<span class="ev-nav-label">3D showroom</span></button><a class="ev-nav" href="Guide Library.dc.html" title="Guide library" aria-label="Guide library">'+icon('book','ev-nav-icon')+'<span class="ev-nav-label">Guide library</span></a><a class="ev-nav" href="Learning Hub.dc.html" title="Training courses" aria-label="Training courses">'+icon('learn','ev-nav-icon')+'<span class="ev-nav-label">Training courses</span></a><div class="ev-side-divider"></div>'+navButton('profile','My profile','user')+'</div></aside><button id="evNavBackdrop" aria-label="Close navigation" hidden></button><div class="ev-main"><div class="ev-top"><button id="evMobileNav" class="ev-icon-btn ev-mobile-toggle" aria-label="Open navigation" aria-expanded="false">'+icon('menu')+'</button><button id="evCollapseNav" class="ev-icon-btn" aria-label="Collapse navigation" aria-expanded="true" title="Collapse navigation">'+icon('collapse')+'</button><div class="ev-top-title"><small id="evBreadcrumb">Workspace / Projects</small><b id="evProjectTitle">Your projects</b></div><span class="ev-pill" id="evModePill">Commercial</span><span class="ev-save" id="evSaveState" data-state="saved">Stored in this browser</span><button class="ev-btn" data-ev-action="backup" id="evBackupTop">'+icon('download')+'<span>Backup</span></button><button class="ev-btn" data-ev-action="details" id="evEditTop">Project details</button>'+helpBtn('markup').replace('class="','id="evHelpTop" hidden class="')+'</div><div id="evContent"><div id="evScreen"></div><section id="evCanvasHost" aria-label="Site markup" hidden></section></div></div>';
document.body.prepend(app);
const workbench=document.querySelector('body>header');workbench.id='evWorkbench';$('evCanvasHost').append(workbench,$('root'));
workbench.querySelector('.hgrp').after($('catbar'));
const originalExport=$('btnExport').parentElement;originalExport.style.display='none';
const tech=document.createElement('div');tech.className='ev-tech';
tech.innerHTML='<button class="ev-btn" id="evTechnical" aria-expanded="false" aria-controls="evTechMenu">'+icon('tools')+'Technical</button><div id="evTechMenu" class="ev-tech-menu" hidden>'+[['cdm','CDM project controls','Dutyholders, design risks and documents'],['sld','Single-line diagram','Supply, boards and chargers'],['calcs','Cable calculations','Review lengths, inputs and results'],['sim','Charging simulator','Explore the load through the day'],['dno','DNO application data','Compile the recorded site information'],['materials','Materials list','Quantities from the markup'],['settings','Plan settings','Labels, legend and export branding']].map(([key,t,d])=>'<button data-ev-action="'+key+'">'+t+'<small>'+d+'</small></button>').join('')+'</div>';
$('catbar').after(tech);
tech.after(Object.assign(document.createElement('button'),{id:'evIssuePlans',className:'ev-btn primary',innerHTML:icon('send')+'Issue plans'}));$('evIssuePlans').dataset.evAction='plans';
const strip=document.createElement('div');strip.id='evPlanStrip';$('root').querySelector('.workarea').prepend(strip);
$('side').querySelector('[data-tab="pack"]').textContent='Plans & settings';$('side').querySelector('[data-tab="props"]').textContent='Selected item';
$('btnSide').setAttribute('aria-label','Show or hide plans and item settings');
$('empty').querySelector('h2').textContent='Start with a plan or a photo';$('empty').querySelector('p').textContent='Upload a drawing or site photo, then add equipment and cable routes.';
$('empty').querySelector('.fine').textContent='Drag files onto the canvas · PDF pages can be selected individually';
$('btnNew').onclick=()=>newProject();$('btnProjects').onclick=()=>go('projects');openProjects=()=>go('projects');
openProgramme=()=>go('programme');$('btnProg').onclick=openProgramme;
$('wlcBackdrop').classList.remove('show');
openWelcome=()=>openDetails(0);

// Preview layout: keep the existing drawing controls and their event handlers.
let navChoice=null,inspectorOpen=false,inspectorPinned=false,lastContext='',focusMode=false,focusSnapshot=null,stripSignature='';
$('evBackupTop').setAttribute('aria-label','Download project backup');
$('evTechnical').setAttribute('aria-label','Technical tools');
const toolstrip=document.createElement('div');toolstrip.className='ev-toolstrip';
const undogroup=document.createElement('div');undogroup.className='ev-undo-group';
undogroup.append($('btnUndo'),$('btnRedo'));
const toolCategory=document.createElement('select');toolCategory.id='evToolCategory';toolCategory.setAttribute('aria-label','Add markup');
toolstrip.append(undogroup,$('catbar'),toolCategory,tech);
function syncCategoryPicker(){
 const options='<option value="">Add markup</option>'+Array.from($('catbar').querySelectorAll('[data-cat]')).map(b=>'<option value="'+h(b.dataset.cat)+'">'+h(b.title)+'</option>').join('');
 if(toolCategory.innerHTML!==options)toolCategory.innerHTML=options;toolCategory.value='';
}
toolCategory.onchange=()=>{const category=toolCategory.value;if(!category)return;inspectorOpen=false;inspectorPinned=false;syncInspector();palCat=category;palOpen=true;syncPalette();};
const focusButton=document.createElement('button');focusButton.id='evFocus';focusButton.className='ev-btn ev-focus-btn';focusButton.type='button';focusButton.title='Focus on the drawing';focusButton.setAttribute('aria-label','Focus on the drawing');focusButton.setAttribute('aria-pressed','false');focusButton.innerHTML=icon('focus')+'<span>Focus</span>';toolstrip.append(focusButton);
workbench.classList.add('ev-toolbar-mode');workbench.append(toolstrip);
$('evEditTop').after($('evIssuePlans'));
const inspectorHead=document.createElement('div');inspectorHead.className='ev-inspector-head';inspectorHead.innerHTML='<div><small>MARKUP</small><b id="evInspectorTitle">Plan settings</b></div><button class="ev-btn" id="evInspectorExpand" aria-expanded="false" aria-label="Expand settings panel">Expand</button><button class="ev-icon-btn" id="evInspectorClose" aria-label="Close settings panel" title="Close settings panel">'+icon('close')+'</button>';$('side').prepend(inspectorHead);
function syncNav(){
 const narrow=innerWidth<=1120,collapsed=navChoice??(route==='markup'||narrow);app.classList.toggle('ev-nav-collapsed',collapsed);
 const b=$('evCollapseNav');b.setAttribute('aria-expanded',String(!collapsed));b.setAttribute('aria-label',collapsed?'Expand navigation':'Collapse navigation');b.title=collapsed?'Expand navigation':'Collapse navigation';
}
function syncInspector(){
 const key=sideTab==='props'?(sel?String(sel):draftRoute?'draft-'+draftRoute.kind:selSet.size?'multi-'+Array.from(selSet).join(','):''):'';
 if(key&&key!==lastContext){inspectorOpen=true;inspectorPinned=false;}
 if(!key&&lastContext&&!inspectorPinned)inspectorOpen=false;
 lastContext=key;
 const visible=route==='markup'&&inspectorOpen&&!focusMode;
 // Opening an inspector must not move the drawing under an active pointer.
 if(route==='markup'&&visible!==app.classList.contains('ev-inspector-open'))viewIsFit=false;
 app.classList.toggle('ev-inspector-open',visible);app.classList.toggle('ev-focus-mode',focusMode&&route==='markup');
 $('side').classList.remove('hidedesk');$('side').classList.toggle('open',visible);
 $('evInspectorTitle').textContent=sideTab==='props'?'Selected item':'Plan settings';
 $('evInspectorToggle')?.setAttribute('aria-expanded',String(visible));
 $('evFocus').setAttribute('aria-pressed',String(focusMode));$('evFocus').title=focusMode?'Exit focus view':'Focus on the drawing';
}
function openInspector(){
 if(focusMode)toggleFocus();inspectorOpen=true;inspectorPinned=true;sideTab='pack';setSideTab();syncInspector();
}
function toggleFocus(){
 if(!focusMode){focusSnapshot={inspectorOpen,inspectorPinned,palOpen};focusMode=true;palOpen=false;syncPalette();}
 else{focusMode=false;if(focusSnapshot){inspectorOpen=focusSnapshot.inspectorOpen;inspectorPinned=focusSnapshot.inspectorPinned;palOpen=focusSnapshot.palOpen;syncPalette();}}
 syncInspector();
}
$('evCollapseNav').onclick=()=>{navChoice=!app.classList.contains('ev-nav-collapsed');syncNav();};
$('evInspectorExpand').onclick=()=>{const expanded=app.classList.toggle('ev-inspector-expanded');$('evInspectorExpand').setAttribute('aria-expanded',String(expanded));$('evInspectorExpand').setAttribute('aria-label',expanded?'Reduce settings panel':'Expand settings panel');$('evInspectorExpand').textContent=expanded?'Reduce':'Expand';};
$('evInspectorClose').onclick=()=>{inspectorOpen=false;inspectorPinned=false;syncInspector();$('evInspectorToggle')?.focus();};
cv.addEventListener('pointerup',()=>{if(route==='markup'&&!focusMode&&!inspectorOpen&&tool==='select'&&sideTab==='props'&&(sel||selSet.size)){inspectorOpen=true;inspectorPinned=false;renderSide();}});
$('btnSide').onclick=openInspector;focusButton.onclick=toggleFocus;
strip.addEventListener('click',e=>{if(e.target.closest('#evInspectorToggle'))openInspector();});
$('rail').addEventListener('click',e=>{if(e.target.closest('[data-tool]')){palOpen=false;syncPalette();}});
const originalPalette=syncPalette;
syncPalette=function(){originalPalette();document.querySelectorAll('#catbar [data-cat]').forEach(b=>{b.setAttribute('aria-expanded',String(palOpen&&palCat===b.dataset.cat));b.setAttribute('aria-controls','rail');});syncCategoryPicker();};
syncCategoryPicker();
const closeNav=()=>{$('evSidebar').classList.remove('open');$('evNavBackdrop').hidden=true;$('evMobileNav').setAttribute('aria-expanded','false');};
$('evNavBackdrop').onclick=closeNav;
window.addEventListener('resize',()=>{syncNav();if(innerWidth>700)closeNav();});

function updateChrome(){
 if(!$('evApp'))return;
 $('evProjectTitle').textContent=route==='profile'?'My profile':route==='projects'?'Your projects':route==='overview'?'Project overview':(pack.name||'Untitled project');
 $('evBreadcrumb').textContent=route==='profile'?'EV Site Planner / Profile':route==='projects'?'EV Site Planner / Workspace':'Project / '+(routes.find(r=>r[0]===route)?.[1]||route);
 $('evModePill').textContent=window.EVAudit?.isAuditProject()?'Site audit':modeName();$('evModePill').hidden=['projects','profile'].includes(route);$('evSaveState').hidden=route==='profile';
 $('evEditTop').hidden=['projects','profile','overview'].includes(route);$('evBackupTop').hidden=route==='profile'||(route==='projects'&&!hasWork());
 $('evIssuePlans').hidden=route!=='markup';
 app.querySelectorAll('[data-ev-route]').forEach(b=>{if(b.dataset.evRoute===route)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 const p=activePhoto();
 const markup=icon('plan')+'<select aria-label="Active plan" id="evActivePlan">'+(pack.photos.length?pack.photos.map(p=>'<option value="'+h(p.id)+'" '+(p.id===pack.active?'selected':'')+'>'+h(p.name)+'</option>').join(''):'<option>No plans yet</option>')+'</select>'+btn('Add files','add-files','','plus')+'<button class="ev-btn" data-ev-action="evidence-overlay" aria-pressed="'+String(!!window.EVPlanning?.overlayActive())+'" title="M: measured, A: assumed, !: missing">Evidence'+(window.EVPlanning?.overlayActive()?' · M / A / !':'')+'</button><span class="ev-plan-meta">'+(p?p.items.length+' items':'Photos · PDF · ZIP')+'</span>'+(p?'<span class="ev-scale-status '+(p.scale?.pxPerM?'set':'')+'">'+(p.scale?.pxPerM?'Scale recorded':'Scale not set')+'</span>':'')+'<button class="ev-btn" id="evInspectorToggle" aria-label="Plan settings" aria-controls="side" aria-expanded="false">'+icon('tools')+'<span>Plan settings</span></button>';
 if(markup!==stripSignature){strip.innerHTML=markup;stripSignature=markup;$('evActivePlan').onchange=e=>openPlan(e.target.value);}
 syncInspector();syncBackupState();
}
const baseRenderSide=renderSide;
renderSide=function(){baseRenderSide();updateChrome();};
function go(next){
 if(next!=='planning')window.EVPlanning?.stopReplay();
 if(!['home','projects','profile',...routes.map(r=>r[0])].includes(next))next='overview';
 if(programmeNode.parentElement!==originalProgrammeParent){originalProgrammeParent.append(programmeNode);programmeNode.classList.remove('ev-programme');programmeNode.setAttribute('role','dialog');programmeNode.setAttribute('aria-modal','true');}
 route=next;app.classList.toggle('ev-is-home',next==='home');document.title=next==='home'?'EV Site Planner · EV installation planning':'EV Site Planner · '+(next==='profile'?'My profile':next==='projects'?'Your projects':(pack.name||'Project workspace'));$('evCanvasHost').hidden=next!=='markup';$('evScreen').hidden=next==='markup';if($('evHelpTop'))$('evHelpTop').hidden=next!=='markup';$('evSidebar').classList.remove('open');$('evMobileNav').setAttribute('aria-expanded','false');
 app.dataset.route=next;closeNav();syncNav();
 $('evTechMenu').hidden=true;updateChrome();
 if(next==='markup'){requestAnimationFrame(()=>{if(route!=='markup')return;resize();fitView();drawCanvas();});return;}
 const page={profile:()=>EVProfile.render(),home:()=>EVHome.render(),planning:()=>EVPlanning.render(),projects:projectsPage,overview:()=>window.EVAudit?.isAuditProject()?EVAudit.overview():overviewPage(),programme:programmePage,snags:snagsPage,audit:()=>window.EVAudit?EVAudit.render():'',issue:issuePage}[next];
 $('evScreen').innerHTML='<div class="ev-page">'+page()+'</div>';$('evScreen').scrollTop=0;
 if(next==='projects'||next==='home'){hydratePreviews($('evScreen'));if(previewStale||!previews.has(pack.projId))refreshPreview().then(()=>{if(route===next)hydratePreviews($('evScreen'));});}
 if(next==='projects'){
  $('evSearch').value=search;$('evFilter').value=filter;
  $('evSearch').oninput=e=>{search=e.target.value;renderProjectCards();};$('evFilter').onchange=e=>{filter=e.target.value;renderProjectCards();};renderProjectCards();
 }
 if(next==='overview')dashboardImage();
 // Fetch the report fonts in the background where documents are prepared.
 if(next==='issue'||next==='audit')window.EVDelivery?.reportFonts().catch(()=>{});
 if(next==='planning')EVPlanning.afterRender();
 EVProjectStore.renderConflict();
 if(next==='programme'&&window.EVDelivery){EVDelivery.mountProgramme();}
 else if(next==='programme'){programmeNode.classList.add('ev-programme');programmeNode.removeAttribute('aria-modal');programmeNode.removeAttribute('role');$('evProgrammeMount').append(programmeNode);renderProg();}
 if(next==='snags'&&window.EVDelivery)EVDelivery.mountSnags();
 const title=$('evScreen').querySelector('h1');if(title){title.tabIndex=-1;title.focus({preventScroll:true});}
}
function heading(title,sub,actions=''){const eyebrow=route==='projects'?'':h(modeName())+' PROJECT';return '<div class="ev-heading"><div>'+(eyebrow?'<div class="ev-eyebrow">'+eyebrow+'</div>':'')+'<h1>'+title+'</h1><p>'+sub+'</p></div><div class="ev-actions">'+actions+helpBtn(route==='projects'?'projects':'overview')+'</div></div>';}
const planArt='<svg class="ev-hero-art" viewBox="0 0 260 175" fill="none" aria-hidden="true"><path d="M21 140 90 23l152 49-65 98Z" fill="#224258" stroke="#5e7f95"/><path d="m52 118 113 37M64 96l115 37M77 74l116 37M91 52l114 36M93 138l70-97M137 152l69-95" stroke="#567289"/><path d="m91 120 17-27 48 17 17-27" stroke="#d2eb92" stroke-width="4" stroke-linecap="round" stroke-dasharray="3 7"/><rect x="93" y="75" width="18" height="33" rx="5" fill="#e5edf3"/><rect x="97" y="80" width="10" height="12" rx="2" fill="#548aec"/><path d="M174 48v32" stroke="#9dafbd" stroke-width="7"/><rect x="165" y="27" width="19" height="36" rx="6" fill="#e5edf3"/><rect x="169" y="32" width="11" height="12" rx="2" fill="#548aec"/><circle cx="62" cy="54" r="6" fill="#d2eb92"/></svg>';
const count=(n,t)=>n+' '+t+(n===1?'':'s');
const meter=(pct,label='')=>'<span class="ev-meter"'+(label?' role="img" aria-label="'+h(label)+'"':' aria-hidden="true"')+'><i style="width:'+Math.max(0,Math.min(100,Number(pct)||0))+'%"></i></span>';
function projectsPage(){
 const n=projIndex().length;
 return heading('Your projects',n?count(n,'project')+' saved in this browser. Open one, start a new project or import a backup.':'Start a new project or open a project backup.',btn('Open backup','open','','folder')+btn('New project','new','primary','plus'))+
 (hasWork()?resumeCard():'')+
 '<div class="ev-project-library"><div class="ev-filter"><h2 class="ev-section-title">All projects <span class="ev-muted">'+n+'</span></h2><div class="ev-project-search"><label class="ev-search">'+icon('search')+'<input class="ev-input" id="evSearch" type="search" aria-label="Search projects" placeholder="Search name, reference or client"></label><select class="ev-select" id="evFilter" aria-label="Filter project type"><option value="all">All project types</option><option value="commercial">Commercial</option><option value="domestic">Domestic</option><option value="audit">Site audits</option></select></div></div><div id="evProjectCards"></div></div>'+
 '<section class="ev-storage-note">'+icon('backup')+'<div><b>Saved in this browser'+hq('planner-backups','About saving and recovery','projects-storage')+'</b><p>Projects stay with this device and site address. Download a backup to keep a separate copy or continue on another device.</p></div>'+btn('Recover missing projects','recover-projects')+'</section>';
}
function resumeCard(){
 const s=stats(),p=activePhoto()||pack.photos[0],src=p&&(p.thumb||p.src),chargers=allItems().filter(i=>i.type==='unit'&&i.provision!=='passive').length;
 return '<section class="ev-resume" aria-labelledby="evResumeTitle"><div class="ev-resume-preview">'+(src?'<img src="'+h(previews.get(pack.projId)||src)+'" alt="" data-ev-preview="'+h(pack.projId)+'">':icon('plan'))+'</div><div class="ev-resume-copy"><span class="ev-resume-label">Continue working</span><h2 id="evResumeTitle">'+h(pack.name||'Untitled project')+'</h2><p>'+h([pack.jobRef,pack.custName].filter(Boolean).join(' · ')||modeName()+' project')+'</p><ul class="ev-facts">'+[[s.plans,'plan'],[chargers,'charger'],[s.routes,'route'],[s.snags,'open snag']].map(([n,t])=>'<li><b>'+n+'</b> '+t+(n===1?'':'s')+'</li>').join('')+'</ul></div><div class="ev-resume-actions">'+btn('Open project','workspace','primary','arrow')+btn('Go to markup','markup','','pen')+'</div></section>';
}
function renderProjectCards(){
 const list=projIndex().filter(x=>(filter==='all'||(filter==='audit'?x.audit?.kind==='audit':x.mode===filter))&&[x.name,x.ref,x.cust].join(' ').toLowerCase().includes(search.toLowerCase())),filtered=search||filter!=='all';
 $('evProjectCards').innerHTML=list.length?'<div class="ev-project-grid">'+list.map(x=>{
  const current=x.id===pack.projId&&hasWork(),facts=x.audit?.kind==='audit'&&!Number(x.n)?[]:[count(Number(x.n)||0,'plan')];
  if(Number.isFinite(x.units))facts.push(count(x.units,'charger'));
  if(x.snags>0)facts.push(count(Number(x.snags),'open snag'));
  if(x.audit&&Number.isFinite(x.audit.total))facts.push(x.audit.done+' of '+x.audit.total+' checks'+(x.audit.fail>0?', '+count(Number(x.audit.fail),'fail'):''));
  return '<article class="ev-project-row'+(current?' current':'')+'"><div class="ev-project-preview">'+(previews.get(x.id)||x.thumb?'<img src="'+h(previews.get(x.id)||x.thumb)+'" alt="" data-ev-preview="'+h(x.id)+'">':icon('plan'))+'</div><div class="ev-project-body"><div class="ev-project-tags"><span class="ev-pill">'+(x.audit?.kind==='audit'?'Site audit':x.mode==='domestic'?'Domestic':'Commercial')+'</span>'+(x.rev?'<span class="ev-pill quiet">Rev '+h(x.rev)+'</span>':'')+(current?'<span class="ev-pill lime">Open now</span>':'')+'</div><h2>'+h(x.name)+'</h2><p>'+h([x.ref,x.cust].filter(Boolean).join(' · ')||'No reference or client recorded')+'</p><ul class="ev-facts">'+facts.map(f=>'<li>'+f+'</li>').join('')+'</ul>'+(x.audit?.kind==='audit'&&x.audit.total?'<div class="ev-project-checks">'+meter(x.audit.done/x.audit.total*100)+'<small>Audit '+Math.round(x.audit.done/x.audit.total*100)+'%</small></div>':Number.isFinite(x.ready)?'<div class="ev-project-checks">'+meter(x.ready)+'<small>Record checks '+Number(x.ready)+'%</small></div>':'')+'</div><div class="ev-project-foot"><small>'+h(niceDate(x.date)?'Edited '+niceDate(x.date):'')+'</small><button class="ev-btn" data-ev-project="'+h(x.id)+'" aria-label="Open '+h(x.name)+'">Open '+icon('arrow')+'</button></div></article>';
 }).join('')+'</div>':filtered?empty('No matching projects','Try a different search or project type.'):'<div class="ev-empty ev-empty-projects">'+planArt+'<b>No saved projects yet</b>Enter the site details, then add a drawing or photo.<div class="ev-actions">'+btn('Create a project','new','primary','plus')+btn('Try an example project','example','','arrow')+'</div></div>';
 hydratePreviews($('evProjectCards'));
}
function stageSteps(prog){
 const s=stats(),w=ensure(),unscaled=pack.photos.filter(x=>!x.scale?.pxPerM).length,snag=snagStats();
 let facts=[];try{facts=window.EVPlanningCore?EVPlanningCore.facts(pack):[];}catch(_){}
 const missing=facts.filter(f=>f.status==='missing').length,assumed=facts.filter(f=>f.status==='assumed').length;
 return [
  ['markup','Markup','pen',!s.plans?['todo','Add a plan']:unscaled?['attention',count(unscaled,'plan')+' without a scale']:!s.units?['todo','Place the chargers']:['done',count(s.units,'charger symbol')+' placed']],
  ['planning','Design lab','tools',missing?['attention',count(missing,'value')+' missing']:assumed?['todo',count(assumed,'value')+' assumed']:facts.length?['done','Evidence recorded']:['todo','Nothing to check yet']],
  ['programme','Programme','calendar',!prog?.b?['todo','Dates to set']:prog.active.length&&prog.complete===prog.active.length?['done','All activities complete']:['active','Starts '+niceDate(prog.b.from)]],
  ['snags','Snags','flag',snag.open?['attention',count(snag.open,'open snag')]:snag.total?['done','All snags fixed']:['todo','None recorded']],
  ['issue','Issue','send',w.issues.length?['done',count(w.issues.length,'download')]:['todo','Nothing issued yet']]
 ];
}
const stageLabel={done:'Done',active:'In progress',attention:'Needs attention',todo:'To do'};
function flowSteps(prog){
 const steps=stageSteps(prog),label=stageLabel;
 return '<nav class="ev-flow" aria-label="Project stages"><ol>'+steps.map(([a,t,ic,[state,d]],i)=>'<li><button type="button" class="ev-flow-step '+state+'" data-ev-action="'+a+'"><span class="ev-flow-mark">'+icon(state==='done'?'check':state==='attention'?'alert':ic)+'</span><span class="ev-flow-copy"><small>Step '+(i+1)+'<span class="ed-sr-only"> · '+label[state]+'</span></small><b>'+t+'</b><em>'+h(d)+'</em></span></button></li>').join('')+'</ol></nav>';
}
// Project pages share the overview's navy header. The stage strip is read-only: it summarises a programme only once the Programme page has created one.
function programmeSnapshot(){try{if(Array.isArray(pack.programme?.activities))return window.EVDelivery?.programmeSummary()||null;}catch(_){}return null;}
function stageStrip(current){
 if(window.EVAudit?.isAuditProject())return EVAudit.stageStrip(current);
 let steps;try{steps=stageSteps(programmeSnapshot());}catch(_){return '';}
 return '<nav class="ev-stage-strip" aria-label="Project stages"><ol>'+steps.map(([a,t,ic,[state,d]],i)=>'<li><button type="button" class="ev-stage '+state+(a===current?' current':'')+'" data-ev-action="'+a+'"'+(a===current?' aria-current="page"':'')+' title="'+h(d)+'"><span class="ev-stage-mark">'+icon(state==='done'?'check':state==='attention'?'alert':ic)+'</span><span class="ev-stage-copy"><small>Step '+(i+1)+'<span class="ed-sr-only"> · '+stageLabel[state]+'</span></small><b>'+t+'</b></span></button></li>').join('')+'</ol></nav>';
}
function pageHead(title,sub,actions='',stage=''){
 const eyebrow=stage?(window.EVAudit?.isAuditProject()?'Site audit':h(modeName())+' project')+(pack.jobRef?' / '+h(pack.jobRef):''):'';
 return '<header class="ev-page-head'+(stage?' has-stages':'')+'"><div class="ev-page-head-main"><div>'+(eyebrow?'<div class="ev-eyebrow">'+eyebrow+'</div>':'')+'<h1>'+title+'</h1><p>'+sub+'</p></div>'+'<div class="ev-actions">'+actions+helpBtn(stage||(/profile/i.test(title)?'profile':'overview'))+'</div>'+'</div>'+(stage?stageStrip(stage):'')+'</header>';
}
function overviewPage(){
 const s=stats(),w=ensure(),p=activePhoto()||pack.photos[0],tasks=[];
 const missing=[!pack.name?'project name':'',!pack.address?'site address':'',!pack.surveyedBy?'project lead':''].filter(Boolean);
 if(missing.length)tasks.push(['details',missing.length===1?'Add '+missing[0]:'Add missing site details',missing.length===1?'Enter this in the project details.':missing.map(t=>t[0].toUpperCase()+t.slice(1)).join(' · '),'plan']);
 if(!s.plans)tasks.push(['add-files','Add your first plan','Upload a photo, PDF or survey ZIP','plus']);
 else if(pack.photos.some(x=>!x.scale?.pxPerM))tasks.push(['scale-review','Review the plan scale','Set a reference before measuring routes','pen']);
 if(s.snags)tasks.push(['snags','Review '+count(s.snags,'open snag'),'Check the snag, who will fix it and its target date','flag']);
 if(!pack.programme?.start)tasks.push(['programme','Set the programme dates','Set activity dates and assign the work','calendar']);
 const auditTask=window.EVAudit?.task();if(auditTask)tasks.push(auditTask);
 if(!tasks.length)tasks.push(['issue','Review the project documents','Check the content before downloading','file']);
 let ready=null,prog=null;try{ready=readiness();}catch(_){}
 // The programme page creates the activity list; only summarise one that already exists.
 try{if(Array.isArray(pack.programme?.activities))prog=window.EVDelivery?.programmeSummary();}catch(_){}
 const programmeStart=pack.programme?.start,activities=prog?.active.length||0;
 return '<div class="ev-overview-heading"><div><div class="ev-eyebrow">'+h(modeName())+' project'+(pack.jobRef?' / '+h(pack.jobRef):'')+'</div><h1>'+h(pack.name||'Project overview')+'</h1><p>'+h([pack.address,pack.postcode].filter(Boolean).join(', ')||'Add a site address to complete your project details.')+'</p></div>'+'<div class="ev-actions"><button class="ev-btn" data-ev-action="details" aria-label="Edit project details">'+icon('pen')+'<span>Edit details</span></button>'+helpBtn('overview')+'</div>'+'</div>'+
 flowSteps(prog)+backupNudge()+
 '<div class="ev-overview-grid"><section class="ev-card ev-plan-card"><div class="ev-card-head"><h2>Plans & markup'+hq('planner-first-project','About plans and markup','overview-plans')+'</h2><span class="ev-pill">Rev '+h(pack.rev||'A')+'</span></div>'+
 (p?'<button type="button" class="ev-live-plan" data-ev-action="markup" aria-label="Open current plan in markup"><img id="evDashboardPlan" src="'+h(p.thumb||p.src)+'" alt="'+h(p.name)+' preview"></button>'+
  '<div class="ev-metrics">'+[['plan','Plans',s.plans],['cube','Charger symbols',s.units],['pen','Routes',s.routes],['flag','Open snags',s.snags]].map(([ic,t,n])=>'<div class="ev-metric"><span class="ev-metric-icon '+(ic==='flag'&&n?'amber':'')+'">'+icon(ic)+'</span><div><b>'+n+'</b><span>'+t+'</span></div></div>').join('')+'</div>'+
  '<div class="ev-plan-card-foot"><div><b>'+h(p.name)+'</b><small>'+count(p.items.length,'item')+' · '+(p.scale?.pxPerM?'Scale recorded':'Scale not set')+'</small></div>'+btn('Continue markup','markup','primary','arrow')+'</div>':empty('No plans added','Add a drawing or site photo to begin your installation plan.',btn('Add site files','add-files','primary','plus')+btn('Try an example project','example','','arrow')))+
 (pack.photos.length>1?'<div class="ev-plan-picks">'+pack.photos.map(ph=>'<button data-ev-plan="'+h(ph.id)+'"><img src="'+h(ph.thumb||ph.src)+'" alt=""><span>'+h(ph.name)+'<small>'+(ph.scale?.pxPerM?'Scale recorded':'Scale not set')+'</small></span></button>').join('')+'</div>':'')+'</section>'+
 '<div class="ev-overview-side"><section class="ev-card ev-next-card"><div class="ev-card-head"><h2>Next actions'+hq('planner-first-project','About next actions','overview-next')+'</h2><span class="ev-task-count">'+tasks.length+'</span></div><div class="ev-next-list">'+tasks.map(([a,t,d,ic])=>'<button data-ev-action="'+a+'"><span class="ev-next-icon">'+icon(ic)+'</span><span><b>'+h(t)+'</b><small>'+h(d)+'</small></span>'+icon('arrow')+'</button>').join('')+'</div></section>'+
 (ready?'<section class="ev-card ev-checks-card"><div class="ev-card-head"><h2>Record checks'+hq('survey-checklist','About record checks','overview-checks')+'</h2><span class="ev-task-count">'+ready.done+'/'+ready.total+'</span></div><div class="ev-card-body">'+meter(ready.pct,ready.done+' of '+ready.total+' record checks complete')+'<ul class="ev-check-list">'+ready.checks.map(([t,ok])=>'<li class="'+(ok?'ok':'')+'">'+icon(ok?'check':'circle')+'<span>'+h(t)+'<span class="ed-sr-only">: '+(ok?'recorded':'not recorded yet')+'</span></span></li>').join('')+'</ul></div><div class="ev-next-footer">Based on the information recorded so far. Design approval must be checked separately.</div></section>':'')+(window.EVAudit?EVAudit.card():'')+'</div></div>'+
 '<div class="ev-dashboard-bottom"><section class="ev-card"><div class="ev-card-head"><h2>Site and contacts'+hq('survey-basics','About site and contacts','overview-site')+'</h2>'+btn('Edit','details','quiet')+'</div><div class="ev-card-body"><dl class="ev-kv">'+[['Client',pack.custName],['Project lead',pack.surveyedBy],['Site contact',[w.contactName,w.contactPhone].filter(Boolean).join(' · ')],['Project type',modeName()]].map(([t,v])=>'<dt>'+t+'</dt><dd>'+(v?h(v):'<span class="ev-muted">Not recorded</span>')+'</dd>').join('')+'</dl></div></section>'+
 '<section class="ev-card"><div class="ev-card-head"><h2>Programme'+hq('planner-pages','About the programme','overview-programme')+'</h2>'+icon('calendar')+'</div><div class="ev-card-body ev-delivery-summary"><b>'+h(programmeStart?'Starts '+niceDate(programmeStart):'Programme dates to set')+'</b><p>'+h(activities&&programmeStart?prog.complete+' of '+activities+' '+(activities===1?'activity':'activities')+' complete.':programmeStart?'Check activity dates, responsibilities and progress.':'Add activities, set dates and assign a person or team to each task.')+'</p>'+(activities&&programmeStart?meter(prog.complete/activities*100):'')+btn('Open programme','programme','','arrow')+'</div></section>'+
 '<section class="ev-card ev-downloads-card"><div class="ev-card-head"><h2>Recent downloads'+hq('planner-pages','About downloads','overview-downloads')+'</h2>'+icon('file')+'</div><div class="ev-card-body">'+(w.issues.length?'<ul class="ev-download-list">'+w.issues.slice(-3).reverse().map(i=>'<li><b>'+h(i.label)+'</b><small>Rev '+h(i.rev)+' · '+h(niceDate(i.at))+'</small></li>').join('')+'</ul>':'<p>Your document downloads will appear here.</p>')+btn('Review & issue','issue','','arrow')+'</div></section>'+
 backupCard()+'</div>';
}
// Rendered plan previews for project cards. They stay in IndexedDB, apart from the project index and backups.
const previews=new Map();let previewStale=true;
function storePreview(id,canvas){
 try{const c=document.createElement('canvas');c.width=560;c.height=Math.max(1,Math.round(560*canvas.height/canvas.width));const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(canvas,0,0,c.width,c.height);
  const url=c.toDataURL('image/jpeg',.78);previews.set(id,url);if(id===pack.projId)previewStale=false;idbSet('preview_'+id,url).catch(()=>{});}catch(_){}
}
async function refreshPreview(){
 const p=activePhoto()||pack.photos[0],id=pack.projId;if(!p||!id||!hasWork())return;
 try{await window.EVDelivery?.preparePlan(p);const canvas=await (window.EVWorkbench?.renderArtwork||renderPhotoToCanvas)(p,1120);if(pack.projId===id)storePreview(id,canvas);}catch(_){}
}
function hydratePreviews(root){
 root?.querySelectorAll('img[data-ev-preview]').forEach(img=>{
  const id=img.dataset.evPreview,cached=previews.get(id);if(cached){img.src=cached;return;}
  try{idbGet('preview_'+id).then(url=>{if(typeof url==='string'&&url.startsWith('data:image/')){previews.set(id,url);if(img.isConnected)img.src=url;}}).catch(()=>{});}catch(_){}
 });
}
let dashboardImageToken=0;
async function dashboardImage(){
 const token=++dashboardImageToken,p=activePhoto()||pack.photos[0],project=pack.projId;if(!p)return;
 try{await window.EVDelivery?.preparePlan(p);const canvas=await (window.EVWorkbench?.renderArtwork||renderPhotoToCanvas)(p,1600);if(route==='overview'&&token===dashboardImageToken&&pack.projId===project&&$('evDashboardPlan'))$('evDashboardPlan').src=canvas.toDataURL('image/png');if(pack.projId===project)storePreview(project,canvas);}catch(_){}
}
function programmePage(){return pageHead('Project programme','Set activity dates, assign responsibilities and record progress.',btn('Open markup','markup','','pen'),'programme')+'<div id="evProgrammeMount"></div>';}
function snagsPage(){if(window.EVDelivery)return pageHead('Snag register','Record each snag, its location, who will fix it and the target date. Add photos before and after the work.',btn('Review snag report','snag-report','','file')+btn('Add a snag on the plan','add-snag','primary','plus'),'snags')+'<div id="evSnagMount"></div>';const rows=snagList();return pageHead('Snag register','Findings are linked to their location on the plan. Open an item to add details and before or after photos.',btn('Add a snag on the plan','add-snag','primary','plus'),'snags')+
 '<div class="ev-stats">'+[['Total findings',rows.length],['Open',rows.filter(x=>x.it.st!=='fixed').length],['Fixed',rows.filter(x=>x.it.st==='fixed').length],['Safety items open',rows.filter(x=>x.it.st!=='fixed'&&x.it.sev==='safety').length]].map(([t,n])=>'<div class="ev-stat"><label>'+t+'</label><b>'+n+'</b></div>').join('')+'</div>'+
 '<section class="ev-card">'+(rows.length?'<div class="ev-table-wrap"><table class="ev-table"><thead><tr><th>Item</th><th>Finding / plan</th><th>Assigned to</th><th>Severity</th><th>Status</th><th></th></tr></thead><tbody>'+rows.map(({it,photo})=>'<tr><td>'+h(it.n||'•')+'</td><td><b>'+h(it.label||'Untitled finding')+'</b><small>'+h(photo.name)+'</small></td><td>'+h(it.who||'Unassigned')+'</td><td>'+h(SNAG_SEVS[it.sev||'minor']?.label||'Minor')+'</td><td><span class="ev-pill '+(it.st==='fixed'?'green':'amber')+'">'+(it.st==='fixed'?'Fixed':'Open')+'</span></td><td><button class="ev-btn" data-ev-snag="'+h(it.id)+'" data-photo-id="'+h(photo.id)+'">Open</button></td></tr>').join('')+'</tbody></table></div>':empty('No snags recorded','Place a numbered snag marker on a plan, then record the finding and who will put it right.',btn('Open markup','markup','','pen')))+'</section>';
}
function issuePage(){const w=ensure(),plans=pack.photos.length;
 const out=([ic,t,d,a,l])=>'<article class="ev-out"><span class="ev-out-icon">'+icon(ic)+'</span><h3>'+t+'</h3><p>'+d+'</p>'+btn(l,a,a==='plans'?'primary':'')+'</article>';
 return pageHead('Review & issue','Choose a document, review its contents and download it.',btn('Project backup','backup','','download'),'issue')+
 (!plans?'<div class="ev-notice">Add a site plan or photo in Markup before creating a drawing pack.</div>':'')+
 '<h2 class="ev-group-title">Drawings and packs'+hq('quote-pack','About drawings and packs','issue-drawings')+'</h2><div class="ev-outs">'+[
  ['plan','Marked-up plans','Choose the plans and photos, inspect the markup and download one PDF.','plans','Select & preview'],
  ['file','Engineer pack','Review the technical project record and marked-up plans together.','engineer','Review engineer pack'],
  ['send','Client pack','Review the customer wording, selected plans and the accompanying email.','client','Review client pack']
 ].map(out).join('')+'</div>'+
 '<h2 class="ev-group-title">Schedules and records'+hq('cert','About schedules and records','issue-schedules')+'</h2><div class="ev-outs ev-outs-compact">'+[
  ['calendar','Programme','Check activities, responsibilities, dates and progress before downloading.','programme-report','Review programme'],
  ['flag','Snag report','Review findings, owners, target dates and before / after evidence.','snag-report','Review snag report'],
  ['grid','Materials & schedules','Use the markup quantities to prepare a materials list and cable schedule.','materials','Review materials'],
  ['photo','Current plan image','Download the current annotated plan as a PNG image.','png','Download image']
 ].map(out).join('')+'</div>'+
 (pack.audit&&typeof pack.audit==='object'?'<h2 class="ev-group-title">Site audit</h2><div class="ev-outs ev-outs-compact">'+out(['check','Evidence pack','Review the audit findings, photos and the full checklist, then download the PDF.','audit-pack','Review evidence pack'])+'</div>':'')+
 '<section class="ev-card"><div class="ev-card-head"><h2>Document download history</h2><span class="ev-note-count">Downloads recorded in this browser</span></div>'+(w.issues.length?'<div class="ev-table-wrap"><table class="ev-table"><thead><tr><th>Document</th><th>Revision</th><th>Downloaded</th><th>Filename</th></tr></thead><tbody>'+w.issues.slice().reverse().map(i=>'<tr><td>'+h(i.label)+'</td><td>'+h(i.rev)+'</td><td>'+h(niceDate(i.at))+'</td><td>'+h(i.file)+'</td></tr>').join('')+'</tbody></table></div>':empty('No documents downloaded yet','Previewing a document does not add it to this history.'))+'</section>';
}

async function newProject(example=false,audit=false){return changeProject(async()=>{
 finishDrawing();
 if(hasWork()&&!await persist()){toast('Download a backup before starting a new project.');return;}
 await window.EVProfile?.ready;clearTimeout(saveT);saveT=null;pack=newPack();if(!example)window.EVProfile?.apply(pack);pack.projId=uid();freshProjects.add(pack.projId);ensure();history=[];redoStack=[];sel=null;draftRoute=null;draftScale=null;imgKeys();updateUndo();syncSiteChip();syncBrand();applyMode(false);buildRail();sideTab='pack';packSec='capture';setSideTab();draw();
 if(example){pack.name='Riverside Business Park · example';pack.jobRef='EXAMPLE-001';pack.custName='Example client';pack.address='Example site, for trying the drawing tools';pack.notes='Example layout: four EV bays, two twin chargers, a feeder pillar and a proposed cable route. Replace all assumptions with the site survey before use.';syncSiteChip();buildStarter('compact');allItems().filter(i=>i.type==='route').forEach((i,n)=>{if(n)i.labelT=.12;});draw();await persist();go('overview');}
 else{await idbDel('autosave').catch(()=>{});try{localStorage.removeItem(LS_KEY);}catch(_){}
  // An audit-only project records its site details on the audit page instead of the project details dialog.
  if(audit&&window.EVAuditCore){pack.audit=EVAuditCore.create({kind:'audit',auditor:pack.surveyedBy||''});go('audit');}
  else{go('overview');openDetails(0);}}
});}
function openPlan(id){if(!photoById(id))return;finishDrawing();pack.active=id;sideTab='pack';packSec='capture';setSideTab();go('markup');fitView();draw();autosave();}
function panel(section){go('markup');packSec=section;openInspector();}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function slug(v){return String(v||'EV-project').replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,100);}
async function backup(){return changeProject(async()=>{
 // Wait for file decoding through changeProject, then commit any route to its source plan.
 finishDrawing();normalisePack(pack);
 const previous=ensure().backupAt;
 ensure().backupAt=new Date().toISOString();
 try{downloadBlob(new Blob([JSON.stringify(serialisablePack())],{type:'application/json'}),slug(pack.name)+'.evplan.json');}
 catch(err){if(previous==null)delete ensure().backupAt;else ensure().backupAt=previous;throw err;}
 autosave();syncBackupState();keepStorage();toast('Project backup downloaded');if(route==='overview')go('overview');return true;
},'The backup could not be downloaded. Your current work is still available.');}
$('btnSave').onclick=backup;
function setInert(on){app.inert=on;}
function focusTrap(e,root,close){e.stopPropagation();if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}if(e.key==='Tab'){const a=[...root.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea,select,a[href]')].filter(x=>x.getClientRects().length);if(!a.length)return;const first=a[0],last=a.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}
function field(label,key,type='text',wide=false,help=''){const value=key.startsWith('workspace.')?ensure()[key.split('.')[1]]:pack[key];return '<label class="ev-field '+(wide?'wide':'')+'">'+label+(type==='textarea'?'<textarea data-ev-field="'+key+'">'+h(value)+'</textarea>':'<input type="'+type+'" data-ev-field="'+key+'" value="'+h(value)+'">')+(help?'<small>'+help+'</small>':'')+'</label>';}
function renderDetails(){
 const body=drawerStep===0?'<div class="ev-form">'+field('Project / site name','name','text',true)+field('Project reference','jobRef')+field('Postcode','postcode')+field('Site address','address','textarea',true)+'</div>':drawerStep===1?'<div class="ev-form"><div class="ev-mode-options">'+['domestic','commercial'].map(m=>'<button type="button" class="'+(pack.mode===m?'on':'')+'" data-ev-mode="'+m+'">'+(m==='domestic'?'Domestic':'Commercial')+'<small>'+(m==='domestic'?'Home charging, driveways and garages.':'Workplace, fleet and destination charging.')+'</small></button>').join('')+'</div>'+field('Scope & site notes','notes','textarea',true,'These notes appear in the project record and engineer pack.')+field('Drawing revision','rev')+field('Survey date','surveyDate','date')+'</div>':'<div class="ev-form">'+field('Client / organisation','custName','text',true)+field('Project lead / surveyor','surveyedBy','text',true)+field('Site contact','workspace.contactName')+field('Contact phone','workspace.contactPhone','tel')+field('Contact email','workspace.contactEmail','email',true)+'</div>';
 $('evDetails').innerHTML='<div class="ev-dialog" role="dialog" aria-modal="true" aria-labelledby="evDetailsTitle"><div class="ev-dialog-head"><div><h2 id="evDetailsTitle">Project details</h2><p>Enter the site address, scope of work and project contacts.</p></div><button class="ev-icon-btn" data-ev-close-details aria-label="Close project details">'+icon('close')+'</button></div><div class="ev-dialog-steps">'+['1 · Site','2 · Scope','3 · People'].map((t,i)=>'<button class="'+(drawerStep===i?'on':'')+'" data-ev-step="'+i+'">'+t+'</button>').join('')+'</div><div class="ev-dialog-body">'+body+'</div><div class="ev-dialog-foot">'+(drawerStep?'<button class="ev-btn" data-ev-step="'+(drawerStep-1)+'">Back</button>':'<span class="ev-note-count">Changes save as you type.</span>')+(drawerStep<2?'<button class="ev-btn primary" data-ev-step="'+(drawerStep+1)+'">Next '+icon('arrow')+'</button>':'<button class="ev-btn primary" data-ev-close-details>Done '+icon('check')+'</button>')+'</div></div>';
 $('evDetails').querySelector('input,textarea')?.focus({preventScroll:true});
}
function openDetails(step=0){returnFocus=document.activeElement;drawerStep=step;setInert(true);$('evDetails').hidden=false;renderDetails();}
function closeDetails(){ $('evDetails').hidden=true;setInert(false);syncSiteChip();applyMode(false);buildRail();renderSide();autosave();go(route);returnFocus?.isConnected&&returnFocus.focus({preventScroll:true});}
const details=document.createElement('div');details.id='evDetails';details.className='ev-backdrop';details.hidden=true;document.body.append(details);
details.addEventListener('keydown',e=>focusTrap(e,details,closeDetails));
details.addEventListener('input',e=>{const key=e.target.dataset.evField;if(!key)return;if(key.startsWith('workspace.'))ensure()[key.split('.')[1]]=e.target.value;else pack[key]=e.target.value;if(key==='name')$('packname').value=pack.name;syncSiteChip();autosave();});
details.addEventListener('click',e=>{if(e.target===details||e.target.closest('[data-ev-close-details]'))return closeDetails();const st=e.target.closest('[data-ev-step]');if(st){drawerStep=Number(st.dataset.evStep);renderDetails();}const m=e.target.closest('[data-ev-mode]');if(m){pushHist();setMode(m.dataset.evMode);renderDetails();}});

// Each review uses the same PDF viewer. Plan selection stays separate from technical pack contents.
const review=document.createElement('div');review.id='evReview';review.className='ev-backdrop';review.hidden=true;document.body.append(review);
let planViewer=null,planDoc=null;
function chosenPlans(){return pack.photos.filter(p=>p.includeInPdf!==false);}
async function previewPlan(){
 const token=++previewToken;planDoc=null;reviewCounts();
 if(!chosenPlans().length){planViewer?.destroy();planViewer=EVReportViewer.mount($('evPlanViewer'),{canvasId:'evPlanPreview'});planViewer.error('Select at least one plan to prepare the PDF.');return;}
 try{const doc=await buildPlans();if(token!==previewToken||review.hidden)return;await planViewer.set(doc);if(token!==previewToken||review.hidden)return;planDoc=doc;reviewCounts();}
 catch(err){if(token===previewToken&&!review.hidden){planViewer.error('The PDF could not be prepared. Check the plan images and try again.');$('evPlanCount').textContent=err.message;}}
}
function reviewCounts(){const n=chosenPlans().length;$('evPlanCount').textContent=n+' of '+pack.photos.length+' plans selected'+(n&&!planDoc?' · Preparing preview…':'');$('evDownloadPlans').disabled=!n||!planDoc||reviewBusy;}
function openPlanReview(){if(!pack.photos.length){go('markup');toast('Add a site plan or photo first.');return;}returnFocus=document.activeElement;setInert(true);review.hidden=false;review.innerHTML='<div class="ev-dialog ev-review-dialog" role="dialog" aria-modal="true" aria-labelledby="evReviewTitle"><div class="ev-dialog-head"><div><h2 id="evReviewTitle">Review marked-up plans</h2><p>'+h(pack.name||'Untitled project')+' · Rev '+h(pack.rev||'A')+'</p></div><button class="ev-icon-btn" data-ev-close-review aria-label="Close review">'+icon('close')+'</button></div><div class="ev-document-layout"><div id="evPlanViewer"></div><aside class="ev-document-options"><h3>Plans to include</h3><div class="ev-actions"><button class="ev-btn quiet" id="evSelectAll">Select all</button><button class="ev-btn quiet" id="evSelectNone">Clear selection</button></div>'+pack.photos.map(p=>'<label class="ev-plan-choice"><input aria-label="Include '+h(p.name)+'" type="checkbox" data-ev-include="'+h(p.id)+'" '+(p.includeInPdf!==false?'checked':'')+'><img src="'+h(p.thumb||p.src)+'" alt=""><span>'+h(p.name)+'<small>'+(p.scale?.pxPerM?'Scale recorded':'Scale not set')+'</small></span></label>').join('')+'<h3>Document details</h3><dl class="ev-document-meta"><dt>Prepared by</dt><dd>'+h(pack.surveyedBy||'Not recorded')+'</dd><dt>Company</dt><dd>'+h(pack.brandName||'Not recorded')+'</dd><dt>Revision</dt><dd>'+h(pack.rev||'A')+'</dd></dl><p>Exports retain the full equipment descriptions. The preview shows the PDF that will be downloaded.</p></aside></div><div class="ev-dialog-foot"><span class="ev-note-count" id="evPlanCount" role="status"></span><div class="ev-actions"><button class="ev-btn" data-ev-close-review>Back</button><button class="ev-btn primary" id="evDownloadPlans">'+icon('download')+'Download PDF</button></div></div></div>';
 planViewer=EVReportViewer.mount($('evPlanViewer'),{canvasId:'evPlanPreview'});$('evSelectAll').onclick=()=>selectPlans(true);$('evSelectNone').onclick=()=>selectPlans(false);$('evDownloadPlans').onclick=exportPlans;void previewPlan();review.querySelector('button').focus();}
function selectPlans(value){pack.photos.forEach(p=>p.includeInPdf=value);review.querySelectorAll('[data-ev-include]').forEach(e=>e.checked=value);void previewPlan();autosave();}
function closePlanReview(){if(reviewBusy)return;previewToken++;planViewer?.destroy();planViewer=null;planDoc=null;review.hidden=true;setInert(false);autosave();returnFocus?.isConnected&&returnFocus.focus();if(route==='issue')go('issue');}
review.addEventListener('keydown',e=>focusTrap(e,review,closePlanReview));review.addEventListener('change',e=>{if(e.target.dataset.evInclude){photoById(e.target.dataset.evInclude).includeInPdf=e.target.checked;void previewPlan();autosave();}});review.addEventListener('click',e=>{if(e.target===review||e.target.closest('[data-ev-close-review]'))closePlanReview();});
function logIssue(label,file,prepared){window.EVPlanning?.recordDocument(label,file,prepared);ensure().issues.push({label,file:String(file),at:new Date().toISOString(),rev:pack.rev||'A'});ensure().issues=ensure().issues.slice(-100);autosave();}
async function buildPlans(){
 await window.EVDelivery?.reportFonts();
 const selected=chosenPlans(),doc=new window.jspdf.jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true});window.EVDelivery?.installFonts(doc);
 for(let i=0;i<selected.length;i++){
  const p=selected[i];if(i)doc.addPage();await window.EVDelivery?.preparePlan(p);
  const canvas=renderPhotoToCanvas(p,2000);EVReportBranding.header(doc,{title:p.name||'Marked-up plan'});
  const ratio=Math.min(273/canvas.width,150/canvas.height),w=canvas.width*ratio,ht=canvas.height*ratio;
  doc.addImage(canvas,'PNG',(297-w)/2,39+(150-ht)/2,w,ht,undefined,'FAST');
 }
 EVReportBranding.footer(doc);doc.__evIssueLabel='Marked-up plans';return doc;
}
async function exportPlans(){
 if(!planDoc||reviewBusy)return;
 const b=$('evDownloadPlans');reviewBusy=true;b.disabled=true;b.textContent='Preparing PDF…';review.querySelectorAll('[data-ev-close-review]').forEach(e=>e.disabled=true);
 try{activeIssue='Marked-up plans';await planDoc.save(slug(pack.name)+'_plans_rev-'+slug(pack.rev||'A')+'.pdf',{returnPromise:true});toast('Marked-up plans PDF downloaded');
 }catch(err){activeIssue=null;console.error(err);toast('The PDF could not be created. Check the selected plans and try again.');}
 finally{reviewBusy=false;b.innerHTML=icon('download')+'Download PDF';review.querySelectorAll('[data-ev-close-review]').forEach(e=>e.disabled=false);reviewCounts();}
}
// Record only actual PDF save calls. Previews use output() and are not logged.
const api=window.jspdf?.jsPDF?.API;
if(api){
 const originalAdd=api.addImage;
 if(originalAdd)api.addImage=function(...a){if(a.length>=6&&String(a[1]||'').toUpperCase()==='PNG'){while(a.length<8)a.push(undefined);if(a[7]==null)a[7]='FAST';}return originalAdd.apply(this,a);};
}
// This version of jsPDF defines save on each instance, so wrap the constructor.
const BasePDF=window.jspdf.jsPDF;
function WorkspacePDF(...args){const prepared=window.EVPlanning?.documentSnapshot();const doc=new BasePDF(...args);const save=doc.save;doc.save=function(file,opts){const label=doc.__evIssueLabel||activeIssue||(/snag/i.test(file)?'Snag report':/programme/i.test(file)?'Programme':/customer|client/i.test(file)?'Client pack':/summary/i.test(file)?'Summary pack':/calc/i.test(file)?'Cable calculations':'Engineer / technical pack');activeIssue=null;const result=save.call(this,file,opts);if(result&&typeof result.then==='function')return result.then(x=>{logIssue(label,file,prepared);return x;});logIssue(label,file,prepared);return result;};return doc;}
Object.assign(WorkspacePDF,BasePDF);WorkspacePDF.prototype=BasePDF.prototype;window.jspdf.jsPDF=WorkspacePDF;
const baseOpenReview=openReview;
openReview=function(mode){activeIssue=null;baseOpenReview(mode);const button=$('rxExport'),original=button.onclick;button.onclick=async(...args)=>{activeIssue=mode==='customer'?'Client pack':'Engineer pack';return original.apply(button,args);};};

const actions={
 'workspace':()=>go(hasWork()?'overview':'projects'),
 'planning':()=>go('planning'),'evidence-overlay':()=>{EVPlanning.toggleOverlay();updateChrome();},'recover-projects':()=>EVPlanning.recoverProjects(),
 'new':()=>newProject(),'example':()=>newProject(true),'backup-later':()=>{try{const ids=JSON.parse(sessionStorage.getItem(laterKey)||'[]');sessionStorage.setItem(laterKey,JSON.stringify([...ids.filter(x=>x!==pack.projId),pack.projId].slice(-50)));}catch(_){freshProjects.add(pack.projId);}go('overview');},'open':()=>{if(!projectBusy)$('fileOpen').click();},'details':()=>openDetails(),'backup':backup,'markup':()=>go('markup'),'programme':()=>go('programme'),'snags':()=>go('snags'),'scale-review':()=>{const p=pack.photos.find(p=>!p.scale?.pxPerM);if(p)openPlan(p.id);else go('markup');setTool('scale');},'issue':()=>go('issue'),'showroom':()=>window.openCharger3D?.(),
 'add-files':()=>{go('markup');$('filePhoto').click();},'add-snag':()=>{if(!pack.photos.length){go('markup');toast('Add a plan or photo, then place a snag marker.');return;}go('markup');setTool('mark:snag');},
 'audit':()=>{if(!window.EVAudit)return;EVAudit.start();go('audit');},'audit-setup':()=>window.EVAudit?.show('setup'),'audit-evidence':()=>window.EVAudit?.show('evidence'),'audit-pack':()=>window.EVDelivery?.openReport('audit'),'new-audit':()=>newProject(false,true),
 'snag-report':()=>window.EVDelivery?.openReport('snags'),'programme-report':()=>window.EVDelivery?.openReport('programme'),'plans':openPlanReview,'engineer':()=>{if(!pack.photos.length)return actions['plans']();openReview('office');},'client':()=>{if(!pack.photos.length)return actions['plans']();openReview('customer');},'png':()=>{if(!activePhoto())return actions['plans']();$('btnPng').click();},'cdm':()=>window.evspCdmOpen?.(),'sld':()=>openSld(),'calcs':()=>openCableCheck(),'sim':()=>openSim(),'dno':()=>openDnoHelper(),'materials':()=>openBom(),'settings':()=>panel('output')
};
$('btnOpen').onclick=actions.open;
app.addEventListener('pointerdown',()=>{window.__evUserAction=true;},{capture:true});
app.addEventListener('keydown',()=>{window.__evUserAction=true;},{capture:true});
app.addEventListener('click',async e=>{
 window.__evUserAction=true;if(projectBusy)return;
 const section=e.target.closest('[data-psec]');if(section){packSec=section.dataset.psec;try{localStorage.setItem('evsp_packsec',packSec);}catch(_){}renderSide();return;}
 const action=e.target.closest('[data-ev-action]');if(action){e.preventDefault();$('evTechMenu').hidden=true;$('evTechnical').setAttribute('aria-expanded','false');const f=actions[action.dataset.evAction];if(f)await f();return;}
 const n=e.target.closest('[data-ev-route]');if(n){e.preventDefault();if(['home','projects','profile'].includes(n.dataset.evRoute))await persist();go(n.dataset.evRoute);return;}
 const p=e.target.closest('[data-ev-project]');if(p){await loadProject(p.dataset.evProject);return;}
 const plan=e.target.closest('[data-ev-plan]');if(plan){openPlan(plan.dataset.evPlan);return;}
 const snag=e.target.closest('[data-ev-snag]');if(snag){if(window.EVDelivery){EVDelivery.openSnag(snag.dataset.evSnag,snag.dataset.photoId);return;}pack.active=snag.dataset.photoId;go('markup');sel=snag.dataset.evSnag;sideTab='props';setSideTab();$('side').classList.add('open');draw();}
});
$('evMobileNav').onclick=()=>{const on=$('evSidebar').classList.toggle('open');$('evNavBackdrop').hidden=!on;$('evMobileNav').setAttribute('aria-expanded',String(on));};
$('evTechnical').onclick=()=>{const menu=$('evTechMenu'),b=$('evTechnical'),r=b.getBoundingClientRect();menu.hidden=!menu.hidden;b.setAttribute('aria-expanded',String(!menu.hidden));menu.style.left=Math.max(8,Math.min(r.left,innerWidth-268))+'px';menu.style.top=r.bottom+8+'px';if(!menu.hidden)menu.querySelector('button').focus();};
document.addEventListener('click',e=>{if(!tech.contains(e.target)){$('evTechMenu').hidden=true;$('evTechnical').setAttribute('aria-expanded','false');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('evTechMenu').hidden=true;$('evTechnical').setAttribute('aria-expanded','false');closeNav();}});
const importObserver=new MutationObserver(()=>{updateChrome();});importObserver.observe($('scName'),{childList:true,subtree:true});
async function importBackup(file){return changeProject(async()=>{
 let incoming;
 try{incoming=JSON.parse(await file.text());validateProjectBackup(incoming);incoming=normalisePack(incoming);}
 catch(_){toast("That doesn't look like an EV Site Planner backup. Your current project has been kept.");return false;}
 finishDrawing();
 if(hasWork()&&!await persist()){toast('Download a backup before opening another project.');return false;}
 // Imports get a separate project record so an older backup cannot overwrite current work.
 clearTimeout(saveT);saveT=null;incoming.projId=uid();freshProjects.add(incoming.projId);pack=incoming;ensure();imgKeys();history=[];redoStack=[];sel=null;selSet.clear();draftRoute=null;draftScale=null;updateUndo();
 pack.photos.forEach(p=>{const im=new Image();im.onload=draw;im.src=p.src;imgCache[p.id]=im;});
 syncSiteChip();syncBrand();applyMode(false);buildRail();sideTab='pack';packSec='capture';setSideTab();fitView();draw();await persist();go('overview');toast('Project backup opened as a separate copy');return true;
});}
window.EVWorkspace={go,persist,pageHead,withProject:changeProject,openPlan,openDetails,openPlanReview,backup,stats,importBackup,afterImport(){ensure();syncSiteChip();syncBrand();applyMode(false);buildRail();persist();go('overview');},route:()=>route,refresh:()=>go(route),logIssue,parts:{icon,btn,backupNudge,backupCard,niceDate,meter,count,empty},version:'workspace-r2.2'};
EVReportViewer.enhanceLegacy();
go('home');
// Wait for saved-project recovery before following links from the website home page.
Promise.all([window.__evRestorePromise,window.__evProjectIndexReady]).then(async()=>{
 if(window.__evUserAction)return;
 EVProjectStore.renderConflict();
 const requested=location.hash.slice(1);
 if(['projects','profile','planning'].includes(requested))go(requested);
 else if(requested==='workspace')actions.workspace();
 else if(['new','example','showroom','3d-showroom','new-audit'].includes(requested)){
  window.history.replaceState(null,'',location.pathname+location.search);
  await actions[requested==='3d-showroom'?'showroom':requested]();
 }
 else if(requested==='open'){window.history.replaceState(null,'',location.pathname+location.search);go('projects');toast('Choose Open backup to select a project file.');}
 else if(requested.startsWith('project=')){let id;try{id=decodeURIComponent(requested.slice(8));}catch{}if(id){go('projects');await loadProject(id);}}
 else if(route==='home')go('home');
}).catch(()=>{});
})();
