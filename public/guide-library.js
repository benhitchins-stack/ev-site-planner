/* Guide Library page: levels from Start here to Advanced design, search, topics, saved guides, reading progress,
   level checks, the glossary and useful links. Content comes from guides.js; diagrams from guide-art.js. */
(function(){
'use strict';
const G=window.EVGuides;if(!G)return;
const app=document.getElementById('glApp');if(!app)return;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const state={q:'',level:'all',topic:'all',only:'',focus:null,view:'guides',quiz:{},term:null};
const BASE_TITLE='Guide library · EV Site Planner';
const SVG={search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>',
 back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
 arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
 tick:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>'};

function readHash(){
 const h=location.hash||'';let m;
 state.focus=null;state.view='guides';
 if((m=h.match(/g=([a-z0-9-]+)/i))&&G.byId[m[1].toLowerCase()]){state.focus=m[1].toLowerCase();}
 else if(/^#glossary/i.test(h)){state.view='glossary';const t=h.match(/^#glossary=([a-z0-9]+)/i);state.term=t&&G.GLOSSARY[t[1].toLowerCase()]?t[1].toLowerCase():null;if(state.term)state.q='';}
 else if(/^#links/i.test(h))state.view='links';
 else if((m=h.match(/^#level=([a-z]+)/i))&&G.LEVELS.some(l=>l.id===m[1].toLowerCase())){state.level=m[1].toLowerCase();state.topic='all';state.only='';}
 else if((m=h.match(/^#topic=([a-z]+)/i))&&G.TOPICS.some(t=>t[0]===m[1].toLowerCase())){state.topic=m[1].toLowerCase();state.level='all';state.only='';}
}
function setHash(h){if(('#'+h)!==location.hash){try{history.pushState(null,'','#'+h);}catch(_){location.hash=h;}}}

/* ---------- pieces ---------- */
function visibleIds(){
 let ids=state.q?G.search(state.q):G.GUIDES.map(g=>g.id);
 const p=G.progress.get();
 return ids.filter(id=>{const g=G.byId[id];
  if(state.level!=='all'&&g.level!==state.level)return false;
  if(state.topic!=='all'&&g.topic!==state.topic)return false;
  if(state.only==='saved'&&!p.saved.includes(id))return false;
  if(state.only==='unread'&&p.read[id])return false;
  return true;});
}
function card(id){const g=G.byId[id];const p=G.progress.get();const read=!!p.read[id],saved=p.saved.includes(id);
 return '<a class="gl-card'+(read?' read':'')+'" href="#g='+id+'" data-open="'+id+'"><span class="gl-card-top"><span class="g-kind k-'+g.kind+'">'+G.KINDS[g.kind]+'</span><span class="gl-card-topic">'+esc(G.topicLabel(g.topic))+'</span>'+(saved?'<span class="gl-card-flag" title="Saved for later">★</span>':'')+(read?'<span class="gl-card-flag done" title="Read">'+SVG.tick+'</span>':'')+'</span><b>'+esc(g.title)+'</b><span class="gl-card-sum">'+esc(g.summary)+'</span><span class="gl-card-foot">'+g.minutes+' min read'+(g.art?' · diagram':'')+(g.body.includes('g-calc')?' · calculator':'')+SVG.arrow+'</span></a>';}
function levelHead(l,ids){const c=G.progress.levelCount(l.id);const pct=c.total?Math.round(c.done/c.total*100):0;
 return '<div class="gl-level-head" id="level-'+l.id+'"><div class="gl-level-num l-'+l.id+'">'+l.n+'</div><div class="gl-level-copy"><h2>'+esc(l.label)+'</h2><p>'+esc(l.who)+'</p><p class="gl-level-blurb">'+esc(l.blurb)+'</p></div><div class="gl-level-progress"><b>'+c.done+' of '+c.total+' read</b><span class="gl-bar"><i style="width:'+pct+'%"></i></span></div></div>';}
function quizCard(level){const q=G.QUIZ[level];if(!q)return '';const best=G.progress.quiz(level);const st=state.quiz[level]||{answers:{},done:false};
 const lv=G.levelOf(level);
 if(!st.open)return '<div class="gl-quiz-cta"><div><b>Check what you know: '+esc(lv.label)+'</b><span>'+q.length+' quick questions. '+(best?'Best score '+best+' of '+q.length+'.':'For revision, not a qualification.')+'</span></div><button type="button" class="gl-btn" data-quiz-open="'+level+'">Start the check</button></div>';
 const items=q.map((it,i)=>{const picked=st.answers[i];return '<fieldset class="gl-q'+(st.missing&&st.missing.includes(i+1)&&picked===undefined?' missing':'')+'" data-q-box="'+i+'"><legend>'+(i+1)+'. '+esc(it.q)+'</legend>'+it.a.map((a,j)=>{const cls=st.done?(j===it.c?' right':(picked===j?' wrong':'')):'';return '<label class="gl-q-opt'+cls+'"><input type="radio" name="q-'+level+'-'+i+'" value="'+j+'" '+(picked===j?'checked':'')+(st.done?' disabled':'')+' data-quiz-pick="'+level+'" data-q="'+i+'"><span>'+esc(a)+'</span></label>';}).join('')+(st.done?'<p class="gl-q-why">'+esc(it.why)+'</p>':'')+'</fieldset>';}).join('');
 const score=st.done?q.filter((it,i)=>st.answers[i]===it.c).length:0;
 const msg=st.missing&&st.missing.length?'<p class="gl-quiz-msg" role="alert">Answer '+(st.missing.length===1?'question '+st.missing[0]:'questions '+st.missing.slice(0,-1).join(', ')+' and '+st.missing.at(-1))+' first.</p>':'';
 return '<div class="gl-quiz" id="quiz-'+level+'"><div class="gl-quiz-head"><b>Check what you know: '+esc(lv.label)+'</b>'+(st.done?'<span class="gl-score">'+score+' of '+q.length+'</span>':'')+'</div>'+items+'<div class="g-actions">'+(st.done?'<button type="button" class="g-btn" data-quiz-reset="'+level+'">Try again</button>':'<button type="button" class="g-btn on" data-quiz-check="'+level+'">Check answers</button>')+'<button type="button" class="g-btn" data-quiz-close="'+level+'">Close</button></div>'+msg+'</div>';}
function continueCard(){const p=G.progress.get();if(!p.last||!G.byId[p.last])return '';const g=G.byId[p.last];if(p.read[p.last]){const lvIds=G.GUIDES.filter(x=>x.level===g.level).map(x=>x.id);const next=lvIds.find(id=>!p.read[id]);if(!next)return '';const n=G.byId[next];return '<a class="gl-continue" href="#g='+next+'" data-open="'+next+'"><span>Next up in '+esc(G.levelOf(n.level).label)+'</span><b>'+esc(n.title)+'</b>'+SVG.arrow+'</a>';}
 return '<a class="gl-continue" href="#g='+p.last+'" data-open="'+p.last+'"><span>Continue where you left off</span><b>'+esc(g.title)+'</b>'+SVG.arrow+'</a>';}
function featured(){const picks=[['what-is-charging','Start with the basics'],['survey-basics','What a survey involves'],['prot','Protective devices'],['openpen','Open-PEN options']];
 return '<section class="gl-featured" aria-label="Quick picks"><div class="gl-featured-title">Quick picks</div><div class="gl-featured-grid">'+picks.map(([id,s])=>{const g=G.byId[id];return '<a href="#g='+id+'" data-open="'+id+'"><span class="gl-featured-lvl l-'+g.level+'">'+G.levelOf(g.level).n+'</span><b>'+esc(g.title)+'</b><span>'+esc(s)+'</span></a>';}).join('')+'</div></section>';}

function rail(){
 const p=G.progress.get();const counts=k=>G.GUIDES.filter(g=>k==='all'||g.topic===k).length;
 const lvls=[['all','All guides']].concat(G.LEVELS.map(l=>[l.id,'<span class="gl-pill-n">'+l.n+'</span><span class="gl-pill-sep"> · </span><span>'+esc(l.short)+'</span>']));
 const gloss=state.view==='glossary'&&!state.focus;
 return '<aside class="gl-rail"><div class="gl-rail-top"><label class="gl-search">'+SVG.search+'<input type="search" id="glSearch" placeholder="'+(gloss?'Search terms':'Search guides and terms')+'" value="'+esc(state.q)+'" aria-label="'+(gloss?'Search the glossary':'Search guides')+'"></label>'
 +'<div class="gl-levels" role="group" aria-label="Level">'+lvls.map(([k,l])=>'<button type="button" class="gl-pill'+(state.level===k?' on':'')+'" data-level="'+k+'">'+(k==='all'?esc(l):l)+'</button>').join('')+'</div></div>'
 +'<div class="gl-topics" role="group" aria-label="Topic">'+[['all','All topics']].concat(G.TOPICS).map(([k,l])=>'<button type="button" class="gl-topic'+(state.topic===k?' on':'')+'" data-topic="'+k+'"><span>'+esc(l)+'</span><em>'+counts(k)+'</em></button>').join('')+'</div>'
 +'<div class="gl-only" role="group" aria-label="Show"><button type="button" class="gl-pill'+(state.only==='saved'?' on':'')+'" data-only="saved">★ Saved ('+p.saved.length+')</button><button type="button" class="gl-pill'+(state.only==='unread'?' on':'')+'" data-only="unread">Unread</button></div>'
 +'<div class="gl-progress"><b>Your progress</b>'+G.LEVELS.map(l=>{const c=G.progress.levelCount(l.id);return '<div class="gl-progress-row"><span>'+l.n+' '+esc(l.short)+'</span><span class="gl-bar"><i style="width:'+(c.total?Math.round(c.done/c.total*100):0)+'%"></i></span><em>'+c.done+'/'+c.total+'</em></div>';}).join('')+courseRows()+'<small>Saved in this browser only.</small></div>'
 +'</aside>';
}
/* Training course progress lives in the Learning Hub's own store; read it so one learner sees one picture. */
function courseRows(){let s=null;try{s=JSON.parse(localStorage.getItem('evsp_learn_v1')||'null');}catch(_){}
 const done=(s&&s.done)||{};const rows=[['dom','Domestic',6],['com','Commercial',7]].map(([k,l,n])=>{const d=Array.isArray(done[k])?done[k].slice(0,n).filter(Boolean).length:0;return '<div class="gl-progress-row"><span>'+l+'</span><span class="gl-bar"><i style="width:'+Math.round(d/n*100)+'%"></i></span><em>'+d+'/'+n+'</em></div>';}).join('');
 return '<a class="gl-progress-sub" href="Learning Hub.dc.html">Training courses</a>'+rows;}
function notes(){return '<footer class="gl-foot"><div class="gl-note"><b>Author background.</b> Level 3 qualified installer and commercial project manager, with 18th Edition and SMSTS qualifications and over 10 years of domestic and commercial EV installation experience.</div>'
 +'<div class="gl-note"><b>Reference only.</b> Charger features (load management, connectivity, PEN-fault protection) vary by brand and model. Always confirm against the current edition of BS 7671, the equipment manufacturer\'s installation guide and your DNO\'s requirements. The planner assists site design decisions; it does not certify electrical work.</div></footer>';}
function guidesView(){
 const ids=visibleIds();const filtering=state.q||state.level!=='all'||state.topic!=='all'||state.only;
 let html='';
 if(!filtering)html+=continueCard()+featured();
 if(!ids.length)return html+'<div class="gl-empty"><b>Nothing matches.</b><p>Try another word, or clear the filters.</p><button type="button" class="gl-btn" data-clear>Clear search and filters</button>'+(state.q&&G.glossarySearch(state.q).length?'<p>Glossary terms match: <a href="#glossary" data-nav="glossary">see the glossary</a>.</p>':'')+'</div>';
 G.LEVELS.forEach(l=>{const mine=ids.filter(id=>G.byId[id].level===l.id);if(!mine.length)return;
  html+='<section class="gl-level">'+levelHead(l,mine)+'<div class="gl-grid">'+mine.map(card).join('')+'</div>'+(filtering?'':quizCard(l.id))+'</section>';});
 if(state.q){const terms=G.glossarySearch(state.q);if(terms.length)html+='<section class="gl-level"><div class="gl-level-head"><div class="gl-level-copy"><h2>Glossary matches</h2></div></div><dl class="gl-gloss">'+terms.slice(0,8).map(([k,v])=>'<div><dt>'+esc(v.t)+'</dt><dd>'+esc(v.d)+'</dd></div>').join('')+'</dl></section>';}
 if(filtering)html+='<div class="gl-clear-end"><span>'+ids.length+' of '+G.GUIDES.length+' guides shown.</span><button type="button" class="gl-btn" data-clear>Clear search and filters</button></div>';
 return html;
}
function focusView(id){const g=G.byId[id];const lvIds=G.GUIDES.filter(x=>x.level===g.level).map(x=>x.id);const i=lvIds.indexOf(id);const prev=lvIds[i-1],next=lvIds[i+1];
 return '<div class="gl-focus"><button type="button" class="gl-back" data-back>'+SVG.back+' All guides</button>'+G.guideHTML(id)+'<div class="gl-prevnext">'+(prev?'<a href="#g='+prev+'" data-open="'+prev+'">'+SVG.back+'<span><small>Previous</small>'+esc(G.byId[prev].title)+'</span></a>':'<span></span>')+(next?'<a href="#g='+next+'" data-open="'+next+'" class="next"><span><small>Next</small>'+esc(G.byId[next].title)+'</span>'+SVG.arrow+'</a>':'')+'</div></div>';}
function glossaryView(){const terms=G.glossarySearch(state.q);
 const first={};terms.forEach(([k,v])=>{const c=v.t[0].toUpperCase();if(!first[c])first[c]=k;});
 const az=terms.length?'<nav class="gl-az" aria-label="Jump to a letter">'+'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(c=>first[c]?'<a href="#glossary='+first[c]+'" data-az="'+first[c]+'">'+c+'</a>':'<span aria-hidden="true">'+c+'</span>').join('')+'</nav>':'';
 return '<section class="gl-level" aria-label="Glossary">'+az+(terms.length?'<dl class="gl-gloss">'+terms.map(([k,v])=>'<div id="term-'+k+'"'+(state.term===k?' class="is-target" tabindex="-1"':'')+'><dt>'+esc(v.t)+'</dt><dd>'+esc(v.d)+'</dd></div>').join('')+'</dl>':'<div class="gl-empty"><b>No terms match.</b><p>Try another word, or clear the search.</p><button type="button" class="gl-btn" data-clear>Clear the search</button></div>')+'</section>';}
function linksView(){return '<section class="gl-level" id="links"><div class="gl-level-head"><div class="gl-level-copy"><h2>Useful links</h2><p>Official sources behind the guides. External links open in a new tab.</p></div></div><div class="gl-links er-guide-links">'+G.LINKS.map(l=>'<a href="'+esc(l.h)+'" target="_blank" rel="noopener"><b>'+esc(l.t)+' ↗</b><span>'+esc(l.d)+'</span><small>'+esc(l.s)+'</small></a>').join('')+'</div></section>';}

function render(){
 const view=state.focus?'focus':state.view;
 const intro=view==='focus'?'':view==='glossary'?'<div class="er-intro er-guide-intro"><h1>Glossary</h1><p>Plain definitions of the terms used in the guides and the planner. Tap any highlighted term inside a guide to see it in place.</p></div>':'<div class="er-intro er-guide-intro"><h1>EV installation guides</h1><p>From plain-English basics to advanced design notes for experienced electricians, with diagrams, calculators and a glossary. Pick a level, a topic, or search.</p></div>';
 const main=view==='focus'?focusView(state.focus):view==='glossary'?glossaryView():view==='links'?linksView():guidesView();
 app.innerHTML=intro+'<div class="gl-layout is-'+view+'">'+rail()+'<main class="gl-main" id="glMain">'+main+'</main></div>'+notes();
 syncTop();
 document.querySelectorAll('[data-gl-nav]').forEach(a=>a.classList.toggle('on',(state.focus?'guides':state.view)===a.dataset.glNav));
 document.title=state.focus?G.byId[state.focus].title+' · '+BASE_TITLE:state.view==='glossary'?'Glossary · '+BASE_TITLE:BASE_TITLE;
 G.enhance(document.getElementById('glMain'),{onOpen:open,glossaryHref:'#glossary',onProgress:()=>{const rail=app.querySelector('.gl-rail');if(rail)rail.outerHTML=rail&&railHTMLKeepingSearch();},onPrint:()=>window.print()});
 const s=document.getElementById('glSearch');if(s&&state.searchFocus){s.focus();s.setSelectionRange(s.value.length,s.value.length);state.searchFocus=false;}
 if(view==='glossary'&&state.term){const t=document.getElementById('term-'+state.term);state.term=null;if(t){scrollToEl(t);t.focus({preventScroll:true});}}
}
/* Sticky header (wider screens) and the sticky search strip (phones and tablets) cover the top of the window; scroll targets clear them. */
function syncTop(){const hd=document.querySelector('.er-header');app.style.setProperty('--gl-top',(hd&&getComputedStyle(hd).position==='sticky'?hd.offsetHeight:0)+'px');}
function stuck(){let b=0;const hd=document.querySelector('.er-header');if(hd&&getComputedStyle(hd).position==='sticky')b=hd.offsetHeight;
 for(const el of app.querySelectorAll('.gl-rail-top,.gl-az')){const cs=getComputedStyle(el);if(cs.position==='sticky'&&el.offsetParent)b=Math.max(b,(parseFloat(cs.top)||0)+el.offsetHeight);}return b;}
function scrollToEl(el){const off=stuck()+10;window.scrollTo({top:Math.max(0,scrollY+el.getBoundingClientRect().top-off)});}
/* After a filter changes, bring the start of the list into view if it is hidden under the strip or far down the page. */
function revealMain(){const m=document.getElementById('glMain');if(!m)return;const off=stuck()+10,top=m.getBoundingClientRect().top;if(top<off||top>innerHeight*.55)scrollToEl(m);}
function railHTMLKeepingSearch(){return rail();}
function open(id){if(!G.byId[id])return;state.focus=id;G.progress.setLast(id);setHash('g='+id);render();window.scrollTo({top:0});const t=app.querySelector('.g-title');if(t){t.tabIndex=-1;t.focus({preventScroll:true});}}
function backToAll(){state.focus=null;state.view='guides';setHash('all');render();}

/* ---------- events ---------- */
app.addEventListener('click',e=>{
 const t=e.target;
 const o=t.closest('[data-open]');if(o){e.preventDefault();open(o.dataset.open);return;}
 if(t.closest('[data-back]')){backToAll();return;}
 if(t.closest('[data-clear]')){state.q='';if(state.view!=='glossary'){state.level='all';state.topic='all';state.only='';}render();revealMain();return;}
 const az=t.closest('[data-az]');if(az){e.preventDefault();const el=document.getElementById('term-'+az.dataset.az);if(el){scrollToEl(el);el.tabIndex=-1;el.focus({preventScroll:true});}return;}
 const lv=t.closest('[data-level]');if(lv){state.level=lv.dataset.level;state.focus=null;state.view='guides';setHash(lv.dataset.level==='all'?'all':'level='+lv.dataset.level);render();revealMain();return;}
 const tp=t.closest('[data-topic]');if(tp){state.topic=tp.dataset.topic;state.focus=null;state.view='guides';setHash(tp.dataset.topic==='all'?'all':'topic='+tp.dataset.topic);render();revealMain();return;}
 const on=t.closest('[data-only]');if(on){state.only=state.only===on.dataset.only?'':on.dataset.only;state.focus=null;state.view='guides';render();revealMain();return;}
 const nav=t.closest('[data-nav]');if(nav){e.preventDefault();state.view=nav.dataset.nav;state.focus=null;setHash(nav.dataset.nav);render();return;}
 const qo=t.closest('[data-quiz-open]');if(qo){state.quiz[qo.dataset.quizOpen]={open:true,answers:{},done:false};render();const z=document.getElementById('quiz-'+qo.dataset.quizOpen);if(z)scrollToEl(z);return;}
 const qc=t.closest('[data-quiz-check]');if(qc){const l=qc.dataset.quizCheck,st=state.quiz[l];const q=G.QUIZ[l];
  st.missing=q.map((_,i)=>i).filter(i=>st.answers[i]===undefined).map(i=>i+1);
  if(st.missing.length){render();app.querySelector('[data-quiz-check="'+l+'"]')?.focus({preventScroll:true});return;}
  st.done=true;G.progress.quiz(l,q.filter((it,i)=>st.answers[i]===it.c).length);render();const z=document.getElementById('quiz-'+l);if(z)scrollToEl(z);return;}
 const qr=t.closest('[data-quiz-reset]');if(qr){state.quiz[qr.dataset.quizReset]={open:true,answers:{},done:false};render();const z=document.getElementById('quiz-'+qr.dataset.quizReset);if(z)scrollToEl(z);return;}
 const qx=t.closest('[data-quiz-close]');if(qx){delete state.quiz[qx.dataset.quizClose];render();return;}
});
app.addEventListener('change',e=>{const r=e.target.closest&&e.target.closest('[data-quiz-pick]');if(r){const st=state.quiz[r.dataset.quizPick];if(st){st.answers[r.dataset.q]=Number(r.value);r.closest('.gl-q')?.classList.remove('missing');}}});
app.addEventListener('input',e=>{if(e.target.id==='glSearch'){state.q=e.target.value;state.focus=null;if(state.view==='links')state.view='guides';state.searchFocus=true;render();}});
document.querySelectorAll('[data-gl-nav]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();state.focus=null;state.view=a.dataset.glNav;if(a.dataset.glNav==='guides'){state.level='all';state.topic='all';state.only='';}setHash(a.dataset.glNav==='guides'?'all':a.dataset.glNav);render();window.scrollTo({top:0});}));
window.addEventListener('popstate',()=>{readHash();render();});
window.addEventListener('resize',syncTop);
window.addEventListener('hashchange',()=>{readHash();render();});
readHash();if(state.focus)G.progress.setLast(state.focus);render();
window.EVGuideLibrary={open,state};
})();
