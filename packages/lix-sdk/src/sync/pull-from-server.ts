import type { Lix } from "../lix/open-lix.js";
import * as LixServerApi from "@lix-js/server-api-schema";
import { mergeTheirState, type VectorClock } from "./merge-state.js";

export async function pullFromServer(args: {
	id: string;
	lix: Lix;
	serverUrl: string;
}): Promise<VectorClock> {
	// 1. get the current vector clock on the client "sessionStatesKnownByTheClient" and send it to the server
	const sessionStatesClient = await args.lix.db
		.selectFrom("mutation_log")
		.select(({ fn }) => {
			return ["session", fn.max<number>("session_time").as("time")];
		})
		.groupBy("session")
		.execute();

	// 2. query the state from the server using the clients vector clock
	const response = await fetch(
		new Request(`${args.serverUrl}/lsa/pull-v1`, {
			method: "POST",
			body: JSON.stringify({
				lix_id: args.id,
				vector_clock: sessionStatesClient,
			} satisfies LixServerApi.paths["/lsa/pull-v1"]["post"]["requestBody"]["content"]["application/json"]),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);
	const body = await response.json();
	if (response.ok === false) {
		throw new Error(`Failed to pull from server: ${body.code} ${body.message}`);
	}

	// 3. Client receives the data (added/changed rows + vector clock) from the server
	//   - client could have moved forward in the meantime!
	const data = (
		body as LixServerApi.paths["/lsa/pull-v1"]["post"]["responses"]["200"]["content"]["application/json"]
	).data;

	const sessionStateServer = (
		body as LixServerApi.paths["/lsa/pull-v1"]["post"]["responses"]["200"]["content"]["application/json"]
	).vector_clock;

	await mergeTheirState({
		lix: args.lix,
		sourceVectorClock: sessionStateServer,
		sourceData: data,
	});

	return sessionStateServer;
}
