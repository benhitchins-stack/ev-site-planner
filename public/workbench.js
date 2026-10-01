/* Markup controls. All edits continue to use the original drawing records and history. */
(function(){
'use strict';
const $=id=>document.getElementById(id), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storageKey='evsp_equipment_v1';
let library={favourites:[],recent:[]};
try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved)for(const key of ['favourites','recent'])library[key]=Array.isArray(saved[key])?saved[key].filter(x=>typeof x==='string').slice(0,80):[];}catch(_){}
const saveLibrary=()=>{try{localStorage.setItem(storageKey,JSON.stringify(library));}catch(_){toast('Equipment preferences could not be saved in this browser.');}};
const drawing=()=>{pack.workspace=pack.workspace||{};return pack.workspace.drawing||(pack.workspace.drawing={});};
const compact=()=>drawing().labels!=='full';
const prefixes={unit:'CP',evdb:'DB',ipevdb:'DB',consumerunit:'DB',panelboard:'DB',feeder:'FP',arrayboard:'LM',isolator:'IS',meter:'M',cutout:'F',ctchamber:'CT',ipbox:'JB',henley:'HB',earthterm:'ET',fusesaver:'LL',mcb:'MCB',rcd:'RCD',din:'PD',garagesplit:'DB'};
function ensureReferences(){
 const items=pack.photos.flatMap(p=>p.items||[]).filter(i=>prefixes[i.type]),used=new Set(),next={};
 for(const it of items){const ref=String(it.planRef||'');if(/^[A-Z]+-\d{2,}$/.test(ref)&&!used.has(ref)){used.add(ref);const [pre,n]=ref.split('-');next[pre]=Math.max(next[pre]||0,+n);}else delete it.planRef;}
 for(const it of items)if(!it.planRef){const pre=prefixes[it.type];let ref;do{ref=pre+'-'+String(next[pre]=(next[pre]||0)+1).padStart(2,'0');}while(used.has(ref));it.planRef=ref;used.add(ref);}
}
const itemTitle=it=>it.type==='unit'?unitDisplayName(it):typeName(it);
const itemSummary=it=>[it.type==='unit'?unitDisplayName(it):typeName(it),it.type==='unit'?(it.kw||'7')+' kW':'',it.provision==='passive'?'Future position':''].filter(Boolean).join(' · ');

