# Phase 1 audit: seven-stage planner restructure

Scope: audit of PR #1 (merge commit `394fd43`) against its stated claims,
performed on branch `claude/phase-1-stabilisation-tests` together with the
introduction of the committed Playwright suite. Method: code inspection of
`public/EV Site Planner.html`, instrumented browser probes, the new automated
suite (see `docs/TESTING.md`) and a scripted manual walkthrough reviewed
screenshot by screenshot.

## Claim-by-claim verification

| PR #1 claim | Result | Notes |
|---|---|---|
| Seven-stage navigation (Overview + 7) | Verified | All 8 buttons present, free movement, one active stage, `aria-current="step"` after fix |
| Project overview | Verified | Header, next action, stages, issues, summary, linked records all render from real data |
| Deterministic Next action | Verified | State matrix covered by `planner-next-action.spec.js`; no invented values found |
| Stage statuses from real data | Verified | `evalProject()` reads pack + existing check helpers only; no hard-coded statuses found |
| Stage status wording | Verified after fix | "Ready" relabelled "Ready for review" for transparency |
| Issue summary with severities | Verified | Severities match rules; counts equal visible rows; no duplicates (tested) |
| Unresolved counts | Verified | Badge counts are outstanding items per stage; header issue links use issue counts. Semantics documented |
| Stage explanations inspectable | Verified after fix | Stage header, overview rows, tooltips and now aria-labels carry the reasons |
| Client field (`pack.custName`) | Verified | Binds the existing field; shown in projects list and quote imports |
| Collapsible side panel (desktop) | Verified | Toggle collapses; any stage click restores |
| Find palette stage entries | Verified | "Project overview" and "Stage: ..." entries searchable |
| Project Support storage key correction | Verified | Reads `evsp_ps_v2` with v1 fallback; chip resolves (tested with seeded store) |
| Legacy stage-key migration | Verified | All six legacy values map; unknown values fall back safely |
| Domestic behaviour | Verified after fix | See bug 3: File > New desynced the mode chrome |
| Commercial behaviour | Verified | Starter presets, supply-rating requirement, DLM issues all exercised |
| Desktop / tablet / mobile behaviour | Verified | 6 viewport projects in CI; drawer, stage bar and touch targets tested |
| Existing exports | Verified | PNG, engineer PDF, cable CSV, DNO text, programme PDF, materials CSV, decision pack, handover PDF all produce non-empty downloads |
| Existing drawing tools | Verified | Round-trip spec covers place, route, measure, move, duplicate, delete, undo, redo, zoom, pan |
| Existing saved projects load | Verified | Committed legacy fixture opens with `projId`, items and mode intact |
| PR #1 claimed "extensive Playwright testing" | Partially implemented | The testing happened but nothing was committed. Corrected by this phase: the suite now lives in the repository and runs in CI |

## Bugs found and fixed in this phase

1. Field-only projects lost on refresh (pre-existing). The boot restore
   required photos in the autosave, so a pack holding only typed details
   booted blank. Restore now accepts any pack with substance (photos or
   identity fields). Regression tests: `planner-storage.spec.js`
   ("autosave restores a field-only project"), `planner-stages.spec.js`
   ("stage fields survive ... refresh").
2. Working session lost its `projId` after visiting a satellite
   (pre-existing). `autosaveNow()` snapshotted the pack before
   `saveCurrentToProjects()` assigned the id, so a restored session minted a
   duplicate project and orphaned quote links. The save order is now id
   first, snapshot second. Regression test: `planner-links.spec.js`
   ("Quotes handoff ... returning keeps state").
3. File > New desynced the mode chrome (pre-existing). The new pack reset to
   the commercial default while the header, subtitle and tool palette stayed
   in the previous mode, and `setMode` then refused to fix it because the
   pack already claimed the target mode. New now keeps the working mode and
   syncs the chrome. Regression test: `planner-smoke.spec.js`
   ("File > New keeps the working mode").
