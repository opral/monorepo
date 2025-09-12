import type { Lix } from "@lix-js/sdk";
import { createVersion, type LixVersion } from "@lix-js/sdk";

/**
 * Ensures a writable agent staging version named "lix agent" exists.
 * If absent, creates it branching from the Main version.
 * Returns the concrete LixVersion row.
 */
export async function ensureAgentVersion(lix: Lix): Promise<LixVersion> {
	const exec = async (trx: Lix["db"]) => {
		// Try to find an existing version named "lix agent"
		const existing = await trx
			.selectFrom("version")
			.where("name", "=", "lix agent")
			.selectAll()
			.limit(1)
			.executeTakeFirst();

		if (existing) return existing as unknown as LixVersion;

		// Resolve the Main version to branch from
		const main = await trx
			.selectFrom("version")
			.where("name", "=", "main")
			.selectAll()
			.limit(1)
			.executeTakeFirstOrThrow();

		// Create a fresh agent version from Main. Non-hidden by default.
		const created = await createVersion({
			lix: { ...lix, db: trx },
			from: main,
			name: "lix agent",
		});
		return created;
	};

	if (lix.db.isTransaction) return exec(lix.db);
	return lix.db.transaction().execute(exec);
}