// Restructure the existing fields before wireSide attaches their original handlers.
const originalProps=propsPanel, openSections=new Map();
function groupFor(label){
 if(/^(Label(?: \(optional\))?$|Charger$|Power$|Make & model|Cable type|Run length|Length|Caption|Text|Rating|Phase|Phases|Circuit|Name|Assigned|Finding|Severity|Status)/i.test(label))return 'details';
 if(/^(Configuration|Concrete base|Base size|Mounting|Cable entry|Lead reach)/i.test(label))return 'mounting';
 if(/^(Colour|Color|Design$|Size|Width|Height|Rotate|Rotation|3D|Drawing view|View|Show as|Label position|Label size|Align to guide|Snap point)/i.test(label))return 'appearance';
 if(/^Design option/i.test(label))return 'options';
 return 'electrical';
}
propsPanel=function(){
 const html=originalProps(),it=findItem(sel);if(!it||multiActive()||draftRoute)return html;
 ensureReferences();
 const root=document.createElement('div');root.innerHTML=html;const card=root.firstElementChild;
 if(!card)return html;
 const groups={details:[],electrical:[],mounting:[],appearance:[],options:[]},footer=[];
 for(const node of [...card.children]){
  if(node.matches('h3'))continue;
  if(node.classList.contains('pbtns')){footer.push(node);continue;}
  if(!node.classList.contains('prop')){groups.details.push(node);continue;}
  let chunk=null;
  for(const child of [...node.children]){
   if(child.tagName==='LABEL'||!chunk){chunk=document.createElement('div');chunk.className='wb-field';groups[groupFor(child.tagName==='LABEL'?child.textContent:'')].push(chunk);}
   chunk.append(child);
  }
 }
 if(it.type==='unit'){
  groups.details=groups.details.filter(n=>n.querySelector('label')?.textContent.trim()!=='Charger');
  const label=groups.details.find(n=>n.querySelector('#ulabel'));
  if(label){const option=document.createElement('div');option.className='wb-field';for(const child of [...label.children])if(child.classList.contains('seg')||child.classList.contains('sub'))option.append(child);if(option.childElementCount)groups.options.unshift(option);}
  const power=groups.details.find(n=>n.querySelector('[data-kw]'));
  if(power)for(const note of [...power.querySelectorAll('.sub')]){const details=document.createElement('details');details.className='wb-help';details.innerHTML='<summary>Electrical notes</summary>';note.replaceWith(details);details.append(note);}
  const model=groups.details.find(n=>n.querySelector('#umodel'));if(model){groups.details=groups.details.filter(n=>n!==model);groups.details.unshift(model);}
 }
 const labelField=groups.details.find(n=>n.querySelector('#ulabel')||n.querySelector('input[id$="label"]'));
 if(labelField){groups.details=groups.details.filter(n=>n!==labelField);groups.details.unshift(labelField);}
 card.replaceChildren();card.classList.add('wb-inspector');
 for(const [key,title] of [['details','Item details'],['electrical','Electrical settings'],['mounting','Mounting & base'],['appearance','Appearance'],['options','Design options']]){
  if(!groups[key].length)continue;
  const section=document.createElement(key==='details'?'section':'details');section.className='wb-section';
  if(key!=='details'){section.dataset.wbSection=it.type+':'+key;section.open=openSections.get(section.dataset.wbSection)===true;section.innerHTML='<summary>'+title+'</summary>';}
  else section.innerHTML='<h3>'+title+'</h3>';
  const content=document.createElement('div');content.className='wb-section-body';content.append(...groups[key]);section.append(content);card.append(section);
 }
 const controls=document.createElement('div');controls.className='wb-item-actions';controls.append(...footer);
 if(it.type==='unit')controls.insertAdjacentHTML('afterbegin','<button type="button" class="ev-btn" data-wb-repeat>Place another like this</button>');
 card.append(controls);
 for(const note of card.querySelectorAll('.sub')){
  if(note.textContent.length<190||note.querySelector('b[style*="B4231F"]')||/Future charger position|Set the photo scale/.test(note.textContent))continue;
  const help=document.createElement('details');help.className='wb-help';help.innerHTML='<summary>More about this setting</summary>';note.replaceWith(help);help.append(note);
 }
 return root.innerHTML;
};
$('side').addEventListener('toggle',e=>{if(e.target.dataset.wbSection)openSections.set(e.target.dataset.wbSection,e.target.open);},true);
const originalRender=renderSide;
let inspectorContext='';
renderSide=function(){
 const key=pack.active+':'+sideTab+':'+(sel||'')+':'+(draftRoute?.kind||''),scroll=$('sideScroll').scrollTop,same=key===inspectorContext;
 originalRender();inspectorContext=key;
 $('side').querySelectorAll('.seg button').forEach(b=>b.setAttribute('aria-pressed',String(b.classList.contains('on'))));
 $('side').querySelectorAll('.wb-field').forEach((field,i)=>{const label=field.querySelector('label'),input=field.querySelector('input:not([type=color]),select,textarea');if(label&&input){if(!input.id)input.id='wbField'+i;label.htmlFor=input.id;}});
 if($('padwmm'))$('padwmm').setAttribute('aria-label','Base width (mm)');if($('paddmm'))$('paddmm').setAttribute('aria-label','Base depth (mm)');
 const it=sideTab==='props'&&!multiActive()&&!draftRoute?findItem(sel):null;
 $('side').classList.toggle('wb-has-item',!!it);
 const title=$('evInspectorTitle');if(it&&title){title.textContent=(it.planRef?it.planRef+' · ':'')+typeName(it);let sub=$('wbItemSummary');if(!sub){sub=document.createElement('span');sub.id='wbItemSummary';title.after(sub);}sub.textContent=itemSummary(it);}
 else $('wbItemSummary')?.remove();
 $('sideScroll').scrollTop=same?scroll:0;
 addDrawingControls();
};

