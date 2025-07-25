import type * as LixServerProtocol from "../../../lix/server-protocol-schema/dist/schema.js";
import type { Lix } from "../lix/open-lix.js";
import type { VectorClock } from "./merge-state.js";
import { getDiffingRows } from "./get-diffing-rows.js";

/**
 * Pushes local changes to a Lix server.
 *
 * Only rows unknown to the server are transmitted based on the provided
 * vector clock. An error is thrown when the server responds with a non
 * successful status.
 *
 * @example
 * ```ts
 * await pushToServer({ id, serverUrl, lix, targetVectorClock })
 * ```
 */
export async function pushToServer(args: {
	id: string;
	serverUrl: string;
	lix: Pick<Lix, "db">;
	targetVectorClock: VectorClock;
}): Promise<void> {
	// console.log(
	// 	"collecting rows to push using known server state:",
	// 	args.targetVectorClock
	// );
	const { upsertedRows: tableRowsToPush, state } = await getDiffingRows({
		lix: args.lix,
		targetVectorClock: args.targetVectorClock,
	});
	// console.log("rows to push", tableRowsToPush);

	if (Object.keys(tableRowsToPush).length === 0) {
		// console.log("nothing to push");
		return;
	}

	const response = await fetch(
		new Request(`${args.serverUrl}/lsp/push-v1`, {
			method: "POST",
			body: JSON.stringify({
				lix_id: args.id,
				vector_clock: state,
				data: tableRowsToPush,
			} satisfies LixServerProtocol.paths["/lsp/push-v1"]["post"]["requestBody"]["content"]["application/json"]),
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
