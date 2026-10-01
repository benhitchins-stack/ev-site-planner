/* Project shell for the existing EV Site Planner engine. No Pod-specific contacts or processes. */
(function(){
'use strict';
const $=id=>document.getElementById(id), h=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={user:'M4 22v-3a8 8 0 0 1 16 0v3M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0',grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',home:'m3 11 9-8 9 8M5 9v12h14V9M9 21v-7h6v7',plan:'M4 3h16v18H4zM8 7h8M8 11h4M8 15h8',pen:'m16 3 5 5-12 12-6 1 1-6ZM13 6l5 5',calendar:'M3 5h18v16H3zM7 2v6M17 2v6M3 10h18M7 14h4M13 18h4',flag:'M5 22V3M5 3h14l-3 5 3 5H5',send:'m3 3 18 9-18 9 3-9ZM6 12h15',file:'M5 3h10l4 4v14H5zM15 3v5h4M9 12h6M9 16h6',plus:'M12 5v14M5 12h14',arrow:'M4 12h16m-6-6 6 6-6 6',download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',book:'M4 4h6l2 2 2-2h6v16h-6l-2 2-2-2H4zM12 6v16',learn:'m2 9 10-5 10 5-10 5ZM6 11v7c4 3 8 3 12 0v-7',cube:'m12 2 9 5v10l-9 5-9-5V7ZM3 7l9 5 9-5M12 12v10',check:'m5 12 4 4L19 6',close:'m6 6 12 12M6 18 18 6',menu:'M4 6h16M4 12h16M4 18h16',folder:'M3 6h6l2 2h10v12H3z',tools:'m14 7 3 3 4-4a6 6 0 0 1-8 8l-7 7-3-3 7-7a6 6 0 0 1 8-8Z',photo:'M3 5h18v14H3zM3 16l6-5 5 4 3-3 4 4M8 8h1',backup:'M4 7h16v14H4zM7 3h10v4M9 12h6',alert:'m12 3 10 18H2ZM12 9v5M12 17v1'};
const icon=(k,cls='')=>'<svg class="'+cls+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(paths[k]||paths.file)+'"/></svg>';
const btn=(t,a,style='',ic='')=>'<button type="button" class="ev-btn '+style+'" data-ev-action="'+a+'">'+(ic?icon(ic):'')+t+'</button>';
const empty=(title,desc,actions='')=>'<div class="ev-empty">'+icon('plan')+'<b>'+title+'</b>'+desc+(actions?'<div class="ev-actions">'+actions+'</div>':'')+'</div>';
const card=(t,body,action='')=>'<section class="ev-card"><div class="ev-card-head"><h2>'+t+'</h2>'+action+'</div><div class="ev-card-body">'+body+'</div></section>';
const niceDate=d=>{const date=new Date(d);return Number.isNaN(+date)?'':date.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});};
const modeName=()=>pack.mode==='domestic'?'Domestic':'Commercial';
const routes=[['overview','Overview','home'],['markup','Markup','pen'],['programme','Programme','calendar'],['snags','Snags','flag'],['issue','Issue','send']];
let route='projects',search='',filter='all',drawerStep=0,returnFocus=null,reviewId=null,saveQueue=Promise.resolve(),saveSequence=0,activeIssue=null,previewToken=0,reviewBusy=false;
let originalProgrammeParent=$('progBackdrop'),programmeNode=originalProgrammeParent.querySelector('.wlc');
const ensure=()=>{if(!pack.workspace||typeof pack.workspace!=='object')pack.workspace={};const w=pack.workspace;w.schema=1;if(!Array.isArray(w.issues))w.issues=[];return w;};
const allItems=()=>pack.photos.flatMap(p=>p.items||[]);
const stats=()=>{const items=allItems();return{plans:pack.photos.length,units:items.filter(i=>i.type==='unit').length,routes:items.filter(i=>i.type==='route'&&i.kind!=='__area').length,snags:snagStats().open};};
const hasWork=()=>hasMeaningfulPackContent(pack)||['contactName','contactRole','contactEmail','contactPhone','scope','notes'].some(k=>String(pack.workspace?.[k]||'').trim());
let projectBusy=false;
async function changeProject(operation){
 if(projectBusy)return false;
 projectBusy=true;app.inert=true;app.setAttribute('aria-busy','true');
 try{return await operation();}
 catch(err){console.error(err);toast('The project could not be opened. Your current work is still available.');return false;}
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
  let ok=false;
  try{await idbSet('proj_'+id,full);await idbSet('autosave',recovery);ok=true;try{localStorage.removeItem(LS_KEY);localStorage.removeItem('evsp_proj_'+id);}catch(_){} }
  catch(_){try{localStorage.setItem('evsp_proj_'+id,JSON.stringify(full));localStorage.setItem(LS_KEY,JSON.stringify(recovery));ok=true;}catch(_){} }
  if(ok){
   const index=projIndex().filter(x=>x.id!==id);index.unshift(summary);saveProjIndex(index.slice(0,100));
   if(serial===saveSequence)savedState('saved','Saved in this browser');
  }else{savedState('error','Save failed · download backup');toast('Browser storage is unavailable or full. Download a project backup to keep your work.');}
  return ok;
 });
 return saveQueue;
}
autosaveNow=function(){return persist();};
const baseAutosave=autosave;
autosave=function(){savedState('pending','Saving…');baseAutosave();};
saveCurrentToProjects=function(){return persist();};
loadProject=function(id){return changeProject(async()=>{
 if(pack.projId===id){go('overview');return true;}
 if(hasWork()&&!await persist()){toast('Download a backup before switching projects.');return false;}
 let data;try{data=await idbGet('proj_'+id);}catch(_){}
 try{const fallback=JSON.parse(localStorage.getItem('evsp_proj_'+id)||'null');if(fallback?.pack&&!fallback.slim&&(!data?.pack||(fallback.ts||0)>(data.ts||0)))data=fallback;}catch(_){}
 if(!data?.pack||data.slim){toast('A full saved copy could not be found. Open your downloaded project backup.');return false;}
 pack=normalisePack(data.pack);pack.projId=id;ensure();imgKeys();history=[];redoStack=[];sel=null;draftRoute=null;draftScale=null;updateUndo();
 pack.photos.forEach(p=>{const im=new Image();im.onload=draw;im.src=p.src;imgCache[p.id]=im;});
 syncSiteChip();syncBrand();applyMode(false);buildRail();sideTab='pack';setSideTab();fitView();draw();await persist();go('overview');return true;
});};

