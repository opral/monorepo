import type { Lix } from "../lix/open-lix.js";
import type { LixCommit } from "../commit/schema.js";
import type { LixVersion } from "./schema.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { uuidV7 } from "../deterministic/uuid-v7.js";
import { nanoId } from "../deterministic/index.js";

/**
 * Creates a new version that starts at a specific commit.
 *
 * - Points the new version's `commit_id` to the provided commit.
 * - Generates a fresh `working_commit_id` that references an empty change set (global scope).
 * - Does not modify the active version or any other versions.
 * - Inheritance lineage is controlled via `inheritsFrom` and defaults to `"global"`.
 *
 * @param args.lix - The Lix instance.
 * @param args.commit - The commit to branch from (only `id` is required).
 * @param args.id - Optional explicit version id.
 * @param args.name - Optional version name.
 * @param args.inheritsFrom - Optional lineage: a parent version to inherit from, or `null` to disable; defaults to `"global"`.
 *
 * @example
 * // Branch from a commit
 * const v = await createVersionFromCommit({ lix, commit });
 *
 * @example
 * // Custom id and name
 * const v = await createVersionFromCommit({ lix, commit, id: "my-id", name: "My Branch" });
 *
 * @example
 * // Inherit from a specific version
 * const parent = await createVersion({ lix, name: "base" });
 * const v = await createVersionFromCommit({ lix, commit, inheritsFrom: parent });
 *
 * @example
 * // Opt-out of inheritance
 * const v = await createVersionFromCommit({ lix, commit, inheritsFrom: null });
 *
 * @throws If the provided commit id does not exist.
 */
export async function createVersionFromCommit(args: {
	lix: Lix;
	commit: Pick<LixCommit, "id">;
	id?: LixVersion["id"];
	name?: LixVersion["name"];
	inheritsFrom?: LixVersion | Pick<LixVersion, "id"> | null;
}): Promise<LixVersion> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Create a working (empty) change set for the new version
		const workingCs = await createChangeSet({
			lix: { ...args.lix, db: trx },
			lixcol_version_id: "global",
		});

		// Create a fresh working commit pointing to the working change set
		const workingCommitId = uuidV7({ lix: args.lix });
		await trx
			.insertInto("commit_all")
			.values({
				id: workingCommitId,
				change_set_id: workingCs.id,
				lixcol_version_id: "global",
			})
			.execute();

		// Determine inheritance
		const inherits_from_version_id =
			args.inheritsFrom === undefined
				? "global"
				: args.inheritsFrom === null
					? null
					: args.inheritsFrom.id;

		const versionId = args.id ?? nanoId({ lix: args.lix });

		// Insert the new version pointing to the provided commit
		await trx
			.insertInto("version")
			.values({
				id: versionId,
				name: args.name,
				commit_id: args.commit.id,
				working_commit_id: workingCommitId,
				inherits_from_version_id,
			})
			.execute();

		const newVersion = await trx
			.selectFrom("version")
			.selectAll()
			.where("id", "=", versionId)
			.executeTakeFirstOrThrow();

		return newVersion;
	};

	return args.lix.db.isTransaction
		? executeInTransaction(args.lix.db)
		: args.lix.db.transaction().execute(executeInTransaction);
}
