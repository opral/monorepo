import type { LixCommit } from "./schema.js";
import { nanoId, uuidV7 } from "../deterministic/index.js";
import type { Lix } from "../lix/open-lix.js";
import type { State } from "../entity-views/types.js";

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
			throw new Error(
				"No changes in working change set to create a checkpoint for."
			);
		}

		// 1. The old working commit becomes the checkpoint commit
		const checkpointCommitId = activeVersion.working_commit_id;

		// Add commit edge from parent commit to checkpoint commit (which is the old working commit)
		await trx
			.insertInto("commit_edge_all")
			.values({
				parent_id: activeVersion.commit_id,
				child_id: checkpointCommitId,
				lixcol_version_id: "global",
			})
			.execute();

		// 2. Create new empty working change set for continued work
		const newWorkingChangeSetId = nanoId({ lix: args.lix });
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
		const newWorkingCommitId = uuidV7({ lix: args.lix });
		await trx
			.insertInto("commit_all")
			.values({
				id: newWorkingCommitId,
				change_set_id: newWorkingChangeSetId,
				lixcol_version_id: "global",
			})
			.execute();

		const createdCommit = await trx
			.selectFrom("commit_all")
			.selectAll()
			.where("id", "=", checkpointCommitId)
			.where("lixcol_version_id", "=", "global")
			.executeTakeFirstOrThrow();

		// Add commit edge from checkpoint commit to new working commit
		await trx
			.insertInto("commit_edge_all")
			.values({
				parent_id: checkpointCommitId,
				child_id: newWorkingCommitId,
				lixcol_version_id: "global",
			})
			.execute();

		// Update version to point to new working commit
		await trx
			.updateTable("version")
			.where("id", "=", activeVersion.id)
			.set({
				commit_id: checkpointCommitId,
				working_commit_id: newWorkingCommitId,
			})
			.execute();

		return createdCommit;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
