import type { Lix } from "../lix/open-lix.js";
import { nextDeterministicSequenceNumber } from "./sequence.js";
import { isDeterministicMode } from "./is-deterministic-mode.js";
import { executeSync } from "../database/execute-sync.js";
import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";

/**
 * Returns the current timestamp as an ISO 8601 string.
 *
 * In deterministic mode, returns logical timestamps starting from Unix epoch (1970-01-01T00:00:00.000Z),
 * incrementing by 1ms per call. In normal mode, returns the current system time.
 *
 * - In deterministic mode: Advances by exactly 1ms per call
 * - Monotonically increasing (never goes backwards)
 * - State persisted across reopens via `lix_deterministic_sequence_number`
 * - Common uses: `createdAt` fields, TTL calculations, time-ordered queries
 *
 * @example Normal mode - returns current time
 * ```ts
 * const lix = await openLix();
 * timestamp({ lix }); // "2024-03-15T10:30:45.123Z"
 * ```
 *
 * @example Deterministic mode - logical clock from epoch
 * ```ts
 * const lix = await openLix({
 *   keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }]
 * });
 * timestamp({ lix }); // "1970-01-01T00:00:00.000Z"
 * timestamp({ lix }); // "1970-01-01T00:00:00.001Z" (+1ms)
 * timestamp({ lix }); // "1970-01-01T00:00:00.002Z" (+1ms)
 * ```
 *
 * @example Database operations - createdAt, TTL, time-ordered queries
 * ```ts
 * await lix.db
 *   .insertInto("log")
 *   .values({
 *     id: "log1",
 *     created_at: timestamp({ lix }),
 *     message: "User logged in"
 *   })
 *   .execute();
 * ```
 *
 * @param args.lix - The Lix instance with sqlite and db connections
 * @returns ISO 8601 timestamp string
 */
export function timestamp(args: {
	lix: Pick<Lix, "sqlite" | "db" | "hooks">;
}): string {
	// Check if deterministic mode is enabled
	if (isDeterministicMode({ lix: args.lix })) {
		// Check if timestamps are disabled in the config
		const [config] = executeSync({
			lix: args.lix,
			query: (args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
				.selectFrom("internal_resolved_state_all")
				.where("entity_id", "=", "lix_deterministic_mode")
				.where("schema_key", "=", "lix_key_value")
				.select(
					sql`json_extract(snapshot_content, '$.value.timestamp')`.as(
						"timestamp"
					)
				),
		});

		// If timestamp is explicitly set to false, use real time
		if (config?.timestamp == false) {
			return new Date().toISOString();
		}

		// Otherwise use deterministic timestamps
		// Get the next deterministic counter value
		const counter = nextDeterministicSequenceNumber({
			lix: args.lix,
		});
		// Use counter as milliseconds since epoch
		return new Date(counter).toISOString();
	}

	// Return current timestamp in ISO format
	return new Date().toISOString();
}
