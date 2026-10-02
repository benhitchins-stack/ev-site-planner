"""Generate a small original image and encode a real HEVC/HEIF test file."""
from pathlib import Path
import os
import struct
import subprocess
import zlib

folder = Path(os.environ.get("EVSP_TEST_OUTPUT", "/tmp/evsp-planning"))
folder.mkdir(parents=True, exist_ok=True)
width, height = 128, 96
raw = b"".join(b"\0" + bytes(channel for x in range(width) for channel in (x * 2, y * 2, 90)) for y in range(height))
def chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xffffffff)
png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")
source = folder / "generated-survey.png"
target = folder / "generated-survey.heic"
source.write_bytes(png)
result = subprocess.run(["heif-enc", "-q", "70", "-o", str(target), str(source)], capture_output=True, timeout=60)
if result.returncode:
    raise SystemExit(result.stderr.decode(errors="replace")[-3000:])
if target.stat().st_size < 100:
    raise SystemExit("HEIC fixture was not encoded")
print(f"Real HEIC fixture: {target.stat().st_size} bytes, {width}x{height} pixels")
