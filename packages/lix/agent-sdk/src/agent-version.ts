import type { Lix } from "@lix-js/sdk";
import { createVersion, type LixVersion } from "@lix-js/sdk";

/**
 * Ensures a writable agent source version named "lix agent" exists.
 * If absent, creates it branching from the Main version.
 * Returns the concrete LixVersion row.
 */
export async function ensureAgentVersion(lix: Lix): Promise<LixVersion> {
	const exec = async (trx: Lix["db"]) => {
		// Proposal mode: if an active proposal id is set globally, resolve its source version
		try {
			const kv = await trx
				.selectFrom("key_value_by_version")
				.where("lixcol_version_id", "=", "global")
				.where("key", "=", "lix_agent_active_proposal_id")
				.select(["value"])
				.executeTakeFirst();
			const activeProposalId = kv?.value as any as string | undefined;
			if (activeProposalId) {
				const proposal = await trx
					.selectFrom("change_proposal")
					.where("id", "=", activeProposalId)
					.select(["id", "source_version_id", "status"])
					.executeTakeFirst();
				if (proposal && proposal.status === "open") {
					const ver = await trx
						.selectFrom("version")
						.where("id", "=", proposal.source_version_id)
						.selectAll()
						.executeTakeFirst();
					if (ver) return ver as unknown as LixVersion;
				}
				// Clean up stale KV if proposal not found or not open
				try {
					await trx
						.deleteFrom("key_value_by_version")
						.where("lixcol_version_id", "=", "global")
						.where("key", "=", "lix_agent_active_proposal_id")
						.execute();
				} catch {}
			}
		} catch {}
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
