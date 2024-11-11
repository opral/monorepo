import type { Branch } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

/**
 * Creates a new branch.
 *
 * @example
 *   ```ts
 *   const branch = await createBranch({ lix, from: otherBranch });
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
		if (args.parent !== undefined) {
			await trx
				.insertInto("branch_change_pointer")
				.columns([
					"branch_id",
					"change_id",
					"change_file_id",
					"change_entity_id",
					"change_type",
				])
				.expression((eb) =>
					trx
						.selectFrom("branch_change_pointer")
						.select([
							eb.val(branch.id).as("branch_id"),
							"change_id",
							"change_file_id",
							"change_entity_id",
							"change_type",
						])
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
