# Inlang SDK → Lix-backed database refactor

## Goals
- Move the SDK off its private SQLite instance and onto Lix-managed entities so every change flows through Lix events.
- Preserve current SDK APIs while we migrate.
- Keep the test suite green at every step.

## Non-goals / constraints
- No data migrations are required (the in-memory DB was never persisted).
- Consumers such as Sherlock must continue working throughout the refactor.
- Once finished, the legacy SQLite helpers should be gone.

## Phased plan

### Phase 0 — Hardening
1. Add regression tests that cover the key bundle/message/variant flows. At minimum:
   - `loadProjectInMemory` → ensure `selectBundleNested` returns newly inserted bundles/variants.
   - `importFiles` / `exportFiles` round-trips for the JSON plugin (preserve ordering/formatting assertions).
   - `saveProject()` persists localized edits via the plugin pipeline without mutating untouched files.
   - CLI surfaces (`newProject`, `loadProjectFromDirectory`) survive multiple save/load cycles.
2. Capture the current schema expectations (primary keys, defaults, JSON columns) so we can mirror them in Lix with confidence.

*Exit criteria:* additional tests land; behaviour unchanged.

### Phase 1 — Define schemas and query through Lix
1. Define `inlang_bundle`, `inlang_message`, and `inlang_variant` schemas using the Lix schema-definition helpers (`x-primary-key`, FK chain, generated defaults via Lix functions).
2. On project boot, call `createEntityViewsIfNotExists` to register the new entity views.

*Exit criteria:* CRUD paths run against Lix views; tests stay green.

### Phase 2 — Alias `project.db` to Lix
1. Replace the legacy Kysely instance so `project.db.*` simply forwards to `project.lix.db` (same dialect and plugins, no feature flag).
2. Remove any dual-write logic—writes now hit Lix once via the shared connection.
3. Verify through tests that every API which previously depended on `project.db` still passes, and that Lix emits the expected `state_commit` events.

*Exit criteria:* all SDK reads/writes flow through Lix; no references to the in-memory DB remain in production code paths.

### Phase 3 — Remove legacy SQLite scaffolding
1. Delete the legacy schema/`JsonbPlugin` helpers and the `createInMemoryDatabase` + `importDatabase` steps.
2. Simplify project loading/opening to stop producing `/db.sqlite` snapshots except when explicitly exporting.
3. Update documentation/README to reflect the new architecture.
4. Run the full test suite to ensure nothing depends on the legacy code.

*Exit criteria:* only Lix-backed storage remains; docs are updated; tests are green.

## Testing strategy
- Run `pnpm --filter @inlang/sdk test` at each phase.
- Add integration tests that mirror real project flows (load/import/export) early, so regressions surface immediately.
- During Phase 1, temporarily compare legacy vs. Lix query results to catch drift; remove those checks once Phase 2 completes.

---
Tracking issue: _tbd_
