/* Shared PDF navigation and document branding. Previews and downloads use the same document. */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mount(root,{canvasId=''}={}){
 let pdf=null,page=1,version=0,renderVersion=0,task=null,disposed=false,zoom=100;
 root.classList.add('ev-document-viewer');
 root.innerHTML='<aside class="ev-document-pages" aria-label="PDF pages"><b>Pages</b><div class="ev-document-thumbnails"></div></aside><section class="ev-document-stage"><div class="ev-document-nav"><button type="button" class="ev-btn" data-pdf-prev aria-label="Previous page">Previous</button><span data-pdf-counter role="status">Preparing PDF…</span><button type="button" class="ev-btn" data-pdf-next aria-label="Next page">Next</button><label>Zoom<select data-pdf-zoom aria-label="PDF zoom"><option value="100">Fit width</option><option value="150">150%</option><option value="200">200%</option></select></label></div><div class="ev-document-canvas"'+(canvasId?' id="'+esc(canvasId)+'"':'')+'></div></section>';
 const canvasBox=root.querySelector('.ev-document-canvas'),thumbs=root.querySelector('.ev-document-thumbnails'),counter=root.querySelector('[data-pdf-counter]');
 function buttons(){root.querySelector('[data-pdf-prev]').disabled=!pdf||page<=1;root.querySelector('[data-pdf-next]').disabled=!pdf||page>=pdf.numPages;root.querySelectorAll('[data-pdf-page]').forEach(b=>{b.setAttribute('aria-current',b.dataset.pdfPage===String(page)?'page':'false');});}
 async function show(n,failOnError=false){
  if(!pdf||disposed)return;page=Math.max(1,Math.min(pdf.numPages,n));const token=++renderVersion,doc=pdf;
  if(task){task.cancel();task=null;}buttons();counter.textContent='Page '+page+' of '+doc.numPages;
  try{const pg=await doc.getPage(page);if(token!==renderVersion||disposed)return;const raw=pg.getViewport({scale:1}),box=canvasBox.clientWidth-24,target=box>0?Math.min(3000,Math.max(800,box*zoom/100*(window.devicePixelRatio||1))):1500,vp=pg.getViewport({scale:target/raw.width}),cn=document.createElement('canvas');cn.width=Math.ceil(vp.width);cn.height=Math.ceil(vp.height);cn.setAttribute('role','img');cn.setAttribute('aria-label','PDF preview page '+page+' of '+doc.numPages);const render=pg.render({canvasContext:cn.getContext('2d'),viewport:vp});task=render;await render.promise;if(token!==renderVersion||disposed)return;task=null;canvasBox.replaceChildren(cn);canvasBox.scrollTop=0;}
  catch(err){if(token===renderVersion&&!disposed&&err.name!=='RenderingCancelledException'){canvasBox.textContent='This page could not be displayed. Choose the page again to retry.';counter.textContent='Preview unavailable';if(failOnError)throw err;}}
 }
 async function thumbnails(doc,token){
  for(let n=1;n<=doc.numPages;n++){
   if(token!==version||disposed)return;
   try{const pg=await doc.getPage(n),raw=pg.getViewport({scale:1}),vp=pg.getViewport({scale:120/raw.width}),cn=document.createElement('canvas');cn.width=Math.ceil(vp.width);cn.height=Math.ceil(vp.height);await pg.render({canvasContext:cn.getContext('2d'),viewport:vp}).promise;if(token!==version||disposed)return;const b=thumbs.querySelector('[data-pdf-page="'+n+'"]');if(b)b.prepend(cn);}
   catch(_){if(token!==version||disposed)return;}
  }
 }
 async function set(doc){
  if(disposed)return;
  const token=++version;++renderVersion;const old=pdf;pdf=null;if(task){task.cancel();task=null;}if(old)await old.destroy();
  if(token!==version||disposed)return;
  canvasBox.textContent='Preparing PDF…';thumbs.replaceChildren();buttons();
  const lib=await ensurePdfJs();if(token!==version||disposed)return;
  const loaded=await openPdfDocument(lib,doc.output('arraybuffer')).promise;
  if(token!==version||disposed){await loaded.destroy();return;}
  pdf=loaded;page=Math.min(page,pdf.numPages);thumbs.innerHTML=Array.from({length:pdf.numPages},(_,i)=>'<button type="button" data-pdf-page="'+(i+1)+'" aria-label="Page '+(i+1)+'"><span>'+(i+1)+'</span></button>').join('');
  await show(page,true);void thumbnails(loaded,token);
 }
 const onClick=e=>{const b=e.target.closest('[data-pdf-page]');if(b)void show(+b.dataset.pdfPage);else if(e.target.closest('[data-pdf-prev]'))void show(page-1);else if(e.target.closest('[data-pdf-next]'))void show(page+1);};
 root.addEventListener('click',onClick);
 root.querySelector('[data-pdf-zoom]').onchange=e=>{zoom=Number(e.target.value)||100;canvasBox.style.setProperty('--pdf-zoom',zoom+'%');void show(page);};
 function destroy(){disposed=true;version++;renderVersion++;root.removeEventListener('click',onClick);if(task)task.cancel();if(pdf)pdf.destroy().catch(()=>{});pdf=null;}
 buttons();return{set,show,destroy,sync:buttons,error(message,retry){canvasBox.textContent=message;counter.textContent='Preview unavailable';if(typeof retry==='function'){const b=document.createElement('button');b.type='button';b.className='ev-btn ev-document-retry';b.textContent='Try again';b.onclick=()=>{canvasBox.textContent='Preparing PDF…';retry();};canvasBox.append(b);}}};
}
const font=doc=>doc.getFontList().EVSans?'EVSans':'helvetica';
function fitted(doc,value,width){let s=String(value??'').replace(/[\u2010-\u2015]/g,'-');if(doc.getTextWidth(s)<=width)return s;while(s&&doc.getTextWidth(s+'…')>width)s=s.slice(0,-1);return s+'…';}
// One date style for every document: 3 Oct 2026. Accepts ISO days, ISO times, Date objects and legacy dd/mm/yyyy snag dates.
const DAY=/^\d{4}-\d{2}-\d{2}$/,LEGACY=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
function toDate(v){
 if(v instanceof Date)return Number.isNaN(+v)?null:v;
 const s=String(v??'').trim();if(!s)return null;
 if(DAY.test(s)){const d=new Date(s+'T12:00:00Z');return Number.isNaN(+d)||d.toISOString().slice(0,10)!==s?null:d;}
 const m=s.match(LEGACY);if(m)return toDate(m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'));
 const d=new Date(s);return Number.isNaN(+d)?null:d;
}
function date(v,fallback=''){const d=toDate(v);if(!d)return fallback;const day=typeof v==='string'&&(DAY.test(v.trim())||LEGACY.test(v.trim()));return d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',...(day?{timeZone:'UTC'}:{})});}
// A revision's issue date comes from the project's revision history, so Rev A printed next week keeps its date.
function issueEntry(project=pack){const rev=String(project?.rev||'A'),list=Array.isArray(project?.revHistory)?project.revHistory:[];for(let i=list.length-1;i>=0;i--){const r=list[i];if(r&&String(r.rev)===rev&&toDate(r.at))return r;}return null;}
function issueDate(project=pack){const r=issueEntry(project);return date(r?r.at:new Date());}
const STATUSES=['For review','For information','For approval'];
const status=(project=pack)=>STATUSES.includes(project?.docStatus)?project.docStatus:'For information';
const brand=(project=pack)=>String(project?.brandName||'').trim()||String(project?.surveyedBy||'').trim();
const DOCS={plans:['Marked-up plans','PL'],client:['Client pack','CP'],engineer:['Engineer pack','EP'],programme:['Programme of works','PR'],snags:['Snag report','SN'],audit:['Evidence pack','EV']};
const CAUTION='Prepared with EV Site Planner to support design decisions. Not a certificate of compliance or completion.';
function header(doc,{title,project=pack,W=doc.internal.pageSize.getWidth(),M=14,meta=true}={}){
 const previous={font:doc.getFont(),size:doc.getFontSize(),colour:doc.getTextColor()};
 const available=W-2*M-(project.brandLogo?44:0);
 doc.setFillColor(255,255,255);doc.rect(0,0,W,37,'F');
 doc.setFillColor(37,99,235);doc.rect(M,5,9,1.2,'F');
 doc.setFont(font(doc),'bold');doc.setFontSize(7.5);doc.setTextColor(64,88,106);const by=brand(project);if(by)doc.text(fitted(doc,by,available-12),M+12,7);
 doc.setFontSize(16);doc.setTextColor(24,48,67);doc.text(fitted(doc,title,available),M,17);
 doc.setFont(font(doc),'normal');doc.setFontSize(9);doc.setTextColor(54,78,96);doc.text(fitted(doc,project.name||'Untitled project',available),M,25);
 // Issue status pill at the right of the reference line; the client cover's outcome banner is a separate thing.
 const st=status(project);doc.setFont(font(doc),'bold');doc.setFontSize(6.8);const pw=doc.getTextWidth(st)+6;
 doc.setFillColor(234,241,252);doc.setDrawColor(190,207,236);doc.setLineWidth(.2);doc.roundedRect(W-M-pw,28.7,pw,4.3,2.1,2.1,'FD');doc.setTextColor(30,78,170);doc.text(st,W-M-pw+3,31.75);
 doc.setFont(font(doc),'normal');doc.setFontSize(8);doc.setTextColor(79,101,118);
 if(meta)doc.text(fitted(doc,[project.jobRef?'Ref '+project.jobRef:'','Rev '+(project.rev||'A'),issueDate(project)].filter(Boolean).join(' · '),W-2*M-pw-4),M,31.5);
 if(project.brandLogo)window.EVProfile?.drawLogo(doc,project.brandLogo,W-M-36,6,36,22);
 doc.setDrawColor(191,207,219);doc.setLineWidth(.25);doc.line(M,36,W-M,36);
 doc.setFont(previous.font.fontName,previous.font.fontStyle);doc.setFontSize(previous.size);doc.setTextColor(previous.colour);
}
function footer(doc,{project=pack,M=14,kind}={}){
 const total=doc.getNumberOfPages(),[label,code]=DOCS[kind]||[doc.__evIssueLabel||'Document',''];
 const left=[label,code,project.jobRef?'Ref '+project.jobRef:'','Rev '+(project.rev||'A'),issueDate(project)].filter(Boolean).join(' · '),printed='Printed '+date(new Date());
 for(let n=1;n<=total;n++){
  doc.setPage(n);const W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight();doc.setDrawColor(218,226,234);doc.setLineWidth(.2);doc.line(M,H-12,W-M,H-12);doc.setFont(font(doc),'normal');doc.setFontSize(7.5);doc.setTextColor(95,112,128);
  const right=printed+' · '+n+' / '+total;doc.text(right,W-M,H-7.8,{align:'right'});doc.text(fitted(doc,left,W-2*M-doc.getTextWidth(right)-6),M,H-7.8);
  doc.setFontSize(6.6);doc.setTextColor(110,126,140);doc.text(fitted(doc,CAUTION,W-2*M),M,H-4.4);
 }return doc;
}
// Shared "Document details" block for the review dialogs: who prepared it, the company and the issue status, editable in place.
function detailsBlock(project=pack,{name=true}={}){
 const profileEmpty=window.EVProfile?.isEmpty?.()===true;
 return '<h3>Document details</h3><div class="ev-document-fields">'+(name?'<label class="ev-field">Prepared by<input data-doc-field="surveyedBy" autocomplete="name" value="'+esc(project.surveyedBy||'')+'" placeholder="Your name"></label>':'')+'<label class="ev-field">Company<input data-doc-field="brandName" autocomplete="organization" value="'+esc(project.brandName||'')+'" placeholder="Company or trading name"></label><label class="ev-field">Document status<select data-doc-field="docStatus">'+STATUSES.map(s=>'<option'+(s===status(project)?' selected':'')+'>'+s+'</option>').join('')+'</select></label>'+(profileEmpty?'<label class="ed-check ev-doc-profile"><input type="checkbox" data-doc-profile><span>Save to my profile<small>New projects start with this name and company.</small></span></label>':'')+'<p class="ev-document-rev">Rev '+esc(project.rev||'A')+' · issue date '+esc(issueDate(project))+'</p></div>';
}
function bindDetails(root,onChange){
 const saveProfile=()=>{if(root.querySelector('[data-doc-profile]')?.checked)window.EVProfile?.update?.({name:pack.surveyedBy||'',company:pack.brandName||''});};
 root.addEventListener('input',e=>{const key=e.target.dataset?.docField;if(!key||!['surveyedBy','brandName','docStatus'].includes(key))return;pack[key]=key==='docStatus'?(STATUSES.includes(e.target.value)?e.target.value:'For information'):e.target.value;if(key==='brandName'&&typeof syncBrand==='function')syncBrand();if(typeof autosave==='function')autosave();onChange?.(key);});
 root.addEventListener('change',e=>{if(e.target.matches?.('[data-doc-profile],[data-doc-field]'))saveProfile();});
}
// Gaps shared by every document: who prepared it and for which company.
function gaps(project=pack){const who=!String(project.surveyedBy||'').trim(),co=!String(project.brandName||'').trim();return who&&co?['Prepared by and company are not recorded.']:who?['Prepared by is not recorded.']:co?['Company is not recorded.']:[];}
function checksHtml(list){return '<h3>Before downloading</h3>'+(list.length?'<ul>'+list.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>':'<p class="ed-help">Project details and responsibilities are recorded.</p>');}
function profileSample(profile){
 const doc=new window.jspdf.jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true});window.EVDelivery?.installFonts(doc);
 const project={name:'Example project',brandName:profile.company,brandLogo:profile.logo,surveyedBy:profile.name,jobRef:'EXAMPLE',rev:'A'};
 header(doc,{title:'Programme of works',project});doc.setFont(font(doc),'bold');doc.setFontSize(12);doc.setTextColor(23,43,59);doc.text('Prepared by',14,48);
 const rows=[['Name',profile.name],['Role',profile.role],['Company',profile.company],['Contact',[profile.email,profile.phone].filter(Boolean).join(' · ')],['Website',profile.website],['Business address',profile.address],['Company registration',profile.registration]];
 if(profile.includeQualifications)for(const q of profile.qualifications.filter(q=>q.name))rows.push(['Qualification',[q.name,q.issuer,q.reference?'Ref: '+q.reference:'',q.expiry?'Expiry / renewal: '+date(q.expiry):''].filter(Boolean).join(' · ')]);
 let y=60;for(const [label,value]of rows){if(!value)continue;doc.setFont(font(doc),'normal');doc.setFontSize(9);const lines=doc.splitTextToSize(value,213);for(let i=0;i<lines.length;i++){if(y>188){doc.addPage();header(doc,{title:'Programme of works',project});y=48;}if(!i){doc.setFont(font(doc),'bold');doc.text(label,14,y);doc.setFont(font(doc),'normal');}doc.text(lines[i],66,y);y+=5;}y+=5;}
 footer(doc,{project,kind:'programme'});doc.__evIssueLabel='Profile sample';return doc;
}
function enhanceLegacy(){
 const bd=document.getElementById('rxBackdrop'),body=bd.querySelector('.rx-body'),options=document.getElementById('rxEdit'),oldPreview=body.querySelector('.rx-preview');
 const viewerRoot=document.createElement('div');viewerRoot.id='rxDocumentViewer';
 // Retain the original editor, including saved customer templates and their handlers.
 const stash=document.createElement('div');stash.hidden=true;stash.append(document.getElementById('rxFrame'),document.getElementById('rxEmpty'),document.getElementById('rxRefresh'));bd.append(stash);
 const status=document.getElementById('rxStatus');
 const openBtn=document.createElement('button');openBtn.type='button';openBtn.className='hbtn ev-open-pdf';openBtn.id='rxOpenPdf';openBtn.textContent='Open PDF';openBtn.disabled=true;document.getElementById('rxExport').before(openBtn);
 const openNote=document.createElement('p');openNote.className='ev-open-pdf-note';openNote.textContent='Check the full document in the PDF viewer before sending.';bd.querySelector('.rx-foot').prepend(status);oldPreview.remove();body.classList.add('ev-document-layout');options.classList.add('ev-document-options');body.prepend(viewerRoot);
 let viewer=null,currentDoc=null,focus=null,saving=false;
 // Before downloading and Document details sit at the top of the options column for both packs.
 const docBox=document.createElement('div');docBox.id='rxDocDetails';docBox.className='rx-sec rx-doc-details';options.prepend(openNote,docBox);
 openBtn.onclick=()=>{if(currentDoc)openInViewer(currentDoc);};
 const renderDocBox=()=>{docBox.innerHTML='<div id="rxChecks">'+checksHtml(gaps())+'</div>'+detailsBlock(pack,{name:rxMode!=='customer'});};
 bindDetails(docBox,key=>{const c=document.getElementById('rxChecks');if(c)c.innerHTML=checksHtml(gaps());if(key==='surveyedBy'||key==='brandName'){const pm=document.getElementById('rxPmName');if(pm&&key==='surveyedBy'&&pm!==document.activeElement)pm.value=pack.surveyedBy||'';}rxQueuePreview();});
 const originalOpen=openReview,originalClose=closeReview;
 rxUpdatePreview=async function(){
  if(!bd.classList.contains('show'))return;
  const token=++rxBuildToken;currentDoc=null;document.getElementById('rxExport').disabled=true;openBtn.disabled=true;status.textContent='Preparing PDF…';
  try{
   await Promise.all(pack.photos.filter(p=>p.includeInPdf!==false).map(p=>window.EVDelivery?.preparePlan(p)));
   const doc=await (rxMode==='customer'?buildCustomerPdf:buildPdf)({output:'doc'});
   if(token!==rxBuildToken||!bd.classList.contains('show'))return;
   doc.__evIssueLabel=rxMode==='customer'?'Client pack':'Engineer pack';await viewer.set(doc);
   if(token!==rxBuildToken||!bd.classList.contains('show'))return;
   currentDoc=doc;document.getElementById('rxExport').disabled=false;openBtn.disabled=false;status.textContent='Preview matches the download.';
  }catch(err){if(token===rxBuildToken&&bd.classList.contains('show')){status.textContent='Preview could not be prepared.';viewer?.error(err.message,rxUpdatePreview);}}
 };
 rxQueuePreview=function(){clearTimeout(rxDebounce);rxBuildToken++;currentDoc=null;document.getElementById('rxExport').disabled=true;openBtn.disabled=true;status.textContent='Updating preview…';rxDebounce=setTimeout(rxUpdatePreview,350);rxCheckPlaceholders();const c=document.getElementById('rxChecks');if(c)c.innerHTML=checksHtml(gaps());};
 openReview=function(mode){
  focus=document.activeElement;viewer?.destroy();viewer=mount(viewerRoot);originalOpen(mode);document.getElementById('evApp').inert=true;
  renderDocBox();bd.querySelector('.rx-head h4').textContent=mode==='customer'?'Review client pack':'Review engineer pack';bd.querySelector('.rx-head .sub').textContent=(pack.name||'Untitled project')+' · Rev '+(pack.rev||'A');
  document.getElementById('rxExport').onclick=async()=>{
   if(!currentDoc||saving)return;
   if(rxMode==='customer'){
    const ph=[...new Set(rxLetterText().match(RX_PH_RE)||[])];
    if(ph.length===1&&ph[0]==='[your name]'&&!letterAuthor()){
     // The sign-off is the only gap: ask for the name, save it as the project lead and download.
     const name=await askInput({title:'Add your name to the letter',label:'The letter is signed by the project lead. Your name is saved in the project details.',placeholder:'Your name',okText:'Add and download'});
     if(name==null||!name.trim())return;
     pack.surveyedBy=name.trim();if(pack.custLetter)pack.custLetter=pack.custLetter.split('[your name]').join(pack.surveyedBy);autosave();
     const pm=document.getElementById('rxPmName');if(pm)pm.value=pack.surveyedBy;const sum=document.getElementById('rxSummary');if(sum)sum.value=rxLetterText();
     renderDocBox();clearTimeout(rxDebounce);await rxUpdatePreview();if(!currentDoc)return;
    }else if(ph.length){
     const answer=await askInput({title:'Complete the client letter?',label:'The letter still contains '+ph.slice(0,2).join(', ')+(ph.length>2?' and more':'')+'.',okText:'Go back and edit',cancelText:'Download anyway',cancelValue:'download',confirm:true});
     if(answer===null)return;
     if(answer!=='download'){const sum=document.getElementById('rxSummary');sum?.focus();sum?.scrollIntoView({block:'center'});return;}
    }else{
     const list=gaps();
     if(list.length&&!await askConfirm({title:'Download with gaps?',label:list.slice(0,2).join(' '),okText:'Download anyway'}))return;
    }
   }
   saving=true;const b=document.getElementById('rxExport');b.disabled=true;
   try{const name=(pack.name||'EV-project').replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,90)+'_'+(rxMode==='customer'?'client':'engineer')+'_rev-'+String(pack.rev||'A').replace(/[^a-zA-Z0-9_-]/g,'_')+'.pdf';await currentDoc.save(name,{returnPromise:true});status.textContent='PDF downloaded.';}catch(err){status.textContent='Download failed: '+err.message;}finally{saving=false;b.disabled=!currentDoc;}
  };
  document.getElementById('rxClose').focus();
 };
 closeReview=function(){if(saving)return;clearTimeout(rxDebounce);rxBuildToken++;currentDoc=null;viewer?.destroy();viewer=null;originalClose();document.getElementById('evApp').inert=false;if(window.EVWorkspace?.route()==='issue')EVWorkspace.refresh();if(focus?.isConnected)focus.focus();};
 bd.addEventListener('keydown',e=>{
  e.stopPropagation();if(e.key==='Escape'){e.preventDefault();closeReview();return;}if(e.key!=='Tab')return;const nodes=[...bd.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea,select,a[href]')].filter(x=>x.getClientRects().length&&!x.closest('[hidden]'));if(!nodes.length)return;const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 });
}
// Phones: open the prepared document in the system PDF viewer, which has native pinch zoom.
function openInViewer(doc){const url=URL.createObjectURL(doc.output('blob'));window.open(url,'_blank','noopener');setTimeout(()=>URL.revokeObjectURL(url),120000);}
window.EVReportViewer={mount,enhanceLegacy,openInViewer};window.EVReportBranding={header,footer,profileSample,date,issueDate,issueEntry,status,statuses:STATUSES,brand,docs:DOCS,detailsBlock,bindDetails,gaps,checksHtml};
})();
