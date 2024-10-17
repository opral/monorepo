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
			.where(isInSimulatedCurrentBranch)
			.where("parent_id", "=", nextChange.id)
			.executeTakeFirst();

		if (!childChange) {
			break;
		}

		nextChange = childChange;
	}

	return nextChange;
}
