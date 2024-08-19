import type { Change, LixReadonly } from "@lix-js/sdk";

export async function getChangesNotInTarget(args: {
	sourceLix: LixReadonly;
	targetLix: LixReadonly;
}): Promise<Change[]> {
	const changesNotInTarget: Change[] = [];
	const sourceChanges = await args.sourceLix.db
		.selectFrom("change")
		.selectAll()
		.execute();
	for (const change of sourceChanges) {
		const changeExistsInTarget = await args.targetLix.db
			.selectFrom("change")
			.selectAll()
			.where("id", "=", change.id)
			.executeTakeFirst();
		if (!changeExistsInTarget) {
			changesNotInTarget.push(change);
		}
	}
	return changesNotInTarget;
}
