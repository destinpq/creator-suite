#!/usr/bin/env bash
# Wrapper to run the backend uvicorn under PM2 reliably.
set -euo pipefail
cd "$(dirname "$0")"
VENV="./venv"
UVICORN="$VENV/bin/uvicorn"
if [ ! -x "$UVICORN" ]; then
  echo "uvicorn binary not found at $UVICORN" >&2
  exit 2
fi
# Exec uvicorn so PM2 manages the uvicorn process directly.
PYTHON="$VENV/bin/python"
ENTRY="$(pwd)/pm2_entry.py"

if [ ! -x "$PYTHON" ]; then
  echo "python binary not found at $PYTHON" >&2
  exit 2
fi

if [ ! -f "$ENTRY" ]; then
  echo "entrypoint not found at $ENTRY" >&2
  exit 2
fi

# Exec the venv python on the entrypoint so the shim runs very early.
exec "$PYTHON" "$ENTRY"
