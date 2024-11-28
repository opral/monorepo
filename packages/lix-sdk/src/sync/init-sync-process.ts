import type { Lix } from "../lix/open-lix.js";
import { pushToServer } from "./push-to-server.js";
import { pullFromServer } from "./pull-from-server.js";

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

	// naive implementation that syncs every second
	setInterval(() => {
		pullFromServer({
			serverUrl: url.value,
			lix: args.lix,
			id,
		});
		pushToServer({
			serverUrl: url.value,
			lix: args.lix,
			id,
		});
	}, 1000);
}
