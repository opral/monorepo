import type { Lix } from "../../lix/open-lix.js";

const CACHE_STALE_KEY = "lix_state_cache_stale";

export function markStateCacheAsStale(args: {
	lix: Pick<Lix, "sqlite">;
}): void {
	// Set the cache stale flag to "true" in untracked state
	args.lix.sqlite.exec({
		sql: `INSERT INTO internal_state_all_untracked (
				entity_id, 
				schema_key, 
				file_id, 
				version_id,
				plugin_key, 
				snapshot_content, 
				schema_version
			  )
		      VALUES (?, 'lix_key_value', 'internal', 'global', 'lix_key_value_plugin', json(?), '1.0')
		      ON CONFLICT(entity_id, schema_key, file_id, version_id) DO UPDATE SET
		      snapshot_content = json(?),
		      updated_at = lix_timestamp()`,
		bind: [
			CACHE_STALE_KEY,
			JSON.stringify({ key: CACHE_STALE_KEY, value: "true" }),
			JSON.stringify({ key: CACHE_STALE_KEY, value: "true" }),
		],
		returnValue: "resultRows",
	});
	console.log("State cache marked as stale");
}

export function markStateCacheAsFresh(args: {
	lix: Pick<Lix, "sqlite">;
}): void {
	// Set the cache stale flag to "false" in untracked state
	args.lix.sqlite.exec({
		sql: `INSERT INTO internal_state_all_untracked (
        entity_id, 
        schema_key, 
        file_id, 
        version_id,
        plugin_key, 
        snapshot_content, 
        schema_version
        )
          VALUES (?, 'lix_key_value', 'internal', 'global', 'lix_key_value_plugin', json(?), '1.0')
          ON CONFLICT(entity_id, schema_key, file_id, version_id) DO UPDATE SET
          snapshot_content = json(?),
          updated_at = lix_timestamp()`,
		bind: [
			CACHE_STALE_KEY,
			JSON.stringify({ key: CACHE_STALE_KEY, value: "false" }),
			JSON.stringify({ key: CACHE_STALE_KEY, value: "false" }),
		],
		returnValue: "resultRows",
	});
	console.log("State cache marked as fresh");
}