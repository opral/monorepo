import type { Lix } from "../lix/open-lix.js";
import type { VersionV2 } from "../version-v2/database-schema.js";
import { createChangeSet } from "./create-change-set.js";
import type { ChangeSet } from "./database-schema.js";

export async function createCheckpoint(args: {
	lix: Lix;
	/**
	 * Optional version to create checkpoint from.
	 * @default The active version
	 */
	version?: Pick<VersionV2, "id">;
}): Promise<ChangeSet> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const version = args.version
			? await trx
					.selectFrom("version_v2")
					.where("id", "=", args.version.id)
					.selectAll("version_v2")
					.executeTakeFirstOrThrow()
			: await trx
					.selectFrom("active_version")
					.innerJoin("version_v2", "version_v2.id", "active_version.version_id")
					.selectAll("version_v2")
					.executeTakeFirstOrThrow();

		const checkpointLabel = await trx
			.selectFrom("label")
			.where("name", "=", "checkpoint")
			.select("id")
			.executeTakeFirstOrThrow();

		// seal the working change set to insert it into the graph
		const returnChangeSet = await trx
			.updateTable("change_set")
			.where("change_set.id", "=", version.working_change_set_id)
			.set({ immutable_elements: true })
			.returningAll()
			.executeTakeFirstOrThrow();

		await trx
			.insertInto("change_set_edge")
			.values({
				parent_id: version.change_set_id,
				child_id: version.working_change_set_id,
			})
			.execute();

		await trx
			.insertInto("change_set_label")
			.values({
				change_set_id: version.working_change_set_id,
				label_id: checkpointLabel.id,
			})
			.execute();

		const newWorkingCs = await createChangeSet({
			lix: { ...args.lix, db: trx },
			immutableElements: false,
		});

		// need to disable the trigger to avoid
		// duplicate working change set updates
		await trx
			.insertInto("key_value")
			.values({
				key: "lix_skip_update_working_change_set",
				value: "true",
				skip_change_control: true,
			})
			.execute();

		await trx
			.updateTable("version_v2")
			.set({
				change_set_id: version.working_change_set_id,
				working_change_set_id: newWorkingCs.id,
			})
			.where("id", "=", version.id)
			.execute();

		await trx
			.deleteFrom("key_value")
			.where("key", "=", "lix_skip_update_working_change_set")
			.execute();

		return returnChangeSet;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
