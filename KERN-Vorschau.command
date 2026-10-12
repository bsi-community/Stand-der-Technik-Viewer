#!/bin/zsh
set -eu
cd "${0:A:h}"
if [[ "$(git branch --show-current)" != "restructure-viewer-KERN" ]]; then
  print 'Bitte zuerst den Branch restructure-viewer-KERN öffnen.'
  exit 1
fi
viewer_node="$(command -v node || true)"
if [[ -z "$viewer_node" ]]; then
  viewer_node="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
if [[ ! -x "$viewer_node" || ! -f node_modules/vite/bin/vite.js || ! -d node_modules/@kern-ux/native ]]; then
  print 'Node.js 24 und Projektabhängigkeiten erforderlich. Im Projektordner npm ci ausführen.'
  exit 1
fi
print 'KERN-Vorschau: http://127.0.0.1:5186/Stand-der-Technik-Viewer/'
print 'Dieses Fenster geöffnet lassen. Zum Beenden Ctrl+C drücken.'
exec "$viewer_node" node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5186 --strictPort
