import type { LixEngine } from "../boot.js";
import { nextSequenceNumberSync } from "./sequence.js";
import { isDeterministicModeSync } from "./is-deterministic-mode.js";
import { sql } from "kysely";
import { internalQueryBuilder } from "../internal-query-builder.js";

/**
 * Sync variant of {@link getTimestamp}. See {@link getTimestamp} for behavior and examples.
 *
 * @remarks
 * - Accepts `{ engine }` (or `{ lix }` for backward‑compat) and runs next to SQLite.
 * - Intended for engine/router and UDFs; app code should use {@link getTimestamp}.
 *
 * @see getTimestamp
 */
export function getTimestampSync(args: {
	engine: Pick<LixEngine, "executeSync" | "hooks" | "runtimeCacheRef">;
}): string {
	const engine = args.engine;
	// Check if deterministic mode is enabled
	if (isDeterministicModeSync({ engine: engine })) {
		// Check if timestamps are disabled in the config
		const compiled = internalQueryBuilder
			.selectFrom("internal_resolved_state_all")
			.where("entity_id", "=", "lix_deterministic_mode")
			.where("schema_key", "=", "lix_key_value")
			.where("snapshot_content", "is not", null)
			.select(
				sql`json_extract(snapshot_content, '$.value.timestamp')`.as("timestamp")
			)
			.compile();
		const { rows } = engine.executeSync({
			sql: compiled.sql,
			parameters: compiled.parameters,
		});
		const config = rows[0];

		// If timestamp is explicitly set to false, use real time
		if (config?.timestamp == false) {
			return new Date().toISOString();
		}

		// Otherwise use deterministic timestamps
		// Get the next deterministic counter value
		const counter = nextSequenceNumberSync({ engine: engine });
		// Use counter as milliseconds since epoch
		return new Date(counter).toISOString();
	}

	// Return current timestamp in ISO format
	return new Date().toISOString();
}

/**
 * Get the current timestamp as an ISO 8601 string.
 *
 * In deterministic mode, returns logical timestamps starting from Unix epoch (1970-01-01T00:00:00.000Z),
 * incrementing by 1ms per call. In normal mode, returns the current system time.
 *
 * - In deterministic mode: advances by exactly 1ms per call.
 * - Monotonically increasing (never goes backwards).
 * - State persisted via `lix_deterministic_sequence_number`.
 * - Common uses: `createdAt` fields, TTL calculations, time-ordered queries.
 *
 * @example Normal mode – current time
 * ```ts
 * const lix = await openLix();
 * const ts = await timestamp({ lix }) // "2024-03-15T10:30:45.123Z"
 * ```
 *
 * @example Deterministic mode – logical clock from epoch
 * ```ts
 * const lix = await openLix({ keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }] });
 * await timestamp({ lix }) // "1970-01-01T00:00:00.000Z"
 * await timestamp({ lix }) // "1970-01-01T00:00:00.001Z"
 * await timestamp({ lix }) // "1970-01-01T00:00:00.002Z"
 * ```
 */
export async function getTimestamp(args: {
	lix: { call: (name: string, payload?: unknown) => Promise<unknown> };
}): Promise<string> {
	const res = await args.lix.call("lix_timestamp");
	return String(res);
}
