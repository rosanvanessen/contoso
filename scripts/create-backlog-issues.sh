#!/usr/bin/env bash
# Creates the workshop backlog as GitHub issues in YOUR repository (run once, from the repo root).
# Requires: gh auth status  →  logged in (Codespaces: already authenticated).
set -euo pipefail
for file in docs/backlog/BL-*.md; do
  title=$(head -n 1 "$file" | sed 's/^# //')
  label=$(sed -n '2p' "$file" | sed 's/^labels: //')
  body=$(sed '1,3d' "$file")
  gh label create "$label" --force >/dev/null 2>&1 || true
  if gh issue list --state all --search "\"$title\" in:title" --json number --jq 'length' | grep -q '^0$'; then
    gh issue create --title "$title" --label "$label" --body "$body" >/dev/null
    echo "✔ created: $title"
  else
    echo "• exists:  $title"
  fi
done
