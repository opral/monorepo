import { sql, type Kysely } from "kysely";
import { executeSync } from "../../database/execute-sync.js";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import type { LixRuntime } from "../../runtime/boot.js";

const CACHE_STALE_KEY = "lix_state_cache_stale";

export function isStaleStateCache(args: {
	runtime: Pick<LixRuntime, "sqlite" | "db">;
}): boolean {
	// Query the resolved view directly to avoid recursion on the vtable itself
	const res = executeSync({
		runtime: args.runtime,
		query: (args.runtime.db as unknown as Kysely<LixInternalDatabaseSchema>)
			.selectFrom("internal_resolved_state_all")
			.where("entity_id", "=", CACHE_STALE_KEY)
			.where("schema_key", "=", "lix_key_value")
			.where("version_id", "=", "global")
			.where("snapshot_content", "is not", null)
			.select(sql`json_extract(snapshot_content, '$.value')`.as("value")),
	});

	// If no flag exists, cache is stale by default
	if (!res || res.length === 0) {
		return true;
	}

	// Parse the snapshot content to get the value
	return res[0]?.value == true;
}
