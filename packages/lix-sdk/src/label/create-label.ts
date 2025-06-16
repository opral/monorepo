import type { Lix } from "../lix/open-lix.js";
import type { Label } from "./schema.js";
import { nanoid } from "../database/nano-id.js";

export async function createLabel(args: {
	lix: Pick<Lix, "db">;
	id?: Label["id"];
	name: Label["name"];
	state_version_id?: Label["state_version_id"];
}): Promise<Label> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Generate ID if not provided (views handle this, but we need it for querying back)
		const labelId = args.id || nanoid();
		
		// Insert the label (views don't support returningAll)
		await trx
			.insertInto("label")
			.values({
				id: labelId,
				name: args.name,
				state_version_id: args.state_version_id,
			})
			.execute();

		// Query back the inserted label
		const label = await trx
			.selectFrom("label")
			.selectAll()
			.where("id", "=", labelId)
			.executeTakeFirstOrThrow();

		return label;
	};

	// user provided an open transaction
	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}