import { vi } from "vitest";
import * as cacheModule from "../../state/cache-v2/mark-state-cache-as-stale.js";
import * as clearCacheModule from "../../state/cache-v2/clear-state-cache.js";
import { clearFileDataCache } from "../../filesystem/file/cache/clear-file-data-cache.js";
import * as populateCacheModule from "../../state/cache-v2/populate-state-cache.js";
import * as insertVTableLogModule from "../../state/vtable/insert-vtable-log.js";
import type { SimulationTestDef } from "./simulation-test.js";

const CACHE_TIMESTAMP = "2099-12-31T23:59:59.999Z";

// Store original functions
const originalMarkStale = cacheModule.markStateCacheAsStaleV2;
const originalMarkFresh = cacheModule.markStateCacheAsFreshV2;
const originalPopulateCache = populateCacheModule.populateStateCacheV2;
const originalClearCache = clearCacheModule.clearStateCacheV2;
const originalInsertVTableLog = insertVTableLogModule.insertVTableLog;

// Create wrapped versions that inject the fixed timestamp
const wrappedMarkStale = (args: any) => {
	return originalMarkStale({ ...args, timestamp: CACHE_TIMESTAMP });
};

const wrappedMarkFresh = (args: any) => {
	return originalMarkFresh({ ...args, timestamp: CACHE_TIMESTAMP });
};

const wrappedPopulateCache = (args: any) => {
	return originalPopulateCache(args);
};

const wrappedClearCache = (args: any) => {
	return originalClearCache({ ...args, timestamp: CACHE_TIMESTAMP });
};

const wrappedInsertVTableLog = (args: any) => {
	// Skip cache miss logs entirely to avoid consuming sequence numbers
	if (args.key === "lix_state_cache_miss") {
		// Don't insert the log at all
		return;
	}
	// Pass through all other logs unchanged
	return originalInsertVTableLog(args);
};

/**
 * Cache miss simulation - Clears cache before every select operation to force re-materialization from changes.
 * This tests that state can be correctly reconstructed from the change log
 * without relying on cached state.
 */
export const cacheMissSimulation: SimulationTestDef = {
	name: "cache miss",
	setup: async (lix) => {
		// Set up mocks for cache operations and logs
		/**
		 * Reuses an existing mock if present or installs a new spy with the provided implementation.
		 *
		 * @example
		 * useMock(cacheModule, "markStateCacheAsStaleV2", wrappedMarkStale);
		 */
		const useMock = <T extends object, K extends keyof T & string>(
			module: T,
			property: K,
			implementation: T[K]
		) => {
			const currentImplementation = module[property];
			if (
				typeof currentImplementation === "function" &&
				"mock" in currentImplementation &&
				"mockImplementation" in currentImplementation
			) {
				(currentImplementation as any).mockImplementation(implementation);
				return currentImplementation;
			}
			return vi
				.spyOn(module, property as any)
				.mockImplementation(implementation as any);
		};

		useMock(cacheModule, "markStateCacheAsStaleV2", wrappedMarkStale);
		useMock(cacheModule, "markStateCacheAsFreshV2", wrappedMarkFresh);
		useMock(populateCacheModule, "populateStateCacheV2", wrappedPopulateCache);
		useMock(clearCacheModule, "clearStateCacheV2", wrappedClearCache);
		useMock(insertVTableLogModule, "insertVTableLog", wrappedInsertVTableLog);

		// Strategy: do not mutate cache inside transactions or during SELECTs.
		// After any state commit, mark that a repopulation is needed. Before the
		// next non-internal SELECT, repopulate the cache from the materializer
		// (which deletes and rebuilds in one pass) and refresh file caches.

		let needsCacheClearance = false;

		// 1) Set pending repopulation on state commit (no writes here!)
		const unsubscribe = lix.hooks.onStateCommit(() => {
			needsCacheClearance = true;
		});

		// 2) Repopulate lazily before the next SELECT (including lix_internal_* for tests)
		const originalSelectFrom = lix.db.selectFrom.bind(lix.db);
		// @ts-expect-error
		lix.db.selectFrom = (table: any) => {
			if (needsCacheClearance) {
				// Clear tracked cache and mark stale with deterministic timestamp
				clearCacheModule.clearStateCacheV2({
					engine: lix.engine!,
					timestamp: CACHE_TIMESTAMP,
				});
				clearFileDataCache({ engine: lix.engine! });
				// Immediately repopulate from the materializer to avoid writes during SELECT
				populateCacheModule.populateStateCacheV2({
					engine: lix.engine!,
				});
				// Mark as fresh so vtable won't try to repopulate
				cacheModule.markStateCacheAsFreshV2({
					engine: lix.engine!,
					timestamp: CACHE_TIMESTAMP,
				});
				needsCacheClearance = false;
			}
			return originalSelectFrom(table);
		};

		// Return the modified lix object
		return {
			...lix,
			close: async () => {
				unsubscribe();
				await lix.close();
			},
		} as typeof lix;
	},
};
