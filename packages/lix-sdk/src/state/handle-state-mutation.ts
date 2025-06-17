import { sql, type Kysely } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { executeSync } from "../database/execute-sync.js";
import type { Change } from "../change/schema.js";
import { nanoid } from "../database/nano-id.js";
import type { NewStateRow } from "./schema.js";
import {
	INITIAL_CHANGE_SET_ID,
	INITIAL_GLOBAL_VERSION_CHANGE_SET_ID,
	INITIAL_GLOBAL_VERSION_WORKING_CHANGE_SET_ID,
	INITIAL_VERSION_ID,
	INITIAL_WORKING_CHANGE_SET_ID,
	type LixVersion,
	LixVersionSchema,
} from "../version/schema.js";
import {
	type LixChangeSet,
	type LixChangeSetEdge,
	type LixChangeSetElement,
	LixChangeSetSchema,
	LixChangeSetEdgeSchema,
	LixChangeSetElementSchema,
} from "../change-set/schema.js";
import { changeSetIsAncestorOf } from "../query-filter/change-set-is-ancestor-of.js";
import { changeSetHasLabel } from "../query-filter/change-set-has-label.js";
import { changeSetElementInAncestryOf } from "../query-filter/change-set-element-in-ancestry-of.js";
import { changeSetElementIsLeafOf } from "../query-filter/change-set-element-is-leaf-of.js";



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

	if (!versionRecord) {
		throw new Error(`Version with id '${version_id}' not found.`);
	}

	const mutatedVersion = JSON.parse(versionRecord.content) as LixVersion;

	// TODO @samuelstroschein  until here we only collected information
	const nextChangeSetId = nanoid();

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

	createChangesetForTransaction(
		sqlite,
		db,
		nextChangeSetId,
		currentTime,
		mutatedVersion,
		rootChange,
		snapshot_content
	);

	return 0; // Return 0 to indicate success
}

