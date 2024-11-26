import type { paths } from "@lix-js/server-protocol";
import type { Client } from "openapi-fetch";
import type { Lix } from "../lix/open-lix.js";
import type { LixDatabaseSchema } from "../database/schema.js";

export async function fetchRowsFromServer(args: {
	client: Client<paths>;
	lix: Lix;
  id: string;
	tableNames: Array<keyof LixDatabaseSchema>;
}): Promise<void> {
	const tables = await lix.db.listTables();
	await Promise.all(
		tables.map(async (table) => {
			const rows = await client.paths["/lix/{id}/sync"].get({
				id: lix.id,
				query: {
					table,
				},
			});
			await lix.db.insertInto(table).values(rows).execute();
		}),
	);
}
