import { createLixOwnLogSync } from "../log/create-lix-own-log.js";
import type { Lix } from "../lix/open-lix.js";
import { executeSync } from "./execute-sync.js";

/**
 * Queue for pending log entries to be processed
 */
interface LogEntry {
	lix: Lix;
	sql: string;
	duration: number;
	bindings: any[];
	result: any;
	error: any;
	options?: {
		logSlowQueriesOnly?: boolean;
		slowQueryThreshold?: number;
	};
}

const logQueue: LogEntry[] = [];
let currentTimeout: NodeJS.Timeout | null = null;

/**
 * Debugging info about the queue and timeout
 */
export const queueInfo = {
	get queueLength(): number {
		return logQueue.length;
	},
	get hasActiveTimeout(): boolean {
		return currentTimeout !== null;
	},
	get queue(): LogEntry[] {
		return [...logQueue];
	},
};

/**
 * Process all entries in the log queue
 */
function processLogQueue() {
	// Clear the timeout reference
	currentTimeout = null;

	const queueLength = logQueue.length;

	// Exit early if queue is empty
	if (queueLength === 0) return;

	// Get the first lix instance from the queue to use for transaction
	const firstEntry = logQueue[0];
	if (!firstEntry) return;

	const { lix } = firstEntry;

	// Begin transaction
	try {
		lix.skipLogging = true;
		// @ts-expect-error - check
		lix.sqlite.skipLogging = true;

		lix.sqlite.exec("BEGIN IMMEDIATE");

		lix.skipLogging = false;
		// @ts-expect-error - check
		lix.sqlite.skipLogging = false;
	} catch (error) {
		console.error("Failed to begin transaction for query logging:", error);
		// Clear the queue to prevent infinite retry
		logQueue.length = 0;
		return;
	}

	// Process all entries in the queue
	while (logQueue.length > 0) {
		const entry = logQueue.shift();
		if (!entry) continue;

		const { lix, sql, duration, bindings, result, error, options } = entry;

		try {
			// Skip if only logging slow queries
			if (
				options?.logSlowQueriesOnly &&
				duration < (options?.slowQueryThreshold ?? 100)
			) {
				continue;
			}

			lix.skipLogging = true;
			// @ts-expect-error - check
			lix.sqlite.skipLogging = true;

			// @ts-expect-error --- using flag
			const message = `${queueLength - logQueue.length}/${queueLength} skipLpgs: ${lix.skipLogging} reacitvity off: ${lix.sqlite.skipLogging} Query executed in ${duration}ms`;
			const payload = {
				sql: sql,
				bindings: bindings,
				duration_ms: duration,
				result_count: Array.isArray(result) ? result.length : 0,
				query_type: detectQueryType(sql),
				timestamp: new Date().toISOString(),
				error: error ? error.message : undefined,
			};
			console.log("Creating log:", message, payload);
			// Insert the log

			// // @ts-expect-error -- this is fine for now
			// if (window.logQueries) {
			executeSync({
				lix: lix,
				query: lix.db.insertInto("log").values({
					key: "lix_query_executed",
					message,
					level: "info",
					payload,
				}),
			});
			// }

			// createLixOwnLogSync({
			// 	lix,
			// 	key: "lix_query_executed",
			// 	level: "info",
			// 	// @ts-expect-error --- using flag
			// 	message: `${queueLength - logQueue.length}/${queueLength} skipLpgs: ${lix.skipLogging} reacitvity off: ${lix.sqlite.skipLogging} Query executed in ${duration}ms`,
			// 	payload: {
			// 		sql: sql,
			// 		bindings: bindings,
			// 		duration_ms: duration,
			// 		result_count: Array.isArray(result) ? result.length : 0,
			// 		query_type: detectQueryType(sql),
			// 		timestamp: new Date().toISOString(),
			// 		error: error ? error.message : undefined,
			// 	},
			// });

			lix.skipLogging = false;
			// @ts-expect-error - check
			lix.sqlite.skipLogging = false;
		} catch (logError) {
			console.error("Failed to log query:", logError);
			lix.skipLogging = false;
			// @ts-expect-error - check
			lix.sqlite.skipLogging = false;
		}
	}

	// Commit the transaction
	try {
		lix.skipLogging = true;
		// @ts-expect-error - check
		lix.sqlite.skipLogging = true;

		lix.sqlite.exec("COMMIT");

		lix.skipLogging = false;
		// @ts-expect-error - check
		lix.sqlite.skipLogging = false;
	} catch (error) {
		console.error("Failed to commit transaction for query logging:", error);

		// Try to rollback
		try {
			lix.skipLogging = true;
			// @ts-expect-error - check
			lix.sqlite.skipLogging = true;
			lix.sqlite.exec("ROLLBACK");
		} catch (rollbackError) {
			console.error("Failed to rollback transaction:", rollbackError);
		} finally {
			lix.skipLogging = false;
			// @ts-expect-error - check
			lix.sqlite.skipLogging = false;
		}
	}
}

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

		// there are three cases:
		// 1. this exec is part of a loging query
		// 2. this exec is a query to the logging table
		// 3. this exec is a query to a virtual table that is not related to logging - outsite of a logging request

		let resetSkipLogging = false;

		// skipLogging is a dynamic property used to prevent recursive logging
		if (!lix.skipLogging) {
			if (isLogTableQuery(sql)) {
				lix.skipLogging = true; // Set flag to skip logging for this query
				// @ts-expect-error - check
				lix.sqlite.skipLogging = true;
				resetSkipLogging = true;
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

			// Add to queue
			logQueue.push({
				lix,
				sql,
				duration,
				bindings,
				result,
				error,
				options,
			});

			// Schedule processing if no timeout is active
			if (!currentTimeout) {
				currentTimeout = setTimeout(processLogQueue, 0);
			}
		}

		if (resetSkipLogging) {
			// skipLogging is a dynamic property used to prevent recursive logging
			lix.skipLogging = false; // Reset flag after query execution
			// @ts-expect-error - check
			lix.sqlite.skipLogging = false;
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

function isLogTableQuery(sql: string): boolean {
	if (!sql) return false;

	const upperSql = sql.trim().toUpperCase();

	return upperSql.indexOf("LOG") > 0;

	// // Check if this query touches the log table or its related views
	// const logTablePatterns = [
	// 	// Direct log table access (with word boundaries to avoid false positives)
	// 	"\\bFROM\\s+LOG\\b",
	// 	"\\bINTO\\s+LOG\\b",
	// 	"\\bUPDATE\\s+LOG\\b",
	// 	"\\bDELETE\\s+FROM\\s+LOG\\b",
	// 	// Log views
	// 	"\\bFROM\\s+LOG_ALL\\b",
	// 	"\\bINTO\\s+LOG_ALL\\b",
	// 	"\\bUPDATE\\s+LOG_ALL\\b",
	// 	"\\bDELETE\\s+FROM\\s+LOG_ALL\\b",
	// 	"\\bFROM\\s+LOG_HISTORY\\b",
	// 	// Join queries with log tables
	// 	"\\bJOIN\\s+LOG\\b",
	// 	"\\bJOIN\\s+LOG_ALL\\b",
	// 	"\\bJOIN\\s+LOG_HISTORY\\b",
	// 	// CTEs or subqueries referencing log
	// 	"\\bLOG\\s+WHERE\\b",
	// 	"\\bLOG_ALL\\s+WHERE\\b",
	// 	// Key value queries for log levels (exact match)
	// 	"KEY\\s*=\\s*['\"]LIX_LOG_LEVELS['\"]",
	// 	// Queries that reference the log key in where clauses
	// 	"KEY\\s*=\\s*['\"]LIX_QUERY_EXECUTED['\"]",
	// 	// State queries that might be log-related
	// 	"WHERE\\s+KEY\\s*=\\s*['\"]LIX_LOG['\"]",
	// 	"AND\\s+KEY\\s*=\\s*['\"]LIX_LOG['\"]",
	// ];

	// return logTablePatterns.some((pattern) => {
	// 	const regex = new RegExp(pattern, "i");
	// 	return regex.test(upperSql);
	// });
}