# Site audit and evidence pack

Added October 2026. A site audit checks an existing EV charging site against
PAS 1899:2022 (accessible public chargepoints) and the Public Charge Point
Regulations 2023, records the evidence and produces an evidence pack PDF for a
council or funder submission. It does not certify compliance.

## Where it lives

- `public/audit-core.js` holds the 23 checks (14 accessibility, 9 payment and
  consumer), the site types, the outcomes and the pure functions the page and
  the pack share: `create`, `ensure`, `slots`, `summary`, `indexSummary`,
  `findings`, `gaps`, `copyAnswers`, `removeUnit` and `validate`. It runs in
  Node for `tests/audit-core.test.mjs`.
- `public/audit.js` renders the Site audit page (route `audit`), the overview
  of an audit-only project, the four-step audit stage strip, the card on a
  normal project's overview, evidence photos and `buildPack`, the PDF builder
  that uses `EVDelivery.pdfKit`, the report fonts and the shared branding.
- `public/audit.css` styles the page with the workspace controls.
- `workspace.js` adds the route, the actions (`audit`, `audit-setup`,
  `audit-evidence`, `audit-pack`, `new-audit`), the project list filter and
  pill, the Issue page card and `newProject(example, audit)`.
- `delivery.js` opens the pack in the shared review dialog (`openReport('audit')`).
- `home.js` lists audit projects under Site audits with a New audit button.

The checks were ported from the held-back council library in
`unreleased/public/estate-check-library.js` (draft v0.9, 5 July 2026) with a
`scope` added to each: `site` checks are answered once, `unit` checks once per
chargepoint. The electrical, highways and grant sections of that library are
not included.

## What is saved

One record per project, `pack.audit`, added to the existing project record so
older saves simply lack it:

```
{schema:1, kind:'audit'|'project', siteType, isPublic:true|false|null, operator,
 auditor, date, notes, units:[{id:'cp1', label, make, kw, location}],
 answers:{'ACC-02:cp1':{outcome, note, reason, measure, photos:[{id, src, name, at}], at, by}},
 createdAt}
```

`kind:'audit'` marks an audit-only project, which keeps its site details on the
audit page and shows the audit overview. Photos are JPEG data URLs resized to
1,600 px, up to four per check. The project index row carries
`audit:{kind, siteType, done, total, fail, action}` from `projStatusMeta`, so
Home and Your projects show progress without opening the record.

`validateProjectBackup` calls `EVAuditCore.validate` on import, so a damaged
audit rejects the backup and keeps the open project. `hasMeaningfulPackContent`
treats an audit as content once a site type, an operator, an answer or a second
chargepoint is recorded, so an untouched New audit is not saved as a project.
No storage key, autosave, undo or backup behaviour changed.

## Checks

`tests/audit-core.test.mjs` covers the check data, applicability, per-chargepoint
slots, copying, summaries, gaps, record repair, validation and the planner hooks.
`tests/reliability.browser.cjs` has three scenarios: a project audit with
answers, a measurement, a photo, undo, reload and a backup round trip (including
a refused damaged backup); an audit-only project from Home with a copied
chargepoint, the evidence pack preview and download, and the Home and project
list entries; and the phone layout.
