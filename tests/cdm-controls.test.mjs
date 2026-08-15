import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const moduleSource = readFileSync(new URL('../public/cdm-controls.js', import.meta.url), 'utf8');

function loadModule() {
  const listeners = new Map();
  const classList = { add() {}, remove() {}, contains() { return false; }, toggle() {} };
  const document = {
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    getElementById() { return null; },
    createElement() { return { classList, querySelector() { return null; }, querySelectorAll() { return []; } }; },
    body: { appendChild() {} },
    documentElement: { classList }
  };
  const context = vm.createContext({
    console,
    document,
    Math,
    Date,
    setTimeout,
    clearTimeout
  });
  context.window = context;
  context.globalThis = context;
  new vm.Script(moduleSource, { filename: 'cdm-controls.js' }).runInContext(context);
  return { context, listeners };
}

function readyCpp(cdm) {
  Object.assign(cdm.docs.cpp, {
    status: 'issued',
    owner: 'Principal contractor',
    revision: 'C01',
    date: '2026-08-15'
  });
}

function addControlledRisk(cdm) {
  cdm.risks.push({
    id: 'risk-1',
    hazard: 'Vehicle interface',
    who: 'Site users',
    hierarchy: 'control',
    decision: 'Segregate the work area',
    residual: 'Authorised vehicles remain nearby',
    owner: 'Site manager',
    dueDate: '2026-08-20',
    status: 'actioned',
    source: 'Test plan'
  });
}

test('fresh and legacy CDM records normalise without losing role data', () => {
  const { context: app } = loadModule();
  const fresh = app.newCdmPack();
  assert.equal(Object.keys(fresh.docs).length, 10);
  assert.equal(fresh.contractor, '');

  const migrated = app.normaliseCdmPack({
    route: 'client_roles',
    pd: 'Design Co',
    pc: 'Build Co',
    f10: 'filed',
    f10Ref: 'F10-123'
  });
  assert.equal(migrated.route, 'other_appointed');
  assert.equal(migrated.pd, 'Design Co');
  assert.equal(migrated.pc, 'Build Co');
  assert.equal(migrated.f10, 'filed');
  assert.equal(migrated.f10Ref, 'F10-123');

  const invalidDates = app.normaliseCdmPack({
    appointmentDate: '2026-99-99',
    f10Date: '2026-02-29',
    docs: { cpp: { status: 'issued', owner: 'PC', revision: 'C01', date: '2026-13-40' } }
  });
  assert.equal(invalidDates.appointmentDate, '');
  assert.equal(invalidDates.f10Date, '');
  assert.equal(invalidDates.docs.cpp.date, '');
});

test('F10 uses the statutory OR test and only completes with filing evidence', () => {
  const { context: app } = loadModule();
  const pack = { mode: 'commercial', custName: '', compliance: [], complianceNA: [], attachments: [], cdm: app.newCdmPack() };
  Object.assign(pack.cdm, {
    route: 'single_contractor',
    client: 'Commercial client',
    contractor: 'Electrical contractor',
    f10LongAndTwenty: 'yes',
    f10PersonDays: 'no',
    f10: 'filed'
  });
  readyCpp(pack.cdm);
  addControlledRisk(pack.cdm);

  let assessment = app.evspCdmAssessment(pack);
  assert.equal(assessment.f10.code, 'notifiable');
  assert.equal(app.EvspCdmControls.f10FiledComplete(pack.cdm), false);
  assert.ok(assessment.blockingIssues.some(issue => issue.text.includes('HSE reference')));
  assert.ok(!pack.compliance.includes('f10'));

  pack.cdm.f10Ref = 'F10-123456';
  pack.cdm.f10Date = '2026-08-15';
  assessment = app.evspCdmAssessment(pack);
  assert.equal(app.EvspCdmControls.f10FiledComplete(pack.cdm), true);
  assert.ok(pack.compliance.includes('f10'));
  assert.ok(!assessment.blockingIssues.some(issue => issue.text.includes('notifiable')));

  pack.cdm.f10LongAndTwenty = 'no';
  pack.cdm.f10PersonDays = 'no';
  app.evspCdmSyncCompliance(pack);
  assert.equal(app.EvspCdmControls.f10Verdict(pack.cdm).code, 'not_required');
  assert.ok(pack.complianceNA.includes('f10'));
});

