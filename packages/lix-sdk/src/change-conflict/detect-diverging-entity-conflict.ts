import type { Change } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";
import type { DetectedConflict } from "../plugin/lix-plugin.js";
import { getLowestCommonAncestorV2 } from "../query-utilities/get-lowest-common-ancestor-v2.js";

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
 * @returns The detected conflict or undefined if no conflict was detected.
 */
export async function detectDivergingEntityConflict(args: {
	lix: Pick<Lix, "db">;
	changeA: Pick<Change, "id">;
	changeB: Pick<Change, "id">;
}): Promise<DetectedConflict | undefined> {
	const lowestCommonAncestor = await getLowestCommonAncestorV2(args);
	if (lowestCommonAncestor === undefined) {
		return undefined;
	}
	// change a or b is the lowest common ancestor, aka no divergence
	if (
		args.changeA.id === lowestCommonAncestor.id ||
		args.changeB.id === lowestCommonAncestor.id
	) {
		return undefined;
	}
	// neither change a or b is the lowest common ancestor.
	// hence, one change is diverged
	return {
		key: LIX_DIVERGING_ENTITY_CONFLICT_KEY,
		conflictingChangeIds: new Set([args.changeA.id, args.changeB.id]),
	};
}
