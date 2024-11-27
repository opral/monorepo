import type { Lix } from "../lix/open-lix.js";
import type { LixDatabaseSchema, LixFile } from "../database/schema.js";
import * as LixServerProtocol from "@lix-js/server-api-schema";

export async function pullFromServer(args: {
	id: string;
	lix: Lix;
	serverUrl: string;
	tableNames: Array<keyof LixDatabaseSchema>;
}): Promise<void> {
	for (const name of args.tableNames) {
		let sqlQuery = `SELECT * FROM ${name}`;

		if (name === "snapshot") {
			sqlQuery = `SELECT json(content) as content FROM snapshot`;
		} else if (name === "file") {
			// don't sync the data column
			sqlQuery = `SELECT id, path, metadata FROM file`;
		}

		const response = await fetch(
			new Request(`${args.serverUrl}/lsa/lix/${args.id}/query`, {
				method: "POST",
				body: JSON.stringify({
					sql: sqlQuery,
				}),
				headers: {
					"Content-Type": "application/json",
				},
			})
		);
		if (!response.ok) {
			throw new Error(`Failed to pull from server: ${response.statusText}`);
		}
		const data =
			(await response.json()) as LixServerProtocol.paths["/lsa/lix/{id}/query"]["post"]["responses"]["200"]["content"]["application/json"];

		if (name === "file") {
			// await sql`
			// 	INSERT INTO file (id, path, data, metadata)
			// 	VALUES ('file0', '/hello.txt', X'${data.rows[0].data}', NULL)
			// 	ON CONFLICT (id) DO NOTHING;
			// `.execute(args.lix.db);
			await args.lix.db
				.insertInto("file")
				.values(
					(data.rows as LixFile[])?.map((row) => ({
						id: row.id,
						metadata: row.metadata,
						path: row.path,
						data: new Uint8Array([]),
					})) ?? []
				)
				.onConflict((oc) => oc.doNothing())
				.execute();
		} else {
			await args.lix.db
				.insertInto(name)
				.values(data.rows ?? [])
				.onConflict((oc) => oc.doNothing())
				.execute();
		}
	}
}
