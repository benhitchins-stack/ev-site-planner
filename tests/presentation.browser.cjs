/* Interaction checks for the grouped inspector, equipment library and shared PDF reviews. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'../public'),output=process.env.EVSP_TEST_OUTPUT||'/tmp/evsp-presentation-checks';fs.mkdirSync(output,{recursive:true});
 const server=http.createServer((req,res)=>{try{let file=path.join(root,decodeURIComponent(new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep)&&file!==root)throw Error();if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.wasm':'application/wasm','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);}catch(_){res.statusCode=404;res.end('Not found');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],failed=[],passed=[];let page;
 const pass=s=>{passed.push(s);console.log('PASS',s);};
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1040},locale:'en-GB',acceptDownloads:true});page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});

  await page.goto(url+'/',{waitUntil:'networkidle'});
  assert(await page.locator('.eh-hero').isVisible());await page.screenshot({path:path.join(output,'home-first-visit.png')});
  await page.locator('[data-ev-action="example"]').first().click();await page.waitForFunction(()=>EVWorkspace.route()==='overview');
  await page.waitForFunction(()=>document.getElementById('evDashboardPlan')?.src.startsWith('data:image/png'));
  assert(await page.locator('#evEditTop').isHidden());assert.equal(await page.locator('.ev-build').count(),0);
  assert(await page.getByRole('button',{name:'Add project lead',exact:false}).count());
  const art=await page.evaluate(()=>{const p=activePhoto(),settings=JSON.stringify({legend:pack.showLegend,title:pack.showTitleBlock,active:pack.active}),cn=EVWorkbench.renderArtwork(p,1200),sheet=renderPhotoToCanvas(p,1200);return{height:cn.height,wanted:Math.round(p.imgH*Math.min(1,1200/p.imgW)),sheet:sheet.height,same:settings===JSON.stringify({legend:pack.showLegend,title:pack.showTitleBlock,active:pack.active})};});
  assert.equal(art.height,art.wanted);assert(art.sheet>art.height);assert(art.same);
  await page.screenshot({path:path.join(output,'overview-desktop.png')});
  await page.locator('.ev-live-plan').click();await page.waitForFunction(()=>EVWorkspace.route()==='markup');
  const items=await page.evaluate(()=>JSON.stringify(activePhoto().items));
  await page.locator('#wbDrawingTools > summary').click();await page.locator('#wbSymbolStyle').selectOption('illustrated');
  assert.equal(await page.evaluate(()=>JSON.stringify(activePhoto().items)),items);
  const illustrated=await page.locator('#cv').screenshot();await page.locator('#wbSymbolStyle').selectOption('technical');
  assert.equal(await page.evaluate(()=>JSON.stringify(activePhoto().items)),items);assert(!illustrated.equals(await page.locator('#cv').screenshot()));
  await page.keyboard.press('Escape');assert.equal(await page.locator('#wbDrawingTools').getAttribute('open'),null);
  await page.screenshot({path:path.join(output,'markup-desktop.png')});
  pass('Technical and illustrated drawing styles change rendering without changing equipment; artwork previews preserve export settings');
  await page.evaluate(()=>EVWorkspace.persist());await page.reload({waitUntil:'networkidle'});
  assert(await page.locator('.eh-returning').isVisible());assert.equal(await page.locator('.eh-hero').count(),0);
  assert.equal(await page.locator('.eh-project img').count(),1);assert(await page.locator('.eh-recent [data-ev-action="new"]').isVisible());
  await page.screenshot({path:path.join(output,'home-returning-desktop.png')});
  assert.equal(await page.evaluate(()=>pack.workspace.drawing.symbols),'technical');
  pass('Returning Home shows project thumbnails and start/open actions, and the selected drawing style survives reload');
  for(const width of [1024,390,320]){
   await page.setViewportSize({width,height:844});await page.evaluate(()=>EVWorkspace.go('home'));
   await page.screenshot({path:path.join(output,'home-'+width+'.png')});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.locator('.eh-project').first().click();await page.locator('.ev-live-plan').click();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   await page.locator('#wbDrawingTools > summary').click();
   const rect=await page.locator('.wb-display-options').boundingBox();assert(rect.x>=0&&rect.x+rect.width<=width,JSON.stringify(rect));
   await page.screenshot({path:path.join(output,'display-'+width+'.png')});await page.keyboard.press('Escape');
   const top=await page.locator('#cv').boundingBox();assert(top.y<(width>700?170:230),String(top.y));
   await page.locator('#evInspectorToggle').click();
   if(width<=700){const short=await page.locator('#side').boundingBox();await page.locator('#evInspectorExpand').click();const tall=await page.locator('#side').boundingBox();assert(tall.height>short.height+80,JSON.stringify({width,short,tall}));assert(tall.y>top.y+35,JSON.stringify({width,top,short,tall}));await page.locator('#evInspectorExpand').click();}
   await page.screenshot({path:path.join(output,'inspector-'+width+'.png')});await page.locator('#evInspectorClose').click();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  pass('Drawing controls, Display menu and adjustable inspector fit tablet, 390px and 320px viewports');
  await page.setViewportSize({width:1440,height:1040});await page.evaluate(()=>EVWorkspace.go('profile'));
  await page.locator('[data-ep-field="name"]').fill('Alex Example');await page.locator('[data-ep-field="company"]').fill('Example Electrical & Charging');
  await page.locator('[data-ep-tab="branding"]').click();await page.waitForSelector('#epHeaderImage canvas');await page.waitForSelector('#epSampleImage canvas');
  await page.screenshot({path:path.join(output,'profile-header.png')});
  const crop=await page.locator('#epHeaderImage canvas').evaluate(c=>({w:c.width,h:c.height}));assert(crop.w>crop.h*4);
  pass('Profile shows an enlarged crop of its real PDF header alongside the full document preview');

  const samples=await page.evaluate(async()=>{
   const saved={name:pack.name,address:pack.address,jobRef:pack.jobRef,brandName:pack.brandName,brandLogo:pack.brandLogo};
   const logo=document.createElement('canvas');logo.width=480;logo.height=120;const c=logo.getContext('2d');c.fillStyle='#173044';c.fillRect(0,0,480,120);c.fillStyle='white';c.font='bold 38px sans-serif';c.fillText('EXAMPLE ELECTRICAL',18,75);
   try{
    pack.name='North Riverside Business and Technology Park - East Entrance Charging Installation and Accessible Visitor Parking';
    pack.address='Building Forty Two, Research and Development Campus, North Riverside Business and Technology Park, Example Road, EX1 2AB';
    pack.jobRef='EXAMPLE-REFERENCE-FOR-LONG-NAME-LAYOUT-CHECK';pack.brandName='Example Electrical, Infrastructure and Charging Installation Services Limited';pack.brandLogo=logo.toDataURL('image/png');
    const client=await buildCustomerPdf({output:'doc'}),engineer=await buildPdf({output:'doc'});
    const profile=EVReportBranding.profileSample({...EVProfile.get(),company:pack.brandName,logo:pack.brandLogo});
    const probe=new window.jspdf.jsPDF({unit:'mm',format:'a4'});EVDelivery.installFonts(probe);const positions=[],original=probe.text;
    probe.text=function(value,x,y,...rest){positions.push({x,right:x+probe.getTextWidth(String(value)),y});return original.call(this,value,x,y,...rest);};
    EVReportBranding.header(probe,{title:'Programme and installation records for the east entrance',project:pack});
    return{client:client.output('datauristring').split(',')[1],engineer:engineer.output('datauristring').split(',')[1],profile:profile.output('datauristring').split(',')[1],positions};
   }finally{Object.assign(pack,saved);}
  });
  for(const [key,value] of Object.entries(samples)){if(key!=='positions')fs.writeFileSync(path.join(output,key+'-long.pdf'),Buffer.from(value,'base64'));}
  assert(samples.positions.every(p=>p.x>=14&&p.right<=196&&p.y>=5&&p.y<=36));
  pass('Long company and project names fit the shared report header alongside a logo; client and engineer packs export with embedded fonts');
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 }catch(err){console.error(err);if(page)await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});process.exitCode=1;}
 finally{fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({passed,errors,failed},null,2));await browser.close();server.close();}
})();
