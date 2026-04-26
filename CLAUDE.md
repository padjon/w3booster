# CLAUDE.md

Primary entry point for agentic engineering in this repository.

Also read `docs/AGENT-REFERENCE.md` for the repo-to-monorepo migration map and `docs/conventions/monorepo.md` for workspace rules.

## Commands

```bash
# Install all workspaces
ELECTRON_SKIP_BINARY_DOWNLOAD=1 pnpm install

# Root orchestration
pnpm build
pnpm lint
pnpm test
pnpm check-types

# Docker
docker compose build
docker compose up
docker compose -f docker-compose.dev.yml up -d

# Individual apps
pnpm -C apps/client start
pnpm -C apps/master start
pnpm -C apps/overlay start

# Native library
pnpm -C packages/w3blib build
```

## Monorepo Shape

- `apps/client` — Angular/Electron-hosted W3Booster client UI. Migrated from `w3booster-client`.
- `apps/master` — Node/TypeScript Parse server and backend jobs. Migrated from `w3booster-master`.
- `apps/overlay` — Angular in-game overlay UI. Migrated from `w3booster-overlay`.
- `apps/client/bundler` — WebSocket component bundler used by the client.
- `packages/datamodel` — shared models, Parse services, and model services. Replaces the old `src/app/data/common` Git submodule.
- `packages/w3blib` — native C++ Warcraft III integration and DLL injector sources. Migrated from `w3booster-w3blib`.

## Docker Images

| Image | Dockerfile | Notes |
|---|---|---|
| `ghcr.io/padjon/w3booster-client` | `apps/client/Dockerfile` | Angular static app served by nginx. |
| `ghcr.io/padjon/w3booster-master` | `apps/master/Dockerfile` | Node/Parse backend. Runtime config is env-overridable. |
| `ghcr.io/padjon/w3booster-overlay` | `apps/overlay/Dockerfile` | Angular static overlay served by nginx. |

`packages/w3blib` is intentionally not a deployment image.

## Canonical Sources of Truth

| What | Where |
|---|---|
| Shared app models/services | `packages/datamodel/src` |
| Client UI | `apps/client/src` |
| Master server entry point | `apps/master/src/app/server.ts` |
| Master app data layer | `apps/master/src/app/data` |
| Overlay UI | `apps/overlay/src` |
| Native Visual Studio solution | `packages/w3blib/w3booster-w3blib.sln` |

## Important Migration Notes

- The former `w3booster-datamodel` submodule is now a workspace package at `packages/datamodel`.
- Each app still has `src/app/data/common` as a symlink to `packages/datamodel/src` so legacy imports keep working.
- `packages/datamodel` is a compatibility package for now; standalone type-check/build requires removing legacy app-local imports such as `../../common-imports`.
- This migration copied the current local working tree from the old repositories, not only the last committed GitHub state.
- Build output, `node_modules`, `.git` directories, package-lock files, and local native build output were intentionally not copied.
- The `kk-store` reference repo uses pnpm, Turborepo, `apps/*`, `packages/*`, and a concise `AGENTS.md -> CLAUDE.md` agent entry pattern. W3Booster follows that shape without copying domain-specific Medusa/Next.js conventions.

## Known High-Risk Areas

- Angular apps still use legacy TSLint/Protractor-era scripts even though Angular dependencies are currently v18.
- Angular lint is deferred until TSLint/codelyzer is replaced with ESLint; backend TSLint currently reports inherited style violations.
- Native DLL artifacts are consumed by the master server patch folder; keep binary update flow explicit.
- The datamodel package contains Angular/Parse services and is consumed by browser and server code, so dependency changes can affect all apps.
- `apps/master/package.json` historically relied on globally available tools such as `nodemon`, `ts-node`, `tslint`, and `concurrently`; verify after pnpm install and add explicit dev dependencies as needed.

## Change Workflow

1. Shared model/service changes: update `packages/datamodel/src`, then run checks for client, master, and overlay.
2. Backend contract changes: update `apps/master` first, then update dependent client/overlay code.
3. Native library changes: update `packages/w3blib`, rebuild with Visual Studio, then intentionally copy required DLL artifacts into the server patch location.
4. Package changes: run `pnpm install` at the repo root and commit `pnpm-lock.yaml`.
5. Docs vs code conflicts: code wins, then patch the docs in the same change.
