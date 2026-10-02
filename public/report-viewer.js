/* Shared PDF navigation and document branding. Previews and downloads use the same document. */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mount(root,{canvasId=''}={}){
 let pdf=null,page=1,version=0,renderVersion=0,task=null,disposed=false;
 root.classList.add('ev-document-viewer');
 root.innerHTML='<aside class="ev-document-pages" aria-label="PDF pages"><b>Pages</b><div class="ev-document-thumbnails"></div></aside><section class="ev-document-stage"><div class="ev-document-nav"><button type="button" class="ev-btn" data-pdf-prev aria-label="Previous page">Previous</button><span data-pdf-counter role="status">Preparing PDF…</span><button type="button" class="ev-btn" data-pdf-next aria-label="Next page">Next</button><label>Zoom<select data-pdf-zoom aria-label="PDF zoom"><option value="100">Fit width</option><option value="150">150%</option><option value="200">200%</option></select></label></div><div class="ev-document-canvas"'+(canvasId?' id="'+esc(canvasId)+'"':'')+'></div></section>';
 const canvasBox=root.querySelector('.ev-document-canvas'),thumbs=root.querySelector('.ev-document-thumbnails'),counter=root.querySelector('[data-pdf-counter]');
 function buttons(){root.querySelector('[data-pdf-prev]').disabled=!pdf||page<=1;root.querySelector('[data-pdf-next]').disabled=!pdf||page>=pdf.numPages;root.querySelectorAll('[data-pdf-page]').forEach(b=>{b.setAttribute('aria-current',b.dataset.pdfPage===String(page)?'page':'false');});}
 async function show(n,failOnError=false){
  if(!pdf||disposed)return;page=Math.max(1,Math.min(pdf.numPages,n));const token=++renderVersion,doc=pdf;
  if(task){task.cancel();task=null;}buttons();counter.textContent='Page '+page+' of '+doc.numPages;
  try{const pg=await doc.getPage(page);if(token!==renderVersion||disposed)return;const raw=pg.getViewport({scale:1}),vp=pg.getViewport({scale:Math.min(2,1500/raw.width)}),cn=document.createElement('canvas');cn.width=Math.ceil(vp.width);cn.height=Math.ceil(vp.height);cn.setAttribute('role','img');cn.setAttribute('aria-label','PDF preview page '+page+' of '+doc.numPages);const render=pg.render({canvasContext:cn.getContext('2d'),viewport:vp});task=render;await render.promise;if(token!==renderVersion||disposed)return;task=null;canvasBox.replaceChildren(cn);canvasBox.scrollTop=0;}
  catch(err){if(token===renderVersion&&!disposed&&err.name!=='RenderingCancelledException'){canvasBox.textContent='This page could not be displayed. Refresh the preview to try again.';counter.textContent='Preview unavailable';if(failOnError)throw err;}}
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
  const loaded=await lib.getDocument({data:doc.output('arraybuffer')}).promise;
  if(token!==version||disposed){await loaded.destroy();return;}
  pdf=loaded;page=Math.min(page,pdf.numPages);thumbs.innerHTML=Array.from({length:pdf.numPages},(_,i)=>'<button type="button" data-pdf-page="'+(i+1)+'" aria-label="Page '+(i+1)+'"><span>'+(i+1)+'</span></button>').join('');
  await show(page,true);void thumbnails(loaded,token);
 }
 const onClick=e=>{const b=e.target.closest('[data-pdf-page]');if(b)void show(+b.dataset.pdfPage);else if(e.target.closest('[data-pdf-prev]'))void show(page-1);else if(e.target.closest('[data-pdf-next]'))void show(page+1);};
 root.addEventListener('click',onClick);
 root.querySelector('[data-pdf-zoom]').onchange=e=>canvasBox.style.setProperty('--pdf-zoom',e.target.value+'%');
 function destroy(){disposed=true;version++;renderVersion++;root.removeEventListener('click',onClick);if(task)task.cancel();if(pdf)pdf.destroy().catch(()=>{});pdf=null;}
 buttons();return{set,show,destroy,sync:buttons,error(message){canvasBox.textContent=message;counter.textContent='Preview unavailable';}};
}
const font=doc=>doc.getFontList().EVSans?'EVSans':'helvetica';
function fitted(doc,value,width){let s=String(value??'').replace(/[\u2010-\u2015]/g,'-');if(doc.getTextWidth(s)<=width)return s;while(s&&doc.getTextWidth(s+'…')>width)s=s.slice(0,-1);return s+'…';}
function header(doc,{title,project=pack,W=doc.internal.pageSize.getWidth(),M=14}={}){
 const previous={font:doc.getFont(),size:doc.getFontSize(),colour:doc.getTextColor()};
 const available=W-2*M-(project.brandLogo?44:0);
 doc.setFillColor(255,255,255);doc.rect(0,0,W,37,'F');
 doc.setFillColor(37,99,235);doc.rect(M,5,9,1.2,'F');
 doc.setFont(font(doc),'bold');doc.setFontSize(7.5);doc.setTextColor(64,88,106);doc.text(fitted(doc,project.brandName||'EV Site Planner',available-12),M+12,7);
 doc.setFontSize(16);doc.setTextColor(24,48,67);doc.text(fitted(doc,title,available),M,17);
 doc.setFont(font(doc),'normal');doc.setFontSize(9);doc.setTextColor(54,78,96);doc.text(fitted(doc,project.name||'Untitled project',available),M,25);
 doc.setFontSize(7.5);doc.setTextColor(79,101,118);
 doc.text(fitted(doc,[project.jobRef?'Ref '+project.jobRef:'Reference not recorded','Revision '+(project.rev||'A'),new Date().toLocaleDateString('en-GB')].join(' · '),available),M,31.5);
 if(project.brandLogo)window.EVProfile?.drawLogo(doc,project.brandLogo,W-M-36,6,36,23);
 doc.setDrawColor(191,207,219);doc.setLineWidth(.25);doc.line(M,36,W-M,36);
 doc.setFont(previous.font.fontName,previous.font.fontStyle);doc.setFontSize(previous.size);doc.setTextColor(previous.colour);
}
function footer(doc,{project=pack,M=14}={}){
 const total=doc.getNumberOfPages();
 for(let n=1;n<=total;n++){
  doc.setPage(n);const W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight();doc.setDrawColor(218,226,234);doc.setLineWidth(.2);doc.line(M,H-10,W-M,H-10);doc.setFont(font(doc),'normal');doc.setFontSize(7);doc.setTextColor(95,112,128);
  const line=[project.brandName||'EV Site Planner',project.surveyedBy,project.jobRef,'Rev '+(project.rev||'A'),new Date().toLocaleDateString('en-GB')].filter(Boolean).join(' · ');
  doc.text(fitted(doc,line,W-2*M-25),M,H-5.5);doc.text(n+' / '+total,W-M,H-5.5,{align:'right'});
 }return doc;
}
function profileSample(profile){
 const doc=new window.jspdf.jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true});window.EVDelivery?.installFonts(doc);
 const project={name:'Example project',brandName:profile.company,brandLogo:profile.logo,surveyedBy:profile.name,jobRef:'EXAMPLE',rev:'A'};
 header(doc,{title:'Programme of works',project});doc.setFont(font(doc),'bold');doc.setFontSize(12);doc.setTextColor(23,43,59);doc.text('Prepared by',14,48);
 const rows=[['Name',profile.name],['Role',profile.role],['Company',profile.company],['Contact',[profile.email,profile.phone].filter(Boolean).join(' · ')],['Website',profile.website],['Business address',profile.address],['Company registration',profile.registration]];
 if(profile.includeQualifications)for(const q of profile.qualifications.filter(q=>q.name))rows.push(['Qualification',[q.name,q.issuer,q.reference?'Ref: '+q.reference:'',q.expiry?'Expiry / renewal: '+q.expiry.split('-').reverse().join('/'):''].filter(Boolean).join(' · ')]);
 let y=60;for(const [label,value]of rows){if(!value)continue;doc.setFont(font(doc),'normal');doc.setFontSize(9);const lines=doc.splitTextToSize(value,213);for(let i=0;i<lines.length;i++){if(y>188){doc.addPage();header(doc,{title:'Programme of works',project});y=48;}if(!i){doc.setFont(font(doc),'bold');doc.text(label,14,y);doc.setFont(font(doc),'normal');}doc.text(lines[i],66,y);y+=5;}y+=5;}
 footer(doc,{project});doc.__evIssueLabel='Profile sample';return doc;
}
function enhanceLegacy(){
 const bd=document.getElementById('rxBackdrop'),body=bd.querySelector('.rx-body'),options=document.getElementById('rxEdit'),oldPreview=body.querySelector('.rx-preview');
 const viewerRoot=document.createElement('div');viewerRoot.id='rxDocumentViewer';
 // Retain the original editor, including saved customer templates and their handlers.
 const stash=document.createElement('div');stash.hidden=true;stash.append(document.getElementById('rxFrame'),document.getElementById('rxEmpty'));bd.append(stash);
 const status=document.getElementById('rxStatus'),refresh=document.getElementById('rxRefresh');bd.querySelector('.rx-foot').prepend(status);options.prepend(refresh);oldPreview.remove();body.classList.add('ev-document-layout');options.classList.add('ev-document-options');body.prepend(viewerRoot);
 let viewer=null,currentDoc=null,focus=null,saving=false;
 const originalOpen=openReview,originalClose=closeReview;
 rxUpdatePreview=async function(){
  if(!bd.classList.contains('show'))return;
  const token=++rxBuildToken;currentDoc=null;document.getElementById('rxExport').disabled=true;status.textContent='Preparing PDF…';
  try{
   await Promise.all(pack.photos.filter(p=>p.includeInPdf!==false).map(p=>window.EVDelivery?.preparePlan(p)));
   const doc=await (rxMode==='customer'?buildCustomerPdf:buildPdf)({output:'doc'});
   if(token!==rxBuildToken||!bd.classList.contains('show'))return;
   doc.__evIssueLabel=rxMode==='customer'?'Client pack':'Engineer pack';await viewer.set(doc);
   if(token!==rxBuildToken||!bd.classList.contains('show'))return;
   currentDoc=doc;document.getElementById('rxExport').disabled=false;status.textContent='Preview matches the download.';
  }catch(err){if(token===rxBuildToken&&bd.classList.contains('show')){status.textContent='Preview could not be prepared. Try Refresh.';viewer?.error(err.message);}}
 };
 rxQueuePreview=function(){clearTimeout(rxDebounce);rxBuildToken++;currentDoc=null;document.getElementById('rxExport').disabled=true;status.textContent='Updating preview…';rxDebounce=setTimeout(rxUpdatePreview,350);rxCheckPlaceholders();};
 openReview=function(mode){
  focus=document.activeElement;viewer?.destroy();viewer=mount(viewerRoot);originalOpen(mode);document.getElementById('evApp').inert=true;
  bd.querySelector('.rx-head h4').textContent=mode==='customer'?'Review client pack':'Review engineer pack';bd.querySelector('.rx-head .sub').textContent=(pack.name||'Untitled project')+' · Rev '+(pack.rev||'A');
  document.getElementById('rxExport').onclick=async()=>{
   if(!currentDoc||saving)return;
   if(rxMode==='customer'){const ph=rxLetterText().match(RX_PH_RE)||[];if(ph.length&&!await askConfirm({title:'Complete the client letter?',label:'The letter still contains '+ph.slice(0,2).join(', ')+'.',okText:'Download anyway'}))return;}
   saving=true;const b=document.getElementById('rxExport');b.disabled=true;
   try{const name=(pack.name||'EV-project').replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,90)+'_'+(rxMode==='customer'?'client':'engineer')+'_rev-'+String(pack.rev||'A').replace(/[^a-zA-Z0-9_-]/g,'_')+'.pdf';await currentDoc.save(name,{returnPromise:true});status.textContent='PDF downloaded.';}catch(err){status.textContent='Download failed: '+err.message;}finally{saving=false;b.disabled=!currentDoc;}
  };
  document.getElementById('rxClose').focus();
 };
 closeReview=function(){if(saving)return;clearTimeout(rxDebounce);rxBuildToken++;currentDoc=null;viewer?.destroy();viewer=null;originalClose();document.getElementById('evApp').inert=false;if(window.EVWorkspace?.route()==='issue')EVWorkspace.refresh();if(focus?.isConnected)focus.focus();};
 bd.addEventListener('keydown',e=>{
  e.stopPropagation();if(e.key!=='Tab')return;const nodes=[...bd.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea,select,a[href]')].filter(x=>x.getClientRects().length&&!x.closest('[hidden]'));if(!nodes.length)return;const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 });
}
window.EVReportViewer={mount,enhanceLegacy};window.EVReportBranding={header,footer,profileSample};
})();
