import { CamelCasePlugin, Kysely } from "kysely";
import { applySchema, type InlangDatabaseSchema } from "./schema.js";
import { createDialect, type SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { v7 } from "uuid";
import { humanId } from "../human-id/human-id.js";
import { JsonbPlugin } from "./jsonbPlugin.js";

export function initDb(args: { sqlite: SqliteWasmDatabase }) {
	initDefaultValueFunctions({ sqlite: args.sqlite });
	applySchema({ sqlite: args.sqlite });
	const db = new Kysely<InlangDatabaseSchema>({
		dialect: createDialect({
			database: args.sqlite,
		}),
		plugins: [
			new CamelCasePlugin(),
			new JsonbPlugin({ database: args.sqlite }),
		],
	});
	return db;
}

function initDefaultValueFunctions(args: { sqlite: SqliteWasmDatabase }) {
	args.sqlite.createFunction({
		name: "uuid_v7",
		arity: 0,
		xFunc: () => v7(),
	});
	args.sqlite.createFunction({
		name: "human_id",
		arity: 0,
		xFunc: () => humanId(),
	});
}
