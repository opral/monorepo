import type { Change } from "../database/schema.js";
import type { LixReadonly } from "../types.js";
import { isInSimulatedCurrentBranch } from "./is-in-simulated-branch.js";

/**
 * Find the last "child" change of the given change.
 */
export async function getLeafChange(args: {
	change: Change;
	lix: Pick<LixReadonly, "db">;
}): Promise<Change> {
	const _true = true;

	let nextChange = args.change;

	while (_true) {
		const childChange = await args.lix.db
			.selectFrom("change")
			.selectAll()
			.innerJoin("change_graph_edge", "change_graph_edge.child_id", "change.id")
			.where("parent_id", "=", nextChange.id)
			.where(isInSimulatedCurrentBranch)
			.executeTakeFirst();

		if (!childChange) {
			break;
		}

		nextChange = childChange;
	}

	return nextChange;
}
