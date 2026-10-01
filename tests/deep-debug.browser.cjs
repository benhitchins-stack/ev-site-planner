/* Failure-path checks for the integrated planner. Run with the README Playwright setup. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'../public'),out=process.env.EVSP_TEST_OUTPUT||'/tmp/evsp-deep-debug';fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{try{let f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://test').pathname));if(!f.startsWith(root+path.sep)&&f!==root)throw Error();if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);}catch(_){res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const results=[];
 async function check(name,run,init){
  if(process.env.EVSP_CASE&&!name.toLowerCase().includes(process.env.EVSP_CASE.toLowerCase()))return;
  const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'en-GB',acceptDownloads:true}),page=await context.newPage(),errors=[];page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
  try{if(init)await page.addInitScript(init);await page.goto(base+'/#example',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.EVWorkspace&&EVWorkspace.route()==='overview');await run(page,context);assert.deepEqual(errors,[],'No browser exceptions');results.push({name,pass:true});console.log('PASS',name);}
  catch(e){results.push({name,pass:false,error:e.message,errors});console.error('FAIL',name,':',e.message.split('\n')[0]);await page.screenshot({path:path.join(out,'failure-'+results.length+'.png')}).catch(()=>{});}
  finally{await context.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));}
 }
 const markup=p=>p.locator('[data-ev-route="markup"]').click();
 const pickUnits=p=>p.evaluate(()=>{const u=activePhoto().items.filter(i=>i.type==='unit');sel=u[0].id;selSet=new Set(u.map(i=>i.id));sideTab='props';setSideTab();return u.map(i=>i.id);});
 try{
  await check('New projects clear previous multi-selection and placement tools',async p=>{
   await markup(p);await pickUnits(p);const old=await p.evaluate(()=>pack.projId);await p.locator('#evSidebar button[data-ev-route="home"]').click();await p.locator('[data-ev-action="new"]').click();await p.waitForFunction(id=>pack.projId!==id,old);
   assert.deepEqual(await p.evaluate(()=>({selection:[...selSet],tool})),{selection:[],tool:'select'});
  });
  await check('Changing plans finishes a pending route on its original plan',async p=>{
   await markup(p);const state=await p.evaluate(()=>{const first=activePhoto(),second={...JSON.parse(JSON.stringify(first)),id:uid(),name:'Second plan',items:[]};pack.photos.push(second);imgCache[second.id]=imgCache[first.id];renderSide();setTool('route:swa');handleTap(...S(80,150));handleTap(...S(300,150));return{first:first.id,second:second.id,count:first.items.length};});
   await p.locator('#evActivePlan').selectOption(state.second);
   const after=await p.evaluate(s=>({draft:!!draftRoute,tool,first:photoById(s.first).items.length,second:photoById(s.second).items.length}),state);
   assert.deepEqual(after,{draft:false,tool:'select',first:state.count+1,second:0});
  });
  await check('Undo and redo clear stale multi-selection IDs',async p=>{
   await markup(p);await pickUnits(p);await p.evaluate(()=>duplicateSelected());await p.locator('#btnUndo').click();assert.equal(await p.evaluate(()=>selSet.size),0);await p.locator('#btnRedo').click();assert.equal(await p.evaluate(()=>selSet.size),0);
   assert(await p.evaluate(()=>{const refs=activePhoto().items.filter(i=>i.type==='unit').map(i=>i.planRef);return refs.length===new Set(refs).size;}));
  });
  await check('Project details block drawing Delete and Undo shortcuts',async p=>{
   await markup(p);await pickUnits(p);const before=await p.evaluate(()=>JSON.stringify(activePhoto().items));await p.locator('#evEditTop').click();await p.locator('[data-ev-step="1"]').first().focus();await p.keyboard.press('Delete');await p.keyboard.press('Control+z');assert.equal(await p.evaluate(()=>JSON.stringify(activePhoto().items)),before);
   await p.keyboard.press('Escape');assert(await p.locator('#evDetails').isHidden());
  });
  await check('Plan reviews block drawing deletion while a PDF is open',async p=>{
   await markup(p);await pickUnits(p);const count=await p.evaluate(()=>activePhoto().items.length);await p.locator('#evIssuePlans').click();await p.waitForSelector('#evPlanPreview canvas');await p.locator('[data-ev-close-review]').first().focus();await p.keyboard.press('Delete');assert.equal(await p.evaluate(()=>activePhoto().items.length),count);
  });
  await check('Malformed workspace data cannot replace the current project',async p=>{
   const before=await p.evaluate(()=>pack.projId),result=await p.evaluate(async()=>{const b=JSON.parse(JSON.stringify(serialisablePack()));b.workspace='damaged';return EVWorkspace.importBackup(new File([JSON.stringify(b)],'damaged.json',{type:'application/json'}));});assert.equal(result,false);assert.equal(await p.evaluate(()=>pack.projId),before);assert(await p.locator('.ev-overview-heading').isVisible());
  });
  await check('Malformed programme records cannot break backup import',async p=>{
   const before=await p.evaluate(()=>pack.projId),result=await p.evaluate(async()=>{const b=JSON.parse(JSON.stringify(serialisablePack()));b.programme={activities:[null],start:'2026-10-01'};return EVWorkspace.importBackup(new File([JSON.stringify(b)],'damaged.json',{type:'application/json'}));});assert.equal(result,false);assert.equal(await p.evaluate(()=>pack.projId),before);
  });
  await check('A corrupt project index does not prevent the workspace opening',async p=>{assert(Array.isArray(await p.evaluate(()=>projIndex())));await p.locator('[data-ev-route="projects"]').click();await p.locator('#evSearch').waitFor();assert(await p.locator('#evSearch').isVisible());},()=>localStorage.setItem('evsp_projects','{"invalid":true}'));
  await check('Projects remain listed when localStorage is full but IndexedDB works',async p=>{
   const first=await p.evaluate(async()=>{await EVWorkspace.persist();return pack.projId;});await p.locator('#evSidebar button[data-ev-route="home"]').click();await p.locator('[data-ev-action="new"]').click();await p.locator('[data-ev-field="name"]').fill('Storage recovery project');await p.locator('[data-ev-close-details]').first().click();const second=await p.evaluate(async()=>{await EVWorkspace.persist();return pack.projId;});
   await p.reload({waitUntil:'networkidle'});await p.locator('.eh-nav [data-ev-route="projects"]').click();await p.locator('#evSearch').waitFor();const ids=await p.evaluate(()=>projIndex().map(x=>x.id));assert(ids.includes(first));assert(ids.includes(second));assert.equal(await p.locator('.ev-project-row').count(),2);
  },()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='evsp_projects')throw new DOMException('Full','QuotaExceededError');return original.call(this,k,v);};});
  await check('Overlapping PDF refreshes keep the newest canvas and thumbnails',async p=>{
   const result=await p.evaluate(async()=>{
    const original=ensurePdfJs,host=document.createElement('div');document.body.append(host);let release;const gate=new Promise(r=>release=r);
    const make=id=>({numPages:1,destroy:()=>id===1?gate:Promise.resolve(),getPage:async()=>({getViewport:()=>({width:100,height:100}),render:({canvasContext})=>{canvasContext.canvas.dataset.document=String(id);return{promise:Promise.resolve(),cancel(){}};}})});
    ensurePdfJs=async()=>({getDocument:({data})=>({promise:Promise.resolve(make(data))})});
    const viewer=EVReportViewer.mount(host);try{await viewer.set({output:()=>1});const stale=viewer.set({output:()=>2});await viewer.set({output:()=>3});release();await stale;await new Promise(r=>setTimeout(r,0));return{document:host.querySelector('.ev-document-canvas canvas')?.dataset.document,pages:host.querySelectorAll('[data-pdf-page]').length};}finally{ensurePdfJs=original;viewer.destroy();host.remove();}
   });assert.deepEqual(result,{document:'3',pages:1});
  });
  await check('Destroying a pending PDF viewer does not rewrite its replacement',async p=>{
   const result=await p.evaluate(async()=>{const original=ensurePdfJs,host=document.createElement('div');document.body.append(host);let release;const gate=new Promise(r=>release=r),doc={numPages:1,destroy:()=>gate,getPage:async()=>({getViewport:()=>({width:100,height:100}),render:()=>({promise:Promise.resolve(),cancel(){}})})};ensurePdfJs=async()=>({getDocument:()=>({promise:Promise.resolve(doc)})});const viewer=EVReportViewer.mount(host);try{await viewer.set({output:()=>1});const pending=viewer.set({output:()=>2});viewer.destroy();host.textContent='Replacement view';release();await pending;return host.textContent;}finally{ensurePdfJs=original;host.remove();}});assert.equal(result,'Replacement view');
  });
  await check('Programme dates handle weekends, excluded dates and overlapping activities',async p=>{
   const rows=await p.evaluate(()=>{pack.programme={start:'2026-12-24',days:{},skip:{},nonWorkingDates:['2026-12-25','2026-12-28'],activities:[{id:'a',name:'A',days:2},{id:'x',name:'Excluded',days:10,included:false},{id:'b',name:'Overlap',days:1,start:'2026-12-25'},{id:'c',name:'Following',days:2}]};return EVDelivery.schedule().map(r=>({id:r.id,from:r.from?.toISOString().slice(0,10)||null,to:r.to?.toISOString().slice(0,10)||null}));});assert.deepEqual(rows,[{id:'a',from:'2026-12-24',to:'2026-12-29'},{id:'x',from:null,to:null},{id:'b',from:'2026-12-29',to:'2026-12-29'},{id:'c',from:'2026-12-30',to:'2026-12-31'}]);
  });
  await check('Programme note edits get their own Undo entry',async p=>{
   await p.locator('[data-ev-route="programme"]').click();await p.locator('#edProgrammeStart').fill('2026-10-05');await p.locator('#edProgrammeStart').dispatchEvent('change');await p.locator('#edProgrammeNotes').fill('Keep this programme note');await p.locator('[data-ev-route="overview"]').focus();await p.keyboard.press('Control+z');assert.equal(await p.evaluate(()=>pack.programme.start),'2026-10-05');assert.equal(await p.evaluate(()=>pack.programme.notes||''),'');
  });
  await check('Plan label preferences persist and reflect the active project',async p=>{
   await markup(p);await p.locator('#wbLabelMode').selectOption('full');const saved=await p.evaluate(async()=>{await EVWorkspace.persist();return pack.projId;});await p.locator('#evSidebar button[data-ev-route="home"]').click();await p.locator('[data-ev-action="new"]').click();await p.locator('[data-ev-close-details]').first().click();await p.evaluate(id=>loadProject(id),saved);await markup(p);assert.equal(await p.locator('#wbLabelMode').inputValue(),'full');
  });
  await check('Technical dialogs isolate drawing keyboard shortcuts',async p=>{
   await markup(p);await pickUnits(p);const before=await p.evaluate(()=>JSON.stringify(activePhoto().items));await p.evaluate(()=>openCableCheck());await p.locator('#ccBackdrop.show button').first().focus();await p.keyboard.press('Delete');await p.keyboard.press('Control+z');assert.equal(await p.evaluate(()=>JSON.stringify(activePhoto().items)),before);
  });
  await check('Duplicate backup IDs are rejected without losing current work',async p=>{
   const before=await p.evaluate(()=>JSON.stringify(serialisablePack()));const result=await p.evaluate(async()=>{const b=JSON.parse(JSON.stringify(serialisablePack()));b.photos.push({...b.photos[0]});return EVWorkspace.importBackup(new File([JSON.stringify(b)],'duplicate.json'));});assert.equal(result,false);assert.equal(await p.evaluate(()=>JSON.stringify(serialisablePack())),before);
  });
  await check('Failed storage prevents a project switch and keeps the drawing',async p=>{
   const before=await p.evaluate(()=>pack.projId);await p.evaluate(()=>{idbSet=async()=>{throw Error('Storage unavailable');};Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError');};});await p.locator('#evSidebar button[data-ev-route="home"]').click();await p.locator('[data-ev-action="new"]').click();await p.waitForFunction(()=>!document.getElementById('evApp').hasAttribute('aria-busy'));assert.equal(await p.evaluate(()=>pack.projId),before);assert.equal(await p.locator('#evSaveState').getAttribute('data-state'),'error');
  });
  await check('Cancelled PDF page preparation cannot add pages or start a second import',async p=>{
   await markup(p);await p.evaluate(()=>{window.debugRender=renderPdfPage;window.debugAdd=addImageSources;window.debugAdded=0;let release;const gate=new Promise(r=>release=r);window.debugRelease=release;renderPdfPage=async(doc,n,width)=>{if(!width)await gate;const cn=document.createElement('canvas');cn.width=40;cn.height=40;return cn;};addImageSources=()=>{window.debugAdded++;};window.debugPicker=openPdfPicker({numPages:2},'Cancellation check');});
   await p.locator('#pdfAdd').click();assert(await p.locator('#pdfAll').isDisabled());assert(await p.locator('#pdfAdd').isDisabled());await p.locator('#pdfCancel').click();await p.evaluate(async()=>{await debugPicker;debugRelease();await new Promise(r=>setTimeout(r,50));renderPdfPage=debugRender;addImageSources=debugAdd;});assert.equal(await p.evaluate(()=>debugAdded),0);assert.equal(await p.locator('#pdfBackdrop').evaluate(e=>e.classList.contains('show')),false);
  });
  await check('A real two-page PDF imports each selected page once',async p=>{
   await markup(p);const before=await p.evaluate(()=>pack.photos.length);await p.evaluate(()=>{const doc=new jspdf.jsPDF();doc.text('First imported plan',10,20);doc.addPage();doc.text('Second imported plan',10,20);void addPhotos([new File([doc.output('arraybuffer')],'two-plans.pdf',{type:'application/pdf'})]);});await p.locator('#pdfBackdrop.show').waitFor();await p.locator('#pdfAll').click();await p.locator('#pdfAdd').click();await p.waitForFunction(n=>pack.photos.length===n+2&&pack.photos.every(x=>x.src&&!x._pending),before);await p.waitForFunction(()=>pendingFileImports.size===0);const photos=await p.evaluate(()=>pack.photos.slice(-2).map(x=>({name:x.name,w:x.imgW,h:x.imgH})));assert.deepEqual(photos.map(x=>x.name),['two-plans · p1','two-plans · p2']);assert(photos.every(x=>x.w>0&&x.h>0));await p.screenshot({path:path.join(out,'imported-pdf-plans.png')});
  });
  await check('Project switches wait for photo decoding and save the completed source',async p=>{
   const previous=await p.evaluate(async()=>{const id=pack.projId,blob=await(await fetch(activePhoto().src)).blob();window.debugDownscale=downscale;downscale=(data,callback)=>{window.debugDecode=()=>debugDownscale(data,callback);};void addImageSources([{name:'Slow image',blob}]);return id;});await p.waitForFunction(()=>!!window.debugDecode);await p.locator('#evSidebar button[data-ev-route="home"]').click();await p.locator('[data-ev-action="new"]').click();assert.equal(await p.evaluate(()=>pack.projId),previous);assert.equal(await p.locator('#evApp').getAttribute('aria-busy'),'true');await p.evaluate(()=>{debugDecode();downscale=debugDownscale;});await p.waitForFunction(id=>pack.projId!==id,previous);const photo=await p.evaluate(async id=>(await idbGet('proj_'+id)).pack.photos.at(-1),previous);assert.equal(photo.name,'Slow image');assert(photo.src.startsWith('data:image/'));assert(photo.imgW>0);assert(!photo._pending);
  });
  await check('The on-screen key updates when the export legend is hidden',async p=>{
   await markup(p);await p.locator('#wbKeyToggle').click();await p.evaluate(()=>{pack.showLegend=false;activePhoto().items.find(i=>i.type==='unit').label='Renamed while legend hidden';draw();});await p.waitForFunction(()=>document.getElementById('wbPlanKey').textContent.includes('Renamed while legend hidden'));
  });
  await check('Sidebar plan changes retain a draft route on its source plan',async p=>{
   await markup(p);const state=await p.evaluate(()=>{const first=activePhoto(),second={...JSON.parse(JSON.stringify(first)),id:uid(),name:'Sidebar plan',items:[]};pack.photos.push(second);imgCache[second.id]=imgCache[first.id];packSec='capture';renderSide();setTool('route:swa');handleTap(...S(80,150));handleTap(...S(300,150));return{first:first.id,second:second.id,count:first.items.length};});await p.locator('#evInspectorToggle').click();await p.locator('[data-photo="'+state.second+'"]').click();assert.deepEqual(await p.evaluate(s=>({active:pack.active,draft:!!draftRoute,count:photoById(s.first).items.length,selection:selSet.size}),state),{active:state.second,draft:false,count:state.count+1,selection:0});
  });
  await check('A PDF render failure is reported to the review instead of appearing ready',async p=>{
   const result=await p.evaluate(async()=>{const original=ensurePdfJs,host=document.createElement('div');document.body.append(host);ensurePdfJs=async()=>({getDocument:()=>({promise:Promise.resolve({numPages:1,destroy:async()=>{},getPage:async()=>{throw Error('Broken page');}})})});const viewer=EVReportViewer.mount(host);try{try{await viewer.set({output:()=>1});return{rejected:false};}catch(e){return{rejected:true,status:host.querySelector('[data-pdf-counter]').textContent};}}finally{viewer.destroy();host.remove();ensurePdfJs=original;}});assert.deepEqual(result,{rejected:true,status:'Preview unavailable'});
  });
  await check('Corrupt saved project content cannot replace the open project',async p=>{
   const before=await p.evaluate(()=>pack.projId);const result=await p.evaluate(async()=>{const bad=JSON.parse(JSON.stringify(serialisablePack()));bad.programme={activities:[null]};await idbSet('proj_bad-saved',{pack:bad,ts:Date.now()});return loadProject('bad-saved');});assert.equal(result,false);assert.equal(await p.evaluate(()=>pack.projId),before);
  });
 }finally{await browser.close();server.close();}
 console.log(results.filter(r=>r.pass).length+'/'+results.length+' deep-debug scenarios passed');if(results.some(r=>!r.pass))process.exitCode=1;
})();
