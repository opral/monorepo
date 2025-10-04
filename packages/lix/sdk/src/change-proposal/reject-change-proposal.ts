import type { Lix } from "../lix/open-lix.js";
import type { LixChangeProposal } from "./schema-definition.js";

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

		// Update status then remove proposal to release FK before deleting version
		await trx
			.updateTable("change_proposal_all")
			.set({ status: "rejected" })
			.where("id", "=", id)
			.where("lixcol_version_id", "=", "global")
			.execute();

		await trx
			.deleteFrom("change_proposal_all")
			.where("id", "=", id)
			.where("lixcol_version_id", "=", "global")
			.execute();

		await trx
			.deleteFrom("version")
			.where("id", "=", proposal.source_version_id)
			.execute();
	});
}
