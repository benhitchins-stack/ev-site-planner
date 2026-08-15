import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const moduleSource = readFileSync(new URL('../public/cdm-controls.js', import.meta.url), 'utf8');
const DOCUMENT_DATE = '2024-01-15';
const START_DATE = '2024-02-01';
const FINISH_DATE = '2024-03-01';

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
    contains() { return false; },
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

function makePack(app, overrides = {}) {
  return Object.assign({
    mode: 'commercial',
    name: 'Fleet depot',
    address: '1 Test Road',
    postcode: 'AB1 2CD',
    custName: 'Commercial client',
    compliance: [],
    complianceNA: [],
    attachments: [],
    photos: [],
    cdm: app.newCdmPack()
  }, overrides);
}

function controlDocument(cdm, key, status = 'issued') {
  Object.assign(cdm.docs[key], {
    status,
    owner: key === 'cpp' ? 'Principal contractor' : 'Document owner',
    revision: 'C01',
    date: DOCUMENT_DATE
  });
}

function controlMinimumDocuments(cdm) {
  for (const key of ['pci', 'cpp', 'induction', 'site_rules', 'toolbox', 'permits']) {
    controlDocument(cdm, key);
  }
}

function addControlledRisk(cdm, values = {}) {
  cdm.risks.push(Object.assign({
    id: `risk-${cdm.risks.length + 1}`,
    hazard: 'Vehicle interface',
    who: 'Site users',
    hierarchy: 'control',
    decision: 'Segregate the work area',
    residual: 'Authorised vehicles remain nearby',
    owner: 'Site manager',
    dueDate: DOCUMENT_DATE,
    initialLikelihood: 4,
    initialSeverity: 4,
    residualLikelihood: 2,
    residualSeverity: 2,
    status: 'actioned',
    source: 'Test plan'
  }, values));
}

function fillCore(cdm, route = 'single_contractor') {
  Object.assign(cdm, {
    route,
    client: 'Commercial client',
    contractor: route === 'single_contractor' ? 'Electrical contractor' : '',
    pd: route === 'single_contractor' ? '' : 'Design Co',
    pc: route === 'single_contractor' ? '' : 'Build Co',
    startDate: START_DATE,
    finishDate: FINISH_DATE,
    siteManager: 'Site supervisor, 07000 000000',
    firstAider: 'First aider, 07000 000001',
    welfare: 'Welfare unit available before work starts.',
    induction: 'Project induction before site access and daily briefings.',
    publicProtection: 'Signed segregation and a protected pedestrian route.',
    emergency: 'Call 999, isolate supplies and report to the muster point.',
    monitoring: 'Daily checks and weekly formal review.',
    f10LongAndTwenty: 'no',
    f10PersonDays: 'no'
  });
  if (route !== 'single_contractor') {
    Object.assign(cdm, {
      pdAppointmentConfirmed: true,
      pdAppointmentDate: DOCUMENT_DATE,
      pdAppointmentEvidence: 'PD appointment letter A01',
      pcAppointmentConfirmed: true,
      pcAppointmentDate: DOCUMENT_DATE,
      pcAppointmentEvidence: 'PC appointment letter A02'
    });
  }
}

function makeReadyPack(app, route = 'single_contractor') {
  const pack = makePack(app);
  fillCore(pack.cdm, route);
  controlMinimumDocuments(pack.cdm);
  addControlledRisk(pack.cdm);
  app.evspCdmSyncCompliance(pack);
  return pack;
}

function acceptedRams(values = {}) {
  return Object.assign({
    id: 'rams-1',
    name: 'Site RAMS Rev C01.pdf',
    cdmCategory: 'rams',
    cdmStatus: 'accepted',
    cdmProvider: 'Electrical contractor',
    cdmReviewer: 'Principal contractor',
    cdmReviewDate: DOCUMENT_DATE,
    cdmRevision: 'C01',
    cdmReviewNote: ''
  }, values);
}

