import type { Lix } from "../lix/open-lix.js";
import type { Version } from "../version/database-schema.js";
import type { ChangeSet } from "./database-schema.js";

export async function createCheckpoint(args: {
	lix: Lix;
	/**
	 * Optional version to create checkpoint from.
	 * @default The active version
	 */
	version?: Pick<Version, "id">;
}): Promise<ChangeSet> {
	const executeInTransaction = async (trx: Lix["db"]) => {
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

		const version = args.version
			? await trx
					.selectFrom("version")
					.where("id", "=", args.version.id)
					.selectAll("version")
					.executeTakeFirstOrThrow()
			: await trx
					.selectFrom("active_version")
					.innerJoin("version", "version.id", "active_version.version_id")
					.selectAll("version")
					.executeTakeFirstOrThrow();

		const checkpointLabel = await trx
			.selectFrom("label")
			.where("name", "=", "checkpoint")
			.select("id")
			.executeTakeFirstOrThrow();

		await trx
			.insertInto("change_set_label")
			.values({
				change_set_id: version.working_change_set_id,
				label_id: checkpointLabel.id,
			})
			.execute();

		const newWorkingCs = await trx
			.insertInto("change_set")
			.defaultValues()
			.returningAll()
			.executeTakeFirstOrThrow();

		await trx
			.updateTable("version")
			.set({
				working_change_set_id: newWorkingCs.id,
			})
			.where("id", "=", version.id)
			.execute();

		// seal the working change set to insert it into the graph
		const formerWorkingCs = await trx
			.updateTable("change_set")
			.where("change_set.id", "=", version.working_change_set_id)
			.set({ immutable_elements: true })
			.returningAll()
			.executeTakeFirstOrThrow();

		await trx
			.updateTable("version")
			.set({
				change_set_id: formerWorkingCs.id,
			})
			.execute();

		await trx
			.insertInto("change_set_edge")
			.values({
				parent_id: version.change_set_id,
				child_id: formerWorkingCs.id,
			})
			.execute();

		await trx
			.deleteFrom("key_value")
			.where("key", "=", "lix_skip_update_working_change_set")
			.execute();

		return formerWorkingCs;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
