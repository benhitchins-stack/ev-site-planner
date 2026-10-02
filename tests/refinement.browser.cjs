/* Interaction checks for the grouped inspector, equipment library and shared PDF reviews. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'../public'),output=process.env.EVSP_TEST_OUTPUT||'/tmp/evsp-refinement-checks';fs.mkdirSync(output,{recursive:true});
 const server=http.createServer((req,res)=>{try{let file=path.join(root,decodeURIComponent(new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep)&&file!==root)throw Error();if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);}catch(_){res.statusCode=404;res.end('Not found');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],failed=[],passed=[];let page;
 const pass=s=>{passed.push(s);console.log('PASS',s);};
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1040},locale:'en-GB',acceptDownloads:true});page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
  await page.goto(url+'/#example',{waitUntil:'networkidle'});await page.waitForFunction(()=>EVWorkspace.route()==='overview');
  await page.locator('[data-ev-route="markup"]').click();
  await page.locator('#catbar [data-cat="chargers"]').click();
  await page.locator('#wbEquipmentSearch').fill('Ohme');
  assert.equal(await page.locator('[data-wb-pick]').count(),2);
  await page.locator('[data-wb-favourite="model:ohme_pro"]').click();
  await page.locator('[data-wb-pick="model:ohme_pro"]').click();await page.getByRole('heading',{name:'Ohme Home Pro',exact:true}).waitFor();
  const count=await page.evaluate(()=>activePhoto().items.length);
  await page.locator('[data-wb-place-model="model:ohme_pro"]').click();
  const target=await page.evaluate(()=>{const p=activePhoto(),r=cv.getBoundingClientRect();return{x:r.x+p.imgW*.52*view.zoom+view.ox,y:r.y+p.imgH*.78*view.zoom+view.oy};});
  await page.mouse.click(target.x,target.y);
  assert.equal(await page.evaluate(()=>activePhoto().items.length),count+1);
  const modelId=await page.evaluate(()=>sel);
  assert.equal(await page.evaluate(()=>findItem(sel).model),'ohme_pro');
  assert.equal(await page.locator('#umodel').inputValue(),'ohme_pro');
  assert(await page.locator('#evInspectorTitle').textContent().then(s=>s.includes('CP-')));
  await page.locator('#ulabel').fill('East entrance charger');
  await page.locator('[data-kw="22"]').click();
  const electrical=page.locator('[data-wb-section="unit:electrical"]');await electrical.locator('summary').first().click();
  await page.locator('#umaxa').fill('20');await page.locator('#umaxa').dispatchEvent('change');
  assert.equal(await page.evaluate(()=>findItem(sel).maxA),20);
  assert(await electrical.evaluate(e=>e.open));
  await page.screenshot({path:path.join(output,'grouped-inspector.png'),animations:'disabled'});
  await page.locator('[data-wb-repeat]').click();
  const point=await page.evaluate(()=>{const p=activePhoto(),r=cv.getBoundingClientRect();return{x:r.x+p.imgW*.72*view.zoom+view.ox,y:r.y+p.imgH*.8*view.zoom+view.oy};});await page.mouse.click(point.x,point.y);
  const repeated=await page.evaluate(()=>{const u=findItem(sel);return{model:u.model,kw:u.kw,maxA:u.maxA,id:u.id,label:u.label,ref:u.planRef};});
  assert.equal(repeated.model,'ohme_pro');assert.equal(repeated.kw,'22');assert.equal(repeated.maxA,20);assert.notEqual(repeated.id,modelId);assert.equal(repeated.label,repeated.ref);
  const refs=await page.evaluate(()=>pack.photos.flatMap(p=>p.items).map(i=>i.planRef).filter(Boolean));assert.equal(new Set(refs).size,refs.length);
  pass('Model search, saved favourites, grouped electrical editing and repeat placement retain the selected specification and unique references');

  await page.locator('#evInspectorClose').click();await page.locator('#catbar [data-cat="chargers"]').click();await page.locator('#wbEquipmentSearch').fill('');await page.locator('[data-wb-library="recent"]').click();
  assert(await page.locator('[data-wb-pick="model:ohme_pro"]').count());
  await page.locator('[data-wb-library="favourites"]').click();assert.equal(await page.locator('[data-wb-pick="model:ohme_pro"]').count(),1);
  await page.screenshot({path:path.join(output,'equipment-favourites.png')});await page.locator('[data-wb-close-library]').click();
  await page.locator('#wbDrawingTools > summary').click();await page.locator('#wbKeyToggle').click();assert(await page.locator('#wbPlanKey').isVisible());
  const keyGeometry=await page.evaluate(()=>({key:document.getElementById('wbPlanKey').getBoundingClientRect().top,canvas:cvwrap.getBoundingClientRect().bottom}));assert(keyGeometry.key>=keyGeometry.canvas-1);
  const labelsBefore=await page.evaluate(()=>activePhoto().items.map(i=>i.label));await page.locator('#wbLabelMode').selectOption('full');await page.locator('#wbLabelMode').selectOption('compact');assert.deepEqual(await page.evaluate(()=>activePhoto().items.map(i=>i.label)),labelsBefore);
  await page.screenshot({path:path.join(output,'drawing-key.png')});await page.locator('[data-wb-close-key]').click();
  const exportSize=await page.evaluate(()=>{const p=activePhoto(),before={showLegend:pack.showLegend,showTitleBlock:pack.showTitleBlock,active:pack.active},cn=renderPhotoToCanvas(p,1200);return{height:cn.height,imageHeight:p.imgH*Math.min(1,1200/p.imgW),unchanged:JSON.stringify(before)===JSON.stringify({showLegend:pack.showLegend,showTitleBlock:pack.showTitleBlock,active:pack.active})};});assert(exportSize.height>exportSize.imageHeight);assert(exportSize.unchanged);
  await page.evaluate(()=>EVWorkspace.persist());await page.reload({waitUntil:'networkidle'});
  assert(await page.evaluate(()=>document.querySelector('#ehMain').firstElementChild.classList.contains('eh-recent')));
  assert(await page.evaluate(()=>JSON.parse(localStorage.getItem('evsp_equipment_v1')).favourites.includes('model:ohme_pro')));
  pass('Favourites survive reload, returning Home prioritises saved projects and display changes preserve labels and export state');

  await page.locator('.eh-nav [data-ev-action="workspace"]').click();await page.locator('[data-ev-route="markup"]').click();await page.locator('#evIssuePlans').click();await page.waitForSelector('#evPlanPreview canvas');
  await page.locator('#evSelectNone').click();assert(await page.locator('#evDownloadPlans').isDisabled());
  await page.locator('#evSelectAll').click();await page.waitForFunction(()=>!document.getElementById('evDownloadPlans').disabled);
  let download=page.waitForEvent('download');await page.locator('#evDownloadPlans').click();await(await download).saveAs(path.join(output,'marked-plans.pdf'));
  await page.screenshot({path:path.join(output,'plan-review.png')});await page.locator('[data-ev-close-review]').last().click();
  pass('Plan selection invalidates the preview and exports the regenerated PDF with the external legend');

  await page.locator('[data-ev-route="issue"]').click();
  for(const type of ['engineer','client']){
   await page.locator('[data-ev-action="'+type+'"]').click();await page.waitForFunction(()=>!document.getElementById('rxExport').disabled);await page.waitForSelector('#rxDocumentViewer .ev-document-canvas canvas');
   const total=await page.locator('#rxDocumentViewer [data-pdf-page]').count();assert(total>1);
   await page.locator('#rxDocumentViewer [data-pdf-page]').last().click();await page.waitForFunction(n=>document.querySelector('#rxDocumentViewer [data-pdf-counter]').textContent==='Page '+n+' of '+n,total);
   await page.locator('#rxDocumentViewer [data-pdf-zoom]').selectOption('150');
   await page.locator('#rxSummary').fill(type==='client'?'Dear client,\n\nPlease review the proposed layout for the east entrance.':'Review the east entrance route before installation.');
   assert(await page.locator('#rxExport').isDisabled());await page.waitForFunction(()=>!document.getElementById('rxExport').disabled);
   download=page.waitForEvent('download');await page.locator('#rxExport').click();await(await download).saveAs(path.join(output,type+'-pack.pdf'));
   await page.screenshot({path:path.join(output,type+'-review.png')});await page.locator('#rxClose').click();assert.equal(await page.evaluate(()=>document.getElementById('evApp').inert),false);
  }
  assert.equal(await page.evaluate(()=>pack.workspace.issues.filter(i=>/Client pack|Engineer pack/.test(i.label)).length),2);
  pass('Engineer and client packs share working thumbnails and zoom, rebuild after edits, download and release focus correctly');

  await page.locator('[data-ev-route="profile"]').click();await page.locator('[data-ep-field="name"]').fill('Alex Example');await page.locator('[data-ep-field="company"]').fill('Example Electrical');
  await page.locator('[data-ep-tab="details"]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[data-ep-tab="qualifications"]').getAttribute('aria-selected'),'true');
  await page.locator('[data-ep-action="add-qualification"]').first().click();await page.locator('[data-ep-q="name"]').fill('Example qualification');
  await page.locator('[data-ep-tab="branding"]').click();await page.waitForSelector('#epSampleImage canvas');
  download=page.waitForEvent('download');await page.locator('[data-ep-action="sample"]').click();await(await download).saveAs(path.join(output,'profile-sample.pdf'));
  await page.screenshot({path:path.join(output,'profile-branding.png')});
  pass('Profile tabs work with the keyboard and provide a real downloadable document sample');

  for(const width of [390,320]){
   await page.setViewportSize({width,height:844});await page.locator('#evMobileNav').click();await page.locator('[data-ev-route="markup"]').click();
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const position=await page.evaluate(id=>{const u=findItem(id);return{x:u.x*view.zoom+view.ox,y:u.y*view.zoom+view.oy};},modelId);await page.locator('#cv').click({position});
   await page.waitForFunction(()=>document.getElementById('evApp').classList.contains('ev-inspector-open'));
   const geometry=await page.evaluate(()=>{const side=document.getElementById('side').getBoundingClientRect(),canvas=cvwrap.getBoundingClientRect();return{width:side.width,left:side.left,top:side.top,bottom:side.bottom,canvasTop:canvas.top,scroll:document.documentElement.scrollWidth,viewport:innerWidth};});
   assert.equal(Math.round(geometry.width),width);assert(geometry.top>geometry.canvasTop+40);assert(geometry.scroll<=width);assert(geometry.bottom<=844);
   assert(await page.locator('#evInspectorTitle').textContent().then(s=>s.includes('CP-')));
   await page.screenshot({path:path.join(output,'phone-inspector-'+width+'.png')});
   assert(await page.locator('#evInspectorClose').evaluate(e=>e.getBoundingClientRect().height>=44));await page.locator('#evInspectorClose').click();
   await page.locator('#evIssuePlans').click();await page.waitForSelector('#evPlanPreview canvas');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(output,'phone-review-'+width+'.png')});
   await page.locator('[data-ev-close-review]').last().click();await page.screenshot({path:path.join(output,'phone-markup-'+width+'.png')});
  }
  pass('Phone inspectors leave part of the drawing visible and the shared PDF viewer fits 390px and 320px screens');
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 }catch(err){console.error(err);if(page)await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});process.exitCode=1;}
 finally{fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({passed,errors,failed},null,2));await browser.close();server.close();}
})();
