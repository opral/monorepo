import type { Change, LixReadonly } from "@lix-js/sdk";

/**
 * Find the first common parent of two changes.
 *
 * - Returns `undefined` if no common parent exists.
 */
export async function getCommonParent(args: {
	sourceChange: Change;
	sourceLix: LixReadonly;
	targetLix: LixReadonly;
}): Promise<Change | undefined> {
	// the change has no parent (is the root change)
	if (args.sourceChange?.parent_id === undefined) {
		return undefined;
	}

	const sourceChangeExistsInTarget = await args.targetLix.db
		.selectFrom("change")
		.selectAll()
		.where("id", "=", args.sourceChange.id)
		.executeTakeFirst();

	if (sourceChangeExistsInTarget) {
		throw Error(
			"Source change exists in target. No need to find a common parent.",
		);
	}

	let nextChange: Change | undefined;
	const _true = true;
	while (_true) {
		nextChange = await args.sourceLix.db
			.selectFrom("change")
			.selectAll()
			.where("id", "=", nextChange?.parent_id ?? args.sourceChange.parent_id)
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
	}
	return;
}
