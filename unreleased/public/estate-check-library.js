// Estate Check Library: data module shared by Council Estate Review (survey tool)
// and Estate Check Library (reviewable guide document).
// DRAFT v0.9, for specialist review. Citations reference the governing instrument;
// items marked `verify` need line-by-line confirmation against the purchased/current text.

export const VERSION = "v0.9 draft";
export const UPDATED = "5 July 2026";

export const EVIDENCE_POLICY = [
  { o: "Pass", rule: "One tap. Timestamp and surveyor recorded automatically." },
  { o: "Action needed", rule: "Short note required: what falls short and the intended fix." },
  { o: "Fail", rule: "Note AND photo required. Firm finding with citation; feeds the remediation programme." },
  { o: "Not applicable", rule: "Reason required. A recorded reason is what shows the requirement was considered, not missed." },
  { o: "Measurements", rule: "Checks with a dimensional threshold carry a measurement field. Record the number whenever the outcome is not a clear pass." }
];

export const OUTCOMES = [
  { id: "pass", label: "Pass", color: "#1E7D4E", bg: "#E4F2EA" },
  { id: "action", label: "Action", color: "#9A6403", bg: "#F7EDD8" },
  { id: "fail", label: "Fail", color: "#B3372E", bg: "#F9E7E4" },
  { id: "na", label: "N/A", color: "#5C6770", bg: "#EFEAE0" }
];

export const CATEGORIES = [
  { id: "payment", name: "Payment & consumer", reg: "Public Charge Point Regulations 2023", specialist: "CPO compliance / consumer lead", color: "#1E6BFF",
    scope: "Statutory duties on the chargepoint operator of every publicly accessible chargepoint. Enforced by OPSS on behalf of OZEV, with penalties up to £10,000 per chargepoint per breach. The council carries the reputational and contractual risk even where the CPO holds the duty." },
  { id: "electrical", name: "Electrical safety", reg: "BS 7671:2018+A2:2022 (Section 722) · IET Code of Practice for EV Charging Equipment Installation, 5th ed.", specialist: "Chartered electrical engineer (e.g. CEng MIET)", color: "#7A4DD8",
    scope: "Installation safety and certification. Non-compliance is a safety risk first and an insurance/liability exposure second. Records (EIC, EICR) are the council's proof of a competently maintained estate." },
  { id: "access", name: "Accessibility", reg: "PAS 1899:2022 · Equality Act 2010 (incl. s.149 PSED)", specialist: "Access consultant (NRAC) + equality officer", color: "#0E8A6D",
    scope: "PAS 1899 is the specification for accessible public chargepoints (Motability/DfT co-sponsored, 2022; revision in progress). The Public Sector Equality Duty applies to the council directly and to the estate it already runs, as much as to new procurement." },
  { id: "highways", name: "Highways & streetscape", reg: "Highways Act 1980 · NRSWA 1991 · TSRGD 2016 · RTRA 1984 · Inclusive Mobility (2021)", specialist: "Highways engineer / traffic orders team", color: "#B4590A",
    scope: "Lawful occupation of the street: consents, traffic orders, signing, footway widths, structures. Failures here make a bay unenforceable or the installation unlawful, however good the charger." },
  { id: "grant", name: "Grant & funding conditions", reg: "ORCS / LEVI grant agreements · Subsidy Control Act 2022 · Procurement Act 2023", specialist: "S.151 officer team / grants & audit", color: "#8C1D4F",
    scope: "The conditions the money was awarded against. Breach risks clawback of past grant and scores directly against the authority in future funding assessments. Funding follows evidence." }
];

export const SITE_TYPES = [
  { id: "lamppost", name: "On-street lamppost / bollard", pow: "up to 5 kW" },
  { id: "pillar", name: "On-street 22 kW pillar", pow: "22 kW" },
  { id: "carpark", name: "Car park AC", pow: "7–22 kW" },
  { id: "rapid", name: "Rapid hub", pow: "50 kW+" },
  { id: "depot", name: "Council depot / fleet", pow: "7–22 kW", notPublic: true }
];

