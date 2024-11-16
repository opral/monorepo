import type { Change } from "../database/schema.js";
import type { DetectedConflict, LixReadonly } from "../plugin/lix-plugin.js";
import { changeIsLowestCommonAncestorOf } from "../query-filter/change-is-lowest-common-ancestor-of.js";

export const LIX_DIVERGING_ENTITY_CONFLICT_KEY =
	"lix-diverging-entity-conflict";

/**
 * Detects a diverging entity conflict between two changes.
 *
 * When two changes are diverging, it means that they are
 * based on the same entity state, but have different
 * changes to the entity.
 *
 * A diverging entity conflict usually happens when two users
 * are working on the same entity and both have made changes
 * to the entity but are not in sync.
 *
 * @note
 *   Filter out changes that are not based on the same entity
 *   before calling this function to reduce the number of
 *   comparisons.
 *
 * @example
 *   const detectedConflict = await detectDivergingEntityConflict({
 *      	lix: lix,
 * 				changes: [changeA, changeB],
 *   });
 *
 * @returns The detected conflict or undefined if no conflict was detected.
 */
export async function detectDivergingEntityConflict(args: {
	lix: Pick<LixReadonly, "db">;
	changes: Pick<Change, "id" | "entity_id" | "file_id" | "schema_key">[];
}): Promise<DetectedConflict | undefined> {
	const conflictingChangeIds = new Set<string>();

	// iterate over all pairs of changes
	for (let i = 0; i < args.changes.length; i++) {
		for (let j = i + 1; j < args.changes.length; j++) {
			const changeA = args.changes[i];
			const changeB = args.changes[j];

			if (changeA === undefined || changeB === undefined) {
				continue;
			}

			// the primary key differs, the changes can't be diverging
			// because they are based on different entities
			if (
				changeA.entity_id !== changeB.entity_id ||
				changeA.file_id !== changeB.file_id ||
				changeA.schema_key !== changeB.schema_key
			) {
				continue;
			}

			const lowestCommonAncestor = await args.lix.db
				.selectFrom("change")
				.where(changeIsLowestCommonAncestorOf([changeA, changeB]))
				.select("id")
				.executeTakeFirst();

			if (lowestCommonAncestor === undefined) {
				continue;
			}
			// change a or b is the lowest common ancestor, aka no divergence
			if (
				changeA.id === lowestCommonAncestor.id ||
				changeB.id === lowestCommonAncestor.id
			) {
				continue;
			}
			conflictingChangeIds.add(changeA.id);
			conflictingChangeIds.add(changeB.id);
		}
	}
	if (conflictingChangeIds.size === 0) {
		return undefined;
	}
	return {
		key: LIX_DIVERGING_ENTITY_CONFLICT_KEY,
		conflictingChangeIds,
	};
}
