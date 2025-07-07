import { createLixOwnLogSync } from "../log/create-lix-own-log.js";
import type { Lix } from "../lix/open-lix.js";

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

	lix.sqlite.exec = function (args: any) {
		const startTime = Date.now();
		let result: any;
		let error: any;

		try {
			// Execute the query
			result = originalExec(args);
		} catch (e) {
			error = e;
		}

		// Log the query asynchronously to avoid blocking
		setTimeout(() => {
			try {
				const duration = Date.now() - startTime;

				// Skip if only logging slow queries
				if (
					options?.logSlowQueriesOnly &&
					duration < (options?.slowQueryThreshold ?? 100)
				) {
					return;
				}

				const sql = typeof args === "string" ? args : args.sql || "";
				const bindings = typeof args === "object" ? args.bind || [] : [];

				createLixOwnLogSync({
					lix,
					key: "lix_query_executed",
					level: "debug",
					message: `Query executed in ${duration}ms`,
					payload: {
						sql: sql,
						bindings: bindings,
						duration_ms: duration,
						result_count: Array.isArray(result) ? result.length : 0,
						query_type: detectQueryType(sql),
						timestamp: new Date().toISOString(),
						error: error ? error.message : undefined,
					},
				});
			} catch (logError) {
				console.error("Failed to log query:", logError);
			}
		}, 0);

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