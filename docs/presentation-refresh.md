# Presentation refresh

Implemented 2 October 2026.

## Changes

- Returning users see their projects first, with drawing thumbnails and adjacent New project and Open backup actions. First-time guidance and the example project remain available.
- Project overview uses a single project heading, a larger clickable drawing preview and clearer next actions.
- Drawing controls take up less vertical space. The Display menu groups labels, drawing style and the plan key. The mobile inspector can expand and reduce.
- Technical equipment symbols are the default. Product illustrations remain available. Switching styles preserves equipment, sizes, rotations and electrical records.
- Drawing labels, form controls, supporting text and tables use a more consistent presentation.
- Profile branding shows a readable crop of the actual PDF header alongside the full sample page.
- Client and engineer reports use the shared white header, embedded report fonts and consistent footers. Long names and references wrap. Drawing exports use a structured title block with clear scale wording.
- Section headings reserve space for following text. The snag report uses the singular form for one finding.

## Verification

110 automated checks passed: 50 static, integration and calculation checks; 10 workspace, 8 profile, 7 design, 6 refinement, 24 deep-debug and 5 presentation browser checks.

Browser checks cover project storage and recovery, equipment editing, style persistence, export generation, the Display menu and mobile inspector. Desktop, tablet and 390px and 320px phone layouts were inspected. Client, engineer, drawing, programme, snag and profile PDFs were rendered and reviewed, including long project and company names with a logo. The long-name client, engineer and profile samples contained no text outside page bounds.

Browser automation used Chromium. Physical iOS devices, Safari and Firefox were not tested.
