import type { Change, LixReadonly } from "@lix-js/sdk";
import { sql } from "kysely";

/**
 * Find the last "child" change of the given change.
 */
export async function getLeafChange(args: {
	change: Change;
	lix: LixReadonly;
}): Promise<Change> {
	const _true = true;

	let nextChange = args.change;

	while (_true) {
		const childChange = await args.lix.db
			.selectFrom("change")
			.selectAll()
			.where("parent_id", "=", nextChange.id)
			.executeTakeFirst();

		if (!childChange) {
			break;
		}

		nextChange = childChange;
	}

	return nextChange;
}

/**
 * Find the last "child" change of the given change.
 */
export async function getLeafChangeRecursive(args: {
	change: Change;
	lix: LixReadonly;
}): Promise<Change> {

	const statement = args.lix.db
	.withRecursive("ChangeGraph", (re) => {
		return re
			.selectFrom('change')
			.selectAll()
			.select(({ fn, val, ref }) => [
				sql<number>`1`.as("row_counter")])
			.where("id", "=", args.change.id)
			.unionAll((unionAll) => {
				return unionAll.selectFrom("change as c").innerJoin("ChangeGraph as cg", "cg.id", "c.parent_id").selectAll("c").select(({ fn, val, ref }) => [
					sql<number>`cg.row_counter + 1`.as("row_counter")]);
			})
	})
	.selectFrom("ChangeGraph")
	.selectAll()
	.orderBy("row_counter", "desc")
	.limit(1)


	return (await statement.executeTakeFirst()) ?? args.change;
	
	// const _true = true;

	// let nextChange = args.change;

	// while (_true) {
		
	// 	if (!childChange) {
	// 		break;
	// 	}

	// 	nextChange = childChange;
	// }

	// return nextChange;
}
