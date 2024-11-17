import { Kysely, ParseJSONResultsPlugin } from "kysely";
import { createDialect, type SqliteDatabase } from "sqlite-wasm-kysely";
import { v7 as uuid_v7 } from "uuid";
import { SerializeJsonPlugin } from "./serialize-json-plugin.js";
import type { LixDatabaseSchema } from "./schema.js";
import { applySchema } from "./apply-schema.js";
import { sha256 } from "js-sha256";

export function initDb(args: {
	sqlite: SqliteDatabase;
}): Kysely<LixDatabaseSchema> {
	initFunctions({ sqlite: args.sqlite });
	applySchema({ sqlite: args.sqlite });
	const db = new Kysely<LixDatabaseSchema>({
		dialect: createDialect({
			database: args.sqlite,
		}),
		plugins: [new ParseJSONResultsPlugin(), new SerializeJsonPlugin()],
	});
	return db;
}

function initFunctions(args: { sqlite: SqliteDatabase }) {
	args.sqlite.createFunction({
		name: "uuid_v7",
		arity: 0,
		xFunc: () => uuid_v7(),
	});

	args.sqlite.createFunction({
		name: "sha256",
		arity: 1,
		xFunc: (_ctx: number, value) => {
			return value ? sha256(value as string) : "no-content";
		},
		deterministic: true,
	});
}
