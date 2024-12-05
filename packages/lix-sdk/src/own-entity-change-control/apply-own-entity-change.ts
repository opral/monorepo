import type {
	DeleteQueryBuilder,
	DeleteResult,
	InsertQueryBuilder,
	InsertResult,
} from "kysely";
import type { Change, LixDatabaseSchema } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";
import { primaryKeysForEntityId } from "./change-controlled-tables.js";

/**
 * Applies own changes to lix itself.
 */
export async function applyOwnEntityChange(args: {
	lix: Lix;
	change: Change;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		if (args.change.plugin_key !== "lix_own_entity") {
			throw new Error(
				"Expected 'lix_own_entity' as plugin key but received " +
					args.change.plugin_key
			);
		}
		const snapshot = await trx
			.selectFrom("snapshot")
			.where("id", "=", args.change.snapshot_id)
			.select("content")
			.executeTakeFirstOrThrow();

		const tableName = args.change.schema_key.slice(
			"lix_".length
		) as keyof LixDatabaseSchema;

		const primaryKeys = primaryKeysForEntityId(
			tableName,
			args.change.entity_id
		);

		let query:
			| DeleteQueryBuilder<
					LixDatabaseSchema,
					keyof LixDatabaseSchema,
					DeleteResult
			  >
			| InsertQueryBuilder<
					LixDatabaseSchema,
					keyof LixDatabaseSchema,
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
			query = trx
				.insertInto(tableName)
				.values(snapshot.content)
				.onConflict((oc) => oc.doUpdateSet(snapshot.content!));
		}
		await query.execute();
	};

	if (args.lix.db.isTransaction) {
		return await executeInTransaction(args.lix.db);
	} else {
		return await args.lix.db.transaction().execute(executeInTransaction);
	}
}
