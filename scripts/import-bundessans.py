#!/usr/bin/env python3
"""Import locally supplied BundesSans webfonts without adding them to Git."""

import argparse
import json
import shutil
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("source", type=Path, help="Directory containing extracted BundesSans webfonts")
args = parser.parse_args()
source = args.source.expanduser().resolve()
if not source.is_dir():
    parser.error("Bitte einen vorhandenen Ordner mit entpackten Webfonts angeben.")

root = Path(__file__).resolve().parents[1]
selected = {}
for path in sorted(source.rglob("*")):
    name = path.stem.lower().replace("_", "-").replace(" ", "")
    if not path.is_file() or path.suffix.lower() not in (".woff2", ".woff"):
        continue
    if "bundes" not in name or "sans" not in name or "cond" in name:
        continue
    weight = 700 if "bold" in name else 400
    style = "italic" if "ital" in name else "normal"
    if weight == 400 and style == "normal" and "regular" not in name:
        continue
    key = (weight, style)
    previous = selected.get(key)
    if previous is None or (path.suffix.lower() == ".woff2" and previous.suffix.lower() != ".woff2"):
        selected[key] = path

if (400, "normal") not in selected:
    parser.error("Keine BundesSans Regular als WOFF2/WOFF gefunden. Dateinamen und Webfont-Paket prüfen.")

dest = root / "public/assets/bundessans"
dest.mkdir(parents=True, exist_ok=True)
manifest = []
for (weight, style), path in sorted(selected.items()):
    filename = f"bundessans-{weight}-{style}{path.suffix.lower()}"
    shutil.copy2(path, dest / filename)
    manifest.append(dict(file=filename, weight=weight, style=style))
(dest / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print(f"{len(manifest)} Webfonts lokal eingebunden. Vorschau neu starten bzw. neu bauen.")
if len(manifest) < 4:
    print("Nicht alle vier Schriftschnitte gefunden; fehlende Schnitte werden vom Browser synthetisiert.")
