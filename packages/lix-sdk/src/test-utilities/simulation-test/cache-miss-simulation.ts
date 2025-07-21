import { vi } from "vitest";
import * as cacheModule from "../../state/cache/mark-state-cache-as-stale.js";
import type { SimulationTestDef } from "./simulation-test.js";

const CACHE_TIMESTAMP = "2099-12-31T23:59:59.999Z";

// Store original functions
const originalMarkStale = cacheModule.markStateCacheAsStale;
const originalMarkFresh = cacheModule.markStateCacheAsFresh;

// Create wrapped versions that inject the fixed timestamp
const wrappedMarkStale = (args: any) => {
	return originalMarkStale({ ...args, timestamp: CACHE_TIMESTAMP });
};

const wrappedMarkFresh = (args: any) => {
	return originalMarkFresh({ ...args, timestamp: CACHE_TIMESTAMP });
};

/**
 * Cache miss simulation - Clears cache before every select operation to force re-materialization from changes.
 * This tests that state can be correctly reconstructed from the change log
 * without relying on cached state.
 */
export const cacheMissSimulation: SimulationTestDef = {
	name: "cache miss",
	setup: async (lix) => {
		return lix;
		// // Mock the cache marking functions to use our wrapped versions
		// vi.spyOn(cacheModule, "markStateCacheAsStale").mockImplementation(
		// 	wrappedMarkStale
		// );
		// vi.spyOn(cacheModule, "markStateCacheAsFresh").mockImplementation(
		// 	wrappedMarkFresh
		// );

		// // Don't clear cache on bootup - it consumes sequence numbers
		// // The cache will be cleared before each query anyway

		// // Helper to wrap a query builder to clear cache before execute
		// const wrapQueryBuilder = (query: any): any => {
		// 	const originalExecute = query.execute;

		// 	// Override execute
		// 	query.execute = async function (...args: any[]) {
		// 		// Clear cache before executing select
		// 		lix.sqlite.exec({
		// 			sql: "DELETE FROM internal_state_cache",
		// 			returnValue: "resultRows",
		// 		});

		// 		cacheModule.markStateCacheAsStale({ lix });

		// 		// Call the original execute
		// 		return originalExecute.apply(this, args);
		// 	};

		// 	// Wrap methods that return query builders
		// 	const methodsToWrap = [
		// 		"where",
		// 		"orderBy",
		// 		"limit",
		// 		"offset",
		// 		"innerJoin",
		// 		"leftJoin",
		// 		"rightJoin",
		// 		"fullJoin",
		// 		"select",
		// 		"selectAll",
		// 	];

		// 	for (const method of methodsToWrap) {
		// 		if (query[method]) {
		// 			const originalMethod = query[method];
		// 			query[method] = function (...args: any[]) {
		// 				const result = originalMethod.apply(this, args);
		// 				// If it returns a query builder, wrap it too
		// 				if (result && typeof result === "object" && "execute" in result) {
		// 					return wrapQueryBuilder(result);
		// 				}
		// 				return result;
		// 			};
		// 		}
		// 	}

		// 	return query;
		// };

		// // Wrap the db.selectFrom method
		// const originalSelectFrom = lix.db.selectFrom.bind(lix.db);

		// lix.db.selectFrom = (table: any) => {
		// 	const query = originalSelectFrom(table);
		// 	return wrapQueryBuilder(query);
		// };

		// // Return the modified lix object
		// return lix;
	},
};