function createChangeWithSnapshot(args: {
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

function createChangesetForTransaction(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>,
	nextChangeSetId: string,
	currentTime: string,
	mutatedVersion: {
		inherits_from_version_id?: string | null | undefined;
		id: string;
		working_change_set_id: string;
		name: string;
		change_set_id: string;
	},
	rootChange: Pick<
		{
			id: string;
			entity_id: string;
			schema_key: string;
			schema_version: string;
			file_id: string;
			plugin_key: string;
			snapshot_id: string;
			created_at: string;
		},
		"id" | "entity_id" | "schema_key" | "file_id"
	>,
	snapshot_content: string | null
) {
	const changeSetChange = createChangeWithSnapshot({
		sqlite,
		db,
		data: {
			entity_id: nextChangeSetId,
			schema_key: "lix_change_set",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				id: nextChangeSetId,
				metadata: null,
			} satisfies LixChangeSet),
			schema_version: LixChangeSetSchema["x-lix-version"],
		},
		timestamp: currentTime,
		version_id: "global", // Always use 'global' for change sets
	});

	const changeSetEdgeChange = createChangeWithSnapshot({
		sqlite,
		db,
		data: {
			entity_id: `${mutatedVersion.change_set_id}::${nextChangeSetId}`,
			schema_key: "lix_change_set_edge",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				parent_id: mutatedVersion.change_set_id,
				child_id: nextChangeSetId,
			} satisfies LixChangeSetEdge),
			schema_version: LixChangeSetEdgeSchema["x-lix-version"],
		},
		timestamp: currentTime,
		version_id: "global", // Always use 'global' for change set edges
	});

	// Only create separate version change if root change is not already a version change
	const changesToProcess = [rootChange, changeSetChange, changeSetEdgeChange];

	const versionChange = createChangeWithSnapshot({
		sqlite,
		db,
		data: {
			entity_id: mutatedVersion.id,
			schema_key: "lix_version",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				...mutatedVersion,
				change_set_id: nextChangeSetId,
			} satisfies LixVersion),
			schema_version: LixVersionSchema["x-lix-version"],
		},
		timestamp: currentTime,
		version_id: "global",
	});
	changesToProcess.push(versionChange);

	for (const change of changesToProcess) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const changeSetElementChange = createChangeWithSnapshot({
			sqlite,
			db,
			data: {
				entity_id: `${nextChangeSetId}::${change.id}`,
				schema_key: "lix_change_set_element",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					change_set_id: nextChangeSetId,
					change_id: change.id,
					schema_key: change.schema_key,
					file_id: change.file_id,
					entity_id: change.entity_id,
				} satisfies LixChangeSetElement),
				schema_version: LixChangeSetElementSchema["x-lix-version"],
			},
			timestamp: currentTime,
			version_id: "global",
		});
		// TODO investigate if needed as part of a change set itself
		// seems to make queries slower
		// creating a change set element for the change set element change
		// this is meta but allows us to reconstruct and mutate a change set
		// createChangeWithSnapshot({
		// 	sqlite,
		// 	db,
		// 	data: {
		// 		entity_id: changeSetElementChange.entity_id,
		// 		schema_key: "lix_change_set_element",
		// 		file_id: "lix",
		// 		plugin_key: "lix_own_entity",
		// 		snapshot_content: JSON.stringify({
		// 			change_set_id: changeSetId,
		// 			change_id: changeSetElementChange.id,
		// 			schema_key: "lix_change_set_element",
		// 			file_id: "lix",
		// 			entity_id: changeSetElementChange.entity_id,
		// 		} satisfies ChangeSetElement),
		// 	},
		// });
	}

	// Create/update working change set element for user data changes
	// TODO skipping lix internal entities is likely undesired.
	// Skip lix internal entities (change sets, edges, etc.)
	if (
		rootChange.schema_key !== "lix_change_set" &&
		rootChange.schema_key !== "lix_change_set_edge" &&
		rootChange.schema_key !== "lix_change_set_element" &&
		rootChange.schema_key !== "lix_version"
	) {
		const parsedSnapshot = snapshot_content
			? JSON.parse(snapshot_content)
			: null;
		const isDeletion =
			!parsedSnapshot || parsedSnapshot.snapshot_id === "no-content";

		if (isDeletion) {
			// Delete reconciliation: check if entity existed at last checkpoint
			const lastCheckpointChangeSet = executeSync({
				lix: { sqlite },
				query: db
					.selectFrom("change_set")
					.where(changeSetHasLabel({ name: "checkpoint" }))
					.where(
						changeSetIsAncestorOf(
							{ id: mutatedVersion.change_set_id },
							{ includeSelf: true }
						)
					)
					.select("id")
					.limit(1),
			});

			let entityExistedAtCheckpoint = false;

			if (lastCheckpointChangeSet.length > 0) {
				// Check if entity existed in state at the last checkpoint
				// TODO use state_at query https://github.com/opral/lix-sdk/issues/312
				const entityAtCheckpoint = executeSync({
					lix: { sqlite },
					query: db
						.selectFrom("change")
						.innerJoin(
							"change_set_element",
							"change_set_element.change_id",
							"change.id"
						)
						.where("change.entity_id", "=", rootChange.entity_id)
						.where("change.schema_key", "=", rootChange.schema_key)
						.where("change.file_id", "=", rootChange.file_id)
						.where(
							changeSetElementInAncestryOf([
								{ id: lastCheckpointChangeSet[0]!.id },
							])
						)
						.where(
							changeSetElementIsLeafOf([{ id: lastCheckpointChangeSet[0]!.id }])
						)
						.where("change.snapshot_id", "!=", "no-content")
						.select("change.id")
						.limit(1),
				});

				entityExistedAtCheckpoint = entityAtCheckpoint.length > 0;
			}

			// Always remove existing working change set element first
			executeSync({
				lix: { sqlite },
				query: db
					.deleteFrom("state")
					.where(
						"entity_id",
						"like",
						`${mutatedVersion.working_change_set_id}::%`
					)
					.where("schema_key", "=", "lix_change_set_element")
					.where("file_id", "=", "lix")
					.where("version_id", "=", "global")
					.where(
						sql`json_extract(snapshot_content, '$.entity_id')`,
						"=",
						rootChange.entity_id
					)
					.where(
						sql`json_extract(snapshot_content, '$.schema_key')`,
						"=",
						rootChange.schema_key
					)
					.where(
						sql`json_extract(snapshot_content, '$.file_id')`,
						"=",
						rootChange.file_id
					),
			});

			// If entity existed at checkpoint, add deletion to working change set
			if (entityExistedAtCheckpoint) {
				createChangeWithSnapshot({
					sqlite,
					db,
					data: {
						entity_id: `${mutatedVersion.working_change_set_id}::${rootChange.id}`,
						schema_key: "lix_change_set_element",
						file_id: "lix",
						plugin_key: "lix_own_entity",
						snapshot_content: JSON.stringify({
							change_set_id: mutatedVersion.working_change_set_id,
							change_id: rootChange.id,
							entity_id: rootChange.entity_id,
							schema_key: rootChange.schema_key,
							file_id: rootChange.file_id,
						} satisfies LixChangeSetElement),
						schema_version: LixChangeSetElementSchema["x-lix-version"],
					},
					timestamp: currentTime,
					version_id: "global",
				});
			}
			// If entity didn't exist at checkpoint, just remove from working change set (already done above)
		} else {
			// Non-deletion: create/update working change set element (latest change wins)
			// First, remove any existing working change set element for this entity
			executeSync({
				lix: { sqlite },
				query: db
					.deleteFrom("state")
					.where(
						"entity_id",
						"like",
						`${mutatedVersion.working_change_set_id}::%`
					)
					.where("schema_key", "=", "lix_change_set_element")
					.where("file_id", "=", "lix")
					.where("version_id", "=", "global")
					.where(
						sql`json_extract(snapshot_content, '$.entity_id')`,
						"=",
						rootChange.entity_id
					)
					.where(
						sql`json_extract(snapshot_content, '$.schema_key')`,
						"=",
						rootChange.schema_key
					)
					.where(
						sql`json_extract(snapshot_content, '$.file_id')`,
						"=",
						rootChange.file_id
					),
			});

			// Then create new element with latest change
			createChangeWithSnapshot({
				sqlite,
				db,
				data: {
					entity_id: `${mutatedVersion.working_change_set_id}::${rootChange.id}`,
					schema_key: "lix_change_set_element",
					file_id: "lix",
					plugin_key: "lix_own_entity",
					snapshot_content: JSON.stringify({
						change_set_id: mutatedVersion.working_change_set_id,
						change_id: rootChange.id,
						entity_id: rootChange.entity_id,
						schema_key: rootChange.schema_key,
						file_id: rootChange.file_id,
					} satisfies LixChangeSetElement),
					schema_version: LixChangeSetElementSchema["x-lix-version"],
				},
				timestamp: currentTime,
				version_id: "global",
			});
		}
	}
}