import type { Kysely } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { insertTransactionState } from "./insert-transaction-state.js";
import { LixLogSchema } from "../log/schema.js";

// Track if logging is in progress per Lix instance to prevent recursion
const loggingInProgressMap = new WeakMap<SqliteWasmDatabase, boolean>();

/**
 * Insert a log entry directly using insertTransactionState to avoid recursion
 * when logging from within the virtual table methods.
 * 
 * This is a minimal wrapper that can be mocked in tests to control timestamps.
 */
export function insertVTableLog(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<LixInternalDatabaseSchema>;
	key: string;
	message: string;
	level: string;
	timestamp: string;
}): void {
	if (loggingInProgressMap.get(args.sqlite)) {
		return;
	}

	loggingInProgressMap.set(args.sqlite, true);
	try {
		// Use direct transactional state insertion to avoid virtual table recursion
		insertTransactionState({
			lix: {
				sqlite: args.sqlite,
				db: args.db as any,
				hooks: undefined as any,
			},
			timestamp: args.timestamp,
			data: [
				{
					entity_id: args.key,
					schema_key: LixLogSchema["x-lix-key"],
					file_id: "lix",
					plugin_key: "lix_own_entity",
					snapshot_content: JSON.stringify({
						key: args.key,
						message: args.message,
						level: args.level,
					}),
					schema_version: LixLogSchema["x-lix-version"],
					version_id: "global",
					untracked: true,
				},
			],
		});
	} finally {
		loggingInProgressMap.set(args.sqlite, false);
	}
}