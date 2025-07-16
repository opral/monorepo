import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { executeSync } from "../database/execute-sync.js";
import { LixKeyValueSchema, type LixKeyValue } from "../key-value/schema.js";
import type { Lix } from "../lix/open-lix.js";
import { isDeterministicMode } from "./is-deterministic-mode.js";

/** State kept per SQLite connection */
type CounterState = {
	next: number; // number that will be handed out _next_
	highestSeen: number; // highest value actually handed out
	dirty: boolean; // true ⇢ we have to persist on commit
};

const counterCache = new WeakMap<SqliteWasmDatabase, CounterState>();

/**
 * Returns the next monotonic sequence number, starting at 0.
 * 
 * Only available in deterministic mode. Provides a simple counter for cases where
 * you need sequential integers rather than timestamps or random values.
 *
 * - Requires `lix_deterministic_mode = true`
 * - Increments by exactly 1 per call (no gaps or duplicates)
 * - State persisted via `lix_deterministic_sequence_number` key value
 * - Clones continue from where the sequence left off
 * - Consider using {@link timestamp}, {@link uuidV7}, or {@link nanoId} for most ID generation needs
 *
 * @example Basic usage (deterministic mode required)
 * ```ts
 * const lix = await openLix({
 *   keyValues: [{ key: "lix_deterministic_mode", value: true }]
 * });
 * const n1 = nextDeterministicSequenceNumber({ lix }); // 0
 * const n2 = nextDeterministicSequenceNumber({ lix }); // 1
 * const n3 = nextDeterministicSequenceNumber({ lix }); // 2
 * ```
 *
 * @example Collision-free IDs
 * ```ts
 * const n = nextDeterministicSequenceNumber({ lix }); // e.g. 7
 * const id = `ENTITY_${n}`;              // "ENTITY_7"
 * ```
 * 
 * @example Pagination cursors
 * ```ts
 * const cursor = nextDeterministicSequenceNumber({ lix });
 * await lix.db.insertInto("page_view")
 *   .values({ cursor, page_id: "home" })
 *   .execute();
 * ```
 *
 * @param args.lix - The Lix instance with sqlite and db connections
 * @returns The next number in the sequence (starting from 0)
 * @throws {Error} If `lix_deterministic_mode` is not enabled
 */
export function nextDeterministicSequenceNumber(args: {
	lix: Pick<Lix, "sqlite" | "db">;
}): number {
	// Check if deterministic mode is enabled
	if (!isDeterministicMode({ lix: args.lix })) {
		throw new Error(
			"nextDeterministicSequenceNumber() is available only when lix_deterministic_mode = true"
		);
	}

	let state = counterCache.get(args.lix.sqlite);

	/* First use on this connection → pull initial value from DB */
	if (!state) {
		const [row] = executeSync({
			lix: { sqlite: args.lix.sqlite },
			// querying from key_value_all is fine here because its a view
			// that hits the internal_state_all_untracked table
			query: args.lix.db
				.selectFrom("key_value_all")
				.where("key", "=", "lix_deterministic_sequence_number")
				.where("lixcol_version_id", "=", "global")
				.select("value"),
		});

		// The persisted value is the next counter to use
		const start = row ? Number(row.value) + 1 : 0;
		state = { next: start, highestSeen: start - 1, dirty: false };
		counterCache.set(args.lix.sqlite, state);
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
export function commitDeterminsticSequenceNumber(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<LixInternalDatabaseSchema>;
}): void {
	const state = counterCache.get(args.sqlite);
	if (!state || !state.dirty) return; // nothing to do

	state.dirty = false; // mark clean _before_ we try to write

	const newValue = JSON.stringify({
		key: "lix_deterministic_sequence_number",
		value: state.highestSeen,
	} satisfies LixKeyValue);

	executeSync({
		lix: { sqlite: args.sqlite },
		query: args.db
			.insertInto("internal_state_all_untracked")
			.values({
				entity_id: "lix_deterministic_sequence_number",
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
