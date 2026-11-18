#!/usr/bin/env bash
# Runs once when the Codespace / dev container is created.
# Every optional step is best-effort: the workshop still works if one of them fails.
set -u
echo "▶ Installing GitHub Copilot CLI (used in labs A2 and A5)…"
npm install -g @github/copilot >/dev/null 2>&1 && echo "  ✔ copilot CLI installed" || echo "  ⚠ could not install @github/copilot (optional)"

echo "▶ Installing GitHub Agentic Workflows extension (used in lab A5)…"
gh extension install github/gh-aw >/dev/null 2>&1 && echo "  ✔ gh aw installed" || echo "  ⚠ could not install gh-aw now — lab A5 shows how to install it (optional)"

echo "▶ Checking the environment…"
node scripts/verify-env.mjs || true
