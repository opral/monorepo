import { sql, type Kysely } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { executeSync } from "../database/execute-sync.js";
import type { Change } from "../change/schema.js";
import { nanoid } from "../database/nano-id.js";
import type { NewStateRow } from "./schema.js";
import {
	INITIAL_CHANGE_SET_ID,
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
} from "../change-set-v2/schema.js";

export function handleStateMutation(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>,
	entity_id: string,
	schema_key: string,
	file_id: string,
	plugin_key: string,
	snapshot_content: string, // stringified json
	version_id: string,
	schema_version: string
): 0 | 1 {
	// Use consistent timestamp for both changes and cache
	const currentTime = new Date().toISOString();

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

	if (!versionRecord) {
		throw new Error(`Version with id '${version_id}' not found.`);
	}

	const version = JSON.parse(versionRecord.content) as LixVersion;

	const changeSetId = nanoid();

	// Check if the root change is a version change for the same entity
	const isVersionChange =
		schema_key === "lix_version" && entity_id === version.id;

	// Check skip flag early since it's used in version change logic
	const [skipFlag] = executeSync({
		lix: { sqlite },
		query: db
			.selectFrom("state")
			.where("schema_key", "=", "lix_key_value")
			.where(
				"entity_id",
				"=",
				"lix_state_mutation_handler_skip_change_set_creation"
			)
			.select(sql`json_extract(snapshot_content, '$.value')`.as("value")),
	}) as [{ value: string } | undefined];

	const shouldSkipEdges = skipFlag?.value === "true";

	// Check if this is specifically a change_set_id update (should skip mutation handler logic)
	let isChangeSetIdUpdate = false;
	let finalSnapshotContent = snapshot_content;

	if (isVersionChange) {
		const rootSnapshot = JSON.parse(snapshot_content) as LixVersion;
		// Check if ONLY change_set_id changed (and nothing else)
		const isOnlyChangeSetIdUpdate =
			rootSnapshot.change_set_id !== version.change_set_id &&
			rootSnapshot.name === version.name &&
			rootSnapshot.working_change_set_id === version.working_change_set_id;

		if (isOnlyChangeSetIdUpdate) {
			// Skip mutation handler logic for change_set_id updates
			isChangeSetIdUpdate = true;
		} 

		if (shouldSkipEdges || isChangeSetIdUpdate) {
			// Use user's data as-is (no mutation handler modifications)
			finalSnapshotContent = snapshot_content;
		} else {
			// Apply mutation handler logic
			finalSnapshotContent = JSON.stringify({
				...rootSnapshot,
				change_set_id: changeSetId,
			} satisfies LixVersion);
		}
	}

	const rootChange = createChangeWithSnapshot({
		sqlite,
		db,
		data: {
			entity_id,
			schema_key,
			file_id,
			plugin_key,
			snapshot_content: finalSnapshotContent,
			schema_version,
		},
		timestamp: currentTime,
		version_id,
	});

	// TEMPORARY WORKAROUND: Skip mutation handler edge/change set creation
	//
	// This exists to solve the "change set per mutation" vs "change set per transaction" problem.
	// Currently, every mutation creates its own change set and edges, but ideally all mutations
	// within a transaction should be grouped into a single change set with proper edges.
	//
	// When the skip flag is set, only the root change is created without automatic
	// change set orchestration. This allows functions like createCheckpoint() to manually
	// control change set creation and avoid orphaned change sets.
	//

	// Skip mutation handler logic for:
	// 1. change_set_id updates
	// 2. when skip flag is set
	// 3. when setting/deleting the skip flag itself (avoid circular dependency)
	const isSkipFlagOperation =
		schema_key === "lix_key_value" &&
		entity_id === "lix_state_mutation_handler_skip_change_set_creation";

	if (isChangeSetIdUpdate || shouldSkipEdges || isSkipFlagOperation) {
		// For change_set_id updates or when skip flag is set, just create the root change and return
		// No edges, no new change sets, no additional logic
		return 1;
	}

	const changeSetChange = createChangeWithSnapshot({
		sqlite,
		db,
		data: {
			entity_id: changeSetId,
			schema_key: "lix_change_set",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				id: changeSetId,
				metadata: null,
			} satisfies LixChangeSet),
			schema_version: LixChangeSetSchema["x-lix-version"],
		},
		timestamp: currentTime,
		version_id,
	});

	const changeSetEdgeChange = createChangeWithSnapshot({
		sqlite,
		db,
		data: {
			entity_id: `${version.change_set_id}::${changeSetId}`,
			schema_key: "lix_change_set_edge",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				parent_id: version.change_set_id,
				child_id: changeSetId,
			} satisfies LixChangeSetEdge),
			schema_version: LixChangeSetEdgeSchema["x-lix-version"],
		},
		timestamp: currentTime,
		version_id,
	});

	// Only create separate version change if root change is not already a version change
	const changesToProcess = [rootChange, changeSetChange, changeSetEdgeChange];

	if (!isVersionChange) {
		const versionChange = createChangeWithSnapshot({
			sqlite,
			db,
			data: {
				entity_id: version.id,
				schema_key: "lix_version",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					...version,
					change_set_id: changeSetId,
				} satisfies LixVersion),
				schema_version: LixVersionSchema["x-lix-version"],
			},
			timestamp: currentTime,
			version_id,
		});
		changesToProcess.push(versionChange);
	}

	for (const change of changesToProcess) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const changeSetElementChange = createChangeWithSnapshot({
			sqlite,
			db,
			data: {
				entity_id: `${changeSetId}::${change.id}`,
				schema_key: "lix_change_set_element",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					change_set_id: changeSetId,
					change_id: change.id,
					schema_key: change.schema_key,
					file_id: change.file_id,
					entity_id: change.entity_id,
				} satisfies LixChangeSetElement),
				schema_version: LixChangeSetElementSchema["x-lix-version"],
			},
			timestamp: currentTime,
			version_id,
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

	return 1;
}