test('fresh and legacy CDM records normalise without losing data or falsely verifying appointments', () => {
  const { context: app } = loadModule();
  const fresh = app.newCdmPack();
  assert.equal(fresh.version, 3);
  assert.equal(Object.keys(fresh.docs).length, 10);
  assert.equal(fresh.contractor, '');

  const migrated = app.normaliseCdmPack({
    route: 'client_roles',
    pd: 'Design Co',
    pc: 'Build Co',
    appointmentsConfirmed: true,
    appointmentDate: DOCUMENT_DATE,
    appointmentEvidence: 'Legacy combined letter',
    f10: 'filed',
    f10Ref: 'F10-123'
  });
  assert.equal(migrated.route, 'other_appointed');
  assert.equal(migrated.pd, 'Design Co');
  assert.equal(migrated.pc, 'Build Co');
  assert.equal(migrated.appointmentsConfirmed, true);
  assert.equal(migrated.pdAppointmentConfirmed, false);
  assert.equal(migrated.pcAppointmentConfirmed, false);
  assert.equal(app.EvspCdmControls.appointmentReady(migrated, 'pd'), false);
  assert.equal(app.EvspCdmControls.appointmentReady(migrated, 'pc'), false);

  const invalidDates = app.normaliseCdmPack({
    appointmentDate: '2026-99-99',
    f10Date: '2026-02-29',
    docs: { cpp: { status: 'issued', owner: 'PC', revision: 'C01', date: '2026-13-40' } }
  });
  assert.equal(invalidDates.appointmentDate, '');
  assert.equal(invalidDates.f10Date, '');
  assert.equal(invalidDates.docs.cpp.date, '');
});

test('assessment is pure and does not infer attachment metadata or compliance state', () => {
  const { context: app } = loadModule();
  const pack = makePack(app, {
    attachments: [{ id: 'a1', name: 'Site RAMS Rev A.pdf' }]
  });
  const before = JSON.stringify(pack);
  app.evspCdmAssessment(pack);
  assert.equal(JSON.stringify(pack), before);
});

test('F10 uses the statutory OR test and requires valid filing chronology', () => {
  const { context: app } = loadModule();
  const pack = makePack(app);
  fillCore(pack.cdm);
  Object.assign(pack.cdm, {
    f10LongAndTwenty: 'yes',
    f10PersonDays: 'no',
    f10: 'filed'
  });
  controlMinimumDocuments(pack.cdm);
  addControlledRisk(pack.cdm);

  let assessment = app.evspCdmAssessment(pack);
  assert.equal(assessment.f10.code, 'notifiable');
  assert.equal(app.EvspCdmControls.f10FiledComplete(pack.cdm), false);
  assert.ok(assessment.blockingIssues.some(issue => issue.text.includes('HSE reference')));

  pack.cdm.f10Ref = 'F10-123456';
  pack.cdm.f10Date = DOCUMENT_DATE;
  app.evspCdmSyncCompliance(pack);
  assessment = app.evspCdmAssessment(pack);
  assert.equal(app.EvspCdmControls.f10FiledComplete(pack.cdm), true);
  assert.ok(pack.compliance.includes('f10'));
  assert.ok(!assessment.blockingIssues.some(issue => issue.text.includes('notifiable')));

  pack.cdm.f10Date = '2024-02-02';
  assert.equal(app.EvspCdmControls.f10FiledComplete(pack.cdm), false, 'filing after the start must fail');
  pack.cdm.f10Date = '2099-01-01';
  assert.equal(app.EvspCdmControls.f10FiledComplete(pack.cdm), false, 'future filing must fail');
  pack.cdm.f10Date = DOCUMENT_DATE;
  pack.cdm.f10LongAndTwenty = 'no';
  pack.cdm.f10PersonDays = 'no';
  app.evspCdmSyncCompliance(pack);
  assert.equal(app.EvspCdmControls.f10Verdict(pack.cdm).code, 'not_required');
  assert.ok(pack.complianceNA.includes('f10'));
});

