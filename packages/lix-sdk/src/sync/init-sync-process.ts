import type { Lix } from "../lix/open-lix.js";
import { fetchRowsFromServer } from "./fetch-rows-from-server.js";
import { pushRowsToServer } from "./push-rows-to-server.js";
import { NOT_TO_BE_SYNCED_TABLES } from "./constants.js";
import type { LixDatabaseSchema } from "../database/schema.js";

export async function initSyncProcess(args: { lix: Lix }): Promise<void> {
	const { value: id } = await args.lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix-id")
		.select("value")
		.executeTakeFirstOrThrow();

	const url = await args.lix.db
		.selectFrom("key_value")
		// saved in key value because simpler for experimentation
		.where("key", "=", "lix-experimental-server-url")
		.select("value")
		.executeTakeFirst();

	// if you want to test sync, restart the lix app
	// to make sure the experimental-sync-url is set
	if (!url) {
		return;
	}

	const tables = await args.lix.db.introspection.getTables();
	// only get relevant tables
	const tableNamesToBeSynced = tables
		.filter(
			(t) =>
				!NOT_TO_BE_SYNCED_TABLES.includes(t.name as keyof LixDatabaseSchema),
		)
		.map((t) => t.name) as Array<keyof LixDatabaseSchema>;

	// naive implementation that syncs every second
	setInterval(() => {
		fetchRowsFromServer({
			serverUrl: url.value,
			lix: args.lix,
			id,
			tableNames: tableNamesToBeSynced,
		});
		pushRowsToServer({
			serverUrl: url.value,
			lix: args.lix,
			id,
			tableNames: tableNamesToBeSynced,
		});
	}, 1000);
}
