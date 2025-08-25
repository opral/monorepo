import type { Lix } from "../lix/open-lix.js";
import type { LixVersion } from "./schema.js";
import { selectVersionDiff } from "./select-version-diff.js";
import { sql, type Kysely } from "kysely";
import { uuidV7 } from "../deterministic/uuid-v7.js";
import { timestamp } from "../deterministic/timestamp.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import type { LixChangeRaw } from "../change/schema.js";
import { updateStateCache } from "../state/cache/update-state-cache.js";
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

		const beforeGlobal = await trx
			.selectFrom("version")
			.selectAll()
			.where("id", "=", "global")
			.executeTakeFirstOrThrow();

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

		// Two-commit model IDs
		const targetChangeSetId = uuidV7({ lix });
		const targetCommitId = uuidV7({ lix });
		const globalChangeSetId = uuidV7({ lix });
		const globalCommitId = uuidV7({ lix });
		const now = timestamp({ lix });

		// Build change rows for two-commit model
		const changeRows: LixChangeRaw[] = [];

		// 1) Define both change_set entities (global + target)
		const globalChangeSetChangeId = uuidV7({ lix });
		changeRows.push({
			id: globalChangeSetChangeId,
			entity_id: globalChangeSetId,
			schema_key: "lix_change_set",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				id: globalChangeSetId,
				metadata: null,
			}),
			created_at: now,
		});

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

		// 2) Target commit (references user-domain changes)
		const targetCommitChangeId = uuidV7({ lix });
		changeRows.push({
			id: targetCommitChangeId,
			entity_id: targetCommitId,
			schema_key: "lix_commit",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				id: targetCommitId,
				change_set_id: targetChangeSetId,
			}),
			created_at: now,
		});

		// Track all CSE changes so we can publish meta CSEs (CSE-of-CSE) under global
		const cseChangeRows: LixChangeRaw[] = [];
		// Reference user changes under TARGET change set (in GLOBAL view)
		for (const el of toReference) {
			const cseRow: LixChangeRaw = {
				id: uuidV7({ lix }),
				entity_id: `${targetChangeSetId}~${el.id}`,
				schema_key: "lix_change_set_element",
				schema_version: "1.0",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					change_set_id: targetChangeSetId,
					change_id: el.id,
					entity_id: el.entity_id,
					schema_key: el.schema_key,
					file_id: el.file_id,
				}),
				created_at: now,
			};
			changeRows.push(cseRow);
			cseChangeRows.push(cseRow);
		}

		// Create deletion change rows + reference them under TARGET change set
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
			const cseRow: LixChangeRaw = {
				id: uuidV7({ lix }),
				entity_id: `${targetChangeSetId}~${delChangeId}`,
				schema_key: "lix_change_set_element",
				schema_version: "1.0",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					change_set_id: targetChangeSetId,
					change_id: delChangeId,
					entity_id: del.entity_id,
					schema_key: del.schema_key,
					file_id: del.file_id,
				}),
				created_at: now,
			};
			changeRows.push(cseRow);
			cseChangeRows.push(cseRow);
		}

		// 3) Global commit (publishes graph metadata for both commits)
		const globalCommitChangeId = uuidV7({ lix });
		changeRows.push({
			id: globalCommitChangeId,
			entity_id: globalCommitId,
			schema_key: "lix_commit",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				id: globalCommitId,
				change_set_id: globalChangeSetId,
			}),
			created_at: now,
		});

		// Commit edges: target has two parents; global has one lineage edge
		const edgeTargetFromTargetBeforeId = uuidV7({ lix });
		changeRows.push({
			id: edgeTargetFromTargetBeforeId,
			entity_id: `${targetVersion.commit_id}~${targetCommitId}`,
			schema_key: "lix_commit_edge",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				parent_id: targetVersion.commit_id,
				child_id: targetCommitId,
			}),
			created_at: now,
		});
		const edgeTargetFromSourceBeforeId = uuidV7({ lix });
		changeRows.push({
			id: edgeTargetFromSourceBeforeId,
			entity_id: `${sourceVersion.commit_id}~${targetCommitId}`,
			schema_key: "lix_commit_edge",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				parent_id: sourceVersion.commit_id,
				child_id: targetCommitId,
			}),
			created_at: now,
		});
		// Global lineage edge: always link from beforeGlobal.tip to global.tip_after
		const globalLineageParentId = beforeGlobal.commit_id;
		const edgeGlobalLineageId = uuidV7({ lix });
		changeRows.push({
			id: edgeGlobalLineageId,
			entity_id: `${globalLineageParentId}~${globalCommitId}`,
			schema_key: "lix_commit_edge",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				parent_id: globalLineageParentId,
				child_id: globalCommitId,
			}),
			created_at: now,
		});

		// Reference graph rows under GLOBAL change set
		for (const meta of [
			{
				change_id: targetCommitChangeId,
				entity_id: targetCommitId,
				schema_key: "lix_commit",
			},
			{
				change_id: globalCommitChangeId,
				entity_id: globalCommitId,
				schema_key: "lix_commit",
			},
			{
				change_id: edgeTargetFromTargetBeforeId,
				entity_id: `${targetVersion.commit_id}~${targetCommitId}`,
				schema_key: "lix_commit_edge",
			},
			{
				change_id: edgeTargetFromSourceBeforeId,
				entity_id: `${sourceVersion.commit_id}~${targetCommitId}`,
				schema_key: "lix_commit_edge",
			},
			{
				change_id: edgeGlobalLineageId,
				entity_id: `${globalLineageParentId}~${globalCommitId}`,
				schema_key: "lix_commit_edge",
			},
		]) {
			const cseRow: LixChangeRaw = {
				id: uuidV7({ lix }),
				entity_id: `${globalChangeSetId}~${meta.change_id}`,
				schema_key: "lix_change_set_element",
				schema_version: "1.0",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					change_set_id: globalChangeSetId,
					change_id: meta.change_id,
					entity_id: meta.entity_id,
					schema_key: meta.schema_key,
					file_id: "lix",
				}),
				created_at: now,
			};
			changeRows.push(cseRow);
			cseChangeRows.push(cseRow);
		}

		// Version updates (target -> targetCommitId, global -> globalCommitId)
		const intDb = trx as unknown as Kysely<LixInternalDatabaseSchema>;
		const targetVersionRow = await intDb
			.selectFrom("internal_resolved_state_all")
			.where("schema_key", "=", "lix_version")
			.where("entity_id", "=", targetVersion.id)
			.where("snapshot_content", "is not", null)
			.select([sql`json(snapshot_content)`.as("snapshot_content")])
			.executeTakeFirstOrThrow();
		const currentTargetVersion =
			targetVersionRow.snapshot_content as unknown as LixVersion;
		const updatedTargetVersion: LixChangeRaw = {
			id: uuidV7({ lix }),
			entity_id: targetVersion.id,
			schema_key: "lix_version",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				...currentTargetVersion,
				commit_id: targetCommitId,
			}),
			created_at: now,
		};
		changeRows.push(updatedTargetVersion);
		const cseRowTargetVersion: LixChangeRaw = {
			id: uuidV7({ lix }),
			entity_id: `${globalChangeSetId}~${updatedTargetVersion.id}`,
			schema_key: "lix_change_set_element",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				change_set_id: globalChangeSetId,
				change_id: updatedTargetVersion.id,
				entity_id: targetVersion.id,
				schema_key: "lix_version",
				file_id: "lix",
			}),
			created_at: now,
		};
		changeRows.push(cseRowTargetVersion);
		cseChangeRows.push(cseRowTargetVersion);

		const globalVersionRow = await intDb
			.selectFrom("internal_resolved_state_all")
			.where("schema_key", "=", "lix_version")
			.where("entity_id", "=", "global")
			.where("snapshot_content", "is not", null)
			.select([sql`json(snapshot_content)`.as("snapshot_content")])
			.executeTakeFirstOrThrow();
		const currentGlobalVersion =
			globalVersionRow.snapshot_content as unknown as LixVersion;
		const updatedGlobalVersion: LixChangeRaw = {
			id: uuidV7({ lix }),
			entity_id: "global",
			schema_key: "lix_version",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				...currentGlobalVersion,
				commit_id: globalCommitId,
			}),
			created_at: now,
		};
		changeRows.push(updatedGlobalVersion);
		const cseRowGlobalVersion: LixChangeRaw = {
			id: uuidV7({ lix }),
			entity_id: `${globalChangeSetId}~${updatedGlobalVersion.id}`,
			schema_key: "lix_change_set_element",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				change_set_id: globalChangeSetId,
				change_id: updatedGlobalVersion.id,
				entity_id: "global",
				schema_key: "lix_version",
				file_id: "lix",
			}),
			created_at: now,
		};
		changeRows.push(cseRowGlobalVersion);
		cseChangeRows.push(cseRowGlobalVersion);

		// 4) Create meta change_set_elements for the change_set_element changes themselves (CSE-of-CSE)
		for (const elementChange of cseChangeRows) {
			changeRows.push({
				id: uuidV7({ lix }),
				entity_id: `${globalChangeSetId}~${elementChange.id}`,
				schema_key: "lix_change_set_element",
				schema_version: "1.0",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					change_set_id: globalChangeSetId,
					change_id: elementChange.id,
					entity_id: elementChange.entity_id,
					schema_key: elementChange.schema_key,
					file_id: elementChange.file_id,
				}),
				created_at: now,
			});
		}

		// Insert all changes (graph + change set defs + target deletions)
		const allChanges = [...changeRows, ...deletionChanges];
		if (allChanges.length > 0) {
			await trx
				.insertInto("change")
				.values(allChanges as any)
				.execute();
		}

		// Populate caches
		// Global: graph + change_set (both) + CSEs
		updateStateCache({
			lix,
			changes: changeRows,
			version_id: "global",
			commit_id: globalCommitId,
		});

		// Target: only business/user-domain changes (winning refs + deletions)
		let referencedChangeRows: LixChangeRaw[] = [];
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
			referencedChangeRows = rows.map((r: any) => ({
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
			}));
		}
		updateStateCache({
			lix,
			changes: [...referencedChangeRows, ...deletionChanges],
			version_id: target.id,
			commit_id: targetCommitId,
		});
	});
}
