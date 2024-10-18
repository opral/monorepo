import { Kysely, ParseJSONResultsPlugin } from "kysely";
import { createDialect, type SqliteDatabase } from "sqlite-wasm-kysely";
import { v4 } from "uuid";
import { SerializeJsonPlugin } from "./serializeJsonPlugin.js";
import type { LixDatabaseSchema } from "./schema.js";
import { applySchema } from "./applySchema.js";
import { sha256 } from "js-sha256";

export function initDb(args: { sqlite: SqliteDatabase }) {
	initDefaultValueFunctions({ sqlite: args.sqlite });
	applySchema({ sqlite: args.sqlite });
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

	args.sqlite.createFunction({
		name: "sha256",
		arity: 1,
		xFunc: (_ctx: number, value) => {
			return value ? sha256(value as string) : "no-value";
		},
		deterministic: true,
	});
}
