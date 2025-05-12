import { Kysely, ParseJSONResultsPlugin } from "kysely";
import { createDialect, type SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { v7 as uuid_v7, v4 as uuid_v4 } from "uuid";
import type { LixDatabaseSchema, LixInternalDatabaseSchema } from "./schema.js";
import { applySchema } from "./apply-schema.js";
import { humanId } from "human-id";
import { nanoid } from "./nano-id.js";
import { getAndCacheRow } from "./get-and-cache-row.js";
import { handleInsertOnView } from "./handle-insert-on-view.js";
import { handleUpdateOnView } from "./handle-update-on-view.js";
import { handleDeleteOnView } from "./handle-delete-on-view.js";

/**
 * Columns that should be serialized and parsed as JSON Binary.
 */
const TablesWithJSONBColumns: Record<string, string[]> = {
	file: ["metadata"],
	file_queue: ["metadata_before", "metadata_after"],
	snapshot: ["content"],
	thread: ["body"],
	key_value: ["value"],
	thread_comment: ["body"],
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
			new ParseJSONResultsPlugin(),
			// ParseJsonBPluginV1(TablesWithJSONBColumns),
			// SerializeJsonBPlugin(TablesWithJSONBColumns),
		],
	});
	initFunctions({
		sqlite: args.sqlite,
		db: db as unknown as Kysely<LixInternalDatabaseSchema>,
	});

	applySchema({ sqlite: args.sqlite, db: db });
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
		name: "handle_insert_on_view",
		arity: -1,
		xFunc: (_ctx: number, ...params: any[]) => {
			return handleInsertOnView(
				args.sqlite,
				args.db,
				params[0],
				...params.slice(1)
			);
		},
	});

	args.sqlite.createFunction({
		name: "handle_update_on_view",
		arity: -1,
		xFunc: (_ctx: number, ...params: any[]) => {
			return handleUpdateOnView(
				args.sqlite,
				args.db,
				params[0],
				...params.slice(1)
			);
		},
	});

	args.sqlite.createFunction({
		name: "handle_delete_on_view",
		arity: -1,
		xFunc: (_ctx: number, ...params: any[]) => {
			return handleDeleteOnView(
				args.sqlite,
				args.db,
				params[0],
				...params.slice(1)
			);
		},
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
		name: "get_and_cache_row",
		arity: -1,
		// potentially writes to the database for caching
		deterministic: false,
		xFunc: (_ctx: number, ...params: any[]) => {
			return getAndCacheRow(args.sqlite, args.db, ...params);
		},
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
