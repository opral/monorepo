# inlang website-v2 plan

## Conclusions so far

- Create a new package `packages/website-v2` with a clean TanStack Start boilerplate.
- Target a fully static SSG build (no server runtime); phase out the old Express/Vike server path.
- Marketplace data: build-time snapshot for item pages, with optional client-side refresh for “live” badges/metadata if needed.
- Incrementally match old website features, starting with a reduced scope.

## Feature checklist

- [x] Landing page (`/`)
- [x] Marketplace item page (`/m/:id/:slug`)
- [x] Apps overview (`/c/apps`)
- [x] Plugins overview (`/c/plugins`)
- [ ] 404 / not-found
- [ ] Global redirects (old URL mappings)
