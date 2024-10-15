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

	const changeExistsInTarget = await args.targetLix.db
		.selectFrom("change")
		.selectAll()
		.where("id", "=", args.sourceChange.id)
		.executeTakeFirst();

	if (changeExistsInTarget) {
		return changeExistsInTarget;
	}

	let nextChange: Change | undefined;
	let parentId: string | undefined | null = args.sourceChange.parent_id;

	if (!parentId) {
		return // ok the change was not part of the target but also has no parent (no common ancestor!)
	}
	
	while (parentId) {
		nextChange = await args.sourceLix.db
			.selectFrom("change")
			.selectAll()
			.where("id", "=", parentId!)
			.executeTakeFirst();

		if (!nextChange) {
			// end of the change sequence. No common parent found.
			return undefined;
		}

		const changeExistsInTarget = await args.targetLix.db
			.selectFrom("change")
			.selectAll()
			.where("id", "=", nextChange.id)
			.executeTakeFirst();

		if (changeExistsInTarget) {
			return changeExistsInTarget;
		}

		parentId = nextChange.parent_id;
	}
	return;
}
