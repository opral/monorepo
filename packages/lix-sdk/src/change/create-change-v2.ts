import type { Lix } from "../lix/open-lix.js";
import type { NewChange } from "./schema.js";
import type { NewSnapshot } from "./schema.js";
import { createSnapshot } from "./create-snapshot.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import type { Kysely } from "kysely";
import type { Change } from "./schema.js";
import { v7 } from "uuid";

export function createChange(args: {
	lix: Lix;
	data: Omit<NewChange, "snapshot_id"> & { snapshot: NewSnapshot };
}): Promise<Change> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const snapshot = await createSnapshot({
			lix: { ...args.lix, db: trx },
			data: args.data.snapshot,
		});

		const change = await (trx as unknown as Kysely<LixInternalDatabaseSchema>)
			.insertInto("internal_change")
			.values({
				id: v7(),
				entity_id: args.data.entity_id,
				plugin_key: args.data.plugin_key,
				file_id: args.data.file_id,
				schema_key: args.data.schema_key,
				snapshot_id: snapshot.id,
			})
			.returningAll()
			.executeTakeFirstOrThrow();

		return change;
	};

	// user provided an open transaction
	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