test('single-contractor readiness requires the client, contractor and controlled CPP metadata', () => {
  const { context: app } = loadModule();
  const pack = { mode: 'commercial', custName: '', compliance: [], complianceNA: [], attachments: [], cdm: app.newCdmPack() };
  Object.assign(pack.cdm, {
    route: 'single_contractor',
    f10LongAndTwenty: 'no',
    f10PersonDays: 'no'
  });
  pack.cdm.docs.cpp.status = 'issued';
  addControlledRisk(pack.cdm);

  let assessment = app.evspCdmAssessment(pack);
  assert.ok(assessment.blockingIssues.some(issue => issue.text.includes('commercial client')));
  assert.ok(assessment.blockingIssues.some(issue => issue.text.includes('contractor responsible')));
  assert.ok(assessment.blockingIssues.some(issue => issue.text.includes('construction phase plan')));
  assert.ok(!pack.compliance.includes('cdm'));

  pack.cdm.client = 'Commercial client';
  pack.cdm.contractor = 'Electrical contractor';
  readyCpp(pack.cdm);
  assessment = app.evspCdmAssessment(pack);
  assert.equal(assessment.blockingIssues.length, 0);
  assert.equal(assessment.complete, true);
  assert.ok(pack.compliance.includes('cdm'));
});

test('plan facts trigger excavation, public-interface and temporary-works prompts', () => {
  const { context: app } = loadModule();
  const pack = {
    mode: 'commercial',
    compliance: [],
    complianceNA: [],
    attachments: [],
    cdm: app.newCdmPack(),
    photos: [{ id: 'plan-1', items: [
      { type: 'unit', variant: 'twin_ped' },
      { type: 'bay' },
      { type: 'route', kind: 'trench', manualLen: 12 },
      { type: 'route', kind: 'duct' },
      { type: 'route', kind: 'heras' },
      { type: 'route', kind: 'cones' },
      { type: 'route', kind: '__area', surface: 'exclusion' },
      { type: 'route', kind: '__area', surface: 'pedestrian' },
      { type: 'site', kind: 'signboard' },
      { type: 'site', kind: 'inspectionpit' },
      { type: 'site', kind: 'spoil' },
      { type: 'site', kind: 'cabin' },
      { type: 'mark', kind: 'firstaid' },
      { type: 'mark', kind: 'fire' }
    ] }]
  };
  const facts = app.EvspCdmControls.planFacts(pack);
  assert.equal(facts.trenchMetres, 12);
  assert.equal(facts.coneCount, 1);
  assert.equal(facts.exclusionCount, 1);
  assert.equal(facts.pedestrianCount, 1);
  assert.equal(facts.signboardCount, 1);
  assert.equal(facts.inspectionPitCount, 1);
  assert.equal(facts.spoilCount, 1);

  const keys = new Set(app.EvspCdmControls.suggestions(pack).map(risk => risk.presetKey));
  assert.ok(keys.has('excavation'));
  assert.ok(keys.has('public_interface'));
  assert.ok(keys.has('temporary_works'));
  assert.ok(keys.has('electrical'));
});

test('an open suggested risk does not pass the controlled-risk gate', () => {
  const { context: app } = loadModule();
  const pack = { mode: 'commercial', custName: 'Client', compliance: [], complianceNA: [], attachments: [], cdm: app.newCdmPack() };
  Object.assign(pack.cdm, {
    route: 'single_contractor',
    client: 'Client',
    contractor: 'Contractor',
    f10LongAndTwenty: 'no',
    f10PersonDays: 'no'
  });
  readyCpp(pack.cdm);
  pack.cdm.risks.push({
    id: 'open-risk', hazard: 'Excavation', who: 'Workers', hierarchy: 'reduce',
    decision: 'Scan and mark services', residual: 'Unknown services may remain',
    owner: '', status: 'open', source: 'Trench on plan'
  });
  let assessment = app.evspCdmAssessment(pack);
  assert.ok(assessment.blockingIssues.some(issue => issue.text.includes('controlled status')));
  pack.cdm.risks[0].owner = 'Principal contractor';
  pack.cdm.risks[0].status = 'actioned';
  assessment = app.evspCdmAssessment(pack);
  assert.ok(!assessment.blockingIssues.some(issue => issue.text.includes('controlled status')));
});

