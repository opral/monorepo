import { describe, expect, test } from "vitest";
import {
	simulationTest,
	type SimulationTestDef,
	normalSimulation,
} from "./simulation-test.js";
import { commit } from "../../state/vtable/commit.js";

test("simulation test discovery", () => {});

describe("expectDeterministic validates values across simulations", () => {
	const customSimulation: SimulationTestDef = {
		name: "custom",
		setup: async (lix) => lix,
	};

	simulationTest(
		"",
		async ({ expectDeterministic }) => {
			// These should be consistent across all simulations

			expect(() => {
				expectDeterministic("same-string").toBe("same-string");
				expectDeterministic(42).toBe(42);
				expectDeterministic({ foo: "bar" }).toEqual({ foo: "bar" });
				expectDeterministic([1, 2, 3]).toEqual([1, 2, 3]);
			}).not.toThrow();
		},
		{
			simulations: [normalSimulation, customSimulation],
		}
	);
});

describe("expectDeterministic catches simulation differences", () => {
	const customSimulation: SimulationTestDef = {
		name: "custom",
		setup: async (lix) => lix,
	};

	simulationTest(
		"",
		async ({ simulation, expectDeterministic }) => {
			// This will store different values in different simulations
			const simulationSpecificValue =
				simulation.name === "normal" ? "normal-value" : "other-value";

			if (simulation.name === "normal") {
				// This will fail in the second simulation
				expect(() =>
					expectDeterministic(simulationSpecificValue).toBe("normal-value")
				).not.toThrow();
			} else {
				expect(() =>
					expectDeterministic(simulationSpecificValue).toBe("normal-value")
				).toThrow(/SIMULATION DETERMINISM VIOLATION/);
			}
		},
		{
			simulations: [normalSimulation, customSimulation],
		}
	);
});

describe("deterministic state validation", () => {
	// Testing this with materialized state and the changes the lix has
	// Both need to be exactly the same for all simulations

	let previousState: any | null = null;
	let previousChanges: any | null = null;

	const mockSimulation: SimulationTestDef = {
		name: "mock-simulation",
		setup: async (lix) => lix,
	};

	simulationTest(
		"",
		async ({ openSimulatedLix }) => {
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true, bootstrap: true },
						lixcol_version_id: "global",
					},
				],
			});

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
			simulations: [normalSimulation, mockSimulation],
		}
	);
});

describe("database operations are deterministic", async () => {
	const mockSimulation: SimulationTestDef = {
		name: "mock-simulation",
		setup: async (lix) => lix,
	};

	simulationTest(
		"",
		async ({ expectDeterministic, openSimulatedLix }) => {
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
						lixcol_version_id: "global",
					},
				],
			});

			// Testing two types of entity views that exist:
			// 1. Regular entity view (on key_value table)
			// 2. File entity view (whish is a special case because it aggregates multiple entities into one)

			// regular entity view
			await lix.db
				.insertInto("key_value")
				.values({
					key: "test_key",
					value: "test_value",
				})
				.execute();

			// special entity view
			await lix.db
				.insertInto("file")
				.values({
					path: "/test.txt",
					data: new TextEncoder().encode("test content"),
				})
				.execute();

			// Get all tables and views from the database
			const tablesAndViews = lix
				.engine!.sqlite.exec({
					sql: `SELECT name FROM sqlite_master 
				WHERE type IN ('table', 'view') 
				AND name NOT LIKE 'sqlite_%'
				ORDER BY name`,
					returnValue: "resultRows",
				})
				.map((row) => row[0] as string);

			// Query each table/view and check determinism
			for (const tableName of tablesAndViews) {
				const data = lix.engine!.sqlite.exec({
					sql: `SELECT * FROM "${tableName}"`,
					returnValue: "resultRows",
					columnNames: [],
				});

				try {
					expectDeterministic(data).toBeDefined();
				} catch (error) {
					throw new Error(
						`Determinism check failed for table/view "${tableName}": ${error}`
					);
				}
			}
		},
		{
			simulations: [normalSimulation, mockSimulation],
		}
	);
});

describe("providing key values", async () => {
	simulationTest(
		"",
		async ({ openSimulatedLix }) => {
			const lix = await openSimulatedLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true, bootstrap: true },
						lixcol_version_id: "global",
					},
					{ key: "test_key_1", value: ["*"], lixcol_version_id: "global" },
				],
			});

			commit({ engine: lix.engine! });

			const logLevels = await lix.db
				.selectFrom("key_value")
				.where("key", "=", "test_key_1")
				.selectAll()
				.execute();

			expect(logLevels).toMatchObject([
				{
					key: "test_key_1",
					value: ["*"],
				},
			]);
		},
		{ simulations: [normalSimulation] }
	);
});

