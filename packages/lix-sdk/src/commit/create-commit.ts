import type { Lix } from "../lix/index.js";
import type { LixCommit } from "./schema.js";
import type { LixChangeSet } from "../change-set/schema.js";
import { uuidV7 } from "../deterministic/uuid-v7.js";

/**
 * Creates a commit that points to a change set and optionally has parent commits.
 *
 * This function only creates the commit record and edges - it does NOT apply the commit
 * to any version. To update a version to point to this commit, use applyCommit().
 *
 * @example
 * ```ts
 * // Create a commit with no parents (root commit)
 * const commit = await createCommit({
 *   lix,
 *   changeSet: myChangeSet
 * });
 *
 * // Create a commit with one parent
 * const childCommit = await createCommit({
 *   lix,
 *   changeSet: newChangeSet,
 *   parentCommits: [parentCommit]
 * });
 *
 * // Create a merge commit with multiple parents
 * const mergeCommit = await createCommit({
 *   lix,
 *   changeSet: mergedChangeSet,
 *   parentCommits: [commit1, commit2]
 * });
 * ```
 */
export async function createCommit(args: {
	lix: Lix;
	changeSet: Pick<LixChangeSet, "id">;
	parentCommits?: Array<Pick<LixCommit, "id">>;
}): Promise<LixCommit> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const commitId = uuidV7({ lix: args.lix });

		// Create the commit
		await trx
			.insertInto("commit_all")
			.values({
				id: commitId,
				change_set_id: args.changeSet.id,
				lixcol_version_id: "global",
			})
			.execute();

		// Create commit edges to parents
		if (args.parentCommits && args.parentCommits.length > 0) {
			const edges = args.parentCommits.map((parent) => ({
				parent_id: parent.id,
				child_id: commitId,
				lixcol_version_id: "global",
			}));

			await trx.insertInto("commit_edge_all").values(edges).execute();
		}

		// Return the created commit
		const commit = await trx
			.selectFrom("commit_all")
			.where("id", "=", commitId)
			.where("lixcol_version_id", "=", "global")
			.selectAll()
			.executeTakeFirstOrThrow();

		return commit;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
