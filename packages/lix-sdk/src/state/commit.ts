import { type Kysely, sql } from "kysely";
import {
	type LixChangeSet,
	type LixChangeSetElement,
	LixChangeSetElementSchema,
	LixChangeSetSchema,
} from "../change-set/schema.js";
import type { LixChangeRaw } from "../change/schema.js";
import { executeSync } from "../database/execute-sync.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { LixVersionSchema, type LixVersion } from "../version/schema.js";
import { nanoId } from "../deterministic/index.js";
import { uuidV7 } from "../deterministic/uuid-v7.js";
import { commitDeterministicSequenceNumber } from "../deterministic/sequence.js";
import { timestamp } from "../deterministic/timestamp.js";
import type { Lix } from "../lix/open-lix.js";
import { handleStateDelete } from "./schema.js";
import { commitIsAncestorOf } from "../query-filter/commit-is-ancestor-of.js";
import type { LixCommitEdge } from "../commit/schema.js";
import { updateStateCacheV2 } from "./cache/update-state-cache.js";
import { updateUntrackedState } from "./untracked/update-untracked-state.js";

/**
 * Context for tracking all changes and metadata for a specific version during commit.
 *
 * This consolidates all version-related data into a single structure to simplify
 * state management and reduce the number of passes over the data.
 */
type VersionCommitContext = {
	/** Original changes from the transaction table for this version */
	originalChanges: any[];
	/** Generated changes (changesets, commits, edges, etc.) for this version */
	generatedChanges: LixChangeRaw[];
	/** Entities to delete from the state */
	deletions: Array<{ pk: string; timestamp: string }>;
	/** The commit ID created for this version, null until generated */
	commitId: string | null;
};

