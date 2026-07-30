#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# bun install has been observed to stall for 10+ minutes in this sandbox,
# apparently stuck resolving per-package registry metadata without ever
# writing files. npm resolves the same tree in seconds, so it's the
# reliable install path here even though the project is normally bun-managed.
# --legacy-peer-deps is required because react-simple-maps caps its React
# peerDependency at 18 while the project depends on React 19.
npm install --no-audit --no-fund --legacy-peer-deps

# Start the dev server on 8080 if it isn't already running (idempotent
# across SessionStart sources: startup/resume/clear/compact).
if ! curl -sS -o /dev/null --max-time 1 http://localhost:8080/ 2>/dev/null; then
  # The shared Vite config (@lovable.dev/vite-tanstack-config) hardcodes
  # server.host to "::" (IPv6-any) whenever it detects a sandbox, but this
  # sandbox has no IPv6 socket support (listen fails with EAFNOSUPPORT).
  # Passing --host explicitly on the CLI overrides that.
  nohup node node_modules/.bin/vite dev --host 0.0.0.0 --port 8080 --strictPort \
    > /tmp/rai-pulse-dev-server.log 2>&1 &
  disown

  # Give it a few seconds so tool calls early in the new session don't race
  # a half-started server. Don't fail the hook if it's just being slow.
  for _ in $(seq 1 10); do
    curl -sS -o /dev/null --max-time 1 http://localhost:8080/ 2>/dev/null && break
    sleep 1
  done
fi
