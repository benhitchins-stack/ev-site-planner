(function(){
  "use strict";

  const EVSP_CDM_VERSION=3;
  const EVSP_CDM_DOC_STATUSES=[
    ["not_started","Not started"],
    ["draft","Draft"],
    ["issued","Issued"],
    ["accepted","Accepted"],
    ["not_applicable","Not applicable"]
  ];
  const EVSP_CDM_DOC_STATUS_LABEL=Object.fromEntries(EVSP_CDM_DOC_STATUSES);
  const EVSP_CDM_DOC_DEFS=[
    {k:"pci",title:"Pre-construction information (PCI)",reg:"CDM Regulations 2015, regulations 4 and 11",purpose:"Known site, design and construction information provided early enough for duty holders to plan safely."},
    {k:"cpp",title:"Construction phase plan",reg:"CDM Regulations 2015, regulation 12",purpose:"The management arrangements, site rules, significant risks and controls in place before construction starts."},
    {k:"f10",title:"F10 notification record",reg:"CDM Regulations 2015, regulation 6",purpose:"The notifiability decision, submission details and a record of the information displayed on site."},
    {k:"induction",title:"Site induction record",reg:"Project control record",purpose:"Names, dates, signatures, emergency arrangements and site-specific information given to each person."},
    {k:"site_rules",title:"Site rules and signage sheet",reg:"Construction phase plan control",purpose:"Clear rules covering access, PPE, traffic, isolations, housekeeping, welfare and emergency arrangements."},
    {k:"toolbox",title:"Toolbox talk register",reg:"Workforce consultation record",purpose:"Briefings delivered, attendees, questions raised and follow-up actions."},
    {k:"permits",title:"Permit-to-work register",reg:"High-risk work control",purpose:"Issue, validity, controls and close-out for excavation, electrical isolation, hot work and work at height."},
    {k:"excavation",title:"Excavation inspection register",reg:"CDM Regulations 2015, regulations 22 and 24",purpose:"Competent-person inspections after events that could affect stability and at the required work intervals."},
    {k:"hsfile",title:"Health and safety file and handover",reg:"CDM Regulations 2015, regulation 12(5)",purpose:"Information needed to protect people during future use, maintenance, alteration and removal."},
    {k:"incidents",title:"Incident and near-miss log",reg:"Project control record",purpose:"A consistent record of events, immediate action, investigation, reporting and close-out."}
  ];
  const EVSP_CDM_ROUTE_DEFS=[
    {k:"delivery_appointed",title:"Multiple contractors, delivery organisation named as PD and PC",body:"Record the separate written appointments and evidence. The delivery model alone does not create a legal appointment."},
    {k:"other_appointed",title:"Multiple contractors, other organisations appointed PD and PC",body:"Record the organisations named in the written appointments and where the evidence is held."},
    {k:"single_contractor",title:"Single-contractor project",body:"No principal designer or principal contractor appointments are required, but the contractor must still prepare the construction phase plan."}
  ];
  const EVSP_CDM_SUPPORT_CATEGORIES=[
    ["","Select type"],
    ["rams","RAMS"],
    ["appointment","Duty-holder appointment"],
    ["asbestos","Asbestos information"],
    ["utilities","Utilities or buried-services information"],
    ["survey","Survey or drawing"],
    ["permit","Permit or authorisation"],
    ["competence","Competence evidence"],
    ["insurance","Insurance"],
    ["certificate","Certificate or test record"],
    ["product","Product or O&M information"],
    ["waste","Waste documentation"],
    ["other","Other project record"]
  ];
  const EVSP_CDM_SUPPORT_STATUSES=[
    ["","Not reviewed"],
    ["received","Received"],
    ["reviewed","Reviewed"],
    ["accepted","Accepted"]
  ];
  const EVSP_CDM_HIERARCHY=[
    ["eliminate","Eliminate"],
    ["reduce","Reduce"],
    ["control","Control"],
    ["inform","Inform"]
  ];
  const EVSP_CDM_RISK_STATUSES=[
    ["open","Open"],
    ["actioned","Design action recorded"],
    ["closed","Closed"],
    ["transferred","Transferred to construction information"]
  ];

  const EVSP_CDM_RISK_PRESETS=[
    {
      k:"excavation",
      hazard:"Buried services and excavation",
      who:"Workers, site users and service operators",
      hierarchy:"reduce",
      decision:"Confirm current utility records, scan and mark the route, minimise excavation, and define hand-dig zones before machine work.",
      residual:"Unknown or inaccurately recorded services, ground instability and open excavation remain possible.",
      trigger:f=>f.trenchCount>0||f.ductCount>0||f.inspectionPitCount>0||f.spoilCount>0,
      source:f=>evspCdmCountPhrases([
        [f.trenchCount+f.ductCount,"trench or buried-route item"],
        [f.inspectionPitCount,"inspection pit"],
        [f.spoilCount,"spoil area"]
      ],"Excavation scope")+" on the plan"
    },
    {
      k:"public_interface",
      hazard:"Public, pedestrian and vehicle interface",
      who:"Site users, visitors and the public",
      hierarchy:"control",
      decision:"Sequence work to reduce occupation, provide a protected pedestrian route, segregate the work area and control vehicle movements.",
      residual:"People may enter or pass close to the work area, especially outside supervised hours.",
      trigger:f=>f.unitCount>0||f.bayCount>0||f.herasCount>0||f.coneCount>0||f.exclusionCount>0||f.pedestrianCount>0,
      source:f=>(f.herasCount+f.coneCount+f.exclusionCount+f.pedestrianCount+f.signboardCount)?evspCdmCountPhrases([
        [f.herasCount,"barrier route"],
        [f.coneCount,"cone route"],
        [f.exclusionCount,"exclusion zone"],
        [f.pedestrianCount,"pedestrian route"],
        [f.signboardCount,"safety signboard"]
      ],"Public-protection markup")+" on the plan":"Charging equipment or bays placed in an operational site"
    },
    {
      k:"electrical",
      hazard:"Live electrical systems and energisation",
      who:"Electricians, other contractors and site users",
      hierarchy:"control",
      decision:"Design safe isolation points, lock-off arrangements, test-before-touch steps and controlled energisation into the work sequence.",
      residual:"Existing supplies and adjacent circuits may remain live while the work is undertaken.",
      trigger:f=>f.unitCount>0||f.electricalCount>0||f.liveCalloutCount>0,
      source:f=>evspCdmCountPhrases([
        [f.unitCount,"charging unit"],
        [f.electricalCount,"electrical distribution item"],
        [f.liveCalloutCount,"live-equipment callout"]
      ],"Electrical scope")+" on the plan"
    },
    {
      k:"manual_handling",
      hazard:"Heavy equipment, lifting and manual handling",
      who:"Installation and delivery teams",
      hierarchy:"reduce",
      decision:"Confirm equipment weights and access, choose mechanical lifting where practicable, and position bases to avoid unnecessary carrying or double handling.",
      residual:"Final positioning, awkward access and packaging removal can still require controlled manual handling.",
      trigger:f=>f.heavyCount>0,
      source:f=>f.heavyCount+" heavy equipment item"+(f.heavyCount===1?"":"s")+" on the plan"
    },
    {
      k:"work_at_height",
      hazard:"Work at height for containment and cable routes",
      who:"Electrical installers and people below the work area",
      hierarchy:"reduce",
      decision:"Route containment at accessible levels where practicable, pre-assemble at ground level and specify suitable access equipment for remaining high-level work.",
      residual:"Some final fixings or cable pulls may still require short-duration work at height.",
      trigger:f=>f.highLevelCount>0,
      source:f=>f.highLevelCount+" tray or basket route"+(f.highLevelCount===1?"":"s")+" on the plan"
    },
    {
      k:"building_fabric",
      hazard:"Building fabric, drilling and possible asbestos",
      who:"Installers and building occupants",
      hierarchy:"eliminate",
      decision:"Use existing routes where practicable, confirm the asbestos information before disturbing pre-2000 fabric, and identify no-drill areas.",
      residual:"Concealed materials or services may not match the available records.",
      trigger:f=>f.drillCount>0||f.asbestosCalloutCount>0,
      source:f=>evspCdmCountPhrases([
        [f.drillCount,"drill location"],
        [f.asbestosCalloutCount,"asbestos-risk callout"]
      ],"Building-fabric scope")+" on the plan"
    },
    {
      k:"temporary_works",
      hazard:"Temporary works, welfare and emergency access",
      who:"All people working on or visiting the site",
      hierarchy:"control",
      decision:"Confirm welfare from day one, keep emergency access clear, sign the muster route and position first-aid and fire points where they remain accessible.",
      residual:"Site layout and client operations can change during the construction phase.",
      trigger:f=>f.siteSetupCount>0||f.firstAidCount>0||f.fireCount>0||f.signboardCount>0,
      source:f=>evspCdmCountPhrases([
        [f.siteSetupCount,"welfare or site-setup item"],
        [f.firstAidCount+f.fireCount,"emergency marker"],
        [f.signboardCount,"safety signboard"]
      ],"Temporary site arrangements")+" on the plan"
    }
  ];

  function evspCdmCountPhrases(rows,fallback){
    const parts=(rows||[]).filter(function(row){ return Number(row&&row[0])>0; }).map(function(row){
      const count=Number(row[0]);
      return count+" "+row[1]+(count===1?"":"s");
    });
    if(!parts.length) return fallback||"Plan markup";
    if(parts.length===1) return parts[0];
    return parts.slice(0,-1).join(", ")+" and "+parts[parts.length-1];
  }

  function evspCdmId(){
    try{ if(typeof uid==="function") return uid(); }catch(_){ }
    try{ if(window.crypto&&typeof window.crypto.randomUUID==="function") return window.crypto.randomUUID(); }catch(_){ }
    return "cdm_"+Math.random().toString(36).slice(2,10);
  }
  function evspCdmEsc(value){
    return (value==null?"":String(value)).replace(/[&<>\"]/g,function(ch){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[ch]; });
  }
  function evspCdmText(value){ return value==null?"":String(value); }
  function evspCdmCleanDate(value){
    value=evspCdmText(value);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
    const parsed=new Date(value+"T00:00:00Z");
    return !isNaN(parsed.getTime())&&parsed.toISOString().slice(0,10)===value?value:"";
  }
  function evspCdmToday(){
    const now=new Date(), y=now.getFullYear(), m=String(now.getMonth()+1).padStart(2,"0"), d=String(now.getDate()).padStart(2,"0");
    return y+"-"+m+"-"+d;
  }
  function evspCdmDateNotFuture(value){
    const clean=evspCdmCleanDate(value);
    return Boolean(clean&&clean<=evspCdmToday());
  }
  function evspCdmDateOnOrBefore(value,limit){
    const clean=evspCdmCleanDate(value), end=evspCdmCleanDate(limit);
    return Boolean(clean&&(!end||clean<=end));
  }
  function evspCdmProgrammeValid(state){
    const s=state&&typeof state==="object"?state:{};
    const start=evspCdmCleanDate(s.startDate), finish=evspCdmCleanDate(s.finishDate);
    return Boolean(start&&finish&&finish>=start);
  }
  function evspCdmOptionHtml(options,current){
    return options.map(function(pair){ return '<option value="'+evspCdmEsc(pair[0])+'" '+(pair[0]===current?'selected':'')+'>'+evspCdmEsc(pair[1])+'</option>'; }).join("");
  }
  function evspCdmGetPack(candidate){
    if(candidate&&typeof candidate==="object") return candidate;
    try{ if(typeof pack!=="undefined"&&pack&&typeof pack==="object") return pack; }catch(_){ }
    return null;
  }
  function evspCdmGuessAttachmentCategory(name){
    const n=evspCdmText(name).toLowerCase();
    if(/\brams?\b|risk[ _-]*assessment|method[ _-]*statement/.test(n)) return "rams";
    if(/asbestos|refurbishment[ _-]*survey|demolition[ _-]*survey/.test(n)) return "asbestos";
    if(/appointment|principal[ _-]*(designer|contractor)|duty[ _-]*holder/.test(n)) return "appointment";
    if(/lsbud|utility|utilities|buried[ _-]*service|cat[ _-]*scan|genny/.test(n)) return "utilities";
    if(/permit|authorisation|authorization/.test(n)) return "permit";
    if(/insurance|indemnity|liability/.test(n)) return "insurance";
    if(/competence|training|cscs|ecs[ _-]*card|qualification/.test(n)) return "competence";
    if(/eicr?|certificate|test[ _-]*(result|sheet)|commissioning/.test(n)) return "certificate";
    if(/datasheet|data[ _-]*sheet|o[& _-]*m|manual|user[ _-]*guide/.test(n)) return "product";
    if(/waste|transfer[ _-]*note|disposal/.test(n)) return "waste";
    if(/survey|drawing|plan|scan/.test(n)) return "survey";
    return "";
  }
  function evspCdmDocRecord(value){
    value=value&&typeof value==="object"?value:{};
    const status=EVSP_CDM_DOC_STATUS_LABEL[value.status]?value.status:"not_started";
    return Object.assign({},value,{
      status:status,
      owner:evspCdmText(value.owner),
      revision:evspCdmText(value.revision),
      date:evspCdmCleanDate(value.date),
      notes:evspCdmText(value.notes)
    });
  }
  function evspCdmNewPack(){
    const docs={};
    EVSP_CDM_DOC_DEFS.forEach(function(def){ docs[def.k]=evspCdmDocRecord(null); });
    return {
      version:EVSP_CDM_VERSION,
      route:"",
      client:"",
      clientContact:"",
      contractor:"",
      pd:"",
      pc:"",
      appointmentsConfirmed:false,
      pdAppointmentConfirmed:false,
      pdAppointmentDate:"",
      pdAppointmentEvidence:"",
      pcAppointmentConfirmed:false,
      pcAppointmentDate:"",
      pcAppointmentEvidence:"",
      siteManager:"",
      firstAider:"",
      safetyAdviser:"",
      startDate:"",
      finishDate:"",
      appointmentDate:"",
      appointmentEvidence:"",
      welfare:"",
      induction:"",
      publicProtection:"",
      emergency:"",
      monitoring:"",
      f10:"",
      f10Ref:"",
      f10Date:"",
      f10LongAndTwenty:"unknown",
      f10PersonDays:"unknown",
      cdmComplianceManaged:false,
      f10ComplianceManaged:false,
      f10DocManaged:false,
      f10DecisionManaged:false,
      ramsComplianceManaged:false,
      ramsComplianceManual:false,
      docs:docs,
      risks:[],
      activeTab:"overview"
    };
  }
  function evspCdmNormalisePack(value){
    const src=value&&typeof value==="object"&&!Array.isArray(value)?value:{};
    const out=Object.assign({},evspCdmNewPack(),src);
    const routes=["delivery_appointed","other_appointed","single_contractor"];
    const routeAliases={installer_roles:"delivery_appointed",client_roles:"other_appointed"};
    out.version=EVSP_CDM_VERSION;
    const rawRoute=routeAliases[src.route]||src.route||routeAliases[src.dutyHolderRoute]||src.dutyHolderRoute;
    out.route=routes.includes(rawRoute)?rawRoute:"";
    ["client","clientContact","contractor","pd","pc","appointmentEvidence","pdAppointmentEvidence","pcAppointmentEvidence","siteManager","firstAider","safetyAdviser","welfare","induction","publicProtection","emergency","monitoring","f10Ref"].forEach(function(k){ out[k]=evspCdmText(src[k]); });
    out.startDate=evspCdmCleanDate(src.startDate);
    out.finishDate=evspCdmCleanDate(src.finishDate);
    out.appointmentDate=evspCdmCleanDate(src.appointmentDate);
    out.pdAppointmentDate=evspCdmCleanDate(src.pdAppointmentDate);
    out.pcAppointmentDate=evspCdmCleanDate(src.pcAppointmentDate);
    out.f10Date=evspCdmCleanDate(src.f10Date);
    out.appointmentsConfirmed=src.appointmentsConfirmed===true;
    out.pdAppointmentConfirmed=src.pdAppointmentConfirmed===true;
    out.pcAppointmentConfirmed=src.pcAppointmentConfirmed===true;
    const hasManagedV3=Number(src.version)>=3;
    out.cdmComplianceManaged=hasManagedV3&&src.cdmComplianceManaged===true;
    out.f10ComplianceManaged=hasManagedV3&&src.f10ComplianceManaged===true;
    out.f10DocManaged=hasManagedV3&&src.f10DocManaged===true;
    out.f10DecisionManaged=hasManagedV3&&src.f10DecisionManaged===true;
    out.ramsComplianceManaged=src.ramsComplianceManaged===true;
    out.ramsComplianceManual=src.ramsComplianceManual===true;
    out.f10=["notreq","tofile","filed"].includes(src.f10)?src.f10:"";
    const answers=["unknown","yes","no"];
    const legacyCriteria=src.f10Criteria&&typeof src.f10Criteria==="object"?src.f10Criteria:{};
    out.f10LongAndTwenty=answers.includes(src.f10LongAndTwenty)?src.f10LongAndTwenty:(answers.includes(legacyCriteria.longAndTwenty)?legacyCriteria.longAndTwenty:"unknown");
    out.f10PersonDays=answers.includes(src.f10PersonDays)?src.f10PersonDays:(answers.includes(legacyCriteria.personDays)?legacyCriteria.personDays:"unknown");
    const docsSrc=src.docs&&typeof src.docs==="object"&&!Array.isArray(src.docs)?src.docs:(src.documents&&typeof src.documents==="object"?src.documents:{});
    out.docs={};
    EVSP_CDM_DOC_DEFS.forEach(function(def){ out.docs[def.k]=evspCdmDocRecord(docsSrc[def.k]); });
    const riskIds=new Set();
    out.risks=Array.isArray(src.risks)?src.risks.filter(function(r){ return r&&typeof r==="object"; }).map(function(r){
      let riskId=evspCdmText(r.id)||evspCdmId();
      if(riskIds.has(riskId)) riskId=evspCdmId();
      riskIds.add(riskId);
      return Object.assign({},r,{
        id:riskId,
        presetKey:evspCdmText(r.presetKey),
        hazard:evspCdmText(r.hazard),
        who:evspCdmText(r.who),
        hierarchy:EVSP_CDM_HIERARCHY.some(function(x){ return x[0]===r.hierarchy; })?r.hierarchy:"control",
        decision:evspCdmText(r.decision||r.measure),
        residual:evspCdmText(r.residual),
        owner:evspCdmText(r.owner),
        dueDate:evspCdmCleanDate(r.dueDate),
        initialLikelihood:([1,2,3,4,5].includes(Number(r.initialLikelihood))?Number(r.initialLikelihood):""),
        initialSeverity:([1,2,3,4,5].includes(Number(r.initialSeverity))?Number(r.initialSeverity):""),
        residualLikelihood:([1,2,3,4,5].includes(Number(r.residualLikelihood))?Number(r.residualLikelihood):""),
        residualSeverity:([1,2,3,4,5].includes(Number(r.residualSeverity))?Number(r.residualSeverity):""),
        status:EVSP_CDM_RISK_STATUSES.some(function(x){ return x[0]===r.status; })?r.status:"open",
        source:evspCdmText(r.source)
      });
    }):[];
    out.activeTab=["overview","risks","documents","supporting"].includes(src.activeTab)?src.activeTab:"overview";
    return out;
  }
  function evspCdmEnsure(candidate){
    const p=evspCdmGetPack(candidate);
    if(!p) return evspCdmNewPack();
    p.cdm=evspCdmNormalisePack(p.cdm);
    const categoryKeys=new Set(EVSP_CDM_SUPPORT_CATEGORIES.map(function(pair){ return pair[0]; }));
    const statusKeys=new Set(EVSP_CDM_SUPPORT_STATUSES.map(function(pair){ return pair[0]; }));
    (Array.isArray(p.attachments)?p.attachments:[]).forEach(function(file){
      if(!file||typeof file!=="object") return;
      if(!categoryKeys.has(file.cdmCategory)) file.cdmCategory="";
      if(!file.cdmCategory) file.cdmCategory=evspCdmGuessAttachmentCategory(file.name);
      if(!statusKeys.has(file.cdmStatus)) file.cdmStatus="";
      file.cdmProvider=evspCdmText(file.cdmProvider);
      file.cdmReviewer=evspCdmText(file.cdmReviewer);
      file.cdmReviewDate=evspCdmCleanDate(file.cdmReviewDate);
      file.cdmRevision=evspCdmText(file.cdmRevision);
      file.cdmReviewNote=evspCdmText(file.cdmReviewNote);
    });
    return p.cdm;
  }
  function evspCdmPlanFacts(candidate){
    const p=evspCdmGetPack(candidate)||{};
    const facts={unitCount:0,bayCount:0,trenchCount:0,ductCount:0,herasCount:0,coneCount:0,exclusionCount:0,pedestrianCount:0,signboardCount:0,inspectionPitCount:0,spoilCount:0,electricalCount:0,heavyCount:0,highLevelCount:0,drillCount:0,liveCalloutCount:0,asbestosCalloutCount:0,siteSetupCount:0,firstAidCount:0,fireCount:0,trenchMetres:0};
    (Array.isArray(p.photos)?p.photos:[]).forEach(function(photo){
      (Array.isArray(photo.items)?photo.items:[]).forEach(function(item){
        if(item.type==="unit"){
          facts.unitCount++;
          if(item.variant==="dc_rapid"||item.variant==="twin_ped"||item.variant==="solo_dfsm") facts.heavyCount++;
        }
        if(item.type==="bay") facts.bayCount++;
        if(item.type==="route"){
          if(item.kind==="trench"){
            facts.trenchCount++;
            let len=Number(item.manualLen)||0;
            try{ if(!len&&typeof routeLen==="function") len=Number(routeLen(item,photo))||0; }catch(_){ }
            facts.trenchMetres+=len;
          }
          if(item.kind==="duct"||item.kind==="gully") facts.ductCount++;
          if(item.kind==="heras") facts.herasCount++;
          if(item.kind==="cones") facts.coneCount++;
          if(item.kind==="__area"&&item.surface==="exclusion") facts.exclusionCount++;
          if(item.kind==="__area"&&item.surface==="pedestrian") facts.pedestrianCount++;
          if(item.kind==="tray"||item.kind==="basket") facts.highLevelCount++;
          if(["swa","run","hituff","tails","earthcable","data"].includes(item.kind)) facts.electricalCount++;
        }
        if(["evdb","ipevdb","arrayboard","feeder","fusesaver","supply"].includes(item.type)) facts.electricalCount++;
        if(["feeder","fusepillar"].includes(item.type)) facts.heavyCount++;
        if(item.type==="mark"&&item.kind==="drill") facts.drillCount++;
        if(item.type==="mark"&&item.kind==="firstaid") facts.firstAidCount++;
        if(item.type==="mark"&&item.kind==="fire") facts.fireCount++;
        if(item.type==="stamp"){
          const stampText=evspCdmText(item.text||item.label).toLowerCase();
          if(/\blive\b|energised|energized/.test(stampText)) facts.liveCalloutCount++;
          if(/asbestos/.test(stampText)) facts.asbestosCalloutCount++;
        }
        if(item.type==="site"&&["cabin","container","toilet","skip"].includes(item.kind)) facts.siteSetupCount++;
        if(item.type==="site"&&item.kind==="signboard") facts.signboardCount++;
        if(item.type==="site"&&item.kind==="inspectionpit") facts.inspectionPitCount++;
        if(item.type==="site"&&item.kind==="spoil") facts.spoilCount++;
      });
    });
    facts.trenchMetres=Math.round(facts.trenchMetres*10)/10;
    return facts;
  }
  function evspCdmSuggestions(candidate){
    const p=evspCdmGetPack(candidate)||{};
    const s=evspCdmNormalisePack(p.cdm);
    const facts=evspCdmPlanFacts(p);
    const existing=new Set(s.risks.map(function(r){ return r.presetKey; }).filter(Boolean));
    return EVSP_CDM_RISK_PRESETS.filter(function(def){ return !existing.has(def.k)&&def.trigger(facts); }).map(function(def){
      return {
        presetKey:def.k,
        hazard:def.hazard,
        who:def.who,
        hierarchy:def.hierarchy,
        decision:def.decision,
        residual:def.residual,
        owner:"",
        status:"open",
        source:def.source(facts)
      };
    });
  }
  function evspCdmF10Verdict(state){
    const s=state&&typeof state==="object"?state:evspCdmEnsure();
    const a=s.f10LongAndTwenty||"unknown", b=s.f10PersonDays||"unknown";
    if(a==="yes"||b==="yes") return {code:"notifiable",label:"F10 notification required",detail:"At least one statutory notification threshold is met."};
    if(a==="no"&&b==="no") return {code:"not_required",label:"Not notifiable on the recorded thresholds",detail:"Neither statutory notification threshold is met on the information recorded."};
    return {code:"incomplete",label:"F10 assessment incomplete",detail:"Answer both threshold questions before relying on the result."};
  }
  function evspCdmF10FiledComplete(state){
    const s=state&&typeof state==="object"?state:evspCdmEnsure();
    const start=evspCdmCleanDate(s.startDate), filed=evspCdmCleanDate(s.f10Date);
    return evspCdmF10Verdict(s).code==="notifiable"&&s.f10==="filed"&&Boolean(evspCdmText(s.f10Ref).trim())&&Boolean(start)&&evspCdmDateNotFuture(filed)&&filed<=start;
  }
  function evspCdmDocReady(record,state,key){
    const r=record&&typeof record==="object"?record:{};
    if(r.status==="not_applicable") return Boolean(evspCdmText(r.notes).trim());
    const controlled=["issued","accepted"].includes(r.status)&&Boolean(evspCdmText(r.owner).trim())&&Boolean(evspCdmText(r.revision).trim())&&evspCdmDateNotFuture(r.date);
    if(!controlled) return false;
    if((key==="cpp"||key==="f10")&&state){
      const start=evspCdmCleanDate(state.startDate);
      return Boolean(start&&evspCdmDateOnOrBefore(r.date,start));
    }
    return true;
  }
  function evspCdmDocStats(state){
    const s=state&&typeof state==="object"?state:evspCdmEnsure();
    let ready=0,active=0,accepted=0;
    EVSP_CDM_DOC_DEFS.forEach(function(def){
      const st=(s.docs[def.k]||{}).status||"not_started";
      if(st!=="not_applicable") active++;
      if(evspCdmDocReady(s.docs[def.k],s,def.k)) ready++;
      if(st==="accepted") accepted++;
    });
    return {ready:ready,total:EVSP_CDM_DOC_DEFS.length,active:active,accepted:accepted};
  }
  function evspCdmAppointmentReady(state,role){
    const s=state&&typeof state==="object"?state:{};
    const prefix=role==="pc"?"pc":"pd";
    const date=s[prefix+"AppointmentDate"], evidence=evspCdmText(s[prefix+"AppointmentEvidence"]).trim();
    return s[prefix+"AppointmentConfirmed"]===true&&Boolean(evidence)&&evspCdmDateNotFuture(date)&&Boolean(evspCdmCleanDate(s.startDate))&&evspCdmDateOnOrBefore(date,s.startDate);
  }
  function evspCdmPublicContext(candidate,facts){
    const f=facts||evspCdmPlanFacts(candidate);
    return Boolean(f.unitCount||f.bayCount||f.herasCount||f.coneCount||f.exclusionCount||f.pedestrianCount||f.signboardCount);
  }
  function evspCdmSupportingReady(file){
    const a=file&&typeof file==="object"?file:{};
    return a.cdmStatus==="accepted"&&Boolean(evspCdmText(a.cdmProvider).trim())&&Boolean(evspCdmText(a.cdmReviewer).trim())&&evspCdmDateNotFuture(a.cdmReviewDate)&&Boolean(evspCdmText(a.cdmRevision).trim()||evspCdmText(a.cdmReviewNote).trim());
  }
  function evspCdmSetCompliance(p,key,state){
    if(!p) return;
    p.compliance=Array.isArray(p.compliance)?p.compliance.filter(function(k){ return k!==key; }):[];
    p.complianceNA=Array.isArray(p.complianceNA)?p.complianceNA.filter(function(k){ return k!==key; }):[];
    if(state==="done") p.compliance.push(key);
    if(state==="na") p.complianceNA.push(key);
  }
  function evspCdmComplianceState(p,key){
    if(Array.isArray(p&&p.compliance)&&p.compliance.includes(key)) return "done";
    if(Array.isArray(p&&p.complianceNA)&&p.complianceNA.includes(key)) return "na";
    return "todo";
  }
  function evspCdmSetManagedCompliance(p,state,key,next,flag){
    const managed=state[flag]===true, current=evspCdmComplianceState(p,key);
    if(managed){
      evspCdmSetCompliance(p,key,next);
      if(next==="todo") state[flag]=false;
      return;
    }
    if(current==="todo"&&next!=="todo"){
      evspCdmSetCompliance(p,key,next);
      state[flag]=true;
    }
  }
  function evspCdmCoreReady(candidate,state,facts){
    const p=evspCdmGetPack(candidate)||{}, s=state||evspCdmNormalisePack(p.cdm), f=facts||evspCdmPlanFacts(p);
    const clientOk=Boolean(evspCdmText(s.client||p.custName).trim());
    const rolesOk=s.route==="single_contractor"?Boolean(s.contractor.trim()):Boolean(s.pd.trim()&&s.pc.trim()&&evspCdmAppointmentReady(s,"pd")&&evspCdmAppointmentReady(s,"pc"));
    const arrangementsOk=Boolean(s.siteManager.trim()&&s.firstAider.trim()&&s.welfare.trim()&&s.induction.trim()&&s.emergency.trim()&&s.monitoring.trim()&&(!evspCdmPublicContext(p,f)||s.publicProtection.trim()));
    return Boolean(s.route&&clientOk&&rolesOk&&evspCdmProgrammeValid(s)&&arrangementsOk&&evspCdmDocReady(s.docs.cpp,s,"cpp"));
  }
  function evspCdmSyncCompliance(candidate){
    const p=evspCdmGetPack(candidate);
    if(!p) return;
    const s=evspCdmEnsure(p);
    const f10=evspCdmF10Verdict(s);
    const autoF10Reason="Not notifiable on the recorded thresholds: both assessment answers are No.";
    const clearManagedF10Document=function(){
      if(!s.f10DocManaged) return;
      if(s.docs.f10.status==="not_applicable") s.docs.f10.status="not_started";
      if(s.docs.f10.notes.trim()===autoF10Reason) s.docs.f10.notes="";
      s.f10DocManaged=false;
    };
    if(f10.code==="notifiable"){
      clearManagedF10Document();
      if(s.f10!=="filed"&&(s.f10DecisionManaged||!s.f10)){ s.f10="tofile"; s.f10DecisionManaged=true; }
      evspCdmSetManagedCompliance(p,s,"f10",evspCdmF10FiledComplete(s)?"done":"todo","f10ComplianceManaged");
    }else if(f10.code==="not_required"){
      if(s.f10!=="filed"&&(s.f10DecisionManaged||!s.f10)){ s.f10="notreq"; s.f10DecisionManaged=true; }
      if(s.f10DocManaged||s.docs.f10.status==="not_started"){
        s.docs.f10.status="not_applicable";
        if(!s.docs.f10.notes.trim()||s.f10DocManaged) s.docs.f10.notes=autoF10Reason;
        s.f10DocManaged=true;
      }
      evspCdmSetManagedCompliance(p,s,"f10","na","f10ComplianceManaged");
    }else{
      clearManagedF10Document();
      if(s.f10DecisionManaged&&s.f10!=="filed"){ s.f10=""; s.f10DecisionManaged=false; }
      evspCdmSetManagedCompliance(p,s,"f10","todo","f10ComplianceManaged");
    }
    evspCdmSetManagedCompliance(p,s,"cdm",evspCdmCoreReady(p,s)?"done":"todo","cdmComplianceManaged");
    const acceptedRams=(Array.isArray(p.attachments)?p.attachments:[]).some(function(a){ return a&&a.cdmCategory==="rams"&&evspCdmSupportingReady(a); });
    const alreadyDone=Array.isArray(p.compliance)&&p.compliance.includes("rams");
    if(acceptedRams&&!s.ramsComplianceManual){
      if(!alreadyDone){ evspCdmSetCompliance(p,"rams","done"); s.ramsComplianceManaged=true; }
    }else if(s.ramsComplianceManaged){
      evspCdmSetCompliance(p,"rams","todo");
      s.ramsComplianceManaged=false;
    }
  }
  function evspCdmAssessment(candidate){
    const p=evspCdmGetPack(candidate)||{};
    if(p.mode==="domestic") return {required:false,complete:true,score:100,status:"not_applicable",issues:[],blockingIssues:[],docs:{ready:0,total:0},f10:{code:"not_applicable",label:"Not applicable"}};
    const s=evspCdmNormalisePack(p.cdm), facts=evspCdmPlanFacts(p), issues=[], checks=[];
    const addCheck=function(ok){ checks.push(Boolean(ok)); };
    if(!s.route) issues.push({severity:"warning",blocking:false,text:"Choose the CDM delivery and duty-holder arrangement."});
    addCheck(s.route);
    const clientOk=Boolean(evspCdmText(s.client||p.custName).trim());
    if(s.route&&!clientOk) issues.push({severity:"warning",blocking:true,text:"Record the commercial client for the project."});
    addCheck(!s.route||clientOk);
    const rolesOk=s.route==="single_contractor"?Boolean(s.contractor.trim()):Boolean(s.pd.trim()&&s.pc.trim());
    if(s.route==="single_contractor"&&!rolesOk) issues.push({severity:"error",blocking:true,text:"Record the contractor responsible for preparing the construction phase plan."});
    if(s.route&&s.route!=="single_contractor"&&!rolesOk) issues.push({severity:"error",blocking:true,text:"Record both principal duty holders for this multi-contractor project."});
    const pdAppointmentOk=s.route==="single_contractor"||evspCdmAppointmentReady(s,"pd"), pcAppointmentOk=s.route==="single_contractor"||evspCdmAppointmentReady(s,"pc");
    if(s.route&&s.route!=="single_contractor"&&!pdAppointmentOk) issues.push({severity:"warning",blocking:true,text:"Confirm the principal designer's written appointment with valid evidence dated no later than the planned start."});
    if(s.route&&s.route!=="single_contractor"&&!pcAppointmentOk) issues.push({severity:"warning",blocking:true,text:"Confirm the principal contractor's written appointment with valid evidence dated no later than the planned start."});
    addCheck(!s.route||rolesOk&&pdAppointmentOk&&pcAppointmentOk);
    const programmeOk=evspCdmProgrammeValid(s);
    if(s.route&&(!s.startDate||!s.finishDate)) issues.push({severity:"warning",blocking:true,text:"Record the planned construction start and finish dates."});
    else if(s.route&&!programmeOk) issues.push({severity:"error",blocking:true,text:"The planned finish date must be on or after the planned start date."});
    addCheck(!s.route||programmeOk);
    const siteRolesOk=Boolean(s.siteManager.trim()&&s.firstAider.trim());
    if(s.route&&!s.siteManager.trim()) issues.push({severity:"warning",blocking:true,text:"Record the site manager or supervisor."});
    if(s.route&&!s.firstAider.trim()) issues.push({severity:"warning",blocking:true,text:"Record the first-aid appointment and contact."});
    addCheck(!s.route||siteRolesOk);
    const arrangementsOk=Boolean(s.welfare.trim()&&s.induction.trim()&&s.emergency.trim()&&s.monitoring.trim());
    if(s.route&&!s.welfare.trim()) issues.push({severity:"error",blocking:true,text:"Record the welfare arrangements available from day one."});
    if(s.route&&!s.induction.trim()) issues.push({severity:"warning",blocking:true,text:"Record the site induction and workforce consultation arrangements."});
    if(s.route&&!s.emergency.trim()) issues.push({severity:"error",blocking:true,text:"Record the project emergency arrangements."});
    if(s.route&&!s.monitoring.trim()) issues.push({severity:"warning",blocking:true,text:"Record how the construction arrangements will be monitored and reviewed."});
    addCheck(!s.route||arrangementsOk);
    const publicRequired=evspCdmPublicContext(p,facts), publicOk=!publicRequired||Boolean(s.publicProtection.trim());
    if(s.route&&publicRequired&&!publicOk) issues.push({severity:"error",blocking:true,text:"The plan indicates a public or site-user interface. Record the segregation and public-protection arrangements."});
    addCheck(!s.route||publicOk);
    const f10=evspCdmF10Verdict(s);
    if(s.route&&f10.code==="incomplete") issues.push({severity:"warning",blocking:true,text:"Complete the two F10 threshold questions."});
    if(f10.code==="notifiable"&&!evspCdmF10FiledComplete(s)) issues.push({severity:"error",blocking:true,text:"The project is notifiable. Record an HSE reference and a valid filing date that is not in the future or after the planned start."});
    addCheck(f10.code!=="incomplete"&&(f10.code!=="notifiable"||evspCdmF10FiledComplete(s)));
    const cppReady=evspCdmDocReady(s.docs.cpp,s,"cpp");
    if(s.route&&!cppReady) issues.push({severity:"error",blocking:true,text:"Issue the construction phase plan with owner, revision and a non-future issue date no later than the planned start."});
    addCheck(cppReady);
    const incompleteRisks=s.risks.filter(function(r){ return !r.hazard.trim()||!r.decision.trim()||!r.residual.trim()||!r.owner.trim()||!evspCdmCleanDate(r.dueDate)||r.status==="open"; });
    const unratedRisks=s.risks.filter(function(r){ return !r.initialLikelihood||!r.initialSeverity||!r.residualLikelihood||!r.residualSeverity; });
    if(!s.risks.length) issues.push({severity:"warning",blocking:Boolean(s.route),text:"Review the plan-derived design risks and record the design decisions before marking the controls ready."});
    if(incompleteRisks.length) issues.push({severity:"warning",blocking:true,text:incompleteRisks.length+" design risk"+(incompleteRisks.length===1?" needs":"s need")+" a due date, owner, design action, residual-risk record and controlled status."});
    if(unratedRisks.length) issues.push({severity:"warning",blocking:true,text:unratedRisks.length+" design risk"+(unratedRisks.length===1?" has":"s have")+" incomplete initial or residual ratings."});
    addCheck(s.risks.length>0&&incompleteRisks.length===0&&unratedRisks.length===0);
    const docs=evspCdmDocStats(s);
    const metadataGaps=EVSP_CDM_DOC_DEFS.filter(function(def){ const r=s.docs[def.k]; return ["issued","accepted"].includes(r.status)&&!evspCdmDocReady(r,s,def.k); });
    if(metadataGaps.length) issues.push({severity:"warning",blocking:false,text:metadataGaps.length+" controlled document"+(metadataGaps.length===1?" has":"s have")+" issued or accepted status but incomplete, future-dated or late metadata."});
    const documentThreshold=Math.max(1,Math.ceil(docs.total*.6)), documentsOk=docs.ready>=documentThreshold;
    if(s.route&&!documentsOk) issues.push({severity:"warning",blocking:true,text:"Complete or justify at least "+documentThreshold+" of the "+docs.total+" controlled document records before marking the controls ready."});
    addCheck(documentsOk);
    const invalidAccepted=(Array.isArray(p.attachments)?p.attachments:[]).filter(function(file){ return file&&file.cdmStatus==="accepted"&&!evspCdmSupportingReady(file); });
    if(invalidAccepted.length) issues.push({severity:"warning",blocking:false,text:invalidAccepted.length+" supporting document"+(invalidAccepted.length===1?" is":"s are")+" marked accepted but lacks provider, reviewer, review date, or acceptance evidence."});
    const manualCdm=evspCdmComplianceState(p,"cdm")!=="todo"&&!s.cdmComplianceManaged&&!evspCdmCoreReady(p,s,facts);
    const expectedF10=f10.code==="not_required"?"na":(evspCdmF10FiledComplete(s)?"done":"todo");
    const manualF10=evspCdmComplianceState(p,"f10")!=="todo"&&!s.f10ComplianceManaged&&evspCdmComplianceState(p,"f10")!==expectedF10;
    if(manualCdm||manualF10) issues.push({severity:"warning",blocking:false,text:"A legacy or manually set compliance state has been preserved. Review it against the current CDM evidence before relying on it."});
    const score=Math.round(100*checks.filter(Boolean).length/Math.max(1,checks.length));
    const blockingIssues=issues.filter(function(i){ return i.blocking; });
    const complete=Boolean(s.route)&&blockingIssues.length===0&&cppReady&&documentsOk;
    return {required:true,complete:complete,score:score,status:complete?"ready":(s.route?"in_progress":"not_started"),issues:issues,blockingIssues:blockingIssues,docs:docs,f10:f10,risks:{total:s.risks.length,incomplete:incompleteRisks.length,unrated:unratedRisks.length},suggestions:evspCdmSuggestions(p).length};
  }
  function evspCdmRouteLabel(route){
    const found=EVSP_CDM_ROUTE_DEFS.find(function(d){ return d.k===route; });
    return found?found.title:"Arrangement not chosen";
  }
  function evspCdmCardHTML(candidate){
    const p=evspCdmGetPack(candidate);
    if(!p||p.mode==="domestic") return "";
    const a=evspCdmAssessment(p), s=evspCdmNormalisePack(p.cdm);
    const f10Class=a.f10.code==="notifiable"?(evspCdmF10FiledComplete(s)?"ok":"bad"):(a.f10.code==="not_required"?"ok":"warn");
    const docClass=a.docs.ready===a.docs.total?"ok":(a.docs.ready?"warn":"");
    const riskClass=a.risks.total&&a.risks.incomplete===0&&!a.risks.unrated?"ok":(a.risks.total?"warn":"");
    const stateLabel=a.complete?"Core controls ready for review":(s.route?"CDM controls in progress":"Set up CDM controls");
    return '<div class="card evsp-cdm-card">'
      +'<h3><span class="dot"></span>CDM project controls</h3>'
      +'<div class="evsp-cdm-card-head"><div class="evsp-cdm-score" style="border-color:'+(a.score>=80?'var(--ok,#4ba069)':(a.score>=45?'#ce9e2e':'var(--line2,#d5dde4)'))+'">'+a.score+'%</div>'
      +'<div class="evsp-cdm-card-copy"><b>'+evspCdmEsc(stateLabel)+'</b><small>'+evspCdmEsc(evspCdmRouteLabel(s.route))+'</small></div></div>'
      +'<div class="evsp-cdm-pills">'
      +'<span class="evsp-cdm-pill '+docClass+'">Documents '+a.docs.ready+'/'+a.docs.total+'</span>'
      +'<span class="evsp-cdm-pill '+riskClass+'">Design risks '+a.risks.total+'</span>'
      +'<span class="evsp-cdm-pill '+f10Class+'">'+evspCdmEsc(a.f10.label)+'</span>'
      +'</div>'
      +(a.blockingIssues.length?'<div class="evsp-cdm-note"><strong>Next:</strong> '+evspCdmEsc(a.blockingIssues[0].text)+'</div>':'')
      +'<button type="button" id="evspCdmOpen" class="addbtn evsp-cdm-open" data-evsp-cdm-open="overview">Open CDM project controls</button>'
      +'</div>';
  }
  function evspCdmComplianceDetailHTML(key,candidate){
    const p=evspCdmGetPack(candidate);
    if(!p||p.mode==="domestic"||!["cdm","f10"].includes(key)) return "";
    const a=evspCdmAssessment(p), s=evspCdmNormalisePack(p.cdm);
    const copy=key==="f10"?a.f10.label:(s.route?evspCdmRouteLabel(s.route):"Duty-holder arrangement not recorded");
    return '<div class="evsp-cdm-note" style="margin:4px 0 7px"><strong>'+evspCdmEsc(copy)+'</strong><div class="evsp-cdm-actions"><button type="button" class="evsp-cdm-btn" data-evsp-cdm-open="overview">Open CDM controls</button></div></div>';
  }

  function evspCdmField(label,key,value,options){
    options=options||{};
    const cls="evsp-cdm-field"+(options.full?" full":"");
    const attrs=' data-evsp-cdm-field="'+evspCdmEsc(key)+'"';
    let control="";
    if(options.type==="textarea") control='<textarea'+attrs+' placeholder="'+evspCdmEsc(options.placeholder||"")+'">'+evspCdmEsc(value)+'</textarea>';
    else if(options.options) control='<select'+attrs+'>'+evspCdmOptionHtml(options.options,value)+'</select>';
    else control='<input type="'+evspCdmEsc(options.type||"text")+'"'+attrs+' value="'+evspCdmEsc(value)+'" placeholder="'+evspCdmEsc(options.placeholder||"")+'">';
    return '<label class="'+cls+'"><span>'+evspCdmEsc(label)+'</span>'+control+'</label>';
  }
  function evspCdmReadinessRows(assessment){
    if(!assessment.issues.length) return '<div class="evsp-cdm-summary-row"><i class="ok"></i><span>No blocking gaps are recorded in the CDM controls.</span></div>';
    return assessment.issues.map(function(issue){
      const cls=issue.severity==="error"?"bad":"warn";
      return '<div class="evsp-cdm-summary-row"><i class="'+cls+'"></i><span>'+evspCdmEsc(issue.text)+'</span></div>';
    }).join("");
  }
  function evspCdmOverviewHTML(candidate){
    const p=evspCdmGetPack(candidate)||{}, s=evspCdmEnsure(p), a=evspCdmAssessment(p), facts=evspCdmPlanFacts(p), f10=a.f10;
    const routes=EVSP_CDM_ROUTE_DEFS.map(function(def){
      return '<button type="button" class="evsp-cdm-route '+(s.route===def.k?'on':'')+'" data-evsp-cdm-route="'+def.k+'" aria-pressed="'+(s.route===def.k?'true':'false')+'"><b>'+evspCdmEsc(def.title)+'</b><span>'+evspCdmEsc(def.body)+'</span></button>';
    }).join("");
    const yesNo=[["unknown","Select"],["yes","Yes"],["no","No"]];
    const verdictClass=f10.code==="notifiable"?(evspCdmF10FiledComplete(s)?"ok":"bad"):(f10.code==="not_required"?"ok":"warn");
    const counts=[];
    if(facts.unitCount) counts.push(facts.unitCount+" charger"+(facts.unitCount===1?"":"s"));
    if(facts.trenchCount||facts.ductCount) counts.push((facts.trenchCount+facts.ductCount)+" excavation or buried-route item"+(facts.trenchCount+facts.ductCount===1?"":"s"));
    if(facts.herasCount) counts.push(facts.herasCount+" barrier route"+(facts.herasCount===1?"":"s"));
    if(facts.siteSetupCount) counts.push(facts.siteSetupCount+" site-setup item"+(facts.siteSetupCount===1?"":"s"));
    const legacyAppointment=(s.appointmentsConfirmed||s.appointmentDate||s.appointmentEvidence)?'<div class="evsp-cdm-note" style="margin-top:10px"><strong>Legacy combined appointment record retained.</strong> Reconfirm the principal designer and principal contractor separately before relying on it.'+(s.appointmentEvidence?'<br>Previous evidence reference: '+evspCdmEsc(s.appointmentEvidence):'')+'</div>':'';
    return '<div class="evsp-cdm-grid">'
      +'<section class="evsp-cdm-section full"><h3>Delivery and duty-holder arrangement</h3><p class="evsp-cdm-lead">Record how the project is organised. Principal designer and principal contractor duties apply when more than one contractor is, or is likely to be, involved.</p><div class="evsp-cdm-routes">'+routes+'</div></section>'
      +'<section class="evsp-cdm-section"><h3>Project and client</h3><p class="evsp-cdm-lead">These fields are specific to the construction phase and sit alongside the project details already held in the planner.</p><div class="evsp-cdm-fields">'
      +evspCdmField("Client organisation","client",s.client,{placeholder:p.custName||"Client or commissioning body"})
      +evspCdmField("Client contact","clientContact",s.clientContact,{placeholder:"Name, email or phone"})
      +evspCdmField("Planned start","startDate",s.startDate,{type:"date"})
      +evspCdmField("Planned finish","finishDate",s.finishDate,{type:"date"})
      +'</div></section>'
      +'<section class="evsp-cdm-section"><h3>Named project roles</h3><p class="evsp-cdm-lead">Use organisations as well as individual names where that makes the appointment clearer.</p><div class="evsp-cdm-fields">'
      +(s.route==="single_contractor"?evspCdmField("Contractor preparing the CPP","contractor",s.contractor,{placeholder:"Name and organisation"}):'')
      +(s.route!=="single_contractor"?evspCdmField("Principal designer","pd",s.pd,{placeholder:"Name and organisation"})+evspCdmField("Principal contractor","pc",s.pc,{placeholder:"Name and organisation"}):'')
      +evspCdmField("Site manager","siteManager",s.siteManager,{placeholder:"Name and contact"})
      +evspCdmField("First aider","firstAider",s.firstAider,{placeholder:"Name and contact"})
      +evspCdmField("Safety adviser","safetyAdviser",s.safetyAdviser,{placeholder:"Optional"})
      +'</div>'
      +(s.route&&s.route!=="single_contractor"?'<div class="evsp-cdm-appointments"><div class="evsp-cdm-appointment"><b>Principal designer appointment</b><div class="evsp-cdm-fields">'+evspCdmField("Written appointment date","pdAppointmentDate",s.pdAppointmentDate,{type:"date"})+evspCdmField("Evidence reference","pdAppointmentEvidence",s.pdAppointmentEvidence,{placeholder:"File name, letter reference or attachment"})+'</div><label class="evsp-cdm-check"><input type="checkbox" data-evsp-cdm-check="pdAppointmentConfirmed" '+(s.pdAppointmentConfirmed?'checked':'')+'><span>The written principal designer appointment has been checked and accepted.</span></label></div><div class="evsp-cdm-appointment"><b>Principal contractor appointment</b><div class="evsp-cdm-fields">'+evspCdmField("Written appointment date","pcAppointmentDate",s.pcAppointmentDate,{type:"date"})+evspCdmField("Evidence reference","pcAppointmentEvidence",s.pcAppointmentEvidence,{placeholder:"File name, letter reference or attachment"})+'</div><label class="evsp-cdm-check"><input type="checkbox" data-evsp-cdm-check="pcAppointmentConfirmed" '+(s.pcAppointmentConfirmed?'checked':'')+'><span>The written principal contractor appointment has been checked and accepted.</span></label></div></div>'+legacyAppointment:'')
      +'</section>'
      +'<section class="evsp-cdm-section full"><h3>F10 notification assessment</h3><p class="evsp-cdm-lead">A project is notifiable if either threshold below is met. Record the actual planned construction work, not the wider programme.</p>'
      +'<div class="evsp-cdm-f10-question"><b>Is the construction work scheduled to last longer than 30 working days and have more than 20 workers working simultaneously at any point?</b><select data-evsp-cdm-field="f10LongAndTwenty">'+evspCdmOptionHtml(yesNo,s.f10LongAndTwenty)+'</select></div>'
      +'<div class="evsp-cdm-f10-question"><b>Is the construction work scheduled to exceed 500 person-days?</b><select data-evsp-cdm-field="f10PersonDays">'+evspCdmOptionHtml(yesNo,s.f10PersonDays)+'</select></div>'
      +'<div class="evsp-cdm-verdict '+verdictClass+'"><b>'+evspCdmEsc(f10.label)+'</b><br>'+evspCdmEsc(f10.detail)
      +(f10.code==="notifiable"?'<div class="evsp-cdm-actions"><label class="evsp-cdm-check"><input type="checkbox" data-evsp-cdm-f10-filed '+(s.f10==="filed"?'checked':'')+'><span>F10 filed with HSE</span></label></div><div class="evsp-cdm-fields" style="margin-top:9px">'+evspCdmField("HSE reference","f10Ref",s.f10Ref,{placeholder:"Notification reference"})+evspCdmField("Date filed","f10Date",s.f10Date,{type:"date"})+'</div>':'')
      +'</div><div class="evsp-cdm-note" style="margin-top:10px"><strong>Threshold basis:</strong> longer than 30 working days with more than 20 workers working simultaneously at any point, or more than 500 person-days. For a commercial project, the client must notify HSE before the construction phase begins. <a href="https://www.hse.gov.uk/forms/notification/f10.htm" target="_blank" rel="noopener">Open HSE F10 guidance</a>.</div></section>'
      +'<section class="evsp-cdm-section"><h3>Construction arrangements</h3><p class="evsp-cdm-lead">Capture the site-specific arrangements that feed the construction phase plan and CDM pack.</p><div class="evsp-cdm-fields">'
      +evspCdmField("Welfare","welfare",s.welfare,{type:"textarea",full:true,placeholder:"Toilets, washing, drinking water, rest and changing facilities from day one"})
      +evspCdmField("Induction and consultation","induction",s.induction,{type:"textarea",full:true,placeholder:"Who inducts, how toolbox talks and workforce feedback are recorded"})
      +evspCdmField("Public protection and site security","publicProtection",s.publicProtection,{type:"textarea",full:true,placeholder:"Barriers, pedestrian routes, vehicle control, signage and out-of-hours security"})
      +evspCdmField("Emergency arrangements","emergency",s.emergency,{type:"textarea",full:true,placeholder:"Muster point, first aid, fire, nearest A&E and emergency contacts"})
      +evspCdmField("Monitoring and review","monitoring",s.monitoring,{type:"textarea",full:true,placeholder:"Inspections, coordination meetings, change control and review frequency"})
      +'</div></section>'
      +'<section class="evsp-cdm-section"><h3>Readiness and marked-plan evidence</h3><p class="evsp-cdm-lead">The marked plans currently show '+evspCdmEsc(counts.length?counts.join(", "):"no construction markup yet")+'.</p><div class="evsp-cdm-summary-list">'+evspCdmReadinessRows(a)+'</div>'
      +(a.suggestions?'<div class="evsp-cdm-actions"><button type="button" class="evsp-cdm-btn" data-evsp-cdm-tab="risks">Review '+a.suggestions+' plan-derived risk suggestion'+(a.suggestions===1?'':'s')+'</button></div>':'')
      +'</section></div>';
  }
  function evspCdmRiskStatusLabel(status){
    const found=EVSP_CDM_RISK_STATUSES.find(function(pair){ return pair[0]===status; });
    return found?found[1]:"Open";
  }
  function evspCdmRisksHTML(candidate){
    const p=evspCdmGetPack(candidate)||{}, s=evspCdmEnsure(p), suggestions=evspCdmSuggestions(p);
    const ratingOptions=[["","Not rated"],["1","1"],["2","2"],["3","3"],["4","4"],["5","5"]];
    const suggestionHtml=suggestions.length?suggestions.map(function(r){
      return '<div class="evsp-cdm-suggestion"><div><b>'+evspCdmEsc(r.hazard)+'</b><span>'+evspCdmEsc(r.source)+'. Suggested design response: '+evspCdmEsc(r.decision)+'</span></div><button type="button" class="evsp-cdm-btn" data-evsp-cdm-add-suggestion="'+evspCdmEsc(r.presetKey)+'">Add risk</button></div>';
    }).join(""):'<div class="evsp-cdm-empty">No new plan-derived suggestions. Continue to review the design for hazards that cannot be detected from markup alone.</div>';
    const riskHtml=s.risks.length?s.risks.map(function(r,index){
      const statusClass=r.status==="closed"?"ok":(r.status==="open"?"warn":"");
      const initialScore=Number(r.initialLikelihood)*Number(r.initialSeverity)||0, residualScore=Number(r.residualLikelihood)*Number(r.residualSeverity)||0;
      const ratingText=initialScore?(' | initial '+initialScore+(residualScore?', residual '+residualScore:'')):'';
      return '<details class="evsp-cdm-risk" data-evsp-cdm-risk-row="'+evspCdmEsc(r.id)+'">'
        +'<summary><div class="evsp-cdm-risk-title"><b>'+(evspCdmEsc(r.hazard)||('Design risk '+(index+1)))+'</b><small>'+evspCdmEsc(r.source||"Manually recorded")+evspCdmEsc(ratingText)+'</small></div><span class="evsp-cdm-status '+statusClass+'">'+evspCdmEsc(evspCdmRiskStatusLabel(r.status))+'</span></summary>'
        +'<div class="evsp-cdm-risk-body"><div class="evsp-cdm-risk-grid">'
        +'<label class="evsp-cdm-field full"><span>Hazard</span><input data-evsp-cdm-risk-field="hazard" value="'+evspCdmEsc(r.hazard)+'" placeholder="Hazard or design issue"></label>'
        +'<label class="evsp-cdm-field"><span>Who may be affected</span><input data-evsp-cdm-risk-field="who" value="'+evspCdmEsc(r.who)+'" placeholder="Workers, site users, public"></label>'
        +'<label class="evsp-cdm-field"><span>Design hierarchy</span><select data-evsp-cdm-risk-field="hierarchy">'+evspCdmOptionHtml(EVSP_CDM_HIERARCHY,r.hierarchy)+'</select></label>'
        +'<label class="evsp-cdm-field"><span>Owner</span><input data-evsp-cdm-risk-field="owner" value="'+evspCdmEsc(r.owner)+'" placeholder="Person or organisation"></label>'
        +'<label class="evsp-cdm-field"><span>Action due</span><input type="date" data-evsp-cdm-risk-field="dueDate" value="'+evspCdmEsc(r.dueDate||"")+'"></label>'
        +'<label class="evsp-cdm-field"><span>Status</span><select data-evsp-cdm-risk-field="status">'+evspCdmOptionHtml(EVSP_CDM_RISK_STATUSES,r.status)+'</select></label>'
        +'<label class="evsp-cdm-field"><span>Initial likelihood (1 to 5)</span><select data-evsp-cdm-risk-field="initialLikelihood">'+evspCdmOptionHtml(ratingOptions,String(r.initialLikelihood||""))+'</select></label>'
        +'<label class="evsp-cdm-field"><span>Initial severity (1 to 5)</span><select data-evsp-cdm-risk-field="initialSeverity">'+evspCdmOptionHtml(ratingOptions,String(r.initialSeverity||""))+'</select></label>'
        +'<label class="evsp-cdm-field"><span>Residual likelihood (1 to 5)</span><select data-evsp-cdm-risk-field="residualLikelihood">'+evspCdmOptionHtml(ratingOptions,String(r.residualLikelihood||""))+'</select></label>'
        +'<label class="evsp-cdm-field"><span>Residual severity (1 to 5)</span><select data-evsp-cdm-risk-field="residualSeverity">'+evspCdmOptionHtml(ratingOptions,String(r.residualSeverity||""))+'</select></label>'
        +'<label class="evsp-cdm-field full"><span>Design decision and action</span><textarea data-evsp-cdm-risk-field="decision" placeholder="What was eliminated, reduced, controlled or communicated">'+evspCdmEsc(r.decision)+'</textarea></label>'
        +'<label class="evsp-cdm-field full"><span>Residual risk and information to pass on</span><textarea data-evsp-cdm-risk-field="residual" placeholder="What remains and who needs to know">'+evspCdmEsc(r.residual)+'</textarea></label>'
        +'</div><div class="evsp-cdm-actions"><button type="button" class="evsp-cdm-btn danger" data-evsp-cdm-remove-risk="'+evspCdmEsc(r.id)+'">Remove risk</button></div></div></details>';
    }).join(""):'<div class="evsp-cdm-empty">No design risks have been recorded yet. Add the plan-derived suggestions or create a project-specific risk.</div>';
    return '<div class="evsp-cdm-grid"><section class="evsp-cdm-section full"><h3>Plan-derived suggestions</h3><p class="evsp-cdm-lead">Suggestions use marked-up routes, equipment and site-setup items. They are prompts for designer review, not an automatic risk assessment.</p><div class="evsp-cdm-risks">'+suggestionHtml+'</div>'
      +(suggestions.length>1?'<div class="evsp-cdm-actions"><button type="button" class="evsp-cdm-btn" data-evsp-cdm-add-all-suggestions>Add all suggestions</button></div>':'')
      +'</section><section class="evsp-cdm-section full"><h3>Designer risk register</h3><p class="evsp-cdm-lead">Use the hierarchy in order: eliminate the hazard where practicable, then reduce it, control remaining exposure and clearly inform others of residual risk.</p><div class="evsp-cdm-risks">'+riskHtml+'</div><div class="evsp-cdm-actions"><button type="button" class="evsp-cdm-btn primary" data-evsp-cdm-add-risk>Add project-specific risk</button></div></section></div>';
  }
  function evspCdmDocumentsHTML(candidate){
    const p=evspCdmGetPack(candidate)||{}, s=evspCdmEnsure(p), stats=evspCdmDocStats(s);
    const docs=EVSP_CDM_DOC_DEFS.map(function(def){
      const r=s.docs[def.k], ready=evspCdmDocReady(r,s,def.k), na=r.status==="not_applicable", metadataMissing=["issued","accepted"].includes(r.status)&&!ready, naReasonMissing=na&&!ready;
      return '<details class="evsp-cdm-doc" data-evsp-cdm-doc-row="'+def.k+'">'
        +'<summary><div class="evsp-cdm-doc-title"><b>'+evspCdmEsc(def.title)+'</b><small>'+evspCdmEsc(def.reg)+' | '+evspCdmEsc(def.purpose)+'</small></div><span class="evsp-cdm-status '+(ready?'ok':(metadataMissing||naReasonMissing||r.status==="draft"?'warn':(na?'na':'')))+'">'+evspCdmEsc(EVSP_CDM_DOC_STATUS_LABEL[r.status]+(metadataMissing?", evidence incomplete or date invalid":(naReasonMissing?", reason missing":"")))+'</span></summary>'
        +'<div class="evsp-cdm-doc-body"><div class="evsp-cdm-doc-grid">'
        +'<label class="evsp-cdm-field"><span>Status</span><select data-evsp-cdm-doc-field="status">'+evspCdmOptionHtml(EVSP_CDM_DOC_STATUSES,r.status)+'</select></label>'
        +'<label class="evsp-cdm-field"><span>Owner</span><input data-evsp-cdm-doc-field="owner" value="'+evspCdmEsc(r.owner)+'" placeholder="Person or organisation"></label>'
        +'<label class="evsp-cdm-field"><span>Revision</span><input data-evsp-cdm-doc-field="revision" value="'+evspCdmEsc(r.revision)+'" placeholder="e.g. P02 or C01"></label>'
        +'<label class="evsp-cdm-field"><span>Issue or acceptance date</span><input type="date" data-evsp-cdm-doc-field="date" value="'+evspCdmEsc(r.date)+'"></label>'
        +'<label class="evsp-cdm-field full"><span>Notes, reference or next action</span><textarea data-evsp-cdm-doc-field="notes" placeholder="Document reference, recipient, acceptance evidence or outstanding action">'+evspCdmEsc(r.notes)+'</textarea></label>'
        +'</div></div></details>';
    }).join("");
    return '<div class="evsp-cdm-grid"><section class="evsp-cdm-section full"><h3>CDM document register</h3><p class="evsp-cdm-lead">'+stats.ready+' of '+stats.total+' records have controlled evidence or a justified not-applicable decision. Issued or accepted records need an owner, revision and non-future date. CPP and F10 evidence must not be dated after the planned start.</p><div class="evsp-cdm-docs">'+docs+'</div></section></div>';
  }
  function evspCdmSupportingHTML(candidate){
    const p=evspCdmGetPack(candidate)||{};
    const attachments=Array.isArray(p.attachments)?p.attachments:[];
    const rows=attachments.length?attachments.map(function(a){
      const ext=(String(a.name||"").split(".").pop()||"file").toUpperCase();
      const status=a.cdmStatus||"", acceptedReady=evspCdmSupportingReady(a), acceptedGap=status==="accepted"&&!acceptedReady;
      return '<details class="evsp-cdm-attachment" data-evsp-cdm-attachment-row="'+evspCdmEsc(a.id)+'">'
        +'<summary><div class="evsp-cdm-attachment-title"><b>'+evspCdmEsc(a.name||"Project file")+'</b><small>'+evspCdmEsc(ext)+(a.cdmProvider?' | '+evspCdmEsc(a.cdmProvider):'')+'</small></div><span class="evsp-cdm-status '+(acceptedReady?'ok':(status==="reviewed"||acceptedGap?'warn':''))+'">'+evspCdmEsc((EVSP_CDM_SUPPORT_STATUSES.find(function(x){return x[0]===status;})||["","Not reviewed"])[1]+(acceptedGap?", evidence incomplete":""))+'</span></summary>'
        +'<div class="evsp-cdm-attachment-body"><div class="evsp-cdm-attachment-grid">'
        +'<label class="evsp-cdm-field"><span>Document type</span><select data-evsp-cdm-attachment-field="cdmCategory">'+evspCdmOptionHtml(EVSP_CDM_SUPPORT_CATEGORIES,a.cdmCategory||"")+'</select></label>'
        +'<label class="evsp-cdm-field"><span>Review status</span><select data-evsp-cdm-attachment-field="cdmStatus">'+evspCdmOptionHtml(EVSP_CDM_SUPPORT_STATUSES,status)+'</select></label>'
        +'<label class="evsp-cdm-field"><span>Provided by</span><input data-evsp-cdm-attachment-field="cdmProvider" value="'+evspCdmEsc(a.cdmProvider||"")+'" placeholder="Contractor, client or adviser"></label>'
        +'<label class="evsp-cdm-field"><span>Reviewed by</span><input data-evsp-cdm-attachment-field="cdmReviewer" value="'+evspCdmEsc(a.cdmReviewer||"")+'" placeholder="Name and organisation"></label>'
        +'<label class="evsp-cdm-field"><span>Review date</span><input type="date" data-evsp-cdm-attachment-field="cdmReviewDate" value="'+evspCdmEsc(a.cdmReviewDate||"")+'"></label>'
        +'<label class="evsp-cdm-field"><span>Revision or reference</span><input data-evsp-cdm-attachment-field="cdmRevision" value="'+evspCdmEsc(a.cdmRevision||"")+'" placeholder="e.g. Rev C01 or document reference"></label>'
        +'<label class="evsp-cdm-field full"><span>Review notes</span><textarea data-evsp-cdm-attachment-field="cdmReviewNote" placeholder="Scope reviewed, exclusions, acceptance evidence or follow-up">'+evspCdmEsc(a.cdmReviewNote||"")+'</textarea></label>'
        +'</div></div></details>';
    }).join(""):'<div class="evsp-cdm-empty">No project files are attached. Add RAMS, surveys, asbestos information, competence evidence and waste records to the project pack.</div>';
    const acceptedRams=attachments.filter(function(a){ return a.cdmCategory==="rams"&&evspCdmSupportingReady(a); }).length;
    return '<div class="evsp-cdm-grid"><section class="evsp-cdm-section full"><h3>Supporting documents</h3><p class="evsp-cdm-lead">Classify the files already stored in the project pack and record their provider, reviewer, review date and evidence. RAMS only update the existing compliance item when the accepted record has this controlled metadata.</p>'
      +(acceptedRams?'<div class="evsp-cdm-note" style="margin-bottom:10px"><strong>'+acceptedRams+' accepted RAMS file'+(acceptedRams===1?'':'s')+'</strong> recorded for this project.</div>':'')
      +'<div class="evsp-cdm-attachments">'+rows+'</div><div class="evsp-cdm-actions"><button type="button" class="evsp-cdm-btn primary" data-evsp-cdm-add-attachment>Add project document</button></div></section></div>';
  }
  let evspCdmOpener=null;
  function evspCdmEnsureModal(){
    let backdrop=document.getElementById("evspCdmBackdrop");
    if(backdrop) return backdrop;
    backdrop=document.createElement("div");
    backdrop.id="evspCdmBackdrop";
    backdrop.className="wlc-backdrop evsp-cdm-backdrop";
    backdrop.innerHTML='<div class="wlc evsp-cdm-dialog" role="dialog" aria-modal="true" aria-labelledby="evspCdmTitle" aria-describedby="evspCdmDescription" tabindex="-1">'
      +'<div class="evsp-cdm-head"><div class="evsp-cdm-head-copy"><h2 id="evspCdmTitle">CDM 2015 project controls</h2><p id="evspCdmDescription">Duty holders, F10 decision, design risks, controlled documents and supporting evidence in one project record.</p></div><button type="button" class="evsp-cdm-close" data-evsp-cdm-close aria-label="Close CDM project controls">&times;</button></div>'
      +'<nav class="evsp-cdm-tabs" role="tablist" aria-label="CDM project control sections">'
      +'<button type="button" id="evspCdmTab-overview" role="tab" aria-controls="evspCdmBody" data-evsp-cdm-tab="overview">Overview and duty holders</button>'
      +'<button type="button" id="evspCdmTab-risks" role="tab" aria-controls="evspCdmBody" data-evsp-cdm-tab="risks">Design risks</button>'
      +'<button type="button" id="evspCdmTab-documents" role="tab" aria-controls="evspCdmBody" data-evsp-cdm-tab="documents">Document register</button>'
      +'<button type="button" id="evspCdmTab-supporting" role="tab" aria-controls="evspCdmBody" data-evsp-cdm-tab="supporting">Supporting files</button>'
      +'</nav><div class="evsp-cdm-body" id="evspCdmBody" role="tabpanel" tabindex="0"></div>'
      +'<div class="evsp-cdm-foot"><span class="evsp-cdm-foot-note">Working record only. Have a competent person review project-specific suitability before issue. <a href="https://www.hse.gov.uk/construction/cdm/2015/index.htm" target="_blank" rel="noopener">HSE CDM 2015 guidance</a>.</span><button type="button" class="hbtn" data-evsp-cdm-close>Close</button><button type="button" class="hbtn primary" data-evsp-cdm-export>Save CDM pack PDF</button></div>'
      +'</div>';
    document.body.appendChild(backdrop);
    return backdrop;
  }
  function evspCdmRenderModal(candidate){
    const p=evspCdmGetPack(candidate);
    if(!p) return;
    const s=evspCdmEnsure(p), backdrop=evspCdmEnsureModal(), body=backdrop.querySelector("#evspCdmBody");
    backdrop.querySelectorAll("[data-evsp-cdm-tab]").forEach(function(btn){
      const selected=btn.dataset.evspCdmTab===s.activeTab;
      btn.classList.toggle("on",selected);
      btn.setAttribute("aria-selected",selected?"true":"false");
      btn.tabIndex=selected?0:-1;
    });
    body.setAttribute("aria-labelledby","evspCdmTab-"+s.activeTab);
    if(s.activeTab==="risks") body.innerHTML=evspCdmRisksHTML(p);
    else if(s.activeTab==="documents") body.innerHTML=evspCdmDocumentsHTML(p);
    else if(s.activeTab==="supporting") body.innerHTML=evspCdmSupportingHTML(p);
    else body.innerHTML=evspCdmOverviewHTML(p);
    body.scrollTop=0;
  }
  function evspCdmNotifyChanged(candidate,refreshSide){
    const p=evspCdmGetPack(candidate);
    if(!p) return;
    evspCdmSyncCompliance(p);
    try{ if(typeof autosave==="function") autosave(); }catch(_){ }
    try{ if(typeof syncStageBar==="function") syncStageBar(); }catch(_){ }
    if(refreshSide){ try{ if(typeof renderSide==="function") renderSide(); }catch(_){ } }
  }
  function evspCdmRerenderPreserving(attribute,value,candidate){
    const body=document.getElementById("evspCdmBody"), scroll=body?body.scrollTop:0;
    const active=body&&body.contains(document.activeElement)?document.activeElement:null;
    const focusAttrs=["data-evsp-cdm-field","data-evsp-cdm-check","data-evsp-cdm-doc-field","data-evsp-cdm-risk-field","data-evsp-cdm-attachment-field"];
    let focusToken=null;
    if(active){
      const focusAttr=focusAttrs.find(function(name){ return active.hasAttribute&&active.hasAttribute(name); });
      if(focusAttr){
        const row=active.closest("[data-evsp-cdm-doc-row],[data-evsp-cdm-risk-row],[data-evsp-cdm-attachment-row]");
        const rowAttr=row?(row.hasAttribute("data-evsp-cdm-doc-row")?"data-evsp-cdm-doc-row":(row.hasAttribute("data-evsp-cdm-risk-row")?"data-evsp-cdm-risk-row":"data-evsp-cdm-attachment-row")):"";
        focusToken={attr:focusAttr,value:active.getAttribute(focusAttr),rowAttr:rowAttr,rowValue:rowAttr?row.getAttribute(rowAttr):"",start:active.selectionStart,end:active.selectionEnd};
      }
    }
    evspCdmRenderModal(candidate);
    const next=document.getElementById("evspCdmBody");
    if(!next) return;
    next.scrollTop=scroll;
    if(attribute&&value){
      const row=Array.from(next.querySelectorAll("["+attribute+"]")).find(function(el){ return el.getAttribute(attribute)===value; });
      if(row&&row.tagName==="DETAILS") row.open=true;
    }
    if(focusToken){
      let scope=next;
      if(focusToken.rowAttr) scope=Array.from(next.querySelectorAll("["+focusToken.rowAttr+"]")).find(function(el){ return el.getAttribute(focusToken.rowAttr)===focusToken.rowValue; })||next;
      const target=Array.from(scope.querySelectorAll("["+focusToken.attr+"]")).find(function(el){ return el.getAttribute(focusToken.attr)===focusToken.value; });
      if(target){
        target.focus();
        if(typeof target.setSelectionRange==="function"&&typeof focusToken.start==="number") try{ target.setSelectionRange(focusToken.start,focusToken.end); }catch(_){ }
      }
    }
  }
  function evspCdmOpen(tab,candidate){
    const p=evspCdmGetPack(candidate);
    if(!p) return false;
    if(p.mode==="domestic"){
      try{ if(typeof toast==="function") toast("This control workspace is currently available in Commercial mode. CDM duties may still apply to domestic work."); }catch(_){ }
      return false;
    }
    evspCdmOpener=document.activeElement&&typeof document.activeElement.focus==="function"?document.activeElement:null;
    evspCdmSyncCompliance(p);
    const s=evspCdmEnsure(p);
    if(["overview","risks","documents","supporting"].includes(tab)) s.activeTab=tab;
    evspCdmRenderModal(p);
    const backdrop=evspCdmEnsureModal();
    backdrop.classList.add("show");
    document.documentElement.classList.add("evsp-cdm-modal-open");
    setTimeout(function(){ const close=backdrop.querySelector(".evsp-cdm-close"); if(close) close.focus(); },20);
    return true;
  }
  function evspCdmClose(candidate){
    const backdrop=document.getElementById("evspCdmBackdrop");
    const opener=evspCdmOpener;
    const openerId=opener&&opener.id?opener.id:"";
    const openerTarget=opener&&opener.getAttribute?opener.getAttribute("data-evsp-cdm-open")||"":"";
    evspCdmOpener=null;
    if(backdrop) backdrop.classList.remove("show");
    document.documentElement.classList.remove("evsp-cdm-modal-open");
    evspCdmNotifyChanged(candidate,true);
    let focusTarget=opener&&document.contains(opener)?opener:null;
    if(!focusTarget&&openerId) focusTarget=document.getElementById(openerId);
    if(!focusTarget&&openerTarget){
      focusTarget=Array.from(document.querySelectorAll("[data-evsp-cdm-open]")).find(function(button){ return button.getAttribute("data-evsp-cdm-open")===openerTarget; })||null;
    }
    if(!focusTarget) focusTarget=document.getElementById("evspCdmOpen");
    if(focusTarget) setTimeout(function(){ try{ focusTarget.focus(); }catch(_){ } },0);
  }
  function evspCdmAddRisk(record,candidate){
    const p=evspCdmGetPack(candidate), s=evspCdmEnsure(p);
    s.risks.push(Object.assign({id:evspCdmId(),presetKey:"",hazard:"",who:"",hierarchy:"control",decision:"",residual:"",owner:"",dueDate:"",initialLikelihood:"",initialSeverity:"",residualLikelihood:"",residualSeverity:"",status:"open",source:"Manually recorded"},record||{}));
  }
  function evspCdmFindRisk(id,candidate){
    const s=evspCdmEnsure(candidate);
    return s.risks.find(function(r){ return r.id===id; });
  }
  function evspCdmFindAttachment(id,candidate){
    const p=evspCdmGetPack(candidate)||{};
    return (Array.isArray(p.attachments)?p.attachments:[]).find(function(a){ return a&&String(a.id)===String(id); });
  }
  function evspCdmSelectRoute(state,nextRoute){
    const s=state&&typeof state==="object"?state:null;
    if(!s||!["delivery_appointed","other_appointed","single_contractor"].includes(nextRoute)||s.route===nextRoute) return false;
    s.route=nextRoute;
    s.pdAppointmentConfirmed=false;
    s.pcAppointmentConfirmed=false;
    return true;
  }
  function evspCdmConfirmRiskRemoval(){
    try{
      if(typeof askConfirm==="function") return Promise.resolve(askConfirm({title:"Remove this design risk?",label:"The risk record and its design decision will be removed from this project. This cannot be undone.",okText:"Remove risk"})).catch(function(){ return false; });
    }catch(_){ }
    try{ return Promise.resolve(typeof window.confirm==="function"&&window.confirm("Remove this design risk? This cannot be undone.")); }catch(_){ return Promise.resolve(false); }
  }

  document.addEventListener("click",function(event){
    if(!event.target||typeof event.target.closest!=="function") return;
    const openButton=event.target.closest("[data-evsp-cdm-open]");
    if(openButton){ event.preventDefault(); evspCdmOpen(openButton.dataset.evspCdmOpen||"overview"); return; }
    const backdrop=document.getElementById("evspCdmBackdrop");
    if(!backdrop||!backdrop.classList.contains("show")) return;
    if(event.target===backdrop){ evspCdmClose(); return; }
    if(event.target.closest("[data-evsp-cdm-close]")){ evspCdmClose(); return; }
    const tabButton=event.target.closest("[data-evsp-cdm-tab]");
    if(tabButton){
      const s=evspCdmEnsure();
      s.activeTab=tabButton.dataset.evspCdmTab;
      evspCdmRenderModal();
      evspCdmNotifyChanged();
      return;
    }
    const routeButton=event.target.closest("[data-evsp-cdm-route]");
    if(routeButton){
      const s=evspCdmEnsure();
      const nextRoute=routeButton.dataset.evspCdmRoute;
      if(!evspCdmSelectRoute(s,nextRoute)) return;
      evspCdmRenderModal();
      evspCdmNotifyChanged();
      return;
    }
    const suggestionButton=event.target.closest("[data-evsp-cdm-add-suggestion]");
    if(suggestionButton){
      const key=suggestionButton.dataset.evspCdmAddSuggestion;
      const suggestion=evspCdmSuggestions().find(function(r){ return r.presetKey===key; });
      if(suggestion) evspCdmAddRisk(suggestion);
      evspCdmRenderModal(); evspCdmNotifyChanged(); return;
    }
    if(event.target.closest("[data-evsp-cdm-add-all-suggestions]")){
      evspCdmSuggestions().forEach(function(r){ evspCdmAddRisk(r); });
      evspCdmRenderModal(); evspCdmNotifyChanged(); return;
    }
    if(event.target.closest("[data-evsp-cdm-add-risk]")){
      evspCdmAddRisk(); evspCdmRenderModal(); evspCdmNotifyChanged(); return;
    }
    const removeRisk=event.target.closest("[data-evsp-cdm-remove-risk]");
    if(removeRisk){
      const riskId=removeRisk.dataset.evspCdmRemoveRisk;
      evspCdmConfirmRiskRemoval().then(function(confirmed){
        if(!confirmed) return;
        const s=evspCdmEnsure();
        s.risks=s.risks.filter(function(r){ return r.id!==riskId; });
        evspCdmRenderModal(); evspCdmNotifyChanged();
      });
      return;
    }
    if(event.target.closest("[data-evsp-cdm-add-attachment]")){
      const input=document.getElementById("fileAttach");
      if(input){ input.value=""; input.click(); }
      return;
    }
    if(event.target.closest("[data-evsp-cdm-export]")){ evspCdmRequestExport(); }
  });
  document.addEventListener("input",function(event){
    if(!event.target||typeof event.target.closest!=="function") return;
    const backdrop=event.target.closest("#evspCdmBackdrop");
    if(!backdrop) return;
    const p=evspCdmGetPack(); if(!p) return;
    const stateField=event.target.closest("[data-evsp-cdm-field]");
    if(stateField){ evspCdmEnsure(p)[stateField.dataset.evspCdmField]=stateField.value; evspCdmNotifyChanged(p); return; }
    const docField=event.target.closest("[data-evsp-cdm-doc-field]");
    if(docField){
      const row=docField.closest("[data-evsp-cdm-doc-row]");
      if(row){ const s=evspCdmEnsure(p); s.docs[row.dataset.evspCdmDocRow][docField.dataset.evspCdmDocField]=docField.value; if(row.dataset.evspCdmDocRow==="f10") s.f10DocManaged=false; }
      evspCdmNotifyChanged(p); return;
    }
    const riskField=event.target.closest("[data-evsp-cdm-risk-field]");
    if(riskField){
      const row=riskField.closest("[data-evsp-cdm-risk-row]");
      const risk=row?evspCdmFindRisk(row.dataset.evspCdmRiskRow,p):null;
      if(risk){
        const key=riskField.dataset.evspCdmRiskField;
        risk[key]=["initialLikelihood","initialSeverity","residualLikelihood","residualSeverity"].includes(key)?(riskField.value?Number(riskField.value):""):riskField.value;
      }
      evspCdmNotifyChanged(p); return;
    }
    const attachmentField=event.target.closest("[data-evsp-cdm-attachment-field]");
    if(attachmentField){
      const row=attachmentField.closest("[data-evsp-cdm-attachment-row]");
      const attachment=row?evspCdmFindAttachment(row.dataset.evspCdmAttachmentRow,p):null;
      if(attachment) attachment[attachmentField.dataset.evspCdmAttachmentField]=attachmentField.value;
      evspCdmNotifyChanged(p);
    }
  });
  document.addEventListener("change",function(event){
    const p=evspCdmGetPack();
    const backdrop=event.target.closest&&event.target.closest("#evspCdmBackdrop");
    if(!backdrop||!p) return;
    const check=event.target.closest("[data-evsp-cdm-check]");
    if(check){ evspCdmEnsure(p)[check.dataset.evspCdmCheck]=check.checked; evspCdmNotifyChanged(p); evspCdmRerenderPreserving("","",p); return; }
    if(event.target.matches("[data-evsp-cdm-f10-filed]")){
      const s=evspCdmEnsure(p); s.f10=event.target.checked?"filed":"tofile"; s.f10DecisionManaged=true;
      evspCdmNotifyChanged(p); evspCdmRerenderPreserving("","",p); return;
    }
    const stateField=event.target.closest("[data-evsp-cdm-field]");
    const docField=event.target.closest("[data-evsp-cdm-doc-field]");
    const riskField=event.target.closest("[data-evsp-cdm-risk-field]");
    const attachmentField=event.target.closest("[data-evsp-cdm-attachment-field]");
    if(stateField){ evspCdmEnsure(p)[stateField.dataset.evspCdmField]=stateField.value; evspCdmNotifyChanged(p); evspCdmRerenderPreserving("","",p); }
    else if(docField){ const row=docField.closest("[data-evsp-cdm-doc-row]"); const rowKey=row?row.dataset.evspCdmDocRow:""; if(row){ const s=evspCdmEnsure(p); s.docs[rowKey][docField.dataset.evspCdmDocField]=docField.value; if(rowKey==="f10") s.f10DocManaged=false; } evspCdmNotifyChanged(p); evspCdmRerenderPreserving("data-evsp-cdm-doc-row",rowKey,p); }
    else if(riskField){ const row=riskField.closest("[data-evsp-cdm-risk-row]"); const rowKey=row?row.dataset.evspCdmRiskRow:""; const risk=row?evspCdmFindRisk(rowKey,p):null; if(risk){ const key=riskField.dataset.evspCdmRiskField; risk[key]=["initialLikelihood","initialSeverity","residualLikelihood","residualSeverity"].includes(key)?(riskField.value?Number(riskField.value):""):riskField.value; } evspCdmNotifyChanged(p); evspCdmRerenderPreserving("data-evsp-cdm-risk-row",rowKey,p); }
    else if(attachmentField){ const row=attachmentField.closest("[data-evsp-cdm-attachment-row]"); const rowKey=row?row.dataset.evspCdmAttachmentRow:""; const attachment=row?evspCdmFindAttachment(rowKey,p):null; if(attachment) attachment[attachmentField.dataset.evspCdmAttachmentField]=attachmentField.value; evspCdmNotifyChanged(p); evspCdmRerenderPreserving("data-evsp-cdm-attachment-row",rowKey,p); }
  });
  document.addEventListener("evsp:attachments-changed",function(){
    const p=evspCdmGetPack(), backdrop=document.getElementById("evspCdmBackdrop");
    if(!p) return;
    evspCdmNotifyChanged(p,true);
    if(backdrop&&backdrop.classList.contains("show")) evspCdmRenderModal(p);
  });
  document.addEventListener("keydown",function(event){
    const backdrop=document.getElementById("evspCdmBackdrop");
    if(!backdrop||!backdrop.classList.contains("show")) return;
    event.stopImmediatePropagation();
    if(event.key==="Escape"){ event.preventDefault(); evspCdmClose(); return; }
    const tabs=Array.from(backdrop.querySelectorAll('[role="tab"]'));
    const tabIndex=tabs.indexOf(document.activeElement);
    if(tabIndex>=0&&["ArrowLeft","ArrowRight","Home","End"].includes(event.key)){
      event.preventDefault();
      let next=tabIndex;
      if(event.key==="ArrowLeft") next=(tabIndex+tabs.length-1)%tabs.length;
      if(event.key==="ArrowRight") next=(tabIndex+1)%tabs.length;
      if(event.key==="Home") next=0;
      if(event.key==="End") next=tabs.length-1;
      tabs[next].focus(); tabs[next].click(); return;
    }
    if(event.key!=="Tab") return;
    const focusable=Array.from(backdrop.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')).filter(function(el){ return el.offsetParent!==null; });
    if(!focusable.length){ event.preventDefault(); backdrop.querySelector(".evsp-cdm-dialog").focus(); return; }
    const first=focusable[0], last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){ event.preventDefault(); last.focus(); }
    else if(!event.shiftKey&&document.activeElement===last){ event.preventDefault(); first.focus(); }
  },true);

  function evspCdmPreflight(candidate){
    const p=evspCdmGetPack(candidate)||{}, s=evspCdmNormalisePack(p.cdm), a=evspCdmAssessment(p), facts=evspCdmPlanFacts(p), missing=[];
    if(!evspCdmText(p.name).trim()) missing.push("Project name is blank");
    if(!evspCdmText(p.address).trim()) missing.push("Site address is blank");
    if(!s.route) missing.push("Duty-holder arrangement is not selected");
    if(s.route&&!evspCdmText(s.client||p.custName).trim()) missing.push("Commercial client is blank");
    if(s.route==="single_contractor"&&!s.contractor.trim()) missing.push("Single contractor is blank");
    if(s.route&&s.route!=="single_contractor"){
      if(!s.pd.trim()) missing.push("Principal designer is blank");
      if(!s.pc.trim()) missing.push("Principal contractor is blank");
      if(!evspCdmAppointmentReady(s,"pd")) missing.push("Principal designer written appointment needs separate confirmation, evidence and a valid date no later than the planned start");
      if(!evspCdmAppointmentReady(s,"pc")) missing.push("Principal contractor written appointment needs separate confirmation, evidence and a valid date no later than the planned start");
    }
    if(!s.startDate||!s.finishDate) missing.push("Planned construction start or finish date is blank");
    else if(!evspCdmProgrammeValid(s)) missing.push("Planned finish date is before the planned start date");
    if(!s.siteManager.trim()) missing.push("Site manager or supervisor is blank");
    if(!s.firstAider.trim()) missing.push("First-aid appointment is blank");
    if(!s.welfare.trim()) missing.push("Welfare arrangements are blank");
    if(!s.induction.trim()) missing.push("Induction and consultation arrangements are blank");
    if(!s.emergency.trim()) missing.push("Emergency arrangements are blank");
    if(!s.monitoring.trim()) missing.push("Monitoring and review arrangements are blank");
    if(evspCdmPublicContext(p,facts)&&!s.publicProtection.trim()) missing.push("Public-protection and segregation arrangements are blank for the marked plan context");
    if(a.f10.code==="incomplete") missing.push("F10 threshold assessment is incomplete");
    if(a.f10.code==="notifiable"&&!evspCdmF10FiledComplete(s)) missing.push("F10 filing needs a reference and a non-future submission date no later than the planned start");
    if(!evspCdmDocReady(s.docs.cpp,s,"cpp")) missing.push("Construction phase plan needs issued or accepted status, owner, revision and a non-future date no later than the planned start");
    EVSP_CDM_DOC_DEFS.forEach(function(def){
      const r=s.docs[def.k];
      if(["issued","accepted"].includes(r.status)&&!evspCdmDocReady(r,s,def.k)&&def.k!=="cpp") missing.push(def.title+" has incomplete, future-dated or late controlled-document evidence");
      if(r.status==="not_applicable"&&!evspCdmDocReady(r,s,def.k)) missing.push(def.title+" is marked not applicable without a reason");
    });
    const stats=evspCdmDocStats(s), documentThreshold=Math.max(1,Math.ceil(stats.total*.6));
    if(stats.ready<documentThreshold) missing.push("Controlled document register has "+stats.ready+" of "+stats.total+" ready records; at least "+documentThreshold+" must be completed or justified");
    if(!s.risks.length) missing.push("Designer risk register is empty");
    s.risks.forEach(function(r,i){
      if(!r.hazard.trim()||!r.decision.trim()||!r.residual.trim()||!r.owner.trim()||!evspCdmCleanDate(r.dueDate)||r.status==="open") missing.push("Design risk "+(i+1)+" needs a due date, owner, design action, residual-risk record and controlled status");
      if(!r.initialLikelihood||!r.initialSeverity||!r.residualLikelihood||!r.residualSeverity) missing.push("Design risk "+(i+1)+" needs complete initial and residual ratings");
    });
    (Array.isArray(p.attachments)?p.attachments:[]).forEach(function(file){
      if(file&&file.cdmStatus==="accepted"&&!evspCdmSupportingReady(file)) missing.push((file.name||"Supporting document")+" is marked accepted without complete provider, reviewer, review date and acceptance evidence");
    });
    return missing;
  }
  function evspCdmFormatDate(value){
    const clean=evspCdmCleanDate(value);
    if(!clean) return "Not recorded";
    const date=new Date(clean+"T12:00:00");
    return isNaN(date.getTime())?clean:date.toLocaleDateString("en-GB");
  }
  function evspCdmAnswerLabel(value){ return value==="yes"?"Yes":(value==="no"?"No":"Not assessed"); }
  function evspCdmPlanScope(candidate){
    const p=evspCdmGetPack(candidate)||{}, f=evspCdmPlanFacts(p), parts=[];
    if(f.unitCount) parts.push(f.unitCount+" charging unit"+(f.unitCount===1?"":"s"));
    if(f.trenchCount) parts.push(f.trenchCount+" trench route"+(f.trenchCount===1?"":"s")+(f.trenchMetres?" totalling about "+f.trenchMetres+" m":""));
    if(f.ductCount) parts.push(f.ductCount+" buried duct or pavement channel"+(f.ductCount===1?"":"s"));
    if(f.electricalCount) parts.push(f.electricalCount+" distribution or cable item"+(f.electricalCount===1?"":"s"));
    if(f.siteSetupCount) parts.push(f.siteSetupCount+" welfare or site-setup item"+(f.siteSetupCount===1?"":"s"));
    return parts.length?parts.join(", "):"No construction quantities have been marked up yet";
  }
  function evspCdmPdfContext(doc,candidate){
    const p=evspCdmGetPack(candidate)||{};
    return {doc:doc,p:p,M:15,PW:210,PH:297,y:18,pageTitle:"",brand:evspCdmText(p.brandName).trim()||"EV Site Planner"};
  }
  function evspCdmPdfPage(ctx,title){
    if(ctx.doc.getNumberOfPages()>1||ctx.y>20) ctx.doc.addPage();
    ctx.pageTitle=title;
    ctx.y=18;
    ctx.doc.setTextColor(22,35,46);
    ctx.doc.setFont("helvetica","bold");
    ctx.doc.setFontSize(17);
    ctx.doc.text(title,ctx.M,ctx.y);
    ctx.y+=5;
    ctx.doc.setDrawColor(30,107,255);
    ctx.doc.setLineWidth(.8);
    ctx.doc.line(ctx.M,ctx.y,ctx.M+35,ctx.y);
    ctx.y+=8;
  }
  function evspCdmPdfEnsure(ctx,height){
    if(ctx.y+height<=ctx.PH-18) return;
    ctx.doc.addPage();
    ctx.y=17;
    ctx.doc.setTextColor(22,35,46);
    ctx.doc.setFont("helvetica","bold");
    ctx.doc.setFontSize(12);
    ctx.doc.text((ctx.pageTitle||"CDM project controls")+" (continued)",ctx.M,ctx.y);
    ctx.y+=9;
  }
  function evspCdmPdfHeading(ctx,text,level){
    const size=level===2?11.5:13.5;
    const leading=level===2?5.4:6.2, lines=ctx.doc.splitTextToSize(evspCdmText(text),ctx.PW-2*ctx.M);
    lines.forEach(function(line){
      evspCdmPdfEnsure(ctx,leading+1);
      ctx.doc.setTextColor(22,35,46);
      ctx.doc.setFont("helvetica","bold");
      ctx.doc.setFontSize(size);
      ctx.doc.text(line,ctx.M,ctx.y);
      ctx.y+=leading;
    });
    ctx.y+=1;
  }
  function evspCdmPdfParagraph(ctx,text,options){
    options=options||{};
    text=evspCdmText(text).trim()||options.empty||"Not recorded";
    ctx.doc.setFont("helvetica",options.bold?"bold":"normal");
    ctx.doc.setFontSize(options.size||9.5);
    ctx.doc.setTextColor(options.dim?84:42,options.dim?103:57,options.dim?122:70);
    const lines=ctx.doc.splitTextToSize(text,options.width||ctx.PW-2*ctx.M);
    const leading=options.leading||4.6;
    lines.forEach(function(line){
      evspCdmPdfEnsure(ctx,leading+1);
      ctx.doc.text(line,ctx.M,ctx.y);
      ctx.y+=leading;
    });
    ctx.y+=options.after==null?3:options.after;
  }
  function evspCdmPdfKeyValues(ctx,rows){
    rows.forEach(function(row){
      const label=evspCdmText(row[0]), value=evspCdmText(row[1]).trim()||"Not recorded";
      const labelW=44, valueLines=ctx.doc.splitTextToSize(value,ctx.PW-2*ctx.M-labelW-3);
      valueLines.forEach(function(line,index){
        evspCdmPdfEnsure(ctx,5.2);
        ctx.doc.setFontSize(9);
        if(index===0){ ctx.doc.setFont("helvetica","bold"); ctx.doc.setTextColor(84,103,122); ctx.doc.text(label,ctx.M,ctx.y); }
        ctx.doc.setFont("helvetica","normal"); ctx.doc.setTextColor(22,35,46); ctx.doc.text(line,ctx.M+labelW,ctx.y);
        ctx.y+=4.2;
      });
      ctx.y+=1;
    });
    ctx.y+=2;
  }
  function evspCdmPdfTable(ctx,headers,rows,widths){
    const doc=ctx.doc, lineH=3.8, padding=1.8;
    const drawHeader=function(){
      evspCdmPdfEnsure(ctx,9);
      let x=ctx.M;
      doc.setFillColor(22,35,46); doc.rect(ctx.M,ctx.y,ctx.PW-2*ctx.M,8,"F");
      doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(7.3);
      headers.forEach(function(h,i){ doc.text(evspCdmText(h),x+padding,ctx.y+5.2); x+=widths[i]; });
      ctx.y+=8;
    };
    const continueTable=function(){
      doc.addPage(); ctx.y=17; doc.setTextColor(22,35,46); doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.text((ctx.pageTitle||"Register")+" (continued)",ctx.M,ctx.y); ctx.y+=7; drawHeader();
    };
    drawHeader();
    rows.forEach(function(row,rowIndex){
      const cells=row.map(function(cell,i){ return doc.splitTextToSize(evspCdmText(cell)||" ",Math.max(4,widths[i]-2*padding)); });
      const lines=Math.max.apply(null,cells.map(function(c){ return c.length; }));
      let offset=0;
      while(offset<lines){
        let roomLines=Math.floor((ctx.PH-18-ctx.y-2*padding)/lineH);
        if(roomLines<1){ continueTable(); roomLines=Math.max(1,Math.floor((ctx.PH-18-ctx.y-2*padding)/lineH)); }
        const take=Math.min(lines-offset,roomLines), h=Math.max(7,take*lineH+2*padding);
        if(ctx.y+h>ctx.PH-18){ continueTable(); continue; }
        if(rowIndex%2===0){ doc.setFillColor(247,249,251); doc.rect(ctx.M,ctx.y,ctx.PW-2*ctx.M,h,"F"); }
        doc.setDrawColor(221,228,234); doc.setLineWidth(.15); doc.line(ctx.M,ctx.y+h,ctx.PW-ctx.M,ctx.y+h);
        let x=ctx.M; doc.setTextColor(42,57,70); doc.setFont("helvetica","normal"); doc.setFontSize(7.2);
        cells.forEach(function(cell,i){ const chunk=cell.slice(offset,offset+take); doc.text(chunk.length?chunk:[" "],x+padding,ctx.y+padding+2.8); x+=widths[i]; });
        ctx.y+=h; offset+=take;
        if(offset<lines) continueTable();
      }
    });
    ctx.y+=5;
  }
  function evspCdmPdfBlankRows(count,columns){
    return Array.from({length:count},function(){ return columns.map(function(){ return " "; }); });
  }
  function evspCdmPdfFooters(ctx){
    const doc=ctx.doc, pages=doc.getNumberOfPages();
    for(let page=1;page<=pages;page++){
      doc.setPage(page);
      doc.setDrawColor(216,224,231); doc.setLineWidth(.2); doc.line(ctx.M,ctx.PH-11,ctx.PW-ctx.M,ctx.PH-11);
      doc.setFont("helvetica","normal"); doc.setFontSize(7.2); doc.setTextColor(105,120,134);
      doc.text(ctx.brand+" | CDM project controls | "+(ctx.p.name||"Unnamed project"),ctx.M,ctx.PH-7);
      doc.text(page+" / "+pages,ctx.PW-ctx.M,ctx.PH-7,{align:"right"});
    }
  }
  function evspCdmDraftExportMessage(missing){
    return "CDM pack preflight found "+missing.length+" gap"+(missing.length===1?"":"s")+":\n\n- "+missing.slice(0,7).join("\n- ")+(missing.length>7?"\n- and "+(missing.length-7)+" more":"")+"\n\nSave a draft PDF anyway?";
  }
  function evspCdmRequestExport(candidate){
    const p=evspCdmGetPack(candidate);
    if(!p) return Promise.resolve(false);
    const missing=evspCdmPreflight(p);
    if(missing.length&&typeof askConfirm==="function"){
      return Promise.resolve(askConfirm({title:"Save a draft CDM PDF?",label:evspCdmDraftExportMessage(missing),okText:"Save draft PDF"})).then(function(confirmed){
        return confirmed?evspCdmExportPdf(p,true):false;
      }).catch(function(){ return false; });
    }
    return Promise.resolve(evspCdmExportPdf(p,false));
  }
  function evspCdmExportPdf(candidate,draftConfirmed){
    const p=evspCdmGetPack(candidate);
    if(!p) return false;
    if(p.mode==="domestic"){ try{ if(typeof toast==="function") toast("This control workspace is currently available in Commercial mode. CDM duties may still apply to domestic work."); }catch(_){ } return false; }
    if(!window.jspdf||!window.jspdf.jsPDF){ try{ if(typeof toast==="function") toast("PDF engine unavailable. Reload and try again."); }catch(_){ } return false; }
    evspCdmSyncCompliance(p);
    const missing=evspCdmPreflight(p);
    if(missing.length){
      const message=evspCdmDraftExportMessage(missing);
      if(!draftConfirmed&&typeof window.confirm==="function"&&!window.confirm(message)) return false;
    }
    const s=evspCdmEnsure(p), a=evspCdmAssessment(p), ready=a.complete&&missing.length===0, facts=evspCdmPlanFacts(p), doc=new window.jspdf.jsPDF({unit:"mm",format:"a4",orientation:"portrait"}), ctx=evspCdmPdfContext(doc,p);
    const today=new Date().toLocaleDateString("en-GB");

    doc.setFillColor(22,35,46); doc.rect(0,0,210,297,"F");
    doc.setFillColor(30,107,255); doc.rect(0,0,9,297,"F");
    try{ if(p.brandLogo) doc.addImage(p.brandLogo,"PNG",155,18,35,28,undefined,"FAST"); }catch(_){ }
    doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.text(ctx.brand.toUpperCase(),20,28);
    doc.setFontSize(25); doc.text("CDM PROJECT",20,65); doc.text("CONTROLS PACK",20,76);
    doc.setFont("helvetica","normal"); doc.setFontSize(12); doc.setTextColor(205,216,226); doc.text(doc.splitTextToSize(p.name||"Unnamed commercial EV charging project",155),20,93);
    doc.setFontSize(9.5); doc.text(doc.splitTextToSize([p.address,p.postcode].filter(Boolean).join(", ")||"Site address not recorded",155),20,108);
    doc.setDrawColor(75,105,130); doc.line(20,128,190,128);
    doc.setFontSize(9); doc.setTextColor(205,216,226);
    doc.text("Project reference",20,143); doc.text(p.jobRef||"Not recorded",70,143);
    doc.text("Duty-holder arrangement",20,153); doc.text(doc.splitTextToSize(evspCdmRouteLabel(s.route),110),70,153);
    doc.text("Readiness",20,169); doc.text(ready?"Ready for competent-person review":"Draft with "+missing.length+" preflight gap"+(missing.length===1?"":"s"),70,169);
    doc.text("Generated",20,179); doc.text(today,70,179);
    doc.setFillColor(ready?75:206,ready?160:158,ready?105:46); doc.roundedRect(20,199,170,18,3,3,"F");
    doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.text(ready?"CONTROL RECORD READY FOR REVIEW":"DRAFT CONTROL RECORD",105,210,{align:"center"});
    doc.setFont("helvetica","normal"); doc.setTextColor(174,191,205); doc.setFontSize(8); doc.text(doc.splitTextToSize("Working record only. A competent person and the appointed duty holders must review project-specific suitability and completeness before issue.",170),20,239);
    doc.text("Official guidance: hse.gov.uk/construction/cdm/2015/",20,265);

    ctx.y=30;
    evspCdmPdfPage(ctx,"Project and duty holders");
    evspCdmPdfKeyValues(ctx,[
      ["Project",p.name],["Site",[p.address,p.postcode].filter(Boolean).join(", ")],["Project reference",p.jobRef],["Client",s.client||p.custName],["Client contact",s.clientContact],
      ["Arrangement",evspCdmRouteLabel(s.route)],["Single contractor",s.route==="single_contractor"?s.contractor:"Not applicable on recorded multi-contractor route"],["Principal designer",s.route==="single_contractor"?"Not applicable on recorded single-contractor route":s.pd],["Principal contractor",s.route==="single_contractor"?"Not applicable on recorded single-contractor route":s.pc],
      ["PD appointment confirmed",s.route==="single_contractor"?"Not applicable":(s.pdAppointmentConfirmed?"Yes":"No")],["PD appointment date",s.route==="single_contractor"?"Not applicable":evspCdmFormatDate(s.pdAppointmentDate)],["PD appointment evidence",s.route==="single_contractor"?"Not applicable":s.pdAppointmentEvidence],
      ["PC appointment confirmed",s.route==="single_contractor"?"Not applicable":(s.pcAppointmentConfirmed?"Yes":"No")],["PC appointment date",s.route==="single_contractor"?"Not applicable":evspCdmFormatDate(s.pcAppointmentDate)],["PC appointment evidence",s.route==="single_contractor"?"Not applicable":s.pcAppointmentEvidence],
      ["Legacy combined appointment record",s.route==="single_contractor"?"Not applicable":((s.appointmentsConfirmed||s.appointmentDate||s.appointmentEvidence)?"Retained for reference only; separate verification required":"None recorded")],
      ["Site manager",s.siteManager],["First aider",s.firstAider],["Safety adviser",s.safetyAdviser],["Construction programme",evspCdmFormatDate(s.startDate)+" to "+evspCdmFormatDate(s.finishDate)]
    ]);
    evspCdmPdfHeading(ctx,"F10 notification decision",1);
    evspCdmPdfKeyValues(ctx,[
      ["30 days and 20 workers","Longer than 30 working days and more than 20 workers simultaneously: "+evspCdmAnswerLabel(s.f10LongAndTwenty)],
      ["500 person-days","Exceeds 500 person-days: "+evspCdmAnswerLabel(s.f10PersonDays)],
      ["Decision",a.f10.label],["Filed with HSE",evspCdmF10FiledComplete(s)?"Yes":(s.f10==="filed"?"Historical filing details recorded; current validation incomplete":"No or incomplete")],["HSE reference",s.f10Ref],["Date filed",evspCdmFormatDate(s.f10Date)]
    ]);
    evspCdmPdfParagraph(ctx,"Notification threshold: construction work scheduled to last longer than 30 working days and have more than 20 workers working simultaneously at any point, or construction work scheduled to exceed 500 person-days.",{dim:true,size:8.3});

    evspCdmPdfPage(ctx,"Pre-construction information");
    evspCdmPdfHeading(ctx,"Project scope derived from the site plan",1);
    evspCdmPdfParagraph(ctx,evspCdmPlanScope(p));
    evspCdmPdfHeading(ctx,"Existing environment and electrical information",1);
    evspCdmPdfKeyValues(ctx,[
      ["Supply",p.supplyRating||p.mainFuse],["Earthing",p.earthing],["Capacity note",p.capacityNote],["DNO reference",p.dnoRef],
      ["Plan safety controls",evspCdmCountPhrases([[facts.herasCount,"barrier route"],[facts.coneCount,"cone route"],[facts.exclusionCount,"exclusion zone"],[facts.pedestrianCount,"pedestrian route"]],"None marked")],
      ["Site setup",evspCdmCountPhrases([[facts.siteSetupCount,"site-setup item"],[facts.signboardCount,"safety signboard"],[facts.firstAidCount,"first-aid marker"],[facts.fireCount,"fire marker"]],"None marked")]
    ]);
    evspCdmPdfHeading(ctx,"Known constraints and project notes",1);
    evspCdmPdfParagraph(ctx,p.notes,{empty:"No project notes have been recorded."});
    evspCdmPdfHeading(ctx,"Information still required",1);
    evspCdmPdfParagraph(ctx,missing.length?missing.join("; ")+".":"No preflight gaps were identified. Continue to review changes and newly available site information.");

    evspCdmPdfPage(ctx,"Controlled document register");
    evspCdmPdfTable(ctx,["Document","Status","Owner","Rev / date"],EVSP_CDM_DOC_DEFS.map(function(def){
      const r=s.docs[def.k], controlled=evspCdmDocReady(r,s,def.k); return [def.title,EVSP_CDM_DOC_STATUS_LABEL[r.status]+((["issued","accepted"].includes(r.status)&&!controlled)?"; evidence incomplete":""),r.owner,[r.revision,evspCdmFormatDate(r.date)].filter(function(x){return x&&x!=="Not recorded";}).join(" / ")];
    }),[76,30,40,34]);
    EVSP_CDM_DOC_DEFS.forEach(function(def){ const r=s.docs[def.k]; if(r.notes){ evspCdmPdfHeading(ctx,def.title,2); evspCdmPdfParagraph(ctx,r.notes,{size:8.5}); } });

    evspCdmPdfPage(ctx,"Designer risk register");
    if(!s.risks.length){ evspCdmPdfParagraph(ctx,"No designer risks are recorded. This section must be completed before issue.",{bold:true}); }
    s.risks.forEach(function(r,index){
      evspCdmPdfEnsure(ctx,42);
      evspCdmPdfHeading(ctx,(index+1)+". "+(r.hazard||"Unnamed design risk"),1);
      const initial=Number(r.initialLikelihood)*Number(r.initialSeverity)||0, residual=Number(r.residualLikelihood)*Number(r.residualSeverity)||0;
      evspCdmPdfKeyValues(ctx,[["Source / location",r.source],["Who may be affected",r.who],["Hierarchy",(EVSP_CDM_HIERARCHY.find(function(x){return x[0]===r.hierarchy;})||["",r.hierarchy])[1]],["Initial rating",initial?initial+" (L"+r.initialLikelihood+" x S"+r.initialSeverity+")":"Not rated"],["Design decision",r.decision],["Residual risk",r.residual],["Residual rating",residual?residual+" (L"+r.residualLikelihood+" x S"+r.residualSeverity+")":"Not rated"],["Owner / due",[r.owner,evspCdmFormatDate(r.dueDate)].filter(function(x){return x&&x!=="Not recorded";}).join(" / ")],["Status",evspCdmRiskStatusLabel(r.status)]]);
    });

    evspCdmPdfPage(ctx,"Construction phase plan arrangements");
    evspCdmPdfHeading(ctx,"Management arrangements",1);
    evspCdmPdfKeyValues(ctx,[["Site manager",s.siteManager],["Welfare from day one",s.welfare],["Induction and consultation",s.induction],["Public protection and security",s.publicProtection],["Emergency arrangements",s.emergency],["Monitoring and review",s.monitoring]]);
    evspCdmPdfHeading(ctx,"Minimum site rules for project review",1);
    ["Sign in, receive the site induction and follow the agreed access route.","Use only authorised isolations, permits and test equipment.","Keep pedestrians and vehicles outside the controlled work area.","Do not disturb ground or building fabric until the relevant information and permit have been checked.","Maintain housekeeping, safe storage, welfare and emergency access throughout the shift.","Report design changes, defects, incidents and near misses promptly."].forEach(function(rule,index){ evspCdmPdfParagraph(ctx,(index+1)+". "+rule,{size:9,after:1}); });
    evspCdmPdfHeading(ctx,"Sign-off",1);
    const signoffRows=s.route==="single_contractor"?[["Prepared by"," "," "," "],["Contractor review"," "," "," "],["Client review"," "," "," "]]:[["Prepared by"," "," "," "],["Principal contractor review"," "," "," "],["Principal designer coordination review"," "," "," "]];
    evspCdmPdfTable(ctx,["Role","Name","Signature","Date"],signoffRows,[46,46,48,40]);

    evspCdmPdfPage(ctx,"Induction and briefing registers");
    evspCdmPdfHeading(ctx,"Site induction record",1);
    evspCdmPdfTable(ctx,["Name / employer","Date","Inducted by","Signature"],evspCdmPdfBlankRows(7,[1,1,1,1]),[62,32,48,38]);
    evspCdmPdfHeading(ctx,"Toolbox talk register",1);
    evspCdmPdfTable(ctx,["Topic","Date","Delivered by","Attendees / action"],evspCdmPdfBlankRows(6,[1,1,1,1]),[58,30,42,50]);

    evspCdmPdfPage(ctx,"Permit-to-work register");
    evspCdmPdfParagraph(ctx,"Use for excavation, electrical isolation, hot work, work at height and any other activity that the construction phase plan places under permit control.",{dim:true});
    evspCdmPdfTable(ctx,["Permit / type","Issued to","Valid from / to","Closed by / date"],evspCdmPdfBlankRows(8,[1,1,1,1]),[54,42,46,38]);
    evspCdmPdfHeading(ctx,"Permit control prompts",1);
    evspCdmPdfParagraph(ctx,"Scope and exact location; drawings and service information checked; isolations and lock-off points; atmosphere or fire controls where relevant; excavation support and access; exclusion zone; PPE; emergency arrangements; issuer and receiver signatures; suspension, hand-back and close-out.");

    evspCdmPdfPage(ctx,"Excavation and incident records");
    evspCdmPdfHeading(ctx,"Excavation inspection register",1);
    evspCdmPdfParagraph(ctx,(facts.trenchCount||facts.ductCount)?"The plan contains excavation or buried-route work. Record competent-person inspections and any event that could affect stability.":"No excavation route is currently detected. Mark the document not applicable only after scope review.",{dim:true});
    evspCdmPdfTable(ctx,["Location / excavation","Inspection date and time","Competent person","Finding / action"],evspCdmPdfBlankRows(7,[1,1,1,1]),[50,40,40,50]);
    evspCdmPdfHeading(ctx,"Incident and near-miss log",1);
    evspCdmPdfTable(ctx,["Date / location","Event","Immediate action","Owner / close-out"],evspCdmPdfBlankRows(6,[1,1,1,1]),[38,57,48,37]);

    evspCdmPdfPage(ctx,"Health and safety file and handover");
    evspCdmPdfHeading(ctx,"File index",1);
    evspCdmPdfTable(ctx,["Information","Status / reference"],[
      ["Project description, drawings and design changes",p.rev?"Planner revision "+p.rev:"Reference not recorded"],
      ["Residual design risks",s.risks.length+" risk record"+(s.risks.length===1?"":"s")],
      ["Electrical installation certificates and test results","Confirm in project attachments"],
      ["DNO, metering and load-management information",p.dnoRef||"Reference not recorded"],
      ["Equipment manuals, serials, warranties and settings","Confirm at commissioning"],
      ["Underground services, as-built routes and reinstatement","Confirm as-built drawings and photographs"],
      ["Inspection, maintenance and safe isolation information","Confirm before handover"],
      ["Waste, incident and permit close-out records","Confirm in project records"],
      ["Health and safety file holder",s.docs.hsfile.owner||"Not recorded"]
    ],[92,88]);
    evspCdmPdfHeading(ctx,"Supporting document register",1);
    const attachments=Array.isArray(p.attachments)?p.attachments:[];
    if(attachments.length) evspCdmPdfTable(ctx,["File","Type","Review","Provided by"],attachments.map(function(file){
      const category=(EVSP_CDM_SUPPORT_CATEGORIES.find(function(x){return x[0]===file.cdmCategory;})||["","Unclassified"])[1];
      const status=(EVSP_CDM_SUPPORT_STATUSES.find(function(x){return x[0]===file.cdmStatus;})||["","Not reviewed"])[1];
      return [file.name,category,status+(file.cdmStatus==="accepted"&&!evspCdmSupportingReady(file)?"; evidence incomplete":""),file.cdmProvider||""];
    }),[72,42,32,34]);
    else evspCdmPdfParagraph(ctx,"No supporting files are attached.",{bold:true});
    attachments.forEach(function(file,index){
      if(!(file.cdmReviewer||file.cdmReviewDate||file.cdmRevision||file.cdmReviewNote)) return;
      evspCdmPdfHeading(ctx,(index+1)+". "+(file.name||"Supporting document"),2);
      evspCdmPdfKeyValues(ctx,[["Reviewed by",file.cdmReviewer],["Review date",evspCdmFormatDate(file.cdmReviewDate)],["Revision / reference",file.cdmRevision],["Review evidence / note",file.cdmReviewNote]]);
    });
    evspCdmPdfHeading(ctx,"Handover confirmation",1);
    const handoverRows=s.route==="single_contractor"?[["Project records compiled by"," "," "," "],["Contractor handover"," "," "," "],["Client receipt"," "," "," "]]:[["File compiled by"," "," "," "],["Principal designer handover"," "," "," "],["Client receipt"," "," "," "]];
    evspCdmPdfTable(ctx,["Role","Name","Signature","Date"],handoverRows,[46,46,48,40]);
    evspCdmPdfParagraph(ctx,"Official HSE CDM 2015 guidance: https://www.hse.gov.uk/construction/cdm/2015/",{dim:true,size:8});

    evspCdmPdfFooters(ctx);
    const safeName=(p.name||"EV-site").replace(/[^a-z0-9_-]+/gi,"_").replace(/^_+|_+$/g,"")||"EV-site";
    const filename=safeName+"_CDM_project_controls.pdf";
    doc.save(filename);
    try{ if(typeof toast==="function") toast("CDM project controls PDF saved"); }catch(_){ }
    return true;
  }

  const EVSP_CDM_API={
    version:EVSP_CDM_VERSION,
    newPack:evspCdmNewPack,
    normalisePack:evspCdmNormalisePack,
    cardHTML:evspCdmCardHTML,
    complianceDetailHTML:evspCdmComplianceDetailHTML,
    assessment:evspCdmAssessment,
    syncCompliance:evspCdmSyncCompliance,
    open:evspCdmOpen,
    close:evspCdmClose,
    exportPdf:evspCdmExportPdf,
    planFacts:evspCdmPlanFacts,
    suggestions:evspCdmSuggestions,
    f10Verdict:evspCdmF10Verdict,
    f10FiledComplete:evspCdmF10FiledComplete,
    preflight:evspCdmPreflight,
    documentReady:evspCdmDocReady,
    supportingReady:evspCdmSupportingReady,
    appointmentReady:evspCdmAppointmentReady,
    selectRoute:evspCdmSelectRoute,
    confirmRiskRemoval:evspCdmConfirmRiskRemoval,
    dateNotFuture:evspCdmDateNotFuture,
    programmeValid:evspCdmProgrammeValid,
    documentDefinitions:EVSP_CDM_DOC_DEFS.slice()
  };
  EVSP_CDM_API.docDefs=EVSP_CDM_API.documentDefinitions;
  window.EvspCdmControls=EVSP_CDM_API;
  window.newCdmPack=evspCdmNewPack;
  window.normaliseCdmPack=evspCdmNormalisePack;
  window.evspCdmCardHTML=evspCdmCardHTML;
  window.evspCdmComplianceDetailHTML=evspCdmComplianceDetailHTML;
  window.evspCdmAssessment=evspCdmAssessment;
  window.evspCdmSyncCompliance=evspCdmSyncCompliance;
  window.evspCdmOpen=evspCdmOpen;
  window.evspCdmClose=evspCdmClose;
  window.evspCdmExportPdf=evspCdmExportPdf;
})();
