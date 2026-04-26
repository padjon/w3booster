#!/bin/sh
set -eu

TARGET="/usr/share/nginx/html/runtime-config.js"

js_string() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

cat > "$TARGET" <<EOF
window.__W3BOOSTER_CONFIG__ = {
  REST_URL: "$(js_string "${W3BOOSTER_PUBLIC_REST_URL:-}")",
  PARSE_URL: "$(js_string "${W3BOOSTER_PUBLIC_PARSE_URL:-}")",
  PARSE_APP_ID: "$(js_string "${W3BOOSTER_PUBLIC_PARSE_APP_ID:-}")",
  PARSE_JS_KEY: "$(js_string "${W3BOOSTER_PUBLIC_PARSE_JS_KEY:-}")",
  LIVESERVER_URL: "$(js_string "${W3BOOSTER_PUBLIC_LIVESERVER_URL:-}")",
  MATCH_UPDATE_WSS_URL: "$(js_string "${W3BOOSTER_PUBLIC_MATCH_UPDATE_WSS_URL:-}")",
  OVERLAY_RECORDER_WSS_URL: "$(js_string "${W3BOOSTER_PUBLIC_OVERLAY_RECORDER_WSS_URL:-}")"
};
EOF
