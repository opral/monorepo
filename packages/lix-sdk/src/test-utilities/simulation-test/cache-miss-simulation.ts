import { clearCache } from "../../state/clear-cache.js";
import type { DstSimulation } from "./simulation-test.js";

/**
 * Cache miss simulation - Clears cache before every select query to force re-materialization from changes.
 * This tests that state can be correctly reconstructed from the change log
 * without relying on cached state.
 */
export const cacheMissSimulation: DstSimulation = {
	name: "cache miss",
	setup: async (lix) => {
		// Clear initial cache
		await clearCache({ lix });

		// Track if we're in a materialization query to avoid infinite loops
		let isInternalQuery = false;

		// Store the original selectFrom method
		const originalSelectFrom = lix.db.selectFrom.bind(lix.db);

		// Override the selectFrom method
		(lix.db as any).selectFrom = function (table: any) {
			// Only clear cache for user queries, not internal materialization queries
			// We detect internal queries by checking if we're already in a query
			if (!isInternalQuery) {
				isInternalQuery = true;

				// Clear cache synchronously before executing the select
				lix.sqlite.exec({
					sql: "DELETE FROM internal_state_cache",
					returnValue: "resultRows",
				});

				// Call the original selectFrom and reset the flag when done
				const result = originalSelectFrom(table);

				// Wrap the execute methods to reset the flag
				const originalExecute = result.execute;
				const originalExecuteTakeFirst = result.executeTakeFirst;
				const originalExecuteTakeFirstOrThrow = result.executeTakeFirstOrThrow;

				result.execute = async function (...args: any[]) {
					try {
						return await originalExecute.apply(this, args as any);
					} finally {
						isInternalQuery = false;
					}
				};

				result.executeTakeFirst = async function (...args: any[]) {
					try {
						return await originalExecuteTakeFirst.apply(this, args as any);
					} finally {
						isInternalQuery = false;
					}
				};

				result.executeTakeFirstOrThrow = async function (...args: any[]) {
					try {
						return await originalExecuteTakeFirstOrThrow.apply(
							this,
							args as any
						);
					} finally {
						isInternalQuery = false;
					}
				};

				return result;
			} else {
				// Internal query, don't clear cache
				return originalSelectFrom(table);
			}
		};

		// Return the modified lix object
		return lix;
	},
};
