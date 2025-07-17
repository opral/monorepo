import type { Lix } from "../lix/open-lix.js";
import { executeSync } from "../database/execute-sync.js";
import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";

/**
 * Checks if deterministic mode is enabled by querying the key_value table.
 *
 * Returns true if the value is loosely equal to true (e.g., true, 1, "1").
 * Returns false for any other value or if the key doesn't exist.
 *
 * @param args - Object containing the lix instance with sqlite connection
 * @returns true if deterministic mode is enabled, false otherwise
 */
export function isDeterministicMode(args: {
	lix: Pick<Lix, "sqlite" | "db">;
}): boolean {
	// TODO account for active version
	// Need to query from underlying state to avoid recursion
	const [row] = executeSync({
		lix: args.lix,
		query: (args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
			.selectFrom("internal_underlying_state_all")
			.where("entity_id", "=", "lix_deterministic_mode")
			.where("schema_key", "=", "lix_key_value")
			.select(sql`json_extract(snapshot_content, '$.value')`.as("value")),
	});

	return row?.value == true;
}
