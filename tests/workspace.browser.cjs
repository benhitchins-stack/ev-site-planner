/* Optional real-browser regression checks. See README for setup. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '../public');
  const artifacts = process.env.EVSP_TEST_OUTPUT || '/tmp/evsp-browser-checks';
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
    await page.waitForFunction(()=>EVWorkspace.route()==='home'&&document.querySelector('.eh-preview img').naturalWidth>0);
    await page.screenshot({path:path.join(artifacts,'home-desktop.png')});
    pass('Home page opens with all local assets');

    await page.locator('.eh-home [data-ev-action="new"]').click();
    await page.locator('[data-ev-field="address"]').fill('Fictional test address only');
    await page.locator('[data-ev-close-details]').first().click();
    const firstId = await page.evaluate(async()=>{await EVWorkspace.persist();return pack.projId;});
    await page.reload({waitUntil:'networkidle'});
    await page.waitForFunction(()=>pack.address==='Fictional test address only');
    assert.equal(await page.evaluate(()=>pack.projId),firstId);
    assert.equal(await page.evaluate(()=>new Set([...document.querySelectorAll('.eh-home [data-ev-project]')].map(b=>b.dataset.evProject)).size),1);
    pass('Address-only work survives reload and appears in recent projects');

    await page.evaluate(()=>{const b=document.querySelector('.eh-home [data-ev-action="example"]');b.click();b.click();});
    await page.waitForFunction(()=>EVWorkspace.route()==='overview'&&pack.photos.length===1);
    assert.equal(await page.evaluate(()=>projIndex().length),2);
    pass('Rapid repeated project creation opens one example');

    const snapshot = await page.evaluate(async()=>{
      const original=EVProjectStore.save;let release;const gate=new Promise(r=>release=r);
      EVProjectStore.save=async(...args)=>{await gate;return original(...args);};
      pack.photos[0].items[0].label='Before queued save';const saving=EVWorkspace.persist();
      pack.photos[0].items[0].label='Later edit';release();await saving;EVProjectStore.save=original;
      return (await idbGet('proj_'+pack.projId)).pack.photos[0].items[0].label;
    });
    assert.equal(snapshot,'Before queued save');
    pass('Queued saves preserve an independent snapshot');

    await page.evaluate(async()=>{
      const p=normalisePack(newPack());p.projId='fallback-check';p.name='Older IDB copy';
      await idbSet('proj_'+p.projId,{pack:p,ts:1});p.name='Newer recovery copy';p.cdm.client='Fictional recovery client';
      localStorage.setItem('evsp_proj_'+p.projId,JSON.stringify({pack:p,ts:Date.now()+1}));
      await loadProject(p.projId);
    });
    assert.equal(await page.evaluate(()=>pack.name),'Newer recovery copy');
    assert.equal(await page.evaluate(()=>pack.cdm.client),'Fictional recovery client');
    pass('Project loading chooses the newest complete recovery copy and retains CDM data');

    const backup = await page.evaluate(()=>JSON.stringify(serialisablePack()));
    await page.locator('.ev-brand').click();await page.waitForFunction(()=>EVWorkspace.route()==='home');
    let picker=page.waitForEvent('filechooser');await page.locator('.eh-home [data-ev-action="open"]').click();
    await (await picker).setFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{broken')});
    await page.waitForFunction(()=>!document.getElementById('evApp').hasAttribute('aria-busy'));
    assert.equal(await page.evaluate(()=>pack.projId),'fallback-check');
    picker=page.waitForEvent('filechooser');await page.locator('.eh-home [data-ev-action="open"]').click();
    await (await picker).setFiles({name:'project.evplan.json',mimeType:'application/json',buffer:Buffer.from(backup)});
    await page.waitForFunction(()=>EVWorkspace.route()==='overview'&&pack.projId!=='fallback-check');
    assert.equal(await page.evaluate(()=>pack.cdm.client),'Fictional recovery client');
    assert(await page.evaluate(async()=>!!(await idbGet('proj_fallback-check')).pack));
    pass('Invalid backups keep current work; valid backups open as separate projects');

    await page.locator('[data-ev-route="markup"]').click();
    await page.locator('#evTechnical').click();await page.locator('[data-ev-action="cdm"]').click();
    await page.locator('#evspCdmBackdrop.show').waitFor();
    await page.locator('.evsp-cdm-close').click();
    await page.locator('#evInspectorToggle').click();
    await page.locator('[data-psec="checks"]').click();assert.equal(await page.evaluate(()=>packSec),'checks');
    await page.locator('[data-psec="output"]').click();assert.equal(await page.evaluate(()=>packSec),'output');
    pass('CDM controls and the new markup settings tabs remain accessible');

    await page.locator('.ev-brand').click();await page.waitForFunction(()=>EVWorkspace.route()==='home');
    await page.locator('.eh-home [data-ev-action="example"]').click();await page.waitForFunction(()=>pack.photos.length===1&&EVWorkspace.route()==='overview');
    await page.locator('[data-ev-route="markup"]').click();
    await page.screenshot({path:path.join(artifacts,'markup-desktop.png')});
    await page.locator('#evIssuePlans').click();await page.waitForSelector('#evPlanPreview canvas');
    const download=page.waitForEvent('download');await page.locator('#evDownloadPlans').click();
    const pdf=await download;await pdf.saveAs(path.join(artifacts,'marked-up-plans.pdf'));
    assert(fs.statSync(path.join(artifacts,'marked-up-plans.pdf')).size>10000);
    await page.locator('[data-ev-close-review]').last().click();
    pass('Marked-up plan preview and PDF download work');

    const items=await page.evaluate(()=>pack.photos[0].items.length);
    await page.locator('[data-ev-route="programme"]').click();await page.keyboard.press('Delete');
    assert.equal(await page.evaluate(()=>pack.photos[0].items.length),items);
    await page.locator('.ev-brand').click();await page.waitForFunction(()=>EVWorkspace.route()==='home');
    for(const width of [390,320]){
      await page.setViewportSize({width,height:844});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
    await page.screenshot({path:path.join(artifacts,'home-mobile.png')});
    pass('Home fits narrow phones and drawing shortcuts stay within Markup');

    await page.setViewportSize({width:1440,height:1040});
    await page.locator('.eh-resource [data-ev-action="showroom"]').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('c3dLoad')).display==='none',null,{timeout:30000});
    await page.locator('#c3dClose').click();
    await page.locator('.eh-resource a[href="Guide Library.dc.html"]').click();
    await page.getByText('All guides',{exact:true}).waitFor();
    await page.fill('#glSearch','rcbo');await page.waitForSelector('.gl-card[data-open="prot"]');
    await page.locator('.gl-card[data-open="prot"]').click();await page.waitForSelector('.g-guide[data-guide-id="prot"] .g-art svg');
    await page.locator('.g-guide dfn[data-term]').first().click();await page.waitForSelector('.g-pop');
    // A term pop-over links to that term in the glossary, not the top of the glossary.
    const termHref=await page.locator('.g-pop a').getAttribute('href');assert.match(termHref,/^#glossary=[a-z0-9]+$/);
    await page.locator('.g-pop a').click();await page.waitForSelector('#term-'+termHref.split('=')[1]+'.is-target');
    assert.equal(await page.locator('.gl-az a').count()>10,true,'Glossary has a letter index');
    // The level check names unanswered questions inline instead of an alert.
    let alerted=false;page.once('dialog',d=>{alerted=true;d.dismiss();});
    await page.goto(url+'/Guide%20Library.dc.html#all');await page.locator('[data-quiz-open="start"]').click();
    await page.locator('[data-quiz-check="start"]').click();await page.waitForSelector('.gl-quiz-msg');
    assert.match(await page.locator('.gl-quiz-msg').innerText(),/Answer questions 1, 2/);assert.equal(alerted,false);
    // On a phone an opened guide starts under the search box, and diagrams scroll sideways at a readable size.
    await page.setViewportSize({width:390,height:844});
    await page.goto(url+'/Guide%20Library.dc.html#g=survey-basics');await page.waitForSelector('.g-art-scroll svg');
    assert.equal(await page.locator('.gl-levels').isVisible(),false,'Level filters are hidden above an opened guide');
    assert.ok(await page.locator('.g-title').evaluate(el=>el.getBoundingClientRect().top<500),'Guide title is near the top on a phone');
    assert.ok(await page.locator('.g-art-scroll').evaluate(el=>el.scrollWidth>el.clientWidth+100),'Diagram keeps its natural width');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No sideways page scroll');
    await page.setViewportSize({width:1440,height:1040});
    await page.goto(url+'/Guide%20Library.dc.html#g=voltdrop');await page.waitForSelector('.g-calc-out');
    assert.match(await page.locator('.g-calc-out').first().innerText(),/Within the 5 % limit/);
    await page.goto(url+'/Guide%20Library.dc.html#glossary');await page.waitForSelector('.gl-gloss');
    pass('Guide library search, diagrams, glossary pop-overs and calculators work');

    await page.goto(url+'/Learning%20Hub.dc.html');await page.getByText('Learning Hub',{exact:true}).first().waitFor();
    pass('Showroom, guide library and training pages load');

    await page.goto(url, {waitUntil:'networkidle'});await page.waitForFunction(()=>EVWorkspace.route()==='home');
    await page.locator('.eh-home [data-ev-help="home"]').click();await page.waitForSelector('#evHelp:not([hidden]) .g-guide[data-guide-id="planner-first-project"]');
    await page.fill('#evHelpSearch','earth rod');await page.waitForSelector('#evHelp [data-help-open="earthrod"]');
    await page.locator('#evHelp [data-help-open="earthrod"]').click();await page.waitForSelector('#evHelp .g-guide[data-guide-id="earthrod"]');
    await page.keyboard.press('Escape');await page.waitForSelector('#evHelp',{state:'hidden'});
    await page.evaluate(()=>{document.querySelector('.eh-home [data-ev-project]').click();});
    await page.waitForFunction(()=>EVWorkspace.route()==='overview');
    await page.locator('.ev-overview-grid [data-ev-help="survey-checklist"]').click();await page.waitForSelector('#evHelp:not([hidden]) .g-guide[data-guide-id="survey-checklist"]');
    await page.locator('#evHelpClose').click();await page.waitForSelector('#evHelp',{state:'hidden'});
    await page.locator('.ev-page-head [data-ev-help], .ev-overview-heading [data-ev-help]').first().click();await page.waitForSelector('#evHelp:not([hidden]) .g-guide');
    await page.locator('#evHelpTour').click();await page.waitForSelector('.ev-tour:not([hidden])');
    await page.locator('.ev-tour [data-tour-step="1"]').click();await page.locator('.ev-tour [data-tour-close]').first().click();await page.waitForSelector('.ev-tour',{state:'hidden'});
    await page.evaluate(()=>openCableCheck());await page.waitForSelector('#ccBackdrop.show .wlc-head .ev-help-q');
    await page.locator('#ccBackdrop .wlc-head .ev-help-q').click();await page.waitForSelector('#evHelp:not([hidden]) .g-guide[data-guide-id="cable"]');
    await page.locator('#evHelpClose').click();await page.waitForSelector('#evHelp',{state:'hidden'});
    await page.evaluate(()=>document.getElementById('ccBackdrop').classList.remove('show'));
    pass('Help drawer opens from Help and ? buttons, searches the guides and runs the tour, including from the cable calculations dialog');

    assert.deepEqual(errors,[]);assert.deepEqual(failedRequests,[]);
  } catch(e) {
    if(page)await page.screenshot({path:path.join(artifacts,'failure.png')}).catch(()=>{});
    console.error(e);process.exitCode=1;
  } finally {
    fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({results,errors,failedRequests},null,2));
    await browser.close();server.close();
  }
})();
