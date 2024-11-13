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
	parent?: Pick<Branch, "id">;
	name?: Branch["name"];
}): Promise<Branch> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const branch = await trx
			.insertInto("branch")
			.defaultValues()
			.returningAll()
			.executeTakeFirstOrThrow();

		if (args.name) {
			await trx
				.updateTable("branch")
				.set({ name: args.name })
				.where("id", "=", branch.id)
				.execute();
		}

		// copy the change pointers from the parent branch
		if (args.parent?.id) {
			await trx
				.insertInto("branch_change_pointer")
				.columns([
					"branch_id",
					"change_id",
					"change_file_id",
					"change_entity_id",
					"change_schema_key",
				])
				.expression((eb) =>
					eb
						.selectFrom("branch_change_pointer")
						.select([
							eb.val(branch.id).as("branch_id"),
							"change_id",
							"change_file_id",
							"change_entity_id",
							"change_schema_key",
						])
						.where("branch_id", "=", args.parent!.id),
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

			// await trx
			// 	.insertInto("branch_target")
			// 	.values({
			// 		source_branch_id: branch.id,
			// 		target_branch_id: args.parent.id,
			// 	})
			// 	// ignore if the merge intent already exists
			// 	.onConflict((oc) => oc.doNothing())
			// 	.execute();
		}

		return branch;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
