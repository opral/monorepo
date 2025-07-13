import { clearCache } from "../../state/clear-cache.js";
import type { ScenarioTestDef } from "./scenario-test.js";

/**
 * Cache miss scenario - Clears cache to force re-materialization from changes.
 * This tests that state can be correctly reconstructed from the change log
 * without relying on cached state.
 */
export const cacheMissScenario: ScenarioTestDef = {
	name: "cache miss",
	description: "Clears cache to force re-materialization from changes",
	setup: async (lix) => {
		// Clear cache to test state materialization from changes
		await clearCache({ lix });
		return lix;
	},
};
