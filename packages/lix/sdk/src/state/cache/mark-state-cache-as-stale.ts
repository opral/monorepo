import type { Lix } from "../../lix/open-lix.js";
import { LixKeyValueSchema } from "../../key-value/schema.js";
import { getTimestampSync } from "../../runtime/deterministic/timestamp.js";
import { updateUntrackedState } from "../untracked/update-untracked-state.js";

const CACHE_STALE_KEY = "lix_state_cache_stale";

export function markStateCacheAsStale(args: {
	lix: Pick<Lix, "sqlite" | "db" | "hooks">;
	timestamp?: string;
}): void {
	// Set the cache stale flag to "true" in untracked state
	const snapshotContent = JSON.stringify({ key: CACHE_STALE_KEY, value: true });

	const ts =
		args.timestamp ??
		getTimestampSync({
			runtime: {
				sqlite: args.lix.sqlite,
				db: args.lix.db as any,
				hooks: args.lix.hooks as any,
			},
		});

	updateUntrackedState({
		lix: args.lix,
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
	lix: Pick<Lix, "sqlite" | "db" | "hooks">;
	timestamp?: string;
}): void {
	// Set the cache stale flag to "false" in untracked state
	const snapshotContent = JSON.stringify({
		key: CACHE_STALE_KEY,
		value: false,
	});

	const ts =
		args.timestamp ??
		getTimestampSync({
			runtime: {
				sqlite: args.lix.sqlite,
				db: args.lix.db as any,
				hooks: args.lix.hooks as any,
			},
		});

	updateUntrackedState({
		lix: args.lix,
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
