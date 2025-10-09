import type { LixEngine } from "../../engine/boot.js";
import { getTimestampSync } from "../../engine/functions/timestamp.js";
import { LixKeyValueSchema } from "../../key-value/schema-definition.js";
import { updateUntrackedState } from "../untracked/update-untracked-state.js";
import { setStaleStateCacheMemo } from "./is-stale-state-cache.js";

const CACHE_STALE_KEY = "lix_state_cache_stale";

export function markStateCacheAsStale(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "executeSync" | "runtimeCacheRef"
	>;
	timestamp?: string;
}): void {
	const createdAt = args.timestamp ?? getTimestampSync({ engine: args.engine });

	updateUntrackedState({
		engine: args.engine,
		changes: [
			{
				entity_id: CACHE_STALE_KEY,
				schema_key: LixKeyValueSchema["x-lix-key"],
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					key: CACHE_STALE_KEY,
					value: true,
				}),
				schema_version: LixKeyValueSchema["x-lix-version"],
				created_at: createdAt,
				lixcol_version_id: "global",
			},
		],
	});

	setStaleStateCacheMemo({ engine: args.engine, value: true });
}

export function markStateCacheAsFresh(args: {
	engine: Pick<LixEngine, "hooks" | "executeSync" | "runtimeCacheRef">;
	timestamp?: string;
}): void {
	const createdAt = args.timestamp ?? getTimestampSync({ engine: args.engine });

	updateUntrackedState({
		engine: args.engine,
		changes: [
			{
				entity_id: CACHE_STALE_KEY,
				schema_key: LixKeyValueSchema["x-lix-key"],
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					key: CACHE_STALE_KEY,
					value: false,
				}),
				schema_version: LixKeyValueSchema["x-lix-version"],
				created_at: createdAt,
				lixcol_version_id: "global",
			},
		],
	});

	setStaleStateCacheMemo({ engine: args.engine, value: false });
}
