# E2E Testing

The client now has a Playwright harness for browser-visible UI and payment
handoff states without requiring Twitch, Parse, Electron, or live PayPal.

## Commands

```bash
pnpm -C apps/client e2e:install
pnpm -C apps/client e2e:pw
pnpm -C apps/client e2e:headed
pnpm -C apps/client e2e:ui
```

Artifacts are written to:

- `apps/client/test-results`
- `apps/client/playwright-report`

## Local E2E Auth

Tests set `localStorage.W3B_E2E_AUTH=true` before Angular boots. In local,
non-production builds this makes `AuthenticationService` return a mock
authenticated user with player/OBS overlay settings and no network-backed
Parse role lookup.

This mode is blocked in production builds.

## Payment Providers

Tests do not call live PayPal. They create the same `PAYPAL_PENDING_STATE`
used by the app and mock `GET /paypal/state/:state` responses for approved,
cancelled, or error states.
