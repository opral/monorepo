import { createChangeSet } from "../change-set/create-change-set.js";
import type { LixChangeSet } from "../change-set/schema.js";
import { nanoId } from "../database/functions.js";
import type { Lix } from "../lix/open-lix.js";
import type { LixVersion } from "./schema.js";

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
	id?: LixVersion["id"];
	changeSet?: Pick<LixChangeSet, "id">;
	name?: LixVersion["name"];
	inherits_from_version_id?: LixVersion["inherits_from_version_id"];
}): Promise<LixVersion> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const workingCs = await createChangeSet({
			lix: { ...args.lix, db: trx },
			lixcol_version_id: "global",
		});
		const cs =
			args.changeSet ??
			(await createChangeSet({
				lix: { ...args.lix, db: trx },
				lixcol_version_id: "global",
			}));

		const versionId = args.id ?? nanoId({ lix: { sqlite: args.lix.sqlite } });

		await trx
			.insertInto("version")
			.values({
				id: versionId,
				name: args.name,
				change_set_id: cs.id,
				working_change_set_id: workingCs.id,
				inherits_from_version_id: args.inherits_from_version_id ?? "global",
			})
			.execute();

		const newVersion = await trx
			.selectFrom("version")
			.selectAll()
			.where("id", "=", versionId)
			.executeTakeFirstOrThrow();

		return newVersion;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
