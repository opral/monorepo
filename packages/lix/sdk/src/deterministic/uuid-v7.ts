import { v7 } from "uuid";
import { nextDeterministicSequenceNumber } from "./sequence.js";
import { isDeterministicMode } from "./is-deterministic-mode.js";
import type { Lix } from "../lix/open-lix.js";
import { executeSync } from "../database/execute-sync.js";
import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";

/**
 * Returns a UUID v7 that is deterministic in deterministic mode.
 *
 * In normal mode, returns a standard time-based UUID v7.
 * In deterministic mode, returns UUIDs with a fixed timestamp prefix and sequential counter suffix.
 *
 * UUID v7 provides better database performance than {@link nanoId} due to time-based sorting,
 * but produces longer IDs that are less suitable for URLs.
 *
 * - Normal mode: Standard UUID v7 with current timestamp
 * - Deterministic mode: Fixed prefix "01920000-0000-7000-8800-" + 12-digit hex counter
 * - Counter state shared with {@link nextDeterministicSequenceNumber}
 * - Choose UUID v7 for time-sortable database keys, {@link nanoId} for URL-friendly short IDs
 *
 * @example Normal mode - returns random UUID v7
 * ```ts
 * const lix = await openLix();
 * uuidV7({ lix }); // "01920000-5432-7654-8abc-def012345678"
 * ```
 *
 * @example Deterministic mode - returns sequential UUIDs
 * ```ts
 * const lix = await openLix({
 *   keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true }, lixcol_version_id: "global" }]
 * });
 * uuidV7({ lix }); // "01920000-0000-7000-8000-000000000000"
 * uuidV7({ lix }); // "01920000-0000-7000-8000-000000000001"
 * uuidV7({ lix }); // "01920000-0000-7000-8000-000000000002"
 * ```
 *
 * @example Database operations
 * ```ts
 * await lix.db
 *   .insertInto("change")
 *   .values({
 *     id: uuidV7({ lix }),
 *     content: "Updated user profile"
 *   })
 *   .execute();
 * ```
 *
 * @param args.lix - The Lix instance with sqlite and db connections
 * @returns UUID v7 string
 */
export function uuidV7(args: {
	lix: Pick<Lix, "sqlite" | "db" | "hooks">;
}): string {
	// Check if deterministic mode is enabled
	if (isDeterministicMode({ lix: args.lix })) {
		// Check if uuid_v7 is disabled in the config
		const [config] = executeSync({
			lix: args.lix,
			query: (args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
				.selectFrom("internal_resolved_state_all")
				.where("entity_id", "=", "lix_deterministic_mode")
				.where("schema_key", "=", "lix_key_value")
				.where("snapshot_content", "is not", null)
				.select(
					sql`json_extract(snapshot_content, '$.value.uuid_v7')`.as("uuid_v7")
				),
		});

		// If uuid_v7 is explicitly set to false, use non-deterministic
		if (config?.uuid_v7 == false) {
			return v7();
		}

		// Otherwise use deterministic UUID
		// Get the next deterministic counter value
		const counter = nextDeterministicSequenceNumber({ lix: args.lix });
		const hex = counter.toString(16).padStart(8, "0");
		return `01920000-0000-7000-8000-0000${hex}`;
	}

	// Return regular UUID v7
	return v7();
}