// applies: site types the check is surveyed on. publicOnly: auto-N/A on non-public sites.
// naNote: recorded reason when the check does NOT apply to a site (shows it was considered).
// sev: critical | high | medium. measure: {label, unit, limit}. verify: open point for specialist review.
export const CHECKS = [

  // ---------- PAYMENT & CONSUMER: Public Charge Point Regulations 2023 ----------
  { id: "PAY-01", cat: "payment", sev: "critical", applies: ["lamppost","pillar","carpark","rapid"], publicOnly: true,
    title: "Price displayed in pence per kWh before charging",
    why: "The maximum price of a charging session must be clearly shown in p/kWh (or £/kWh) on the unit or via a device/app that requires no pre-existing contract. In force since November 2023 for all public chargepoints.",
    cite: "PCPR 2023, reg. 11", deadline: "In force 24 Nov 2023",
    fix: "Display tariff on the unit or ensure the CPO's app/QR flow shows max p/kWh before payment details are requested.",
    cost: "£0–£150 per unit (signage/software)",
    naNote: "Not publicly accessible. PCPR 2023 applies to public chargepoints only." },

  { id: "PAY-02", cat: "payment", sev: "medium", applies: ["lamppost","pillar","carpark","rapid"], publicOnly: true,
    title: "Price does not increase once a session has started",
    why: "The displayed rate must hold for the whole session; mid-session price rises breach the pricing rules. Relevant for peak/off-peak tariffs spanning a session.",
    cite: "PCPR 2023, reg. 11", deadline: "In force 24 Nov 2023",
    fix: "Confirm CPO billing locks the agreed rate at session start; fix tariff engine if not.",
    cost: "CPO software change, £0 to council",
    naNote: "Not publicly accessible. PCPR 2023 applies to public chargepoints only." },

  { id: "PAY-03", cat: "payment", sev: "critical", applies: ["pillar","carpark","rapid"], publicOnly: true,
    title: "Contactless payment available (8 kW+ new / 50 kW+ existing)",
    why: "New public chargepoints of 8 kW+ (installed after Nov 2023) and all rapid (50 kW+) chargepoints must take contactless payment without pre-registration, either per unit or a site terminal in close proximity. Deadline was 24 Nov 2024.",
    cite: "PCPR 2023, reg. 5", deadline: "In force 24 Nov 2024",
    fix: "Retrofit contactless terminal per unit, or one site terminal in close proximity; record exemption where the unit is existing stock under 50 kW installed before Nov 2023.",
    cost: "£800–£2,500 per unit; £3,000–£5,000 site terminal",
    naNote: "Below the 8 kW contactless threshold (5 kW lamppost units), or existing pre-Nov 2023 stock under 50 kW. Record which exemption applies." },

  { id: "PAY-04", cat: "payment", sev: "high", applies: ["lamppost","pillar","carpark","rapid"], publicOnly: true,
    title: "Ad-hoc access: no pre-registration, contract or proprietary app required",
    why: "Drivers must be able to charge and pay without entering a pre-existing contract with the operator. QR-to-web payment flows qualify only if they work without account creation.",
    cite: "PCPR 2023, regs. 5 & 11 (definitions)",
    fix: "Require the CPO to enable a guest payment path; test it on site as part of the survey.",
    cost: "CPO software change, £0 to council",
    naNote: "Not publicly accessible. PCPR 2023 applies to public chargepoints only." },

  { id: "PAY-05", cat: "payment", sev: "high", applies: ["lamppost","pillar","carpark","rapid"], publicOnly: true,
    title: "Roaming: payable via at least one third-party roaming provider",
    why: "Every public chargepoint must be payable through at least one third-party roaming provider (e.g. an aggregator app). The two-year transition ended 24 Nov 2025, so this is now a live obligation across the whole estate, including legacy lamppost units.",
    cite: "PCPR 2023, reg. 6", deadline: "In force 24 Nov 2025",
    fix: "Confirm the CPO's roaming agreement covers these units; require connection under the operating contract if not.",
    cost: "CPO commercial arrangement, £0 to council",
    naNote: "Not publicly accessible. PCPR 2023 applies to public chargepoints only." },

  { id: "PAY-06", cat: "payment", sev: "critical", applies: ["lamppost","pillar","carpark","rapid"], publicOnly: true,
    title: "24/7 free staffed helpline number displayed on or near the unit",
    why: "A free-to-call, 24/7, staffed helpline (voicemail does not qualify) must exist and its number must be prominently displayed on or near each chargepoint. Faded or missing stickers are a common physical failure.",
    cite: "PCPR 2023, reg. 9", deadline: "In force 24 Nov 2024",
    fix: "Re-sticker units with the CPO helpline number; verify the line answers 24/7 with a test call.",
    cost: "£40–£120 per unit (signage)",
    naNote: "Not publicly accessible. PCPR 2023 applies to public chargepoints only." },

  { id: "PAY-07", cat: "payment", sev: "critical", applies: ["rapid"], publicOnly: true,
    title: "Rapid network 99% average annual reliability, published",
    why: "The operator's rapid (50 kW+) network must average 99% reliability, measured annually and published. Out-of-order status including a dead contactless reader counts as downtime.",
    cite: "PCPR 2023, reg. 7", deadline: "Annual average from Nov 2024",
    fix: "Obtain the CPO's published reliability figure and per-EVSE uptime for this site; agree remediation SLA where below target.",
    cost: "CPO obligation; monitor via contract",
    naNote: "Reliability duty applies to rapid (50 kW+) chargepoints only." },

  { id: "PAY-08", cat: "payment", sev: "medium", applies: ["lamppost","pillar","carpark","rapid"], publicOnly: true,
    title: "Open data live via OCPI (location, EVSE, connector, status)",
    why: "Operators must hold and open chargepoint reference data using OCPI, with live availability status. This is also how the public and funders see whether units work.",
    cite: "PCPR 2023, reg. 10 (OCPI 2.2.1 §8.3.1–8.3.3)", deadline: "In force 24 Nov 2024",
    fix: "Spot-check the site on a public map (e.g. ZapMap) against reality; require the CPO to fix stale or missing feeds.",
    cost: "CPO software obligation",
    naNote: "Not publicly accessible. PCPR 2023 applies to public chargepoints only." },

  { id: "PAY-09", cat: "payment", sev: "medium", applies: ["lamppost","pillar","carpark","rapid"], publicOnly: true,
    title: "CPO statutory reporting to OZEV/OPSS is up to date",
    why: "Operators must submit periodic reports (helpline calls quarterly; reliability and roaming reporting per schedule). The council should hold assurance that its CPO is reporting, because enforcement action against the CPO lands on council sites.",
    cite: "PCPR 2023, regs. 7–9 (reporting provisions)",
    fix: "Request confirmation of latest submissions under the operating contract; log evidence in the site file.",
    cost: "Administrative",
    naNote: "Not publicly accessible. PCPR 2023 applies to public chargepoints only." },

  // ---------- ELECTRICAL SAFETY: BS 7671 §722 + IET Code of Practice ----------
  { id: "ELE-01", cat: "electrical", sev: "critical", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "Electrical Installation Certificate (EIC) on file for every unit",
    why: "Every installation must have been certified at completion. A missing EIC means the council cannot demonstrate the installation was ever verified safe, an immediate audit and insurance exposure.",
    cite: "BS 7671:2018+A2:2022, Part 6",
    fix: "Locate certificates from the installer/CPO; where genuinely missing, commission an EICR to establish current condition and record the gap.",
    cost: "£0 (retrieval) or EICR £150–£350 per site" },

  { id: "ELE-02", cat: "electrical", sev: "critical", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "Periodic inspection (EICR) within interval",
    why: "Public charging equipment needs periodic inspection at the interval set by the designer/IET guidance (commonly annual for public installations). Out-of-date inspection is the single most common estate failure on older sites.",
    cite: "BS 7671 Part 6 · IET Code of Practice, 5th ed.",
    fix: "Programme EICRs across the estate; prioritise sites past interval and record remedial codes (C1/C2) into the action plan.",
    cost: "£150–£350 per site visit" },

  { id: "ELE-03", cat: "electrical", sev: "high", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "Dedicated final circuit per charging point",
    why: "Each charging point must be supplied by its own dedicated circuit, sized for continuous load.",
    cite: "BS 7671 §722.311",
    fix: "Where shared circuits are found (common on retrofit car parks), rewire to dedicated ways.",
    cost: "£300–£900 per unit" },

  { id: "ELE-04", cat: "electrical", sev: "critical", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "RCD protection with DC fault detection (Type A/B or equivalent)",
    why: "Each point needs RCD protection appropriate to the equipment, including 6 mA DC fault detection (RDC-DD or Type B). Pre-2019 installs frequently fail this.",
    cite: "BS 7671 §722.531.3",
    fix: "Upgrade protective devices in the supply pillar/board; confirm against manufacturer documentation for integral protection.",
    cost: "£120–£400 per unit" },

  { id: "ELE-05", cat: "electrical", sev: "critical", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "Open-PEN protection / earthing arrangement valid on PME supplies",
    why: "On PME networks a broken neutral can make a vehicle's bodywork live. Installations must use an open-PEN device, TT island or another compliant arrangement. This is a defining safety requirement for street furniture charging.",
    cite: "BS 7671 §722.411.4.1",
    fix: "Verify arrangement from the EIC; retrofit O-PEN device or convert to TT where non-compliant.",
    cost: "£250–£700 per unit" },

  { id: "ELE-06", cat: "electrical", sev: "high", applies: ["lamppost","pillar","carpark","rapid"],
    title: "Earth electrode tested where a TT island is used",
    why: "TT arrangements depend on the electrode. Resistance must be measured and within design values, re-checked at periodic inspection.",
    cite: "BS 7671 Part 6 (testing) · §722.411",
    fix: "Test electrode resistance at next EICR; record value on the site file. N/A with reason where the site is not TT.",
    cost: "Included in EICR visit",
    naNote: "Depot supplies typically on the building's earthing system; record the arrangement instead." },

  { id: "ELE-07", cat: "electrical", sev: "high", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "DNO connection / notification records held",
    why: "Every connection must be notified to (or agreed with) the distribution network operator, including unmetered supply arrangements for lamppost units. Missing DNO paperwork blocks future capacity upgrades.",
    cite: "ESQCR 2002 · DNO connection terms (incl. unmetered supplies for lamppost units)",
    fix: "Retrieve connection agreements from installer/CPO/DNO; regularise any unrecorded connections.",
    cost: "Administrative; DNO fees if regularising" },

  { id: "ELE-08", cat: "electrical", sev: "medium", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "Means of isolation accessible and labelled",
    why: "Maintenance and emergency services need to isolate the unit without hunting for the supply point.",
    cite: "BS 7671 §537 · IET Code of Practice",
    fix: "Label isolation points; record location on the site plan.",
    cost: "£20–£60 per unit" },

  { id: "ELE-09", cat: "electrical", sev: "medium", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "Enclosure IP/IK rating suitable for the location",
    why: "Units in exposed or high-traffic locations need appropriate ingress and impact ratings; damaged enclosures void the rating.",
    cite: "BS 7671 §722.512.2 · manufacturer declaration",
    fix: "Replace damaged covers/doors; verify rating against exposure on the survey photo.",
    cost: "£60–£400 per unit" },

  { id: "ELE-10", cat: "electrical", sev: "medium", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "Cable sizing and volt drop verified for circuit length",
    why: "Long runs from feeder pillars (typical in car parks) must be verified for volt drop and thermal sizing at design load.",
    cite: "BS 7671 §525 · Appendix 4",
    fix: "Check design calcs on the EIC; de-rate or re-cable where undersized.",
    cost: "Survey £0; re-cabling site-specific" },

  { id: "ELE-11", cat: "electrical", sev: "high", applies: ["pillar","carpark","rapid","depot"],
    title: "Physical impact protection where vehicle strike is credible",
    why: "Chargers in car parks and forecourts need bollards or wheel stops. The charger is the most strike-prone object on site, and a damaged unit is a safety risk and an asset loss.",
    cite: "IET Code of Practice · PAS 1899:2022 §6 (protection placement)",
    fix: "Install wheel stops (~600 mm from unit) and/or bollards either side; maintain accessibility clearances when doing so.",
    cost: "£250–£800 per bay",
    naNote: "Lamppost units sit behind the kerb line on the footway; vehicle strike risk is assessed under highways checks instead." },

  { id: "ELE-12", cat: "electrical", sev: "medium", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "Maintenance regime in place with fault SLA and service records",
    why: "A documented maintenance regime (fault response SLA, firmware, annual service) is what keeps certification meaningful between inspections, and is what funders ask to see.",
    cite: "IET Code of Practice · operating contract",
    fix: "Confirm SLA terms with CPO; file the last 12 months of service records per site.",
    cost: "Contractual, £0 to council" },

  // ---------- ACCESSIBILITY: PAS 1899:2022 + Equality Act 2010 ----------
  { id: "ACC-01", cat: "access", sev: "critical", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "Equality Act consideration recorded for this site (PSED)",
    why: "The Public Sector Equality Duty requires the council to show due regard to disabled users' needs in how it provides charging, including the estate it already runs. The duty is about documented consideration: a site can be constrained, but the reasoning must be on record. This record is the council's first line of defence to a discrimination challenge.",
    cite: "Equality Act 2010, s.149",
    fix: "Complete the accessibility checks below and record decisions and mitigations; this tool compiles them into the Equality Act consideration record.",
    cost: "Administrative; produced by this review" },

  { id: "ACC-02", cat: "access", sev: "high", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "User-interaction components within reachable height band",
    why: "Sockets, holsters, screens and card readers must sit where wheelchair users and people of short stature can reach and view them (socket/holster centreline around 750–900 mm; interface elements per PAS figures). Units mounted high on columns commonly fail.",
    cite: "PAS 1899:2022 §5, Figs 4–5", verify: "Confirm exact height values against the purchased PAS text (figures 4–5); PAS revision in progress.",
    measure: { label: "Highest interaction point", unit: "mm", limit: "per PAS Figs 4–5" },
    fix: "Re-mount unit or relocate reader/screen within band; where a column unit cannot move, record mitigation (e.g. assistance via helpline, nearest accessible unit).",
    cost: "£150–£600 per unit re-mount" },

  { id: "ACC-03", cat: "access", sev: "high", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "Clear space in front of the interaction face",
    why: "A wheelchair user needs clear, level space to approach and turn at the unit: minimum 1,200 mm straight-line access, with deeper space (~1,500–1,850 mm) preferred for turning.",
    cite: "PAS 1899:2022 §6 · BS 8300-1:2018", verify: "Confirm required vs preferred front-space values in the final PAS text.",
    measure: { label: "Clear depth in front of unit", unit: "mm", limit: "≥1,200" },
    fix: "Remove street furniture/planting from the approach zone or re-orient the unit.",
    cost: "£0–£900 depending on obstruction" },

  { id: "ACC-04", cat: "access", sev: "medium", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "Reach over low-level obstacles no more than 220 mm",
    why: "Where a kerb, impact barrier or cover sits in front of the unit, every component must still be reachable, with reach distance over the obstacle capped at 220 mm.",
    cite: "PAS 1899:2022 §5/§6",
    measure: { label: "Reach over obstacle", unit: "mm", limit: "≤220" },
    fix: "Reposition barriers/wheel stops or re-mount components closer to the accessible face.",
    cost: "£100–£500 per bay" },

  { id: "ACC-05", cat: "access", sev: "high", applies: ["lamppost","pillar","rapid"],
    title: "Dropped kerb / level access between bay and unit",
    why: "If the unit is on the footway and can't be operated from carriageway level, a dropped kerb or level access must connect the bay to the unit. Otherwise a wheelchair user can park but not charge.",
    cite: "PAS 1899:2022 §6",
    fix: "Install dropped kerb with tactile provision at the bay; interim mitigation: designate the nearest accessible unit and record it.",
    cost: "£900–£1,800 per bay",
    naNote: "Car park/depot bays typically share level surface with the unit; record surface condition instead." },

  { id: "ACC-06", cat: "access", sev: "medium", applies: ["carpark","rapid"],
    title: "Accessible bay provision ratio across the site",
    why: "Best practice for larger sites: at least one accessible charging bay per five EV bays where the site has 10+ chargers. Zero accessible provision on a large site is hard to defend under the PSED.",
    cite: "PAS 1899:2022 annexes (best practice) · BS 8300-1",
    fix: "Re-designate and re-mark bays to create accessible provision at the required ratio.",
    cost: "£250–£600 per bay re-marked",
    naNote: "Single-unit on-street sites; provision is assessed at network level instead (see Equality Act record)." },

  { id: "ACC-07", cat: "access", sev: "high", applies: ["carpark","rapid"],
    title: "Accessible bay dimensions and access zones",
    why: "Accessible charging bays need enlarged dimensions (min. 4.0 m × 6.6 m envelope, or 3.6 m width with kerb-clear zone) with 1,600 mm side and 1,200 mm rear marked access zones so a wheelchair user can transfer and reach the cable safely.",
    cite: "PAS 1899:2022 Annexes B/C · BS 8300-1:2018 §7–8", verify: "Confirm annex dimension set for the relevant bay layout (parallel/angled/off-street).",
    measure: { label: "Bay width", unit: "mm", limit: "≥3,600 (accessible)" },
    fix: "Re-mark bays to accessible dimensions; where space is genuinely constrained, record the constraint and the nearest compliant alternative.",
    cost: "£250–£600 per bay" },

  { id: "ACC-08", cat: "access", sev: "medium", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "Surface firm, level, slip-resistant; drainage fall ≤ 1:50",
    why: "The ground around the unit must be stable and level enough for wheelchair use in all weathers. Broken paving and ponding are common failures on older footways.",
    cite: "PAS 1899:2022 §7",
    fix: "Relay paving locally; correct falls where water ponds at the interaction zone.",
    cost: "£200–£1,200 per site" },

  { id: "ACC-09", cat: "access", sev: "high", applies: ["pillar","carpark","rapid"],
    title: "Cable management provided; operating forces within limits",
    why: "Rapid CCS cables are heavy; PAS sets limits on the forces users must exert (Annex F) and expects cable management (holster/balancer) so the cable can be connected without dragging. Cable management is mandatory in accessible bays.",
    cite: "PAS 1899:2022 §5, Annex F", verify: "Confirm the linear force limits from Annex F for the survey guidance.",
    fix: "Retrofit cable management arms/balancers; record measured effort where marginal.",
    cost: "£400–£1,200 per unit",
    naNote: "Lamppost units are socket-only (user brings cable); force limits apply to the socket latch only." },

  { id: "ACC-10", cat: "access", sev: "high", applies: ["lamppost","pillar"],
    title: "No trailing cable across the pedestrian route during charging",
    why: "Charging must be possible without the cable crossing the footway, which is a trip hazard and an accessibility breach. Bay position relative to the unit determines this; council policy also prohibits private cables across the pavement.",
    cite: "PAS 1899:2022 §7 · council trailing-cable policy",
    fix: "Re-mark the bay so the vehicle inlet sits adjacent to the unit; add cable channel/gully only where policy permits.",
    cost: "£150–£600 per bay",
    naNote: "Off-street bays; cable route is assessed within the bay envelope (ACC-09)." },

  { id: "ACC-11", cat: "access", sev: "medium", applies: ["pillar","carpark","rapid","depot"],
    title: "Bollards ≥1,000 mm high, visually contrasting, with ≥1,000 mm clear passage",
    why: "Protection must not itself become the barrier: bollards need height and contrast for visually impaired users, and enough gap for a wheelchair to pass.",
    cite: "PAS 1899:2022 §6–7",
    measure: { label: "Narrowest gap between bollards", unit: "mm", limit: "≥1,000" },
    fix: "Re-space or replace bollards; add contrast banding.",
    cost: "£150–£400 per bollard",
    naNote: "No bollards at lamppost sites; protection is assessed under highways checks." },

  { id: "ACC-12", cat: "access", sev: "medium", applies: ["pillar","carpark","rapid"],
    title: "Screen legible: height, glare, text size; non-touch alternative available",
    why: "Screens must be readable from seated position and outdoors (glare), with instructions usable by people who cannot operate a touch screen. Otherwise the interface itself excludes users.",
    cite: "PAS 1899:2022 §5 · §8 (information provision)",
    fix: "Adjust mounting angle, apply anti-glare treatment, or enable app/phone-line fallback flows; record the fallback in site information.",
    cost: "£80–£300 per unit",
    naNote: "Lamppost units have no screen; information duties are met via unit labelling and app (PAY-01/PAY-04)." },

  { id: "ACC-13", cat: "access", sev: "medium", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "Lighting adequate at the unit and its approach",
    why: "Users must be able to find, read and operate the unit safely after dark; lighting also underpins personal safety, particularly for disabled and lone users.",
    cite: "PAS 1899:2022 §7 · BS 8300-1 §11 principles",
    fix: "Uprate nearby lighting or add unit-integral lighting; lamppost sites usually pass by design; record the lux check.",
    cost: "£0–£900 per site" },

  { id: "ACC-14", cat: "access", sev: "high", applies: ["lamppost","pillar","carpark","rapid"], publicOnly: true,
    title: "Payment method accessible: reader reachable seated; non-app alternative",
    why: "A card reader mounted high, or an app-only flow with no assistance path, excludes users with reach or dexterity impairments. The whole payment process must be accessible, not only the plug.",
    cite: "PAS 1899:2022 §5 · Equality Act 2010 (reasonable adjustments)",
    measure: { label: "Reader/terminal height", unit: "mm", limit: "per PAS Figs 4–5" },
    fix: "Re-mount reader within band; ensure helpline-assisted start is available and advertised as the non-app path.",
    cost: "£150–£600 per unit",
    naNote: "Fleet-only depot; the payment process is not public." },

  // ---------- HIGHWAYS & STREETSCAPE ----------
  { id: "HWY-01", cat: "highways", sev: "critical", applies: ["lamppost","pillar"],
    title: "Footway clear width maintained past unit and charging vehicle",
    why: "A minimum 1,500 mm (2,000 mm preferred) clear footway must remain past the unit, open door swing and any cable. Below that, wheelchair users and buggies are forced into the carriageway.",
    cite: "Inclusive Mobility (DfT, 2021) · Manual for Streets", verify: "Confirm the authority's adopted footway width standard (some adopt 1.8 m).",
    measure: { label: "Remaining clear footway", unit: "mm", limit: "≥1,500" },
    fix: "Relocate unit/bay or re-kerb locally; where impossible, record the constraint and alternative provision.",
    cost: "£0–£2,500 site-specific",
    naNote: "Off-street site; pedestrian routes are assessed under ACC-03/ACC-08." },

  { id: "HWY-02", cat: "highways", sev: "high", applies: ["lamppost","pillar","rapid"],
    title: "Traffic Regulation Order in place for the charging bay",
    why: "Without a TRO the 'EV only' bay is unenforceable: ICE vehicles can block it with no recourse, and enforcement income/PCNs issued there are challengeable. Many early rollouts marked bays before making orders.",
    cite: "Road Traffic Regulation Act 1984, ss.1/45–46",
    fix: "Make (or consolidate) the TRO covering the bays; align signs/markings to the order.",
    cost: "£2,000–£5,000 per order (advertising + legal)",
    naNote: "Private car park / depot land; enforcement is by parking contract terms, not TRO." },

  { id: "HWY-03", cat: "highways", sev: "medium", applies: ["lamppost","pillar","rapid"],
    title: "Bay markings and upright signs conform to TSRGD",
    why: "Signs and markings must match the prescribed diagrams (and the TRO) to be enforceable and legible; faded or improvised markings fail.",
    cite: "Traffic Signs Regulations and General Directions 2016",
    fix: "Refresh markings and replace non-conforming plates.",
    cost: "£300–£800 per bay",
    naNote: "Off-street bays; marked to PAS 1899/site standards instead (ACC-07)." },

  { id: "HWY-04", cat: "highways", sev: "high", applies: ["lamppost","pillar","rapid"],
    title: "Street works consents held (s.50 licence / s.115 agreement)",
    why: "Third-party apparatus in the highway needs a s.50 NRSWA licence or an agreement under the Highways Act; CPO-owned equipment without consent is unlawfully placed, a real problem when contracts change hands.",
    cite: "NRSWA 1991, s.50 · Highways Act 1980, s.115B/E",
    fix: "Regularise consents with the CPO; register apparatus location in the street works record.",
    cost: "Administrative + licence fees",
    naNote: "Not highway land; placement is governed by landowner consent/lease." },

  { id: "HWY-05", cat: "highways", sev: "high", applies: ["lamppost"],
    title: "Host lighting column structurally adequate and condition-assessed",
    why: "Charging adds equipment, door cut-outs and repeated cable loads to columns often decades old. A structural/condition assessment for the host column should be on file.",
    cite: "Highway authority asset standards · ILP guidance (TR22 principles)",
    fix: "Commission column condition assessment; replace or de-scope units on failed columns.",
    cost: "£60–£150 per column assessment",
    naNote: "Not a column-hosted unit." },

  { id: "HWY-06", cat: "highways", sev: "medium", applies: ["lamppost","pillar","rapid"],
    title: "Position clear of junctions, crossings, tactile paving and sightlines",
    why: "Bays and units must not obstruct visibility splays, crossing points or tactile guidance. These are installation-stage checks worth re-verifying because street layouts change.",
    cite: "Inclusive Mobility (2021) · Manual for Streets",
    fix: "Relocate bay/unit where conflicts exist; consult road safety team on marginal cases.",
    cost: "Site-specific",
    naNote: "Off-street site." },

  { id: "HWY-07", cat: "highways", sev: "medium", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "Utility search and safe-dig records held for the installation",
    why: "Excavation near gas/water/HV without recorded searches is a safety and liability gap; records also de-risk future works at the same site.",
    cite: "HSG47 · NRSWA records",
    fix: "Retrieve C2/C3 search records from installer; note gaps on the site file.",
    cost: "Administrative" },

  { id: "HWY-08", cat: "highways", sev: "medium", applies: ["carpark","rapid","depot"],
    title: "Planning status confirmed (permitted development limits)",
    why: "Chargepoints in car parks generally fall under permitted development within height/siting limits, but rapid hubs with canopies, substations or in conservation areas can exceed PD and need permission.",
    cite: "GPDO 2015, Sch.2 Part 2 Class D/E (as amended)",
    fix: "Confirm PD applicability or regularise with a planning application.",
    cost: "Administrative; application fees if needed",
    naNote: "On-street equipment placed under highways powers; planning is not normally engaged." },

  { id: "HWY-09", cat: "highways", sev: "high", applies: ["lamppost","pillar","rapid"],
    title: "No net loss of disabled or essential parking without assessment",
    why: "Converting general bays is routine; converting or displacing disabled bays without assessment and consultation is the kind of PSED failure that invites legal challenge.",
    cite: "Equality Act 2010 s.149 · RTRA 1984 (orders consultation)",
    fix: "Reinstate or re-provide displaced disabled bays; document the assessment for each conversion.",
    cost: "£250–£600 per bay re-marked",
    naNote: "Off-street allocation assessed under ACC-06." },

  { id: "HWY-10", cat: "highways", sev: "medium", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "No trip hazards introduced: covers flush, no raised plinths on pedestrian routes",
    why: "Feeder pillars, chamber covers and plinth edges around the install must sit flush with the surface; settlement after installation is common and becomes the council's defect.",
    cite: "Highway inspection standards (Well-managed Highway Infrastructure)",
    fix: "Re-bed covers, feather plinth edges, add to routine highway inspection route.",
    cost: "£100–£600 per defect" },

  { id: "HWY-11", cat: "highways", sev: "medium", applies: ["lamppost","pillar"],
    title: "Access to other street apparatus and drainage not obstructed",
    why: "Bays and units must not block gullies, chamber access or other undertakers' apparatus. Blocked access causes disputes and forced relocations later.",
    cite: "NRSWA 1991 · street works coordination",
    fix: "Agree relocations with affected undertakers; adjust bay extents.",
    cost: "Site-specific",
    naNote: "Off-street site." },

  // ---------- GRANT & FUNDING CONDITIONS ----------
  { id: "GRA-01", cat: "grant", sev: "critical", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "Grant agreement and conditions register on file per site",
    why: "The council must be able to say which fund paid for which units and what conditions attach. Estates assembled across several programmes (ORCS rounds, LEVI, local funds) routinely lose this mapping, and with it the ability to evidence compliance.",
    cite: "ORCS / LEVI grant agreements",
    fix: "Rebuild the funding map from grant letters and claims; this tool stores it per site.",
    cost: "Administrative",
    naNote: "Self-funded site; record the funding source for the estate register." },

  { id: "GRA-02", cat: "grant", sev: "critical", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "Minimum operational period being met: units live and in service",
    why: "Grants require chargepoints to remain operational for the period in the agreement. Dead or removed units inside that period are a clawback trigger and must be repaired, replaced or notified.",
    cite: "Grant agreement conditions (fund-specific)", verify: "Confirm the operational period in each grant letter (varies by fund and round).",
    fix: "Repair/replace dead units or agree variation with the funder before the position hardens.",
    cost: "Repair costs site-specific",
    naNote: "Self-funded site." },

  { id: "GRA-03", cat: "grant", sev: "high", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "Utilisation and reliability data flowing to the funder as required",
    why: "LEVI (and monitoring conditions on other funds) require ongoing data returns. A silent estate looks like a failing estate on a funder's dashboard.",
    cite: "LEVI data requirements · grant monitoring conditions",
    fix: "Confirm the CPO's data feed to the funder; assign an officer owner for returns.",
    cost: "Administrative",
    naNote: "Self-funded site." },

  { id: "GRA-04", cat: "grant", sev: "medium", applies: ["lamppost","pillar","carpark","rapid"], publicOnly: true,
    title: "Units listed and live on the public data platforms committed to",
    why: "Agreements and good practice require units visible (with live status) on public charging maps. Unlisted units depress recorded utilisation, which feeds future bid assessments.",
    cite: "Grant agreement · PCPR 2023 reg. 10 (open data)",
    fix: "Reconcile the estate list against public maps; require CPO to fix gaps.",
    cost: "Administrative",
    naNote: "Fleet-only depot; not a public unit." },

  { id: "GRA-05", cat: "grant", sev: "high", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "Asset ownership and concession terms match the funding basis",
    why: "Who owns the asset, and what happens on CPO exit or insolvency, must match what was claimed. Contract novations (common as CPOs consolidate) can silently break grant conditions.",
    cite: "Grant agreement · concession contract",
    fix: "Review contract vs grant terms at each novation; document funder consent where required.",
    cost: "Legal review time" },

  { id: "GRA-06", cat: "grant", sev: "high", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "Procurement route documented and compliant",
    why: "The route to market (framework, concession, direct award) must be on file and lawful. Funders and auditors both test this, and it's unfixable retrospectively.",
    cite: "Procurement Act 2023 / PCR 2015 (by award date) · concession regulations",
    fix: "File the procurement record; take legal advice where the route is doubtful before extending contracts.",
    cost: "Administrative" },

  { id: "GRA-07", cat: "grant", sev: "medium", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "Subsidy control assessment recorded for the CPO co-funding model",
    why: "Co-funded models (e.g. CPO funds 40%) confer benefit on a commercial operator; a proportionate subsidy-control assessment should be on record.",
    cite: "Subsidy Control Act 2022",
    fix: "Record the assessment or obtain advice; attach to the funding file.",
    cost: "Administrative / legal time" },

  { id: "GRA-08", cat: "grant", sev: "high", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "Audit evidence retained: claims, invoices, commissioning certificates",
    why: "Funders can audit years later; retention periods are set in the agreement. Missing commissioning evidence is the most common audit finding on capital grants.",
    cite: "Grant agreement (retention clauses)",
    fix: "Assemble the evidence pack per site; this tool's funder evidence pack output is designed to hold it.",
    cost: "Administrative" },

  { id: "GRA-09", cat: "grant", sev: "medium", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "Publicity and branding acknowledgement conditions met",
    why: "Some awards require funder acknowledgement on units or communications; minor, but an easy tick in an audit.",
    cite: "Grant agreement (publicity clauses)",
    fix: "Apply required decals/wording at next maintenance visit.",
    cost: "£10–£40 per unit",
    naNote: "No publicity condition in this site's funding." },

  { id: "GRA-10", cat: "grant", sev: "medium", applies: ["lamppost","pillar","carpark","rapid","depot"],
    title: "Change control followed for tariff, relocation or decommissioning changes",
    why: "Material changes to funded infrastructure often need funder notification or consent, including tariff-model changes and unit relocations. Undocumented change is where clawback risk builds.",
    cite: "Grant agreement (variation clauses)",
    fix: "Log changes since award; notify funder retrospectively where required.",
    cost: "Administrative" }
];

export function checksFor(siteType, isPublic) {
  return CHECKS.filter(c => c.applies.includes(siteType) && (!c.publicOnly || isPublic));
}
export function notApplicableFor(siteType, isPublic) {
  return CHECKS.filter(c => !(c.applies.includes(siteType) && (!c.publicOnly || isPublic)));
}
