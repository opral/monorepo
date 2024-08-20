import {
	getLowestCommonAncestor,
	getLeafChange,
	type Conflict,
	type LixPlugin,
} from "@lix-js/sdk";

export const detectConflicts: LixPlugin["detectConflicts"] = async ({
	sourceLix,
	targetLix,
	leafChangesOnlyInSource,
}) => {
	const result: Conflict[] = [];
	for (const change of leafChangesOnlyInSource) {
		const commonChange = await getLowestCommonAncestor({
			sourceChange: change,
			sourceLix,
			targetLix,
		});

		if (commonChange === undefined) {
			// no common parent, no conflict. must be an insert
			continue;
		}

		const lastChangeInTarget = await getLeafChange({
			change: commonChange,
			lix: targetLix,
		});

		const hasDiff =
			JSON.stringify(change.value) !== JSON.stringify(lastChangeInTarget.value);

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
			change_id: lastChangeInTarget.id,
			conflicting_change_id: change.id,
			reason:
				"The snapshots of the change do not match. More sophisticated reasoning will be added later.",
		});
	}
	return result;
};
