import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const planner = readFileSync(new URL('../public/EV Site Planner.html', import.meta.url), 'utf8');
const landing = readFileSync(new URL('../public/Landing Page Final.dc.html', import.meta.url), 'utf8');
const guide = readFileSync(new URL('../public/Guide Library.dc.html', import.meta.url), 'utf8');
const learning = readFileSync(new URL('../public/Learning Hub.dc.html', import.meta.url), 'utf8');

const heldBackPages = [
  'Business Hub.dc.html',
  'Council Estate Review.dc.html',
  'Estate Check Library.dc.html',
  'Estate Review One-Pager.dc.html',
  'Project Support.dc.html',
  'Quotes & Invoices.dc.html',
  'RAMS Builder.dc.html'
];

test('held-back feature source is versioned outside the deployment root', () => {
  for (const page of heldBackPages) {
    assert.equal(existsSync(`${root}/public/${page}`), false, `${page} is not deployable`);
    assert.equal(existsSync(`${root}/unreleased/public/${page}`), true, `${page} source is retained`);
  }
  assert.equal(existsSync(`${root}/public/_ds`), false);
  assert.equal(existsSync(`${root}/unreleased/public/_ds`), true);
  assert.equal(existsSync(`${root}/public/vendor/qrcode.js`), false);
  assert.equal(existsSync(`${root}/unreleased/public/vendor/qrcode.js`), true);
});

test('the released navigation exposes only the focused supporting tools', () => {
  const releasedNavigation = `${landing}\n${guide}\n${learning}`;
  for (const page of heldBackPages) {
    assert.doesNotMatch(releasedNavigation, new RegExp(page.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
  assert.match(releasedNavigation, /EV Site Planner\.html#showroom/);
  assert.match(releasedNavigation, /Guide Library\.dc\.html/);
  assert.match(releasedNavigation, /Learning Hub\.dc\.html/);
});

test('planner release flags keep future bridges dormant and retain a showroom deep link', () => {
  assert.match(planner, /const RELEASE_FLAGS=Object\.freeze\(\{quotes:false,projectSupport:false,estateReview:false,rams:false\}\)/);
  assert.match(planner, /\^#\(\?:showroom\|3d-showroom\)\$\/i\.test\(location\.hash\)/);
  assert.match(planner, /window\.openCharger3D\(\)/);
});

test('both configured hosts publish only the released public directory', () => {
  const pagesWorkflow = readFileSync(new URL('../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8');
  const netlify = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
  assert.match(pagesWorkflow, /path:\s*(?:\.\/)?public/);
  assert.match(netlify, /publish\s*=\s*"public"/);
});
