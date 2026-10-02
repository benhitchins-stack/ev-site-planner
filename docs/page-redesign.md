# Page redesign

Implemented 2 October 2026. The sidebar, routes and project flow are unchanged; this pass redesigns the page content.

## Review findings

- **Your projects** gave three equal-weight header buttons, including the rarely needed recovery action. The current project appeared twice with the same details. Project rows showed little beyond a name and date, and one project left most of the page empty.
- **Project overview** did not show progress through Markup, Design lab, Programme, Snags and Issue in one place. The right column ended early, the lower sections had no card edges and different alignments, and a heavy outline surrounded the title after navigation.
- **Design lab and Snags** used tall count tiles with uppercase labels and no status colour. Design lab sections wrapped onto two rows of buttons on tablets.
- **Review & issue** left the seventh document type alone on a row.
- **Programme and snag registers** used 10–12px text, which is small on a tablet.

## Changes

- Your projects has New project and Open backup in the header, a Continue working card with the plan, counts and Open project / Go to markup actions, and a card grid with plan previews, type and revision, plan / charger / open-snag counts, record checks and the edit date. The project already open is marked "Open now". The whole card opens the project. Recovery moved to a storage panel at the foot of the page. Phones use compact rows.
- The project overview adds a five-step stage bar. Each step shows a status (done, in progress, needs attention or to do) and opens its page. The plan card carries the plan, charger, route and snag counts. A Record checks card lists the existing readiness checks beside Next actions. Site and contacts, Programme, Recent downloads and Project backup are equal cards. Tablets show the plan full width with the two summary cards side by side.
- Design lab sections use a single scrolling tab row. Count tiles in Design lab and Snags use sentence-case labels and coloured edges for measured, assumed, missing, open, fixed and overdue.
- Review & issue groups documents into Drawings and packs, and Schedules and records.
- Programme and snag registers use 12–14px text. Page header actions stay on one row on tablets.
- Overview rendering is read-only: it summarises a programme only after the Programme page has created one, and the stage and check summaries do not write to the project.

The record checks are the same readiness checks used in the project index. They show what has been recorded, not design approval, and the overview says so.

## Styles

The page styles live in `design-preview.css`. The overview overrides from the presentation refresh were removed from `workbench.css` so one stylesheet owns each page layout.

## Verification

177 automated checks passed in Chromium: 93 static, integration and calculation checks; 10 workspace, 8 profile, 7 design, 6 refinement, 24 deep-debug, 5 presentation, 12 reliability and 12 planning browser checks. The planning run used a generated HEIC fixture, as CI does.

The design suite now also checks the five project stages, that the record checks match the readiness checks, that viewing the overview creates no programme activities, and that the open project is marked in the library.

Home, Your projects, Overview, Markup, Design lab, Programme, Snags, Issue and Profile were inspected at 1440px desktop, 1024px tablet and 390px phone widths, including the empty library and a new project with no plans. The redesigned pages were also checked for horizontal overflow at 320px.

Browser automation used Chromium. Firefox, WebKit, physical iPads and Safari were not tested in this pass; CI runs the reliability and planning suites in all three engines.
