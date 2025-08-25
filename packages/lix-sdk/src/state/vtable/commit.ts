import { type Kysely, sql } from "kysely";
import {
	type LixChangeSet,
	type LixChangeSetElement,
	LixChangeSetElementSchema,
	LixChangeSetSchema,
} from "../../change-set/schema.js";
import type { LixChangeRaw } from "../../change/schema.js";
import { executeSync } from "../../database/execute-sync.js";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import { LixVersionSchema, type LixVersion } from "../../version/schema.js";
import { nanoId } from "../../deterministic/index.js";
import { uuidV7 } from "../../deterministic/uuid-v7.js";
import { commitDeterministicSequenceNumber } from "../../deterministic/sequence.js";
import { timestamp } from "../../deterministic/timestamp.js";
import type { Lix } from "../../lix/open-lix.js";
import { commitIsAncestorOf } from "../../query-filter/commit-is-ancestor-of.js";
import type { LixCommitEdge } from "../../commit/schema.js";
import { updateStateCache } from "../cache/update-state-cache.js";
import { updateUntrackedState } from "../untracked/update-untracked-state.js";

/**
 * Commits all transaction changes to permanent storage.
 *
 * This function handles the COMMIT stage of the state mutation flow. It takes
 * all changes accumulated in the transaction table (internal_change_in_transaction),
 * creates commits for each version with data changes, and then creates a global
 * commit containing all the graph metadata (commits, changesets, edges, version updates).
 *
 * @example
 * // After accumulating changes via insertTransactionState
 * commit({ lix });
 * // All pending changes are now persisted
 */
