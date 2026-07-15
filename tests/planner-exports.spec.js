// Exports: each export control produces a real, non-empty download and leaves
// the project untouched. PDF content is not pixel-checked; size and absence of
// errors are the contract here.
import {
  test, expect, openPlanner, goStage, buildStarter, packState, settleAutosave,
} from './helpers.js';

async function downloadSize(download) {
  const path = await download.path();
  const { statSync } = await import('node:fs');
  return statSync(path).size;
}

async function confirmEngineerPdfDialog(page) {
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    const bd = document.getElementById('rxBackdrop');
    if (bd && bd.classList.contains('show')) {
      const btns = [...bd.querySelectorAll('button')];
      const okb = btns.find((b) => b.textContent.trim() === 'Download PDF');
      if (okb) okb.click();
    }
  });
}

test.describe('exports from a populated commercial pack', () => {
  test.beforeEach(async ({ page }) => {
    await openPlanner(page);
    await buildStarter(page, 'compact');
    await goStage(page, 'survey');
    await page.fill('#pkSiteName', 'Export Depot');
    await settleAutosave(page);
  });

  test('PNG export downloads the current plan', async ({ page }) => {
    const before = await packState(page);
    await page.click('#btnExport');
    const dl = page.waitForEvent('download', { timeout: 20_000 });
    await page.click('#btnPng');
    const d = await dl;
    expect(await downloadSize(d)).toBeGreaterThan(5_000);
    expect((await packState(page)).items).toBe(before.items);
  });

  test('engineer PDF builds through its review dialog', async ({ page }) => {
    const before = await packState(page);
    await page.click('#btnExport');
    const dl = page.waitForEvent('download', { timeout: 45_000 });
    await page.click('#btnPdf');
    await confirmEngineerPdfDialog(page);
    const d = await dl;
    expect(d.suggestedFilename()).toMatch(/\.pdf$/i);
    expect(await downloadSize(d)).toBeGreaterThan(20_000);
    expect((await packState(page)).items).toBe(before.items);
  });

  test('cable schedule CSV downloads with the run table', async ({ page }) => {
    await page.click('#btnExport');
    const dl = page.waitForEvent('download', { timeout: 20_000 });
    await page.click('#btnCsv');
    const d = await dl;
    expect(d.suggestedFilename()).toMatch(/\.csv$/i);
    expect(await downloadSize(d)).toBeGreaterThan(50);
  });

  test('DNO application dialog compiles and downloads as text', async ({ page }) => {
    await page.click('#btnExport');
    await page.click('#btnDno');
    await page.waitForTimeout(500);
    await expect(page.locator('#dnoBackdrop')).toHaveClass(/show/);
    await expect(page.locator('#dnoBody')).not.toBeEmpty();
    const dl = page.waitForEvent('download', { timeout: 20_000 });
    await page.click('#dnoTxt');
    const d = await dl;
    expect(await downloadSize(d)).toBeGreaterThan(100);
    await page.click('#dnoClose');
  });

  test('job programme dialog opens and prints to PDF', async ({ page }) => {
    await page.click('#btnExport');
    await page.click('#btnProg');
    await page.waitForTimeout(500);
    await expect(page.locator('#progBackdrop')).toHaveClass(/show/);
    await expect(page.locator('#progBody')).not.toBeEmpty();
    const dl = page.waitForEvent('download', { timeout: 30_000 });
    await page.click('#progPdf');
    const d = await dl;
    expect(d.suggestedFilename()).toMatch(/\.pdf$/i);
    expect(await downloadSize(d)).toBeGreaterThan(5_000);
  });

  test('materials list opens from the Plan stage with wholesaler actions', async ({ page }) => {
    await goStage(page, 'plan');
    await page.click('#openBom');
    await page.waitForTimeout(600);
    const dialog = page.locator('#bomBackdrop');
    await expect(dialog).toHaveClass(/show/);
    await expect(dialog.locator('#bomBody')).not.toBeEmpty();
    const dl = page.waitForEvent('download', { timeout: 20_000 });
    await page.click('#bomCsv');
    const d = await dl;
    expect(d.suggestedFilename()).toMatch(/\.csv$/i);
    expect(await downloadSize(d)).toBeGreaterThan(50);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toHaveClass(/show/);
  });

  test('decision pack downloads as a self-contained HTML file', async ({ page }) => {
    await page.click('#btnExport');
    const dl = page.waitForEvent('download', { timeout: 30_000 });
    await page.click('#btnWebPack');
    const d = await dl;
    expect(d.suggestedFilename()).toMatch(/\.html$/i);
    expect(await downloadSize(d)).toBeGreaterThan(20_000);
  });

  test('handover certificate builds once commissioning data exists', async ({ page }) => {
    await goStage(page, 'handover');
    // record minimal commissioning data on the first charger
    await page.evaluate(() => {
      const first = commUnits()[0];
      const r = commRec(first.it.id);
      r.serial = 'SN-001'; r.zs = '0.31'; r.rcd = '24'; r.pen = true;
      evalMarkDirty(); renderSide();
    });
    const dl = page.waitForEvent('download', { timeout: 30_000 });
    await page.click('#btnHandover2');
    const d = await dl;
    expect(d.suggestedFilename()).toMatch(/\.pdf$/i);
    expect(await downloadSize(d)).toBeGreaterThan(5_000);
  });
});
