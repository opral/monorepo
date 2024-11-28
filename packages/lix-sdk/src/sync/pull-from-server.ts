import type { Lix } from "../lix/open-lix.js";
import * as LixServerApi from "@lix-js/server-api-schema";
import { mergeTheirState } from "./merge-state.js";



export async function pullFromServer(args: {
	id: string;
	lix: Lix;
	serverUrl: string;
}): Promise<void> {
	// TODO SYNC implement process:
	// 1. get the current vector clock on the client "sessionStatesKnownByTheClient" and send it to the server
	const sessionStatesClient = await args.lix.db.selectFrom('vector_clock').select(({ fn }) => {
		return ['session', fn.max<number>('session_time').as('time')]
	}).groupBy('session').execute()

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
	})
	
	// 3A). prepare a filtered upsert only upsert those records that have not been written more recently on the client
	//   - start a transaction (to be able to rollback)
	
	// 3B) We have a block list of records that have been changed more recently locally 
	//   - start transaction 
	//   - turn of trigger
	//   - iterate through the rows and upsert them - but skip those from the block list
	// update the origin vector clock - to save the roundtrip?


	// TODO SYNC write down reason to pick option b
	// how do we determine the last write? 
	// Option A
	// we add an updated_at column to every table in lix that represents the current modification time of a row
	// when ever we do an upsert we compare the new values timestame with the old values timestamp. 
	// if the new values timestamp is older - we just ignore the modification
	// + works without the vector clock table
	// - column needs be kept up to date
	// 
	// Option B
	// we add a wall clock timestamp to the session table. 
	// - whenever we write to the session table (via the trigger) we add the current wall clock time
	// - the upsert needs to join the session table in a way that:
	//    - we can check if my change is newer than the one comming from the backend



	// // create the query to execute against the server

	// // select * from vector_clock where session not in (${sessions_known_by_the_client}) 
	// //  OR (session = ${sessions_known_by_the_client[i].session} and session_time > sessions_known_by_the_client[i].session_time

	// // TODO move this to the server instead and just send the vector clock as request parameter
	// let sessionQuery = 'select * from vector_clock where'

	// if (sessionStatesKnownByTheClient.length > 0) {
	// 	// get all operations done by session we don't have a state for
	// 	sessionQuery += ` session not in (${sessionStatesKnownByTheClient.map(state => state.session).join('')})`

	// 	// get the operations done by other sessions i have no knowlede about
	// 	for (const knownSessionState of sessionStatesKnownByTheClient) {
	// 		sessionQuery += `or (session = ${knownSessionState.session} and session_time > ${knownSessionState.time} `
	// 	}
	// }


	
} 
