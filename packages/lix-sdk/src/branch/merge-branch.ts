import { createChangeConflict } from "../change-conflict/create-change-conflict.js";
import { detectChangeConflicts } from "../change-conflict/detect-change-conflicts.js";
import type { Branch } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

export async function mergeBranch(args: {
	lix: Lix;
	sourceBranch: Branch;
	targetBranch: Branch;
}) {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const diffingPointers = await getBranchChangePointerDiff(trx, args);

		// the set all change ids that are diffing
		const diffingChangeIds = new Set<string>();

		for (const pointer of diffingPointers) {
			if (pointer.source_change_id !== pointer.target_change_id) {
				if (pointer.source_change_id) {
					diffingChangeIds.add(pointer.source_change_id);
				}
				if (pointer.target_change_id) {
					diffingChangeIds.add(pointer.target_change_id);
				}
			}
		}

		// could be queried in a single query with a join
		// but decided to keep it simpler for now
		const diffingChanges = await trx
			.selectFrom("change")
			.select(["id"])
			.where("id", "in", [...diffingChangeIds])
			.selectAll()
			.execute();

		const detectedConflicts = await detectChangeConflicts({
			lix: { ...args.lix, db: trx },
			changes: diffingChanges,
		});

		// update the branch change pointers for non-conflicting changes
		await Promise.all(
			diffingPointers.map(async (pointer) => {
				// if the target branch has a pointer for the entity
				// change, check if there is a conflict
				if (pointer.target_change_id) {
					const detectedConflict = detectedConflicts.find((conflict) =>
						conflict.conflictingChangeIds.has(
							pointer.target_change_id as string,
						),
					);
					if (detectedConflict) {
						// don't update the branch change pointer
						return;
					}
				}

				// the change is not conflicting. the pointer can be updated
				if (pointer.source_change_id) {
					await trx
						.insertInto("branch_change_pointer")
						.values([
							{
								branch_id: args.targetBranch.id,
								change_id: pointer.source_change_id,
								change_file_id: pointer.change_file_id,
								change_entity_id: pointer.change_entity_id,
								change_type: pointer.change_type,
							},
						])
						.onConflict((oc) =>
							oc.doUpdateSet({ branch_id: args.targetBranch.id }),
						)
						.execute();
				}
			}),
		);

		// insert the detected conflicts
		// (ignore if the conflict already exists)
		for (const detectedConflict of detectedConflicts) {
			const conflict = await createChangeConflict({
				lix: { ...args.lix, db: trx },
				branch: args.targetBranch,
				key: detectedConflict.key,
				conflictingChangeIds: detectedConflict.conflictingChangeIds,
			});

			// todo move to createChangeConflict
			await trx
				.insertInto("branch_change_conflict_pointer")
				.values({
					branch_id: args.targetBranch.id,
					change_conflict_id: conflict.id,
				})
				.onConflict((oc) => oc.doNothing())
				.execute();
		}

		// in case no merge intent existed yet, create one
		// for continuous conflict detection between the
		// source and target branch
		await trx
			.insertInto("branch_merge_intent")
			.values({
				source_branch_id: args.sourceBranch.id,
				target_branch_id: args.targetBranch.id,
			})
			.onConflict((oc) => oc.doNothing())
			.execute();
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}

// could be optimized by returning the diffing changes
async function getBranchChangePointerDiff(
	trx: Lix["db"],
	args: {
		sourceBranch: Branch;
		targetBranch: Branch;
	},
): Promise<
	Array<{
		source_change_id: string | null;
		target_change_id: string | null;
		change_entity_id: string;
		change_file_id: string;
		change_type: string;
	}>
> {
	// Query to find changes in the source branch that do not exist in the target branch or differ from the target branch
	const sourceDiff = trx
		.selectFrom("branch_change_pointer as source")
		.leftJoin("branch_change_pointer as target", (join) =>
			join
				.onRef("source.change_entity_id", "=", "target.change_entity_id")
				.onRef("source.change_file_id", "=", "target.change_file_id")
				.onRef("source.change_type", "=", "target.change_type")
				.on("target.branch_id", "=", args.targetBranch.id),
		)
		.where("source.branch_id", "=", args.sourceBranch.id)
		.where((eb) =>
			eb.or([
				// Doesn't exist in targetBranch (new entity change)
				eb("target.change_id", "is", null),
				// Differs in targetBranch (different pointer)
				eb("source.change_id", "!=", eb.ref("target.change_id")),
			]),
		)
		.select([
			"source.change_id as source_change_id",
			"target.change_id as target_change_id",
			"source.change_entity_id",
			"source.change_file_id",
			"source.change_type",
		]);

	// Query to find changes in the target branch that do not exist in the source branch or differ from the source branch
	const targetDiff = trx
		.selectFrom("branch_change_pointer as target")
		.leftJoin("branch_change_pointer as source", (join) =>
			join
				.onRef("target.change_entity_id", "=", "source.change_entity_id")
				.onRef("target.change_file_id", "=", "source.change_file_id")
				.onRef("target.change_type", "=", "source.change_type")
				.on("source.branch_id", "=", args.sourceBranch.id),
		)
		.where("target.branch_id", "=", args.targetBranch.id)
		.where((eb) =>
			eb.or([
				// Doesn't exist in sourceBranch (new entity change)
				eb("source.change_id", "is", null),
				// Differs in sourceBranch (different pointer)
				eb("target.change_id", "!=", eb.ref("source.change_id")),
			]),
		)
		.select([
			"source.change_id as source_change_id",
			"target.change_id as target_change_id",
			"target.change_entity_id",
			"target.change_file_id",
			"target.change_type",
		]);

	// Combine the results of the source and target diffs using a union
	return await trx
		.selectFrom(
			sourceDiff
				.union(
					// @ts-expect-error - the sourceDiff expects source_change_id to not be null
					targetDiff,
				)
				.as("diff"),
		)
		.selectAll()
		.execute();
}
