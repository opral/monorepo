import { describe, expect, test } from "vitest";
import { scenarioTest, type ScenarioTestDef } from "./scenario-test.js";
import { openLix } from "../../lix/open-lix.js";

test("scenario test discovery", () => {});

describe("expectDeterministic validates values across scenarios", async () => {
	const customScenario: ScenarioTestDef = {
		name: "custom",
		description: "Custom scenario for testing expectDeterministic",
		setup: async (lix) => lix,
	};

	await scenarioTest(
		"consistent values pass",
		async ({ expectDeterministic }) => {
			// These should be consistent across all scenarios

			expect(() => {
				expectDeterministic("same-string").toBe("same-string");
				expectDeterministic(42).toBe(42);
				expectDeterministic({ foo: "bar" }).toEqual({ foo: "bar" });
				expectDeterministic([1, 2, 3]).toEqual([1, 2, 3]);
			}).not.toThrow();
		},
		{
			scenarios: ["baseline", "custom"],
			customScenarios: [customScenario],
		}
	);
});

// This test will fail intentionally to demonstrate expectDeterministic working
describe("expectDeterministic failure demonstration", async () => {
	const customScenario: ScenarioTestDef = {
		name: "custom",
		description: "Custom scenario for testing expectDeterministic failure",
		setup: async (lix) => lix,
	};

	await scenarioTest(
		"this should fail - expectDeterministic catches differences",
		async ({ scenario, expectDeterministic }) => {
			// This will store different values in different scenarios
			const scenarioSpecificValue =
				scenario === "baseline" ? "baseline-value" : "other-value";

			if (scenario === "baseline") {
				// This will fail in the second scenario
				expect(() =>
					expectDeterministic(scenarioSpecificValue).toBe("baseline-value")
				).not.toThrow();
			} else {
				expect(() =>
					expectDeterministic(scenarioSpecificValue).toBe("baseline-value")
				).toThrow(/SCENARIO DETERMINISM VIOLATION/);
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
		setup: async (lix) => lix,
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

describe("database operations are deterministic", async () => {
	const mockScenario: ScenarioTestDef = {
		name: "mock-scenario",
		description: "A mock scenario for testing deterministic data",
		setup: async (lix) => lix,
	};

	await scenarioTest(
		"",
		async ({ initialLix, expectDeterministic }) => {
			const lix = await openLix({ blob: initialLix });

			await lix.db
				.insertInto("key_value")
				.values({
					key: "test_key",
					value: "test_value",
				})
				.execute();

			const result = await lix.db
				.selectFrom("key_value")
				.where("key", "=", "test_key")
				.selectAll()
				.executeTakeFirst();

			expectDeterministic(result).toMatchObject({
				key: "test_key",
				value: "test_value",
			});
		},
		{
			scenarios: ["baseline", "mock-scenario"],
			customScenarios: [mockScenario],
		}
	);
});