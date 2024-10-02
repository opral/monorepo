import type { Change, LixReadonly } from "@lix-js/sdk";

/**
 * Finds the lowest common change of the source
 * change in the source lix and the target lix.
 *
 * https://en.wikipedia.org/wiki/Lowest_common_ancestor
 */
export async function getLowestCommonAncestor(args: {
	sourceChange: Change;
	sourceLix: LixReadonly;
	targetLix: LixReadonly;
}): Promise<Change | undefined> {
	// the change has no parent (it is the root change)
	if (!args.sourceChange?.parent_id) {
		return undefined;
	}

	const currentTargetBranch = await args.targetLix.db
		.selectFrom("branch")
		.selectAll()
		.where("active", "=", true)
		.executeTakeFirstOrThrow();

	const currentSourceBranch = await args.sourceLix.db
		.selectFrom("branch")
		.selectAll()
		.where("active", "=", true)
		.executeTakeFirstOrThrow();

	const changeExistsInTarget = await args.targetLix.db
		.selectFrom("branch_change")
		.leftJoin("change", "branch_change.change_id", "change.id")
		.select([
			"author",
			"change.id as id",
			"change.parent_id as parent_id",
			"type",
			"file_id",
			"plugin_key",
			"operation",
			"value",
			"meta",
			"created_at",
		])
		.orderBy("seq", "desc")
		.where("branch_id", "=", currentTargetBranch.id)
		.where("change.id", "=", args.sourceChange.id)
		.executeTakeFirst();

	if (changeExistsInTarget) {
		return changeExistsInTarget as Change;
	}

	let nextChange: Change | undefined = args.sourceChange;
	const _true = true;
	while (_true) {
		if (!nextChange?.parent_id) {
			// end of the change sequence. No common parent found.
			return undefined;
		}
		nextChange = (await args.sourceLix.db
			.selectFrom("branch_change")
			.leftJoin("change", "branch_change.change_id", "change.id")
			.select([
				"author",
				"change.id as id",
				"change.parent_id as parent_id",
				"type",
				"file_id",
				"plugin_key",
				"operation",
				"value",
				"meta",
				"created_at",
			])
			.where("branch_id", "=", currentSourceBranch.id)
			.orderBy("seq", "desc")
			.where("change.id", "=", nextChange.parent_id)
			.executeTakeFirst()) as Change;

		if (!nextChange) {
			// end of the change sequence. No common parent found.
			return undefined;
		}

		const changeExistsInTarget = await args.targetLix.db
			.selectFrom("branch_change")
			.leftJoin("change", "branch_change.change_id", "change.id")
			.select([
				"author",
				"change.id as id",
				"change.parent_id as parent_id",
				"type",
				"file_id",
				"plugin_key",
				"operation",
				"value",
				"meta",
				"created_at",
			])
			.where("branch_id", "=", currentTargetBranch.id)
			.where("change.id", "=", nextChange.id)
			.executeTakeFirst();

		if (changeExistsInTarget) {
			return changeExistsInTarget as Change;
		}
	}
	return;
}
