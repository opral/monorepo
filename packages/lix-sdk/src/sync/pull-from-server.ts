import type { Lix } from "../lix/open-lix.js";
import type { LixDatabaseSchema } from "../database/schema.js";
import * as LixServerApi from "@lix-js/server-api-schema";

export async function pullFromServer(args: {
	id: string;
	lix: Lix;
	serverUrl: string;
}): Promise<void> {

	const response = await fetch(
		new Request(`${args.serverUrl}/lsa/pull-v1`, {
			method: "POST",
			body: JSON.stringify({
				lix_id: args.id,
				vector_clock: [{
					session: "123e4567-e",
					time: 123456789,
				}],
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
	const data = (
		body as LixServerApi.paths["/lsa/pull-v1"]["post"]["responses"]["200"]["content"]["application/json"]
	).data;

	await args.lix.db.transaction().execute(async (trx) => {
		for (const { table_name, rows } of data) {
			if (rows.length > 0) {
				await trx
					.insertInto(table_name as keyof LixDatabaseSchema)
					.values(rows)
					.onConflict((oc) => oc.doNothing())
					.execute();
			}
		}
	});
} 
