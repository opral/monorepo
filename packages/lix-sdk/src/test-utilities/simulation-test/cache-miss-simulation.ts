import { clearStateCache } from "../../state/cache/clear-state-cache.js";
import { markStateCacheAsStale } from "../../state/cache/mark-state-cache-as-stale.js";
import type { SimulationTestDef } from "./simulation-test.js";

/**
 * Cache miss simulation - Clears cache before every select operation to force re-materialization from changes.
 * This tests that state can be correctly reconstructed from the change log
 * without relying on cached state.
 */
export const cacheMissSimulation: SimulationTestDef = {
	name: "cache miss",
	setup: async (lix) => {
		// Clear cache on bootup
		clearStateCache({ lix });

		// Helper to wrap a query builder to clear cache before execute
		const wrapQueryBuilder = (query: any): any => {
			const originalExecute = query.execute;

			// Override execute
			query.execute = async function (...args: any[]) {
				// Clear cache before executing select
				lix.sqlite.exec({
					sql: "DELETE FROM internal_state_cache",
					returnValue: "resultRows",
				});

				markStateCacheAsStale({ lix });

				// Call the original execute
				return originalExecute.apply(this, args);
			};

			// Wrap methods that return query builders
			const methodsToWrap = [
				"where",
				"orderBy",
				"limit",
				"offset",
				"innerJoin",
				"leftJoin",
				"rightJoin",
				"fullJoin",
				"select",
				"selectAll",
			];

			for (const method of methodsToWrap) {
				if (query[method]) {
					const originalMethod = query[method];
					query[method] = function (...args: any[]) {
						const result = originalMethod.apply(this, args);
						// If it returns a query builder, wrap it too
						if (result && typeof result === "object" && "execute" in result) {
							return wrapQueryBuilder(result);
						}
						return result;
					};
				}
			}

			return query;
		};

		// Wrap the db.selectFrom method
		const originalSelectFrom = lix.db.selectFrom.bind(lix.db);

		lix.db.selectFrom = (table: any) => {
			const query = originalSelectFrom(table);
			return wrapQueryBuilder(query);
		};

		// Return the modified lix object
		return lix;
	},
};
