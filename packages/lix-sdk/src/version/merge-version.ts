import type { Lix } from "../lix/open-lix.js";
import type { LixVersion } from "./schema.js";
import { selectVersionDiff } from "./select-version-diff.js";
import { sql, type Kysely } from "kysely";
import { uuidV7 } from "../deterministic/uuid-v7.js";
import { timestamp } from "../deterministic/timestamp.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import type { LixChangeRaw } from "../change/schema.js";
import { updateStateCache } from "../state/cache/update-state-cache.js";
import { markStateCacheAsFresh } from "../state/cache/mark-state-cache-as-stale.js";
export async function mergeVersion(args: {
	lix: Lix;
	source: Pick<LixVersion, "id">;
	target?: Pick<LixVersion, "id">;
	// strategy?: "last_edit" | "ours" | "theirs" // reserved for future
}): Promise<void> {
	const { lix } = args;

	if (args.target && args.target.id === args.source.id) {
		return;
	}

	await lix.db.transaction().execute(async (trx) => {
		const target = args.target
			? { id: args.target.id }
			: await trx
					.selectFrom("active_version")
					.innerJoin("version", "version.id", "active_version.version_id")
					.select("version.id as id")
					.executeTakeFirstOrThrow();

		// Build diffs and collect winning change ids (created/updated)
		const diffs = await selectVersionDiff({
			lix: { ...lix, db: trx } as any,
			source: args.source,
			target,
		})
			.where("diff.status", "in", ["created", "updated", "deleted"]) // ignore unchanged
			.selectAll()
			.execute();

		// Resolve tip commits for parents
		const sourceVersion = await trx
			.selectFrom("version")
			.selectAll()
			.where("id", "=", args.source.id)
			.executeTakeFirstOrThrow();
		const targetVersion = await trx
			.selectFrom("version")
			.selectAll()
			.where("id", "=", target.id)
			.executeTakeFirstOrThrow();

		//

		// Prepare elements to reference and deletion changes to create
		const toReference: Array<{
			id: string;
			entity_id: string;
			schema_key: string;
			file_id: string;
		}> = [];
		const toDelete: Array<{
			entity_id: string;
			schema_key: string;
			file_id: string;
			plugin_key: string;
			schema_version: string;
		}> = [];

		for (const d of diffs) {
			if (d.status === "created" || d.status === "updated") {
				if (d.after_change_id) {
					toReference.push({
						id: d.after_change_id,
						entity_id: d.entity_id,
						schema_key: d.schema_key,
						file_id: d.file_id,
					});
				}
			} else if (d.status === "deleted") {
				// Lookup plugin_key and schema_version from target's before_change_id
				const before = await trx
					.selectFrom("change")
					.where("id", "=", d.before_change_id!)
					.select(["plugin_key", "schema_version"])
					.executeTakeFirstOrThrow();

				toDelete.push({
					entity_id: d.entity_id,
					schema_key: d.schema_key,
					file_id: d.file_id,
					plugin_key: before.plugin_key,
					schema_version: before.schema_version,
				});
			}
		}

		// Flush pending source tracked changes for referenced items into the change table
		// and remove them from the transaction queue so commit.ts won't create a source commit.
		if (toReference.length > 0) {
			const intDbLocal = trx as unknown as Kysely<LixInternalDatabaseSchema>;
			const refIds = toReference.map((r) => r.id);

			// Read pending rows from the transaction table
			const pending = await intDbLocal
				.selectFrom("internal_transaction_state")
				.select([
					"id",
					"entity_id",
					"schema_key",
					"schema_version",
					"file_id",
					"plugin_key",
					sql`json(snapshot_content)`.as("snapshot_content"),
					"created_at",
				])
				.where("lixcol_version_id", "=", sourceVersion.id)
				.where("id", "in", refIds)
				.execute();

			if (pending.length > 0) {
				// Insert into persistent change table using the view's insert trigger
				await trx
					.insertInto("change")
					.values(
						pending.map((p: any) => ({
							id: p.id,
							entity_id: p.entity_id,
							schema_key: p.schema_key,
							schema_version: p.schema_version,
							file_id: p.file_id,
							plugin_key: p.plugin_key,
							snapshot_content: p.snapshot_content
								? JSON.stringify(p.snapshot_content)
								: null,
							created_at: p.created_at,
						})) as any
					)
					.execute();

				// Remove from transaction queue to prevent automatic commit logic for source
				await intDbLocal
					.deleteFrom("internal_transaction_state")
					.where("id", "in", refIds)
					.execute();
			}
		}

		// If nothing to do, return current target tip commit
		if (toReference.length === 0 && toDelete.length === 0) {
			// nothing to merge
			return;
		}
		// One-commit model IDs
		const targetChangeSetId = uuidV7({ lix });
		const targetCommitId = uuidV7({ lix });
		const now = timestamp({ lix });
		//

		// Build change rows (manual meta for one-commit model)
		const changeRows: LixChangeRaw[] = [];

		// change_set (target)
		const targetChangeSetChangeId = uuidV7({ lix });
		changeRows.push({
			id: targetChangeSetChangeId,
			entity_id: targetChangeSetId,
			schema_key: "lix_change_set",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				id: targetChangeSetId,
				metadata: null,
			}),
			created_at: now,
		});

		// commit (target) with parent ordering [target.tip, source.tip]
		const targetCommitChangeId = uuidV7({ lix });
		const commitRow: LixChangeRaw = {
			id: targetCommitChangeId,
			entity_id: targetCommitId,
			schema_key: "lix_commit",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				id: targetCommitId,
				change_set_id: targetChangeSetId,
				parent_commit_ids: [targetVersion.commit_id, sourceVersion.commit_id],
			}),
			created_at: now,
		};
		changeRows.push(commitRow);

		// version (target -> new tip)
		const targetVersionChangeId = uuidV7({ lix });
		const versionRow: LixChangeRaw = {
			id: targetVersionChangeId,
			entity_id: target.id,
			schema_key: "lix_version",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				...targetVersion,
				commit_id: targetCommitId,
			}),
			created_at: now,
		};
		changeRows.push(versionRow);

		// TEMPORARY: Also write version change for global scope until materializer is fixed
		// This ensures the materializer can find the new version tip even in cache miss mode
		// TODO: Remove this once materializer can handle single-write model (optimization plan step 3)
		const globalVersionChangeId = uuidV7({ lix });
		const globalVersionRow: LixChangeRaw = {
			id: globalVersionChangeId,
			entity_id: target.id,
			schema_key: "lix_version",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				...targetVersion,
				commit_id: targetCommitId,
			}),
			created_at: now,
		};
		changeRows.push(globalVersionRow);
		//

		// Create deletion change rows (domain tombstones) for target
		const deletionChanges: LixChangeRaw[] = [];
		for (const del of toDelete) {
			const delChangeId = uuidV7({ lix });
			deletionChanges.push({
				id: delChangeId,
				entity_id: del.entity_id,
				schema_key: del.schema_key,
				file_id: del.file_id,
				plugin_key: del.plugin_key,
				schema_version: del.schema_version,
				snapshot_content: null,
				created_at: now,
			});
		}

		// Create explicit CSE change rows for winners + deletions anchored under target change_set
		const cseChangeRows: LixChangeRaw[] = [];
		for (const ref of toReference) {
			cseChangeRows.push({
				id: uuidV7({ lix }),
				entity_id: `${targetChangeSetId}~${ref.id}`,
				schema_key: "lix_change_set_element",
				schema_version: "1.0",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					change_set_id: targetChangeSetId,
					change_id: ref.id,
					entity_id: ref.entity_id,
					schema_key: ref.schema_key,
					file_id: ref.file_id,
				}),
				created_at: now,
			});
		}
		for (const del of deletionChanges) {
			cseChangeRows.push({
				id: uuidV7({ lix }),
				entity_id: `${targetChangeSetId}~${del.id}`,
				schema_key: "lix_change_set_element",
				schema_version: "1.0",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					change_set_id: targetChangeSetId,
					change_id: del.id,
					entity_id: del.entity_id,
					schema_key: del.schema_key,
					file_id: del.file_id,
				}),
				created_at: now,
			});
		}

		// Update commit snapshot to include change_ids for materializer determinism
		{
			const commitIdx = changeRows.findIndex(
				(c) => c.schema_key === "lix_commit" && c.entity_id === targetCommitId
			);
			if (commitIdx >= 0) {
				const snap = JSON.parse(
					changeRows[commitIdx]!.snapshot_content as any
				) as any;
				const winnerIds = toReference.map((r) => r.id);
				const deletionIds = deletionChanges.map((d) => d.id);
				// Include local meta so materializer can derive CSEs for commit + change_set
				snap.change_ids = [
					...winnerIds,
					...deletionIds,
					targetVersionChangeId,
					globalVersionChangeId,
					targetChangeSetChangeId,
					targetCommitChangeId,
				];
				changeRows[commitIdx]!.snapshot_content = JSON.stringify(snap);
			}
		}

		// Insert change rows (meta + deletions) in one batch
		const allChangesToInsert: LixChangeRaw[] = [
			...changeRows,
			...deletionChanges,
			...cseChangeRows,
		];
		if (allChangesToInsert.length > 0) {
			await trx
				.insertInto("change")
				.values(allChangesToInsert as any)
				.execute();
			//
		}

		// Prepare incremental cache updates in a single batch (MaterializedChange)
		type Mat = Parameters<typeof updateStateCache>[0]["changes"][number] & {
			lixcol_version_id?: string;
			lixcol_commit_id?: string;
		};

		const cacheBatch: Mat[] = [];

		// Global scope: commit row (derives edges + ensures change_set entry) and version row
		cacheBatch.push({
			...(changeRows.find(
				(c) => c.schema_key === "lix_commit"
			) as LixChangeRaw),
			lixcol_version_id: "global",
			lixcol_commit_id: targetCommitId,
		} as Mat);
		cacheBatch.push({
			...(changeRows.find(
				(c) => c.schema_key === "lix_version" && c.entity_id === target.id
			) as LixChangeRaw),
			lixcol_version_id: "global",
			lixcol_commit_id: targetCommitId,
		} as Mat);

		// Ensure source version pointer is present in cache under GLOBAL (unchanged)
		cacheBatch.push({
			id: uuidV7({ lix }),
			entity_id: sourceVersion.id,
			schema_key: "lix_version",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify(sourceVersion),
			created_at: now,
			lixcol_version_id: "global",
			lixcol_commit_id: targetCommitId,
		} as Mat);
		// Also include the change_set entity in global scope for completeness
		cacheBatch.push({
			...(changeRows.find(
				(c) => c.schema_key === "lix_change_set"
			) as LixChangeRaw),
			lixcol_version_id: "global",
			lixcol_commit_id: targetCommitId,
		} as Mat);

		// Target scope: referenced winners (domain rows) and deletions
		if (toReference.length > 0) {
			const ids = toReference.map((a) => a.id);
			const rows = await trx
				.selectFrom("change")
				.where("id", "in", ids)
				.select([
					"id",
					"entity_id",
					"schema_key",
					"file_id",
					"plugin_key",
					"schema_version",
					sql`json(snapshot_content)`.as("snapshot_content"),
					"created_at",
				])
				.execute();
			for (const r of rows as any[]) {
				cacheBatch.push({
					id: r.id,
					entity_id: r.entity_id,
					schema_key: r.schema_key,
					file_id: r.file_id,
					plugin_key: r.plugin_key,
					schema_version: r.schema_version,
					snapshot_content: r.snapshot_content
						? JSON.stringify(r.snapshot_content)
						: null,
					created_at: r.created_at,
					lixcol_version_id: target.id,
					lixcol_commit_id: targetCommitId,
				} as Mat);
			}
		}
		for (const del of deletionChanges) {
			cacheBatch.push({
				...(del as LixChangeRaw),
				lixcol_version_id: target.id,
				lixcol_commit_id: targetCommitId,
			} as Mat);
		}

		// Global CSEs for winners, deletions, and meta (commit + version)
		const mkCse = (
			change_id: string,
			entity_id: string,
			schema_key: string,
			file_id: string
		): Mat => ({
			id: uuidV7({ lix }),
			entity_id: `${targetChangeSetId}~${change_id}`,
			schema_key: "lix_change_set_element",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				change_set_id: targetChangeSetId,
				change_id,
				entity_id,
				schema_key,
				file_id,
			}),
			created_at: now,
			lixcol_version_id: "global",
			lixcol_commit_id: targetCommitId,
		});

		for (const ref of toReference) {
			cacheBatch.push(
				mkCse(ref.id, ref.entity_id, ref.schema_key, ref.file_id)
			);
		}
		for (const del of deletionChanges) {
			cacheBatch.push(
				mkCse(del.id, del.entity_id, del.schema_key, del.file_id)
			);
		}
		// Meta CSEs
		cacheBatch.push(
			mkCse(targetCommitChangeId, targetCommitId, "lix_commit", "lix")
		);
		cacheBatch.push(
			mkCse(targetVersionChangeId, target.id, "lix_version", "lix")
		);

		// Write incremental cache in a single batched call
		if (cacheBatch.length > 0) {
			updateStateCache({ lix, changes: cacheBatch });
			// Mark cache fresh to prevent vtable from repopulating and discarding just-written rows
			markStateCacheAsFresh({ lix });
			//
		}
	});
}
