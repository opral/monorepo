import type { LixRuntime } from "../runtime/boot.js";

/**
 * Execute a query synchronously.
 *
 * ⚠️  MAJOR WARNING: This function is a PURE SQL LAYER without transformations!
 *
 * - JSON columns return as RAW JSON STRINGS, not parsed objects
 * - You must manually parse/stringify JSON data
 * - No automatic type conversions happen
 * - Results are raw SQLite values
 *
 * Only use this for triggers, database functions, or when you specifically
 * need synchronous database access and understand you're working with raw SQL.
 *
 * @example
 *   // JSON columns are returned as strings - you must parse manually:
 *   const result = executeSync({ lix, query });
 *   result[0].metadata = JSON.parse(result[0].metadata);
 */
export function executeSync(args: {
	runtime: Pick<LixRuntime, "sqlite">;
	query: any;
}): Array<any> {
	const compiledQuery = args.query.compile();

	const columnNames: string[] = [];

	const result = args.runtime.sqlite.exec({
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

		// NO JSON PARSING - pure SQL results
		return obj;
	});
}
