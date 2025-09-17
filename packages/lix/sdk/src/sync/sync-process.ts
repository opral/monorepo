import type { Lix } from "../lix/open-lix.js";
import { pushToServer } from "./push-to-server.js";
import { pullFromServer } from "./pull-from-server.js";

export async function initSyncProcess(args: {
	lix: Pick<Lix, "db" | "plugin" | "toBlob">;
}): Promise<void> {
	const lixId = await args.lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	const pullAndPush = async () => {
		const shouldSync = await args.lix.db
			.selectFrom("key_value")
			.where("key", "=", "lix_sync")
			.select("value")
			.executeTakeFirst();

		if (shouldSync?.value !== "true") {
			return;
		}

		const url = await args.lix.db
			.selectFrom("key_value")
			// saved in key value because simpler for experimentation
			.where("key", "=", "lix_server_url")
			.select("value")
			.executeTakeFirst();
		// if you want to test sync, restart the lix app
		// to make sure the experimental-sync-url is set
		if (!url) {
			return;
		}
		try {
			// console.log("----------- PULL FROM SERVER -------------");
			const serverState = await pullFromServer({
				serverUrl: url.value,
				lix: args.lix,
				id: lixId.value,
			});
			// console.log(
			// 	"----------- DONE PULL FROM SERVER ------------- New known Server state: ",
			// 	serverState
			// );
			// console.log("----------- PUSH TO SERVER -------------");
			await pushToServer({
				serverUrl: url.value,
				lix: args.lix,
				id: lixId.value,
				targetVectorClock: serverState,
			});
		} catch (e) {
			// likely that lix didn't exist on the server
			const response = await fetch(
				new Request(`${url.value}/lsp/new-v1`, {
					method: "POST",
					body: await args.lix.toBlob(),
				})
			);
			if (!response.ok && response.status !== 409) {
				throw e;
			}
		}
		// console.log("----------- DONE PUSH TO SERVER -------------");
	};

	// naive implementation that syncs every second

	let stopSync = false;

	async function runPullAndPush() {
		try {
			await pullAndPush();
		} catch (e) {
			if (e instanceof Error && e.message.includes("DB has been closed.")) {
				// stop the syncing process, the database has been closed.
				stopSync = true;
				return;
			}
			console.error("Error in sync process", e);
		}
	}

	async function schedulePullAndPush() {
		if (stopSync) {
			return;
		}

		await runPullAndPush();

		if (stopSync) {
			return;
		}

		setTimeout(() => {
			void schedulePullAndPush();
		}, 750);
	}

	void schedulePullAndPush();
}
