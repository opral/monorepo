import type { Lix } from "../../lix/open-lix.js";
import { executeSync } from "../../database/execute-sync.js";
import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import { LixKeyValueSchema } from "../../key-value/schema.js";
import { timestamp } from "../../deterministic/timestamp.js";

const CACHE_STALE_KEY = "lix_state_cache_stale";

export function markStateCacheAsStale(args: {
	lix: Pick<Lix, "sqlite" | "db">;
	timestamp?: string;
}): void {
	// Set the cache stale flag to "true" in untracked state
	const snapshotContent = JSON.stringify({ key: CACHE_STALE_KEY, value: true });

	executeSync({
		lix: args.lix,
		query: (args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
			.insertInto("internal_state_all_untracked")
			.values({
				entity_id: CACHE_STALE_KEY,
				schema_key: LixKeyValueSchema["x-lix-key"],
				file_id: "lix",
				version_id: "global",
				plugin_key: "lix_own_entity",
				snapshot_content: sql`jsonb(${snapshotContent})`,
				schema_version: LixKeyValueSchema["x-lix-version"],
				created_at: args.timestamp ?? timestamp({ lix: args.lix }),
				updated_at: args.timestamp ?? timestamp({ lix: args.lix }),
				inherited_from_version_id: null,
				inheritance_delete_marker: 0,
			})
			.onConflict((oc) =>
				oc
					.columns(["entity_id", "schema_key", "file_id", "version_id"])
					.doUpdateSet({
						snapshot_content: sql`jsonb(${snapshotContent})`,
						updated_at: args.timestamp ?? timestamp({ lix: args.lix }),
					})
			),
	});
	// console.log("State cache marked as stale");
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

	executeSync({
		lix: args.lix,
		query: (args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
			.insertInto("internal_state_all_untracked")
			.values({
				entity_id: CACHE_STALE_KEY,
				schema_key: LixKeyValueSchema["x-lix-key"],
				file_id: "lix",
				version_id: "global",
				plugin_key: "lix_own_entity",
				snapshot_content: sql`jsonb(${snapshotContent})`,
				schema_version: LixKeyValueSchema["x-lix-version"],
				created_at: args.timestamp
					? sql`${args.timestamp}`
					: sql`lix_timestamp()`,
				updated_at: args.timestamp
					? sql`${args.timestamp}`
					: sql`lix_timestamp()`,
				inherited_from_version_id: null,
				inheritance_delete_marker: 0,
			})
			.onConflict((oc) =>
				oc
					.columns(["entity_id", "schema_key", "file_id", "version_id"])
					.doUpdateSet({
						snapshot_content: sql`jsonb(${snapshotContent})`,
						updated_at: args.timestamp
							? sql`${args.timestamp}`
							: sql`lix_timestamp()`,
					})
			),
	});
	// console.log("State cache marked as fresh");
}
