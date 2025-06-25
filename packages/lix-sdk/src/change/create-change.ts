import type { Lix } from "../lix/open-lix.js";
import { Kysely, sql } from "kysely";
import type { Change } from "./schema.js";
import { executeSync } from "../database/execute-sync.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import type { Account } from "../account/schema.js";
import type { Snapshot } from "../snapshot/schema.js";

export function createChange(args: {
	lix: Pick<Lix, "db" | "sqlite">;
	id?: Change["id"];
	entity_id: Change["entity_id"];
	schema_key: Change["schema_key"];
	schema_version: Change["schema_version"];
	file_id: Change["file_id"];
	plugin_key: Change["plugin_key"];
	snapshot: Omit<Snapshot, "id">;
	authors?: Pick<Account, "id">[];
}): // fake async API to to use the function in instead of triggers while keeping the public
// api async in anticipation that we will move to async once we figure out how to make
// triggers async
Promise<Change> {
	const [snapshot] = !args.snapshot.content
		? [{ id: "no-content" }]
		: executeSync({
				lix: args.lix,
				query: (args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
					.insertInto("internal_snapshot")
					.values({
						content: sql`jsonb(${JSON.stringify(args.snapshot)})`,
					})
					.returning("id"),
			});

	const [change] = executeSync({
		lix: args.lix,
		query: (args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
			.insertInto("internal_change")
			.values({
				entity_id: args.entity_id,
				schema_key: args.schema_key,
				schema_version: args.schema_version,
				snapshot_id: snapshot.id,
				file_id: args.file_id,
				plugin_key: args.plugin_key,
				id: args.id,
			})
			.returningAll(),
	});

	// Create change_author records if authors are specified
	if (args.authors && args.authors.length > 0) {
		const changeAuthorValues = args.authors.map((account) => ({
			change_id: change.id,
			account_id: account.id,
		}));

		executeSync({
			lix: args.lix,
			query: args.lix.db.insertInto("change_author").values(changeAuthorValues),
		});
	}

	return change;
}
