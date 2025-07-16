import type { Lix } from "../../lix/open-lix.js";

const CACHE_STALE_KEY = "lix_state_cache_stale";

export function isStaleStateCache(args: {
	lix: Pick<Lix, "sqlite">;
}): boolean {
	// Query the internal_state_all_untracked table directly to avoid recursion
	const result = args.lix.sqlite.exec({
		sql: `SELECT snapshot_content FROM internal_state_all_untracked 
		      WHERE entity_id = ? 
		      AND schema_key = 'lix_key_value'`,
		bind: [CACHE_STALE_KEY],
		returnValue: "resultRows",
	});
	
	// If no flag exists, cache is stale by default
	if (!result || result.length === 0) {
		return true;
	}
	
	// Parse the snapshot content to get the value
	const snapshotContent = JSON.parse(result[0]![0] as string);
	return snapshotContent.value === "true";
}
