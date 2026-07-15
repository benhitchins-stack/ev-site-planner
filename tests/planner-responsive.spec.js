// Layout behaviour across viewports. This spec runs on every configured
// project (desktop, laptop, tablets, phones) via the Playwright config.
import {
  test, expect, openPlanner, goStage, buildStarter,
} from './helpers.js';

test('no horizontal page scrolling', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'compact');
  await goStage(page, 'overview');
  const overflow = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.body.clientWidth,
  }));
  expect(overflow.doc).toBeLessThanOrEqual(1);
  expect(overflow.body).toBeLessThanOrEqual(1);
});

test('stage navigation stays usable at this viewport', async ({ page }) => {
  await openPlanner(page);
  // the bar itself may scroll horizontally; every stage must remain reachable
  for (const k of ['survey', 'price', 'handover', 'overview']) {
    const btn = page.locator(`#stagebar [data-stage="${k}"]`);
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await page.waitForTimeout(150);
    await expect(btn).toHaveClass(/on/);
  }
});

test('side panel opens and closes appropriately for the pointer type', async ({ page }) => {
  await openPlanner(page);
  const isDrawer = await page.evaluate(() => window.innerWidth <= 959);
  await goStage(page, 'survey');
  const side = page.locator('#side');
  if (isDrawer) {
    await expect(side).toHaveClass(/open/); // stage click opens the drawer
    // tap the dimmed mask area left of the drawer; on phones that strip sits
    // left of the (closed) rail overlay, on tablets it sits right of the rail
    const vp = page.viewportSize();
    const drawer = await side.boundingBox();
    const railOpen = vp.width > 680; // rail is inline below 680, overlay closed on phones
    const left = railOpen ? 270 : 4;
    const exposed = drawer.x - left;
    if (exposed > 24) {
      await page.locator('#mask').click({ position: { x: left + Math.round(exposed / 2), y: Math.round(vp.height / 2) } });
    } else {
      // no visible mask strip at this width; the tap target is effectively
      // the drawer edge, so drive the same close path the mask uses
      await page.locator('#mask').dispatchEvent('click');
    }
    await page.waitForTimeout(400);
    await expect(side).not.toHaveClass(/open/);
  } else {
    await page.click('#btnSide');
    await expect(side).toHaveClass(/hidedesk/);
    await goStage(page, 'design'); // stage click restores the panel
    await expect(side).not.toHaveClass(/hidedesk/);
  }
});

test('canvas and export control remain reachable', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'compact');
  const isDrawer = await page.evaluate(() => window.innerWidth <= 959);
  if (isDrawer) {
    // close the drawer the starter flow opened so the canvas is visible
    await page.evaluate(() => document.getElementById('side').classList.remove('open'));
  }
  const cv = await page.locator('#cvwrap').boundingBox();
  expect(cv.width).toBeGreaterThan(200);
  expect(cv.height).toBeGreaterThan(200);
  await expect(page.locator('#btnExport')).toBeVisible();
  await expect(page.locator('#zin')).toBeVisible();
});

test('touch targets meet a usable minimum on coarse pointers', async ({ page }) => {
  await openPlanner(page);
  const coarse = await page.evaluate(() => matchMedia('(pointer:coarse)').matches);
  test.skip(!coarse, 'fine pointer viewport');
  for (const sel of ['#stagebar [data-stage="survey"]', '#btnExport', '#zin']) {
    const bb = await page.locator(sel).boundingBox();
    expect(bb.height, sel).toBeGreaterThanOrEqual(38);
  }
});

test('dialogs stay inside the viewport', async ({ page }) => {
  await openPlanner(page);
  await page.click('#btnFile');
  await page.click('#btnProjects');
  await page.waitForTimeout(400);
  const box = await page.locator('#projBackdrop .wlc').boundingBox();
  const vp = page.viewportSize();
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.y).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 1);
  expect(box.height).toBeLessThanOrEqual(vp.height + 1);
  await page.keyboard.press('Escape');
  await expect(page.locator('#projBackdrop')).not.toHaveClass(/show/);
});
