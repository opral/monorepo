import { CamelCasePlugin, Kysely, ParseJSONResultsPlugin } from "kysely";
import type { InlangDatabaseSchema } from "./schema.js";
import { createDialect, type SqliteDatabase } from "sqlite-wasm-kysely";
import { v4 } from "uuid";
import { generateBundleId } from "../bundle-id/bundle-id.js";

export function initDb(args: { sqlite: SqliteDatabase }) {
	initDefaultValueFunctions({ sqlite: args.sqlite });
	const db = new Kysely<InlangDatabaseSchema>({
		dialect: createDialect({
			database: args.sqlite,
		}),
		plugins: [new ParseJSONResultsPlugin(), new CamelCasePlugin()],
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
		name: "bundle_id",
		arity: 0,
		xFunc: () => generateBundleId(),
	});
}
