import { type Kysely } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type {
	LixDatabaseSchema,
	LixInternalDatabaseSchema,
} from "../database/schema.js";
import { executeSync } from "../database/execute-sync.js";
import type { LixChange } from "../change/schema.js";
import type { NewStateRow } from "./schema.js";
import { LixChangeAuthorSchema } from "../change-author/schema.js";
import { timestamp } from "../deterministic/index.js";
import { insertPendingState } from "./insert-pending-state.js";

export function handleStateMutation(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>,
	entity_id: string,
	schema_key: string,
	file_id: string,
	plugin_key: string,
	snapshot_content: string | null, // stringified json
	version_id: string,
	schema_version: string
): 0 | 1 {
	// Use consistent timestamp for both changes and cache
	const currentTime = timestamp({
		lix: { sqlite, db: db as unknown as Kysely<LixDatabaseSchema> },
	});

	// Handle copy-on-write deletion for inherited entities
	if (snapshot_content === null || snapshot_content === "null") {
		// Check if entity exists in current version (directly or inherited)
		const entityInCurrentVersion = executeSync({
			lix: { sqlite },
			query: db
				.selectFrom("internal_state_cache")
				.where("entity_id", "=", entity_id)
				.where("schema_key", "=", schema_key)
				.where("file_id", "=", file_id)
				.where("version_id", "=", version_id)
				.select(["inherited_from_version_id"]),
		});

		// If entity doesn't exist in cache, check if it would be inherited
		if (entityInCurrentVersion.length === 0) {
			// Check if this entity exists in a parent version that would be inherited
			// First get the version inheritance info
			const versionInfo = executeSync({
				lix: { sqlite },
				query: db
					.selectFrom("internal_state_cache")
					.where("schema_key", "=", "lix_version")
					.where("entity_id", "=", version_id)
					.select(["snapshot_content"]),
			});

			if (versionInfo.length > 0) {
				const versionData = JSON.parse(versionInfo[0]!.snapshot_content!);
				const parentVersionId = versionData.inherits_from_version_id;

				if (parentVersionId) {
					// Check if entity exists in parent version
					const parentEntity = executeSync({
						lix: { sqlite },
						query: db
							.selectFrom("internal_state_cache")
							.where("entity_id", "=", entity_id)
							.where("schema_key", "=", schema_key)
							.where("file_id", "=", file_id)
							.where("version_id", "=", parentVersionId)
							.select(["snapshot_content"]),
					});

					if (parentEntity.length > 0) {
						// For copy-on-write deletion, create a deletion marker
						// This creates a real change/snapshot record for the deletion
						snapshot_content = null; // Ensure it's treated as deletion

						// Create deletion marker in cache to prevent inheritance during this transaction
						executeSync({
							lix: { sqlite },
							query: db
								.insertInto("internal_state_cache")
								.values({
									entity_id: entity_id,
									schema_key: schema_key,
									file_id: file_id,
									version_id: version_id,
									plugin_key: plugin_key,
									snapshot_content: null, // NULL indicates deletion
									schema_version: schema_version,
									created_at: currentTime,
									updated_at: currentTime,
									inherited_from_version_id: null, // Local entity, not inherited
									inheritance_delete_marker: 1, // Flag as copy-on-write deletion marker
									// delete markers are never materialized, so we use a placeholder
									change_id: "delete-marker-no-change-id",
								})
								.onConflict((oc) =>
									oc
										.columns([
											"entity_id",
											"schema_key",
											"file_id",
											"version_id",
										])
										.doUpdateSet({
											plugin_key: plugin_key,
											snapshot_content: null,
											schema_version: schema_version,
											updated_at: currentTime,
											inherited_from_version_id: null,
											inheritance_delete_marker: 1,
											// delete markers are never materialized, so we use a placeholder
											change_id: "delete-marker-no-change-id",
										})
								),
						});
						// Continue with normal flow but now as a deletion with marker
					}
				}
			}
		} else if (entityInCurrentVersion[0]?.inherited_from_version_id !== null) {
			// Entity exists and is inherited - create copy-on-write deletion marker
			executeSync({
				lix: { sqlite },
				query: db
					.insertInto("internal_state_cache")
					.values({
						entity_id: entity_id,
						schema_key: schema_key,
						file_id: file_id,
						version_id: version_id,
						plugin_key: plugin_key,
						snapshot_content: null, // NULL indicates deletion
						schema_version: schema_version,
						created_at: currentTime,
						updated_at: currentTime,
						inherited_from_version_id: null, // Local entity, not inherited
						inheritance_delete_marker: 1, // Flag as copy-on-write deletion marker
						// delete markers are never materialized, so we use a placeholder
						change_id: "delete-marker-no-change-id",
					})
					.onConflict((oc) =>
						oc
							.columns(["entity_id", "schema_key", "file_id", "version_id"])
							.doUpdateSet({
								plugin_key: plugin_key,
								snapshot_content: null,
								schema_version: schema_version,
								updated_at: currentTime,
								inherited_from_version_id: null,
								inheritance_delete_marker: 1,
								// delete markers are never materialized, so we use a placeholder
								change_id: "delete-marker-no-change-id",
							})
					),
			});
		}
		// If entity exists locally (not inherited), continue with normal deletion
	}

	insertPendingState({
		lix: { sqlite, db },
		data: {
			entity_id,
			schema_key,
			file_id,
			plugin_key,
			snapshot_content: snapshot_content, // Now supports null for deletions
			schema_version,
			version_id,
			untracked: false, // tracked entity
		},
		timestamp: currentTime,
	});

	// createChangesetForTransaction(sqlite, db, currentTime, version_id, [
	// 	{
	// 		...rootChange,
	// 		snapshot_content,
	// 	},
	// ]);

	return 0; // Return 0 to indicate success
}

