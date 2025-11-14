import { sql } from "kysely";
import {
	type LixChangeSetElement,
	LixChangeSetElementSchema,
} from "../../change-set/schema-definition.js";
import { type LixVersion } from "../../version/schema-definition.js";
import { uuidV7Sync } from "../../engine/functions/uuid-v7.js";
import { commitSequenceNumberSync } from "../../engine/functions/sequence.js";
import type { StateCommitChange } from "../../hooks/create-hooks.js";
import { getTimestampSync } from "../../engine/functions/timestamp.js";
import type { LixEngine } from "../../engine/boot.js";
import { commitIsAncestorOf } from "../../query-filter/commit-is-ancestor-of.js";
import { updateStateCache } from "../cache/update-state-cache.js";
import { updateUntrackedState } from "../untracked/update-untracked-state.js";
import { generateCommit } from "./generate-commit.js";
import { setHasOpenTransaction } from "./vtable.js";
import { internalQueryBuilder } from "../../engine/internal-query-builder.js";
import {
	refreshWorkingChangeSet,
	type WorkingChange,
} from "../working-change-set/refresh-working-change-set.js";

/**
 * Commits all transaction changes to permanent storage.
 *
 * This function handles the COMMIT stage of the state mutation flow. It takes
 * all changes accumulated in the transaction table (lix_internal_transaction_state),
 * creates commits for each version with data changes, and then creates a global
 * commit containing all the graph metadata (commits, changesets, edges, version updates).
 *
 * @example
 * // After accumulating changes via insertTransactionState
 * commit({ engine });
 * // All pending changes are now persisted
 */
