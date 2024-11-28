import type { OperandExpression, SqlBool } from "kysely";
import type * as LixServerProtocol from "../../../lix-server-api-schema/dist/schema.js";
import type { SessionOperations } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";
import type { VectorClock } from "./merge-state.js";
import { TO_BE_SYNCED_TABLES } from "./to-be-synced-tables.js";

/**
 * Pushes rows to the server.
 */
export async function pushToServer(args: {
	id: string;
	serverUrl: string;
	lix: Lix;
	targetVectorClock: VectorClock
}): Promise<void> {

	// TODO SYNC
	// use the target vector clock to collect all changed rows the target is not aware of
	// const operationsToPush = args.lix.db
	// .selectFrom('vector_clock')
	// .selectAll('vector_clock')

	// if (args.targetVectorClock.length > 0) {
	// 	operationsToPush.where((eb) => {
	// 		const ors: any[] = []
			
	// 		ors.push(eb('session', 'not in', args.targetVectorClock.map(sessionTime => sessionTime.session)))
	// 		for (const sessionTime of args.targetVectorClock) {
	// 			ors.push(eb('session', '=', sessionTime.session).and("session_time", "=", sessionTime.time))
	// 		}

	// 		return ors as any
	// 	})
	// }

	// await operationsToPush.execute()
	
	const data = await Promise.all(
		TO_BE_SYNCED_TABLES.map(async (table_name) => {
			let query = args.lix.db.selectFrom(table_name);

			if (table_name === "snapshot") {
				// ignore inserted column id
				query = query.select("content");
			} else {
				query = query.selectAll();
			}

			const rows = await query.execute();

			return { table_name, rows };
		})
	);
	const response = await fetch(
		new Request(`${args.serverUrl}/lsa/push-v1`, {
			method: "POST",
			body: JSON.stringify({
				lix_id: args.id,
				vector_clock: [
					{
						session: "123e4567-e",
						time: 123456789,
					},
				],
				data,
			} satisfies LixServerProtocol.paths["/lsa/push-v1"]["post"]["requestBody"]["content"]["application/json"]),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);
	if (!response.ok) {
		const body = await response.json();
		throw new Error(`Failed to push to server: ${body.code} ${body.message}`);
	}
}
