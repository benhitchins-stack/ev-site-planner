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
    await page.goto(url+'/#example', {waitUntil:'networkidle'});
    await page.waitForFunction(()=>EVWorkspace.route()==='overview'&&pack.photos.length===1);
    await page.locator('#evDashboardPlan').evaluate(im=>im.decode());
    assert.equal(await page.locator('.ev-metric').count(),4);assert.equal(await page.locator('.ev-flow-step').count(),5);
    assert.equal(await page.locator('.ev-check-list li').count(),await page.evaluate(()=>readiness().total));
    assert.equal(await page.evaluate(()=>Array.isArray(pack.programme?.activities)),false,'Viewing the overview must not create programme activities');
    const source=await page.evaluate(()=>activePhoto().src);
    await page.waitForFunction(src=>document.getElementById('evDashboardPlan').src!==src,source);
    const preview=await page.evaluate(async()=>{for(let i=0;i<50;i++){const v=await idbGet('preview_'+pack.projId);if(typeof v==='string')return v;await new Promise(r=>setTimeout(r,100));}return '';});
    assert(preview.startsWith('data:image/jpeg'),'The overview stores a rendered plan preview for project cards');
    assert.equal(await page.evaluate(p=>(localStorage.getItem('evsp_projects')||'').includes(p.slice(p.length>>1,(p.length>>1)+80)),preview),false,'Previews stay out of the project index');
    await page.screenshot({path:path.join(artifacts,'dashboard.png'),animations:'disabled'});
    pass('Example opens a connected dashboard with project stages, an annotated plan preview, record checks and recorded next actions');

    await page.locator('[data-ev-route="markup"]').click();
    assert(await page.evaluate(()=>document.getElementById('evApp').classList.contains('ev-nav-collapsed')));
    const fullWidth=await page.evaluate(()=>cvwrap.clientWidth);
    assert(fullWidth>1300);
    // Markup fits the canvas on the next animation frame; sample coordinates after layout.
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const before=await page.evaluate(()=>{const u=activePhoto().items.find(i=>i.type==='unit'),r=cv.getBoundingClientRect();return{id:u.id,x:u.x,y:u.y,sx:r.x+u.x*view.zoom+view.ox,sy:r.y+u.y*view.zoom+view.oy,zoom:view.zoom,ox:view.ox,oy:view.oy};});
    await page.mouse.click(before.sx,before.sy);
    await page.waitForFunction(()=>document.getElementById('evApp').classList.contains('ev-inspector-open'));
    const selected=await page.evaluate(id=>{const u=activePhoto().items.find(i=>i.id===id);return{sel,x:u.x,y:u.y,zoom:view.zoom,ox:view.ox,oy:view.oy,width:cvwrap.clientWidth};},before.id);
    assert.equal(selected.sel,before.id,JSON.stringify({before,selected,hit:await page.evaluate(()=>({type:findItem(sel)?.type,kind:findItem(sel)?.kind,label:findItem(sel)?.label}))}));assert.equal(selected.x,before.x);assert.equal(selected.y,before.y);
    // Selecting never zooms or refits; the item stays visible beside the inspector (a pan is only made when the panel would cover it).
    assert.equal(selected.zoom,before.zoom);
    const shown=await page.evaluate(id=>{const u=activePhoto().items.find(i=>i.id===id),r=cv.getBoundingClientRect(),side=document.getElementById('side').getBoundingClientRect();const sx=r.x+u.x*view.zoom+view.ox,sy=r.y+u.y*view.zoom+view.oy;return{sx,sy,inCanvas:sx>r.left&&sx<r.right&&sy>r.top&&sy<r.bottom,underPanel:sx>side.left&&sy>side.top};},before.id);
    assert(shown.inCanvas&&!shown.underPanel,JSON.stringify(shown));
    assert.equal(fullWidth-selected.width,320);
    assert.equal(await page.locator('#wbItemSummary').textContent(),await page.evaluate(id=>{const u=activePhoto().items.find(i=>i.id===id);return unitDisplayName(u)+' · '+(u.kw||'7')+' kW';},before.id));
    assert.equal(await page.locator('#ulabel').getAttribute('placeholder'),'e.g. Visitor bay, north wall');
    assert(await page.locator('[data-wb-turn="90"]').isVisible(),'Rotate sits in Item details with quarter-turn buttons');
    await page.locator('#ulabel').fill('Charger A - preview edit');await page.locator('#ulabel').dispatchEvent('change');
    assert.equal(await page.evaluate(id=>activePhoto().items.find(i=>i.id===id).label,before.id),'Charger A - preview edit');
    await page.screenshot({path:path.join(artifacts,'selected-item.png'),animations:'disabled'});
    pass('Selecting an item opens its controls without zooming and keeps it in view; editing updates the original record');

    await page.locator('#evInspectorClose').click();
    const drag=await page.evaluate(id=>{const u=activePhoto().items.find(i=>i.id===id),r=cv.getBoundingClientRect();return{x:u.x,y:u.y,sx:r.x+u.x*view.zoom+view.ox,sy:r.y+u.y*view.zoom+view.oy,z:view.zoom};},before.id);
    await page.mouse.move(drag.sx,drag.sy);await page.mouse.down();await page.mouse.move(drag.sx+65,drag.sy+24,{steps:8});await page.mouse.up();
    const moved=await page.evaluate(id=>{const u=activePhoto().items.find(i=>i.id===id);return{x:u.x,y:u.y};},before.id);
    assert(Math.abs(moved.x-drag.x-65/drag.z)<3);assert(Math.abs(moved.y-drag.y-24/drag.z)<3);
    await page.locator('#btnUndo').click();
    const undone=await page.evaluate(id=>{const u=activePhoto().items.find(i=>i.id===id);return{x:u.x,y:u.y};},before.id);
    assert(Math.abs(undone.x-drag.x)<1);assert(Math.abs(undone.y-drag.y)<1);
    pass('Dragging a selected charger and Undo preserve the expected position with contextual panels');

    assert(await page.locator('#evInspectorClose').isHidden());
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
    assert.equal(await page.locator('#evTechMenu [data-ev-action="settings"]').count(),0,'Plan settings has one entry point, the strip button');
    await page.locator('#evInspectorToggle').click();assert(await page.locator('#side .tab').isHidden(),'Plan settings shows four section tabs and no Plans/Selected segment');
    assert.equal(await page.locator('#side .snav [data-psec]').count(),4);
    assert.equal(await page.evaluate(()=>packSec),'output');assert(await page.locator('#side').isVisible());
    await page.locator('#evInspectorClose').click();
    await page.screenshot({path:path.join(artifacts,'markup.png'),animations:'disabled'});
    pass('Equipment palette places a charger, plan settings stay accessible, and Focus restores the previous panels');

    await page.locator('#evIssuePlans').click();await page.waitForSelector('#evPlanPreview canvas');
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
    await page.locator('#evSearch').fill('Riverside');assert.equal(await page.locator('.ev-project-row').count(),1);assert.equal(await page.locator('.ev-project-row .ev-pill.lime').textContent(),'Open now');
    assert(await page.evaluate(async()=>{for(let i=0;i<50;i++){const stored=await idbGet('preview_'+pack.projId),img=document.querySelector('.ev-project-row img[data-ev-preview]');if(stored&&img?.src===stored)return true;await new Promise(r=>setTimeout(r,100));}return false;}),'Project cards show the stored plan preview after a reload');
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
        await page.locator('[data-wb-close-library]').click();
        assert(await page.getByRole('button',{name:'Plan settings',exact:true}).isVisible());
        await page.getByRole('button',{name:'Plan settings',exact:true}).click();assert(await page.locator('#evInspectorClose').isVisible());
        await page.locator('#evInspectorClose').click();
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        await page.locator('#evMobileNav').click();await page.locator('[data-ev-route="overview"]').click();
      }
    }
    await page.screenshot({path:path.join(artifacts,'dashboard-mobile.png'),animations:'disabled'});
    pass('Dashboard, navigation, named icon controls and Markup settings work at tablet and narrow phone widths');

    // Touch layouts: the inspector, rail and phone sheet must not hide the item just selected. The view pans by the least amount, never zooms, and pans back on close.
    for(const vp of [{width:1024,height:1366},{width:390,height:844}]){
      const touch=await browser.newContext({locale:'en-GB',viewport:vp,hasTouch:true,isMobile:vp.width<700});
      const tp=await touch.newPage();tp.on('pageerror',e=>errors.push(e.message));
      await tp.goto(url+'/#example',{waitUntil:'networkidle'});await tp.waitForFunction(()=>EVWorkspace.route()==='overview'&&pack.photos.length===1);
      await tp.evaluate(()=>EVWorkspace.go('markup'));await tp.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      // Place the target under where the panel will open: the right-hand side on a tablet, the lower half on a phone.
      const target=await tp.evaluate(phone=>{const u=activePhoto().items.filter(i=>i.type==='unit').sort((a,b)=>b.x-a.x)[0],r=cv.getBoundingClientRect();
        if(phone)view.oy=r.height*.8-u.y*view.zoom;else view.ox=r.width-90-u.x*view.zoom;viewIsFit=false;drawCanvas();
        return{id:u.id,x:r.x+u.x*view.zoom+view.ox,y:r.y+u.y*view.zoom+view.oy,zoom:view.zoom,ox:view.ox,oy:view.oy};},vp.width<700);
      await tp.touchscreen.tap(target.x,target.y);
      await tp.waitForFunction(()=>document.getElementById('evApp').classList.contains('ev-inspector-open'));
      const after=await tp.evaluate(id=>{const u=findItem(id),r=cv.getBoundingClientRect(),side=document.getElementById('side').getBoundingClientRect(),sx=r.x+u.x*view.zoom+view.ox,sy=r.y+u.y*view.zoom+view.oy;
        return{sel,zoom:view.zoom,ox:view.ox,oy:view.oy,sx,sy,covered:sx>side.left&&sx<side.right&&sy>side.top&&sy<side.bottom,inCanvas:sx>r.left&&sx<r.right&&sy>r.top&&sy<r.bottom};},target.id);
      assert.equal(after.sel,target.id);assert.equal(after.zoom,target.zoom);assert(!after.covered&&after.inCanvas,JSON.stringify({vp,target,after}));
      await tp.screenshot({path:path.join(artifacts,'selected-'+vp.width+'.png')});
      if(vp.width<700){
        assert(await tp.locator('#evToolCategory').isHidden(),'The phone tool strip drops to one row while an item is selected');
        const half=await tp.locator('#side').boundingBox();await tp.waitForTimeout(500);await tp.locator('#evSheetHandle').click();const full=await tp.locator('#side').boundingBox();
        assert(full.height>half.height+80,JSON.stringify({half,full}));
        await tp.locator('#evSheetHandle').click();const peek=await tp.locator('#side').boundingBox();assert(peek.height<half.height,JSON.stringify({half,peek}));
        await tp.locator('#evSheetHandle').click();
      }
      await tp.locator('#evInspectorClose').click();
      const closed=await tp.evaluate(()=>({ox:view.ox,oy:view.oy}));
      assert(Math.abs(closed.ox-target.ox)<1&&Math.abs(closed.oy-target.oy)<1,'Closing the panel returns the view when it was not moved: '+JSON.stringify({target,closed}));
      await touch.close();
    }
    pass('On a tablet and a phone the selected item is panned clear of the panel without zooming, and the view returns on close');

    // A new plan without a scale: the strip shows an amber Set scale button and the hint bar offers to set it, once.
    const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=640;c.height=420;const g=c.getContext('2d');g.fillStyle='#dfe7ee';g.fillRect(0,0,640,420);g.strokeStyle='#183043';g.strokeRect(40,40,560,340);return c.toDataURL('image/png').split(',')[1];});
    await page.setViewportSize({width:1440,height:1040});await page.evaluate(()=>EVWorkspace.go('markup'));const plans=await page.evaluate(()=>pack.photos.length);
    await page.locator('#filePhoto').setInputFiles({name:'site-photo.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
    await page.waitForFunction(n=>pack.photos.length===n+1&&!pendingFileImports.size,plans);
    await page.evaluate(()=>EVWorkspace.openPlan(pack.photos.at(-1).id));await page.waitForFunction(()=>document.getElementById('hint').classList.contains('show'));
    assert.match(await page.locator('#hint').textContent(),/Set the scale before drawing routes/);
    assert.match(await page.locator('#evPlanStrip .ev-scale-btn.unset').textContent(),/Set scale/);
    assert.equal(await page.locator('#evIssuePlans').textContent(),'Set the scale');
    await page.locator('#hSetScale').click();assert.equal(await page.evaluate(()=>tool),'scale');assert.match(await page.locator('#hint').textContent(),/^Set scale · Tap both ends/);
    await page.evaluate(()=>setTool('select'));assert.doesNotMatch(await page.locator('#hint').textContent(),/Set the scale before/);
    pass('A new plan without a scale shows the Set scale button and a one-off reminder that starts the Set scale tool');

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