4. Stage tooltips showed escaped entities for user data (Phase 1
   regression). A DNO reference like `A&B` rendered as `A&amp;B` in the
   stage button tooltip. User data is now escaped at render time, not at
   construction time. Regression test: `planner-issues.spec.js`
   ("stage tooltips render user data with special characters cleanly").
5. Zoom buttons had no accessible name (pre-existing). `#zin`/`#zout` now
   carry titles and aria-labels. Tested in `planner-accessibility.spec.js`.
6. Stage status communicated by colour only (Phase 1 gap). Stage buttons now
   expose an aria-label with state, count and the first reason;
   `aria-current` uses `step`. Screen readers previously heard "Survey5".
7. Standard dialogs ignored Escape (pre-existing). Welcome, Projects,
   Programme, DNO, BOM, simulator and wizard dialogs now close on Escape
   through their existing Close/Skip buttons; overlays with their own
   handlers are untouched.
8. "Ready" stage label could over-claim (wording). Now "Ready for review".

Also included: a consistent branded focus ring on primary controls (the
varied browser defaults remained visible but inconsistent), and
`aria-hidden` on decorative dots and count pills inside stage buttons.

## Not fixed, documented as accepted behaviour

- `renderSide()` runs on every `draw()` including pan/zoom frames
  (pre-existing design). Measured cost about 7 ms per rebuild on a 75-item
  pack; `evalProject()` adds 0.3 ms cold and near zero warm thanks to its
  dirty-flag cache, so Phase 1 added no measurable regression. A targeted
  optimisation was considered and rejected as unjustified by evidence.
- Stage badge counts are item counts while the issue list groups items into
  issues; the two intentionally differ (badge 3 open snags = one issue row).
- The last ~700 ms of edits can be lost if the tab closes before the
  debounced autosave lands (see `docs/STORAGE.md`).

## Performance sanity numbers (local, Chromium 141, this container)

| Measure | Value |
|---|---|
| Planner HTML size | 1.53 MB raw, 0.43 MB gzip |
| Cold load to interactive stage bar | ~506 ms (DCL ~334 ms) |
| Open a saved project (starter + 4 photos, 75 items) | ~103 ms |
| Synchronous autosave cost | 0.4 ms (writes are async) |
| `renderSide()` rebuild | ~7 ms at 75 items |
| `evalProject()` | 0.3 ms cold, ~0 ms cached |
| 30 pan frames with side rebuilds | ~511 ms (~17 ms/frame, pre-existing pattern) |

## Test coverage summary

79 tests across 12 spec files and 6 viewport projects (desktop 1440x900,
laptop 1280x720, iPad portrait and landscape, iPhone 13, iPhone SE). Every
test fails on unexpected console errors. Areas: boot, stages, next action,
issues, canvas, starters, guided survey, storage and legacy compatibility,
cross-module links, exports, responsive layout, accessibility smoke.

## Manual walkthrough (performed and screenshot-reviewed)

Blank domestic project; domestic starter plus guided survey shot; blank
commercial project plus full starter; all seven stages and overview; issue
link deep-dive (opens stage, highlights card, focuses field); desktop side
panel collapse and restore; engineer PDF export; Quotes handoff and return
with `projId` preserved; RAMS gate message; Project Support chip from seeded
v2 store; legacy saved project opened from the Projects dialog; tablet and
mobile overview, drawer and stage bar.

## Known risks going into Phase 2

1. Single-file planner: merge conflicts and review size grow with every
   change; consider extraction only with the offline single-file use case
   settled first.
2. Device-local storage only; no backup story beyond file export.
3. Chromium-only CI; no WebKit coverage yet.
4. The DC runtime satellites have no automated coverage beyond link
   resolution and page-load smoke.
5. Per-frame side panel rebuild is the first candidate if canvas feel
   degrades on low-end tablets.

## Recommended next phase

Project integrity work: cross-module consistency checks (quote drift is a
good template), export completeness gates driven by the existing stage
statuses, a WebKit CI project, and extraction of the status engine into a
shared module with unit tests once the single-file question is decided.
