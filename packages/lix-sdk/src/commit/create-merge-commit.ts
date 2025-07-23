import type { Lix } from "../lix/open-lix.js";
import { changeSetElementInAncestryOf } from "../query-filter/change-set-element-in-ancestry-of.js";
import { changeSetElementIsLeafOf } from "../query-filter/change-set-element-is-leaf-of.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import type { LixCommit } from "./schema.js";
import { uuidV7 } from "../deterministic/uuid-v7.js";

/**
 * Merges two commits using a "source wins" strategy (until lix models conflicts).
 *
 * Creates a new change set containing the merged result and a commit that
 * points to both source and target commits. If an element (identified by
 * entity_id, file_id, schema_key) exists in both the source and target
 * commits (considering their respective histories), the element from the
 * source commit's history takes precedence.
 *
 * @param args - The arguments for the merge operation.
 * @param args.lix - The Lix instance.
 * @param args.source - The source commit (only `id` is needed).
 * @param args.target - The target commit (only `id` is needed).
 *
 * @returns A Promise resolving to the newly created Commit representing the merged state.
 */
export async function createMergeCommit(args: {
	lix: Lix;
	source: Pick<LixCommit, "id">;
	target: Pick<LixCommit, "id">;
}): Promise<LixCommit> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// --- Calculate the merged elements using "source wins" logic ---
		const mergedElements = await trx
			.with("SourceLeaves", (db) =>
				db
					.selectFrom("change_set_element")
					.where(changeSetElementInAncestryOf([args.source]))
					.where(changeSetElementIsLeafOf([args.source]))
					.selectAll("change_set_element")
			)
			.with("TargetLeaves", (db) =>
				db
					.selectFrom("change_set_element")
					.where(changeSetElementInAncestryOf([args.target]))
					.where(changeSetElementIsLeafOf([args.target]))
					.selectAll("change_set_element")
			)
			.selectFrom("SourceLeaves") // Select all source leaves (they always win)
			.selectAll()
			.union(
				(db) =>
					db
						.selectFrom("TargetLeaves") // Select target leaves...
						.selectAll()
						.where(({ not, exists, selectFrom }) =>
							not(
								exists(
									// ...that do NOT have a corresponding entity in SourceLeaves
									selectFrom("SourceLeaves")
										.select("SourceLeaves.entity_id") // Select something small
										.whereRef(
											"SourceLeaves.entity_id",
											"=",
											"TargetLeaves.entity_id"
										)
										.whereRef(
											"SourceLeaves.file_id",
											"=",
											"TargetLeaves.file_id"
										)
										.whereRef(
											"SourceLeaves.schema_key",
											"=",
											"TargetLeaves.schema_key"
										)
								)
							)
						) // End WHERE NOT EXISTS
			) // End UNION
			.execute();

		// Create the new merge change set record
		const newChangeSet = await createChangeSet({
			lix: { ...args.lix, db: trx },
			elements: mergedElements.map((ce) => ({
				change_id: ce.change_id,
				entity_id: ce.entity_id,
				schema_key: ce.schema_key,
				file_id: ce.file_id,
			})),
			lixcol_version_id: "global",
		});

		// Create a commit for the merged change set
		const commitId = uuidV7({ lix: args.lix });

		// Insert the commit
		await trx
			.insertInto("commit_all")
			.values({
				id: commitId,
				change_set_id: newChangeSet.id,
				lixcol_version_id: "global",
			})
			.execute();

		// Create commit edges to both parents
		await trx
			.insertInto("commit_edge_all")
			.values([
				{
					parent_id: args.source.id,
					child_id: commitId,
					lixcol_version_id: "global",
				},
				{
					parent_id: args.target.id,
					child_id: commitId,
					lixcol_version_id: "global",
				},
			])
			.execute();

		// Return the commit
		const commit = await trx
			.selectFrom("commit")
			.where("id", "=", commitId)
			.selectAll()
			.executeTakeFirstOrThrow();

		return commit;
	};

	// Restore transaction handling
	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
