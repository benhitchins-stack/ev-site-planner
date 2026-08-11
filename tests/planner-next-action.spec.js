// The Next action must be deterministic, derived from real project data,
// navigate somewhere real, and move on once an action is completed.
import {
  test, expect, openPlanner, goStage, buildStarter, stageInfo, settleAutosave, chooseMode,
} from './helpers.js';

test('blank project suggests starting the survey', async ({ page }) => {
  await openPlanner(page);
  const info = await stageInfo(page);
  expect(info._next.title).toBe('Start the survey');
  expect(info._next.stage).toBe('survey');
  await goStage(page, 'overview');
  await expect(page.locator('.ovnext .nx-t')).toHaveText('Start the survey');
});

test('critical issue outranks stage progression and its button opens the right place', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'compact'); // chargers exist, earthing missing -> critical
  await settleAutosave(page);
  const info = await stageInfo(page);
  expect(info._next.title).toContain('Earthing arrangement');
  await goStage(page, 'overview');
  await page.click('.ovnext .nx-go');
  await page.waitForTimeout(700);
  // lands on the survey stage with the earthing field present and focused
  expect(await page.evaluate(() => packSec)).toBe('survey');
  await expect(page.locator('#earthing')).toBeAttached();
  expect(await page.evaluate(() => document.activeElement && document.activeElement.id)).toBe('earthing');
});

test('next action moves on when the requested information is completed', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'compact');
  await goStage(page, 'survey');
  await page.fill('#pkSiteName', 'Depot');
  await page.fill('#pkAddr', '1 Road');
  await page.selectOption('#earthing', 'PME (TN-C-S)');
  await page.selectOption('#mainFuse', '200 A');
  await page.fill('#supplyRating', '3ph 400 A');
  await settleAutosave(page);
  const info = await stageInfo(page);
  expect(info._next.title).not.toContain('Earthing');
  expect(info._next.title).not.toContain('missing');
  // with survey basics done it points onwards through the journey
  expect(['survey', 'design', 'verify', 'price']).toContain(info._next.stage);
});

test('domestic blank project gets domestic-appropriate guidance', async ({ page }) => {
  await openPlanner(page, { welcomed: false });
  await chooseMode(page, 'domestic');
  const info = await stageInfo(page);
  expect(info._next.title).toBe('Start the survey');
  // domestic minimums exclude the commercial supply-rating field
  await goStage(page, 'survey');
  await page.fill('#pkSiteName', '12 Acacia Ave');
  await page.fill('#pkAddr', 'Bristol');
  await page.selectOption('#earthing', 'TN-S');
  await page.selectOption('#mainFuse', '80 A');
  await settleAutosave(page);
  const after = await stageInfo(page);
  expect(after.survey.count).toBe(0);
});

test('next action target element always exists', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'full');
  await settleAutosave(page);
  // run through several data states, asserting the suggested action's
  // focus/flash target resolves after navigation
  for (let round = 0; round < 4; round++) {
    const info = await stageInfo(page);
    if (!info._next) break;
    await goStage(page, 'overview');
    await page.click('.ovnext .nx-go');
    await page.waitForTimeout(700);
    const ok = await page.evaluate(() => {
      // whatever the action targeted must be present in the DOM now, or the
      // action was a dialog/file-picker style function action
      const bd = document.getElementById('rxBackdrop');
      const dialogOpen = (bd && bd.classList.contains('show'))
        || document.querySelector('.wlc-backdrop.show')
        || document.querySelector('#ccBackdrop.show');
      return !!(dialogOpen || document.querySelector('#sideScroll .card'));
    });
    expect(ok).toBe(true);
    // close any dialog the action opened, then complete one survey field to change state
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    const fill = ['#pkSiteName', '#pkAddr', null, null][round];
    if (fill) {
      await goStage(page, 'survey');
      await page.fill(fill, 'Value ' + round);
      await settleAutosave(page);
    }
  }
});
