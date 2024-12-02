import type { Change, Snapshot } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";
import { createSnapshot } from "../snapshot/create-snapshot.js";

/**
 * Programatically create a change in the database.
 *
 * Use this function to directly create a change from a lix app
 * with bypassing of file-based change detection.
 */
export async function createChange(args: {
	lix: Pick<Lix, "db">;
	entityId: Change["entity_id"];
	fileId: Change["file_id"];
	pluginKey: Change["plugin_key"];
	schemaKey: Change["schema_key"];
	snapshotContent: Snapshot["content"];
}): Promise<Change> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const snapshot = await createSnapshot({
			lix: { db: trx },
			content: args.snapshotContent,
		});

		const change = await trx
			.insertInto("change")
			.values({
				entity_id: args.entityId,
				plugin_key: args.pluginKey,
				file_id: args.fileId,
				schema_key: args.schemaKey,
				snapshot_id: snapshot.id,
			})
			.returningAll()
			.executeTakeFirstOrThrow();

		const currentAuthors = await trx
			.selectFrom("active_account")
			.selectAll()
			.execute();

		for (const author of currentAuthors) {
			await trx
				.insertInto("change_author")
				.values({
					change_id: change.id,
					account_id: author.id,
				})
				.execute();
		}
		return change;
	};
	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
