import { v7 } from "uuid";
import { nextSequenceNumberSync } from "./sequence.js";
import { isDeterministicModeSync } from "./is-deterministic-mode.js";
import type { Lix } from "../../lix/open-lix.js";
import type { LixRuntime } from "../boot.js";
import { executeSync } from "../../database/execute-sync.js";
import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";

/**
 * Sync variant of {@link uuidV7}. See {@link uuidV7} for behavior and examples.
 *
 * @remarks
 * - Accepts `{ runtime }` (or `{ lix }`) and runs next to SQLite.
 * - Intended for runtime/router and UDFs; app code should use {@link uuidV7}.
 *
 * @see uuidV7
 */
export function uuidV7Sync(
	args: { lix: Pick<Lix, "sqlite" | "db" | "hooks"> } | { runtime: LixRuntime }
): string {
	const lix =
		"runtime" in args
			? {
					sqlite: args.runtime.sqlite,
					db: args.runtime.db,
					hooks: args.runtime.hooks,
				}
			: args.lix;
	// Check if deterministic mode is enabled
	if (isDeterministicModeSync({ lix })) {
		// Check if uuid_v7 is disabled in the config
		const [config] = executeSync({
			lix: { sqlite: lix.sqlite },
			query: (lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
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
		const counter = nextSequenceNumberSync({ lix });
		const hex = counter.toString(16).padStart(8, "0");
		return `01920000-0000-7000-8000-0000${hex}`;
	}

	// Return regular UUID v7
	return v7();
}
