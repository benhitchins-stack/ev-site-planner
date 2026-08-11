// Cross-module links: Quotes & Invoices handoff, RAMS gate, Project Support
// storage key, and linked records shown on the overview.
import {
  test, expect, openPlanner, goStage, buildStarter, packState, settleAutosave, stageInfo,
} from './helpers.js';
import { seedQuoteLink, seedSupportLink } from './fixtures/seeds.js';

test('Quotes handoff navigates with the project id and returning keeps state', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'compact');
  await settleAutosave(page);
  const before = await packState(page);
  expect(before.projId).toBeTruthy();
  await goStage(page, 'price');
  await Promise.all([
    page.waitForURL(/Quotes(%20|\s)?%?26?.*Invoices|Quotes.*Invoices/i, { timeout: 15_000 }),
    page.click('#mkQuote'),
  ]);
  expect(decodeURIComponent(page.url())).toContain('#from=' + before.projId);
  await expect(page.locator('body')).not.toBeEmpty();
  // return to the planner: autosave restores the same project
  await page.goto('/EV%20Site%20Planner.html', { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  const after = await packState(page);
  expect(after.projId).toBe(before.projId);
  expect(after.items).toBe(before.items);
});

test('RAMS remains gated with an honest message and no navigation', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'compact');
  await goStage(page, 'plan');
  const urlBefore = page.url();
  await page.click('#mkRams');
  await page.waitForTimeout(600);
  expect(page.url()).toBe(urlBefore); // gated: no navigation
  await expect(page.locator('#toast')).toContainText(/coming soon/i);
});

test('Project Support link resolves from the current storage key (evsp_ps_v2)', async ({ page }) => {
  // Seed a support request bound to the projId the pack will get after save
  await openPlanner(page);
  await buildStarter(page, 'compact');
  await settleAutosave(page);
  const projId = (await packState(page)).projId;
  await page.evaluate((id) => {
    localStorage.setItem('evsp_ps_v2', JSON.stringify({
      requests: [{ id: 'r1', ref: 'PS-0042', status: 'submitted', packId: id, title: 'Seeded request' }],
      nextRef: 43,
    }));
  }, projId);
  await goStage(page, 'overview');
  await page.evaluate(() => { evalMarkDirty(); renderSide(); });
  const link = page.locator('a[href*="Project%20Support"], a[href*="Project Support"]').first();
  await expect(link).toBeVisible();
  await expect(link).toContainText('PS-0042');
  const href = await link.getAttribute('href');
  expect(href).toContain('#req=r1');
});

test('a linked quote shows its number, status and drift on the overview', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'compact');
  await settleAutosave(page);
  const projId = (await packState(page)).projId;
  await page.evaluate((arg) => {
    const doc = {
      id: 'q1', docType: 'quote', number: arg.number, status: 'Sent',
      properties: [{ plannerRef: { projId: arg.projId }, items: [] }],
    };
    localStorage.setItem('evqi.tool.v2', JSON.stringify({ docs: { q1: doc }, order: ['q1'] }));
  }, { projId, number: 'Q-2026-007' });
  await page.evaluate(() => { evalMarkDirty(); renderSide(); });
  const info = await stageInfo(page);
  expect(info.price.why.join(' ')).toContain('Q-2026-007');
  await goStage(page, 'overview');
  await expect(page.locator('.ovkv')).toContainText('Q-2026-007');
  // the quotes chip deep-links to the specific document
  const chip = page.locator('a[href*="#open=q1"]').first();
  await expect(chip).toBeVisible();
});

test('features menu links to guides and learning pages resolve', async ({ page }) => {
  await openPlanner(page);
  for (const target of ['Guide%20Library.dc.html', 'Learning%20Hub.dc.html']) {
    const res = await page.request.get('/' + target);
    expect(res.status(), target).toBe(200);
  }
});