const app=document.createElement('div');app.id='evApp';
app.innerHTML='<aside class="ev-sidebar" id="evSidebar"><a class="ev-brand" href="index.html" data-ev-route="home"><img src="assets/logo-mark.svg" alt=""><span>EV Site Planner<small>PROJECT WORKSPACE</small></span></a><button data-ev-route="home">'+icon('home','ev-nav-icon')+'Home</button><button data-ev-route="projects">'+icon('grid','ev-nav-icon')+'All projects</button><div class="ev-side-divider"></div><nav aria-label="Project sections"><div class="ev-nav-caption">This project</div>'+routes.map(([key,label,ic])=>'<button data-ev-route="'+key+'">'+icon(ic,'ev-nav-icon')+label+'</button>').join('')+'</nav><div class="ev-sidebar-bottom"><button data-ev-route="profile">'+icon('user','ev-nav-icon')+'My profile</button><div class="ev-nav-caption">Resources</div><button data-ev-action="showroom">'+icon('cube','ev-nav-icon')+'3D showroom</button><a class="ev-nav" href="Guide Library.dc.html">'+icon('book','ev-nav-icon')+'Guide library</a><a class="ev-nav" href="Learning Hub.dc.html">'+icon('learn','ev-nav-icon')+'Training courses</a><div class="ev-build">EV SITE PLANNER · R2.2</div></div></aside><div class="ev-main"><div class="ev-top"><button id="evMobileNav" class="ev-icon-btn ev-mobile-toggle" aria-label="Open navigation" aria-expanded="false">'+icon('menu')+'</button><div class="ev-top-title"><small id="evBreadcrumb">Workspace / Projects</small><b id="evProjectTitle">Your projects</b></div><span class="ev-pill" id="evModePill">Commercial</span><span class="ev-save" id="evSaveState" data-state="saved">Stored in this browser</span><button class="ev-btn" data-ev-action="backup" id="evBackupTop">'+icon('download')+'Backup</button><button class="ev-btn" data-ev-action="details" id="evEditTop">Project details</button></div><div id="evContent"><div id="evScreen"></div><section id="evCanvasHost" aria-label="Site markup" hidden></section></div></div>';
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
$('empty').querySelector('h2').textContent='Start with a plan or a photo';$('empty').querySelector('p').textContent='Add your site evidence, then place equipment and draw the routes.';
$('empty').querySelector('.fine').textContent='Drag files onto the canvas · PDF pages can be selected individually';
$('btnNew').onclick=()=>newProject();$('btnProjects').onclick=()=>go('projects');openProjects=()=>go('projects');
openProgramme=()=>go('programme');$('btnProg').onclick=openProgramme;
$('wlcBackdrop').classList.remove('show');
openWelcome=()=>openDetails(0);

