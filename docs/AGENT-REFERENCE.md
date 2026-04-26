# Agent Reference

## Migrated Repositories

| Original repo | New path | Purpose |
|---|---|---|
| `w3booster-client` | `apps/client` | Angular app rendered in the W3Booster Electron client. Handles account/UI workflows and client-side app features. |
| `w3booster-master` | `apps/master` | Node/TypeScript backend using Parse Server, Discord/PayPal integrations, scheduler logic, static patch assets, and server-side data services. |
| `w3booster-overlay` | `apps/overlay` | Angular overlay for in-game display, plus certs, ingame assets, and mockup server for local overlay data. |
| `w3booster-datamodel` submodule | `packages/datamodel` | Shared Parse models, model services, transient state types, and service abstractions used by all TypeScript apps. |
| `w3booster-w3blib` | `packages/w3blib` | Visual Studio/C++ DLL injector and Warcraft III memory/integration library. |

## Workspace Packages

| Workspace | Package name | Notes |
|---|---|---|
| `apps/client` | `@w3booster/client` | Keeps existing Angular CLI project files. |
| `apps/master` | `@w3booster/master` | Keeps existing TypeScript server layout and Docker Compose files. |
| `apps/overlay` | `@w3booster/overlay` | Keeps existing Angular CLI project files and overlay assets. |
| `apps/client/bundler` | `@w3booster/client-bundler` | Nested pnpm workspace for the existing Webpack bundler. |
| `apps/overlay/mockup` | `@w3booster/overlay-mockup` | Nested pnpm workspace for local mock data server. |
| `packages/datamodel` | `@w3booster/datamodel` | Extracted from the old shared submodule. |
| `packages/w3blib` | `@w3booster/w3blib` | Native package wrapper around the existing solution. |

## Current Compatibility Layer

The existing apps import shared code through paths such as `src/app/data/common/models`. To avoid a broad import rewrite during the first migration, these paths are symlinks:

```text
apps/client/src/app/data/common  -> packages/datamodel/src
apps/master/src/app/data/common  -> packages/datamodel/src
apps/overlay/src/app/data/common -> packages/datamodel/src
```

Future cleanup can replace those imports with `@w3booster/datamodel` exports once the package API is formalized. The current shared code still imports app-local compatibility shims such as `../../common-imports`, so standalone package type-checking is intentionally deferred.

## Reference Repo Findings

The private reference repo `kreativkapitel/kk-store` uses:

- pnpm workspaces
- Turborepo root orchestration
- `apps/*` for deployable services
- `packages/*` for shared code/config
- root `AGENTS.md` delegating to a detailed `CLAUDE.md`
- documentation under `docs/conventions`

This repository mirrors that engineering shape while keeping W3Booster's existing Angular, Parse Server, and native C++ project structure intact.
