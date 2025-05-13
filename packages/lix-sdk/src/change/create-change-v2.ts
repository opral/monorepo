import type { Lix } from "../lix/open-lix.js";
import type { NewChange } from "./schema.js";
import { Kysely, sql } from "kysely";
import type { Change } from "./schema.js";
import type { NewSnapshot } from "../snapshot/schema.js";
import { executeSync } from "../database/execute-sync.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";

export function createChange(args: {
	lix: Pick<Lix, "db" | "sqlite">;
	data: Omit<NewChange, "snapshot_id"> & { snapshot: Omit<NewSnapshot, "id"> };
}): // fake async API to to use the function in instead of triggers while keeping the public
// api async in anticipation that we will move to async once we figure out how to make
// triggers async
Promise<Change> {
	const [snapshot] = !args.data.snapshot.content
		? [{ id: "no-content" }]
		: executeSync({
				lix: args.lix,
				query: (args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
					.insertInto("internal_snapshot")
					.values({
						content: sql`jsonb(${JSON.stringify(args.data.snapshot)})`,
					})
					.returning("id"),
			});

	const [change] = executeSync({
		lix: args.lix,
		query: (args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
			.insertInto("internal_change")
			.values({
				entity_id: args.data.entity_id,
				schema_key: args.data.schema_key,
				snapshot_id: snapshot.id,
				file_id: args.data.file_id,
				plugin_key: args.data.plugin_key,
				id: args.data.id,
			})
			.returningAll(),
	});

	return change;
}