export function createChangeWithSnapshot(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<LixInternalDatabaseSchema>;
	id?: string;
	data: Omit<
		NewStateRow,
		"version_id" | "created_at" | "updated_at" | "snapshot_content"
	> & { snapshot_content: string | null };
	timestamp: string;
	version_id?: string;
}): Pick<LixChange, "id" | "schema_key" | "file_id" | "entity_id"> {
	// Use insertPendingState instead of direct insertion
	const result = insertPendingState({
		lix: { sqlite: args.sqlite, db: args.db },
		data: {
			entity_id: args.data.entity_id,
			schema_key: args.data.schema_key,
			file_id: args.data.file_id,
			plugin_key: args.data.plugin_key,
			snapshot_content: args.data.snapshot_content,
			schema_version: args.data.schema_version,
			version_id: args.version_id || "global",
			untracked: false, // tracked entity
		},
	});

	// Note: change_author records are created during commit, not during state mutation
	
	return {
		id: result.data.change_id!,
		schema_key: result.data.schema_key,
		file_id: result.data.file_id,
		entity_id: result.data.entity_id,
	};
}


function createChangeAuthorRecords(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<LixInternalDatabaseSchema>;
	timestamp: string;
	change_id: string;
	version_id: string;
}): void {
	// Get all active accounts using sqlite.exec since we're in the virtual table context
	const activeAccounts = args.sqlite.exec({
		sql: "SELECT id, name FROM active_account",
		returnValue: "resultRows",
	});

	// Create change_author records for each active account
	if (activeAccounts && activeAccounts.length > 0) {
		for (const account of activeAccounts) {
			const accountId = account[0] as string;
			const accountName = account[1] as string;

			// First ensure the account exists in global version
			const [existingAccount] = executeSync({
				lix: { sqlite: args.sqlite },
				query: args.db
					.selectFrom("account_all")
					.where("id", "=", accountId)
					.selectAll(),
			});

			if (!existingAccount) {
				executeSync({
					lix: { sqlite: args.sqlite },
					query: args.db.insertInto("account_all").values({
						id: accountId,
						name: accountName,
						lixcol_version_id: args.version_id,
					}),
				});
			}

			// Create change_author snapshot content
			const changeAuthorSnapshot = {
				change_id: args.change_id,
				account_id: accountId,
			};

			insertPendingState({
				lix: { sqlite: args.sqlite, db: args.db },
				data: {
					entity_id: `${args.change_id}::${accountId}`,
					schema_key: LixChangeAuthorSchema["x-lix-key"],
					schema_version: LixChangeAuthorSchema["x-lix-version"],
					file_id: "lix",
					plugin_key: "lix",
					snapshot_content: JSON.stringify(changeAuthorSnapshot),
					version_id: args.version_id,
					untracked: false, // tracked entity
				},
			});
		}
	}
}
