import type * as LixServerProtocol from "@lix-js/server-protocol";
import type { Lix } from "../lix/open-lix.js";
import type { LixDatabaseSchema } from "../database/schema.js";

/**
 * Pushes rows to the server.
 */
export async function pushRowsToServer(args: {
	serverUrl: string;
	lix: Lix;
	id: string;
	tableNames: Array<keyof LixDatabaseSchema>;
}): Promise<void> {
	// ! NEEDS TO BE SEQUENTIAL TO AVOID SERVER HANDLING CONCURRENT MUTATIONS
	for (const name of args.tableNames) {
		const rows = await args.lix.db.selectFrom(name).selectAll().execute();

		if (rows.length === 0) {
			return;
		}

		const serverQuery = createInsertQuery(name, rows);

		const response = await fetch(
			new Request(`${args.serverUrl}/lsp/lix/${args.id}/query`, {
				method: "POST",
				body: JSON.stringify({
					sql: serverQuery.sql,
					parameters: serverQuery.parameters as unknown[],
				} satisfies LixServerProtocol.paths["/lsp/lix/{id}/query"]["post"]["requestBody"]["content"]["application/json"]),
				headers: {
					"Content-Type": "application/json",
				},
			})
		);
		if (!response.ok) {
			const body = await response.text();
			throw new Error(
				`Failed to push rows to server: ${body} (${JSON.stringify(serverQuery, undefined, 2)})`
			);
		}
	}
}

function createInsertQuery(table: string, rows: Record<string, any>[]) {
	if (rows.length === 0) {
		throw new Error("No rows provided.");
	}

	const columns = Object.keys(rows[0]!);

	// Create placeholders and flatten values
	const placeholders = rows
		.map(() => `(${columns.map(() => "?").join(", ")})`)
		.join(", ");

	const values = rows.flatMap((row) => columns.map((col) => row[col]));

	// Construct SQL as a string (for sending over the wire)
	const query = `
			INSERT INTO ${table} (${columns.map((col) => `"${col}"`).join(", ")})
			VALUES ${placeholders}
			ON CONFLICT DO NOTHING;
	`;

	return { sql: query, parameters: values };
}
