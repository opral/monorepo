import type { Change, LixReadonly } from "@lix-js/sdk";

/**
 * Gets the leaf changes that only exist in the source lix.
 *
 * @example
 *   source changes = [c1, s1 (child of c1), s2 (child of s1), s3 (child of s2)]
 *   target changes = [c1, t1 (child of c1)]
 *   leaf changes only in source = [s3]
 */
// TODO optimize later to use a single sql query (attach mode)
export async function getLeafChangesOnlyInSource(args: {
	sourceLix: LixReadonly;
	targetLix?: LixReadonly;
	sourceBranchId?: string;
	targetBranchId?: string;
}): Promise<Change[]> {
	if (!args.targetLix) {
		args.targetLix = args.sourceLix;
	}
	if (!args.sourceBranchId) {
		args.sourceBranchId = (
			await args.sourceLix.db
				.selectFrom("branch")
				.select("id")
				.where("active", "=", true)
				.executeTakeFirstOrThrow()
		).id;
	}
	if (!args.targetBranchId) {
		args.targetBranchId = (
			await args.targetLix.db
				.selectFrom("branch")
				.select("id")
				.where("active", "=", true)
				.executeTakeFirstOrThrow()
		).id;
	}
	const result: Change[] = [];

	const leafChangesInSource = await args.sourceLix.db
		.selectFrom("change_view")
		.selectAll()
		.where("branch_id", "=", args.sourceBranchId)
		.where(
			"id",
			"not in",
			// @ts-ignore - no idea what the type issue is
			args.sourceLix.db
				.selectFrom("change_view")
				.select("parent_id")
				.where("parent_id", "is not", undefined)
				.where("branch_id", "=", args.sourceBranchId)
				.distinct(),
		)
		.execute();

	for (const change of leafChangesInSource) {
		const changeExistsInTarget = await args.targetLix.db
			.selectFrom("change_view")
			.select("id")
			.where("id", "=", change.id)
			.where("branch_id", "=", args.targetBranchId)
			.executeTakeFirst();

		if (!changeExistsInTarget) {
			result.push(change);
		}
	}
	return result;
}
