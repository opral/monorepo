import type { Lix } from "../lix/open-lix.js";
import { changeSetElementInAncestryOf } from "../query-filter/change-set-element-in-ancestry-of.js";
import { changeSetElementIsLeafOf } from "../query-filter/change-set-element-is-leaf-of.js";
import type { ChangeSet } from "./database-schema.js";

export async function mergeChangeSets(args: {
	lix: Lix;
	source: ChangeSet;
	target: ChangeSet;
}): Promise<ChangeSet> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const newChangeSet = await trx
			.insertInto("change_set")
			.defaultValues()
			.returningAll()
			.executeTakeFirstOrThrow();

		const symmetricDifference = await trx
			.selectFrom("change_set_element")
			// get the union of all elements via the change set graph
			.where((eb) =>
				eb.or([
					changeSetElementInAncestryOf(args.source)(eb),
					changeSetElementInAncestryOf(args.target)(eb),
				])
			)
			// and only the leaf elements
			.where((eb) =>
				eb.or([
					changeSetElementIsLeafOf(args.source)(eb),
					changeSetElementIsLeafOf(args.target)(eb),
				])
			)
			.selectAll()
			.execute();

		await trx
			.insertInto("change_set_element")
			.values(
				symmetricDifference.map((ce) => ({
					...ce,
					change_set_id: newChangeSet.id,
				}))
			)
			.execute();

		return newChangeSet;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
