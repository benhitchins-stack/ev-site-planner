# EV Site Planner: testing

## Setup

```bash
npm install
npx playwright install chromium   # once per machine
```

Node 18+ is required (Node 20 is what CI uses).

## Running the app locally

```bash
npm start          # serves public/ at http://localhost:8000
PORT=3000 npm start
```

## Running the tests

```bash
npm test                     # full suite, all viewport projects
npm run test:desktop         # desktop Chromium only (fastest signal)
npm run test:headed          # watch the browser
npm run test:ui              # Playwright UI mode
npm run test:report          # open the last HTML report
npx playwright test tests/planner-stages.spec.js --project=desktop-chromium
```

The config starts `node serve.mjs` itself on port 8010 (override with
`PW_PORT`), so tests never disturb a dev server you already have running on
8000. On failure you get a screenshot, a trace (`retain-on-failure`) and an
HTML report under `playwright-report/`.

## Projects and viewports

| Project | Device | Specs |
|---|---|---|
| desktop-chromium | 1440 x 900 | every spec |
| laptop-chromium | 1280 x 720 | smoke + responsive |
| tablet-ipad-portrait / -landscape | iPad gen 11 | smoke + responsive |
| mobile-iphone | iPhone 13 | smoke + responsive + accessibility |
| mobile-small | iPhone SE (3rd gen) | responsive |

## Suite layout

```
tests/
  helpers.js                  shared open/seed/probe helpers + console guard
  fixtures/
    site-photo.png            small committed photo used by upload tests
    legacy-project.json       pre-Phase-1 saved-project record
    seeds.js                  storage seed functions (legacy, quotes, support)
  planner-smoke.spec.js       boot, routing, welcome, mode handling
  planner-stages.spec.js      stage navigation, statuses, persistence
  planner-next-action.spec.js deterministic next-action states
  planner-issues.spec.js      issue severities, links, resolution
  planner-canvas.spec.js      drawing round trip, undo/redo, zoom/pan
  planner-starters.spec.js    domestic + commercial starter layouts
  planner-survey.spec.js      guided survey and site walk
  planner-storage.spec.js     autosave, legacy records, migrations
  planner-links.spec.js       Quotes, RAMS gate, Project Support
  planner-exports.spec.js     PNG, PDFs, CSVs, DNO, programme, BOM, decision pack
  planner-responsive.spec.js  layout behaviour per viewport
  planner-accessibility.spec.js names, labels, focus, dialogs, reduced motion
```

Console policy: every test fails on any browser console error or uncaught
exception. The only filtered messages are resource-load failures caused by
the suite's own offline network stub (external requests are blocked; the
postcode lookup is fulfilled with an empty result). Add new allowlist entries
to `HARMLESS_CONSOLE` in `tests/helpers.js` only with a comment explaining
why the message is harmless.

## Writing a regression test

1. Reproduce the bug in the smallest spec that fits the area.
2. Drive the real UI (clicks, keyboard, file inputs). Use `page.evaluate`
   only to arrange state or read internals, not to fake user actions.
3. Prefer stable hooks: element ids, `data-stage`, `data-ovact`,
   `data-shotadd` and friends. Avoid free-text selectors except for
   user-visible copy the test intentionally asserts.
4. Seed storage through `openPlanner(page, { seed, seedArg })` so the seed
   runs before the app boots.
5. Keep fixtures tiny and committed. `legacy-project.json` documents the old
   record shape; extend it rather than inventing new legacy variants.

## Known limitations

- Chromium only. WebKit and Firefox are not exercised; the app targets
  Safari/Chrome/Edge, so WebKit coverage is a sensible Phase 2 addition.
- PDF outputs are checked for existence and size, not content.
- The site walk's camera capture cannot be automated (no camera); the walk
  overlay's open/close and file-based paths are covered instead.
- True touch gestures (pinch zoom) are not simulated; zoom is covered via
  the buttons and wheel path.
