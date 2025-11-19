import type { Lix } from "../lix/open-lix.js";
import type { LixChangeProposal } from "./schema-definition.js";

export async function rejectChangeProposal(args: {
	lix: Lix;
	proposal: Pick<LixChangeProposal, "id"> | LixChangeProposal;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		await trx
			.updateTable("change_proposal")
			.set({ status: "rejected" })
			.where("id", "=", args.proposal.id)
			.execute();
	};

	if (args.lix.db.isTransaction) {
		await executeInTransaction(args.lix.db);
		return;
	}

	return await args.lix.db.transaction().execute(executeInTransaction);
}
