#!/usr/bin/env bash
# init.sh — bring the project to a runnable state and smoke-test it.
# Written by the initializer, run at the start of EVERY session.
# Contract:
#   - idempotent: safe to run twice
#   - non-interactive: no prompts
#   - exit 0 only if the app is up AND the smoke test passes
#   - prints the URL / command the session should use to test like a user
# Long-running servers go to the background with logs in .ai-dev/harness/logs/.

set -euo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
LOG_DIR=.ai-dev/harness/logs
mkdir -p "$LOG_DIR"

# ── 1. Dependencies ───────────────────────────────────────────────────────
# npm ci --silent
# python -m pip install -q -e '.[dev]'

# ── 2. Start services (background, reuse if already running) ─────────────
# PORT=${PORT:-3000}
# if ! curl -fsS "http://localhost:$PORT/health" >/dev/null 2>&1; then
#   nohup npm run dev >"$LOG_DIR/dev-server.log" 2>&1 &
#   for _ in $(seq 1 60); do curl -fsS "http://localhost:$PORT/health" >/dev/null 2>&1 && break; sleep 1; done
# fi

# ── 3. Smoke test: the core path a user takes, end to end ────────────────
# curl -fsS "http://localhost:$PORT/" | grep -q "<title>"
# npm test --silent -- --grep smoke

echo "init.sh: [TODO] fill in steps 1-3 for this project"
# echo "APP_URL=http://localhost:$PORT"
