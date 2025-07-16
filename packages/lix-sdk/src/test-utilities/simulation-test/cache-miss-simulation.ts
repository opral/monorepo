import { clearStateCache } from "../../state/cache/clear-state-cache.js";
import type { SimulationTestDef } from "./simulation-test.js";

/**
 * Cache miss simulation - Clears cache after every commit to force re-materialization from changes.
 * This tests that state can be correctly reconstructed from the change log
 * without relying on cached state.
 */
export const cacheMissSimulation: SimulationTestDef = {
	name: "cache miss",
	setup: async (lix) => {
		// Clear initial cache
		await clearStateCache({ lix });

		// Use the afterStateCommit hook to clear cache after each commit
		lix.hooks.onStateCommit(() => {
			console.log("Clearing cache after state commit");
			// Clear cache synchronously
			lix.sqlite.exec({
				sql: "DELETE FROM internal_state_cache",
				returnValue: "resultRows",
			});

			const cacheCount = lix.sqlite.exec({
				sql: "SELECT COUNT(*) as count FROM internal_state_cache",
				returnValue: "resultRows",
			})[0];

			console.log(`Cache cleared, new count: ${cacheCount}`);
		});

		// Note: We don't unsubscribe because the lix instance is isolated to this test
		// and we want the hook to remain active for the duration of the test

		// Return the modified lix object
		return lix;
	},
};
