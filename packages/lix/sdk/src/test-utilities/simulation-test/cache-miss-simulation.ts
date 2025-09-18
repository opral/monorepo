import { vi } from "vitest";
import * as cacheModule from "../../state/cache/mark-state-cache-as-stale.js";
import { clearStateCache } from "../../state/cache/clear-state-cache.js";
import { clearFileDataCache } from "../../filesystem/file/cache/clear-file-data-cache.js";
import { populateStateCache } from "../../state/cache/populate-state-cache.js";
import { markStateCacheAsFresh } from "../../state/cache/mark-state-cache-as-stale.js";
import * as insertVTableLogModule from "../../state/vtable/insert-vtable-log.js";
import type { SimulationTestDef } from "./simulation-test.js";

const CACHE_TIMESTAMP = "2099-12-31T23:59:59.999Z";

// Store original functions
const originalMarkStale = cacheModule.markStateCacheAsStale;
const originalMarkFresh = cacheModule.markStateCacheAsFresh;
const originalInsertVTableLog = insertVTableLogModule.insertVTableLog;

// Create wrapped versions that inject the fixed timestamp
const wrappedMarkStale = (args: any) => {
	return originalMarkStale({ ...args, timestamp: CACHE_TIMESTAMP });
};

const wrappedMarkFresh = (args: any) => {
	return originalMarkFresh({ ...args, timestamp: CACHE_TIMESTAMP });
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
		vi.spyOn(cacheModule, "markStateCacheAsStale").mockImplementation(
			wrappedMarkStale
		);
		vi.spyOn(cacheModule, "markStateCacheAsFresh").mockImplementation(
			wrappedMarkFresh
		);
		vi.spyOn(insertVTableLogModule, "insertVTableLog").mockImplementation(
			wrappedInsertVTableLog
		);

		// Strategy: do not mutate cache inside transactions or during SELECTs.
		// After any state commit, mark that a repopulation is needed. Before the
		// next non-internal SELECT, repopulate the cache from the materializer
		// (which deletes and rebuilds in one pass) and refresh file caches.

		let needsCacheClearance = false;

		// 1) Set pending repopulation on state commit (no writes here!)
		const unsubscribe = lix.hooks.onStateCommit(() => {
			needsCacheClearance = true;
		});

		// 2) Repopulate lazily before the next SELECT (including internal_* for tests)
		const originalSelectFrom = lix.db.selectFrom.bind(lix.db);
		// @ts-expect-error
		lix.db.selectFrom = (table: any) => {
			if (needsCacheClearance) {
				// Clear tracked cache and mark stale with deterministic timestamp
				clearStateCache({ engine: lix.engine!, timestamp: CACHE_TIMESTAMP });
				clearFileDataCache({ engine: lix.engine! });
				// Immediately repopulate from the materializer to avoid writes during SELECT
				populateStateCache({ engine: lix.engine! });
				// Mark as fresh so vtable won't try to repopulate
				markStateCacheAsFresh({
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