test('accepted RAMS compliance unwinds only when the module owns the change', () => {
  const { context: app } = loadModule();
  const managed = {
    mode: 'commercial', compliance: [], complianceNA: [], cdm: app.newCdmPack(),
    attachments: [{ id: 'a1', cdmCategory: 'rams', cdmStatus: 'accepted' }]
  };
  app.evspCdmSyncCompliance(managed);
  assert.ok(managed.compliance.includes('rams'));
  assert.equal(managed.cdm.ramsComplianceManaged, true);
  managed.attachments[0].cdmStatus = 'reviewed';
  app.evspCdmSyncCompliance(managed);
  assert.ok(!managed.compliance.includes('rams'));
  assert.equal(managed.cdm.ramsComplianceManaged, false);

  const manual = {
    mode: 'commercial', compliance: ['rams'], complianceNA: [], cdm: app.newCdmPack(),
    attachments: [{ id: 'a2', cdmCategory: 'rams', cdmStatus: 'accepted' }]
  };
  app.evspCdmSyncCompliance(manual);
  assert.notEqual(manual.cdm.ramsComplianceManaged, true);
  manual.attachments[0].cdmStatus = 'reviewed';
  app.evspCdmSyncCompliance(manual);
  assert.ok(manual.compliance.includes('rams'));
});

test('supporting files receive safe filename-based category suggestions', () => {
  const { context: app } = loadModule();
  const pack = {
    mode: 'commercial', compliance: [], complianceNA: [], cdm: app.newCdmPack(),
    attachments: [
      { id: 'a1', name: 'Site RAMS Rev A.pdf' },
      { id: 'a2', name: 'Principal contractor appointment letter.pdf' },
      { id: 'a3', name: 'LSBUD utility search.pdf' }
    ]
  };
  app.evspCdmAssessment(pack);
  assert.deepEqual(pack.attachments.map(file => file.cdmCategory), ['rams', 'appointment', 'utilities']);
});

test('CDM card remains scoped to the commercial workspace', () => {
  const { context: app } = loadModule();
  const domestic = { mode: 'domestic', cdm: app.newCdmPack(), compliance: [], complianceNA: [] };
  assert.equal(app.evspCdmCardHTML(domestic), '');

  const commercial = { mode: 'commercial', cdm: app.newCdmPack(), compliance: [], complianceNA: [], attachments: [] };
  const card = app.evspCdmCardHTML(commercial);
  assert.match(card, /id="evspCdmOpen"/);
  assert.match(card, /CDM project controls/);
});

test('not-applicable documents require a recorded reason', () => {
  const { context: app } = loadModule();
  const state = app.newCdmPack();
  state.docs.excavation.status = 'not_applicable';
  const pack = { mode: 'commercial', cdm: state, compliance: [], complianceNA: [], attachments: [] };
  let assessment = app.evspCdmAssessment(pack);
  assert.equal(assessment.docs.ready, 0);
  pack.cdm.docs.excavation.notes = 'No excavation or buried route is included in the agreed scope.';
  assessment = app.evspCdmAssessment(pack);
  assert.equal(assessment.docs.ready, 1);
});

test('CDM PDF export builds the controlled pack sections and filename', () => {
  class FakePdf {
    static last;
    constructor() {
      FakePdf.last = this;
      this.pages = 1;
      this.textCalls = [];
      this.savedName = '';
    }
    setFillColor() {}
    rect() {}
    setTextColor() {}
    setFont() {}
    setFontSize() {}
    setDrawColor() {}
    setLineWidth() {}
    line() {}
    roundedRect() {}
    addImage() {}
    addPage() { this.pages += 1; }
    getNumberOfPages() { return this.pages; }
    setPage() {}
    splitTextToSize(value) { return [String(value ?? '')]; }
    text(value) {
      if (Array.isArray(value)) this.textCalls.push(...value.map(String));
      else this.textCalls.push(String(value));
    }
    save(name) { this.savedName = name; }
  }

  const { context: app } = loadModule();
  app.jspdf = { jsPDF: FakePdf };
  app.confirm = () => true;
  const pack = {
    mode: 'commercial', name: 'Fleet depot', address: '1 Test Road', postcode: 'AB1 2CD',
    custName: 'Commercial client', compliance: [], complianceNA: [], attachments: [], photos: [],
    cdm: app.newCdmPack()
  };
  Object.assign(pack.cdm, {
    route: 'single_contractor', client: 'Commercial client', contractor: 'Electrical contractor',
    f10LongAndTwenty: 'no', f10PersonDays: 'no'
  });
  readyCpp(pack.cdm);
  addControlledRisk(pack.cdm);

  assert.equal(app.evspCdmExportPdf(pack), true);
  const pdf = FakePdf.last;
  assert.equal(pdf.savedName, 'Fleet_depot_CDM_project_controls.pdf');
  assert.ok(pdf.pages >= 9);
  const output = pdf.textCalls.join('\n');
  for (const heading of [
    'Project and duty holders',
    'Pre-construction information',
    'Controlled document register',
    'Designer risk register',
    'Construction phase plan arrangements',
    'Permit-to-work register',
    'Health and safety file and handover'
  ]) assert.match(output, new RegExp(heading));
});
