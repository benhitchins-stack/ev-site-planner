import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const pages = readdirSync(publicDir).filter(name => name.endsWith('.html')).sort();
const parseableTypes = new Set(['', 'text/javascript', 'application/javascript', 'text/x-dc', 'text/babel']);

test('every deployable page has syntactically valid first-party inline scripts', () => {
  const failures = [];
  let parsed = 0;
  for (const name of pages) {
    const html = readFileSync(resolve(publicDir, name), 'utf8');
    const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)];
    scripts.forEach((match, index) => {
      const attributes = match[1] || '';
      if (/\bsrc\s*=/i.test(attributes)) return;
      const type = (attributes.match(/\btype=["']([^"']+)["']/i)?.[1] || '').toLowerCase();
      if (!parseableTypes.has(type)) return;
      try {
        new vm.Script(match[2], { filename: `${name}:inline-${index + 1}.js` });
        parsed += 1;
      } catch (error) {
        failures.push(`${name} inline script ${index + 1}: ${error.message.split('\n')[0]}`);
      }
    });
  }
  assert.ok(parsed >= pages.length, `expected scripts across ${pages.length} pages, parsed ${parsed}`);
  assert.deepEqual(failures, []);
});

test('literal local page resources resolve inside the deployed public directory', () => {
  const missing = [];
  for (const name of pages) {
    const pagePath = resolve(publicDir, name);
    const html = readFileSync(pagePath, 'utf8').replace(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi, '');
    for (const match of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)) {
      let value = match[1].trim().replaceAll('&amp;', '&');
      if (!value || /[{$}]/.test(value) || /^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(value)) continue;
      value = value.split(/[?#]/)[0];
      if (!value) continue;
      const target = resolve(dirname(pagePath), decodeURIComponent(value));
      if (!existsSync(target)) missing.push(`${name}: ${value}`);
    }
  }
  assert.deepEqual(missing, []);
});

const pngSize = file => { const png = readFileSync(file); return `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`; };

test('the planner can be added to a home screen with its own name, colours and icons', () => {
  const manifest = JSON.parse(readFileSync(resolve(publicDir, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.name, 'EV Site Planner');
  assert.ok(manifest.short_name.length <= 12, 'the home screen label fits under the icon');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.theme_color, '#122B3E');
  for (const icon of manifest.icons) {
    const file = resolve(publicDir, icon.src);
    assert.ok(existsSync(file), icon.src);
    if (icon.type === 'image/png') assert.equal(pngSize(file), icon.sizes, icon.src);
  }
  assert.equal(pngSize(resolve(publicDir, 'assets/app-icon-180.png')), '180x180');
  for (const name of pages) {
    const html = readFileSync(resolve(publicDir, name), 'utf8');
    assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/, name);
    assert.match(html, /<link rel="apple-touch-icon" href="assets\/app-icon-180\.png">/, name);
    assert.match(html, /<meta name="theme-color" content="#122B3E">/, name);
  }
});

test('shared links to the planner show its name, a summary and a picture', () => {
  for (const name of ['index.html', 'home.html']) {
    const html = readFileSync(resolve(publicDir, name), 'utf8');
    assert.match(html, /<meta name="description" content="[^"]{50,160}">/, name);
    assert.match(html, /<meta property="og:title" content="EV Site Planner">/, name);
    const image = html.match(/<meta property="og:image" content="https:\/\/ev-site-planner\.co\.uk\/([^"]+)">/)?.[1];
    assert.ok(image, `${name} names a picture on the live address`);
    assert.equal(pngSize(resolve(publicDir, image)), '1200x630');
  }
});

test('the PDF report fonts are not downloaded when a page opens', () => {
  for (const name of pages) assert.doesNotMatch(readFileSync(resolve(publicDir, name), 'utf8'), /<script[^>]*\bsrc="report-fonts\.js/, name);
  assert.match(readFileSync(resolve(publicDir, 'index.html'), 'utf8'), /<link rel="ev-report-fonts" href="report-fonts\.js\?v=[0-9a-f]{12}">/);
});
