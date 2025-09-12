import type { Lix } from "../lix/open-lix.js";
import type { LixChangeProposal } from "./schema.js";
import { mergeVersion } from "../version/merge-version.js";

export async function acceptChangeProposal(args: {
	lix: Lix;
	proposal: Pick<LixChangeProposal, "id"> | LixChangeProposal;
}): Promise<void> {
	const { lix, proposal: proposalRef } = args;
	const id = proposalRef.id as string;

	// 1) Load the proposal
	const proposal = await lix.db
		.selectFrom("change_proposal")
		.where("id", "=", id)
		.select(["id", "source_version_id", "target_version_id", "status"])
		.executeTakeFirstOrThrow();

	// 2) Merge in its own transaction (mergeVersion manages transaction scope internally)
	await mergeVersion({
		lix,
		source: { id: proposal.source_version_id },
		target: { id: proposal.target_version_id },
	});

	// 3) Update status and delete source in a follow-up transaction
	await lix.db.transaction().execute(async (trx) => {
		await trx
			.deleteFrom("version")
			.where("id", "=", proposal.source_version_id)
			.execute();
		await trx
			.updateTable("change_proposal_all")
			.set({ status: "accepted" })
			.where("id", "=", id)
			.where("lixcol_version_id", "=", "global")
			.execute();
	});
}
