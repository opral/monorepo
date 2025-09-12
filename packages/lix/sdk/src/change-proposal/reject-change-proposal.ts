import type { Lix } from "../lix/open-lix.js";
import type { LixChangeProposal } from "./schema.js";

export async function rejectChangeProposal(args: {
	lix: Lix;
	proposal: Pick<LixChangeProposal, "id"> | LixChangeProposal;
}): Promise<void> {
	const { lix, proposal: proposalRef } = args;
	const id = proposalRef.id as string;

	await lix.db.transaction().execute(async (trx) => {
		const proposal = await trx
			.selectFrom("change_proposal")
			.where("id", "=", id)
			.select(["id", "source_version_id", "status"])
			.executeTakeFirstOrThrow();

		await trx
			.deleteFrom("version")
			.where("id", "=", proposal.source_version_id)
			.execute();
		await trx
			.updateTable("change_proposal_all")
			.set({ status: "rejected" })
			.where("id", "=", id)
			.where("lixcol_version_id", "=", "global")
			.execute();
	});
}
