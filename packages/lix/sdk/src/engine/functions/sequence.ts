import {
	LixKeyValueSchema,
	type LixKeyValue,
} from "../../key-value/schema-definition.js";
import type { LixEngine } from "../boot.js";
import type { Lix } from "../../lix/open-lix.js";
import { isDeterministicModeSync } from "../deterministic-mode/is-deterministic-mode.js";
import { getTimestampSync } from "./timestamp.js";
import { updateUntrackedState } from "../../state/untracked/update-untracked-state.js";
import { sql } from "kysely";
import { internalQueryBuilder } from "../internal-query-builder.js";

/** State kept per SQLite connection */
type CounterState = {
	next: number; // number that will be handed out _next_
	highestSeen: number; // highest value actually handed out
	dirty: boolean; // true ⇢ we have to persist on commit
};

const counterCache = new WeakMap<object, CounterState>();

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
 * - Consider using {@link getTimestampSync}, {@link uuidV7}, or {@link nanoId} for most ID generation needs
 *
 * @example Basic usage (deterministic mode required)
 * ```ts
 * const lix = await openLix({
 *   keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }]
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
export function nextSequenceNumberSync(args: {
	engine: Pick<LixEngine, "hooks" | "runtimeCacheRef" | "executeQuerySync">;
}): number {
	const engine = args.engine;
	// Check if deterministic mode is enabled
	if (!isDeterministicModeSync({ engine: engine })) {
		throw new Error(
			"nextDeterministicSequenceNumber() is available only when lix_deterministic_mode = true"
		);
	}

	let state = counterCache.get(engine.runtimeCacheRef);

	/* First use on this connection → pull initial value from DB */
	if (!state) {
		const [row] = engine.executeQuerySync(
			internalQueryBuilder
				.selectFrom("internal_state_reader")
				.where("entity_id", "=", "lix_deterministic_sequence_number")
				.where("schema_key", "=", "lix_key_value")
				.where("version_id", "=", "global")
				.where("snapshot_content", "is not", null)
				.select(sql`json_extract(snapshot_content, '$.value')`.as("value"))
				.compile()
		).rows;

		// The persisted value is the next counter to use
		const start = row ? Number(row.value) + 1 : 0;
		state = { next: start, highestSeen: start - 1, dirty: false };
		counterCache.set(engine.runtimeCacheRef, state);
	}

	/* Hand out current, then bump for the next call */
	const count = state.next++;
	state.highestSeen = count;
	state.dirty = true;

	return count;
}

/**
 * Returns the next monotonic sequence number, starting at 0.
 *
 * Async wrapper around {@link nextSequenceNumberSync} that runs the computation
 * next to the database engine via the engine router.
 *
 * - Available only when `lix_deterministic_mode.enabled = true`.
 * - Persists state across `toBlob()`/`openLix({ blob })`.
 * - Consider {@link getTimestampSync}, {@link uuidV7}, or {@link nanoId} for typical IDs.
 *
 * @example
 * const lix = await openLix({
 *   keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }]
 * })
 * const n1 = await nextSequenceNumber({ lix }) // 0
 * const n2 = await nextSequenceNumber({ lix }) // 1
 */
export async function nextSequenceNumber(args: { lix: Lix }): Promise<number> {
	const res = await args.lix.call("lix_next_sequence_number");
	return Number(res);
}

/**
 * @internal
 * Flush the in-memory deterministic counter to persistent storage.
 *
 * Called automatically by Lix after each committing write and during
 * `lix.toBlob()` / `lix.close()`.  **Not part of the public API.**
 */
export function commitSequenceNumberSync(args: {
	engine: Pick<
		LixEngine,
		"executeSync" | "hooks" | "runtimeCacheRef" | "executeQuerySync"
	>;
	timestamp?: string;
}): void {
	const engine = args.engine;
	const state = counterCache.get(engine.runtimeCacheRef);
	if (!state || !state.dirty) return; // nothing to do

	state.dirty = false; // mark clean _before_ we try to write

	const newValue = JSON.stringify({
		key: "lix_deterministic_sequence_number",
		value: state.highestSeen,
	} satisfies LixKeyValue);

	const now = args.timestamp ?? getTimestampSync({ engine });
	updateUntrackedState({
		engine: engine,
		changes: [
			{
				entity_id: "lix_deterministic_sequence_number",
				schema_key: LixKeyValueSchema["x-lix-key"],
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: newValue,
				schema_version: LixKeyValueSchema["x-lix-version"],
				created_at: now,
				lixcol_version_id: "global",
			},
		],
	});
}