/**
 * Commits all transaction changes to permanent storage.
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
	// Create a single timestamp for the entire transaction
	const transactionTimestamp = timestamp({ lix: args.lix });

	// Query all transaction changes
	const allTransactionChanges = executeSync({
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
				"untracked",
			]),
	});

	// Separate tracked and untracked changes
	const trackedChangesByVersion = new Map<string, any[]>();
	const untrackedChanges: any[] = [];

	for (const change of allTransactionChanges) {
		if (change.untracked === 1) {
			untrackedChanges.push(change);
		} else {
			if (!trackedChangesByVersion.has(change.version_id)) {
				trackedChangesByVersion.set(change.version_id, []);
			}
			trackedChangesByVersion.get(change.version_id)!.push(change);
		}
	}

	// Process all untracked changes immediately
	for (const change of untrackedChanges) {
		updateUntrackedState({
			lix: args.lix,
			change: {
				id: change.id,
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				file_id: change.file_id,
				plugin_key: change.plugin_key,
				snapshot_content: change.snapshot_content,
				schema_version: change.schema_version,
				created_at: change.created_at,
			},
			version_id: change.version_id,
		});
	}

	// Create version contexts from tracked changes
	const versionContexts = new Map<string, VersionCommitContext>();
	let hasNonGlobalChanges = false;

	for (const [version_id, changes] of trackedChangesByVersion) {
		if (version_id !== "global") {
			hasNonGlobalChanges = true;
		}
		versionContexts.set(version_id, {
			originalChanges: changes,
			generatedChanges: [],
			deletions: [],
			commitId: null,
		});
	}

	// If any non-global version has changes, global needs a commit too
	if (hasNonGlobalChanges && !versionContexts.has("global")) {
		versionContexts.set("global", {
			originalChanges: [],
			generatedChanges: [],
			deletions: [],
			commitId: null,
		});
	}

	// Pass 1: Process all non-global versions
	const versionChangesToInclude: Array<{
		id: string;
		entity_id: string;
		schema_key: string;
		file_id: string;
	}> = [];

	for (const [version_id, context] of versionContexts) {
		if (version_id === "global") continue;
		
		const result = generateChangeControlChanges(
			args.lix,
			transactionTimestamp,
			version_id,
			context.originalChanges,
			undefined
		);
		context.commitId = result.commitId;
		context.deletions.push(...result.deletions);

		// Aggregate generated changes into appropriate version contexts
		for (const [versionKey, changes] of result.changesByVersion.entries()) {
			if (!versionContexts.has(versionKey)) {
				versionContexts.set(versionKey, {
					originalChanges: [],
					generatedChanges: [],
					deletions: [],
					commitId: null,
				});
			}
			versionContexts.get(versionKey)!.generatedChanges.push(...changes);
		}
		
		// Collect version changes for global commit
		const versionChanges = result.changesByVersion.get("global") || [];
		for (const change of versionChanges) {
			if (change.schema_key === "lix_version" && change.entity_id !== "global") {
				versionChangesToInclude.push({
					id: change.id,
					entity_id: change.entity_id,
					schema_key: change.schema_key,
					file_id: change.file_id,
				});
			}
		}
	}
	
	// Pass 2: Process global version (if it has original changes or version changes were created)
	const globalContext = versionContexts.get("global");
	if (globalContext) {
		const result = generateChangeControlChanges(
			args.lix,
			transactionTimestamp,
			"global",
			globalContext.originalChanges,
			globalContext.originalChanges.length === 0 ? versionChangesToInclude : undefined
		);
		globalContext.commitId = result.commitId;
		globalContext.deletions.push(...result.deletions);

		// Add generated changes back to global context
		const globalChanges = result.changesByVersion.get("global");
		if (globalChanges) {
			globalContext.generatedChanges.push(...globalChanges);
		}
	}

	// Collect all changes and deletions from contexts
	const allChangesToFlush: LixChangeRaw[] = [];
	const allDeletions: Array<{ pk: string; timestamp: string }> = [];

	for (const context of versionContexts.values()) {
		// Add original changes (need to transform to LixChangeRaw format)
		for (const change of context.originalChanges) {
			allChangesToFlush.push({
				id: change.id,
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				schema_version: change.schema_version,
				file_id: change.file_id,
				plugin_key: change.plugin_key,
				created_at: change.created_at,
				snapshot_content: change.snapshot_content,
			});
		}
		// Add generated changes
		allChangesToFlush.push(...context.generatedChanges);
		// Collect deletions
		allDeletions.push(...context.deletions);
	}

	// Apply all deletions
	for (const deletion of allDeletions) {
		handleStateDelete(args.lix, deletion.pk, deletion.timestamp);
	}

	// Single batch insert of all tracked changes into the change table
	if (allChangesToFlush.length > 0) {
		executeSync({
			lix: args.lix,
			// @ts-expect-error - snapshot_content is a JSON string, not parsed object
			query: args.lix.db.insertInto("change").values(allChangesToFlush),
		});
	}

	// Clear the transaction table after committing
	executeSync({
		lix: args.lix,
		query: (
			args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>
		).deleteFrom("internal_change_in_transaction"),
	});

	// Update cache entries for each version
	for (const [version_id, context] of versionContexts) {
		// Skip if no commit was created for this version
		if (!context.commitId) continue;

		// Combine original and generated changes for this version
		const allChangesForVersion = [
			...context.originalChanges.map((change: any) => ({
				id: change.id,
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				schema_version: change.schema_version,
				file_id: change.file_id,
				plugin_key: change.plugin_key,
				snapshot_content: change.snapshot_content,
				created_at: change.created_at,
			})),
			...context.generatedChanges,
		];

		updateStateCacheV2({
			lix: args.lix,
			changes: allChangesForVersion,
			commit_id: context.commitId,
			version_id: version_id,
		});

		// Delete untracked state for any tracked changes that were committed
		// This handles the transition from untracked to tracked state
		if (context.originalChanges.length > 0) {
			// Collect unique entities to delete from untracked
			const untrackedToDelete = new Set<string>();
			for (const change of context.originalChanges) {
				const key = `${change.entity_id}|${change.schema_key}|${change.file_id}|${version_id}`;
				untrackedToDelete.add(key);
			}

			// Delete untracked state for these entities
			for (const key of untrackedToDelete) {
				const [entity_id, schema_key, file_id, vid] = key.split("|");
				executeSync({
					lix: args.lix,
					query: (args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
						.deleteFrom("internal_state_all_untracked")
						.where("entity_id", "=", entity_id!)
						.where("schema_key", "=", schema_key!)
						.where("file_id", "=", file_id!)
						.where("version_id", "=", vid!),
				});
			}
		}

		// Track files that need lixcol cache updates
		const fileChanges = new Map<
			string,
			{ change_id: string; created_at: string }
		>();

		// Track files that need lixcol cache updates
		for (const change of context.originalChanges) {
			// IDEALLY WE WOULD HAVE A BEFORE_COMMIT HOOK
			// THAT LIX EXPOSES TO KEEP THE LOGIC IN THE FILE STUFF
			//
			//
			// Track the latest change for each file (excluding "lix" internal file)
			if (change.file_id && change.file_id !== "lix") {
				// We want the latest change for each file (by created_at)
				const existing = fileChanges.get(change.file_id);
				if (!existing || change.created_at > existing.created_at) {
					fileChanges.set(change.file_id, {
						change_id: change.id,
						created_at: change.created_at,
					});
				}
			}
		}

		// Update file lixcol cache for all files that had changes
		// We have all the data we need from the commit, no need to recompute
		if (fileChanges.size > 0) {
			// Separate files into deletions and updates
			const filesToDelete: string[] = [];
			const filesToUpdate: Array<{
				file_id: string;
				version_id: string;
				latest_change_id: string;
				latest_commit_id: string;
				created_at: string;
				updated_at: string;
			}> = [];

			for (const [fileId, { change_id, created_at }] of fileChanges) {
				// Check if this is a deletion (file descriptor with null snapshot content)
				const changeData = context.originalChanges.find(
					(c: any) => c.id === change_id
				);
				const isDeleted =
					changeData?.schema_key === "lix_file_descriptor" &&
					!changeData.snapshot_content;

				if (isDeleted) {
					filesToDelete.push(fileId);
				} else {
					filesToUpdate.push({
						file_id: fileId,
						version_id: version_id,
						latest_change_id: change_id,
						latest_commit_id: context.commitId!,
						created_at: created_at,
						updated_at: created_at,
					});
				}
			}

			// Delete cache entries for deleted files
			if (filesToDelete.length > 0) {
				executeSync({
					lix: args.lix,
					query: (args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
						.deleteFrom("internal_file_lixcol_cache")
						.where("version_id", "=", version_id)
						.where("file_id", "in", filesToDelete),
				});
			}

			// Batch insert/update cache entries for existing files
			if (filesToUpdate.length > 0) {
				executeSync({
					lix: args.lix,
					query: (args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
						.insertInto("internal_file_lixcol_cache")
						.values(filesToUpdate)
						.onConflict((oc) =>
							oc.columns(["file_id", "version_id"]).doUpdateSet({
								latest_change_id: sql`excluded.latest_change_id`,
								latest_commit_id: sql`excluded.latest_commit_id`,
								// Don't update created_at - preserve the original
								updated_at: sql`excluded.updated_at`,
							})
						),
				});
			}
		}
	}

	commitDeterministicSequenceNumber({
		lix: args.lix,
		timestamp: transactionTimestamp,
	});

	//* Emit state commit hook after transaction is successfully committed
	//* must come last to ensure that subscribers see the changes
	// Include ALL changes: tracked, untracked, and generated
	const allChangesForHook: any[] = [
		...allChangesToFlush, // All tracked changes (original + generated)
		...untrackedChanges, // Untracked changes already have the untracked: 1 flag
	];
	args.lix.hooks._emit("state_commit", { changes: allChangesForHook });

	return args.lix.sqlite.sqlite3.capi.SQLITE_OK;
}

/**
 * Generates all change control changes (changesets, commits, edges, etc.) for a transaction.
 *
 * This function:
 * 1. Generates change data for a new changeset and commit
 * 2. Generates a commit edge change linking the previous commit to the new one
 * 3. Generates an updated version change pointing to the new commit
 * 4. Generates changeset element changes for each change
 * 5. Generates working changeset element changes for user data changes
 *
 * @param lix - Lix instance
 * @param _currentTime - Current timestamp
 * @param version_id - The version to create the changeset for
 * @param changes - Array of changes to include in the changeset
 * @returns Object containing the new commit ID and all generated changes to be inserted
 */
