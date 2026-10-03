import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

function loadGuides() {
  const context = vm.createContext({ window: {}, localStorage: { getItem: () => null, setItem() {} }, console });
  new vm.Script(read('../public/guide-art.js'), { filename: 'guide-art.js' }).runInContext(context);
  new vm.Script(read('../public/guides.js'), { filename: 'guides.js' }).runInContext(context);
  return context.window;
}

test('every guide has a level, a topic, a summary and valid links to other guides and terms', () => {
  const { EVGuides } = loadGuides();
  const ids = new Set(EVGuides.GUIDES.map(g => g.id));
  const levels = new Set(EVGuides.LEVELS.map(l => l.id));
  const topics = new Set(EVGuides.TOPICS.map(t => t[0]));
  for (const g of EVGuides.GUIDES) {
    assert.ok(levels.has(g.level), `${g.id} level`);
    assert.ok(topics.has(g.topic), `${g.id} topic`);
    assert.ok(g.title && g.summary && g.body && g.minutes > 0, `${g.id} content`);
    for (const r of [...(g.readFirst || []), ...(g.related || [])]) assert.ok(ids.has(r), `${g.id} links to ${r}`);
    for (const m of g.body.matchAll(/data-guide="([^"]+)"/g)) assert.ok(ids.has(m[1]), `${g.id} body links to ${m[1]}`);
    for (const m of g.body.matchAll(/data-term="([^"]+)"/g)) assert.ok(EVGuides.GLOSSARY[m[1]], `${g.id} uses term ${m[1]}`);
    for (const m of g.body.matchAll(/data-art="([^"]+)"/g)) assert.ok(EVGuides.guideHTML(g.id).includes('<svg'), `${g.id} diagram ${m[1]} is drawn`);
  }
  for (const level of EVGuides.LEVELS) assert.ok(EVGuides.GUIDES.some(g => g.level === level.id), `${level.id} has guides`);
  for (const level of Object.keys(EVGuides.QUIZ)) assert.ok(levels.has(level));
});

test('every planner hint and page help key opens a real guide', () => {
  const { EVGuides } = loadGuides();
  const planner = read('../public/EV Site Planner.html');
  const start = planner.indexOf('const HINTS={');
  const end = planner.indexOf('function hintBtn', start);
  const ids = new Set(EVGuides.GUIDES.map(g => g.id));
  for (const m of planner.slice(start, end).matchAll(/g:"([a-z]+)"/g)) assert.ok(ids.has(m[1]), `hint guide ${m[1]}`);
  for (const id of Object.values(EVGuides.pageGuide)) assert.ok(ids.has(id), `page guide ${id}`);
  for (const file of ['workspace.js', 'planning.js', 'delivery.js', 'profile.js']) {
    for (const m of read('../public/' + file).matchAll(/hq\('([a-z-]+)'/g)) assert.ok(ids.has(m[1]), `${file} ? button ${m[1]}`);
  }
});

test('guide copy keeps the house style and the design-assistance wording', () => {
  const { EVGuides } = loadGuides();
  const text = read('../public/guides.js') + read('../public/help.js') + read('../public/guide-art.js') + read('../public/guide-library.js');
  assert.doesNotMatch(text, /—/, 'no em-dashes');
  assert.doesNotMatch(text, /\b(seamless|robust|leverage)\b/i);
  assert.doesNotMatch(read('../public/Guide Library.dc.html'), /Last reviewed|reviewed July/i);
  assert.match(EVGuides.DISCLAIMER, /does not certify electrical work/);
  for (const g of EVGuides.GUIDES.filter(g => g.level === 'advanced' || g.level === 'install')) {
    assert.match(EVGuides.guideHTML(g.id), /does not certify electrical work/, `${g.id} carries the disclaimer`);
  }
});

test('calculators give sensible answers', () => {
  const { EVGuides } = loadGuides();
  const c = EVGuides.CALCS;
  assert.match(c['charge-time'].run({ kwh: 60, kw: 7, from: 20, to: 80 }), /5 h 43 min/);
  assert.match(c['headroom'].run({ limit: 100, ph: 1, md: 55, n: 2, dlm: 0 }), /Does not fit/);
  assert.match(c['headroom'].run({ limit: 100, ph: 1, md: 55, n: 1, dlm: 0 }), /Fits inside/);
  assert.match(c['voltdrop'].run({ sz: 6, len: 40, ib: 32, ph: 1 }), /9\.3 V \(4\.1 %\)/);
  assert.match(c['voltdrop'].run({ sz: 6, len: 60, ib: 32, ph: 1 }), /Over the 5 % limit/);
  assert.match(c['dlm-fit'].run({ limit: 60, floor: 6, ph: 1 }), /Up to 10 active sockets/);
});