test('module-managed F10 N/A rolls back, while a manual document decision is preserved', () => {
  const { context: app } = loadModule();
  const managed = makePack(app);
  managed.cdm.f10LongAndTwenty = 'no';
  managed.cdm.f10PersonDays = 'no';
  app.evspCdmSyncCompliance(managed);
  assert.equal(managed.cdm.docs.f10.status, 'not_applicable');
  assert.equal(managed.cdm.f10DocManaged, true);
  assert.ok(managed.complianceNA.includes('f10'));

  managed.cdm.f10PersonDays = 'unknown';
  app.evspCdmSyncCompliance(managed);
  assert.equal(managed.cdm.docs.f10.status, 'not_started');
  assert.equal(managed.cdm.docs.f10.notes, '');
  assert.equal(managed.cdm.f10DocManaged, false);
  assert.ok(!managed.complianceNA.includes('f10'));

  const manual = makePack(app);
  manual.cdm.f10LongAndTwenty = 'no';
  manual.cdm.f10PersonDays = 'no';
  Object.assign(manual.cdm.docs.f10, {
    status: 'not_applicable',
    notes: 'Project team assessment recorded separately.'
  });
  app.evspCdmSyncCompliance(manual);
  assert.equal(manual.cdm.f10DocManaged, false);
  manual.cdm.f10PersonDays = 'unknown';
  app.evspCdmSyncCompliance(manual);
  assert.equal(manual.cdm.docs.f10.status, 'not_applicable');
  assert.equal(manual.cdm.docs.f10.notes, 'Project team assessment recorded separately.');
});

test('legacy and manual CDM/F10 checklist states are never clobbered by assessment or first sync', () => {
  const { context: app } = loadModule();
  const pack = makePack(app, {
    compliance: ['cdm', 'f10'],
    complianceNA: [],
    cdm: {
      route: 'single_contractor',
      f10LongAndTwenty: 'no',
      f10PersonDays: 'no'
    }
  });
  const before = JSON.stringify({ compliance: pack.compliance, complianceNA: pack.complianceNA, cdm: pack.cdm });
  app.evspCdmAssessment(pack);
  assert.equal(JSON.stringify({ compliance: pack.compliance, complianceNA: pack.complianceNA, cdm: pack.cdm }), before);
  app.evspCdmSyncCompliance(pack);
  assert.ok(pack.compliance.includes('cdm'));
  assert.ok(pack.compliance.includes('f10'));
  assert.ok(!pack.complianceNA.includes('f10'));
  assert.equal(pack.cdm.cdmComplianceManaged, false);
  assert.equal(pack.cdm.f10ComplianceManaged, false);
});

test('single-contractor readiness requires the full core, risk and controlled-document evidence', () => {
  const { context: app } = loadModule();
  const pack = makePack(app, { custName: '' });
  Object.assign(pack.cdm, {
    route: 'single_contractor',
    f10LongAndTwenty: 'no',
    f10PersonDays: 'no'
  });
  pack.cdm.docs.cpp.status = 'issued';

  let assessment = app.evspCdmAssessment(pack);
  assert.ok(assessment.blockingIssues.some(issue => issue.text.includes('commercial client')));
  assert.ok(assessment.blockingIssues.some(issue => issue.text.includes('contractor responsible')));
  assert.ok(assessment.blockingIssues.some(issue => issue.text.includes('planned construction start')));
  assert.ok(assessment.blockingIssues.some(issue => issue.text.includes('site manager')));
  assert.ok(assessment.blockingIssues.some(issue => issue.text.includes('construction phase plan')));
  assert.ok(assessment.blockingIssues.some(issue => issue.text.includes('design risks')));

  fillCore(pack.cdm);
  controlMinimumDocuments(pack.cdm);
  addControlledRisk(pack.cdm);
  app.evspCdmSyncCompliance(pack);
  assessment = app.evspCdmAssessment(pack);
  assert.equal(assessment.blockingIssues.length, 0);
  assert.equal(assessment.complete, true);
  assert.ok(pack.compliance.includes('cdm'));
});

test('multi-contractor routes require separately verified PD and PC appointments', () => {
  const { context: app } = loadModule();
  const pack = makeReadyPack(app, 'other_appointed');
  let assessment = app.evspCdmAssessment(pack);
  assert.equal(assessment.complete, true);

  pack.cdm.pdAppointmentConfirmed = false;
  assessment = app.evspCdmAssessment(pack);
  assert.ok(assessment.blockingIssues.some(issue => issue.text.includes("principal designer's written appointment")));
  pack.cdm.pdAppointmentConfirmed = true;
  pack.cdm.pcAppointmentDate = '2099-01-01';
  assessment = app.evspCdmAssessment(pack);
  assert.ok(assessment.blockingIssues.some(issue => issue.text.includes("principal contractor's written appointment")));
});

