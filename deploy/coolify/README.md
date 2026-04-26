# W3Booster Coolify Preview

This compose file is for the isolated Coolify preview stack on `devsheep.de`.
It uses GHCR images and intentionally avoids the production ports `14969` and
`14970`.

## Preview Ports

- Client web UI: `http://devsheep.de:15420`
- Parse/master HTTPS API: `https://devsheep.de:15469`
- Overlay websocket: `wss://devsheep.de:15470`
- Overlay web UI: `http://devsheep.de:15480`
- Parse Dashboard: `http://devsheep.de:15440`

## Coolify

Configured resource:

- Project: `W3Booster`
- Environment: `preview`
- Service: `w3booster-preview`
- Service UUID: `nksokwkks4w8g48ogokcskgg`

The service is configured but not deployed. Deploy only after the GHCR images
exist for `ghcr.io/padjon/w3booster-{client,master,overlay}:main` or after
changing `W3BOOSTER_IMAGE_TAG` to an available tag.

Dashboard credentials are stored as Coolify environment variables. The generated
dashboard password is also on the server at
`/root/w3booster-preview-dashboard-password.txt` with `0600` permissions.
