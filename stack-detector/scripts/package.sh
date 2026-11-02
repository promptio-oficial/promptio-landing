#!/usr/bin/env bash
# Genera stacklens-<version>.zip listo para subir a Chrome Web Store (solo archivos de la extensión).
set -euo pipefail
cd "$(dirname "$0")/.."
V=$(python3 -c "import json;print(json.load(open('manifest.json'))['version'])")
OUT="../stacklens-$V.zip"
rm -f "$OUT"
zip -r -q "$OUT" manifest.json popup.html popup.css popup.js report.html report.css report.js \
  style.css signatures.js detector.js analysis.js render.js dns.js icons
echo "Creado: $(cd .. && pwd)/stacklens-$V.zip"
unzip -l "$OUT" | tail -1
