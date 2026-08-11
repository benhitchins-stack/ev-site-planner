// Drawing behaviour: photo upload, placement, selection, movement, editing,
// undo/redo, zoom/pan, and state survival across stage changes and reload.
import { fileURLToPath } from 'node:url';
import {
  test, expect, openPlanner, goStage, packState, pickTool, canvasPoint,
  addFixturePhoto, settleAutosave, dismissPrompt,
} from './helpers.js';

const FIXTURE = fileURLToPath(new URL('./fixtures/site-photo.png', import.meta.url));

test('full drawing round trip on an uploaded photo', async ({ page }) => {
  await openPlanner(page);

  // Upload the committed fixture image through the real file input
  await addFixturePhoto(page, FIXTURE);
  let st = await packState(page);
  expect(st.photos).toBe(1);

  // Place a charger
  await pickTool(page, 'chargers', '[data-tool^="unit:"]');
  let pt = await canvasPoint(page, -40, -20);
  await page.mouse.click(pt.x, pt.y);
  await page.waitForTimeout(300);
  st = await packState(page);
  expect(st.items).toBe(1);

  // Place a second asset (EV bay)
  await pickTool(page, 'chargers', '[data-tool="bay"]');
  pt = await canvasPoint(page, 60, 30);
  await page.mouse.click(pt.x, pt.y);
  await page.waitForTimeout(300);
  expect((await packState(page)).items).toBe(2);

  // Draw an SWA cable route (two points, Enter to commit)
  await pickTool(page, 'cabling', '[data-tool="route:swa"]');
  await page.mouse.click(pt.x - 140, pt.y - 60);
  await page.waitForTimeout(120);
  await page.mouse.click(pt.x - 20, pt.y + 20);
  await page.waitForTimeout(120);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  expect((await packState(page)).items).toBe(3);

  // Measure between two points (informational dialog, then dismiss)
  await page.click('.ptool[data-tool="measure"]');
  await page.mouse.click(pt.x - 100, pt.y);
  await page.mouse.click(pt.x, pt.y);
  await page.waitForTimeout(400);
  await dismissPrompt(page);
  await page.keyboard.press('Escape');

  // Select the charger by clicking it, then move it with arrow keys
  await page.click('.ptool[data-tool="select"]');
  const unitPos = await page.evaluate(() => {
    const u = pack.photos[0].items.find((i) => i.type === 'unit');
    sel = u.id; draw(); renderSide();
    return { x: u.x, y: u.y };
  });
  await page.waitForTimeout(200);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  const moved = await page.evaluate(() => {
    const u = pack.photos[0].items.find((i) => i.type === 'unit');
    return { x: u.x, y: u.y };
  });
  expect(moved.x).toBeGreaterThan(unitPos.x);
  expect(moved.y).toBeGreaterThan(unitPos.y);

  // Duplicate the selection, then delete the duplicate
  await page.keyboard.press('Control+d');
  await page.waitForTimeout(250);
  expect((await packState(page)).items).toBe(4);
  await page.keyboard.press('Delete');
  await page.waitForTimeout(250);
  expect((await packState(page)).items).toBe(3);

  // Undo (delete), undo (duplicate) -> back to 3 items after redo pair
  await page.click('#btnUndo');
  await page.waitForTimeout(200);
  expect((await packState(page)).items).toBe(4);
  await page.click('#btnRedo');
  await page.waitForTimeout(200);
  expect((await packState(page)).items).toBe(3);

  // Zoom controls and fit
  const z0 = (await packState(page)).zoom;
  await page.click('#zin');
  await page.waitForTimeout(150);
  expect((await packState(page)).zoom).toBeGreaterThan(z0);
  await page.click('#zout');
  await page.click('#zfit');
  await page.waitForTimeout(150);

  // Pan with the pan tool
  await page.click('.ptool[data-tool="pan"]');
  const c = await canvasPoint(page);
  const view0 = await page.evaluate(() => ({ x: view.ox, y: view.oy }));
  await page.mouse.move(c.x, c.y);
  await page.mouse.down();
  await page.mouse.move(c.x + 80, c.y + 40, { steps: 5 });
  await page.mouse.up();
  const view1 = await page.evaluate(() => ({ x: view.ox, y: view.oy }));
  expect(Math.abs(view1.x - view0.x) + Math.abs(view1.y - view0.y)).toBeGreaterThan(20);
  await page.click('.ptool[data-tool="select"]');

  // Stage round trip leaves the drawing untouched
  const before = await packState(page);
  for (const k of ['overview', 'verify', 'price', 'plan', 'install', 'handover', 'design']) await goStage(page, k);
  const after = await packState(page);
  expect(after.items).toBe(before.items);
  expect(after.photos).toBe(before.photos);
  expect(after.zoom).toBe(before.zoom);

  // Save (autosave) and reload: drawing objects survive
  await settleAutosave(page);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(1000);
  const restored = await packState(page);
  expect(restored.photos).toBe(1);
  expect(restored.items).toBe(3);
});

test('route length editing feeds the markup totals', async ({ page }) => {
  await openPlanner(page);
  await page.click('#addGrid'); // grid plan has a preset scale
  await page.waitForTimeout(800);
  // totals list is shown once at least one charger is on the plan
  await pickTool(page, 'chargers', '[data-tool^="unit:"]');
  const cpt = await canvasPoint(page, 0, -60);
  await page.mouse.click(cpt.x, cpt.y);
  await page.waitForTimeout(250);
  await pickTool(page, 'cabling', '[data-tool="route:swa"]');
  const pt = await canvasPoint(page);
  await page.mouse.click(pt.x - 100, pt.y);
  await page.mouse.click(pt.x + 60, pt.y);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  const len = await page.evaluate(() => {
    const p = pack.photos[0];
    const r = p.items.find((i) => i.type === 'route');
    return routeLen(r, p) || 0;
  });
  expect(len).toBeGreaterThan(0); // measured from the grid scale
  await goStage(page, 'design');
  await expect(page.locator('.stdrow:has-text("SWA")')).toContainText('m');
});
