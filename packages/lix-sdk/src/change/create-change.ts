import { sql } from "kysely";
import type { Account } from "../account/database-schema.js";
import { executeSync } from "../database/execute-sync.js";
import type { Change, Snapshot } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

/**
 * Programatically create a change in the database.
 *
 * Use this function to directly create a change from a lix app
 * with bypassing of file-based change detection.
 */
export function createChange(args: {
	lix: Pick<Lix, "db" | "sqlite">;
	authors: Array<Pick<Account, "id">>;
	entityId: Change["entity_id"];
	fileId: Change["file_id"];
	pluginKey: Change["plugin_key"];
	schemaKey: Change["schema_key"];
	snapshotContent: Snapshot["content"];
}): Promise<Change> {
	if (args.authors.length === 0) {
		throw new Error("At least one author is required");
	}

	const snapshot = executeSync({
		lix: args.lix,
		query: args.lix.db
			.insertInto("snapshot")
			.values({
				content: args.snapshotContent ?? null,
			})
			.onConflict((oc) =>
				oc.doUpdateSet((eb) => ({
					content: eb.ref("excluded.content"),
				}))
			)
			.returningAll()
			.returning(sql`json(content)`.as("content")),
	})[0] as Snapshot;

	snapshot.content = JSON.parse(snapshot.content as unknown as string);

	const change = executeSync({
		lix: args.lix,
		query: args.lix.db
			.insertInto("change")
			.values({
				entity_id: args.entityId,
				plugin_key: args.pluginKey,
				file_id: args.fileId,
				schema_key: args.schemaKey,
				snapshot_id: snapshot.id,
			})
			.returningAll(),
	})[0] as Change;

	for (const author of args.authors) {
		try {
			executeSync({
				lix: args.lix,
				query: args.lix.db.insertInto("change_author").values({
					change_id: change.id,
					account_id: author.id,
				}),
			});
		} catch (e) {
			console.log(e);
		}
	}

	// @ts-expect-error - async type to make ts believe its async
	// to align the APIs and in anticipation that we will move to async
	// once we figure out how to make triggers async.
	return change;
}
// if (args.lix.db.isTransaction) {
// 	return executeInTransaction(args.lix.db);
// } else {
// 	return args.lix.db.transaction().execute(executeInTransaction);
// }
// }