// The equipment picker keeps the established categories and adds a searchable library.
let query='',libraryTab='all',registry=new Map(),pendingModel=null,repeatItem=null;
function refreshRegistry(){
 registry=new Map();
 for(const b of $('rail').querySelectorAll('.palsec [data-tool]')){
  const key=b.dataset.tool,label=b.textContent.replace(/\s+/g,' ').trim();
  registry.set(key,{key,tool:key,label,category:b.closest('[data-cat]').dataset.cat,art:b.querySelector('.ti')?.outerHTML||'',detail:key.startsWith('unit:')?UNIT_DEFS[key.split(':')[1]]?.name||label:label});
 }
 for(const [key,m] of Object.entries(CHARGER_MODELS))registry.set('model:'+key,{key:'model:'+key,tool:'unit:'+(m.teth?'teth_wall':'unteth_wall'),model:key,label:m.b+' '+m.m,category:'chargers',detail:[m.teth?'Tethered':'Socketed',m.mm.join(' × ')+' mm'].join(' · '),art:unitMini(m.teth?'teth_wall':'unteth_wall')});
}
function installLibrary(){
 refreshRegistry();
 if(!$('wbLibraryHeader')){
  const el=document.createElement('div');el.id='wbLibraryHeader';el.innerHTML='<div class="wb-library-heading"><b>Equipment & markup</b><button type="button" class="ev-icon-btn" data-wb-close-library aria-label="Close equipment picker">×</button></div><label class="wb-search">Search equipment<input type="search" id="wbEquipmentSearch" placeholder="Charger, board, cable…" autocomplete="off"></label><div class="wb-library-tabs" role="tablist" aria-label="Equipment library">'+[['all','Library'],['favourites','Favourites'],['recent','Recent']].map(([key,label])=>'<button type="button" role="tab" data-wb-library="'+key+'" aria-selected="'+(key===libraryTab)+'">'+label+'</button>').join('')+'</div>';
  $('rail').prepend(el);const results=document.createElement('div');results.id='wbEquipmentResults';results.hidden=true;$('rail').append(results);
  $('wbEquipmentSearch').value=query;
  $('wbEquipmentSearch').oninput=e=>{query=e.target.value;filterLibrary();};
 }
 for(const b of $('rail').querySelectorAll('.palsec [data-tool]')){
  const entry=registry.get(b.dataset.tool);b.title=entry.detail;
  if(b.parentElement.classList.contains('wb-tool-cell'))continue;
  const cell=document.createElement('div');cell.className='wb-tool-cell';b.replaceWith(cell);cell.append(b);
  const star=document.createElement('button');star.type='button';star.className='wb-favourite';star.dataset.wbFavourite=entry.key;cell.append(star);
 }
 filterLibrary();
}
function filterLibrary(){
 if(!$('wbEquipmentResults'))return;
 const filtered=!!query.trim()||libraryTab!=='all';$('rail').classList.toggle('wb-searching',filtered);$('wbEquipmentResults').hidden=!filtered;
 $('rail').querySelectorAll('[data-wb-library]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.wbLibrary===libraryTab)));
 $('rail').querySelectorAll('[data-wb-favourite]').forEach(b=>{const on=library.favourites.includes(b.dataset.wbFavourite),label=registry.get(b.dataset.wbFavourite)?.label||'equipment';b.textContent=on?'★':'☆';b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',(on?'Remove ':'Add ')+label+(on?' from favourites':' to favourites'));});
 if(!filtered)return;
 const words=query.toLowerCase().trim().split(/\s+/),pool=libraryTab==='all'?[...registry.values()]:(library[libraryTab]||[]).map(k=>registry.get(k)).filter(Boolean);
 const entries=pool.filter(e=>words.every(w=>(e.label+' '+e.detail+' '+e.category).toLowerCase().includes(w)));
 $('wbEquipmentResults').innerHTML='<p class="wb-result-count" role="status">'+entries.length+' result'+(entries.length===1?'':'s')+'</p>'+(entries.length?entries.map(e=>'<div class="wb-result"><button type="button" data-wb-pick="'+esc(e.key)+'">'+e.art+'<span><b>'+esc(e.label)+'</b><small>'+esc(e.detail)+'</small></span></button><button type="button" class="wb-favourite" data-wb-favourite="'+esc(e.key)+'" aria-pressed="'+library.favourites.includes(e.key)+'" aria-label="'+(library.favourites.includes(e.key)?'Remove ':'Add ')+esc(e.label)+(library.favourites.includes(e.key)?' from favourites':' to favourites')+'">'+(library.favourites.includes(e.key)?'★':'☆')+'</button></div>').join(''):'<div class="wb-library-empty">'+(query?'No matching equipment. Try a model, manufacturer or tool name.':libraryTab==='recent'?'Equipment you place will appear here.':'Use the star beside equipment to save it here.')+'</div>');
}
function remember(key){library.recent=[key,...library.recent.filter(k=>k!==key)].slice(0,12);saveLibrary();}
function choose(entry){
 if(!entry)return;
 if(entry.model){
  const m=CHARGER_MODELS[entry.model];
  $('wbEquipmentResults').innerHTML='<div class="wb-model-preview"><button type="button" class="ev-btn quiet" data-wb-back-results>Back to results</button>'+entry.art+'<h3>'+esc(entry.label)+'</h3><p>'+esc(entry.detail)+'</p><p>'+esc(m.note||'')+'</p><p class="ed-help">Set the rating and mounting after placement. Confirm the specification against the product datasheet.</p><button type="button" class="ev-btn primary" data-wb-place-model="'+esc(entry.key)+'">Place on plan</button></div>';
 }else{pendingModel=null;repeatItem=null;setTool(entry.tool);palOpen=false;syncPalette();}
}
const originalBuildRail=buildRail;
buildRail=function(){originalBuildRail();installLibrary();};
const originalPalette=syncPalette;
syncPalette=function(){originalPalette();if($('wbEquipmentResults'))filterLibrary();};
const originalSetTool=setTool;
setTool=function(t){if(t!=='unit:'+repeatItem?.variant)repeatItem=null;if(pendingModel&&t!==pendingModel.tool)pendingModel=null;originalSetTool(t);};
const originalTap=handleTap;
handleTap=function(sx,sy){
 const p=activePhoto(),before=new Set(p?.items.map(i=>i.id)),choice=tool,model=pendingModel,copy=repeatItem;
 originalTap(sx,sy);
 const added=p?.items.find(i=>!before.has(i.id));if(!added)return;
 if(added.type==='unit'&&(model||copy)){
  if(copy){const {id,x,y,...rest}=JSON.parse(JSON.stringify(copy));delete rest.planRef;delete rest.label;Object.assign(added,rest);}
  else if(model)added.model=model.model;
  normalisePack(pack);draw();
 }
 ensureReferences();
 if(added.type==='unit'&&/^CP-\d+$/.test(added.label||'')){added.label=added.planRef;draw();}
 remember(model?.key||(choice==='route:__area'&&areaPreset?'area:'+areaPreset:choice));pendingModel=null;repeatItem=null;
 if(added.type==='unit'){sideTab='props';setSideTab();}
};
$('rail').addEventListener('click',e=>{
 const favourite=e.target.closest('[data-wb-favourite]');if(favourite){e.stopPropagation();const key=favourite.dataset.wbFavourite;library.favourites=library.favourites.includes(key)?library.favourites.filter(k=>k!==key):[...library.favourites,key];saveLibrary();filterLibrary();return;}
 const tab=e.target.closest('[data-wb-library]');if(tab){libraryTab=tab.dataset.wbLibrary;filterLibrary();return;}
 if(e.target.closest('[data-wb-close-library]')){palOpen=false;syncPalette();return;}
 if(e.target.closest('[data-wb-back-results]')){filterLibrary();return;}
 const pick=e.target.closest('[data-wb-pick]');if(pick){choose(registry.get(pick.dataset.wbPick));return;}
 const place=e.target.closest('[data-wb-place-model]');if(place){const entry=registry.get(place.dataset.wbPlaceModel);setTool(entry.tool);pendingModel=entry;palOpen=false;syncPalette();}
});
$('side').addEventListener('click',e=>{if(e.target.closest('[data-wb-repeat]')){const it=findItem(sel);if(it?.type==='unit'){const copy=JSON.parse(JSON.stringify(it));setTool('unit:'+it.variant);repeatItem=copy;$('evInspectorClose').click();toast('Tap the plan to place another '+unitDisplayName(it)+'.');}}});

// Short references on screen retain the original labels and full export descriptions.
let labelBoxes=[],referenceHits=[];
const originalScene=drawScene;
drawScene=function(c,vw,k,forExport){ensureReferences();labelBoxes=[];if(!forExport)referenceHits=[];originalScene(c,vw,k,forExport);};
for(const name of ['drawUnit','drawPlanEquip','drawIsoEquip','drawEvdb','drawIpEvdb','drawIpBox','drawHenley','drawMeter','drawCTChamber','drawEarthTerminal','drawCutout','drawIsolator','drawLoadLimiterEquipment','drawMcbItem','drawRcdItem','drawDinItem','drawConsumerUnit','drawPanelBoard','drawGarageSplit','drawFeederPillar','drawArrayBoard']){
  const original=window[name];if(!original)continue;
  window[name]=function(c,vw,it,k,forExport,...args){
  if((forExport||!compact())&&it.planRef&&pack.showLabels!==false){
   const label=it.label;if(!String(label||'').startsWith(it.planRef))it.label=it.planRef+(label?' · '+label:'');
   try{return original(c,vw,it,k,forExport,...args);}finally{it.label=label;}
  }
  if(forExport||!compact()||!it.planRef||it.asLabel||pack.showLabels===false)return original(c,vw,it,k,forExport,...args);
  const show=pack.showLabels;pack.showLabels=false;
  try{original(c,vw,it,k,forExport,...args);}finally{pack.showLabels=show;}
  if(!labelBoxes.some(b=>b.it.id===it.id))labelBoxes.push({it,vw,k});
 };
}
function drawReferences(c){
 if(!labelBoxes.length)return;
 const occupied=Object.values(routeLabelHit).filter(b=>b&&Number.isFinite(b.x)),W=cvwrap.clientWidth,H=cvwrap.clientHeight;
 // Avoid equipment bounds as well as previously placed labels.
 const equipment=labelBoxes.map(({it,vw})=>{const w=Math.max(22,(it.w||40)*vw.zoom),h=it.type==='unit'?w*(eqViewOf(it)==='plan'?unitPlanRatio(it):1.8):(it.h||it.w||40)*vw.zoom,spin=it.type==='unit'&&sel===it.id&&pack.unit3d&&eqViewOf(it)==='side'?45:0;return{x:it.x*vw.zoom+vw.ox-w/2,y:it.y*vw.zoom+vw.oy-h/2,w,h:h+spin};});
 const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
 c.save();c.font='650 12px Hanken Grotesk, sans-serif';
 labelBoxes.forEach(({it,vw},idx)=>{
  const selected=sel===it.id,short=it.planRef,size=Number(it.labelScale)||1;c.font='650 '+12*size+'px Hanken Grotesk, sans-serif';
  const text=short+(it.provision==='passive'?' · future':''),w=c.measureText(text).width+18*size,h=26*size,box=equipment[idx],cx=it.x*vw.zoom+vw.ox,cy=it.y*vw.zoom+vw.oy;
  const ys=it.labelPos==='top'?[box.y-h-12,box.y+box.h+12]:[box.y+box.h+12,box.y-h-12];
  const candidates=ys.flatMap(y=>[0,-w-12,w+12].map(dx=>({x:cx-w/2+dx,y,w,h}))).concat([{x:box.x+box.w+16,y:cy-h/2,w,h},{x:box.x-w-16,y:cy-h/2,w,h}]);
  for(const b of candidates){b.x=Math.max(8,Math.min(W-w-8,b.x));b.y=Math.max(8,Math.min(H-h-8,b.y));b.score=occupied.reduce((n,o)=>n+overlap(b,o)*8,0)+equipment.reduce((n,o)=>n+overlap(b,o)*4,0)+Math.hypot(b.x+w/2-cx,b.y+h/2-cy);}
  const b=candidates.sort((a,b)=>a.score-b.score)[0];occupied.push(b);
  if(cx<0||cx>W||cy<0||cy>H)return;referenceHits.push({...b,id:it.id,photo:pack.active});
  c.strokeStyle=selected?'#2563eb':'#8195a5';c.lineWidth=selected?1.5:1;c.beginPath();c.moveTo(cx,cy);c.lineTo(Math.max(b.x,Math.min(b.x+w,cx)),Math.max(b.y,Math.min(b.y+h,cy)));c.stroke();
  c.fillStyle=selected?'#eff5ff':'#fff';rrect(c,b.x,b.y,w,h,5);c.fill();c.strokeStyle=selected?'#2563eb':'#aebdca';c.stroke();c.fillStyle='#183043';c.textAlign='center';c.textBaseline='middle';c.fillText(text,b.x+w/2,b.y+h/2);
 });c.restore();
}
const originalHit=hitTest;
hitTest=function(x,y){if(compact()){const hit=referenceHits.find(b=>b.photo===pack.active&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);if(hit){const it=findItem(hit.id);if(it&&optVisible(it))return it;}}return originalHit(x,y);};
const originalLegend=drawLegend;
drawLegend=function(c,vw,p,k,forExport){
 if(!forExport){drawReferences(c);updateKey(p);legendPillHide();return;}
 return originalLegend(c,vw,p,k,forExport);
};
// The key sits outside the image so it cannot hide a scale reference or equipment.
const keyPanel=document.createElement('aside');keyPanel.id='wbPlanKey';keyPanel.hidden=true;keyPanel.setAttribute('aria-label','Plan key');$('root').querySelector('.workarea').append(keyPanel);
let keySignature='';
function updateKey(p){
 if(keyPanel.hidden)return;
 const rows=p.items.filter(optVisible).filter(i=>i.planRef||i.type==='route'&&ROUTE_DEFS[i.kind]);
 const signature=JSON.stringify(rows.map(i=>[i.id,i.planRef,i.label,i.kind,i.model,i.kw,i.provision]));if(signature===keySignature)return;keySignature=signature;
 keyPanel.innerHTML='<div class="wb-key-heading"><b>Plan key</b><button type="button" class="ev-icon-btn" data-wb-close-key aria-label="Close plan key">×</button></div><div class="wb-key-rows">'+rows.map(it=>'<div><b>'+esc(it.planRef||(ROUTE_DEFS[it.kind]?.short||'Route'))+'</b><span>'+esc(it.planRef?[it.label,itemSummary(it)].filter(Boolean).join(' · '):ROUTE_DEFS[it.kind].name)+'</span></div>').join('')+'</div>';
}
function addDrawingControls(){
 const strip=$('evPlanStrip');if(!strip)return;
 if($('wbDrawingTools')){$('wbLabelMode').value=compact()?'compact':'full';return;}
 const controls=document.createElement('div');controls.id='wbDrawingTools';controls.innerHTML='<label class="wb-label-mode"><span>Labels</span><select id="wbLabelMode" aria-label="On-screen equipment labels"><option value="compact">References</option><option value="full">Full details</option></select></label><button type="button" class="ev-btn" id="wbKeyToggle" aria-expanded="'+!keyPanel.hidden+'" aria-controls="wbPlanKey">Key</button>';
 strip.insertBefore(controls,$('evInspectorToggle'));$('wbLabelMode').value=compact()?'compact':'full';$('wbLabelMode').title='On-screen labels. Exports keep full equipment descriptions.';
 $('wbLabelMode').onchange=e=>{drawing().labels=e.target.value;drawCanvas();};$('wbKeyToggle').onclick=()=>{keyPanel.hidden=!keyPanel.hidden;keySignature='';$('wbKeyToggle').setAttribute('aria-expanded',String(!keyPanel.hidden));if(!keyPanel.hidden&&activePhoto())updateKey(activePhoto());};
}
keyPanel.addEventListener('click',e=>{if(e.target.closest('[data-wb-close-key]')){keyPanel.hidden=true;$('wbKeyToggle')?.setAttribute('aria-expanded','false');$('wbKeyToggle')?.focus();}});
const originalDrawScene=drawScene;
drawScene=function(c,vw,k,forExport){originalDrawScene(c,vw,k,forExport);if(!forExport&&pack.showLegend===false){drawReferences(c);const p=activePhoto();if(p)updateKey(p);}};
// Keep the legend and title beneath exported artwork, clear of survey evidence.
const originalExportCanvas=renderPhotoToCanvas;
renderPhotoToCanvas=function(p,maxW){
 const legend=pack.showLegend,title=pack.showTitleBlock,active=pack.active;let artwork;
 pack.showLegend=false;pack.showTitleBlock=false;
 try{artwork=originalExportCanvas(p,maxW);}finally{pack.showLegend=legend;pack.showTitleBlock=title;pack.active=active;}
 if(legend===false&&title===false)return artwork;
 const W=artwork.width,k=Math.max(.8,W/1100),pad=18*k,fs=12*k,gap=18*k,colCount=W>=900?3:2,colW=(W-pad*2-gap*(colCount-1))/colCount;
 const probe=document.createElement('canvas').getContext('2d');probe.font='500 '+fs+'px Hanken Grotesk, sans-serif';
 function wrap(value,width){const lines=[];let line='';for(const word of String(value||'').split(/\s+/)){if(line&&probe.measureText(line+' '+word).width>width){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);return lines;}
 const rows=legend===false?[]:originalLegend(probe,{zoom:1,ox:0,oy:0},p,1,true,true)||[];
 const heights=Array(colCount).fill(0),entries=rows.map((r,i)=>{const col=i%colCount,lines=wrap(r.name,colW-34*k),y=heights[col];heights[col]+=Math.max(25*k,lines.length*17*k+10*k);return{r,col,y,lines};});
 const titleLines=title===false?[]:wrap([pack.brandName,pack.name||'Untitled project',p.name,pack.jobRef?'Ref '+pack.jobRef:'','Rev '+(pack.rev||'A'),pack.surveyedBy,new Date().toLocaleDateString('en-GB'),p.scale?.pxPerM?'Scale recorded':'Not to scale'].filter(Boolean).join(' · '),W-2*pad);
 const titleH=titleLines.length?titleLines.length*17*k+pad:0,legendH=rows.length?Math.max(...heights)+pad+22*k:0;
 const cn=document.createElement('canvas');cn.width=W;cn.height=Math.ceil(artwork.height+titleH+legendH+pad);const c=cn.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,W,cn.height);c.drawImage(artwork,0,0);c.strokeStyle='#cbd8e2';c.lineWidth=k;c.beginPath();c.moveTo(pad,artwork.height+pad/2);c.lineTo(W-pad,artwork.height+pad/2);c.stroke();
 c.font='500 '+fs+'px Hanken Grotesk, sans-serif';c.textAlign='left';c.textBaseline='top';c.fillStyle='#334f63';titleLines.forEach((line,i)=>c.fillText(line,pad,artwork.height+pad+i*17*k));
 const base=artwork.height+titleH+pad;
 if(rows.length){c.font='650 '+fs+'px Hanken Grotesk, sans-serif';c.fillStyle='#244157';c.fillText('Plan key',pad,base);}
 for(const {r,col,y,lines}of entries){const x=pad+col*(colW+gap),yy=base+22*k+y;
  if(r.route){paintRoute(c,[[x,yy+7*k],[x+23*k,yy+7*k]],r.kind,Math.max(4,ROUTE_DEFS[r.kind].width*.6*k),Math.max(.7,.8*k));}
  else{c.fillStyle=r.color||'#dfe8f0';rrect(c,x,yy,22*k,17*k,3*k);c.fill();c.fillStyle=r.color?labelInk(r.color):'#34566f';c.font='700 '+8*k+'px Hanken Grotesk, sans-serif';c.textAlign='center';c.fillText(r.letter||(r.unitrow?'EV':r.evdb||r.ipevdb||r.cunit?'DB':r.feederrow?'FP':'•'),x+11*k,yy+4*k);c.textAlign='left';}
  c.font='500 '+fs+'px Hanken Grotesk, sans-serif';c.fillStyle='#334f63';lines.forEach((line,i)=>c.fillText(line,x+32*k,yy+i*17*k));
 }
 return cn;
};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!keyPanel.hidden){keyPanel.hidden=true;$('wbKeyToggle')?.setAttribute('aria-expanded','false');}});
installLibrary();renderSide();
window.EVWorkbench={ensureReferences,version:'workbench-r3'};
})();
