import { DEFAULT_LOG_LEVELS } from "../log/create-lix-own-log.js";
import type { Lix } from "../lix/open-lix.js";
import { executeSync } from "./execute-sync.js";
import type { LixDatabaseSchema, LixInternalDatabaseSchema } from "./schema.js";
import type { Kysely } from "kysely";

import { nanoid } from "./nano-id.js";
import { LixLogSchema } from "../log/schema.js";

const logLevels = new WeakMap<Kysely<LixDatabaseSchema>, string[]>();

/**
 * Enables basic query logging by intercepting SQLite exec calls.
 * This is a simplified implementation that logs query execution times.
 */
export function enableQueryLogging(
	lix: Lix,
	options?: {
		enabled?: boolean;
		logSlowQueriesOnly?: boolean;
		slowQueryThreshold?: number;
	}
): void {
	if (options?.enabled === false) {
		return;
	}

	// Intercept sqlite exec calls
	const originalExec = lix.sqlite.exec.bind(lix.sqlite);

	// Override exec with proper overload handling
	lix.sqlite.exec = function (...args: any[]): any {
		const startTime = Date.now();
		let result: any;
		let error: any;

		// Extract SQL from arguments based on overload pattern
		let sql: string = "";

		// Handle different exec signatures:
		// 1. exec(sql, options?)
		// 2. exec(options) where options.sql exists
		if (args.length === 0) {
			// No arguments, let original handle the error
			// @ts-expect-error -- check types
			return originalExec.apply(lix.sqlite, args);
		} else if (typeof args[0] === "string") {
			// First overload: exec(sql, options?)
			sql = args[0];
		} else if (typeof args[0] === "object" && args[0] && "sql" in args[0]) {
			// Second overload: exec(options) where options includes sql
			sql = String(args[0].sql || "");
		} else if (Array.isArray(args[0])) {
			// Handle string array case
			sql = args[0].join("");
		} else {
			// Other types (Uint8Array, etc.) - convert to string
			try {
				sql = String(args[0] || "");
			} catch {
				sql = "";
			}
		}

		try {
			// Execute the query with original arguments
			// @ts-expect-error -- check types
			result = originalExec.apply(lix.sqlite, args);
		} catch (e) {
			error = e;
		}

		// Only log if not in a log query context
		if (!lix.skipLogging && sql) {
			// Calculate duration immediately
			const duration = Date.now() - startTime;

			// Extract bindings from arguments
			let bindings: any[] = [];
			if (
				args.length > 1 &&
				typeof args[1] === "object" &&
				args[1] &&
				"bind" in args[1]
			) {
				bindings = Array.isArray(args[1].bind) ? args[1].bind : [args[1].bind];
			} else if (
				args.length === 1 &&
				typeof args[0] === "object" &&
				args[0] &&
				"bind" in args[0]
			) {
				bindings = Array.isArray(args[0].bind) ? args[0].bind : [args[0].bind];
			}

			lix.skipLogging = true;

			const message = `Query executed in ${duration}ms`;
			const payload = {
				sql: sql,
				bindings: bindings,
				duration_ms: duration,
				result_count: Array.isArray(result) ? result.length : 0,
				query_type: detectQueryType(sql),
				timestamp: new Date().toISOString(),
				error: error ? error.message : undefined,
			};

			if (logLevels.get(lix.db) === undefined) {
				const fetchedLogLevels =
					executeSync({
						lix: lix,
						query: lix.db
							.selectFrom("key_value")
							.select("value")
							.where("key", "=", "lix_log_levels"),
					})[0]?.values ?? DEFAULT_LOG_LEVELS;

				logLevels.set(lix.db, fetchedLogLevels);
			}

			// // Check if the level is allowed
			const shouldLog =
				logLevels.get(lix.db)!.includes("*") ||
				logLevels.get(lix.db)!.includes("info");

			if (shouldLog) {
				executeSync({
					lix: { sqlite: lix.sqlite },
					query: (lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
						.insertInto("internal_state_all_untracked")
						.values({
							entity_id: nanoid(),
							version_id: "global",
							file_id: "lix",
							schema_key: LixLogSchema["x-lix-key"],
							plugin_key: "lix_own_entity",
							schema_version: LixLogSchema["x-lix-version"],
							snapshot_content: JSON.stringify({
								key: "lix_query_executed",
								message,
								level: "info",
								payload,
							}),
						}),
					// no conflict handling here, as we don't mutate logs
					// .onConflict((oc) =>
					//     oc.doUpdateSet({
					//         snapshot_content: newValue,
					//     })
					// ),
				});
			}

			lix.skipLogging = false;
		}
		// Re-throw error if query failed
		if (error) {
			throw error;
		}

		return result;
	};
}

function detectQueryType(sql: string): string {
	const upperSql = sql.trim().toUpperCase();

	if (upperSql.startsWith("SELECT")) return "SELECT";
	if (upperSql.startsWith("INSERT")) return "INSERT";
	if (upperSql.startsWith("UPDATE")) return "UPDATE";
	if (upperSql.startsWith("DELETE")) return "DELETE";
	if (upperSql.startsWith("CREATE")) return "CREATE";
	if (upperSql.startsWith("DROP")) return "DROP";
	if (upperSql.startsWith("ALTER")) return "ALTER";
	if (upperSql.startsWith("BEGIN")) return "TRANSACTION";
	if (upperSql.startsWith("COMMIT")) return "TRANSACTION";
	if (upperSql.startsWith("ROLLBACK")) return "TRANSACTION";
	if (upperSql.startsWith("PRAGMA")) return "PRAGMA";

	return "OTHER";
}
