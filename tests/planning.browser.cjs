/* Failure-path checks for the integrated planner. Run with the README Playwright setup. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const engines=require('playwright');
const engineName=process.env.EVSP_BROWSER||'chromium';
if(!['chromium','firefox','webkit'].includes(engineName))throw Error('Unsupported EVSP_BROWSER');
(async()=>{
 const root=path.resolve(__dirname,'../public'),out=process.env.EVSP_TEST_OUTPUT||'/tmp/evsp-planning-'+engineName;fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{try{let f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://test').pathname));if(!f.startsWith(root+path.sep)&&f!==root)throw Error();if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.wasm':'application/wasm','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);}catch(_){res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await engines[engineName].launch({headless:true,...(engineName==='chromium'?{...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{})});
 const results=[];
 async function check(name,run,init){
  if(process.env.EVSP_CASE&&!name.toLowerCase().includes(process.env.EVSP_CASE.toLowerCase()))return;
  const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'en-GB',acceptDownloads:true}),page=await context.newPage(),errors=[];page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
  try{if(init)await page.addInitScript(init);await page.goto(base+'/#example',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.EVWorkspace&&EVWorkspace.route()==='overview');await run(page,context);assert.deepEqual(errors,[],'No browser exceptions');results.push({name,pass:true});console.log('PASS',name);}
  catch(e){results.push({name,pass:false,error:e.message,errors});console.error('FAIL',name,':',e.message);if(errors.length)console.error('Browser errors:',JSON.stringify(errors));await page.screenshot({path:path.join(out,'failure-'+results.length+'.png')}).catch(()=>{});}
  finally{await context.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));}
 }
 const markup=p=>p.locator('[data-ev-route="markup"]').click();
 const pickUnits=p=>p.evaluate(()=>{const u=activePhoto().items.filter(i=>i.type==='unit');sel=u[0].id;selSet=new Set(u.map(i=>i.id));sideTab='props';setSideTab();return u.map(i=>i.id);});

 try{
  const openLab=async(p,name)=>{await p.locator('[data-ev-route="planning"]').click();if(name)await p.locator('[data-evp-tab="'+name+'"]').click();};
  await check('Evidence persists and becomes an assumption after the measured value changes',async p=>{
   await openLab(p,'evidence');
   const key=await p.evaluate(()=>EVPlanningCore.facts(pack).find(f=>f.target.itemId&&f.present).key);
   const form=p.locator('[data-evp-evidence="'+key+'"]');await form.locator('..').locator('summary').click();
   await form.locator('[name=status]').selectOption('measured');await form.locator('[name=source]').fill('Laser survey <A>');await form.locator('[name=by]').fill('Test surveyor');await form.locator('[name=date]').fill('2026-10-02');await form.locator('button[type=submit]').click();
   await p.waitForFunction(key=>EVPlanningCore.facts(pack).find(f=>f.key===key).status==='measured',key);
   await p.evaluate(async key=>{const item=EVPlanningCore.rows(pack).find(r=>'item:'+r.item.id===key).item;if(item.type==='unit')item.kw='11';else item.manualLen=123;await EVWorkspace.persist();},key);
   await p.reload({waitUntil:'networkidle'});await p.waitForFunction(()=>window.EVPlanning&&window.EVWorkspace);
   assert.equal(await p.evaluate(key=>EVPlanningCore.facts(pack).find(f=>f.key===key).status,key),'assumed');
   assert.equal(await p.evaluate(key=>pack.workspace.planning.evidence[key].source,key),'Laser survey <A>');
  });
  await check('Design options compare quantities and connected-circuit impact',async p=>{
   await openLab(p,'compare');await p.locator('#evpOptionName').fill('Quotation <A>');await p.locator('[data-evp-action="capture-option"]').click();
   await p.waitForFunction(()=>pack.workspace.planning.options.length===1);
   const item=await p.evaluate(async()=>{const i=activePhoto().items.find(i=>i.type==='route'&&['swa','run','hituff','tails'].includes(i.kind));i.manualLen=42;await EVWorkspace.persist();return i.id;});
   await p.locator('[data-evp-tab="impact"]').click();await p.waitForSelector('#evpPlanPreview');
   assert.match(await p.locator('.evp-change-list').innerText(),/manualLen/);
   assert.match(await p.locator('#evScreen').innerText(),/Connected circuits to recheck/);
   assert(await p.locator('[data-evp-action="locate-item"][data-id="'+item+'"]').count()>0);
   assert.equal(await p.evaluate(()=>pack.workspace.planning.options[0].name),'Quotation <A>');
  });
  await check('Snapshots remain immutable and restore a complete separate project',async p=>{
   const initial=await p.evaluate(()=>({id:pack.projId,name:pack.name,src:pack.photos[0].src}));
   await openLab(p,'revisions');await p.locator('#evpRevisionName').fill('Issued design A');await p.locator('[data-evp-action="capture-revision"]').click();
   await p.waitForFunction(()=>pack.workspace.planning.revisions.length===1);
   await p.evaluate(async()=>{pack.name='Changed current';activePhoto().items[0].label='Later change';await EVWorkspace.persist();});
   await p.locator('[data-evp-action="restore"]').click();await p.waitForFunction(id=>pack.projId!==id,initial.id);
   const restored=await p.evaluate(async old=>({name:pack.name,src:pack.photos[0].src,oldName:(await idbGet('proj_'+old)).pack.name,history:pack.workspace.planning.revisions.length}),initial.id);
   assert.match(restored.name,/Issued design A/);assert.equal(restored.src,initial.src);assert.equal(restored.oldName,'Changed current');assert.equal(restored.history,1);
  });
  await check('Revision images survive a downloaded backup and fresh import',async p=>{
   await p.evaluate(async()=>{EVPlanningCore.capture(pack,{name:'Portable revision'});await EVWorkspace.persist();});
   const waiting=p.waitForEvent('download');await p.locator('#evBackupTop').click();const file=path.join(out,'planning-backup.json');await(await waiting).saveAs(file);
   const exported=JSON.parse(fs.readFileSync(file,'utf8'));assert(exported.workspace.planning.assets);assert(exported.workspace.planning.revisions.length);
   await p.evaluate(async exported=>{await EVWorkspace.importBackup({text:async()=>JSON.stringify(exported)});},exported);
   assert.equal(await p.evaluate(()=>EVPlanningCore.hydrate(pack.workspace.planning.revisions[0].snapshot,pack.workspace.planning.assets).photos[0].src),exported.photos[0].src);
  });
  await check('Charging day exports results and invalidates them when inputs change',async p=>{
   await openLab(p,'charging');await p.locator('[data-evp-field="simulation.supplyKw"]').fill('20');await p.locator('[data-evp-field="simulation.baseKw"]').fill('10');await p.locator('[data-evp-action="simulate"]').click();
   await p.waitForSelector('.evp-chart');assert.match(await p.locator('#evpSimulationResult').innerText(),/Unserved energy/i);
   const waiting=p.waitForEvent('download');await p.locator('[data-evp-action="export-simulation"]').click();const file=path.join(out,'charging.csv');await(await waiting).saveAs(file);assert.match(fs.readFileSync(file,'utf8'),/Shortfall kWh/);
   await p.locator('[data-evp-field="simulation.supplyKw"]').fill('50');await p.locator('[data-evp-field="simulation.baseKw"]').focus();await p.waitForFunction(()=>!document.querySelector('.evp-chart'));assert.match(await p.locator('#evpSimulationResult').innerText(),/Run the scenario again/);
  });
  await check('Expansion replay preserves current design and phase assignments',async p=>{
   await openLab(p,'phases');const id=await p.evaluate(()=>activePhoto().items.find(i=>i.type==='unit').id);
   await p.locator('[data-evp-assignment="'+id+'"]').selectOption('future');await p.waitForFunction(id=>pack.workspace.planning.assignments[id]==='future',id);
   const before=await p.evaluate(()=>JSON.stringify(serialisablePack()));
   await p.locator('#evpPhaseSlider').fill('1');await p.locator('#evpPhaseSlider').dispatchEvent('change');await p.waitForFunction(()=>document.querySelector('#evpPhaseSummary').textContent.includes('Future expansion'));
   await p.locator('[data-evp-action="replay"]').click();await p.waitForTimeout(1800);await p.locator('[data-evp-action="replay"]').click();
   assert.equal(await p.evaluate(()=>JSON.stringify(serialisablePack())),before);assert(await p.locator('#evpPlanPreview').evaluate(c=>c.width>0&&c.height>0));
  });

  await check('A stale tab cannot overwrite another tab and can preserve its edits as a copy',async(p,context)=>{
   const id=await p.evaluate(async()=>{await EVWorkspace.persist();return pack.projId;});
   const second=await context.newPage();await second.goto(base+'/#project='+id,{waitUntil:'networkidle'});await second.waitForFunction(()=>window.EVWorkspace&&EVWorkspace.route()==='overview');
   assert.equal(await p.evaluate(async()=>{pack.notes='Latest saved in first tab';return EVWorkspace.persist();}),true);
   await second.waitForSelector('#evConflict:not([hidden])');
   assert.equal(await second.evaluate(async()=>{pack.notes='Independent second-tab edits';return EVWorkspace.persist();}),false);
   assert.equal(await p.evaluate(async id=>(await idbGet('proj_'+id)).pack.notes,id),'Latest saved in first tab');
   await second.locator('[data-conflict-copy]').click();await second.waitForFunction(id=>pack.projId!==id,id);
   assert.equal(await second.evaluate(()=>pack.notes),'Independent second-tab edits');assert.equal(await p.evaluate(async id=>(await idbGet('proj_'+id)).pack.notes,id),'Latest saved in first tab');await second.close();
  });
  await check('Atomic version checks reject stale writes without BroadcastChannel',async(p,context)=>{
   const id=await p.evaluate(async()=>{await EVWorkspace.persist();return pack.projId;});const second=await context.newPage();
   await second.addInitScript(()=>{window.BroadcastChannel=undefined;});await second.goto(base+'/#project='+id,{waitUntil:'networkidle'});await second.waitForFunction(()=>window.EVWorkspace&&EVWorkspace.route()==='overview');
   assert.equal(await p.evaluate(async()=>{pack.notes='First writer';return EVWorkspace.persist();}),true);
   assert.equal(await second.evaluate(async()=>{pack.notes='Stale writer';return EVWorkspace.persist();}),false);
   assert.equal(await p.evaluate(async id=>(await idbGet('proj_'+id)).pack.notes,id),'First writer');await second.close();
  });
  await check('Recovery restores orphaned IndexedDB and localStorage projects without replacing current work',async p=>{
   const current=await p.evaluate(async()=>{await EVWorkspace.persist();const a=JSON.parse(JSON.stringify(serialisablePack()));a.projId='orphan-idb';a.name='Lost IDB project';await idbSet('proj_orphan-idb',{pack:a,ts:1});const b={...a,projId:'orphan-local',name:'Lost local project'};localStorage.setItem('evsp_proj_orphan-local',JSON.stringify({pack:b,ts:2}));return pack.projId;});
   await p.locator('[data-ev-route="projects"]').click();await p.locator('[data-ev-action="recover-projects"]').click();await p.waitForSelector('#evpRecovery');
   assert.match(await p.locator('#evpRecovery').innerText(),/2 saved projects/);await p.locator('[data-evp-action="repair-index"]').click();
   await p.waitForFunction(()=>projIndex().some(x=>x.id==='orphan-idb')&&projIndex().some(x=>x.id==='orphan-local'));assert.equal(await p.evaluate(()=>pack.projId),current);
   await p.locator('[data-ev-project="orphan-idb"]').click();await p.waitForFunction(()=>pack.name==='Lost IDB project');
  });
  await check('PDF.js renders through its new worker and records downloaded document revisions',async p=>{
   const result=await p.evaluate(async()=>{
    const lib=await ensurePdfJs(),doc=new jspdf.jsPDF();doc.text('PDF upgrade verification',20,20);
    const pdf=await openPdfDocument(lib,doc.output('arraybuffer')).promise,page=await pdf.getPage(1),text=(await page.getTextContent()).items.map(x=>x.str).join(' '),vp=page.getViewport({scale:1}),cn=document.createElement('canvas');cn.width=vp.width;cn.height=vp.height;await page.render({canvasContext:cn.getContext('2d'),viewport:vp}).promise;await pdf.destroy();return {version:lib.version,text,width:cn.width};
   });assert.equal(result.version,'6.3.289');assert.match(result.text,/PDF upgrade verification/);assert(result.width>500);
   const waiting=p.waitForEvent('download');await p.evaluate(()=>{const doc=new jspdf.jsPDF();doc.text('Recorded revision',20,20);doc.save('revision-check.pdf');});await(await waiting).saveAs(path.join(out,'revision-check.pdf'));
   await p.waitForFunction(()=>pack.workspace.planning?.revisions.some(r=>r.file==='revision-check.pdf'));assert.equal(await p.evaluate(()=>pack.workspace.planning.revisions.find(r=>r.file==='revision-check.pdf').kind),'document');
  });
  await check('A genuine HEIC file decodes into a usable survey photo',async p=>{
   const fixture=process.env.EVSP_HEIC_FIXTURE||path.join(out,'generated-survey.heic');assert(fs.existsSync(fixture),'Generate the real HEIC fixture before this suite');
   const before=await p.evaluate(()=>pack.photos.length);await p.locator('#filePhoto').setInputFiles(fixture);
   await p.waitForFunction(n=>pack.photos.length>n&&!pack.photos.at(-1)._pending,before,{timeout:45000});
   const photo=await p.evaluate(async()=>{const p=pack.photos.at(-1),im=new Image();await new Promise((resolve,reject)=>{im.onload=resolve;im.onerror=reject;im.src=p.src;});const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const cx=c.getContext('2d');cx.drawImage(im,0,0);return {width:p.imgW,height:p.imgH,pixel:[...cx.getImageData(64,48,1,1).data]};});
   assert.equal(photo.width,128);assert.equal(photo.height,96);assert(photo.pixel[0]>70&&photo.pixel[0]<190);assert(photo.pixel[1]>50&&photo.pixel[1]<160);assert.equal(photo.pixel[3],255);
  });
  await check('Reviewer handoff downloads and the tools fit narrow screens',async p=>{
   await openLab(p,'review');const waiting=p.waitForEvent('download');await p.locator('[data-evp-action="review-handoff"]').click();const file=path.join(out,'review-handoff.md');await(await waiting).saveAs(file);assert.match(fs.readFileSync(file,'utf8'),/independently worked examples/);
   await p.setViewportSize({width:390,height:844});
   for(const tab of ['evidence','compare','impact','charging','phases','revisions','review']){await p.locator('[data-evp-tab="'+tab+'"]').click();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),tab+' does not overflow the viewport');}
   await p.screenshot({path:path.join(out,'planning-mobile.png'),fullPage:true});
  });
 }finally{await browser.close();server.close();}
 console.log(results.filter(r=>r.pass).length+'/'+results.length+' planning scenarios passed in '+engineName);
 if(results.some(r=>!r.pass))process.exitCode=1;
})();
