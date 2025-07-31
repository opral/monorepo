import type { Lix } from "../../lix/open-lix.js";
import { LixKeyValueSchema } from "../../key-value/schema.js";
import { timestamp } from "../../deterministic/timestamp.js";
import { updateUntrackedState } from "../untracked/update-untracked-state.js";

const CACHE_STALE_KEY = "lix_state_cache_stale";

export function markStateCacheAsStale(args: {
	lix: Pick<Lix, "sqlite" | "db">;
	timestamp?: string;
}): void {
	// Set the cache stale flag to "true" in untracked state
	const snapshotContent = JSON.stringify({ key: CACHE_STALE_KEY, value: true });

	updateUntrackedState({
		lix: args.lix,
		change: {
			entity_id: CACHE_STALE_KEY,
			schema_key: LixKeyValueSchema["x-lix-key"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: snapshotContent,
			schema_version: LixKeyValueSchema["x-lix-version"],
			created_at: args.timestamp ?? timestamp({ lix: args.lix }),
		},
		version_id: "global",
	});
}

export function markStateCacheAsFresh(args: {
	lix: Pick<Lix, "sqlite" | "db">;
	timestamp?: string;
}): void {
	// Set the cache stale flag to "false" in untracked state
	const snapshotContent = JSON.stringify({
		key: CACHE_STALE_KEY,
		value: false,
	});

	updateUntrackedState({
		lix: args.lix,
		change: {
			entity_id: CACHE_STALE_KEY,
			schema_key: LixKeyValueSchema["x-lix-key"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: snapshotContent,
			schema_version: LixKeyValueSchema["x-lix-version"],
			created_at: args.timestamp ?? timestamp({ lix: args.lix }),
		},
		version_id: "global",
	});
}