export function commit(args: {
	lix: Pick<Lix, "sqlite" | "db" | "hooks">;
}): number {
	const transactionTimestamp = timestamp({ lix: args.lix });
	const db = args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Collect per-version snapshots once to avoid duplicate queries in this commit
	const versionSnapshots = new Map<string, LixVersion>();

	// Query all transaction changes
	const allTransactionChanges = executeSync({
		lix: args.lix,
		query: db
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

	// Prepare to collect all changes
	const allChangesToFlush: LixChangeRaw[] = [];
	// Collect change_set_elements separately to avoid filtering later
	const changeSetElements: LixChangeRaw[] = [];
	// Collect all change_authors separately (all are global since changes are global)
	const allChangeAuthors: LixChangeRaw[] = [];

	// Track metadata for each version that gets a commit
	const versionMetadata = new Map<
		string,
		{
			commitId: string;
			changeSetId: string;
			previousCommitId: string;
		}
	>();

	// Step 1: Create commits and changesets for each version with changes
	for (const [version_id, changes] of trackedChangesByVersion) {
		if (changes.length === 0) continue;

		// Load version snapshot once
		const versionRows = executeSync({
			lix: args.lix,
			query: db
				.selectFrom("internal_resolved_state_all")
				.where("schema_key", "=", "lix_version")
				.where("entity_id", "=", version_id)
				.where("snapshot_content", "is not", null)
				.select("snapshot_content")
				.limit(1),
		});

		if (versionRows.length === 0 || !versionRows[0]?.snapshot_content) {
			throw new Error(`Version with id '${version_id}' not found.`);
		}

		const versionData = JSON.parse(
			versionRows[0].snapshot_content
		) as LixVersion;
		versionSnapshots.set(version_id, versionData);
		const changeSetId = uuidV7({ lix: args.lix });
		const commitId = uuidV7({ lix: args.lix });

		// Store metadata for later use
		versionMetadata.set(version_id, {
			commitId,
			changeSetId,
			previousCommitId: versionData.commit_id,
		});
	}

	// Step 2: If we have any commits but global doesn't have one yet, create global commit
	if (versionMetadata.size > 0 && !versionMetadata.has("global")) {
		// Load global version snapshot once
		const globalVersionRows = executeSync({
			lix: args.lix,
			query: db
				.selectFrom("internal_resolved_state_all")
				.where("schema_key", "=", "lix_version")
				.where("entity_id", "=", "global")
				.where("snapshot_content", "is not", null)
				.select("snapshot_content")
				.limit(1),
		});

		if (
			globalVersionRows.length === 0 ||
			!globalVersionRows[0]?.snapshot_content
		) {
			throw new Error(`Global version not found.`);
		}

		const globalVersion = JSON.parse(
			globalVersionRows[0].snapshot_content
		) as LixVersion;
		versionSnapshots.set("global", globalVersion);
		const globalChangeSetId = nanoId({ lix: args.lix });
		const globalCommitId = uuidV7({ lix: args.lix });

		// Store global metadata
		versionMetadata.set("global", {
			commitId: globalCommitId,
			changeSetId: globalChangeSetId,
			previousCommitId: globalVersion.commit_id,
		});
	}

	// Get active accounts for change_author records
	const activeAccounts = executeSync({
		lix: args.lix,
		query: db
			.selectFrom("internal_resolved_state_all")
			.where("schema_key", "=", "lix_active_account")
			.where("version_id", "=", "global")
			.where("snapshot_content", "is not", null)
			.select(
				sql`json_extract(snapshot_content, '$.account_id')`.as("account_id")
			),
	});

	// Step 3: Process each version's changes completely
	for (const [version_id, changes] of trackedChangesByVersion) {
		if (changes.length === 0) continue;

		const meta = versionMetadata.get(version_id)!;
		const changeSetId = meta.changeSetId;

		// Add user data changes
		for (const change of changes) {
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

		// Create change_author records for each change and each active account
		// These are global metadata since changes are global
		for (const change of changes) {
			for (const account of activeAccounts) {
				const changeAuthorId = uuidV7({ lix: args.lix });
				const authorChange = {
					id: changeAuthorId,
					entity_id: `${change.id}~${account.account_id}`,
					schema_key: "lix_change_author",
					schema_version: "1.0",
					file_id: "lix",
					plugin_key: "lix_own_entity",
					created_at: transactionTimestamp,
					snapshot_content: JSON.stringify({
						change_id: change.id,
						account_id: account.account_id,
					}),
				};
				allChangeAuthors.push(authorChange);
			}
		}

		// Create changeset elements for all changes of this version
		// These are global metadata - collect them separately
		for (const change of changes) {
			const elementId = uuidV7({ lix: args.lix });
			const changeSetElement = {
				id: elementId,
				entity_id: `${changeSetId}~${change.id}`,
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
				created_at: transactionTimestamp,
			};
			// Add to separate collection to avoid filtering later
			changeSetElements.push(changeSetElement);
		}
	}

	// Step 4: Handle working changeset updates for each version
	for (const [version_id, changes] of trackedChangesByVersion) {
		/**
		 * IMPORTANT: Skip updating working change set elements for the global version.
		 *
		 * See https://github.com/opral/lix-sdk/issues/364#issuecomment-3218464923
		 *
		 * Rationale:
		 * - We will make working CSE materialization lazy in a future iteration.
		 * - For now, avoid mutating global working CSE at commit-time to keep the
		 *   commit path simpler and cheaper.
		 * - If someone needs working CSE for global and to checkpoint global, this
		 *   will be supported by the lazy materializer later.
		 */
		if (version_id === "global") {
			continue;
		}
		if (changes.length === 0) continue;

		// Get version data to access working_commit_id (from local snapshot map)
		const versionData = versionSnapshots.get(version_id)!;

		const [workingCommitRow] = executeSync({
			lix: args.lix,
			query: db
				.selectFrom("internal_resolved_state_all")
				.where("schema_key", "=", "lix_commit")
				.where("entity_id", "=", versionData.working_commit_id)
				.where("snapshot_content", "is not", null)
				.select("snapshot_content")
				.limit(1),
		});

		if (workingCommitRow?.snapshot_content) {
			const workingCommit = JSON.parse(
				workingCommitRow.snapshot_content
			) as any;
			const workingChangeSetId = workingCommit.change_set_id;

			// Filter out lix internal entities for working changeset
			const userChanges = changes.filter(
				(change) =>
					change.schema_key !== "lix_change_set" &&
					change.schema_key !== "lix_change_set_edge" &&
					change.schema_key !== "lix_change_set_element" &&
					change.schema_key !== "lix_version"
			);

			if (userChanges.length > 0) {
				// Handle deletions and updates for working changeset elements
				const deletionChanges = userChanges.filter((change) => {
					const parsedSnapshot = change.snapshot_content
						? JSON.parse(change.snapshot_content)
						: null;
					return !parsedSnapshot || parsedSnapshot.snapshot_id === "no-content";
				});

				const nonDeletionChanges = userChanges.filter((change) => {
					const parsedSnapshot = change.snapshot_content
						? JSON.parse(change.snapshot_content)
						: null;
					return parsedSnapshot && parsedSnapshot.snapshot_id !== "no-content";
				});

				// Check for entities at checkpoint (for deletions)
				const entitiesAtCheckpoint = new Set<string>();
				if (deletionChanges.length > 0) {
					const checkpointCommitResult = executeSync({
						lix: args.lix,
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
									{ id: versionData.commit_id },
									{ includeSelf: true, depth: 1 }
								)
							)
							.select("commit.id")
							.limit(1),
					});

					const checkpointCommitId = checkpointCommitResult[0]?.id;
					if (checkpointCommitId) {
						const checkpointEntities = executeSync({
							lix: args.lix,
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

						for (const entity of checkpointEntities) {
							entitiesAtCheckpoint.add(
								`${entity.entity_id}|${entity.schema_key}|${entity.file_id}`
							);
						}
					}
				}

				// Find existing working change set elements to delete
				const existingEntities = executeSync({
					lix: args.lix,
					query: db
						.selectFrom("internal_resolved_state_all")
						.select([
							"_pk",
							"entity_id",
							sql`json_extract(snapshot_content, '$.entity_id')`.as(
								"element_entity_id"
							),
							sql`json_extract(snapshot_content, '$.schema_key')`.as(
								"element_schema_key"
							),
							sql`json_extract(snapshot_content, '$.file_id')`.as(
								"element_file_id"
							),
						])
						.where("entity_id", "like", `${workingChangeSetId}~%`)
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

				// Delete existing working change set elements as untracked changes
				for (const existing of existingEntities) {
					// The entity_id for a change_set_element is "${change_set_id}~${change_id}"
					// We already queried for entity_id LIKE '${workingChangeSetId}~%'
					// So existing.entity_id already contains the correct format
					const entityIdForDeletion = existing.entity_id;
					// Handle working changeset elements as untracked
					updateUntrackedState({
						lix: args.lix,
						change: {
							id: uuidV7({ lix: args.lix }),
							entity_id: entityIdForDeletion,
							schema_key: "lix_change_set_element",
							file_id: "lix",
							plugin_key: "lix_own_entity",
							snapshot_content: null, // null indicates deletion
							schema_version: LixChangeSetElementSchema["x-lix-version"],
							created_at: transactionTimestamp,
						},
						version_id: "global",
					});
				}

				// Add deletion changes that existed at checkpoint as untracked
				for (const deletion of deletionChanges) {
					const key = `${deletion.entity_id}|${deletion.schema_key}|${deletion.file_id}`;
					if (entitiesAtCheckpoint.has(key)) {
						// Handle working changeset elements as untracked
						updateUntrackedState({
							lix: args.lix,
							change: {
								id: uuidV7({ lix: args.lix }),
								entity_id: `${workingChangeSetId}~${deletion.id}`,
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
								created_at: transactionTimestamp,
							},
							version_id: "global",
						});
					}
				}

				// Add all non-deletions as untracked
				for (const change of nonDeletionChanges) {
					// Handle working changeset elements as untracked
					updateUntrackedState({
						lix: args.lix,
						change: {
							id: uuidV7({ lix: args.lix }),
							entity_id: `${workingChangeSetId}~${change.id}`,
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
							created_at: transactionTimestamp,
						},
						version_id: "global",
					});
				}
			}
		}
	}

	const globalChanges: LixChangeRaw[] = [];

	// Step 5: Generate global metadata commit (if any version had changes)
	if (versionMetadata.size > 0) {
		// Check if global needs its own commit or can reuse existing
		const needsNewGlobalCommit = !versionMetadata.has("global");

		if (needsNewGlobalCommit) {
			// Get global version info
			const globalVersionRows = executeSync({
				lix: args.lix,
				query: db
					.selectFrom("internal_resolved_state_all")
					.where("schema_key", "=", "lix_version")
					.where("entity_id", "=", "global")
					.where("snapshot_content", "is not", null)
					.select("snapshot_content")
					.limit(1),
			});

			if (
				globalVersionRows.length === 0 ||
				!globalVersionRows[0]?.snapshot_content
			) {
				throw new Error(`Global version not found.`);
			}

			const globalVersion = JSON.parse(
				globalVersionRows[0].snapshot_content
			) as LixVersion;
			const globalChangeSetId = nanoId({ lix: args.lix });
			const globalCommitId = uuidV7({ lix: args.lix });

			// Store global metadata
			versionMetadata.set("global", {
				commitId: globalCommitId,
				changeSetId: globalChangeSetId,
				previousCommitId: globalVersion.commit_id,
			});
		}

		const globalMeta = versionMetadata.get("global")!;

		// Add all change_authors to globalChanges (they're global metadata)
		globalChanges.push(...allChangeAuthors);

		// Add metadata for all versions (including global)
		for (const [version_id, meta] of versionMetadata) {
			// Add the changeset entity
			const changeSetChangeId = uuidV7({ lix: args.lix });
			globalChanges.push({
				id: changeSetChangeId,
				entity_id: meta.changeSetId,
				schema_key: "lix_change_set",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					id: meta.changeSetId,
					metadata: null,
				} satisfies LixChangeSet),
				schema_version: LixChangeSetSchema["x-lix-version"],
				created_at: transactionTimestamp,
			});

			// Add the commit entity
			const commitChangeId = uuidV7({ lix: args.lix });
			globalChanges.push({
				id: commitChangeId,
				entity_id: meta.commitId,
				schema_key: "lix_commit",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					id: meta.commitId,
					change_set_id: meta.changeSetId,
				}),
				schema_version: "1.0",
				created_at: transactionTimestamp,
			});

			// Add commit edge
			const edgeChangeId = uuidV7({ lix: args.lix });
			globalChanges.push({
				id: edgeChangeId,
				entity_id: `${meta.previousCommitId}~${meta.commitId}`,
				schema_key: "lix_commit_edge",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					parent_id: meta.previousCommitId,
					child_id: meta.commitId,
				} satisfies LixCommitEdge),
				schema_version: "1.0",
				created_at: transactionTimestamp,
			});

			// Add version update
			const versionChangeId = uuidV7({ lix: args.lix });

			// Get the current version snapshot to update (use local snapshot)
			const currentVersion = versionSnapshots.get(version_id)!;
			globalChanges.push({
				id: versionChangeId,
				entity_id: version_id,
				schema_key: "lix_version",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					...currentVersion,
					commit_id: meta.commitId,
				} satisfies LixVersion),
				schema_version: LixVersionSchema["x-lix-version"],
				created_at: transactionTimestamp,
			});
			// No module-level cache to update; we only reuse within this function
		}

		// Create changeset elements for all global metadata (these belong to global's changeset)
		for (const change of globalChanges) {
			const elementId = uuidV7({ lix: args.lix });
			changeSetElements.push({
				id: elementId,
				entity_id: `${globalMeta.changeSetId}~${change.id}`,
				schema_key: "lix_change_set_element",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					change_set_id: globalMeta.changeSetId,
					change_id: change.id,
					schema_key: change.schema_key,
					file_id: change.file_id,
					entity_id: change.entity_id,
				} satisfies LixChangeSetElement),
				schema_version: LixChangeSetElementSchema["x-lix-version"],
				created_at: transactionTimestamp,
			});
		}

		// Add ALL change_set_element records to globalChanges
		// since they are all global metadata that should be cached at global level
		globalChanges.push(...changeSetElements);

		// Create change_set_elements for the change_set_element changes themselves
		// This ensures the materializer can find them
		const metaChangeSetElements: LixChangeRaw[] = [];
		for (const elementChange of changeSetElements) {
			const metaElementId = uuidV7({ lix: args.lix });
			metaChangeSetElements.push({
				id: metaElementId,
				entity_id: `${globalMeta.changeSetId}~${elementChange.id}`,
				schema_key: "lix_change_set_element",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					change_set_id: globalMeta.changeSetId,
					change_id: elementChange.id,
					schema_key: elementChange.schema_key,
					file_id: elementChange.file_id,
					entity_id: elementChange.entity_id,
				} satisfies LixChangeSetElement),
				schema_version: LixChangeSetElementSchema["x-lix-version"],
				created_at: transactionTimestamp,
			});
		}

		// Add the meta change_set_elements to globalChanges as well
		globalChanges.push(...metaChangeSetElements);

		// Add all global changes to flush
		allChangesToFlush.push(...globalChanges);

		// Note: ALL changeset elements are now in globalChanges since they're all global metadata
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
		query: db.deleteFrom("internal_change_in_transaction"),
	});

	// Update cache entries for each version
	for (const [version_id, meta] of versionMetadata) {
		// Collect all changes for this version
		const versionChanges = trackedChangesByVersion.get(version_id) || [];
		const allChangesForVersion = [
			...versionChanges.map((change: any) => ({
				id: change.id,
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				schema_version: change.schema_version,
				file_id: change.file_id,
				plugin_key: change.plugin_key,
				snapshot_content: change.snapshot_content,
				created_at: change.created_at,
			})),
			// Include all global changes only for global version
			// (change_authors are now in globalChanges)
			...(version_id === "global" ? globalChanges : []),
		];

		updateStateCache({
			lix: args.lix,
			changes: allChangesForVersion,
			commit_id: meta.commitId,
			version_id: version_id,
		});

		// Delete untracked state for any tracked changes that were committed
		if (versionChanges.length > 0) {
			const untrackedToDelete = new Set<string>();
			for (const change of versionChanges) {
				const key = `${change.entity_id}|${change.schema_key}|${change.file_id}|${version_id}`;
				untrackedToDelete.add(key);
			}

			for (const key of untrackedToDelete) {
				const [entity_id, schema_key, file_id, vid] = key.split("|");
				executeSync({
					lix: args.lix,
					query: db
						.deleteFrom("internal_state_all_untracked")
						.where("entity_id", "=", entity_id!)
						.where("schema_key", "=", schema_key!)
						.where("file_id", "=", file_id!)
						.where("version_id", "=", vid!),
				});
			}
		}

		// Update file lixcol cache (existing logic)
		const fileChanges = new Map<
			string,
			{ change_id: string; created_at: string }
		>();
		for (const change of versionChanges) {
			if (change.file_id && change.file_id !== "lix") {
				const existing = fileChanges.get(change.file_id);
				if (!existing || change.created_at > existing.created_at) {
					fileChanges.set(change.file_id, {
						change_id: change.id,
						created_at: change.created_at,
					});
				}
			}
		}

		if (fileChanges.size > 0) {
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
				const changeData = versionChanges.find((c: any) => c.id === change_id);
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
						latest_commit_id: meta.commitId,
						created_at: created_at,
						updated_at: created_at,
					});
				}
			}

			if (filesToDelete.length > 0) {
				executeSync({
					lix: args.lix,
					query: db
						.deleteFrom("internal_file_lixcol_cache")
						.where("version_id", "=", version_id)
						.where("file_id", "in", filesToDelete),
				});
			}

			if (filesToUpdate.length > 0) {
				executeSync({
					lix: args.lix,
					query: db
						.insertInto("internal_file_lixcol_cache")
						.values(filesToUpdate)
						.onConflict((oc) =>
							oc.columns(["file_id", "version_id"]).doUpdateSet({
								latest_change_id: sql`excluded.latest_change_id`,
								latest_commit_id: sql`excluded.latest_commit_id`,
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

	// Emit state commit hook after transaction is successfully committed
	const allChangesForHook: any[] = [...allChangesToFlush, ...untrackedChanges];
	args.lix.hooks._emit("state_commit", { changes: allChangesForHook });
	return args.lix.sqlite.sqlite3.capi.SQLITE_OK;
}
