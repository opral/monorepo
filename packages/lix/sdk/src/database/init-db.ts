import { Kysely } from "kysely";
import type { SqliteWasmDatabase } from "./sqlite/create-in-memory-database.js";
import type { LixDatabaseSchema } from "./schema.js";
import { createEngineDialect } from "./sqlite/engine-dialect.js";
import { createDefaultPlugins } from "./kysely/plugins.js";
// Schema imports
import { applyChangeDatabaseSchema } from "../change/schema.js";
import { applyVersionDatabaseSchema } from "../version/schema.js";
import { applySnapshotDatabaseSchema } from "../snapshot/schema.js";
import { applyStateDatabaseSchema } from "../state/schema.js";
// import { applyAccountDatabaseSchema } from "../account/schema.js";
import { applyStateHistoryDatabaseSchema } from "../state-history/schema.js";
import type { LixHooks } from "../hooks/create-hooks.js";
import type { LixEngine } from "../engine/boot.js";
import { nanoIdSync } from "../engine/functions/nano-id.js";
import { applyFileLixcolCacheSchema } from "../filesystem/file/cache/lixcol-schema.js";
import { applyFileDataCacheSchema } from "../filesystem/file/cache/schema.js";
import { applyTransactionStateSchema } from "../state/transaction/schema.js";
import { uuidV7Sync } from "../engine/functions/uuid-v7.js";
import { humanIdSync } from "../engine/functions/generate-human-id.js";
import { getTimestampSync } from "../engine/functions/timestamp.js";
// import { applyKeyValueDatabaseSchema } from "../key-value/schema.js";

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
export function prepareEngineDatabase(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "executeSync" | "runtimeCacheRef" | "preprocessQuery"
	>;
}): void {
	// Lower fsync frequency for better write throughput; NORMAL still syncs at txn boundaries.
	args.engine.sqlite.exec({ sql: "PRAGMA synchronous = NORMAL;" });
	// Enlarge the page cache to keep more hot pages in memory (approximately 40 MiB at 4 KiB pages).
	args.engine.sqlite.exec({ sql: "PRAGMA cache_size = 10000;" });

	initFunctions(args.engine);

	// Apply all database schemas first (tables, views, triggers)
	applyTransactionStateSchema({ engine: args.engine });
	applySnapshotDatabaseSchema(args.engine.sqlite);
	applyChangeDatabaseSchema(args.engine.sqlite);
	applyFileLixcolCacheSchema({ engine: args.engine });
	// Ensure file data cache table exists before any triggers may reference it
	applyFileDataCacheSchema({ engine: args.engine });
	applyStateDatabaseSchema({ engine: args.engine });
	// applyEntityDatabaseSchema({ engine: args.engine });
	// applyChangeSetDatabaseSchema({ engine: args.engine });
	// applyCommitDatabaseSchema({ engine: args.engine });
	// applyStoredSchemaDatabaseSchema({ engine: args.engine });
	applyVersionDatabaseSchema({ engine: args.engine });
	// applyAccountDatabaseSchema({ engine: args.engine });
	// applyKeyValueDatabaseSchema({ engine: args.engine });
	// applyChangeAuthorDatabaseSchema({ engine: args.engine });
	// applyLabelDatabaseSchema({ engine: args.engine });
	applyStateHistoryDatabaseSchema({ engine: args.engine });
	// applyConversationDatabaseSchema({ engine: args.engine });
	// applyEntityConversationDatabaseSchema({ engine: args.engine });
	// applyChangeProposalDatabaseSchema({ engine: args.engine });
	// applyFileDatabaseSchema will be called later when lix is fully constructed
	// applyLogDatabaseSchema({ engine: args.engine });
}

export function initKysely(args: {
	sqlite: SqliteWasmDatabase;
}): Kysely<LixDatabaseSchema> {
	const db = new Kysely<LixDatabaseSchema>({
		dialect: createEngineDialect({ database: args.sqlite }),
		plugins: [...createDefaultPlugins()],
	});

	return db;
}

function initFunctions(args: {
	sqlite: SqliteWasmDatabase;
	executeSync: LixEngine["executeSync"];
	runtimeCacheRef: LixEngine["runtimeCacheRef"];
	hooks: LixHooks;
}) {
	const engine = {
		sqlite: args.sqlite,
		hooks: args.hooks,
		executeSync: args.executeSync,
		runtimeCacheRef: args.runtimeCacheRef,
	} as const satisfies Pick<
		LixEngine,
		"sqlite" | "hooks" | "executeSync" | "runtimeCacheRef"
	>;

	// TODO function registration is in the engine's boot itself.
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
		xFunc: (_ctx: number, length?: number) => {
			return nanoIdSync({ engine, length });
		},
	});

	args.sqlite.createFunction({
		name: "lix_trigger_raise",
		arity: -1,
		xFunc: (_ctx: number, kind?: unknown, message?: unknown) => {
			const action = typeof kind === "string" ? kind.toUpperCase() : "FAIL";
			if (action === "IGNORE") {
				return null;
			}
			const text =
				typeof message === "string" && message.length > 0
					? message
					: `Trigger ${action}`;
			throw new Error(text);
		},
	});
}
