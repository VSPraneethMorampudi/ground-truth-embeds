#!/bin/sh
# Cache-busting: stamp every own script, stylesheet and module import with ?v=<stamp>, so a deploy is always
# picked up (browsers and the Pages CDN otherwise keep old module files). Run before each release:  sh tools/stamp.sh
cd "$(dirname "$0")/.." || exit 1
V=${1:-$(date -u +%Y%m%d%H%M)}
for f in index.html; do
  sed -E -i "s#(href|src)=\"((style|fx|icons|cursor|geo|content|globe|app)\.(css|js)|pipeline/pipeline\.(css|js))(\?v=[0-9a-z]+)?\"#\1=\"\2?v=$V\"#g" "$f"
done
sed -E -i "s#(from |import\()\"(\./(steps|files|screens|apps|scene)\.js)(\?v=[0-9a-z]+)?\"#\1\"\2?v=$V\"#g" pipeline/*.js
echo "stamped $V"
