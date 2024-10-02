import { Kysely, ParseJSONResultsPlugin } from "kysely";
import { createDialect, type SqliteDatabase } from "sqlite-wasm-kysely";
import { v4 } from "uuid";
import { SerializeJsonPlugin } from "./serializeJsonPlugin.js";
import type { LixDatabaseSchema } from "./schema.js";

export function initDb(args: { sqlite: SqliteDatabase }) {
	initDefaultValueFunctions({ sqlite: args.sqlite });
	
	const db = new Kysely<LixDatabaseSchema>({
		dialect: createDialect({
			database: args.sqlite,
		}),
		plugins: [new ParseJSONResultsPlugin(), new SerializeJsonPlugin()],
	});
	
	return db;
}

function initDefaultValueFunctions(args: { sqlite: SqliteDatabase }) {
	args.sqlite.createFunction({
		name: "uuid_v4",
		arity: 0,
		xFunc: () => v4(),
	});
}
