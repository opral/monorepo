import {
	getLowestCommonAncestor,
	getLeafChange,
	type LixPlugin,
	getLeafChangesOnlyInSource,
	type DetectedConflict,
} from "@lix-js/sdk";

export const detectConflicts: NonNullable<
	LixPlugin["detectConflicts"]
> = async ({ sourceLix, targetLix }) => {
	const result: DetectedConflict[] = [];

	const leafChangesOnlyInSource = await getLeafChangesOnlyInSource({
		sourceLix,
		targetLix,
	});

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

		const targetSnapshot = await targetLix.db
			.selectFrom("snapshot")
			.selectAll()
			.where("id", "=", leafChangeInTarget.snapshot_id)
			.executeTakeFirstOrThrow();

		const snapshot = await sourceLix.db
			.selectFrom("snapshot")
			.selectAll()
			.where("id", "=", change.snapshot_id)
			.executeTakeFirstOrThrow();

		const hasDiff =
			JSON.stringify(snapshot.content) !==
			JSON.stringify(targetSnapshot.content);

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
		});
	}

	return result;
};
