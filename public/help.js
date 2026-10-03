/* Help drawer for the planner: any "?" button or Help button opens the matching guide beside the page,
   with search across every guide and a short tour for first visits. Content comes from guides.js. */
(function(){
'use strict';
const G=()=>window.EVGuides;
const TOUR_KEY='evsp_tour_seen';
let drawer=null,backdrop=null,tour=null,lastFocus=null,current=null;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const QSVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8v.5"/><path d="M12 17.5h.01"/></svg>';

/* Short tips for planner cards, shown above the guide. */
const TIPS={
 'audit':'The site audit checks an existing site against PAS 1899:2022 and the Public Charge Point Regulations 2023. This guide explains the regulations behind the checks; the planner records the audit and does not certify compliance.',
 'overview-plans':'Each photo, PDF page or drawing you add becomes a plan. Markup draws on the plan the overview shows; switch plans here or in Markup.',
 'overview-next':'Next actions are worked out from what the project still needs: details, a plan, a scale, snags to review and the programme dates.',
 'overview-checks':'Record checks show what has been recorded: scale, route lengths, supply, earthing and compliance items. They are not design approval.',
 'overview-site':'The site address, client and contacts appear on the drawings and the pack. Edit them in Project details.',
 'overview-programme':'The Programme page creates the activity list; this card only summarises one that exists.',
 'overview-downloads':'Documents you download from Review & issue are listed here with their revision and date.',
 'overview-backup':'Projects live only in this browser. A backup is a file you keep; the card shows when you last made one.',
 'projects-storage':'Recover missing projects restores saved records that have dropped out of the project list. Nothing is deleted.',
 'lab-evidence':'Each design fact is marked measured, assumed or missing. Record the source, person and date to move it to measured.',
 'lab-compare':'Save the current design as an option, change the drawing, then compare quantities and cost between options.',
 'lab-charging':'A charging-day scenario estimates how a set of cars would share the chargers and the supply over a day.',
 'lab-phases':'Phases let you plan the installation in stages and replay how the site grows.',
 'lab-revisions':'A revision is a snapshot that cannot be changed, kept for the record; the review register is for an independent technical check.',
 'programme-timeline':'Activities are drawn against the working calendar. Weekends and the non-working dates you enter are skipped.',
 'programme-activities':'Each activity has an owner, dates, progress and notes. Add suggestions from markup to start from what is drawn.',
 'programme-calendar':'Non-working dates and programme notes print on the programme PDF.',
 'snags-register':'Numbered snag markers on the plan appear here. Record the finding, who fixes it, the target date and before and after photos.',
 'issue-drawings':'Marked-up plans and the engineer and client packs are built from the drawing and the project record.',
 'issue-schedules':'Schedules and records come from the programme, the snag register and the compliance items.',
 'profile-details':'Your name and company appear on every document. Qualifications are optional on programme and snag reports.',
 'profile-branding':'Your logo keeps its proportions in the report header. Check it on the sample PDF.',
 'markup':'The tool strip, equipment picker, panels and the Technical menu are explained in this guide, and every panel has its own ? buttons.'
};

function build(){
 if(drawer)return;
 backdrop=document.createElement('div');backdrop.className='ev-help-backdrop';backdrop.hidden=true;backdrop.addEventListener('click',close);
 drawer=document.createElement('aside');drawer.id='evHelp';drawer.className='ev-help';drawer.hidden=true;drawer.setAttribute('role','dialog');drawer.setAttribute('aria-label','Help');
 drawer.innerHTML='<div class="ev-help-head"><div class="ev-help-title"><span>Help</span><b id="evHelpTitle">Guides</b></div><button type="button" class="ev-help-icon" id="evHelpBack" aria-label="Back to help search" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button><button type="button" class="ev-help-icon" id="evHelpClose" aria-label="Close help"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>'
  +'<label class="ev-help-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg><input type="search" id="evHelpSearch" placeholder="Search the guides and glossary" aria-label="Search the guides"></label>'
  +'<div class="ev-help-body" id="evHelpBody"></div>'
  +'<div class="ev-help-foot"><button type="button" class="ev-help-link" id="evHelpTour">Show me around</button><a class="ev-help-link" href="Guide Library.dc.html" target="_blank" rel="noopener">Open the guide library ↗</a></div>';
 document.body.appendChild(backdrop);document.body.appendChild(drawer);
 drawer.querySelector('#evHelpClose').addEventListener('click',close);
 drawer.querySelector('#evHelpBack').addEventListener('click',()=>showSearch(''));
 drawer.querySelector('#evHelpTour').addEventListener('click',()=>{close();openTour();});
 const input=drawer.querySelector('#evHelpSearch');
 input.addEventListener('input',()=>showSearch(input.value));
 input.addEventListener('keydown',e=>{if(e.key==='Enter'){const first=drawer.querySelector('[data-help-open]');if(first)first.click();}});
 drawer.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}});
 drawer.addEventListener('click',e=>{const o=e.target.closest('[data-help-open]');if(o){e.preventDefault();open(o.dataset.helpOpen);}});
 const body=drawer.querySelector('#evHelpBody');
 G().enhance(body,{onOpen:open,glossaryHref:'Guide Library.dc.html#glossary'});
}
function show(){build();drawer.hidden=false;backdrop.hidden=false;document.body.classList.add('ev-help-open');}
function close(){if(!drawer||drawer.hidden)return;drawer.hidden=true;backdrop.hidden=true;document.body.classList.remove('ev-help-open');current=null;if(lastFocus&&lastFocus.focus){try{lastFocus.focus({preventScroll:true});}catch(_){}}lastFocus=null;}
function isOpen(){return !!drawer&&!drawer.hidden;}
function resolve(id){const g=G();if(!g)return null;if(g.byId[id])return id;if(g.pageGuide[id])return g.pageGuide[id];return 'planner-first-project';}
function open(id,opts){
 const g=G();if(!g)return;opts=opts||{};
 const resolved=resolve(id);if(!resolved)return;
 if(!isOpen())lastFocus=document.activeElement;
 show();
 const body=drawer.querySelector('#evHelpBody');const title=drawer.querySelector('#evHelpTitle');
 const tipKey=opts.tip||(TIPS[id]?id:null);const tip=tipKey&&TIPS[tipKey]?'<div class="ev-help-tip">'+esc(TIPS[tipKey])+'</div>':'';
 const first=!localStorage_get(TOUR_KEY)&&!opts.noTour?'<div class="ev-help-new"><b>New to the planner?</b><span>A two-minute tour shows where everything is.</span><button type="button" class="ev-help-link" data-help-tour>Show me around</button></div>':'';
 const lv=g.levelOf(g.byId[resolved].level);title.textContent='Level '+lv.n+' · '+lv.label;
 body.innerHTML=first+tip+g.guideHTML(resolved,{compact:true});
 body.scrollTop=0;current=resolved;drawer.querySelector('#evHelpBack').hidden=false;drawer.querySelector('#evHelpSearch').value='';
 const t=body.querySelector('[data-help-tour]');if(t)t.addEventListener('click',()=>{close();openTour();});
 try{g.progress.setLast(resolved);}catch(_){}
 const h=body.querySelector('.g-title');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}
 markSeen();
}
function showSearch(q){
 const g=G();if(!g)return;show();
 const body=drawer.querySelector('#evHelpBody');const title=drawer.querySelector('#evHelpTitle');
 drawer.querySelector('#evHelpBack').hidden=true;title.textContent=q?'Search':'Guides';current=null;
 const ids=q?g.search(q):[];const terms=q?g.glossarySearch(q).slice(0,5):[];
 if(!q){body.innerHTML='<div class="ev-help-levels">'+g.LEVELS.map(l=>'<div class="ev-help-level"><div class="ev-help-level-head"><span class="g-chip-lvl l-'+l.id+'">'+l.n+'</span><b>'+esc(l.label)+'</b><small>'+esc(l.who)+'</small></div>'+g.GUIDES.filter(x=>x.level===l.id).map(x=>'<a href="#g='+x.id+'" data-help-open="'+x.id+'">'+esc(x.title)+'<small>'+x.minutes+' min</small></a>').join('')+'</div>').join('')+'</div>';return;}
 body.innerHTML=(ids.length?'<div class="ev-help-results">'+ids.slice(0,12).map(id=>{const x=g.byId[id];return '<a href="#g='+id+'" data-help-open="'+id+'"><span class="g-chip-lvl l-'+x.level+'">'+g.levelOf(x.level).n+'</span><span><b>'+esc(x.title)+'</b><small>'+esc(x.summary)+'</small></span></a>';}).join('')+'</div>':'<p class="ev-help-none">No guides match "'+esc(q)+'".</p>')
  +(terms.length?'<div class="ev-help-terms"><b>Glossary</b>'+terms.map(([k,v])=>'<div><dt>'+esc(v.t)+'</dt><dd>'+esc(v.d)+'</dd></div>').join('')+'</div>':'');
}
function localStorage_get(k){try{return localStorage.getItem(k);}catch(_){return null;}}
function markSeen(){try{localStorage.setItem(TOUR_KEY,'1');}catch(_){}document.querySelectorAll('[data-ev-help].is-new').forEach(b=>b.classList.remove('is-new'));}

