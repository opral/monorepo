import type { Lix } from "../lix/index.js";
import type { LixCommit } from "./schema.js";
import type { LixVersion } from "../version/schema.js";
import { applyChangeSet } from "../change-set/apply-change-set.js";

/**
 * Applies a commit to a version by updating the version's commit_id and applying its changes.
 *
 * This function:
 * 1. Updates the version to point to the new commit
 * 2. Applies all changes from the commit's change set
 *
 * @example
 * ```ts
 * // Apply a commit to the active version
 * await applyCommit({
 *   lix,
 *   commit: myCommit
 * });
 *
 * // Apply a commit to a specific version
 * await applyCommit({
 *   lix,
 *   commit: myCommit,
 *   version: specificVersion
 * });
 * ```
 */
export async function applyCommit(args: {
	lix: Lix;
	commit: Pick<LixCommit, "id">;
	version?: Pick<LixVersion, "id">;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Get the target version (use active version if not specified)
		const targetVersion = args.version
			? await trx
					.selectFrom("version")
					.where("id", "=", args.version.id)
					.selectAll()
					.executeTakeFirstOrThrow()
			: await trx
					.selectFrom("active_version")
					.innerJoin("version", "version.id", "active_version.version_id")
					.selectAll("version")
					.executeTakeFirstOrThrow();

		// Get the commit details
		const commit = await trx
			.selectFrom("commit_all")
			.where("id", "=", args.commit.id)
			.where("lixcol_version_id", "=", "global")
			.selectAll()
			.executeTakeFirstOrThrow();

		// Update the version to point to the new commit
		await trx
			.updateTable("version")
			.set({ commit_id: commit.id })
			.where("id", "=", targetVersion.id)
			.execute();

		// Apply the changes from the commit's change set
		// Note: We're using the internal transaction to ensure atomicity
		await applyChangeSet({
			lix: { ...args.lix, db: trx },
			changeSet: { id: commit.change_set_id },
		});
	};

	return args.lix.db.isTransaction
		? executeInTransaction(args.lix.db)
		: args.lix.db.transaction().execute(executeInTransaction);
}
