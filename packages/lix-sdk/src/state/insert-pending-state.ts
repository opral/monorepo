import { sql, type Kysely } from "kysely";
import { executeSync } from "../database/execute-sync.js";
import { timestamp, uuidV7 } from "../deterministic/index.js";
import type { Lix } from "../lix/open-lix.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import type { NewStateAllRow, StateAllRow } from "./schema.js";

type NewPendingStateRow = Omit<NewStateAllRow, "snapshot_content"> & {
	snapshot_content: string | null;
};

export type PendingStateRow = Omit<StateAllRow, "snapshot_content"> & {
	snapshot_content: string | null;
};

export function insertPendingState(args: {
	lix: { sqlite: Lix["sqlite"]; db: Kysely<LixInternalDatabaseSchema> };
	data: NewPendingStateRow;
	timestamp?: string;
}): {
	data: PendingStateRow;
} {
	const _timestamp = args.timestamp || timestamp({ lix: args.lix as any });
	if (args.data.untracked == true) {
		// Untracked entities cannot have null snapshot_content (that would be a deletion)
		if (args.data.snapshot_content === null) {
			throw new Error("Untracked entities cannot have null snapshot_content");
		}
		// Insert into untracked state table
		executeSync({
			lix: { sqlite: args.lix.sqlite },
			query: args.lix.db
				.insertInto("internal_state_all_untracked")
				.values({
					entity_id: args.data.entity_id,
					schema_key: args.data.schema_key,
					file_id: args.data.file_id,
					plugin_key: args.data.plugin_key,
					snapshot_content: args.data.snapshot_content,
					schema_version: args.data.schema_version,
					version_id: args.data.version_id,
				})
				.onConflict((oc) =>
					oc
						.columns(["entity_id", "schema_key", "file_id", "version_id"])
						.doUpdateSet({
							snapshot_content: args.data.snapshot_content!,
							updated_at: _timestamp,
						})
				),
		});
		return {
			data: {
				entity_id: args.data.entity_id,
				schema_key: args.data.schema_key,
				file_id: args.data.file_id,
				plugin_key: args.data.plugin_key,
				snapshot_content: args.data.snapshot_content,
				schema_version: args.data.schema_version,
				version_id: args.data.version_id,
				created_at: _timestamp,
				updated_at: _timestamp,
				untracked: true,
				inherited_from_version_id: null,
				change_id: "untracked",
				change_set_id: "pending",
			},
		};
	} else {
		const changeId = uuidV7({ lix: args.lix as any });

		// Insert into internal_change_in_transaction
		executeSync({
			lix: args.lix,
			query: args.lix.db.insertInto("internal_change_in_transaction").values({
				id: changeId,
				entity_id: args.data.entity_id,
				schema_key: args.data.schema_key,
				file_id: args.data.file_id,
				plugin_key: args.data.plugin_key,
				snapshot_content: args.data.snapshot_content 
					? sql`jsonb(${args.data.snapshot_content})`
					: null,
				schema_version: args.data.schema_version,
				version_id: args.data.version_id,
				created_at: _timestamp,
			}),
		});

		// Update the cache - handle deletions
		if (args.data.snapshot_content === null) {
			// For deletions, remove from cache
			executeSync({
				lix: args.lix,
				query: args.lix.db
					.deleteFrom("internal_state_cache")
					.where("entity_id", "=", args.data.entity_id)
					.where("schema_key", "=", args.data.schema_key)
					.where("file_id", "=", args.data.file_id)
					.where("version_id", "=", args.data.version_id),
			});
		} else {
			// For inserts/updates, update cache
			executeSync({
				lix: args.lix,
				query: args.lix.db
					.insertInto("internal_state_cache")
					.values({
						entity_id: args.data.entity_id,
						schema_key: args.data.schema_key,
						file_id: args.data.file_id,
						plugin_key: args.data.plugin_key,
						snapshot_content: args.data.snapshot_content,
						schema_version: args.data.schema_version,
						version_id: args.data.version_id,
						change_id: changeId,
						inheritance_delete_marker: 0,
						created_at: _timestamp,
						updated_at: _timestamp,
						inherited_from_version_id: null,
					})
					.onConflict((oc) =>
						oc
							.columns(["entity_id", "schema_key", "file_id", "version_id"])
							.doUpdateSet({
								plugin_key: args.data.plugin_key,
								snapshot_content: args.data.snapshot_content,
								schema_version: args.data.schema_version,
								updated_at: _timestamp,
								change_id: changeId,
								inheritance_delete_marker: 0,
								inherited_from_version_id: null,
							})
					),
			});
		}
		return {
			data: {
				entity_id: args.data.entity_id,
				schema_key: args.data.schema_key,
				file_id: args.data.file_id,
				plugin_key: args.data.plugin_key,
				snapshot_content: args.data.snapshot_content,
				schema_version: args.data.schema_version,
				version_id: args.data.version_id,
				created_at: _timestamp,
				updated_at: _timestamp,
				untracked: false,
				inherited_from_version_id: null,
				change_id: changeId,
				change_set_id: "pending",
			},
		};
	}
}
