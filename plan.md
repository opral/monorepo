% Engine Prototype Plan (Worker-first)

This plan outlines a minimal-but-meaningful prototype to run the Lix engine off the UI thread in a Dedicated Web Worker, including the state vtable pipeline and plugin-driven change detection. It keeps the public `openLix` experience largely intact by providing a worker-backed storage adapter and a worker-backed Kysely driver.

## Goals (Prototype)

- Run SQLite + schema init + vtable + commit flow inside a Dedicated Worker.
- Move plugin-driven `detectChanges()` into the Worker so it can use synchronous reads (executeSync) locally.
- Keep the main thread responsive; all DB work happens in the Worker.
- Persist to OPFS from the Worker (no main-thread OPFS I/O).
- Preserve the `Lix` surface (async DB via Kysely) with minimal consumer changes.

## Non-Goals (Prototype)

- Multi-tab arbitration (SharedWorker/ServiceWorker + Web Locks) – defer to a follow-up.
- Switching to SQLite OPFS VFS (“opfs”) requiring COOP/COEP – defer. Start with in-memory DB + export/import to OPFS.
- Transports beyond Dedicated Worker and direct (same-thread) – defer.
- Persistence backends beyond OPFS and in-memory – defer.
- Full test coverage in Node-only environments (OPFS not available) – provide a browser demo harness first.

## Scope Clarification

- Engine implementations own persistence (import/export, auto‑save) – no separate storage API.

## Architecture Overview

Before (Main-thread Engine)
```text
[Browser Main Thread]
  ├─ React UI / App
  ├─ openLix({ storage })
  │   ├─ Kysely (SqliteWasmDriver)
  │   └─ sqlite-wasm (in-memory)
  │       ├─ initDb() schemas, views, vtable, hooks
  │       └─ plugin.detectChanges() via file handlers
  └─ OpfsStorage
      ├─ import/export (contentFromDatabase / importDatabase)
      └─ OPFS I/O (navigator.storage.*) on main thread
```

After (Engine + Worker – OPFS)
```text
[Browser Main Thread]
  ├─ React UI / App
  ├─ openLix({ engine })
  │   └─ Kysely (EngineKyselyDriver)   ← uses engine.exec(...)
  └─ Dedicated Worker (engine.worker.ts)
      ├─ sqlite-wasm (in-memory)
      │   ├─ initDb() schemas, views, vtable, hooks
      │   └─ plugin.detectChanges() (executeSync)
      ├─ Persistence (internal)
      │   ├─ import/export (importDatabase / contentFromDatabase)
      │   └─ OPFS I/O (navigator.storage.*) in worker
      └─ Minimal RPC (postMessage/MessagePort)
```

Transport notes:
- Async only (postMessage); use transferables for `ArrayBuffer`.
- Main thread never calls OPFS directly; the worker owns persistence.

## High-Level Architecture

- Minimal implementations only:
  1) Main-thread in-memory engine (no Worker):
     - `packages/lix/sdk/src/engine-protocol/implementations/main-thread.ts`
     - Initializes sqlite-wasm + schema + vtable in the same thread.
     - No persistence (or optional explicit `toBlob`/`init blob`).
  2) OPFS Worker engine:
     - `packages/lix/sdk/src/engine-protocol/implementations/opfs-worker.ts` (server)
     - Dedicated Worker file at `packages/lix/sdk/src/worker/engine.worker.ts`.
     - Same schema/vtable/plugins inside Worker.
     - Handles OPFS persistence internally (import/export + batched saves on commit).

- Engine-backed Kysely driver: `packages/lix/sdk/src/engine/driver/engine-kysely-driver.ts`
  - Depends only on `engine.exec(...)` and emits BEGIN/COMMIT as SQL.

  

## Engine API (Minimal)

Single host-side interface used by both implementations.

```ts
type ExecResult = { rows?: any[]; changes?: number; lastInsertRowid?: number }
type EngineError = { name: string; code?: string | number; message: string }

export interface LixEngine {
  init(opts: {
    // Worker+OPFS: used; MainMemory: ignored
    path?: string
    // Optional seed (transferable)
    blob?: ArrayBuffer
    // EXPERIMENTAL: Provide stringified plugins for Worker engines.
    // Each entry is an ESM module source code string imported via a Blob URL inside the Worker.
    // For Worker engines only. For in‑process engines, prefer `providePlugins` on openLix.
    expProvideStringifiedPlugins?: string[]
  }): Promise<{ engineVersion: string; schemaVersion?: string; capabilities: { persistence: 'opfs'|'memory' } }>

  exec(sql: string, params?: unknown[]): Promise<ExecResult>

  // Optional: reduce chatter during migrations
  execBatch?(
    batch: { sql: string; params?: unknown[] }[]
  ): Promise<{ results: ExecResult[] }>

  export(): Promise<ArrayBuffer> // snapshot of DB
  close(): Promise<void>
}
```

Transactions are plain SQL (`BEGIN/COMMIT/SAVEPOINT/RELEASE/ROLLBACK TO`) via `exec`.

