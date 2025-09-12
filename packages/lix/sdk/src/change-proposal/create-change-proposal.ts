import type { Lix } from "../lix/open-lix.js";
import type { LixChangeProposal } from "./schema.js";
import type { LixVersion } from "../version/schema.js";

/**
 * Creates a change proposal that tracks an isolated source version
 * against a target version. Rows live in the global scope.
 *
 * @param source - the source version ref
 * @param target - the target version ref (usually Main)
 */
export async function createChangeProposal(args: {
	lix: Lix;
	id?: string;
	source: Pick<LixVersion, "id">;
	target: Pick<LixVersion, "id">;
	status?: "open" | "accepted" | "rejected";
}): Promise<LixChangeProposal> {
	const { lix } = args;
	const exec = async (trx: Lix["db"]) => {
		const row: Partial<LixChangeProposal> & { lixcol_version_id?: string } = {
			id: args.id,
			source_version_id: args.source.id,
			target_version_id: args.target.id,
			status: args.status ?? "open",
			lixcol_version_id: "global",
		};

		await trx
			.insertInto("change_proposal_all")
			.values(row as any)
			.execute();

		const created = await trx
			.selectFrom("change_proposal")
			.selectAll()
			.orderBy("lixcol_created_at", "desc")
			.limit(1)
			.executeTakeFirstOrThrow();
		return created as unknown as LixChangeProposal;
	};

	if (lix.db.isTransaction) return exec(lix.db);
	return lix.db.transaction().execute(exec);
}
