# W3Booster Coolify Preview

This compose file is for the isolated Coolify preview stack on `devsheep.de`.
It uses GHCR images and intentionally avoids the production ports `14969` and
`14970`.

## Preview Ports

- Public client web UI: `https://preview.w3booster.com`
- Local-only client upstream: `http://127.0.0.1:15420`
- Public Parse/master API via Apache: `https://api.preview.w3booster.com`
- Local-only Parse/master container bind: `https://127.0.0.1:15469`
- Local-only overlay websocket: `wss://127.0.0.1:15470`
- Local-only overlay web UI: `http://127.0.0.1:15480`
- Local-only Parse Dashboard: `http://127.0.0.1:15440`

All published container ports must bind to `127.0.0.1`; Apache is the only
public entry point.

## Coolify

Configured resource:

- Project: `W3Booster`
- Environment: `preview`
- Service: `w3booster-preview`
- Service UUID: `nksokwkks4w8g48ogokcskgg`

The service pulls `ghcr.io/padjon/w3booster-{client,master,overlay}:main`.
The `Docker Images` GitHub Actions workflow restarts this Coolify service after
new `main` images are pushed, then calls the start endpoint as a recovery step
because Coolify can leave the compose service stopped after a failed restart.
Both the frontend and API vhosts should expose the Coolify control endpoints;
the workflow tries the frontend endpoint first and falls back to the API endpoint.

Required GitHub secrets:

- `COOLIFY_PREVIEW_RESTART_URL`
- `COOLIFY_PREVIEW_START_URL`
- `COOLIFY_PREVIEW_API_RESTART_URL`
- `COOLIFY_PREVIEW_API_START_URL`
- `COOLIFY_TOKEN`
- `TWITCH_CLIENT_SECRET` in the Coolify service environment, used by master
  for the server-side Twitch OAuth code exchange.

Dashboard credentials are stored as Coolify environment variables. The generated
dashboard password is also on the server at
`/root/w3booster-preview-dashboard-password.txt` with `0600` permissions.
