import type { Version } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

/**
 * Creates a new Version.
 *
 * If `from` is provided, the new version will be identical to the from version.
 *
 * @deprecated Use `createVersionV2()` instead.
 *
 * @example
 *   _Without from_
 *
 *   ```ts
 *   const version = await createVersion({ lix });
 *   ```
 *
 * @example
 *   _With from_
 *
 *   ```ts
 *   const version = await createVersion({ lix, from: otherVersion });
 *   ```
 */
export async function createVersion(args: {
	lix: Pick<Lix, "db">;
	from?: Pick<Version, "id">;
	name?: Version["name"];
}): Promise<Version> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		let query = trx.insertInto("version").returningAll();

		if (args.name) {
			query = query.values({ name: args.name });
		} else {
			query = query.defaultValues();
		}

		const newVersion = await query.executeTakeFirstOrThrow();

		// copy the change pointers from the from Version
		if (args.from) {
			await trx
				.insertInto("version_change")
				.columns([
					"version_id",
					"change_id",
					"entity_id",
					"schema_key",
					"file_id",
				])
				.expression((eb) =>
					eb
						.selectFrom("version_change")
						.select([
							eb.val(newVersion.id).as("version_id"),
							"change_id",
							"entity_id",
							"schema_key",
							"file_id",
						])
						.where("version_id", "=", args.from!.id)
				)
				.execute();

			// copy the change conflicts from the from Version
			await trx
				.insertInto("version_change_conflict")
				.columns(["version_id", "change_conflict_id"])
				.expression((eb) =>
					eb
						.selectFrom("version_change_conflict")
						.select([
							eb.val(newVersion.id).as("version_id"),
							"change_conflict_id",
						])
						.where("version_id", "=", args.from!.id)
				)
				.execute();
		}

		return newVersion;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
