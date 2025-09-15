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
import { applyConversationDatabaseSchema } from "../conversation/schema.js";
import { applyAccountDatabaseSchema } from "../account/schema.js";
import { applyStateHistoryDatabaseSchema } from "../state-history/schema.js";
import type { LixHooks } from "../hooks/create-hooks.js";
import type { LixEngine } from "../engine/boot.js";
import { nanoIdSync } from "../engine/deterministic/nano-id.js";
import { applyEntityDatabaseSchema } from "../entity/schema.js";
import { applyEntityConversationDatabaseSchema } from "../entity/conversation/schema.js";
import { applyChangeProposalDatabaseSchema } from "../change-proposal/schema.js";
import { applyFileLixcolCacheSchema } from "../filesystem/file/cache/lixcol-schema.js";
import { applyFileDataCacheSchema } from "../filesystem/file/cache/schema.js";
import { applyTransactionStateSchema } from "../state/transaction/schema.js";
import { uuidV7Sync } from "../engine/deterministic/uuid-v7.js";
import { humanIdSync } from "../engine/deterministic/generate-human-id.js";
import { getTimestampSync } from "../engine/deterministic/timestamp.js";

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

	const engine: LixEngine = {
		sqlite: args.sqlite,
		db: db as any,
		hooks: args.hooks,
	} as any;

	initFunctions({
		sqlite: args.sqlite,
		db: db as unknown as Kysely<LixInternalDatabaseSchema>,
		hooks: args.hooks,
	});

	// Apply all database schemas first (tables, views, triggers)
	applyTransactionStateSchema({ engine: engine });
	applySnapshotDatabaseSchema(args.sqlite);
	applyChangeDatabaseSchema(args.sqlite);
	applyFileLixcolCacheSchema({ engine: engine });
	// Ensure file data cache table exists before any triggers may reference it
	applyFileDataCacheSchema({ engine: engine });
	applyStateDatabaseSchema({ engine: engine });
	applyEntityDatabaseSchema({ engine: engine });
	applyChangeSetDatabaseSchema({ engine: engine });
	applyCommitDatabaseSchema({ engine: engine });
	applyStoredSchemaDatabaseSchema({ engine: engine });
	applyVersionDatabaseSchema({ engine: engine });
	applyAccountDatabaseSchema({ engine: engine });
	applyKeyValueDatabaseSchema({ engine: engine });
	applyChangeAuthorDatabaseSchema({ engine: engine });
	applyLabelDatabaseSchema({ engine: engine });
	applyStateHistoryDatabaseSchema({ engine: engine });
	applyConversationDatabaseSchema({ engine });
	applyEntityConversationDatabaseSchema({ engine });
	applyChangeProposalDatabaseSchema({ engine });
	// applyFileDatabaseSchema will be called later when lix is fully constructed
	applyLogDatabaseSchema({ engine: engine });

	return db;
}

function initFunctions(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<LixInternalDatabaseSchema>;
	hooks: LixHooks;
}) {
	const engine = {
		sqlite: args.sqlite,
		db: args.db as any,
		hooks: args.hooks,
	} as const;

	args.sqlite.createFunction({
		name: "lix_uuid_v7",
		arity: 0,
		xFunc: () => uuidV7Sync({ engine: engine }),
	});

	args.sqlite.createFunction({
		name: "human_id",
		arity: 0,
		xFunc: () =>
			humanIdSync({ engine: engine, separator: "-", capitalize: false }),
	});

	args.sqlite.createFunction({
		name: "lix_timestamp",
		arity: 0,
		xFunc: () => getTimestampSync({ engine: engine }),
	});

	args.sqlite.createFunction({
		name: "lix_nano_id",
		arity: -1,
		// @ts-expect-error - not sure why this is not working
		xFunc: (_ctx: number, length: number) => {
			return nanoIdSync({ engine: engine, length });
		},
	});
}
