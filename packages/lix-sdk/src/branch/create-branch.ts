import type { Branch } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

/**
 * Creates a new branch.
 * 
 * If parent is provided, the new branch will copy the change pointers from the parent branch,
 * and create a merge intent from the new branch to the parent branch.
 *
 * @example
 *   _Without parent_
 * 
 *   ```ts
 *   const branch = await createBranch({ lix });
 *   ```
 *   
 * @example
 *   _With parent_
 * 
 *   ```ts
 *   const branch = await createBranch({ lix, parent: otherBranch });
 *   ```
 */
export async function createBranch(args: {
	lix: Pick<Lix, "db">;
	parent?: Pick<Branch, "id" | "change_set_id">;
	name?: Branch["name"];
}): Promise<Branch> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const changeSet = await trx
			.insertInto("change_set")
			.defaultValues()
			.returningAll()
			.executeTakeFirstOrThrow();

		const branch = await trx
			.insertInto("branch")
			.values({
				change_set_id: changeSet.id,
				name: args.name,
			})
			.returningAll()
			.executeTakeFirstOrThrow();

		// copy the change pointers from the parent branch
		if (args.parent) {
			await trx
				.insertInto("change_set_element")
				.columns(["change_set_id", "change_id"])
				.expression((eb) =>
					eb
						.selectFrom("change_set_element")
						.select([eb.val(changeSet.id).as("change_set_id"), "change_id"])
						.where("change_set_id", "=", args.parent!.change_set_id),
				)
				.execute();

			// copy the change conflict pointers from the parent branch
			await trx
				.insertInto("branch_change_conflict_pointer")
				.columns(["branch_id", "change_conflict_id"])
				.expression((eb) =>
					eb
						.selectFrom("branch_change_conflict_pointer")
						.select([eb.val(branch.id).as("branch_id"), "change_conflict_id"])
						.where("branch_id", "=", args.parent!.id),
				)
				.execute();
		}

		return branch;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
