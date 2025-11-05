import type { Lix } from "../lix/open-lix.js";
import type { LixChangeProposal } from "./schema-definition.js";
import type { LixVersion } from "../version/schema-definition.js";

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
		const values: Partial<LixChangeProposal> = {
			source_version_id: args.source.id,
			target_version_id: args.target.id,
		};
		if (args.id) values.id = args.id;
		if (args.status) values.status = args.status;

		await trx
			.insertInto("change_proposal")
			.values(values as any)
			.execute();

		const created = await trx
			.selectFrom("change_proposal")
			.where("source_version_id", "=", args.source.id)
			.where("target_version_id", "=", args.target.id)
			.selectAll()
			.orderBy("lixcol_created_at", "desc")
			.limit(1)
			.executeTakeFirstOrThrow();
		return created as unknown as LixChangeProposal;
	};

	if (lix.db.isTransaction) return exec(lix.db);
	return lix.db.transaction().execute(exec);
}
