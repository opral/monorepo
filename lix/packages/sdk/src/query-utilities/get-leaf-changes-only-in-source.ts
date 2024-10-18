import type { ChangeWithSnapshot } from "../database/schema.js";
import type { LixReadonly } from "../types.js";

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
		.selectAll("change")
		.select("snapshot.content")
		.where(
			"change.id",
			"not in",
			args.sourceLix.db
				.selectFrom("change")
				.innerJoin("change_edge", "change_edge.child_id", "change.id")
				.select("parent_id")
				.where("parent_id", "is not", null)
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
