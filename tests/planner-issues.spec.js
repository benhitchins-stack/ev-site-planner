// Issue summary: severity, deep links, resolution behaviour, counts and
// duplicate prevention. Only issues the implementation genuinely raises
// are tested here.
import {
  test, expect, openPlanner, goStage, buildStarter, stageInfo, settleAutosave,
} from './helpers.js';

test('missing survey fields raise issues that resolve when completed', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'compact');
  await settleAutosave(page);
  let info = await stageInfo(page);
  const titles = info._issues.map((i) => i.title);
  expect(titles).toContain('Site name missing');
  expect(titles).toContain('Site address missing');
  expect(titles.some((t) => /Supply rating/.test(t))).toBe(true);
  // earthing missing is critical because chargers are placed
  const earth = info._issues.find((i) => /Earthing arrangement/.test(i.title));
  expect(earth.sev).toBe('crit');
  // resolve address; its issue disappears, others remain
  await goStage(page, 'survey');
  await page.fill('#pkAddr', '1 Fixed Street');
  await settleAutosave(page);
  info = await stageInfo(page);
  expect(info._issues.map((i) => i.title)).not.toContain('Site address missing');
  expect(info._issues.map((i) => i.title)).toContain('Site name missing');
});

test('issue rows in the overview match the engine and carry working actions', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'compact');
  await settleAutosave(page);
  await goStage(page, 'overview');
  const info = await stageInfo(page);
  const rows = page.locator('.card .ovrow:has(.sevdot)');
  await expect(rows).toHaveCount(info._issues.length);
  const heading = await page.locator('h3:has-text("Open issues")').textContent();
  expect(heading).toContain(String(info._issues.length));
  // no duplicate titles
  const rowTitles = await rows.locator('b').allTextContents();
  expect(new Set(rowTitles).size).toBe(rowTitles.length);
  // first issue action navigates and flashes/focuses a real element
  await rows.first().click();
  await page.waitForTimeout(700);
  const landed = await page.evaluate(() => packSec);
  expect(landed).not.toBe('overview');
});

test('no charger and route issues appear for a photo-only project', async ({ page }) => {
  await openPlanner(page);
  // blank grid plan, no items
  await page.click('#addGrid');
  await page.waitForTimeout(800);
  await settleAutosave(page);
  const info = await stageInfo(page);
  expect(info._issues.some((i) => i.title === 'No charger on the plan yet')).toBe(true);
  // place a charger without a route -> route warning replaces it
  await page.evaluate(() => {
    pack.photos[0].items.push({ id: 't1', type: 'unit', variant: 'solo_wall', x: 60, y: 60, kw: '7' });
    normalisePack(pack); evalMarkDirty(); draw(); renderSide();
  });
  const info2 = await stageInfo(page);
  expect(info2._issues.some((i) => i.title === 'Charger has no cable route')).toBe(true);
  expect(info2._issues.some((i) => i.title === 'No charger on the plan yet')).toBe(false);
});

test('cable route without a length raises a design warning', async ({ page }) => {
  await openPlanner(page);
  await page.click('#addGrid');
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    pack.photos[0].items.push({ id: 'u9', type: 'unit', variant: 'solo_wall', x: 40, y: 40, kw: '7' });
    pack.photos[0].items.push({ id: 'r9', type: 'route', kind: 'swa', pts: [{ x: 10, y: 10 }, { x: 80, y: 80 }] });
    delete pack.photos[0].scale; // no scale, no manual length -> unmeasurable
    normalisePack(pack); evalMarkDirty(); draw(); renderSide();
  });
  const info = await stageInfo(page);
  const lenIssue = info._issues.find((i) => /missing a length/.test(i.title));
  expect(lenIssue).toBeTruthy();
  expect(lenIssue.sev).toBe('warn');
});

test('safety snag is critical and blocks the install stage', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'compact');
  await page.evaluate(() => {
    pack.photos[0].items.push({ id: 's1', type: 'mark', kind: 'snag', x: 30, y: 30, sev: 'safety', st: 'open', label: 'Exposed cable' });
    normalisePack(pack); evalMarkDirty(); draw(); renderSide();
  });
  const info = await stageInfo(page);
  expect(info.install.st).toBe('block');
  const snag = info._issues.find((i) => /safety snag/.test(i.title));
  expect(snag.sev).toBe('crit');
  // fixing the snag downgrades install from blocked
  await page.evaluate(() => {
    const it = pack.photos[0].items.find((i) => i.id === 's1');
    it.st = 'fixed'; evalMarkDirty(); renderSide();
  });
  const info2 = await stageInfo(page);
  expect(info2.install.st).not.toBe('block');
});

test('handover sign-off before commissioning completes raises a warning', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'compact');
  await goStage(page, 'handover');
  await page.fill('[data-comg="by"]', 'A Engineer');
  await settleAutosave(page);
  const info = await stageInfo(page);
  expect(info.handover.st).toBe('block');
  expect(info._issues.some((i) => /before commissioning/.test(i.title))).toBe(true);
  const incomplete = info._issues.find((i) => /before commissioning/.test(i.title));
  expect(incomplete.sev).toBe('warn');
});

test('stage tooltips render user data with special characters cleanly', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'compact');
  await page.evaluate(() => {
    pack.outcome = 'dno'; pack.dnoRef = 'A&B <Ref>'; pack.readyToProceed = false;
    evalMarkDirty(); renderSide();
  });
  const title = await page.getAttribute('#stagebar [data-stage="plan"]', 'title');
  expect(title).toContain('A&B <Ref>');
  expect(title).not.toContain('&amp;');
  // and the overview row escapes it for HTML display
  await goStage(page, 'overview');
  const planRow = page.locator('.ovrow[data-ovact="stage:plan"] em').first();
  await expect(planRow).toContainText('A&B <Ref>');
});
