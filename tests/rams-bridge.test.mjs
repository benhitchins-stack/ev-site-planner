import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../public/RAMS Builder.dc.html', import.meta.url), 'utf8');
const script = html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/i)?.[1];

function loadBuilder() {
  assert.ok(script, 'RAMS component script is present');
  const store = new Map();
  class DCLogic {
    constructor(props = {}) { this.props = props; }
    setState(update, callback) {
      const patch = typeof update === 'function' ? update(this.state, this.props) : update;
      this.state = { ...this.state, ...patch };
      if (callback) callback();
    }
  }
  const context = vm.createContext({
    console,
    DCLogic,
    Date,
    Math,
    setTimeout,
    clearTimeout,
    location: { hash: '' },
    localStorage: {
      getItem(key) { return store.has(key) ? store.get(key) : null; },
      setItem(key, value) { store.set(key, String(value)); }
    },
    document: { getElementById() { return null; }, activeElement: null },
    React: { createElement() { return null; } }
  });
  context.window = context;
  new vm.Script(`${script}\nglobalThis.RamsBuilder = Component;`, { filename: 'RAMS Builder.dc.html' }).runInContext(context);
  return new context.RamsBuilder({ previewUnlocked: true });
}

function safetySummary(overrides = {}) {
  return {
    version: 1,
    facts: {},
    route: 'single_contractor',
    dutyHolders: { client: 'Commercial Client', contractor: 'Electrical Contractor' },
    f10: {},
    risks: [],
    documents: {},
    siteSetup: {},
    ...overrides
  };
}

test('the bridge accepts only safety snapshot v1 and never supplies missing ratings', () => {
  const builder = loadBuilder();
  assert.equal(builder.safetySummaryOf({ safetySummary: { version: 2 } }), null);
  assert.equal(builder.safetySummaryOf({ safetySummary: { version: true } }), null);
  assert.equal(builder.safetySummaryOf({ safetySummary: { facts: {} } }), null);

  const summary = builder.safetySummaryOf({ safetySummary: safetySummary({
    dutyHolders: { client: '<Commercial Client>', contractor: '<Electrical Contractor>' },
    f10: { submitted: '2026-08-15' },
    risks: [{ hazard: '<Battery fire>', decision: 'Segregate\nbrief team', status: 'actioned' }]
  }) });
  assert.equal(summary.dutyHolders.client, 'Commercial Client');
  assert.equal(summary.dutyHolders.contractor, 'Electrical Contractor');
  assert.equal(summary.f10.date, '2026-08-15');
  assert.equal(summary.risks[0].li, '');
  assert.equal(summary.risks[0].si, '');
  assert.equal(summary.risks[0].lr, '');
  assert.equal(summary.risks[0].sr, '');

  const explicitlyIncomplete = builder.safetySummaryOf({ safetySummary: safetySummary({
    risks: [{ hazard: 'Incomplete risk', decision: 'Draft control', status: 'actioned', controlled: false }]
  }) });
  assert.equal(explicitlyIncomplete.risks.length, 0);
});

test('site-plan facts drive relevant ground, public-protection and electrical controls', () => {
  const builder = loadBuilder();
  const blob = {
    pack: { mode: 'commercial', safetySummary: safetySummary({
      facts: {
        coneCount: 2,
        signboardCount: 1,
        inspectionPitCount: 1,
        spoilCount: 1,
        electricalCount: 3,
        siteSetupCount: 1
      },
      risks: [{ id: 'battery', hazard: 'Battery thermal event', decision: 'Keep the work area segregated', status: 'actioned' }]
    }) },
    budget: { lines: [] }
  };
  const parts = builder.deriveParts(builder.ctxOf(blob));
  const methodKeys = new Set(parts.method.map((row) => row.k));
  const hazardKeys = new Set(parts.hazards.map((row) => row.k));
  assert.ok(methodKeys.has('scan'));
  assert.ok(methodKeys.has('civils'));
  assert.ok(methodKeys.has('cdm-controls'));
  assert.ok(hazardKeys.has('buried'));
  assert.ok(hazardKeys.has('excav'));
  assert.match(parts.scope, /cones, safety signboards/);
  assert.match(parts.scope, /inspection-point and spoil-management/);
  assert.match(parts.scope, /electrical equipment and cable-route interfaces/);
  assert.doesNotMatch(parts.scope, /marked welfare/i);
  assert.match(parts.method.find((row) => row.k === 'cdm-controls').why, /linked site plan/);
  const importedRisk = parts.hazards.find((row) => row.k === 'cdm-battery');
  assert.equal(importedRisk.li, '');
  assert.equal(builder.score(importedRisk.li, importedRisk.si), null);
  assert.equal(builder.score(true, 4), null);
  assert.equal(builder.band(null).label, 'Review');
});

