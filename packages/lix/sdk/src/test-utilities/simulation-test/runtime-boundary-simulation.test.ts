import { describe, expect } from "vitest";
import { simulationTest } from "./simulation-test.js";
import { runtimeBoundarySimulation } from "./runtime-boundary-simulation.js";

describe("runtime boundary", () => {
	simulationTest(
		"runtime is undefined across the boundary",
		async ({ openSimulatedLix }) => {
			const lix = await openSimulatedLix({});
			expect(lix.runtime).toBeUndefined();
		},
		{ simulations: [runtimeBoundarySimulation] }
	);
});
