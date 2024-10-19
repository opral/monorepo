import {
	getLowestCommonAncestor,
	getLeafChange,
	type LixPlugin,
	type Conflict,
} from "@lix-js/sdk";

export const detectConflicts: LixPlugin["detectConflicts"] = async ({
	sourceLix,
	targetLix,
	leafChangesOnlyInSource,
}) => {
	const result: Conflict[] = [];

	for (const change of leafChangesOnlyInSource) {
		const lowestCommonAncestor = await getLowestCommonAncestor({
			sourceChange: change,
			sourceLix,
			targetLix,
		});

		if (lowestCommonAncestor === undefined) {
			// no common parent, no conflict. must be an insert
			continue;
		}

		const leafChangeInTarget = await getLeafChange({
			change: lowestCommonAncestor,
			lix: targetLix,
		});

		if (lowestCommonAncestor.id === leafChangeInTarget.id) {
			// no conflict. the lowest common ancestor is
			// the leaf change in the target. aka, no changes
			// in target have been made that could conflict with the source
			continue;
		}

		const hasDiff =
			JSON.stringify(change.value) !== JSON.stringify(leafChangeInTarget.value);
		if (hasDiff === false) {
			continue;
		}

		// naive raise any snapshot difference as a conflict for now
		// more sophisticated conflict reporting can be incrementally added
		result.push({
			change_id: leafChangeInTarget.id,
			conflicting_change_id: change.id,
			reason:
				"The snapshots of the change do not match. More sophisticated reasoning will be added later.",
			meta: undefined,
			resolved_with_change_id: undefined,
		});
	}

	return result;
};
