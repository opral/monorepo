import { sql, type Kysely } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { executeSync } from "../database/execute-sync.js";
import type { Change } from "../change/schema.js";

import type { NewStateRow } from "./schema.js";

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
	const currentTime = new Date().toISOString();

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

	// // workaround to bootstrap the initial state
	// // TODO implement skip_change_control flag which
	// // the initial state can use.
	// if (
	// 	entity_id.includes(INITIAL_VERSION_ID) ||
	// 	entity_id.includes(INITIAL_CHANGE_SET_ID) ||
	// 	entity_id.includes(INITIAL_WORKING_CHANGE_SET_ID)
	// ) {
	// 	return 0;
	// }

	createChangeWithSnapshot({
		sqlite,
		db,
		data: {
			entity_id,
			schema_key,
			file_id,
			plugin_key,
			snapshot_content,
			schema_version,
		},
		timestamp: currentTime,
		version_id,
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
	timestamp?: string;
	version_id?: string;
}): Pick<Change, "id" | "schema_key" | "file_id" | "entity_id"> {
	// const [snapshot] = args.data.snapshot_content
	// 	? executeSync({
	// 			lix: { sqlite: args.sqlite },
	// 			query: args.db
	// 				.insertInto("internal_snapshot")
	// 				.values({
	// 					content: sql`jsonb(${args.data.snapshot_content})`,
	// 				})
	// 				.returning("id"),
	// 		})
	// 	: [{ id: "no-content" }];

	// const [change] = executeSync({
	// 	lix: { sqlite: args.sqlite },
	// 	query: args.db
	// 		.insertInto("internal_change")
	// 		.values({
	// 			id: args.id,
	// 			entity_id: args.data.entity_id,
	// 			schema_key: args.data.schema_key,
	// 			snapshot_id: snapshot.id,
	// 			file_id: args.data.file_id,
	// 			plugin_key: args.data.plugin_key,
	// 			created_at: args.timestamp || new Date().toISOString(),
	// 			schema_version: args.data.schema_version,
	// 		})
	// 		.returning(["id", "schema_key", "file_id", "entity_id"]),
	// });

	// we don't need the created snapshot
	const [change] = executeSync({
		lix: { sqlite: args.sqlite },
		query: args.db
			.insertInto("internal_change_in_transaction")
			.values({
				id: args.id,
				entity_id: args.data.entity_id,
				schema_key: args.data.schema_key,
				snapshot_content: args.data.snapshot_content
					? sql`jsonb(${args.data.snapshot_content})`
					: null,
				file_id: args.data.file_id,
				plugin_key: args.data.plugin_key,
				version_id: args.version_id!,
				created_at: args.timestamp || new Date().toISOString(),
				schema_version: args.data.schema_version,
			})
			.onConflict((oc) =>
				// we assume that a conflic is always on the unique constraint of entity_id, file_id, schema_key, version_id
				oc.doUpdateSet({
					id: args.id,
					entity_id: args.data.entity_id,
					schema_key: args.data.schema_key,
					snapshot_content: args.data.snapshot_content
						? sql`jsonb(${args.data.snapshot_content})`
						: null,
					file_id: args.data.file_id,
					plugin_key: args.data.plugin_key,
					version_id: args.version_id!,
					created_at: args.timestamp || new Date().toISOString(),
					schema_version: args.data.schema_version,
				})
			)
			.returning(["id", "schema_key", "file_id", "entity_id"]),
	});

	// Update cache for every change (including deletions)
	// Use the actual change.id from the insert
	if (args.version_id) {
		updateStateCache({
			sqlite: args.sqlite,
			db: args.db,
			entity_id: args.data.entity_id,
			schema_key: args.data.schema_key,
			file_id: args.data.file_id,
			version_id: args.version_id,
			plugin_key: args.data.plugin_key,
			snapshot_content: args.data.snapshot_content as string | null,
			schema_version: args.data.schema_version,
			timestamp: args.timestamp || new Date().toISOString(),
			change_id: change.id,
		});
	}

	return change;
}

