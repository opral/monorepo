import { Kysely, ParseJSONResultsPlugin } from "kysely";
import { createDialect, type SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { v7 as uuid_v7, v4 as uuid_v4 } from "uuid";
import type { LixDatabaseSchema, LixInternalDatabaseSchema } from "./schema.js";
import { humanId } from "human-id";
import { nanoid } from "./nano-id.js";
import { JSONColumnPlugin } from "./kysely-plugin/json-column-plugin.js";
import { ViewInsertReturningErrorPlugin } from "./kysely-plugin/view-insert-returning-error-plugin.js";
import { LixSchemaViewMap } from "./schema.js";
import { isJsonType } from "../schema-definition/json-type.js";
// Schema imports
import { applyLogDatabaseSchema } from "../log/schema.js";
import { applyChangeDatabaseSchema } from "../change/schema.js";
import { applyChangeSetDatabaseSchema } from "../change-set/schema.js";
import { applyVersionDatabaseSchema } from "../version/schema.js";
import { applySnapshotDatabaseSchema } from "../snapshot/schema.js";
import { applyStoredSchemaDatabaseSchema } from "../stored-schema/schema.js";
import { applyKeyValueDatabaseSchema } from "../key-value/schema.js";
import { applyStateDatabaseSchema } from "../state/schema.js";
import { applyChangeAuthorDatabaseSchema } from "../change-author/schema.js";
import { applyLabelDatabaseSchema } from "../label/schema.js";
import { applyThreadDatabaseSchema } from "../thread/schema.js";
import { applyAccountDatabaseSchema } from "../account/schema.js";
import { applyStateHistoryDatabaseSchema } from "../state-history/schema.js";

// dynamically computes the json columns for each view
// via the json schemas.
const ViewsWithJsonColumns = {
	state: ["snapshot_content"],
	state_history: ["snapshot_content"],
	snapshot: ["content"],
	...(() => {
		const result: Record<string, string[]> = {};
		for (const [viewName, schema] of Object.entries(LixSchemaViewMap)) {
			// Check if schema is an object and has properties
			if (typeof schema === "boolean" || !schema.properties) continue;
			const jsonColumns = Object.entries(schema.properties)
				.filter(([, def]) => isJsonType(def))
				.map(([key]) => key);
			if (jsonColumns.length) {
				result[viewName] = jsonColumns;
				// Also add the _all variant view with the same JSON columns
				result[viewName + "_all"] = jsonColumns;
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
			// needed for things like `jsonArrayFrom()`
			new ParseJSONResultsPlugin(),
			JSONColumnPlugin(ViewsWithJsonColumns),
			new ViewInsertReturningErrorPlugin(Object.keys(LixSchemaViewMap)),
		],
	});
	initFunctions({
		sqlite: args.sqlite,
		db: db as unknown as Kysely<LixInternalDatabaseSchema>,
	});

	// Apply all database schemas first (tables, views, triggers)
	applyStateDatabaseSchema(
		args.sqlite,
		db as unknown as Kysely<LixInternalDatabaseSchema>
	);
	applySnapshotDatabaseSchema(args.sqlite);
	applyChangeDatabaseSchema(args.sqlite);
	applyChangeSetDatabaseSchema(args.sqlite);

	applyStoredSchemaDatabaseSchema(args.sqlite);
	applyAccountDatabaseSchema(args.sqlite);
	applyVersionDatabaseSchema(args.sqlite);
	applyKeyValueDatabaseSchema(args.sqlite);
	applyChangeAuthorDatabaseSchema(args.sqlite);
	applyLabelDatabaseSchema(args.sqlite);
	applyThreadDatabaseSchema(args.sqlite);
	applyStateHistoryDatabaseSchema(args.sqlite);
	// applyFileDatabaseSchema will be called later when lix is fully constructed
	applyLogDatabaseSchema(args.sqlite);

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
