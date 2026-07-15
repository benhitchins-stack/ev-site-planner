// Stage navigation: free movement, active identification, canvas preservation,
// per-stage cards, status dots, unresolved counts and persistence.
import {
  test, expect, openPlanner, goStage, packState, stageInfo, buildStarter, settleAutosave,
} from './helpers.js';

const ALL = ['overview', 'survey', 'design', 'verify', 'price', 'plan', 'install', 'handover'];

// A key card per stage that must render when the stage is selected.
const STAGE_MARKERS = {
  survey: '#pkSiteName',
  design: '[data-eqvdef="side"]',
  price: '#mkQuote',
  plan: '#mkRams',
  install: '#outcome',
};

test('all eight stages activate and mark the active stage', async ({ page }) => {
  await openPlanner(page);
  for (const k of ALL) {
    await goStage(page, k);
    const btn = page.locator(`#stagebar [data-stage="${k}"]`);
    await expect(btn).toHaveClass(/on/);
    await expect(btn).toHaveAttribute('aria-current', 'step');
    // only one active at a time
    expect(await page.locator('#stagebar .stgbtn.on').count()).toBe(1);
    expect(await page.evaluate(() => packSec)).toBe(k);
  }
});

test('each stage shows its own cards without duplicate element ids', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'compact');
  for (const [k, marker] of Object.entries(STAGE_MARKERS)) {
    await goStage(page, k);
    await expect(page.locator(marker).first(), `${k} marker ${marker}`).toBeAttached();
    const dupes = await page.evaluate(() => {
      const seen = new Map();
      document.querySelectorAll('#sideScroll [id]').forEach((el) => seen.set(el.id, (seen.get(el.id) || 0) + 1));
      return [...seen.entries()].filter(([, n]) => n > 1).map(([id]) => id);
    });
    expect(dupes, `duplicate ids in ${k}`).toEqual([]);
  }
  // verify + handover render their computed cards for a pack with chargers
  // (the compact starter has chargers and trench routes, so the load check
  // renders; the cable-calc card appears only once swa/run cables exist)
  await goStage(page, 'verify');
  await expect(page.locator('#openSim')).toBeAttached();
  await goStage(page, 'handover');
  await expect(page.locator('[data-comg="eicRef"]')).toBeAttached();
});

test('switching stages never resets the canvas, view or selection', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'compact');
  const before = await packState(page);
  expect(before.items).toBeGreaterThan(5);
  await page.evaluate(() => { const u = pack.photos[0].items.find((i) => i.type === 'unit'); sel = u.id; draw(); });
  for (const k of ALL) await goStage(page, k);
  const after = await packState(page);
  expect(after.photos).toBe(before.photos);
  expect(after.items).toBe(before.items);
  expect(after.zoom).toBe(before.zoom);
  expect(after.active).toBe(before.active);
  expect(await page.evaluate(() => sel)).not.toBeNull();
});

test('stage fields survive stage changes and refresh', async ({ page }) => {
  await openPlanner(page);
  await goStage(page, 'survey');
  await page.fill('#pkSiteName', 'Persistence Check');
  await page.fill('#pkClient', 'A Client');
  await page.fill('#pkAddr', '5 Test Way');
  await goStage(page, 'price');
  await goStage(page, 'survey');
  await expect(page.locator('#pkSiteName')).toHaveValue('Persistence Check');
  await expect(page.locator('#pkClient')).toHaveValue('A Client');
  await settleAutosave(page);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(900);
  const st = await packState(page);
  expect(st.name).toBe('Persistence Check');
  expect(st.custName).toBe('A Client');
  expect(st.address).toBe('5 Test Way');
  // a pack with content re-opens on the overview by design
  expect(st.sec).toBe('overview');
});

test('status dots and unresolved counts respond to real data', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'compact'); // commercial starter: chargers, routes, no survey fields
  await settleAutosave(page);
  let info = await stageInfo(page);
  expect(info.survey.st).toBe('prog');
  expect(info.survey.count).toBeGreaterThan(0);
  expect(['prog', 'ready']).toContain(info.design.st);
  // survey badge visible with the same number
  const badge = page.locator('#stagebar [data-stage="survey"] .stgn');
  await expect(badge).toBeVisible();
  await expect(badge).toHaveText(String(info.survey.count));
  // completing the missing fields clears them from the count
  await goStage(page, 'survey');
  await page.fill('#pkSiteName', 'Depot A');
  await page.fill('#pkAddr', '1 Way');
  await page.selectOption('#earthing', 'PME (TN-C-S)');
  await page.selectOption('#mainFuse', '200 A');
  await page.fill('#supplyRating', '3ph 400 A');
  await settleAutosave(page);
  info = await stageInfo(page);
  expect(info.survey.count).toBe(0);
  expect(['ready', 'done']).toContain(info.survey.st);
  await expect(badge).toBeHidden();
});

test('stage statuses use transparent wording and remain stable after refresh', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'compact');
  await goStage(page, 'design');
  const chipText = await page.locator('.stghead .stchip').textContent();
  expect(['Not started', 'In progress', 'Ready for review', 'Complete', 'Blocked']).toContain(chipText);
  const before = await stageInfo(page);
  await settleAutosave(page);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(900);
  const after = await stageInfo(page);
  for (const k of Object.keys(before)) {
    if (k.startsWith('_')) continue;
    expect(after[k].st, `stage ${k} status stable across refresh`).toBe(before[k].st);
  }
});

test('stage explanations are visible and inspectable', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'compact');
  await goStage(page, 'verify');
  // stage header explains the current status in words
  await expect(page.locator('.stghead .sh-why')).not.toBeEmpty();
  // stage button carries the same explanation for hover and screen readers
  const aria = await page.getAttribute('#stagebar [data-stage="verify"]', 'aria-label');
  expect(aria).toMatch(/Verify: (Not started|In progress|Ready for review|Complete|Blocked)/);
  const title = await page.getAttribute('#stagebar [data-stage="verify"]', 'title');
  expect(title.length).toBeGreaterThan(20);
});

test('legacy pack-panel section keys migrate to stages', async ({ page }) => {
  await openPlanner(page, {
    seed: (arg) => { localStorage.setItem('evsp_welcomed', '1'); localStorage.setItem('evsp_packsec', arg); },
    seedArg: 'checks',
  });
  // "checks" (old section) maps to the Install stage; fresh pack has no content
  // so boot keeps the migrated stage rather than forcing the overview.
  expect(await page.evaluate(() => packSec)).toBe('install');
});
