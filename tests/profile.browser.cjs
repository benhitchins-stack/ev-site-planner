/* Optional end-to-end profile checks; uses the same Playwright setup as test:browser. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '../public');
  const artifacts = process.env.EVSP_TEST_OUTPUT || '/tmp/evsp-profile-checks';
  fs.mkdirSync(artifacts, {recursive:true});
  const server = http.createServer((req,res) => {
    try {
      let file = path.join(root, decodeURIComponent(new URL(req.url,'http://local').pathname));
      if (!file.startsWith(root + path.sep) && file !== root) throw Error('Invalid path');
      if (fs.statSync(file).isDirectory()) file = path.join(file,'index.html');
      const mime = {'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.wasm':'application/wasm','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
      res.setHeader('Content-Type',mime[path.extname(file)] || 'application/octet-stream');
      fs.createReadStream(file).pipe(res);
    } catch {res.statusCode=404;res.end('Not found');}
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({headless:true,
    ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {}),
    args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const results = [], errors = [], failedRequests = [];
  let page;
  const pass = name => {results.push(name);console.log('PASS',name);};
  try {
    const context = await browser.newContext({locale:'en-GB',viewport:{width:1440,height:1040},acceptDownloads:true});
    page = await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)failedRequests.push(r.url()+': '+r.status());});
    await page.goto(url, {waitUntil:'networkidle'});
    await page.getByRole('button',{name:'My profile',exact:true}).click();
    await page.locator('[data-ep-field="name"]').fill('Alex Example');
    for(const [key,value] of Object.entries({role:'Project engineer',company:'Example Electrical Ltd',email:'alex@example.test',phone:'01234 000000',website:'example.test',registration:'EXAMPLE-001',address:'Fictional business address\nExample town'})) {
      await page.locator(`[data-ep-field="${key}"]`).fill(value);
    }
    await page.locator('[data-ep-tab="qualifications"]').click();
    await page.locator('[data-ep-action="add-qualification"]').first().click();
    for(const [key,value] of Object.entries({name:'Example installation qualification',issuer:'Example awarding body',reference:'TEST-123',expiry:'2028-10-01'})) {
      await page.locator(`[data-ep-q="${key}"]`).fill(value);
    }
    await page.locator('[data-ep-tab="qualifications"]').click();
    await page.locator('[data-ep-action="add-qualification"]').first().click();
    await page.locator('[data-ep-qualification]').last().locator('[data-ep-q="name"]').fill('Temporary test qualification');
    await page.locator('[data-ep-remove]').last().click();
    await page.evaluate(()=>EVProfile.flush());
    assert.equal(await page.evaluate(()=>EVProfile.get().qualifications.length),1);
    await page.goto(url+'/#profile',{waitUntil:'networkidle'});
    assert.equal(await page.locator('[data-ep-field="name"]').inputValue(),'Alex Example');
    assert.equal(await page.locator('[data-ep-q="reference"]').inputValue(),'TEST-123');
    pass('Profile fields and qualification add/remove survive reload and direct profile links');

    const svg='<svg xmlns="http://www.w3.org/2000/svg" width="360" height="140" viewBox="0 0 360 140"><rect width="360" height="140" rx="12" fill="#173047"/><path d="M52 23 24 78h29l-8 40 44-61H61l12-34Z" fill="#d0e694"/><text x="109" y="72" font-family="sans-serif" font-size="29" fill="white">EXAMPLE</text><text x="110" y="99" font-family="sans-serif" font-size="17" fill="#d0e694">ELECTRICAL</text></svg>';
    await page.locator('[data-ep-tab="branding"]').click();
    let chooser=page.waitForEvent('filechooser');await page.locator('[data-ep-action="logo"]').click();
    await (await chooser).setFiles({name:'example-logo.svg',mimeType:'image/svg+xml',buffer:Buffer.from(svg)});
    await page.waitForFunction(()=>EVProfile.get().logo.startsWith('data:image/png'));
    const logo=await page.evaluate(()=>EVProfile.get().logo);
    await page.locator('#epLogoInput').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('not an image')});
    await page.waitForFunction(()=>document.querySelector('#epLogoStatus').textContent.includes('could not be read'));
    assert.equal(await page.evaluate(()=>EVProfile.get().logo),logo);
    await page.evaluate(()=>{document.getElementById('evScreen').scrollTop=0;});
    await page.screenshot({path:path.join(artifacts,'profile-desktop.png'),animations:'disabled'});
    pass('Logo upload converts SVG to a portable image and a broken upload preserves the current logo');

    let download=page.waitForEvent('download');await page.locator('[data-ep-action="export"]').click();
    const profileFile=path.join(artifacts,'example.evprofile.json');await (await download).saveAs(profileFile);
    const backup=JSON.parse(fs.readFileSync(profileFile));assert.equal(backup.profile.logo,logo);
    await page.locator('#epImportInput').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{broken')});
    await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('not a valid profile'));
    assert.equal(await page.evaluate(()=>EVProfile.get().name),'Alex Example');
    await page.locator('[data-ep-tab="details"]').click();
    await page.locator('[data-ep-field="name"]').fill('Temporary name');
    await page.locator('#epImportInput').setInputFiles(profileFile);await page.locator('#sheetCancel').click();
    assert.equal(await page.evaluate(()=>EVProfile.get().name),'Temporary name');
    await page.locator('#epImportInput').setInputFiles(profileFile);await page.locator('#sheetOk').click();
    await page.waitForFunction(()=>EVProfile.get().name==='Alex Example');
    pass('Profile backup round trip includes logo and qualifications; invalid and cancelled imports preserve work');

    await page.locator('.ev-brand').click();await page.locator('.eh-home [data-ev-action="new"]').click();
    assert.equal(await page.evaluate(()=>pack.surveyedBy),'Alex Example');
    assert.equal(await page.evaluate(()=>pack.brandName),'Example Electrical Ltd');
    assert.equal(await page.evaluate(()=>pack.brandLogo),logo);
    await page.locator('[data-ev-field="name"]').fill('Profile validation project');
    await page.locator('[data-ev-close-details]').first().click();
    await page.locator('[data-ev-route="profile"]').click();
    await page.locator('[data-ep-field="name"]').fill('Alex Updated');
    await page.locator('[data-ep-tab="qualifications"]').click();
    await page.locator('[data-ep-q="name"]').fill('Updated example qualification');
    assert.equal(await page.evaluate(()=>pack.surveyedBy),'Alex Example');
    assert.equal(await page.evaluate(()=>pack.workspace.authorProfile.qualifications[0].name),'Example installation qualification');
    await page.locator('[data-ep-action="apply"]').click();await page.waitForFunction(()=>pack.surveyedBy==='Alex Updated');
    assert.equal(await page.evaluate(()=>pack.workspace.authorProfile.qualifications[0].name),'Updated example qualification');
    const saved=await page.evaluate(async()=>{await EVWorkspace.persist();return (await idbGet('proj_'+pack.projId)).pack;});
    assert.equal(saved.workspace.authorProfile.name,'Alex Updated');assert.equal(saved.brandLogo,logo);
    pass('New projects inherit profile details; existing project snapshots change only when explicitly applied');

    await page.evaluate(()=>{buildStarter('compact');pack.photos[0].items.push({id:uid(),type:'mark',kind:'snag',n:1,x:200,y:200,label:'Fictional snag for report validation',sev:'minor',st:'open',who:'Example contractor'});});
    await page.locator('[data-ev-route="markup"]').click();await page.locator('#evIssuePlans').click();await page.waitForSelector('#evPlanPreview canvas');
    download=page.waitForEvent('download');await page.locator('#evDownloadPlans').click();await (await download).saveAs(path.join(artifacts,'profile-plans.pdf'));
    await page.locator('[data-ev-close-review]').last().click();
    for(const type of ['programme','snags']){
      await page.locator(`[data-ev-route="${type}"]`).click();
      await page.locator(type==='programme'?'[data-ed-action="programme-report"]':'[data-ev-action="snag-report"]').click();
      await page.waitForSelector('#edPdfCanvas canvas',{timeout:60000});
      download=page.waitForEvent('download');await page.locator('[data-ed-action="download-report"]').click();await (await download).saveAs(path.join(artifacts,`profile-${type}.pdf`));
      await page.getByRole('button',{name:'Done',exact:true}).click();
    }
    for(const kind of ['plans','programme','snags'])assert(fs.statSync(path.join(artifacts,`profile-${kind}.pdf`)).size>10000);
    pass('Branded plan, programme and snag PDF previews and downloads work');

    await page.locator('[data-ev-route="profile"]').click();
    await page.locator('[data-ep-check="includeQualifications"]').uncheck();
    assert.equal(await page.evaluate(()=>EVProfile.reportRows(pack).filter(r=>r[0]==='Qualification').length),1);
    await page.locator('[data-ep-action="apply"]').click();await page.waitForFunction(()=>pack.workspace.authorProfile.includeQualifications===false);
    assert.equal(await page.evaluate(()=>EVProfile.reportRows(pack).filter(r=>r[0]==='Qualification').length),0);
    await page.locator('[data-ep-check="useForNew"]').uncheck();
    await page.locator('.ev-brand').click();await page.locator('.eh-home [data-ev-action="new"]').click();
    await page.locator('[data-ev-close-details]').first().waitFor();
    assert.equal(await page.evaluate(()=>pack.surveyedBy),'');assert.equal(await page.evaluate(()=>!!pack.workspace.authorProfile),false);
    await page.locator('[data-ev-close-details]').first().click();
    pass('Qualification privacy and automatic profile use honour the selected preferences');

    await page.locator('[data-ev-route="profile"]').click();
    await page.evaluate(()=>{window.savedLocalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='evsp_profile_v1')throw Error('Simulated quota');return window.savedLocalSet.call(this,k,v);};});
    await page.locator('[data-ep-tab="details"]').click();
    await page.locator('[data-ep-field="role"]').fill('Recovered from IndexedDB');await page.evaluate(()=>EVProfile.flush());
    await page.reload({waitUntil:'networkidle'});await page.waitForSelector('[data-ep-field="role"]');
    assert.equal(await page.locator('[data-ep-field="role"]').inputValue(),'Recovered from IndexedDB');
    await page.evaluate(()=>{window.savedIDBSet=idbSet;idbSet=async()=>{throw Error('Simulated IDB failure');};window.savedLocalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='evsp_profile_v1')throw Error('Simulated quota');return window.savedLocalSet.call(this,k,v);};});
    await page.locator('[data-ep-field="role"]').fill('Unsaved but exportable');await page.evaluate(()=>EVProfile.flush());
    assert.match(await page.locator('#epSaveStatus').innerText(),/Could not save/);
    download=page.waitForEvent('download');await page.locator('[data-ep-action="export"]').click();const emergency=path.join(artifacts,'emergency-profile.json');await (await download).saveAs(emergency);
    assert.equal(JSON.parse(fs.readFileSync(emergency)).profile.role,'Unsaved but exportable');
    await page.evaluate(()=>{idbSet=window.savedIDBSet;Storage.prototype.setItem=window.savedLocalSet;});
    await page.locator('[data-ep-field="role"]').fill('Project engineer');await page.evaluate(()=>EVProfile.flush());
    pass('Profile recovers from the newest stored copy and remains exportable when storage fails');

    for(const width of [390,320]){
      await page.setViewportSize({width,height:844});
      await page.locator('#evSidebar').evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished)));
      assert(await page.evaluate(()=>document.getElementById('evSidebar').getBoundingClientRect().right<=0));
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      assert(await page.evaluate(()=>document.querySelector('.ep-layout').scrollWidth<=innerWidth));
    }
    await page.screenshot({path:path.join(artifacts,'profile-mobile.png'),animations:'disabled'});
    pass('Profile editor fits narrow phone viewports');
    assert.deepEqual(errors,[]);assert.deepEqual(failedRequests,[]);
  } catch(e) {
    if(page)await page.screenshot({path:path.join(artifacts,'failure.png')}).catch(()=>{});
    console.error(e);process.exitCode=1;
  } finally {
    fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({results,errors,failedRequests},null,2));
    await browser.close();server.close();
  }
})();
