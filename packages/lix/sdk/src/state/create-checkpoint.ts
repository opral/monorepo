import type { LixCommit } from "../commit/schema.js";
import { nanoIdSync, uuidV7Sync } from "../runtime/deterministic/index.js";
import type { Lix } from "../lix/open-lix.js";
import type { State } from "../entity-views/types.js";
import type { LixChangeRaw } from "../change/schema.js";
import { getTimestampSync } from "../runtime/deterministic/timestamp.js";
import { updateStateCache } from "./cache/update-state-cache.js";

/**
 * Converts the current working change set into a checkpoint.
 *
 * The working change set becomes immutable and receives the
 * `checkpoint` label. A fresh empty working change set is created so
 * that new changes can continue to accumulate.
 *
 * @example
 * ```ts
 * const { id } = await createCheckpoint({ lix })
 * ```
 */

export async function createCheckpoint(args: {
	lix: Lix;
}): Promise<State<LixCommit>> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Get current active version
		const activeVersion = await trx
			.selectFrom("active_version")
			.innerJoin("version", "version.id", "active_version.version_id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		// Get the working commit and its change set
		const workingCommit = await trx
			.selectFrom("commit")
			.where("id", "=", activeVersion.working_commit_id)
			.selectAll()
			.executeTakeFirstOrThrow();

		const workingChangeSetId = workingCommit.change_set_id;

		// Check if there are any working change set elements to checkpoint
		const workingElements = await trx
			.selectFrom("change_set_element_all")
			.where("change_set_id", "=", workingChangeSetId)
			.where("lixcol_version_id", "=", "global")
			.selectAll()
			.execute();

		if (workingElements.length === 0) {
			// Idempotent behavior: if working set is clean, return the current head commit
			const headCommit = await trx
				.selectFrom("commit_all")
				.selectAll()
				.where("id", "=", activeVersion.commit_id)
				.where("lixcol_version_id", "=", "global")
				.executeTakeFirstOrThrow();
			return headCommit;
		}

		// 1. The old working commit becomes the checkpoint commit
		const checkpointCommitId = activeVersion.working_commit_id;

		// Link checkpoint to previous head by setting its parent_commit_ids
		await trx
			.updateTable("commit_all")
			.set({ parent_commit_ids: [activeVersion.commit_id] as any })
			.where("id", "=", checkpointCommitId)
			.where("lixcol_version_id", "=", "global")
			.execute();

		// 2. Create new empty working change set for continued work
		const runtime = {
			sqlite: args.lix.sqlite,
			db: args.lix.db as any,
			hooks: args.lix.hooks as any,
		};
		const newWorkingChangeSetId = nanoIdSync({ runtime });
		await trx
			.insertInto("change_set_all")
			.values({
				id: newWorkingChangeSetId,
				lixcol_version_id: "global",
			})
			.execute();

		// 3. Get checkpoint label and assign it to the checkpoint commit
		const checkpointLabel = await trx
			.selectFrom("label")
			.where("name", "=", "checkpoint")
			.select("id")
			.executeTakeFirstOrThrow();

		await trx
			.insertInto("entity_label_all")
			.values({
				entity_id: checkpointCommitId,
				schema_key: "lix_commit",
				file_id: "lix",
				label_id: checkpointLabel.id,
				lixcol_version_id: "global",
			})
			.execute();

		// 4. Create a new commit for the new working change set
		const newWorkingCommitId = uuidV7Sync({ runtime });
		await trx
			.insertInto("commit_all")
			.values({
				id: newWorkingCommitId,
				change_set_id: newWorkingChangeSetId,
				// new working commit is a child of the checkpoint
				parent_commit_ids: [checkpointCommitId] as any,
				lixcol_version_id: "global",
			})
			.execute();

		const createdCommit = await trx
			.selectFrom("commit_all")
			.selectAll()
			.where("id", "=", checkpointCommitId)
			.where("lixcol_version_id", "=", "global")
			.executeTakeFirstOrThrow();

		// Edges are derived from parent_commit_ids; no direct writes to commit_edge_all

		// Update version tip + descriptor via change + cache (avoid version view writes)
		const now = getTimestampSync({ runtime });
		const descriptorChange: LixChangeRaw = {
			id: uuidV7Sync({ runtime }),
			entity_id: activeVersion.id,
			schema_key: "lix_version_descriptor",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				id: activeVersion.id,
				name: activeVersion.name,
				working_commit_id: newWorkingCommitId,
				inherits_from_version_id: activeVersion.inherits_from_version_id,
				hidden: activeVersion.hidden,
			}),
			created_at: now,
		};
		const tipChange: LixChangeRaw = {
			id: uuidV7Sync({ runtime }),
			entity_id: activeVersion.id,
			schema_key: "lix_version_tip",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				id: activeVersion.id,
				commit_id: checkpointCommitId,
			}),
			created_at: now,
		};

		// Also materialize the commit edge parent=checkpoint, child=new working
		const edgeChange: LixChangeRaw = {
			id: uuidV7Sync({ runtime }),
			entity_id: `${checkpointCommitId}~${newWorkingCommitId}`,
			schema_key: "lix_commit_edge",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				parent_id: checkpointCommitId,
				child_id: newWorkingCommitId,
			}),
			created_at: now,
		};

		// Persist changes and update cache without creating a meta-commit
		await trx
			.insertInto("change")
			.values([descriptorChange as any, tipChange as any, edgeChange as any])
			.execute();
		updateStateCache({
			lix: { sqlite: args.lix.sqlite, db: trx },
			changes: [
				{
					...descriptorChange,
					lixcol_version_id: "global",
					lixcol_commit_id: checkpointCommitId,
				} as any,
				{
					...tipChange,
					lixcol_version_id: "global",
					lixcol_commit_id: checkpointCommitId,
				} as any,
				{
					...edgeChange,
					lixcol_version_id: "global",
					lixcol_commit_id: checkpointCommitId,
				} as any,
			],
		});

		return createdCommit;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
