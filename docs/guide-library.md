# Guide library and help system

Added 3 October 2026. The guide library was rewritten from plain-English basics up to advanced design notes, and the planner gained a help drawer so every page and tool can open the guide that explains it.

## Content

- `public/guides.js` holds every guide as data: id, level, topic, kind (how-to, reference, cheat sheet or planner), reading time, search keywords, the guides to read first, related guides, the diagram key and the body HTML. It also holds the glossary, the useful links, the level quizzes, the calculators and the reading-progress store, and renders a guide to HTML (`EVGuides.guideHTML`) for both the library page and the help drawer.
- Four levels: **Start here** (anyone new to EV charging), **Planning a site** (project managers, estimators and installers scoping a job), **Installing** (installers and apprentices on site) and **Advanced design** (experienced electricians and designers). The 25 original guides keep their ids, so the planner's existing hints still open them; 20 guides are new, including the plain-English basics, the site survey checklist, commissioning and handover, volt drop and de-rating, and three-phase balance.
- Every Installing and Advanced guide ends with the line that the planner assists site design decisions and does not certify electrical work, and points to BS 7671 and the IET Code of Practice. The "last reviewed" date was removed on Ben's instruction so the page never needs re-dating.
- Terms marked with `<dfn data-term>` open a definition in place; the glossary page lists all 49.
- Calculators (charging time, supply headroom, volt drop, sockets per load management limit) are small and carry their caveats in the result text; the volt drop table uses typical mV/A/m figures and says to confirm against BS 7671 Appendix 4.
- `public/guide-art.js` holds the diagrams and animations as inline SVG strings in the navy and lime palette, with no ids so a diagram can appear twice on one page. Animations are CSS inside each SVG and stop under `prefers-reduced-motion`.
- Planner screenshots for the how-to guides are `public/assets/guide-*.jpg`, captured from the example project with Playwright. Real site photographs cannot be produced in this environment; they would need to come from Ben's own jobs.

## Guide Library page

`public/Guide Library.dc.html` keeps its name (the planner, Home and the Learning Hub link to it) but is now a plain page: `guide-library.js` renders the rail (search, level and topic filters, saved and unread filters, reading progress), the level sections with guide cards, a five-question check per level, the glossary and the useful links. Opening a guide shows it on its own with previous and next links and sets `#g=<id>` in the address, so a guide can be shared by link. Printing a guide prints only that guide. Reading progress, saved guides and quiz scores live in `localStorage` under `evsp_guides_v1`, separate from projects.

The Learning Hub carries the same Learn strip (Guides, Glossary, Training courses, Useful links, 3D viewer) under its header.

## Help in the planner

- `public/help.js` and `help.css` add the help drawer: a panel on the right (full width on phones) with the guide, a search box over every guide and glossary term, Show me around, and a link to the full library. `EVHelp.open(id)` opens a guide; any element with `data-ev-help="<guide id or page key>"` opens it on click.
- Every page header has a Help button that opens the guide for that page (Markup's sits in the top bar). Card titles on Overview, Design lab, Programme, Review & issue, Your projects and My profile carry a small ? that opens the matching guide with a one-sentence tip above it. The Markup page's existing ? hints keep their text; their guide links now open the drawer instead of a new tab.
- Show me around is a four-step tour (add a plan, set the scale, place chargers and routes, check and issue). It never opens by itself: on a first visit the Help button carries a lime dot and the drawer offers the tour at the top. `evsp_tour_seen` in `localStorage` records that help has been opened.

## Checks

`tests/guides.test.mjs` checks every guide's level, topic, links, terms and diagrams, that every planner hint and ? button points at a real guide, the house style (no em-dashes, no "last reviewed" date, the design-assistance wording on Installing and Advanced guides) and the calculator arithmetic. The workspace browser suite opens the library (search, a diagram, a glossary pop-over, a calculator and the glossary) and the drawer (Help and ? buttons, search, the tour).
