// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import {
	getLowestCommonAncestor,
	getLeafChange,
	type LixPlugin,
	type NewConflict,
} from "@lix-js/sdk";

export const detectConflicts: LixPlugin["detectConflicts"] = async ({
	sourceLix,
	targetLix,
	leafChangesOnlyInSource,
}) => {
	const result: NewConflict[] = [];
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
			// TODO we have two different changes that yielded the same snapshot,
			// lix or the plugin need to change the parents of the target change
			// to both the source and the target change. users likely want to
			// see that two "branches" led to the same snapshot
			continue;
		}

		// naive raise any snapshot difference as a conflict for now
		// more sophisticated conflict reporting can be incrementally added
		result.push({
			change_id: leafChangeInTarget.id,
			conflicting_change_id: change.id,
			reason:
				"The snapshots of the change do not match. More sophisticated reasoning will be added later.",
		});
	}
	return result;
};
