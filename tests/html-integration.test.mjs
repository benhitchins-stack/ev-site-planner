import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const files = [
  '../public/EV Site Planner.html',
  '../public/Guide Library.dc.html',
  '../public/RAMS Builder.dc.html'
];

function source(path) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

test('all edited HTML inline scripts parse', () => {
  for (const path of files) {
    const html = source(path);
    const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
    assert.ok(scripts.length > 0, `${path} contains inline scripts`);
    scripts.forEach((match, index) => {
      assert.doesNotThrow(
        () => new vm.Script(match[1], { filename: `${path}:inline-${index + 1}.js` }),
        `${path} inline script ${index + 1} parses`
      );
    });
  }
});

test('planner loads and persists the CDM module and safety bridge', () => {
  const planner = source('../public/EV Site Planner.html');
  assert.match(planner, /href="cdm-controls\.css"/);
  assert.match(planner, /src="cdm-controls\.js"/);
  assert.match(planner, /cdm:newCdmPack\(\)/);
  assert.match(planner, /pk\.cdm=normaliseCdmPack\(pk\.cdm\)/);
  assert.match(planner, /function projectSafetySummary\(\)/);
  assert.match(planner, /out\.safetySummary=safety/);
  assert.match(planner, /api\.documentDefinitions\|\|api\.docDefs/);
  assert.match(planner, /evsp:attachments-changed/);
  assert.match(planner, /Object\.entries\(AREA_SURFACES\)\.filter\(\(\[,s\]\)=>!s\.safety\)/);
});

test('RAMS builder consumes the optional snapshot without removing its release gate', () => {
  const rams = source('../public/RAMS Builder.dc.html');
  assert.match(rams, /safetySummaryOf\(pack\)/);
  assert.match(rams, /sourceF10\.date \|\| sourceF10\.submitted/);
  assert.match(rams, /CDM safety summary saved with the site plan/);
  assert.match(rams, /gated\(\) \{ return !\(this\.props\.previewUnlocked \?\? false\); \}/);
});

test('guide and planner state the corrected CPP and appointment rules', () => {
  const planner = source('../public/EV Site Planner.html');
  const guide = source('../public/Guide Library.dc.html');
  assert.match(planner, /construction phase plan must be prepared before construction begins on every construction project/);
  assert.match(planner, /principal designer and principal contractor in writing/);
  assert.match(guide, /construction phase plan<\/b> \(CPP\) must be prepared before construction starts on every project/);
});