describe("expectDeterministic diff callback receives correct values", () => {
	// Use a global store that persists across test runs
	const globalStore = globalThis as any;
	if (!globalStore.__testCallback1) {
		globalStore.__testCallback1 = {};
	}

	// Reset before this test suite
	globalStore.__testCallback1 = {
		invoked: false,
		actual: undefined,
		expected: undefined,
	};

	const testSimulation: SimulationTestDef = {
		name: "test-diff-callback",
		setup: async (lix) => lix,
	};

	simulationTest(
		"",
		async ({ expectDeterministic, simulation }) => {
			const store = globalStore.__testCallback1;

			if (simulation.name === "normal") {
				// First simulation - set the expected value
				const testValue = { foo: "bar", count: 42 };
				expectDeterministic(testValue).toBeDefined();
			} else {
				// Second simulation - use different value to trigger callback and error
				const differentValue = { foo: "baz", count: 100 };
				try {
					expectDeterministic(differentValue, ({ actual, expected }) => {
						store.invoked = true;
						store.actual = actual;
						store.expected = expected;
					}).toBeDefined();
				} catch {
					// Expected to throw after callback
				}
			}
		},
		{
			simulations: [normalSimulation, testSimulation],
		}
	);

	test("callback was invoked with correct values", () => {
		const { invoked, actual, expected } = globalStore.__testCallback1;

		// Verify callback was invoked before the error
		expect(invoked).toBe(true);

		// Verify actual value matches what was passed in second simulation
		expect(actual).toEqual({ foo: "baz", count: 100 });

		// Verify expected value matches what was passed in first simulation
		expect(expected).toEqual({ foo: "bar", count: 42 });
	});
});

describe("expectDeterministic diff callback is not invoked when values match", () => {
	// Use a global store that persists across test runs
	const globalStore = globalThis as any;
	if (!globalStore.__testCallback2) {
		globalStore.__testCallback2 = {};
	}

	// Reset before this test suite
	globalStore.__testCallback2 = { invoked: false };

	const testSimulation: SimulationTestDef = {
		name: "test-no-diff",
		setup: async (lix) => lix,
	};

	simulationTest(
		"",
		async ({ expectDeterministic }) => {
			const store = globalStore.__testCallback2;
			const sameValue = { consistent: true, data: [1, 2, 3] };

			expectDeterministic(sameValue, () => {
				store.invoked = true;
			}).toBeDefined();
		},
		{
			simulations: [normalSimulation, testSimulation],
		}
	);

	test("callback should not be invoked", () => {
		expect(globalStore.__testCallback2.invoked).toBe(false);
	});
});

describe("skip option filters out specified simulations", () => {
	const globalStore = globalThis as any;
	if (!globalStore.__skipTest) {
		globalStore.__skipTest = {};
	}

	// Reset before this test suite
	globalStore.__skipTest = {
		normalRan: false,
		cacheMissRan: false,
		customRan: false,
	};

	const customSimulation: SimulationTestDef = {
		name: "custom-for-skip-test",
		setup: async (lix) => lix,
	};

	simulationTest(
		"",
		async ({ simulation }) => {
			const store = globalStore.__skipTest;

			// Track which simulations actually ran
			if (simulation.name === "normal") {
				store.normalRan = true;
			} else if (simulation.name === "cache-miss") {
				store.cacheMissRan = true;
			} else if (simulation.name === "custom-for-skip-test") {
				store.customRan = true;
			}
		},
		{
			simulations: [normalSimulation, customSimulation], // Skip cache-miss by not including it
		}
	);

	test("should run normal simulation", () => {
		expect(globalStore.__skipTest.normalRan).toBe(true);
	});

	test("should skip cache-miss simulation", () => {
		expect(globalStore.__skipTest.cacheMissRan).toBe(false);
	});

	test("should run custom simulation (not affected by skip)", () => {
		expect(globalStore.__skipTest.customRan).toBe(true);
	});
});

describe("skip option combined with onlyRun", () => {
	const globalStore = globalThis as any;
	if (!globalStore.__skipOnlyRunTest) {
		globalStore.__skipOnlyRunTest = {};
	}

	// Reset before this test suite
	globalStore.__skipOnlyRunTest = {
		normalRan: false,
		cacheMissRan: false,
	};

	simulationTest(
		"",
		async ({ simulation }) => {
			const store = globalStore.__skipOnlyRunTest;

			// Track which simulations actually ran
			if (simulation.name === "normal") {
				store.normalRan = true;
			} else if (simulation.name === "cache-miss") {
				store.cacheMissRan = true;
			}
		},
		{
			simulations: [normalSimulation], // Only run normal (equivalent to including both but skipping cache-miss)
		}
	);

	test("should run normal simulation (included and not skipped)", () => {
		expect(globalStore.__skipOnlyRunTest.normalRan).toBe(true);
	});

	test("should skip cache-miss simulation (included but then skipped)", () => {
		expect(globalStore.__skipOnlyRunTest.cacheMissRan).toBe(false);
	});
});
