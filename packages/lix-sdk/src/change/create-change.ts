import type { Account } from "../account/database-schema.js";
import { executeSync } from "../database/execute-sync.js";
import type { Lix } from "../lix/open-lix.js";
import type { Snapshot } from "../snapshot/database-schema.js";
import type { Change } from "./schema.js";

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
			.returning("id"),
	})[0] as Snapshot;

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

	if (args.authors.length > 0) {
		for (const author of args.authors) {
			executeSync({
				lix: args.lix,
				query: args.lix.db.insertInto("change_author").values({
					change_id: change.id,
					account_id: author.id,
				}),
			});
		}
	}

	// @ts-expect-error - async type to make ts believe its async
	// to align the APIs and in anticipation that we will move to async
	// once we figure out how to make triggers async.
	return change;
}
