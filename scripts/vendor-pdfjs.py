"""Vendor the official PDF.js legacy distribution after checking its release digest."""
from pathlib import Path
from urllib.request import urlopen, Request
from hashlib import sha256
import io
import json
import zipfile

VERSION = "6.3.289"
URL = f"https://github.com/mozilla/pdf.js/releases/download/v{VERSION}/pdfjs-{VERSION}-legacy-dist.zip"
DIGEST = "51683fac4aff7dd31ed91e9ab735a2098a78d50899d1ec529aed6dc8aa19400d"
root = Path(__file__).resolve().parent.parent
target = root / "public/vendor/pdfjs"
request = Request(URL, headers={"User-Agent": "EV-Site-Planner-dependency-update"})
with urlopen(request, timeout=90) as response:
    data = response.read(20 * 1024 * 1024)
if sha256(data).hexdigest() != DIGEST:
    raise SystemExit("PDF.js release checksum mismatch")
files = []
with zipfile.ZipFile(io.BytesIO(data)) as archive:
    for entry in archive.infolist():
        name = entry.filename
        destination = None
        if name in ("build/pdf.mjs", "build/pdf.worker.mjs", "LICENSE"):
            destination = name
        for source, folder in (("web/cmaps/", "cmaps/"), ("web/standard_fonts/", "standard_fonts/"), ("web/wasm/", "wasm/")):
            if name.startswith(source) and not entry.is_dir():
                destination = folder + name[len(source):]
        if not destination:
            continue
        if ".." in Path(destination).parts or Path(destination).is_absolute():
            raise SystemExit("Unsafe archive path")
        content = archive.read(entry)
        file = target / destination
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(content)
        files.append({"path": destination, "sha256": sha256(content).hexdigest(), "bytes": len(content)})
    missing = {"build/pdf.mjs", "build/pdf.worker.mjs", "LICENSE"} - {f["path"] for f in files}
    if missing:
        raise SystemExit(f"Release layout changed: missing {sorted(missing)}; entries: {archive.namelist()[:30]}")
(target / "manifest.json").write_text(json.dumps({"version": VERSION, "source": URL, "archiveSha256": DIGEST, "files": sorted(files, key=lambda x: x["path"])}, indent=2) + "\n")
print(f"Verified PDF.js {VERSION}: {len(files)} files, {sum(f['bytes'] for f in files):,} bytes")
