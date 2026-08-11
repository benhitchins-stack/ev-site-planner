// Guided survey: shot list interaction, the full-screen site walk,
// progress persistence and the effect on stage status.
import { fileURLToPath } from 'node:url';
import {
  test, expect, openPlanner, goStage, addFixturePhoto, stageInfo, settleAutosave,
} from './helpers.js';

const FIXTURE = fileURLToPath(new URL('./fixtures/site-photo.png', import.meta.url));

async function expandGuidedSurvey(page) {
  await goStage(page, 'survey');
  const tog = page.locator('[data-survtoggle]');
  const open = await page.locator('[data-walk], [data-shotna]').first().isVisible().catch(() => false);
  if (!open) { await tog.click(); await page.waitForTimeout(250); }
}

test('shot list: file the current photo and mark another not applicable', async ({ page }) => {
  await openPlanner(page);
  await addFixturePhoto(page, FIXTURE);
  await expandGuidedSurvey(page);
  const total = await page.locator('[data-shotna]').count();
  expect(total).toBeGreaterThan(4);
  // file the open photo as the first shot
  await page.locator('[data-shotcur]').first().click();
  await page.waitForTimeout(300);
  // mark the next outstanding shot not applicable
  await page.locator('[data-shotna]').first().click();
  await page.waitForTimeout(300);
  const sp = await page.evaluate(() => surveyProgress());
  expect(sp.done).toBeGreaterThanOrEqual(2); // filed + n/a both count toward done
  expect(sp.captured).toBe(1);
  expect(sp.na).toBe(1);
});

test('survey progress persists across reload and feeds the stage status', async ({ page }) => {
  await openPlanner(page);
  await addFixturePhoto(page, FIXTURE);
  await expandGuidedSurvey(page);
  await page.locator('[data-shotcur]').first().click();
  await settleAutosave(page);
  const before = await page.evaluate(() => surveyProgress());
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(1000);
  const after = await page.evaluate(() => surveyProgress());
  expect(after.done).toBe(before.done);
  expect(after.started).toBe(true);
  const info = await stageInfo(page);
  // an unfinished started survey is reflected in the survey stage reasons/issues
  const surveyIssue = info._issues.find((i) => i.title === 'Guided survey incomplete');
  expect(surveyIssue).toBeTruthy();
  expect(surveyIssue.sev).toBe('adv');
});

test('the full-screen site walk opens, closes and leaves state intact', async ({ page }) => {
  await openPlanner(page);
  await addFixturePhoto(page, FIXTURE);
  await expandGuidedSurvey(page);
  await page.locator('[data-walk]').click();
  await page.waitForTimeout(500);
  const open = await page.evaluate(() => {
    const w = document.querySelector('.walk');
    return !!(w && w.classList.contains('show'));
  });
  expect(open).toBe(true);
  // Escape closes the walk (its own handler)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const closed = await page.evaluate(() => {
    const w = document.querySelector('.walk');
    return !(w && w.classList.contains('show'));
  });
  expect(closed).toBe(true);
  // photos and shot filing unaffected by opening and closing the walk
  expect(await page.evaluate(() => pack.photos.length)).toBe(1);
});

test('completing every shot marks the guided survey complete', async ({ page }) => {
  await openPlanner(page);
  await addFixturePhoto(page, FIXTURE);
  await expandGuidedSurvey(page);
  await page.locator('[data-shotcur]').first().click();
  await page.waitForTimeout(250);
  // mark every remaining pending shot n/a (rows still offering "Add")
  for (let i = 0; i < 12; i++) {
    const na = page.locator('.needrow:has([data-shotadd]) [data-shotna]').first();
    if (!(await na.isVisible().catch(() => false))) break;
    await na.click();
    await page.waitForTimeout(180);
  }
  const sp = await page.evaluate(() => surveyProgress());
  expect(sp.done).toBe(sp.total);
  await expect(page.locator('h3:has-text("Guided survey")')).toContainText('Complete');
});
