// Accessibility smoke checks. Not a certification pass: these lock in the
// baseline (names, labels, focus, keyboard, dialog semantics, reduced motion)
// so regressions fail loudly.
import {
  test, expect, openPlanner, goStage, buildStarter,
} from './helpers.js';

test('stage navigation exposes labels, state and status in text', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'compact');
  await page.waitForTimeout(300);
  await expect(page.locator('#stagebar')).toHaveAttribute('aria-label', 'Project stages');
  const aria = await page.getAttribute('#stagebar [data-stage="survey"]', 'aria-label');
  expect(aria).toMatch(/^Survey: (Not started|In progress|Ready for review|Complete|Blocked)/);
  // status is not colour-only: the label carries the state and the count
  expect(aria).toMatch(/open item/);
  await goStage(page, 'design');
  await expect(page.locator('#stagebar [data-stage="design"]')).toHaveAttribute('aria-current', 'step');
});

test('every visible button has an accessible name', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'compact');
  for (const k of ['overview', 'survey', 'design', 'verify', 'price', 'plan', 'install', 'handover']) {
    await goStage(page, k);
    const nameless = await page.evaluate(() => [...document.querySelectorAll('button')]
      .filter((b) => b.offsetParent !== null)
      .filter((b) => !((b.getAttribute('aria-label') || b.title || b.textContent || '').trim()))
      .map((b) => b.id || b.className || b.outerHTML.slice(0, 60)));
    expect(nameless, `nameless buttons in ${k}`).toEqual([]);
  }
});

test('panel form inputs are labelled or described', async ({ page }) => {
  await openPlanner(page);
  await goStage(page, 'survey');
  const unlabelled = await page.evaluate(() => [...document.querySelectorAll(
    '#sideScroll input:not([type="checkbox"]):not([type="color"]):not([type="range"]), #sideScroll textarea, #sideScroll select',
  )]
    .filter((el) => el.offsetParent !== null)
    .filter((el) => {
      if (el.getAttribute('aria-label') || el.getAttribute('placeholder')) return false;
      let n = el.previousElementSibling;
      while (n && !['LABEL', 'INPUT', 'SELECT', 'TEXTAREA'].includes(n.tagName)) n = n.previousElementSibling;
      return !(n && n.tagName === 'LABEL');
    })
    .map((el) => el.id || el.name || el.outerHTML.slice(0, 50)));
  expect(unlabelled).toEqual([]);
});

test('keyboard users can reach and operate the stage navigation', async ({ page }) => {
  await openPlanner(page);
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  let reached = false;
  for (let i = 0; i < 50; i++) {
    await page.keyboard.press('Tab');
    const stage = await page.evaluate(() => (document.activeElement.dataset || {}).stage || '');
    if (stage === 'overview') { reached = true; break; }
  }
  expect(reached).toBe(true);
  // visible focus indicator on the focused stage button
  const ring = await page.evaluate(() => getComputedStyle(document.activeElement).boxShadow);
  expect(ring).not.toBe('none');
  // Enter activates it
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => packSec)).toBe('overview');
});

test('dialogs use dialog semantics and close on Escape', async ({ page }) => {
  await openPlanner(page);
  await page.click('#btnFile');
  await page.click('#btnProjects');
  await page.waitForTimeout(300);
  const dlg = page.locator('#projBackdrop .wlc');
  await expect(dlg).toHaveAttribute('role', 'dialog');
  await expect(dlg).toHaveAttribute('aria-modal', 'true');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await expect(page.locator('#projBackdrop')).not.toHaveClass(/show/);
  // welcome dialog too
  await page.evaluate(() => openWelcome());
  await page.waitForTimeout(200);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await expect(page.locator('#wlcBackdrop')).not.toHaveClass(/show/);
});

test('find palette opens with the keyboard and closes on Escape', async ({ page }) => {
  await openPlanner(page);
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(200);
  await expect(page.locator('#findBackdrop')).toHaveClass(/show/);
  // stage entries are searchable
  await page.keyboard.type('Stage: Verify');
  await page.waitForTimeout(250);
  await expect(page.locator('#findList')).toContainText('Stage: Verify');
  await page.keyboard.press('Escape');
  await expect(page.locator('#findBackdrop')).not.toHaveClass(/show/);
});

test('reduced-motion preference disables the card flash animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPlanner(page);
  const anim = await page.evaluate(() => {
    const el = document.createElement('div');
    el.className = 'flashcard';
    document.body.appendChild(el);
    const name = getComputedStyle(el).animationName;
    el.remove();
    return name;
  });
  expect(anim).toBe('none');
});

test('status chips pair colour with text everywhere', async ({ page }) => {
  await openPlanner(page);
  await buildStarter(page, 'compact');
  await goStage(page, 'overview');
  const chips = await page.locator('.ovrow .stchip').allTextContents();
  expect(chips.length).toBe(7);
  for (const c of chips) {
    expect(['Not started', 'In progress', 'Ready for review', 'Complete', 'Blocked']).toContain(c);
  }
});
