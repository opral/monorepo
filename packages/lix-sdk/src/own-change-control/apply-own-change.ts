import {
	CompiledQuery,
	type DeleteQueryBuilder,
	type DeleteResult,
	type InsertQueryBuilder,
	type InsertResult,
} from "kysely";
import type { Change, LixDatabaseSchema } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";
import {
	changeControlledTableIds,
	primaryKeysForEntityId,
} from "./change-controlled-tables.js";

/**
 * Applies own changes to lix itself.
 */
export async function applyOwnChanges(args: {
	lix: Pick<Lix, "db">;
	changes: Change[];
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// defer foreign keys to avoid constraint violations
		// until the end of the transaction. otherwise, we would
		// need to apply the changes in the correct order.
		await trx.executeQuery(
			CompiledQuery.raw("PRAGMA defer_foreign_keys = ON;")
		);

		await Promise.all(
			args.changes.map(async (change) => {
				if (change.plugin_key !== "lix_own_change_control") {
					throw new Error(
						"Expected 'lix_own_change_control' as plugin key but received " +
							change.plugin_key
					);
				}
				const snapshot = await trx
					.selectFrom("snapshot")
					.where("id", "=", change.snapshot_id)
					.select("content")
					.executeTakeFirstOrThrow();

				// remove the prefix and suffix from the schema key
				// `lix_key_value_table` -> `key_value`
				const tableName = change.schema_key
					.replace(/^lix_/, "")
					.replace(/_table$/, "") as keyof typeof changeControlledTableIds;

				const primaryKeys = primaryKeysForEntityId(tableName, change.entity_id);

				let query:
					| DeleteQueryBuilder<
							LixDatabaseSchema,
							keyof typeof changeControlledTableIds,
							DeleteResult
					  >
					| InsertQueryBuilder<
							LixDatabaseSchema,
							keyof typeof changeControlledTableIds,
							InsertResult
					  >;

				// deletion
				if (snapshot.content === null) {
					query = trx.deleteFrom(tableName);
					for (const [key, value] of primaryKeys) {
						query = query.where(key as any, "=", value);
					}
				}
				// upsert
				else {
					// take the current file data if the table is `file`
					// (can be optimized later to adjust the query instead)
					if (tableName === "file") {
						const data = await trx
							.selectFrom("file")
							.where("id", "=", change.entity_id)
							.select("data")
							.executeTakeFirst();

						snapshot.content.data =
							data?.data ??
							// empty uint8array will trigger applyChanges() to pass an empty file to the plugin
							new Uint8Array();
					}

					query = trx
						.insertInto(tableName)
						.values(snapshot.content)
						.onConflict((oc) => oc.doUpdateSet(snapshot.content!));
				}

				await query.execute();
			})
		);
	};

	if (args.lix.db.isTransaction) {
		return await executeInTransaction(args.lix.db);
	} else {
		return await args.lix.db.transaction().execute(executeInTransaction);
	}
}