test('route selection preserves the selected route and reconfirms separate appointments only on change', () => {
  const { context: app } = loadModule();
  const state = app.newCdmPack();
  Object.assign(state, {
    route: 'delivery_appointed',
    pdAppointmentConfirmed: true,
    pcAppointmentConfirmed: true,
    pdAppointmentDate: DOCUMENT_DATE,
    pcAppointmentDate: DOCUMENT_DATE,
    pdAppointmentEvidence: 'PD-1',
    pcAppointmentEvidence: 'PC-1'
  });

  assert.equal(app.EvspCdmControls.selectRoute(state, 'delivery_appointed'), false);
  assert.equal(state.pdAppointmentConfirmed, true);
  assert.equal(state.pcAppointmentConfirmed, true);
  assert.equal(app.EvspCdmControls.selectRoute(state, 'other_appointed'), true);
  assert.equal(state.route, 'other_appointed');
  assert.equal(state.pdAppointmentConfirmed, false);
  assert.equal(state.pcAppointmentConfirmed, false);
  assert.equal(state.pdAppointmentEvidence, 'PD-1', 'evidence is retained for review rather than deleted');
});

test('risk removal fails closed when no confirmation service is available', async () => {
  const { context: app } = loadModule();
  assert.equal(await app.EvspCdmControls.confirmRiskRemoval(), false);
  app.confirm = () => true;
  assert.equal(await app.EvspCdmControls.confirmRiskRemoval(), true);
  app.askConfirm = () => Promise.resolve(false);
  assert.equal(await app.EvspCdmControls.confirmRiskRemoval(), false);
});

test('programme, appointment and controlled-document dates enforce chronology', () => {
  const { context: app } = loadModule();
  const state = app.newCdmPack();
  state.startDate = START_DATE;
  state.finishDate = '2024-01-31';
  assert.equal(app.EvspCdmControls.programmeValid(state), false);
  state.finishDate = FINISH_DATE;
  assert.equal(app.EvspCdmControls.programmeValid(state), true);

  Object.assign(state, {
    pdAppointmentConfirmed: true,
    pdAppointmentEvidence: 'PD-1',
    pdAppointmentDate: '2024-02-02'
  });
  assert.equal(app.EvspCdmControls.appointmentReady(state, 'pd'), false);
  state.pdAppointmentDate = DOCUMENT_DATE;
  assert.equal(app.EvspCdmControls.appointmentReady(state, 'pd'), true);

  controlDocument(state, 'cpp');
  assert.equal(app.EvspCdmControls.documentReady(state.docs.cpp, state, 'cpp'), true);
  state.docs.cpp.date = '2024-02-02';
  assert.equal(app.EvspCdmControls.documentReady(state.docs.cpp, state, 'cpp'), false);
  state.docs.cpp.date = '2099-01-01';
  assert.equal(app.EvspCdmControls.documentReady(state.docs.cpp, state, 'cpp'), false);
});

test('plan facts trigger natural excavation, interface, temporary-works, live and asbestos prompts', () => {
  const { context: app } = loadModule();
  const pack = makePack(app, {
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
      { type: 'mark', kind: 'fire' },
      { type: 'stamp', text: 'DANGER LIVE EQUIPMENT' },
      { type: 'stamp', label: 'Asbestos information required' }
    ] }]
  });
  const facts = app.EvspCdmControls.planFacts(pack);
  assert.equal(facts.trenchMetres, 12);
  assert.equal(facts.coneCount, 1);
  assert.equal(facts.exclusionCount, 1);
  assert.equal(facts.pedestrianCount, 1);
  assert.equal(facts.signboardCount, 1);
  assert.equal(facts.inspectionPitCount, 1);
  assert.equal(facts.spoilCount, 1);
  assert.equal(facts.liveCalloutCount, 1);
  assert.equal(facts.asbestosCalloutCount, 1);

  const suggestions = app.EvspCdmControls.suggestions(pack);
  const keys = new Set(suggestions.map(risk => risk.presetKey));
  assert.ok(keys.has('excavation'));
  assert.ok(keys.has('public_interface'));
  assert.ok(keys.has('temporary_works'));
  assert.ok(keys.has('electrical'));
  assert.ok(keys.has('building_fabric'));
  for (const suggestion of suggestions) assert.doesNotMatch(suggestion.source, /(^|\D)0\s/);
});

