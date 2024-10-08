import type { Change, LixReadonly } from "@lix-js/sdk";

/**
 * Find the last "child" change of the given change.
 */
export async function getLeafChange(args: {
	change: Change;
	lix: LixReadonly;
}): Promise<Change> {
	const _true = true;

	let nextChange = args.change;
	const currentBranch = await args.lix.db
		.selectFrom("branch")
		.selectAll()
		.where("active", "=", _true)
		.executeTakeFirstOrThrow();

	while (_true) {
		const childChange = await args.lix.db
			.selectFrom("branch_change")
			.fullJoin("change", "branch_change.change_id", "change.id")
			.selectAll()
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
			.where("branch_id", "=", currentBranch.id)
			.where("change.parent_id", "=", nextChange?.id)
			.executeTakeFirst();

		if (!childChange) {
			break;
		}

		nextChange = childChange as Change;
	}

	return nextChange;
}
