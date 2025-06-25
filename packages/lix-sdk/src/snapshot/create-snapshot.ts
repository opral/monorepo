import { sql, type Kysely } from "kysely";
import type { Lix } from "../lix/open-lix.js";
import type { Snapshot } from "./schema.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { v7 } from "uuid";

export async function createSnapshot(args: {
	lix: Pick<Lix, "db" | "sqlite">;
	content: Snapshot["content"];
}): Promise<Snapshot> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const id = args.content ? v7() : "no-content";

		await (trx as unknown as Kysely<LixInternalDatabaseSchema>)
			.insertInto("internal_snapshot")
			.values({
				id,
				content: sql`jsonb(${JSON.stringify(args.content)})`,
			})
			.onConflict((oc) => oc.doNothing())
			.execute();

		return await trx
			.selectFrom("snapshot")
			.where("id", "=", id)
			.selectAll()
			.executeTakeFirstOrThrow();
	};

	// user provided an open transaction
	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
