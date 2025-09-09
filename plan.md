% Backend Prototype Plan (Worker-first)

This plan outlines a worker‑first backend for Lix using OPFS SAHPool. We will immediately use SAHPool for persistence and move the full database logic (schema init, vtable, hooks, plugin change detection) into a Dedicated Web Worker. The long‑term goal is that apps keep using `openLix({})` as before, with the backend chosen automatically under the hood.

## Goals (Prototype)

- Keep backends generic (exec + persistence). Move all Lix runtime logic (schema, vtable, UDFs, file handlers, plugin registry) into a single runtime boot module owned by Lix.
- Run the same runtime boot next to SQLite in both environments:
  - Main thread (InMemory backend)
  - Dedicated Worker (OPFS SAHPool backend)
- Standardize plugin loading to stringified ESM modules in `openLixBackend()`.
- Keep the main thread responsive when using the Worker backend; all DB work in the Worker.
- Persist to OPFS from the Worker (no main-thread OPFS I/O).
- Preserve the Lix surface (async DB via Kysely + hooks/observe) with minimal consumer changes.

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

After (Backend + Worker – OPFS)
```text
[Browser Main Thread]
  ├─ React UI / App
  ├─ openLix({ backend })
  │   └─ Kysely (BackendDriver)   ← uses backend.exec(...)
  │
  └─ Dedicated Worker (opfs-sah.worker.ts)
      ├─ sqlite-wasm (in-memory)
      ├─ Backend.init({ blob?, path?, boot, onEvent })
      │   └─ runtime/boot.ts applies schema, vtable, file handlers, loads plugins
      ├─ Persistence (internal import/export to OPFS)
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
     - Dedicated OPFS SAHPool worker at `packages/lix/sdk/src/engine/opfs-sah.worker.ts` (always persists).
     - Same schema/vtable/plugins inside Worker.
     - Handles OPFS persistence internally (import/export + batched saves on commit).

- Backend Kysely driver: `packages/lix/sdk/src/backend/kysely/backend-driver.ts`
  - Depends only on `backend.exec(...)` and emits BEGIN/COMMIT as SQL.

  

## Backend API (Minimal)

Backends are generic hosts for SQLite + persistence. Lix runtime logic is injected at init time. Seeding a brand-new Lix (e.g., via newLixFile) is the caller's responsibility and happens before/within backend.init as needed.

```ts
type ExecResult = { rows?: any[]; changes?: number; lastInsertRowid?: number }

export interface LixBackend {
  init(opts: {
    path?: string // e.g. OPFS file name (worker backend)
    blob?: ArrayBuffer // optional seed snapshot
    boot: { code: string; args: BootArgs }
    onEvent: (ev: RuntimeEvent) => void // bridge events from runtime to host
  }): Promise<void>

  exec(sql: string, params?: unknown[]): Promise<ExecResult>
  execBatch?(batch: { sql: string; params?: unknown[] }[]): Promise<{ results: ExecResult[] }>
  export(): Promise<ArrayBuffer>
  close(): Promise<void>
}
```

Transactions are plain SQL via `exec`.

### Backends

1) `InMemory()` (in‑process, no persistence)

- Uses `sqlite-wasm` directly in the main thread (or Node/Electron).
- `init()` → create in‑memory DB → `initDb()` → load plugins → ready.
- `exec()` → synchronous WASM call wrapped in a Promise (`Promise.resolve(result)`). All calls are serialized via an internal promise queue.
- `export()` → `contentFromDatabase(db)`.
- Note: heavy plugin work will block the UI. Use for tests/CLI or very light work.

2) `OpfsSahWorker({ name })` (Dedicated Worker + OPFS SAHPool)

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

Change `openLix` to accept a `backend` instead of `storage`. Kysely driver depends only on `LixBackend`.

```ts
// Worker backend (plugins as stringified ESM)
const backend = OpfsSahWorker()
const lix = await openLixBackend({ backend, pluginsRaw: [mdCode] })

// In‑process backend uses the same runtime boot (stringified ESM)
const backend = InMemory()
const lix = await openLixBackend({ backend, pluginsRaw: [mdCode] })
```

No separate storage concept. Backends own persistence. Runtime boot is executed during `backend.init`.

## Worker-side shape (functional)

Keep the worker a simple module + factory, not a class.

```ts
// opfs-sah.worker.ts
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

`OpfsSahWorker()` closes over `call()` and returns an object with `init/exec/...` methods that call `call('exec', ...)` etc.

## Plugin Execution in Worker

- Runtime boot hosts `pluginRegistry: LixPlugin[]` loaded via dynamic import from stringified ESM.
- The existing file handlers (`handleFileInsert/Update`) and vtable commit logic call `plugin.detectChanges` where relevant; with the whole engine in Worker, they can safely call `executeSync` and use `lix.sqlite` locally.
- For prototype, pass plugin module specifiers from main; Worker imports them and registers.

### Plugin Loading (stringified ESM)

Workers can import ESM modules via `import()`. Since functions cannot be structured‑cloned, do not pass plugin function objects. Provide importable module sources via `expProvideStringifiedPlugins` instead.

Supported pattern (single):
- Raw ESM code (string):
  - `pluginsRaw: string[]` passed into runtime boot.
  - Boot wraps each in a Blob URL (browser/worker) or Node data: URL and dynamic-imports; expects `export const plugin`.

