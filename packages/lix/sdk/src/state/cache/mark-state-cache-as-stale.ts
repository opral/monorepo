import type { LixEngine } from "../../engine/boot.js";
import { LixKeyValueSchema } from "../../key-value/schema.js";
import { getTimestampSync } from "../../engine/deterministic/timestamp.js";
import { updateUntrackedState } from "../untracked/update-untracked-state.js";
import { setStaleStateCacheMemo } from "./is-stale-state-cache.js";

const CACHE_STALE_KEY = "lix_state_cache_stale";

export function markStateCacheAsStale(args: {
	engine: Pick<LixEngine, "sqlite" | "hooks">;
	timestamp?: string;
}): void {
	// Set the cache stale flag to "true" in untracked state
	const snapshotContent = JSON.stringify({ key: CACHE_STALE_KEY, value: true });

	const ts = args.timestamp ?? getTimestampSync({ engine: args.engine });

	updateUntrackedState({
		engine: args.engine,
		changes: [
			{
				entity_id: CACHE_STALE_KEY,
				schema_key: LixKeyValueSchema["x-lix-key"],
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: snapshotContent,
				schema_version: LixKeyValueSchema["x-lix-version"],
				created_at: ts,
				lixcol_version_id: "global",
			},
		],
	});

	setStaleStateCacheMemo({ engine: args.engine, value: true });
}

export function markStateCacheAsFresh(args: {
	engine: Pick<LixEngine, "sqlite" | "hooks">;
	timestamp?: string;
}): void {
	// Set the cache stale flag to "false" in untracked state
	const snapshotContent = JSON.stringify({
		key: CACHE_STALE_KEY,
		value: false,
	});

	const ts = args.timestamp ?? getTimestampSync({ engine: args.engine });

	updateUntrackedState({
		engine: args.engine,
		changes: [
			{
				entity_id: CACHE_STALE_KEY,
				schema_key: LixKeyValueSchema["x-lix-key"],
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: snapshotContent,
				schema_version: LixKeyValueSchema["x-lix-version"],
				created_at: ts,
				lixcol_version_id: "global",
			},
		],
	});

	setStaleStateCacheMemo({ engine: args.engine, value: false });
}