test('single-contractor details and blank welfare remain explicit, not assumed', () => {
  const builder = loadBuilder();
  const blob = {
    pack: { mode: 'commercial', safetySummary: safetySummary({
      startDate: '2026-09-01',
      finishDate: '2026-09-14',
      dutyHolders: { client: 'Client Ltd', contractor: 'Solo Electrical Ltd', firstAider: 'A Patel' }
    }) },
    budget: { lines: [] }
  };
  const doc = builder.mkDoc(blob, 'plan-1', {});
  assert.equal(doc.det.client, 'Client Ltd');
  assert.equal(doc.det.pc, 'Solo Electrical Ltd');
  assert.equal(doc.det.pd, '');
  assert.equal(doc.det.cdmRoute, 'single_contractor');
  assert.equal(doc.det.start, '2026-09-01');
  assert.equal(doc.det.end, '2026-09-14');
  assert.match(doc.welfare, /not recorded in the linked site plan/i);
  assert.doesNotMatch(doc.welfare, /is provided|as confirmed/i);
});

test('re-derive refreshes linked arrangements and keeps one edited hazard per source key', () => {
  const builder = loadBuilder();
  const initialBlob = {
    pack: { mode: 'commercial', safetySummary: safetySummary({
      startDate: '2026-09-01',
      dutyHolders: { client: 'Old Client', contractor: 'Old Contractor' }
    }) },
    budget: { at: 'old', lines: [] }
  };
  const doc = builder.mkDoc(initialBlob, 'plan-1', {});
  const edited = doc.hazards.find((row) => row.k === 'safeiso');
  edited.auto = false;
  edited.ctl += '\nFirst manual edit';
  doc.hazards.push({ ...edited, id: 'later-edit', ctl: edited.ctl + '\nLatest manual edit' });

  const nextBlob = {
    pack: { mode: 'commercial', safetySummary: safetySummary({
      dutyHolders: { client: 'New Client', contractor: 'New Contractor', firstAider: 'New First Aider' },
      siteSetup: { welfare: 'WC and rest room beside reception', publicProtection: 'Use the signed east walkway' }
    }) },
    budget: { at: 'new', lines: [] }
  };
  builder.state = { ...builder.state, activeId: doc.id, docs: { [doc.id]: doc }, company: {} };
  builder.readBlob = () => nextBlob;
  builder.computeStale = () => {};
  builder.flash = () => {};
  builder.reDerive();

  const refreshed = builder.doc();
  assert.equal(refreshed.det.client, 'New Client');
  assert.equal(refreshed.det.pc, 'New Contractor');
  assert.equal(refreshed.det.start, '');
  assert.equal(refreshed.emg.firstAider, 'New First Aider');
  assert.match(refreshed.rules, /signed east walkway/);
  assert.match(refreshed.welfare, /WC and rest room beside reception/);
  const isolationRows = refreshed.hazards.filter((row) => row.k === 'safeiso');
  assert.equal(isolationRows.length, 1);
  assert.match(isolationRows[0].ctl, /Latest manual edit/);
});

test('the release gate is a modal and makes the builder subtree inert', () => {
  assert.match(html, /id="ramsGate"[^>]*role="dialog"[^>]*aria-modal="true"/);
  assert.match(html, /id="ramsApp"/);
  assert.match(html, /app\.setAttribute\('inert', ''\)/);
  assert.match(html, /app\.setAttribute\('aria-hidden', 'true'\)/);
});
