import { test, expect } from "vitest";
import { type Lix } from "../../lix/open-lix.js";
import { newLixFile } from "../../lix/new-lix.js";
import { cacheMissScenario } from "./cache-miss-scenario.js";

// Scenario test types
export type ScenarioTestSetup = (lix: Lix, baseline?: Lix) => Promise<Lix>;
export type ScenarioTestHook = (lix: Lix, context: any) => Promise<void>;

export type ScenarioTestDef = {
	name: string;
	description?: string;
	setup: ScenarioTestSetup;
	hooks?: {
		beforeQuery?: ScenarioTestHook;
		afterWrite?: ScenarioTestHook;
		onError?: (error: Error) => Error;
	};
};

/**
 * Baseline scenario - Standard test execution that generates changes for other scenarios.
 * This scenario must always run first as it creates the initial data that other scenarios use.
 */
const baselineScenario: ScenarioTestDef = {
	name: "baseline",
	description:
		"Standard test execution that generates changes for other scenarios",
	setup: async (lix) => lix,
};

// Options for scenario tests
interface ScenarioTestOptions {
	scenarios?: string[];
	customScenarios?: ScenarioTestDef[];
}

// Default scenarios available
const defaultScenarios: Record<string, ScenarioTestDef> = {
	baseline: baselineScenario,
	"cache-miss": cacheMissScenario,
};

/**
 * Test utility that runs the same test in different scenarios.
 *
 * @param name - Test name
 * @param fn - Test function that receives scenario context
 * @param options - Optional configuration:
 *   - scenarios: Array of scenario names to run (defaults to all)
 *   - customScenarios: Custom scenario definitions to add
 *
 * @example
 * // Run default scenarios (baseline, cache-miss)
 * scenarioTest("my test", async ({ initialLix, scenario, expectDeterministic }) => {
 *   const lix = await openLix({ blob: initialLix });
 *   // test code
 * });
 *
 * @example
 * // Run only specific scenarios
 * scenarioTest("my test", async ({ initialLix, scenario, expectDeterministic }) => {
 *   const lix = await openLix({ blob: initialLix });
 *   // test code
 * }, { scenarios: ["cache-miss"] });
 *
 * @example
 * // Add custom scenarios
 * scenarioTest("my test", async ({ initialLix, scenario, expectDeterministic }) => {
 *   const lix = await openLix({ blob: initialLix });
 *   // test code
 * }, {
 *   scenarios: ["baseline", "my-scenario"],
 *   customScenarios: [myScenario]
 * });
 */
export async function scenarioTest(
	name: string,
	fn: (args: {
		scenario: string;
		initialLix: Blob;
		expectDeterministic: typeof expect;
	}) => Promise<void>,
	options?: ScenarioTestOptions
): Promise<void> {
	// Merge default and additional scenarios
	const allScenarios: Record<string, ScenarioTestDef> = {
		...defaultScenarios,
	};

	if (options?.customScenarios) {
		for (const scenario of options.customScenarios) {
			allScenarios[scenario.name] = scenario;
		}
	}

	// Determine which scenarios to run
	const scenarioNames = options?.scenarios || Object.keys(allScenarios);
	const scenariosToRun = scenarioNames.map((name) => {
		const scenario = allScenarios[name];
		if (!scenario) {
			throw new Error(
				`Scenario "${name}" not found. Available scenarios: ${Object.keys(allScenarios).join(", ")}`
			);
		}
		return scenario;
	});

	// Create initial Lix blob for all scenarios
	const initialLixBlob = await newLixFile({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: true,
				lixcol_version_id: "global",
			},
		],
	});

	const expectedValues = new Map<string, any>();

	test.each(scenariosToRun)(`${name} > $name`, async (scenario) => {
		let callIndex = 0;
		const isFirstScenario = scenario === scenariosToRun[0];

		const deterministicExpect = (actual: any, message?: string) => {
			const key = `expect-${callIndex++}`;

			if (isFirstScenario) {
				// Store expected values in first scenario
				expectedValues.set(key, actual);
			} else {
				// Verify values match first scenario in subsequent scenarios
				const expected = expectedValues.get(key);
				if (expected !== undefined) {
					const errorMessage = `
SCENARIO DETERMINISM VIOLATION

expectDeterministic() failed: Values differ between scenarios

Location: Call #${callIndex - 1}
Scenario: ${scenario.name} vs ${scenariosToRun[0]?.name || "baseline"}

Use expectDeterministic() for values that must be identical across scenarios.
Use regular expect() for scenario-specific assertions.

`;
					expect(actual, errorMessage).toEqual(expected);
				}
			}

			return expect(actual, message);
		};

		await fn({
			scenario: scenario.name,
			initialLix: initialLixBlob,
			expectDeterministic: deterministicExpect as typeof expect,
		});
	});
}
