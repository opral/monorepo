import { sql, type Kysely } from "kysely";
import { executeSync } from "../database/execute-sync.js";
import { timestamp, uuidV7 } from "../deterministic/index.js";
import type { Lix } from "../lix/open-lix.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import type { NewStateAllRow, StateAllRow } from "./schema.js";

type NewPendingStateRow = Omit<NewStateAllRow, "snapshot_content"> & {
	snapshot_content: string;
};

export type PendingStateRow = Omit<StateAllRow, "snapshot_content"> & {
	snapshot_content: string;
};

export function insertPendingState(args: {
	lix: { sqlite: Lix["sqlite"]; db: Kysely<LixInternalDatabaseSchema> };
	data: NewPendingStateRow;
}): {
	data: PendingStateRow;
} {
	const _timestamp = timestamp({ lix: args.lix as any });
	if (args.data.untracked == true) {
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
							snapshot_content: args.data.snapshot_content,
							updated_at: new Date().toISOString(),
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
				snapshot_content: sql`jsonb(${args.data.snapshot_content})`,
				schema_version: args.data.schema_version,
				version_id: args.data.version_id,
			}),
		});

		// Update the cache
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
							snapshot_content: args.data.snapshot_content,
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
				change_id: changeId,
				change_set_id: "pending",
			},
		};
	}
}
