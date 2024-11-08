import { createChangeConflict } from "../change-conflict/create-change-conflict.js";
import { detectDivergingEntityConflict } from "../change-conflict/detect-diverging-entity-conflict.js";
import type { Branch } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";
import type { DetectedConflict } from "../plugin/lix-plugin.js";

export async function mergeBranch(args: {
	lix: Lix;
	sourceBranch: Branch;
	targetBranch: Branch;
}) {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const diffingPointers = await getBranchChangePointerDiff(trx, args);

		// could be queried in a single query with a join
		// but decided to keep it simpler for now
		const diffingChanges = await trx
			.selectFrom("change")
			.select(["id"])
			.where(
				"id",
				"in",
				diffingPointers.map((pointer) => pointer.source_change_id),
			)
			.selectAll()
			.execute();

		const plugins = await args.lix.plugin.getAll();
		const detectedConflicts: DetectedConflict[] = [];

		// let plugin detect conflicts
		await Promise.all(
			plugins.map(async (plugin) => {
				if (plugin.detectConflictsV2) {
					const conflicts = await plugin.detectConflictsV2({
						lix: args.lix,
						changes: diffingChanges,
					});
					detectedConflicts.push(...conflicts);
				}
			}),
		);

		// update the branch change pointers for non-conflicting changes
		await Promise.all(
			diffingPointers.map(async (pointer) => {
				// if the target branch has a pointer for the entity
				// change, check if there is a conflict
				if (pointer.target_change_id) {
					const pluginDetectedConflict = detectedConflicts.find((conflict) =>
						conflict.conflicting_change_ids.has(
							pointer.target_change_id as string,
						),
					);
					if (pluginDetectedConflict) {
						// don't update the branch change pointer
						return;
					}

					// if the entity change doesn't exist in the target
					// it can't conflict (except if a plugin detected
					// a semantic conflict)
					const hasDivergingEntityConflict = !pointer.target_change_id
						? false
						: await detectDivergingEntityConflict({
								lix: { db: trx },
								changeA: { id: pointer.source_change_id },
								changeB: { id: pointer.target_change_id },
							});

					if (hasDivergingEntityConflict) {
						detectedConflicts.push(hasDivergingEntityConflict);
						// return because the change is conflicting
						return;
					}
				}

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
			}),
		);

		// insert the detected conflicts
		// (ignore if the conflict already exists)
		for (const detectedConflict of detectedConflicts) {
			await createChangeConflict({
				lix: { ...args.lix, db: trx },
				key: detectedConflict.key,
				conflictingChangeIds: detectedConflict.conflicting_change_ids,
			});
		}
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
) {
	return await trx
		// select all change pointers from the source branch
		.selectFrom("branch_change_pointer as source")
		.where("source.branch_id", "=", args.sourceBranch.id)
		// and join them with the change pointers from the target branch
		.leftJoin("branch_change_pointer as target", (join) =>
			join
				// join related change pointers
				// related = same entity, file, and type
				.onRef("source.change_entity_id", "=", "target.change_entity_id")
				.onRef("source.change_file_id", "=", "target.change_file_id")
				.onRef("source.change_type", "=", "target.change_type")
				.on("target.branch_id", "=", args.targetBranch.id),
		)
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
		])
		.execute();
}
