import { createChangeSet } from "../change-set/create-change-set.js";
import { nanoId } from "../deterministic/index.js";
import { uuidV7 } from "../deterministic/uuid-v7.js";
import type { Lix } from "../lix/open-lix.js";
import type { LixVersion } from "./schema.js";

/**
 * Creates a new version.
 *
 * If `commit_id` is provided, the new version will point to that commit.
 * Otherwise, defaults to the active version's commit_id.
 *
 * @example
 *   // Create a version branching from the current active version
 *   const version = await createVersion({ lix, name: "feature-branch" });
 *
 * @example
 *   // Create a version pointing to a specific commit
 *   const version = await createVersion({ lix, commit_id: existingCommitId });
 */
export async function createVersion(args: {
	lix: Lix;
	id?: LixVersion["id"];
	commit_id?: LixVersion["commit_id"];
	name?: LixVersion["name"];
	inherits_from_version_id?: LixVersion["inherits_from_version_id"] | null;
}): Promise<LixVersion> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const workingCs = await createChangeSet({
			lix: { ...args.lix, db: trx },
			lixcol_version_id: "global",
		});

		let commitId: string;

		if (args.commit_id) {
			// Use the provided commit
			commitId = args.commit_id;
		} else {
			// Default to active version's commit_id
			const activeVersion = await trx
				.selectFrom("active_version")
				.innerJoin("version", "version.id", "active_version.version_id")
				.select("version.commit_id")
				.executeTakeFirstOrThrow();

			commitId = activeVersion.commit_id;
		}

		// Create a working commit for the new version
		const workingCommitId = uuidV7({ lix: args.lix });
		await trx
			.insertInto("commit_all")
			.values({
				id: workingCommitId,
				change_set_id: workingCs.id,
				lixcol_version_id: "global",
			})
			.execute();

		const versionId = args.id ?? nanoId({ lix: args.lix });

		await trx
			.insertInto("version")
			.values({
				id: versionId,
				name: args.name,
				commit_id: commitId,
				working_commit_id: workingCommitId,
				inherits_from_version_id:
					args.inherits_from_version_id === undefined
						? "global"
						: args.inherits_from_version_id,
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
