import type { Lix } from "../lix/open-lix.js";
import {
	LixVersionTipSchema,
	type LixVersion,
	type LixVersionTip,
} from "./schema-definition.js";
import { selectVersionDiff } from "./select-version-diff.js";
import { sql, type Kysely } from "kysely";
import { uuidV7 } from "../engine/functions/uuid-v7.js";
import { getTimestamp } from "../engine/functions/timestamp.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import type { LixChangeRaw } from "../change/schema-definition.js";
import { updateStateCache } from "../state/cache/update-state-cache.js";
import { markStateCacheAsFresh } from "../state/cache/mark-state-cache-as-stale.js";
import {
	refreshWorkingChangeSet,
	type WorkingChange,
} from "../state/working-change-set/refresh-working-change-set.js";
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
			.where("diff.status", "in", ["added", "modified", "removed"]) // ignore unchanged
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
		const workingChangesForRefresh: WorkingChange[] = [];

		for (const d of diffs) {
			if (d.status === "added" || d.status === "modified") {
				if (d.after_change_id) {
					toReference.push({
						id: d.after_change_id,
						entity_id: d.entity_id,
						schema_key: d.schema_key,
						file_id: d.file_id,
					});
				}
			} else if (d.status === "removed") {
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
				.selectFrom("lix_internal_transaction_state")
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
				.where("version_id", "=", sourceVersion.id)
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
					.deleteFrom("lix_internal_transaction_state")
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
		const targetChangeSetId = await uuidV7({ lix });
		const targetCommitId = await uuidV7({ lix });
		const now = await getTimestamp({ lix });
		//

		// Build change rows (manual meta for one-commit model)
		const changeRows: LixChangeRaw[] = [];

		// commit (target) with parent ordering [target.tip, source.tip]
		const targetCommitChangeId = await uuidV7({ lix });
		const commitRow: LixChangeRaw = {
			id: targetCommitChangeId,
			entity_id: targetCommitId,
			schema_key: "lix_commit",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_sdk",
			snapshot_content: JSON.stringify({
				id: targetCommitId,
				change_set_id: targetChangeSetId,
				parent_commit_ids: [targetVersion.commit_id, sourceVersion.commit_id],
			}),
			created_at: now,
		};
		changeRows.push(commitRow);

		// No 'lix_version' rows; version view is derived from descriptor + tip

		// tip (target -> commit-anchored pointer)
		const versionTipRow: LixChangeRaw = {
			id: await uuidV7({ lix }),
			entity_id: target.id,
			schema_key: LixVersionTipSchema["x-lix-key"],
			schema_version: LixVersionTipSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_sdk",
			snapshot_content: JSON.stringify({
				id: target.id,
				commit_id: targetCommitId,
				working_commit_id: targetVersion.working_commit_id,
			} satisfies LixVersionTip),
			created_at: now,
		};
		changeRows.push(versionTipRow);

		//
		//

		// Create deletion change rows (domain tombstones) for target
		const deletionChanges: LixChangeRaw[] = [];
		for (const del of toDelete) {
			const delChangeId = await uuidV7({ lix });
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
			workingChangesForRefresh.push({
				id: delChangeId,
				entity_id: del.entity_id,
				schema_key: del.schema_key,
				file_id: del.file_id,
				snapshot_content: null,
			});
		}

		// Create explicit CSE change rows for winners + deletions anchored under target change_set
		const cseChangeRows: LixChangeRaw[] = [];
		for (const ref of toReference) {
			cseChangeRows.push({
				id: await uuidV7({ lix }),
				entity_id: `${targetChangeSetId}~${ref.id}`,
				schema_key: "lix_change_set_element",
				schema_version: "1.0",
				file_id: "lix",
				plugin_key: "lix_sdk",
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
				id: await uuidV7({ lix }),
				entity_id: `${targetChangeSetId}~${del.id}`,
				schema_key: "lix_change_set_element",
				schema_version: "1.0",
				file_id: "lix",
				plugin_key: "lix_sdk",
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

		// Copy change authors from source for referenced winners
		const authorEntries: Array<{
			id: string;
			entity_id: string;
			created_at: string;
		}> = [];
		if (toReference.length > 0) {
			const refIds = toReference.map((r) => r.id);
			const sourceAuthorRows = await trx
				.selectFrom("change")
				.where("schema_key", "=", "lix_change_author")
				.where(
					sql`json_extract(snapshot_content, '$.change_id')`,
					"in",
					refIds as any
				)
				.select([
					"id",
					"entity_id",
					sql`json(snapshot_content)`.as("snapshot"),
					"created_at",
				])
				.execute();

			for (const row of sourceAuthorRows as any[]) {
				authorEntries.push({
					id: String(row.id),
					entity_id: String(row.entity_id),
					created_at: String(row.created_at),
				});
				// Also anchor an explicit CSE change row for the author under target change_set
				cseChangeRows.push({
					id: await uuidV7({ lix }),
					entity_id: `${targetChangeSetId}~${row.id}`,
					schema_key: "lix_change_set_element",
					schema_version: "1.0",
					file_id: "lix",
					plugin_key: "lix_sdk",
					snapshot_content: JSON.stringify({
						change_set_id: targetChangeSetId,
						change_id: row.id,
						entity_id: row.entity_id,
						schema_key: "lix_change_author",
						file_id: "lix",
					}),
					created_at: row.created_at,
				});
			}
		}

		// Update commit snapshot to include change_ids for materializer determinism
		{
			const commitIdx = changeRows.findIndex(
				(c) => c.schema_key === "lix_commit" && c.entity_id === targetCommitId
			);
			if (commitIdx >= 0) {
				const baseSnap = {
					id: targetCommitId,
					change_set_id: targetChangeSetId,
					parent_commit_ids: [targetVersion.commit_id, sourceVersion.commit_id],
				} as any;
				// Build intended membership explicitly
				const winnerIds = toReference.map((r) => r.id);
				const deletionIds = deletionChanges.map((d) => d.id);
				const authorIds = authorEntries.map((a) => a.id);
				//
				let membership = [...winnerIds, ...deletionIds, ...authorIds];

				// Filter out any prior target commit/change_set meta ids if present
				// Previous target commit change id
				const prevCommitChange = await trx
					.selectFrom("change")
					.where("schema_key", "=", "lix_commit")
					.where("entity_id", "=", targetVersion.commit_id)
					.select(["id"])
					.executeTakeFirst();
				const prevCommitChangeId = prevCommitChange?.id as string | undefined;
				let prevChangeSetId: string | undefined = undefined;
				if (prevCommitChangeId) {
					const row = await trx
						.selectFrom("change")
						.where("id", "=", prevCommitChangeId)
						.select([
							sql`json_extract(snapshot_content, '$.change_set_id')`.as("csid"),
						])
						.executeTakeFirst();
					prevChangeSetId = (row as any)?.csid as string | undefined;
				}
				let prevChangeSetChangeId: string | undefined = undefined;
				if (prevChangeSetId) {
					const prevCsChange = await trx
						.selectFrom("change")
						.where("schema_key", "=", "lix_change_set")
						.where("entity_id", "=", prevChangeSetId)
						.select(["id"])
						.executeTakeFirst();
					prevChangeSetChangeId = prevCsChange?.id as string | undefined;
				}
				const exclude = new Set(
					[prevCommitChangeId, prevChangeSetChangeId].filter(
						Boolean
					) as string[]
				);
				membership = membership.filter((id) => !exclude.has(id));

				// Deduplicate any accidental duplicates (e.g., author)
				membership = Array.from(new Set(membership));

				// Assign final membership, hard overriding snapshot to avoid residue
				const finalSnap = { ...baseSnap, change_ids: membership };
				changeRows[commitIdx]!.snapshot_content = JSON.stringify(finalSnap);
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

		// Global scope: commit row (derives edges + ensures change_set entry)
		cacheBatch.push({
			...(changeRows.find(
				(c) => c.schema_key === "lix_commit"
			) as LixChangeRaw),
			lixcol_version_id: "global",
			lixcol_commit_id: targetCommitId,
		} as Mat);

		// Also cache the tip pointer for materializer seeding and views
		cacheBatch.push({
			...(versionTipRow as LixChangeRaw),
			lixcol_version_id: "global",
			lixcol_commit_id: targetCommitId,
		} as Mat);

		// No caching of deprecated 'lix_version' rows
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
				const normalizedSnapshot =
					r.snapshot_content === null ||
					r.snapshot_content === undefined ||
					typeof r.snapshot_content === "string"
						? (r.snapshot_content ?? null)
						: JSON.stringify(r.snapshot_content);
				workingChangesForRefresh.push({
					id: r.id,
					entity_id: r.entity_id,
					schema_key: r.schema_key,
					file_id: r.file_id,
					snapshot_content: normalizedSnapshot,
				});
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
		const mkCse = async (
			change_id: string,
			entity_id: string,
			schema_key: string,
			file_id: string
		): Promise<Mat> => ({
			id: await uuidV7({ lix }),
			entity_id: `${targetChangeSetId}~${change_id}`,
			schema_key: "lix_change_set_element",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_sdk",
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
				await mkCse(ref.id, ref.entity_id, ref.schema_key, ref.file_id)
			);
		}
		for (const del of deletionChanges) {
			cacheBatch.push(
				await mkCse(del.id, del.entity_id, del.schema_key, del.file_id)
			);
		}
		// No meta CSEs (commit/version/change_set) to keep CSE domain-only
		// Author CSEs (copied from source)
		for (const au of authorEntries) {
			cacheBatch.push(
				await mkCse(au.id, au.entity_id, "lix_change_author", "lix")
			);
		}

		// Write incremental cache in a single batched call
		if (cacheBatch.length > 0) {
			// Delegate cache updates to engine via router when engine is not exposed
			await lix.call("lix_update_state_cache", { changes: cacheBatch });
			await lix.call("lix_mark_state_cache_as_fresh");
		}

		if (workingChangesForRefresh.length > 0) {
			await lix.call("lix_refresh_working_change_set", {
				versionId: target.id,
				commitId: targetCommitId,
				workingCommitId: targetVersion.working_commit_id,
				timestamp: now,
				changes: workingChangesForRefresh,
			});
		}
	});
}