function updateStateCache(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<LixInternalDatabaseSchema>;
	entity_id: string;
	schema_key: string;
	file_id: string;
	version_id: string;
	plugin_key: string;
	snapshot_content: string | null; // Allow null for DELETE operations
	schema_version: string;
	timestamp: string;
	change_id?: string;
}): void {
	// If no change_id provided, try to get it from the transaction table
	const resolvedChangeId =
		args.change_id ||
		(() => {
			const transactionRecord = executeSync({
				lix: { sqlite: args.sqlite },
				query: args.db
					.selectFrom("internal_change_in_transaction")
					.where("entity_id", "=", args.entity_id)
					.where("schema_key", "=", args.schema_key)
					.where("file_id", "=", args.file_id)
					.where("version_id", "=", args.version_id)
					.select(["id"])
					.limit(1),
			});
			return transactionRecord.length > 0
				? transactionRecord[0]!.id
				: "no-transaction-change-id";
		})();

	// Handle DELETE operations (snapshot_content is null)
	if (args.snapshot_content === null) {
		// Check if this is an inherited entity being deleted
		const existingEntity = executeSync({
			lix: { sqlite: args.sqlite },
			query: args.db
				.selectFrom("internal_state_cache")
				.where("entity_id", "=", args.entity_id)
				.where("schema_key", "=", args.schema_key)
				.where("file_id", "=", args.file_id)
				.where("version_id", "=", args.version_id)
				.select(["inherited_from_version_id", "inheritance_delete_marker"]),
		});

		// Check if existing entity is already a deletion marker
		const isAlreadyDeletionMarker =
			existingEntity.length > 0 &&
			existingEntity[0]?.inheritance_delete_marker === 1;

		// If it's an inherited entity or already a deletion marker, keep the deletion marker
		if (
			existingEntity.length > 0 &&
			(existingEntity[0]?.inherited_from_version_id !== null ||
				isAlreadyDeletionMarker)
		) {
			// Create/keep a local deletion marker with NULL content
			executeSync({
				lix: { sqlite: args.sqlite },
				query: args.db
					.insertInto("internal_state_cache")
					.values({
						entity_id: args.entity_id,
						schema_key: args.schema_key,
						file_id: args.file_id,
						version_id: args.version_id,
						plugin_key: args.plugin_key,
						snapshot_content: null, // NULL indicates deletion
						schema_version: args.schema_version,
						created_at: args.timestamp,
						updated_at: args.timestamp,
						inherited_from_version_id: null, // Local entity, not inherited
						inheritance_delete_marker: 1, // Flag as deletion marker
						change_id: resolvedChangeId,
					})
					.onConflict((oc) =>
						oc
							.columns(["entity_id", "schema_key", "file_id", "version_id"])
							.doUpdateSet({
								plugin_key: args.plugin_key,
								snapshot_content: null,
								schema_version: args.schema_version,
								updated_at: args.timestamp,
								inherited_from_version_id: null,
								inheritance_delete_marker: 1,
								change_id: resolvedChangeId,
							})
					),
			});
		} else {
			// Regular deletion - remove from cache entirely
			executeSync({
				lix: { sqlite: args.sqlite },
				query: args.db
					.deleteFrom("internal_state_cache")
					.where("entity_id", "=", args.entity_id)
					.where("schema_key", "=", args.schema_key)
					.where("file_id", "=", args.file_id)
					.where("version_id", "=", args.version_id),
			});
		}
		return;
	}

	// Handle INSERT/UPDATE operations
	executeSync({
		lix: { sqlite: args.sqlite },
		query: args.db
			.insertInto("internal_state_cache")
			.values({
				entity_id: args.entity_id,
				schema_key: args.schema_key,
				file_id: args.file_id,
				version_id: args.version_id,
				plugin_key: args.plugin_key,
				snapshot_content: args.snapshot_content,
				schema_version: args.schema_version,
				created_at: args.timestamp,
				updated_at: args.timestamp,
				inherited_from_version_id: null, // Direct entities are not inherited
				inheritance_delete_marker: 0, // Not a deletion marker
				change_id: args.change_id || "no-change-id",
			})
			.onConflict((oc) =>
				oc
					.columns(["entity_id", "schema_key", "file_id", "version_id"])
					.doUpdateSet({
						plugin_key: args.plugin_key,
						snapshot_content: args.snapshot_content as string,
						schema_version: args.schema_version,
						updated_at: args.timestamp,
						inherited_from_version_id: null, // Direct entities are not inherited
						inheritance_delete_marker: 0, // Not a deletion marker
						change_id: resolvedChangeId,
					})
			),
	});
}
