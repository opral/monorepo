import { detectChangeConflicts } from "../change-conflict/detect-change-conflicts.js";
import type { Branch, Change } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";
import type { DetectedConflict } from "../plugin/lix-plugin.js";

export async function diffBranch(args: {
	lix: Lix;
	sourceBranch: Pick<Branch, "id">;
	targetBranch: Pick<Branch, "id">;
}): Promise<{
	changePointers: Array<{
		source_change_id: string | null;
		target_change_id: string | null;
		change_entity_id: string;
		change_file_id: string;
		change_type: string;
	}>;
	detectedConflicts: DetectedConflict[];
	changes: Array<Change>;
}> {
	const executeInTransaction = async (trx: Lix["db"]) => {
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
				"source.change_entity_id as change_entity_id",
				"source.change_file_id as change_file_id",
				"source.change_type as change_type",
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
				"target.change_entity_id as change_entity_id",
				"target.change_file_id as change_file_id",
				"target.change_type as change_type",
			]);

		// Combine the results of the source and target diffs using a union
		const changePointers = await trx
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

		const changeIds = changePointers
			.flatMap((change) => [change.source_change_id, change.target_change_id])
			.filter(Boolean);

		// Retrieve the full change details for the changes involved in the diff
		const changes = await trx
			.selectFrom("change")
			.where("id", "in", changeIds)
			.selectAll()
			.execute();

		// Detect conflicts using the detectChangeConflicts function
		const detectedConflicts = await detectChangeConflicts({
			lix: { ...args.lix, db: trx },
			changes,
		});

		return {
			changePointers,
			detectedConflicts,
			changes,
		};
	};
	if (args.lix.db.isTransaction) {
		return await executeInTransaction(args.lix.db);
	} else {
		return await args.lix.db.transaction().execute(executeInTransaction);
	}
}
