/* Reusable, device-local professional profile and project author snapshots. */
(function(){
'use strict';
const KEY='evsp_profile_v1',IDB_KEY='profile_v1';
const fields={name:120,role:140,company:180,email:180,phone:70,website:240,address:600,registration:140};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=(value,max)=>typeof value==='string'?value.slice(0,max):'';
const clone=value=>JSON.parse(JSON.stringify(value));
const logoOK=value=>typeof value==='string'&&value.length<=900000&&/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value);
function normalise(value){
 const p=value&&typeof value==='object'?value:{};
 const out={schema:1};Object.entries(fields).forEach(([key,max])=>out[key]=text(p[key],max));
 out.logo=logoOK(p.logo)?p.logo:'';out.useForNew=p.useForNew!==false;out.includeQualifications=p.includeQualifications!==false;
 const ids=new Set();out.qualifications=(Array.isArray(p.qualifications)?p.qualifications:[]).slice(0,60).filter(q=>q&&typeof q==='object'&&!Array.isArray(q)).map(q=>{
  let id=text(q.id,80)||uid();while(ids.has(id))id=uid();ids.add(id);
  return {id,name:text(q.name,180),issuer:text(q.issuer,180),reference:text(q.reference,120),expiry:/^\d{4}-\d{2}-\d{2}$/.test(q.expiry||'')?q.expiry:''};
 });
 return out;
}
const hasContent=p=>Object.keys(fields).some(k=>p[k]?.trim())||p.logo||p.qualifications.some(q=>q.name.trim());
let profile=normalise(null),updated=0,touched=false,queue=Promise.resolve(),sequence=0,logoSequence=0,saveError=false,loaded=false;
try{const stored=JSON.parse(localStorage.getItem(KEY)||'null');if(stored?.profile){profile=normalise(stored.profile);updated=Number(stored.updated)||0;}else{const old=deviceBrand();profile=normalise({company:old.name,logo:old.logo,email:old.email,phone:old.phone});}}catch(_){}
const ready=idbGet(IDB_KEY).then(saved=>{if(!touched&&saved?.profile&&saved.updated>updated){profile=normalise(saved.profile);updated=saved.updated;try{localStorage.setItem(KEY,JSON.stringify({profile,updated}));}catch(_){}}}).catch(()=>{}).finally(()=>{loaded=true;if(window.EVWorkspace?.route()==='profile')EVWorkspace.refresh();});
function status(message,error=false){const el=document.getElementById('epSaveStatus');if(el){el.textContent=message;el.classList.toggle('ep-error',error);}}
function persist(){
 touched=true;updated=Math.max(Date.now(),updated+1);const serial=++sequence,payload={profile:clone(profile),updated};
 let local=false;try{localStorage.setItem(KEY,JSON.stringify(payload));local=true;}catch(_){}
 status('Saving profile…');
 queue=queue.catch(()=>false).then(async()=>{
  let saved=local;try{await idbSet(IDB_KEY,payload);saved=true;}catch(_){}
  if(serial===sequence){saveError=!saved;status(saved?'Saved in this browser':'Could not save. Export your profile to keep a copy.',!saved);}
  return saved;
 });return queue;
}
function initials(){return profile.name.trim().split(/\s+/).filter(Boolean).slice(0,2).map(v=>v[0]).join('').toUpperCase()||'ME';}
const userIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/></svg>';
const action=(label,key,style='')=>'<button type="button" class="ev-btn '+style+'" data-ep-action="'+key+'">'+label+'</button>';
function field(label,key,type='text',wide=false,placeholder=''){
 return '<label class="ev-field '+(wide?'wide':'')+'">'+label+(type==='textarea'?'<textarea rows="3" data-ep-field="'+key+'" maxlength="'+fields[key]+'">'+esc(profile[key])+'</textarea>':'<input data-ep-field="'+key+'" type="'+type+'" maxlength="'+fields[key]+'" value="'+esc(profile[key])+'" placeholder="'+esc(placeholder)+'" autocomplete="'+({name:'name',role:'organization-title',company:'organization',email:'email',phone:'tel',address:'street-address'}[key]||'off')+'">')+'</label>';
}
function qualifications(){
 return profile.qualifications.length?profile.qualifications.map((q,i)=>'<article class="ep-qualification" data-ep-qualification="'+esc(q.id)+'"><div class="ep-qualification-head"><b>Qualification '+(i+1)+'</b><button class="ev-btn quiet" type="button" data-ep-remove="'+esc(q.id)+'" aria-label="Remove qualification '+(i+1)+'">Remove</button></div><div class="ev-form">'+[
 ['Qualification / accreditation','name','text',180,'e.g. Electrical installation qualification'],['Awarding body / organisation','issuer','text',180,'e.g. Awarding organisation'],['Certificate / membership reference','reference','text',120,'Optional'],['Expiry / renewal date','expiry','date',10,'']
 ].map(([label,key,type,max,placeholder])=>'<label class="ev-field">'+label+'<input data-ep-q="'+key+'" type="'+type+'" maxlength="'+max+'" value="'+esc(q[key])+'" placeholder="'+placeholder+'"></label>').join('')+'</div></article>').join(''):'<div class="ep-empty">'+userIcon+'<b>No qualifications added</b><p>Add qualifications, professional memberships or training records.</p>'+action('+ Add your first qualification','add-qualification')+'</div>';
}
let activeTab='details',previewTimer=null,previewSequence=0;
function preview(){
 clearTimeout(previewTimer);previewTimer=setTimeout(renderSample,180);
 return '<div class="ep-document-preview"><div id="epSampleImage" role="status">Preparing document preview…</div><p>Full page preview using your current profile.</p>'+action('Download sample PDF','sample')+'</div>';
}
async function renderSample(){
 const el=document.getElementById('epSampleImage');if(!el||!window.EVReportBranding)return;const token=++previewSequence;
 let pdf=null;
 try{const doc=EVReportBranding.profileSample(profile),lib=await ensurePdfJs();pdf=await openPdfDocument(lib,doc.output('arraybuffer')).promise;const page=await pdf.getPage(1),vp=page.getViewport({scale:1.2}),canvas=document.createElement('canvas');canvas.width=Math.ceil(vp.width);canvas.height=Math.ceil(vp.height);canvas.setAttribute('role','img');canvas.setAttribute('aria-label','First page of the sample programme PDF with your company logo and profile details');await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;if(token===previewSequence&&el.isConnected){el.replaceChildren(canvas);const header=document.getElementById('epHeaderImage');if(header){const crop=document.createElement('canvas');crop.width=canvas.width;crop.height=Math.round(canvas.height*38/210);crop.getContext('2d').drawImage(canvas,0,0);crop.setAttribute('role','img');crop.setAttribute('aria-label','Enlarged report header showing the company logo and project details');header.replaceChildren(crop);}}}
 catch(_){if(token===previewSequence&&el.isConnected)el.textContent='Preview unavailable. Download the sample PDF to check your details.';}
 finally{if(pdf)await pdf.destroy();}
}
function refreshPreview(){const el=document.getElementById('epPreview');if(el)el.innerHTML=preview();}
function logoControl(){return '<div class="ep-logo-box">'+(profile.logo?'<img src="'+profile.logo+'" alt="Your company logo">':userIcon)+'</div><div><b>Company logo</b><p>PNG, JPG, WebP or SVG. Up to 10 MB.</p><div class="ev-actions">'+action(profile.logo?'Replace logo':'Upload logo','logo')+(profile.logo?action('Remove','remove-logo','quiet'):'')+'</div></div>';}
function tab(key){
 activeTab=key;
 document.querySelectorAll('[data-ep-tab]').forEach(b=>{const on=b.dataset.epTab===key;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});
 document.querySelectorAll('[data-ep-panel]').forEach(p=>p.hidden=p.dataset.epPanel!==key);
}
function render(){
 if(!loaded)return '<div class="ev-empty" role="status">Loading your profile…</div>';
 const current=!!pack.projId;
 const panel=(key,content)=>'<section id="epPanel-'+key+'" data-ep-panel="'+key+'" role="tabpanel" aria-labelledby="epTab-'+key+'" '+(activeTab!==key?'hidden':'')+'>'+content+'</section>';
 return (window.EVWorkspace?.pageHead?EVWorkspace.pageHead('My profile','Your details and branding for project documents.',action('Import profile','import')+action('Export profile','export')):'<div class="ev-heading"><div><h1>My profile</h1><p>Your details and branding for project documents.</p></div><div class="ev-actions">'+action('Import profile','import')+action('Export profile','export')+'</div></div>')+
 '<div class="ep-layout"><div class="ep-editor"><div class="ep-editor-top"><div class="ep-tabs" role="tablist" aria-label="Profile sections">'+[['details','Details'],['qualifications','Qualifications'],['branding','Branding']].map(([key,label])=>'<button type="button" id="epTab-'+key+'" role="tab" data-ep-tab="'+key+'" aria-controls="epPanel-'+key+'" aria-selected="'+(activeTab===key)+'" tabindex="'+(activeTab===key?'0':'-1')+'">'+label+'</button>').join('')+'</div><span id="epSaveStatus" class="ep-save '+(saveError?'ep-error':'')+'" role="status" aria-live="polite">'+(saveError?'Save unavailable · export a copy':'Changes save automatically')+'</span></div>'+
 panel('details','<section class="ev-card"><div class="ev-card-head"><h2>Your details</h2></div><div class="ev-card-body"><div class="ev-form">'+field('Your name','name')+field('Role / job title','role')+field('Email address','email','email')+field('Phone number','phone','tel')+'</div><h3 class="ep-form-heading">Company details</h3><div class="ev-form">'+field('Company / trading name','company','text',true)+field('Website','website','text',false,'e.g. example.co.uk')+field('Company registration number','registration','text',false,'Optional')+field('Business address','address','textarea',true)+'</div></div></section>')+
 panel('qualifications','<section class="ev-card"><div class="ev-card-head"><div><h2>Qualifications & memberships</h2><p class="ed-help">Include an awarding body, reference and renewal date where applicable.</p></div>'+action('+ Add','add-qualification')+'</div><div id="epQualifications">'+qualifications()+'</div></section>')+
 panel('branding','<section class="ev-card"><div class="ev-card-head"><h2>Report branding</h2></div><div class="ev-card-body"><div class="ep-logo-upload" id="epLogoControl">'+logoControl()+'</div><p id="epLogoStatus" class="ed-help" role="status"></p><p class="ed-help">Your logo keeps its original proportions in the report header. Company details come from the Details tab.</p><div class="ep-header-preview"><span>Report header</span><div id="epHeaderImage" role="status">Preparing header preview…</div></div><p class="ed-help">The header updates as you edit your profile. Download the sample to check it at printed size.</p></div></section>')+'</div>'+
 '<aside class="ep-aside"><div class="ep-preview-label">DOCUMENT PREVIEW</div><div id="epPreview">'+preview()+'</div><section class="ev-card ep-preferences"><div class="ev-card-head"><h2>Use your profile</h2></div><div class="ev-card-body"><label class="ed-check"><input type="checkbox" data-ep-check="useForNew" '+(profile.useForNew?'checked':'')+'><span>Use for new projects<small>Pre-fill your name, company details and logo.</small></span></label><label class="ed-check"><input type="checkbox" data-ep-check="includeQualifications" '+(profile.includeQualifications?'checked':'')+'><span>Include qualifications in reports<small>Add them to programme and snag reports.</small></span></label>'+(current?'<div class="ep-apply"><b>'+esc(pack.name||'Current project')+'</b><p>Replace this project’s author and branding with your profile details.</p>'+action('Use profile on this project','apply','primary')+'</div>':'<p class="ed-help">Start a project to use these details on your plans and reports.</p>')+'</div></section><p class="ep-storage-note">Saved in this browser. Export your profile to keep a backup or move to another device. Project backups retain the profile details used for that project.</p></aside></div>';
}

function apply(target,{force=false}={}){
 if(!hasContent(profile)||(!force&&!profile.useForNew))return false;
 target.surveyedBy=profile.name;target.brandName=profile.company;target.brandLogo=profile.logo;target.replyEmail=profile.email;target.replyPhone=profile.phone;
 target.workspace=target.workspace||{};const {logo,...author}=clone(profile);target.workspace.authorProfile={...author,appliedAt:new Date().toISOString()};
 if(target.workspace.snagReport)target.workspace.snagReport.preparedBy=profile.name;
 return true;
}
function exportProfile(){
 const payload={type:'ev-site-planner-profile',schema:1,exportedAt:new Date().toISOString(),profile:clone(profile)};
 const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=document.createElement('a');
 a.href=url;a.download=(profile.name||'EV-Site-Planner').replace(/[^a-z0-9_-]+/gi,'_')+'.evprofile.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
async function rasterLogo(file){
 if(file.size>10*1024*1024)throw Error('Choose a logo smaller than 10 MB.');
 if(!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type))throw Error('Choose a PNG, JPG, WebP or SVG logo.');
 const url=URL.createObjectURL(file);
 try{const im=new Image();im.src=url;await im.decode();if(!im.naturalWidth||!im.naturalHeight)throw Error();
  const scale=Math.min(1,600/im.naturalWidth,300/im.naturalHeight),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(im.naturalWidth*scale));canvas.height=Math.max(1,Math.round(im.naturalHeight*scale));canvas.getContext('2d').drawImage(im,0,0,canvas.width,canvas.height);const data=canvas.toDataURL('image/png');if(!logoOK(data))throw Error();return data;
 }catch(err){throw Error(err.message?.startsWith('Choose')?err.message:'This logo could not be read. Try another PNG or JPG image.');}finally{URL.revokeObjectURL(url);}
}
const logoInput=document.createElement('input');logoInput.type='file';logoInput.accept='image/png,image/jpeg,image/webp,image/svg+xml';logoInput.hidden=true;logoInput.id='epLogoInput';document.body.append(logoInput);
logoInput.onchange=async()=>{
 const file=logoInput.files[0];logoInput.value='';if(!file)return;const token=++logoSequence;
 const feedback=message=>{const el=document.getElementById('epLogoStatus');if(el)el.textContent=message;};feedback('Preparing logo…');
 try{const data=await rasterLogo(file);if(token!==logoSequence)return;profile.logo=data;persist();const el=document.getElementById('epLogoControl');if(el)el.innerHTML=logoControl();refreshPreview();feedback('Logo added to your profile.');}
 catch(err){if(token===logoSequence)feedback(err.message);}
};
const importInput=document.createElement('input');importInput.type='file';importInput.accept='.evprofile.json,.json,application/json';importInput.hidden=true;importInput.id='epImportInput';document.body.append(importInput);
importInput.onchange=async()=>{
 const file=importInput.files[0];importInput.value='';if(!file)return;
 try{if(file.size>2*1024*1024)throw Error();const data=JSON.parse(await file.text());if(data.type!=='ev-site-planner-profile'||data.schema!==1||!data.profile||typeof data.profile!=='object'||Array.isArray(data.profile))throw Error();
  if(Object.keys(fields).some(k=>data.profile[k]!=null&&typeof data.profile[k]!=='string')||!Array.isArray(data.profile.qualifications)||data.profile.qualifications.length>60||(data.profile.logo&&!logoOK(data.profile.logo)))throw Error();
  const incoming=normalise(data.profile);if(hasContent(profile)&&!await askConfirm({title:'Replace this profile?',label:'The imported file will replace your saved profile. Existing projects keep their own author details.',okText:'Import profile'}))return;
  logoSequence++;profile=incoming;await persist();if(EVWorkspace.route()==='profile')EVWorkspace.refresh();toast('Profile imported');
 }catch(_){toast('This is not a valid profile backup. Your current profile has been kept.');}
};
document.addEventListener('input',e=>{
 const key=e.target.dataset.epField;if(key&&Object.hasOwn(fields,key)){profile[key]=e.target.value.slice(0,fields[key]);persist();refreshPreview();return;}
 const qkey=e.target.dataset.epQ,row=e.target.closest('[data-ep-qualification]');if(qkey&&row){const q=profile.qualifications.find(v=>v.id===row.dataset.epQualification);if(q&&['name','issuer','reference','expiry'].includes(qkey)){q[qkey]=e.target.value;persist();refreshPreview();}}
});
document.addEventListener('change',e=>{const key=e.target.dataset.epCheck;if(['useForNew','includeQualifications'].includes(key)){profile[key]=e.target.checked;persist();refreshPreview();}});
document.addEventListener('click',async e=>{
 const selectedTab=e.target.closest('[data-ep-tab]');if(selectedTab){tab(selectedTab.dataset.epTab);return;}
 const remove=e.target.closest('[data-ep-remove]');if(remove){const id=remove.dataset.epRemove;profile.qualifications=profile.qualifications.filter(q=>q.id!==id);persist();document.getElementById('epQualifications').innerHTML=qualifications();refreshPreview();document.querySelector('[data-ep-action="add-qualification"]')?.focus();return;}
 const b=e.target.closest('[data-ep-action]');if(!b)return;const action=b.dataset.epAction;
 if(action==='sample'){const doc=EVReportBranding.profileSample(profile),url=URL.createObjectURL(doc.output('blob')),link=document.createElement('a');link.href=url;link.download='Profile-document-sample.pdf';link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);return;}
 if(action==='logo'){logoInput.click();return;}
 if(action==='remove-logo'){logoSequence++;profile.logo='';persist();document.getElementById('epLogoControl').innerHTML=logoControl();document.getElementById('epLogoStatus').textContent='';refreshPreview();return;}
 if(action==='add-qualification'){tab('qualifications');if(profile.qualifications.length>=60){toast('A profile can hold up to 60 qualification records.');return;}profile.qualifications.push({id:uid(),name:'',issuer:'',reference:'',expiry:''});persist();document.getElementById('epQualifications').innerHTML=qualifications();document.querySelector('#epQualifications article:last-child input')?.focus();return;}
 if(action==='export'){exportProfile();return;}
 if(action==='import'){importInput.click();return;}
 if(action==='apply'){
  if(!hasContent(profile)){toast('Add your details before applying the profile.');return;}
  b.disabled=true;await ready;pushHist();apply(pack,{force:true});syncBrand();renderSide();if(EVWorkspace.route()==='profile')document.title='EV Site Planner · My profile';const saved=await EVWorkspace.persist();b.disabled=false;toast(saved?'Profile applied to this project':'Profile applied. Download a project backup to keep your work.');
 }
});
document.addEventListener('keydown',e=>{const button=e.target.closest('[data-ep-tab]');if(!button||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();e.stopPropagation();const keys=['details','qualifications','branding'],i=keys.indexOf(activeTab),next=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowLeft'?-1:1)+3)%3;tab(keys[next]);document.getElementById('epTab-'+keys[next]).focus();});
function reportRows(target){
 if(!target.workspace?.authorProfile)return [];const p=normalise(target.workspace.authorProfile);
 const rows=[['Company',target.brandName],['Role',p.role],['Contact',[target.replyEmail,target.replyPhone].filter(Boolean).join(' · ')],['Website',p.website],['Business address',p.address],['Company registration',p.registration]].filter(r=>r[1]);
 if(p.includeQualifications)for(const q of p.qualifications||[])if(q.name?.trim())rows.push(['Qualification',[q.name,q.issuer,q.reference?'Ref: '+q.reference:'',q.expiry?'Expiry / renewal: '+q.expiry.split('-').reverse().join('/'):''].filter(Boolean).join('\n')]);
 return rows;
}
function drawLogo(doc,data,x,y,w,h){
 if(!logoOK(data))return false;
 try{const image=doc.getImageProperties(data),scale=Math.min(w/image.width,h/image.height),ww=image.width*scale,hh=image.height*scale;doc.addImage(data,image.fileType,x+(w-ww)/2,y+(h-hh)/2,ww,hh,undefined,'FAST');return true;}catch(_){return false;}
}
window.EVProfile={render,ready,apply,reportRows,drawLogo,get:()=>clone(profile),normalise,flush:()=>queue,version:'profile-r1'};
})();
