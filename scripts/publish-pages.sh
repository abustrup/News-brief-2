#!/usr/bin/env bash
# Publish the daily brief to GitHub Pages (free).
# Runs on your machine via the Cowork scheduled task -> uses your Claude Max
# subscription. No API key, no paid host. Publishes ONLY if every check is green.
#
# This script PUBLISHES an already-prepared brief; it does NOT regenerate it.
# The daily flow is:
#   1. git pull
#   2. npm run brief:build          # deterministic fetch+score+dedupe -> data/draft.json
#   3. (editorial/AI step) curate data/draft.json per docs/editorial-policy.md
#   4. bash scripts/publish-pages.sh    # <- you are here: validate, gate, render, commit
# Keeping build OUT of this script is deliberate: it means the editorial curation in
# step 3 is never clobbered by a re-build.
set -euo pipefail

DATE="$(date +%F)"
DRAFT="data/draft.json"

echo "==> verify (typecheck + tests)"
npm run verify

if [ ! -f "$DRAFT" ]; then
  echo "ERROR: $DRAFT not found. Run 'npm run brief:build' and curate it before publishing." >&2
  exit 1
fi

echo "==> validate + quality gate (blocking)"
npm run validate:draft -- "$DRAFT"
npm run check:draft -- "$DRAFT"

echo "==> metrics"
npm run metrics:brief -- "$DRAFT" "data/metrics/${DATE}.json"

echo "==> render the page GitHub Pages will serve"
npm run render -- "$DRAFT" docs/index.html
cp "$DRAFT" "data/briefs/${DATE}.json"

echo "==> publish via git (Pages auto-deploys from /docs on main)"
git add docs/index.html "data/briefs/${DATE}.json" "data/metrics/${DATE}.json"
git commit -m "brief: ${DATE}" || { echo "No changes to publish."; exit 0; }
git push
echo "Published ${DATE}."
