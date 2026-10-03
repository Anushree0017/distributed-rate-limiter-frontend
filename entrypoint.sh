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

# Templates nginx.conf's /api/ proxy target (see that file's comment) —
# BACKEND_URL is where *nginx* reaches the backend server-to-server, which is
# a different address than API_URL (what the *browser* calls, same-origin).
# Auth (Phase 6) made this proxy necessary: the backend has no CORS
# middleware, so without it the browser's cross-origin token/admin calls
# would be blocked.
NGINX_CONF="/etc/nginx/conf.d/default.conf"
sed -i "s|__BACKEND_URL__|${BACKEND_URL:-http://backend:8000}|g" "$NGINX_CONF"

exec "$@"
