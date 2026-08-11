// Starter layouts: domestic and commercial presets create real content,
// statuses respond, and the result survives save and reload.
import {
  test, expect, openPlanner, chooseMode, buildStarter, packState, stageInfo, settleAutosave,
} from './helpers.js';

test('commercial starter (full) builds a populated, usable plan', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'full');
  const st = await packState(page);
  expect(st.photos).toBe(1);
  expect(st.items).toBeGreaterThan(20);
  const counts = await page.evaluate(() => ({
    units: pack.photos[0].items.filter((i) => i.type === 'unit').length,
    bays: pack.photos[0].items.filter((i) => i.type === 'bay').length,
    feeders: pack.photos[0].items.filter((i) => i.type === 'feeder').length,
    scaled: !!(pack.photos[0].scale && pack.photos[0].scale.pxPerM),
  }));
  expect(counts.units).toBeGreaterThan(2);
  expect(counts.bays).toBeGreaterThan(4);
  expect(counts.feeders).toBe(1);
  expect(counts.scaled).toBe(true);
  const info = await stageInfo(page);
  expect(['prog', 'ready']).toContain(info.design.st);
  expect(info.handover.why.join(' ')).toMatch(/awaiting commissioning/);
});

test('domestic starter builds directly without the preset picker', async ({ page }) => {
  await openPlanner(page, { welcomed: false });
  await chooseMode(page, 'domestic');
  await buildStarter(page);
  const st = await packState(page);
  expect(st.mode).toBe('domestic');
  expect(st.photos).toBe(1);
  expect(st.items).toBeGreaterThan(5);
  const hasCharger = await page.evaluate(() => pack.photos[0].items.some((i) => i.type === 'unit'));
  expect(hasCharger).toBe(true);
});

test('a second starter adds a new plan rather than duplicating in place', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'compact');
  const first = await packState(page);
  await buildStarter(page, 'rapid');
  const second = await packState(page);
  expect(second.photos).toBe(first.photos + 1);
  expect(second.items).toBeGreaterThan(first.items);
});

test('starter content survives save and reload', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'compact');
  const before = await packState(page);
  await settleAutosave(page);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(1000);
  const after = await packState(page);
  expect(after.photos).toBe(before.photos);
  expect(after.items).toBe(before.items);
  // canvas still usable: zoom responds
  const z0 = after.zoom;
  await page.click('#zin');
  await page.waitForTimeout(150);
  expect((await packState(page)).zoom).toBeGreaterThan(z0);
});
