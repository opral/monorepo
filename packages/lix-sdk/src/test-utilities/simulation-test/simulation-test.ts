import { test, expect } from "vitest";
import { type Lix } from "../../lix/open-lix.js";
import { newLixFile } from "../../lix/new-lix.js";
import { cacheMissSimulation } from "./cache-miss-simulation.js";

export type DstSimulation = {
	name: string;
	setup: (lix: Lix, baseline?: Lix) => Promise<Lix>;
};

/**
 * Normal simulation - Standard test execution without any modifications.
 */
const simulationUnderNormalConditions: DstSimulation = {
	name: "normal",
	setup: async (lix) => lix,
};

// Options for simulation tests
interface simulationTestOptions {
	simulations?: string[];
	customSimulations?: DstSimulation[];
}

// Default simulations available
const defaultSimulations: Record<string, DstSimulation> = {
	normal: simulationUnderNormalConditions,
	"cache-miss": cacheMissSimulation,
};

/**
 * Test utility that runs the same test in different simulations.
 *
 * @param name - Test name
 * @param fn - Test function that receives simulation context
 * @param options - Optional configuration:
 *   - simulations: Array of simulation names to run (defaults to all)
 *   - customSimulations: Custom simulation definitions to add
 *
 * @example
 * // Run default simulations (normal, cache-miss)
 * simulationTest("my test", async ({ initialLix, simulation, expectDeterministic }) => {
 *   const lix = await openLix({ blob: initialLix });
 *   // test code
 * });
 *
 * @example
 * // Run only specific simulations
 * simulationTest("my test", async ({ initialLix, simulation, expectDeterministic }) => {
 *   const lix = await openLix({ blob: initialLix });
 *   // test code
 * }, { simulations: ["cache-miss"] });
 *
 * @example
 * // Add custom simulations
 * simulationTest("my test", async ({ initialLix, simulation, expectDeterministic }) => {
 *   const lix = await openLix({ blob: initialLix });
 *   // test code
 * }, {
 *   simulations: ["normal", "my-simulation"],
 *   customSimulations: [mySimulation]
 * });
 */
export function simulationTest(
	name: string,
	fn: (args: {
		simulation: string;
		initialLix: Blob;
		expectDeterministic: typeof expect;
	}) => Promise<void>,
	options?: simulationTestOptions
): void {
	// Merge default and additional simulations
	const allSimulations: Record<string, DstSimulation> = {
		...defaultSimulations,
	};

	if (options?.customSimulations) {
		for (const simulation of options.customSimulations) {
			allSimulations[simulation.name] = simulation;
		}
	}

	// Determine which simulations to run
	const simulationNames = options?.simulations || Object.keys(allSimulations);
	const simulationsToRun = simulationNames.map((name) => {
		const simulation = allSimulations[name];
		if (!simulation) {
			throw new Error(
				`Simulation "${name}" not found. Available simulations: ${Object.keys(allSimulations).join(", ")}`
			);
		}
		return simulation;
	});

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
