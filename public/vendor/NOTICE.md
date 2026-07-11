# Third-party assets in this folder

Self-hosted copies of the site's runtime dependencies, pinned to the same
versions the pages previously loaded from public CDNs. Sourced from the
official npm packages.

| Asset | Version | Licence |
|-------|---------|---------|
| `pdf.min.js`, `pdf.worker.min.js` (pdfjs-dist, legacy build) | 3.11.174 | Apache-2.0 |
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

The fonts are the SIL Open Font Licence releases of Bricolage Grotesque,
Hanken Grotesk, Space Grotesk and IBM Plex Mono; self-hosting is permitted and the fonts
are not sold separately. `fonts.css` declares them under their original
family names.
