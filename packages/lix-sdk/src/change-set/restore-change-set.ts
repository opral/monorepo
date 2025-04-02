import type { Lix } from "../lix/index.js";
import type { ChangeSet } from "./database-schema.js";
import { applyChangeSet } from "./apply-change-set.js";
import { createChangeSet } from "./create-change-set.js";
import { changeSetElementIsLeafOf } from "../query-filter/change-set-element-is-leaf-of.js";
import { changeSetElementInAncestryOf } from "../query-filter/change-set-element-in-ancestry-of.js";
import type { VersionV2 } from "../version-v2/database-schema.js";

export async function restoreChangeSet(args: {
	lix: Lix;
	changeSet: Pick<ChangeSet, "id">;
	version?: Pick<VersionV2, "id">;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const version = args.version
			? await trx
					.selectFrom("version_v2")
					.where("id", "=", args.version.id)
					.select(["id", "change_set_id"])
					.executeTakeFirstOrThrow()
			: await trx
					.selectFrom("active_version")
					.innerJoin("version_v2", "version_v2.id", "active_version.id")
					.select(["id", "change_set_id"])
					.executeTakeFirstOrThrow();

		const leafChangesToRestore = await trx
			.selectFrom("change")
			.innerJoin(
				"change_set_element",
				"change_set_element.change_id",
				"change.id"
			)
			.where(changeSetElementInAncestryOf(args.changeSet))
			.where(changeSetElementIsLeafOf(args.changeSet))
			.selectAll("change")
			.execute();

		const leafEntitiesToDelete = await trx
			.selectFrom("change")
			.innerJoin(
				"change_set_element",
				"change_set_element.change_id",
				"change.id"
			)
			.where(changeSetElementInAncestryOf({ id: version.change_set_id }))
			.where(changeSetElementIsLeafOf({ id: version.change_set_id }))
			.selectAll("change")
			.execute();

		console.log(
			"changesToRestore",
			leafChangesToRestore.map((c) => c.id)
		);

		console.log(
			"changesToDelete",
			leafEntitiesToDelete.map((c) => c.id)
		);

		// Create a temporary change set with these changes
		const interimRestoreChangeSet = await createChangeSet({
			lix: { ...args.lix, db: trx },
			changes: [...leafChangesToRestore],
		});

		// Apply the temporary change set to update the file state
		await applyChangeSet({
			lix: { ...args.lix, db: trx },
			changeSet: interimRestoreChangeSet,
		});

		// Update the version to point to the target change set
		await trx
			.updateTable("version_v2")
			.set({ change_set_id: args.changeSet.id })
			.where("id", "=", version.id)
			.execute();

		// Clean up the temporary change set
		// await trx
		// 	.deleteFrom("change_set")
		// 	.where("id", "=", interimRestoreChangeSet.id)
		// 	.execute();
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
