import { sql, type Kysely } from "kysely";
import type { Lix } from "../lix/open-lix.js";
import { jsonSha256 } from "../snapshot/json-sha-256.js";
import type { NewSnapshot, Snapshot } from "./schema.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";

export function createSnapshot(args: {
	lix: Lix;
	data: NewSnapshot;
}): Promise<Snapshot> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const id = args.data.content ? jsonSha256(args.data.content) : "no-content";

		await (trx as unknown as Kysely<LixInternalDatabaseSchema>)
			.insertInto("internal_snapshot")
			.values({
				id,
				content: sql`jsonb(${JSON.stringify(args.data.content)})`,
			})
			.onConflict((oc) => oc.doNothing())
			.execute();

		return trx
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
