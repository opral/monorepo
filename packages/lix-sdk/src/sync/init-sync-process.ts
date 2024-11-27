import type { Lix } from "../lix/open-lix.js";
import type { LixDatabaseSchema } from "../database/schema.js";
import { pushToServer } from "./push-to-server.js";
import { pullFromServer } from "./pull-from-server.js";

const notToBeSyncedTables = [
	"active_account",
	"current_version",
	"change_queue",
] as Array<keyof LixDatabaseSchema>;

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
			(t) => !notToBeSyncedTables.includes(t.name as keyof LixDatabaseSchema)
		)
		.map((t) => t.name) as Array<keyof LixDatabaseSchema>;

	// naive implementation that syncs every second
	setInterval(() => {
		pullFromServer({
			serverUrl: url.value,
			lix: args.lix,
			id,
			tableNames: tableNamesToBeSynced,
		});
		pushToServer({
			serverUrl: url.value,
			lix: args.lix,
			id,
			tableNames: tableNamesToBeSynced,
		});
	}, 1000);
}