test('empty, incomplete and unrated design risks block readiness', () => {
  const { context: app } = loadModule();
  const pack = makeReadyPack(app);
  pack.cdm.risks = [];
  let assessment = app.evspCdmAssessment(pack);
  assert.equal(assessment.complete, false);
  assert.ok(assessment.blockingIssues.some(issue => issue.text.includes('design risks')));

  addControlledRisk(pack.cdm, {
    owner: '',
    status: 'open',
    initialLikelihood: '',
    residualSeverity: ''
  });
  assessment = app.evspCdmAssessment(pack);
  assert.ok(assessment.blockingIssues.some(issue => issue.text.includes('controlled status')));
  assert.ok(assessment.blockingIssues.some(issue => issue.text.includes('ratings')));

  Object.assign(pack.cdm.risks[0], {
    owner: 'Principal contractor',
    status: 'actioned',
    initialLikelihood: 4,
    residualSeverity: 2
  });
  assessment = app.evspCdmAssessment(pack);
  assert.ok(!assessment.blockingIssues.some(issue => issue.text.includes('controlled status')));
  assert.ok(!assessment.blockingIssues.some(issue => issue.text.includes('ratings')));
});

test('accepted RAMS needs controlled review metadata and module ownership unwinds safely', () => {
  const { context: app } = loadModule();
  const managed = makePack(app, {
    attachments: [acceptedRams({ cdmReviewer: '' })]
  });
  app.evspCdmSyncCompliance(managed);
  assert.ok(!managed.compliance.includes('rams'));
  assert.equal(managed.cdm.ramsComplianceManaged, false);
  assert.equal(app.EvspCdmControls.supportingReady(managed.attachments[0]), false);

  managed.attachments[0].cdmReviewer = 'Principal contractor';
  app.evspCdmSyncCompliance(managed);
  assert.ok(managed.compliance.includes('rams'));
  assert.equal(managed.cdm.ramsComplianceManaged, true);
  managed.attachments[0].cdmStatus = 'reviewed';
  app.evspCdmSyncCompliance(managed);
  assert.ok(!managed.compliance.includes('rams'));
  assert.equal(managed.cdm.ramsComplianceManaged, false);

  const manual = makePack(app, {
    compliance: ['rams'],
    attachments: [acceptedRams()]
  });
  app.evspCdmSyncCompliance(manual);
  assert.equal(manual.cdm.ramsComplianceManaged, false);
  manual.attachments[0].cdmStatus = 'reviewed';
  app.evspCdmSyncCompliance(manual);
  assert.ok(manual.compliance.includes('rams'));
});

test('explicit RAMS manual override remains authoritative while accepted evidence exists', () => {
  const { context: app } = loadModule();
  const pack = makePack(app, { attachments: [acceptedRams()] });
  app.evspCdmSyncCompliance(pack);
  assert.ok(pack.compliance.includes('rams'));
  assert.equal(pack.cdm.ramsComplianceManaged, true);

  pack.cdm.ramsComplianceManaged = false;
  pack.cdm.ramsComplianceManual = true;
  pack.compliance = [];
  pack.complianceNA = ['rams'];
  app.evspCdmSyncCompliance(pack);
  assert.ok(!pack.compliance.includes('rams'));
  assert.ok(pack.complianceNA.includes('rams'));
  assert.equal(pack.cdm.ramsComplianceManaged, false);
});

