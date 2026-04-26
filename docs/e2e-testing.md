# E2E Testing

The client now has a Playwright harness for browser-visible UI, mobile/desktop
responsive checks, screenshots, and payment handoff states without requiring
Twitch, Parse, Electron, live PayPal, or live Stripe.

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

Tests do not call live PayPal or Stripe. They mock the gift checkout endpoints
and create the same pending handoff states used by the app, then assert that
the UI reaches the provider redirect state.

## Visual And Mobile Coverage

The authenticated dashboard suite runs in desktop Chromium and Mobile Chrome.
It captures screenshots for the main persona routes and verifies that mobile
dashboard pages can scroll without horizontal overflow.