/* ---------- Tour ---------- */
const STEPS=[
 {art:'tour1',t:'Add a plan',d:'Start with a photo, a PDF drawing or a survey ZIP. Each picture becomes a plan you can mark up. Open Markup from the project overview or the stage bar.'},
 {art:'tour2',t:'Set the scale',d:'Drag along something of known length, such as a parking bay (4.8 m), and type it in. From then on every route and bay is measured.'},
 {art:'tour3',t:'Place chargers and routes',d:'Pick chargers, boards and site kit from the equipment picker, draw bays with the Bay tool and cable runs with the route tools. The Checks tab adds up the supply load as you go.'},
 {art:'tour4',t:'Check and issue',d:'Design lab keeps the evidence, Programme and Snags plan and record the work, and Review & issue makes the PDF pack. Download a backup when you finish: projects live only in this browser.'}
];
let step=0;
function openTour(){
 const g=G();if(!g)return;
 if(!tour){tour=document.createElement('div');tour.className='ev-tour';tour.hidden=true;tour.setAttribute('role','dialog');tour.setAttribute('aria-modal','true');tour.setAttribute('aria-label','Planner tour');document.body.appendChild(tour);
  tour.addEventListener('click',e=>{if(e.target===tour||e.target.closest('[data-tour-close]'))return closeTour();const n=e.target.closest('[data-tour-step]');if(n){step=Math.max(0,Math.min(STEPS.length-1,step+Number(n.dataset.tourStep)));renderTour();}});
  tour.addEventListener('keydown',e=>{if(e.key==='Escape')closeTour();if(e.key==='ArrowRight'&&step<STEPS.length-1){step++;renderTour();}if(e.key==='ArrowLeft'&&step>0){step--;renderTour();}});}
 step=0;lastFocus=document.activeElement;tour.hidden=false;document.body.classList.add('ev-help-open');renderTour();markSeen();
}
function renderTour(){
 const s=STEPS[step];const art=(window.EVGuideArt&&window.EVGuideArt[s.art])||'';
 tour.innerHTML='<div class="ev-tour-card"><div class="ev-tour-head"><span>Show me around · '+(step+1)+' of '+STEPS.length+'</span><button type="button" class="ev-help-icon" data-tour-close aria-label="Close the tour"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><div class="ev-tour-art">'+art+'</div><div class="ev-tour-body"><h3>'+esc(s.t)+'</h3><p>'+esc(s.d)+'</p></div><div class="ev-tour-dots">'+STEPS.map((x,i)=>'<i class="'+(i===step?'on':'')+'"></i>').join('')+'</div><div class="ev-tour-foot">'+(step>0?'<button type="button" class="ev-tour-btn" data-tour-step="-1">Back</button>':'<span></span>')+(step<STEPS.length-1?'<button type="button" class="ev-tour-btn primary" data-tour-step="1">Next</button>':'<button type="button" class="ev-tour-btn primary" data-tour-close>Done</button>')+'</div></div>';
 const first=tour.querySelector('.ev-tour-btn.primary');if(first)first.focus({preventScroll:true});
}
function closeTour(){if(!tour||tour.hidden)return;tour.hidden=true;document.body.classList.remove('ev-help-open');if(lastFocus&&lastFocus.focus){try{lastFocus.focus({preventScroll:true});}catch(_){}}lastFocus=null;}

/* ---------- Buttons ---------- */
function q(id,label,tip){return '<button type="button" class="ev-help-q" data-ev-help="'+esc(id)+'"'+(tip?' data-ev-tip="'+esc(tip)+'"':'')+' aria-label="Help: '+esc(label||'about this')+'" title="'+esc(label||'Help')+'">?</button>';}
function button(id,cls){const fresh=!localStorage_get(TOUR_KEY);return '<button type="button" class="'+(cls||'ev-btn')+' ev-help-btn'+(fresh?' is-new':'')+'" data-ev-help="'+esc(id)+'" aria-label="Help and guides">'+QSVG+'<span>Help</span></button>';}

document.addEventListener('click',e=>{
 const b=e.target.closest&&e.target.closest('[data-ev-help]');if(!b)return;
 e.preventDefault();e.stopPropagation();
 open(b.dataset.evHelp,{tip:b.dataset.evTip});
},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&isOpen()&&!(tour&&!tour.hidden))close();});

window.EVHelp={open,close,isOpen,search:showSearch,tour:openTour,q,button,TIPS};
})();
