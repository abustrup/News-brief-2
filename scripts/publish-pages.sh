#!/usr/bin/env bash
# Publish the daily brief to GitHub Pages (free).
# Runs on your machine via the Cowork scheduled task -> uses your Claude Max
# subscription. No API key, no paid host. Publishes ONLY if every check is green.
set -euo pipefail

DATE="$(date +%F)"

echo "==> verify (typecheck + tests)"
npm run verify

echo "==> build today's brief"
npm run brief:build

echo "==> validate + quality gate (blocking)"
npm run validate:draft -- data/draft.json
npm run check:draft -- data/draft.json

echo "==> metrics"
npm run metrics:brief -- data/draft.json "data/metrics/${DATE}.json"

echo "==> render the page GitHub Pages will serve"
npm run render -- data/draft.json docs/index.html
cp data/draft.json "data/briefs/${DATE}.json"

echo "==> publish via git (Pages auto-deploys from /docs on main)"
git add docs/index.html "data/briefs/${DATE}.json" "data/metrics/${DATE}.json"
git commit -m "brief: ${DATE}" || { echo "No changes to publish."; exit 0; }
git push
echo "Published ${DATE}."
