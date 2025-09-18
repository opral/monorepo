import { describe, expect } from "vitest";
import { simulationTest } from "./simulation-test.js";
import { engineBoundarySimulation } from "./engine-boundary-simulation.js";

describe("engine boundary", () => {
	simulationTest(
		"engine is undefined across the boundary",
		async ({ openSimulatedLix }) => {
			const lix = await openSimulatedLix({});
			expect(lix.engine).toBeUndefined();
		},
		{ simulations: [engineBoundarySimulation] }
	);
});
