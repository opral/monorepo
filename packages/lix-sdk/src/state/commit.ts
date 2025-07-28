import { type Kysely, sql } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import {
	type LixChangeSet,
	type LixChangeSetElement,
	LixChangeSetElementSchema,
	LixChangeSetSchema,
} from "../change-set/schema.js";
import { executeSync } from "../database/execute-sync.js";
import type {
	LixDatabaseSchema,
	LixInternalDatabaseSchema,
} from "../database/schema.js";
import { LixVersionSchema, type LixVersion } from "../version/schema.js";
import { nanoId } from "../deterministic/index.js";
import { uuidV7 } from "../deterministic/uuid-v7.js";
import { commitDeterministicSequenceNumber } from "../deterministic/sequence.js";
import { timestamp } from "../deterministic/timestamp.js";
import type { Lix } from "../lix/open-lix.js";
import { getVersionRecordByIdOrThrow } from "./get-version-record-by-id-or-throw.js";
import { handleStateDelete } from "./schema.js";
import { insertTransactionState } from "./insert-transaction-state.js";
import { commitIsAncestorOf } from "../query-filter/commit-is-ancestor-of.js";
import type { LixCommitEdge } from "../commit/schema.js";

/**
 * Commits all pending changes from the transaction stage to permanent storage.
 *
 * This function handles the COMMIT stage of the state mutation flow. It takes
 * all changes accumulated in the transaction table (internal_change_in_transaction),
 * groups them by version, creates changesets for each version, and saves
 * them to permanent storage (internal_change and internal_snapshot tables).
 *
 * @example
 * // After accumulating changes via insertTransactionState
 * commit({ lix });
 * // All pending changes are now persisted
 */