export function commit(args: {
	engine: Pick<
		LixEngine,
		"hooks" | "executeSync" | "runtimeCacheRef" | "sqlite"
	>;
}): number {
	const engine = args.engine;
	const transactionTimestamp = getTimestampSync({ engine: engine });
	const db = internalQueryBuilder;

	// Collect per-version snapshots once to avoid duplicate queries in this commit
	const versionSnapshots = new Map<string, LixVersion>();

	// Query all transaction changes
	const allTransactionChanges = engine.executeSync(
		db
			.selectFrom("lix_internal_transaction_state")
			.select([
				"id",
				"entity_id",
				"schema_key",
				"schema_version",
				"file_id",
				"plugin_key",
				"version_id",
				"writer_key",
				sql<string | null>`json(snapshot_content)`.as("snapshot_content"),
				sql<string | null>`json(metadata)`.as("metadata"),
				"created_at",
				sql`untracked`.as("untracked"),
			])
			.compile()
	).rows as any[];

	// Separate tracked and untracked changes
	const trackedChangesByVersion = new Map<string, any[]>();
	const untrackedChanges: any[] = [];
	let untrackedHookChanges: StateCommitChange[] | undefined;

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

	// Process all untracked changes in a single batched call
	if (untrackedChanges.length > 0) {
		const untrackedBatch = untrackedChanges.map((change) => ({
			id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
			plugin_key: change.plugin_key,
			snapshot_content: change.snapshot_content,
			schema_version: change.schema_version,
			created_at: change.created_at,
			lixcol_version_id: change.version_id,
			metadata: change.metadata ?? null,
		}));
		updateUntrackedState({ engine, changes: untrackedBatch });
		untrackedHookChanges = untrackedChanges.map((change) => ({
			id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			schema_version: change.schema_version,
			file_id: change.file_id,
			plugin_key: change.plugin_key,
			created_at: change.created_at,
			snapshot_content: change.snapshot_content
				? JSON.parse(change.snapshot_content)
				: null,
			metadata: change.metadata ? JSON.parse(change.metadata) : null,
			version_id: change.version_id,
			commit_id: "untracked",
			untracked: 1,
			writer_key: change.writer_key ?? null,
		}));
	}

	// Track metadata for each version that gets a commit
	const versionMetadata = new Map<
		string,
		{
			commitId: string;
			changeSetId: string;
			previousCommitId: string;
		}
	>();

	// Helper to load merged version (descriptor + tip) from resolved state
	const loadMergedVersion = (version_id: string): LixVersion => {
		const [desc] = engine.executeSync(
			db
				.selectFrom("lix_internal_state_vtable")
				.where("schema_key", "=", "lix_version_descriptor")
				.where("entity_id", "=", version_id)
				.where("snapshot_content", "is not", null)
				.select("snapshot_content")
				.limit(1)
				.compile()
		).rows as Array<{ snapshot_content: string }>;
		if (!desc?.snapshot_content)
			throw new Error(`Version with id '${version_id}' not found.`);
		const d = JSON.parse(desc.snapshot_content) as any;
		const [tip] = engine.executeSync(
			db
				.selectFrom("lix_internal_state_vtable")
				.where("schema_key", "=", "lix_version_tip")
				.where("entity_id", "=", version_id)
				.where("snapshot_content", "is not", null)
				.select("snapshot_content")
				.limit(1)
				.compile()
		).rows as Array<{ snapshot_content: string }>;
		if (!tip?.snapshot_content)
			throw new Error(`Version with id '${version_id}' not found.`);
		const t = JSON.parse(tip.snapshot_content) as any;
		return {
			id: d.id,
			name: d.name,
			working_commit_id: t.working_commit_id,
			inherits_from_version_id: d.inherits_from_version_id,
			hidden: d.hidden,
			commit_id: t.commit_id,
		} as LixVersion;
	};

	// Step 1: Create commits and changesets for each version with changes
	for (const [version_id, changes] of trackedChangesByVersion) {
		if (changes.length === 0) continue;

		// Load version snapshot once (descriptor + tip)
		const versionData = loadMergedVersion(version_id);
		versionSnapshots.set(version_id, versionData);
		const changeSetId = uuidV7Sync({ engine: engine });
		const commitId = uuidV7Sync({ engine: engine });

		// Store metadata for later use
		versionMetadata.set(version_id, {
			commitId,
			changeSetId,
			previousCommitId: versionData.commit_id,
		});
	}

	// Step 2: If we have any commits but global doesn't have one yet, create global commit
	if (versionMetadata.size > 0 && !versionMetadata.has("global")) {
		// Load global version snapshot once (descriptor + tip)
		const globalVersion = loadMergedVersion("global");
		versionSnapshots.set("global", globalVersion);
		const globalChangeSetId = uuidV7Sync({ engine: engine });
		const globalCommitId = uuidV7Sync({ engine: engine });

		// Store global metadata
		versionMetadata.set("global", {
			commitId: globalCommitId,
			changeSetId: globalChangeSetId,
			previousCommitId: globalVersion.commit_id,
		});
	}

	// Get active accounts for change_author records
	const activeAccounts = engine.executeSync(
		db
			.selectFrom("lix_internal_state_vtable")
			.where("schema_key", "=", "lix_active_account")
			.where("version_id", "=", "global")
			.where("snapshot_content", "is not", null)
			.select(
				sql`json_extract(snapshot_content, '$.account_id')`.as("account_id")
			)
			.compile()
	).rows as Array<{ account_id: string | null }>;

	// Step 4: Handle working changeset updates for each version
	for (const [version_id, changes] of trackedChangesByVersion) {
		if (version_id === "global" || changes.length === 0) continue;
		const versionData = versionSnapshots.get(version_id)!;
		const workingChanges: WorkingChange[] = changes.map((change) => ({
			id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
			snapshot_content:
				change.snapshot_content === null ||
				typeof change.snapshot_content === "string"
					? change.snapshot_content
					: JSON.stringify(change.snapshot_content),
		}));
		refreshWorkingChangeSet({
			engine: args.engine,
			version: {
				id: version_id,
				commit_id: versionData.commit_id ?? null,
				working_commit_id: versionData.working_commit_id ?? null,
			},
			timestamp: transactionTimestamp,
			changes: workingChanges,
		});
	}

	// Step 5: Generate all commit rows and materialized cache payload
	// Short-circuit if there are no tracked changes
	let totalTracked = 0;
	for (const [, cs] of trackedChangesByVersion) totalTracked += cs.length;
	if (totalTracked === 0) {
		// Clear the transaction table after handling any untracked updates
		engine.executeSync(
			db.deleteFrom("lix_internal_transaction_state").compile()
		);
		setHasOpenTransaction(engine, false);
		commitSequenceNumberSync({
			engine: engine,
			timestamp: transactionTimestamp,
		});
		// Emit hook for untracked-only commit
		args.engine.hooks._emit("state_commit", {
			changes: untrackedHookChanges ?? [],
		});
		return 0;
	}
	// Build versions map: include all versions with tracked changes + global
	const versionsInput = new Map<
		string,
		{ parent_commit_ids: string[]; snapshot: LixVersion }
	>();
	for (const [version_id, changes] of trackedChangesByVersion) {
		if (changes.length === 0) continue;
		// Ensure snapshot loaded
		if (!versionSnapshots.has(version_id)) {
			versionSnapshots.set(version_id, loadMergedVersion(version_id));
		}
	}
	if (versionSnapshots.size > 0 && !versionSnapshots.has("global")) {
		versionSnapshots.set("global", loadMergedVersion("global"));
	}
	// Use resolved version snapshots to derive parent_commit_ids
	for (const [vid, snap] of versionSnapshots) {
		versionsInput.set(vid, {
			parent_commit_ids: snap.commit_id ? [snap.commit_id] : [],
			snapshot: snap,
		});
	}

	// Preload writer_key for all affected domain rows in this commit (batched)
	// Flatten domain changes as input to the generator (carry writer_key when available)
	const domainChangesFlat: import("./generate-commit.js").DomainChangeInput[] =
		[];
	for (const [vid, changes] of trackedChangesByVersion) {
		for (const c of changes) {
			domainChangesFlat.push({
				id: c.id,
				entity_id: c.entity_id,
				schema_key: c.schema_key,
				schema_version: c.schema_version,
				file_id: c.file_id,
				plugin_key: c.plugin_key,
				snapshot_content: c.snapshot_content,
				metadata: c.metadata ?? null,
				created_at: c.created_at,
				version_id: vid,
				writer_key: c.writer_key ?? null,
			});
		}
	}

	const genRes = generateCommit({
		timestamp: transactionTimestamp,
		activeAccounts: activeAccounts.map((a) => a.account_id as string),
		changes: domainChangesFlat,
		versions: versionsInput,
		generateUuid: () => uuidV7Sync({ engine: engine }),
	});

	// Single batch insert of all generated changes into the change table
	if (genRes.changes.length > 0) {
		engine.executeSync(
			db
				.insertInto("change")
				.values(genRes.changes as any)
				.compile()
		);
	}

	// Clear the transaction table after committing
	engine.executeSync(db.deleteFrom("lix_internal_transaction_state").compile());
	setHasOpenTransaction(engine, false);

	// Update cache entries in a single call using materialized state with inline commit/version
	if (genRes.materializedState.length > 0) {
		updateStateCache({
			engine: engine,
			changes: genRes.materializedState,
		});
	}

	// Delete untracked state for any tracked changes that were committed
	for (const [version_id, versionChanges] of trackedChangesByVersion) {
		if ((versionChanges?.length ?? 0) === 0) continue;
		const untrackedToDelete = new Set<string>();
		for (const change of versionChanges) {
			const key = `${change.entity_id}|${change.schema_key}|${change.file_id}|${version_id}`;
			untrackedToDelete.add(key);
		}
		for (const key of untrackedToDelete) {
			const [entity_id, schema_key, file_id, vid] = key.split("|");
			engine.executeSync(
				db
					.deleteFrom("lix_internal_state_all_untracked")
					.where("entity_id", "=", entity_id!)
					.where("schema_key", "=", schema_key!)
					.where("file_id", "=", file_id!)
					.where("version_id", "=", vid!)
					.compile()
			);
		}
	}

	// Update file lixcol cache (existing logic) using latest change per file
	// Need commit ids per version from generated version updates
	const commitIdByVersion = new Map<string, string>();
	for (const ch of genRes.changes) {
		if (
			ch.schema_key === "lix_version_tip" &&
			ch.snapshot_content &&
			ch.entity_id
		) {
			const snap = JSON.parse(ch.snapshot_content);
			const cid = snap?.commit_id;
			if (cid) commitIdByVersion.set(ch.entity_id, cid);
		}
	}

	for (const [version_id, versionChanges] of trackedChangesByVersion) {
		if ((versionChanges?.length ?? 0) === 0) continue;
		const metaCommitId = commitIdByVersion.get(version_id);
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
				writer_key: string | null;
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
						latest_commit_id: metaCommitId ?? "",
						created_at: created_at,
						updated_at: created_at,
						writer_key: changeData?.writer_key ?? null,
					});
				}
			}
			if (filesToDelete.length > 0) {
				engine.executeSync(
					db
						.deleteFrom("lix_internal_file_lixcol_cache")
						.where("version_id", "=", version_id)
						.where("file_id", "in", filesToDelete)
						.compile()
				);
			}
			if (filesToUpdate.length > 0) {
				engine.executeSync(
					db
						.insertInto("lix_internal_file_lixcol_cache")
						.values(filesToUpdate)
						.onConflict((oc) =>
							oc.columns(["file_id", "version_id"]).doUpdateSet({
								latest_change_id: sql`excluded.latest_change_id`,
								latest_commit_id: sql`excluded.latest_commit_id`,
								updated_at: sql`excluded.updated_at`,
								writer_key: sql`excluded.writer_key`,
							})
						)
						.compile()
				);
			}
		}
	}

	commitSequenceNumberSync({
		engine: engine,
		timestamp: transactionTimestamp,
	});

	// Emit state commit hook after transaction is successfully committed
	// Emit only materialized state so observers can read inline lixcol_version_id/lixcol_commit_id
	// Include writer_key when present on materialized rows (domain rows carry it)
	const hookChanges: StateCommitChange[] = genRes.materializedState.map(
		(ms) => ({
			id: ms.id,
			entity_id: ms.entity_id,
			schema_key: ms.schema_key,
			schema_version: ms.schema_version,
			file_id: ms.file_id,
			plugin_key: ms.plugin_key,
			created_at: ms.created_at,
			snapshot_content: ms.snapshot_content
				? JSON.parse(ms.snapshot_content)
				: null,
			metadata: ms.metadata ? JSON.parse(ms.metadata) : null,
			version_id: ms.lixcol_version_id,
			commit_id: ms.lixcol_commit_id,
			untracked: 0,
			writer_key: ms.writer_key ?? null,
		})
	);
	engine.hooks._emit("state_commit", { changes: hookChanges });
	return 0;
}
