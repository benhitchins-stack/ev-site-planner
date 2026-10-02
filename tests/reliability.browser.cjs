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
 const server=http.createServer((req,res)=>{try{let f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://test').pathname));if(!f.startsWith(root+path.sep)&&f!==root)throw Error();if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);}catch(_){res.writeHead(404);res.end();}});
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
  await check('Backup finishes an in-progress route and exports its points',async p=>{
   await markup(p);
   const before=await p.evaluate(()=>{const count=activePhoto().items.length;setTool('route:swa');handleTap(...S(80,150));handleTap(...S(300,150));return count;});
   const waiting=p.waitForEvent('download');await p.locator('#evBackupTop').click();
   const download=await waiting,file=path.join(out,'route-backup.evplan.json');await download.saveAs(file);
   const exported=JSON.parse(fs.readFileSync(file,'utf8'));
   assert.equal(exported.photos[0].items.length,before+1);
   assert.equal(exported.photos[0].items.at(-1).pts.length,2);
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
 }finally{await browser.close();server.close();}
 console.log(results.filter(r=>r.pass).length+'/'+results.length+' reliability scenarios passed in '+engineName);
 if(results.some(r=>!r.pass))process.exitCode=1;
})();
