# Independent electrical review handoff

Status: **not commissioned or completed by this software change**.
A named reviewer, agreed scope and approved fee are still required.

The reviewer should be a suitably qualified electrical designer with EV charging
experience. Record their qualification/professional registration, sources,
edition/amendment, review date, report reference, assumptions and findings.
The application's Design lab → Technical review register stores those records.
An entry is a user-supplied record, not independent verification or certification.

## Source inventory and review scope

| Area | Source entry points | Required review |
| --- | --- | --- |
| Current-carrying capacity | public/EV Site Planner.html: CC_FAMS, CC_CA, CC_CG, fullCalc | Cable construction, conductor material, insulation, installation methods, reference temperature, ambient/grouping factors, buried correction and applicability |
| Voltage drop | CC_FAMS, fullCalc, routeLen | Single/three-phase conventions, mV/A/m source, current, route length, conductor size and acceptable limits |
| Fault protection | CC_R20, CC_CURVE, ccUpstream, fullCalc | Ze/Zs, protective device characteristics, disconnection time, CPC selection, temperature correction and missing upstream data |
| TT and RCD dependencies | fullCalc, exported calculation wording | Confirm when a check can be established and which measured/manufacturer/disconnection data are required; absence must remain incomplete |
| Topology and demand | ccGraph, ccDetectLoad, loadCheck, unitSpecHint | Anchored paths, supply origin, multiple paths, recorded current caps, three-phase assignments, multiple sockets, passive future provision and DC units |
| Manufacturer data | UNIT_DEFS, KITDEFS, equipment model records | Product ratings, variants, protective devices, load-management behaviour and current manufacturer instructions |
| Guidance and learning | public/Guide Library.dc.html, public/Learning Hub.dc.html | Applicable UK jurisdiction, current BS 7671 edition/amendments, IET EV guidance, DNO requirements and source dates |
| New scenario tools | public/planning-core.js | Review displayed modelling assumptions separately from electrical design approval; simulator kW inputs are user assumptions |

No standard clauses, regulatory editions or manufacturer limits have been
invented or certified by this update. The reviewer must establish the applicable
sources and permission to reproduce any reference material.

## Independent acceptance cases

Supply independently calculated inputs and expected outputs, not outputs copied
from this application. Include:

1. Each supported cable family and installation method at minimum, typical and
   maximum tabulated conductor sizes.
2. Single-phase and three-phase circuits, non-default currents, and each relevant
   ambient/grouping correction.
3. Known voltage drop examples at short and long lengths, including a result on
   either side of the applicable threshold.
4. Ze plus several upstream segments; missing, disconnected and ambiguous supply
   paths; incomplete cable specifications must not produce a pass.
5. Protective device characteristics on either side of the Zs limit, with the
   corresponding source and disconnection assumptions.
6. TT examples with missing and complete RCD/disconnection evidence; separate CPC
   verification must remain explicit.
7. Multiple charger sockets, recorded current caps, DC charging and passive
   positions; identify where diversity or control-system behaviour is assumed.
8. Earthing/PEN-fault arrangements, manufacturer protection requirements and DNO
   application/notification boundaries relevant to the intended projects.
9. Compare the calculator display and every exported report for the same inputs.
10. Missing values, invalid values, out-of-table conditions and contradictory
    assumptions must be reported explicitly.

For each case record: source/edition/clause, reviewer, input fixture, independent
working, expected range/tolerance, observed result, severity, decision and evidence.

## Completion criteria

- Resolve all critical findings before relying on the affected calculation.
- Retain signed review findings and independent reference examples.
- Name the approved scope and exclusions; approval of one area is not approval
  of all guidance, software outputs or a particular installation.
- Enter the review date and source edition alongside the data, and schedule
  review when standards, products or calculation code change.
- A qualified person still reviews and accepts each real installation design.

## Physical-device checklist

Record actual device model, OS/browser versions and fixture/source for each test.

| Device/workflow | Evidence to retain |
| --- | --- |
| iPhone/iPad camera and Photos HEIC imports | Orientation, colours, multiple images, cancellation, large image, successful backup round trip |
| Android camera/gallery | JPEG/HEIC where supported, file permissions, portrait/landscape transitions |
| Touch and pen markup | Selection, drag, pan/zoom, cable points, scale calibration, inspector access |
| Storage and interruption | Low storage, browser restart, backgrounding, two tabs and conflict recovery |
| Accessibility | Keyboard, VoiceOver/TalkBack/NVDA labels and reading order, errors, focus and dialog close |
| Downloads and printing | PDF page count, fonts, labels, print scaling and original downloaded document retention |

Automated WebKit tests and generated HEIC conversion fixtures do not constitute
a physical iPhone/Android acceptance test.
