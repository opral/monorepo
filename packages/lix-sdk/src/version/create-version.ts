import { createChangeSet } from "../change-set/create-change-set.js";
import type { ChangeSet } from "../change-set/schema.js";
import { nanoid } from "../database/nano-id.js";
import type { Lix } from "../lix/open-lix.js";
import type { Version } from "./schema.js";

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
	changeSet?: Pick<ChangeSet, "id">;
	name?: Version["name"];
}): Promise<Version> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const workingCs = await createChangeSet({
			lix: { ...args.lix, db: trx },
			version_id: "global",
		});
		const cs =
			args.changeSet ??
			(await createChangeSet({ 
				lix: { ...args.lix, db: trx },
				version_id: "global",
			}));

		const versionId = args.id ?? nanoid();
		await trx
			.insertInto("version")
			.values({
				id: versionId,
				name: args.name,
				change_set_id: cs.id,
				working_change_set_id: workingCs.id,
			})
			.execute();

		// Auto-inherit from global version (unless this is the global version itself)
		if (versionId !== "global") {
			// Check if inheritance already exists
			const existingInheritance = await trx
				.selectFrom("version_inheritance")
				.where("child_version_id", "=", versionId)
				.where("parent_version_id", "=", "global")
				.selectAll()
				.executeTakeFirst();

			if (!existingInheritance) {
				await trx
					.insertInto("version_inheritance")
					.values({
						child_version_id: versionId,
						parent_version_id: "global",
					})
					.execute();
			}
		}

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
