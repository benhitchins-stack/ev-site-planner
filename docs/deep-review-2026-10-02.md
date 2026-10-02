# Deep review — 2 October 2026

Repository: `benhitchins-stack/ev-site-planner`  
Baseline: `f568c9051d483ed0158efc5b01ca349fbbc580e6`  
Review branch: `codex/deep-review-2026-10-02`  
Changes and verification: [PR #14](https://github.com/benhitchins-stack/ev-site-planner/pull/14)

The product already combines survey capture, plan markup, equipment selection,
calculations, programmes, snags, professional profiles and PDF delivery. The
highest-value work in this pass was protecting saved work, making incomplete
calculations explicit and running the existing browser tests automatically.
The fixes are on the review branch; merging and production deployment are
separate actions.

## Confirmed findings and changes

| Priority | Trigger and previous behaviour | Change and verification |
| --- | --- | --- |
| High | Downloading a backup during image decoding omitted unfinished photos. An active cable route was not yet part of the saved drawing. | Backup now waits for tracked imports, finishes the route on its source plan and locks project changes until the download is initiated. Browser tests inspect the downloaded JSON and exercise duplicate clicks. |
| High | Saving project 101 removed older entries from the project index even though their full records could still exist. | Removed silent truncation in both save implementations. A 105-project fixture verifies retention after save and reload. This does not automatically rediscover entries lost before the fix. |
| High | Backup IDs and image attributes could carry markup into legacy HTML templates; dangerous dictionary keys were accepted. | Validate portable media, identifiers, unique IDs, prototype keys and measurement structure before replacement. Escape identifiers and photo attributes in legacy markup, and use prototype-free calculation dictionaries. Invalid imports preserve the current project. This is targeted hardening, not a claim of a complete penetration test. |
| High | Negative or malformed manual lengths were accepted, including partial numeric text such as `12m`. | Require a finite positive number, show an inline error and retain the last valid value. Blank input clears the override. Imported invalid lengths/scales are rejected; unusable calculations remain incomplete. |
| High | An upstream cable with a missing specification/length could contribute zero to Zs while downstream checks still reported success. | Known incomplete upstream impedance now leaves Zs and CPC unchecked. Tests compare missing and completed upstream data. |
| High | TT CPC checking returned a pass solely because the supply was TT, without recorded disconnection data. | It now reports incomplete and asks for separate CPC verification. Updated the calculator, status wording and exported calculation wording. Reference tables and RCD assumptions were not revalidated. |
| High | Vendored PDF.js 3.11.174 predates the fix for CVE-2024-4367. | Centralised PDF loading with `isEvalSupported: false` for imports, document previews and profile samples. This mitigates the font-code execution path; upgrading the library is still a priority. |
| Medium | A slow postcode response could populate the next project's blank address; cleared/changed queries could show stale suggestions. | Invalidate suggestions on each input change and require both project identity and selected postcode to match before applying an address response. Four controlled-response tests cover the races. |
| Medium | Programme rows with duplicate IDs edited the wrong record; legacy rows without IDs were not independently editable. | Reject duplicate imported activity IDs and assign IDs to legacy rows on use. Browser tests edit the second legacy activity without changing the first. |
| Medium | Escape did not close engineer/client PDF reviews because the dialog swallowed the event. | Handle Escape in the review itself and release the inert workspace. Tested with real report previews. |
| Medium | WebKit reported a ResizeObserver loop when drawing and inspector layout changed during an observation callback. | Coalesce canvas resizing onto an animation frame so layout writes happen outside the observation cycle. The cross-browser tests retain strict exception checks. |
| Improvement | Every visit loaded a 1,351,840-byte HEIC converter, even for JPEG/PDF-only work. | Load it only after native HEIC decoding fails, share concurrent loads and allow retry after failure. This removes about 1.35 MB of uncompressed JavaScript from ordinary startup; it is not a measured wall-clock speed claim. |
| Improvement | Deployment ran static tests only; the six browser suites were optional. | Add PR checks and a reusable deployment gate. Build drift, static checks, all six Chromium suites and a three-engine reliability suite must pass before Pages publishes. |

The baseline static checks and five of six Chromium suites passed. The first
design-suite run failed an item-selection assertion; a subsequent run passed.
The test now waits for the deferred canvas layout before sampling click
coordinates and includes useful diagnostics on failure. The newly introduced
WebKit checks identified the ResizeObserver problem above.

## Verification

The PR checks are the source of truth for the final result and exact tested
commit. They execute the committed site on a local HTTP server inside GitHub
Actions, not against the production domain.

| Suite | Coverage |
| --- | --- |
| Node test runner | Existing release, CDM, RAMS and calculation checks; new backup validation, measurements, incomplete circuit data, postcode races and PDF policy tests |
| Six existing Chromium browser suites | Workspace/recovery, profile/branding, drawing controls, equipment/refinement, failure paths and report presentation |
| Reliability in Chromium, Firefox and WebKit | Complete backup downloads, pending imports, duplicate actions, long project indexes, invalid measurements, safe imports, legacy activities, Escape, lazy HEIC loading and retry |
| Build consistency | Python packaging followed by a clean diff check, so all four entry pages and content hashes agree |

Use the commands in the README. Results, PDFs and failure screenshots are
retained as CI artifacts for 14 days. HEIC loader tests use a controlled decoder
response; native phone capture and real HEIC conversion still need device tests.

No claim is made here about physical iOS/Android devices, live DNS/TLS/caching,
all assistive technologies, exhaustive malformed-file fuzzing, or conformity of
electrical tables and regulatory guidance. WebKit automation is useful Safari
engine coverage, not a physical iPhone sign-off.

## Recommended next work

| Order | Recommendation | Why it matters / useful acceptance criterion |
| --- | --- | --- |
| 1 | Upgrade and inventory vendored libraries, starting with PDF.js. | Track actual bundled versions, licences, hashes and advisories. `npm audit` does not inspect arbitrary vendored browser files. Keep import/worker/export tests during the upgrade. |
| 1 | Commission an electrical and guidance review with versioned sources. | Review cable tables, derating, protective devices, upstream topology, phase assumptions, TT/RCD treatment and product ratings. Every assumption should name its source and review date. Do not describe the software test pass as design approval. |
| 1 | Protect concurrent editing and improve recovery. | Storage queues currently belong to each tab. Add a single-writer lease or conflict-aware revisions, a clear “open in another tab” state, backup reminders and an index-repair tool. Never silently overwrite a newer revision. |
| 2 | Introduce a versioned project schema and migration fixtures. | Validate every nested record and reference, maintain a corpus of real historical backups, and separate invalid-file rejection from recoverable legacy repairs. Keep the old record until migration succeeds. |
| 2 | Separate drawing, domain calculations and persistence. | The canonical HTML was approximately 1.62 MB and 15,900 lines at baseline, with four generated copies. Extract modules gradually behind tests instead of rewriting the product. |
| 2 | Reduce unnecessary work while drawing. | `draw()` also normalises the pack, rebuilds side controls and schedules persistence. Separate repaint from data edits, then measure pan latency, long-task duration and large-project memory use. |
| 2 | Extend real-device and accessibility coverage. | Test iPhone/iPad camera imports, touch/pen interactions, orientation, keyboard-only operation and VoiceOver/NVDA. Verify report text and reading order as well as page images. |
| 2 | Make evidence and issued revisions explicit. | Store the revision and document snapshot behind each export. Download history currently records a download, not sending, receipt, approval or installation certification. |
| 3 | Add deliberate offline support and optional encrypted sync. | A static site is not automatically an offline PWA. Establish cache upgrades, storage eviction recovery and conflict handling before collaborative editing or customer sharing. |
| 3 | Review the old open PR #2 separately. | It was created against an older planner. Compare any unique tests before closing or superseding it; avoid merging the old implementation wholesale over this release. |

The 1.96 MB report-font bundle is another candidate for deferred loading, but
that needs coordinated changes to synchronous and asynchronous PDF producers.
Keep the HEIC improvement separate from claims about end-to-end load speed until
a repeatable performance baseline exists.

## Product ideas worth exploring

| Idea | What the installer or customer gains | First useful version |
| --- | --- | --- |
| Evidence and confidence overlay | See which decisions are measured, assumed or awaiting a photo instead of treating every symbol as equally certain. | A toggle showing missing scale, site data and evidence links, with “next best survey action”. |
| Compare design options | Explain why option A or B is preferable using cable length, trenching, hardware, indicative cost and available capacity. | Side-by-side snapshots with changed quantities and explicit costing assumptions. |
| Change impact preview | Know what must be revisited when a charger, cable, supply or layout changes. | “This edit affects these calculations, materials and issued documents”, with links to each record. |
| Charging-day simulator | Explore fleet arrival/departure patterns, delivered energy, queues, tariffs and supply constraints. | A visual 24-hour scenario using user-entered assumptions and showing unserved demand. |
| Visual phase balancing | Make an uneven three-phase design obvious. | Three phase bars and a proposed reassignment, requiring the designer to confirm the real wiring and loads. |
| Future expansion view | Plan today's ducts and spare capacity around tomorrow's chargers. | Toggle staged rollouts and show future trenching avoided, spare ways and unverified capacity assumptions. |
| Survey missions | Reduce return visits caused by missing measurements or evidence. | A dynamic checklist tailored to domestic, workplace, fleet or rapid charging, with photo slots and offline drafts. |
| Access and manoeuvring checks | Spot obstructed access routes, charging-cable reach problems and vehicle conflicts earlier. | Calibrated geometry overlays with configurable dimensions and a manual review step. |
| Construction calendar presets | Reduce repetitive programme setup. | UK nation/year bank holidays with source dates, editable exclusions, and calendar export. |
| Revision time machine | Explain exactly what changed since a quote or drawing was issued. | Immutable saved revisions, visual plan differences and a concise change schedule. |
| Customer handover QR | Give the client a clear, controlled handover rather than a loose folder of files. | An explicit published read-only document pack with expiry/revocation; requires a sharing service. |
| Carbon and disruption comparison | Compare shorter trenches, reuse and phased delivery using transparent assumptions. | Quantities multiplied by cited factors, shown alongside cost rather than a vague “green score”. |
| Photo-assisted drafting | Save time locating bays, equipment and potential routes. | Suggested annotations on a photo that the user accepts individually; never infer reliable scale or electrical facts without evidence. |
| Site replay / digital twin | Walk through proposed construction and charging use before anyone reaches site. | Animate programme phases and proposed equipment on the existing 3D view, tied to the recorded plan. |

Start with evidence/confidence, design comparison and change impact. They build
on data the product already records and can improve everyday decisions before
adding accounts, integrations or large external datasets.
