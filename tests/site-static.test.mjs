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
