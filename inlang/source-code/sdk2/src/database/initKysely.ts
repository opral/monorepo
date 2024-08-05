import { CamelCasePlugin, Kysely, ParseJSONResultsPlugin } from "kysely";
import type { InlangDatabaseSchema } from "./schema.js";
import { createDialect, type SqliteDatabase } from "sqlite-wasm-kysely";

export function initKysely(args: { sqlite: SqliteDatabase }) {
	const db = new Kysely<InlangDatabaseSchema>({
		dialect: createDialect({
			database: args.sqlite,
		}),
		plugins: [
			new ParseJSONResultsPlugin(),
			// TODO: remove plugin for snake_case in data structures?
			//       the cost of camelCase mapping seems high
			new CamelCasePlugin(),
		],
	});
	return db;
}
