# Third-party assets in this folder

Self-hosted, pinned copies of the site's runtime dependencies. PDF.js is sourced
from Mozilla's official release archive; the other entries originated from the
official npm packages.

| Asset | Version | Licence |
|-------|---------|---------|
| `pdfjs/` (PDF.js legacy modules, worker, CMaps, fonts and WASM) | 6.3.289 | Apache-2.0; bundled notices retained |
| `heic2any.min.js` | 0.0.4 | MIT |
| `qrcode.js` (qrcode-generator) | 1.4.4 | MIT |
| `three.module.js` | 0.161.0 | MIT |
| `babel.min.js` (@babel/standalone) | 7.29.0 | MIT |
| `react.production.min.js` | 18.3.1 | MIT |
| `react-dom.production.min.js` | 18.3.1 | MIT |
| `fonts/bricolage-grotesque-*` (Fontsource build) | 5.2.10 | SIL OFL 1.1 |
| `fonts/hanken-grotesk-*` (Fontsource build) | 5.2.8 | SIL OFL 1.1 |
| `fonts/space-grotesk-*` (Fontsource build) | 5.2.10 | SIL OFL 1.1 |
| `fonts/ibm-plex-mono-*` (Fontsource build) | 5.2.7 | SIL OFL 1.1 |
| Hanken Grotesk Regular and Bold, static TTF (embedded in `../report-fonts.js` as the report face EVSans) | 3.013 | SIL OFL 1.1, see `HankenGrotesk-OFL.txt` |

The report face is built by `scripts/build-report-fonts.py` from the static
Hanken Grotesk TTFs in the npm package `@expo-google-fonts/hanken-grotesk` 0.4.3
(the Google Fonts build; the script checks their SHA-256 digests). jsPDF needs
static TrueType fonts, so the variable woff2 files cannot be used for PDFs. The
font name inside the PDF remains EVSans. It replaces DejaVu Sans, which earlier
releases embedded.

The fonts are the SIL Open Font Licence releases of Bricolage Grotesque,
Hanken Grotesk, Space Grotesk and IBM Plex Mono; self-hosting is permitted and the fonts
are not sold separately. `fonts.css` declares them under their original
family names.

All first-party PDF imports and previews call `openPdfDocument`, retaining
`isEvalSupported: false`. The old 3.11.174 UMD files have been removed.
The library and worker use the same 6.3.289 release, with local CMaps, standard
fonts and WASM resources. See pdfjs/LICENSE and bundled resource notices.

pdfjs/manifest.json records the upstream archive URL, published SHA-256 digest,
and byte count/SHA-256 of every vendored file. scripts/vendor-pdfjs.py verifies
the official archive before extraction. tests/vendor-integrity.test.mjs
checks the committed files. Upgrade in a branch and run all PDF import,
worker, profile and report tests before release.
