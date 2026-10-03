/* Evidence, design options, charging scenarios, expansion and immutable revisions. */
(function(){
'use strict';
const hq=(id,label,tip)=>window.EVHelp?EVHelp.q(id,label,tip):'';
const C=EVPlanningCore,$=id=>document.getElementById(id),h=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=(v,d=1)=>Number(v).toLocaleString('en-GB',{maximumFractionDigits:d});
const money=v=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:2}).format(v);
const button=(text,action,extra='')=>'<button type="button" class="ev-btn" data-evp-action="'+action+'" '+extra+'>'+text+'</button>';
const field=(label,key,value,type='text',extra='')=>'<label class="ev-field">'+label+'<input type="'+type+'" data-evp-field="'+h(key)+'" value="'+h(value)+'" '+extra+'></label>';
// Installer names for plan items: plan reference, label, then the page's own type names.
const typeLabel=item=>{try{if(item.type==='route')return C.kindName(item);if(item.type==='mark'&&typeof MARK_DEFS!=='undefined'&&MARK_DEFS[item.kind])return MARK_DEFS[item.kind].name;if(typeof typeName==='function')return typeName(item);}catch(_){}return C.kindName(item);};
const facts=()=>C.facts(pack,typeLabel);
const evidenceLabel={measured:'Measured',assumed:'Assumed',missing:'Missing'};
const evidencePill=status=>'<span class="evp-pill evp-evidence '+status+'">'+evidenceLabel[status]+'</span>';
const kindLabel={added:'Added',changed:'Changed',removed:'Removed',moved:'Moved',site:'Site detail',plan:'Plan detail',scale:'Plan scale',image:'Plan image',branding:'Branding',programme:'Programme',phases:'Phases',assignments:'Phase assignment'};
const siteFieldLabel={name:'Project name',address:'Site address',postcode:'Postcode',jobRef:'Job reference',rev:'Revision',earthing:'Earthing arrangement',supplyRating:'Supply rating',ze:'Ze',mainFuse:'Main fuse',capacityNote:'Capacity note',notes:'Notes',engineerNote:'Engineer note',custName:'Client',surveyedBy:'Project lead',surveyDate:'Survey date',brandName:'Company name',replyEmail:'Reply email',replyPhone:'Reply phone'};
const changeLabel=c=>c.kind==='site'?(siteFieldLabel[c.label]||c.label):c.label;
const hasSnapshots=()=>lab().options.length+lab().revisions.length>0;
// Next survey action wording names the place where the value is entered.
function nextActionText(f){
 if(f.present)return 'Record the source, person and date behind this assumption.';
 const field=f.target.field;
 if(field==='earthing')return 'Record the earthing arrangement in Markup > Plan settings > Site.';
 if(field==='supplyRating')return 'Record the supply rating in Markup > Plan settings > Site.';
 if(field==='ze')return 'Enter the measured Ze in Cable calculations.';
 if(field==='address')return 'Add the site address in the project details.';
 if(f.key.startsWith('scale:'))return 'Set the plan scale in Markup with Set scale.';
 return /length/.test(f.label)?'Set the plan scale or type the measured length for this route in Markup.':'Record the charger power for this item in Markup.';
}
const tabs=[['evidence','Survey evidence'],['compare','Design options'],['impact','Change impact'],['charging','Charging day'],['phases','Expansion & replay'],['revisions','Revision history'],['review','Technical review']];
let tab='evidence',baselineId='',revisionId='',phaseIndex=0,previewToken=0,timer=null,overlay=false,simulation=null,recoveryRows=[],busy=false;
let projectSeen=null;
const lab=()=>C.ensure(pack);
function resetProject(){if(projectSeen!==pack.projId){projectSeen=pack.projId;baselineId='';revisionId='';phaseIndex=0;simulation=null;stopReplay();}}
function entry(id){return [...lab().options,...lab().revisions].find(r=>r.id===id);}
function source(id){const e=entry(id);return e?C.hydrate(e.snapshot,lab().assets):null;}
function error(message){let el=$('evpMessage');if(el){el.textContent=message;el.hidden=false;el.focus();}else toast(message);}
function refresh(){if(EVWorkspace.route()==='planning')EVWorkspace.refresh();else drawCanvas();}
async function saved(){const ok=await EVWorkspace.persist();if(!ok)throw Error('These edits are still in this tab. Resolve the save conflict or download a backup.');return ok;}
function render(){
 resetProject();const body={evidence:evidencePage,compare:comparisonPage,impact:impactPage,charging:chargingPage,phases:phasesPage,revisions:revisionsPage,review:reviewPage}[tab]();
 return (window.EVWorkspace?.pageHead?EVWorkspace.pageHead('Design lab','Explore choices, keep their evidence and trace how your design changes.',button('Open markup','markup'),'planning'):'<div class="ev-heading"><div><div class="ev-eyebrow">PLAN · COMPARE · VERIFY</div><h1>Design lab</h1><p>Explore choices, keep their evidence and trace how your design changes.</p></div>'+button('Open markup','markup')+'</div>')+'<nav class="evp-tabs" aria-label="Design lab sections">'+tabs.map(([key,label])=>'<button class="ev-btn '+(tab===key?'primary':'')+'" data-evp-tab="'+key+'" '+(tab===key?'aria-current="page"':'')+'>'+label+'</button>').join('')+'</nav><p id="evpMessage" class="evp-message" role="alert" tabindex="-1" hidden></p>'+body;
}
function evidencePage(){
 const list=facts(),counts=Object.fromEntries(['measured','assumed','missing'].map(st=>[st,list.filter(r=>r.status===st).length])),next=list.find(r=>r.status==='missing')||list.find(r=>r.status==='assumed');
 const openLabel=next&&next.target.field==='ze'?'Open cable calculations':'Open this item';
 return '<div class="ev-stats">'+Object.entries(counts).map(([key,value])=>'<div class="ev-stat '+key+(value?'':' none')+'"><label>'+h(evidenceLabel[key])+'</label><b>'+value+'</b></div>').join('')+'</div><section class="ev-card"><div class="ev-card-head"><h2>Next survey action'+hq('survey-checklist','About survey evidence','lab-evidence')+'</h2>'+button(overlay?'Hide evidence overlay':'Show evidence on markup','overlay')+'</div><div class="ev-card-body"><p>'+(next?'Check '+h(next.label)+'. '+h(nextActionText(next)): 'Evidence is recorded for all listed values. Review it when the design changes.')+'</p>'+(next?button(openLabel,'locate','data-key="'+h(next.key)+'"'):'')+'<p class="evp-help">Measured means a person has recorded supporting evidence. Changed values become assumptions again. This is an evidence record, not an independent engineering approval.</p></div></section>'+cableCard()+'<section class="ev-card"><div class="ev-card-head"><h2>Evidence register</h2></div><div class="evp-evidence-list">'+list.map(f=>'<details class="evp-evidence-row"><summary>'+evidencePill(f.status)+'<b>'+h(f.label)+'</b><span>'+h(typeof f.display==='number'?number(f.display,3):f.display)+'</span>'+(f.stale?'<small>Value changed since evidence was recorded</small>':'')+'</summary><form data-evp-evidence="'+h(f.key)+'"><div class="evp-form-grid"><label class="ev-field">Evidence status<select name="status">'+['assumed','measured','missing'].map(st=>'<option value="'+st+'" '+(lab().evidence[f.key]?.status===st?'selected':'')+'>'+evidenceLabel[st]+'</option>').join('')+'</select></label><label class="ev-field">Source / measurement reference<input name="source" value="'+h(f.source)+'" maxlength="1000" placeholder="Instrument, drawing or photo reference"></label><label class="ev-field">Recorded by<input name="by" value="'+h(f.by)+'" maxlength="200"></label><label class="ev-field">Evidence date<input name="date" type="date" value="'+h(f.date)+'"></label></div><div class="ev-actions"><button class="ev-btn primary" type="submit">Save evidence</button>'+button('Open value on project','locate','data-key="'+h(f.key)+'"')+'</div></form></details>').join('')+'</div></section>';
}
// Cable calculations summary: the same counts as the Markup panel card, with a way into the dialog.
function cableCard(){
 let rows=[],routes=0;try{rows=typeof cableCheckData==='function'?cableCheckData():[];routes=C.rows(pack).filter(r=>r.item.type==='route'&&C.visible(pack,r.item)&&!['__area','hedge','fence','wallline','heras','cones'].includes(r.item.kind)).length;}catch(_){}
 const n=st=>rows.filter(r=>r.st===st).length,chips=[['ok','pass'],['warn','near limit'],['fail','failing'],['nolen','incomplete'],['tbc','type TBC']].map(([st,label])=>[st,n(st),label]).filter(c=>c[1]);
 const body=rows.length?'<div class="evp-cc-chips">'+chips.map(([st,count,label])=>'<span class="evp-pill evp-cc '+st+'">'+count+' '+label+'</span>').join('')+'</div><p>'+rows.length+' sized cable run'+(rows.length===1?'':'s')+' on the plans. Results are a sizing aid, not a design approval.</p>'
  :'<p>'+(routes?'No sized cable runs yet. The '+routes+' route'+(routes===1?' on the plans is':'s on the plans are')+' groundworks, containment or other cable, which the calculations do not size.':'No routes drawn yet.')+' Draw an SWA, Hi-Tuff or cable run in Markup to size it.</p>';
 return '<section class="ev-card"><div class="ev-card-head"><h2>Cable calculations</h2>'+button('Open cable calculations','open-calcs')+'</div><div class="ev-card-body">'+body+'</div></section>';
}
function snapshotSelector(selected,attribute,placeholder){
 return '<select '+attribute+' aria-label="'+h(placeholder)+'"><option value="">'+h(placeholder)+'</option>'+[...lab().options,...lab().revisions].map(r=>'<option value="'+h(r.id)+'" '+(r.id===selected?'selected':'')+'>'+h(r.name)+' · '+h(new Date(r.at).toLocaleDateString('en-GB'))+'</option>').join('')+'</select>';
}
function comparisonPage(){
 if(!baselineId&&lab().options.length)baselineId=lab().options[0].id;
 const base=source(baselineId),current=C.quantities(pack),before=base&&C.quantities(base),rates=lab().costs;
 const metrics=[['Chargers','chargers',''],['Charging ports','ports',''],['Passive positions','passive',''],['Recorded equipment ratings','ratedKw',' kW'],['Measured cable','cable',' m'],['Measured trenching','trench',' m'],['Measured ducting','duct',' m'],['Unmeasured routes','unknown','']];
 return '<section class="ev-card"><div class="ev-card-head"><h2>Save and compare a design'+hq('planner-pages','About design options','lab-compare')+'</h2></div><div class="ev-card-body"><div class="evp-inline"><label class="ev-field">Option name<input id="evpOptionName" maxlength="120" placeholder="For example: shorter trench route"></label>'+button('Save current design as an option','capture-option')+'</div><p class="evp-help">Snapshots preserve plans, equipment, assumptions and geometry. Edit the current project, then compare it with any saved option.</p>'+(hasSnapshots()?'<label class="ev-field">Compare current design with'+snapshotSelector(baselineId,'data-evp-baseline','Choose a saved design')+'</label>':'')+(base?'<div class="ev-table-wrap"><table class="ev-table"><thead><tr><th>Quantity</th><th>'+h(entry(baselineId).name)+'</th><th>Current design</th><th>Change</th></tr></thead><tbody>'+metrics.map(([label,key,suffix])=>'<tr><th>'+label+'</th><td>'+number(before[key])+suffix+'</td><td>'+number(current[key])+suffix+'</td><td>'+((current[key]-before[key])>0?'+':'')+number(current[key]-before[key])+suffix+'</td></tr>').join('')+'</tbody></table></div>':'<p>Save an option to begin comparing.</p>')+'<p class="evp-help">Equipment ratings are not a verified supply requirement. Unmeasured routes are excluded from metre totals. Select one drawing option in Markup when A/B/C alternatives share a plan.</p></div></section><section class="ev-card"><div class="ev-card-head"><h2>Indicative cost assumptions</h2>'+button('Download comparison CSV','export-comparison')+'</div><div class="ev-card-body"><div class="evp-form-grid">'+[['charger','Per charger (£)'],['cable','Cable per metre (£)'],['trench','Trenching per metre (£)'],['duct','Ducting per metre (£)']].map(([key,label])=>field(label,'costs.'+key,rates[key],'number','min="0" step="0.01"')).join('')+'</div><div class="evp-costs">'+(base?costCard(entry(baselineId).name,C.cost(base,rates)):'')+costCard('Current design',C.cost(pack,rates))+'</div><p class="evp-help">User-entered uniform rates, excluding VAT, labour beyond the entered rates, supply upgrades and other equipment. Missing rates and lengths remain explicit; these totals are not quotations.</p></div></section>'+snapshotList(lab().options,'option');
}
// A total of £0.00 with no rates looks like a real figure, so an unpriced design says what to do instead.
function costCard(name,c){
 if(!c.total&&c.missing.length)return '<div class="evp-cost-empty"><b>'+h(name)+'</b><p>Enter rates above to see an indicative total.</p><small>Missing: '+h(c.missing.join(', '))+'</small></div>';
 return '<div><b>'+h(name)+'</b>'+(c.complete?'':'<span class="evp-partial">Partial total</span>')+'<strong>'+money(c.total)+'</strong><small>'+(c.complete?'All listed quantities priced':'Missing: '+h(c.missing.join(', ')))+'</small></div>';
}
function snapshotList(list,kind){return '<section class="ev-card"><div class="ev-card-head"><h2>Saved '+(kind==='option'?'options':'revisions')+'</h2></div><div class="ev-card-body">'+(list.length?'<div class="evp-snapshots">'+list.slice().reverse().map(r=>'<article><div><b>'+h(r.name)+'</b><small>'+h(new Date(r.at).toLocaleString('en-GB'))+(r.file?' · '+h(r.file):'')+'</small></div><div class="ev-actions">'+button('Compare with current','compare-entry','data-id="'+h(r.id)+'"')+button('Open as new project','restore','data-id="'+h(r.id)+'"')+button('Remove snapshot','remove-snapshot','data-id="'+h(r.id)+'"')+'</div></article>').join('')+'</div>':'<p>No snapshots saved yet.</p>')+'</div></section>';}
function impactPage(){
 if(!hasSnapshots())return '<section class="ev-card"><div class="ev-card-head"><h2>What needs revisiting?</h2></div><div class="ev-card-body evp-empty"><p><b>No baseline yet.</b> One is created when you save an option or revision, or when you download a document from Issue.</p><div class="ev-actions"><button type="button" class="ev-btn primary" data-evp-action="start-revision">Save a revision</button>'+button('Go to Design options','go-compare','data-variant="link"')+'</div><p class="evp-help">Change impact then lists the site, drawing, equipment and programme changes since that baseline, and the connected circuits to recheck.</p></div></section>';
 if(!baselineId)baselineId=lab().revisions.at(-1)?.id||lab().options[0]?.id||'';
 const base=source(baselineId),changes=base?C.differences(base,pack):[],affected=[...new Set(changes.flatMap(c=>c.affects))],circuits=base?C.affectedCircuits(base,pack,changes):[];
 const documents=lab().revisions.filter(r=>r.kind==='document').map(r=>({record:r,changes:C.differences(C.hydrate(r.snapshot,lab().assets),pack)})).filter(r=>r.changes.length);
 return '<section class="ev-card"><div class="ev-card-head"><h2>What needs revisiting?</h2></div><div class="ev-card-body"><label class="ev-field">Compare against'+snapshotSelector(baselineId,'data-evp-baseline','Choose a previous design')+'</label><p>'+(base?changes.length+' recorded change'+(changes.length===1?'':'s')+' since '+h(entry(baselineId).name)+'.':'Choose a saved option or revision to compare against.')+'</p><div class="evp-tags">'+affected.map(t=>'<span>'+h(t)+'</span>').join('')+'</div>'+(circuits.length?'<h3>Connected circuits to recheck</h3><div class="ev-actions">'+circuits.map(r=>button(h(r.label),'locate-item','data-id="'+h(r.id)+'"')).join('')+'</div>':'')+(documents.length?'<h3>Downloaded documents with later design changes</h3><ul>'+documents.map(d=>'<li>'+h(d.record.name)+' · '+d.changes.length+' changes '+button('Show changes','compare-entry','data-id="'+h(d.record.id)+'"')+'</li>').join('')+'</ul>':'')+'<p class="evp-help">This is a conservative list of records to recheck. It does not predict engineering approval or automatically reissue documents.</p>'+(base?'<canvas id="evpPlanPreview" role="img" aria-label="Current plan with added, removed and changed items highlighted"></canvas><p class="evp-help">Green: added · amber: changed · red outline: removed. The table below contains the same changes.</p>':'')+'<div class="evp-change-list">'+changes.map(c=>'<article><span class="evp-pill evp-kind '+(['added','changed','removed'].includes(c.kind)?c.kind:'other')+'">'+h(kindLabel[c.kind]||c.kind)+'</span><div><b>'+h(changeLabel(c))+'</b><p>'+h(c.affects.join(' · '))+'</p></div>'+(c.target.itemId&&C.rows(pack).some(r=>r.item.id===c.target.itemId)?button('Open item','locate-item','data-id="'+h(c.target.itemId)+'"'):'')+'</article>').join('')+'</div>'+(base&&!changes.length?'<p>No tracked site, drawing, equipment or programme changes.</p>':'')+'</div></section>';
}
// Times are stored as decimal hours (backups and the model use them); the page shows device time pickers in five-minute steps.
const hoursToTime=v=>{const n=Number(v);if(v===''||v==null||!Number.isFinite(n))return '';const m=Math.round(n*60)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');};
const timeToHours=v=>{const m=/^(\d{1,2}):(\d{2})/.exec(v||'');if(!m)return null;const minutes=Math.round((Number(m[1])*60+Number(m[2]))/5)*5;return Math.min(24,minutes/60);};
const sourceLabel={markup:'From markup',site:'From site details',simulator:'From Markup simulator',rule:'Rule of thumb: 35% of the supply',assumed:'Assumed',default:'Starting value',edited:'Edited'};
function sourceNote(s,key){
 const from=s.sources?.[key];if(!from)return '';
 if(key==='supplyKw'&&from==='assumed'){const b=C.supplyBasis(pack);return '<span class="evp-source-row" id="evpSrc-'+key+'"><span class="evp-pill evp-evidence assumed">Assumed</span> No supply rating recorded: '+b.amps+' A at 230 V. <button type="button" class="evp-link" data-evp-action="record-supply">Record supply rating</button></span>';}
 if(key==='supplyKw'&&from==='site'){const b=C.supplyBasis(pack);return '<span class="evp-source-row" id="evpSrc-'+key+'"><span class="evp-pill evp-source">From site details</span> '+b.amps+' A at 230 V</span>';}
 if(key==='baseKw'&&from==='rule'&&pack.mode==='domestic')return '<span class="evp-source-row" id="evpSrc-'+key+'"><span class="evp-pill evp-source">Typical household evening load</span></span>';
 return '<span class="evp-source-row" id="evpSrc-'+key+'"><span class="evp-pill evp-source'+(from==='edited'?' edited':'')+'">'+h(sourceLabel[from]||from)+'</span></span>';
}
function simField(s,key,label,min,max,step){
 const note=sourceNote(s,key);
 return '<div class="evp-sim-field"><label class="ev-field">'+label+'<input type="number" data-evp-field="simulation.'+key+'" value="'+h(s[key])+'" min="'+min+'" max="'+max+'" step="'+step+'"'+(note?' aria-describedby="evpSrc-'+key+'"':'')+'></label>'+note+'</div>';
}
const timeField=(s,key,label)=>'<div class="evp-sim-field"><label class="ev-field">'+label+'<input type="time" step="300" class="evp-time" data-evp-time="simulation.'+key+'" value="'+h(hoursToTime(s[key]))+'"></label></div>';
function chargingPage(){
 C.syncSimulation(pack);const s=lab().simulation,control=s.chargerControl==='uncapped'?'uncapped':'shared';
 const sessionCell=(r,key,label)=>{const time=key==='arrival'||key==='departure',name=key==='name';return '<td data-label="'+label+'"><input aria-label="'+h(label+(name?'':' for '+r.name))+'" data-evp-session="'+h(r.id)+'" data-key="'+key+'" type="'+(time?'time':name?'text':'number')+'" value="'+h(time?hoursToTime(r[key]):r[key])+'" '+(time?'step="300" class="evp-time"':name?'maxlength="100"':'step="any"')+'></td>';};
 return '<section class="ev-card"><div class="ev-card-head"><h2>Charging-day assumptions'+hq('dlm-plain','About charging-day scenarios','lab-charging')+'</h2><button type="button" class="ev-btn primary" data-evp-action="simulate">Run scenario</button></div><div class="ev-card-body"><p>The charging model for this project. It starts from the chargers on the markup and the recorded supply; change any value to explore delivered energy, queues, tariffs and the supply.</p><div class="evp-form-grid">'
  +simField(s,'ports','Charging ports',1,200,1)+simField(s,'portKw','Maximum per port (kW)',0.1,1000,0.1)+simField(s,'supplyKw','Site power limit (kW)',0,10000,0.1)+simField(s,'baseKw','Other site demand (kW)',0,10000,0.1)
  +'<div class="evp-sim-field"><label class="ev-field">Charger control<select data-evp-field="simulation.chargerControl"><option value="shared" '+(control==='shared'?'selected':'')+'>Load management: share the supply</option><option value="uncapped" '+(control==='uncapped'?'selected':'')+'>Uncapped: each charger at full power</option></select></label>'+sourceNote(s,'chargerControl')+'</div>'
  +simField(s,'efficiency','Charging efficiency (%)',1,100,1)+simField(s,'offPeak','Off-peak tariff (£/kWh)',0,20,0.01)+simField(s,'peak','Peak tariff (£/kWh)',0,20,0.01)+timeField(s,'peakStart','Peak starts')+timeField(s,'peakEnd','Peak ends')
  +'</div><p class="evp-help">Departures earlier than arrivals are on the next day. Equal peak start and end means no peak period. Modelled at 230 V with no diversity: the site power limit is an assumption for exploring options, not a capacity calculation.</p></div></section><section class="ev-card"><div class="ev-card-head"><h2>Vehicle arrivals</h2>'+button('Add arrival group','add-session')+'</div><div class="ev-card-body"><div class="ev-table-wrap"><table class="ev-table evp-arrivals"><thead><tr><th>Group</th><th>Vehicles</th><th>Arrival</th><th>Departure</th><th>Battery energy each (kWh)</th><th>Vehicle limit (kW)</th><th><span class="ed-sr-only">Actions</span></th></tr></thead><tbody>'+s.sessions.map(r=>'<tr>'+sessionCell(r,'name','Group name')+sessionCell(r,'count','Vehicles')+sessionCell(r,'arrival','Arrival')+sessionCell(r,'departure','Departure')+sessionCell(r,'kwh','Battery energy each (kWh)')+sessionCell(r,'maxKw','Vehicle limit (kW)')+'<td>'+button('Remove','remove-session','data-id="'+h(r.id)+'"')+'</td></tr>').join('')+'</tbody></table></div><p class="evp-help">Five-minute time steps, first-arrival queue, equal sharing up to vehicle limits, constant background demand. Vehicles release their port when their requested energy is delivered. Phase wiring, real charger control protocols and tariff standing charges are outside this model.</p></div></section><div id="evpSimulationResult">'+(simulation?simulationHTML(simulation):'<p class="evp-help">Run the scenario to calculate results from these assumptions.</p>')+'</div>';
}
// One chart style for both charging views: light panel, page font, labels at 12px, legend row above.
const CHART={ink:'#435867',grid:'rgba(67,88,103,.2)',charge:'#2167e8',chargeFill:'rgba(33,103,232,.32)',base:'rgba(101,121,138,.5)',supply:'#b0392f',peak:'rgba(183,121,31,.13)',peakKey:'rgba(183,121,31,.4)',queue:'#b7791f'};
function chartWidth(){const box=$('evpSimulationResult')||$('evScreen');return Math.max(240,Math.min(1100,Math.round((box?.clientWidth||900)-44)));}
function simulationChart(r,s){
 const t=r.totals,W=chartWidth(),H=W<520?240:280,narrow=W<520,padL=narrow?40:48,padR=narrow?12:18,padT=28,padB=44,iw=W-padL-padR,ih=H-padT-padB;
 const supply=t.supplyKw,base=t.baseKw,assumed=s.sources?.supplyKw==='assumed';
 const raw=Math.max(supply,t.peakSiteKw,1)*1.12,stepY=[1,2,5,10,20,25,50,100,200,250,500,1000,2000].find(v=>raw/v<=6)||5000,maxY=Math.ceil(raw/stepY)*stepY;
 const X=hour=>padL+hour/r.horizon*iw,Y=kw=>padT+ih*(1-Math.min(kw,maxY)/maxY),step=1/12,f=v=>v.toFixed(1);
 const peakOn=Number(s.peak)!==Number(s.offPeak)&&Number(s.peakStart)!==Number(s.peakEnd);
 const band=(test,fill,y0,height)=>{let out='',from=null;r.series.forEach((x,i)=>{const on=test(x);if(on&&from==null)from=x.hour;if((!on||i===r.series.length-1)&&from!=null){const to=on?x.hour+step:x.hour;out+='<rect x="'+f(X(from))+'" y="'+f(y0)+'" width="'+f(X(to)-X(from))+'" height="'+f(height)+'" fill="'+fill+'"/>';from=null;}});return out;};
 const peakBands=peakOn?band(x=>x.tariff===Number(s.peak),CHART.peak,padT,ih):'';
 const queueBands=band(x=>x.queued>0,CHART.queue,padT+ih+3,5);
 let grid='';for(let v=0;v<=maxY+1e-9;v+=stepY){const y=Y(v);grid+='<line x1="'+padL+'" x2="'+(W-padR)+'" y1="'+f(y)+'" y2="'+f(y)+'" stroke="'+CHART.grid+'"/><text x="'+(padL-6)+'" y="'+f(y+4)+'" text-anchor="end">'+number(v)+'</text>';}
 let ticks='';for(let hr=0;hr<=r.horizon+1e-9;hr+=3){const x=X(hr);ticks+='<line x1="'+f(x)+'" x2="'+f(x)+'" y1="'+padT+'" y2="'+(padT+ih)+'" stroke="'+CHART.grid+'"/>'+(narrow&&hr%6?'':'<text x="'+f(Math.min(W-padR-16,Math.max(padL+16,x)))+'" y="'+(H-18)+'" text-anchor="middle">'+String(hr%24).padStart(2,'0')+':00</text>');}
 const pts=r.series.map(x=>[X(x.hour),Y(x.siteKw)]),end=X(r.series.at(-1).hour+step);
 const siteLine=pts.map(([x,y],i)=>(i?'L':'M')+f(x)+' '+f(y)).join(' ')+' L'+f(end)+' '+f(pts.at(-1)[1]);
 const chargeArea='M'+f(X(0))+' '+f(Y(0))+' '+pts.map(([x,y])=>'L'+f(x)+' '+f(y)).join(' ')+' L'+f(end)+' '+f(pts.at(-1)[1])+' L'+f(end)+' '+f(Y(0))+' Z';
 const baseArea='<rect x="'+f(X(0))+'" y="'+f(Y(base))+'" width="'+f(end-X(0))+'" height="'+f(Y(0)-Y(base))+'" fill="'+CHART.base+'"/>';
 const ys=Y(supply),supplyText=(assumed?'Assumed supply ':'Supply ')+number(supply)+' kW';
 const legend='<div class="sim-legend evp-legend" aria-hidden="true"><span><i style="background:'+CHART.base+'"></i>Other site demand</span><span><i style="background:'+CHART.chargeFill+'"></i>With charging</span><span><i class="ln" style="border-top-color:'+CHART.supply+'"></i>'+supplyText+'</span>'+(peakOn?'<span><i style="background:'+CHART.peakKey+'"></i>Peak tariff</span>':'')+(queueBands?'<span><i style="background:'+CHART.queue+';height:5px"></i>Vehicles waiting</span>':'')+'</div>';
 const label='Site demand across '+r.horizon+' hours: other demand '+number(base)+' kW plus charging, peaking at '+number(t.peakSiteKw)+' kilowatts against '+(assumed?'an assumed ':'a ')+number(supply)+' kilowatt supply.'+(t.overSupplyHours>0?' Over the supply for '+number(t.overSupplyHours)+' hours.':'');
 return legend+'<svg class="evp-chart" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+h(label)+'">'+peakBands+grid+ticks+'<path d="'+chargeArea+'" fill="'+CHART.chargeFill+'"/>'+baseArea+'<path d="'+siteLine+'" fill="none" stroke="'+CHART.charge+'" stroke-width="2"/><line x1="'+padL+'" x2="'+(W-padR)+'" y1="'+f(ys)+'" y2="'+f(ys)+'" stroke="'+CHART.supply+'" stroke-width="1.6" stroke-dasharray="6 4"/><text x="'+(W-padR)+'" y="'+f(Math.max(padT+11,ys-6))+'" text-anchor="end" class="evp-chart-strong">'+h(supplyText)+'</text>'+queueBands+'<text x="'+(padL-6)+'" y="'+(padT-14)+'" text-anchor="end">kW</text><line x1="'+padL+'" x2="'+(W-padR)+'" y1="'+(padT+ih)+'" y2="'+(padT+ih)+'" stroke="#8599a7"/></svg>';
}
function simulationHTML(r){
 const t=r.totals,s=lab().simulation,assumed=s.sources?.supplyKw==='assumed',over=t.overSupplyHours>0;
 // A pass is only shown in green when the supply is recorded or entered; on the built-in fallback it stays neutral.
 const verdict=over?['bad','Over supply for '+number(t.overSupplyHours)+' h']:assumed?['neutral','Within assumed supply']:['ok','Within supply'];
 const peakText=number(t.peakSiteKw)+' kW of '+number(t.supplyKw)+' kW'+(assumed?' (assumed)':'');
 const offPeakShare=t.gridKwh?Math.round(r.series.filter(x=>x.tariff===Number(s.offPeak)).reduce((a,x)=>a+x.gridKw/12,0)/t.gridKwh*100):0;
 const tiles=[['Peak site demand',peakText,over?'bad':verdict[0]],['Verdict',verdict[1],verdict[0]],['Battery energy delivered',number(t.delivered)+' kWh'],['Unserved energy',number(t.shortfall)+' kWh'],['Vehicles short of target',t.unserved],['Energy cost',money(t.cost)],['Longest queue',number(Math.max(0,...r.sessions.map(x=>x.queuedMinutes)))+' min'],['Peak charging power',number(t.peakKw)+' kW']];
 return '<section class="ev-card"><div class="ev-card-head"><h2>Scenario result</h2>'+button('Download results CSV','export-simulation')+'</div><div class="ev-card-body"><div class="ev-stats evp-sim-stats">'+tiles.map(([label,value,tone])=>'<div class="ev-stat'+(tone?' evp-verdict '+tone:'')+'"><label>'+label+'</label><b>'+h(value)+'</b></div>').join('')+'</div><p class="evp-sim-cost">'+(t.gridKwh>0.05?number(t.gridKwh)+' kWh from the grid · '+money(t.cost)+' for the day as modelled'+(Number(s.peak)!==Number(s.offPeak)?' · '+offPeakShare+'% at the off-peak rate.':'.'):'No charging energy drawn in this scenario. Check the vehicles, arrival times and supply.')+(t.uncapped?' Uncapped: every charger draws its full rate on arrival.':' Load management shares the supply left after other demand.')+'</p>'+simulationChart(r,s)+'<p class="evp-help">Grid energy includes the entered charging losses. Modelled at 230 V per phase with no diversity; the site power limit is an assumption, not a capacity calculation.</p><details><summary>Per-vehicle results</summary><div class="ev-table-wrap"><table class="ev-table"><thead><tr><th>Vehicle</th><th>Delivered (kWh)</th><th>Shortfall (kWh)</th><th>Queue (min)</th><th>Cost</th></tr></thead><tbody>'+r.sessions.map(x=>'<tr><th>'+h(x.name)+'</th><td>'+number(x.delivered)+'</td><td>'+number(x.shortfall)+'</td><td>'+number(x.queuedMinutes)+'</td><td>'+money(x.cost)+'</td></tr>').join('')+'</tbody></table></div></details></div></section>';
}
function phasesPage(){
 const l=lab();phaseIndex=Math.min(phaseIndex,l.phases.length-1);const phase=l.phases[phaseIndex],q=C.quantities(C.phasePack(pack,phaseIndex)),activities=pack.programme?.activities||[];
 return '<section class="ev-card"><div class="ev-card-head"><h2>Installation phases'+hq('choose-chargers','About phases','lab-phases')+'</h2>'+button('Add phase','add-phase')+'</div><div class="ev-card-body"><div class="evp-phases">'+l.phases.map((p,n)=>'<fieldset><legend>Phase '+(n+1)+'</legend><label class="ev-field">Name<input data-evp-phase="'+h(p.id)+'" data-key="name" value="'+h(p.name)+'" maxlength="100"></label><label class="ev-field">Target date<input type="date" data-evp-phase="'+h(p.id)+'" data-key="date" value="'+h(p.date)+'"></label><label class="ev-field">Assumed available charging capacity (kW)<input type="number" min="0" step="0.1" data-evp-phase="'+h(p.id)+'" data-key="capacityKw" value="'+h(p.capacityKw)+'"></label><label class="ev-field">Spare duct allowance (m)<input type="number" min="0" step="0.1" data-evp-phase="'+h(p.id)+'" data-key="spareDuctM" value="'+h(p.spareDuctM||'')+'"></label><label class="ev-field">Programme activity<select data-evp-phase="'+h(p.id)+'" data-key="activityId"><option value="">No activity linked</option>'+activities.map(a=>'<option value="'+h(a.id)+'" '+(a.id===p.activityId?'selected':'')+'>'+h(a.name)+'</option>').join('')+'</select></label>'+(n?button('Remove phase','remove-phase','data-id="'+h(p.id)+'"'):'')+'</fieldset>').join('')+'</div></div></section><section class="ev-card"><div class="ev-card-head"><h2>Site replay</h2>'+button(timer?'Pause replay':'Play phases','replay')+'</div><div class="ev-card-body"><label class="ev-field">Visible phase<input id="evpPhaseSlider" type="range" min="0" max="'+(l.phases.length-1)+'" step="1" value="'+phaseIndex+'" aria-valuetext="'+h(phase.name)+'"></label><div id="evpPhaseSummary">'+phaseSummary(phase,q)+'</div><canvas id="evpPlanPreview" role="img" aria-label="Plan showing equipment and routes through the selected installation phase"></canvas><p class="evp-help">Replay uses the recorded plan and phase assignments. Capacity and spare duct values are planning assumptions; passive positions remain passive until their recorded provision changes.</p></div></section><section class="ev-card"><div class="ev-card-head"><h2>Assign equipment and routes</h2></div><div class="ev-card-body"><div class="ev-table-wrap"><table class="ev-table"><thead><tr><th>Item</th><th>Plan</th><th>Installed in phase</th><th></th></tr></thead><tbody>'+phaseRows().map(({photo,item,name})=>'<tr><th>'+h(name)+'</th><td>'+h(photo.name)+'</td><td><select aria-label="Phase for '+h(name)+'" data-evp-assignment="'+h(item.id)+'">'+l.phases.map(p=>'<option value="'+h(p.id)+'" '+((l.assignments[item.id]||l.phases[0].id)===p.id?'selected':'')+'>'+h(p.name)+'</option>').join('')+'</select></td><td>'+button('Open','locate-item','data-id="'+h(item.id)+'"')+'</td></tr>').join('')+'</tbody></table></div></div></section>';
}
// Items that are installed: equipment and routes, plus the supply and consumer unit marks. North arrows and snag pins are not assigned to a phase.
function phaseRows(){
 const names=C.itemNames({...pack,optionView:'all'},typeLabel);
 return C.rows(pack).filter(({item})=>['unit','route','cutout','feeder','evdb'].includes(item.type)||item.type==='mark'&&!['north','snag'].includes(item.kind)).filter(({item})=>!(item.type==='route'&&['__area','hedge','fence','wallline','heras','cones'].includes(item.kind))).map(r=>({...r,name:names.get(r.item.id)||typeLabel(r.item)}));
}
function phaseSummary(p,q){
 const capacity=p.capacityKw===''||p.capacityKw==null?null:Number(p.capacityKw),activity=(pack.programme?.activities||[]).find(a=>a.id===p.activityId);
 return '<h3>'+h(p.name)+'</h3><p>'+q.chargers+' chargers · '+q.ports+' ports · '+q.passive+' passive positions · '+number(q.cable)+' m measured cable · '+number(q.trench)+' m trench · '+number(q.duct)+' m duct</p><p>'+(capacity==null?'Charging capacity not recorded.':'Recorded equipment ratings '+number(q.ratedKw)+' kW; assumed capacity '+number(capacity)+' kW. '+(q.ratedKw>capacity?'Rated demand exceeds the assumption; explore load management in Charging day.':'Verify capacity and simultaneous demand before design approval.'))+(q.unknown?' '+q.unknown+' routes need measurement.':'')+'</p>'+(p.spareDuctM!==''&&p.spareDuctM!=null?'<p>Spare duct allowance: '+number(p.spareDuctM)+' m (recorded assumption).</p>':'')+(activity?'<p>Programme: '+h(activity.name)+' · '+h(activity.start||p.date||'date not set')+' · '+h(activity.days||'?')+' working days</p>':'');
}
function revisionsPage(){
 if(!revisionId)revisionId=lab().revisions.at(-1)?.id||'';
 const r=entry(revisionId);
 return '<section class="ev-card"><div class="ev-card-head"><h2>Keep an immutable design revision'+hq('planner-pages','About revisions','lab-revisions')+'</h2></div><div class="ev-card-body"><div class="evp-inline"><label class="ev-field">Revision name<input id="evpRevisionName" maxlength="120" placeholder="For example: quotation issued, revision B"></label>'+button('Save revision','capture-revision')+'</div><p>Snapshots preserve the design and its plan images. Opening a snapshot creates a separate project. A downloaded document also records the design captured when its PDF was prepared.</p><p class="evp-help">Snapshots are included in project backups. A download records neither sending nor approval; retain the original downloaded PDF as the issued document.</p>'+(hasSnapshots()?'<label class="ev-field">Preview saved revision'+snapshotSelector(revisionId,'data-evp-revision','Choose a saved revision')+'</label>':'')+''+(r?'<p>'+h(r.name)+' · '+h(new Date(r.at).toLocaleString('en-GB'))+'</p><canvas id="evpPlanPreview" role="img" aria-label="Saved revision plan preview"></canvas>':'')+'</div></section>'+snapshotList(lab().revisions,'revision');
}
const reviewTopics=[
 ['ampacity','Cable current ratings and derating','Cable families, installation methods, ambient/grouping factors, buried correction and CPC sizing.'],
 ['voltage','Voltage drop and upstream topology','mV/A/m tables, phase assumptions, lengths, supply origin, upstream paths and disconnected circuits.'],
 ['protection','Fault protection and TT/RCD treatment','Ze/Zs, protective device curves, maximum disconnection times, CPC checks and RCD dependencies.'],
 ['equipment','Equipment ratings and load management','Manufacturer limits, socket counts, current caps, load sharing, diversity and future provisions.'],
 ['guidance','Electrical and regulatory guidance','Applicable BS 7671 edition/amendments, IET EV guidance, DNO requirements and learning/reference content.']
];
function reviewPage(){
 return '<section class="ev-card"><div class="ev-card-head"><h2>Independent technical review register'+hq('regs','About the review register','lab-revisions')+'</h2>'+button('Download reviewer handoff','review-handoff')+'</div><div class="ev-card-body"><p>Give the handoff pack to a qualified electrical designer. Record their sources, scope and findings here. Software regression checks do not establish compliance.</p><p class="evp-help">Review entries are supplied by the user and are not independently verified. No inherited electrical table has been approved by this software update.</p>'+reviewTopics.map(([id,title,scope])=>{const r=lab().reviews[id]||{};return '<details class="evp-evidence-row"><summary><span class="evp-pill evp-review '+(r.outcome==='reviewed'?'recorded':'pending')+'">'+(r.outcome==='reviewed'?'Review recorded':'Needs review')+'</span><b>'+title+'</b></summary><p>'+scope+'</p><form data-evp-review="'+id+'"><div class="evp-form-grid">'+[['reviewer','Reviewer name'],['qualification','Qualification / professional registration'],['source','Source, edition and clause'],['date','Review date'],['reference','Review report reference']].map(([key,label])=>'<label class="ev-field">'+label+'<input name="'+key+'" type="'+(key==='date'?'date':'text')+'" value="'+h(r[key])+'" required></label>').join('')+'<label class="ev-field">Outcome<select name="outcome"><option value="pending" '+(r.outcome!=='reviewed'?'selected':'')+'>Further work required</option><option value="reviewed" '+(r.outcome==='reviewed'?'selected':'')+'>Review completed by named reviewer</option></select></label></div><label class="ev-field">Findings, assumptions and exclusions<textarea name="notes" required>'+h(r.notes)+'</textarea></label><button class="ev-btn primary" type="submit">Save review record</button></form></details>';}).join('')+'</div></section>';
}
function csv(rows){return rows.map(row=>row.map(value=>{let text=String(value??'');if(/^[=+@-]/.test(text)&&typeof value!=='number')text="'"+text;return '"'+text.replace(/"/g,'""')+'"';}).join(',')).join('\r\n');}
function download(content,name,type='text/plain'){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function locate(target){
 if(target.itemId){const row=C.rows(pack).find(r=>r.item.id===target.itemId);if(row){EVWorkspace.openPlan(row.photo.id);sel=row.item.id;sideTab='props';setSideTab();$('side').classList.add('open');draw();}return;}
 if(target.photoId){EVWorkspace.openPlan(target.photoId);return;}
 if(target.field==='ze'){EVWorkspace.go('markup');openCableCheck();$('ccze')?.focus();return;}
 if(target.field&&target.field!=='address'){if(EVWorkspace.openSettings)EVWorkspace.openSettings('job');else{EVWorkspace.go('markup');packSec='job';sideTab='pack';setSideTab();}$('side').classList.add('open');renderSide();setTimeout(()=>{const el=$(target.field);if(el){el.scrollIntoView({block:'center'});el.focus();}},80);return;}
 EVWorkspace.openDetails();
}
function paintMark(ctx,item,scale,colour,removed=false){
 ctx.save();ctx.strokeStyle=colour;ctx.fillStyle=colour;ctx.lineWidth=3;ctx.setLineDash(removed?[7,4]:[]);
 if(Array.isArray(item.pts)&&item.pts.length){ctx.beginPath();item.pts.forEach((p,n)=>n?ctx.lineTo(p.x*scale,p.y*scale):ctx.moveTo(p.x*scale,p.y*scale));ctx.stroke();}
 else if(Number.isFinite(item.x)&&Number.isFinite(item.y)){ctx.beginPath();ctx.arc(item.x*scale,item.y*scale,17,0,Math.PI*2);ctx.stroke();}
 ctx.restore();
}
async function preview(){
 const canvas=$('evpPlanPreview');if(!canvas)return;const token=++previewToken;
 let design=tab==='phases'?C.phasePack(pack,phaseIndex):tab==='revisions'?source(revisionId):C.design(pack);
 if(!design)return;const p=design.photos.find(p=>p.id===pack.active)||design.photos[0];if(!p){canvas.hidden=true;return;}
 const im=new Image();await new Promise((resolve,reject)=>{im.onload=resolve;im.onerror=()=>reject(Error('Plan image could not be loaded'));im.src=p.src;});
 if(token!==previewToken||canvas!==$('evpPlanPreview'))return;
 const savedPack=pack,oldImage=imgCache[p.id];let artwork;
 try{pack=design;imgCache[p.id]=im;pack.active=p.id;artwork=EVWorkbench.renderArtwork(p,1100);}finally{pack=savedPack;if(oldImage)imgCache[p.id]=oldImage;else delete imgCache[p.id];}
 canvas.hidden=false;canvas.width=artwork.width;canvas.height=artwork.height;const ctx=canvas.getContext('2d');ctx.drawImage(artwork,0,0);
 if(tab==='impact'){
  const before=source(baselineId);if(!before)return;const changes=C.differences(before,pack),oldRows=C.rows(before),newRows=C.rows(pack),scale=canvas.width/p.imgW;
  for(const change of changes){if(change.target.photoId!==p.id||!change.target.itemId)continue;const row=(change.kind==='removed'?oldRows:newRows).find(r=>r.item.id===change.target.itemId);if(row)paintMark(ctx,row.item,scale,change.kind==='removed'?'#c33131':change.kind==='added'?'#00845d':'#c57a00',change.kind==='removed');}
 }
}
function afterRender(){renderConflict();if(['impact','phases','revisions'].includes(tab))preview().catch(e=>error(e.message));}
function renderConflict(){EVProjectStore.renderConflict();}
function stopReplay(){if(timer)clearInterval(timer);timer=null;const control=document.querySelector('[data-evp-action="replay"]');if(control)control.textContent='Play phases';}
function replay(){
 if(timer){stopReplay();refresh();return;}
 timer=setInterval(()=>{if(document.hidden||EVWorkspace.route()!=='planning'||tab!=='phases'){stopReplay();return;}phaseIndex=(phaseIndex+1)%lab().phases.length;const slider=$('evpPhaseSlider');if(slider){slider.value=phaseIndex;slider.setAttribute('aria-valuetext',lab().phases[phaseIndex].name);$('evpPhaseSummary').innerHTML=phaseSummary(lab().phases[phaseIndex],C.quantities(C.phasePack(pack,phaseIndex)));void preview();}},1600);
 refresh();
}
function drawEvidence(c,vw){
 if(!overlay)return;const p=activePhoto();if(!p)return;const facts=new Map(C.facts(pack).filter(f=>f.target.itemId).map(f=>[f.target.itemId,f]));
 for(const item of p.items||[]){const fact=facts.get(item.id);if(!fact)continue;const pt=item.pts?.[Math.floor(item.pts.length/2)]||item;if(!Number.isFinite(pt.x)||!Number.isFinite(pt.y))continue;
 const x=pt.x*vw.zoom+vw.ox+15,y=pt.y*vw.zoom+vw.oy-15;c.save();c.fillStyle={measured:'#13785b',assumed:'#925d00',missing:'#b32932'}[fact.status];c.beginPath();c.arc(x,y,10,0,Math.PI*2);c.fill();c.font='bold 11px sans-serif';c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';c.fillText({measured:'M',assumed:'A',missing:'!'}[fact.status],x,y);c.restore();
 }
}
const originalScene=drawScene;drawScene=function(c,vw,k,forExport){originalScene(c,vw,k,forExport);if(!forExport)drawEvidence(c,vw);};
async function recoverProjects(){
 const result=await EVProjectStore.scan();recoveryRows=result.rows;
 const screen=$('evScreen'),old=$('evpRecovery');if(old)old.remove();const section=document.createElement('section');section.id='evpRecovery';section.className='ev-card evp-recovery';section.innerHTML='<div class="ev-card-head"><h2>Saved-project recovery</h2></div><div class="ev-card-body"><p>'+recoveryRows.length+' saved project'+(recoveryRows.length===1?'':'s')+' found outside the project list.'+(result.rejected?' '+result.rejected+' damaged records were skipped.':'')+(result.unavailable?' Some browser storage could not be read.':'')+'</p>'+(recoveryRows.length?'<ul>'+recoveryRows.map(r=>'<li>'+h(r.name)+' · '+h(r.date)+'</li>').join('')+'</ul>'+button('Restore these projects to the list','repair-index'):'')+'<p class="evp-help">Recovery adds existing full records to the list. It cannot recover files erased from browser storage or projects saved on another device or site address.</p></div>';screen.querySelector('.ev-page').append(section);section.scrollIntoView({block:'nearest'});
}
async function capture(kind){
 return EVWorkspace.withProject(async()=>{finishDrawingContext();const name=$(kind==='option'?'evpOptionName':'evpRevisionName')?.value.trim();if(!name)throw Error('Enter a name for this snapshot.');const r=C.capture(pack,{name,kind});if(kind==='option')baselineId=r.id;else revisionId=r.id;await saved();refresh();toast('Snapshot saved');},'The snapshot could not be saved. Your current project is still available.');
}
function recordDocument(label,file,prepared){
 if(!prepared||prepared.projId!==pack.projId)return;
 try{C.capture(pack,{name:(prepared.rev||'A')+' · '+label,kind:'document',file,source:prepared});}catch(e){toast('Document downloaded; revision snapshot not saved: '+e.message);}
}
function reviewerHandoff(){
 const text=['# EV Site Planner — independent electrical review handoff','', 'Project: '+(pack.name||'Untitled'),'Reference: '+(pack.jobRef||'Not recorded'),'Prepared: '+new Date().toISOString(),'','This is a review request, not a certificate or completed assessment.','',...reviewTopics.flatMap(([id,title,scope])=>['## '+title,scope,'Source locations: public/EV Site Planner.html (CC_FAMS, CC_CA, CC_CG, CC_CURVE, fullCalc, ccUpstream, ccDetectLoad, loadCheck); public/Guide Library.dc.html; public/Learning Hub.dc.html.','Required: applicable standard/edition/clause, independently worked examples, boundary and missing-data cases, manufacturer evidence, findings and signed reviewer details.','Recorded review: '+JSON.stringify(lab().reviews[id]||{}),'']),'Acceptance: resolve critical findings, retain independent expected results, name assumptions and review dates, verify applicable jurisdiction and standard editions.','Manual checks: actual iPhone/Android camera and HEIC imports, orientation/touch, VoiceOver/TalkBack and large projects.','Software checks verify implementation behaviour; they do not certify an installation.'].join('\n');
 download(text,'electrical-review-handoff.md','text/markdown');
}
document.addEventListener('submit',async e=>{
 const evidence=e.target.closest('[data-evp-evidence]'),review=e.target.closest('[data-evp-review]');if(!evidence&&!review)return;e.preventDefault();if(busy)return;busy=true;
 try{const data=Object.fromEntries(new FormData(e.target));if(evidence)C.recordEvidence(pack,evidence.dataset.evpEvidence,data);else{if(!e.target.reportValidity())return;lab().reviews[review.dataset.evpReview]=data;}await saved();refresh();}catch(err){error(err.message);}finally{busy=false;}
});
// A value someone types is theirs: it stops following the markup or site details.
function markEdited(key){const s=lab().simulation;if(!s.sources||typeof s.sources!=='object')s.sources={};if(key in s.sources||['ports','portKw','supplyKw','baseKw'].includes(key))s.sources[key]='edited';}
// Values that still follow a rule (the 35% other demand) update in place when the supply changes.
function followRule(changedInput){if(!C.syncSimulation(pack))return;
 // Wait until focus has moved, then never rewrite the field someone is now typing in; that one updates on leaving if they left it unchanged.
 setTimeout(()=>{for(const key of ['ports','portKw','supplyKw','baseKw']){const el=document.querySelector('[data-evp-field="simulation.'+key+'"]');if(!el||el===changedInput)continue;
  if(el===document.activeElement){const shown=el.value;el.addEventListener('blur',()=>{if(el.value===shown)el.value=lab().simulation[key];},{once:true});continue;}
  el.value=lab().simulation[key];}},0);}
function refreshSources(){for(const key of Object.keys(lab().simulation.sources||{})){const el=document.getElementById('evpSrc-'+key);if(el)el.outerHTML=sourceNote(lab().simulation,key);}}
document.addEventListener('change',async e=>{
 const t=e.target;try{
 if(t.matches('[data-evp-baseline]')){baselineId=t.value;refresh();return;}
 if(t.matches('[data-evp-revision]')){revisionId=t.value;refresh();return;}
 if(t.id==='evpPhaseSlider'){phaseIndex=Number(t.value);$('evpPhaseSummary').innerHTML=phaseSummary(lab().phases[phaseIndex],C.quantities(C.phasePack(pack,phaseIndex)));t.setAttribute('aria-valuetext',lab().phases[phaseIndex].name);await preview();return;}
 let changed=false;
 if(t.dataset.evpField){const [group,key]=t.dataset.evpField.split('.');if(t.type==='number'&&!t.checkValidity()){t.reportValidity();return;}lab()[group][key]=t.value;changed=true;if(group==='simulation'){simulation=null;markEdited(key);followRule(t);}}
 // Time pickers: round to five minutes (the iOS wheel ignores step) and store decimal hours.
 if(t.dataset.evpTime){const [group,key]=t.dataset.evpTime.split('.'),v=timeToHours(t.value);if(v==null){error('Enter a time, for example 16:00.');return;}lab()[group][key]=v;t.value=hoursToTime(v);simulation=null;markEdited(key);changed=true;}
 if(t.dataset.evpSession){const r=lab().simulation.sessions.find(r=>r.id===t.dataset.evpSession);if(r){if(t.type==='time'){const v=timeToHours(t.value);if(v==null){error('Enter a time, for example 08:30.');return;}r[t.dataset.key]=v;t.value=hoursToTime(v);}else r[t.dataset.key]=t.value;simulation=null;changed=true;}}
 if(t.dataset.evpPhase){if(!t.checkValidity()){t.reportValidity();return;}const p=lab().phases.find(r=>r.id===t.dataset.evpPhase);if(p){p[t.dataset.key]=t.value;changed=true;}}
 if(t.dataset.evpAssignment){lab().assignments[t.dataset.evpAssignment]=t.value;changed=true;}
 if(changed){await saved();if(tab==='compare')refresh();else if(tab==='charging'){$('evpSimulationResult').innerHTML='<p class="evp-help">Assumptions changed. Run the scenario again.</p>';refreshSources();}else if(tab==='phases'){$('evpPhaseSummary').innerHTML=phaseSummary(lab().phases[phaseIndex],C.quantities(C.phasePack(pack,phaseIndex)));await preview();}}
 }catch(err){error(err.message);}
});
document.addEventListener('click',async e=>{
 const tabButton=e.target.closest('[data-evp-tab]');if(tabButton){stopReplay();tab=tabButton.dataset.evpTab;refresh();return;}
 const b=e.target.closest('[data-evp-action]');if(!b||busy)return;e.preventDefault();const action=b.dataset.evpAction;busy=true;
 try{
 if(action==='markup')EVWorkspace.go('markup');
 else if(action==='overlay'){overlay=!overlay;EVWorkspace.go('markup');drawCanvas();toast(overlay?'Evidence: M = measured, A = assumed, ! = missing':'Evidence overlay hidden');}
 else if(action==='locate')locate(C.facts(pack).find(f=>f.key===b.dataset.key)?.target||{});
 else if(action==='locate-item')locate({itemId:b.dataset.id});
 else if(action==='capture-option')await capture('option');
 else if(action==='capture-revision')await capture('revision');
 else if(action==='compare-entry'){baselineId=b.dataset.id;tab='impact';refresh();}
 else if(action==='restore'){const restored=C.restore(pack,entry(b.dataset.id));validateProjectBackup(restored);await EVWorkspace.importBackup({text:async()=>JSON.stringify(restored)});}
 else if(action==='remove-snapshot'){
  if(await askConfirm({title:'Remove this snapshot?',label:'The current design will stay unchanged. Export a project backup first if you need to retain this revision.',okText:'Remove snapshot'})){
   for(const key of ['options','revisions'])lab()[key]=lab()[key].filter(r=>r.id!==b.dataset.id);C.pruneAssets(lab());if(baselineId===b.dataset.id)baselineId='';if(revisionId===b.dataset.id)revisionId='';await saved();refresh();
  }
 }
 else if(action==='simulate'){C.syncSimulation(pack);simulation=C.simulate(lab().simulation);await saved();$('evpSimulationResult').innerHTML=simulationHTML(simulation);}
 else if(action==='record-supply')locate({field:'supplyRating'});
 else if(action==='open-calcs'){EVWorkspace.go('markup');openCableCheck();}
 else if(action==='start-revision'){tab='revisions';refresh();$('evpRevisionName')?.focus();}
 else if(action==='go-compare'){tab='compare';refresh();}
 else if(action==='add-session'){lab().simulation.sessions.push({id:C.id(),name:'New arrivals',count:1,arrival:9,departure:17,kwh:20,maxKw:7});simulation=null;await saved();refresh();}
 else if(action==='remove-session'){lab().simulation.sessions=lab().simulation.sessions.filter(r=>r.id!==b.dataset.id);simulation=null;await saved();refresh();}
 else if(action==='add-phase'){lab().phases.push({id:C.id(),name:'Phase '+(lab().phases.length+1),date:'',capacityKw:''});await saved();refresh();}
 else if(action==='remove-phase'){
  const id=b.dataset.id;if(Object.values(lab().assignments).includes(id))throw Error('Reassign the items in this phase before removing it.');
  lab().phases=lab().phases.filter(p=>p.id!==id);await saved();refresh();
 }
 else if(action==='replay')replay();
 else if(action==='export-comparison'){
  const base=source(baselineId);if(!base)throw Error('Choose a saved design first.');const a=C.quantities(base),z=C.quantities(pack),ca=C.cost(base,lab().costs),cz=C.cost(pack,lab().costs);
  download(csv([['Quantity',entry(baselineId).name,'Current','Difference'],...Object.keys(z).map(k=>[k,a[k],z[k],z[k]-a[k]]),['Indicative cost GBP',ca.total,cz.total,cz.total-ca.total],['Missing inputs',ca.missing.join('; '),cz.missing.join('; ')],...Object.entries(lab().costs).map(([k,v])=>['Rate '+k,v])]),'design-comparison.csv','text/csv');
 }
 else if(action==='export-simulation'){if(!simulation)throw Error('Run the scenario first.');download(csv([['Vehicle','Required kWh','Delivered kWh','Shortfall kWh','Grid kWh','Queue minutes','Cost GBP'],...simulation.sessions.map(r=>[r.name,r.required,r.delivered,r.shortfall,r.gridKwh,r.queuedMinutes,r.cost]),[],['Hour','Charging kW','Available kW','Queued','Tariff GBP/kWh'],...simulation.series.map(r=>[r.hour,r.gridKw,r.availableKw,r.queued,r.tariff])]),'charging-scenario.csv','text/csv');}
 else if(action==='review-handoff')reviewerHandoff();
 else if(action==='repair-index'){await EVProjectStore.repair(recoveryRows);EVWorkspace.go('projects');toast('Recovered projects added to the list.');}
 }catch(err){error(err.message);}finally{busy=false;}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopReplay();});
// The chart is drawn at the card's pixel width so its labels stay at 12px; redraw it when the width changes.
let resizeTimer=null,lastWidth=0;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(!simulation||tab!=='charging'||EVWorkspace.route()!=='planning')return;const w=chartWidth();if(Math.abs(w-lastWidth)<8)return;lastWidth=w;const box=$('evpSimulationResult');if(box&&box.querySelector('.evp-chart'))box.innerHTML=simulationHTML(simulation);},200);});
// Every charging-day shortcut (Markup Technical menu, Checks card, critical issues, command palette) opens this tab and runs the scenario.
function openCharging(){
 tab='charging';EVWorkspace.go('planning');
 try{C.syncSimulation(pack);simulation=C.simulate(lab().simulation);const box=$('evpSimulationResult');if(box)box.innerHTML=simulationHTML(simulation);}catch(err){error(err.message);}
}
window.EVPlanning={openCharging,render,afterRender,recoverProjects,recordDocument,documentSnapshot:()=>C.design(serialisablePack()),stopReplay,overlayActive:()=>overlay,toggleOverlay(){overlay=!overlay;drawCanvas();return overlay;},version:'planning-1'};
})();