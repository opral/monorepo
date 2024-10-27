import type { Change } from "../database/schema.js";
import type { LixReadonly } from "../types.js";

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
	const parentEdges = await args.sourceLix.db
		.selectFrom("change_graph_edge")
		.selectAll()
		.where("child_id", "=", args.sourceChange.id)
		// TODO https://github.com/opral/lix-sdk/issues/105
		// .where(isInSimulatedCurrentBranch)
		.execute();

	// the change has no parents (it is the root change)
	if (parentEdges.length === 0) {
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
	// TODO assumes that only one parent exists
	// https://github.com/opral/lix-sdk/issues/105
	let parentId = parentEdges[0]?.parent_id;

	if (!parentId) {
		return undefined;
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
			// TODO account for multiple parents
			.executeTakeFirst();

		if (changeExistsInTarget) {
			return changeExistsInTarget;
		}

		const parentEdges = await args.sourceLix.db
			.selectFrom("change_graph_edge")
			.selectAll()
			.where("child_id", "=", nextChange.id)
			.execute();
		// TODO assumes that only one parent exists
		if (parentEdges.length > 1) {
			// https://github.com/opral/inlang-sdk/issues/134
			throw new Error(
				"Unimplemented. Multiple parents not supported until the branch feature exists.",
			);
		}
		parentId = parentEdges[0]?.parent_id;
	}
	return;
}
