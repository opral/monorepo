import { createChangeSet } from "../change-set/create-change-set.js";
import type { ChangeSet } from "../change-set/database-schema.js";
import type { Lix } from "../lix/open-lix.js";
import type { Version } from "./database-schema.js";

/**
 * Creates a new version.
 *
 * The changeSet can be any change set e.g. another version, a checkpoint, etc.
 *
 * @example
 *   const version = await createVersion({ lix, changeSet: otherVersion.change_set_id });
 */
export async function createVersion(args: {
	lix: Lix;
	id?: Version["id"];
	changeSet: Pick<ChangeSet, "id">;
	name?: Version["name"];
}): Promise<Version> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const workingCs = await createChangeSet({
			lix: { ...args.lix, db: trx },
			immutableElements: false,
		});
		const newVersion = await trx
			.insertInto("version")
			.values({
				id: args.id,
				name: args.name,
				change_set_id: args.changeSet.id,
				working_change_set_id: workingCs.id,
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
