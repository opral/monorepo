import { Kysely } from "kysely";
import { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { DatabaseSchema } from "./dbschma";

export function initDb(args: {
	sqlite: SqliteWasmDatabase;
}): Kysely<DatabaseSchema> {
	initVitab({ sqlite: args.sqlite });
	const db = new Kysely<DatabaseSchema>({
		dialect: createDialect({
			database: args.sqlite,
		}),
		plugins: [
			new ParseJSONResultsPlugin(),
			ParseJsonBPluginV1({
				// jsonb columns
				file: ["metadata"],
				file_queue: ["metadata_before", "metadata_after"],
				snapshot: ["content"],
				thread: ["body"],
			}),
			SerializeJsonBPlugin(),
		],
	});

	applySchema({ sqlite: args.sqlite, db: db });
	return db;
}


function initVitab(args: { sqlite: SqliteWasmDatabase }) {
}