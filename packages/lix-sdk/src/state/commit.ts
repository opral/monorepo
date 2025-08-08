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
import { handleStateDelete } from "./schema.js";
import { insertTransactionState } from "./insert-transaction-state.js";
import { commitIsAncestorOf } from "../query-filter/commit-is-ancestor-of.js";
import type { LixCommitEdge } from "../commit/schema.js";
import { updateStateCache } from "./cache/update-state-cache.js";

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
	const commitFuncStartTime = performance.now();
	console.log(`commit() START`);
	
	// Create a single timestamp for the entire transaction
	const timestampStart = performance.now();
	const transactionTimestamp = timestamp({ lix: args.lix });
	const timestampTime = performance.now() - timestampStart;
	console.log(`  timestamp: ${timestampTime.toFixed(3)}ms`);

	const queryChangesStart = performance.now();
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
	const queryChangesTime = performance.now() - queryChangesStart;
	console.log(`  queryTransactionChanges: ${queryChangesTime.toFixed(3)}ms, found: ${transactionChanges.length}`);

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

	// First pass: Create changesets for non-global versions
	for (const [version_id, versionChanges] of changesByVersion) {
		if (version_id !== "global") {
			// Create changeset, commit and edges for this version's transaction
			const commitId = createChangesetForTransaction(
				args.lix.sqlite,
				args.lix.db as any,
				transactionTimestamp,
				version_id,
				versionChanges
			);
			commitIdsByVersion.set(version_id, commitId);
		}
	}

	// Second pass: Handle global version
	// At this point, any version updates from the first pass are in the transaction
	// with version_id: "global", so we need to re-query
	if (commitIdsByVersion.size > 0 || changesByVersion.has("global")) {
		// Get all changes for global version (including version updates from first pass)
		const globalChanges = executeSync({
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
				.where("version_id", "=", "global"),
		});

		if (globalChanges.length > 0) {
			const globalCommitId = createChangesetForTransaction(
				args.lix.sqlite,
				args.lix.db as any,
				transactionTimestamp,
				"global",
				globalChanges
			);
			commitIdsByVersion.set("global", globalCommitId);
		}
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

	// Batch insert all changes into the change table (instead of N+1 individual inserts)
	if (allChangesToRealize.length > 0) {
		const changeRows = allChangesToRealize.map((change) => ({
			id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			schema_version: change.schema_version,
			file_id: change.file_id,
			plugin_key: change.plugin_key,
			created_at: change.created_at,
			snapshot_content: change.snapshot_content,
		}));

		executeSync({
			lix: args.lix,
			query: args.lix.db.insertInto("change").values(changeRows),
		});
	}

	// Clear the transaction table after committing
	const cleanupStart = performance.now();
	executeSync({
		lix: args.lix,
		query: (
			args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>
		).deleteFrom("internal_change_in_transaction"),
	});
	const cleanupTime = performance.now() - cleanupStart;
	console.log(`  cleanup: ${cleanupTime.toFixed(3)}ms`);

	// Update cache entries with the commit id only for entities that were changed
	for (const [version_id, commitId] of commitIdsByVersion) {
		// Get the changes for this version
		// For global version, we need to use all changes in the version (including from second pass)
		const changesForVersion =
			version_id === "global"
				? allChangesToRealize.filter((c) => c.version_id === "global")
				: changesByVersion.get(version_id)!;

		// Only update cache entries for entities that were actually changed
		for (const change of changesForVersion) {
			// Use the centralized updateStateCache function instead of inline updates
			updateStateCache({
				lix: args.lix,
				change: {
					id: change.id,
					entity_id: change.entity_id,
					schema_key: change.schema_key,
					schema_version: change.schema_version,
					file_id: change.file_id,
					plugin_key: change.plugin_key,
					snapshot_content: change.snapshot_content,
					created_at: change.created_at,
				},
				commit_id: commitId,
				version_id: version_id,
			});
		}
	}

	const sequenceStart = performance.now();
	commitDeterministicSequenceNumber({
		lix: args.lix,
		timestamp: transactionTimestamp,
	});
	const sequenceTime = performance.now() - sequenceStart;
	console.log(`  commitDeterministicSequence: ${sequenceTime.toFixed(3)}ms`);

	//* Emit state commit hook after transaction is successfully committed
	//* must come last to ensure that subscribers see the changes
	const hooksStart = performance.now();
	args.lix.hooks._emit("state_commit", { changes: allChangesToRealize });
	const hooksTime = performance.now() - hooksStart;
	console.log(`  hooks: ${hooksTime.toFixed(3)}ms`);
	
	const commitFuncTime = performance.now() - commitFuncStartTime;
	console.log(`commit() COMPLETE: ${commitFuncTime.toFixed(3)}ms total`);
	
	return args.lix.sqlite.sqlite3.capi.SQLITE_OK;
}

