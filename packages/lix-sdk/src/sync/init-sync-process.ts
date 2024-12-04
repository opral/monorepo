import type { Lix } from "../lix/open-lix.js";
import { pushToServer } from "./push-to-server.js";
import { pullFromServer } from "./pull-from-server.js";

export async function initSyncProcess(args: {
	lix: Pick<Lix, "db" | "plugin">;
}): Promise<
	| {
			stop: () => void;
	  }
	| undefined
> {
	const { value: id } = await args.lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix-id")
		.select("value")
		.executeTakeFirstOrThrow();

	let url = await args.lix.db
		.selectFrom("key_value")
		// saved in key value because simpler for experimentation
		.where("key", "=", "lix-experimental-server-url")
		.select("value")
		.executeTakeFirst();

	// if you want to test sync, restart the lix app
	// to make sure the experimental-sync-url is set
	if (!url) {
		console.log(
			'no "lix-experimental-server-url" set, setting it to "http://localhost:3000"'
		);
		url = await args.lix.db
			.insertInto("key_value")
			.values({
				key: "lix-experimental-server-url",
				value: "http://localhost:3000",
			})
			.returning("value")
			.executeTakeFirstOrThrow();
	}

	let stoped = false;

	const pullAndPush = async () => {
		const serverState = await pullFromServer({
			serverUrl: url.value,
			lix: args.lix,
			id,
		});
		await pushToServer({
			serverUrl: url.value,
			lix: args.lix,
			id,
			targetVectorClock: serverState,
		});
	};

	// naive implementation that syncs every second

	async function schedulePullAndPush() {
		if (!stoped) {
			await pullAndPush();
		}
		setTimeout(() => {
			schedulePullAndPush();
		}, 1000);
	}

	schedulePullAndPush();

	return {
		stop: () => {
			stoped = true;
		},
	};
}
