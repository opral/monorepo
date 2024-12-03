import type { Version } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

/**
 * Creates a new Version.
 *
 * If parent is provided, the new Version will copy the change pointers from the parent Version,
 * and create a merge intent from the new Version to the parent Version.
 *
 * @example
 *   _Without parent_
 *
 *   ```ts
 *   const version = await createVersion({ lix });
 *   ```
 *
 * @example
 *   _With parent_
 *
 *   ```ts
 *   const version = await createVersion({ lix, parent: otherVersion });
 *   ```
 */
export async function createVersion(args: {
	lix: Pick<Lix, "db">;
	parent?: Version;
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

		// copy the change pointers from the parent Version
		if (args.parent) {
			await trx
				.insertInto("version_change")
				.columns(["version_id", "change_id"])
				.expression((eb) =>
					eb
						.selectFrom("version_change")
						.select([eb.val(newVersion.id).as("version_id"), "change_id"])
						.where("version_id", "=", args.parent!.id),
				)
				.execute();

			// copy the change conflicts from the parent Version
			await trx
				.insertInto("version_change_conflict")
				.columns(["version_id", "change_conflict_id"])
				.expression((eb) =>
					eb
						.selectFrom("version_change_conflict")
						.select([eb.val(Version.id).as("Version_id"), "change_conflict_id"])
						.where("version_id", "=", args.parent!.id),
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
