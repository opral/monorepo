import type { ChangeSet } from "../change-set/database-schema.js";
import type { Lix } from "../lix/open-lix.js";
import type { VersionV2 } from "./database-schema.js";

/**
 * Creates a new version.
 *
 * The from can be any change set e.g. another version, a checkpoint, etc.
 *
 * @example
 *   const version = await createVersionV2({ lix, from: otherVersion.change_set_id });
 */
export async function createVersionV2(args: {
	lix: Pick<Lix, "db">;
	id?: VersionV2["id"];
	from: Pick<ChangeSet, "id">;
	name?: VersionV2["name"];
}): Promise<VersionV2> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const newVersion = await trx
			.insertInto("version_v2")
			.values({
				id: args.id,
				name: args.name,
				change_set_id: args.from.id,
			})
			.returningAll()
			.executeTakeFirstOrThrow();

		return newVersion;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
