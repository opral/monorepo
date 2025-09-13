import { test, expect, type Assertion, vi } from "vitest";
import { type Lix, openLix } from "../../lix/open-lix.js";
import { cacheMissSimulation } from "./cache-miss-simulation.js";
import { outOfOrderSequenceSimulation } from "./out-of-order-sequence-simulation.js";
import { runtimeBoundarySimulation } from "./runtime-boundary-simulation.js";

export type SimulationTestDef = {
	name: string;
	setup: (lix: Lix, baseline?: Lix) => Promise<Lix>;
};

/**
 * Normal simulation - Standard test execution without any modifications.
 */
const normalSimulation: SimulationTestDef = {
	name: "normal",
	setup: async (lix) => lix,
};

/**
 * Options for configuring simulation tests
 */
type SimulationTestOptions = {
	/**
	 * Array of simulations to run. If not specified, runs default simulations (normal, cache-miss, runtime-boundary).
	 */
	simulations?: SimulationTestDef[];
};

// Default simulations available
export const defaultSimulations: SimulationTestDef[] = [
	normalSimulation,
	cacheMissSimulation,
	runtimeBoundarySimulation,
];

// Export individual simulations for custom use
export {
	runtimeBoundarySimulation,
	normalSimulation,
	cacheMissSimulation,
	outOfOrderSequenceSimulation,
};

/**
 * Test utility that runs the same test in different simulations.
 *
 * @param name - Test name
 * @param fn - Test function that receives simulation context
 * @param options - Optional configuration:
 *   - simulations: Array of simulations to run (defaults to normal + cache-miss)
 *
 * @example
 * // Run default simulations (normal, cache-miss)
 * simulationTest("my test", async ({ openSimulatedLix, expectDeterministic }) => {
 *   const lix = await openSimulatedLix({});
 *   // test code - expectDeterministic ensures values match across simulations
 * });
 *
 * @example
 * // Run only normal simulation
 * simulationTest("my test", async ({ openSimulatedLix, expectDeterministic }) => {
 *   const lix = await openSimulatedLix({});
 *   // test code
 * }, { simulations: [normalSimulation] });
 *
 * @example
 * // Run custom simulations including out-of-order
 * simulationTest("my test", async ({ openSimulatedLix, expectDeterministic }) => {
 *   const lix = await openSimulatedLix({});
 *   // test code - but be careful with expectDeterministic if using out-of-order!
 * }, { simulations: [cacheMissSimulation, outOfOrderSequenceSimulation] });
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
	// Use provided simulations or default ones
	const simulationsToRun = options?.simulations || defaultSimulations;

	const expectedValues = new Map<string, any>();

	test.each(simulationsToRun)(`${name} > $name`, async (simulation) => {
		vi.restoreAllMocks();

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
		vi.restoreAllMocks(); // Restore original implementations, not just reset
	});
}
