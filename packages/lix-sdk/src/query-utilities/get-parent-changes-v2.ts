import type { Change } from "../database/schema.js";
import type { LixReadonly } from "../plugin/lix-plugin.js";

/**
 * Gets the parent change of a given change.
 *
 * @example
 *   ```ts
 *   const parents = await getParentChanges({ lix, change });
 *   ```
 */
export async function getParentChangesV2(args: {
	lix: Pick<LixReadonly, "db">;
	change: Pick<Change, "id">;
}): Promise<Change[]> {
	const parents = await args.lix.db
		.selectFrom("change_graph_edge")
		.innerJoin("change", "change.id", "change_graph_edge.parent_id")
		.selectAll("change")
		.where("change_graph_edge.child_id", "=", args.change.id)
		.execute();

	return parents;
}
