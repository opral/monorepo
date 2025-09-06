import { nanoId } from "../deterministic/index.js";
import type { Lix } from "../lix/open-lix.js";
import type { LixVersion } from "./schema.js";
import { createVersionFromCommit } from "./create-version-from-commit.js";

/**
 * Creates a new version branching from a version's commit id (defaults to active when `from` is omitted).
 *
 * For branching from a specific commit id, use `createVersionFromCommit`.
 */
export async function createVersion(args: {
	lix: Lix;
	id?: LixVersion["id"];
	name?: LixVersion["name"];
	from?: LixVersion | Pick<LixVersion, "id">;
	inheritsFrom?: LixVersion | Pick<LixVersion, "id"> | null;
}): Promise<LixVersion> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Resolve base commit from from/active
		let baseCommitId: string;
		if (args.from) {
			const base = await trx
				.selectFrom("version")
				.select(["commit_id"])
				.where("id", "=", (args.from as Pick<LixVersion, "id">).id)
				.executeTakeFirstOrThrow();
			baseCommitId = base.commit_id;
		} else {
			const active = await trx
				.selectFrom("active_version")
				.innerJoin("version", "version.id", "active_version.version_id")
				.select("version.commit_id")
				.executeTakeFirstOrThrow();
			baseCommitId = active.commit_id;
		}

		// Delegate to the commit-based creator for a single code path
		return createVersionFromCommit({
			lix: { ...args.lix, db: trx },
			commit: { id: baseCommitId },
			id: args.id ?? nanoId({ lix: args.lix }),
			name: args.name,
			inheritsFrom: args.inheritsFrom,
		});
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
