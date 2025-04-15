import type { Lix } from "../lix/open-lix.js";
import { changeSetElementInAncestryOf } from "../query-filter/change-set-element-in-ancestry-of.js";
import { changeSetElementIsLeafOf } from "../query-filter/change-set-element-is-leaf-of.js";
import { createChangeSet } from "./create-change-set.js";
import type { ChangeSet } from "./database-schema.js";

/**
 * Merges two change sets using a "source wins" strategy (until lix models conflicts).
 *
 * Creates a new change set containing the merged result. If an element
 * (identified by entity_id, file_id, schema_key) exists in both the source
 * and target change sets (considering their respective histories), the element
 * from the source change set's history takes precedence.
 *
 * @param args - The arguments for the merge operation.
 * @param args.lix - The Lix instance.
 * @param args.source - The source change set (only `id` is needed).
 * @param args.target - The target change set (only `id` is needed).
 *
 * @returns A Promise resolving to the newly created ChangeSet representing the merged state.
 */
export async function mergeChangeSets(args: {
	lix: Lix;
	source: Pick<ChangeSet, "id">;
	target: Pick<ChangeSet, "id">;
}): Promise<ChangeSet> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Create edges from source and target parents to the new merge change set

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
			parents: [args.source, args.target],
		});

		return newChangeSet;
	};

	// Restore transaction handling
	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
