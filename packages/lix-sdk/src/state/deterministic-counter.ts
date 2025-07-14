import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { executeSync } from "../database/execute-sync.js";
import { LixKeyValueSchema, type LixKeyValue } from "../key-value/schema.js";

/** State kept per SQLite connection */
type CounterState = {
	next: number; // number that will be handed out _next_
	highestSeen: number; // highest value actually handed out
	dirty: boolean; // true ⇢ we have to persist on commit
};

const counterCache = new WeakMap<SqliteWasmDatabase, CounterState>();

/**
 * Return the next monotone **deterministic count** for this **Lix** instance.
 *
 * ```ts
 * // quick-start
 * const n1 = nextDeterministicCount({ lix }); // 0
 * const n2 = nextDeterministicCount({ lix }); // 1
 *
 * // do any normal write – counts are flushed automatically
 * await lix.db.insertInto("kv").values({ key: "a", value: "1" }).execute();
 *
 * // later, even after toBlob()/re-open, the sequence continues
 * const n3 = nextDeterministicCount({ lix }); // 2
 * ```
 *
 * @example Deterministic string IDs
 * ```ts
 * const c  = nextDeterministicCount({ lix }); // e.g. 7
 * const id = `ENTITY_${c}`;                   // "ENTITY_7"
 * ```
 *
 * @param args.lix  A fully-initialised Lix instance (from `openLix()`).
 * @returns         The next integer in the deterministic sequence.
 *
 * @remarks
 * * Any two clones that start from the same blob will emit **identical**
 *   sequences (0, 1, 2, …).
 * * Persistence is automatic – every successful write-transaction and every
 *   `lix.toBlob()`/`lix.close()` stores the current counter. No manual
 *   flushing is required.
 */
export function nextDeterministicCount(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<LixInternalDatabaseSchema>;
}): number {
	let state = counterCache.get(args.sqlite);

	/* First use on this connection → pull initial value from DB */
	if (!state) {
		const [row] = executeSync({
			lix: { sqlite: args.sqlite },
			// querying from key_value_all is fine here because its a view
			// that hits the internal_state_all_untracked table
			query: args.db
				.selectFrom("key_value_all")
				.where("key", "=", "lix_deterministic_counter")
				.where("lixcol_version_id", "=", "global")
				.select("value"),
		});

		// The persisted value is the next counter to use
		const start = row ? Number(row.value) + 1 : 0;
		state = { next: start, highestSeen: start - 1, dirty: false };
		counterCache.set(args.sqlite, state);
	}

	/* Hand out current, then bump for the next call */
	const count = state.next++;
	state.highestSeen = count;
	state.dirty = true;

	return count;
}

/**
 * @internal
 * Flush the in-memory deterministic counter to persistent storage.
 *
 * Called automatically by Lix after each committing write and during
 * `lix.toBlob()` / `lix.close()`.  **Not part of the public API.**
 */
export function commitDeterministicCountIncrement(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<LixInternalDatabaseSchema>;
}): void {
	const state = counterCache.get(args.sqlite);
	if (!state || !state.dirty) return; // nothing to do

	state.dirty = false; // mark clean _before_ we try to write

	const newValue = JSON.stringify({
		key: "lix_deterministic_counter",
		value: state.highestSeen,
	} satisfies LixKeyValue);

	executeSync({
		lix: { sqlite: args.sqlite },
		query: args.db
			.insertInto("internal_state_all_untracked")
			.values({
				entity_id: "lix_deterministic_counter",
				version_id: "global",
				file_id: "lix",
				schema_key: LixKeyValueSchema["x-lix-key"],
				plugin_key: "lix_own_entity",
				schema_version: LixKeyValueSchema["x-lix-version"],
				snapshot_content: newValue,
			})
			.onConflict((oc) =>
				oc.doUpdateSet({
					snapshot_content: newValue,
				})
			),
	});
}
