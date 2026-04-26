# Monorepo Conventions

- Use pnpm from the repository root for dependency changes.
- Keep deployable/runtime projects under `apps/*`.
- Keep shared libraries and native source packages under `packages/*`.
- Do not reintroduce Git submodules for code that now lives in the monorepo.
- Preserve existing app-local project files unless a migration step explicitly replaces them.
- Prefer workspace dependencies over relative package-manager installs.
- Do not commit `node_modules`, Angular `dist`, native `x64`, Visual Studio `.vs`, logs, or generated package manager caches.
