import type { Lix } from "../lix/open-lix.js";

/**
 * Execute a query synchronously.
 *
 * WARNING: This function is not recommended for general use.
 * Only if you need sync queries, like in a trigger for exmaple,
 * you should use this function. The function is not transforming
 * the query or the result as the db API does. You get raw SQL.
 *
 * @example
 *   const query = lix.db.selectFrom("key_value").selectAll();
 *   const result = executeSync({ lix, query }) as KeyValue[];
 */
export function executeSync(args: {
	lix: Pick<Lix, "sqlite">;
	query: any;
}): Array<any> {
	const compiledQuery = args.query.compile();

	const columnNames: string[] = [];

	const result = args.lix.sqlite.exec({
		sql: compiledQuery.sql,
		bind: compiledQuery.parameters as any[],
		returnValue: "resultRows",
		columnNames,
	});

	return result.map((row) => {
		const obj: any = {};

		columnNames.forEach((columnName, index) => {
			obj[columnName] = row[index];
		});

		// Parse JSONB binary blobs
		for (const col of Object.keys(obj)) {
			const raw = obj[col];
			if (!(raw instanceof Uint8Array)) {
				continue;
			}
			try {
				// Convert SQLite JSONB blob to JSON string
				const json = args.lix.sqlite.exec("SELECT json(?)", {
					bind: [raw],
					returnValue: "resultRows",
				})[0]![0];
				obj[col] = JSON.parse(json as string);
			} catch {
				continue;
			}
		}

		return obj;
	});
}
