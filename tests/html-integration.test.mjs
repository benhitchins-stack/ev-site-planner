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

function plannerPersistenceHelpers() {
  const planner = source('../public/EV Site Planner.html');
  const start = planner.indexOf('const MEANINGFUL_PROJECT_TEXT_FIELDS=');
  const end = planner.indexOf('function serialisablePack()', start);
  assert.ok(start >= 0 && end > start, 'planner persistence helper block is present');
  const context = vm.createContext({ Object, Array, String, Boolean, Number });
  new vm.Script(planner.slice(start, end), { filename: 'planner-persistence-helpers.js' }).runInContext(context);
  return context;
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
  assert.match(planner, /function plannerCdmFallbackPack\(\)/);
  assert.match(planner, /cdm:plannerNewCdmPack\(\)/);
  assert.match(planner, /pk\.cdm=plannerNormaliseCdmPack\(pk\.cdm\)/);
  assert.match(planner, /function projectSafetySummary\(\)/);
  assert.match(planner, /out\.safetySummary=safety/);
  assert.match(planner, /api\.documentDefinitions\|\|api\.docDefs/);
  assert.match(planner, /startDate:c\.startDate\|\|""/);
  assert.match(planner, /finishDate:c\.finishDate\|\|""/);
  assert.match(planner, /principalDesignerAppointment:\{confirmed:c\.pdAppointmentConfirmed===true/);
  assert.match(planner, /principalContractorAppointment:\{confirmed:c\.pcAppointmentConfirmed===true/);
  assert.match(planner, /controlled:cdmRiskIsFullyControlled\(r\)/);
  assert.match(planner, /evsp:attachments-changed/);
  assert.match(planner, /Object\.entries\(AREA_SURFACES\)\.filter\(\(\[,s\]\)=>!s\.safety\)/);
});

test('planner preserves photo-free work and provides a payload-free linked-tool snapshot', () => {
  const planner = source('../public/EV Site Planner.html');
  assert.match(planner, /function hasMeaningfulPackContent\(candidate\)/);
  assert.match(planner, /Array\.isArray\(p\.attachments\)&&p\.attachments\.length/);
  assert.match(planner, /return cdmHasMeaningfulContent\(p\.cdm\)/);
  assert.match(planner, /if\(hasMeaningfulPackContent\(pack\)\)\{ const ok=await askConfirm\(\{title:"Start a new survey\?"/);
  assert.match(planner, /title:"Open another survey\?"/);
  assert.match(planner, /__saved&&__saved\.pack&&hasMeaningfulPackContent\(__saved\.pack\)/);
  assert.match(planner, /!d\|\|!d\.pack\|\|!hasMeaningfulPackContent\(d\.pack\)/);
  assert.match(planner, /if\(!pack\.projId && hasMeaningfulPackContent\(pack\)\) saveCurrentToProjects\(true\)/);
  assert.match(planner, /if\(hasMeaningfulPackContent\(pack\)\) saveCurrentToProjects\(true\)/);
  assert.match(planner, /function slimProjectSnapshot\(full\)/);
  assert.match(planner, /const meta=\{\.\.\.a,src:""\}/);
  assert.match(planner, /pack:\{\.\.\.sourcePack,photos:\[\],brandLogo:"",attachments\}/);
  assert.match(planner, /localStorage\.setItem\("evsp_proj_"\+pack\.projId, JSON\.stringify\(slimProjectSnapshot\(full\)\)\)/);
  assert.match(planner, /return requireLocalSnapshot\?lsOk:\(lsOk\|\|idbTried\)/);
  assert.ok((planner.match(/saveCurrentToProjects\(true,true\)/g) || []).length >= 3);
});

test('meaningful-content and controlled-risk helpers reject defaults but keep CDM-only work', () => {
  const app = plannerPersistenceHelpers();
  const empty = {
    mode: 'commercial', surveyDate: '2026-08-15', photos: [], attachments: [], compliance: [], complianceNA: [],
    programme: { start: '', days: {}, skip: {} }, commissioning: { units: {}, eicRef: '', by: '', accept: '', date: '' },
    cdm: { f10LongAndTwenty: 'unknown', f10PersonDays: 'unknown', docs: { cpp: { status: 'not_started', owner: '', revision: '', date: '', notes: '' } }, risks: [] }
  };
  assert.equal(app.hasMeaningfulPackContent(empty), false);
  assert.equal(app.hasMeaningfulPackContent({ ...empty, cdm: { ...empty.cdm, client: 'Commercial client' } }), true);
  assert.equal(app.hasMeaningfulPackContent({ ...empty, attachments: [{ id: 'meta-only', name: 'RAMS.pdf', src: '' }] }), true);
  assert.equal(app.hasMeaningfulPackContent({ ...empty, name: 'Depot rollout' }), true);

  const completeRisk = {
    status: 'actioned', hazard: 'Vehicle interface', decision: 'Segregate works', residual: 'Authorised vehicles remain', owner: 'PC',
    initialLikelihood: 4, initialSeverity: 4, residualLikelihood: 1, residualSeverity: 3
  };
  assert.equal(app.cdmRiskIsFullyControlled(completeRisk), true);
  assert.equal(app.cdmRiskIsFullyControlled({ ...completeRisk, owner: '' }), false);
  assert.equal(app.cdmRiskIsFullyControlled({ ...completeRisk, residualSeverity: '' }), false);
  assert.equal(app.cdmRiskIsFullyControlled({ ...completeRisk, status: 'open' }), false);
});

test('planner isolates CDM keyboard input and hardens manual document actions', () => {
  const planner = source('../public/EV Site Planner.html');
  assert.ok((planner.match(/classList\.contains\("evsp-cdm-modal-open"\)/g) || []).length >= 3);
  assert.match(planner, /if\(k==="rams"&&pack\.cdm&&typeof pack\.cdm==="object"\)\{ pack\.cdm\.ramsComplianceManaged=false; pack\.cdm\.ramsComplianceManual=true; \}/);
  assert.match(planner, /disabled title="File contents are not stored in this device snapshot"/);
  assert.match(planner, /if\(a&&a\.src\)/);
  assert.match(planner, /a\.src\?'<a download=/);
  assert.match(planner, /filter\(a=>\(a\.type\|\|""\)\.startsWith\("image\/"\)&&a\.src\)/);
  assert.match(planner, /filter\(a=>!\(a\.type\|\|""\)\.startsWith\("image\/"\)\|\|!a\.src\)/);
  assert.match(planner, /title:"Remove this document\?"/);
  assert.match(planner, /let added=0, skipped=0/);
  assert.match(planner, /else toast\("No documents were added"\)/);
});

test('construction phase plan pre-fills reviewed CDM arrangements and controlled risks', () => {
  const planner = source('../public/EV Site Planner.html');
  assert.match(planner, /const recordedRisks=.*\["actioned","closed","transferred"\]/);
  assert.match(planner, /c\.induction\|\|""/);
  assert.match(planner, /c\.monitoring\|\|""/);
  assert.match(planner, /c\.publicProtection\|\|""/);
  assert.match(planner, /c\.welfare\|\|/);
  assert.match(planner, /c\.emergency\|\|""/);
  assert.match(planner, /A competent person and the appointed duty holders must review project-specific suitability and completeness before issue/);
});

test('RAMS builder consumes the optional snapshot without removing its release gate', () => {
  const rams = source('../public/RAMS Builder.dc.html');
  assert.match(rams, /safetySummaryOf\(pack\)/);
  assert.match(rams, /sourceF10\.date \|\| sourceF10\.submitted/);
  assert.match(rams, /Controls recorded on the linked site plan/);
  assert.match(rams, /gated\(\) \{ return !\(this\.props\.previewUnlocked \?\? false\); \}/);
});

test('guide and planner state the corrected CPP and appointment rules', () => {
  const planner = source('../public/EV Site Planner.html');
  const guide = source('../public/Guide Library.dc.html');
  assert.match(planner, /construction phase plan must be prepared before construction begins on every construction project/);
  assert.match(planner, /principal designer and principal contractor in writing/);
  assert.match(guide, /construction phase plan<\/b> \(CPP\) must be prepared before construction starts on every project/);
});
