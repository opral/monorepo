import { test, expect } from "vitest";
import { type Lix } from "../../lix/open-lix.js";
import { newLixFile } from "../../lix/new-lix.js";
import { cacheMissSimulation } from "./cache-miss-simulation.js";

export type SimulationTestDef = {
	name: string;
	setup: (lix: Lix, baseline?: Lix) => Promise<Lix>;
};

/**
 * Normal simulation - Standard test execution without any modifications.
 */
const simulationUnderNormalConditions: SimulationTestDef = {
	name: "normal",
	setup: async (lix) => lix,
};

/**
 * Options for configuring simulation tests
 */
type SimulationTestOptions = {
	/**
	 * Array of default simulation names to run.
	 * If not specified, all default simulations will be run.
	 * Available default simulations: "normal", "cache-miss"
	 */
	onlyRun?: (keyof typeof defaultSimulations)[];
	/**
	 * Additional custom simulations to run after the default ones.
	 * These simulations will always be run and don't need to be listed in onlyRun.
	 */
	additionalCustomSimulations?: SimulationTestDef[];
};

// Default simulations available
const defaultSimulations = {
	normal: simulationUnderNormalConditions as SimulationTestDef,
	"cache-miss": cacheMissSimulation as SimulationTestDef,
} as const;

/**
 * Test utility that runs the same test in different simulations.
 *
 * @param name - Test name
 * @param fn - Test function that receives simulation context
 * @param options - Optional configuration:
 *   - onlyRun: Array of default simulation names to run (defaults to all)
 *   - additionalCustomSimulations: Additional custom simulations to run after the default ones
 *
 * @example
 * // Run default simulations (normal, cache-miss)
 * simulationTest("my test", async ({ initialLix, simulation, expectDeterministic }) => {
 *   const lix = await openLix({ blob: initialLix });
 *   // test code
 * });
 *
 * @example
 * // Run only specific default simulations
 * simulationTest("my test", async ({ initialLix, simulation, expectDeterministic }) => {
 *   const lix = await openLix({ blob: initialLix });
 *   // test code
 * }, { onlyRun: ["cache-miss"] });
 *
 * @example
 * // Add custom simulations (run after default ones)
 * simulationTest("my test", async ({ initialLix, simulation, expectDeterministic }) => {
 *   const lix = await openLix({ blob: initialLix });
 *   // test code
 * }, {
 *   onlyRun: ["normal"],
 *   additionalCustomSimulations: [mySimulation]
 * });
 */
export function simulationTest(
	name: string,
	fn: (args: {
		simulation: string;
		initialLix: Blob;
		expectDeterministic: typeof expect;
	}) => Promise<void>,
	options?: SimulationTestOptions
): void {
	// Determine which simulations to run
	let simulationsToRun: SimulationTestDef[] = [];

	if (options?.onlyRun) {
		// Run only specified default simulations
		simulationsToRun = options.onlyRun.map((name) => {
			const simulation = defaultSimulations[name];
			if (!simulation) {
				throw new Error(
					`Simulation "${name}" not found. Available simulations: ${Object.keys(defaultSimulations).join(", ")}`
				);
			}
			return simulation;
		});
	} else {
		// Run all default simulations if onlyRun is not specified
		simulationsToRun = Object.values(defaultSimulations);
	}

	// Add custom simulations at the end
	if (options?.additionalCustomSimulations) {
		simulationsToRun.push(...options.additionalCustomSimulations);
	}

	// // Create initial Lix blob for all simulations
	const initialLixBlob = newLixFile({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: true,
				lixcol_version_id: "global",
			},
		],
	});

	// const initialLixBlob = {};

	const expectedValues = new Map<string, any>();

	test.each(simulationsToRun)(`${name} > $name`, async (simulation) => {
		let callIndex = 0;
		const isFirstSimulation = simulation === simulationsToRun[0];

		const deterministicExpect = (actual: any, message?: string) => {
			const key = `expect-${callIndex++}`;

			if (isFirstSimulation) {
				// Store expected values in first simulation
				expectedValues.set(key, actual);
			} else {
				// Verify values match first simulation in subsequent simulations
				const expected = expectedValues.get(key);
				if (expected !== undefined) {
					const errorMessage = `
SIMULATION DETERMINISM VIOLATION

expectDeterministic() failed: Values differ between simulations

Location: Call #${callIndex - 1}
Simulation: ${simulation.name} vs ${simulationsToRun[0]?.name || "normal"}

Use expectDeterministic() for values that must be identical across simulations.
Use regular expect() for simulation-specific assertions.

`;
					expect(actual, errorMessage).toEqual(expected);
				}
			}

			return expect(actual, message);
		};

		await fn({
			simulation: simulation.name,
			initialLix: await initialLixBlob,
			expectDeterministic: deterministicExpect as typeof expect,
		});
	});
}
