import { Kysely } from "kysely";
import { createDialect, type SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { v7 as uuid_v7, v4 as uuid_v4 } from "uuid";
import type { LixDatabaseSchema, LixInternalDatabaseSchema } from "./schema.js";
import { applySchema } from "./apply-schema.js";
import { humanId } from "human-id";
import { nanoid } from "./nano-id.js";
import { JSONColumnPlugin } from "./kysely-plugin/json-column-plugin.js";
import { LixSchemaMap } from "./schema.js";
import { isJsonType } from "../schema-definition/json-type.js";

// dynamically computes the json columns for each view
// via the json schemas.
const ViewsWithJsonColumns = {
	state: ["snapshot_content"],
	...(() => {
		const result: Record<string, string[]> = {};
		for (const [viewName, schema] of Object.entries(LixSchemaMap)) {
			// Check if schema is an object and has properties
			if (typeof schema === "boolean" || !schema.properties) continue;
			const jsonColumns = Object.entries(schema.properties)
				.filter(([, def]) => isJsonType(def))
				.map(([key]) => key);
			if (jsonColumns.length) {
				result[viewName] = jsonColumns;
			}
		}
		return result;
	})(),
};

export function initDb(args: {
	sqlite: SqliteWasmDatabase;
}): Kysely<LixDatabaseSchema> {
	const db = new Kysely<LixDatabaseSchema>({
		// log: ["error", "query"],
		dialect: createDialect({
			database: args.sqlite,
		}),
		plugins: [
			// fallback json parser in case column aliases are used
			// new ParseJSONResultsPlugin(),
			JSONColumnPlugin(ViewsWithJsonColumns),
		],
	});
	initFunctions({
		sqlite: args.sqlite,
		db: db as unknown as Kysely<LixInternalDatabaseSchema>,
	});

	applySchema({
		sqlite: args.sqlite,
		db: db as unknown as Kysely<LixInternalDatabaseSchema>,
	});
	return db;
}

function initFunctions(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<LixInternalDatabaseSchema>;
}) {
	args.sqlite.createFunction({
		name: "uuid_v7",
		arity: 0,
		xFunc: () => uuid_v7(),
	});

	args.sqlite.createFunction({
		name: "uuid_v4",
		arity: 0,
		xFunc: () => uuid_v4(),
	});

	args.sqlite.createFunction({
		name: "human_id",
		arity: 0,
		xFunc: () => humanId({ separator: "-", capitalize: false }),
	});

	args.sqlite.createFunction({
		name: "nano_id",
		arity: -1,
		// @ts-expect-error - not sure why this is not working
		xFunc: (_ctx: number, length: number) => {
			return nanoid(length);
		},
	});
}
