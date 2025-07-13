import { describe, expect, test } from "vitest";
import { scenarioTest, type ScenarioTestDef } from "./scenario-test.js";
import { openLix } from "../../lix/open-lix.js";

test("scenario test discovery", () => {});

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
