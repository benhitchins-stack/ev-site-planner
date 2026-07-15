// Shared helpers for the EV Site Planner Playwright suite.
//
// Every test gets an automatic console guard: any uncaught page error or
// console.error fails the test unless it matches the documented allowlist.
// External network calls are stubbed so results do not depend on internet
// access (the app itself is fully self-hosted; only the optional postcode
// lookup calls out).
import { test as base, expect } from '@playwright/test';

export const PLANNER_PATH = '/EV%20Site%20Planner.html';

// Documented harmless messages. Keep this list short and explicit; anything
// else that appears in the console fails the test that produced it.
const HARMLESS_CONSOLE = [
  // (none currently known)
];

export const test = base.extend({
  consoleErrors: [
    async ({ page, context }, use) => {
      const errors = [];
      // The suite is self-hosted; the only outbound call is the optional
      // postcode lookup. Stub it (and block anything else external) so tests
      // behave identically with and without internet access.
      await context.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (route) => {
        const url = route.request().url();
        if (/postcodes\.io/.test(url)) {
          return route.fulfill({ json: { status: 200, result: [] } });
        }
        return route.abort();
      });
      page.on('console', (m) => {
        if (m.type() !== 'error') return;
        const text = m.text();
        if (HARMLESS_CONSOLE.some((rx) => rx.test(text))) return;
        // Aborted stubbed network fetches surface as console errors in
        // Chromium ("Failed to load resource: net::ERR_FAILED"); those are
        // an artefact of the offline stub, not an application defect.
        if (/net::ERR_FAILED|Failed to load resource/.test(text)) return;
        errors.push(text.slice(0, 400));
      });
      page.on('pageerror', (e) => errors.push('pageerror: ' + String(e.message).slice(0, 400)));
      await use(errors);
      expect(errors, 'unexpected browser console errors').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Open the planner with a clean profile. Options:
 *  - welcomed: pre-dismiss the first-run welcome dialog (default true)
 *  - seed: function serialised into an init script to pre-populate storage
 *  - seedArg: JSON-safe argument passed to the seed function
 */
export async function openPlanner(page, { welcomed = true, seed = null, seedArg = undefined } = {}) {
  if (welcomed) {
    await page.addInitScript(() => {
      try { localStorage.setItem('evsp_welcomed', '1'); } catch (_) {}
    });
  }
  if (seed) await page.addInitScript(seed, seedArg);
  await page.goto(PLANNER_PATH, { waitUntil: 'load' });
  await page.waitForSelector('#stagebar [data-stage="overview"]', { state: 'attached' });
  await page.waitForTimeout(400); // boot settles (autosave restore, rail build)
}

/** Dismiss the welcome dialog by choosing a mode (or skip). */
export async function chooseMode(page, mode) {
  const backdrop = page.locator('#wlcBackdrop');
  if (!(await backdrop.evaluate((el) => el.classList.contains('show')).catch(() => false))) return;
  if (mode) await page.click(`#wlcBackdrop [data-wmode="${mode}"]`);
  await page.click(mode ? '#wlcGo' : '#wlcSkip');
  await page.waitForTimeout(200);
}

/** Click a stage in the stage bar. */
export async function goStage(page, stage) {
  await page.click(`#stagebar [data-stage="${stage}"]`);
  await page.waitForTimeout(150);
}

/** Compact snapshot of live application state, read from the page. */
export function packState(page) {
  return page.evaluate(() => ({
    sec: packSec,
    sideTab,
    name: pack.name,
    mode: pack.mode,
    projId: pack.projId || null,
    photos: pack.photos.length,
    items: pack.photos.reduce((s, p) => s + p.items.length, 0),
    active: pack.active,
    zoom: +(+view.zoom).toFixed(4),
    custName: pack.custName,
    address: pack.address,
    earthing: pack.earthing,
    mainFuse: pack.mainFuse,
  }));
}

/** Read the evaluated stage info from the page (status engine output). */
export function stageInfo(page) {
  return page.evaluate(() => {
    const e = evalProject();
    const out = {};
    for (const [k, v] of Object.entries(e.stages)) out[k] = { st: v.st, count: v.count, why: v.why };
    out._issues = e.issues.map((i) => ({ sev: i.sev, stage: i.stage, title: i.title, act: i.act }));
    out._next = e.next ? { title: e.next.title, stage: e.next.stage, act: e.next.act } : null;
    return out;
  });
}

/** Create a starter layout. Domestic builds directly; commercial opens the preset picker. */
export async function buildStarter(page, preset = 'compact') {
  const mode = await page.evaluate(() => pack.mode);
  await page.click('#stagebar [data-stage="survey"]');
  await page.waitForTimeout(120);
  await page.click('#addStarter');
  await page.waitForTimeout(350);
  if (mode !== 'domestic') {
    await page.click(`[data-spk="${preset}"]`);
  }
  await page.waitForTimeout(900);
}

/** Add the committed fixture photo through the real file input. */
export async function addFixturePhoto(page, fixturePath) {
  await page.setInputFiles('#filePhoto', fixturePath);
  await page.waitForTimeout(900);
}

/** Select a drawing tool from the rail, opening its category first. */
export async function pickTool(page, category, toolSelector) {
  await page.evaluate((cat) => {
    const tab = document.querySelector(`.cattab[data-cat="${cat}"]`);
    if (tab && !tab.classList.contains('on')) tab.click();
  }, category);
  await page.waitForTimeout(150);
  await page.click(`#rail ${toolSelector}`);
  await page.waitForTimeout(120);
}

/** Canvas centre in page coordinates, with optional offset. */
export async function canvasPoint(page, dx = 0, dy = 0) {
  const bb = await page.locator('#cv').boundingBox();
  return { x: bb.x + bb.width / 2 + dx, y: bb.y + bb.height / 2 + dy };
}

/** Wait for the debounced autosave (700 ms) plus a safety margin. */
export async function settleAutosave(page) {
  await page.waitForTimeout(1100);
}

/** Dismiss any open prompt dialog (rxBackdrop) via its first button. */
export async function dismissPrompt(page) {
  await page.evaluate(() => {
    const bd = document.getElementById('rxBackdrop');
    if (bd && bd.classList.contains('show')) {
      const b = bd.querySelector('button');
      if (b) b.click();
    }
  });
  await page.waitForTimeout(150);
}