Fallback (main-thread only):
- If a plugin is not importable in a worker (e.g., inline code), use `createMainMemoryEngine()` and `providePlugins` for that path (blocks UI under load). Avoid for production.

Bundler tips
- Vite: `?raw` returns the file content as a string.
  - `import mdCode from '@lix-js/plugin-md/dist/index.js?raw'`
  - Pass `[mdCode]` to `expProvideStringifiedPlugins`.
- Webpack: use `raw-loader` or asset/source to import ESM file content as string.
Ensure plugins are bundled as single-file ESM without external imports.

## Persistence & Auto-Save

- Worker backend maintains batched auto-save entirely inside Worker.
- Save semantics: only on the outermost COMMIT (track transaction depth), debounced (e.g., 300 ms) to avoid storms.
- Atomic write pattern: `const w = await fileHandle.createWritable({ keepExistingData: false }); await w.write(bytes); await w.close();`.
- Runtime stays agnostic and only emits `state_commit` events; the backend decides when to persist.

## Developer Experience & Bundling (Minimal)

- Use module workers in ESM bundlers:
  - Vite/Rollup: `new Worker(new URL('./opfs-sah.worker.ts', import.meta.url), { type: 'module' })`.
  - Webpack: same `new URL` pattern.
- Keep prototype self-contained in `@lix-js/sdk` under `src/backend`.

## Testing Strategy (Prototype)

- Unit-test the backend Kysely driver with a mock backend (and with a worker transport stub).
- Implement in Flashtype `OpfsSahWorker` and exercise:
  - Large writes without UI jank.
  - Plugin `detectChanges` flow.
  - Auto-save + reload roundtrip via OPFS.
  - Nested transactions (autosave fires once on outermost commit).
  - execBatch executes sequentially with no implicit transaction.

## Milestones (Minimal)

1) M1 – Backend API + Main-thread backend
- Define the `LixBackend` interface.
- Implement `backend/main-thread.ts` (in-memory, same-thread binding).
- Run initDb/vtable/plugins locally; support `exec`, transactions via SQL, `export`.

2) M2 – Worker backend (OPFS) + Driver
- Implement `opfs-sah.worker.ts` with OPFS persistence and batched auto-save.
- Implement backend Kysely driver (uses backend.exec) and wire into `openLixBackend({ backend })`.

3) M3 – Demo
- Demo app uses Worker backend; validate responsiveness and persistence.

## Risks & Mitigations

- Plugin loading in Worker: ensure plugins are ESM and browser-compatible. Mitigation: start with in-repo plugins.
- Test environment: OPFS unavailable in Node. Mitigation: browser demo + minimal Node unit tests with mocks.
- Message overhead: Large result sets cross thread. Mitigation: paginate where needed; transfer `ArrayBuffer`s; keep results reasonable.
- API parity: Some current direct `lix.sqlite` usage on main thread. Mitigation: for prototype, avoid exposing raw sqlite on main; rely on Kysely + Worker.

## Acceptance Criteria (Prototype)

- A sample app (e.g., md-app or flashtype) can open Lix with `OpfsSahWorker` and remain responsive during heavy writes.
- Plugin `detectChanges` executes in Worker and updates state accordingly.
- Changes auto-save to OPFS in Worker; reload restores state.
- No COOP/COEP headers required for the prototype path.

## Follow-ups (Post-Prototype)

- Multi-tab coordination (SharedService pattern with Web Locks + BroadcastChannel).
- Switch to `opfs-sahpool` VFS for best OPFS performance.
- Telemetry/inspector support bridging (emit hook events to main thread as needed).
- Hardened error handling and retries for OPFS locking/contention.

## Implementation Checklist (4 Phases)

- [x] Phase 1 — Scaffold + Main-thread engine
  - [x] Create engine folders and stubs (`src/engine/*` consolidated)
  - [x] Define `LixEngine` types (`types.ts`)
  - [x] Implement `createMainMemoryEngine` (init/exec/execBatch/export/close)
  - [x] Plugin loader from code strings (Blob/data URL import)
  - [x] Unit tests: main engine basics

- [ ] Phase 2 — Worker engine
  - [x] Scaffold `opfs-sah.worker.ts` + minimal router
  - [x] Host transport helper (request/response correlation)
  - [ ] Add optional `PromiseQueue` util and wire where needed (worker)
  - [x] Implement `createOpfsSahWorker` (init/exec/execBatch)
  - [x] Autosave: outermost COMMIT + debounce
  - [x] OPFS atomic write (createWritable → write → close)
  - [x] Evaluate runtime boot module during `init`

- [ ] Phase 3 — Driver + Integration
  - [x] Implement `engine-kysely-driver.ts`
  - [x] Add experimental `openLixBackend({ backend })`
  - [ ] Wire `openLixBackend` to pass boot code + args (pluginsRaw only)
  - [ ] Adapt Flashtype to `openLixBackend` + worker backend

- [ ] Phase 4 — Docs, Tests, Perf
  - [ ] Docs updates (README, plan)
  - [ ] Tests: nested tx (outermost autosave), batch semantics, errors
  - [ ] Perf probes: export/write timings, UI long tasks
  - [ ] Demo: Flashtype on worker; cleanup storage mentions