export function commit(args: {
	lix: Pick<Lix, "sqlite" | "db" | "hooks">;
}): number {
	const transactionChanges = executeSync({
		lix: args.lix,
		query: (args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
			.selectFrom("internal_change_in_transaction")
			.select([
				"id",
				"entity_id",
				"schema_key",
				"schema_version",
				"file_id",
				"plugin_key",
				"version_id",
				sql<string | null>`json(snapshot_content)`.as("snapshot_content"),
				"created_at",
			])
			.orderBy("version_id"),
	});

	// Group changes by version_id
	const changesByVersion = new Map<string, typeof transactionChanges>();
	for (const change of transactionChanges) {
		if (!changesByVersion.has(change.version_id)) {
			changesByVersion.set(change.version_id, []);
		}
		changesByVersion.get(change.version_id)!.push(change);
	}

	// Process each version's changes to create changesets and commits
	const commitIdsByVersion = new Map<string, string>();
	for (const [version_id, versionChanges] of changesByVersion) {
		// Create changeset, commit and edges for this version's transaction
		const commitId = createChangesetForTransaction(
			args.lix.sqlite,
			args.lix.db as any,
			timestamp({ lix: args.lix }),
			version_id,
			versionChanges
		);
		commitIdsByVersion.set(version_id, commitId);
	}

	// Use the same changes we already queried at the beginning
	// Don't re-query the transaction table as it now contains additional changes
	// created by createChangesetForTransaction (like change_author records)

	// Also need to realize the changes created by createChangesetForTransaction
	const newChangesInTransaction =
		transactionChanges.length > 0
			? executeSync({
					lix: args.lix,
					query: (args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
						.selectFrom("internal_change_in_transaction")
						.select([
							"id",
							"entity_id",
							"schema_key",
							"schema_version",
							"file_id",
							"plugin_key",
							"version_id",
							sql<string | null>`json(snapshot_content)`.as("snapshot_content"),
							"created_at",
						])
						.where(
							"id",
							"not in",
							transactionChanges.map((c) => c.id)
						),
				})
			: [];

	// Combine all changes to realize
	const allChangesToRealize = [
		...transactionChanges,
		...newChangesInTransaction,
	];

	for (const change of allChangesToRealize) {
		executeSync({
			lix: args.lix,
			query: args.lix.db.insertInto("change").values({
				id: change.id,
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				schema_version: change.schema_version,
				file_id: change.file_id,
				plugin_key: change.plugin_key,
				created_at: change.created_at,
				snapshot_content: change.snapshot_content,
			}),
		});
	}

	// Clear the transaction table after committing
	executeSync({
		lix: args.lix,
		query: (
			args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>
		).deleteFrom("internal_change_in_transaction"),
	});

	// Update cache entries with the commit id only for entities that were changed
	for (const [version_id, commitId] of commitIdsByVersion) {
		const changesForVersion = changesByVersion.get(version_id)!;

		// Only update cache entries for entities that were actually changed
		for (const change of changesForVersion) {
			executeSync({
				lix: args.lix,
				query: (args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
					.updateTable("internal_state_cache")
					.set({
						commit_id: commitId,
					})
					.where("version_id", "=", version_id)
					.where("entity_id", "=", change.entity_id)
					.where("schema_key", "=", change.schema_key)
					.where("file_id", "=", change.file_id),
			});
		}
	}

	commitDeterministicSequenceNumber({ lix: args.lix });

	//* Emit state commit hook after transaction is successfully committed
	//* must come last to ensure that subscribers see the changes
	args.lix.hooks._emit("state_commit", { changes: allChangesToRealize });
	return args.lix.sqlite.sqlite3.capi.SQLITE_OK;
}

/**
 * Creates a changeset for all changes in a transaction and updates the version.
 *
 * This function:
 * 1. Creates a new changeset and links it to the current version's changeset
 * 2. Updates the version to point to the new changeset
 * 3. Creates changeset elements for each change
 * 4. Updates working changeset elements for user data changes
 *
 * @param sqlite - SQLite database instance
 * @param db - Kysely database instance
 * @param _currentTime - Current timestamp (unused)
 * @param version_id - The version to create the changeset for
 * @param changes - Array of changes to include in the changeset
 * @returns The ID of the newly created changeset
 */
function createChangesetForTransaction(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>,
	_currentTime: string,
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
	const nextChangeSetId = nanoId({
		lix: { sqlite, db: db as unknown as Kysely<LixDatabaseSchema> },
	});
	

	// TODO: Don't create change author for the changeset itself.
	// Change authors should be associated with commit entities when implemented.
	// See: https://github.com/opral/lix-sdk/issues/359

	// Create changeset
	const changeSetChange = insertTransactionState({
		lix: { sqlite, db },
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
			version_id: "global",
			untracked: false,
		},
		createChangeAuthors: false,
	}).data;

	// Create a new commit that points to the new change set
	const nextCommitId = uuidV7({
		lix: { sqlite, db: db as unknown as Kysely<LixDatabaseSchema> },
	});

	const commitChange = insertTransactionState({
		lix: { sqlite, db },
		data: {
			entity_id: nextCommitId,
			schema_key: "lix_commit",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				id: nextCommitId,
				change_set_id: nextChangeSetId,
			}),
			schema_version: "1.0",
			version_id: "global",
			untracked: false,
		},
		createChangeAuthors: false,
	}).data;
	

	// Create commit edge from previous commit to new commit
	const commitEdgeChange = insertTransactionState({
		lix: { sqlite, db },
		data: {
			entity_id: `${mutatedVersion.commit_id}~${nextCommitId}`,
			schema_key: "lix_commit_edge",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				parent_id: mutatedVersion.commit_id,
				child_id: nextCommitId,
			} satisfies LixCommitEdge),
			schema_version: "1.0",
			version_id: "global",
			untracked: false,
		},
		createChangeAuthors: false,
	}).data;

	// Update version with new commit
	const versionChange = insertTransactionState({
		lix: { sqlite, db },
		data: {
			entity_id: mutatedVersion.id,
			schema_key: "lix_version",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				...mutatedVersion,
				commit_id: nextCommitId,
			} satisfies LixVersion),
			schema_version: LixVersionSchema["x-lix-version"],
			version_id: "global",
			untracked: false,
		},
		createChangeAuthors: false,
	}).data;

	// Create changeset elements for all changes
	const changesToProcess = [
		...changes,
		changeSetChange,
		commitChange,
		commitEdgeChange,
		versionChange,
	];

	for (const change of changesToProcess) {
		// Get the change ID - it may be 'id' for original changes or 'change_id' for results from insertTransactionState
		const changeId = "change_id" in change ? change.change_id : change.id;

		// Create changeset element for this change
		insertTransactionState({
			lix: { sqlite, db },
			data: {
				entity_id: `${nextChangeSetId}::${changeId}`,
				schema_key: "lix_change_set_element",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					change_set_id: nextChangeSetId,
					change_id: changeId,
					schema_key: change.schema_key,
					file_id: change.file_id,
					entity_id: change.entity_id,
				} satisfies LixChangeSetElement),
				schema_version: LixChangeSetElementSchema["x-lix-version"],
				version_id: "global",
				untracked: false,
			},
			createChangeAuthors: false,
		});
	}

	// Create/update working change set element for user data changes
	// Get the working commit and its change set
	const workingCommit = executeSync({
		lix: { sqlite },
		query: db
			.selectFrom("commit")
			.where("id", "=", mutatedVersion.working_commit_id)
			.selectAll(),
	});

	if (workingCommit.length === 0) {
		throw new Error(
			`Working commit not found: ${mutatedVersion.working_commit_id}`
		);
	}

	const workingChangeSetId = workingCommit[0]!.change_set_id;

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
							"commit_id",
							"=",
							// get the previous checkpoint commit
							db
								.selectFrom("commit")
								.innerJoin("entity_label", (join) =>
									join
										.onRef("entity_label.entity_id", "=", "commit.id")
										.on("entity_label.schema_key", "=", "lix_commit")
								)
								.innerJoin("label", "label.id", "entity_label.label_id")
								.where("label.name", "=", "checkpoint")
								.where(
									commitIsAncestorOf(
										{ id: mutatedVersion.commit_id },
										{ includeSelf: true, depth: 1 }
									)
								)
								.select("commit.id")
						)
						.select("entity_id"),
				});

				const entityExistedAtCheckpoint = entityAtCheckpoint.length > 0;

				// Always remove existing working change set element first
				const toDelete = executeSync({
					lix: { sqlite },
					query: db
						.selectFrom("internal_resolved_state_all")
						.select("_pk")
						.where("entity_id", "like", `${workingChangeSetId}::%`)
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
					handleStateDelete(sqlite, toDelete[0]!._pk, db);
				}

				// If entity existed at checkpoint, add deletion to working change set
				if (entityExistedAtCheckpoint) {
					insertTransactionState({
						lix: { sqlite, db },
						data: {
							entity_id: `${workingChangeSetId}::${change.id}`,
							schema_key: "lix_change_set_element",
							file_id: "lix",
							plugin_key: "lix_own_entity",
							snapshot_content: JSON.stringify({
								change_set_id: workingChangeSetId,
								change_id: change.id,
								entity_id: change.entity_id,
								schema_key: change.schema_key,
								file_id: change.file_id,
							} satisfies LixChangeSetElement),
							schema_version: LixChangeSetElementSchema["x-lix-version"],
							version_id: "global",
							untracked: false,
						},
						createChangeAuthors: false,
					});
				}
				// If entity didn't exist at checkpoint, just remove from working change set (already done above)
			} else {
				// Non-deletion: create/update working change set element (latest change wins)
				// First, remove any existing working change set element for this entity
				const toDelete = executeSync({
					lix: { sqlite },
					query: db
						.selectFrom("internal_resolved_state_all")
						.select("_pk")
						.where("entity_id", "like", `${workingChangeSetId}::%`)
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
					handleStateDelete(sqlite, toDelete[0]!._pk, db);
				}

				// Then create new element with latest change
				insertTransactionState({
					lix: { sqlite, db },
					data: {
						entity_id: `${workingChangeSetId}::${change.id}`,
						schema_key: "lix_change_set_element",
						file_id: "lix",
						plugin_key: "lix_own_entity",
						snapshot_content: JSON.stringify({
							change_set_id: workingChangeSetId,
							change_id: change.id,
							entity_id: change.entity_id,
							schema_key: change.schema_key,
							file_id: change.file_id,
						} satisfies LixChangeSetElement),
						schema_version: LixChangeSetElementSchema["x-lix-version"],
						version_id: "global",
						untracked: false,
					},
					createChangeAuthors: false,
				});
			}
		}
	}

	return nextCommitId;
}

