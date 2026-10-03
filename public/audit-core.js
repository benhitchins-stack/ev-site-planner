/* Site audit of an existing EV site: the checks, the saved record and its summaries. Pure code shared by the browser and the Node tests. */
(function(root){
'use strict';
const record=v=>v&&typeof v==='object'&&!Array.isArray(v);
const text=(v,max)=>String(v==null?'':v).slice(0,max);
const localDate=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const KEY=/^[a-zA-Z0-9_.-]{1,64}$/,RESERVED=new Set(['__proto__','prototype','constructor']);
const ALL=['lamppost','pillar','carpark','rapid','depot'],PUBLIC=['lamppost','pillar','carpark','rapid'];

const SECTIONS=[
 {id:'access',name:'Accessibility',short:'PAS 1899',reg:'PAS 1899:2022 and the Equality Act 2010',
  scope:'PAS 1899 is the specification for accessible public chargepoints. Councils adopt it through policy, procurement and funding conditions, and the Public Sector Equality Duty applies to the estate a council already runs as much as to new sites.'},
 {id:'payment',name:'Payment and consumer rules',short:'PCPR 2023',reg:'Public Charge Point Regulations 2023',
  scope:'Statutory duties on the operator of every publicly accessible chargepoint, enforced by the Office for Product Safety and Standards. The council carries the reputational and contractual risk even where the operator holds the duty. Workplace and depot chargers that the public cannot use are outside these rules.'}
];
const SITE_TYPES=[
 {id:'lamppost',name:'On-street lamppost or bollard',power:'Up to 5 kW'},
 {id:'pillar',name:'On-street pillar',power:'7 to 22 kW'},
 {id:'carpark',name:'Car park',power:'7 to 22 kW'},
 {id:'rapid',name:'Rapid hub',power:'50 kW and above'},
 {id:'depot',name:'Depot or fleet',power:'7 to 22 kW',notPublic:true}
];
const OUTCOMES=[
 {id:'pass',label:'Pass',short:'Pass',needs:''},
 {id:'action',label:'Action needed',short:'Action',needs:'A short note: what falls short and the intended fix.'},
 {id:'fail',label:'Fail',short:'Fail',needs:'A note and a photo. A fail is a firm finding and feeds the actions list.'},
 {id:'na',label:'Not applicable',short:'N/A',needs:'A reason. A recorded reason shows the requirement was considered, not missed.'}
];
const SEVERITY={critical:'Critical',high:'High',medium:'Medium'};
const SEVERITY_RANK={critical:0,high:1,medium:2};

// Each check: scope 'site' is answered once, scope 'unit' once per chargepoint. Wording is draft v0.9 pending specialist review.
const CHECKS=[
 {id:'ACC-01',section:'access',scope:'site',sev:'critical',applies:ALL,
  title:'Equality Act consideration recorded for this site',
  why:'The Public Sector Equality Duty requires a council to show due regard to disabled users’ needs in how it provides charging, including the estate it already runs. The duty is about documented consideration: a site can be constrained, but the reasoning must be on record. This record is the council’s first line of defence against a discrimination challenge.',
  cite:'Equality Act 2010, s.149',
  fix:'Answer the accessibility checks and record decisions and mitigations; the evidence pack sets them out as the record of consideration.',
  cost:'Administrative; produced by this audit'},
 {id:'ACC-02',section:'access',scope:'unit',sev:'high',applies:ALL,
  title:'User-interaction components within the reachable height band',
  why:'Sockets, holsters, screens and card readers must sit where wheelchair users and people of short stature can reach and view them (socket or holster centreline around 750 to 900 mm; interface elements per the PAS figures). Units mounted high on columns commonly fail.',
  cite:'PAS 1899:2022 §5, Figs 4 and 5',verify:'Confirm the exact height values against the purchased PAS text (figures 4 and 5); a PAS revision has been in progress.',
  measure:{label:'Highest interaction point',unit:'mm',limit:'per PAS Figs 4 and 5'},
  fix:'Re-mount the unit or relocate the reader or screen within the band; where a column unit cannot move, record the mitigation (for example assistance through the helpline, or the nearest accessible unit).',
  cost:'£150 to £600 per unit re-mount'},
 {id:'ACC-03',section:'access',scope:'unit',sev:'high',applies:ALL,
  title:'Clear space in front of the interaction face',
  why:'A wheelchair user needs clear, level space to approach and turn at the unit: a minimum of 1,200 mm straight-line access, with deeper space (about 1,500 to 1,850 mm) preferred for turning.',
  cite:'PAS 1899:2022 §6 · BS 8300-1:2018',verify:'Confirm the required and preferred front-space values in the final PAS text.',
  measure:{label:'Clear depth in front of unit',unit:'mm',limit:'at least 1,200'},
  fix:'Remove street furniture or planting from the approach zone, or re-orient the unit.',
  cost:'£0 to £900 depending on the obstruction'},
 {id:'ACC-04',section:'access',scope:'unit',sev:'medium',applies:ALL,
  title:'Reach over low-level obstacles no more than 220 mm',
  why:'Where a kerb, impact barrier or cover sits in front of the unit, every component must still be reachable, with the reach distance over the obstacle capped at 220 mm.',
  cite:'PAS 1899:2022 §5 and §6',
  measure:{label:'Reach over obstacle',unit:'mm',limit:'220 or less'},
  fix:'Reposition barriers or wheel stops, or re-mount components closer to the accessible face.',
  cost:'£100 to £500 per bay'},
 {id:'ACC-05',section:'access',scope:'unit',sev:'high',applies:['lamppost','pillar','rapid'],
  title:'Dropped kerb or level access between the bay and the unit',
  why:'If the unit is on the footway and cannot be operated from carriageway level, a dropped kerb or level access must connect the bay to the unit. Otherwise a wheelchair user can park but not charge.',
  cite:'PAS 1899:2022 §6',
  fix:'Install a dropped kerb with tactile provision at the bay; as an interim mitigation, designate the nearest accessible unit and record it.',
  cost:'£900 to £1,800 per bay',
  naNote:'Car park and depot bays usually share a level surface with the unit; record the surface condition instead.'},
 {id:'ACC-06',section:'access',scope:'site',sev:'medium',applies:['carpark','rapid'],
  title:'Accessible bay provision ratio across the site',
  why:'Best practice for larger sites: at least one accessible charging bay per five EV bays where the site has 10 or more chargers. No accessible provision on a large site is hard to defend under the Public Sector Equality Duty.',
  cite:'PAS 1899:2022 annexes (best practice) · BS 8300-1',
  fix:'Re-designate and re-mark bays to create accessible provision at the required ratio.',
  cost:'£250 to £600 per bay re-marked',
  naNote:'Single-unit on-street sites; provision is assessed at network level instead (see the Equality Act record).'},
 {id:'ACC-07',section:'access',scope:'unit',sev:'high',applies:['carpark','rapid'],
  title:'Accessible bay dimensions and access zones',
  why:'Accessible charging bays need enlarged dimensions (a minimum 4.0 m by 6.6 m envelope, or 3.6 m width with a kerb-clear zone) with 1,600 mm side and 1,200 mm rear marked access zones, so a wheelchair user can transfer and reach the cable safely.',
  cite:'PAS 1899:2022 Annexes B and C · BS 8300-1:2018 §7 and §8',verify:'Confirm the annex dimension set for the relevant bay layout (parallel, angled or off-street).',
  measure:{label:'Bay width',unit:'mm',limit:'at least 3,600 (accessible)'},
  fix:'Re-mark bays to accessible dimensions; where space is genuinely constrained, record the constraint and the nearest compliant alternative.',
  cost:'£250 to £600 per bay',
  naNote:'On-street bays are assessed through the kerb and footway checks instead.'},
 {id:'ACC-08',section:'access',scope:'site',sev:'medium',applies:ALL,
  title:'Surface firm, level and slip-resistant; drainage fall no steeper than 1:50',
  why:'The ground around the unit must be stable and level enough for wheelchair use in all weathers. Broken paving and ponding are common failures on older footways.',
  cite:'PAS 1899:2022 §7',
  fix:'Relay paving locally; correct falls where water ponds at the interaction zone.',
  cost:'£200 to £1,200 per site'},
 {id:'ACC-09',section:'access',scope:'unit',sev:'high',applies:['pillar','carpark','rapid'],
  title:'Cable management provided; operating forces within limits',
  why:'Rapid CCS cables are heavy. The PAS sets limits on the forces users must exert (Annex F) and expects cable management (a holster or balancer) so the cable can be connected without dragging. Cable management is mandatory in accessible bays.',
  cite:'PAS 1899:2022 §5, Annex F',verify:'Confirm the linear force limits from Annex F for the survey guidance.',
  fix:'Retrofit cable management arms or balancers; record the measured effort where marginal.',
  cost:'£400 to £1,200 per unit',
  naNote:'Lamppost units are socket-only (the user brings the cable); force limits apply to the socket latch only.'},
 {id:'ACC-10',section:'access',scope:'unit',sev:'high',applies:['lamppost','pillar'],
  title:'No trailing cable across the pedestrian route during charging',
  why:'Charging must be possible without the cable crossing the footway, which is a trip hazard and an accessibility breach. The bay position relative to the unit decides this; council policy also prohibits private cables across the pavement.',
  cite:'PAS 1899:2022 §7 · council trailing-cable policy',
  fix:'Re-mark the bay so the vehicle inlet sits next to the unit; add a cable channel or gully only where policy permits.',
  cost:'£150 to £600 per bay',
  naNote:'Off-street bays; the cable route is assessed within the bay envelope (ACC-09).'},
 {id:'ACC-11',section:'access',scope:'unit',sev:'medium',applies:['pillar','carpark','rapid','depot'],
  title:'Bollards at least 1,000 mm high, visually contrasting, with at least 1,000 mm clear passage',
  why:'Protection must not itself become the barrier: bollards need height and contrast for visually impaired users, and enough gap for a wheelchair to pass.',
  cite:'PAS 1899:2022 §6 and §7',
  measure:{label:'Narrowest gap between bollards',unit:'mm',limit:'at least 1,000'},
  fix:'Re-space or replace bollards; add contrast banding.',
  cost:'£150 to £400 per bollard',
  naNote:'No bollards at lamppost sites.'},
 {id:'ACC-12',section:'access',scope:'unit',sev:'medium',applies:['pillar','carpark','rapid'],
  title:'Screen legible: height, glare and text size; non-touch alternative available',
  why:'Screens must be readable from a seated position and outdoors (glare), with instructions usable by people who cannot operate a touch screen. Otherwise the interface itself excludes users.',
  cite:'PAS 1899:2022 §5 and §8 (information provision)',
  fix:'Adjust the mounting angle, apply anti-glare treatment, or enable app or phone-line fallback flows; record the fallback in the site information.',
  cost:'£80 to £300 per unit',
  naNote:'Lamppost units have no screen; information duties are met through unit labelling and the app (PAY-01 and PAY-04).'},
 {id:'ACC-13',section:'access',scope:'site',sev:'medium',applies:ALL,
  title:'Lighting adequate at the unit and its approach',
  why:'Users must be able to find, read and operate the unit safely after dark; lighting also underpins personal safety, particularly for disabled and lone users.',
  cite:'PAS 1899:2022 §7 · BS 8300-1 §11 principles',
  fix:'Uprate nearby lighting or add lighting built into the unit; lamppost sites usually pass by design. Record the lux check.',
  cost:'£0 to £900 per site'},
 {id:'ACC-14',section:'access',scope:'unit',sev:'high',applies:PUBLIC,publicOnly:true,
  title:'Payment method accessible: reader reachable when seated; non-app alternative',
  why:'A card reader mounted high, or an app-only flow with no assistance path, excludes users with reach or dexterity impairments. The whole payment process must be accessible, not only the plug.',
  cite:'PAS 1899:2022 §5 · Equality Act 2010 (reasonable adjustments)',
  measure:{label:'Reader or terminal height',unit:'mm',limit:'per PAS Figs 4 and 5'},
  fix:'Re-mount the reader within the band; make sure a helpline-assisted start is available and advertised as the non-app path.',
  cost:'£150 to £600 per unit',
  naNote:'Fleet-only depot; the payment process is not public.'},

 {id:'PAY-01',section:'payment',scope:'site',sev:'critical',applies:PUBLIC,publicOnly:true,
  title:'Price displayed in pence per kWh before charging',
  why:'The maximum price of a charging session must be clearly shown in p/kWh (or £/kWh) on the unit, or through a device or app that needs no pre-existing contract. In force since November 2023 for all public chargepoints.',
  cite:'PCPR 2023, reg. 11',deadline:'In force 24 Nov 2023',
  fix:'Display the tariff on the unit, or make sure the operator’s app or QR flow shows the maximum p/kWh before payment details are requested.',
  cost:'£0 to £150 per unit (signage or software)',
  naNote:'Not publicly accessible. The 2023 Regulations apply to public chargepoints only.'},
 {id:'PAY-02',section:'payment',scope:'site',sev:'medium',applies:PUBLIC,publicOnly:true,
  title:'Price does not increase once a session has started',
  why:'The displayed rate must hold for the whole session; mid-session price rises breach the pricing rules. Relevant for peak and off-peak tariffs that span a session.',
  cite:'PCPR 2023, reg. 11',deadline:'In force 24 Nov 2023',
  fix:'Confirm the operator’s billing locks the agreed rate at session start; have the tariff engine fixed if not.',
  cost:'Operator software change; £0 to the council',
  naNote:'Not publicly accessible. The 2023 Regulations apply to public chargepoints only.'},
 {id:'PAY-03',section:'payment',scope:'unit',sev:'critical',applies:['pillar','carpark','rapid'],publicOnly:true,
  title:'Contactless payment available (8 kW and above new; 50 kW and above existing)',
  why:'New public chargepoints of 8 kW and above (installed after November 2023) and all rapid (50 kW and above) chargepoints must take contactless payment without pre-registration, either on the unit or through a site terminal close by. The deadline was 24 November 2024.',
  cite:'PCPR 2023, reg. 5',deadline:'In force 24 Nov 2024',
  fix:'Retrofit a contactless terminal per unit, or one site terminal close by; record the exemption where the unit is existing stock under 50 kW installed before November 2023.',
  cost:'£800 to £2,500 per unit; £3,000 to £5,000 for a site terminal',
  naNote:'Below the 8 kW contactless threshold (5 kW lamppost units), or existing pre-November 2023 stock under 50 kW. Record which exemption applies.'},
 {id:'PAY-04',section:'payment',scope:'site',sev:'high',applies:PUBLIC,publicOnly:true,
  title:'Ad-hoc access: no pre-registration, contract or proprietary app required',
  why:'Drivers must be able to charge and pay without entering a pre-existing contract with the operator. QR-to-web payment flows qualify only if they work without creating an account.',
  cite:'PCPR 2023, regs. 5 and 11 (definitions)',
  fix:'Require the operator to enable a guest payment path, and test it on site as part of the audit.',
  cost:'Operator software change; £0 to the council',
  naNote:'Not publicly accessible. The 2023 Regulations apply to public chargepoints only.'},
 {id:'PAY-05',section:'payment',scope:'site',sev:'high',applies:PUBLIC,publicOnly:true,
  title:'Roaming: payable through at least one third-party roaming provider',
  why:'Every public chargepoint must be payable through at least one third-party roaming provider (for example an aggregator app). The two-year transition ended on 24 November 2025, so this is now a live obligation across the whole estate, including older lamppost units.',
  cite:'PCPR 2023, reg. 6',deadline:'In force 24 Nov 2025',
  fix:'Confirm the operator’s roaming agreement covers these units; require connection under the operating contract if not.',
  cost:'Operator commercial arrangement; £0 to the council',
  naNote:'Not publicly accessible. The 2023 Regulations apply to public chargepoints only.'},
 {id:'PAY-06',section:'payment',scope:'unit',sev:'critical',applies:PUBLIC,publicOnly:true,
  title:'24/7 free staffed helpline number displayed on or near the unit',
  why:'A free-to-call, 24/7, staffed helpline (voicemail does not qualify) must exist and its number must be prominently displayed on or near each chargepoint. Faded or missing stickers are a common physical failure.',
  cite:'PCPR 2023, reg. 9',deadline:'In force 24 Nov 2024',
  fix:'Re-sticker units with the operator’s helpline number; verify the line answers 24/7 with a test call.',
  cost:'£40 to £120 per unit (signage)',
  naNote:'Not publicly accessible. The 2023 Regulations apply to public chargepoints only.'},
 {id:'PAY-07',section:'payment',scope:'site',sev:'critical',applies:['rapid'],publicOnly:true,
  title:'Rapid network 99% average annual reliability, published',
  why:'The operator’s rapid (50 kW and above) network must average 99% reliability, measured annually and published. Out-of-order status, including a dead contactless reader, counts as downtime.',
  cite:'PCPR 2023, reg. 7',deadline:'Annual average from Nov 2024',
  fix:'Obtain the operator’s published reliability figure and per-unit uptime for this site; agree a remediation SLA where below target.',
  cost:'Operator obligation; monitor through the contract',
  naNote:'The reliability duty applies to rapid (50 kW and above) chargepoints only.'},
 {id:'PAY-08',section:'payment',scope:'site',sev:'medium',applies:PUBLIC,publicOnly:true,
  title:'Open data live through OCPI (location, unit, connector, status)',
  why:'Operators must hold and open chargepoint reference data using OCPI, with live availability status. This is also how the public and funders see whether units work.',
  cite:'PCPR 2023, reg. 10 (OCPI 2.2.1 §8.3.1 to 8.3.3)',deadline:'In force 24 Nov 2024',
  fix:'Spot-check the site on a public charging map against reality; require the operator to fix stale or missing feeds.',
  cost:'Operator software obligation',
  naNote:'Not publicly accessible. The 2023 Regulations apply to public chargepoints only.'},
 {id:'PAY-09',section:'payment',scope:'site',sev:'medium',applies:PUBLIC,publicOnly:true,
  title:'Operator statutory reporting to OZEV and OPSS is up to date',
  why:'Operators must submit periodic reports (helpline calls quarterly; reliability and roaming reporting per the schedule). The council should hold assurance that its operator is reporting, because enforcement action against the operator lands on council sites.',
  cite:'PCPR 2023, regs. 7 to 9 (reporting provisions)',
  fix:'Request confirmation of the latest submissions under the operating contract; keep the evidence in the site file.',
  cost:'Administrative',
  naNote:'Not publicly accessible. The 2023 Regulations apply to public chargepoints only.'}
];
const byId=new Map(CHECKS.map(c=>[c.id,c]));
const check=id=>byId.get(id)||null;
const section=id=>SECTIONS.find(s=>s.id===id)||null;
const siteType=id=>SITE_TYPES.find(s=>s.id===id)||null;
const outcome=id=>OUTCOMES.find(o=>o.id===id)||null;

function newUnit(n){return {id:'cp'+n,label:'Chargepoint '+n,make:'',kw:'',location:''};}
function create({kind='project',auditor='',date=''}={}){
 return {schema:1,kind:kind==='audit'?'audit':'project',siteType:'',isPublic:null,operator:'',auditor:text(auditor,200),date:date||localDate(),notes:'',units:[newUnit(1)],answers:{},createdAt:new Date().toISOString()};
}
// Repair a saved record in place so the page and the pack can rely on its shape. Unknown fields are left alone.
function ensure(audit){
 if(!record(audit))throw Error('Invalid site audit');
 audit.schema=1;if(audit.kind!=='audit')audit.kind='project';
 if(!siteType(audit.siteType))audit.siteType='';
 if(audit.isPublic!==true&&audit.isPublic!==false)audit.isPublic=null;
 for(const k of ['operator','auditor','date','notes'])audit[k]=text(audit[k],k==='notes'?4000:200);
 if(!Array.isArray(audit.units))audit.units=[];
 audit.units=audit.units.filter(u=>record(u)&&typeof u.id==='string'&&KEY.test(u.id)&&!RESERVED.has(u.id));
 if(!audit.units.length)audit.units=[newUnit(1)];
 for(const u of audit.units)for(const k of ['label','make','kw','location'])u[k]=text(u[k],k==='kw'?20:120);
 if(!record(audit.answers))audit.answers={};
 return audit;
}
function nextUnit(audit){let n=audit.units.length+1;while(audit.units.some(u=>u.id==='cp'+n))n++;return newUnit(n);}
function applies(c,audit){
 if(siteType(audit.siteType)&&!c.applies.includes(audit.siteType))return false;
 if(c.publicOnly&&audit.isPublic===false)return false;
 return true;
}
function excludedReason(c,audit){
 if(siteType(audit.siteType)&&!c.applies.includes(audit.siteType))return c.naNote||'Not relevant to this site type.';
 if(c.publicOnly&&audit.isPublic===false)return c.naNote||'Not publicly accessible. The 2023 Regulations apply to public chargepoints only.';
 return '';
}
const keyFor=(c,unit)=>c.scope==='unit'&&unit?c.id+':'+unit.id:c.id;
// Every answer slot: site checks once, chargepoint checks once per chargepoint. Checks the site type rules out are listed separately.
const unitsOf=audit=>Array.isArray(audit.units)?audit.units.filter(record):[];
function slots(audit){
 const out=[];
 for(const c of CHECKS){
  if(!applies(c,audit))continue;
  if(c.scope==='unit')for(const unit of unitsOf(audit))out.push({key:keyFor(c,unit),check:c,unit});
  else out.push({key:keyFor(c),check:c,unit:null});
 }
 return out;
}
function excluded(audit){return CHECKS.filter(c=>!applies(c,audit)).map(c=>({check:c,reason:excludedReason(c,audit)}));}
function answer(audit,key){const a=record(audit.answers)?audit.answers[key]:null;return record(a)?a:null;}
function answerFor(audit,key){
 if(!KEY.test(key.replace(':','_'))||RESERVED.has(key))throw Error('Invalid check reference');
 let a=audit.answers[key];
 if(!record(a))a=audit.answers[key]={outcome:'',note:'',reason:'',measure:'',photos:[],at:'',by:''};
 if(!Array.isArray(a.photos))a.photos=[];
 return a;
}
const state=a=>a&&outcome(a.outcome)?a.outcome:'todo';
function summary(audit){
 const rows=slots(audit),counts={total:rows.length,pass:0,action:0,fail:0,na:0,todo:0,photos:0,excluded:excluded(audit).length,units:unitsOf(audit).length};
 for(const row of rows){const a=answer(audit,row.key);counts[state(a)]++;counts.photos+=a?.photos?.length||0;}
 counts.done=counts.total-counts.todo;counts.pct=counts.total?Math.round(counts.done/counts.total*100):0;
 return counts;
}
// What the project list and the home page need, without the answers themselves.
function indexSummary(audit){if(!record(audit))return null;const s=summary(audit);return {kind:audit.kind==='audit'?'audit':'project',siteType:siteType(audit.siteType)?audit.siteType:'',done:s.done,total:s.total,fail:s.fail,action:s.action};}
function findings(audit){
 return slots(audit).map(row=>({...row,answer:answer(audit,row.key)})).filter(r=>r.answer&&(r.answer.outcome==='fail'||r.answer.outcome==='action'))
  .sort((a,b)=>(a.answer.outcome==='fail'?0:1)-(b.answer.outcome==='fail'?0:1)||SEVERITY_RANK[a.check.sev]-SEVERITY_RANK[b.check.sev]||a.key.localeCompare(b.key));
}
function setupComplete(audit){return !!(audit.siteType&&audit.isPublic!==null);}
// Evidence the pack would be missing, in the order a reader notices them.
function gaps(audit,{name=''}={}){
 const out=[],s=summary(audit);
 if(!name)out.push('Site name is missing.');
 if(!audit.siteType)out.push('Site type is not chosen, so every check is listed.');
 if(audit.isPublic===null)out.push('Public access is not recorded.');
 if(!audit.auditor)out.push('Auditor is not recorded.');
 if(s.todo)out.push(s.todo+(s.todo===1?' check is':' checks are')+' not answered.');
 let notes=0,photos=0,reasons=0,measures=0,verify=0;
 for(const row of slots(audit)){
  const a=answer(audit,row.key),st=state(a);
  if((st==='fail'||st==='action')&&!String(a.note||'').trim())notes++;
  if(st==='fail'&&!(a.photos||[]).length)photos++;
  if(st==='na'&&!String(a.reason||'').trim())reasons++;
  if(row.check.measure&&st!=='todo'&&st!=='pass'&&st!=='na'&&!String(a.measure||'').trim())measures++;
  if(row.check.verify&&st!=='todo'&&st!=='na')verify++;
 }
 if(notes)out.push(notes+(notes===1?' finding has':' findings have')+' no note.');
 if(photos)out.push(photos+(photos===1?' fail has':' fails have')+' no photo.');
 if(reasons)out.push(reasons+' not applicable '+(reasons===1?'answer has':'answers have')+' no reason.');
 if(measures)out.push(measures+(measures===1?' finding has':' findings have')+' no measurement.');
 if(verify)out.push(verify+(verify===1?' answer cites':' answers cite')+' a value to confirm against your copy of PAS 1899.');
 return out;
}
function copyAnswers(audit,fromId,toId){
 const from=unitsOf(audit).find(u=>u.id===fromId),to=unitsOf(audit).find(u=>u.id===toId);if(!from||!to||from===to)return 0;
 let n=0;
 for(const c of CHECKS){
  if(c.scope!=='unit'||!applies(c,audit))continue;
  const source=answer(audit,keyFor(c,from));if(!source||!outcome(source.outcome))continue;
  const target=answerFor(audit,keyFor(c,to));if(outcome(target.outcome))continue;
  Object.assign(target,{outcome:source.outcome,note:source.note||'',reason:source.reason||'',measure:source.measure||'',at:new Date().toISOString(),by:source.by||''});n++;
 }
 return n;
}
function removeUnit(audit,id){
 if(audit.units.length<=1)throw Error('An audit needs at least one chargepoint.');
 audit.units=audit.units.filter(u=>u.id!==id);
 for(const key of Object.keys(audit.answers))if(key.endsWith(':'+id))delete audit.answers[key];
}
const IMAGE=/^data:image\/(?:png|jpe?g|webp|gif|avif|bmp)(?:;[^,]*)?,/i;
// Backups are data. Reject shapes the page could not show rather than guessing at them.
function validate(audit){
 const need=ok=>{if(!ok)throw Error('Invalid site audit');};
 need(record(audit)&&(audit.schema==null||audit.schema===1));
 for(const k of ['kind','siteType','operator','auditor','date','notes','createdAt'])need(audit[k]==null||typeof audit[k]==='string');
 need(audit.isPublic==null||typeof audit.isPublic==='boolean');
 need(audit.siteType==null||audit.siteType===''||!!siteType(audit.siteType));
 if(audit.units!=null){
  need(Array.isArray(audit.units)&&audit.units.length<=200);const ids=new Set();
  for(const u of audit.units){need(record(u)&&typeof u.id==='string'&&KEY.test(u.id)&&!RESERVED.has(u.id)&&!ids.has(u.id));ids.add(u.id);for(const k of ['label','make','kw','location'])need(u[k]==null||typeof u[k]==='string'&&u[k].length<=200);}
 }
 if(audit.answers!=null){
  need(record(audit.answers)&&Object.keys(audit.answers).length<=5000);
  for(const [key,a] of Object.entries(audit.answers)){
   need(!RESERVED.has(key)&&/^[A-Z]{3}-\d{2}(?::[a-zA-Z0-9_.-]{1,64})?$/.test(key)&&record(a));
   need(a.outcome==null||a.outcome===''||!!outcome(a.outcome));
   for(const k of ['note','reason','measure','at','by'])need(a[k]==null||typeof a[k]==='string'&&a[k].length<=4000);
   if(a.photos!=null){need(Array.isArray(a.photos)&&a.photos.length<=8);for(const p of a.photos){need(record(p)&&typeof p.src==='string'&&IMAGE.test(p.src)&&!/[<>"\u0000-\u001f]/.test(p.src));for(const k of ['id','name','at'])need(p[k]==null||typeof p[k]==='string'&&p[k].length<=200);}}
  }
 }
}
root.EVAuditCore={SECTIONS,SITE_TYPES,OUTCOMES,CHECKS,SEVERITY,check,section,siteType,outcome,create,ensure,nextUnit,units:unitsOf,applies,excludedReason,keyFor,slots,excluded,answer,answerFor,state,summary,indexSummary,findings,setupComplete,gaps,copyAnswers,removeUnit,validate,localDate,version:'audit-1'};
})(globalThis);
