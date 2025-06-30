# Lix **Live-Query API** — Specification v1

_(Wrapper name: \*\*`LixObservable`_)\*  
**Status:** Pilot · 2025-06-29

Turns any Kysely **read** query into a push-stream that updates after every
relevant commit.  
The stream object implements the **TC-39 Observable** protocol and adds two
Kysely-style convenience helpers.

---

## 1 Design Principles

| #   | Principle                               | Rationale                                     |
| --- | --------------------------------------- | --------------------------------------------- |
| P-1 | **Leave the Kysely builder untouched**  | avoid name collisions with upstream           |
| P-2 | **Single freeze point** (`lix.observe`) | clear mental model: build ⇢ freeze ⇢ stream   |
| P-3 | **Transport = TC-39 Observable**        | works in React, Solid, RxJS, Signals, Workers |
| P-4 | **Ergonomic parity with `execute*`**    | expose `subscribe*` helpers mirroring Kysely  |

---

## 2 Public API

### 2.1 `lix.observe(query[, options])`

| param     | type                                              | default            | description                               |
| --------- | ------------------------------------------------- | ------------------ | ----------------------------------------- |
| `query`   | `SelectQueryBuilder<any, T>`                      | —                  | any Kysely read query                     |
| `options` | `{ mode?: "array" \| "first" \| "firstOrThrow" }` | `{ mode:"array" }` | rarely needed; helpers cover common cases |

Returns **`LixObservable<T>`**.

---

### 2.2 `LixObservable<T>` interface

```ts
interface LixObservable<T> extends Observable<T[]> {
	subscribe(observer: Partial<Observer<T[]>>): Subscription;

	subscribeTakeFirst(observer: Partial<Observer<T | undefined>>): Subscription; // first row or undefined

	subscribeTakeFirstOrThrow(observer: Partial<Observer<T>>): Subscription; // first row or -> error

	[Symbol.observable](): LixObservable<T>; // TC-39 hook
}
```

---

```ts
// 3.1  Full result-set stream
lix
	.observe(lix.db.selectFrom("key_value").selectAll())
	.subscribe({ next: (rows) => console.table(rows) });

// 3.2  Track latest change-set (row ∥ undefined)
lix
	.observe(
		lix.db.selectFrom("change_set_all").selectAll().orderBy("created_at desc")
	)
	.subscribeTakeFirst({ next: (cs) => console.log("head →", cs) });

// 3.3  Strict singleton (error when empty)
lix
	.observe(lix.db.selectFrom("settings").where("id", "=", 1).selectAll())
	.subscribeTakeFirstOrThrow({
		next: (row) => render(row),
		error: (err) => alert(err.message),
	});

// 3.4  RxJS interop
import { from, debounceTime } from "rxjs";
from(lix.observe(qb)).pipe(debounceTime(50)).subscribe(console.log);
```

### 4. behavior

| Event                  | Observable behaviour                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Subscribe**          | Returns immediately; runs the query asynchronously.                                                                                       |
| **Initial snapshot**   | Exactly **one** `next(value)` after the first select resolves (even if empty).                                                            |
| **Subsequent commits** | Each relevant `state_commit` triggers one re-select → one `next(updated)`, preserving commit order.                                       |
| **Errors**             | If the select fails **at any time**, an `error(err)` is emitted and the stream terminates.                                                |
| **Completion**         | Stream **never** completes on its own. `complete()` is sent only when the DB is closed or the subscriber calls `unsubscribe()`.           |
| **Unsubscribe**        | Stops future `next/error/complete` deliveries; detaches `state_commit` listener. An in-flight SQL may finish but its result is discarded. |
| **Back-pressure**      | Not implemented in v1 (always eager). Users may wrap the Observable in RxJS operators (`debounceTime`, `throttleTime`, …).                |
