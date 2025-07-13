import { describe, expect, test } from "vitest";
import { scenarioTest, type ScenarioTestDef } from "./scenario-test.js";
import { openLix } from "../../lix/open-lix.js";

test("scenario test discovery", () => {});

describe("expectConsistent validates values across scenarios", async () => {
	const customScenario: ScenarioTestDef = {
		name: "custom",
		description: "Custom scenario for testing expectConsistent",
		setup: async (lix) => lix,
	};

	await scenarioTest(
		"consistent values pass",
		async ({ expectConsistent }) => {
			// These should be consistent across all scenarios

			expect(() => {
				expectConsistent("same-string").toBe("same-string");
				expectConsistent(42).toBe(42);
				expectConsistent({ foo: "bar" }).toEqual({ foo: "bar" });
				expectConsistent([1, 2, 3]).toEqual([1, 2, 3]);
			}).not.toThrow();
		},
		{
			scenarios: ["baseline", "custom"],
			customScenarios: [customScenario],
		}
	);
});

// This test will fail intentionally to demonstrate expectConsistent working
describe("expectConsistent failure demonstration", async () => {
	const customScenario: ScenarioTestDef = {
		name: "custom",
		description: "Custom scenario for testing expectConsistent failure",
		setup: async (lix) => lix,
	};

	await scenarioTest(
		"this should fail - expectConsistent catches differences",
		async ({ scenario, expectConsistent }) => {
			// This will store different values in different scenarios
			const scenarioSpecificValue =
				scenario === "baseline" ? "baseline-value" : "other-value";

			if (scenario === "baseline") {
				// This will fail in the second scenario
				expect(() =>
					expectConsistent(scenarioSpecificValue).toBe("baseline-value")
				).not.toThrow();
			} else {
				expect(() =>
					expectConsistent(scenarioSpecificValue).toBe("baseline-value")
				).toThrow(/SCENARIO CONSISTENCY VIOLATION/);
			}
		},
		{
			scenarios: ["baseline", "custom"],
			customScenarios: [customScenario],
		}
	);
});

describe("every scenario opens the same lix", async () => {
	// Testing this with materialized state and the changes the lix has
	// Both need to be exactly the same for all scenarios

	let previousState: any | null = null;
	let previousChanges: any | null = null;

	const mockScenario: ScenarioTestDef = {
		name: "mock-scenario",
		description: "A mock scenario for testing deterministic data",
		setup: async (lix) => {
			return lix;
		},
	};

	await scenarioTest(
		"",
		async ({ initialLix }) => {
			const lix = await openLix({ blob: initialLix });

			const allState = await lix.db
				.selectFrom("state_all")
				.selectAll()
				.execute();

			const changes = await lix.db.selectFrom("change").selectAll().execute();

			if (previousState === null) {
				previousState = allState;
				previousChanges = changes;
			} else {
				expect(previousState).toEqual(allState);
				expect(previousChanges).toEqual(changes);
			}

			expect(allState).toBeDefined();
		},
		{
			scenarios: ["baseline", "mock-scenario"],
			customScenarios: [mockScenario],
		}
	);
});
