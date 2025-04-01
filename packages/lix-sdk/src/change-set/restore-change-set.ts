import type { Lix } from "../lix/index.js";
import type { ChangeSet } from "./database-schema.js";
import { applyChangeSet } from "./apply-change-set.js";
import { createChangeSet } from "./create-change-set.js";
import type { Version } from "../database/schema.js";

export async function restoreChangeSet(args: {
	lix: Lix;
	changeSet: Pick<ChangeSet, "id">;
	version?: Pick<Version, "id">;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const version =
			args.version ??
			(await trx
				.selectFrom("active_version")
				.select(["id"])
				.executeTakeFirstOrThrow());

		// Get all changes directly contained in the target change set
		// This is the state we want to restore to
		const changesToRestore = await trx
			.selectFrom("change")
			.innerJoin(
				"change_set_element",
				"change_set_element.change_id",
				"change.id"
			)
			.where("change_set_element.change_set_id", "=", args.changeSet.id)
			.selectAll("change")
			.execute();

		// Create a temporary change set with these changes
		const interimChangeSet = await createChangeSet({
			lix: { ...args.lix, db: trx },
			changes: changesToRestore,
		});

		// Apply the temporary change set to update the file state
		await applyChangeSet({
			lix: { ...args.lix, db: trx },
			changeSet: interimChangeSet,
		});

		// Update the version to point to the target change set
		await trx
			.updateTable("version_v2")
			.set({ change_set_id: args.changeSet.id })
			.where("id", "=", version.id)
			.execute();

		// Clean up the temporary change set
		await trx
			.deleteFrom("change_set")
			.where("id", "=", interimChangeSet.id)
			.execute();
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
