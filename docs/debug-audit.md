# Debug audit, 1 October 2026

Target: `codex/design-preview`, draft PR #12. The deployed preview uses the existing drawing engine with the workspace, profile, delivery and report modules. The original planner bundle and Commercial MarkUp Build 83 were inspected as source references.

## Fixes

| Area | Fault | Change |
| --- | --- | --- |
| Plan changes | A cable route could be discarded or committed onto the next plan. Several navigation paths changed the active photo directly. | Finish a valid route on its source plan before switching, duplicating, deleting or creating a plan. Apply the same handling to the plan selector, sidebar, survey and snag links. |
| Selection and history | Old multi-selection IDs survived a new project, Undo or Redo. | Clear selection and placement state when changing context; clear multi-selection on history restoration. |
| Dialog keyboard input | Delete and Undo could affect the drawing behind a PDF or technical dialog. | Isolate modal keyboard events and make drawing shortcuts respect modal and inert state. |
| Project validation | Damaged workspace or programme data could replace the current project before rendering failed. Duplicate IDs made references ambiguous. | Check supported backup structures before replacing a project. Reject malformed imports and saved records while retaining the open project. Apply validation to startup recovery. Older optional fields may remain absent. |
| Saved project list | A non-array project index broke startup. When local storage was full, complete IndexedDB projects could disappear from the list. | Validate index entries and persist the index to IndexedDB as well as local storage, with a memory fallback and dated recovery. Wait for index persistence before reporting a successful save. |
| PDF reviews | Overlapping refreshes could erase the newest canvas. A disposed viewer could modify its replacement. | Check request ownership after asynchronous steps, detach old event handlers and discard superseded PDF documents. Propagate an initial rendering failure to the enclosing review. |
| PDF import | Cancelling page rendering could still add pages. Changing selection could re-enable Add during an import. | Guard each asynchronous step, lock selection during preparation, make page choices keyboard-accessible and release PDF documents in `finally`. |
| Image import | A project switch could save before photo decoding finished. | Track imports and finish them before saving and switching projects. Await the image import when adding PDF pages. |
| Delivery history | Programme notes and snag report details had no distinct Undo entry. | Record an edit group for each focus session. |
| Drawing display | Label controls could reflect the previous context. The external key stopped updating when the export legend was hidden. | Refresh the displayed preference and update the key independently of export legend visibility. |
| Detected circuit load | “From plan” included future and hidden chargers, ignored current caps and used a different lamp-column current from the other planner totals. | Count visible installed AC sockets using their recorded limits and the existing socket ratings. Update the button description to state that recorded caps are included and diversity is not applied. |

## Verification

The release checks comprise 105 tests and browser scenarios:

| Suite | Checks | Coverage |
| --- | ---: | --- |
| Static and integration | 50 | Script syntax, asset paths and versions, synchronised entry pages, release gates, CDM behaviour, report copy and calculation consistency |
| Workspace browser | 10 | Home, recovery, metadata-only work, queued saves, backup round trips, PDF download and supporting pages |
| Profile browser | 8 | Details, qualifications, logo processing, import/export, privacy settings, storage failure and phone layout |
| Design browser | 7 | Selection, drag/Undo, equipment placement, focus, search, filters, backup and responsive navigation |
| Refinement browser | 6 | Equipment search and copies, persistent favourites, plan key, all report reviews, profile sample and phone controls |
| Deep-debug browser | 24 | Isolated failure cases for project switching, malformed data, quota failures, PDF races, import cancellation, calendar dates, history and display state |

Calculation checks cover every configured cable family, size, method and phase combination for missing lengths and voltage-drop scaling. Separate connected-plan fixtures check configured current limits, future positions, hidden design options, twin sockets and lamp-column units. These verify software consistency, not the validity of the cable rating tables or an installation design.

Browser checks use Chromium with desktop, tablet and 390 px / 320 px phone viewports. Mocked timing and storage failures make asynchronous failure paths repeatable; a real two-page PDF also exercises the import pipeline. Export suites create actual marked-plan, programme, snag, engineer, client and profile-sample PDFs.

Browser assertions that read state before asynchronous navigation completed now wait for the relevant view. The design regression also checks that Undo closes the inspector after clearing selection. Failure-path tests use a 20-second timeout to accommodate PDF rendering under concurrent browser load.

## Running the checks

Use the Playwright setup in the README, then run:

```sh
npm run build
npm test
npm run test:browser
npm run test:profile
npm run test:design
npm run test:refinement
npm run test:debug
```

`EVSP_CASE` filters the deep-debug suite by scenario name. `EVSP_TEST_OUTPUT` selects the folder for browser results, failure screenshots and downloaded files.

## Scope limits

This pass covers application behaviour and the identified calculation inconsistency. It does not revalidate electrical reference tables, regulations or product datasheets. Safari, Firefox and physical-device camera/HEIC behaviour were not exercised. Browser-local storage still requires downloaded backups for transfer or recovery after browser data is cleared. The held-back features remain excluded from deployment.
