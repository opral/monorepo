import { type Kysely, sql } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import {
	type LixChangeSet,
	type LixChangeSetEdge,
	type LixChangeSetElement,
	LixChangeSetEdgeSchema,
	LixChangeSetElementSchema,
	LixChangeSetSchema,
} from "../change-set/schema.js";
import { executeSync } from "../database/execute-sync.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { changeSetHasLabel } from "../query-filter/change-set-has-label.js";
import { changeSetIsAncestorOf } from "../query-filter/change-set-is-ancestor-of.js";
import { LixVersionSchema, type LixVersion } from "../version/schema.js";
import { createChangeWithSnapshot } from "./handle-state-mutation.js";
import { nanoid } from "../database/nano-id.js";
import { getVersionRecordByIdOrThrow } from "./get-version-record-by-id-or-throw.js";
import { handleStateDelete } from "./schema.js";

export function createChangesetForTransaction(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>,
	currentTime: string,
	version_id: string,
	changes: Pick<
		{
			id: string;
			entity_id: string;
			schema_key: string;
			schema_version: string;
			file_id: string;
			plugin_key: string;
			snapshot_id: string;
			created_at: string;
			snapshot_content: string | null;
		},
		"id" | "entity_id" | "schema_key" | "file_id" | "snapshot_content"
	>[]
): string {
	const versionRecord = getVersionRecordByIdOrThrow(sqlite, db, version_id);

	if (!versionRecord) {
		throw new Error(`Version with id '${version_id}' not found.`);
	}
	const mutatedVersion = versionRecord as any;
	const nextChangeSetId = nanoid();
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
	const changesToProcess = [...changes, changeSetChange, changeSetEdgeChange];

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
		// Create a change set element for the change set element change itself
		// This is meta but necessary to ensure all changes are reachable
		createChangeWithSnapshot({
			sqlite,
			db,
			data: {
				entity_id: `${nextChangeSetId}::${changeSetElementChange.id}`,
				schema_key: "lix_change_set_element",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					change_set_id: nextChangeSetId,
					change_id: changeSetElementChange.id,
					schema_key: "lix_change_set_element",
					file_id: "lix",
					entity_id: changeSetElementChange.entity_id,
				} satisfies LixChangeSetElement),
				schema_version: LixChangeSetElementSchema["x-lix-version"],
			},
			timestamp: currentTime,
			version_id: "global",
		});
	}

	// Create/update working change set element for user data changes
	// TODO skipping lix internal entities is likely undesired.
	// Skip lix internal entities (change sets, edges, etc.)
	for (const change of changes) {
		if (
			change.schema_key !== "lix_change_set" &&
			change.schema_key !== "lix_change_set_edge" &&
			change.schema_key !== "lix_change_set_element" &&
			change.schema_key !== "lix_version"
		) {
			const parsedSnapshot = change.snapshot_content
				? JSON.parse(change.snapshot_content)
				: null;
			const isDeletion =
				!parsedSnapshot || parsedSnapshot.snapshot_id === "no-content";

			if (isDeletion) {
				// Delete reconciliation: check if entity existed at last checkpoint using state_history
				const entityAtCheckpoint = executeSync({
					lix: { sqlite },
					query: db
						.selectFrom("state_history")
						.where("entity_id", "=", change.entity_id)
						.where("schema_key", "=", change.schema_key)
						.where("file_id", "=", change.file_id)
						.where("depth", "=", 0)
						.where(
							"change_set_id",
							"=",
							// get the previous checkpoint change set
							db
								.selectFrom("change_set")
								.where(changeSetHasLabel({ name: "checkpoint" }))
								.where(
									changeSetIsAncestorOf(
										{ id: mutatedVersion.change_set_id },
										{ includeSelf: true, depth: 1 }
									)
								)
								.select("id")
						)
						.select("entity_id"),
				});

				const entityExistedAtCheckpoint = entityAtCheckpoint.length > 0;

				// Always remove existing working change set element first
				const toDelete = executeSync({
					lix: { sqlite },
					query: db
						.selectFrom("state_all")

						// @ts-expect-error - rowid is a valid SQLite column but not in Kysely types
						.select("rowid")
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
							change.entity_id
						)
						.where(
							sql`json_extract(snapshot_content, '$.schema_key')`,
							"=",
							change.schema_key
						)
						.where(
							sql`json_extract(snapshot_content, '$.file_id')`,
							"=",
							change.file_id
						),
				});

				if (toDelete.length > 0) {
					handleStateDelete(sqlite, toDelete[0]!.rowid, db);
				}

				// If entity existed at checkpoint, add deletion to working change set
				if (entityExistedAtCheckpoint) {
					const workingChangeSetElementChange = createChangeWithSnapshot({
						sqlite,
						db,
						data: {
							entity_id: `${mutatedVersion.working_change_set_id}::${change.id}`,
							schema_key: "lix_change_set_element",
							file_id: "lix",
							plugin_key: "lix_own_entity",
							snapshot_content: JSON.stringify({
								change_set_id: mutatedVersion.working_change_set_id,
								change_id: change.id,
								entity_id: change.entity_id,
								schema_key: change.schema_key,
								file_id: change.file_id,
							} satisfies LixChangeSetElement),
							schema_version: LixChangeSetElementSchema["x-lix-version"],
						},
						timestamp: currentTime,
						version_id: "global",
					});
					
					// Create a meta change set element for the working change set element change itself
					createChangeWithSnapshot({
						sqlite,
						db,
						data: {
							entity_id: `${mutatedVersion.working_change_set_id}::${workingChangeSetElementChange.id}`,
							schema_key: "lix_change_set_element",
							file_id: "lix",
							plugin_key: "lix_own_entity",
							snapshot_content: JSON.stringify({
								change_set_id: mutatedVersion.working_change_set_id,
								change_id: workingChangeSetElementChange.id,
								schema_key: "lix_change_set_element",
								file_id: "lix",
								entity_id: workingChangeSetElementChange.entity_id,
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
				const toDelete = executeSync({
					lix: { sqlite },
					query: db
						.selectFrom("state_all")
						// @ts-expect-error - rowid is a valid SQLite column but not in Kysely types
						.select("rowid")
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
							change.entity_id
						)
						.where(
							sql`json_extract(snapshot_content, '$.schema_key')`,
							"=",
							change.schema_key
						)
						.where(
							sql`json_extract(snapshot_content, '$.file_id')`,
							"=",
							change.file_id
						),
				});

				if (toDelete.length > 0) {
					// throw new Error("not implement - us the delete function ");
					handleStateDelete(sqlite, toDelete[0]!.rowid, db);
				}

				// Then create new element with latest change
				createChangeWithSnapshot({
					sqlite,
					db,
					data: {
						entity_id: `${mutatedVersion.working_change_set_id}::${change.id}`,
						schema_key: "lix_change_set_element",
						file_id: "lix",
						plugin_key: "lix_own_entity",
						snapshot_content: JSON.stringify({
							change_set_id: mutatedVersion.working_change_set_id,
							change_id: change.id,
							entity_id: change.entity_id,
							schema_key: change.schema_key,
							file_id: change.file_id,
						} satisfies LixChangeSetElement),
						schema_version: LixChangeSetElementSchema["x-lix-version"],
					},
					timestamp: currentTime,
					version_id: "global",
				});
			}
		}
	}

	return nextChangeSetId;
}
