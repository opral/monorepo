import { test, expect, type Assertion } from "vitest";
import { type Lix, openLix } from "../../lix/open-lix.js";
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
	 * Array of default simulation names to skip.
	 * These simulations will be excluded from the test run.
	 * Applied after onlyRun filtering.
	 * Available default simulations: "normal", "cache-miss"
	 */
	skip?: (keyof typeof defaultSimulations)[];
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
 *   - skip: Array of default simulation names to skip (applied after onlyRun)
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
 * // Skip specific simulations
 * simulationTest("my test", async ({ initialLix, simulation, expectDeterministic }) => {
 *   const lix = await openLix({ blob: initialLix });
 *   // test code that doesn't work in cache miss mode
 * }, { skip: ["cache-miss"] });
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
/**
 * Enhanced expect function for simulation tests that verifies values are identical across simulations.
 *
 * @param actual - The value to test
 * @param diffCallback - Optional callback that receives both actual and expected values when they differ.
 *                       This is useful for debugging simulation differences by allowing you to inspect
 *                       and log detailed differences between simulation results before the test fails.
 *                       The callback is only invoked when values actually differ between simulations,
 *                       allowing you to leave debugging code in place without cluttering output when
 *                       tests are passing.
 * @returns Standard expect assertion object
 *
 * @example
 * expectDeterministic(cacheContents, ({ actual, expected }) => {
 *   console.log(`Cache has ${actual.length} vs ${expected.length} entries`);
 *   // Custom diff logic to help debug why simulations differ
 * });
 */
interface ExpectDeterministic {
	<T>(
		actual: T,
		diffCallback?: (args: { actual: T; expected: T }) => void
	): Assertion<T>;
}

export function simulationTest(
	name: string,
	fn: (args: {
		simulation: SimulationTestDef;
		openSimulatedLix: typeof openLix;
		expectDeterministic: ExpectDeterministic;
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

	// Filter out skipped simulations
	if (options?.skip) {
		const skipNames = new Set(options.skip);
		simulationsToRun = simulationsToRun.filter((simulation) => {
			// Find the name of this simulation in defaultSimulations
			const simulationName = Object.entries(defaultSimulations).find(
				([, sim]) => sim === simulation
			)?.[0];
			return !skipNames.has(simulationName as keyof typeof defaultSimulations);
		});
	}

	// Add custom simulations at the end
	if (options?.additionalCustomSimulations) {
		simulationsToRun.push(...options.additionalCustomSimulations);
	}

	// const initialLixBlob = {};

	const expectedValues = new Map<string, any>();

	test.each(simulationsToRun)(`${name} > $name`, async (simulation) => {
		let callIndex = 0;
		const isFirstSimulation = simulation === simulationsToRun[0];

		const deterministicExpect = (
			actual: any,
			diffCallback?: (args: { actual: any; expected: any }) => void
		) => {
			const key = `expect-${callIndex++}`;

			if (isFirstSimulation) {
				// Store expected values in first simulation
				expectedValues.set(key, actual);
			} else {
				// Verify values match first simulation in subsequent simulations
				const expected = expectedValues.get(key);
				if (expected !== undefined) {
					// Check if values differ before invoking callback
					let valuesMatch = false;
					try {
						expect(actual).toEqual(expected);
						valuesMatch = true;
					} catch {
						// Values don't match
					}

					// Only call diff callback if values actually differ
					if (!valuesMatch && diffCallback) {
						diffCallback({
							actual,
							expected,
						});
					}

					// Always perform the assertion (will throw if values differ)
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

			return expect(actual);
		};

		// Create openSimulatedLix function
		const openSimulatedLix = async (args: Parameters<typeof openLix>[0]) => {
			// Open lix with the provided arguments
			const lix = await openLix(args);

			// Apply simulation setup
			return await simulation.setup(lix);
		};

		await fn({
			simulation: simulation,
			openSimulatedLix,
			expectDeterministic: deterministicExpect as ExpectDeterministic,
		});
	});
}
