import { sql, type Kysely } from "kysely";
import type { Lix } from "../lix/open-lix.js";
import type { NewSnapshot, Snapshot } from "./schema.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { v7 } from "uuid";
import { executeSync } from "../database/execute-sync.js";

export function createSnapshot(args: {
	lix: Pick<Lix, "db" | "sqlite">;
	content: NewSnapshot["content"];
}): Promise<Snapshot> {
	const id = args.content ? v7() : "no-content";

	executeSync({
		lix: args.lix,
		query: (args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
			.insertInto("internal_snapshot")
			.values({
				id,
				content: sql`jsonb(${JSON.stringify(args.content)})`,
			})
			.onConflict((oc) => oc.doNothing()),
	});

	return executeSync({
		lix: args.lix,
		query: args.lix.db.selectFrom("snapshot").where("id", "=", id).selectAll(),
	})[0];
}
