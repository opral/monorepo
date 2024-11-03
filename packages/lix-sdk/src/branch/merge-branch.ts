import type { L } from "vitest/dist/chunks/reporters.C4ZHgdxQ.js";
import type { Branch } from "../database/schema.js";
import type { Lix } from "../open/openLix.js";

export async function mergeBranch(args: {
	lix: Lix;
	sourceBranch: Branch;
	targetBranch: Branch;
}) {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// 1. Diff the change pointers
		const changePointerDiffs = await getChangePointerDiffs(trx, args);
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}

async function getChangePointerDiffs(
	trx: Lix["db"],
	args: {
		sourceBranch: Branch;
		targetBranch: Branch;
	},
) {
	return await trx
		// selecting source change pointers
		.selectFrom("branch_change_pointer as source")
		.where("source.branch_id", "=", args.sourceBranch.id)
		// and target change pointers
		.leftJoin("branch_change_pointer as target", (join) =>
			join
				.onRef("source.change_entity_id", "=", "target.change_entity_id")
				.onRef("source.change_file_id", "=", "target.change_file_id")
				.onRef("source.change_type", "=", "target.change_type")
				.on("target.branch_id", "=", args.targetBranch.id),
		)

		.select([
			"source.change_id as source_change_id",
			"source.change_entity_id",
			"source.change_file_id",
			"source.change_type",
			"source.branch_id as source_branch_id",
			"target.change_id as target_change_id",
		])
		.where((qb) =>
			qb.or([
				qb.and([
					"target.change_id",
					"is",
					null, // Doesn't exist in targetBranch at all
				]),
				qb.and([
					"target.change_id",
					"is not",
					null,
					qb.not("source.change_id", "=", "target.change_id"), // Differs in change_id
				]),
			]),
		)
		.execute();
}
