// import { createChangeConflict } from "../change-conflict/create-change-conflict.js";
// import { detectChangeConflicts } from "../change-conflict/detect-change-conflicts.js";
// import type { Branch } from "../database/schema.js";
// import type { Lix } from "../lix/open-lix.js";

// export async function updateChangeConflicts(args: {
// 	lix: Pick<Lix, "db" | "plugin">;
// 	branch: Pick<Branch, "id">;
// }) {
// 	const executeInTransaction = async (trx: Lix["db"]) => {
// 		// const targetBranches = await trx
// 		// 	.selectFrom("branch_target")
// 		// 	.where("target_branch_id", "=", args.branch.id)
// 		// 	.selectAll()
// 		// 	.execute();

// 		for (const targetBranch of [args.branch]) {
// 			const diffingPointers = await getBranchChangePointerDiff(trx, {
// 				sourceBranch: { id: targetBranch.source_branch_id },
// 				targetBranch: { id: targetBranch.target_branch_id },
// 			});

// 			// the set all change ids that are diffing
// 			const diffingChangeIds = new Set<string>();

// 			for (const pointer of diffingPointers) {
// 				if (pointer.source_change_id !== pointer.target_change_id) {
// 					if (pointer.source_change_id) {
// 						diffingChangeIds.add(pointer.source_change_id);
// 					}
// 					if (pointer.target_change_id) {
// 						diffingChangeIds.add(pointer.target_change_id);
// 					}
// 				}
// 			}

// 			// could be queried in a single query with a join
// 			// but decided to keep it simpler for now
// 			const diffingChanges = await trx
// 				.selectFrom("change")
// 				.select(["id"])
// 				.where("id", "in", [...diffingChangeIds])
// 				.selectAll()
// 				.execute();

// 			const detectedConflicts = await detectChangeConflicts({
// 				lix: { ...args.lix, db: trx },
// 				changes: diffingChanges,
// 			});

// 			// insert the detected conflicts
// 			// (ignore if the conflict already exists)
// 			for (const detectedConflict of detectedConflicts) {
// 				const conflict = await createChangeConflict({
// 					lix: { ...args.lix, db: trx },
// 					branch: args.branch,
// 					key: detectedConflict.key,
// 					conflictingChangeIds: detectedConflict.conflictingChangeIds,
// 				});

// 				// todo move to createChangeConflict
// 				await trx
// 					.insertInto("branch_change_conflict_pointer")
// 					.values({
// 						branch_id: args.branch.id,
// 						change_conflict_id: conflict.id,
// 					})
// 					.onConflict((oc) => oc.doNothing())
// 					.execute();
// 			}
// 		}
// 	};

// 	if (args.lix.db.isTransaction) {
// 		return executeInTransaction(args.lix.db);
// 	} else {
// 		return args.lix.db.transaction().execute(executeInTransaction);
// 	}
// }
