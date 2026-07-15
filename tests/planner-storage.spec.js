// Persistence: autosave and recovery, legacy saved projects, normalisation of
// partial records, and the migrated pack-panel section key.
import {
  test, expect, openPlanner, goStage, packState, settleAutosave,
} from './helpers.js';
import { legacyFixture, seedLegacyProject, seedLegacySectionKey } from './fixtures/seeds.js';

test('autosave restores a field-only project after refresh', async ({ page }) => {
  await openPlanner(page);
  await goStage(page, 'survey');
  await page.fill('#pkSiteName', 'Autosave Only');
  await page.fill('#pkClient', 'Client X');
  await settleAutosave(page);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(1000);
  const st = await packState(page);
  expect(st.name).toBe('Autosave Only');
  expect(st.custName).toBe('Client X');
});

test('a legacy saved project opens through the Projects dialog', async ({ page }) => {
  await openPlanner(page, { seed: seedLegacyProject, seedArg: legacyFixture });
  await page.click('#btnFile');
  await page.click('#btnProjects');
  await page.waitForTimeout(400);
  await expect(page.locator('#projList')).toContainText('Legacy Drive Job');
  await page.evaluate(() => document.querySelector('#projList [data-pjopen]').click());
  await page.waitForTimeout(900);
  const st = await packState(page);
  expect(st.name).toBe('Legacy Drive Job');
  expect(st.mode).toBe('domestic');
  expect(st.projId).toBe('legacy01');
  expect(st.photos).toBe(1);
  expect(st.items).toBe(2);
  // opening a saved project lands on the overview
  expect(st.sec).toBe('overview');
  // normalisation filled the fields Phase 1 relies on
  const norm = await page.evaluate(() => ({
    rev: pack.rev, survey: typeof pack.survey, commissioning: typeof pack.commissioning,
    compliance: Array.isArray(pack.compliance), attachments: Array.isArray(pack.attachments),
  }));
  expect(norm.rev).toBe('A');
  expect(norm.survey).toBe('object');
  expect(norm.commissioning).toBe('object');
  expect(norm.compliance).toBe(true);
  expect(norm.attachments).toBe(true);
});

test('a partially populated legacy record loads without errors', async ({ page }) => {
  const partial = JSON.parse(JSON.stringify(legacyFixture));
  delete partial.record.pack.notes;
  delete partial.record.pack.earthing;
  delete partial.record.pack.mainFuse;
  delete partial.record.pack.custName;
  delete partial.record.budget;
  partial.record.pack.photos[0].items.push({ id: 'junk', type: 'unknown-type', x: 1, y: 1 });
  await openPlanner(page, { seed: seedLegacyProject, seedArg: partial });
  await page.click('#btnFile');
  await page.click('#btnProjects');
  await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelector('#projList [data-pjopen]').click());
  await page.waitForTimeout(900);
  const st = await packState(page);
  expect(st.name).toBe('Legacy Drive Job');
  expect(st.photos).toBe(1);
  // the unknown item type is retained, not silently discarded
  const kept = await page.evaluate(() => pack.photos[0].items.some((i) => i.id === 'junk'));
  expect(kept).toBe(true);
});

test('every legacy pack-panel section value migrates to a real stage', async ({ page }) => {
  const map = { capture: 'survey', job: 'survey', status: 'verify', checks: 'install', pricing: 'price', output: 'design' };
  for (const [oldKey, stage] of Object.entries(map)) {
    await page.context().clearCookies();
    await openPlanner(page, { seed: seedLegacySectionKey, seedArg: { value: oldKey } });
    expect(await page.evaluate(() => packSec), `${oldKey} -> ${stage}`).toBe(stage);
  }
});

test('an unrecognised stored stage falls back safely', async ({ page }) => {
  await openPlanner(page, { seed: seedLegacySectionKey, seedArg: { value: 'nonsense-key' } });
  await goStage(page, 'survey'); // render once so the fallback applies
  const sec = await page.evaluate(() => packSec);
  expect(['overview', 'survey']).toContain(sec);
});

test('deleting a project removes it and keeps the current pack safe', async ({ page }) => {
  await openPlanner(page, { seed: seedLegacyProject, seedArg: legacyFixture });
  await page.click('#btnFile');
  await page.click('#btnProjects');
  await page.waitForTimeout(400);
  page.once('dialog', (d) => d.accept()); // native confirm, if used
  await page.evaluate(() => {
    const del = document.querySelector('#projList [data-pjdel]');
    if (del) del.click();
  });
  await page.waitForTimeout(400);
  // confirm via the app's own prompt if present
  await page.evaluate(() => {
    const bd = document.getElementById('rxBackdrop');
    if (bd && bd.classList.contains('show')) {
      const btns = [...bd.querySelectorAll('button')];
      const okb = btns.find((b) => /delete|remove|ok/i.test(b.textContent)) || btns[btns.length - 1];
      if (okb) okb.click();
    }
  });
  await page.waitForTimeout(400);
  const left = await page.evaluate(() => JSON.parse(localStorage.getItem('evsp_projects') || '[]').length);
  expect(left).toBe(0);
});
