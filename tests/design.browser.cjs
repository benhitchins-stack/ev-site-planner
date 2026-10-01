/* Working design preview regression checks. See README for setup. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '../public');
  const artifacts = process.env.EVSP_TEST_OUTPUT || '/tmp/evsp-design-checks';
  fs.mkdirSync(artifacts, {recursive:true});
  const server = http.createServer((req,res) => {
    try {
      let file = path.join(root, decodeURIComponent(new URL(req.url,'http://local').pathname));
      if (!file.startsWith(root + path.sep) && file !== root) throw Error('Invalid path');
      if (fs.statSync(file).isDirectory()) file = path.join(file,'index.html');
      const mime = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
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
    await page.goto(url+'/#example', {waitUntil:'networkidle'});
    await page.waitForFunction(()=>EVWorkspace.route()==='overview'&&pack.photos.length===1);
    await page.locator('#evDashboardPlan').evaluate(im=>im.decode());
    assert.equal(await page.locator('.ev-metric').count(),4);
    const source=await page.evaluate(()=>activePhoto().src);
    await page.waitForFunction(src=>document.getElementById('evDashboardPlan').src!==src,source);
    await page.screenshot({path:path.join(artifacts,'dashboard.png'),animations:'disabled'});
    pass('Example opens a connected dashboard with an annotated plan preview and recorded next actions');

    await page.locator('[data-ev-route="markup"]').click();
    assert(await page.evaluate(()=>document.getElementById('evApp').classList.contains('ev-nav-collapsed')));
    const fullWidth=await page.evaluate(()=>cvwrap.clientWidth);
    assert(fullWidth>1300);
    const before=await page.evaluate(()=>{const u=activePhoto().items.find(i=>i.type==='unit'),r=cv.getBoundingClientRect();return{id:u.id,x:u.x,y:u.y,sx:r.x+u.x*view.zoom+view.ox,sy:r.y+u.y*view.zoom+view.oy,zoom:view.zoom,ox:view.ox,oy:view.oy};});
    await page.mouse.click(before.sx,before.sy);
    await page.waitForFunction(()=>document.getElementById('evApp').classList.contains('ev-inspector-open'));
    const selected=await page.evaluate(id=>{const u=activePhoto().items.find(i=>i.id===id);return{sel,x:u.x,y:u.y,zoom:view.zoom,ox:view.ox,oy:view.oy,width:cvwrap.clientWidth};},before.id);
    assert.equal(selected.sel,before.id);assert.equal(selected.x,before.x);assert.equal(selected.y,before.y);
    assert.equal(selected.zoom,before.zoom);assert.equal(selected.ox,before.ox);assert.equal(selected.oy,before.oy);
    assert.equal(fullWidth-selected.width,320);
    await page.locator('#ulabel').fill('Charger A - preview edit');await page.locator('#ulabel').dispatchEvent('change');
    assert.equal(await page.evaluate(id=>activePhoto().items.find(i=>i.id===id).label,before.id),'Charger A - preview edit');
    await page.screenshot({path:path.join(artifacts,'selected-item.png'),animations:'disabled'});
    pass('Selecting an item opens its controls without moving the item or changing the camera; editing updates the original record');

    await page.locator('#evInspectorClose').click();
    const drag=await page.evaluate(id=>{const u=activePhoto().items.find(i=>i.id===id),r=cv.getBoundingClientRect();return{x:u.x,y:u.y,sx:r.x+u.x*view.zoom+view.ox,sy:r.y+u.y*view.zoom+view.oy,z:view.zoom};},before.id);
    await page.mouse.move(drag.sx,drag.sy);await page.mouse.down();await page.mouse.move(drag.sx+65,drag.sy+24,{steps:8});await page.mouse.up();
    const moved=await page.evaluate(id=>{const u=activePhoto().items.find(i=>i.id===id);return{x:u.x,y:u.y};},before.id);
    assert(Math.abs(moved.x-drag.x-65/drag.z)<3);assert(Math.abs(moved.y-drag.y-24/drag.z)<3);
    await page.locator('#btnUndo').click();
    const undone=await page.evaluate(id=>{const u=activePhoto().items.find(i=>i.id===id);return{x:u.x,y:u.y};},before.id);
    assert(Math.abs(undone.x-drag.x)<1);assert(Math.abs(undone.y-drag.y)<1);
    pass('Dragging a selected charger and Undo preserve the expected position with contextual panels');

    await page.locator('#evInspectorClose').click();
    await page.locator('#catbar [data-cat="chargers"]').click();await page.screenshot({path:path.join(artifacts,'equipment-palette.png'),animations:'disabled'});
    const count=await page.evaluate(()=>activePhoto().items.length);
    await page.locator('#rail .palsec.show [data-tool^="unit:"]').first().click();
    assert(await page.evaluate(()=>document.getElementById('rail').classList.contains('closed')));
    const target=await page.evaluate(()=>{const ph=activePhoto(),r=cv.getBoundingClientRect();return{x:r.x+ph.imgW*.55*view.zoom+view.ox,y:r.y+ph.imgH*.82*view.zoom+view.oy};});
    await page.mouse.click(target.x,target.y);assert.equal(await page.evaluate(()=>activePhoto().items.length),count+1);
    await page.locator('#catbar [data-tool="select"]').click();
    await page.locator('#evInspectorToggle').click();
    await page.locator('[data-psec="checks"]').click();assert.equal(await page.evaluate(()=>packSec),'checks');
    await page.locator('[data-psec="output"]').click();assert.equal(await page.evaluate(()=>packSec),'output');
    await page.locator('#evFocus').click();assert.equal(await page.locator('#evFocus').getAttribute('aria-pressed'),'true');assert.equal(await page.evaluate(()=>cvwrap.clientWidth),fullWidth);
    await page.locator('#evFocus').click();assert.equal(await page.locator('#evInspectorToggle').getAttribute('aria-expanded'),'true');
    await page.locator('#evInspectorClose').click();
    await page.locator('#evTechnical').click();await page.locator('#evTechMenu [data-ev-action="settings"]').click();
    assert.equal(await page.evaluate(()=>packSec),'output');assert(await page.locator('#side').isVisible());
    await page.locator('#evInspectorClose').click();
    await page.screenshot({path:path.join(artifacts,'markup.png'),animations:'disabled'});
    pass('Equipment palette places a charger, plan settings stay accessible, and Focus restores the previous panels');

    await page.locator('#evIssuePlans').click();await page.waitForSelector('#evPlanPreview img');
    let download=page.waitForEvent('download');await page.locator('#evDownloadPlans').click();await (await download).saveAs(path.join(artifacts,'preview-plans.pdf'));
    await page.locator('[data-ev-close-review]').last().click();
    const backupPath=path.join(artifacts,'preview-project.evplan.json');download=page.waitForEvent('download');await page.locator('#evBackupTop').click();await (await download).saveAs(backupPath);
    const exported=JSON.parse(fs.readFileSync(backupPath));assert.equal(exported.photos[0].items.length,count+1);assert(exported.photos[0].items.some(i=>i.label==='Charger A - preview edit'));
    const projectId=await page.evaluate(async()=>{await EVWorkspace.persist();return pack.projId;});
    await page.reload({waitUntil:'networkidle'});await page.waitForFunction(id=>pack.projId===id,projectId);
    assert.equal(await page.evaluate(()=>pack.photos[0].items.length),count+1);
    pass('Plan PDF and project backup export retain edited content; work survives reload');

    await page.locator('.eh-nav [data-ev-route="projects"]').click();
    await page.locator('#evSearch').fill('No match');await page.getByText('No matching projects',{exact:true}).waitFor();
    await page.locator('#evSearch').fill('Riverside');assert.equal(await page.locator('.ev-project-row').count(),1);
    await page.locator('#evFilter').selectOption('domestic');assert.equal(await page.locator('.ev-project-row').count(),0);
    await page.locator('#evFilter').selectOption('all');await page.locator('#evSearch').fill('');
    await page.screenshot({path:path.join(artifacts,'projects.png'),animations:'disabled'});
    await page.locator('[data-ev-project]').first().click();
    const picker=page.waitForEvent('filechooser');await page.locator('[data-ev-route="projects"]').click();await page.locator('[data-ev-action="open"]').click();await (await picker).setFiles(backupPath);
    await page.waitForFunction(id=>EVWorkspace.route()==='overview'&&pack.projId!==id,projectId);
    assert.equal(await page.evaluate(()=>pack.photos[0].items.length),count+1);
    pass('Project search, type filters and backup import remain connected to the redesigned dashboard');

    for(const width of [1024,390,320]){
      await page.setViewportSize({width,height:844});await page.locator('#evSidebar').evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished)));
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      assert(await page.evaluate(()=>document.getElementById('evScreen').scrollWidth<=document.getElementById('evScreen').clientWidth));
      if(width<=390){
        await page.locator('#evMobileNav').click();assert.equal(await page.locator('#evNavBackdrop').isVisible(),true);
        await page.locator('[data-ev-route="markup"]').click();assert.equal(await page.locator('#evNavBackdrop').isVisible(),false);
        await page.getByRole('combobox',{name:'Add markup',exact:true}).selectOption('site');
        assert.equal(await page.locator('#rail .palsec.show').getAttribute('data-cat'),'site');
        await page.locator('#rail .palsec.show [data-palclose]').click();
        assert(await page.getByRole('button',{name:'Plan settings',exact:true}).isVisible());
        await page.getByRole('button',{name:'Plan settings',exact:true}).click();assert(await page.locator('#evInspectorClose').isVisible());
        await page.locator('#evInspectorClose').click();
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        await page.locator('#evMobileNav').click();await page.locator('[data-ev-route="overview"]').click();
      }
    }
    await page.screenshot({path:path.join(artifacts,'dashboard-mobile.png'),animations:'disabled'});
    pass('Dashboard, navigation, named icon controls and Markup settings work at tablet and narrow phone widths');

    assert(fs.statSync(path.join(artifacts,'preview-plans.pdf')).size>10000);
    assert.deepEqual(errors,[]);assert.deepEqual(failedRequests,[]);
  } catch(e) {
    if(page)await page.screenshot({path:path.join(artifacts,'failure.png')}).catch(()=>{});
    console.error(e);process.exitCode=1;
  } finally {
    fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({results,errors,failedRequests},null,2));
    await browser.close();server.close();
  }
})();