function updateChrome(){
 if(!$('evApp'))return;
 $('evProjectTitle').textContent=route==='profile'?'My profile':route==='projects'?'Your projects':(pack.name||'Untitled project');
 $('evBreadcrumb').textContent=route==='profile'?'EV Site Planner / Profile':route==='projects'?'EV Site Planner / Workspace':'Project / '+(routes.find(r=>r[0]===route)?.[1]||route);
 $('evModePill').textContent=modeName();$('evModePill').hidden=['projects','profile'].includes(route);$('evSaveState').hidden=route==='profile';
 $('evEditTop').hidden=['projects','profile'].includes(route);$('evBackupTop').hidden=route==='profile'||(route==='projects'&&!hasWork());
 app.querySelectorAll('[data-ev-route]').forEach(b=>{if(b.dataset.evRoute===route)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 const p=activePhoto();
 strip.innerHTML=icon('plan')+'<select aria-label="Active plan" id="evActivePlan">'+(pack.photos.length?pack.photos.map(p=>'<option value="'+h(p.id)+'" '+(p.id===pack.active?'selected':'')+'>'+h(p.name)+'</option>').join(''):'<option>No plans yet</option>')+'</select>'+btn('Add files','add-files','','plus')+'<span class="ev-plan-meta">'+(p?(p.items.length+' items · '+(p.scale?.pxPerM?'Scale set':'Scale not set')):'Photos · PDF · ZIP')+'</span>';
 $('evActivePlan').onchange=e=>openPlan(e.target.value);
}
const baseRenderSide=renderSide;
renderSide=function(){baseRenderSide();updateChrome();};
function go(next){
 if(!['home','projects','profile',...routes.map(r=>r[0])].includes(next))next='overview';
 if(programmeNode.parentElement!==originalProgrammeParent){originalProgrammeParent.append(programmeNode);programmeNode.classList.remove('ev-programme');programmeNode.setAttribute('role','dialog');programmeNode.setAttribute('aria-modal','true');}
 route=next;app.classList.toggle('ev-is-home',next==='home');document.title=next==='home'?'EV Site Planner · Every site. A clearer plan.':'EV Site Planner · '+(next==='profile'?'My profile':next==='projects'?'Your projects':(pack.name||'Project workspace'));$('evCanvasHost').hidden=next!=='markup';$('evScreen').hidden=next==='markup';$('evSidebar').classList.remove('open');$('evMobileNav').setAttribute('aria-expanded','false');
 $('evTechMenu').hidden=true;updateChrome();
 if(next==='markup'){requestAnimationFrame(()=>{resize();fitView();draw();});return;}
 const page={profile:()=>EVProfile.render(),home:()=>EVHome.render(),projects:projectsPage,overview:overviewPage,programme:programmePage,snags:snagsPage,issue:issuePage}[next];
 $('evScreen').innerHTML='<div class="ev-page">'+page()+'</div>';$('evScreen').scrollTop=0;
 if(next==='projects'){
  $('evSearch').value=search;$('evFilter').value=filter;
  $('evSearch').oninput=e=>{search=e.target.value;renderProjectCards();};$('evFilter').onchange=e=>{filter=e.target.value;renderProjectCards();};renderProjectCards();
 }
 if(next==='programme'&&window.EVDelivery){EVDelivery.mountProgramme();}
 else if(next==='programme'){programmeNode.classList.add('ev-programme');programmeNode.removeAttribute('aria-modal');programmeNode.removeAttribute('role');$('evProgrammeMount').append(programmeNode);renderProg();}
 if(next==='snags'&&window.EVDelivery)EVDelivery.mountSnags();
 const title=$('evScreen').querySelector('h1');if(title){title.tabIndex=-1;title.focus({preventScroll:true});}
}
function heading(title,sub,actions=''){return '<div class="ev-heading"><div><div class="ev-eyebrow">'+(route==='projects'?'EV SITE PLANNER':h(modeName())+' PROJECT')+'</div><h1>'+title+'</h1><p>'+sub+'</p></div><div class="ev-actions">'+actions+'</div></div>';}
const planArt='<svg class="ev-hero-art" viewBox="0 0 260 175" fill="none" aria-hidden="true"><path d="M21 140 90 23l152 49-65 98Z" fill="#224258" stroke="#5e7f95"/><path d="m52 118 113 37M64 96l115 37M77 74l116 37M91 52l114 36M93 138l70-97M137 152l69-95" stroke="#567289"/><path d="m91 120 17-27 48 17 17-27" stroke="#d2eb92" stroke-width="4" stroke-linecap="round" stroke-dasharray="3 7"/><rect x="93" y="75" width="18" height="33" rx="5" fill="#e5edf3"/><rect x="97" y="80" width="10" height="12" rx="2" fill="#548aec"/><path d="M174 48v32" stroke="#9dafbd" stroke-width="7"/><rect x="165" y="27" width="19" height="36" rx="6" fill="#e5edf3"/><rect x="169" y="32" width="11" height="12" rx="2" fill="#548aec"/><circle cx="62" cy="54" r="6" fill="#d2eb92"/></svg>';
function projectsPage(){
 const n=projIndex().length;
 return heading('A clear plan. From the start.','Create a project, mark up the site and bring the right information together for issue.',btn('Open backup','open','','folder')+btn('New project','new','primary','plus'))+
 '<section class="ev-hero"><div><div class="ev-eyebrow">FROM SITE EVIDENCE TO SHARED PLANS</div><h2>One project. Everything in its place.</h2><p>Plans, equipment, routes, programme and snags, connected by one set of project details.</p><div class="ev-actions">'+btn('Start a project','new','lime','plus')+btn('Explore a worked example','example','','arrow')+'</div></div>'+planArt+'</section>'+
 '<div class="ev-filter"><h2 class="ev-section-title" style="margin-right:auto">Your projects <span class="ev-muted">('+n+')</span></h2><input class="ev-input" id="evSearch" aria-label="Search projects" placeholder="Search project, reference or client"><select class="ev-select" id="evFilter" aria-label="Filter project type"><option value="all">All project types</option><option value="commercial">Commercial</option><option value="domestic">Domestic</option></select></div><div id="evProjectCards"></div><p class="ev-small ev-muted" style="margin-top:22px">Projects are saved in this browser. Download a backup to keep a separate copy or continue on another device.</p>';
}
function renderProjectCards(){
 const list=projIndex().filter(x=>(filter==='all'||x.mode===filter)&&[x.name,x.ref,x.cust].join(' ').toLowerCase().includes(search.toLowerCase()));
 $('evProjectCards').innerHTML=list.length?'<div class="ev-projects">'+list.map(x=>'<article class="ev-project"><div class="ev-project-preview">'+(x.thumb?'<img src="'+h(x.thumb)+'" alt="Plan preview">':icon('plan'))+'</div><div class="ev-project-copy"><span class="ev-pill">'+h(x.mode==='domestic'?'Domestic':'Commercial')+'</span><h2>'+h(x.name)+'</h2><p>'+h([x.ref,x.cust].filter(Boolean).join(' · ')||'Project details to complete')+'</p></div><div class="ev-project-foot"><span>'+Number(x.n||0)+' plans · '+h(niceDate(x.date))+'</span><button data-ev-project="'+h(x.id)+'">Open project →</button></div></article>').join('')+'</div>':empty(search||filter!=='all'?'No matching projects':'Your next project starts here',search||filter!=='all'?'Try a different search or project type.':'Create a project or open an existing EV Site Planner backup.',search||filter!=='all'?'':btn('Create project','new','primary','plus'));
}
function overviewPage(){
 const s=stats(),w=ensure(),steps=[
  ['Project details',pack.name&&pack.address,'Add the site, scope and people once.','details','Edit details'],
  ['Plans & markup',s.plans&&s.units,'Place chargers, equipment and routes on site photos or plans.','markup',s.plans?'Continue markup':'Add plans'],
  ['Programme & snags',!!pack.programme?.start,'Set the working programme and record items to put right.','programme','Open programme'],
  ['Review & issue',w.issues.length,'Choose the output and check it before downloading.','issue','Go to issue']];
 const next=!pack.name?'details':!s.plans?'add-files':!s.units?'markup':'plans';
 return heading(h(pack.name||'Project overview'),'A shared record for the site, the drawings and the work ahead.',btn('Edit project','details','','pen'))+
 '<section class="ev-hero"><div><div class="ev-eyebrow">'+(s.plans?'PROJECT IN PROGRESS':'READY WHEN YOU ARE')+'</div><h2>'+(s.plans?'Bring the site into focus.':'Start with the site. Build from there.')+'</h2><p>'+(s.plans?'Continue your markup, keep the programme current and review the plans before sharing.':'Set the project details, then add photos, import drawings or work from a blank scaled plan.')+'</p>'+btn(next==='details'?'Set project details':next==='add-files'?'Add site files':next==='markup'?'Continue markup':'Review marked-up plans',next,'lime','arrow')+'</div>'+planArt+'</section>'+
 '<div class="ev-stats">'+[['Plans',s.plans,'Source photos & drawings'],['Charger symbols',s.units,'Across all plans'],['Routes',s.routes,'Cable & site routes'],['Open snags',s.snags,s.snags?'Items to put right':'No open items recorded']].map(([t,n,d])=>'<div class="ev-stat"><label>'+t+'</label><b>'+n+'</b><small>'+d+'</small></div>').join('')+'</div>'+
 '<div class="ev-columns"><div>'+card('Project workflow','<div class="ev-steps">'+steps.map(([t,done,d,a,l],i)=>'<div class="ev-step '+(done?'done':'')+'"><div class="ev-step-num">'+(done?'✓':i+1)+'</div><div class="ev-step-copy"><h3>'+t+'</h3><p>'+d+'</p></div>'+btn(l,a)+'</div>').join('')+'</div>')+
 card('Plans & site evidence',s.plans?'<div class="ev-thumbs">'+pack.photos.slice(0,6).map(p=>'<button class="ev-thumb" data-ev-plan="'+h(p.id)+'"><img src="'+h(p.thumb||p.src)+'" alt="'+h(p.name)+'"><span>'+h(p.name)+'</span></button>').join('')+'</div>':empty('No site files yet','Add site photos, PDF drawings or a survey ZIP.',btn('Add files','add-files','','plus')),btn('Open markup','markup','quiet'))+'</div><div>'+
 card('Project details','<dl class="ev-kv">'+[['Reference',pack.jobRef],['Type',modeName()],['Client',pack.custName],['Project lead',pack.surveyedBy],['Site contact',[w.contactName,w.contactPhone,w.contactEmail].filter(Boolean).join('\n')],['Site address',[pack.address,pack.postcode].filter(Boolean).join('\n')],['Scope',pack.notes]].map(([t,v])=>'<dt>'+t+'</dt><dd>'+(v?h(v):'<span class="ev-muted">Not recorded</span>')+'</dd>').join('')+'</dl>',btn('Edit','details','quiet'))+
 card('Keep a project backup','<p class="ev-small ev-muted" style="margin-bottom:15px">'+(w.backupAt?'Last backup download: '+h(niceDate(w.backupAt))+'.':'No backup downloaded from this build yet.')+' Browser storage stays on this device.</p>'+btn('Download backup','backup','','download'))+
 card('Recent downloads',w.issues.length?'<div class="ev-small">'+w.issues.slice(-3).reverse().map(i=>'<p style="margin-bottom:12px"><b>'+h(i.label)+'</b><br><span class="ev-muted">'+h(niceDate(i.at))+' · Rev '+h(i.rev)+'</span></p>').join('')+'</div>':'<p class="ev-small ev-muted">Document downloads will appear here. Downloading does not mean they have been sent or approved.</p>')+'</div></div>';
}
function programmePage(){return heading('Project programme','Plan the activities, agree responsibilities and track progress through to handover.',btn('Open markup','markup','','pen'))+'<div id="evProgrammeMount"></div>';}
function snagsPage(){if(window.EVDelivery)return heading('Snag register','Record the finding, owner and evidence together, with each item linked to its place on the plan.',btn('Review snag report','snag-report','','file')+btn('Add a snag on the plan','add-snag','primary','plus'))+'<div id="evSnagMount"></div>';const rows=snagList();return heading('Snag register','Findings are linked to their location on the plan. Open an item to add details and before or after photos.',btn('Add a snag on the plan','add-snag','primary','plus'))+
 '<div class="ev-stats">'+[['Total findings',rows.length],['Open',rows.filter(x=>x.it.st!=='fixed').length],['Fixed',rows.filter(x=>x.it.st==='fixed').length],['Safety items open',rows.filter(x=>x.it.st!=='fixed'&&x.it.sev==='safety').length]].map(([t,n])=>'<div class="ev-stat"><label>'+t+'</label><b>'+n+'</b></div>').join('')+'</div>'+
 '<section class="ev-card">'+(rows.length?'<div class="ev-table-wrap"><table class="ev-table"><thead><tr><th>Item</th><th>Finding / plan</th><th>Assigned to</th><th>Severity</th><th>Status</th><th></th></tr></thead><tbody>'+rows.map(({it,photo})=>'<tr><td>'+h(it.n||'•')+'</td><td><b>'+h(it.label||'Untitled finding')+'</b><small>'+h(photo.name)+'</small></td><td>'+h(it.who||'Unassigned')+'</td><td>'+h(SNAG_SEVS[it.sev||'minor']?.label||'Minor')+'</td><td><span class="ev-pill '+(it.st==='fixed'?'green':'amber')+'">'+(it.st==='fixed'?'Fixed':'Open')+'</span></td><td><button class="ev-btn" data-ev-snag="'+h(it.id)+'" data-photo-id="'+h(photo.id)+'">Open</button></td></tr>').join('')+'</tbody></table></div>':empty('No snags recorded','Place a numbered snag marker on a plan, then record the finding and who will put it right.',btn('Open markup','markup','','pen')))+'</section>';
}
function issuePage(){const w=ensure(),plans=pack.photos.length;return heading('Review & issue','Choose the document, check the content and download a copy for the project team.',btn('Project backup','backup','','download'))+
 (!plans?'<div class="ev-notice">Add a site plan or photo in Markup before creating a drawing pack.</div>':'')+
 '<div class="ev-outs">'+[
  ['plan','Marked-up plans','Choose the plans and photos, inspect the markup and download one PDF.','plans','Select & preview'],
  ['file','Engineer pack','Review the technical project record and marked-up plans together.','engineer','Review engineer pack'],
  ['send','Client pack','Review the customer wording, selected plans and the accompanying email.','client','Review client pack'],
  ['calendar','Programme','Check activities, responsibilities, dates and progress before downloading.','programme-report','Review programme'],
  ['flag','Snag report','Review findings, owners, target dates and before / after evidence.','snag-report','Review snag report'],
  ['grid','Materials & schedules','Use the markup quantities to prepare a materials list and cable schedule.','materials','Review materials'],
  ['photo','Current plan image','Download the current annotated plan as a PNG image.','png','Download image']
 ].map(([ic,t,d,a,l])=>'<article class="ev-out">'+icon(ic)+'<h2>'+t+'</h2><p>'+d+'</p>'+btn(l,a,a==='plans'?'primary':'')+'</article>').join('')+'</div>'+
 '<section class="ev-card"><div class="ev-card-head"><h2>Document download history</h2><span class="ev-note-count">Recorded from this build onwards</span></div>'+(w.issues.length?'<div class="ev-table-wrap"><table class="ev-table"><thead><tr><th>Document</th><th>Revision</th><th>Downloaded</th><th>Filename</th></tr></thead><tbody>'+w.issues.slice().reverse().map(i=>'<tr><td>'+h(i.label)+'</td><td>'+h(i.rev)+'</td><td>'+h(niceDate(i.at))+'</td><td>'+h(i.file)+'</td></tr>').join('')+'</tbody></table></div>':empty('No documents downloaded yet','Previewing a document does not add it to this history.'))+'</section>';
}

async function newProject(example=false){return changeProject(async()=>{
 if(hasWork()&&!await persist()){toast('Download a backup before starting a new project.');return;}
 await window.EVProfile?.ready;clearTimeout(saveT);saveT=null;pack=newPack();if(!example)window.EVProfile?.apply(pack);pack.projId=uid();ensure();history=[];redoStack=[];sel=null;draftRoute=null;draftScale=null;imgKeys();updateUndo();syncSiteChip();syncBrand();applyMode(false);buildRail();sideTab='pack';packSec='capture';setSideTab();draw();
 if(example){pack.name='Riverside Business Park · example';pack.jobRef='EXAMPLE-001';pack.custName='Example client';pack.address='Fictional site for exploring the planner';pack.notes='Example layout: four EV bays, two twin chargers, a feeder pillar and a proposed cable route. Replace all assumptions with the site survey before use.';syncSiteChip();buildStarter('compact');allItems().filter(i=>i.type==='route').forEach((i,n)=>{if(n)i.labelT=.12;});draw();await persist();go('overview');}
 else{await idbDel('autosave').catch(()=>{});try{localStorage.removeItem(LS_KEY);}catch(_){}go('overview');openDetails(0);}
});}
function openPlan(id){pack.active=id;sel=null;sideTab='pack';packSec='capture';setSideTab();go('markup');fitView();draw();autosave();}
function panel(section){go('markup');sideTab='pack';packSec=section;setSideTab();$('side').classList.add('open');}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function slug(v){return String(v||'EV-project').replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,100);}
function backup(){normalisePack(pack);ensure().backupAt=new Date().toISOString();downloadBlob(new Blob([JSON.stringify(serialisablePack())],{type:'application/json'}),slug(pack.name)+'.evplan.json');autosave();toast('Project backup downloaded');if(route==='overview')go('overview');}
$('btnSave').onclick=backup;
function setInert(on){app.inert=on;}
function focusTrap(e,root,close){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}if(e.key==='Tab'){const a=[...root.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea,select,a[href]')].filter(x=>x.getClientRects().length);if(!a.length)return;const first=a[0],last=a.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}
function field(label,key,type='text',wide=false,help=''){const value=key.startsWith('workspace.')?ensure()[key.split('.')[1]]:pack[key];return '<label class="ev-field '+(wide?'wide':'')+'">'+label+(type==='textarea'?'<textarea data-ev-field="'+key+'">'+h(value)+'</textarea>':'<input type="'+type+'" data-ev-field="'+key+'" value="'+h(value)+'">')+(help?'<small>'+help+'</small>':'')+'</label>';}
function renderDetails(){
 const body=drawerStep===0?'<div class="ev-form">'+field('Project / site name','name','text',true)+field('Project reference','jobRef')+field('Postcode','postcode')+field('Site address','address','textarea',true)+'</div>':drawerStep===1?'<div class="ev-form"><div class="ev-mode-options">'+['domestic','commercial'].map(m=>'<button type="button" class="'+(pack.mode===m?'on':'')+'" data-ev-mode="'+m+'">'+(m==='domestic'?'Domestic':'Commercial')+'<small>'+(m==='domestic'?'Home charging, driveways and garages.':'Workplace, fleet and destination charging.')+'</small></button>').join('')+'</div>'+field('Scope & site notes','notes','textarea',true,'These notes are shared with the project record and engineer pack.')+field('Drawing revision','rev')+field('Survey date','surveyDate','date')+'</div>':'<div class="ev-form">'+field('Client / organisation','custName','text',true)+field('Project lead / surveyor','surveyedBy','text',true)+field('Site contact','workspace.contactName')+field('Contact phone','workspace.contactPhone','tel')+field('Contact email','workspace.contactEmail','email',true)+'</div>';
 $('evDetails').innerHTML='<div class="ev-dialog" role="dialog" aria-modal="true" aria-labelledby="evDetailsTitle"><div class="ev-dialog-head"><div><h2 id="evDetailsTitle">Project details</h2><p>One project record, shared across the workspace.</p></div><button class="ev-icon-btn" data-ev-close-details aria-label="Close project details">'+icon('close')+'</button></div><div class="ev-dialog-steps">'+['1 · Site','2 · Scope','3 · People'].map((t,i)=>'<button class="'+(drawerStep===i?'on':'')+'" data-ev-step="'+i+'">'+t+'</button>').join('')+'</div><div class="ev-dialog-body">'+body+'</div><div class="ev-dialog-foot">'+(drawerStep?'<button class="ev-btn" data-ev-step="'+(drawerStep-1)+'">Back</button>':'<span class="ev-note-count">Changes save as you type.</span>')+(drawerStep<2?'<button class="ev-btn primary" data-ev-step="'+(drawerStep+1)+'">Next '+icon('arrow')+'</button>':'<button class="ev-btn primary" data-ev-close-details>Done '+icon('check')+'</button>')+'</div></div>';
 $('evDetails').querySelector('input,textarea')?.focus();
}
function openDetails(step=0){returnFocus=document.activeElement;drawerStep=step;setInert(true);$('evDetails').hidden=false;renderDetails();}
function closeDetails(){ $('evDetails').hidden=true;setInert(false);syncSiteChip();applyMode(false);buildRail();renderSide();autosave();go(route);returnFocus?.isConnected&&returnFocus.focus();}
const details=document.createElement('div');details.id='evDetails';details.className='ev-backdrop';details.hidden=true;document.body.append(details);
details.addEventListener('keydown',e=>focusTrap(e,details,closeDetails));
details.addEventListener('input',e=>{const key=e.target.dataset.evField;if(!key)return;if(key.startsWith('workspace.'))ensure()[key.split('.')[1]]=e.target.value;else pack[key]=e.target.value;if(key==='name')$('packname').value=pack.name;syncSiteChip();autosave();});
details.addEventListener('click',e=>{if(e.target===details||e.target.closest('[data-ev-close-details]'))return closeDetails();const st=e.target.closest('[data-ev-step]');if(st){drawerStep=Number(st.dataset.evStep);renderDetails();}const m=e.target.closest('[data-ev-mode]');if(m){pushHist();setMode(m.dataset.evMode);renderDetails();}});

// Plan review is deliberately separate from the technical and customer pack generators.
const review=document.createElement('div');review.id='evReview';review.className='ev-backdrop';review.hidden=true;document.body.append(review);
function chosenPlans(){return pack.photos.filter(p=>p.includeInPdf!==false);}
async function previewPlan(id){reviewId=id;const token=++previewToken;const p=photoById(id);if(!p)return;$('evPlanPreview').textContent='Preparing plan preview…';try{await window.EVDelivery?.preparePlan(p);const canvas=await renderPhotoToCanvas(p,1500);if(token!==previewToken||review.hidden)return;const im=new Image();im.alt=p.name+' · marked-up preview';im.src=canvas.toDataURL('image/png');$('evPlanPreview').replaceChildren(im);review.querySelectorAll('[data-ev-review-label]').forEach(el=>el.classList.toggle('on',el.dataset.evReviewLabel===id));}catch(_){if(token===previewToken)$('evPlanPreview').textContent='This plan could not be rendered. Open it in Markup and check the source image.';}}
function reviewCounts(){const n=chosenPlans().length;$('evPlanCount').textContent=n+' of '+pack.photos.length+' plans selected';$('evDownloadPlans').disabled=!n;}
function openPlanReview(){if(!pack.photos.length){go('markup');toast('Add a site plan or photo first.');return;}returnFocus=document.activeElement;setInert(true);review.hidden=false;review.innerHTML='<div class="ev-dialog ev-review-dialog" role="dialog" aria-modal="true" aria-labelledby="evReviewTitle"><div class="ev-dialog-head"><div><h2 id="evReviewTitle">Review marked-up plans</h2><p>'+h(pack.name||'Untitled project')+' · Rev '+h(pack.rev||'A')+' · Click a plan name to preview it.</p></div><div class="ev-actions"><button class="ev-icon-btn" id="evExpandReview" aria-label="Expand review">'+icon('grid')+'</button><button class="ev-icon-btn" data-ev-close-review aria-label="Close review">'+icon('close')+'</button></div></div><div class="ev-review-grid"><div class="ev-review-list"><div class="ev-actions"><button class="ev-btn quiet" id="evSelectAll">Select all</button><button class="ev-btn quiet" id="evSelectNone">Clear selection</button></div>'+pack.photos.map(p=>'<label data-ev-review-label="'+h(p.id)+'"><input aria-label="Include '+h(p.name)+'" type="checkbox" data-ev-include="'+h(p.id)+'" '+(p.includeInPdf!==false?'checked':'')+'><button type="button" data-ev-preview="'+h(p.id)+'">'+h(p.name)+'</button></label>').join('')+'</div><div class="ev-review-preview" id="evPlanPreview"></div></div><div class="ev-dialog-foot"><span class="ev-note-count" id="evPlanCount"></span><div class="ev-actions"><button class="ev-btn" data-ev-close-review>Back</button><button class="ev-btn primary" id="evDownloadPlans">'+icon('download')+'Download PDF</button></div></div></div>';
 $('evSelectAll').onclick=()=>selectPlans(true);$('evSelectNone').onclick=()=>selectPlans(false);$('evExpandReview').onclick=()=>{const d=review.querySelector('.ev-dialog');const max=d.dataset.expanded!=='1';d.dataset.expanded=max?'1':'0';d.style.width=max?'98vw':'';d.style.height=max?'94vh':'';};$('evDownloadPlans').onclick=exportPlans;reviewCounts();previewPlan(pack.active||pack.photos[0].id);review.querySelector('button').focus();}
function selectPlans(value){pack.photos.forEach(p=>p.includeInPdf=value);review.querySelectorAll('[data-ev-include]').forEach(e=>e.checked=value);reviewCounts();autosave();}
function closePlanReview(){if(reviewBusy)return;previewToken++;review.hidden=true;setInert(false);autosave();returnFocus?.isConnected&&returnFocus.focus();if(route==='issue')go('issue');}
review.addEventListener('keydown',e=>focusTrap(e,review,closePlanReview));review.addEventListener('change',e=>{if(e.target.dataset.evInclude){photoById(e.target.dataset.evInclude).includeInPdf=e.target.checked;reviewCounts();autosave();}});review.addEventListener('click',e=>{if(e.target===review||e.target.closest('[data-ev-close-review]'))return closePlanReview();const b=e.target.closest('[data-ev-preview]');if(b){e.preventDefault();previewPlan(b.dataset.evPreview);}});
function logIssue(label,file){ensure().issues.push({label,file:String(file),at:new Date().toISOString(),rev:pack.rev||'A'});ensure().issues=ensure().issues.slice(-100);autosave();}
async function exportPlans(){
 const selected=chosenPlans();if(!selected.length)return;
 const b=$('evDownloadPlans');reviewBusy=true;b.disabled=true;b.textContent='Preparing PDF…';review.querySelectorAll('[data-ev-close-review]').forEach(e=>e.disabled=true);
 try{const doc=new window.jspdf.jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true});window.EVDelivery?.installFonts(doc);
  for(let i=0;i<selected.length;i++){const p=selected[i];if(i)doc.addPage();await window.EVDelivery?.preparePlan(p);const canvas=await renderPhotoToCanvas(p,2000);doc.setFillColor(255,255,255);doc.rect(0,0,297,210,'F');doc.setTextColor(23,43,59);doc.setFont(window.EVDelivery?'EVSans':'helvetica','bold');doc.setFontSize(14);doc.text(doc.splitTextToSize(pack.name||'EV Site Planner',194)[0],12,14);doc.setFontSize(9);doc.setFont(window.EVDelivery?'EVSans':'helvetica','normal');doc.text(doc.splitTextToSize(p.name||'Site plan',194)[0],12,22);if(pack.brandName){doc.setFontSize(8);doc.text(doc.splitTextToSize(pack.brandName,pack.brandLogo?37:73).slice(0,2),212,12);}window.EVProfile?.drawLogo(doc,pack.brandLogo,254,8,31,16);const ratio=Math.min(273/canvas.width,163/canvas.height);const w=canvas.width*ratio,ht=canvas.height*ratio;doc.addImage(canvas,'PNG',(297-w)/2,29+(163-ht)/2,w,ht,undefined,'FAST');doc.setDrawColor(222,230,237);doc.line(12,196,285,196);doc.setTextColor(106,120,132);doc.setFontSize(8);doc.text(doc.splitTextToSize([pack.brandName||'EV Site Planner',pack.surveyedBy,'Rev '+(pack.rev||'A'),new Date().toLocaleDateString('en-GB')].filter(Boolean).join(' · '),247)[0],12,202);doc.text((i+1)+' / '+selected.length,285,202,{align:'right'});}
  activeIssue='Marked-up plans';await doc.save(slug(pack.name)+'_plans_rev-'+slug(pack.rev||'A')+'.pdf',{returnPromise:true});toast('Marked-up plans PDF downloaded');
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
function WorkspacePDF(...args){const doc=new BasePDF(...args);const save=doc.save;doc.save=function(file,opts){const label=doc.__evIssueLabel||activeIssue||(/snag/i.test(file)?'Snag report':/programme/i.test(file)?'Programme':/customer|client/i.test(file)?'Client pack':/summary/i.test(file)?'Summary pack':/calc/i.test(file)?'Cable calculations':'Engineer / technical pack');activeIssue=null;const result=save.call(this,file,opts);if(result&&typeof result.then==='function')return result.then(x=>{logIssue(label,file);return x;});logIssue(label,file);return result;};return doc;}
Object.assign(WorkspacePDF,BasePDF);WorkspacePDF.prototype=BasePDF.prototype;window.jspdf.jsPDF=WorkspacePDF;
const baseOpenReview=openReview;
openReview=function(mode){activeIssue=null;baseOpenReview(mode);const button=$('rxExport'),original=button.onclick;button.onclick=async(...args)=>{activeIssue=mode==='customer'?'Client pack':'Engineer pack';return original.apply(button,args);};};

const actions={
 'workspace':()=>go(hasWork()?'overview':'projects'),
 'new':()=>newProject(),'example':()=>newProject(true),'open':()=>{if(!projectBusy)$('fileOpen').click();},'details':()=>openDetails(),'backup':backup,'markup':()=>go('markup'),'programme':()=>go('programme'),'issue':()=>go('issue'),'showroom':()=>window.openCharger3D?.(),
 'add-files':()=>{go('markup');$('filePhoto').click();},'add-snag':()=>{if(!pack.photos.length){go('markup');toast('Add a plan or photo, then place a snag marker.');return;}go('markup');setTool('mark:snag');},
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
$('evMobileNav').onclick=()=>{const on=$('evSidebar').classList.toggle('open');$('evMobileNav').setAttribute('aria-expanded',String(on));};
$('evTechnical').onclick=()=>{const menu=$('evTechMenu'),b=$('evTechnical'),r=b.getBoundingClientRect();menu.hidden=!menu.hidden;b.setAttribute('aria-expanded',String(!menu.hidden));menu.style.left=Math.max(8,Math.min(r.left,innerWidth-268))+'px';menu.style.top=r.bottom+8+'px';if(!menu.hidden)menu.querySelector('button').focus();};
document.addEventListener('click',e=>{if(!tech.contains(e.target)){$('evTechMenu').hidden=true;$('evTechnical').setAttribute('aria-expanded','false');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('evTechMenu').hidden=true;$('evTechnical').setAttribute('aria-expanded','false');$('evSidebar').classList.remove('open');$('evMobileNav').setAttribute('aria-expanded','false');}});
const importObserver=new MutationObserver(()=>{updateChrome();});importObserver.observe($('scName'),{childList:true,subtree:true});
async function importBackup(file){return changeProject(async()=>{
 let incoming;
 try{incoming=JSON.parse(await file.text());if(!incoming||!Array.isArray(incoming.photos))throw Error('Invalid backup');incoming=normalisePack(incoming);}
 catch(_){toast("That doesn't look like an EV Site Planner backup. Your current project has been kept.");return false;}
 if(hasWork()&&!await persist()){toast('Download a backup before opening another project.');return false;}
 // Imports get a separate project record so an older backup cannot overwrite current work.
 clearTimeout(saveT);saveT=null;incoming.projId=uid();pack=incoming;ensure();imgKeys();history=[];redoStack=[];sel=null;selSet.clear();draftRoute=null;draftScale=null;updateUndo();
 pack.photos.forEach(p=>{const im=new Image();im.onload=draw;im.src=p.src;imgCache[p.id]=im;});
 syncSiteChip();syncBrand();applyMode(false);buildRail();sideTab='pack';packSec='capture';setSideTab();fitView();draw();await persist();go('overview');toast('Project backup opened as a separate copy');return true;
});}
window.EVWorkspace={go,persist,openDetails,openPlanReview,backup,stats,importBackup,afterImport(){ensure();syncSiteChip();syncBrand();applyMode(false);buildRail();persist();go('overview');},route:()=>route,refresh:()=>go(route),logIssue,version:'workspace-r2.2'};
// Review windows inherit the larger working area from Build 129.
const maxButton=document.createElement('button');maxButton.type='button';maxButton.className='pe-close ev-maximise';maxButton.title='Expand review window';maxButton.setAttribute('aria-label',maxButton.title);maxButton.innerHTML=icon('grid');maxButton.onclick=()=>{$('rxBackdrop').querySelector('.rx').classList.toggle('rz-max');};$('rxClose').before(maxButton);
go('home');
// Wait for saved-project recovery before following links from the website home page.
Promise.resolve(window.__evRestorePromise).then(async()=>{
 if(window.__evUserAction)return;
 const requested=location.hash.slice(1);
 if(['projects','profile'].includes(requested))go(requested);
 else if(requested==='workspace')actions.workspace();
 else if(['new','example','showroom','3d-showroom'].includes(requested)){
  window.history.replaceState(null,'',location.pathname+location.search);
  await actions[requested==='3d-showroom'?'showroom':requested]();
 }
 else if(requested==='open'){window.history.replaceState(null,'',location.pathname+location.search);go('projects');toast('Choose Open backup to select a project file.');}
 else if(requested.startsWith('project=')){let id;try{id=decodeURIComponent(requested.slice(8));}catch{}if(id){go('projects');await loadProject(id);}}
 else if(route==='home')go('home');
}).catch(()=>{});
})();
