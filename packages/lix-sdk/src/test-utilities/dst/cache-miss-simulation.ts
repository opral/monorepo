import { clearCache } from "../../state/clear-cache.js";
import type { DstSimulation } from "./ds-test.js";

/**
 * Cache miss simulation - Clears cache to force re-materialization from changes.
 * This tests that state can be correctly reconstructed from the change log
 * without relying on cached state.
 */
export const cacheMissSimulation: DstSimulation = {
	name: "cache miss",
	description: "Clears cache to force re-materialization from changes",
	setup: async (lix) => {
		// Clear cache to test state materialization from changes
		await clearCache({ lix });
		return lix;
	},
};
