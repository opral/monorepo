import type { Conflict, LixPlugin } from "@lix-js/sdk";
import { getChangesNotInTarget } from "./utilities/getChangesNotInTarget.js";
import { getFirstCommonParent } from "./utilities/getFirstCommonParent.js";
import { getLastChildOfChange } from "./utilities/getLastChildOfChange.js";

export const reportConflicts: LixPlugin["reportConflicts"] = async ({
	sourceLix,
	targetLix,
  // TODO
  leafChangesOnlyInSource,
}) => {
	const result: Conflict[] = [];
	const changesNotInTarget = await getChangesNotInTarget({
		sourceLix,
		targetLix,
	});
	for (const change of changesNotInTarget) {
		const commonParent = await getFirstCommonParent({
			sourceChange: change,
			sourceLix,
			targetLix,
		});

		if (commonParent === undefined) {
			// no common parent, no conflict. must be an insert
			continue;
		}

		const lastChangeInTarget = await getLastChildOfChange({
			change: commonParent,
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
