/* Atomic project writes, conflict detection and non-destructive index recovery. */
(function(){
'use strict';
const versions=new Map(),blocked=new Map(),tabId=crypto.randomUUID?.()||Math.random().toString(36).slice(2);
const token=r=>r?.pack?String(r.revision??('legacy:'+Number(r.ts||0))):null;
const newer=(a,b)=>b?.pack&&!b.slim&&(!a?.pack||Number(b.ts||0)>Number(a.ts||0))?b:a;
const localRecord=id=>{try{return JSON.parse(localStorage.getItem('evsp_proj_'+id)||'null');}catch{return null;}};
const summaryOf=(id,r)=>({id,name:r.pack.name||'Untitled project',mode:r.pack.mode||'commercial',date:new Date(r.ts||Date.now()).toISOString().slice(0,10),updatedAt:r.ts||0,thumb:r.pack.photos?.[0]?.thumb||'',n:r.pack.photos?.length||0,cust:r.pack.custName||'',ref:r.pack.jobRef||''});
const mergeRows=(...lists)=>{const rows=new Map();for(const list of lists)for(const row of list||[])if(row?.id){const previous=rows.get(row.id);if(!previous||Number(row.updatedAt||0)>=Number(previous.updatedAt||0))rows.set(row.id,row);}return [...rows.values()].sort((a,b)=>Number(b.updatedAt||0)-Number(a.updatedAt||0));};
let channel;try{channel=new BroadcastChannel('evsp-project-revisions');}catch{}
function adopt(record){if(record?.pack?.projId){versions.set(record.pack.projId,token(record));blocked.delete(record.pack.projId);}renderConflict();}
function expected(id){
 if(!versions.has(id)){const loaded=window.__evLoadedRecord;if(loaded?.pack?.projId===id)versions.set(id,token(loaded));else versions.set(id,null);}
 return versions.get(id);
}
function conflict(id,current){const e=new Error('A newer project version is saved in another tab.');e.code='EVSP_CONFLICT';e.projectId=id;e.current=current;return e;}
function markConflict(id,record){blocked.set(id,record||{});renderConflict();}
function renderConflict(){
 const host=document.getElementById('evContent');if(!host)return;
 let banner=document.getElementById('evConflict');
 if(!banner){banner=document.createElement('div');banner.id='evConflict';banner.className='ev-conflict';banner.setAttribute('role','alert');host.prepend(banner);}
 const record=blocked.get(pack.projId);banner.hidden=!record;
 if(!record)return;
 banner.innerHTML='<div><b>This project changed in another tab.</b><p>Your edits are still here. Save them as a new project, or reload the newer saved version.</p></div><div class="ev-actions"><button class="ev-btn primary" data-conflict-copy>Save my edits as a new project</button><button class="ev-btn" data-conflict-reload>Reload latest</button><button class="ev-btn" data-conflict-backup>Download my backup</button></div>';
 banner.querySelector('[data-conflict-copy]').onclick=async()=>{
  const oldId=pack.projId;pack.projId=uid();pack.name=(pack.name||'Project')+' · recovered edits';window.__evLoadedRecord=null;blocked.delete(oldId);renderConflict();
  if(await EVWorkspace.persist()){EVWorkspace.refresh();toast('Your edits were saved as a separate project.');}
 };
 banner.querySelector('[data-conflict-reload]').onclick=async()=>{
  if(await askConfirm({title:'Reload the latest saved version?',label:'Unsaved edits in this tab will be replaced. Use Save my edits as a new project or Download my backup to keep them.',okText:'Reload latest'}))await loadProject(pack.projId,true);
 };
 banner.querySelector('[data-conflict-backup]').onclick=()=>EVWorkspace.backup();
}
function mirrorIndex(rows,ts){
 projectIndexMemory=rows;try{localStorage.setItem('evsp_projects',JSON.stringify(rows));localStorage.setItem('evsp_projects_ts',String(ts));projectIndexLocalFailed=false;}catch{projectIndexLocalFailed=true;}
}
async function save(full,recovery,summary){
 const id=summary.id,wanted=expected(id);
 if(blocked.has(id))throw conflict(id,blocked.get(id));
 const operation=async()=>{
  let observed,readSucceeded=false;
  let committed,rows,unchanged=false;
  try{
   const db=await idb();
   const result=await new Promise((resolve,reject)=>{
    const tx=db.transaction(IDB_KV,'readwrite'),kv=tx.objectStore(IDB_KV);
    let failure,result;
    const request=kv.get('proj_'+id);
    request.onsuccess=()=>{
     observed=newer(request.result,localRecord(id));readSucceeded=true;
     unchanged=!!observed?.pack&&EVPlanningCore.stable(observed.pack)===EVPlanningCore.stable(full.pack);
     if(!unchanged&&token(observed)!==wanted){failure=conflict(id,observed);tx.abort();return;}
     const now=Math.max(Date.now(),Number(observed?.ts||0)+1);
     committed=unchanged?observed:{...full,ts:now,revision:Number(observed?.revision||0)+1,writer:tabId};
     const recover={...recovery,ts:now,revision:committed.revision,writer:tabId};
     const indexRequest=kv.get('projects_index');
     indexRequest.onsuccess=()=>{
      rows=mergeRows(indexRequest.result?.rows,projIndex(),[{...summary,updatedAt:now}]);
      kv.put(committed,'proj_'+id);kv.put(recover,'autosave');kv.put({rows,ts:now},'projects_index');
      result={record:committed,rows};
     };
    };
    tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(failure||tx.error);tx.onabort=()=>reject(failure||tx.error||new Error('Project save aborted'));
   });
   committed=result.record;rows=result.rows;
   try{localStorage.removeItem('evsp_proj_'+id);localStorage.removeItem(LS_KEY);}catch{}
  }catch(error){
   if(error?.code==='EVSP_CONFLICT')throw error;
   // Web Locks serialises the localStorage fallback across tabs. Without it, keep the in-memory copy.
   if(!navigator.locks)throw error;
   const current=newer(observed,localRecord(id));
   if((readSucceeded||current)&&token(current)!==wanted)throw conflict(id,current);
   if(!readSucceeded&&!current&&wanted!==null)throw new Error('The saved version could not be checked. Download a backup.');
   const now=Math.max(Date.now(),Number(current?.ts||0)+1);
   committed={...full,ts:now,revision:Number(current?.revision||0)+1,writer:tabId};
   const recover={...recovery,ts:now,revision:committed.revision,writer:tabId};
   localStorage.setItem('evsp_proj_'+id,JSON.stringify(committed));
   localStorage.setItem(LS_KEY,JSON.stringify(recover));
   rows=mergeRows(projIndex(),[{...summary,updatedAt:now}]);
  }
  mirrorIndex(rows,committed.ts);versions.set(id,token(committed));
  if(!unchanged)channel?.postMessage({id,revision:committed.revision,ts:committed.ts,writer:tabId});
  return committed;
 };
 try{return navigator.locks?await navigator.locks.request('evsp-project-writes',operation):await operation();}
 catch(error){if(error?.code==='EVSP_CONFLICT')markConflict(id,error.current);throw error;}
}
if(channel)channel.onmessage=event=>{
 const r=event.data;if(!r||r.writer===tabId||r.id!==pack.projId)return;
 const value=expected(r.id);if(value!==null&&String(r.revision)!==value)markConflict(r.id,r);
};
async function scan(){
 const records=new Map();let rejected=0,unavailable=false;
 const add=(key,record)=>{
  if(!key.startsWith('proj_')||!record?.pack||record.slim)return;
  const id=key.slice(5);
  try{validateProjectBackup(record.pack);if(!/^[a-zA-Z0-9_.-]{1,128}$/.test(id)||['__proto__','prototype','constructor'].includes(id)||Object.hasOwn(Object.prototype,id))throw Error();const prev=records.get(id);if(!prev||Number(record.ts||0)>Number(prev.updatedAt||0))records.set(id,summaryOf(id,record));}catch{rejected++;}
 };
 try{const db=await idb();await new Promise((resolve,reject)=>{const tx=db.transaction(IDB_KV,'readonly'),request=tx.objectStore(IDB_KV).openCursor();request.onsuccess=()=>{const cursor=request.result;if(!cursor)return;add(String(cursor.key),cursor.value);cursor.continue();};tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}catch{unavailable=true;}
 try{for(let n=0;n<localStorage.length;n++){const key=localStorage.key(n);if(key?.startsWith('evsp_proj_'))try{add(key.slice(5),JSON.parse(localStorage.getItem(key)));}catch{rejected++;}}}catch{unavailable=true;}
 const indexed=new Set(projIndex().map(x=>x.id));return {rows:[...records.values()].filter(r=>!indexed.has(r.id)),rejected,unavailable};
}
async function repair(rows){
 const operation=async()=>{
  let merged,ts=Date.now();
  try{const db=await idb();await new Promise((resolve,reject)=>{const tx=db.transaction(IDB_KV,'readwrite'),kv=tx.objectStore(IDB_KV),request=kv.get('projects_index');request.onsuccess=()=>{merged=mergeRows(request.result?.rows,projIndex(),rows);kv.put({rows:merged,ts},'projects_index');};tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
  catch(error){if(!navigator.locks)throw error;merged=mergeRows(projIndex(),rows);localStorage.setItem('evsp_projects',JSON.stringify(merged));}
  mirrorIndex(merged,ts);return rows.length;
 };
 return navigator.locks?navigator.locks.request('evsp-project-writes',operation):operation();
}
window.addEventListener('pageshow',renderConflict);
window.addEventListener('beforeunload',event=>{if(blocked.has(pack.projId)){event.preventDefault();event.returnValue='';}});
window.EVProjectStore={save,adopt,scan,repair,renderConflict,isBlocked:id=>blocked.has(id),token};
})();