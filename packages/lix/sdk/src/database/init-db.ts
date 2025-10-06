import { Kysely } from "kysely";
import type { SqliteWasmDatabase } from "./sqlite/create-in-memory-database.js";
import type { LixDatabaseSchema } from "./schema.js";
import { createEngineDialect } from "./sqlite/engine-dialect.js";
import { createDefaultPlugins } from "./kysely/plugins.js";
// Schema imports
import { applyLogDatabaseSchema } from "../log/schema.js";
import { applyChangeDatabaseSchema } from "../change/schema.js";
import { applyChangeSetDatabaseSchema } from "../change-set/schema.js";
import { applyCommitDatabaseSchema } from "../commit/schema.js";
import { applyVersionDatabaseSchema } from "../version/schema.js";
import { applySnapshotDatabaseSchema } from "../snapshot/schema.js";
import { applyStoredSchemaDatabaseSchema } from "../stored-schema/schema.js";
import { applyStateDatabaseSchema } from "../state/schema.js";
import { applyChangeAuthorDatabaseSchema } from "../change-author/schema.js";
import { applyLabelDatabaseSchema } from "../label/schema.js";
import { applyConversationDatabaseSchema } from "../conversation/schema.js";
import { applyAccountDatabaseSchema } from "../account/schema.js";
import { applyStateHistoryDatabaseSchema } from "../state-history/schema.js";
import type { LixHooks } from "../hooks/create-hooks.js";
import type { LixEngine } from "../engine/boot.js";
import { nanoIdSync } from "../engine/functions/nano-id.js";
import { applyEntityDatabaseSchema } from "../entity/schema.js";
import { applyEntityConversationDatabaseSchema } from "../entity/conversation/schema.js";
import { applyFileLixcolCacheSchema } from "../filesystem/file/cache/lixcol-schema.js";
import { applyFileDataCacheSchema } from "../filesystem/file/cache/schema.js";
import { applyTransactionStateSchema } from "../state/transaction/schema.js";
import { uuidV7Sync } from "../engine/functions/uuid-v7.js";
import { humanIdSync } from "../engine/functions/generate-human-id.js";
import { getTimestampSync } from "../engine/functions/timestamp.js";

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
export function initDb(args: {
	executeSync: LixEngine["executeSync"];
	runtimeCacheRef: LixEngine["runtimeCacheRef"];
	sqlite: SqliteWasmDatabase;
	hooks: LixHooks;
}): Kysely<LixDatabaseSchema> {
	// Lower fsync frequency for better write throughput; NORMAL still syncs at txn boundaries.
	args.sqlite.exec({ sql: "PRAGMA synchronous = NORMAL;" });
	// Enlarge the page cache to keep more hot pages in memory (approximately 40 MiB at 4 KiB pages).
	args.sqlite.exec({ sql: "PRAGMA cache_size = 10000;" });

	const db = new Kysely<LixDatabaseSchema>({
		dialect: createEngineDialect({ database: args.sqlite }),
		plugins: [...createDefaultPlugins()],
	});

	const engine = {
		sqlite: args.sqlite,
		hooks: args.hooks,
		executeSync: args.executeSync,
		runtimeCacheRef: args.runtimeCacheRef,
	} as const satisfies Pick<
		LixEngine,
		"sqlite" | "hooks" | "executeSync" | "runtimeCacheRef"
	>;

	initFunctions({
		sqlite: args.sqlite,
		executeSync: args.executeSync,
		hooks: args.hooks,
		runtimeCacheRef: args.runtimeCacheRef,
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
	// applyKeyValueDatabaseSchema({ engine: engine });
	applyChangeAuthorDatabaseSchema({ engine: engine });
	applyLabelDatabaseSchema({ engine: engine });
	applyStateHistoryDatabaseSchema({ engine: engine });
	applyConversationDatabaseSchema({ engine });
	applyEntityConversationDatabaseSchema({ engine });
	// applyChangeProposalDatabaseSchema({ engine });
	// applyFileDatabaseSchema will be called later when lix is fully constructed
	applyLogDatabaseSchema({ engine: engine });

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
