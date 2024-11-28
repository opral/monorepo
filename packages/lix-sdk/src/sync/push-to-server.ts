import type * as LixServerProtocol from "../../../lix-server-api-schema/dist/schema.js";
import type { Lix } from "../lix/open-lix.js";
import { TO_BE_SYNCED_TABLES } from "./to-be-synced-tables.js";

/**
 * Pushes rows to the server.
 */
export async function pushToServer(args: {
	id: string;
	serverUrl: string;
	lix: Lix;
}): Promise<void> {
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
				vector_clock: {
					session: "123e4567-e",
					time: 123456789,
				},
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
