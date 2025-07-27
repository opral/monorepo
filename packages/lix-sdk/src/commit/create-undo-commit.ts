import type { Lix } from "../lix/index.js";
import type { LixCommit } from "./schema.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { createCommit } from "./create-commit.js";
import type { LixLabel } from "../label/schema.js";
import type { NewLixChange } from "../change/schema.js";
import { uuidV7 } from "../deterministic/uuid-v7.js";

/**
 * Creates a "reverse" commit that undoes the changes made by the specified commit.
 *
 * @example
 *   ```ts
 *   const undoCommit = await createUndoCommit({
 *     lix,
 *     commit: targetCommit
 *   });
 *
 *   await applyChangeSet({
 *     lix,
 *     changeSet: { id: undoCommit.change_set_id }
 *   });
 *   ```
 *
 * @returns The newly created commit that contains the undo operations
 */
export async function createUndoCommit(args: {
	lix: Lix;
	commit: Pick<LixCommit, "id">;
	labels?: Pick<LixLabel, "id">[];
}): Promise<LixCommit> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Check for multiple parents (not supported yet)
		const parents = await trx
			.selectFrom("commit_edge_all")
			.where("lixcol_version_id", "=", "global")
			.where("child_id", "=", args.commit.id)
			.select("parent_id")
			.execute();

		if (parents.length > 1) {
			throw new Error(
				"Cannot undo commits with multiple parents (merge scenarios not yet supported)"
			);
		}

		// Get the change set ID from the commit
		const targetCommit = await trx
			.selectFrom("commit_all")
			.where("lixcol_version_id", "=", "global")
			.where("id", "=", args.commit.id)
			.select("change_set_id")
			.executeTakeFirstOrThrow();

		// Get all changes in the target change set (direct changes only, non-recursive)
		const targetChanges = await trx
			.selectFrom("change")
			.innerJoin(
				"change_set_element_all",
				"change_set_element_all.change_id",
				"change.id"
			)
			.where("change_set_element_all.lixcol_version_id", "=", "global")
			.where(
				"change_set_element_all.change_set_id",
				"=",
				targetCommit.change_set_id
			)
			.selectAll("change")
			.execute();

		const undoChanges: Array<NewLixChange> = [];

		for (const change of targetChanges) {
			if (parents.length === 0) {
				// No parent = this was the first commit, undo = delete everything
				undoChanges.push({
					id: uuidV7({ lix: args.lix }),
					entity_id: change.entity_id,
					file_id: change.file_id,
					plugin_key: change.plugin_key,
					schema_key: change.schema_key,
					schema_version: change.schema_version,
					snapshot_content: null, // Mark as deletion
				});
			} else {
				// Find the previous state in the parent commit
				const parentCommitId = parents[0]!.parent_id;

				// Get the parent commit's change set
				const parentCommit = await trx
					.selectFrom("commit_all")
					.where("lixcol_version_id", "=", "global")
					.where("id", "=", parentCommitId)
					.select("change_set_id")
					.executeTakeFirstOrThrow();

				const previousChange = await trx
					.selectFrom("change")
					.innerJoin(
						"change_set_element",
						"change_set_element.change_id",
						"change.id"
					)
					.where(
						"change_set_element.change_set_id",
						"=",
						parentCommit.change_set_id
					)
					.where("change_set_element.entity_id", "=", change.entity_id)
					.where("change_set_element.file_id", "=", change.file_id)
					.where("change_set_element.schema_key", "=", change.schema_key)
					.selectAll("change")
					.executeTakeFirst();

				if (previousChange) {
					// Restore to previous state
					undoChanges.push({
						id: uuidV7({ lix: args.lix }),
						entity_id: change.entity_id,
						file_id: change.file_id,
						plugin_key: change.plugin_key,
						schema_key: change.schema_key,
						schema_version: change.schema_version,
						snapshot_content: previousChange.snapshot_content, // Restore previous snapshot
					});
				} else {
					// Entity didn't exist before, so delete it
					undoChanges.push({
						id: uuidV7({ lix: args.lix }),
						entity_id: change.entity_id,
						file_id: change.file_id,
						plugin_key: change.plugin_key,
						schema_key: change.schema_key,
						schema_version: change.schema_version,
						snapshot_content: null, // Mark as deletion
					});
				}
			}
		}

		// Insert the undo changes
		const createdUndoChanges =
			undoChanges.length > 0
				? await trx
						.insertInto("change")
						.values(undoChanges)
						.returningAll()
						.execute()
				: [];

		// Create the undo change set
		const undoChangeSet = await createChangeSet({
			lix: { ...args.lix, db: trx },
			labels: args.labels,
			lixcol_version_id: "global",
			elements: createdUndoChanges.map((change) => ({
				change_id: change.id,
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				file_id: change.file_id,
			})),
		});

		// Create a commit for the undo change set
		const undoCommit = await createCommit({
			lix: { ...args.lix, db: trx },
			changeSet: undoChangeSet,
			parentCommits: args.commit.id ? [args.commit] : [],
		});

		return undoCommit;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
