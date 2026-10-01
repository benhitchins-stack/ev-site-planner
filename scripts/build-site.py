"""Version first-party browser assets and synchronise the static entry pages."""
from hashlib import sha256
from pathlib import Path
import re

public = Path(__file__).resolve().parent.parent / 'public'
planner = public / 'EV Site Planner.html'
source = planner.read_text()
assets = ['profile.css', 'profile.js', 'workspace.css', 'home.css', 'workspace.js', 'home.js',
          'delivery.js', 'report-fonts.js', 'bay-markings.js']
for name in assets:
    digest = sha256((public / name).read_bytes()).hexdigest()[:12]
    source = re.sub(r'((?:src|href)=")' + re.escape(name) + r'(?:\?v=[^"<>]+)?"',
                    lambda m: m[1] + name + '?v=' + digest + '"', source)
for entry in ['EV Site Planner.html', 'index.html', 'home.html', 'Landing Page Final.dc.html']:
    (public / entry).write_text(source)
print('Updated asset versions and the four home/workspace entry pages.')
