# Design lab and project reliability

Open a project, then choose **Design lab** in the project sidebar.

## Survey evidence

The register covers site address, earthing, supply rating, Ze, plan scales,
route lengths and charger ratings. Recorded values begin as assumptions.
To mark a value measured, enter its source, the person who recorded it and the
date. Changing that value invalidates its earlier evidence. Missing values
stay visible. The markup overlay uses M (measured), A (assumed) and ! (missing);
the register provides the same information without depending on colour.

## Saved designs and change impact

Save the current design as an option, edit the working project, then compare.
Quantities include chargers, ports, passive positions, equipment ratings,
measured cable, trenching and ducting. Unmeasured routes remain explicit.
Cost comparison uses entered unit rates and identifies incomplete totals.
It does not supply a quotation or verify available supply capacity.

Change impact lists added, removed and changed items, calibration, site and
programme changes. It identifies connected circuits conservatively and
highlights recorded document snapshots with later changes. It does not
automatically approve calculations or reissue documents.

## Charging day

Charging day is the single charging model for a project. The Markup Technical
menu, the Checks card, the critical-issue action and the command palette all open
it and run the scenario. The older amps simulator dialog is no longer linked; its
saved settings (`pack.sim`) are kept in backups and, when Charging day has never
been edited, seed it in kW and £/kWh.

A new or untouched charging day starts from the project: ports and per-port power
from the chargers on the markup, the site power limit from the recorded supply
rating or main fuse converted at 230 V, and other site demand as 35% of the supply
(4 kW on a domestic job). Each value shows where it came from ("From markup",
"From site details", "Rule of thumb", "From Markup simulator") and changes to
"Edited" once typed over; values that still follow the project update when the
markup or site details change. With no supply recorded the limit uses the 200 A
(80 A domestic) fallback and is marked Assumed, with a link to record the rating;
the verdict then reads "Within assumed supply" in neutral ink, never as a green pass.

Set charger control (load management shares the supply left after other demand;
uncapped lets each charger draw its full rate and can go over the supply), port
count/power, site power limit, other site demand, efficiency and tariffs in £/kWh.
Add vehicle groups with arrival, departure, requested battery energy and a
vehicle charging limit. A departure earlier than arrival is on the next day.
Times use the device time picker and are rounded to five minutes; they are
stored as decimal hours.

The model allocates ports in arrival order, shares spare power subject to vehicle
limits, and releases a port when its requested energy is delivered. Results show
peak site demand against the supply, a verdict (within supply, within assumed
supply, or over supply for a number of hours), delivered energy, shortfalls,
queues, grid energy and cost. The chart shows other site demand, the charging
stacked on top, the supply line, peak-tariff periods and when vehicles wait. The chart and
per-vehicle table can be exported to CSV. Changing assumptions invalidates the
displayed result until the model is run again.

The model has five-minute resolution, constant background demand and no battery
taper, phase-wiring model, real charger protocol, standing charge or prediction
of driver behaviour. It supports up to 500 vehicles and 200 ports. The entered
site power limit is an assumption, not a capacity calculation.

## Expansion and replay

Name installation phases, assign equipment and routes, and optionally link a
phase to a programme activity. Enter assumed charging capacity and spare duct
allowance. The slider and Play phases button show the cumulative installation
on the recorded plan. Passive positions stay passive until their provision is
changed. Playback stops when the page is hidden or the workspace section changes.

## Revision history

Save named revisions or use snapshots recorded when PDF documents are prepared
and downloaded. Images are shared between snapshots to avoid duplicate copies.
Snapshots and their images travel with a full project backup.

Opening a snapshot creates a new project; it never rolls back the working
project in place. Removing a snapshot requires an explicit action. There is a
limit of 100 options and 100 revisions per project, with no silent truncation:
export a backup and remove unneeded snapshots when the limit is reached.

The original downloaded PDF remains the issued document. Download history does
not establish sending, receipt, approval, commissioning or certification.

## Conflicting tabs and recovery

Project writes compare the saved revision in an IndexedDB transaction. When a
tab is stale, its write is rejected and an alert offers:

- Save its edits as a new project.
- Reload the latest saved project, with a discard confirmation.
- Download a backup of its in-memory edits.

BroadcastChannel provides immediate notification where available; the atomic
revision check also operates without it. The localStorage fallback requires
Web Locks to serialise writes. If storage cannot be checked or written safely,
the app keeps the in-memory work and asks for a backup.

Under **Your projects → Recover missing projects**, scan full IndexedDB and
legacy localStorage records. Restore found records to the index without
overwriting project contents. This cannot recover data deleted from browser
storage, a different browser profile/device, or a different site address.

## Dependencies and verification

PDF.js 6.3.289 replaces the old UMD library. Its library, worker, CMaps, fonts and
WASM resources are local and inventoried. The official archive digest and each
file hash are recorded in public/vendor/pdfjs/manifest.json. Evaluation remains
disabled. PDF document cleanup is adapted to the loading-task API introduced
by the upgraded library.

The test matrix combines the existing regression suites with planning-model
tests and Chromium/Firefox/WebKit workflow checks. HEIC testing uses a real
HEVC-encoded image generated from an original gradient fixture, not a mocked
decoder. Physical-device capture remains a separate acceptance task.

The deployment workflow verifies the published HTML and first-party/PDF module
bytes, HTTPS, the HTTP redirect and DNS resolution. Check the pull request and
release workflow for the exact tested commit and current result.

## Independent electrical review

See [the reviewer handoff](electrical-review-handoff.md). A named reviewer, agreed
scope and fee are still needed. The Design lab review register records supplied
review findings; it does not claim that an independent review has happened.

Accounts, cloud storage, external sharing and automatic electrical approval have
not been introduced. Projects and all these new records remain in this browser
unless the user downloads a backup.
