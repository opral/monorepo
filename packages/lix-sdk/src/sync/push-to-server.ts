import type * as LixServerProtocol from "../../../lix-server-api-schema/dist/schema.js";
import type { Lix } from "../lix/open-lix.js";
import type { VectorClock } from "./merge-state.js";
import { getUpsertedRows } from "./get-upserted-rows.js";

/**
 * Pushes rows to the server.
 */
export async function pushToServer(args: {
	id: string;
	serverUrl: string;
	lix: Lix;
	targetVectorClock: VectorClock
}): Promise<void> {

	const {
		upsertedRows: tableRowsToPush,
		state
	} = await getUpsertedRows({
		lix: args.lix,
		targetVectorClock: args.targetVectorClock,
	})

	const response = await fetch(
		new Request(`${args.serverUrl}/lsa/push-v1`, {
			method: "POST",
			body: JSON.stringify({
				lix_id: args.id,
				vector_clock: state,
				data: tableRowsToPush,
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
