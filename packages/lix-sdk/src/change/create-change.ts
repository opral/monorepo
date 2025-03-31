import { sql } from "kysely";
import type { Account } from "../account/database-schema.js";
import { executeSync } from "../database/execute-sync.js";
import type { Change, Snapshot, Version } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";
import { changeIsLeafInVersion } from "../query-filter/change-is-leaf-in-version.js";
import { updateChangesInVersion } from "../version/update-changes-in-version.js";

/**
 * Programatically create a change in the database.
 *
 * Use this function to directly create a change from a lix app
 * with bypassing of file-based change detection.
 */
export async function createChange(
	args: {
		lix: Pick<Lix, "db" | "sqlite">;
		authors: Array<Pick<Account, "id">>;
		version: Pick<Version, "id">;
		entityId: Change["entity_id"];
		fileId: Change["file_id"];
		pluginKey: Change["plugin_key"];
		schemaKey: Change["schema_key"];
		snapshotContent: Snapshot["content"];
	},
	options?: {
		/**
		 * When true, the version changes will be updated.
		 *
		 * Defaults to true.
		 */
		updateVersionChanges?: boolean;
	}
): Promise<Change> {
	const optionsWithDefaults = {
		updateVersionChanges: true,
		...options,
	};

	if (args.authors.length === 0) {
		throw new Error("At least one author is required");
	}

	// const executeInTransaction = async (trx: Lix["db"]) => {
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

	const parentChange = executeSync({
		lix: args.lix,
		query: args.lix.db
			.selectFrom("change")
			.where("file_id", "=", change.file_id)
			.where("schema_key", "=", change.schema_key)
			.where("entity_id", "=", change.entity_id)
			.where(changeIsLeafInVersion(args.version))
			.select("id"),
	})[0] as Change | undefined;

	// If a parent exists, the change is a child of the parent
	if (parentChange) {
		executeSync({
			lix: args.lix,
			query: args.lix.db.insertInto("change_edge").values({
				parent_id: parentChange.id,
				child_id: change.id,
			}),
		});
	}

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

	// ---------> START: Update active change set <---------

	const activeVersion = executeSync({
		lix: args.lix,
		query: args.lix.db
			.selectFrom("active_version")
			.innerJoin("version_v2", "active_version.id", "version_v2.id")
			.select("change_set_id"),
	})[0] as { change_set_id: string };

	// Add the new change to the change set element table

	// we need to simulate a skip own change control here
	// to avoid an infinite loop. at the time of writing this code,
	// it was to be determine if the change graph is going to be
	// removed or not. if the change graph is removed, the version
	// change set somehow needs to track how its beeing updated (immutable change sets?)
	// executeSync({
	// 	lix: args.lix,
	// 	query: args.lix.db
	// 		.insertInto("key_value")
	// 		.values({
	// 			key: "lix_skip_own_change_control",
	// 			value: "true",
	// 			skip_change_control: true,
	// 		})
	// 		.onConflict((oc) => oc.doUpdateSet({ value: "true" })),
	// });

	executeSync({
		lix: args.lix,
		query: args.lix.db
			.insertInto("change_set_element")
			.values({
				change_set_id: activeVersion.change_set_id,
				change_id: change.id,
				entity_id: change.entity_id,
				file_id: change.file_id,
				schema_key: change.schema_key,
			})
			// If the entity change already exists, update the existing change
			.onConflict((oc) =>
				oc.doUpdateSet({
					change_id: change.id,
				})
			),
	});

	// executeSync({
	// 	lix: args.lix,
	// 	query: args.lix.db
	// 		.deleteFrom("key_value")
	// 		.where("key", "=", "lix_skip_own_change_control"),
	// });

	// ---------> END: Update active change set <---------

	// update the version with the new change
	if (optionsWithDefaults.updateVersionChanges) {
		updateChangesInVersion({
			lix: { ...args.lix },
			changes: [change],
			version: args.version,
		});
	}

	return change;
}
// if (args.lix.db.isTransaction) {
// 	return executeInTransaction(args.lix.db);
// } else {
// 	return args.lix.db.transaction().execute(executeInTransaction);
// }
// }
