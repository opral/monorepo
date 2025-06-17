import { sql, type Kysely } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { executeSync } from "../database/execute-sync.js";
import type { Change } from "../change/schema.js";

import type { NewStateRow } from "./schema.js";
import {
	INITIAL_CHANGE_SET_ID,
	INITIAL_GLOBAL_VERSION_CHANGE_SET_ID,
	INITIAL_GLOBAL_VERSION_WORKING_CHANGE_SET_ID,
	INITIAL_VERSION_ID,
	INITIAL_WORKING_CHANGE_SET_ID,
	type LixVersion,
} from "../version/schema.js";
import { createChangesetForTransaction } from "./create-changeset-for-transaction.js";
import { version } from "uuid";

function getVersionRecordById(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>,
	version_id: string
) {
	let [versionRecord] = executeSync({
		lix: { sqlite },
		query: db
			.selectFrom("internal_state_cache")
			.where("schema_key", "=", "lix_version")
			.where("entity_id", "=", version_id)
			.select("snapshot_content as content"),
	}) as [{ content: string } | undefined];

	// If not found in cache, try the change/snapshot tables (normal operation)
	if (!versionRecord) {
		[versionRecord] = executeSync({
			lix: { sqlite },
			// TODO @samuelstroschein wouldn't we need the view that quieries the union of the temp table and this one?
			query: db
				.selectFrom("internal_change")
				.innerJoin(
					"internal_snapshot",
					"internal_change.snapshot_id",
					"internal_snapshot.id"
				)
				.where("internal_change.schema_key", "=", "lix_version")
				.where("internal_change.entity_id", "=", version_id)
				.where("internal_change.snapshot_id", "!=", "no-content")
				// TODO @samuelstroschein how does this ording work with a second branch in version?
				// @ts-expect-error - rowid is a valid SQLite column but not in Kysely types
				.orderBy("internal_change.rowid", "desc")
				.limit(1)
				.select(sql`json(internal_snapshot.content)`.as("content")),
		}) as [{ content: string } | undefined];
	}

	// Bootstrap fallback: If this is the initial version during bootstrap, create a minimal version record
	if (!versionRecord && version_id === INITIAL_VERSION_ID) {
		versionRecord = {
			content: JSON.stringify({
				id: INITIAL_VERSION_ID,
				name: "main",
				change_set_id: INITIAL_CHANGE_SET_ID,
				working_change_set_id: INITIAL_WORKING_CHANGE_SET_ID,
			} satisfies LixVersion),
		};
	}

	// Bootstrap fallback: If this is the global version during bootstrap, create a minimal version record
	if (!versionRecord && version_id === "global") {
		versionRecord = {
			content: JSON.stringify({
				id: "global",
				name: "global",
				change_set_id: INITIAL_GLOBAL_VERSION_CHANGE_SET_ID,
				working_change_set_id: INITIAL_GLOBAL_VERSION_WORKING_CHANGE_SET_ID,
			} satisfies LixVersion),
		};
	}

	return versionRecord;
}

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

	// Get the latest 'lix_version' entity's snapshot content using the activeVersionId
	// During bootstrap, try cache first since direct state inserts populate it
	const versionRecord = getVersionRecordById(sqlite, db, version_id);

	if (!versionRecord) {
		throw new Error(`Version with id '${version_id}' not found.`);
	}

	const mutatedVersion = JSON.parse(versionRecord.content) as LixVersion;

	// TODO @samuelstroschein  until here we only collected information

	const rootChange = createChangeWithSnapshot({
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

	createChangesetForTransaction(sqlite, db, currentTime, mutatedVersion, [
		{
			...rootChange,
			snapshot_content,
		},
	]);

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

	// Update cache for every change (including deletions)
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
		});
	}

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
}): void {
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
					})
			),
	});
}

