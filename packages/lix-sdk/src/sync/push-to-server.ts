import type * as LixServerProtocol from "../../../lix-server-api-schema/dist/schema.js";
import type { Lix } from "../lix/open-lix.js";
import type { LixDatabaseSchema } from "../database/schema.js";

/**
 * Pushes rows to the server.
 */
export async function pushToServer(args: {
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

		let columns: string[] = Object.keys(rows[0]!);
		let columnFunctions: Record<string, string> = {};

		// map column names that need special handling
		if (name === "snapshot") {
			columns = ["content"];
			columnFunctions = {
				content: "jsonb",
			};
			for (let i = 0; rows.length > i; i++) {
				// delete the auto generated id
				// @ts-expect-error - type mismatch
				rows[i] = {
					id: "ss",
					content: !rows[i]?.content ? null : JSON.stringify(rows[i]!.content),
				};
			}
		}

		const serverQuery = createInsertQuery({
			table: name,
			columns,
			columnFunctions,
			rows,
		});

		const response = await fetch(
			new Request(`${args.serverUrl}/lsa/lix/${args.id}/query`, {
				method: "POST",
				body: JSON.stringify({
					sql: serverQuery.sql,
					parameters: serverQuery.parameters as unknown[],
				} satisfies LixServerProtocol.paths["/lsa/lix/{id}/query"]["post"]["requestBody"]["content"]["application/json"]),
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

/**
 * Creates a SQL query for inserting rows into a table.
 */
function createInsertQuery(args: {
	table: string;
	columns: string[];
	columnFunctions: Record<string, string>;
	rows: Record<string, unknown>[];
}) {
	if (args.rows.length === 0) {
		throw new Error("No rows provided.");
	}

	// Generate placeholders for each row
	const placeholders: string[] = [];

	const values: unknown[] = [];

	for (const row of args.rows) {
		const rowPlaceholders = [];
		for (const column of args.columns) {
			values.push(row[column]);
			if (args.columnFunctions[column]) {
				rowPlaceholders.push(`${args.columnFunctions[column]}(?)`);
			} else {
				rowPlaceholders.push("?");
			}
		}
		placeholders.push(` (${rowPlaceholders.join(", ")})`);
	}

	// Construct the SQL query
	const query = `
      INSERT INTO ${args.table} (${args.columns.join(", ")})
      VALUES ${placeholders}
      ON CONFLICT DO NOTHING;
  `;

	return { sql: query, parameters: values };
}
