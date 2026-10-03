/* Failure-path checks for the integrated planner. Run with the README Playwright setup. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const engines=require('playwright');
const engineName=process.env.EVSP_BROWSER||'chromium';
if(!['chromium','firefox','webkit'].includes(engineName))throw Error('Unsupported EVSP_BROWSER');
(async()=>{
 const root=path.resolve(__dirname,'../public'),out=process.env.EVSP_TEST_OUTPUT||'/tmp/evsp-reliability-'+engineName;fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{try{let f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://test').pathname));if(!f.startsWith(root+path.sep)&&f!==root)throw Error();if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.wasm':'application/wasm','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);}catch(_){res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await engines[engineName].launch({headless:true,...(engineName==='chromium'?{...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{})});
 const results=[];
 async function check(name,run,init,contextOptions={}){
  if(process.env.EVSP_CASE&&!name.toLowerCase().includes(process.env.EVSP_CASE.toLowerCase()))return;
  const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'en-GB',acceptDownloads:true,...contextOptions}),page=await context.newPage(),errors=[];page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
  try{if(init)await page.addInitScript(init);await page.goto(base+'/#example',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.EVWorkspace&&EVWorkspace.route()==='overview');await run(page,context);assert.deepEqual(errors,[],'No browser exceptions');results.push({name,pass:true});console.log('PASS',name);}
  catch(e){results.push({name,pass:false,error:e.message,errors});console.error('FAIL',name,':',e.message);if(errors.length)console.error('Browser errors:',JSON.stringify(errors));await page.screenshot({path:path.join(out,'failure-'+results.length+'.png')}).catch(()=>{});}
  finally{await context.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));}
 }
 const markup=p=>p.locator('[data-ev-route="markup"]').click();
 const pickUnits=p=>p.evaluate(()=>{const u=activePhoto().items.filter(i=>i.type==='unit');sel=u[0].id;selSet=new Set(u.map(i=>i.id));sideTab='props';setSideTab();return u.map(i=>i.id);});

 try{

  await check('Project details retains its position when a touch tablet moves between fields',async p=>{
   await p.getByRole('button',{name:'Edit project details',exact:true}).tap();
   await p.locator('[data-ev-field="name"]').tap();
   await p.waitForTimeout(150);
   // Mobile Safari can pan the document while its keyboard is open. Provide a
   // real scroll offset in desktop engines; do not replace the focus handlers.
   const before=await p.evaluate(()=>{
    document.documentElement.style.height='auto';document.documentElement.style.overflow='auto';
    document.body.style.height='calc(100vh + 300px)';
    window.scrollTo(0,160);
    window.detailsScrollCalls=[];const originalScroll=window.scrollTo.bind(window);
    window.scrollTo=(...args)=>{detailsScrollCalls.push(args);return originalScroll(...args);};
    return window.scrollY;
   });
   assert(before>100,'The keyboard-pan fixture starts away from the document top');
   for(const [key,value] of [['jobRef','IPAD-REF-001'],['postcode','SW1A 1AA'],['address','iPad survey address']]){
    const field=p.locator('[data-ev-field="'+key+'"]');await field.tap();await field.fill(value);
    await p.waitForTimeout(150);
    const state=await p.evaluate(()=>({y:scrollY,calls:detailsScrollCalls.length,field:document.activeElement.dataset.evField}));
    assert.equal(state.calls,0,'Changing fields must not force the document back to the top');
    assert.equal(state.y,before,'The document keeps its keyboard-pan position');
    assert.equal(state.field,key,'The selected field retains focus');
    assert.equal(await field.inputValue(),value);
   }
   // Retain the existing recovery when focus actually leaves the form.
   await p.evaluate(()=>document.activeElement.blur());await p.waitForTimeout(150);
   assert.equal(await p.evaluate(()=>scrollY),0);
   await p.locator('[data-ev-field="jobRef"]').tap();
   await p.evaluate(()=>window.scrollTo(0,160));
   await p.locator('[data-ev-close-details]').first().tap();await p.waitForTimeout(150);
   assert.equal(await p.locator('#evDetails').isVisible(),false);
   assert.equal(await p.evaluate(()=>scrollY),0,'Closing the wizard clears a leftover keyboard pan even when focus returns to the workspace');
   assert.equal(await p.evaluate(()=>pack.jobRef),'IPAD-REF-001');
  },null,{viewport:{width:820,height:1180},hasTouch:true});

  await check('Project details preserves typing through tablet viewport changes and wizard steps',async p=>{
   await p.getByRole('button',{name:'Edit project details',exact:true}).tap();
   const ref=p.locator('[data-ev-field="jobRef"]');
   await p.locator('[data-ev-field="name"]').fill('iPad survey');
   await ref.tap();await ref.fill('IPAD-002');
   assert(await ref.evaluate(el=>parseFloat(getComputedStyle(el).fontSize))>=16,'Wizard inputs avoid Safari small-text focus zoom');
   await ref.evaluate(el=>{window.detailsReference=el;el.setSelectionRange(4,4);});
   for(const size of [{width:820,height:420},{width:1180,height:440},{width:1180,height:820}]){
    await p.setViewportSize(size);
    await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    assert.deepEqual(await ref.evaluate(el=>({same:el===window.detailsReference,focused:el===document.activeElement,value:el.value,caret:el.selectionStart})),{same:true,focused:true,value:'IPAD-002',caret:4});
   }
   await p.keyboard.insertText('X');assert.equal(await ref.inputValue(),'IPADX-002');
   await p.locator('[data-ev-step="1"]').first().tap();
   const notes=p.locator('[data-ev-field="notes"]');await notes.fill('Typed scope on an iPad');
   assert(await notes.evaluate(el=>parseFloat(getComputedStyle(el).fontSize))>=16);
   await p.locator('[data-ev-step="2"]').first().tap();
   await p.locator('[data-ev-field="custName"]').fill('Tablet client');
   await p.locator('[data-ev-field="workspace.contactEmail"]').fill('site@example.com');
   await p.locator('[data-ev-close-details]').last().tap();
   await p.evaluate(()=>EVWorkspace.persist());await p.reload({waitUntil:'networkidle'});
   await p.waitForFunction(()=>window.EVWorkspace);await p.evaluate(async()=>{await window.__evRestorePromise;await window.__evProjectIndexReady;EVWorkspace.go('overview');});await p.getByRole('button',{name:'Edit project details',exact:true}).click();
   assert.equal(await ref.inputValue(),'IPADX-002');
   assert.equal(await p.locator('[data-ev-field="name"]').inputValue(),'iPad survey');
   assert.deepEqual(await p.evaluate(()=>({notes:pack.notes,client:pack.custName,email:pack.workspace.contactEmail})),{notes:'Typed scope on an iPad',client:'Tablet client',email:'site@example.com'});
  },null,{viewport:{width:820,height:1180},hasTouch:true});

  await check('Backup finishes an in-progress route and exports its points',async p=>{
   await markup(p);
   await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const before=await p.evaluate(()=>{const count=activePhoto().items.length;setTool('route:swa');handleTap(...S(80,150));handleTap(...S(300,150));return {count,points:JSON.parse(JSON.stringify(draftRoute.pts))};});
   assert(before.points.length>=2,'The fixture has an unfinished route');
   const waiting=p.waitForEvent('download');await p.locator('#evBackupTop').click();
   const download=await waiting,file=path.join(out,'route-backup.evplan.json');await download.saveAs(file);
   const exported=JSON.parse(fs.readFileSync(file,'utf8'));
   assert.equal(exported.photos[0].items.length,before.count+1);
   // Smart routing may add bends when threading through an existing trench.
   assert.deepEqual(exported.photos[0].items.at(-1).pts,before.points,'Every draft point is preserved exactly');
   assert.equal(await p.evaluate(()=>!!draftRoute),false);
  });
  await check('Backup waits for photo decoding and blocks duplicate exports or project switches',async p=>{
   await p.evaluate(async()=>{const blob=await(await fetch(activePhoto().src)).blob();window.originalDownscale=downscale;downscale=(data,callback)=>{window.releaseDecode=()=>originalDownscale(data,callback);};void addImageSources([{name:'Pending survey.jpg',blob}]);});
   await p.waitForFunction(()=>!!window.releaseDecode);
   const before=await p.evaluate(()=>pack.projId),waiting=p.waitForEvent('download');
   await p.locator('#evBackupTop').click();
   await p.waitForFunction(()=>document.getElementById('evApp').getAttribute('aria-busy')==='true');
   assert.equal(await p.evaluate(()=>EVWorkspace.backup()),false);
   assert.equal(await p.evaluate(()=>loadProject('another-project')),false);
   assert.equal(await p.evaluate(()=>pack.projId),before);
   await p.evaluate(()=>{releaseDecode();downscale=originalDownscale;});
   const file=path.join(out,'complete-photo-backup.evplan.json');await (await waiting).saveAs(file);
   const exported=JSON.parse(fs.readFileSync(file,'utf8')),photo=exported.photos.find(x=>x.name==='Pending survey');
   assert(photo);assert(photo.src.startsWith('data:image/'));assert(photo.imgW>0);assert(!photo._pending);
   await p.waitForFunction(()=>!document.getElementById('evApp').hasAttribute('aria-busy'));
  });
  await check('Saving a project retains every older project beyond the previous 100-project cap',async p=>{
   const ids=await p.evaluate(async()=>{const older=Array.from({length:105},(_,i)=>({id:'older-'+i,name:'Older '+i,mode:'commercial',date:'2026-10-01',n:0}));await saveProjIndex(older);await EVWorkspace.persist();return projIndex().map(x=>x.id);});
   assert.equal(ids.length,106);assert(ids.includes('older-104'));assert(ids.includes('older-0'));
   await p.reload({waitUntil:'networkidle'});await p.waitForFunction(()=>projIndex().length===106);
   assert(await p.evaluate(()=>projIndex().some(x=>x.id==='older-104')));
  });
  await check('Invalid cable length text is explained and preserves the last valid measurement',async p=>{
   await markup(p);await p.evaluate(()=>{const r=activePhoto().items.find(i=>i.type==='route'&&i.kind!=='__area');r.manualLen=12.5;sel=r.id;sideTab='props';setSideTab();});
   const input=p.locator('#mlen');
   for(const bad of ['-5','0','12m','Infinity']){
    await input.fill(bad);assert.equal(await input.getAttribute('aria-invalid'),'true');
    assert.equal(await p.evaluate(()=>{const input=document.getElementById('mlen');resize();return input===document.getElementById('mlen');}),true);
    assert.equal(await input.inputValue(),bad);
    assert.equal(await p.evaluate(()=>findItem(sel).manualLen),12.5);
    assert((await p.locator('#mlenError').textContent()).includes('greater than zero'));
   }
   await input.fill('24.5');assert.equal(await p.evaluate(()=>findItem(sel).manualLen),24.5);
   assert.equal(await input.getAttribute('aria-invalid'),'false');
   await input.fill('');assert.equal(await p.evaluate(()=>findItem(sel).manualLen),null);
  });
  await check('Unsafe backup fields and duplicate activity IDs leave the current project intact',async p=>{
   const result=await p.evaluate(async()=>{
    const original=JSON.stringify(serialisablePack()),out=[];
    const cases=[
     b=>b.photos[0].id='x"><img src=x onerror="window.backupInjected=1">',
     b=>b.photos[0].thumb='x" onerror="window.backupInjected=1',
     b=>b.photos[0].src='https://example.com/unexpected-image.png',
     b=>b.programme={activities:[{id:'same',name:'One'},{id:'same',name:'Two'}]},
     b=>b.workspace=JSON.parse('{"__proto__":{"polluted":true}}')
    ];
    for(const mutate of cases){const b=JSON.parse(original);mutate(b);out.push(await EVWorkspace.importBackup(new File([JSON.stringify(b)],'invalid.json')));}
    return{out,unchanged:original===JSON.stringify(serialisablePack()),injected:!!window.backupInjected,polluted:!!({}).polluted};
   });
   assert.deepEqual(result,{out:[false,false,false,false,false],unchanged:true,injected:false,polluted:false});
  });
  await check('Ordinary quoted project text remains literal after a portable backup round trip',async p=>{
   const result=await p.evaluate(async()=>{const b=JSON.parse(JSON.stringify(serialisablePack()));b.name='Depot <north> & "south"';b.photos[0].name='Plan "A" <survey>';return EVWorkspace.importBackup(new File([JSON.stringify(b)],'quoted.json'));});
   assert.equal(result,true);assert.equal(await p.locator('.ev-overview-heading h1').textContent(),'Depot <north> & "south"');
   const waiting=p.waitForEvent('download');await p.locator('#evBackupTop').click();
   const file=path.join(out,'quoted-backup.evplan.json');await (await waiting).saveAs(file);
   assert.equal(JSON.parse(fs.readFileSync(file)).photos[0].name,'Plan "A" <survey>');
  });
  await check('Legacy activities without IDs remain independently editable',async p=>{
   await p.evaluate(()=>{pack.programme={activities:[{name:'One',days:1},{name:'Two',days:2}],start:'2026-10-05'};});
   await p.locator('[data-ev-route="programme"]').click();
   const ids=await p.evaluate(()=>pack.programme.activities.map(a=>a.id));assert.equal(new Set(ids).size,2);assert(ids.every(Boolean));
   await p.locator('[data-ed-activity]').nth(1).click();await p.locator('[data-ed-field="name"]').fill('Second changed');
   await p.keyboard.press('Escape');
   assert.deepEqual(await p.evaluate(()=>pack.programme.activities.map(a=>a.name)),['One','Second changed']);
  });
  await check('Engineer and client PDF reviews close with Escape and release the workspace',async p=>{
   await p.locator('[data-ev-route="issue"]').click();
   for(const action of ['engineer','client']){
    await p.locator('[data-ev-action="'+action+'"]').click();await p.waitForSelector('#rxDocumentViewer canvas');
    await p.locator('#rxClose').focus();await p.keyboard.press('Escape');
    assert.equal(await p.locator('#rxBackdrop').evaluate(el=>el.classList.contains('show')),false);
    assert.equal(await p.locator('#evApp').evaluate(el=>el.inert),false);
   }
  });

  await check('HEIC conversion loads only on demand and shares one decoder across files',async p=>{
   assert.equal(await p.evaluate(()=>performance.getEntriesByType('resource').some(x=>x.name.includes('heic2any'))),false);
   let requests=0;await p.route('**/vendor/heic2any.min.js',route=>{requests++;return route.fulfill({contentType:'application/javascript',body:'window.heic2any=async()=>new Blob(["converted"],{type:"image/jpeg"});'});});
   const result=await p.evaluate(async()=>{const original=canDecodeNatively;canDecodeNatively=async()=>false;try{return(await normaliseSources([{name:'First.heic',blob:new Blob(['one'])},{name:'Second.heic',blob:new Blob(['two'])}])).map(x=>({name:x.name,type:x.blob.type}));}finally{canDecodeNatively=original;}});
   assert.deepEqual(result,[{name:'First.jpg',type:'image/jpeg'},{name:'Second.jpg',type:'image/jpeg'}]);assert.equal(requests,1);
  });
  await check('A failed HEIC decoder download can be retried',async p=>{
   let requests=0;await p.route('**/vendor/heic2any.min.js',route=>{requests++;return requests===1?route.fulfill({status:503,body:'Unavailable'}):route.fulfill({contentType:'application/javascript',body:'window.heic2any=async()=>new Blob(["converted"],{type:"image/jpeg"});'});});
   assert.equal(await p.evaluate(async()=>{try{await ensureHeicDecoder();return false;}catch{return true;}}),true);
   assert.equal(await p.evaluate(async()=>typeof await ensureHeicDecoder()),'function');
   assert.equal(requests,2);
  });
  await check('Report fonts download only when a document is prepared and a failed download can be retried',async p=>{
   assert.equal(await p.evaluate(()=>!!window.EVReportFonts||performance.getEntriesByType('resource').some(x=>x.name.includes('report-fonts'))),false);
   let requests=0;await p.route(/report-fonts\.js/,route=>{requests++;return requests===1?route.fulfill({status:503,body:'Unavailable'}):route.continue();});
   assert.match(await p.evaluate(()=>EVDelivery.reportFonts().then(()=>'',e=>e.message)),/could not download/);
   await p.locator('[data-ev-route="issue"]').click();
   await p.locator('[data-ev-action="engineer"]').click();await p.waitForSelector('#rxDocumentViewer canvas');
   assert.equal(await p.evaluate(()=>typeof EVReportFonts.regular),'string');
   assert.equal(requests,2,'The issue page download is shared with the document that needs it');
  });
  await check('The backup button and overview show changes made since the last backup',async p=>{
   const top=p.locator('#evBackupTop'),due=()=>top.evaluate(el=>el.classList.contains('ev-backup-due'));
   await p.waitForFunction(()=>document.getElementById('evBackupTop').classList.contains('ev-backup-due'));
   assert.match(await top.getAttribute('aria-label'),/not been backed up yet/);
   assert.equal(await p.locator('.ev-backup-nudge').count(),0,'A project started in this visit has no reminder');
   let waiting=p.waitForEvent('download');await top.click();await waiting;
   await p.waitForFunction(()=>!document.getElementById('evBackupTop').classList.contains('ev-backup-due'));
   assert.match(await p.locator('.ev-backup-card').textContent(),/Backed up/);
   // A later visit to a project changed since a backup more than a week old.
   const id=await p.evaluate(async()=>{await EVWorkspace.persist();pack.workspace.backupAt=new Date(Date.now()-8*864e5).toISOString();await EVWorkspace.persist();return pack.projId;});
   await p.goto('about:blank');await p.goto(base+'/#project='+encodeURIComponent(id),{waitUntil:'networkidle'});
   await p.waitForFunction(id=>window.EVWorkspace&&EVWorkspace.route()==='overview'&&pack.projId===id,id);
   const nudge=p.locator('.ev-backup-nudge');await nudge.waitFor();
   assert.match(await nudge.textContent(),/Your last backup was on/);
   assert.equal(await due(),true);assert.match(await top.getAttribute('aria-label'),/Changes since your backup on/);
   const record=await p.evaluate(async id=>Object.keys((await idbGet('proj_'+id)).pack.workspace).sort(),id);
   assert.equal(record.filter(k=>/backup/i.test(k)).join(),'backupAt','Saved projects keep their existing backup field only');
   await nudge.getByRole('button',{name:'Not now'}).click();
   await p.waitForFunction(()=>!document.querySelector('.ev-backup-nudge'));
   await p.locator('[data-ev-route="markup"]').click();await p.locator('[data-ev-route="overview"]').click();
   assert.equal(await p.locator('.ev-backup-nudge').count(),0,'Not now holds for the rest of the visit');
   assert.equal(await due(),true,'The button still shows the changes');
   waiting=p.waitForEvent('download');await p.locator('.ev-backup-card [data-ev-action="backup"]').click();await waiting;
   await p.waitForFunction(()=>!document.getElementById('evBackupTop').classList.contains('ev-backup-due'));
  });
  await check('Saved projects ask the browser once to keep them and say when it agrees',async p=>{
   await p.evaluate(async()=>{await EVWorkspace.persist();await EVWorkspace.persist();});
   assert.equal(await p.evaluate(()=>window.persistRequests),1);
   await p.evaluate(()=>EVWorkspace.go('overview'));
   assert.match(await p.locator('#evStorageNote').textContent(),/agreed to keep/);
  },()=>{
   // Stand in for the browser's answer so every engine takes the same path.
   window.persistRequests=0;const answers={persisted:async()=>false,persist:async()=>{window.persistRequests++;return true;}};
   if(navigator.storage)for(const [name,value] of Object.entries(answers))Object.defineProperty(navigator.storage,name,{configurable:true,value});
   else Object.defineProperty(navigator,'storage',{configurable:true,value:answers});
  });

  // Site audits of existing installations live inside the project record as pack.audit.
  const samplePng=async p=>Buffer.from(await p.evaluate(()=>{const c=document.createElement('canvas');c.width=48;c.height=36;const g=c.getContext('2d');g.fillStyle='#b4432c';g.fillRect(0,0,48,36);g.fillStyle='#fff';g.fillRect(10,8,28,20);return c.toDataURL('image/png').split(',')[1];}),'base64');
  await check('A site audit records answers, measurements and photos, then survives reload and a backup round trip',async p=>{
   await p.locator('[data-ev-route="audit"]').click();await p.waitForFunction(()=>EVWorkspace.route()==='audit');
   assert.equal(await p.locator('.eva-intro').count(),1,'A project without an audit explains the three steps first');
   await p.getByRole('button',{name:'Audit this site',exact:true}).click();await p.locator('#evaSetup').waitFor();
   await p.locator('[data-eva-site-type="carpark"]').click();await p.locator('[data-eva-site-type="carpark"].on').waitFor();
   await p.locator('[data-eva-public="true"]').click();await p.locator('[data-eva-public="true"].on').waitFor();
   assert.deepEqual(await p.evaluate(()=>[pack.audit.kind,pack.audit.siteType,pack.audit.isPublic,pack.audit.units.length]),['project','carpark',true,1]);
   const total=await p.evaluate(()=>EVAuditCore.summary(pack.audit).total);
   assert.equal(await p.locator('.eva-check').count(),total,'Every applicable check has a row');
   assert.equal(await p.locator('.eva-excluded-list li').count(),await p.evaluate(()=>EVAuditCore.excluded(pack.audit).length));
   await p.locator('[data-eva-afield="operator"]').fill('Example Charging Ltd');
   await p.locator('[data-eva-field="name"]').fill('Riverside car park audit');
   assert.deepEqual(await p.evaluate(()=>[pack.audit.operator,pack.name]),['Example Charging Ltd','Riverside car park audit']);
   // A fail opens its details and asks for a note, a measurement and a photo.
   await p.locator('[data-eva-outcome="fail"][data-eva-key="ACC-02:cp1"]').click();
   const row=p.locator('#eva-ACC-02-cp1');await row.locator('.eva-body:not([hidden])').waitFor();
   await row.locator('[data-eva-measure]').fill('1350');
   await row.locator('[data-eva-note]').fill('Card reader centred at 1,350 mm');
   await row.locator('[data-eva-upload]').setInputFiles({name:'reader.png',mimeType:'image/png',buffer:await samplePng(p)});
   await p.locator('#eva-ACC-02-cp1 .eva-thumb').waitFor();
   assert.match(await p.evaluate(()=>pack.audit.answers['ACC-02:cp1'].photos[0].src),/^data:image\/jpeg/);
   assert.match(await p.locator('#eva-ACC-02-cp1 .eva-check-title small').textContent(),/1350 mm · Card reader/);
   await p.locator('[data-eva-outcome="na"][data-eva-key="ACC-06"]').click();
   await p.locator('#eva-ACC-06 [data-eva-note]').fill('Four bays only');
   assert.equal(await p.evaluate(()=>pack.audit.answers['ACC-06'].reason),'Four bays only');
   await p.locator('[data-eva-outcome="pass"][data-eva-key="PAY-01"]').click();
   await p.waitForFunction(()=>EVAuditCore.summary(pack.audit).done===3);
   // Undo steps back one answer and redraws the page.
   await p.evaluate(()=>undo());
   await p.waitForFunction(()=>EVAuditCore.state(EVAuditCore.answer(pack.audit,'PAY-01'))==='todo');
   assert.equal(await p.evaluate(()=>pack.audit.answers['ACC-06'].outcome),'na');
   assert.equal(await p.locator('[data-eva-outcome="pass"][data-eva-key="PAY-01"]').getAttribute('aria-pressed'),'false');
   // The saved project list row carries the progress; the record reloads by id.
   const id=await p.evaluate(async()=>{await EVWorkspace.persist();return pack.projId;});
   assert.deepEqual(await p.evaluate(id=>projIndex().find(r=>r.id===id).audit,id),{kind:'project',siteType:'carpark',done:2,total,fail:1,action:0});
   await p.goto('about:blank');await p.goto(base+'/#project='+encodeURIComponent(id),{waitUntil:'networkidle'});
   await p.waitForFunction(id=>window.EVWorkspace&&EVWorkspace.route()==='overview'&&pack.projId===id,id);
   assert.equal(await p.evaluate(()=>pack.audit.answers['ACC-02:cp1'].photos.length),1);
   assert.match(await p.locator('.eva-overview-card').textContent(),/Continue audit/);
   assert.match(await p.locator('.ev-next-list').textContent(),/Continue the site audit/);
   // A backup carries the audit and imports as a separate copy.
   const waiting=p.waitForEvent('download');await p.locator('#evBackupTop').click();
   const download=await waiting,file=path.join(out,'audit-backup.evplan.json');await download.saveAs(file);
   const exported=JSON.parse(fs.readFileSync(file,'utf8'));
   assert.equal(exported.audit.answers['ACC-02:cp1'].measure,'1350');
   await p.locator('#fileOpen').setInputFiles(file);
   await p.waitForFunction(id=>pack.projId!==id&&pack.audit?.answers?.['ACC-02:cp1']?.photos.length===1,id);
   // A damaged audit inside a backup is refused and the open project kept.
   exported.audit.answers['ACC-02:cp1'].outcome='maybe';const broken=path.join(out,'audit-broken.evplan.json');fs.writeFileSync(broken,JSON.stringify(exported));
   const kept=await p.evaluate(()=>pack.projId);await p.locator('#fileOpen').setInputFiles(broken);
   await p.waitForFunction(()=>document.getElementById('toast').classList.contains('show'));
   assert.match(await p.locator('#toast').textContent(),/doesn't look like an EV Site Planner backup/);
   assert.equal(await p.evaluate(()=>pack.projId),kept);
  });
  await check('A site audit started from Home saves as an audit project, lists under Site audits and makes an evidence pack',async p=>{
   await p.evaluate(()=>EVWorkspace.persist());
   await p.locator('[data-ev-route="home"]').first().click();await p.waitForFunction(()=>EVWorkspace.route()==='home');
   const section=p.locator('#ehAudits');await section.waitFor();
   assert.match(await section.textContent(),/No site audits yet/);
   await section.getByRole('button',{name:'New audit'}).click();
   await p.waitForFunction(()=>EVWorkspace.route()==='audit'&&pack.audit?.kind==='audit');
   assert.equal(await p.locator('#evModePill').textContent(),'Site audit');
   assert.equal(await p.locator('.eva-stages .ev-stage').count(),4,'Audit projects have a four-step strip');
   await p.locator('[data-eva-field="name"]').fill('High Street lamppost chargers');
   await p.locator('[data-eva-site-type="lamppost"]').click();await p.locator('[data-eva-site-type="lamppost"].on').waitFor();
   await p.locator('[data-eva-public="true"]').click();await p.locator('[data-eva-public="true"].on').waitFor();
   await p.locator('[data-eva-add-unit]').click();await p.locator('#evaUnit-cp2').waitFor();
   await p.locator('[data-eva-unit-field="label:cp2"]').fill('Lamppost 7');
   assert.equal(await p.locator('#evaGroupTitle-cp2').textContent(),'Lamppost 7');
   for(const key of await p.evaluate(()=>EVAuditCore.slots(pack.audit).filter(r=>r.unit?.id==='cp1').map(r=>r.key)))await p.locator('[data-eva-outcome="pass"][data-eva-key="'+key+'"]').click();
   await p.locator('[data-eva-copy="cp2"]').click();
   const unitChecks=await p.evaluate(()=>EVAuditCore.CHECKS.filter(c=>c.scope==='unit'&&c.applies.includes('lamppost')).length);
   await p.waitForFunction(n=>EVAuditCore.summary(pack.audit).pass===n,unitChecks*2);
   await p.locator('[data-eva-outcome="fail"][data-eva-key="PAY-01"]').click();
   await p.locator('#eva-PAY-01 [data-eva-note]').fill('No tariff on the unit or in the app');
   await p.locator('#eva-PAY-01 [data-eva-upload]').setInputFiles({name:'unit.png',mimeType:'image/png',buffer:await samplePng(p)});
   await p.locator('#eva-PAY-01 .eva-thumb').waitFor();
   // The evidence pack previews, lists what is still missing and logs its download.
   await p.locator('.ev-page-head .ev-btn.primary[data-ev-action="audit-pack"]').click();
   await p.locator('#edReportViewer').waitFor();
   await p.waitForFunction(()=>{const b=document.querySelector('[data-ed-action="download-report"]');return b&&!b.disabled;},null,{timeout:120000});
   assert.match(await p.locator('#edReportChecks').textContent(),/not answered/);
   assert.match(await p.locator('#edTitle').textContent(),/Review evidence pack/);
   const waiting=p.waitForEvent('download');await p.locator('[data-ed-action="download-report"]').click();
   // Unanswered checks are a warning: the confirm lists them and Download anyway continues.
   await p.waitForSelector('#sheetBackdrop.show');assert.equal(await p.locator('#sheetTitle').textContent(),'Download with gaps?');assert.match(await p.locator('#sheetLabel').textContent(),/not answered/);await p.locator('#sheetOk').click();
   const download=await waiting;assert.match(download.suggestedFilename(),/High_Street_lamppost_chargers_evidence-pack_rev-A\.pdf/);
   await p.waitForFunction(()=>pack.workspace.issues.some(i=>i.label==='Evidence pack'));
   await p.locator('.ev-dialog-foot [data-ed-action="close"]').click();
   await p.waitForFunction(()=>document.getElementById('edModal').hidden);
   // The overview, Home and the project list show the audit and its progress.
   await p.locator('[data-ev-route="overview"]').click();await p.waitForFunction(()=>EVWorkspace.route()==='overview');
   assert.match(await p.locator('.ev-overview-heading .ev-eyebrow').textContent(),/Site audit/);
   assert.match(await p.locator('.eva-flow').textContent(),/1 download/);
   await p.evaluate(()=>EVWorkspace.persist());
   await p.locator('[data-ev-route="home"]').first().click();await p.waitForFunction(()=>EVWorkspace.route()==='home');
   assert.match(await p.locator('#ehAudits .eh-audit').first().textContent(),/High Street lamppost chargers[\s\S]*1 fail/);
   await p.locator('.eh-footer [data-ev-route="projects"]').click();await p.waitForFunction(()=>EVWorkspace.route()==='projects');
   await p.selectOption('#evFilter','audit');
   assert.equal(await p.locator('.ev-project-row').count(),1);
   assert.match(await p.locator('.ev-project-row').textContent(),/Site audit[\s\S]*Audit \d+%/);
  });
  await check('The audit page fits a phone screen and keeps touch-sized outcome buttons',async p=>{
   await p.evaluate(()=>{EVAudit.start();EVWorkspace.go('audit');});await p.locator('#evaSetup').waitFor();
   await p.locator('[data-eva-site-type="pillar"]').tap();await p.locator('[data-eva-site-type="pillar"].on').waitFor();
   await p.locator('[data-eva-outcome="action"][data-eva-key="ACC-03:cp1"]').tap();
   await p.locator('#eva-ACC-03-cp1 .eva-body:not([hidden])').waitFor();
   const widths=await p.evaluate(()=>({doc:document.documentElement.scrollWidth,screen:document.getElementById('evScreen').scrollWidth,inner:innerWidth}));
   assert.ok(widths.doc<=widths.inner&&widths.screen<=widths.inner,'No sideways scroll: '+JSON.stringify(widths));
   const box=await p.locator('[data-eva-outcome="pass"]').first().boundingBox();
   assert.ok(box&&box.height>=40,'Outcome buttons are at least 40 px tall for touch');
   assert.ok((await p.locator('#eva-ACC-03-cp1 [data-eva-note]').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)))>=13);
  },null,{viewport:{width:390,height:844},hasTouch:true});
 }finally{await browser.close();server.close();}
 console.log(results.filter(r=>r.pass).length+'/'+results.length+' reliability scenarios passed in '+engineName);
 if(results.some(r=>!r.pass))process.exitCode=1;
})();
