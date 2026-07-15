// Application boot: routing, planner shell, stage navigation, overview.
// The console guard in helpers.js fails any test that produces a browser
// console error or uncaught exception.
import { test, expect, openPlanner, PLANNER_PATH, goStage } from './helpers.js';

test.describe('boot', () => {
  test('root URL routes to the landing page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForURL(/Landing%20Page%20Final\.dc\.html/, { timeout: 10_000 });
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('planner opens with its main controls', async ({ page }) => {
    await openPlanner(page);
    // Header globals
    await expect(page.locator('header .logo')).toBeVisible();
    await expect(page.locator('#btnExport')).toBeVisible();
    await expect(page.locator('#btnUndo')).toBeAttached();
    await expect(page.locator('#btnRedo')).toBeAttached();
    await expect(page.locator('#btnFind')).toBeAttached();
    // Workspace
    await expect(page.locator('#catbar')).toBeVisible();
    await expect(page.locator('#cv')).toBeAttached();
    await expect(page.locator('#side')).toBeAttached();
    // Stage navigation: Overview + 7 stages
    const stages = await page.$$eval('#stagebar [data-stage]', (els) => els.map((e) => e.dataset.stage));
    expect(stages).toEqual(['overview', 'survey', 'design', 'verify', 'price', 'plan', 'install', 'handover']);
  });

  test('welcome dialog shows on first run and picks a mode', async ({ page }) => {
    await openPlanner(page, { welcomed: false });
    await expect(page.locator('#wlcBackdrop')).toHaveClass(/show/);
    await page.click('#wlcBackdrop [data-wmode="domestic"]');
    await page.click('#wlcGo');
    await expect(page.locator('#wlcBackdrop')).not.toHaveClass(/show/);
    expect(await page.evaluate(() => pack.mode)).toBe('domestic');
    // choice is remembered
    expect(await page.evaluate(() => localStorage.getItem('evsp_welcomed'))).toBe('1');
  });

  test('fresh pack opens at the Survey stage with an overview available', async ({ page }) => {
    await openPlanner(page);
    expect(await page.evaluate(() => packSec)).toBe('survey');
    await goStage(page, 'overview');
    await expect(page.locator('.stghead .sh-top b').first()).toContainText('Untitled project');
    await expect(page.locator('.ovnext .nx-t')).toBeVisible(); // next action present
  });

  test('planner boots without console errors on a cold profile', async ({ page }) => {
    await openPlanner(page, { welcomed: false });
    await page.waitForTimeout(800);
    // guard fixture asserts on teardown
  });

  test('File > New keeps the working mode and syncs the mode chrome', async ({ page }) => {
    await openPlanner(page, { welcomed: false });
    await page.click('#wlcBackdrop [data-wmode="domestic"]');
    await page.click('#wlcGo');
    await page.waitForTimeout(200);
    await page.click('#addStarter'); // domestic starter, no picker
    await page.waitForTimeout(900);
    await page.click('#btnFile');
    await page.click('#btnNew');
    await page.waitForTimeout(400);
    // confirm the "start a new survey" prompt
    await page.evaluate(() => {
      const bd = document.getElementById('sheetBackdrop');
      if (bd && bd.classList.contains('show')) {
        const b = [...bd.querySelectorAll('button')].find((x) => /start new/i.test(x.textContent));
        if (b) b.click();
      }
    });
    await page.waitForTimeout(500);
    // the new pack keeps domestic mode and the chrome agrees with it
    expect(await page.evaluate(() => pack.mode)).toBe('domestic');
    expect(await page.evaluate(() => pack.photos.length)).toBe(0);
    await expect(page.locator('#modeSub')).toContainText(/home charging/i);
    await expect(page.locator('#modeSeg [data-mode="domestic"]')).toHaveClass(/on/);
    // domestic charger tools in the rail, not commercial ones
    await expect(page.locator('#rail [data-tool="unit:unteth_wall"]')).toBeAttached();
  });
});
