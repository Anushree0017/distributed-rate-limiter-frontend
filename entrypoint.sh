#!/bin/sh
set -eu

# Templates public/config.js (already copied into the nginx html root as
# config.js) with the real backend URL at container start — see
# src/config.ts for why the placeholder must be the literal string
# "__API_URL__" and how a missing/unset API_URL falls back gracefully.
CONFIG_FILE="/usr/share/nginx/html/config.js"

if [ -n "${API_URL:-}" ]; then
  sed -i "s|__API_URL__|${API_URL}|g" "$CONFIG_FILE"
fi

exec "$@"
