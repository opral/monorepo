import type { Change, ChangeWithSnapshot, LixReadonly } from "@lix-js/sdk";

/**
 * Gets the leaf changes that only exist in the source lix.
 *
 * @example
 *   source changes = [c1, s1 (child of c1), s2 (child of s1), s3 (child of s2)]
 *   target changes = [c1, t1 (child of c1)]
 *   leaf changes only in source = [s3]
 */
// TODO optimize later to use a single sql query (attach mode)
export async function getLeafChangesOnlyInSource(args: {
	sourceLix: LixReadonly;
	targetLix: LixReadonly;
}): Promise<ChangeWithSnapshot[]> {
	const result: ChangeWithSnapshot[] = [];

	const leafChangesInSource = await args.sourceLix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.selectAll('change')
		.select("snapshot.value as value")
		.where(
			"change.id",
			"not in",
			// @ts-ignore - no idea what the type issue is
			args.sourceLix.db
				.selectFrom("change")
				.select("parent_id")
				.where("parent_id", "is not", undefined)
				.distinct(),
		)
		.execute();

	for (const change of leafChangesInSource) {
		const changeExistsInTarget = await args.targetLix.db
			.selectFrom("change")
			.select("id")
			.where("id", "=", change.id)
			.executeTakeFirst();

		if (!changeExistsInTarget) {
			result.push(change);
		}
	}
	return result;
}
