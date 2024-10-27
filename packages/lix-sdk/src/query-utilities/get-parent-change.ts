import type { Change } from "../database/schema.js";
import type { LixReadonly } from "../types.js";
import { isInSimulatedCurrentBranch } from "./is-in-simulated-branch.js";

/**
 * Gets the parent change of a given change.
 *
 * A change can have multiple parents. This function
 * returns the only parent of a change for a given
 * branch.
 *
 * @example
 *   ```ts
 *   const parent = await getParentChange({ lix, change });
 *   ```
 *
 * Additional Information
 *
 * - If you want to get all the parents of a change, use
 *   `getParentChanges` instead.
 */
export async function getParentChange(args: {
	lix: Pick<LixReadonly, "db"> & Partial<LixReadonly>;
	change: Pick<Change, "id"> & Partial<Change>;
}): Promise<Change | undefined> {
	const parents = await args.lix.db
		.selectFrom("change_graph_edge")
		.innerJoin("change", "change.id", "change_graph_edge.parent_id")
		.selectAll("change")
		.where("change_graph_edge.child_id", "=", args.change.id)
		.where(isInSimulatedCurrentBranch)
		.execute();
	if (parents.length > 1) {
		throw new Error(
			"Change has more than a single parent. This is an internal bug in lix. Please report it.",
		);
	}
	// undefined if no parents exist
	return parents[0];
}