function createChangeWithSnapshot(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<LixInternalDatabaseSchema>;
	id?: string;
	data: Omit<NewStateRow, "version_id" | "created_at" | "updated_at">;
	timestamp?: string;
	version_id?: string;
}): Pick<Change, "id" | "schema_key" | "file_id" | "entity_id"> {
	const [snapshot] = args.data.snapshot_content
		? executeSync({
				lix: { sqlite: args.sqlite },
				query: args.db
					.insertInto("internal_snapshot")
					.values({
						content: sql`jsonb(${args.data.snapshot_content})`,
					})
					.returning("id"),
			})
		: [{ id: "no-content" }];

	const [change] = executeSync({
		lix: { sqlite: args.sqlite },
		query: args.db
			.insertInto("internal_change")
			.values({
				id: args.id,
				entity_id: args.data.entity_id,
				schema_key: args.data.schema_key,
				snapshot_id: snapshot.id,
				file_id: args.data.file_id,
				plugin_key: args.data.plugin_key,
				created_at: args.timestamp || new Date().toISOString(),
				schema_version: args.data.schema_version,
			})
			.returning(["id", "schema_key", "file_id", "entity_id"]),
	});

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
		executeSync({
			lix: { sqlite: args.sqlite },
			query: args.db
				.deleteFrom("internal_state_cache")
				.where("entity_id", "=", args.entity_id)
				.where("schema_key", "=", args.schema_key)
				.where("file_id", "=", args.file_id)
				.where("version_id", "=", args.version_id),
		});
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
			})
			.onConflict((oc) =>
				oc
					.columns(["entity_id", "schema_key", "file_id", "version_id"])
					.doUpdateSet({
						plugin_key: args.plugin_key,
						snapshot_content: args.snapshot_content as string,
						schema_version: args.schema_version,
						updated_at: args.timestamp,
					})
			),
	});
}
