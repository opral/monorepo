import { describe, expect } from "vitest";
import { scenarioTest, type ScenarioTestDef } from "./scenario-test.js";

describe("deterministic data and IDs across scenarios", () => {
	let deterministicLixId: string | null = null;

	const mockScenario: ScenarioTestDef = {
		name: "mock-scenario",
		description: "A mock scenario for testing deterministic data",
		setup: async (lix) => {
			return lix;
		},
	};

	scenarioTest(
		"hello",
		async ({ openLix, scenario }) => {
			const lix = await openLix();

			console.log(`Running scenario: ${scenario}`);

			const id = await lix.db
				.selectFrom("key_value")
				.where("key", "=", "lix_id")
				.select("value")
				.executeTakeFirstOrThrow();

			if (deterministicLixId === null) {
				deterministicLixId = id.value;
			} else {
				expect(deterministicLixId).toEqual(id.value);
			}

			expect(id).toBeDefined();
		},
		{
			scenarios: ["baseline", "mock-scenario"],
			customScenarios: [mockScenario],
		}
	);
});
