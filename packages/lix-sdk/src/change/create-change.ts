import type { Account } from "../account/database-schema.js";
import type { Change, Snapshot, Version } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";
import { changeIsLeafInVersion } from "../query-filter/change-is-leaf-in-version.js";
import { createSnapshot } from "../snapshot/create-snapshot.js";
import { updateChangesInVersion } from "../version/update-changes-in-version.js";

/**
 * Programatically create a change in the database.
 *
 * Use this function to directly create a change from a lix app
 * with bypassing of file-based change detection.
 */
export async function createChange(args: {
	lix: Pick<Lix, "db">;
	authors: Array<Pick<Account, "id">>;
	version: Pick<Version, "id">;
	entityId: Change["entity_id"];
	fileId: Change["file_id"];
	pluginKey: Change["plugin_key"];
	schemaKey: Change["schema_key"];
	snapshotContent: Snapshot["content"];
}): Promise<Change> {
	if (args.authors.length === 0) {
		throw new Error("At least one author is required");
	}

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

		const parentChange = await trx
			.selectFrom("change")
			.where("file_id", "=", change.file_id)
			.where("schema_key", "=", change.schema_key)
			.where("entity_id", "=", change.entity_id)
			.where(changeIsLeafInVersion(args.version))
			.select("id")
			.executeTakeFirst();

		// If a parent exists, the change is a child of the parent
		if (parentChange) {
			await trx
				.insertInto("change_edge")
				.values({
					parent_id: parentChange.id,
					child_id: change.id,
				})
				.execute();
		}

		for (const author of args.authors) {
			try {
				await trx
					.insertInto("change_author")
					.values({
						change_id: change.id,
						account_id: author.id,
					})
					.execute();
			} catch (e) {
				console.log(e);
			}
		}

		// update the version with the new change
		await updateChangesInVersion({
			lix: { ...args.lix, db: trx },
			changes: [change],
			version: args.version,
		});

		return change;
	};
	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