/**
 * Creates a changeset and commit for all changes in a transaction and updates the version.
 *
 * This function:
 * 1. Creates a new changeset and commit
 * 2. Creates a commit edge linking the previous commit to the new one
 * 3. Updates the version to point to the new commit
 * 4. Creates changeset elements for each change
 * 5. Updates working changeset elements for user data changes
 *
 * @param sqlite - SQLite database instance
 * @param db - Kysely database instance
 * @param _currentTime - Current timestamp (unused)
 * @param version_id - The version to create the changeset for
 * @param changes - Array of changes to include in the changeset
 * @returns The ID of the newly created commit
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
	const createChangesetStartTime = performance.now();
	console.log(`    createChangeset START for version_id: ${version_id}`);

	// Get the version record from resolved state view
	const versionQueryStart = performance.now();
	const versionRows = executeSync({
		lix: { sqlite },
		query: db
			.selectFrom("internal_resolved_state_all")
			.where("schema_key", "=", "lix_version")
			.where("entity_id", "=", version_id)
			.select("snapshot_content")
			.limit(1),
	});
	const versionQueryTime = performance.now() - versionQueryStart;
	console.log(`      versionQuery: ${versionQueryTime.toFixed(3)}ms`);

	if (versionRows.length === 0 || !versionRows[0]?.snapshot_content) {
		throw new Error(`Version with id '${version_id}' not found.`);
	}

	const mutatedVersion = JSON.parse(versionRows[0].snapshot_content) as any;
	const nextChangeSetId = nanoId({
		lix: { sqlite, db: db as unknown as Kysely<LixDatabaseSchema> },
	});

	// TODO: Don't create change author for the changeset itself.
	// Change authors should be associated with commit entities when implemented.
	// See: https://github.com/opral/lix-sdk/issues/359

	// Create a new commit that points to the new change set
	const nextCommitId = uuidV7({
		lix: { sqlite, db: db as unknown as Kysely<LixDatabaseSchema> },
	});

	// Batch create all core entities (changeset, commit, edge, version) in one call
	const coreEntitiesBatchStart = performance.now();
	const coreEntitiesData = [
		{
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
		{
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
		{
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
		{
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
	];

	const [
		changeSetChange,
		commitChange,
		commitEdgeChange,
		versionChange,
	] = insertTransactionState({
		lix: { sqlite, db },
		data: coreEntitiesData,
		createChangeAuthors: false,
	});
	const coreEntitiesBatchTime = performance.now() - coreEntitiesBatchStart;
	console.log(`      coreEntitiesBatch: ${coreEntitiesBatchTime.toFixed(3)}ms`);

	// Create changeset elements for all changes
	const changesToProcess = [
		...changes,
		changeSetChange!,
		commitChange!,
		commitEdgeChange!,
		versionChange!,
	];

	// Batch create all changeset elements in one call (instead of N+1 individual inserts)
	const changesetElementsBatchStart = performance.now();
	console.log(
		`      changesetElementsBatch START: processing ${changesToProcess.length} changes`
	);
	
	const changesetElementsData = changesToProcess.map((change) => {
		// Get the change ID - it may be 'id' for original changes or 'change_id' for results from insertTransactionState
		const changeId = "change_id" in change ? change.change_id : change.id;
		
		return {
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
		};
	});

	if (changesetElementsData.length > 0) {
		insertTransactionState({
			lix: { sqlite, db },
			data: changesetElementsData,
			createChangeAuthors: false,
		});
	}
	
	const changesetElementsBatchTime =
		performance.now() - changesetElementsBatchStart;
	console.log(
		`      changesetElementsBatch COMPLETE: ${changesetElementsBatchTime.toFixed(3)}ms`
	);

	// Create/update working change set element for user data changes
	// Get the working commit and its change set
	const workingCommitQueryStart = performance.now();
	const workingCommit = executeSync({
		lix: { sqlite },
		query: db
			.selectFrom("commit")
			.where("id", "=", mutatedVersion.working_commit_id)
			.selectAll(),
	});
	const workingCommitQueryTime = performance.now() - workingCommitQueryStart;
	console.log(
		`      workingCommitQuery: ${workingCommitQueryTime.toFixed(3)}ms`
	);

	if (workingCommit.length === 0) {
		throw new Error(
			`Working commit not found: ${mutatedVersion.working_commit_id}`
		);
	}

	const workingChangeSetId = workingCommit[0]!.change_set_id;

	// TODO skipping lix internal entities is likely undesired.
	// Skip lix internal entities (change sets, edges, etc.)
	const deletionReconciliationStart = performance.now();
	console.log(
		`      deletionReconciliation START: processing ${changes.length} user changes`
	);
	
	// Filter out lix internal entities
	const userChanges = changes.filter(
		(change) =>
			change.schema_key !== "lix_change_set" &&
			change.schema_key !== "lix_change_set_edge" &&
			change.schema_key !== "lix_change_set_element" &&
			change.schema_key !== "lix_version"
	);

	if (userChanges.length > 0) {
		// Separate changes into deletions and non-deletions
		const deletions: typeof userChanges = [];
		const nonDeletions: typeof userChanges = [];
		
		for (const change of userChanges) {
			const parsedSnapshot = change.snapshot_content
				? JSON.parse(change.snapshot_content)
				: null;
			const isDeletion =
				!parsedSnapshot || parsedSnapshot.snapshot_id === "no-content";
			
			if (isDeletion) {
				deletions.push(change);
			} else {
				nonDeletions.push(change);
			}
		}

		// Step 1: Batch check for entities at checkpoint (for deletions)
		const entitiesAtCheckpoint = new Set<string>();
		if (deletions.length > 0) {
			// Get the checkpoint commit ID once
			const checkpointStart = performance.now();
			const checkpointCommitResult = executeSync({
				lix: { sqlite },
				query: db
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
					.limit(1),
			});
			
			const checkpointCommitId = checkpointCommitResult[0]?.id;
			
			if (checkpointCommitId) {
				// Batch check all deletion entities at checkpoint
				const checkpointEntities = executeSync({
					lix: { sqlite },
					query: db
						.selectFrom("state_history")
						.where("depth", "=", 0)
						.where("commit_id", "=", checkpointCommitId)
						.where((eb) =>
							eb.or(
								deletions.map((change) =>
									eb.and([
										eb("entity_id", "=", change.entity_id),
										eb("schema_key", "=", change.schema_key),
										eb("file_id", "=", change.file_id),
									])
								)
							)
						)
						.select(["entity_id", "schema_key", "file_id"]),
				});
				
				// Build a set for quick lookup
				for (const entity of checkpointEntities) {
					entitiesAtCheckpoint.add(
						`${entity.entity_id}|${entity.schema_key}|${entity.file_id}`
					);
				}
			}
			const checkpointTime = performance.now() - checkpointStart;
			console.log(
				`        checkpointCheck: ${checkpointTime.toFixed(3)}ms, deletions: ${deletions.length}, found: ${entitiesAtCheckpoint.size}`
			);
		}

		// Step 2: Batch find all existing working change set elements to delete
		const findExistingStart = performance.now();
		const existingEntities = executeSync({
			lix: { sqlite },
			query: db
				.selectFrom("internal_resolved_state_all")
				.select([
					"_pk",
					sql`json_extract(snapshot_content, '$.entity_id')`.as("entity_id"),
					sql`json_extract(snapshot_content, '$.schema_key')`.as("schema_key"),
					sql`json_extract(snapshot_content, '$.file_id')`.as("file_id"),
				])
				.where("entity_id", "like", `${workingChangeSetId}::%`)
				.where("schema_key", "=", "lix_change_set_element")
				.where("file_id", "=", "lix")
				.where("version_id", "=", "global")
				.where((eb) =>
					eb.or(
						userChanges.map((change) =>
							eb.and([
								eb(
									sql`json_extract(snapshot_content, '$.entity_id')`,
									"=",
									change.entity_id
								),
								eb(
									sql`json_extract(snapshot_content, '$.schema_key')`,
									"=",
									change.schema_key
								),
								eb(
									sql`json_extract(snapshot_content, '$.file_id')`,
									"=",
									change.file_id
								),
							])
						)
					)
				),
		});
		const findExistingTime = performance.now() - findExistingStart;
		console.log(
			`        findExistingElements: ${findExistingTime.toFixed(3)}ms, found: ${existingEntities.length}`
		);

		// Step 3: Delete all existing working change set elements at once
		console.log(
			`        deletingElements: ${existingEntities.length} elements`
		);
		const deleteStart = performance.now();
		for (const existing of existingEntities) {
			handleStateDelete(sqlite, existing._pk, db);
		}
		const deleteTime = performance.now() - deleteStart;
		console.log(`        deleteElements: ${deleteTime.toFixed(3)}ms`);

		// Step 4: Batch create new working change set elements
		const newWorkingElements: Parameters<typeof insertTransactionState>[0]["data"] = [];
		
		// Add deletions that existed at checkpoint
		for (const deletion of deletions) {
			const key = `${deletion.entity_id}|${deletion.schema_key}|${deletion.file_id}`;
			if (entitiesAtCheckpoint.has(key)) {
				newWorkingElements.push({
					entity_id: `${workingChangeSetId}::${deletion.id}`,
					schema_key: "lix_change_set_element",
					file_id: "lix",
					plugin_key: "lix_own_entity",
					snapshot_content: JSON.stringify({
						change_set_id: workingChangeSetId,
						change_id: deletion.id,
						entity_id: deletion.entity_id,
						schema_key: deletion.schema_key,
						file_id: deletion.file_id,
					} satisfies LixChangeSetElement),
					schema_version: LixChangeSetElementSchema["x-lix-version"],
					version_id: "global",
					untracked: false,
				});
			}
		}
		
		// Add all non-deletions
		for (const change of nonDeletions) {
			newWorkingElements.push({
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
			});
		}
		
		// Batch insert all new working elements
		if (newWorkingElements.length > 0) {
			insertTransactionState({
				lix: { sqlite, db },
				data: newWorkingElements,
				createChangeAuthors: false,
			});
		}
	}
	
	const deletionReconciliationTime =
		performance.now() - deletionReconciliationStart;
	console.log(
		`      deletionReconciliation COMPLETE: ${deletionReconciliationTime.toFixed(3)}ms`
	);

	const createChangesetTime = performance.now() - createChangesetStartTime;
	console.log(
		`    createChangeset COMPLETE: ${createChangesetTime.toFixed(3)}ms, returning commitId: ${nextCommitId}`
	);
	return nextCommitId;
}
