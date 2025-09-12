import type { LixRuntime } from "../../runtime/boot.js";
import { LixKeyValueSchema } from "../../key-value/schema.js";
import { getTimestampSync } from "../../runtime/deterministic/timestamp.js";
import { updateUntrackedState } from "../untracked/update-untracked-state.js";

const CACHE_STALE_KEY = "lix_state_cache_stale";

export function markStateCacheAsStale(args: {
	runtime: Pick<LixRuntime, "sqlite" | "db">;
	timestamp?: string;
}): void {
	// Set the cache stale flag to "true" in untracked state
	const snapshotContent = JSON.stringify({ key: CACHE_STALE_KEY, value: true });

	const ts =
		args.timestamp ?? getTimestampSync({ runtime: args.runtime as any });

	updateUntrackedState({
		lix: args.runtime,
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
}

export function markStateCacheAsFresh(args: {
	runtime: Pick<LixRuntime, "sqlite" | "db" | "hooks">;
	timestamp?: string;
}): void {
	// Set the cache stale flag to "false" in untracked state
	const snapshotContent = JSON.stringify({
		key: CACHE_STALE_KEY,
		value: false,
	});

	const ts =
		args.timestamp ?? getTimestampSync({ runtime: args.runtime as any });

	updateUntrackedState({
		lix: { sqlite: args.runtime.sqlite, db: args.runtime.db as any },
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
}
