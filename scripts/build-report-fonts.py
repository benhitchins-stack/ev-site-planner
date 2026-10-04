"""Build public/report-fonts.js: the embedded "EVSans" face used by every generated PDF.

EVSans is Hanken Grotesk 3.013 Regular and Bold, the static TrueType files from the Google Fonts
build (SIL OFL 1.1), so documents use the same face as the app. jsPDF needs static TrueType (glyf)
fonts and ignores variation axes, so the variable woff2 files in public/vendor/fonts cannot be used.
PDF text passes through the WinAnsi transliteration in EV Site Planner.html, and both files cover
every character it lets through (Latin-1 and the Windows-1252 punctuation).

Usage:
  python3 scripts/build-report-fonts.py HankenGrotesk_400Regular.ttf HankenGrotesk_700Bold.ttf

The two files come from the npm package @expo-google-fonts/hanken-grotesk 0.4.3 (folders 400Regular
and 700Bold); `npm pack @expo-google-fonts/hanken-grotesk@0.4.3` downloads it. They are checked
against the SHA-256 digests below before they are embedded.
"""
import base64
import json
import sys
from hashlib import sha256
from pathlib import Path

DIGESTS = {
    "regular": "315cda587038b4d21cb4899df306fef5c15b34b6b9470352eba9a3dfce72f380",
    "bold": "d4483ef2e26692ea2e491be712b21e0df9cd02c72aea8fa620dd167a337087e8",
}


def main(regular, bold):
    fonts = {}
    for key, path in (("regular", regular), ("bold", bold)):
        data = Path(path).read_bytes()
        if sha256(data).hexdigest() != DIGESTS[key]:
            raise SystemExit(f"{path} does not match the expected Hanken Grotesk 3.013 {key} file")
        fonts[key] = base64.b64encode(data).decode()
    target = Path(__file__).resolve().parent.parent / "public/report-fonts.js"
    target.write_text('/* Report face "EVSans": Hanken Grotesk 3.013 Regular and Bold, static TrueType. '
                      'Licence: SIL OFL 1.1, vendor/HankenGrotesk-OFL.txt. Built by scripts/build-report-fonts.py. */\n'
                      'window.EVReportFonts=' + json.dumps(fonts) + ';\n')
    print(f"Wrote {target} ({target.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(*sys.argv[1:])