function generateChangeControlChanges(
	lix: Pick<Lix, "sqlite" | "db" | "hooks">,
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
	>[],
	versionChangesToInclude?: Array<{
		id: string;
		entity_id: string;
		schema_key: string;
		file_id: string;
	}>
): {
	commitId: string;
	changesByVersion: Map<string, LixChangeRaw[]>;
	deletions: Array<{ pk: string; timestamp: string }>;
} {
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
	const changesByVersion = new Map<string, LixChangeRaw[]>();
	const deletions: Array<{ pk: string; timestamp: string }> = [];

	// Helper to add a change to the appropriate version
	const addChange = (versionId: string, change: LixChangeRaw) => {
		if (!changesByVersion.has(versionId)) {
			changesByVersion.set(versionId, []);
		}
		changesByVersion.get(versionId)!.push(change);
	};

	// Get the version record from resolved state view
	const versionRows = executeSync({
		lix: lix,
		query: db
			.selectFrom("internal_resolved_state_all")
			.where("schema_key", "=", "lix_version")
			.where("entity_id", "=", version_id)
			.select("snapshot_content")
			.limit(1),
	});

	if (versionRows.length === 0 || !versionRows[0]?.snapshot_content) {
		throw new Error(`Version with id '${version_id}' not found.`);
	}

	const mutatedVersion = JSON.parse(versionRows[0].snapshot_content) as any;
	const nextChangeSetId = nanoId({
		lix,
	});

	// TODO: Don't create change author for the changeset itself.
	// Change authors should be associated with commit entities when implemented.
	// See: https://github.com/opral/lix-sdk/issues/359

	// Create a new commit that points to the new change set
	const nextCommitId = uuidV7({
		lix,
	});

	// Generate IDs for the core entities that we'll need
	const changeSetChangeId = uuidV7({ lix });
	const commitChangeId = uuidV7({ lix });
	const commitEdgeChangeId = uuidV7({ lix });
	const versionChangeId = uuidV7({ lix });

	// Generate all core entities (changeset, commit, edge, version)
	// All change control entities belong to the global version
	addChange("global", {
		id: changeSetChangeId,
		entity_id: nextChangeSetId,
		schema_key: "lix_change_set",
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_content: JSON.stringify({
			id: nextChangeSetId,
			metadata: null,
		} satisfies LixChangeSet),
		schema_version: LixChangeSetSchema["x-lix-version"],
		created_at: _currentTime,
	});

	addChange("global", {
		id: commitChangeId,
		entity_id: nextCommitId,
		schema_key: "lix_commit",
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_content: JSON.stringify({
			id: nextCommitId,
			change_set_id: nextChangeSetId,
		}),
		schema_version: "1.0",
		created_at: _currentTime,
	});

	addChange("global", {
		id: commitEdgeChangeId,
		entity_id: `${mutatedVersion.commit_id}~${nextCommitId}`,
		schema_key: "lix_commit_edge",
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_content: JSON.stringify({
			parent_id: mutatedVersion.commit_id,
			child_id: nextCommitId,
		} satisfies LixCommitEdge),
		schema_version: "1.0",
		created_at: _currentTime,
	});

	const versionSnapshot = {
		...mutatedVersion,
		commit_id: nextCommitId,
	} satisfies LixVersion;
	// Version updates are always stored in global, regardless of which version is being mutated
	addChange("global", {
		id: versionChangeId,
		entity_id: mutatedVersion.id,
		schema_key: "lix_version",
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_content: JSON.stringify(versionSnapshot),
		schema_version: LixVersionSchema["x-lix-version"],
		created_at: _currentTime,
	});

	// If we're generating a commit for global, include any passed version updates in the changeset
	const additionalVersionChanges: typeof coreChanges = [];
	if (
		version_id === "global" &&
		versionChangesToInclude &&
		versionChangesToInclude.length > 0
	) {
		// Add these version changes to the global changeset
		for (const versionChange of versionChangesToInclude) {
			additionalVersionChanges.push({
				id: versionChange.id,
				entity_id: versionChange.entity_id,
				schema_key: versionChange.schema_key,
				file_id: versionChange.file_id,
			});
		}
	}

	// Create changeset elements for all changes plus the core entities
	const coreChanges = [
		{
			id: changeSetChangeId,
			entity_id: nextChangeSetId,
			schema_key: "lix_change_set",
			file_id: "lix",
		},
		{
			id: commitChangeId,
			entity_id: nextCommitId,
			schema_key: "lix_commit",
			file_id: "lix",
		},
		{
			id: commitEdgeChangeId,
			entity_id: `${mutatedVersion.commit_id}~${nextCommitId}`,
			schema_key: "lix_commit_edge",
			file_id: "lix",
		},
		{
			id: versionChangeId,
			entity_id: mutatedVersion.id,
			schema_key: "lix_version",
			file_id: "lix",
		},
	];

	// // If we created a global version change, add it to core changes
	// if (globalVersionChangeId) {
	// 	coreChanges.push({
	// 		id: globalVersionChangeId,
	// 		entity_id: "global",
	// 		schema_key: "lix_version",
	// 		file_id: "lix",
	// 	});
	// }

	const changesToProcess = [
		...changes,
		...coreChanges,
		...additionalVersionChanges,
	];

	// Generate all changeset elements
	for (const change of changesToProcess) {
		addChange("global", {
			id: uuidV7({ lix }),
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
			created_at: _currentTime,
		});
	}

	// Create/update working change set element for user data changes
	// Get the working commit and its change set from resolved state
	const [workingCommitRow] = executeSync({
		lix,
		query: db
			.selectFrom("internal_resolved_state_all")
			.where("schema_key", "=", "lix_commit")
			.where("entity_id", "=", mutatedVersion.working_commit_id)
			.select("snapshot_content")
			.limit(1),
	});

	if (!workingCommitRow?.snapshot_content) {
		throw new Error(
			`Working commit not found: ${mutatedVersion.working_commit_id}`
		);
	}

	const workingCommit = JSON.parse(workingCommitRow.snapshot_content) as any;
	const workingChangeSetId = workingCommit.change_set_id;

	// TODO skipping lix internal entities is likely undesired.
	// Skip lix internal entities (change sets, edges, etc.)

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
		const deletionChanges: typeof userChanges = [];
		const nonDeletionChanges: typeof userChanges = [];

		for (const change of userChanges) {
			const parsedSnapshot = change.snapshot_content
				? JSON.parse(change.snapshot_content)
				: null;
			const isDeletion =
				!parsedSnapshot || parsedSnapshot.snapshot_id === "no-content";

			if (isDeletion) {
				deletionChanges.push(change);
			} else {
				nonDeletionChanges.push(change);
			}
		}

		// Step 1: Batch check for entities at checkpoint (for deletions)
		const entitiesAtCheckpoint = new Set<string>();
		if (deletionChanges.length > 0) {
			// Get the checkpoint commit ID once
			const checkpointCommitResult = executeSync({
				lix,
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
					lix,
					query: db
						.selectFrom("state_history")
						.where("depth", "=", 0)
						.where("commit_id", "=", checkpointCommitId)
						.where((eb) =>
							eb.or(
								deletionChanges.map((change) =>
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
		}

		// Step 2: Batch find all existing working change set elements to delete
		const existingEntities = executeSync({
			lix,
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

		// Step 3: Collect all existing working change set elements to delete
		for (const existing of existingEntities) {
			deletions.push({ pk: existing._pk, timestamp: _currentTime });
		}

		// Step 4: Generate new working change set elements

		// Add deletion changes that existed at checkpoint
		for (const deletion of deletionChanges) {
			const key = `${deletion.entity_id}|${deletion.schema_key}|${deletion.file_id}`;
			if (entitiesAtCheckpoint.has(key)) {
				addChange("global", {
					id: uuidV7({ lix }),
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
					created_at: _currentTime,
				});
			}
		}

		// Add all non-deletions
		for (const change of nonDeletionChanges) {
			addChange("global", {
				id: uuidV7({ lix }),
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
				created_at: _currentTime,
			});
		}
	}

	return { commitId: nextCommitId, changesByVersion, deletions };
}