test('supporting files receive safe filename category suggestions only during explicit sync', () => {
  const { context: app } = loadModule();
  const pack = makePack(app, {
    attachments: [
      { id: 'a1', name: 'Site RAMS Rev A.pdf' },
      { id: 'a2', name: 'Principal contractor appointment letter.pdf' },
      { id: 'a3', name: 'LSBUD utility search.pdf' }
    ]
  });
  app.evspCdmSyncCompliance(pack);
  assert.deepEqual(Array.from(pack.attachments, file => file.cdmCategory), ['rams', 'appointment', 'utilities']);
});

test('CDM card remains scoped to the commercial workspace', () => {
  const { context: app } = loadModule();
  const domestic = { mode: 'domestic', cdm: app.newCdmPack(), compliance: [], complianceNA: [] };
  assert.equal(app.evspCdmCardHTML(domestic), '');

  const commercial = makePack(app);
  const card = app.evspCdmCardHTML(commercial);
  assert.match(card, /id="evspCdmOpen"/);
  assert.match(card, /CDM project controls/);
});

test('not-applicable documents require a recorded reason', () => {
  const { context: app } = loadModule();
  const state = app.newCdmPack();
  state.docs.excavation.status = 'not_applicable';
  const pack = makePack(app, { cdm: state });
  let assessment = app.evspCdmAssessment(pack);
  assert.equal(assessment.docs.ready, 0);
  pack.cdm.docs.excavation.notes = 'No excavation or buried route is included in the agreed scope.';
  assessment = app.evspCdmAssessment(pack);
  assert.equal(assessment.docs.ready, 1);
});

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
  splitTextToSize(value, width) {
    const text = String(value ?? '');
    const limit = Math.max(12, Math.floor(Number(width) || 40));
    if (!text) return [''];
    const lines = [];
    for (let offset = 0; offset < text.length; offset += limit) lines.push(text.slice(offset, offset + limit));
    return lines;
  }
  text(value) {
    if (Array.isArray(value)) this.textCalls.push(...value.map(String));
    else this.textCalls.push(String(value));
  }
  save(name) { this.savedName = name; }
}

test('CDM PDF export marks only a complete preflight as ready and uses route-aware sections', () => {
  const { context: app } = loadModule();
  app.jspdf = { jsPDF: FakePdf };
  app.confirm = () => true;

  const readyPack = makeReadyPack(app, 'other_appointed');
  readyPack.attachments = [acceptedRams()];
  assert.deepEqual(Array.from(app.EvspCdmControls.preflight(readyPack)), []);
  assert.equal(app.evspCdmExportPdf(readyPack), true);
  let pdf = FakePdf.last;
  assert.equal(pdf.savedName, 'Fleet_depot_CDM_project_controls.pdf');
  assert.ok(pdf.pages >= 9);
  let output = pdf.textCalls.join('\n');
  assert.match(output, /CONTROL RECORD READY FOR REVIEW/);
  assert.match(output, /Principal contractor review/);
  assert.match(output, /Principal designer coordination review/);
  assert.match(output, /Principal designer handover/);
  for (const heading of [
    'Project and duty holders',
    'Pre-construction information',
    'Controlled document register',
    'Designer risk register',
    'Construction phase plan arrangements',
    'Permit-to-work register',
    'Health and safety file and handover'
  ]) assert.match(output, new RegExp(heading));

  const draftPack = makePack(app);
  app.confirm = () => true;
  assert.equal(app.evspCdmExportPdf(draftPack), true);
  pdf = FakePdf.last;
  output = pdf.textCalls.join('\n');
  assert.match(output, /DRAFT CONTROL RECORD/);
  assert.doesNotMatch(output, /CONTROL RECORD READY FOR REVIEW/);
});

test('long PDF paragraphs paginate instead of overflowing a single page', () => {
  const { context: app } = loadModule();
  app.jspdf = { jsPDF: FakePdf };
  app.confirm = () => true;
  const pack = makeReadyPack(app);

  assert.equal(app.evspCdmExportPdf(pack), true);
  const baselinePages = FakePdf.last.pages;
  pack.notes = 'Long project note. '.repeat(700);

  assert.equal(app.evspCdmExportPdf(pack), true);
  assert.ok(FakePdf.last.pages > baselinePages, `expected more than ${baselinePages} pages, got ${FakePdf.last.pages}`);
});