### Engines

1) `createMainMemoryEngine()` (in‑process, no persistence)

- Uses `sqlite-wasm` directly in the main thread (or Node/Electron).
- `init()` → create in‑memory DB → `initDb()` → load plugins → ready.
- `exec()` → synchronous WASM call wrapped in a Promise (`Promise.resolve(result)`). All calls are serialized via an internal promise queue.
- `export()` → `contentFromDatabase(db)`.
- Note: heavy plugin work will block the UI. Use for tests/CLI or very light work.

2) `createWorkerOpfsEngine({ path })` (Dedicated Worker + OPFS)

- Dedicated Worker hosts sqlite-wasm, schema, vtables, plugins.
- Owns OPFS. On outermost commit: debounced autosave (atomic write). Calls from host are serialized to prevent interleaving.
- Host ↔ Worker RPC mirrors the interface below.

Worker messages (minimal):

```ts
// Host → Worker
{ id, type: 'init' | 'exec' | 'execBatch' | 'export' | 'close', ...payload }
// Worker → Host
{ id, ok: true, result } | { id, ok: false, error: { message, code? } }
```

Use transferables for any `ArrayBuffer`.

## Worker Initialization Flow

1. Receive `init` with `{ path, blob?, expProvideStringifiedPlugins? }`.
2. Create in-memory DB via `createInMemoryDatabase({ readOnly: false })`.
3. If `blob` provided: `importDatabase(db, new Uint8Array(blob))`. Else, if persistence is OPFS, attempt to read existing content internally; otherwise create new via `newLixFile()` in Worker and import it.
4. Call `initDb({ sqlite, hooks })` inside Worker. For prototype hooks:
   - Provide a minimal hooks impl and call `onStateCommit` internally to trigger an engine-managed save (e.g., write to OPFS if configured) with batching.
5. Apply file/account schemas (normally done via `openLix`). In this prototype, Worker should apply the same sequence as `openLix` would after `initDb`, including setting the account state persistence behavior. Alternatively, expose a single `engineInit({ keyValues?, account? })` RPC to do that in Worker.
6. Load and register plugins in Worker (see Plugin Loading).
 
## openLix (storage removed)

Change `openLix` to accept an `engine` instead of `storage`. Kysely driver depends only on `LixEngine`.

```ts
// Worker engine (plugins provided as ESM code strings)
openLix({ engine: createWorkerOpfsEngine({ path, expProvideStringifiedPlugins: [mdCode] }) })

// In‑process engine (supports existing providePlugins with function objects)
openLix({ engine: createMainMemoryEngine(), providePlugins: [jsonPlugin] })
```

No separate storage concept. Engines own persistence.

## Worker-side shape (functional)

Keep the worker a simple module + factory, not a class.

```ts
// engine.worker.ts
export function createWorkerHost() {
  // capture state in closures: sqlite instance, plugin registry, debounce timers, etc.
  return {
    async handle(req) { /* switch on type */ },
    terminate() { /* cleanup */ }
  }
}

const host = createWorkerHost()
self.onmessage = async (ev) => {
  const res = await host.handle(ev.data)
  self.postMessage(res, transferListFrom(res))
}
```

Host transport (tiny, functional):

```ts
function createWorkerTransport(w: Worker) {
  let nextId = 0
  const inflight = new Map()
  w.onmessage = (e) => inflight.get(e.data.id)?.(e.data)

  return function call(type, payload, transfer) {
    const id = String(++nextId)
    const p = new Promise((resolve, reject) => {
      inflight.set(id, (res) => res.ok ? resolve(res.result) : reject(res.error))
    })
    w.postMessage({ id, type, ...payload }, transfer ?? [])
    return p
  }
}
```

`createWorkerOpfsEngine()` then closes over `call()` and returns an object with `init/exec/...` methods that call `call('exec', ...)` etc.

## Plugin Execution in Worker

- Worker hosts `pluginRegistry: LixPlugin[]` loaded via dynamic import.
- The existing file handlers (`handleFileInsert/Update`) and vtable commit logic call `plugin.detectChanges` where relevant; with the whole engine in Worker, they can safely call `executeSync` and use `lix.sqlite` locally.
- For prototype, pass plugin module specifiers from main; Worker imports them and registers.

### Plugin Loading (expProvideStringifiedPlugins)

Workers can import ESM modules via `import()`. Since functions cannot be structured‑cloned, do not pass plugin function objects. Provide importable module sources via `expProvideStringifiedPlugins` instead.

Supported pattern (single):
- Raw ESM code (string):
  - Main passes code strings in `expProvideStringifiedPlugins: string[]`.
  - Worker wraps each in a Blob URL: `const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }))`; then `await import(url)`; optionally `URL.revokeObjectURL(url)` after import.

Fallback (main-thread only):
- If a plugin is not importable in a worker (e.g., inline code), use `createMainMemoryEngine()` and `providePlugins` for that path (blocks UI under load). Avoid for production.

