import { Kysely, ParseJSONResultsPlugin } from "kysely";
import { createDialect, type SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixDatabaseSchema, LixInternalDatabaseSchema } from "./schema.js";
import { JSONColumnPlugin } from "./kysely-plugin/json-column-plugin.js";
import { ViewInsertReturningErrorPlugin } from "./kysely-plugin/view-insert-returning-error-plugin.js";
import { LixSchemaViewMap } from "./schema.js";
import { isJsonType } from "../schema-definition/json-type.js";
// Schema imports
import { applyLogDatabaseSchema } from "../log/schema.js";
import { applyChangeDatabaseSchema } from "../change/schema.js";
import { applyChangeSetDatabaseSchema } from "../change-set/schema.js";
import { applyCommitDatabaseSchema } from "../commit/schema.js";
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
import type { LixHooks } from "../hooks/create-hooks.js";
import type { Lix } from "../lix/open-lix.js";
import { timestamp, uuidV7, generateHumanId } from "../deterministic/index.js";
import { nanoId } from "../deterministic/nano-id.js";
import { applyEntityDatabaseSchema } from "../entity/schema.js";
import { applyEntityThreadDatabaseSchema } from "../entity/thread/schema.js";

/**
 * Configuration for JSON columns in database views.
 *
 * Specifies which columns contain JSON data and what types of JSON values they accept.
 * This is used by the JSONColumnPlugin to properly serialize/deserialize JSON data.
 *
 * Column types:
 * - `type: 'object'` - Column only accepts JSON objects. String values are assumed to be
 *   pre-serialized JSON to prevent double serialization when data flows between views.
 * - `type: ['string', 'number', 'boolean', 'object', 'array', 'null']` - Column accepts
 *   any valid JSON value. All values are properly serialized.
 *
 * @example
 * ```typescript
 * {
 *   change: {
 *     snapshot_content: { type: 'object' } // Only objects, prevents double serialization
 *   },
 *   key_value: {
 *     value: { type: ['string', 'number', 'boolean', 'object', 'array', 'null'] } // Any JSON
 *   }
 * }
 * ```
 */
const ViewsWithJsonColumns = (() => {
	const result: Record<
		string,
		Record<
			string,
			{
				type:
					| "object"
					| Array<
							"string" | "number" | "boolean" | "object" | "array" | "null"
					  >;
			}
		>
	> = {};

	// Hardcoded object-only columns
	const hardcodedViews = {
		state: { snapshot_content: { type: "object" as const } },
		state_all: { snapshot_content: { type: "object" as const } },
		state_history: { snapshot_content: { type: "object" as const } },
		change: { snapshot_content: { type: "object" as const } },
	};

	// Add the hardcoded columns first
	Object.assign(result, hardcodedViews);

	// Process schema-based columns
	for (const [viewName, schema] of Object.entries(LixSchemaViewMap)) {
		// Check if schema is an object and has properties
		if (typeof schema === "boolean" || !schema.properties) continue;

		const jsonColumns: Record<
			string,
			{
				type: Array<
					"string" | "number" | "boolean" | "object" | "array" | "null"
				>;
			}
		> = {};

		for (const [key, def] of Object.entries(schema.properties)) {
			if (isJsonType(def)) {
				// All schema-based JSON columns accept any JSON value
				jsonColumns[key] = {
					type: ["string", "number", "boolean", "object", "array", "null"],
				};
			}
		}

		if (Object.keys(jsonColumns).length > 0) {
			result[viewName] = jsonColumns;
			// Also add the _all variant view with the same JSON columns
			result[viewName + "_all"] = jsonColumns;
		}
	}

	return result;
})();

export function initDb(args: {
	sqlite: SqliteWasmDatabase;
	hooks: LixHooks;
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

	const lix = { sqlite: args.sqlite, db, hooks: args.hooks } as unknown as Lix;

	initFunctions({
		sqlite: args.sqlite,
		db: db as unknown as Kysely<LixInternalDatabaseSchema>,
	});

	// Apply all database schemas first (tables, views, triggers)
	applySnapshotDatabaseSchema(args.sqlite);
	applyChangeDatabaseSchema(args.sqlite);
	applyStateDatabaseSchema(lix);
	applyEntityDatabaseSchema(lix);
	applyChangeSetDatabaseSchema(lix);
	applyCommitDatabaseSchema(lix);
	applyStoredSchemaDatabaseSchema(lix);
	applyVersionDatabaseSchema(lix);
	applyAccountDatabaseSchema(lix);
	applyKeyValueDatabaseSchema(lix);
	applyChangeAuthorDatabaseSchema(lix);
	applyLabelDatabaseSchema(lix);
	applyThreadDatabaseSchema(lix);
	applyEntityThreadDatabaseSchema(lix);
	applyStateHistoryDatabaseSchema(lix);
	// applyFileDatabaseSchema will be called later when lix is fully constructed
	applyLogDatabaseSchema(lix);

	return db;
}

function initFunctions(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<LixInternalDatabaseSchema>;
}) {
	const lix = { sqlite: args.sqlite, db: args.db } as unknown as Lix;

	args.sqlite.createFunction({
		name: "lix_uuid_v7",
		arity: 0,
		xFunc: () => uuidV7({ lix }),
	});

	args.sqlite.createFunction({
		name: "human_id",
		arity: 0,
		xFunc: () => generateHumanId({ lix, separator: "-", capitalize: false }),
	});

	args.sqlite.createFunction({
		name: "lix_timestamp",
		arity: 0,
		xFunc: () => timestamp({ lix }),
	});

	args.sqlite.createFunction({
		name: "lix_nano_id",
		arity: -1,
		// @ts-expect-error - not sure why this is not working
		xFunc: (_ctx: number, length: number) => {
			return nanoId({ lix, length });
		},
	});
}
