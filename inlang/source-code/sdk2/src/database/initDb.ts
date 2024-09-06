import { CamelCasePlugin, Kysely, ParseJSONResultsPlugin } from "kysely";
import { applySchema, type InlangDatabaseSchema } from "./schema.js";
import { createDialect, type SqliteDatabase } from "sqlite-wasm-kysely";
import { v4 } from "uuid";
import { humanId } from "../human-id/human-id.js";
import { SerializeJsonPlugin } from "./serializeJsonPlugin.js";

export function initDb(args: { sqlite: SqliteDatabase }) {
	initDefaultValueFunctions({ sqlite: args.sqlite });
	applySchema({ sqlite: args.sqlite });
	const db = new Kysely<InlangDatabaseSchema>({
		dialect: createDialect({
			database: args.sqlite,
		}),
		plugins: [
			new ParseJSONResultsPlugin(),
			new CamelCasePlugin(),
			new SerializeJsonPlugin(),
		],
	});
	return db;
}

function initDefaultValueFunctions(args: { sqlite: SqliteDatabase }) {
	args.sqlite.createFunction({
		name: "uuid_v4",
		arity: 0,
		xFunc: () => v4(),
	});
	args.sqlite.createFunction({
		name: "human_id",
		arity: 0,
		xFunc: () => humanId(),
	});
}
