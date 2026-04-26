# W3Booster

W3Booster monorepo.

This repository consolidates the former `w3booster-client`, `w3booster-master`, `w3booster-overlay`, `w3booster-w3blib`, and shared datamodel repositories into one pnpm workspace.

## Layout

- `apps/client` — Angular client UI
- `apps/master` — Node/TypeScript Parse server
- `apps/overlay` — Angular in-game overlay
- `packages/datamodel` — shared TypeScript models and services
- `packages/w3blib` — native C++ Warcraft III integration

## Quick Start

```bash
ELECTRON_SKIP_BINARY_DOWNLOAD=1 pnpm install
pnpm compose:dev:up
pnpm dev
pnpm build
```

`pnpm dev` starts the app workspaces with a `dev` script via Turbo: client, master, and overlay.
`pnpm compose:dev:up` starts only the supporting local services: MongoDB and Parse Dashboard.

## Docker

```bash
docker compose build
docker compose up
```

For local app development with the apps running on the host instead of in containers:

```bash
docker compose -f docker-compose.dev.yml up -d
```

Local URLs:

- Client: `http://localhost:4200`
- Overlay: `http://localhost:8080`
- Master API: `https://localhost:25080`
- Overlay broadcast: `https://localhost:25081`
- Parse Dashboard: `http://localhost:4040/dashboard/`

For agent-oriented engineering notes, start with `AGENTS.md`.