Bundler tips
- Vite: `?raw` returns the file content as a string.
  - `import mdCode from '@lix-js/plugin-md/dist/index.js?raw'`
  - Pass `[mdCode]` to `expProvideStringifiedPlugins`.
- Webpack: use `raw-loader` or asset/source to import ESM file content as string.
Ensure plugins are bundled as single-file ESM without external imports.

## Persistence & Auto-Save

- Worker maintains batched auto-save entirely inside Worker.
- Save semantics: only on the outermost COMMIT (track transaction depth), debounced (e.g., 300 ms) to avoid storms.
- Atomic write pattern: `const w = await fileHandle.createWritable({ keepExistingData: false }); await w.write(bytes); await w.close();`.
- Persist ancillary JSON (e.g., active accounts) from within Worker if needed.

## Developer Experience & Bundling (Minimal)

- Use module workers in ESM bundlers:
  - Vite/Rollup: `new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' })`.
  - Webpack: same `new URL` pattern.
- Keep prototype self-contained in `@lix-js/sdk` under `src/engine`.

## Testing Strategy (Prototype)

- Unit-test the EngineKyselyDriver with a mock engine (and with a worker transport stub).
- Implement in Flashtype `createWorkerOpfsEngine` and exercise:
  - Large writes without UI jank.
  - Plugin `detectChanges` flow.
  - Auto-save + reload roundtrip via OPFS.
  - Nested transactions (autosave fires once on outermost commit).
  - execBatch executes sequentially with no implicit transaction.

## Milestones (Minimal)

1) M1 – Engine API + Main-thread engine
- Define the `LixEngine` interface.
- Implement `implementations/main-thread.ts` (in-memory, same-thread binding).
- Run initDb/vtable/plugins locally; support `exec`, transactions via SQL, `export`.

2) M2 – Worker engine (OPFS) + Driver
- Implement `engine.worker.ts` + `implementations/opfs-worker.ts` with OPFS persistence and batched auto-save.
- Implement `engine-kysely-driver.ts` (uses engine.exec) and wire into `openLix({ engine })`.

3) M3 – Transitional adapter + Demo
- Optional `WorkerOpfsStorage` shim for `openLix({ storage })` compatibility.
- Demo app uses Worker engine; validate responsiveness and persistence.

## Risks & Mitigations

- Plugin loading in Worker: ensure plugins are ESM and browser-compatible. Mitigation: start with in-repo plugins.
- Test environment: OPFS unavailable in Node. Mitigation: browser demo + minimal Node unit tests with mocks.
- Message overhead: Large result sets cross thread. Mitigation: paginate where needed; transfer `ArrayBuffer`s; keep results reasonable.
- API parity: Some current direct `lix.sqlite` usage on main thread. Mitigation: for prototype, avoid exposing raw sqlite on main; rely on Kysely + Worker.

## Acceptance Criteria (Prototype)

- A sample app (e.g., md-app or flashtype) can open Lix with `createWorkerOpfsEngine` and remain responsive during heavy writes.
- Plugin `detectChanges` executes in Worker and updates state accordingly.
- Changes auto-save to OPFS in Worker; reload restores state.
- No COOP/COEP headers required for the prototype path.

## Follow-ups (Post-Prototype)

- Multi-tab coordination (SharedService pattern with Web Locks + BroadcastChannel).
- Switch to `opfs-sahpool` VFS for best OPFS performance.
- Telemetry/inspector support bridging (emit hook events to main thread as needed).
- Hardened error handling and retries for OPFS locking/contention.

## Implementation Checklist (4 Phases)

- [ ] Phase 1 — Scaffold + Main-thread engine
  - [ ] Create engine folders and stubs (`src/engine/{impl,worker,driver,util,plugin}`)
  - [ ] Define `LixEngine` types (`types.ts`)
  - [ ] Implement `createMainMemoryEngine` (init/exec/execBatch/export/close)
  - [ ] Plugin loader from code strings (Blob URL import)
  - [ ] Unit tests: main engine basics

- [ ] Phase 2 — Worker engine
  - [ ] Scaffold `engine.worker.ts` + minimal router
  - [ ] Host transport helper (request/response correlation)
  - [ ] Add optional `PromiseQueue` util and wire where needed (worker)
  - [ ] Implement `createWorkerOpfsEngine` (init/exec/execBatch)
  - [ ] Autosave: outermost COMMIT + debounce
  - [ ] OPFS atomic write (createWritable → write → close)
  - [ ] Worker plugin loading via Blob URL

- [ ] Phase 3 — Driver + Integration
  - [ ] Implement `engine-kysely-driver.ts`
  - [ ] Update `openLix` to accept `{ engine }`
  - [ ] Adapt examples (e.g., Flashtype) to worker engine

- [ ] Phase 4 — Docs, Tests, Perf
  - [ ] Docs updates (README, plan)
  - [ ] Tests: nested tx (outermost autosave), batch semantics, errors
  - [ ] Perf probes: export/write timings, UI long tasks
  - [ ] Demo: Flashtype on worker; cleanup storage mentions
